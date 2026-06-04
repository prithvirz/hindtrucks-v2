import { useEffect, useState } from 'react';
import { Bell, MapPin } from 'lucide-react';
import type { RouteWaypoint } from '../types';

interface GeofenceAlertProps {
    waypoint: RouteWaypoint;
    distance: number;
    onDismiss: () => void;
}

export function GeofenceAlert({ waypoint, distance, onDismiss }: GeofenceAlertProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
            setVisible(false);
            onDismiss();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onDismiss]);

    if (!visible) return null;

    const distanceText = distance < 1000
        ? `${Math.round(distance)}m`
        : `${(distance / 1000).toFixed(1)}km`;

    return (
        <div className="absolute top-4 left-4 right-4 z-50 bg-white/95 backdrop-blur border border-accent/20 rounded-2xl p-3.5 shadow-lg flex items-start gap-3 animate-slide-down">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-bold text-accent uppercase tracking-wider">
                        Geofence Alert
                    </span>
                </div>
                <p className="text-sm font-bold text-gray-800 leading-tight">
                    Approaching {waypoint.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                    {distanceText} away — {waypoint.type === 'pickup' ? 'Pickup' : waypoint.type === 'drop' ? 'Drop-off' : 'Waypoint'} point
                </p>
            </div>
            <button
                onClick={() => { setVisible(false); onDismiss(); }}
                className="text-xs font-semibold text-accent hover:text-accent/80 shrink-0 pt-1"
            >
                Dismiss
            </button>
        </div>
    );
}