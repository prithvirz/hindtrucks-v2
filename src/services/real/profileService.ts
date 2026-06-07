import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import type {
  IProfileService,
  GetProfileResponse,
  SetOnlineStatusRequest,
  SetOnlineStatusResponse,
} from '../types'

export const profileService: IProfileService = {
  async getProfile(): Promise<GetProfileResponse> {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Not authenticated')
    const snap = await getDoc(doc(db, 'drivers', uid))
    if (!snap.exists()) throw new Error('Profile not found')
    const data = snap.data() as Record<string, unknown>
    return {
      profile: {
        name: (data.name as string) ?? '',
        phone: (data.phone as string) ?? '',
        rating: (data.rating as number) ?? 5.0,
        tripsToday: (data.tripsToday as number) ?? 0,
        earningsToday: (data.earningsToday as number) ?? 0,
        truck: {
          regNumber: (data.truckRegNumber as string) ?? '',
          type: (data.truckType as string) ?? '',
          capacity: (data.truckCapacity as string) ?? '',
        },
      },
    }
  },

  async setOnlineStatus({ isOnline }: SetOnlineStatusRequest): Promise<SetOnlineStatusResponse> {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Not authenticated')
    await setDoc(
      doc(db, 'drivers', uid),
      { isOnline, updatedAt: serverTimestamp() },
      { merge: true },
    )
    return { isOnline }
  },
}
