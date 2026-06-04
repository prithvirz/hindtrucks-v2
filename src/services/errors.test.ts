import {
    ApiError,
    NetworkError,
    AuthError,
    ValidationError,
    ServerError,
} from './errors'

describe('ApiError', () => {
    it('sets name and properties', () => {
        const err = new ApiError('Not Found', 404, 'NOT_FOUND', { id: 1 })
        expect(err).toBeInstanceOf(Error)
        expect(err).toBeInstanceOf(ApiError)
        expect(err.name).toBe('ApiError')
        expect(err.message).toBe('Not Found')
        expect(err.status).toBe(404)
        expect(err.code).toBe('NOT_FOUND')
        expect(err.details).toEqual({ id: 1 })
    })
})

describe('NetworkError', () => {
    it('sets name and message', () => {
        const cause = new Error('ECONNREFUSED')
        const err = new NetworkError('Network failed', cause)
        expect(err).toBeInstanceOf(Error)
        expect(err).toBeInstanceOf(NetworkError)
        expect(err.name).toBe('NetworkError')
        expect(err.message).toBe('Network failed')
        expect(err.originalError).toBe(cause)
    })

    it('works without originalError', () => {
        const err = new NetworkError('Offline')
        expect(err.originalError).toBeUndefined()
    })
})

describe('AuthError', () => {
    it('extends ApiError with defaults', () => {
        const err = new AuthError()
        expect(err).toBeInstanceOf(ApiError)
        expect(err).toBeInstanceOf(AuthError)
        expect(err.name).toBe('AuthError')
        expect(err.message).toBe('Authentication failed')
        expect(err.status).toBe(401)
        expect(err.code).toBe('AUTH_ERROR')
    })

    it('accepts custom message and status', () => {
        const err = new AuthError('Token expired', 403)
        expect(err.message).toBe('Token expired')
        expect(err.status).toBe(403)
    })
})

describe('ValidationError', () => {
    it('extends ApiError with defaults', () => {
        const err = new ValidationError('Invalid fields', { phone: ['Required'] })
        expect(err).toBeInstanceOf(ApiError)
        expect(err).toBeInstanceOf(ValidationError)
        expect(err.name).toBe('ValidationError')
        expect(err.message).toBe('Invalid fields')
        expect(err.status).toBe(422)
        expect(err.code).toBe('VALIDATION_ERROR')
        expect(err.fieldErrors).toEqual({ phone: ['Required'] })
    })

    it('works without fieldErrors', () => {
        const err = new ValidationError('Invalid')
        expect(err.fieldErrors).toBeUndefined()
    })
})

describe('ServerError', () => {
    it('extends ApiError with defaults', () => {
        const err = new ServerError()
        expect(err).toBeInstanceOf(ApiError)
        expect(err).toBeInstanceOf(ServerError)
        expect(err.name).toBe('ServerError')
        expect(err.message).toBe('Internal server error')
        expect(err.status).toBe(500)
        expect(err.code).toBe('SERVER_ERROR')
    })

    it('accepts custom message', () => {
        const err = new ServerError('Service unavailable')
        expect(err.message).toBe('Service unavailable')
    })
})