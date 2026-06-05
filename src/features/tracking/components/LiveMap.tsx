import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Coordinates, RouteWaypoint } from '../types';

// Fix default marker icon issue with bundlers
// @ts-expect-error - leaflet icon shadow workaround
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DRIVER_ICON = L.divIcon({
    className: 'driver-marker',
    html: `<div style="
    width: 24px; height: 24px;
    background: #007AFF;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    position: relative;
  "><div style="
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 8px; height: 8px;
    background: white; border-radius: 50%;
  "></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const WAYPOINT_ICON = L.divIcon({
    className: 'waypoint-marker',
    html: `<div style="
    width: 16px; height: 16px;
    background: #FF9500;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

const PUMP_ICON = L.divIcon({
    className: 'pump-marker',
    html: `<div style="
    width: 26px; height: 26px;
    background: #10B981;
    border: 2px solid white;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
  ">⛽</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});

interface PartnerPump {
    id: string;
    name: string;
    coordinates: { lat: number; lng: number };
    brand: 'HPCL' | 'BPCL' | 'IndianOil';
    benefit: string;
}

const PARTNER_PUMPS: PartnerPump[] = [
    {
        id: 'pump-hpcl-1',
        name: 'HPCL Fuel Station (Partner)',
        coordinates: { lat: 28.3124, lng: 76.9124 },
        brand: 'HPCL',
        benefit: '5% Cashback on fuel + Free driver snacks',
    },
    {
        id: 'pump-bpcl-2',
        name: 'BPCL Ghar Outlet (Partner)',
        coordinates: { lat: 27.8541, lng: 76.4587 },
        brand: 'BPCL',
        benefit: '5% Cashback on fuel + Overnight secure parking',
    },
    {
        id: 'pump-iocl-3',
        name: 'IndianOil Swagat (Partner)',
        coordinates: { lat: 27.2145, lng: 75.9521 },
        brand: 'IndianOil',
        benefit: '5% Cashback on fuel + Driver restrooms & showers',
    },
];

interface LiveMapProps {
    driverPosition?: Coordinates | null;
    route: Coordinates[];
    waypoints?: RouteWaypoint[];
    height?: string;
    interactive?: boolean;
    className?: string;
}

// Auto-center map when driver moves
function MapAutoCenter({ position }: { position: Coordinates | null }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
        }
    }, [map, position]);

    return null;
}

export function LiveMap({
    driverPosition,
    route,
    waypoints = [],
    height = '250px',
    interactive = true,
    className = '',
}: LiveMapProps) {
    const [leafletReady, setLeafletReady] = useState(false);
    const [showPumps, setShowPumps] = useState(true);

    useEffect(() => {
        // Dynamic CSS import to avoid bundling issues
        import('leaflet/dist/leaflet.css')
            .then(() => setLeafletReady(true))
            .catch(() => setLeafletReady(true)); // fallback if CSS fails
    }, []);

    if (!leafletReady) {
        return (
            <div
                style={{ height }}
                className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
            >
                <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
        );
    }

    const defaultCenter: [number, number] = driverPosition
        ? [driverPosition.lat, driverPosition.lng]
        : route.length > 0
            ? [route[0].lat, route[0].lng]
            : [28.6139, 77.209]; // Default: New Delhi

    const routePositions: [number, number][] = route.map((c) => [c.lat, c.lng]);

    return (
        <div style={{ height }} className={`relative rounded-lg overflow-hidden ${className}`}>
            {/* Pumps Overlay Toggle */}
            <div className="absolute top-2 right-2 z-[1000] bg-surface-base/90 backdrop-blur border border-hairline rounded-xl px-2.5 py-1.5 shadow-pop flex items-center gap-1.5">
                <input
                    type="checkbox"
                    id="map-toggle-pumps"
                    checked={showPumps}
                    onChange={(e) => setShowPumps(e.target.checked)}
                    className="w-3.5 h-3.5 accent-accent cursor-pointer"
                />
                <label
                    htmlFor="map-toggle-pumps"
                    className="text-[10px] font-black text-ink uppercase tracking-wider cursor-pointer select-none"
                >
                    ⛽ Partner Pumps
                </label>
            </div>

            <MapContainer
                center={defaultCenter}
                zoom={9}
                style={{ height: '100%', width: '100%' }}
                zoomControl={interactive}
                dragging={interactive}
                scrollWheelZoom={interactive}
                doubleClickZoom={interactive}
                touchZoom={interactive}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapAutoCenter position={driverPosition ?? null} />

                {/* Route polyline */}
                {routePositions.length > 1 && (
                    <Polyline
                        positions={routePositions}
                        pathOptions={{
                            color: '#007AFF',
                            weight: 4,
                            opacity: 0.7,
                            dashArray: '10 6',
                        }}
                    />
                )}

                {/* Waypoint markers */}
                {waypoints.map((wp) => (
                    <Marker
                        key={wp.id}
                        position={[wp.coordinates.lat, wp.coordinates.lng]}
                        icon={WAYPOINT_ICON}
                    >
                        <Popup>
                            <div className="text-sm font-semibold">{wp.label}</div>
                            <div className="text-xs text-gray-500 capitalize">{wp.type}</div>
                        </Popup>
                    </Marker>
                ))}

                {/* Partner Petrol Pumps */}
                {showPumps && PARTNER_PUMPS.map((pump) => (
                    <Marker
                        key={pump.id}
                        position={[pump.coordinates.lat, pump.coordinates.lng]}
                        icon={PUMP_ICON}
                    >
                        <Popup>
                            <div className="text-sm font-black text-ink flex items-center gap-1">
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded border border-emerald-500/20">{pump.brand}</span>
                                {pump.name}
                            </div>
                            <div className="text-xs text-emerald-600 font-extrabold mt-1">🎁 HindTrucks Partner Benefit:</div>
                            <div className="text-[11px] font-bold text-ink-muted leading-tight mt-0.5">{pump.benefit}</div>
                        </Popup>
                    </Marker>
                ))}

                {/* Driver marker */}
                {driverPosition && (
                    <Marker
                        position={[driverPosition.lat, driverPosition.lng]}
                        icon={DRIVER_ICON}
                    >
                        <Popup>
                            <div className="text-sm font-semibold">You are here</div>
                            {driverPosition.speed !== undefined && (
                                <div className="text-xs text-gray-500">
                                    Speed: {(driverPosition.speed * 3.6).toFixed(1)} km/h
                                </div>
                            )}
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}