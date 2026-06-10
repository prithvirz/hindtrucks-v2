import { useState, useEffect, useCallback, useRef } from 'react';
import type { Coordinates, GeofenceStatus, GeofenceLogEntry } from '../types';

interface UseGeofenceMonitorReturn {
    log: GeofenceLogEntry[];
    addEntry: (entry: GeofenceLogEntry) => void;
    clearLog: () => void;
    unsyncedCount: number;
}

const GEOFENCE_LOG_STORAGE_KEY = 'hindtrucks_geofence_log';
const MAX_LOG_ENTRIES = 200;

function loadLogFromStorage(): GeofenceLogEntry[] {
    try {
        const raw = localStorage.getItem(GEOFENCE_LOG_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as GeofenceLogEntry[];
        return parsed.slice(-MAX_LOG_ENTRIES);
    } catch {
        return [];
    }
}

function saveLogToStorage(log: GeofenceLogEntry[]): void {
    try {
        const trimmed = log.slice(-MAX_LOG_ENTRIES);
        localStorage.setItem(GEOFENCE_LOG_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
        // localStorage unavailable — ignore
    }
}

/**
 * Monitors geofence enter/exit events and maintains an audit log.
 * Records each event with timestamp, coordinates, and waypoint details
 * for compliance reporting. Entries are persisted to localStorage.
 */
export function useGeofenceMonitor(tripId: string): UseGeofenceMonitorReturn {
    const [log, setLog] = useState<GeofenceLogEntry[]>(() => loadLogFromStorage());
    const prevStatusRef = useRef<GeofenceStatus | null>(null);

    // Persist log changes to localStorage
    useEffect(() => {
        saveLogToStorage(log);
    }, [log]);

    const addEntry = useCallback((entry: GeofenceLogEntry) => {
        setLog((prev) => [...prev, entry]);
    }, []);

    const clearLog = useCallback(() => {
        setLog([]);
        try {
            localStorage.removeItem(GEOFENCE_LOG_STORAGE_KEY);
        } catch {
            // ignore
        }
    }, []);

    const unsyncedCount = log.filter((e) => !e.synced).length;

    /**
     * Process geofence status changes to auto-generate log entries.
     * Call this whenever geofenceStatus changes from useRouteTracking.
     */
    const processGeofenceChange = useCallback(
        (currentStatus: GeofenceStatus, position: Coordinates) => {
            const prev = prevStatusRef.current;

            if (prev && currentStatus.justEntered && currentStatus.nearestWaypoint) {
                addEntry({
                    id: `gf-${Date.now()}-${currentStatus.nearestWaypoint.id}`,
                    waypointId: currentStatus.nearestWaypoint.id,
                    waypointLabel: currentStatus.nearestWaypoint.label,
                    waypointType: currentStatus.nearestWaypoint.type,
                    event: 'entered',
                    timestamp: Date.now(),
                    coordinates: position,
                    tripId,
                    synced: false,
                });
            }

            if (prev && currentStatus.justExited && currentStatus.nearestWaypoint) {
                addEntry({
                    id: `gf-${Date.now()}-${currentStatus.nearestWaypoint.id}`,
                    waypointId: currentStatus.nearestWaypoint.id,
                    waypointLabel: currentStatus.nearestWaypoint.label,
                    waypointType: currentStatus.nearestWaypoint.type,
                    event: 'exited',
                    timestamp: Date.now(),
                    coordinates: position,
                    tripId,
                    synced: false,
                });
            }

            prevStatusRef.current = currentStatus;
        },
        [addEntry, tripId],
    );

    return {
        log,
        addEntry,
        clearLog,
        unsyncedCount,
        processGeofenceChange,
    } as UseGeofenceMonitorReturn & { processGeofenceChange: (status: GeofenceStatus, position: Coordinates) => void };
}