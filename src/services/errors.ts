// ── Error Type Hierarchy ──

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly code: string,
        public readonly details?: unknown,
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

export class NetworkError extends Error {
    constructor(message: string, public readonly originalError?: unknown) {
        super(message)
        this.name = 'NetworkError'
    }
}

export class AuthError extends ApiError {
    constructor(message = 'Authentication failed', status = 401) {
        super(message, status, 'AUTH_ERROR')
        this.name = 'AuthError'
    }
}

export class ValidationError extends ApiError {
    constructor(
        message: string,
        public readonly fieldErrors?: Record<string, string[]>,
    ) {
        super(message, 422, 'VALIDATION_ERROR')
        this.name = 'ValidationError'
    }
}

export class ServerError extends ApiError {
    constructor(message = 'Internal server error') {
        super(message, 500, 'SERVER_ERROR')
        this.name = 'ServerError'
    }
}

// ── Pagination ──

export interface PaginatedRequest {
    page?: number
    pageSize?: number
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
}