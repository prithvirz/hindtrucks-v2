import { useEffect, useState } from 'react';
import { Bell, MapPin, Phone, Camera } from 'lucide-react';
import type { RouteWaypoint } from '../types';

interface GeofenceAlertProps {
    waypoint: RouteWaypoint;
    distance: number;
    status: 'approaching' | 'entered';
    onDismiss: () => void;
    onAction?: () => void;
}

export function GeofenceAlert({ waypoint, distance, status, onDismiss, onAction }: GeofenceAlertProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Approaching alerts auto-dismiss sooner (4s); entered alerts last longer (6s)
        const ms = status === 'approaching' ? 4000 : 6000;
        const timer = setTimeout(() => {
            setVisible(false);
            onDismiss();
        }, ms);

        return () => clearTimeout(timer);
    }, [onDismiss, status]);

    if (!visible) return null;

    const distanceText = distance < 1000
        ? `${Math.round(distance)}m`
        : `${(distance / 1000).toFixed(1)}km`;

    const isApproaching = status === 'approaching';
    const isPickup = waypoint.type === 'pickup';
    const isDrop = waypoint.type === 'drop';

    // Phase 5.6: Action labels per waypoint type
    const actionLabel = isPickup ? 'Call Shipper' : isDrop ? 'Capture POD' : null;
    const ActionIcon = isPickup ? Phone : isDrop ? Camera : null;

    return (
        <div className={`absolute top-4 left-4 right-4 z-50 backdrop-blur border rounded-2xl p-3.5 shadow-lg flex items-start gap-3 animate-slide-down ${isApproaching
                ? 'bg-yellow-50/95 border-yellow-400/30'
                : 'bg-surface-base/95 border-accent/20'
            }`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isApproaching ? 'bg-yellow-400/10' : 'bg-accent/10'
                }`}>
                <Bell className={`w-5 h-5 ${isApproaching ? 'text-yellow-600' : 'text-accent'}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <MapPin className={`w-3.5 h-3.5 ${isApproaching ? 'text-yellow-600' : 'text-accent'}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${isApproaching ? 'text-yellow-600' : 'text-accent'
                        }`}>
                        {isApproaching ? 'Approaching' : 'Geofence Alert'}
                    </span>
                </div>
                <p className="text-sm font-bold text-gray-800 leading-tight">
                    {isApproaching ? `Near ${waypoint.label}` : `Arrived at ${waypoint.label}`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                    {distanceText} — {isPickup ? 'Pickup' : isDrop ? 'Drop-off' : 'Waypoint'} point
                </p>
                {/* Phase 5.6: Informational action label (shown when no onAction handler) */}
                {actionLabel && ActionIcon && !onAction && (
                    <div className="mt-1.5 flex items-center gap-1">
                        <ActionIcon size={12} className={isPickup ? 'text-blue-500' : 'text-success'} />
                        <span className={`text-[11px] font-bold ${isPickup ? 'text-blue-600' : 'text-success'}`}>
                            {actionLabel}
                        </span>
                    </div>
                )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 pt-1">
                <button
                    onClick={() => { setVisible(false); onDismiss(); }}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-600"
                >
                    Dismiss
                </button>
                {/* Phase 5.6: Clickable action button (shown when onAction handler provided) */}
                {onAction && actionLabel && ActionIcon && (
                    <button
                        onClick={onAction}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold active:scale-95 transition-transform ${isPickup
                                ? 'bg-blue-500/10 text-blue-600 border border-blue-200'
                                : 'bg-success/10 text-success border border-success/30'
                            }`}
                    >
                        <ActionIcon size={12} />
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
}