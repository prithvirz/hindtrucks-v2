// ─── useFcmToken.test.ts ───

import { renderHook, act, waitFor } from '@testing-library/react'
import { useFcmToken } from '../useFcmToken'

// Mock firebase/messaging
vi.mock('firebase/messaging', () => ({
    getToken: vi.fn(),
    onRegistered: vi.fn(() => vi.fn()),
    deleteToken: vi.fn().mockResolvedValue(true),
}))

// Mock lib/firebase
vi.mock('../../../../lib/firebase', () => ({
    messaging: {},
}))

// Mock services
vi.mock('../../../../services', () => ({
    notificationsService: {
        registerToken: vi.fn().mockResolvedValue(undefined),
        unregisterToken: vi.fn().mockResolvedValue(undefined),
        subscribeToTopic: vi.fn().mockResolvedValue(undefined),
        unsubscribeFromTopic: vi.fn().mockResolvedValue(undefined),
    },
}))

// Mock useNotificationPermission
vi.mock('../useNotificationPermission', () => ({
    useNotificationPermission: vi.fn(() => ({
        isGranted: true,
        isDenied: false,
        permissionState: { push: 'granted', needsPrompt: false, promptedBefore: true },
        checkPermission: vi.fn(),
        requestPermission: vi.fn().mockResolvedValue(true),
        markPrompted: vi.fn(),
        resetPromptCooldown: vi.fn(),
    })),
}))

import { getToken, deleteToken, onRegistered } from 'firebase/messaging'
import { notificationsService } from '../../../../services'
import { useNotificationPermission } from '../useNotificationPermission'

describe('useFcmToken', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.clearAllMocks()
        // Default: permission granted
        vi.mocked(useNotificationPermission).mockReturnValue({
            isGranted: true,
            isDenied: false,
            permissionState: { push: 'granted', needsPrompt: false, promptedBefore: true },
            checkPermission: vi.fn(),
            requestPermission: vi.fn().mockResolvedValue(true),
            markPrompted: vi.fn(),
            resetPromptCooldown: vi.fn(),
        })
    })

    it('starts with token from localStorage if present', () => {
        localStorage.setItem('fcm_token', 'stored-token-123')
        const { result } = renderHook(() => useFcmToken('driver-1'))

        expect(result.current.token).toBe('stored-token-123')
        expect(result.current.isLoading).toBe(false)
    })

    it('fetches token when permission granted and no token in state', async () => {
        vi.mocked(getToken).mockResolvedValue('new-fcm-token-abc')

        const { result } = renderHook(() => useFcmToken('driver-1'))

        await waitFor(() => {
            expect(result.current.token).toBe('new-fcm-token-abc')
        })

        expect(getToken).toHaveBeenCalled()
        expect(localStorage.getItem('fcm_token')).toBe('new-fcm-token-abc')
        expect(notificationsService.registerToken).toHaveBeenCalledWith('new-fcm-token-abc')
        expect(notificationsService.subscribeToTopic).toHaveBeenCalledWith('driver_driver-1')
    })

    it('does not fetch token when permission is not granted', () => {
        vi.mocked(useNotificationPermission).mockReturnValue({
            isGranted: false,
            isDenied: true,
            permissionState: { push: 'denied', needsPrompt: false, promptedBefore: true },
            checkPermission: vi.fn(),
            requestPermission: vi.fn().mockResolvedValue(false),
            markPrompted: vi.fn(),
            resetPromptCooldown: vi.fn(),
        })

        const { result } = renderHook(() => useFcmToken('driver-1'))

        expect(result.current.isPermissionGranted).toBe(false)
        expect(getToken).not.toHaveBeenCalled()
    })

    it('does not fetch token when driverId is null', () => {
        const { result } = renderHook(() => useFcmToken(null))

        expect(result.current.token).toBeNull()
        expect(getToken).not.toHaveBeenCalled()
    })

    it('handles getToken failure gracefully', async () => {
        vi.mocked(getToken).mockRejectedValue(new Error('permission denied'))

        const { result } = renderHook(() => useFcmToken('driver-1'))

        await waitFor(() => {
            expect(result.current.error).toBeTruthy()
        })

        expect(result.current.error).toContain('permission denied')
    })

    it('removeToken unregisters from server and clears localStorage', async () => {
        localStorage.setItem('fcm_token', 'token-to-remove')
        vi.mocked(getToken).mockResolvedValue('some-token')
        vi.mocked(deleteToken).mockResolvedValue(true)

        const { result } = renderHook(() => useFcmToken('driver-1'))

        await waitFor(() => {
            expect(result.current.token).toBeTruthy()
        })

        await act(async () => {
            await result.current.deleteToken()
        })

        expect(notificationsService.unregisterToken).toHaveBeenCalled()
        expect(deleteToken).toHaveBeenCalled()
        expect(result.current.token).toBeNull()
        expect(localStorage.getItem('fcm_token')).toBeNull()
    })

    it('registers onTokenRefresh listener', async () => {
        // Setup: grant permission and get initial token
        vi.mocked(getToken).mockResolvedValue('initial-token')
        let refreshCallback: ((token: string) => void) | null = null
        vi.mocked(onRegistered).mockImplementation((_messaging, cb) => {
            refreshCallback = cb as (token: string) => void
            return vi.fn()
        })

        const { result } = renderHook(() => useFcmToken('driver-1'))

        await waitFor(() => {
            expect(result.current.token).toBe('initial-token')
        })

        // Simulate token refresh
        await act(async () => {
            refreshCallback?.('refreshed-token-xyz')
        })

        expect(result.current.token).toBe('refreshed-token-xyz')
        expect(localStorage.getItem('fcm_token')).toBe('refreshed-token-xyz')
        expect(notificationsService.registerToken).toHaveBeenCalledWith('refreshed-token-xyz')
    })
})