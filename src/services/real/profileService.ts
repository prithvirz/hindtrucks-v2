import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import type {
  IProfileService,
  CreateDriverProfileRequest,
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

  async getRegistrationStatus() {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Not authenticated')
    const snap = await getDoc(doc(db, 'drivers', uid))
    return { registered: snap.exists() }
  },

  async createDriverProfile({ name, phone }: CreateDriverProfileRequest): Promise<GetProfileResponse> {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Not authenticated')
    const profile = {
      name,
      phone,
      role: 'owner',
      rating: 5.0,
      tripsToday: 0,
      earningsToday: 0,
      truckRegNumber: '',
      truckType: '',
      truckCapacity: '',
      trucks: [],
      drivers: [],
      phoneVerified: true,
      verificationMethod: 'phone_otp',
      documents: {
        license: { id: 'PENDING', validity: '' },
        rc: { id: 'PENDING', validity: '' },
        permit: { id: 'PENDING', validity: '' },
      },
      isOnline: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'drivers', uid), profile, { merge: false })
    await setDoc(doc(db, 'wallets', uid), {
      balance: 0,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return {
      profile: {
        name,
        phone,
        rating: 5.0,
        tripsToday: 0,
        earningsToday: 0,
        truck: {
          regNumber: '',
          type: '',
          capacity: '',
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
