import type { IProfileService, ShipperProfile } from '../types'

const KEY = 'htc_profile'
const delay = () => new Promise<void>((r) => setTimeout(r, 200))

export const mockProfileService: IProfileService = {
  async getProfile(): Promise<ShipperProfile> {
    await delay()
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return JSON.parse(raw) as ShipperProfile
    } catch {
      // ignore
    }
    return { name: '', phone: localStorage.getItem('htc_phone') ?? '' }
  },

  async saveProfile(profile: ShipperProfile): Promise<ShipperProfile> {
    await delay()
    localStorage.setItem(KEY, JSON.stringify(profile))
    return profile
  },
}
