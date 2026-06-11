// ─── useForegroundMessages.test.ts ───

import { renderHook, act } from '@testing-library/react'

// Mock firebase/messaging
let onMessageCallback: ((payload: unknown) => void) | null = null
vi.mock('firebase/messaging', () => ({
    onMessage: vi.fn((_messaging, callback) => {
        onMessageCallback = callback
        return vi.fn()
    }),
    MessagePayload: {},
}))

// Mock lib/firebase
vi.mock('../../../../lib/firebase', () => ({
    messaging: {},
}))

// Mock notificationService
vi.mock('../../services/notificationService', () => ({
    storeNotification: vi.fn().mockResolvedValue(undefined),
}))

import { useForegroundMessages } from '../useForegroundMessages'
import { storeNotification } from '../../services/notificationService'

function createFcmPayload(overrides: Record<string, unknown> = {}) {
    return {
        data: {
            notificationId: 'notif-001',
            type: 'new_load',
            title: 'New Load Available',
            body: 'Mumbai to Delhi, 25 tons',
            deepLink: '/loads/123',
            ...overrides,
        },
        notification: {
            title: 'New Load Available',
            body: 'Mumbai to Delhi, 25 tons',
        },
        ...overrides,
    }
}

// Mock navigator.serviceWorker for NOTIFICATION_CLICKED listener
const swListeners: Record<string, EventListenerOrEventListenerObject> = {}

describe('useForegroundMessages', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        onMessageCallback = null
        vi.useFakeTimers()

        Object.defineProperty(navigator, 'serviceWorker', {
            value: {
                addEventListener: vi.fn((event: string, handler: EventListenerOrEventListenerObject) => {
                    swListeners[event] = handler
                }),
                removeEventListener: vi.fn((event: string) => {
                    delete swListeners[event]
                }),
            },
            configurable: true,
        })
        Object.keys(swListeners).forEach((k) => delete swListeners[k])
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('starts with no active banner', () => {
        const { result } = renderHook(() => useForegroundMessages())

        expect(result.current.activeBanner).toBeNull()
    })

    it('shows banner when foreground message arrives', () => {
        const { result } = renderHook(() => useForegroundMessages())

        act(() => {
            onMessageCallback?.(createFcmPayload())
        })

        expect(result.current.activeBanner).not.toBeNull()
        expect(result.current.activeBanner?.type).toBe('new_load')
        expect(result.current.activeBanner?.title).toBe('New Load Available')
        expect(storeNotification).toHaveBeenCalled()
    })

    it('normalizes message with fallback values', () => {
        const { result } = renderHook(() => useForegroundMessages())

        act(() => {
            onMessageCallback?.({
                data: { type: 'announcement' },
                notification: { title: 'Fallback Title', body: 'Fallback Body' },
            })
        })

        expect(result.current.activeBanner?.title).toBe('Fallback Title')
        expect(result.current.activeBanner?.body).toBe('Fallback Body')
        expect(result.current.activeBanner?.type).toBe('announcement')
        expect(result.current.activeBanner?.deepLink).toBe('/home')
    })

    it('auto-dismisses banner after 8 seconds', () => {
        const { result } = renderHook(() => useForegroundMessages())

        act(() => {
            onMessageCallback?.(createFcmPayload())
        })

        expect(result.current.activeBanner).not.toBeNull()

        act(() => {
            vi.advanceTimersByTime(8000)
        })

        expect(result.current.activeBanner).toBeNull()
    })

    it('dismissBanner clears active banner', () => {
        const { result } = renderHook(() => useForegroundMessages())

        act(() => {
            onMessageCallback?.(createFcmPayload())
        })

        expect(result.current.activeBanner).not.toBeNull()

        act(() => {
            result.current.dismissBanner()
        })

        expect(result.current.activeBanner).toBeNull()
    })

    it('uses data fields over notification fields for title/body', () => {
        const { result } = renderHook(() => useForegroundMessages())

        act(() => {
            onMessageCallback?.({
                data: {
                    notificationId: 'notif-002',
                    type: 'earnings',
                    title: 'Data Title',
                    body: 'Data Body',
                },
                notification: {
                    title: 'Notification Title',
                    body: 'Notification Body',
                },
            })
        })

        // notification.title takes priority over data.title in normalizeFcmMessage
        expect(result.current.activeBanner?.title).toBe('Notification Title')
        expect(result.current.activeBanner?.body).toBe('Notification Body')
    })

    it('generates a random id when notificationId is missing', () => {
        const { result } = renderHook(() => useForegroundMessages())

        act(() => {
            onMessageCallback?.({
                data: { type: 'chat_message' },
                notification: { title: 'Chat', body: 'Hello' },
            })
        })

        expect(result.current.activeBanner?.id).toBeTruthy()
        expect(result.current.activeBanner?.id).not.toBe('')
    })

    it('handles NOTIFICATION_CLICKED service worker message', () => {
        const { result } = renderHook(() => useForegroundMessages())

        // First show a banner
        act(() => {
            onMessageCallback?.(createFcmPayload())
        })
        expect(result.current.activeBanner).not.toBeNull()

        // Simulate SW message via the mocked navigator.serviceWorker listener
        const handler = swListeners['message'] as EventListener
        expect(handler).toBeTruthy()

        act(() => {
            handler(new MessageEvent('message', {
                data: { type: 'NOTIFICATION_CLICKED' },
            }))
        })

        expect(result.current.activeBanner).toBeNull()
    })
})