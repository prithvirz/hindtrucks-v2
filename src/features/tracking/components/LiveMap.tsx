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
        <div style={{ height }} className={`rounded-lg overflow-hidden ${className}`}>
            <MapContainer
                center={defaultCenter}
                zoom={13}
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