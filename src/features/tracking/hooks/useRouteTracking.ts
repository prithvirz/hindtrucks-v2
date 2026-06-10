import { useState, useCallback, useEffect, useRef } from 'react';
import type { Coordinates, RouteWaypoint, GeofenceStatus, TrackingState, TrackingConfig } from '../types';
import { DEFAULT_TRACKING_CONFIG, BATTERY_SAVING_INTERVAL } from '../types';
import { useGeolocation } from './useGeolocation';

// ─── Haversine formula: distance between two coordinates in meters ───
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

// ─── Polyline-indexed route progress calculation ───
export function computeRouteProgress(
    position: Coordinates,
    routePath: Coordinates[],
): { progressPct: number; distanceRemaining: number; nearestIndex: number } {
    if (routePath.length === 0) {
        return { progressPct: 0, distanceRemaining: 0, nearestIndex: 0 };
    }

    // Find closest point on the polyline
    let minDist = Infinity;
    let closestIdx = 0;
    for (let i = 0; i < routePath.length; i++) {
        const d = haversineDistance(position, routePath[i]);
        if (d < minDist) {
            minDist = d;
            closestIdx = i;
        }
    }

    // Calculate remaining distance from closestIdx to end
    let remaining = 0;
    for (let i = closestIdx; i < routePath.length - 1; i++) {
        remaining += haversineDistance(routePath[i], routePath[i + 1]);
    }

    // Total route distance
    let total = 0;
    for (let i = 0; i < routePath.length - 1; i++) {
        total += haversineDistance(routePath[i], routePath[i + 1]);
    }

    return {
        progressPct: total > 0 ? ((total - remaining) / total) * 100 : 0,
        distanceRemaining: remaining,
        nearestIndex: closestIdx,
    };
}

// ─── localStorage persistence helpers ───
const GEOFENCE_STORAGE_KEY = 'hindtrucks_geofence_state';

function loadGeofenceState(): GeofenceStatus | null {
    try {
        const raw = localStorage.getItem(GEOFENCE_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as GeofenceStatus;
    } catch {
        return null;
    }
}

function saveGeofenceState(status: GeofenceStatus): void {
    try {
        localStorage.setItem(GEOFENCE_STORAGE_KEY, JSON.stringify(status));
    } catch {
        // localStorage unavailable — ignore
    }
}

function clearGeofenceState(): void {
    try {
        localStorage.removeItem(GEOFENCE_STORAGE_KEY);
    } catch {
        // ignore
    }
}

// ─── Exit debounce: require 3+ consecutive outside positions ───
const EXIT_DEBOUNCE_THRESHOLD = 3;

interface UseRouteTrackingReturn {
    trackingState: TrackingState;
    startTracking: (waypoints: RouteWaypoint[], route: Coordinates[]) => void;
    stopTracking: () => void;
    updateDriverPosition: (position: Coordinates) => void;
    setConfig: (config: Partial<TrackingConfig>) => void;
}

const EMPTY_GEOFENCE: GeofenceStatus = {
    nearestWaypoint: null,
    distanceToNext: null,
    isWithinGeofence: false,
    isApproaching: false,
    justEntered: false,
    justExited: false,
    justApproaching: false,
};

export function useRouteTracking(): UseRouteTrackingReturn {
    const [trackingState, setTrackingState] = useState<TrackingState>({
        isTracking: false,
        driverPosition: null,
        route: [],
        waypoints: [],
        estimatedArrival: null,
        geofenceStatus: EMPTY_GEOFENCE,
        batteryOptimized: DEFAULT_TRACKING_CONFIG.batteryOptimized,
        error: null,
        progressPct: 0,
        odometerMeters: 0,
    });

    const [config, setConfigState] = useState<TrackingConfig>(DEFAULT_TRACKING_CONFIG);
    const { position, startWatching, stopWatching } = useGeolocation({
        enableHighAccuracy: config.highAccuracy,
        maximumAge: 5000,
        timeout: 15000,
        accuracyMode: config.accuracyMode ?? 'high',
    });

    const configRef = useRef(config);
    const waypointsRef = useRef<RouteWaypoint[]>([]);
    const routeRef = useRef<Coordinates[]>([]);
    const prevPositionRef = useRef<Coordinates | null>(null);
    const exitDebounceCountRef = useRef(0);
    const prevGeofenceRef = useRef<GeofenceStatus>(EMPTY_GEOFENCE);

    // Keep config ref in sync
    useEffect(() => {
        configRef.current = config;
    }, [config]);

    // Restore geofence state from localStorage on mount
    useEffect(() => {
        const saved = loadGeofenceState();
        if (saved) {
            prevGeofenceRef.current = saved;
            // Clear transient flags from saved state
            prevGeofenceRef.current.justEntered = false;
            prevGeofenceRef.current.justExited = false;
            prevGeofenceRef.current.justApproaching = false;
        }
    }, []);

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
            const route = routeRef.current;
            const prevGeofence = prevGeofenceRef.current;
            const geofenceStatus = computeGeofenceStatus(
                position,
                waypoints,
                prevGeofence,
                exitDebounceCountRef.current,
            );

            // Update exit debounce counter
            if (geofenceStatus.isWithinGeofence) {
                exitDebounceCountRef.current = 0;
            } else if (prevGeofence.isWithinGeofence) {
                exitDebounceCountRef.current += 1;
            }
            prevGeofenceRef.current = geofenceStatus;

            // Persist geofence state to localStorage
            saveGeofenceState(geofenceStatus);

            // Route progress calculation (polyline-indexed)
            let progressPct = prev.progressPct;
            let distanceRemaining: number | null = null;
            if (route.length > 1) {
                const progress = computeRouteProgress(position, route);
                progressPct = progress.progressPct;
                distanceRemaining = progress.distanceRemaining;
            }

            // Trip odometer: accumulate distance from previous position
            let odometerMeters = prev.odometerMeters;
            const prevPos = prevPositionRef.current;
            if (prevPos && prevPos.timestamp < position.timestamp) {
                const segmentDist = haversineDistance(prevPos, position);
                // Only accumulate if distance is reasonable (< 500m between fixes at 10s intervals = 180 km/h max)
                if (segmentDist < 500) {
                    odometerMeters += segmentDist;
                }
            }
            prevPositionRef.current = position;

            // Calculate ETA using polyline distance (or fallback to straight-line)
            let estimatedArrival: number | null = null;
            if (waypoints.length > 0) {
                const lastWaypoint = waypoints[waypoints.length - 1];
                const remainingDist = distanceRemaining ?? haversineDistance(position, lastWaypoint.coordinates);
                const speed = position.speed && position.speed > 0 ? position.speed : 13.9; // ~50 km/h default
                estimatedArrival = Date.now() + (remainingDist / speed) * 1000;
            }

            return {
                ...prev,
                driverPosition: position,
                geofenceStatus,
                estimatedArrival,
                progressPct,
                odometerMeters,
                error: null,
            };
        });
    }, []);

    const startTracking = useCallback((waypoints: RouteWaypoint[], route: Coordinates[]) => {
        waypointsRef.current = waypoints;
        routeRef.current = route;
        prevPositionRef.current = null;
        exitDebounceCountRef.current = 0;

        // Restore persisted geofence state if available
        const savedGeofence = loadGeofenceState();
        const initialGeofence: GeofenceStatus = savedGeofence
            ? { ...savedGeofence, justEntered: false, justExited: false, justApproaching: false }
            : EMPTY_GEOFENCE;
        prevGeofenceRef.current = initialGeofence;

        setTrackingState({
            isTracking: true,
            driverPosition: null,
            route,
            waypoints,
            estimatedArrival: null,
            geofenceStatus: initialGeofence,
            batteryOptimized: config.batteryOptimized,
            error: null,
            progressPct: 0,
            odometerMeters: 0,
        });

        startWatching();
    }, [startWatching, config.batteryOptimized]);

    const stopTracking = useCallback(() => {
        stopWatching();
        clearGeofenceState();
        prevPositionRef.current = null;
        exitDebounceCountRef.current = 0;
        prevGeofenceRef.current = EMPTY_GEOFENCE;
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

// ─── Geofence status computation with graduated alerts + exit debounce ───
export function computeGeofenceStatus(
    position: Coordinates,
    waypoints: RouteWaypoint[],
    prevStatus: GeofenceStatus,
    exitDebounceCount: number,
): GeofenceStatus {
    if (waypoints.length === 0) {
        return EMPTY_GEOFENCE;
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

    const radius = nearestWaypoint?.geofenceRadius ?? 0;
    const isWithinGeofence = nearestWaypoint !== null && minDistance <= radius;
    const isApproaching = nearestWaypoint !== null && !isWithinGeofence && minDistance <= radius * 2;

    // Graduated alert transitions
    let justEntered = false;
    let justExited = false;
    let justApproaching = false;

    if (nearestWaypoint) {
        const wasInGeofence = prevStatus.isWithinGeofence;
        const wasApproaching = prevStatus.isApproaching;

        // Entered: crossed from outside/approaching into 1× radius
        justEntered = isWithinGeofence && !wasInGeofence;

        // Approaching: crossed from outside into 2× radius (but not 1×)
        justApproaching = isApproaching && !wasApproaching && !isWithinGeofence;

        // Exited: debounce — require 3+ consecutive positions outside geofence
        if (!isWithinGeofence && wasInGeofence) {
            // Only mark as exited after debounce threshold
            justExited = exitDebounceCount + 1 >= EXIT_DEBOUNCE_THRESHOLD;
        }
    }

    return {
        nearestWaypoint,
        distanceToNext: nearestWaypoint ? minDistance : null,
        isWithinGeofence,
        isApproaching,
        justEntered,
        justExited,
        justApproaching,
    };
}