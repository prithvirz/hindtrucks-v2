import type {
    ILoadsService,
    GetLoadsRequest,
    GetLoadsResponse,
    GetLoadDetailRequest,
    GetLoadDetailResponse,
    AcceptLoadRequest,
    AcceptLoadResponse,
} from '../types'
import type { Load as SharedLoad, DriverInfo } from '@hindtrucks/shared'
import { auth, db, loadsCollection, loadDoc, docToLoad } from '@hindtrucks/shared/firebase'
import { getDocs, getDoc, updateDoc, query, where } from 'firebase/firestore'
import { DRIVER } from '../../data/mockLoads'
import { toDriverLoad } from './utils'

export const firebaseLoadsService: ILoadsService = {
    async getLoads(request?: GetLoadsRequest): Promise<GetLoadsResponse> {
        const q = query(loadsCollection(db), where('status', '==', 'available'))
        const snap = await getDocs(q)

        let loads = snap.docs.map((docSnap) => {
            const shared: SharedLoad = docToLoad(docSnap)
            return toDriverLoad(shared)
        })

        // Client-side filters (same logic as mock service)
        if (request) {
            if (request.goods) {
                loads = loads.filter((l) => l.goods === request.goods)
            }
            if (request.minPrice !== undefined) {
                loads = loads.filter((l) => l.price >= request.minPrice!)
            }
            if (request.maxPrice !== undefined) {
                loads = loads.filter((l) => l.price <= request.maxPrice!)
            }
            if (request.fromCity) {
                const from = request.fromCity.toLowerCase()
                loads = loads.filter((l) => l.fromCity.toLowerCase().includes(from))
            }
            if (request.toCity) {
                const to = request.toCity.toLowerCase()
                loads = loads.filter((l) => l.toCity.toLowerCase().includes(to))
            }
        }

        return {
            data: loads,
            total: loads.length,
            page: request?.page ?? 1,
            pageSize: request?.pageSize ?? 20,
            hasMore: false,
        }
    },

    async getLoadDetail(request: GetLoadDetailRequest): Promise<GetLoadDetailResponse> {
        const docSnap = await getDoc(loadDoc(db, request.loadId))
        if (!docSnap.exists()) {
            throw new Error('Load not found')
        }
        const shared: SharedLoad = docToLoad(docSnap)
        return { load: toDriverLoad(shared) }
    },

    async acceptLoad(request: AcceptLoadRequest): Promise<AcceptLoadResponse> {
        const uid = auth.currentUser?.uid
        if (!uid) {
            throw new Error('Driver is not authenticated. Please log in first.')
        }
        const myPhone = localStorage.getItem('ht_phone')
        if (!myPhone) {
            throw new Error('Driver phone not found. Please log in first.')
        }

        const driverInfo: DriverInfo = {
            name: DRIVER.name,
            phone: myPhone,
            truckReg: DRIVER.truck.regNumber,
            rating: DRIVER.rating,
        }

        const docRef = loadDoc(db, request.loadId)
        await updateDoc(docRef, {
            status: 'accepted',
            driverUid: uid,
            driver: driverInfo,
            step: 1,
        })

        // Read back the updated doc to get the full load
        const docSnap = await getDoc(docRef)
        const shared: SharedLoad = docToLoad(docSnap)

        return {
            success: true,
            activeLoad: toDriverLoad(shared),
            tripStep: 1,
        }
    },
}
