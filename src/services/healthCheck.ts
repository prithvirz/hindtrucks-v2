import { doc, getDoc, getFirestore } from 'firebase/firestore'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { app } from '../lib/firebase'

export interface HealthCheckResult {
    connected: boolean
    latency: number
    error?: string
}

/**
 * Test Firestore connectivity by attempting a lightweight doc read.
 * Uses a known non-existent doc to avoid network payload cost.
 */
export async function checkFirebaseConnection(): Promise<HealthCheckResult> {
    const started = performance.now()
    try {
        const db = getFirestore(app)
        // Read a sentinel doc — even 404 is a successful connectivity test
        await getDoc(doc(db, '_health_check_/ping'))
        const latency = Math.round(performance.now() - started)
        return { connected: true, latency }
    } catch (err: unknown) {
        const latency = Math.round(performance.now() - started)
        const message = err instanceof Error ? err.message : 'Unknown Firestore error'
        return { connected: false, latency, error: message }
    }
}

/**
 * Test Firebase Auth connectivity by checking current auth state.
 */
export async function checkAuthConnection(): Promise<HealthCheckResult> {
    const started = performance.now()
    try {
        const auth = getAuth(app)
        const user = await new Promise<unknown>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Auth check timed out')), 5000)
            const unsub = onAuthStateChanged(auth, (u) => {
                clearTimeout(timeout)
                unsub()
                resolve(u)
            }, (err) => {
                clearTimeout(timeout)
                unsub()
                reject(err)
            })
        })
        const latency = Math.round(performance.now() - started)
        return { connected: !!user, latency }
    } catch (err: unknown) {
        const latency = Math.round(performance.now() - started)
        const message = err instanceof Error ? err.message : 'Unknown Auth error'
        return { connected: false, latency, error: message }
    }
}

/**
 * Run both health checks in parallel.
 */
export async function runAllHealthChecks(): Promise<{
    firestore: HealthCheckResult
    auth: HealthCheckResult
}> {
    const [firestore, auth] = await Promise.all([
        checkFirebaseConnection(),
        checkAuthConnection(),
    ])
    return { firestore, auth }
}