import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  type Firestore,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging } from 'firebase/messaging'
import type { UserRole } from '../state/types'

function resolveEnv(key: string, fallback: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const val = (import.meta.env as Record<string, string>)[key]
    if (val) return val
  }
  return fallback
}

const firebaseConfig = {
  apiKey: resolveEnv('VITE_FIREBASE_API_KEY', 'AIzaSyAain5de57rlYHN2bb5BXt6x1Qpfaxoeo0'),
  authDomain: resolveEnv('VITE_FIREBASE_AUTH_DOMAIN', 'hindtruck.firebaseapp.com'),
  projectId: resolveEnv('VITE_FIREBASE_PROJECT_ID', 'hindtruck'),
  storageBucket: resolveEnv('VITE_FIREBASE_STORAGE_BUCKET', 'hindtruck.firebasestorage.app'),
  messagingSenderId: resolveEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '151359237650'),
  appId: resolveEnv('VITE_FIREBASE_APP_ID', '1:151359237650:web:10d570589c0a85626d72cb'),
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db: Firestore = getFirestore(app)
export const storage = getStorage(app)
export const messaging = getMessaging(app)

// ── Offline Persistence ──
// Firestore offline persistence — enables cached reads/writes when offline.
// Must be called before any Firestore reads.
enableIndexedDbPersistence(db).catch((err: { code?: string }) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open; persistence can only be enabled in one tab at a time.
    console.warn('[Firestore] Offline persistence unavailable — multiple tabs open')
  } else if (err.code === 'unimplemented') {
    // The current browser does not support IndexedDB persistence.
    console.warn('[Firestore] Offline persistence not supported in this browser')
  } else {
    console.warn('[Firestore] Offline persistence error:', err)
  }
})

// Connect to local emulators when VITE_USE_EMULATOR=true
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, 'localhost', 8080)
}

// Disable reCAPTCHA in dev so test phone numbers work without CAPTCHA
if (import.meta.env.DEV) {
  auth.settings.appVerificationDisabledForTesting = true
}

export async function saveDriverToFirestore(params: {
  uid: string
  name: string
  phone: string
  role: UserRole
  licenseNumber?: string
  truckRegNumber: string
  truckType: string
  truckCapacity: string
}) {
  await setDoc(doc(db, 'drivers', params.uid), {
    name: params.name,
    phone: params.phone,
    role: params.role,
    licenseNumber: params.licenseNumber ?? null,
    truckRegNumber: params.truckRegNumber,
    truckType: params.truckType,
    truckCapacity: params.truckCapacity,
    rating: 5.0,
    tripsToday: 0,
    earningsToday: 0,
    isOnline: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await setDoc(doc(db, 'wallets', params.uid), {
    balance: 0,
    updatedAt: serverTimestamp(),
  })
}
