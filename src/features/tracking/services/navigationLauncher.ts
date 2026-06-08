import { Capacitor } from '@capacitor/core'
import { AppLauncher } from '@capacitor/app-launcher'
import type { Coordinates } from '../types'

export type NavigationStage = 1 | 2 | 3 | 4

export interface NavigationTarget {
  coordinates: Coordinates
  label: string
  stage: 'pickup' | 'drop'
}

export function getNavigationTarget(
  tripStep: number,
  pickup: NavigationTarget,
  drop: NavigationTarget,
): NavigationTarget | null {
  if (tripStep >= 4) return null
  return tripStep <= 1 ? pickup : drop
}

export function buildGoogleMapsAppUrl(target: Coordinates): string {
  return `google.navigation:q=${target.lat},${target.lng}&mode=d`
}

export function buildGoogleMapsWebUrl(target: Coordinates): string {
  const destination = encodeURIComponent(`${target.lat},${target.lng}`)
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
}

export async function openTurnByTurnNavigation(target: Coordinates): Promise<void> {
  const appUrl = buildGoogleMapsAppUrl(target)
  const webUrl = buildGoogleMapsWebUrl(target)

  if (Capacitor.isNativePlatform()) {
    try {
      const result = await AppLauncher.openUrl({ url: appUrl })
      if (result.completed) return
    } catch {
      // Fall through to browser-based Google Maps directions.
    }
    await AppLauncher.openUrl({ url: webUrl })
    return
  }

  window.open(webUrl, '_blank', 'noopener,noreferrer')
}
