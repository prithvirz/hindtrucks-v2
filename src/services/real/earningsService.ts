import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
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
  IEarningsService,
  GetPayoutsResponse,
  GetWeekEarningsResponse,
  GetWalletBalanceResponse,
  WithdrawRequest,
  WithdrawResponse,
} from '../types'
import type { Payout } from '../../data/mockLoads'

export const earningsService: IEarningsService = {
  async getPayouts(): Promise<GetPayoutsResponse> {
    try {
      const uid = auth.currentUser?.uid
      if (!uid) return { payouts: [] }
      const snap = await getDocs(
        query(collection(db, 'payouts'), where('driverUid', '==', uid), orderBy('createdAt', 'desc'), limit(50)),
      )
      const payouts: Payout[] = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          load: (data.loadId as string) ?? '',
          route: (data.route as string) ?? '',
          amount: (data.amount as number) ?? 0,
          status: (data.status as Payout['status']) ?? 'pending',
          date: (data.createdAt as { toDate?: () => Date })?.toDate
            ? (data.createdAt as { toDate: () => Date }).toDate().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
            : '',
        }
      })
      return { payouts }
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },

  async getWeekEarnings(): Promise<GetWeekEarningsResponse> {
    try {
      const uid = auth.currentUser?.uid
      if (!uid) return { earnings: [0, 0, 0, 0, 0, 0, 0] }
      const earnings = [0, 0, 0, 0, 0, 0, 0]
      const now = Date.now()
      const snap = await getDocs(
        query(collection(db, 'payouts'), where('driverUid', '==', uid), orderBy('createdAt', 'desc'), limit(100)),
      )
      snap.docs.forEach((d) => {
        const data = d.data()
        const ts = (data.createdAt as { toDate?: () => Date })?.toDate?.()
        if (!ts) return
        const daysAgo = Math.floor((now - ts.getTime()) / 86400000)
        if (daysAgo >= 0 && daysAgo < 7) {
          earnings[6 - daysAgo] += (data.amount as number) ?? 0
        }
      })
      return { earnings }
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },

  async getWalletBalance(): Promise<GetWalletBalanceResponse> {
    try {
      const uid = auth.currentUser?.uid
      if (!uid) return { balance: 0 }
      const snap = await getDoc(doc(db, 'wallets', uid))
      if (!snap.exists()) return { balance: 0 }
      return { balance: (snap.data()!.balance as number) ?? 0 }
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },

  async withdraw({ amount, upiId }: WithdrawRequest): Promise<WithdrawResponse> {
    try {
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error('Not authenticated')

      const walletRef = doc(db, 'wallets', uid)
      const walletSnap = await getDoc(walletRef)
      const currentBalance = walletSnap.exists()
        ? ((walletSnap.data()! as DocumentData).balance as number) ?? 0
        : 0
      if (currentBalance < amount) throw new Error('Insufficient balance')

      await setDoc(walletRef, { balance: increment(-amount), updatedAt: serverTimestamp() }, { merge: true })

      const txnId = 'W' + Date.now()
      await setDoc(doc(db, 'payouts', txnId), {
        driverUid: uid,
        loadId: 'WITHDRAWAL',
        route: `Withdrawal to ${upiId}`,
        amount: -amount,
        status: 'credited',
        createdAt: serverTimestamp(),
      })

      return {
        success: true,
        newBalance: currentBalance - amount,
        transaction: {
          id: txnId,
          load: 'WITHDRAWAL',
          route: `Withdrawal to ${upiId}`,
          amount: -amount,
          status: 'credited',
          date: new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        },
      }
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },
}
