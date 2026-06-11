export interface UseFcmTokenReturn {
    token: string | null
    isLoading: boolean
    error: string | null
    getToken: () => Promise<string | null>
    deleteToken: () => Promise<void>
    isPermissionGranted: boolean
}