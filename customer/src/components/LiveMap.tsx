import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  from: [number, number]
  to: [number, number]
  truck: [number, number] | null
}

const pinIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })

const truckIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;border-radius:50%;background:#F26A1B;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:15px">🚚</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

function FitBounds({ from, to, truck }: Props) {
  const map = useMap()
  useEffect(() => {
    const pts: [number, number][] = [from, to]
    if (truck) pts.push(truck)
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] })
  }, [map, from, to, truck])
  return null
}

export default function LiveMap({ from, to, truck }: Props) {
  return (
    <MapContainer
      center={from}
      zoom={6}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
      style={{ background: '#EAECF0' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={[from, to]} pathOptions={{ color: '#F26A1B', weight: 4, opacity: 0.5, dashArray: '8 8' }} />
      <Marker position={from} icon={pinIcon('#16A34A')} />
      <Marker position={to} icon={pinIcon('#0B0B0F')} />
      {truck && <Marker position={truck} icon={truckIcon} />}
      <FitBounds from={from} to={to} truck={truck} />
    </MapContainer>
  )
}
