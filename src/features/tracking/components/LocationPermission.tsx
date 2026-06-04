import { useState } from 'react';
import { MapPin, MapPinOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from '../hooks/useGeolocation';

interface LocationPermissionProps {
    onGranted: () => void;
    onDenied: () => void;
    children?: React.ReactNode;
}

export function LocationPermission({ onGranted, onDenied, children }: LocationPermissionProps) {
    const { t } = useTranslation();
    const { permissionState, requestPermission } = useGeolocation();
    const [isRequesting, setIsRequesting] = useState(false);

    const handleRequest = async () => {
        setIsRequesting(true);
        const state = await requestPermission();
        setIsRequesting(false);

        if (state === 'granted') {
            onGranted();
        } else {
            onDenied();
        }
    };

    // Already granted — show children
    if (permissionState === 'granted') {
        return <>{children}</>;
    }

    // Denied
    if (permissionState === 'denied') {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
                    <MapPinOff className="w-7 h-7 text-red-500" />
                </div>
                <h4 className="text-sm font-bold text-gray-800 mb-1">
                    {t('gps.deniedTitle', 'Location Access Denied')}
                </h4>
                <p className="text-xs text-gray-500 mb-4 max-w-xs">
                    {t('gps.deniedMessage', 'Please enable location access in your device settings to use GPS tracking.')}
                </p>
                <button
                    onClick={onDenied}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    {t('gps.continueWithoutGps', 'Continue Without GPS')}
                </button>
            </div>
        );
    }

    // Prompt: show permission request UI
    return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                <MapPin className="w-7 h-7 text-accent" />
            </div>
            <h4 className="text-sm font-bold text-gray-800 mb-1">
                {t('gps.permissionTitle', 'Enable GPS Tracking')}
            </h4>
            <p className="text-xs text-gray-500 mb-4 max-w-xs">
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
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                    {t('gps.skip', 'Skip')}
                </button>
            </div>
        </div>
    );
}