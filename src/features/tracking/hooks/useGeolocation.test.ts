import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';

// Mock @capacitor/geolocation — only needed for import resolution;
// native paths are skipped because Capacitor.isNativePlatform() returns false.
vi.mock('@capacitor/geolocation', () => ({
    Geolocation: {
        checkPermissions: vi.fn(),
        requestPermissions: vi.fn(),
        getCurrentPosition: vi.fn(),
        watchPosition: vi.fn(),
    },
}));

// Mock background location service (imported by useGeolocation but only called on native)
vi.mock('../services/backgroundLocation', () => ({
    startBackgroundWatch: vi.fn(),
    stopBackgroundWatch: vi.fn(),
    openLocationSettings: vi.fn(),
}));

describe('useGeolocation', () => {
    let watchPositionMock: ReturnType<typeof vi.fn>;
    let clearWatchMock: ReturnType<typeof vi.fn>;
    let getCurrentPositionMock: ReturnType<typeof vi.fn>;
    let permissionsQueryMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        watchPositionMock = vi.fn();
        clearWatchMock = vi.fn();
        getCurrentPositionMock = vi.fn();
        permissionsQueryMock = vi.fn();

        // Mock navigator.geolocation
        Object.defineProperty(globalThis.navigator, 'geolocation', {
            value: {
                watchPosition: watchPositionMock,
                clearWatch: clearWatchMock,
                getCurrentPosition: getCurrentPositionMock,
            },
            writable: true,
            configurable: true,
        });

        // Mock navigator.permissions
        Object.defineProperty(globalThis.navigator, 'permissions', {
            value: {
                query: permissionsQueryMock,
            },
            writable: true,
            configurable: true,
        });
    });

    it('checks permission state on mount', async () => {
        permissionsQueryMock.mockResolvedValue({
            state: 'prompt',
            addEventListener: vi.fn(),
        });

        const { result } = renderHook(() => useGeolocation());

        // Wait for async permission check to resolve (real timers)
        await act(async () => { });

        expect(permissionsQueryMock).toHaveBeenCalledWith({ name: 'geolocation' });
        expect(result.current.permissionState).toBe('prompt');
    });

    it('sets permissionState to granted when already granted', async () => {
        permissionsQueryMock.mockResolvedValue({
            state: 'granted',
            addEventListener: vi.fn(),
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => { });

        expect(result.current.permissionState).toBe('granted');
    });

    it('sets permissionState to unsupported when permissions API missing', async () => {
        // Remove navigator.permissions
        Object.defineProperty(globalThis.navigator, 'permissions', {
            value: undefined,
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => { });

        expect(result.current.permissionState).toBe('unsupported');
    });

    it('startWatching sets up watchPosition and updates position', async () => {
        permissionsQueryMock.mockResolvedValue({
            state: 'granted',
            addEventListener: vi.fn(),
        });
        watchPositionMock.mockReturnValue(42); // watch ID

        const { result } = renderHook(() => useGeolocation());

        // Wait for mount effect to complete
        await act(async () => { });

        act(() => {
            result.current.startWatching();
        });

        expect(result.current.isWatching).toBe(true);
        expect(watchPositionMock).toHaveBeenCalled();

        // Simulate position update
        const successCallback = watchPositionMock.mock.calls[0][0];
        act(() => {
            successCallback({
                coords: {
                    latitude: 28.6139,
                    longitude: 77.2090,
                    accuracy: 10,
                    heading: 90,
                    speed: 15,
                },
                timestamp: 1700000000000,
            });
        });

        expect(result.current.position).toEqual({
            lat: 28.6139,
            lng: 77.2090,
            accuracy: 10,
            heading: 90,
            speed: 15,
            timestamp: 1700000000000,
        });
        expect(result.current.error).toBeNull();
        expect(result.current.permissionState).toBe('granted');
    });

    it('handles PERMISSION_DENIED error from watchPosition', async () => {
        permissionsQueryMock.mockResolvedValue({
            state: 'granted',
            addEventListener: vi.fn(),
        });
        watchPositionMock.mockReturnValue(42);

        const { result } = renderHook(() => useGeolocation());

        await act(async () => { });

        act(() => {
            result.current.startWatching();
        });

        // Simulate error
        const errorCallback = watchPositionMock.mock.calls[0][1];
        act(() => {
            errorCallback({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: 'User denied' });
        });

        expect(result.current.error).toBe('Location permission denied');
        expect(result.current.permissionState).toBe('denied');
        expect(result.current.isWatching).toBe(false);
    });

    it('handles POSITION_UNAVAILABLE error from watchPosition', async () => {
        permissionsQueryMock.mockResolvedValue({
            state: 'granted',
            addEventListener: vi.fn(),
        });
        watchPositionMock.mockReturnValue(42);

        const { result } = renderHook(() => useGeolocation());

        await act(async () => { });

        act(() => {
            result.current.startWatching();
        });

        const errorCallback = watchPositionMock.mock.calls[0][1];
        act(() => {
            errorCallback({ code: 2, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: 'Position unavailable' });
        });

        expect(result.current.error).toBe('Location information unavailable');
        expect(result.current.isWatching).toBe(false);
    });

    it('handles TIMEOUT error from watchPosition', async () => {
        permissionsQueryMock.mockResolvedValue({
            state: 'granted',
            addEventListener: vi.fn(),
        });
        watchPositionMock.mockReturnValue(42);

        const { result } = renderHook(() => useGeolocation());

        await act(async () => { });

        act(() => {
            result.current.startWatching();
        });

        const errorCallback = watchPositionMock.mock.calls[0][1];
        act(() => {
            errorCallback({ code: 3, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: 'Timeout' });
        });

        expect(result.current.error).toBe('Location request timed out');
        expect(result.current.isWatching).toBe(false);
    });

    it('stopWatching clears watch and sets isWatching false', async () => {
        permissionsQueryMock.mockResolvedValue({
            state: 'granted',
            addEventListener: vi.fn(),
        });
        watchPositionMock.mockReturnValue(42);

        const { result } = renderHook(() => useGeolocation());

        await act(async () => { });

        act(() => {
            result.current.startWatching();
        });

        expect(result.current.isWatching).toBe(true);

        act(() => {
            result.current.stopWatching();
        });

        expect(clearWatchMock).toHaveBeenCalledWith(42);
        expect(result.current.isWatching).toBe(false);
    });

    it('requestPermission grants on success', async () => {
        permissionsQueryMock.mockResolvedValue({
            state: 'prompt',
            addEventListener: vi.fn(),
        });
        getCurrentPositionMock.mockImplementation((success) => {
            success({ coords: { latitude: 1, longitude: 2 }, timestamp: 0 });
        });

        const { result } = renderHook(() => useGeolocation());

        // Wait for mount effect
        await act(async () => { });

        let permissionResult: PermissionState;
        await act(async () => {
            permissionResult = await result.current.requestPermission();
        });

        expect(permissionResult!).toBe('granted');
        expect(result.current.permissionState).toBe('granted');
    });

    it('requestPermission denies on PERMISSION_DENIED', async () => {
        permissionsQueryMock.mockResolvedValue({
            state: 'prompt',
            addEventListener: vi.fn(),
        });
        getCurrentPositionMock.mockImplementation((_success, error) => {
            error({ code: 1, PERMISSION_DENIED: 1, message: 'denied' });
        });

        const { result } = renderHook(() => useGeolocation());

        // Wait for mount effect
        await act(async () => { });

        let permissionResult: PermissionState;
        await act(async () => {
            permissionResult = await result.current.requestPermission();
        });

        expect(permissionResult!).toBe('denied');
        expect(result.current.permissionState).toBe('denied');
        expect(result.current.error).toBe('Location permission denied');
    });

    it('detects staleness when last fix exceeds threshold', async () => {
        // Use fake timers only for macrotasks — keep microtasks real so promises resolve
        vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date', 'performance'] });
        permissionsQueryMock.mockResolvedValue({
            state: 'granted',
            addEventListener: vi.fn(),
        });
        watchPositionMock.mockReturnValue(42);

        const { result } = renderHook(() => useGeolocation({
            stalenessThresholdMs: 5000,
        }));

        // Flush mount-effect promise — microtasks are real so await resolves them
        await act(async () => { });

        act(() => {
            result.current.startWatching();
        });

        // Simulate position update
        const successCallback = watchPositionMock.mock.calls[0][0];
        act(() => {
            successCallback({
                coords: { latitude: 28.6, longitude: 77.2, accuracy: 10 },
                timestamp: Date.now(),
            });
        });

        expect(result.current.isStale).toBe(false);

        // Advance time — interval fires every 2500ms; need 7500+ ms for staleness (>5000)
        act(() => {
            vi.advanceTimersByTime(8000);
        });

        expect(result.current.isStale).toBe(true);
        vi.useRealTimers();
    });

    it('resets staleness when new position arrives', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date', 'performance'] });
        permissionsQueryMock.mockResolvedValue({
            state: 'granted',
            addEventListener: vi.fn(),
        });
        watchPositionMock.mockReturnValue(42);

        const { result } = renderHook(() => useGeolocation({
            stalenessThresholdMs: 5000,
        }));

        await act(async () => { });

        act(() => {
            result.current.startWatching();
        });

        const successCallback = watchPositionMock.mock.calls[0][0];
        act(() => {
            successCallback({
                coords: { latitude: 28.6, longitude: 77.2, accuracy: 10 },
                timestamp: Date.now(),
            });
        });

        // Advance time to make stale
        act(() => {
            vi.advanceTimersByTime(8000);
        });
        expect(result.current.isStale).toBe(true);

        // New position resets staleness
        act(() => {
            successCallback({
                coords: { latitude: 28.61, longitude: 77.21, accuracy: 10 },
                timestamp: Date.now(),
            });
        });

        expect(result.current.isStale).toBe(false);
        vi.useRealTimers();
    });

    it('uses high accuracy mode by default', async () => {
        permissionsQueryMock.mockResolvedValue({
            state: 'granted',
            addEventListener: vi.fn(),
        });
        watchPositionMock.mockReturnValue(42);

        const { result } = renderHook(() => useGeolocation());

        await act(async () => { });

        act(() => {
            result.current.startWatching();
        });

        const geoOptions = watchPositionMock.mock.calls[0][2];
        expect(geoOptions.enableHighAccuracy).toBe(true);
    });

    it('uses balanced accuracy mode when configured', async () => {
        permissionsQueryMock.mockResolvedValue({
            state: 'granted',
            addEventListener: vi.fn(),
        });
        watchPositionMock.mockReturnValue(42);

        const { result } = renderHook(() => useGeolocation({
            accuracyMode: 'balanced',
        }));

        await act(async () => { });

        act(() => {
            result.current.startWatching();
        });

        const geoOptions = watchPositionMock.mock.calls[0][2];
        expect(geoOptions.enableHighAccuracy).toBe(false);
        expect(geoOptions.maximumAge).toBe(10000);
    });

    it('uses low accuracy mode when configured', async () => {
        permissionsQueryMock.mockResolvedValue({
            state: 'granted',
            addEventListener: vi.fn(),
        });
        watchPositionMock.mockReturnValue(42);

        const { result } = renderHook(() => useGeolocation({
            accuracyMode: 'low',
        }));

        await act(async () => { });

        act(() => {
            result.current.startWatching();
        });

        const geoOptions = watchPositionMock.mock.calls[0][2];
        expect(geoOptions.enableHighAccuracy).toBe(false);
        expect(geoOptions.maximumAge).toBe(30000);
    });
});