import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Coordinates, RouteWaypoint } from '../types';
import type { RoutePoI } from '../services/overpass';

// @ts-expect-error - leaflet icon shadow workaround
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeTruckIcon(bearingDeg: number) {
    return L.divIcon({
        className: '',
        html: `<div style="
      width:36px;height:36px;
      display:flex;align-items:center;justify-content:center;
      filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4));
      transform:rotate(${bearingDeg}deg);
    ">
      <svg viewBox="0 0 36 36" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="14" width="20" height="14" rx="3" fill="#F26A1B"/>
        <rect x="12" y="8" width="12" height="10" rx="2" fill="#E85D0A"/>
        <rect x="14" y="9" width="8" height="5" rx="1" fill="#B8E4F9" opacity="0.85"/>
        <circle cx="13" cy="29" r="3" fill="#1a1a1a"/>
        <circle cx="23" cy="29" r="3" fill="#1a1a1a"/>
        <polygon points="18,2 21,8 15,8" fill="white" opacity="0.9"/>
      </svg>
    </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
}

const WAYPOINT_ICON = L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;background:#F26A1B;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

function makePOIIcon(category: RoutePoI['category']) {
    const emoji = category === 'fuel' ? '⛽' : category === 'dhaba' ? '🍽' : '🚧';
    const bg = category === 'fuel' ? '#10B981' : category === 'dhaba' ? '#F59E0B' : '#EF4444';
    return L.divIcon({
        className: '',
        html: `<div style="
      width:28px;height:28px;background:${bg};border:2px solid white;
      border-radius:7px;box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;font-size:14px;
    ">${emoji}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

function MapAutoCenter({ position, navMode }: { position: Coordinates | null; navMode: boolean }) {
    const map = useMap();
    useEffect(() => {
        if (!position) return;
        map.setView([position.lat, position.lng], navMode ? 15 : map.getZoom(), { animate: true });
    }, [map, position, navMode]);
    return null;
}

interface LiveMapProps {
    driverPosition?: Coordinates | null;
    route: Coordinates[];
    waypoints?: RouteWaypoint[];
    pois?: RoutePoI[];
    height?: string;
    interactive?: boolean;
    navMode?: boolean;
    className?: string;
}

export function LiveMap({
    driverPosition,
    route,
    waypoints = [],
    pois = [],
    height = '250px',
    interactive = true,
    navMode = false,
    className = '',
}: LiveMapProps) {
    const [leafletReady, setLeafletReady] = useState(false);
    const [poiFilter, setPoiFilter] = useState<Set<RoutePoI['category']>>(new Set(['fuel', 'dhaba', 'toll']));
    const _mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        import('leaflet/dist/leaflet.css')
            .then(() => setLeafletReady(true))
            .catch(() => setLeafletReady(true));
    }, []);

    if (!leafletReady) {
        return (
            <div style={{ height }} className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
                <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
        );
    }

    const defaultCenter: [number, number] = driverPosition
        ? [driverPosition.lat, driverPosition.lng]
        : route.length > 0 ? [route[0].lat, route[0].lng]
        : [28.6139, 77.209];

    const routePositions: [number, number][] = route.map((c) => [c.lat, c.lng]);
    const bearing = driverPosition?.heading ?? 0;
    const visiblePois = pois.filter((p) => poiFilter.has(p.category));

    function toggleFilter(cat: RoutePoI['category']) {
        setPoiFilter((prev) => {
            const next = new Set(prev);
            next.has(cat) ? next.delete(cat) : next.add(cat);
            return next;
        });
    }

    return (
        <div style={{ height }} className={`relative rounded-lg overflow-hidden ${className}`}>
            {!navMode && (
                <div className="absolute top-2 right-2 z-[1000] bg-surface-base/90 backdrop-blur border border-hairline rounded-xl px-2 py-1.5 shadow-pop flex flex-col gap-1">
                    {(['fuel', 'dhaba', 'toll'] as RoutePoI['category'][]).map((cat) => (
                        <label key={cat} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={poiFilter.has(cat)}
                                onChange={() => toggleFilter(cat)}
                                className="w-3.5 h-3.5 accent-accent"
                            />
                            <span className="text-[10px] font-black text-ink uppercase tracking-wider">
                                {cat === 'fuel' ? '⛽' : cat === 'dhaba' ? '🍽' : '🚧'} {cat}
                            </span>
                        </label>
                    ))}
                </div>
            )}

            <MapContainer
                ref={_mapRef}
                center={defaultCenter}
                zoom={navMode ? 15 : 9}
                style={{ height: '100%', width: '100%' }}
                zoomControl={interactive && !navMode}
                dragging={interactive}
                scrollWheelZoom={interactive}
                doubleClickZoom={interactive}
                touchZoom={interactive}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapAutoCenter position={driverPosition ?? null} navMode={navMode} />

                {routePositions.length > 1 && (
                    <Polyline
                        positions={routePositions}
                        pathOptions={{ color: '#F26A1B', weight: 5, opacity: 0.85 }}
                    />
                )}

                {waypoints.map((wp) => (
                    <Marker key={wp.id} position={[wp.coordinates.lat, wp.coordinates.lng]} icon={WAYPOINT_ICON}>
                        <Popup>
                            <div className="text-sm font-semibold">{wp.label}</div>
                            <div className="text-xs text-gray-500 capitalize">{wp.type}</div>
                        </Popup>
                    </Marker>
                ))}

                {visiblePois.map((poi) => (
                    <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={makePOIIcon(poi.category)}>
                        <Popup>
                            <div className="text-sm font-black text-ink">{poi.name}</div>
                            <div className="text-xs text-ink-muted capitalize mt-0.5">{poi.category}</div>
                        </Popup>
                    </Marker>
                ))}

                {driverPosition && (
                    <Marker position={[driverPosition.lat, driverPosition.lng]} icon={makeTruckIcon(bearing)}>
                        <Popup>
                            <div className="text-sm font-semibold">You</div>
                            {driverPosition.speed != null && (
                                <div className="text-xs text-gray-500">{Math.round(driverPosition.speed * 3.6)} km/h</div>
                            )}
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}
