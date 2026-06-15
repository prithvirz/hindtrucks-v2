import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, doc, Timestamp, serverTimestamp } from 'firebase/firestore'
import type { Firestore, DocumentSnapshot, DocumentData } from 'firebase/firestore'
import type { Load, LoadStatus, TripStep, TruckPosition, DriverInfo } from '../types'

// ── Config ──

const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
] as const

const missing = requiredEnvVars.filter(
    (key) => !(import.meta.env as Record<string, string | undefined>)[key],
)

if (missing.length > 0) {
    throw new Error(
        `Firebase config missing: set VITE_FIREBASE_* env vars. Missing: ${missing.join(', ')}`,
    )
}

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
}

// ── Init ──

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

/**
 * Resolve the current Firebase user's uid, waiting for auth state to restore.
 *
 * `auth.currentUser` is null synchronously on page load until the persisted
 * session is rehydrated. Callers that run on app start (rehydration, the first
 * Firestore query after reload) must await this instead of reading
 * `auth.currentUser` directly, or they race the restore and see no user.
 */
export async function currentUid(): Promise<string | null> {
    await auth.authStateReady()
    return auth.currentUser?.uid ?? null
}

// ── Collection helpers ──

export const loadsCollection = (firestore: Firestore) => collection(firestore, 'loads')
export const loadDoc = (firestore: Firestore, id: string) => doc(firestore, 'loads', id)

// ── Converters ──

/** Convert a Firestore doc snapshot to a shared Load object. */
export function docToLoad(snapshot: DocumentSnapshot): Load {
    const data = snapshot.data()
    if (!data) throw new Error(`Load ${snapshot.id} not found`)

    const createdAt = (() => {
        const v = data.createdAt
        if (v instanceof Timestamp) return v.toMillis()
        if (typeof v === 'number') return v
        return undefined
    })()

    const status: LoadStatus = data.status ?? 'available'

    return {
        id: snapshot.id,
        fromCity: String(data.fromCity ?? ''),
        fromArea: String(data.fromArea ?? ''),
        toCity: String(data.toCity ?? ''),
        toArea: String(data.toArea ?? ''),
        goods: data.goods,
        weightTon: Number(data.weightTon ?? 0),
        distanceKm: Number(data.distanceKm ?? 0),
        price: Number(data.price ?? 0),
        advance: Number(data.advance ?? 0),
        truckType: String(data.truckType ?? ''),
        shipperName: String(data.shipperName ?? ''),
        shipperVerified: Boolean(data.shipperVerified),
        image: String(data.image ?? ''),
        shipperUid: data.shipperUid ?? undefined,
        status,
        driverUid: data.driverUid ?? undefined,
        createdAt,
    }
}

/** Convert a shared Load + extra fields to a Firestore doc data object for setDoc / addDoc. */
export function loadToDocData(
    load: Load,
    extras: {
        status: LoadStatus
        shipperUid?: string
        driverUid?: string
        driver?: DriverInfo | null
        step?: TripStep
        position?: TruckPosition | null
    },
): DocumentData {
    const { id, createdAt, ...loadFields } = load

    return {
        ...loadFields,
        status: extras.status,
        shipperUid: extras.shipperUid ?? load.shipperUid ?? null,
        driverUid: extras.driverUid ?? load.driverUid ?? null,
        driver: extras.driver ?? null,
        step: extras.step ?? 0,
        position: extras.position ?? null,
        createdAt: createdAt != null ? Timestamp.fromMillis(createdAt) : serverTimestamp(),
    }
}
