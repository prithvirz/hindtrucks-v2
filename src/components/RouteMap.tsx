import { Truck } from 'lucide-react'

interface Props {
  /** 0..1 progress of the truck along the route. */
  progress?: number
}

/**
 * Stylised route map — a clean vector alternative to a placeholder photo.
 * Soft graticule grid, a curved dashed route, origin + destination pins, and
 * a truck marker that slides along the path with trip progress.
 */
export default function RouteMap({ progress = 0.35 }: Props) {
  // Quadratic curve from origin (8,120) to destination (292,40), control (150,150).
  const p = Math.min(Math.max(progress, 0.04), 0.96)
  const x0 = 8, y0 = 120, cx = 150, cy = 150, x1 = 292, y1 = 40
  const bx = (1 - p) * (1 - p) * x0 + 2 * (1 - p) * p * cx + p * p * x1
  const by = (1 - p) * (1 - p) * y0 + 2 * (1 - p) * p * cy + p * p * y1

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(120%_120%_at_80%_10%,#EAF1FE_0%,#F2F4F8_55%,#EAECF0_100%)]">
      <svg viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="#D9DEE6" strokeWidth="0.6" />
          </pattern>
          <linearGradient id="route" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F26A1B" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        <rect width="300" height="160" fill="url(#grid)" />

        {/* route casing + dashed line */}
        <path d={`M${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
        <path d={`M${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`} fill="none" stroke="url(#route)" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 7" />

        {/* origin */}
        <circle cx={x0} cy={y0} r="7" fill="#F26A1B" opacity="0.18" />
        <circle cx={x0} cy={y0} r="3.5" fill="#F26A1B" stroke="#fff" strokeWidth="1.5" />
        {/* destination */}
        <circle cx={x1} cy={y1} r="7" fill="#2563EB" opacity="0.18" />
        <circle cx={x1} cy={y1} r="3.5" fill="#2563EB" stroke="#fff" strokeWidth="1.5" />
      </svg>

      {/* truck marker */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-night-900 text-white shadow-pop ring-2 ring-white"
        style={{ left: `${(bx / 300) * 100}%`, top: `${(by / 160) * 100}%` }}
      >
        <Truck size={13} />
      </div>
    </div>
  )
}
