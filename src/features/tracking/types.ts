// ─── GPS Tracking Feature: TypeScript Interfaces ───

export interface Coordinates {
    lat: number;
    lng: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
    timestamp: number;
}

export interface RouteWaypoint {
    id: string;
    coordinates: Coordinates;
    label: string;
    type: 'pickup' | 'drop' | 'waypoint' | 'checkpoint';
    estimatedArrival?: number;
    actualArrival?: number;
    geofenceRadius: number; // meters
    triggered: boolean;
}

export interface GeofenceStatus {
    nearestWaypoint: RouteWaypoint | null;
    distanceToNext: number | null; // meters
    isWithinGeofence: boolean;
    isApproaching: boolean;       // within 2× radius but not 1× radius
    justEntered: boolean;
    justExited: boolean;
    justApproaching: boolean;     // just crossed 2× radius threshold
}

export interface TrackingState {
    isTracking: boolean;
    driverPosition: Coordinates | null;
    route: Coordinates[];
    waypoints: RouteWaypoint[];
    estimatedArrival: number | null;
    geofenceStatus: GeofenceStatus;
    batteryOptimized: boolean;
    error: string | null;
    progressPct: number;
    odometerMeters: number;
}

export interface TrackingConfig {
    highAccuracy: boolean;
    intervalMs: number; // GPS poll interval
    batteryOptimized: boolean;
    onWaypointEnter?: (waypoint: RouteWaypoint) => void;
    onWaypointExit?: (waypoint: RouteWaypoint) => void;
    stalenessThresholdMs?: number;
    minAccuracyMeters?: number;
    accuracyMode?: 'high' | 'balanced' | 'low';
}

export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
    highAccuracy: true,
    intervalMs: 10000, // 10 seconds default
    batteryOptimized: true,
    stalenessThresholdMs: 60_000,
    minAccuracyMeters: 100,
    accuracyMode: 'high',
};

export interface GeofenceLogEntry {
    id: string;
    waypointId: string;
    waypointLabel: string;
    waypointType: RouteWaypoint['type'];
    event: 'entered' | 'exited';
    timestamp: number;
    coordinates: Coordinates;
    tripId: string;
    synced: boolean;
}

export const BATTERY_SAVING_INTERVAL = 30000; // 30 seconds