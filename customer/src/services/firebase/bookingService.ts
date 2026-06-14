import type { IBookingService, Booking, NewBookingRequest } from '../types'
import type { LoadStatus } from '@hindtrucks/shared'
import { auth, db, loadsCollection, loadDoc, loadToDocData, docToLoad } from '@hindtrucks/shared/firebase'
import { addDoc, getDocs, getDoc, updateDoc, query, where } from 'firebase/firestore'
import { goodsImage } from '../../lib/assets'

function getPhone(): string {
    const phone = localStorage.getItem('htc_phone')
    if (!phone) throw new Error('Not authenticated — no phone in localStorage')
    return phone
}

function getUid(): string {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Not authenticated — no Firebase user')
    return uid
}

export const firebaseBookingService: IBookingService = {
    async createBooking(req: NewBookingRequest): Promise<Booking> {
        const phone = getPhone()
        const uid = getUid()
        const now = Date.now()

        const load = {
            id: '',
            fromCity: req.fromCity,
            fromArea: req.fromArea,
            toCity: req.toCity,
            toArea: req.toArea,
            goods: req.goods,
            weightTon: req.weightTon,
            distanceKm: req.distanceKm,
            price: req.price,
            advance: req.advance,
            truckType: req.truckType,
            shipperName: 'You',
            shipperVerified: true,
            image: goodsImage[req.goods] ?? goodsImage.default,
            shipperUid: uid,
            status: 'available' as LoadStatus,
            createdAt: now,
        }

        const docData = loadToDocData(load, {
            status: 'available',
            shipperUid: uid,
            driver: null,
            step: 0,
            position: null,
        })

        const docRef = await addDoc(loadsCollection(db), docData)

        const booking: Booking = {
            id: docRef.id,
            fromCity: req.fromCity,
            fromArea: req.fromArea,
            toCity: req.toCity,
            toArea: req.toArea,
            goods: req.goods,
            weightTon: req.weightTon,
            distanceKm: req.distanceKm,
            price: req.price,
            advance: req.advance,
            truckType: req.truckType,
            shipperName: 'You',
            shipperVerified: true,
            shipperUid: phone,
            image: goodsImage[req.goods] ?? goodsImage.default,
            status: 'available',
            createdAt: now,
            driver: null,
        }

        return booking
    },

    async getMyBookings(): Promise<Booking[]> {
        const uid = getUid()

        // Single-field equality only — avoids a composite (shipperUid + createdAt)
        // index. Sort client-side by createdAt desc below.
        const q = query(
            loadsCollection(db),
            where('shipperUid', '==', uid),
        )

        const snap = await getDocs(q)
        const bookings: Booking[] = []

        snap.forEach((docSnap) => {
            const load = docToLoad(docSnap)
            const data = docSnap.data()
            const createdAt = data.createdAt?.toMillis?.() ?? load.createdAt ?? 0

            bookings.push({
                id: load.id,
                fromCity: load.fromCity,
                fromArea: load.fromArea,
                toCity: load.toCity,
                toArea: load.toArea,
                goods: load.goods,
                weightTon: load.weightTon,
                distanceKm: load.distanceKm,
                price: load.price,
                advance: load.advance,
                truckType: load.truckType,
                shipperName: load.shipperName,
                shipperVerified: load.shipperVerified,
                image: load.image,
                shipperUid: load.shipperUid,
                status: data.status ?? 'available',
                createdAt,
                driver: data.driver ?? null,
            })
        })

        bookings.sort((a, b) => b.createdAt - a.createdAt)
        return bookings
    },

    async getBooking(id: string): Promise<Booking> {
        const docSnap = await getDoc(loadDoc(db, id))
        if (!docSnap.exists()) throw new Error('Booking not found')

        const load = docToLoad(docSnap)
        const data = docSnap.data()
        const createdAt = data.createdAt?.toMillis?.() ?? load.createdAt ?? 0

        return {
            id: load.id,
            fromCity: load.fromCity,
            fromArea: load.fromArea,
            toCity: load.toCity,
            toArea: load.toArea,
            goods: load.goods,
            weightTon: load.weightTon,
            distanceKm: load.distanceKm,
            price: load.price,
            advance: load.advance,
            truckType: load.truckType,
            shipperName: load.shipperName,
            shipperVerified: load.shipperVerified,
            image: load.image,
            shipperUid: load.shipperUid,
            status: data.status ?? 'available',
            createdAt,
            driver: data.driver ?? null,
        }
    },

    async cancelBooking(id: string): Promise<void> {
        const docSnap = await getDoc(loadDoc(db, id))
        if (!docSnap.exists()) throw new Error('Booking not found')

        const data = docSnap.data()
        if (data.status !== 'available') throw new Error('Only available bookings can be cancelled')

        await updateDoc(loadDoc(db, id), { status: 'cancelled' })
    },
}
