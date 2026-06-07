import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

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
