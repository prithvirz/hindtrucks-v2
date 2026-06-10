import { Capacitor } from '@capacitor/core'
import { AppLauncher } from '@capacitor/app-launcher'
import {
  buildGoogleMapsAppUrl,
  buildGoogleMapsWebUrl,
  getNavigationTarget,
  openTurnByTurnNavigation,
} from './navigationLauncher'
import type { Coordinates } from '../types'

// Replace stub functions with vi.fn() spies
Capacitor.isNativePlatform = vi.fn(() => false)
AppLauncher.openUrl = vi.fn(async () => ({ completed: true }))
AppLauncher.canOpenUrl = vi.fn(async () => ({ value: true }))

const pickup: Coordinates = { lat: 30.901, lng: 75.8573, timestamp: 1 }
const drop: Coordinates = { lat: 28.6139, lng: 77.209, timestamp: 1 }

describe('navigationLauncher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    vi.mocked(AppLauncher.openUrl).mockResolvedValue({ completed: true })
  })

  it('selects pickup for the first trip step', () => {
    const target = getNavigationTarget(
      1,
      { coordinates: pickup, label: 'Pickup', stage: 'pickup' },
      { coordinates: drop, label: 'Drop', stage: 'drop' },
    )

    expect(target?.coordinates).toEqual(pickup)
    expect(target?.stage).toBe('pickup')
  })

  it('selects drop after pickup is complete', () => {
    for (const step of [2, 3]) {
      const target = getNavigationTarget(
        step,
        { coordinates: pickup, label: 'Pickup', stage: 'pickup' },
        { coordinates: drop, label: 'Drop', stage: 'drop' },
      )

      expect(target?.coordinates).toEqual(drop)
      expect(target?.stage).toBe('drop')
    }
  })

  it('does not return a navigation target for completed trips', () => {
    const target = getNavigationTarget(
      4,
      { coordinates: pickup, label: 'Pickup', stage: 'pickup' },
      { coordinates: drop, label: 'Drop', stage: 'drop' },
    )

    expect(target).toBeNull()
  })

  it('builds Google Maps navigation URLs', () => {
    expect(buildGoogleMapsAppUrl(pickup)).toBe('google.navigation:q=30.901,75.8573&mode=d')
    expect(buildGoogleMapsWebUrl(pickup)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=30.901%2C75.8573&travelmode=driving',
    )
  })

  it('attempts native Google Maps first', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)

    await openTurnByTurnNavigation(pickup)

    expect(AppLauncher.openUrl).toHaveBeenCalledTimes(1)
    expect(AppLauncher.openUrl).toHaveBeenCalledWith({ url: 'google.navigation:q=30.901,75.8573&mode=d' })
  })

  it('falls back to Google Maps web directions when native launch fails', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(AppLauncher.openUrl)
      .mockRejectedValueOnce(new Error('missing maps app'))
      .mockResolvedValueOnce({ completed: true })

    await openTurnByTurnNavigation(pickup)

    expect(AppLauncher.openUrl).toHaveBeenNthCalledWith(1, { url: 'google.navigation:q=30.901,75.8573&mode=d' })
    expect(AppLauncher.openUrl).toHaveBeenNthCalledWith(2, {
      url: 'https://www.google.com/maps/dir/?api=1&destination=30.901%2C75.8573&travelmode=driving',
    })
  })

  it('falls back when native launcher reports not completed', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(AppLauncher.openUrl)
      .mockResolvedValueOnce({ completed: false })
      .mockResolvedValueOnce({ completed: true })

    await openTurnByTurnNavigation(pickup)

    expect(AppLauncher.openUrl).toHaveBeenNthCalledWith(1, { url: 'google.navigation:q=30.901,75.8573&mode=d' })
    expect(AppLauncher.openUrl).toHaveBeenNthCalledWith(2, {
      url: 'https://www.google.com/maps/dir/?api=1&destination=30.901%2C75.8573&travelmode=driving',
    })
  })
})
