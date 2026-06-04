import { renderHook } from '@testing-library/react'
import { AuthProvider } from './AuthContext'
import { ShellProvider, useShell } from './ShellContext'

describe('useShell', () => {
    it('returns isTourActive as false initially', () => {
        const { result } = renderHook(() => useShell(), {
            wrapper: ({ children }) => (
                <AuthProvider><ShellProvider>{children}</ShellProvider></AuthProvider>
            ),
        })
        expect(result.current.isTourActive).toBe(false)
    })

    it('returns hasSeenTour as false initially', () => {
        const { result } = renderHook(() => useShell(), {
            wrapper: ({ children }) => (
                <AuthProvider><ShellProvider>{children}</ShellProvider></AuthProvider>
            ),
        })
        expect(result.current.hasSeenTour).toBe(false)
    })

    it('returns notification as null initially', () => {
        const { result } = renderHook(() => useShell(), {
            wrapper: ({ children }) => (
                <AuthProvider><ShellProvider>{children}</ShellProvider></AuthProvider>
            ),
        })
        expect(result.current.notification).toBeNull()
    })

    it('provides startTour function', () => {
        const { result } = renderHook(() => useShell(), {
            wrapper: ({ children }) => (
                <AuthProvider><ShellProvider>{children}</ShellProvider></AuthProvider>
            ),
        })
        expect(typeof result.current.startTour).toBe('function')
    })

    it('provides endTour function', () => {
        const { result } = renderHook(() => useShell(), {
            wrapper: ({ children }) => (
                <AuthProvider><ShellProvider>{children}</ShellProvider></AuthProvider>
            ),
        })
        expect(typeof result.current.endTour).toBe('function')
    })

    it('provides showNotification function', () => {
        const { result } = renderHook(() => useShell(), {
            wrapper: ({ children }) => (
                <AuthProvider><ShellProvider>{children}</ShellProvider></AuthProvider>
            ),
        })
        expect(typeof result.current.showNotification).toBe('function')
    })

    it('provides dismissNotification function', () => {
        const { result } = renderHook(() => useShell(), {
            wrapper: ({ children }) => (
                <AuthProvider><ShellProvider>{children}</ShellProvider></AuthProvider>
            ),
        })
        expect(typeof result.current.dismissNotification).toBe('function')
    })

    it('throws when used outside provider', () => {
        expect(() => renderHook(() => useShell())).toThrow()
    })
})