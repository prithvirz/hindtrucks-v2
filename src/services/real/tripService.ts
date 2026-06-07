import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import type {
  ITripService,
  AdvanceStepRequest,
  AdvanceStepResponse,
  CompleteTripRequest,
  CompleteTripResponse,
  GetActiveTripResponse,
} from '../types'
import type { TripStep } from '../../state/types'
import type { Load } from '../../data/mockLoads'

function docToLoad(id: string, data: Record<string, unknown>): Load {
  return {
    id,
    fromCity: data.fromCity as string,
    fromArea: data.fromArea as string,
    toCity: data.toCity as string,
    toArea: data.toArea as string,
    goods: data.goods as Load['goods'],
    weightTon: data.weightTon as number,
    distanceKm: data.distanceKm as number,
    price: data.price as number,
    advance: data.advance as number,
    truckType: data.truckType as string,
    shipperName: data.shipperName as string,
    shipperVerified: (data.shipperVerified as boolean) ?? false,
    image: (data.image as string) ?? '',
  }
}

export const tripService: ITripService = {
  async getActiveTrip(): Promise<GetActiveTripResponse> {
    const uid = auth.currentUser?.uid
    if (!uid) return { activeLoad: null, tripStep: 0 }

    const snap = await getDocs(
      query(
        collection(db, 'trips'),
        where('driverUid', '==', uid),
        where('status', 'in', ['active', 'in_progress']),
        orderBy('startedAt', 'desc'),
        limit(1),
      ),
    )

    if (snap.empty) return { activeLoad: null, tripStep: 0 }
    const tripData = snap.docs[0].data() as Record<string, unknown>
    const loadSnap = await getDoc(doc(db, 'loads', tripData.loadId as string))
    if (!loadSnap.exists()) return { activeLoad: null, tripStep: 0 }

    return {
      activeLoad: docToLoad(loadSnap.id, loadSnap.data() as Record<string, unknown>),
      tripStep: (tripData.step as TripStep) ?? 1,
    }
  },

  async advanceStep({ currentStep }: AdvanceStepRequest): Promise<AdvanceStepResponse> {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Not authenticated')

    const newStep = currentStep < 4 ? ((currentStep + 1) as TripStep) : currentStep

    const snap = await getDocs(
      query(
        collection(db, 'trips'),
        where('driverUid', '==', uid),
        where('status', 'in', ['active', 'in_progress']),
        orderBy('startedAt', 'desc'),
        limit(1),
      ),
    )

    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, {
        step: newStep,
        updatedAt: serverTimestamp(),
        ...(newStep === 4 ? { status: 'completed', completedAt: serverTimestamp() } : {}),
      })
    }

    const messages: Record<number, string> = {
      1: 'Heading to pickup',
      2: 'Goods loaded — en route',
      3: 'Arrived at drop-off',
      4: 'Trip completed',
    }

    return { newStep, message: messages[newStep] }
  },

  async completeTrip({ loadId }: CompleteTripRequest): Promise<CompleteTripResponse> {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Not authenticated')

    const loadRef = doc(db, 'loads', loadId)
    const loadSnap = await getDoc(loadRef)
    const loadData = loadSnap.data() as Record<string, unknown>
    const payoutAmount = (loadData?.price as number) ?? 0

    await updateDoc(loadRef, { status: 'completed', completedAt: serverTimestamp() })

    const payoutId = 'P' + Date.now()
    await setDoc(doc(db, 'payouts', payoutId), {
      driverUid: uid,
      loadId,
      route: `${loadData.fromCity} → ${loadData.toCity}`,
      amount: payoutAmount,
      status: 'credited',
      createdAt: serverTimestamp(),
    })

    return { success: true, payoutAmount, payoutId }
  },
}
