import { FirebaseError } from 'firebase/app'
import { AuthError, NetworkError, ServerError, ApiError } from './errors'

/**
 * Map Firebase/Firestore errors to app-specific error types.
 * FirebaseError.code documentation: https://firebase.google.com/docs/reference/js/firestore_.md#firestoreerrorcode
 */
export function mapFirebaseError(err: unknown): Error {
    if (err instanceof FirebaseError) {
        const code = err.code ?? 'unknown'
        const message = err.message

        // Auth-specific codes
        if (code.startsWith('auth/')) {
            return new AuthError(message, 401)
        }

        // Firestore codes
        switch (code) {
            case 'permission-denied':
                return new AuthError(message, 403)
            case 'unavailable':
            case 'resource-exhausted':
                return new ServerError(message)
            case 'unauthenticated':
                return new AuthError(message, 401)
            case 'not-found':
                return new ApiError(message, 404, code)
            case 'already-exists':
                return new ApiError(message, 409, code)
            case 'failed-precondition':
                return new ApiError(message, 412, code)
            case 'aborted':
                return new ApiError(message, 409, code)
            case 'deadline-exceeded':
                return new NetworkError(message, err)
            case 'cancelled':
                return new NetworkError(message, err)
            default:
                return new ApiError(message, 500, code)
        }
    }

    // Fallback for non-Firebase errors
    if (err instanceof Error) {
        return err
    }
    return new Error('An unknown error occurred')
}

/**
 * Check if the error indicates a network/offline condition.
 */
export function isOfflineError(err: unknown): boolean {
    if (err instanceof FirebaseError) {
        return err.code === 'unavailable' || err.code === 'deadline-exceeded'
    }
    if (err instanceof NetworkError) {
        return true
    }
    return false
}