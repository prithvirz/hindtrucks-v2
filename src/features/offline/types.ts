// ─── Offline Feature: TypeScript Interfaces ───

export interface OfflineAction {
    id: string;
    type: 'accept_load' | 'advance_trip' | 'report_location' | 'withdraw_earnings' | 'update_profile' | 'update_truck';
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
    syncStatus: 'idle' | 'syncing' | 'error';
    wasOffline: boolean;
}