import type { Coordinates } from '../types';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// OpenRouteService (primary when a key is configured). 'driving-hgv' = heavy
// goods vehicle, so routes avoid roads trucks legally/physically can't use.
const ORS_KEY = import.meta.env.VITE_ORS_API_KEY as string | undefined;
const ORS_BASE = 'https://api.openrouteservice.org/v2/directions/driving-hgv';

export interface RouteResult {
    path: Coordinates[];
    distanceMeters: number | null;
    durationSeconds: number | null;
    isFallback: boolean;
}

export interface RouteStep {
    instruction: string;
    distanceMeters: number;
    durationSeconds: number;
    maneuver: 'turn-left' | 'turn-right' | 'straight' | 'roundabout' | 'arrive' | 'depart' | 'other';
    streetName: string;
}

export interface RouteWithSteps extends RouteResult {
    steps: RouteStep[];
}

function straightLine(from: Coordinates, to: Coordinates): RouteResult {
    return {
        path: [from, to],
        distanceMeters: null,
        durationSeconds: null,
        isFallback: true,
    };
}

function osrmTypeToManeuver(type: string, modifier?: string): RouteStep['maneuver'] {
    if (type === 'arrive') return 'arrive';
    if (type === 'depart') return 'depart';
    if (type === 'roundabout' || type === 'rotary') return 'roundabout';
    if (modifier === 'left' || modifier === 'sharp left' || modifier === 'slight left') return 'turn-left';
    if (modifier === 'right' || modifier === 'sharp right' || modifier === 'slight right') return 'turn-right';
    if (modifier === 'straight') return 'straight';
    return 'other';
}

function buildInstruction(type: string, modifier?: string, street?: string): string {
    const on = street ? ` on ${street}` : '';
    if (type === 'depart') return `Head ${modifier ?? 'forward'}${on}`;
    if (type === 'arrive') return 'You have arrived';
    if (type === 'roundabout' || type === 'rotary') return `Take the roundabout${on}`;
    if (modifier === 'left') return `Turn left${on}`;
    if (modifier === 'sharp left') return `Turn sharp left${on}`;
    if (modifier === 'slight left') return `Keep left${on}`;
    if (modifier === 'right') return `Turn right${on}`;
    if (modifier === 'sharp right') return `Turn sharp right${on}`;
    if (modifier === 'slight right') return `Keep right${on}`;
    if (modifier === 'straight') return `Continue straight${on}`;
    if (modifier === 'uturn') return `Make a U-turn${on}`;
    return `Continue${on}`;
}

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
        const path: Coordinates[] = route.geometry.coordinates.map(([lng, lat]) => ({
            lat, lng, timestamp: ts,
        }));

        return { path, distanceMeters: route.distance, durationSeconds: route.duration, isFallback: false };
    } catch {
        return straightLine(from, to);
    }
}

// OpenRouteService instruction-type codes → our maneuver enum.
function orsTypeToManeuver(type: number): RouteStep['maneuver'] {
    switch (type) {
        case 0: case 2: case 4: case 12: return 'turn-left';   // left / sharp left / slight left / keep left
        case 1: case 3: case 5: case 13: return 'turn-right';  // right / sharp right / slight right / keep right
        case 6: return 'straight';
        case 7: case 8: return 'roundabout';                   // enter / exit roundabout
        case 10: return 'arrive';
        case 11: return 'depart';
        default: return 'other';
    }
}

async function getRouteWithStepsORS(from: Coordinates, to: Coordinates): Promise<RouteWithSteps | null> {
    if (!ORS_KEY) return null;
    const url = `${ORS_BASE}?api_key=${ORS_KEY}&start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = (await res.json()) as {
            features?: Array<{
                geometry: { coordinates: [number, number][] };
                properties: {
                    summary?: { distance?: number; duration?: number };
                    segments?: Array<{
                        steps?: Array<{
                            distance: number;
                            duration: number;
                            type: number;
                            instruction: string;
                            name?: string;
                        }>;
                    }>;
                };
            }>;
        };

        const feature = data.features?.[0];
        if (!feature || !feature.geometry?.coordinates || feature.geometry.coordinates.length < 2) {
            return null;
        }

        const ts = Date.now();
        const path: Coordinates[] = feature.geometry.coordinates.map(([lng, lat]) => ({ lat, lng, timestamp: ts }));

        const steps: RouteStep[] = (feature.properties.segments ?? []).flatMap((seg) =>
            (seg.steps ?? []).map((s) => ({
                instruction: s.instruction || 'Continue',
                distanceMeters: s.distance ?? 0,
                durationSeconds: s.duration ?? 0,
                maneuver: orsTypeToManeuver(s.type),
                streetName: s.name && s.name !== '-' ? s.name : '',
            })),
        );

        return {
            path,
            distanceMeters: feature.properties.summary?.distance ?? null,
            durationSeconds: feature.properties.summary?.duration ?? null,
            isFallback: false,
            steps,
        };
    } catch {
        return null;
    }
}

export async function getRouteWithSteps(from: Coordinates, to: Coordinates): Promise<RouteWithSteps> {
    // Prefer OpenRouteService when a key is configured; fall back to OSRM, then
    // to a straight line, so routing degrades gracefully.
    const ors = await getRouteWithStepsORS(from, to);
    if (ors) return ors;

    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson&steps=true&annotations=false`;

    try {
        const res = await fetch(url);
        if (!res.ok) return { ...straightLine(from, to), steps: [] };

        const data = (await res.json()) as {
            code: string;
            routes?: Array<{
                distance: number;
                duration: number;
                geometry: { coordinates: [number, number][] };
                legs: Array<{
                    steps: Array<{
                        distance: number;
                        duration: number;
                        name: string;
                        maneuver: { type: string; modifier?: string };
                    }>;
                }>;
            }>;
        };

        const route = data.routes?.[0];
        if (data.code !== 'Ok' || !route) return { ...straightLine(from, to), steps: [] };

        const ts = Date.now();
        const path: Coordinates[] = route.geometry.coordinates.map(([lng, lat]) => ({
            lat, lng, timestamp: ts,
        }));

        const steps: RouteStep[] = route.legs.flatMap((leg) =>
            leg.steps.map((s) => ({
                instruction: buildInstruction(s.maneuver.type, s.maneuver.modifier, s.name || undefined),
                distanceMeters: s.distance,
                durationSeconds: s.duration,
                maneuver: osrmTypeToManeuver(s.maneuver.type, s.maneuver.modifier),
                streetName: s.name,
            }))
        );

        return {
            path,
            distanceMeters: route.distance,
            durationSeconds: route.duration,
            isFallback: false,
            steps,
        };
    } catch {
        return { ...straightLine(from, to), steps: [] };
    }
}
