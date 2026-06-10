# Offline Action Queue Design

**Status:** Draft  
**Date:** 2026-06-10  
**Goal:** Queue write operations when offline, auto-sync when connectivity returns, with optimistic UI and conflict resolution.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Current State Assessment](#2-current-state-assessment)
3. [Enhanced `useOfflineQueue` Hook](#3-enhanced-useofflinequeue-hook)
4. [How to Intercept Service Calls When Offline](#4-how-to-intercept-service-calls-when-offline)
5. [IndexedDB Schema for the Queue](#5-indexeddb-schema-for-the-queue)
6. [Sync Replay Algorithm](#6-sync-replay-algorithm)
7. [Conflict Resolution Strategy](#7-conflict-resolution-strategy)
8. [Optimistic UI Update Pattern](#8-optimistic-ui-update-pattern)
9. [Changes Needed Per Context Provider](#9-changes-needed-per-context-provider)
10. [UI Changes](#10-ui-changes)
11. [Implementation Checklist](#11-implementation-checklist)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        AppProviders                           │
│  Theme > Auth > Shell > Profile > Trip > Earnings > Chat     │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  ShellContext (Central Sync Orchestrator)                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ useOnlineStatus() → { isOnline, wasOffline }            │ │
│  │ useOfflineQueue() → { addToQueue, flushQueue,           │ │
│  │                       pendingCount, syncStatus }        │ │
│  │                                                         │ │
│  │ useEffect: wasOffline && isOnline → flushQueue()        │ │
│  │ useEffect: expose pendingCount to OfflineIndicator       │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ProfileContext        TripContext        EarningsContext
   ┌─────────────┐   ┌──────────────┐   ┌──────────────┐
   │ setOnline() │   │ acceptLoad() │   │ withdraw()   │
   │ update...() │   │ advanceTrip()│   │              │
   │             │   │              │   │              │
   │ if offline: │   │ if offline:  │   │ if offline:  │
   │  queue +    │   │  queue +     │   │  queue +     │
   │  optimistic │   │  optimistic  │   │  optimistic  │
   └──────┬──────┘   └──────┬───────┘   └──────┬───────┘
          │                  │                   │
          └──────────────────┼───────────────────┘
                             ▼
              ┌──────────────────────────┐
              │   offlineStorage.ts       │
              │   IndexedDB               │
              │   ┌────────────────────┐  │
              │   │ offline_actions    │  │
              │   │ (keyPath: 'id')    │  │
              │   │ indexes:           │  │
              │   │  - by-status       │  │
              │   │  - by-created      │  │
              │   └────────────────────┘  │
              └──────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Central sync in ShellContext | Single `wasOffline→isOnline` listener avoids duplicate flushes across contexts |
| Queue at context level, not service level | Each context owns its optimistic state update; services stay pure |
| Use existing `offlineStorage.ts` | Already has `offline_actions` store with proper indexes; DB version upgrade not needed |
| Expand `OfflineAction.type` union | Current types cover most needs; add `set_online_status`, `create_profile`, `send_message` |
| Auth actions NOT queued | `sendOtp`/`verifyOtp` require real-time server interaction; gated by `ConnectionGate` |

---

## 2. Current State Assessment

### 2.1 What Already Works

| Component | File | Status |
|-----------|------|--------|
| `useOnlineStatus` | [`src/features/offline/hooks/useOnlineStatus.ts`](src/features/offline/hooks/useOnlineStatus.ts) | ✅ Tracks `isOnline`, `wasOffline`, timestamps |
| `offlineStorage` | [`src/features/offline/services/offlineStorage.ts`](src/features/offline/services/offlineStorage.ts) | ✅ Full IndexedDB CRUD for `offline_actions`, `cached_responses`, `user_preferences` |
| `useOfflineQueue` | [`src/features/offline/hooks/useOfflineQueue.ts`](src/features/offline/hooks/useOfflineQueue.ts) | ✅ `addToQueue`, `flushQueue`, `removeAction`, `retryAction`, `syncStatus` |
| `OfflineIndicator` | [`src/features/offline/components/OfflineIndicator.tsx`](src/features/offline/components/OfflineIndicator.tsx) | ✅ Banner when offline |
| `ConnectionGate` | [`src/features/offline/components/ConnectionGate.tsx`](src/features/offline/components/ConnectionGate.tsx) | ✅ Gates content on online status |
| `OfflineAction` types | [`src/features/offline/types.ts`](src/features/offline/types.ts) | ✅ Type definitions for queue items |
| `ShellContext.offlineQueueSize` | [`src/state/ShellContext.tsx`](src/state/ShellContext.tsx:57) | ✅ State slot exists, not wired |
| TripContext location tracking | [`src/state/TripContext.tsx`](src/state/TripContext.tsx:71-97) | ✅ Already uses `addOfflineAction` for GPS fixes |

### 2.2 What's Missing

| Gap | Impact |
|-----|--------|
| No context calls `useOfflineQueue` | Queue exists but never populated for write actions |
| ShellContext doesn't flush on reconnect | `wasOffline` transition ignored |
| No offline check in `setOnline`, `withdrawWallet`, `acceptLoad`, `advanceTrip` | Actions fail silently when offline |
| `OfflineAction.type` doesn't include `set_online_status`, `create_profile`, `send_message` | Type union incomplete for new operations |
| `OfflineIndicator` doesn't show queue count | User unaware of pending actions |
| `useOfflineQueue.flushQueue` uses generic `request()` not service-specific methods | Replay doesn't use service layer |
| No retry with backoff | `flushQueue` retries immediately in loop |
| No conflict resolution callback | Conflicts are stored but never surfaced to user |

---

## 3. Enhanced `useOfflineQueue` Hook

### 3.1 Location

File: [`src/features/offline/hooks/useOfflineQueue.ts`](src/features/offline/hooks/useOfflineQueue.ts) — modify existing file.

### 3.2 Changes Required

**A. Add `type` union expansion** (in [`src/features/offline/types.ts`](src/features/offline/types.ts:5)):

```typescript
// Current:
type: 'accept_load' | 'advance_trip' | 'report_location' | 'withdraw_earnings' | 'update_profile' | 'update_truck';

// New:
type: 'accept_load' | 'advance_trip' | 'report_location' | 'withdraw_earnings' 
    | 'update_profile' | 'update_truck' | 'set_online_status' | 'create_profile'
    | 'send_message' | 'complete_trip';
```

**B. Add `optimisticState` and `onConflict`** to `OfflineAction`:

```typescript
export interface OfflineAction {
    // ... existing fields ...
    /** Optional: serialized state snapshot for rollback on conflict */
    optimisticState?: unknown;
    /** Optional: callback name for conflict resolution */
    onConflict?: string;
}
```

**C. Add `onConflict` callback and `syncQueue`** to return type:

```typescript
interface UseOfflineQueueReturn {
    // ... existing ...
    /** Called by contexts to register their conflict handlers */
    registerConflictHandler: (type: string, handler: (action: OfflineAction) => void) => void;
    /** Triggered by ShellContext on wasOffline→isOnline transition */
    syncQueue: () => Promise<void>;
}
```

**D. Replace `request()` with service-specific dispatch** in `flushQueue`:

Instead of calling `request()` generically, `flushQueue` will use a dispatch table keyed by `action.type` that calls the appropriate service method. This is wired up via a `ServiceDispatcher` interface.

**E. Add exponential backoff** between retries:

```typescript
// In flushQueue, after a failed action:
const delay = Math.min(1000 * Math.pow(2, action.attempts), 30000);
await new Promise(r => setTimeout(r, delay));
```

**F. Add `syncQueue`** that debounces and calls `flushQueue`:

```typescript
const syncQueue = useCallback(async () => {
    if (syncStatus === 'syncing') return;
    setSyncStatus('syncing');
    try {
        const result = await flushQueue();
        // Notify contexts of conflicts
        for (const conflict of result.conflicts) {
            const handler = conflictHandlers.current.get(conflict.type);
            if (handler) handler(conflict);
        }
    } finally {
        setSyncStatus('idle');
    }
}, [flushQueue, syncStatus]);
```

---

## 4. How to Intercept Service Calls When Offline

### 4.1 Pattern: `queueIfOffline` wrapper

Each context provider will use a helper function that:

1. Checks `isOnline` (from ShellContext)
2. If online: calls the service directly (existing behavior)
3. If offline: queues the action in IndexedDB + updates state optimistically

```typescript
// New file: src/features/offline/services/queueIfOffline.ts
import { addOfflineAction } from './offlineStorage';
import type { OfflineAction } from '../types';

interface QueueIfOfflineParams {
    isOnline: boolean;
    type: OfflineAction['type'];
    endpoint: string;
    method: OfflineAction['method'];
    payload: unknown;
    optimisticUpdate: () => void;
    rollbackUpdate: () => void;
    onConflict?: string;
}

export async function queueIfOffline(params: QueueIfOfflineParams): Promise<void> {
    const { isOnline, type, endpoint, method, payload, optimisticUpdate, rollbackUpdate, onConflict } = params;
    
    if (isOnline) {
        // Online path: caller handles service call, this is a no-op
        return;
    }
    
    // Offline path: queue + optimistic UI
    optimisticUpdate();
    
    const action: OfflineAction = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        endpoint,
        method,
        payload,
        createdAt: Date.now(),
        attempts: 0,
        maxAttempts: 5,
        lastAttemptAt: null,
        status: 'pending',
        onConflict,
    };
    
    await addOfflineAction(action).catch(() => {
        // If IndexedDB fails, rollback optimistic update
        rollbackUpdate();
    });
}
```

### 4.2 Usage in Contexts

Each write operation follows this pattern:

```typescript
// Example: setOnline in ProfileContext
const setOnline = async (v: boolean) => {
    setError(null);
    
    if (!isOnline) {
        // Queue for later + optimistic update
        await queueIfOffline({
            isOnline,
            type: 'set_online_status',
            endpoint: '/driver/profile/online',
            method: 'POST',
            payload: { isOnline: v },
            optimisticUpdate: () => setOnlineState(v),
            rollbackUpdate: () => setOnlineState(!v),
        });
        return;
    }
    
    // Online path (existing behavior)
    setOnlineState(v);
    import('../services/index')
        .then(({ profileService }) => profileService.setOnlineStatus({ isOnline: v }))
        .catch((err) => {
            if (err instanceof ApiError) setError(err);
            setOnlineState(!v); // Revert on failure
        });
};
```

### 4.3 Auth Exclusion

Auth operations (`sendOtp`, `verifyOtp`) are NOT queued. The `Login` and `Otp` screens are already wrapped in `ConnectionGate` (or should be). If offline, the user sees `OfflineFallback` and cannot proceed.

---

## 5. IndexedDB Schema for the Queue

### 5.1 Current Schema (No Changes Needed)

The existing schema in [`src/features/offline/services/offlineStorage.ts`](src/features/offline/services/offlineStorage.ts:26-27) already supports the queue:

```typescript
const DB_NAME = 'hindtrucks_offline';
const DB_VERSION = 1;
```

**`offline_actions` store:**
| Field | Type | Index | Description |
|-------|------|-------|-------------|
| `id` | `string` (PK) | — | Unique action ID: `{type}-{timestamp}-{random}` |
| `type` | `string` | — | One of the `OfflineAction.type` union |
| `payload` | `unknown` | — | Serialized request body |
| `endpoint` | `string` | — | API path for replay |
| `method` | `'POST' \| 'PUT' \| 'PATCH' \| 'DELETE'` | — | HTTP method |
| `createdAt` | `number` | `by-created` | `Date.now()` timestamp |
| `attempts` | `number` | — | Retry count |
| `maxAttempts` | `number` | — | Max retries (default 5) |
| `lastAttemptAt` | `number \| null` | — | Last retry timestamp |
| `status` | `'pending' \| 'syncing' \| 'failed' \| 'conflict'` | `by-status` | Current state |
| `error` | `string?` | — | Error message if failed |
| `conflictData` | `unknown?` | — | Server response on conflict |
| `headers` | `Record<string,string>?` | — | Custom headers |
| `optimisticState` | `unknown?` | — | **NEW**: pre-action state for rollback |
| `onConflict` | `string?` | — | **NEW**: conflict handler name |

**No DB version bump needed** — the `idb` library with `put` handles new optional fields on existing stores automatically.

### 5.2 Action Type → Endpoint Mapping

| `type` | `endpoint` | `method` | `payload` |
|--------|-----------|----------|-----------|
| `set_online_status` | `/driver/profile/online` | `POST` | `{ isOnline: boolean }` |
| `update_profile` | `/driver/profile` | `PATCH` | `Partial<DriverWithExtras>` |
| `update_truck` | `/driver/trucks` | `PUT` | `{ truckId, ...truckFields }` |
| `create_profile` | `/driver/profile` | `POST` | `{ name, phone }` |
| `accept_load` | `/loads/{loadId}/accept` | `POST` | `{ loadId }` |
| `advance_trip` | `/trips/advance` | `POST` | `{ currentStep }` |
| `complete_trip` | `/trips/complete` | `POST` | `{ loadId }` |
| `withdraw_earnings` | `/earnings/withdraw` | `POST` | `{ amount, upiId }` |
| `report_location` | `/driver/trips/{loadId}/location` | `POST` | `{ lat, lng, ... }` |
| `send_message` | `/chat/message` | `POST` | `{ message, conversationId }` |

---

## 6. Sync Replay Algorithm

### 6.1 Trigger

In [`src/state/ShellContext.tsx`](src/state/ShellContext.tsx:56), when `wasOffline` transitions to `true` AND `isOnline` is `true`:

```typescript
useEffect(() => {
    if (wasOffline && isOnline) {
        syncQueue();
    }
}, [wasOffline, isOnline, syncQueue]);
```

### 6.2 Algorithm

```
function syncQueue():
    if syncStatus == 'syncing': return          // Guard against concurrent syncs
    
    setSyncStatus('syncing')
    actions = getPendingActions()               // IndexedDB: by-status='pending'
    actions.sort(by createdAt ASC)              // FIFO order
    
    for each action in actions:
        updateActionStatus(action.id, 'syncing')
        
        try:
            result = dispatchToService(action)   // Call actual service method
            if result.success:
                deleteAction(action.id)          // Remove from IndexedDB
                succeeded++
            else if result.status == 409:
                updateActionStatus(action.id, 'conflict', conflictData=result.data)
                callConflictHandler(action.type, action)
                conflicts++
            else:
                throw new Error(result.message)
        
        catch error:
            newAttempts = action.attempts + 1
            if newAttempts >= action.maxAttempts:
                updateActionStatus(action.id, 'failed', attempts=newAttempts, error=error.message)
                failed++
            else:
                updateActionStatus(action.id, 'pending', attempts=newAttempts)
                await delay(exponentialBackoff(newAttempts))   // Wait before next action
    
    setSyncStatus('idle')
    showNotification('Sync complete', `${succeeded} actions synced`)
    if conflicts > 0: showNotification('Conflicts', `${conflicts} actions need review`)
    
    return { succeeded, failed, conflicts }
```

### 6.3 Service Dispatch Table

Instead of `request()` (generic HTTP), `flushQueue` dispatches to the actual service layer:

```typescript
// New file: src/features/offline/services/actionDispatcher.ts
import { loadsService } from '../../../services/index';
import { tripService } from '../../../services/index';
import { earningsService } from '../../../services/index';
import { profileService } from '../../../services/index';
import type { OfflineAction } from '../types';

export async function dispatchAction(action: OfflineAction): Promise<{ success: boolean; status?: number; data?: unknown }> {
    switch (action.type) {
        case 'set_online_status':
            return profileService.setOnlineStatus(action.payload as { isOnline: boolean })
                .then(r => ({ success: true, data: r }));
        
        case 'accept_load':
            return loadsService.acceptLoad(action.payload as { loadId: string })
                .then(r => ({ success: true, data: r }));
        
        case 'advance_trip':
            return tripService.advanceStep(action.payload as { currentStep: number })
                .then(r => ({ success: true, data: r }));
        
        case 'complete_trip':
            return tripService.completeTrip(action.payload as { loadId: string })
                .then(r => ({ success: true, data: r }));
        
        case 'withdraw_earnings':
            return earningsService.withdraw(action.payload as { amount: number; upiId: string })
                .then(r => ({ success: true, data: r }));
        
        case 'create_profile':
            return profileService.createDriverProfile(action.payload as { name: string; phone: string })
                .then(r => ({ success: true, data: r }));
        
        case 'update_profile':
        case 'update_truck':
        case 'report_location':
        case 'send_message':
            // These may use generic request() for now, or be added to service interfaces
            return { success: true }; // Placeholder — implement per service
        
        default:
            throw new Error(`Unknown action type: ${action.type}`);
    }
}
```

### 6.4 Exponential Backoff

```typescript
function exponentialBackoff(attempt: number): number {
    // 1s, 2s, 4s, 8s, 16s (capped at 30s)
    return Math.min(1000 * Math.pow(2, attempt - 1), 30000);
}
```

---

## 7. Conflict Resolution Strategy

### 7.1 Conflict Types

| Conflict | HTTP Status | Scenario | Resolution |
|----------|-------------|----------|------------|
| Load already taken | 409 | `acceptLoad`: another driver accepted first | Remove action, notify user, refresh loads |
| Trip already completed | 409 | `advanceTrip`/`completeTrip`: trip already ended | Remove action, sync server state |
| Withdrawal rejected | 409 | `withdraw_earnings`: insufficient balance | Remove action, revert optimistic debit, notify |
| Profile stale | 409 | `update_profile`: concurrent modification | Remove action, refresh profile from server |
| Set online status | 409 | `set_online_status`: session expired | Remove action, force re-auth |

### 7.2 Per-Context Conflict Handlers

Each context registers a conflict handler in `useOfflineQueue`:

```typescript
// In useOfflineQueue:
const conflictHandlers = useRef<Map<string, (action: OfflineAction) => void>>(new Map());

const registerConflictHandler = useCallback((type: string, handler: (action: OfflineAction) => void) => {
    conflictHandlers.current.set(type, handler);
}, []);
```

Contexts register on mount:

```typescript
// In ProfileContext:
const { registerConflictHandler } = useOfflineQueue();

useEffect(() => {
    registerConflictHandler('set_online_status', (action) => {
        // Revert online status
        setOnlineState(!(action.payload as { isOnline: boolean }).isOnline);
        showNotification('Sync failed', 'Could not update online status. Please try again.');
    });
    
    registerConflictHandler('update_profile', () => {
        refreshProfile(); // Re-fetch from server
        showNotification('Profile conflict', 'Your profile was updated from another device.');
    });
}, [registerConflictHandler]);
```

### 7.3 User Notification

Conflicts are surfaced via `ShellContext.showNotification()`:

- **Temporary banner**: "2 actions couldn't sync. Tap to review."
- **Persistent pending count**: In `OfflineIndicator` badge
- **Failed actions**: Can be retried manually via a "Retry" button in the indicator

---

## 8. Optimistic UI Update Pattern

### 8.1 Pattern

Each write operation in a context follows this sequence:

```
1. Validate input locally
2. Update local state immediately (optimistic)
3. Check isOnline:
   a. ONLINE → call service, revert on failure
   b. OFFLINE → queue action, state stays optimistic
4. On sync replay:
   a. SUCCESS → no-op (state already correct)
   b. CONFLICT → conflict handler reverts/refreshes state
   c. FAILED (max retries) → mark as failed, user can retry
```

### 8.2 Existing Optimistic Updates (Already Correct)

| Context | Operation | Current Behavior | Change Needed |
|---------|-----------|-----------------|---------------|
| ProfileContext | `setOnline` | Optimistic + revert on failure | Add offline queue path |
| ProfileContext | `updateDriver` | Local state only | Add offline queue path |
| ProfileContext | `addTruck`, `removeTruck`, etc. | Local state only | Add offline queue path |
| TripContext | `acceptLoad` | Optimistic + fire-and-forget | Add offline queue path |
| TripContext | `advanceTrip` | Optimistic + fire-and-forget | Add offline queue path |
| EarningsContext | `withdrawWallet` | **NOT optimistic** (waits for service) | Add optimistic + offline queue |

### 8.3 EarningsContext Special Case

`withdrawWallet` currently does NOT update optimistically — it waits for service response. For offline queue support, it must:

1. **Optimistically debit** the wallet balance
2. **Optimistically add** the transaction to payouts list
3. **Queue** the withdrawal action
4. On conflict: **revert** the debit and remove the transaction

```typescript
// Modified withdrawWallet:
const withdrawWallet = async (amount: number, upiId: string): Promise<boolean> => {
    setError(null);
    
    // Pre-validate
    if (amount > walletBalance) {
        setError(new ApiError('Insufficient balance', 0, 'INSUFFICIENT_BALANCE'));
        return false;
    }
    
    if (!isOnline) {
        // Offline: optimistic + queue
        const optimisticTxn: Payout = {
            id: 'W' + Date.now(),
            load: 'WITHDRAWAL',
            route: `Withdrawal to ${upiId}`,
            amount: -amount,
            status: 'pending', // Show as pending until sync
            date: new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        };
        
        setWalletBalance(prev => prev - amount);
        setPayouts(prev => [optimisticTxn, ...prev]);
        
        await queueIfOffline({
            isOnline,
            type: 'withdraw_earnings',
            endpoint: '/earnings/withdraw',
            method: 'POST',
            payload: { amount, upiId },
            optimisticUpdate: () => {}, // Already done above
            rollbackUpdate: () => {
                setWalletBalance(prev => prev + amount);
                setPayouts(prev => prev.filter(p => p.id !== optimisticTxn.id));
            },
            onConflict: 'withdraw_earnings',
        });
        return true;
    }
    
    // Online: existing behavior
    setIsLoading(true);
    try {
        const { earningsService } = await import('../services/index');
        const result = await earningsService.withdraw({ amount, upiId });
        setWalletBalance(result.newBalance);
        setPayouts(prev => [result.transaction, ...prev]);
        return true;
    } catch (err) {
        setError(err instanceof ApiError ? err : new ApiError((err as Error)?.message || 'Withdrawal failed', 0, 'WITHDRAW_FAILED'));
        return false;
    } finally {
        setIsLoading(false);
    }
};
```

---

## 9. Changes Needed Per Context Provider

### 9.1 ShellContext

**File:** [`src/state/ShellContext.tsx`](src/state/ShellContext.tsx)

| Change | Description |
|--------|-------------|
| Import `useOfflineQueue` | `import { useOfflineQueue } from '../features/offline/hooks/useOfflineQueue'` |
| Initialize queue hook | `const { pendingCount, syncQueue, syncStatus, registerConflictHandler } = useOfflineQueue()` |
| Auto-sync on reconnect | `useEffect(() => { if (wasOffline && isOnline) syncQueue(); }, [wasOffline, isOnline])` |
| Expose `syncQueue` via context | Add to `ShellState` interface |
| Wire `offlineQueueSize` | `useEffect(() => { setOfflineQueueSize(pendingCount); }, [pendingCount])` |
| Remove `setOfflineQueueSize` from context | No longer needed — derived from hook |

### 9.2 ProfileContext

**File:** [`src/state/ProfileContext.tsx`](src/state/ProfileContext.tsx)

| Operation | Change |
|-----------|--------|
| `setOnline` (line 313) | Add offline check: if `!isOnline`, queue action + optimistic update |
| `updateDriver` (line 325) | Add offline check: queue `update_profile` action |
| `addTruck` (line 338) | Add offline check: queue `update_truck` action |
| `removeTruck` (line 364) | Add offline check: queue `update_truck` action |
| `setActiveTruck` (line 377) | Add offline check: queue `update_truck` action |
| `toggleTruckActive` (line 399) | Add offline check: queue `update_truck` action |
| `initializeProfile` (line 411) | Add offline check: queue `create_profile` action |
| `createDriverProfile` (line 479) | Add offline check: queue `create_profile` action |
| **New**: `useEffect` for conflict handlers | Register handlers for `set_online_status`, `update_profile`, `update_truck`, `create_profile` |
| **New**: `refreshProfile` on conflict | Re-fetch profile from server when conflict detected |

### 9.3 TripContext

**File:** [`src/state/TripContext.tsx`](src/state/TripContext.tsx)

| Operation | Change |
|-----------|--------|
| `acceptLoad` (line 99) | Add offline check: if `!isOnline`, queue `accept_load` + keep optimistic state |
| `advanceTrip` (line 125) | Add offline check: if `!isOnline`, queue `advance_trip` + keep optimistic state |
| `resetTrip` (line 153) | No queue needed — local state only |
| `acceptLoadOwner` (line 160) | Add offline check: queue action |
| `advanceTripOwner` (line 174) | Add offline check: queue action |
| Location tracking (line 71) | Already correct — uses `addOfflineAction` directly |
| **New**: `useEffect` for conflict handlers | Register handlers for `accept_load`, `advance_trip`, `complete_trip` |

### 9.4 EarningsContext

**File:** [`src/state/EarningsContext.tsx`](src/state/EarningsContext.tsx)

| Operation | Change |
|-----------|--------|
| `withdrawWallet` (line 73) | Major refactor: add optimistic update + offline queue path |
| **New**: `useEffect` for conflict handlers | Register handler for `withdraw_earnings` (revert optimistic debit) |

### 9.5 ChatContext

**File:** [`src/state/ChatContext.tsx`](src/state/ChatContext.tsx)

| Operation | Change |
|-----------|--------|
| `sendMessage` | Lower priority. Can be deferred to Phase 2. For now, show "Can't send messages offline" toast. |

### 9.6 AuthContext

**File:** [`src/state/AuthContext.tsx`](src/state/AuthContext.tsx)

| Operation | Change |
|-----------|--------|
| `sendOtp`, `verifyOtp` | No queue. Ensure `ConnectionGate` wraps `Login` and `Otp` screens. |

---

## 10. UI Changes

### 10.1 OfflineIndicator Enhancement

**File:** [`src/features/offline/components/OfflineIndicator.tsx`](src/features/offline/components/OfflineIndicator.tsx)

Changes:
1. Show pending action count badge when offline
2. Show sync status (syncing spinner) when flushing
3. Show "Retry failed" button when there are failed actions

```typescript
// Enhanced OfflineIndicator
export function OfflineIndicator() {
    const { isOnline, offlineQueueSize } = useShell();
    const { syncStatus, syncQueue } = useOfflineQueue();
    const { t } = useTranslation();

    if (isOnline && offlineQueueSize === 0 && syncStatus === 'idle') return null;

    return (
        <div data-testid="offline-indicator" className="bg-amber-500 text-white text-center py-1.5 text-sm font-medium">
            {!isOnline && (
                <span className="flex items-center justify-center gap-1">
                    <WifiOff className="w-4 h-4" />
                    {offlineQueueSize > 0
                        ? t('offline.pending', `${offlineQueueSize} changes pending`)
                        : t('offline.banner', "You're offline. Changes will sync when connected.")}
                </span>
            )}
            {isOnline && syncStatus === 'syncing' && (
                <span className="flex items-center justify-center gap-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('offline.syncing', 'Syncing changes...')}
                </span>
            )}
            {isOnline && offlineQueueSize > 0 && syncStatus === 'error' && (
                <button onClick={syncQueue} className="underline">
                    {t('offline.retry', 'Sync failed. Tap to retry.')}
                </button>
            )}
        </div>
    );
}
```

### 10.2 Pending Transaction Indicator

In [`src/screens/Earnings.tsx`](src/screens/Earnings.tsx), transactions with `status: 'pending'` (from optimistic offline queue) should show a clock icon or "Pending" badge to distinguish them from confirmed transactions.

### 10.3 Toast on Sync Complete

When `syncQueue` completes, `ShellContext.showNotification()` is called:
- Success: "All changes synced" (green)
- Partial: "X changes synced, Y failed" (amber)
- With conflicts: "Some changes need review" (red)

---

## 11. Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] **1.1** Expand `OfflineAction.type` union in [`src/features/offline/types.ts`](src/features/offline/types.ts:5) — add `set_online_status`, `create_profile`, `send_message`, `complete_trip`
- [ ] **1.2** Add `optimisticState` and `onConflict` optional fields to `OfflineAction` interface in [`src/features/offline/types.ts`](src/features/offline/types.ts:3-17)
- [ ] **1.3** Create `queueIfOffline` helper in new file [`src/features/offline/services/queueIfOffline.ts`](src/features/offline/services/queueIfOffline.ts)
- [ ] **1.4** Create `dispatchAction` in new file [`src/features/offline/services/actionDispatcher.ts`](src/features/offline/services/actionDispatcher.ts)
- [ ] **1.5** Enhance `useOfflineQueue` in [`src/features/offline/hooks/useOfflineQueue.ts`](src/features/offline/hooks/useOfflineQueue.ts):
  - Add `registerConflictHandler` to return type and implementation
  - Add `syncQueue` (debounced flushQueue wrapper)
  - Replace `request()` with `dispatchAction` in `flushQueue`
  - Add exponential backoff between retries in `flushQueue`
  - Export `exponentialBackoff` helper
- [ ] **1.6** Add unit tests for `queueIfOffline` and `dispatchAction`

### Phase 2: ShellContext Wiring

- [ ] **2.1** Import and initialize `useOfflineQueue` in [`src/state/ShellContext.tsx`](src/state/ShellContext.tsx)
- [ ] **2.2** Add `useEffect` to call `syncQueue` on `wasOffline && isOnline` transition
- [ ] **2.3** Wire `pendingCount` to `offlineQueueSize` via `useEffect`
- [ ] **2.4** Remove `setOfflineQueueSize` from context (derived from hook now)
- [ ] **2.5** Add `syncQueue` to `ShellState` interface
- [ ] **2.6** Update `ShellContext.test.tsx` for new behavior

### Phase 3: Context Provider Changes

- [ ] **3.1** ProfileContext — `setOnline`: add offline queue path
- [ ] **3.2** ProfileContext — `updateDriver`: add offline queue path
- [ ] **3.3** ProfileContext — `addTruck`, `removeTruck`, `setActiveTruck`, `toggleTruckActive`: add offline queue path
- [ ] **3.4** ProfileContext — `initializeProfile`, `createDriverProfile`: add offline queue path
- [ ] **3.5** ProfileContext — register conflict handlers in `useEffect`
- [ ] **3.6** ProfileContext — update `ProfileContext.test.tsx`
- [ ] **3.7** TripContext — `acceptLoad`: add offline queue path
- [ ] **3.8** TripContext — `advanceTrip`: add offline queue path
- [ ] **3.9** TripContext — `acceptLoadOwner`, `advanceTripOwner`: add offline queue path
- [ ] **3.10** TripContext — register conflict handlers in `useEffect`
- [ ] **3.11** TripContext — update `TripContext.test.tsx`
- [ ] **3.12** EarningsContext — `withdrawWallet`: refactor to optimistic + offline queue
- [ ] **3.13** EarningsContext — register conflict handler for `withdraw_earnings`
- [ ] **3.14** EarningsContext — update `EarningsContext.test.tsx`

### Phase 4: UI Changes

- [ ] **4.1** Enhance `OfflineIndicator` with queue count, sync spinner, retry button
- [ ] **4.2** Add "Pending" status indicator for optimistic transactions in Earnings screen
- [ ] **4.3** Add toast notifications on sync complete/partial/failure
- [ ] **4.4** Ensure `Login` and `Otp` screens are wrapped in `ConnectionGate`

### Phase 5: Testing

- [ ] **5.1** Add unit tests for `useOfflineQueue` with conflict handling
- [ ] **5.2** Add unit tests for each context's offline queue path
- [ ] **5.3** Add E2E test for offline → online sync flow in [`e2e/offline.spec.ts`](e2e/offline.spec.ts):
  - Go offline, perform actions, go online, verify sync
- [ ] **5.4** Add E2E test for conflict resolution
- [ ] **5.5** Add E2E test for queue persistence across app restart
- [ ] **5.6** Run `npm run typecheck` and `npm run test:run` to verify no regressions

### Phase 6: Polish (Optional / Lower Priority)

- [ ] **6.1** Chat `sendMessage` offline queue support
- [ ] **6.2** Queue size limit (e.g., max 100 pending actions) with warning
- [ ] **6.3** Periodic background sync (`navigator.serviceWorker.ready.then(reg => reg.sync.register('queue-sync'))`) for true background sync
- [ ] **6.4** Sync progress indicator for large queues
- [ ] **6.5** i18n strings for all new offline queue UI text

---

## Appendix A: File Manifest

| File | Action | Purpose |
|------|--------|---------|
| [`src/features/offline/types.ts`](src/features/offline/types.ts) | Modify | Expand type union, add fields |
| [`src/features/offline/services/offlineStorage.ts`](src/features/offline/services/offlineStorage.ts) | No change | Already sufficient |
| [`src/features/offline/services/queueIfOffline.ts`](src/features/offline/services/queueIfOffline.ts) | **Create** | Queue-if-offline helper |
| [`src/features/offline/services/actionDispatcher.ts`](src/features/offline/services/actionDispatcher.ts) | **Create** | Service dispatch table |
| [`src/features/offline/hooks/useOfflineQueue.ts`](src/features/offline/hooks/useOfflineQueue.ts) | Modify | Add conflict handlers, syncQueue, backoff, dispatch |
| [`src/features/offline/hooks/useOnlineStatus.ts`](src/features/offline/hooks/useOnlineStatus.ts) | No change | Already correct |
| [`src/features/offline/components/OfflineIndicator.tsx`](src/features/offline/components/OfflineIndicator.tsx) | Modify | Add queue count, sync status, retry |
| [`src/state/ShellContext.tsx`](src/state/ShellContext.tsx) | Modify | Wire useOfflineQueue, auto-sync on reconnect |
| [`src/state/ProfileContext.tsx`](src/state/ProfileContext.tsx) | Modify | Add offline queue paths to write operations |
| [`src/state/TripContext.tsx`](src/state/TripContext.tsx) | Modify | Add offline queue paths to acceptLoad, advanceTrip |
| [`src/state/EarningsContext.tsx`](src/state/EarningsContext.tsx) | Modify | Refactor withdrawWallet to optimistic + offline queue |
| [`src/state/ChatContext.tsx`](src/state/ChatContext.tsx) | No change (Phase 6) | Defer chat offline support |
| [`src/screens/Earnings.tsx`](src/screens/Earnings.tsx) | Modify | Show pending status for optimistic transactions |
| [`src/screens/Login.tsx`](src/screens/Login.tsx) | Verify | Ensure ConnectionGate wrapping |
| [`src/screens/Otp.tsx`](src/screens/Otp.tsx) | Verify | Ensure ConnectionGate wrapping |
| `src/features/offline/__tests__/queueIfOffline.test.ts` | **Create** | Unit tests for helper |
| `src/features/offline/__tests__/actionDispatcher.test.ts` | **Create** | Unit tests for dispatcher |
| `e2e/offline.spec.ts` | Modify | Add sync flow tests |

---

## Appendix B: Sequence Diagram

```
User           Context        ShellContext    offlineStorage    Service
 |                |                |                |              |
 |--tap accept--> |                |                |              |
 |                |--isOnline?----|                |              |
 |                |<--false-------|                |              |
 |                |                               |              |
 |                |--optimisticUpdate()            |              |
 |                |--addOfflineAction()----------->|              |
 |                |                               |              |
 |<--UI updated---|                               |              |
 |                |                               |              |
 |                |                               |              |
 |  [network returns]                              |              |
 |                |                |               |              |
 |                |   wasOffline && isOnline       |              |
 |                |                |--syncQueue()  |              |
 |                |                |--getPending()->|              |
 |                |                |<--actions[]---|              |
 |                |                |               |              |
 |                |                |--dispatchAction(action)----->|
 |                |                |<--result--------------------|
 |                |                |               |              |
 |                |                |--deleteAction(id)---------->|
 |                |                |               |              |
 |                |                |--showNotification('synced') |
 |                |                |               |              |
 |  [conflict case]                |               |              |
 |                |                |--dispatchAction(action)----->|
 |                |                |<--409 Conflict--------------|
 |                |                |               |              |
 |                |                |--updateAction(conflict)---->|
 |                |                |               |              |
 |                |--conflictHandler(action)       |              |
 |                |--rollbackState()               |              |
 |<--UI updated---|                |               |              |