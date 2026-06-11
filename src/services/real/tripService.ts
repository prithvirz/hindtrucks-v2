import type { ReportLocationRequest, ReportLocationResponse } from '../types'
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
  increment,
  type DocumentData,
} from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { mapFirebaseError } from '../firebaseErrors'
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
import { calculateTripSettlement } from '../../lib/settlement'

function docToLoad(id: string, data: DocumentData): Load {
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

async function createTripPayout(uid: string, loadId: string): Promise<CompleteTripResponse> {
  const existingPayout = await getDocs(
    query(collection(db, 'payouts'), where('driverUid', '==', uid), where('loadId', '==', loadId), limit(1)),
  )
  if (!existingPayout.empty) {
    const data = existingPayout.docs[0].data()
    return {
      success: true,
      payoutAmount: (data.amount as number) ?? 0,
      payoutId: existingPayout.docs[0].id,
    }
  }

  const loadRef = doc(db, 'loads', loadId)
  const loadSnap = await getDoc(loadRef)
  if (!loadSnap.exists()) throw new Error('Load not found')
  const loadData = loadSnap.data()!
  const grossAmount = (loadData?.price as number) ?? 0

  const previousPayouts = await getDocs(
    query(collection(db, 'payouts'), where('driverUid', '==', uid), limit(50)),
  )
  const hasPreviousTripPayout = previousPayouts.docs.some((payoutDoc) => {
    const data = payoutDoc.data()
    return typeof data.loadId === 'string' && data.loadId !== 'WITHDRAWAL'
  })
  const settlement = calculateTripSettlement(grossAmount, !hasPreviousTripPayout)
  const payoutAmount = settlement.driverPayout
  const payoutId = 'P' + Date.now()

  await setDoc(doc(db, 'payouts', payoutId), {
    type: 'trip',
    driverUid: uid,
    loadId,
    route: `${loadData.fromCity} → ${loadData.toCity}`,
    amount: payoutAmount,
    grossAmount: settlement.grossAmount,
    commissionRate: settlement.commissionRate,
    commissionAmount: settlement.commissionAmount,
    marketingSupport: settlement.marketingSupport,
    platformCommission: settlement.platformCommission,
    status: 'credited',
    createdAt: serverTimestamp(),
  })
  await setDoc(doc(db, 'wallets', uid), {
    balance: increment(payoutAmount),
    updatedAt: serverTimestamp(),
  }, { merge: true })

  return { success: true, payoutAmount, payoutId }
}

export const tripService: ITripService = {
  async getActiveTrip(): Promise<GetActiveTripResponse> {
    try {
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
      const tripData = snap.docs[0].data()
      const loadSnap = await getDoc(doc(db, 'loads', tripData.loadId as string))
      if (!loadSnap.exists()) return { activeLoad: null, tripStep: 0 }

      return {
        activeLoad: docToLoad(loadSnap.id, loadSnap.data()!),
        tripStep: (tripData.step as TripStep) ?? 1,
      }
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },

  async advanceStep({ currentStep }: AdvanceStepRequest): Promise<AdvanceStepResponse> {
    try {
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
        const tripData = snap.docs[0].data()
        await updateDoc(snap.docs[0].ref, {
          step: newStep,
          updatedAt: serverTimestamp(),
          ...(newStep === 4 ? { status: 'completed', completedAt: serverTimestamp() } : {}),
        })

        if (newStep === 4 && typeof tripData.loadId === 'string') {
          await createTripPayout(uid, tripData.loadId)
        }
      }

      const messages: Record<number, string> = {
        1: 'Heading to pickup',
        2: 'Goods loaded — en route',
        3: 'Arrived at drop-off',
        4: 'Trip completed',
      }

      return { newStep, message: messages[newStep] }
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },

  async completeTrip({ loadId }: CompleteTripRequest): Promise<CompleteTripResponse> {
    try {
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error('Not authenticated')

      const loadRef = doc(db, 'loads', loadId)
      await updateDoc(loadRef, { status: 'completed', completedAt: serverTimestamp() })
      return createTripPayout(uid, loadId)
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },

  async reportLocation(request: ReportLocationRequest): Promise<ReportLocationResponse> {
    try {
      await setDoc(doc(db, 'trips', request.loadId, 'locations', String(request.recordedAt)), {
        loadId: request.loadId,
        lat: request.lat,
        lng: request.lng,
        accuracy: request.accuracy,
        heading: request.heading,
        speed: request.speed,
        recordedAt: request.recordedAt,
      })
      return { accepted: true }
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },
}
