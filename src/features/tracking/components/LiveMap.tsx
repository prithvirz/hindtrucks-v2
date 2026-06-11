import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { LocateFixed, Maximize2, Minimize2, Route as RouteIcon, Loader2, AlertTriangle } from 'lucide-react';
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

// ─── Phase 5.2: Smoothed Marker ─────────────────────────────────
// Interpolates truck position between GPS updates using rAF for
// fluid movement instead of jumpy position snaps.

function SmoothedMarker({
    position,
    icon,
}: {
    position: Coordinates;
    icon: L.DivIcon;
}) {
    const map = useMap();
    const markerRef = useRef<L.Marker | null>(null);
    const prevLatRef = useRef(position.lat);
    const prevLngRef = useRef(position.lng);
    const animRef = useRef(0);

    // Create marker on mount; animate position on subsequent updates
    useEffect(() => {
        const target: L.LatLngExpression = [position.lat, position.lng];
        const startLat = prevLatRef.current;
        const startLng = prevLngRef.current;

        if (!markerRef.current) {
            markerRef.current = L.marker(target, { icon, zIndexOffset: 1000 }).addTo(map);
            prevLatRef.current = position.lat;
            prevLngRef.current = position.lng;
            return;
        }

        // Skip animation for micro-jumps (<~5 m)
        const dLat = Math.abs(position.lat - startLat);
        const dLng = Math.abs(position.lng - startLng);
        if (dLat < 0.00005 && dLng < 0.00005) {
            markerRef.current.setLatLng(target);
            prevLatRef.current = position.lat;
            prevLngRef.current = position.lng;
            return;
        }

        cancelAnimationFrame(animRef.current);
        const duration = 400; // ms
        const t0 = performance.now();

        const tick = (now: number) => {
            const p = Math.min((now - t0) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
            markerRef.current?.setLatLng([
                startLat + (position.lat - startLat) * ease,
                startLng + (position.lng - startLng) * ease,
            ]);
            if (p < 1) {
                animRef.current = requestAnimationFrame(tick);
            } else {
                prevLatRef.current = position.lat;
                prevLngRef.current = position.lng;
            }
        };

        animRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animRef.current);
    }, [position.lat, position.lng]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update icon when bearing changes
    useEffect(() => {
        markerRef.current?.setIcon(icon);
    }, [icon]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancelAnimationFrame(animRef.current);
            markerRef.current?.remove();
            markerRef.current = null;
        };
    }, [map]);

    return null;
}

// ─── Phase 5.4: Tile Load Tracker ───────────────────────────────
// Monitors Leaflet tile events and reports loading/error state
// back to the parent LiveMap component for UI overlay display.

function TileLoadTracker({
    onLoadingChange,
}: {
    onLoadingChange: (loading: boolean, error: boolean) => void;
}) {
    const map = useMap();
    const pendingRef = useRef(0);
    const errorRef = useRef(false);

    useEffect(() => {
        const onStart = () => {
            pendingRef.current++;
            errorRef.current = false;
            onLoadingChange(true, false);
        };
        const onLoad = () => {
            pendingRef.current--;
            if (pendingRef.current <= 0) {
                pendingRef.current = 0;
                onLoadingChange(false, errorRef.current);
            }
        };
        const onError = () => {
            errorRef.current = true;
            pendingRef.current--;
            if (pendingRef.current <= 0) {
                pendingRef.current = 0;
                onLoadingChange(false, true);
            }
        };

        map.on('tileloadstart', onStart);
        map.on('tileload', onLoad);
        map.on('tileerror', onError);

        return () => {
            map.off('tileloadstart', onStart);
            map.off('tileload', onLoad);
            map.off('tileerror', onError);
        };
    }, [map, onLoadingChange]);

    return null;
}


function MapAutoCenter({
    position,
    navMode,
}: {
    position: Coordinates | null;
    navMode: boolean;
}) {
    const map = useMap();
    useEffect(() => {
        // Only follow the driver in fullscreen nav mode. In preview mode the
        // route view (FitRouteBounds) owns the camera so the whole route + POIs
        // stay visible even when the driver is far off-route.
        if (!navMode || !position) return;
        map.setView([position.lat, position.lng], 15, { animate: true });
    }, [map, position, navMode]);
    return null;
}

// Preview mode: fit the camera to the route + waypoints once, so the user
// always sees the full trip and its POIs regardless of their own GPS location.
function FitRouteBounds({
    route,
    waypoints,
    navMode,
}: {
    route: Coordinates[];
    waypoints: RouteWaypoint[];
    navMode: boolean;
}) {
    const map = useMap();
    const fittedRef = useRef(false);
    useEffect(() => {
        if (navMode || fittedRef.current) return;
        const pts: [number, number][] = [
            ...route.map((c) => [c.lat, c.lng] as [number, number]),
            ...waypoints.map((w) => [w.coordinates.lat, w.coordinates.lng] as [number, number]),
        ];
        if (pts.length < 1) return;
        fittedRef.current = true;
        if (pts.length === 1) {
            map.setView(pts[0], 12, { animate: false });
        } else {
            map.fitBounds(L.latLngBounds(pts), { padding: [30, 30], animate: false });
        }
    }, [map, route, waypoints, navMode]);
    return null;
}

function ThemeTileLayer({ isDark }: { isDark: boolean }) {
    if (isDark) {
        return (
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
        );
    }
    return (
        <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
    );
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
    onToggleFullscreen?: () => void;
    isFullscreen?: boolean;
    progressPct?: number;
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
    onToggleFullscreen,
    isFullscreen = false,
    progressPct = 0,
}: LiveMapProps) {
    const [leafletReady, setLeafletReady] = useState(false);
    const [poiFilter, setPoiFilter] = useState<Set<RoutePoI['category']>>(new Set(['fuel', 'dhaba', 'toll']));
    const [isDark, setIsDark] = useState(false);
    const [tilesLoading, setTilesLoading] = useState(false);
    const [tilesError, setTilesError] = useState(false);
    const _mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        import('leaflet/dist/leaflet.css')
            .then(() => setLeafletReady(true))
            .catch(() => setLeafletReady(true));
    }, []);

    // Detect dark mode from DOM <html> class
    useEffect(() => {
        const check = () => setIsDark(document.documentElement.classList.contains('dark'));
        check();
        const mo = new MutationObserver(check);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => mo.disconnect();
    }, []);

    const onTileLoadingChange = useCallback((loading: boolean, error: boolean) => {
        setTilesLoading(loading);
        setTilesError(error);
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

    // Memoize truck icon to avoid recreating on every render
    const truckIcon = useMemo(() => makeTruckIcon(bearing), [bearing]);

    // Phase 5.3: Split route into traversed (green) and upcoming (accent)
    const splitIdx = progressPct > 0 && routePositions.length > 1
        ? Math.max(0, Math.min(routePositions.length - 1, Math.floor(routePositions.length * progressPct)))
        : 0;
    const traversed = routePositions.slice(0, splitIdx + 1);
    const upcoming = routePositions.slice(splitIdx);

    function toggleFilter(cat: RoutePoI['category']) {
        setPoiFilter((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat); else next.add(cat);
            return next;
        });
    }

    function recenterToDriver() {
        if (!driverPosition) return;
        _mapRef.current?.setView([driverPosition.lat, driverPosition.lng], 15, { animate: true });
    }

    function fitToRoute() {
        const pts: [number, number][] = [
            ...routePositions,
            ...waypoints.map((w) => [w.coordinates.lat, w.coordinates.lng] as [number, number]),
        ];
        if (pts.length > 1) _mapRef.current?.fitBounds(L.latLngBounds(pts), { padding: [30, 30] });
        else if (pts.length === 1) _mapRef.current?.setView(pts[0], 12);
    }

    return (
        <div style={{ height }} className={`relative rounded-lg overflow-hidden ${className}`}>
            {/* Phase 5.4: Tile loading / error indicators */}
            {tilesLoading && !tilesError && (
                <div className="absolute top-2 left-2 z-[1000] bg-surface-base/80 backdrop-blur rounded-lg px-2 py-1 shadow-pop flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin text-accent" />
                    <span className="text-[10px] font-bold text-ink-muted">Loading map…</span>
                </div>
            )}
            {tilesError && (
                <div className="absolute top-2 left-2 z-[1000] bg-red-50/90 backdrop-blur rounded-lg px-2 py-1 shadow-pop flex items-center gap-1.5 border border-red-200">
                    <AlertTriangle size={12} className="text-red-500" />
                    <span className="text-[10px] font-bold text-red-600">Map tiles unavailable</span>
                </div>
            )}

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

            {/* Map controls: locate-me, fit-route, fullscreen toggle (Google-Maps style) */}
            <div className={`absolute right-3 z-[1000] flex flex-col gap-2 ${isFullscreen ? 'bottom-3' : 'top-14'}`}>
                {driverPosition && (
                    <button
                        onClick={recenterToDriver}
                        aria-label="Center on my location"
                        className="w-10 h-10 rounded-full bg-surface shadow-pop border border-hairline flex items-center justify-center text-accent active:scale-95 transition-transform"
                    >
                        <LocateFixed size={18} />
                    </button>
                )}
                <button
                    onClick={fitToRoute}
                    aria-label="Show full route"
                    className="w-10 h-10 rounded-full bg-surface shadow-pop border border-hairline flex items-center justify-center text-ink active:scale-95 transition-transform"
                >
                    <RouteIcon size={18} />
                </button>
                {onToggleFullscreen && (
                    <button
                        onClick={onToggleFullscreen}
                        aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen map'}
                        className="w-10 h-10 rounded-full bg-accent text-white shadow-pop flex items-center justify-center active:scale-95 transition-transform"
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                )}
            </div>

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
                {/* Phase 5.1: Theme-aware tile layer */}
                <ThemeTileLayer isDark={isDark} />

                {/* Phase 5.4: Tile load tracking */}
                <TileLoadTracker onLoadingChange={onTileLoadingChange} />

                <MapAutoCenter position={driverPosition ?? null} navMode={navMode} />
                <FitRouteBounds route={route} waypoints={waypoints} navMode={navMode} />

                {/* Phase 5.3: Traversed segment (green) */}
                {traversed.length > 1 && (
                    <Polyline
                        positions={traversed}
                        pathOptions={{ color: '#10B981', weight: 5, opacity: 0.9 }}
                    />
                )}
                {/* Phase 5.3: Upcoming segment (accent orange) */}
                {upcoming.length > 1 && (
                    <Polyline
                        positions={upcoming}
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

                {/* Phase 5.2: Smoothed truck marker */}
                {driverPosition && (
                    <SmoothedMarker
                        position={driverPosition}
                        icon={truckIcon}
                    />
                )}
            </MapContainer>
        </div>
    );
}
