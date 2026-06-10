import { useState, useEffect, useCallback, useRef } from 'react';
import type { Coordinates } from '../types';

interface SpeedAlert {
    type: 'overspeeding' | 'normal';
    speedKmh: number;
    timestamp: number;
}

interface UseSpeedMonitorReturn {
    currentSpeedKmh: number | null;
    isOverspeeding: boolean;
    overspeedingAlerts: SpeedAlert[];
    clearAlerts: () => void;
}

const OVERSPEED_THRESHOLD_KMH = 80; // Indian truck regulation
const ALERT_COOLDOWN_MS = 30_000;   // 30s cooldown between overspeeding alerts

/**
 * Monitors driver speed and alerts on overspeeding (>80 km/h for trucks).
 * Indian truck regulations mandate 80 km/h max speed for heavy vehicles.
 * Alerts are debounced with a 30s cooldown to prevent notification spam.
 */
export function useSpeedMonitor(positions: Coordinates[]): UseSpeedMonitorReturn {
    const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number | null>(null);
    const [isOverspeeding, setIsOverspeeding] = useState(false);
    const [overspeedingAlerts, setOverspeedingAlerts] = useState<SpeedAlert[]>([]);
    const lastAlertTimeRef = useRef(0);

    // Calculate speed from position updates
    useEffect(() => {
        if (positions.length === 0) return;

        const latest = positions[positions.length - 1];

        // Use reported speed if available (from GPS)
        if (latest.speed != null && latest.speed > 0) {
            const speedKmh = latest.speed * 3.6; // m/s → km/h
            setCurrentSpeedKmh(speedKmh);

            const over = speedKmh > OVERSPEED_THRESHOLD_KMH;
            setIsOverspeeding(over);

            // Debounced overspeeding alert
            if (over && Date.now() - lastAlertTimeRef.current > ALERT_COOLDOWN_MS) {
                lastAlertTimeRef.current = Date.now();
                setOverspeedingAlerts((prev) => [
                    ...prev.slice(-20), // Keep last 20 alerts
                    { type: 'overspeeding', speedKmh, timestamp: Date.now() },
                ]);
            }

            // Clear overspeeding state when speed drops below threshold
            if (!over && isOverspeeding) {
                setIsOverspeeding(false);
            }
            return;
        }

        // Fallback: calculate speed from consecutive positions
        if (positions.length >= 2) {
            const prev = positions[positions.length - 2];
            const curr = latest;
            const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds

            if (timeDiff > 0 && timeDiff < 300) { // Max 5 min gap between fixes
                // Haversine distance
                const R = 6371000;
                const dLat = ((curr.lat - prev.lat) * Math.PI) / 180;
                const dLng = ((curr.lng - prev.lng) * Math.PI) / 180;
                const lat1 = (prev.lat * Math.PI) / 180;
                const lat2 = (curr.lat * Math.PI) / 180;
                const aa = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
                const dist = R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));

                const speedMs = dist / timeDiff;
                const speedKmh = speedMs * 3.6;
                setCurrentSpeedKmh(speedKmh);

                const over = speedKmh > OVERSPEED_THRESHOLD_KMH;
                setIsOverspeeding(over);

                if (over && Date.now() - lastAlertTimeRef.current > ALERT_COOLDOWN_MS) {
                    lastAlertTimeRef.current = Date.now();
                    setOverspeedingAlerts((prev) => [
                        ...prev.slice(-20),
                        { type: 'overspeeding', speedKmh, timestamp: Date.now() },
                    ]);
                }
            }
        }
    }, [positions, isOverspeeding]);

    const clearAlerts = useCallback(() => {
        setOverspeedingAlerts([]);
    }, []);

    return {
        currentSpeedKmh,
        isOverspeeding,
        overspeedingAlerts,
        clearAlerts,
    };
}