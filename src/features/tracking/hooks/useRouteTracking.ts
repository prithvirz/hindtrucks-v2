import { useState, useCallback, useEffect, useRef } from 'react';
import type { Coordinates, RouteWaypoint, GeofenceStatus, TrackingState, TrackingConfig } from '../types';
import { DEFAULT_TRACKING_CONFIG, BATTERY_SAVING_INTERVAL } from '../types';
import { useGeolocation } from './useGeolocation';

// Haversine formula: distance between two coordinates in meters
function haversineDistance(a: Coordinates, b: Coordinates): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;

    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);

    const aa = sinDLat * sinDLat + sinDLng * sinDLng * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));

    return R * c;
}

interface UseRouteTrackingReturn {
    trackingState: TrackingState;
    startTracking: (waypoints: RouteWaypoint[], route: Coordinates[]) => void;
    stopTracking: () => void;
    updateDriverPosition: (position: Coordinates) => void;
    setConfig: (config: Partial<TrackingConfig>) => void;
}

export function useRouteTracking(): UseRouteTrackingReturn {
    const [trackingState, setTrackingState] = useState<TrackingState>({
        isTracking: false,
        driverPosition: null,
        route: [],
        waypoints: [],
        estimatedArrival: null,
        geofenceStatus: {
            nearestWaypoint: null,
            distanceToNext: null,
            isWithinGeofence: false,
            justEntered: false,
            justExited: false,
        },
        batteryOptimized: DEFAULT_TRACKING_CONFIG.batteryOptimized,
        error: null,
    });

    const [config, setConfigState] = useState<TrackingConfig>(DEFAULT_TRACKING_CONFIG);
    const { position, startWatching, stopWatching } = useGeolocation({
        enableHighAccuracy: config.highAccuracy,
        maximumAge: 5000,
        timeout: 15000,
    });

    const configRef = useRef(config);
    const waypointsRef = useRef<RouteWaypoint[]>([]);
    const prevGeofenceRef = useRef<Set<string>>(new Set());

    // Keep config ref in sync
    useEffect(() => {
        configRef.current = config;
    }, [config]);

    // Check battery and adjust interval
    useEffect(() => {
        if (!config.batteryOptimized) return;

        const checkBattery = async () => {
            try {
                if ('getBattery' in navigator) {
                    const battery = await (navigator as any).getBattery();
                    if (battery.level < 0.2 && !battery.charging) {
                        setConfigState((prev) => ({ ...prev, intervalMs: BATTERY_SAVING_INTERVAL }));
                        setTrackingState((prev) => ({ ...prev, batteryOptimized: true }));
                    }
                }
            } catch {
                // Battery API not available — ignore
            }
        };

        checkBattery();
    }, [config.batteryOptimized]);

    useEffect(() => {
        if (position && trackingState.isTracking) {
            updateDriverPosition(position);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [position]);

    const setConfig = useCallback((newConfig: Partial<TrackingConfig>) => {
        setConfigState((prev) => ({ ...prev, ...newConfig }));
    }, []);

    const updateDriverPosition = useCallback((position: Coordinates) => {
        setTrackingState((prev) => {
            if (!prev.isTracking) return prev;

            const waypoints = waypointsRef.current;
            const geofenceStatus = computeGeofenceStatus(position, waypoints, prev.geofenceStatus);

            // Calculate ETA
            let estimatedArrival: number | null = null;
            if (waypoints.length > 0) {
                const lastWaypoint = waypoints[waypoints.length - 1];
                const remainingDistance = haversineDistance(position, lastWaypoint.coordinates);
                const speed = position.speed && position.speed > 0 ? position.speed : 13.9; // ~50 km/h default
                estimatedArrival = Date.now() + (remainingDistance / speed) * 1000;
            }

            return {
                ...prev,
                driverPosition: position,
                geofenceStatus,
                estimatedArrival,
                error: null,
            };
        });
    }, []);

    const startTracking = useCallback((waypoints: RouteWaypoint[], route: Coordinates[]) => {
        waypointsRef.current = waypoints;
        prevGeofenceRef.current = new Set();

        setTrackingState({
            isTracking: true,
            driverPosition: null,
            route,
            waypoints,
            estimatedArrival: null,
            geofenceStatus: {
                nearestWaypoint: null,
                distanceToNext: null,
                isWithinGeofence: false,
                justEntered: false,
                justExited: false,
            },
            batteryOptimized: config.batteryOptimized,
            error: null,
        });

        startWatching();
    }, [startWatching, config.batteryOptimized]);

    const stopTracking = useCallback(() => {
        stopWatching();
        setTrackingState((prev) => ({
            ...prev,
            isTracking: false,
            driverPosition: null,
            error: null,
        }));
    }, [stopWatching]);

    return {
        trackingState,
        startTracking,
        stopTracking,
        updateDriverPosition,
        setConfig,
    };
}

function computeGeofenceStatus(
    position: Coordinates,
    waypoints: RouteWaypoint[],
    prevStatus: GeofenceStatus
): GeofenceStatus {
    if (waypoints.length === 0) {
        return { nearestWaypoint: null, distanceToNext: null, isWithinGeofence: false, justEntered: false, justExited: false };
    }

    let nearestWaypoint: RouteWaypoint | null = null;
    let minDistance = Infinity;

    // Find nearest waypoint
    for (const wp of waypoints) {
        const dist = haversineDistance(position, wp.coordinates);
        if (dist < minDistance) {
            minDistance = dist;
            nearestWaypoint = wp;
        }
    }

    const isWithinGeofence = nearestWaypoint !== null && minDistance <= (nearestWaypoint?.geofenceRadius ?? 0);
    let justEntered = false;
    let justExited = false;

    if (nearestWaypoint) {
        const wasInGeofence = prevStatus.isWithinGeofence;
        justEntered = isWithinGeofence && !wasInGeofence;
        justExited = !isWithinGeofence && wasInGeofence && prevStatus.nearestWaypoint?.id === nearestWaypoint.id;
    }

    return {
        nearestWaypoint,
        distanceToNext: nearestWaypoint ? minDistance : null,
        isWithinGeofence,
        justEntered,
        justExited,
    };
}