import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  type QueryConstraint,
} from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import type {
  ILoadsService,
  GetLoadsRequest,
  GetLoadsResponse,
  GetLoadDetailRequest,
  GetLoadDetailResponse,
  AcceptLoadRequest,
  AcceptLoadResponse,
} from '../types'
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

export const loadsService: ILoadsService = {
  async getLoads(request?: GetLoadsRequest): Promise<GetLoadsResponse> {
    const constraints: QueryConstraint[] = [
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'),
      limit(request?.pageSize ?? 20),
    ]
    if (request?.goods) constraints.push(where('goods', '==', request.goods))
    if (request?.fromCity) constraints.push(where('fromCity', '==', request.fromCity))
    if (request?.toCity) constraints.push(where('toCity', '==', request.toCity))

    const snap = await getDocs(query(collection(db, 'loads'), ...constraints))
    const loads = snap.docs.map((d) => docToLoad(d.id, d.data() as Record<string, unknown>))

    const filtered = loads
      .filter((l) => request?.minPrice === undefined || l.price >= request.minPrice)
      .filter((l) => request?.maxPrice === undefined || l.price <= request.maxPrice)

    return {
      data: filtered,
      total: filtered.length,
      page: request?.page ?? 1,
      pageSize: request?.pageSize ?? 20,
      hasMore: snap.docs.length === (request?.pageSize ?? 20),
    }
  },

  async getLoadDetail({ loadId }: GetLoadDetailRequest): Promise<GetLoadDetailResponse> {
    const snap = await getDoc(doc(db, 'loads', loadId))
    if (!snap.exists()) throw new Error('Load not found')
    return { load: docToLoad(snap.id, snap.data() as Record<string, unknown>) }
  },

  async acceptLoad({ loadId }: AcceptLoadRequest): Promise<AcceptLoadResponse> {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Not authenticated')
    const loadRef = doc(db, 'loads', loadId)
    const snap = await getDoc(loadRef)
    if (!snap.exists()) throw new Error('Load not found')
    const data = snap.data() as Record<string, unknown>
    if (data.status !== 'available') throw new Error('Load already taken')

    await updateDoc(loadRef, {
      status: 'accepted',
      driverUid: uid,
      acceptedAt: serverTimestamp(),
    })
    return { success: true, activeLoad: docToLoad(snap.id, data), tripStep: 1 }
  },
}
