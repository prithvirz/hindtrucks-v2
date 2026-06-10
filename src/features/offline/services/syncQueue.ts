// ─── Offline Sync Queue Engine ───
// IndexedDB persistence, exponential backoff retry, drain logic.
// Callers supply a dispatch function so replay is service-aware.

import type { OfflineAction, SyncResult, SyncStatus, QueuedAction } from '../types';
import {
    addOfflineAction,
    getPendingActions,
    updateOfflineAction,
    removeOfflineAction,
    getPendingActionCount as dbPendingCount,
} from './offlineStorage';

// ─── Exponential Backoff ───

export function exponentialBackoff(attempt: number): number {
    // 1s, 2s, 4s, 8s, 16s (capped at 30s)
    return Math.min(1000 * Math.pow(2, attempt - 1), 30_000);
}

// ─── Action Dispatcher Signature ───

export type ActionDispatcher = (
    action: OfflineAction,
) => Promise<{ success: boolean; status?: number; data?: unknown }>;

// ─── ID Generation ───

function generateId(type: string): string {
    return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Enqueue ───

export async function enqueue(action: QueuedAction): Promise<OfflineAction> {
    const fullAction: OfflineAction = {
        id: generateId(action.type),
        type: action.type,
        endpoint: action.endpoint,
        method: action.method,
        payload: action.payload,
        headers: action.headers,
        createdAt: Date.now(),
        attempts: 0,
        maxAttempts: action.maxAttempts ?? 5,
        lastAttemptAt: null,
        status: 'pending',
        optimisticState: action.optimisticState,
        onConflict: action.onConflict,
    };
    await addOfflineAction(fullAction);
    return fullAction;
}

// ─── Pending Count ───

export async function getPendingCount(): Promise<number> {
    return dbPendingCount();
}

// ─── Drain / Flush Queue ───

export interface DrainOptions {
    /** Called before each action replay to check if we should abort (e.g. went offline again) */
    shouldAbort?: () => boolean;
    /** Called when a single action succeeds */
    onActionSucceeded?: (action: OfflineAction) => void;
    /** Called when an action reaches max attempts */
    onActionFailed?: (action: OfflineAction, error: string) => void;
    /** Called when a 409 conflict is detected */
    onConflict?: (action: OfflineAction) => void;
}

export async function drainQueue(
    dispatch: ActionDispatcher,
    options: DrainOptions = {},
): Promise<SyncResult> {
    const result: SyncResult = { succeeded: 0, failed: [], conflicts: [] };

    const actions = await getPendingActions();
    actions.sort((a, b) => a.createdAt - b.createdAt);

    for (const action of actions) {
        if (options.shouldAbort?.()) break;

        try {
            await updateOfflineAction(action.id, {
                status: 'syncing',
                lastAttemptAt: Date.now(),
            });

            const response = await dispatch(action);

            if (response.success) {
                await removeOfflineAction(action.id);
                result.succeeded++;
                options.onActionSucceeded?.(action);
            } else if (response.status === 409) {
                await updateOfflineAction(action.id, {
                    status: 'conflict',
                    conflictData: response.data,
                });
                const conflicted = { ...action, status: 'conflict' as const, conflictData: response.data };
                result.conflicts.push(conflicted);
                options.onConflict?.(conflicted);
            } else {
                throw new Error(`Dispatch returned status ${response.status}`);
            }
        } catch (err) {
            const newAttempts = action.attempts + 1;
            if (newAttempts >= action.maxAttempts) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown dispatch error';
                await updateOfflineAction(action.id, {
                    status: 'failed',
                    attempts: newAttempts,
                    lastAttemptAt: Date.now(),
                    error: errorMsg,
                });
                const failed = { ...action, status: 'failed' as const, attempts: newAttempts, error: errorMsg };
                result.failed.push(failed);
                options.onActionFailed?.(failed, errorMsg);
            } else {
                await updateOfflineAction(action.id, {
                    status: 'pending',
                    attempts: newAttempts,
                    lastAttemptAt: Date.now(),
                });
                // Exponential backoff before next action
                await new Promise((r) => setTimeout(r, exponentialBackoff(newAttempts)));
            }
        }
    }

    return result;
}

// ─── Sync Orchestrator (debounced flush wrapper) ───

export interface SyncController {
    syncStatus: SyncStatus;
    pendingCount: number;
    /** Trigger a drain. No-ops if already syncing. */
    triggerSync: () => Promise<SyncResult>;
}

export function createSyncController(
    dispatch: ActionDispatcher,
    onStatusChange: (status: SyncStatus) => void,
): SyncController {
    let syncStatus: SyncStatus = 'idle';
    let pendingCount = 0;

    const refreshPendingCount = async () => {
        pendingCount = await getPendingCount();
    };

    const triggerSync = async (): Promise<SyncResult> => {
        if (syncStatus === 'syncing') return { succeeded: 0, failed: [], conflicts: [] };
        syncStatus = 'syncing';
        onStatusChange('syncing');

        try {
            const result = await drainQueue(dispatch);
            syncStatus = 'idle';
            onStatusChange('idle');
            await refreshPendingCount();
            return result;
        } catch {
            syncStatus = 'error';
            onStatusChange('error');
            await refreshPendingCount();
            return { succeeded: 0, failed: [], conflicts: [] };
        }
    };

    // Initial count
    refreshPendingCount().catch(() => { });

    return {
        get syncStatus() { return syncStatus; },
        get pendingCount() { return pendingCount; },
        triggerSync,
    };
}