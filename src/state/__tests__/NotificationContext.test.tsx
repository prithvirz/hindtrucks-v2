// ─── NotificationContext.test.tsx ───

import { render, act } from '@testing-library/react'
import { NotificationProvider, NotificationContext } from '../../state/NotificationContext'
import type { NotificationContextValue } from '../../state/NotificationContext'

// Mock AuthContext
vi.mock('../../state/AuthContext', () => ({
    useAuth: vi.fn(() => ({ phone: '9876543210' })),
}))

// Mock hooks/NotificationPermission
vi.mock('../../features/notifications/hooks/useNotificationPermission', () => ({
    useNotificationPermission: vi.fn(() => ({
        permissionState: { push: 'granted', needsPrompt: false, promptedBefore: true },
        isGranted: true,
        isDenied: false,
        checkPermission: vi.fn(),
        requestPermission: vi.fn().mockResolvedValue(true),
        markPrompted: vi.fn(),
        resetPromptCooldown: vi.fn(),
    })),
}))

// Mock hooks/useFcmToken
vi.mock('../../features/notifications/hooks/useFcmToken', () => ({
    useFcmToken: vi.fn(() => ({
        token: 'test-fcm-token',
        isLoading: false,
        error: null,
        getToken: vi.fn(),
        deleteToken: vi.fn(),
        isPermissionGranted: true,
    })),
}))

// Mock hooks/useForegroundMessages
vi.mock('../../features/notifications/hooks/useForegroundMessages', () => ({
    useForegroundMessages: vi.fn(() => ({
        activeBanner: null,
        dismissBanner: vi.fn(),
    })),
}))

// Mock notificationService
vi.mock('../../features/notifications/services/notificationService', () => ({
    getStoredNotifications: vi.fn().mockResolvedValue([]),
    markNotificationRead: vi.fn().mockResolvedValue(undefined),
    deleteStoredNotification: vi.fn().mockResolvedValue(undefined),
    storeNotification: vi.fn().mockResolvedValue(undefined),
}))

// Mock services
vi.mock('../../services', () => ({
    notificationsService: {
        registerToken: vi.fn().mockResolvedValue(undefined),
        unregisterToken: vi.fn().mockResolvedValue(undefined),
        subscribeToTopic: vi.fn().mockResolvedValue(undefined),
        unsubscribeFromTopic: vi.fn().mockResolvedValue(undefined),
        getHistory: vi.fn().mockResolvedValue({
            items: [],
            total: 0,
            page: 1,
            limit: 50,
            hasMore: false,
        }),
        markRead: vi.fn().mockResolvedValue(undefined),
        markAllRead: vi.fn().mockResolvedValue(undefined),
    },
}))

// Helpers: uses a mutable ref to capture Consumer value without TS narrowing issues
function useValueRef() {
    const ref = { current: null as NotificationContextValue | null }
    return {
        ref,
        Consumer: () => (
            <NotificationContext.Consumer>
                {(value) => {
                    ref.current = value
                    return null
                }}
            </NotificationContext.Consumer>
        ),
    }
}

/** Returns `ref.current` non-null, or throws if called before render cycle. */
function getValue(ref: { current: NotificationContextValue | null }): NotificationContextValue {
    const v = ref.current!
    if (!v) throw new Error('Context value not yet captured – await vi.waitFor first')
    return v
}

describe('NotificationContext', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('provides initial state', async () => {
        const { ref, Consumer } = useValueRef()
        render(<NotificationProvider><Consumer /></NotificationProvider>)

        await vi.waitFor(() => {
            expect(ref.current).not.toBeNull()
        })

        const ctx = getValue(ref)
        expect(ctx.isPermissionGranted).toBe(true)
        expect(ctx.fcmToken).toBe('test-fcm-token')
        expect(ctx.notifications).toEqual([])
        expect(ctx.unreadCount).toBe(0)
        expect(ctx.activeBanner).toBeNull()
    })

    it('provides permission state', async () => {
        const { ref, Consumer } = useValueRef()
        render(<NotificationProvider><Consumer /></NotificationProvider>)

        await vi.waitFor(() => {
            const v = ref.current
            expect(v?.isPermissionGranted).toBe(true)
            expect(v?.isPermissionDenied).toBe(false)
            expect(v?.permissionState.push).toBe('granted')
        })
    })

    it('provides fcmToken', async () => {
        const { ref, Consumer } = useValueRef()
        render(<NotificationProvider><Consumer /></NotificationProvider>)

        await vi.waitFor(() => {
            const v = ref.current
            expect(v?.fcmToken).toBe('test-fcm-token')
            expect(v?.isTokenLoading).toBe(false)
        })
    })

    it('markRead updates unread count', async () => {
        const { getStoredNotifications } = await import('../../features/notifications/services/notificationService')
        const { markNotificationRead } = await import('../../features/notifications/services/notificationService')

        vi.mocked(getStoredNotifications).mockResolvedValue([
            {
                id: 'n1',
                type: 'new_load',
                title: 'Test',
                body: 'Test body',
                read: false,
                receivedAt: Date.now(),
            },
        ])

        const { ref, Consumer } = useValueRef()
        render(<NotificationProvider><Consumer /></NotificationProvider>)

        await vi.waitFor(() => {
            expect(ref.current?.notifications.length).toBe(1)
        })

        await act(async () => {
            await getValue(ref).markRead('n1')
        })

        await vi.waitFor(() => {
            expect(ref.current?.unreadCount).toBe(0)
        })
        expect(markNotificationRead).toHaveBeenCalledWith('n1')
    })

    it('deleteNotification removes item from state', async () => {
        const { getStoredNotifications } = await import('../../features/notifications/services/notificationService')

        vi.mocked(getStoredNotifications).mockResolvedValue([
            {
                id: 'n1',
                type: 'new_load',
                title: 'Test',
                body: 'Test body',
                read: false,
                receivedAt: Date.now(),
            },
        ])

        const { ref, Consumer } = useValueRef()
        render(<NotificationProvider><Consumer /></NotificationProvider>)

        await vi.waitFor(() => {
            expect(ref.current?.notifications.length).toBe(1)
        })

        await act(async () => {
            await getValue(ref).deleteNotification('n1')
        })

        await vi.waitFor(() => {
            expect(ref.current?.notifications.length).toBe(0)
        })
    })

    it('dismissBanner is provided', async () => {
        const { ref, Consumer } = useValueRef()
        render(<NotificationProvider><Consumer /></NotificationProvider>)

        await vi.waitFor(() => {
            expect(ref.current).not.toBeNull()
        })

        expect(typeof getValue(ref).dismissBanner).toBe('function')
        await act(async () => {
            getValue(ref).dismissBanner()
        })
    })

    it('refreshHistory is callable', async () => {
        const { ref, Consumer } = useValueRef()
        render(<NotificationProvider><Consumer /></NotificationProvider>)

        await vi.waitFor(() => {
            expect(ref.current).not.toBeNull()
        })

        await act(async () => {
            await getValue(ref).refreshHistory()
        })
        expect(typeof getValue(ref).refreshHistory).toBe('function')
    })
})