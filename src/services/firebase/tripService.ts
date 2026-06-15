import type {
    ITripService,
    AdvanceStepRequest,
    AdvanceStepResponse,
    CompleteTripRequest,
    CompleteTripResponse,
    GetActiveTripResponse,
    Load as DriverLoad,
} from '../types'
import type { Load as SharedLoad, TripStep } from '@hindtrucks/shared'
import { currentUid, db, loadsCollection, loadDoc, docToLoad } from '@hindtrucks/shared/firebase'
import { getDocs, updateDoc, query, where } from 'firebase/firestore'
import { toDriverLoad } from './utils'
import { completeTripPayout } from '../mock/earningsService'
import { completeTripStats } from '../mock/profileService'

async function getActiveLoadForDriver(): Promise<{
    sharedLoad: SharedLoad
    driverLoad: DriverLoad
    step: TripStep
    docId: string
} | null> {
    const uid = await currentUid()
    if (!uid) return null

    // Single-field equality only — avoids a composite (driverUid + status) index.
    // Filter to the active statuses client-side.
    const q = query(
        loadsCollection(db),
        where('driverUid', '==', uid),
    )
    const snap = await getDocs(q)
    const docSnap = snap.docs.find((d) => {
        const s = d.data()?.status
        return s === 'accepted' || s === 'in_transit'
    })
    if (!docSnap) return null

    const data = docSnap.data()
    const sharedLoad = docToLoad(docSnap)
    return {
        sharedLoad,
        driverLoad: toDriverLoad(sharedLoad),
        step: (data?.step ?? 0) as TripStep,
        docId: docSnap.id,
    }
}

const stepMessages: Record<number, string> = {
    1: 'Arrived at pickup point',
    2: 'Goods loaded — en route to destination',
    3: 'Arrived at drop-off — unloading in progress',
    4: 'Trip completed',
}

export const firebaseTripService: ITripService = {
    async getActiveTrip(): Promise<GetActiveTripResponse> {
        const result = await getActiveLoadForDriver()
        if (!result) {
            return { activeLoad: null, tripStep: 0 as TripStep }
        }
        return { activeLoad: result.driverLoad, tripStep: result.step }
    },

    async advanceStep(request: AdvanceStepRequest): Promise<AdvanceStepResponse> {
        const activeResult = await getActiveLoadForDriver()
        if (!activeResult) {
            throw new Error('No active trip')
        }

        const currentStep = request.currentStep
        const newStep: TripStep = currentStep < 4 ? ((currentStep + 1) as TripStep) : currentStep

        const newStatus = newStep === 1 ? 'accepted' : newStep === 4 ? 'completed' : 'in_transit'

        await updateDoc(loadDoc(db, activeResult.docId), {
            step: newStep,
            status: newStatus,
        })

        if (newStep === 4) {
            completeTripPayout(
                activeResult.sharedLoad.id,
                `${activeResult.sharedLoad.fromCity} → ${activeResult.sharedLoad.toCity}`,
                activeResult.sharedLoad.price,
            )
            completeTripStats(activeResult.sharedLoad.price)
        }

        return {
            newStep,
            message: stepMessages[newStep],
        }
    },

    async completeTrip(_request: CompleteTripRequest): Promise<CompleteTripResponse> {
        const activeResult = await getActiveLoadForDriver()
        if (!activeResult) {
            throw new Error('No active trip')
        }

        await updateDoc(loadDoc(db, activeResult.docId), {
            status: 'completed',
            step: 4,
        })

        completeTripPayout(
            activeResult.sharedLoad.id,
            `${activeResult.sharedLoad.fromCity} → ${activeResult.sharedLoad.toCity}`,
            activeResult.sharedLoad.price,
        )
        completeTripStats(activeResult.sharedLoad.price)

        return {
            success: true,
            payoutAmount: activeResult.sharedLoad.price,
            payoutId: `P${Math.floor(9000 + Math.random() * 1000)}`,
        }
    },
}
