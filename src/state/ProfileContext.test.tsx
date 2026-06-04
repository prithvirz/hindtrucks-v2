import { renderHook } from '@testing-library/react'
import { AuthProvider } from '../state/AuthContext'
import { ProfileProvider, useProfile } from '../state/ProfileContext'

describe('useProfile', () => {
    it('returns driver object on initial render', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(result.current.driver).toBeDefined()
        expect(result.current.driver.name).toBeDefined()
        expect(result.current.driver.rating).toBeGreaterThan(0)
    })

    it('provides setOnline function', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(typeof result.current.setOnline).toBe('function')
    })

    it('provides updateDriver function', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(typeof result.current.updateDriver).toBe('function')
    })

    it('provides addTruck function', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(typeof result.current.addTruck).toBe('function')
    })

    it('provides removeTruck function', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(typeof result.current.removeTruck).toBe('function')
    })

    it('provides setActiveTruck function', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(typeof result.current.setActiveTruck).toBe('function')
    })

    it('provides role and setRole function', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(result.current.role).toBe('driver')
        expect(typeof result.current.setRole).toBe('function')
    })

    it('provides drivers and driver management functions', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(Array.isArray(result.current.drivers)).toBe(true)
        expect(typeof result.current.addDriver).toBe('function')
        expect(typeof result.current.removeDriver).toBe('function')
        expect(typeof result.current.assignDriverToTruck).toBe('function')
    })

    it('throws when used outside provider', () => {
        expect(() => renderHook(() => useProfile())).toThrow()
    })
})