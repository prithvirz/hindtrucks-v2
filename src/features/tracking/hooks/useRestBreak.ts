import { useState, useEffect, useCallback, useRef } from 'react';
import type { Coordinates } from '../types';

interface RestBreakEvent {
    type: 'stopped' | 'moving';
    timestamp: number;
    coordinates: Coordinates;
    durationMinutes: number | null; // null for 'moving' events
}

interface UseRestBreakReturn {
    isStopped: boolean;
    stoppedDurationMinutes: number | null;
    restBreakEvents: RestBreakEvent[];
    clearEvents: () => void;
}

const STOP_THRESHOLD_KMH = 3;     // Below 3 km/h = stopped
const REST_BREAK_THRESHOLD_MIN = 15; // 15 min = rest break detected
const CHECK_INTERVAL_MS = 60_000;  // Check every minute

/**
 * Detects rest breaks when the driver is stopped for >15 minutes.
 * Indian truck regulations require rest breaks for driver safety.
 * Monitors speed from position updates and tracks stop/move transitions.
 */
export function useRestBreak(position: Coordinates | null, speedKmh: number | null): UseRestBreakReturn {
    const [isStopped, setIsStopped] = useState(false);
    const [stoppedDurationMinutes, setStoppedDurationMinutes] = useState<number | null>(null);
    const [restBreakEvents, setRestBreakEvents] = useState<RestBreakEvent[]>([]);
    const stopStartTimeRef = useRef<number | null>(null);
    const stopPositionRef = useRef<Coordinates | null>(null);

    // Detect stopped state from speed
    useEffect(() => {
        if (!position) return;

        const stopped = speedKmh != null ? speedKmh < STOP_THRESHOLD_KMH : false;

        if (stopped && !isStopped) {
            // Transition: moving → stopped
            setIsStopped(true);
            stopStartTimeRef.current = Date.now();
            stopPositionRef.current = position;
            setStoppedDurationMinutes(0);
        } else if (!stopped && isStopped) {
            // Transition: stopped → moving
            setIsStopped(false);
            const stopDuration = stopStartTimeRef.current
                ? (Date.now() - stopStartTimeRef.current) / 60_000
                : 0;

            // Only log if stopped for >1 minute (avoid GPS jitter noise)
            if (stopDuration >= 1 && stopPositionRef.current) {
                setRestBreakEvents((prev) => [
                    ...prev.slice(-50), // Keep last 50 events
                    {
                        type: 'stopped',
                        timestamp: stopStartTimeRef.current!,
                        coordinates: stopPositionRef.current!,
                        durationMinutes: stopDuration,
                    },
                    {
                        type: 'moving',
                        timestamp: Date.now(),
                        coordinates: position,
                        durationMinutes: null,
                    },
                ]);
            }

            stopStartTimeRef.current = null;
            stopPositionRef.current = null;
            setStoppedDurationMinutes(null);
        }
    }, [position, speedKmh, isStopped]);

    // Update stopped duration timer
    useEffect(() => {
        if (!isStopped || stopStartTimeRef.current === null) return;

        const updateDuration = () => {
            const minutes = (Date.now() - stopStartTimeRef.current!) / 60_000;
            setStoppedDurationMinutes(minutes);

            // Auto-record rest break event when threshold crossed
            if (minutes >= REST_BREAK_THRESHOLD_MIN && stopPositionRef.current) {
                const alreadyLogged = restBreakEvents.some(
                    (e) => e.type === 'stopped' && e.timestamp === stopStartTimeRef.current!,
                );
                if (!alreadyLogged) {
                    setRestBreakEvents((prev) => [
                        ...prev.slice(-50),
                        {
                            type: 'stopped',
                            timestamp: stopStartTimeRef.current!,
                            coordinates: stopPositionRef.current!,
                            durationMinutes: minutes,
                        },
                    ]);
                }
            }
        };

        updateDuration();
        const timer = setInterval(updateDuration, CHECK_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [isStopped, restBreakEvents]);

    const clearEvents = useCallback(() => {
        setRestBreakEvents([]);
    }, []);

    return {
        isStopped,
        stoppedDurationMinutes,
        restBreakEvents,
        clearEvents,
    };
}