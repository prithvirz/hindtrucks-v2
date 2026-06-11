import { useState, useEffect, useRef } from 'react';
import { MapPin, MapPinOff, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { useGeolocation } from '../hooks/useGeolocation';
import { openLocationSettings } from '../services/backgroundLocation';

interface LocationPermissionProps {
    onGranted: () => void;
    onDenied: () => void;
    children?: React.ReactNode;
}

const isNative = Capacitor.isNativePlatform();

export function LocationPermission({ onGranted, onDenied, children }: LocationPermissionProps) {
    const { t } = useTranslation();
    const { permissionState, requestPermission } = useGeolocation();
    const [isRequesting, setIsRequesting] = useState(false);
    // Stage 2 prominent disclosure (Android background-location policy): shown
    // only on native after foreground location is granted.
    const [showBackgroundDisclosure, setShowBackgroundDisclosure] = useState(false);

    // Call onGranted whenever permission is already granted (returning user).
    // Also fires after background disclosure is dismissed (new native user).
    const onGrantedRef = useRef(onGranted);
    onGrantedRef.current = onGranted;
    const startedRef = useRef(false);
    useEffect(() => {
        if (permissionState === 'granted' && !showBackgroundDisclosure && !startedRef.current) {
            startedRef.current = true;
            onGrantedRef.current();
        }
    }, [permissionState, showBackgroundDisclosure]);

    const handleRequest = async () => {
        setIsRequesting(true);
        const state = await requestPermission();
        setIsRequesting(false);

        if (state !== 'granted') {
            onDenied();
            return;
        }

        // Foreground granted. On native, surface the background-tracking
        // disclosure before the OS "Allow all the time" upgrade (prompted by
        // the watcher on start). On web there is no background stage.
        if (isNative) {
            setShowBackgroundDisclosure(true);
        }
        // onGranted() is called by the effect when permissionState === 'granted'
        // and showBackgroundDisclosure is false (after disclosure dismissed or web).
    };

    // Already granted (web, or returning native user) — show children.
    if (permissionState === 'granted' && !showBackgroundDisclosure) {
        return <>{children}</>;
    }

    // Stage 2: prominent background-location disclosure (native only).
    if (showBackgroundDisclosure) {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                    <Navigation className="w-7 h-7 text-accent" />
                </div>
                <h4 className="text-sm font-bold text-ink mb-1">
                    {t('gps.backgroundTitle', 'Allow tracking during your trip')}
                </h4>
                <p className="text-xs text-ink-muted mb-4 max-w-xs">
                    {t(
                        'gps.backgroundMessage',
                        'HindTrucks collects location in the background — even when the app is closed or the screen is off — so your live trip can be tracked end to end. On the next screen, please choose "Allow all the time".',
                    )}
                </p>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                    <button
                        onClick={() => {
                            setShowBackgroundDisclosure(false);
                        }}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent/90 transition-colors"
                    >
                        {t('gps.backgroundAllow', 'Continue')}
                    </button>
                    <button
                        onClick={() => {
                            // Decline background — proceed with foreground-only tracking.
                            setShowBackgroundDisclosure(false);
                        }}
                        className="px-5 py-2 text-xs font-semibold text-ink-muted bg-surface-grey rounded-xl hover:bg-surface-sunken transition-colors"
                    >
                        {t('gps.backgroundSkip', 'Only while using the app')}
                    </button>
                </div>
            </div>
        );
    }

    // Already granted — show children
    if (permissionState === 'granted') {
        return <>{children}</>;
    }

    // Denied
    if (permissionState === 'denied') {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-center bg-surface-grey rounded-lg border border-hairline">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
                    <MapPinOff className="w-7 h-7 text-red-500" />
                </div>
                <h4 className="text-sm font-bold text-ink mb-1">
                    {t('gps.deniedTitle', 'Location Access Denied')}
                </h4>
                <p className="text-xs text-ink-muted mb-4 max-w-xs">
                    {t('gps.deniedMessage', 'Please enable location access in your device settings to use GPS tracking.')}
                </p>
                <div className="flex flex-col gap-2 w-full max-w-xs items-center">
                    <button
                        onClick={handleRequest}
                        disabled={isRequesting}
                        className="px-5 py-2.5 text-xs font-bold text-white bg-accent rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 w-full"
                    >
                        {isRequesting ? t('gps.requesting', 'Requesting...') : t('gps.allow', 'Allow Location')}
                    </button>
                    <div className="flex gap-2 justify-center w-full">
                        {isNative && (
                            <button
                                onClick={() => openLocationSettings().catch(() => undefined)}
                                className="px-3 py-2 text-xs font-semibold text-ink bg-surface border border-hairline rounded-xl hover:bg-surface-grey transition-colors flex-1"
                            >
                                {t('gps.openSettings', 'Open Settings')}
                            </button>
                        )}
                        <button
                            onClick={onDenied}
                            className="px-3 py-2 text-xs font-semibold text-ink-muted bg-surface border border-hairline rounded-xl hover:bg-surface-grey transition-colors flex-1"
                        >
                            {t('gps.continueWithoutGps', 'Continue Without GPS')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Prompt: show permission request UI
    return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                <MapPin className="w-7 h-7 text-accent" />
            </div>
            <h4 className="text-sm font-bold text-ink mb-1">
                {t('gps.permissionTitle', 'Enable GPS Tracking')}
            </h4>
            <p className="text-xs text-ink-muted mb-4 max-w-xs">
                {t('gps.permissionMessage', 'Allow location access to track your trip progress and provide accurate ETAs.')}
            </p>
            <div className="flex gap-3">
                <button
                    onClick={handleRequest}
                    disabled={isRequesting}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                    {isRequesting
                        ? t('gps.requesting', 'Requesting...')
                        : t('gps.allow', 'Allow Location')}
                </button>
                <button
                    onClick={onDenied}
                    className="px-5 py-2.5 text-sm font-semibold text-ink-muted bg-surface-grey rounded-xl hover:bg-surface-sunken transition-colors"
                >
                    {t('gps.skip', 'Skip')}
                </button>
            </div>
        </div>
    );
}
