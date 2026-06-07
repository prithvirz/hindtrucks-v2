import type { Coordinates } from '../types';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

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

export async function getRouteWithSteps(from: Coordinates, to: Coordinates): Promise<RouteWithSteps> {
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
