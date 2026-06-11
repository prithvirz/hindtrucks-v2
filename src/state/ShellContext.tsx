import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { type NotificationPayload } from './types'
import { useAuth } from './AuthContext'
import { ApiError } from '../services/errors'
import { useOnlineStatus } from '../features/offline/hooks/useOnlineStatus'
import type { SyncStatus } from '../features/offline/types'
import { createSyncController, getPendingCount } from '../features/offline/services/syncQueue'
import { dispatchAction } from '../features/offline/services/dispatchAction'
import type { SyncController } from '../features/offline/services/syncQueue'

interface ShellState {
    hasSeenTour: boolean
    isTourActive: boolean
    tourStep: number
    isLoading: boolean
    error: ApiError | null
    startTour: () => void
    endTour: () => void
    setTourStep: React.Dispatch<React.SetStateAction<number>>
    notification: NotificationPayload | null
    showNotification: (title: string, message: string, type?: 'sms' | 'push') => void
    dismissNotification: () => void
    isOnline: boolean
    wasOffline: boolean
    offlineQueueSize: number
    syncStatus: SyncStatus
    syncQueue: () => Promise<void>
}

export const ShellCtx = createContext<ShellState | null>(null)

export function ShellProvider({ children }: { children: ReactNode }) {
    const { isLoggedIn } = useAuth()

    // Tour state
    const [hasSeenTour, setHasSeenTour] = useState<boolean>(
        () => localStorage.getItem('ht_tour') === '1',
    )
    const [isTourActive, setTourActive] = useState<boolean>(false)
    const [tourStep, setTourStep] = useState<number>(0)
    const [isLoading] = useState(false)
    const [error, setError] = useState<ApiError | null>(null)

    // Notification state
    const [notification, setNotification] = useState<NotificationPayload | null>(null)

    // Online status
    const { isOnline, wasOffline } = useOnlineStatus()

    // Sync orchestration
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
    const [offlineQueueSize, setOfflineQueueSize] = useState<number>(0)
    const syncControllerRef = useRef<SyncController | null>(null)

    const showNotification = (title: string, message: string, type: 'sms' | 'push' = 'push') => {
        setNotification({ title, message, type })
    }

    const dismissNotification = () => {
        setNotification(null)
    }

    // Initialize sync controller once
    if (!syncControllerRef.current) {
        syncControllerRef.current = createSyncController(dispatchAction, setSyncStatus);
    }

    const syncQueue = useMemo(() => {
        return async () => {
            const ctrl = syncControllerRef.current;
            if (!ctrl) return;
            const result = await ctrl.triggerSync();
            setOfflineQueueSize(ctrl.pendingCount);

            // Notify user of sync outcome
            if (result.succeeded > 0 && result.conflicts.length === 0 && result.failed.length === 0) {
                showNotification(
                    'Sync complete',
                    `${result.succeeded} change${result.succeeded !== 1 ? 's' : ''} synced`,
                    'push',
                );
            } else if (result.conflicts.length > 0) {
                showNotification(
                    'Sync issues',
                    `${result.conflicts.length} conflict${result.conflicts.length !== 1 ? 's' : ''} need${result.conflicts.length === 1 ? 's' : ''} review`,
                    'push',
                );
            } else if (result.failed.length > 0) {
                showNotification(
                    'Sync partial',
                    `${result.succeeded} synced, ${result.failed.length} failed`,
                    'push',
                );
            }
        };
    }, []);

    // Periodically refresh pending count
    useEffect(() => {
        const refresh = () => {
            getPendingCount().then(setOfflineQueueSize).catch(() => { });
        };
        refresh();
        const id = setInterval(refresh, 10_000);
        return () => clearInterval(id);
    }, []);

    // Auto-drain on reconnect
    useEffect(() => {
        if (wasOffline && isOnline) {
            syncQueue();
        }
    }, [wasOffline, isOnline, syncQueue]);

    // Auto-dismiss notification after 6 seconds
    useEffect(() => {
        if (notification) {
            const id = setTimeout(() => {
                setNotification(null)
            }, 6000)
            return () => clearTimeout(id)
        }
    }, [notification])

    // Tour activation on first login
    useEffect(() => {
        if (isLoggedIn && localStorage.getItem('ht_tour') !== '1') {
            setTourActive(true)
            setTourStep(0)
        }
    }, [isLoggedIn])

    // Self-cleanup on logout
    useEffect(() => {
        if (!isLoggedIn) {
            setTourActive(false)
            setHasSeenTour(false)
            setTourStep(0)
            setNotification(null)
            setError(null)
            localStorage.removeItem('ht_tour')
        }
    }, [isLoggedIn])

    const startTour = () => {
        setTourStep(0)
        setTourActive(true)
    }

    const endTour = () => {
        setTourActive(false)
        setHasSeenTour(true)
        setTourStep(0)
        localStorage.setItem('ht_tour', '1')
    }

    return (
        <ShellCtx.Provider
            value={{
                hasSeenTour,
                isTourActive,
                tourStep,
                isLoading,
                error,
                startTour,
                endTour,
                setTourStep,
                notification,
                showNotification,
                dismissNotification,
                isOnline,
                wasOffline,
                offlineQueueSize,
                syncStatus,
                syncQueue,
            }}
        >
            {children}
        </ShellCtx.Provider>
    )
}

export function useShell(): ShellState {
    const ctx = useContext(ShellCtx)
    if (!ctx) throw new Error('useShell must be used within ShellProvider')
    return ctx
}