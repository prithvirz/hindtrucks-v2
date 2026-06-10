import { renderHook, act } from '@testing-library/react';
import { useGeofenceMonitor } from './useGeofenceMonitor';
import type { GeofenceStatus, GeofenceLogEntry, Coordinates, RouteWaypoint } from '../types';

const tripId = 'trip-123';

const waypoint: RouteWaypoint = {
    id: 'wp-pickup-1',
    coordinates: { lat: 28.6, lng: 77.2, timestamp: Date.now() },
    label: 'Delhi Warehouse',
    type: 'pickup',
    geofenceRadius: 200,
    triggered: false,
};

const position: Coordinates = { lat: 28.6001, lng: 77.2001, timestamp: Date.now() };

const emptyGeofence: GeofenceStatus = {
    nearestWaypoint: null,
    distanceToNext: null,
    isWithinGeofence: false,
    isApproaching: false,
    justEntered: false,
    justExited: false,
    justApproaching: false,
};

describe('useGeofenceMonitor', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('starts with empty log', () => {
        const { result } = renderHook(() => useGeofenceMonitor(tripId));
        expect(result.current.log).toEqual([]);
        expect(result.current.unsyncedCount).toBe(0);
    });

    it('addEntry adds a log entry', () => {
        const { result } = renderHook(() => useGeofenceMonitor(tripId));
        const entry: GeofenceLogEntry = {
            id: 'gf-1',
            waypointId: waypoint.id,
            waypointLabel: waypoint.label,
            waypointType: waypoint.type,
            event: 'entered',
            timestamp: Date.now(),
            coordinates: position,
            tripId,
            synced: false,
        };
        act(() => {
            result.current.addEntry(entry);
        });
        expect(result.current.log.length).toBe(1);
        expect(result.current.log[0].event).toBe('entered');
        expect(result.current.unsyncedCount).toBe(1);
    });

    it('clearLog removes all entries', () => {
        const { result } = renderHook(() => useGeofenceMonitor(tripId));
        const entry: GeofenceLogEntry = {
            id: 'gf-1',
            waypointId: waypoint.id,
            waypointLabel: waypoint.label,
            waypointType: waypoint.type,
            event: 'entered',
            timestamp: Date.now(),
            coordinates: position,
            tripId,
            synced: false,
        };
        act(() => {
            result.current.addEntry(entry);
        });
        expect(result.current.log.length).toBe(1);

        act(() => {
            result.current.clearLog();
        });
        expect(result.current.log).toEqual([]);
        expect(result.current.unsyncedCount).toBe(0);
    });

    it('persists log to localStorage', () => {
        const { result } = renderHook(() => useGeofenceMonitor(tripId));
        const entry: GeofenceLogEntry = {
            id: 'gf-1',
            waypointId: waypoint.id,
            waypointLabel: waypoint.label,
            waypointType: waypoint.type,
            event: 'entered',
            timestamp: Date.now(),
            coordinates: position,
            tripId,
            synced: false,
        };
        act(() => {
            result.current.addEntry(entry);
        });

        // Check localStorage was written
        const stored = localStorage.getItem('hindtrucks_geofence_log');
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.length).toBe(1);
    });

    it('restores log from localStorage on mount', () => {
        // Pre-populate localStorage
        const existingEntry: GeofenceLogEntry = {
            id: 'gf-existing',
            waypointId: 'wp-1',
            waypointLabel: 'Test',
            waypointType: 'pickup',
            event: 'entered',
            timestamp: Date.now(),
            coordinates: position,
            tripId,
            synced: true,
        };
        localStorage.setItem('hindtrucks_geofence_log', JSON.stringify([existingEntry]));

        const { result } = renderHook(() => useGeofenceMonitor(tripId));
        expect(result.current.log.length).toBe(1);
        expect(result.current.log[0].id).toBe('gf-existing');
        expect(result.current.unsyncedCount).toBe(0); // already synced
    });

    it('counts unsynced entries correctly', () => {
        const { result } = renderHook(() => useGeofenceMonitor(tripId));
        act(() => {
            result.current.addEntry({
                id: 'gf-1',
                waypointId: waypoint.id,
                waypointLabel: waypoint.label,
                waypointType: waypoint.type,
                event: 'entered',
                timestamp: Date.now(),
                coordinates: position,
                tripId,
                synced: false,
            });
        });
        act(() => {
            result.current.addEntry({
                id: 'gf-2',
                waypointId: waypoint.id,
                waypointLabel: waypoint.label,
                waypointType: waypoint.type,
                event: 'exited',
                timestamp: Date.now(),
                coordinates: position,
                tripId,
                synced: true,
            });
        });
        expect(result.current.unsyncedCount).toBe(1);
    });

    it('processGeofenceChange logs entered event', () => {
        const { result } = renderHook(() => useGeofenceMonitor(tripId));

        // First call: set prevStatus
        const enteredStatus: GeofenceStatus = {
            ...emptyGeofence,
            nearestWaypoint: waypoint,
            distanceToNext: 50,
            isWithinGeofence: true,
            justEntered: true,
        };

        // Need to call processGeofenceChange twice — first to set prev, second to trigger
        // First call sets prevStatusRef but won't log (prev is null)
        act(() => {
            (result.current as any).processGeofenceChange(emptyGeofence, position);
        });

        // Second call: now prev is set, justEntered triggers log
        act(() => {
            (result.current as any).processGeofenceChange(enteredStatus, position);
        });

        expect(result.current.log.length).toBe(1);
        expect(result.current.log[0].event).toBe('entered');
        expect(result.current.log[0].waypointId).toBe(waypoint.id);
    });

    it('processGeofenceChange logs exited event', () => {
        const { result } = renderHook(() => useGeofenceMonitor(tripId));

        // Set prev to inside geofence
        const insideStatus: GeofenceStatus = {
            ...emptyGeofence,
            nearestWaypoint: waypoint,
            distanceToNext: 50,
            isWithinGeofence: true,
        };

        act(() => {
            (result.current as any).processGeofenceChange(insideStatus, position);
        });

        // Now exit
        const exitedStatus: GeofenceStatus = {
            ...emptyGeofence,
            nearestWaypoint: waypoint,
            distanceToNext: 500,
            isWithinGeofence: false,
            justExited: true,
        };

        act(() => {
            (result.current as any).processGeofenceChange(exitedStatus, position);
        });

        expect(result.current.log.length).toBe(1);
        expect(result.current.log[0].event).toBe('exited');
    });
});