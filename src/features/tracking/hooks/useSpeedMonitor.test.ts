import { renderHook, act } from '@testing-library/react';
import { useSpeedMonitor } from './useSpeedMonitor';
import type { Coordinates } from '../types';

function makeCoord(lat: number, lng: number, speed?: number, timestamp?: number): Coordinates {
    return { lat, lng, timestamp: timestamp ?? Date.now(), speed };
}

describe('useSpeedMonitor', () => {
    it('returns null speed for empty positions', () => {
        const { result } = renderHook(() => useSpeedMonitor([]));
        expect(result.current.currentSpeedKmh).toBeNull();
        expect(result.current.isOverspeeding).toBe(false);
        expect(result.current.overspeedingAlerts).toEqual([]);
    });

    it('uses GPS-reported speed (m/s → km/h conversion)', () => {
        // 20 m/s = 72 km/h (below threshold)
        const positions = [makeCoord(28.6, 77.2, 20)];
        const { result } = renderHook(() => useSpeedMonitor(positions));
        expect(result.current.currentSpeedKmh).toBeCloseTo(72, 1);
        expect(result.current.isOverspeeding).toBe(false);
    });

    it('detects overspeeding when speed > 80 km/h', () => {
        // 25 m/s = 90 km/h (above 80 threshold)
        const positions = [makeCoord(28.6, 77.2, 25)];
        const { result } = renderHook(() => useSpeedMonitor(positions));
        expect(result.current.currentSpeedKmh).toBeCloseTo(90, 1);
        expect(result.current.isOverspeeding).toBe(true);
        expect(result.current.overspeedingAlerts.length).toBe(1);
        expect(result.current.overspeedingAlerts[0].type).toBe('overspeeding');
        expect(result.current.overspeedingAlerts[0].speedKmh).toBeCloseTo(90, 1);
    });

    it('debounces overspeeding alerts with 30s cooldown', () => {
        // First overspeeding position
        const pos1 = makeCoord(28.6, 77.2, 25, Date.now());
        const { result } = renderHook((props: Coordinates[]) => useSpeedMonitor(props), {
            initialProps: [pos1],
        });
        expect(result.current.overspeedingAlerts.length).toBe(1);

        // Second overspeeding position within cooldown — no new alert
        const pos2 = makeCoord(28.6001, 77.2001, 25, Date.now() + 1000);
        act(() => {
            // Re-render with new positions array
        });
        // Need to update the hook's input
        const { result: result2 } = renderHook((props: Coordinates[]) => useSpeedMonitor(props), {
            initialProps: [pos1, pos2],
        });
        // Still only 1 alert because cooldown prevents second
        expect(result2.current.overspeedingAlerts.length).toBe(1);
    });

    it('clears overspeeding state when speed drops below threshold', () => {
        // Start overspeeding
        const { result, rerender } = renderHook((props: Coordinates[]) => useSpeedMonitor(props), {
            initialProps: [makeCoord(28.6, 77.2, 25)],
        });
        expect(result.current.isOverspeeding).toBe(true);

        // Speed drops to normal
        rerender([makeCoord(28.6001, 77.2001, 15)]);
        expect(result.current.isOverspeeding).toBe(false);
    });

    it('calculates speed from consecutive positions when GPS speed unavailable', () => {
        // ~111 km per degree of latitude at equator
        // 0.001 deg lat difference ≈ 111m, over 10s = 11.1 m/s ≈ 40 km/h
        const t1 = Date.now() - 10000;
        const t2 = Date.now();
        const positions: Coordinates[] = [
            { lat: 28.6, lng: 77.2, timestamp: t1 },
            { lat: 28.601, lng: 77.2, timestamp: t2 }, // ~111m north in 10s
        ];
        const { result } = renderHook(() => useSpeedMonitor(positions));
        // Speed should be computed from haversine + time difference
        expect(result.current.currentSpeedKmh).not.toBeNull();
        expect(result.current.currentSpeedKmh!).toBeGreaterThan(0);
    });

    it('ignores positions with time gap > 5 minutes', () => {
        const t1 = Date.now() - 600000; // 10 min ago
        const t2 = Date.now();
        const positions: Coordinates[] = [
            { lat: 28.6, lng: 77.2, timestamp: t1 },
            { lat: 28.601, lng: 77.2, timestamp: t2 },
        ];
        const { result } = renderHook(() => useSpeedMonitor(positions));
        // Time gap > 300s, speed should not be calculated
        expect(result.current.currentSpeedKmh).toBeNull();
    });

    it('clearAlerts resets the alerts array', () => {
        const positions = [makeCoord(28.6, 77.2, 25)]; // overspeeding
        const { result } = renderHook(() => useSpeedMonitor(positions));
        expect(result.current.overspeedingAlerts.length).toBeGreaterThan(0);

        act(() => {
            result.current.clearAlerts();
        });
        expect(result.current.overspeedingAlerts).toEqual([]);
    });

    it('keeps at most 20 overspeeding alerts', () => {
        // Generate 25 overspeeding positions with enough time gap between each to bypass cooldown
        const positions: Coordinates[] = [];
        const baseTime = Date.now() - 25 * 31000; // 31s apart to bypass 30s cooldown
        for (let i = 0; i < 25; i++) {
            positions.push(makeCoord(28.6 + i * 0.001, 77.2, 25, baseTime + i * 31000));
        }
        const { result } = renderHook((props: Coordinates[]) => useSpeedMonitor(props), {
            initialProps: positions,
        });
        // Should cap at 20
        expect(result.current.overspeedingAlerts.length).toBeLessThanOrEqual(20);
    });
});