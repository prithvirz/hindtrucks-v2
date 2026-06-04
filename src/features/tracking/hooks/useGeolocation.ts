import { useState, useEffect, useCallback, useRef } from 'react';
import type { Coordinates } from '../types';

interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    maximumAge?: number;
    timeout?: number;
}

interface UseGeolocationReturn {
    position: Coordinates | null;
    error: string | null;
    permissionState: PermissionState | 'unsupported';
    isWatching: boolean;
    startWatching: () => void;
    stopWatching: () => void;
    requestPermission: () => Promise<PermissionState>;
}

const DEFAULT_OPTIONS: GeolocationOptions = {
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 15000,
};

export function useGeolocation(options: GeolocationOptions = DEFAULT_OPTIONS): UseGeolocationReturn {
    const [position, setPosition] = useState<Coordinates | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [permissionState, setPermissionState] = useState<PermissionState | 'unsupported'>('unsupported');
    const [isWatching, setIsWatching] = useState(false);
    const watchIdRef = useRef<number | null>(null);

    const checkPermission = useCallback(async () => {
        if (!('permissions' in navigator)) {
            setPermissionState('unsupported');
            return;
        }
        try {
            const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            setPermissionState(result.state);
            result.addEventListener('change', () => {
                setPermissionState(result.state);
            });
        } catch {
            setPermissionState('unsupported');
        }
    }, []);

    useEffect(() => {
        checkPermission();
    }, [checkPermission]);

    const requestPermission = useCallback(async (): Promise<PermissionState> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                setError('Geolocation is not supported by this browser');
                setPermissionState('denied');
                resolve('denied');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                () => {
                    setPermissionState('granted');
                    resolve('granted');
                },
                (err) => {
                    if (err.code === err.PERMISSION_DENIED) {
                        setPermissionState('denied');
                        setError('Location permission denied');
                        resolve('denied');
                    } else {
                        setPermissionState('prompt');
                        resolve('prompt');
                    }
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        });
    }, []);

    const startWatching = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            return;
        }

        // Clear existing watch
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }

        setIsWatching(true);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const coords: Coordinates = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    heading: pos.coords.heading ?? undefined,
                    speed: pos.coords.speed ?? undefined,
                    timestamp: pos.timestamp,
                };
                setPosition(coords);
                setError(null);
                setPermissionState('granted');
            },
            (err) => {
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError('Location permission denied');
                        setPermissionState('denied');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError('Location information unavailable');
                        break;
                    case err.TIMEOUT:
                        setError('Location request timed out');
                        break;
                    default:
                        setError('An unknown error occurred');
                }
                setIsWatching(false);
            },
            {
                enableHighAccuracy: options.enableHighAccuracy ?? true,
                maximumAge: options.maximumAge ?? 10000,
                timeout: options.timeout ?? 15000,
            }
        );
    }, [options]);

    const stopWatching = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsWatching(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    return {
        position,
        error,
        permissionState,
        isWatching,
        startWatching,
        stopWatching,
        requestPermission,
    };
}