import type { Coordinates } from '../types';
import type { RouteStep } from '../services/routing';
import type { RoutePoI } from '../services/overpass';
import { distanceToNextPoi } from '../services/overpass';

interface NavHUDProps {
  position: Coordinates | null;
  distanceRemainingM: number | null;
  durationRemainingS: number | null;
  currentStep: RouteStep | null;
  pois: RoutePoI[];
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function formatDist(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

function maneuverIcon(maneuver: RouteStep['maneuver']): string {
  switch (maneuver) {
    case 'turn-left': return '↰';
    case 'turn-right': return '↱';
    case 'roundabout': return '↻';
    case 'arrive': return '🏁';
    case 'depart': return '🚦';
    default: return '↑';
  }
}

export function NavHUD({ position, distanceRemainingM, durationRemainingS, currentStep, pois }: NavHUDProps) {
  const speedKmh = position?.speed != null ? Math.round(position.speed * 3.6) : null;

  const nextFuel = position ? distanceToNextPoi(position, pois, 'fuel') : null;
  const nextDhaba = position ? distanceToNextPoi(position, pois, 'dhaba') : null;
  const nextToll = position ? distanceToNextPoi(position, pois, 'toll') : null;

  // ETA = now + remaining duration
  const eta = durationRemainingS != null
    ? new Date(Date.now() + durationRemainingS * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex flex-col gap-0 pointer-events-none select-none">
      {/* Turn instruction bar */}
      {currentStep && (
        <div className="bg-accent text-white px-4 py-3 flex items-center gap-3">
          <span className="text-3xl leading-none">{maneuverIcon(currentStep.maneuver)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black leading-tight truncate">{currentStep.instruction}</p>
            <p className="text-xs font-bold opacity-80">{formatDist(currentStep.distanceMeters)}</p>
          </div>
        </div>
      )}

      {/* Speed / ETA / distance strip */}
      <div className="bg-surface/95 backdrop-blur border-t border-hairline px-4 py-2.5 flex items-center gap-0">
        {/* Speed */}
        <div className="flex flex-col items-center min-w-[56px]">
          <span className="text-2xl font-black nums text-ink leading-none">
            {speedKmh ?? '—'}
          </span>
          <span className="text-[9px] font-black uppercase text-ink-faint tracking-wider">km/h</span>
        </div>

        <div className="w-px h-8 bg-hairline mx-3" />

        {/* Distance remaining */}
        {distanceRemainingM != null && (
          <div className="flex flex-col items-center min-w-[60px]">
            <span className="text-base font-black nums text-ink leading-none">
              {formatDist(distanceRemainingM)}
            </span>
            <span className="text-[9px] font-black uppercase text-ink-faint tracking-wider">left</span>
          </div>
        )}

        <div className="w-px h-8 bg-hairline mx-3" />

        {/* ETA */}
        {eta && (
          <div className="flex flex-col items-center min-w-[52px]">
            <span className="text-base font-black nums text-ink leading-none">{eta}</span>
            <span className="text-[9px] font-black uppercase text-ink-faint tracking-wider">ETA</span>
          </div>
        )}

        {/* POI row */}
        <div className="ml-auto flex items-center gap-2">
          {nextFuel && nextFuel.distanceM < 30000 && (
            <div className="flex flex-col items-center">
              <span className="text-base leading-none">⛽</span>
              <span className="text-[9px] font-black nums text-ink-muted">{formatDist(nextFuel.distanceM)}</span>
            </div>
          )}
          {nextDhaba && nextDhaba.distanceM < 20000 && (
            <div className="flex flex-col items-center">
              <span className="text-base leading-none">🍽</span>
              <span className="text-[9px] font-black nums text-ink-muted">{formatDist(nextDhaba.distanceM)}</span>
            </div>
          )}
          {nextToll && nextToll.distanceM < 50000 && (
            <div className="flex flex-col items-center">
              <span className="text-base leading-none">🚧</span>
              <span className="text-[9px] font-black nums text-ink-muted">{formatDist(nextToll.distanceM)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Duration remaining pill */}
      {durationRemainingS != null && (
        <div className="bg-surface/80 backdrop-blur px-4 py-1 border-t border-hairline/50">
          <p className="text-[10px] font-black text-ink-muted text-center">
            {formatDuration(durationRemainingS)} remaining
          </p>
        </div>
      )}
    </div>
  );
}
