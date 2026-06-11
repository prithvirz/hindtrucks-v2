// ─── useNotificationPermission.test.ts ───

import { renderHook, act } from '@testing-library/react'
import { useNotificationPermission } from '../useNotificationPermission'
import { NOTIFICATION_PERMISSION_KEY, NOTIFICATION_PRMPT_COOLDOWN_DAYS } from '../../types'

function mockNotificationAPI(permission: NotificationPermission) {
    Object.defineProperty(globalThis, 'Notification', {
        writable: true,
        configurable: true,
        value: {
            permission,
            requestPermission: vi.fn().mockResolvedValue(permission),
        },
    })
}

function clearNotificationAPI() {
    // @ts-expect-error delete for test cleanup
    delete globalThis.Notification
}

describe('useNotificationPermission', () => {
    beforeEach(() => {
        localStorage.clear()
        mockNotificationAPI('default')
    })

    afterEach(() => {
        clearNotificationAPI()
    })

    it('returns prompt state when permission is default and not prompted before', () => {
        const { result } = renderHook(() => useNotificationPermission())

        expect(result.current.isGranted).toBe(false)
        expect(result.current.isDenied).toBe(false)
        expect(result.current.permissionState.push).toBe('default')
        expect(result.current.permissionState.needsPrompt).toBe(true)
    })

    it('returns granted when Notification.permission is granted', () => {
        mockNotificationAPI('granted')
        const { result } = renderHook(() => useNotificationPermission())

        expect(result.current.isGranted).toBe(true)
        expect(result.current.isDenied).toBe(false)
        expect(result.current.permissionState.push).toBe('granted')
        expect(result.current.permissionState.needsPrompt).toBe(false)
    })

    it('returns denied when Notification.permission is denied', () => {
        mockNotificationAPI('denied')
        const { result } = renderHook(() => useNotificationPermission())

        expect(result.current.isDenied).toBe(true)
        expect(result.current.isGranted).toBe(false)
    })

    it('returns denied when Notification API is not available', () => {
        clearNotificationAPI()
        const { result } = renderHook(() => useNotificationPermission())

        expect(result.current.isDenied).toBe(true)
    })

    it('sets needsPrompt=false when prompted within cooldown', () => {
        const recentTimestamp = String(Date.now() - 1000) // 1 second ago
        localStorage.setItem(NOTIFICATION_PERMISSION_KEY, recentTimestamp)

        const { result } = renderHook(() => useNotificationPermission())

        expect(result.current.permissionState.needsPrompt).toBe(false)
        expect(result.current.permissionState.promptedBefore).toBe(true)
    })

    it('sets needsPrompt=true when cooldown has expired', () => {
        const cooldownMs = NOTIFICATION_PRMPT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
        const expiredTimestamp = String(Date.now() - cooldownMs - 1000)
        localStorage.setItem(NOTIFICATION_PERMISSION_KEY, expiredTimestamp)

        const { result } = renderHook(() => useNotificationPermission())

        expect(result.current.permissionState.needsPrompt).toBe(true)
    })

    it('markPrompted sets localStorage and resets needsPrompt', () => {
        const { result } = renderHook(() => useNotificationPermission())

        act(() => {
            result.current.markPrompted()
        })

        expect(localStorage.getItem(NOTIFICATION_PERMISSION_KEY)).toBeTruthy()
        expect(result.current.permissionState.promptedBefore).toBe(true)
        expect(result.current.permissionState.needsPrompt).toBe(false)
    })

    it('requestPermission calls Notification.requestPermission', async () => {
        mockNotificationAPI('granted')
        const { result } = renderHook(() => useNotificationPermission())

        await act(async () => {
            const granted = await result.current.requestPermission()
            expect(granted).toBe(true)
        })

        expect(Notification.requestPermission).toHaveBeenCalled()
        expect(localStorage.getItem(NOTIFICATION_PERMISSION_KEY)).toBeTruthy()
    })

    it('requestPermission returns false when Notification API unavailable', async () => {
        clearNotificationAPI()
        const { result } = renderHook(() => useNotificationPermission())

        let granted = false
        await act(async () => {
            granted = await result.current.requestPermission()
        })

        expect(granted).toBe(false)
    })

    it('requestPermission returns false when permission denied', async () => {
        mockNotificationAPI('denied')
        const { result } = renderHook(() => useNotificationPermission())

        let granted = true
        await act(async () => {
            granted = await result.current.requestPermission()
        })

        expect(granted).toBe(false)
    })

    it('resetPromptCooldown removes localStorage item', () => {
        localStorage.setItem(NOTIFICATION_PERMISSION_KEY, String(Date.now()))
        const { result } = renderHook(() => useNotificationPermission())

        act(() => {
            result.current.resetPromptCooldown()
        })

        expect(localStorage.getItem(NOTIFICATION_PERMISSION_KEY)).toBeNull()
    })

    it('checkPermission updates state when called', () => {
        mockNotificationAPI('granted')
        const { result } = renderHook(() => useNotificationPermission())

        // Initial state from constructor used 'default'
        // Now call checkPermission which should update to 'granted'
        act(() => {
            result.current.checkPermission()
        })

        expect(result.current.isGranted).toBe(true)
    })
})