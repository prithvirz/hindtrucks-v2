import { useState, useCallback, useEffect } from 'react';
import type { OfflineAction, SyncResult } from '../types';
import {
    addOfflineAction,
    getPendingActions,
    updateOfflineAction,
    removeOfflineAction,
    getPendingActionCount,
} from '../services/offlineStorage';
import { request } from '../../../services/apiClient';

interface UseOfflineQueueReturn {
    pendingActions: OfflineAction[];
    pendingCount: number;
    addToQueue: (action: Omit<OfflineAction, 'id' | 'createdAt' | 'attempts' | 'maxAttempts' | 'lastAttemptAt' | 'status'>) => Promise<void>;
    flushQueue: () => Promise<SyncResult>;
    removeAction: (id: string) => Promise<void>;
    retryAction: (id: string) => Promise<void>;
    syncStatus: 'idle' | 'syncing' | 'error';
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useOfflineQueue(): UseOfflineQueueReturn {
    const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
    const [pendingCount, setPendingCount] = useState<number>(0);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

    const refreshPending = useCallback(async () => {
        try {
            const actions = await getPendingActions();
            setPendingActions(actions);
            const count = await getPendingActionCount();
            setPendingCount(count);
        } catch {
            // IndexedDB may not be available (e.g., SSR test environment)
        }
    }, []);

    useEffect(() => {
        refreshPending();
    }, [refreshPending]);

    const addToQueue = useCallback(async (
        action: Omit<OfflineAction, 'id' | 'createdAt' | 'attempts' | 'maxAttempts' | 'lastAttemptAt' | 'status'>
    ): Promise<void> => {
        const fullAction: OfflineAction = {
            ...action,
            id: generateId(),
            createdAt: Date.now(),
            attempts: 0,
            maxAttempts: 3,
            lastAttemptAt: null,
            status: 'pending',
        };
        await addOfflineAction(fullAction);
        await refreshPending();
    }, [refreshPending]);

    const flushQueue = useCallback(async (): Promise<SyncResult> => {
        setSyncStatus('syncing');
        const result: SyncResult = { succeeded: 0, failed: [], conflicts: [] };

        try {
            const actions = await getPendingActions();
            actions.sort((a, b) => a.createdAt - b.createdAt);

            for (const action of actions) {
                try {
                    await updateOfflineAction(action.id, { status: 'syncing', lastAttemptAt: Date.now() });

                    const response = await request({
                        method: action.method,
                        path: action.endpoint,
                        body: action.payload as Record<string, unknown>,
                        headers: action.headers,
                    });

                    if (response.status >= 200 && response.status < 300) {
                        await removeOfflineAction(action.id);
                        result.succeeded++;
                    } else if (response.status === 409) {
                        await updateOfflineAction(action.id, {
                            status: 'conflict',
                            conflictData: response.data,
                        });
                        result.conflicts.push({ ...action, status: 'conflict' });
                    } else {
                        throw new Error(`HTTP ${response.status}`);
                    }
                } catch {
                    const newAttempts = action.attempts + 1;
                    if (newAttempts >= action.maxAttempts) {
                        await updateOfflineAction(action.id, {
                            status: 'failed',
                            attempts: newAttempts,
                            lastAttemptAt: Date.now(),
                            error: 'Max retry attempts reached',
                        });
                        result.failed.push({ ...action, status: 'failed', attempts: newAttempts });
                    } else {
                        await updateOfflineAction(action.id, {
                            status: 'pending',
                            attempts: newAttempts,
                            lastAttemptAt: Date.now(),
                        });
                    }
                }
            }

            setSyncStatus('idle');
        } catch {
            setSyncStatus('error');
        }

        await refreshPending();
        return result;
    }, [refreshPending]);

    const removeActionFn = useCallback(async (id: string): Promise<void> => {
        await removeOfflineAction(id);
        await refreshPending();
    }, [refreshPending]);

    const retryAction = useCallback(async (id: string): Promise<void> => {
        const actions = await getPendingActions();
        const action = actions.find((a) => a.id === id);
        if (!action) return;

        await updateOfflineAction(action.id, { status: 'pending', attempts: 0 });
        await refreshPending();
        await flushQueue();
    }, [refreshPending, flushQueue]);

    return {
        pendingActions,
        pendingCount,
        addToQueue,
        flushQueue,
        removeAction: removeActionFn,
        retryAction,
        syncStatus,
    };
}