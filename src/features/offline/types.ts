// ─── Offline Feature: TypeScript Interfaces ───

export type OfflineActionType =
    | 'accept_load'
    | 'advance_trip'
    | 'report_location'
    | 'withdraw_earnings'
    | 'update_profile'
    | 'update_truck'
    | 'set_online_status'
    | 'create_profile'
    | 'send_message'
    | 'complete_trip';

export interface OfflineAction {
    id: string;
    type: OfflineActionType;
    payload: unknown;
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    createdAt: number;
    attempts: number;
    maxAttempts: number;
    lastAttemptAt: number | null;
    status: 'pending' | 'syncing' | 'failed' | 'conflict';
    error?: string;
    conflictData?: unknown;
    headers?: Record<string, string>;
    /** Serialized state snapshot for rollback on conflict */
    optimisticState?: unknown;
    /** Callback name for conflict resolution */
    onConflict?: string;
}

/** Input shape for enqueuing a new action (before id/timestamps assigned) */
export interface QueuedAction {
    type: OfflineActionType;
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    payload: unknown;
    headers?: Record<string, string>;
    maxAttempts?: number;
    optimisticState?: unknown;
    onConflict?: string;
}

/** Current synchronization state of the queue */
export type SyncStatus = 'idle' | 'syncing' | 'error';

/** Result of attempting to resolve a conflicting action */
export interface ConflictResult {
    actionId: string;
    actionType: OfflineActionType;
    serverState?: unknown;
    resolution: 'keep_local' | 'accept_server' | 'manual';
}

export interface CachedResponse {
    key: string;
    endpoint: string;
    data: unknown;
    cachedAt: number;
    ttl: number;
    headers: Record<string, string>;
}

export interface SyncResult {
    succeeded: number;
    failed: OfflineAction[];
    conflicts: OfflineAction[];
}

export interface OfflineState {
    isOnline: boolean;
    pendingActions: number;
    lastSyncAt: number | null;
    syncStatus: SyncStatus;
    wasOffline: boolean;
}