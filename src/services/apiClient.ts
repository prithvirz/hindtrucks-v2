import { ApiError, AuthError, NetworkError, ServerError, ValidationError } from './errors'

// ── Configuration ──

interface ApiClientConfig {
    baseUrl: string
    timeoutMs: number
    getAccessToken: () => string | null
    onAuthFailure: () => void
}

// ── Request Options ──

interface RequestOptions<TBody = unknown> {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    path: string
    body?: TBody
    query?: Record<string, string | number | boolean | undefined>
    headers?: Record<string, string>
    timeoutMs?: number
    skipAuth?: boolean
}

// ── Response Wrapper ──

interface ApiResponse<T> {
    data: T
    status: number
    headers: Headers
}

// ── Default Config ──

const DEFAULT_TIMEOUT = 10_000

let _config: ApiClientConfig | null = null

export function initApiClient(config: ApiClientConfig): void {
    _config = config
}

function getConfig(): ApiClientConfig {
    if (!_config) {
        // Use defaults for mock mode
        _config = {
            baseUrl: '/api',
            timeoutMs: DEFAULT_TIMEOUT,
            getAccessToken: () => localStorage.getItem('ht_auth_token'),
            onAuthFailure: () => {
                localStorage.removeItem('ht_auth')
                localStorage.removeItem('ht_auth_token')
                window.location.hash = '#/login'
            },
        }
    }
    return _config
}

// ── Retry Config ──

const RETRY_MAX = 3
const RETRY_BASE_MS = 800
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504])

function isRetryable(err: unknown): boolean {
    if (err instanceof ServerError) return true
    if (err instanceof NetworkError) {
        // Don't retry timeout (AbortError) — that's a client-side issue
        const msg = err.message.toLowerCase()
        return !msg.includes('timed out') && !msg.includes('abort')
    }
    // 408/429 are also retryable
    if (err instanceof ApiError && !(err instanceof AuthError) && !(err instanceof ValidationError)) {
        return RETRYABLE_STATUSES.has(err.status)
    }
    return false
}

// ── Token Refresh Singleton ──

let refreshPromise: Promise<string | null> | null = null
const REFRESH_PATH = '/auth/refresh'

async function tryRefreshToken(): Promise<string | null> {
    const config = getConfig()
    const stored = localStorage.getItem('ht_refresh_token')
    if (!stored) return null

    try {
        const response = await fetch(`${config.baseUrl}${REFRESH_PATH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: stored }),
            signal: AbortSignal.timeout(8000),
        })

        if (!response.ok) return null

        const body = await response.json() as {
            access?: { token: string; expiresAt: number }
            refresh?: { token: string; expiresAt: number }
        }

        if (body.access) {
            localStorage.setItem('ht_auth_token', body.access.token)
        }
        if (body.refresh) {
            localStorage.setItem('ht_refresh_token', body.refresh.token)
        }

        return body.access?.token ?? null
    } catch {
        return null
    }
}

async function refreshAccessToken(): Promise<string | null> {
    // Deduplicate concurrent refresh calls
    if (refreshPromise) return refreshPromise

    refreshPromise = tryRefreshToken().finally(() => {
        refreshPromise = null
    })

    return refreshPromise
}

// ── Helpers ──

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
    if (!query) return url

    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
            params.append(key, String(value))
        }
    }
    const qs = params.toString()
    return qs ? `${url}?${qs}` : url
}

async function parseErrorBody(response: Response): Promise<{ message?: string; code?: string; errors?: Record<string, string[]> }> {
    try {
        const text = await response.text()
        if (!text) return {}
        return JSON.parse(text)
    } catch {
        return {}
    }
}

async function throwForStatus(response: Response): Promise<void> {
    if (response.ok) return

    const body = await parseErrorBody(response)
    const message = body.message || `Request failed with status ${response.status}`

    if (response.status === 401 || response.status === 403) {
        throw new AuthError(message, response.status)
    }
    if (response.status === 422) {
        throw new ValidationError(message, body.errors)
    }
    if (response.status >= 500) {
        throw new ServerError(message)
    }
    throw new ApiError(message, response.status, body.code || 'UNKNOWN_ERROR')
}

// ── Core Request Function ──

export async function request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    const config = getConfig()
    const timeout = options.timeoutMs ?? config.timeoutMs
    const url = buildUrl(config.baseUrl, options.path, options.query)

    let lastError: unknown
    let refreshed = false

    for (let attempt = 0; attempt <= RETRY_MAX; attempt++) {
        if (attempt > 0) {
            const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1)
            await new Promise(r => setTimeout(r, delay))
        }

        // Build headers per-attempt (picks up refreshed token)
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        }

        if (!options.skipAuth) {
            const token = config.getAccessToken()
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
            const init: RequestInit = {
                method: options.method,
                headers,
                signal: controller.signal,
            }

            if (options.body !== undefined && options.method !== 'GET') {
                init.body = JSON.stringify(options.body)
            }

            const response = await fetch(url, init)
            clearTimeout(timeoutId)

            await throwForStatus(response)

            const data = response.status === 204 ? (null as T) : await response.json() as T
            return { data, status: response.status, headers: response.headers }
        } catch (error: unknown) {
            clearTimeout(timeoutId)
            lastError = error

            // 401 → try token refresh once, then retry
            if (error instanceof AuthError && !options.skipAuth && !refreshed) {
                const newToken = await refreshAccessToken()
                if (newToken) {
                    refreshed = true
                    continue
                }
            }

            // Non-retryable or out of attempts
            if (!isRetryable(error) || attempt === RETRY_MAX) {
                break
            }
        }
    }

    // Final throw — unwrap last error
    const error = lastError

    if (error instanceof ApiError) {
        if (error instanceof AuthError && !options.skipAuth) {
            config.onAuthFailure()
        }
        throw error
    }

    if (error instanceof DOMException && (error as DOMException).name === 'AbortError') {
        throw new NetworkError(`Request timed out after ${timeout}ms`, error)
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network request failed — check your connection', error)
    }

    throw new NetworkError('Unexpected network error', error)
}

// ── Convenience Methods ──

export const apiClient = {
    get<T>(path: string, query?: Record<string, string | number | boolean | undefined>, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
        return request<T>({ method: 'GET', path, query, ...options })
    },

    post<T, TBody = unknown>(path: string, body?: TBody, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
        return request<T>({ method: 'POST', path, body, ...options })
    },

    put<T, TBody = unknown>(path: string, body?: TBody, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
        return request<T>({ method: 'PUT', path, body, ...options })
    },

    patch<T, TBody = unknown>(path: string, body?: TBody, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
        return request<T>({ method: 'PATCH', path, body, ...options })
    },

    delete<T>(path: string, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
        return request<T>({ method: 'DELETE', path, ...options })
    },
}

export type { ApiClientConfig, RequestOptions, ApiResponse }