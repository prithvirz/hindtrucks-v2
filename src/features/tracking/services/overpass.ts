import type { Coordinates } from '../types';

export type PoiCategory = 'fuel' | 'dhaba' | 'toll';

export interface RoutePoI {
  id: string;
  category: PoiCategory;
  name: string;
  lat: number;
  lng: number;
  distanceAlongRouteMeters?: number;
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Expand route bounding box by ~20km to catch nearby POIs
function routeBbox(path: Coordinates[], padDeg = 0.18): string {
  const lats = path.map((c) => c.lat);
  const lngs = path.map((c) => c.lng);
  const s = Math.min(...lats) - padDeg;
  const n = Math.max(...lats) + padDeg;
  const w = Math.min(...lngs) - padDeg;
  const e = Math.max(...lngs) + padDeg;
  return `${s},${w},${n},${e}`;
}

export async function fetchPoisAlongRoute(path: Coordinates[]): Promise<RoutePoI[]> {
  if (path.length < 2) return [];

  const bbox = routeBbox(path);

  // Query fuel stations + restaurants (dhabas) + toll booths
  const query = `
[out:json][timeout:20];
(
  node["amenity"="fuel"](${bbox});
  node["amenity"="restaurant"](${bbox});
  node["amenity"="fast_food"](${bbox});
  node["barrier"="toll_booth"](${bbox});
  node["highway"="toll_booth"](${bbox});
);
out body 120;
`.trim();

  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      elements: Array<{
        id: number;
        lat: number;
        lon: number;
        tags?: Record<string, string>;
      }>;
    };

    const pois: RoutePoI[] = [];

    for (const el of data.elements) {
      const tags = el.tags ?? {};
      const amenity = tags['amenity'];
      const barrier = tags['barrier'];
      const highway = tags['highway'];
      const name = tags['name'] ?? tags['name:en'] ?? tags['operator'] ?? '';

      let category: PoiCategory | null = null;
      if (amenity === 'fuel') category = 'fuel';
      else if (amenity === 'restaurant' || amenity === 'fast_food') category = 'dhaba';
      else if (barrier === 'toll_booth' || highway === 'toll_booth') category = 'toll';

      if (!category) continue;

      // Only keep POIs within ~15km of the route path
      if (!isNearRoute(el.lat, el.lon, path, 15000)) continue;

      pois.push({
        id: String(el.id),
        category,
        name: name || defaultName(category),
        lat: el.lat,
        lng: el.lon,
      });
    }

    return pois;
  } catch {
    return [];
  }
}

function defaultName(cat: PoiCategory): string {
  if (cat === 'fuel') return 'Fuel Station';
  if (cat === 'dhaba') return 'Dhaba';
  return 'Toll Plaza';
}

// Haversine distance in meters
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isNearRoute(lat: number, lng: number, path: Coordinates[], maxDistM: number): boolean {
  // Sample every 5th point for perf on long routes
  for (let i = 0; i < path.length; i += 5) {
    if (haversine(lat, lng, path[i].lat, path[i].lng) < maxDistM) return true;
  }
  return false;
}

export function distanceToNextPoi(
  pos: Coordinates,
  pois: RoutePoI[],
  category?: PoiCategory,
): { poi: RoutePoI; distanceM: number } | null {
  const filtered = category ? pois.filter((p) => p.category === category) : pois;
  if (!filtered.length) return null;

  let nearest: RoutePoI | null = null;
  let nearestDist = Infinity;

  for (const poi of filtered) {
    const d = haversine(pos.lat, pos.lng, poi.lat, poi.lng);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = poi;
    }
  }

  return nearest ? { poi: nearest, distanceM: nearestDist } : null;
}
