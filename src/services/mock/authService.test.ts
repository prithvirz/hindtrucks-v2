import { mockAuthService } from './authService'

describe('mockAuthService', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('returns the stored phone during session checks', async () => {
        localStorage.setItem('ht_auth_token', 'mock_access_token')
        localStorage.setItem('ht_phone', '9123456701')

        await expect(mockAuthService.checkSession()).resolves.toEqual({
            valid: true,
            phone: '9123456701',
        })
    })

    it('accepts a 6 digit OTP in mock mode', async () => {
        const result = await mockAuthService.verifyOtp({
            phone: '9123456701',
            otp: '123456',
        })

        expect(result.success).toBe(true)
        expect(result.tokens.access.token).toContain('mock_access')
    })

    it('rejects an invalid OTP', async () => {
        await expect(mockAuthService.verifyOtp({
            phone: '9123456701',
            otp: '123',
        })).rejects.toThrow('Invalid OTP')
    })
})
