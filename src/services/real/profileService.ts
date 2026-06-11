import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { mapFirebaseError } from '../firebaseErrors'
import type {
  IProfileService,
  CreateDriverProfileRequest,
  GetProfileResponse,
  SetOnlineStatusRequest,
  SetOnlineStatusResponse,
  RegistrationStatusResponse,
} from '../types'

export const profileService: IProfileService = {
  async getProfile(): Promise<GetProfileResponse> {
    try {
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error('Not authenticated')
      const snap = await getDoc(doc(db, 'drivers', uid))
      if (!snap.exists()) throw new Error('Profile not found')
      const data = snap.data()!
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
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },

  async getRegistrationStatus(): Promise<RegistrationStatusResponse> {
    try {
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error('Not authenticated')
      const snap = await getDoc(doc(db, 'drivers', uid))
      return { registered: snap.exists() }
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },

  async createDriverProfile({ name, phone }: CreateDriverProfileRequest): Promise<GetProfileResponse> {
    try {
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
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },

  async setOnlineStatus({ isOnline }: SetOnlineStatusRequest): Promise<SetOnlineStatusResponse> {
    try {
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error('Not authenticated')
      await setDoc(
        doc(db, 'drivers', uid),
        { isOnline, updatedAt: serverTimestamp() },
        { merge: true },
      )
      return { isOnline }
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },
}
