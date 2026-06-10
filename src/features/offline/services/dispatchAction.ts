// ─── Service Action Dispatch Table ───
// Maps OfflineAction types to real service method calls for replay during sync.

import type { OfflineAction } from '../types';
import type { TripStep } from '../../../state/types';
import {
    loadsService,
    tripService,
    earningsService,
    profileService,
    isServiceReal,
} from '../../../services/index';

// ─── Dispatch Result ───

interface DispatchResult {
    success: boolean;
    status?: number;
    data?: unknown;
}

// ─── Dispatch Table ───

export async function dispatchAction(action: OfflineAction): Promise<DispatchResult> {
    // Only dispatch to real services — mock services are for dev only
    // and don't need offline queue replay
    switch (action.type) {
        case 'accept_load': {
            if (!isServiceReal('loads')) return { success: true };
            const { acceptLoad } = loadsService;
            return acceptLoad(action.payload as { loadId: string })
                .then((r) => ({ success: true, data: r }))
                .catch((err) => {
                    if (err?.status === 409) return { success: false, status: 409, data: err.data };
                    throw err;
                });
        }

        case 'advance_trip': {
            if (!isServiceReal('trip')) return { success: true };
            const { advanceStep } = tripService;
            return advanceStep(action.payload as { currentStep: TripStep })
                .then((r) => ({ success: true, data: r }))
                .catch((err) => {
                    if (err?.status === 409) return { success: false, status: 409, data: err.data };
                    throw err;
                });
        }

        case 'complete_trip': {
            if (!isServiceReal('trip')) return { success: true };
            const { completeTrip } = tripService;
            return completeTrip(action.payload as { loadId: string })
                .then((r) => ({ success: true, data: r }))
                .catch((err) => {
                    if (err?.status === 409) return { success: false, status: 409, data: err.data };
                    throw err;
                });
        }

        case 'withdraw_earnings': {
            if (!isServiceReal('earnings')) return { success: true };
            const { withdraw } = earningsService;
            return withdraw(action.payload as { amount: number; upiId: string })
                .then((r) => ({ success: true, data: r }))
                .catch((err) => {
                    if (err?.status === 409) return { success: false, status: 409, data: err.data };
                    throw err;
                });
        }

        case 'set_online_status': {
            if (!isServiceReal('profile')) return { success: true };
            const { setOnlineStatus } = profileService;
            return setOnlineStatus(action.payload as { isOnline: boolean })
                .then((r) => ({ success: true, data: r }))
                .catch((err) => {
                    if (err?.status === 409) return { success: false, status: 409, data: err.data };
                    throw err;
                });
        }

        case 'create_profile': {
            if (!isServiceReal('profile')) return { success: true };
            const { createDriverProfile } = profileService;
            return createDriverProfile(action.payload as { name: string; phone: string })
                .then((r) => ({ success: true, data: r }))
                .catch((err) => {
                    if (err?.status === 409) return { success: false, status: 409, data: err.data };
                    throw err;
                });
        }

        case 'report_location': {
            if (!isServiceReal('trip')) return { success: true };
            const { reportLocation } = tripService;
            return reportLocation(action.payload as {
                loadId: string; lat: number; lng: number;
                accuracy: number | null; heading: number | null;
                speed: number | null; recordedAt: number;
            })
                .then((r) => ({ success: true, data: r }))
                .catch((err) => {
                    if (err?.status === 409) return { success: false, status: 409, data: err.data };
                    throw err;
                });
        }

        case 'update_profile':
        case 'update_truck':
        case 'send_message':
            // These types don't have direct service methods yet.
            // For now they pass through as success — the actual replay
            // will be added when each service exposes the corresponding method.
            return { success: true };

        default: {
            const _exhaustive: never = action.type;
            throw new Error(`Unknown action type: ${_exhaustive}`);
        }
    }
}