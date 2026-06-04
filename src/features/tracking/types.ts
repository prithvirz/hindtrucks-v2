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
    justEntered: boolean;
    justExited: boolean;
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
}

export interface TrackingConfig {
    highAccuracy: boolean;
    intervalMs: number; // GPS poll interval
    batteryOptimized: boolean;
    onWaypointEnter?: (waypoint: RouteWaypoint) => void;
    onWaypointExit?: (waypoint: RouteWaypoint) => void;
}

export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
    highAccuracy: true,
    intervalMs: 10000, // 10 seconds default
    batteryOptimized: true,
};

export const BATTERY_SAVING_INTERVAL = 30000; // 30 seconds