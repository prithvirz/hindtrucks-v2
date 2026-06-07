import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import type { Coordinates } from '../types';
import { startBackgroundWatch, stopBackgroundWatch } from '../services/backgroundLocation';

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

const isNative = Capacitor.isNativePlatform();

export function useGeolocation(options: GeolocationOptions = DEFAULT_OPTIONS): UseGeolocationReturn {
    const [position, setPosition] = useState<Coordinates | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [permissionState, setPermissionState] = useState<PermissionState | 'unsupported'>('unsupported');
    const [isWatching, setIsWatching] = useState(false);
    const watchIdRef = useRef<number | null>(null);
    const nativeWatchIdRef = useRef<string | null>(null);

    const checkPermission = useCallback(async () => {
        if (isNative) {
            try {
                const { location } = await Geolocation.checkPermissions();
                setPermissionState(location === 'prompt-with-rationale' ? 'prompt' : location);
            } catch {
                setPermissionState('prompt');
            }
            return;
        }
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
        // Native: trigger the Android/iOS runtime permission dialog.
        if (isNative) {
            try {
                const { location } = await Geolocation.requestPermissions();
                const state: PermissionState = location === 'granted' ? 'granted' : 'denied';
                setPermissionState(state);
                if (state === 'denied') setError('Location permission denied');
                return state;
            } catch {
                setPermissionState('denied');
                setError('Location permission denied');
                return 'denied';
            }
        }

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
        const onCoords = (
            lat: number,
            lng: number,
            accuracy: number,
            heading: number | null | undefined,
            speed: number | null | undefined,
            timestamp: number,
        ) => {
            setPosition({
                lat,
                lng,
                accuracy,
                heading: heading ?? undefined,
                speed: speed ?? undefined,
                timestamp,
            });
            setError(null);
            setPermissionState('granted');
        };

        const geoOptions = {
            enableHighAccuracy: options.enableHighAccuracy ?? true,
            maximumAge: options.maximumAge ?? 10000,
            timeout: options.timeout ?? 15000,
        };

        if (isNative) {
            setIsWatching(true);
            // Background-capable native watcher (foreground service on Android):
            // keeps delivering fixes while app is backgrounded, screen off, or killed.
            startBackgroundWatch(
                { distanceFilter: 20, requestPermissions: true },
                (coords) => {
                    onCoords(
                        coords.lat,
                        coords.lng,
                        coords.accuracy ?? 0,
                        coords.heading,
                        coords.speed,
                        coords.timestamp,
                    );
                },
                (code, message) => {
                    // Plugin reports NOT_AUTHORIZED when the user denies/revokes permission.
                    if (code === 'NOT_AUTHORIZED') {
                        setPermissionState('denied');
                        setError('Location permission denied');
                        setIsWatching(false);
                    } else {
                        setError(message || 'Location information unavailable');
                    }
                },
            )
                .then((id) => {
                    nativeWatchIdRef.current = id;
                })
                .catch(() => {
                    setError('Location information unavailable');
                    setIsWatching(false);
                });
            return;
        }

        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            return;
        }

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }

        setIsWatching(true);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                onCoords(
                    pos.coords.latitude,
                    pos.coords.longitude,
                    pos.coords.accuracy,
                    pos.coords.heading,
                    pos.coords.speed,
                    pos.timestamp,
                );
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
            geoOptions
        );
    }, [options]);

    const stopWatching = useCallback(() => {
        if (nativeWatchIdRef.current !== null) {
            stopBackgroundWatch(nativeWatchIdRef.current).catch(() => undefined);
            nativeWatchIdRef.current = null;
        }
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsWatching(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (nativeWatchIdRef.current !== null) {
                stopBackgroundWatch(nativeWatchIdRef.current).catch(() => undefined);
            }
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
