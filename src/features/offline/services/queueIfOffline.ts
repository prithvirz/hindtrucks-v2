// ─── queueIfOffline Helper ───
// Intercepts write operations when offline: queues them in IndexedDB,
// applies optimistic UI updates, and handles rollback on conflict.

import type { OfflineActionType, OfflineAction } from '../types';
import { enqueue } from './syncQueue';

export interface QueueIfOfflineParams {
    /** Whether the app is currently online */
    isOnline: boolean;
    /** Action type for dispatch */
    type: OfflineActionType;
    /** API endpoint for replay (used as metadata) */
    endpoint: string;
    /** HTTP method */
    method: OfflineAction['method'];
    /** Request payload */
    payload: unknown;
    /** Called to apply optimistic UI update immediately */
    optimisticUpdate: () => void;
    /** Called to revert optimistic UI update on IndexedDB failure or conflict */
    rollbackUpdate: () => void;
    /** Optional conflict handler name for resolution */
    onConflict?: string;
    /** Optional headers */
    headers?: Record<string, string>;
    /** Max retry attempts (default 5) */
    maxAttempts?: number;
}

/**
 * If online, returns false (caller should proceed with real service call).
 * If offline, queues the action + applies optimistic update. Returns true
 * to signal the caller should NOT make the real service call.
 */
export async function queueIfOffline(params: QueueIfOfflineParams): Promise<boolean> {
    const {
        isOnline,
        type,
        endpoint,
        method,
        payload,
        optimisticUpdate,
        rollbackUpdate,
        onConflict,
        headers,
        maxAttempts,
    } = params;

    // Online path: tell caller to proceed with real service call
    if (isOnline) return false;

    // Offline path: apply optimistic state, then persist to queue
    optimisticUpdate();

    try {
        await enqueue({
            type,
            endpoint,
            method,
            payload,
            headers,
            maxAttempts,
            onConflict,
            optimisticState: null, // caller handles state via callbacks
        });
    } catch {
        // IndexedDB write failed — rollback optimistic change
        rollbackUpdate();
    }

    return true;
}