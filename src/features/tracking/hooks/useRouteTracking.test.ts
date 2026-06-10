import { computeRouteProgress, computeGeofenceStatus } from './useRouteTracking';
import type { Coordinates, RouteWaypoint, GeofenceStatus } from '../types';

// ─── Pure function tests ───

describe('computeRouteProgress', () => {
    const routePath: Coordinates[] = [
        { lat: 28.0, lng: 77.0, timestamp: 0 },
        { lat: 28.5, lng: 77.5, timestamp: 0 },
        { lat: 29.0, lng: 78.0, timestamp: 0 },
    ];

    it('returns 0 progress for empty route', () => {
        const pos: Coordinates = { lat: 28.6, lng: 77.2, timestamp: 0 };
        const result = computeRouteProgress(pos, []);
        expect(result.progressPct).toBe(0);
        expect(result.distanceRemaining).toBe(0);
        expect(result.nearestIndex).toBe(0);
    });

    it('returns 0 progress at route start', () => {
        const pos: Coordinates = { lat: 28.0, lng: 77.0, timestamp: 0 };
        const result = computeRouteProgress(pos, routePath);
        expect(result.progressPct).toBeCloseTo(0, 1);
        expect(result.nearestIndex).toBe(0);
    });

    it('returns ~100% progress at route end', () => {
        const pos: Coordinates = { lat: 29.0, lng: 78.0, timestamp: 0 };
        const result = computeRouteProgress(pos, routePath);
        expect(result.progressPct).toBeCloseTo(100, 0);
        expect(result.nearestIndex).toBe(2);
    });

    it('returns ~50% progress at midpoint', () => {
        const pos: Coordinates = { lat: 28.5, lng: 77.5, timestamp: 0 };
        const result = computeRouteProgress(pos, routePath);
        expect(result.progressPct).toBeCloseTo(50, 0);
        expect(result.nearestIndex).toBe(1);
    });

    it('calculates distance remaining from nearest point to end', () => {
        const pos: Coordinates = { lat: 28.0, lng: 77.0, timestamp: 0 };
        const result = computeRouteProgress(pos, routePath);
        // distanceRemaining should be total route distance when at start
        expect(result.distanceRemaining).toBeGreaterThan(0);
    });
});

describe('computeGeofenceStatus', () => {
    const waypoint: RouteWaypoint = {
        id: 'wp-1',
        coordinates: { lat: 28.6, lng: 77.2, timestamp: 0 },
        label: 'Test WP',
        type: 'pickup',
        geofenceRadius: 200,
        triggered: false,
    };

    const emptyPrev: GeofenceStatus = {
        nearestWaypoint: null,
        distanceToNext: null,
        isWithinGeofence: false,
        isApproaching: false,
        justEntered: false,
        justExited: false,
        justApproaching: false,
    };

    it('returns empty status for no waypoints', () => {
        const pos: Coordinates = { lat: 28.6, lng: 77.2, timestamp: 0 };
        const result = computeGeofenceStatus(pos, [], emptyPrev, 0);
        expect(result.isWithinGeofence).toBe(false);
        expect(result.isApproaching).toBe(false);
        expect(result.nearestWaypoint).toBeNull();
    });

    it('detects within geofence when distance <= radius', () => {
        // Position very close to waypoint (within 200m)
        const pos: Coordinates = { lat: 28.6001, lng: 77.2001, timestamp: 0 };
        const result = computeGeofenceStatus(pos, [waypoint], emptyPrev, 0);
        expect(result.isWithinGeofence).toBe(true);
        expect(result.nearestWaypoint?.id).toBe('wp-1');
        expect(result.justEntered).toBe(true);
    });

    it('detects approaching when distance <= 2× radius but > radius', () => {
        // Position ~300m from waypoint (between 200m and 400m)
        const pos: Coordinates = { lat: 28.6027, lng: 77.2027, timestamp: 0 };
        const result = computeGeofenceStatus(pos, [waypoint], emptyPrev, 0);
        expect(result.isWithinGeofence).toBe(false);
        expect(result.isApproaching).toBe(true);
        expect(result.justApproaching).toBe(true);
    });

    it('detects outside geofence when distance > 2× radius', () => {
        // Position far from waypoint (> 400m)
        const pos: Coordinates = { lat: 28.61, lng: 77.21, timestamp: 0 };
        const result = computeGeofenceStatus(pos, [waypoint], emptyPrev, 0);
        expect(result.isWithinGeofence).toBe(false);
        expect(result.isApproaching).toBe(false);
    });

    it('sets justEntered when crossing from outside into geofence', () => {
        const prevInside: GeofenceStatus = {
            ...emptyPrev,
            isWithinGeofence: false,
            isApproaching: true,
            nearestWaypoint: waypoint,
            distanceToNext: 300,
        };
        const pos: Coordinates = { lat: 28.6001, lng: 77.2001, timestamp: 0 };
        const result = computeGeofenceStatus(pos, [waypoint], prevInside, 0);
        expect(result.justEntered).toBe(true);
        expect(result.isWithinGeofence).toBe(true);
    });

    it('does not set justEntered when already inside geofence', () => {
        const prevInside: GeofenceStatus = {
            ...emptyPrev,
            isWithinGeofence: true,
            nearestWaypoint: waypoint,
            distanceToNext: 50,
        };
        const pos: Coordinates = { lat: 28.6001, lng: 77.2001, timestamp: 0 };
        const result = computeGeofenceStatus(pos, [waypoint], prevInside, 0);
        expect(result.justEntered).toBe(false);
        expect(result.isWithinGeofence).toBe(true);
    });

    it('debounces exit — requires 3+ consecutive outside positions', () => {
        const prevInside: GeofenceStatus = {
            ...emptyPrev,
            isWithinGeofence: true,
            nearestWaypoint: waypoint,
            distanceToNext: 50,
        };
        // Position outside geofence
        const pos: Coordinates = { lat: 28.61, lng: 77.21, timestamp: 0 };

        // 1st outside position (debounceCount=0) — not yet exited
        const result1 = computeGeofenceStatus(pos, [waypoint], prevInside, 0);
        expect(result1.justExited).toBe(false);

        // 2nd outside position (debounceCount=1) — keep isWithinGeofence=true so wasInGeofence=true
        const result2 = computeGeofenceStatus(pos, [waypoint], { ...result1, isWithinGeofence: true }, 1);
        expect(result2.justExited).toBe(false);

        // 3rd outside position (debounceCount=2) — keep isWithinGeofence=true so wasInGeofence=true
        const result3 = computeGeofenceStatus(pos, [waypoint], { ...result2, isWithinGeofence: true }, 2);
        expect(result3.justExited).toBe(true);
    });

    it('sets justApproaching when crossing from outside into 2× radius', () => {
        // Start from outside (far away)
        const prevOutside: GeofenceStatus = {
            ...emptyPrev,
            isApproaching: false,
            nearestWaypoint: waypoint,
            distanceToNext: 500,
        };
        // Move to approaching zone (~300m, within 2×radius=400m but outside 1×radius=200m)
        const pos: Coordinates = { lat: 28.6027, lng: 77.2027, timestamp: 0 };
        const result = computeGeofenceStatus(pos, [waypoint], prevOutside, 0);
        expect(result.justApproaching).toBe(true);
        expect(result.isApproaching).toBe(true);
    });
});