import type { Coordinates } from '../types';

// Free public OSRM server. Fine for demo/light use; NOT for production scale.
// Isolated here so we can swap to a paid routing provider later without
// touching callers.
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

export interface RouteResult {
    /** Road-following path as a list of coordinates (origin → destination). */
    path: Coordinates[];
    /** Total driving distance in metres (null if unknown). */
    distanceMeters: number | null;
    /** Estimated driving duration in seconds (null if unknown). */
    durationSeconds: number | null;
    /** True when the road service was unreachable and we fell back. */
    isFallback: boolean;
}

function straightLine(from: Coordinates, to: Coordinates): RouteResult {
    return {
        path: [from, to],
        distanceMeters: null,
        durationSeconds: null,
        isFallback: true,
    };
}

/**
 * Fetch the real driving route (following roads) between two points from OSRM.
 * On any failure — offline, rate limit, server down — returns a straight-line
 * fallback so the map always has something to draw.
 */
export async function getRoadRoute(from: Coordinates, to: Coordinates): Promise<RouteResult> {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;

    try {
        const res = await fetch(url);
        if (!res.ok) return straightLine(from, to);

        const data = (await res.json()) as {
            code: string;
            routes?: Array<{
                distance: number;
                duration: number;
                geometry: { coordinates: [number, number][] };
            }>;
        };

        const route = data.routes?.[0];
        if (data.code !== 'Ok' || !route || route.geometry.coordinates.length < 2) {
            return straightLine(from, to);
        }

        const ts = Date.now();
        // GeoJSON is [lng, lat]; our Coordinates are { lat, lng }.
        const path: Coordinates[] = route.geometry.coordinates.map(([lng, lat]) => ({
            lat,
            lng,
            timestamp: ts,
        }));

        return {
            path,
            distanceMeters: route.distance,
            durationSeconds: route.duration,
            isFallback: false,
        };
    } catch {
        return straightLine(from, to);
    }
}
