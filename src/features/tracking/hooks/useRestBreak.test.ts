import { renderHook, act } from '@testing-library/react';
import { useRestBreak } from './useRestBreak';
import type { Coordinates } from '../types';

function makeCoord(lat: number, lng: number, timestamp?: number): Coordinates {
    return { lat, lng, timestamp: timestamp ?? Date.now() };
}

describe('useRestBreak', () => {
    it('returns not stopped when speed is null', () => {
        const { result } = renderHook(() => useRestBreak(null, null));
        expect(result.current.isStopped).toBe(false);
        expect(result.current.stoppedDurationMinutes).toBeNull();
        expect(result.current.restBreakEvents).toEqual([]);
    });

    it('returns not stopped when speed is above threshold', () => {
        const pos = makeCoord(28.6, 77.2);
        const { result } = renderHook(() => useRestBreak(pos, 50));
        expect(result.current.isStopped).toBe(false);
    });

    it('detects stopped state when speed < 3 km/h', async () => {
        const pos = makeCoord(28.6, 77.2);
        const { result } = renderHook(() => useRestBreak(pos, 2));
        // Flush effect-driven state updates
        await act(async () => { });
        expect(result.current.isStopped).toBe(true);
        expect(result.current.stoppedDurationMinutes).toBeCloseTo(0, 2);
    });

    it('detects stopped state when speed is exactly 0', async () => {
        const pos = makeCoord(28.6, 77.2);
        const { result } = renderHook(() => useRestBreak(pos, 0));
        await act(async () => { });
        expect(result.current.isStopped).toBe(true);
    });

    it('transitions from stopped to moving and logs event', () => {
        // Fake timers for Date only — hook uses Date.now() for stopStartTime
        vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date', 'performance'] });
        const pos1 = makeCoord(28.6, 77.2);
        const { result, rerender } = renderHook(
            ({ pos, speed }) => useRestBreak(pos, speed),
            { initialProps: { pos: pos1, speed: 0 } },
        );
        // Flush initial effect
        act(() => { });
        expect(result.current.isStopped).toBe(true);

        // Advance time by 2 minutes so Date.now() - stopStartTimeRef >= 1 min
        act(() => {
            vi.advanceTimersByTime(120_000);
        });

        // Now start moving
        const pos2 = makeCoord(28.6001, 77.2001);
        rerender({ pos: pos2, speed: 30 });
        expect(result.current.isStopped).toBe(false);
        // Should have logged a stopped + moving event pair
        expect(result.current.restBreakEvents.length).toBeGreaterThanOrEqual(2);
        const stoppedEvent = result.current.restBreakEvents.find(e => e.type === 'stopped');
        const movingEvent = result.current.restBreakEvents.find(e => e.type === 'moving');
        expect(stoppedEvent).toBeDefined();
        expect(movingEvent).toBeDefined();
        expect(stoppedEvent!.durationMinutes).toBeGreaterThan(0);
        expect(movingEvent!.durationMinutes).toBeNull();
        vi.useRealTimers();
    });

    it('does not log event for stops shorter than 1 minute', () => {
        const pos1 = makeCoord(28.6, 77.2);
        const { result, rerender } = renderHook(
            ({ pos, speed }) => useRestBreak(pos, speed),
            { initialProps: { pos: pos1, speed: 0 } },
        );

        // Start moving immediately — duration ~0 < 1 min threshold
        const pos2 = makeCoord(28.6001, 77.2001);
        rerender({ pos: pos2, speed: 30 });
        expect(result.current.isStopped).toBe(false);
        expect(result.current.restBreakEvents).toEqual([]);
    });

    it('clearEvents resets the events array', () => {
        const pos = makeCoord(28.6, 77.2);
        const { result } = renderHook(() => useRestBreak(pos, 0));
        act(() => {
            result.current.clearEvents();
        });
        expect(result.current.restBreakEvents).toEqual([]);
    });

    it('ignores null position', () => {
        const { result } = renderHook(() => useRestBreak(null, 0));
        expect(result.current.isStopped).toBe(false);
    });
});