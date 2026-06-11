import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging } from 'firebase/messaging'
import type { UserRole } from '../state/types'

const firebaseConfig = {
  apiKey: 'AIzaSyAain5de57rlYHN2bb5BXt6x1Qpfaxoeo0',
  authDomain: 'hindtruck.firebaseapp.com',
  projectId: 'hindtruck',
  storageBucket: 'hindtruck.firebasestorage.app',
  messagingSenderId: '151359237650',
  appId: '1:151359237650:web:10d570589c0a85626d72cb',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const messaging = getMessaging(app)

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
