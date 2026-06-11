import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Maps a current route path to an array of likely next-route module paths.
 * Each path uses a dynamic import() string that Vite can resolve at build time.
 *
 * Preloading is non-blocking — import() returns a promise that warms the
 * browser module cache without executing the component.
 */
const PRELOAD_MAP: Record<string, string[]> = {
    '/language': ['/auth', '/login'],
    '/auth': ['/login', '/otp', '/register'],
    '/login': ['/otp', '/home'],
    '/otp': ['/home', '/register'],
    '/register': ['/home'],
    '/home': ['/loads', '/earnings'],
    '/loads': ['/earnings', '/load-detail'],
    '/earnings': ['/profile', '/loads'],
    '/profile': ['/home', '/earnings'],
}

const ROUTE_IMPORT_MAP: Record<string, () => Promise<unknown>> = {
    '/language': () => import('../screens/LanguagePicker'),
    '/auth': () => import('../screens/AuthChoice'),
    '/login': () => import('../screens/Login'),
    '/otp': () => import('../screens/Otp'),
    '/register': () => import('../screens/Register'),
    '/home': () => import('../screens/Home'),
    '/loads': () => import('../screens/Loads'),
    '/load-detail': () => import('../screens/LoadDetail'),
    '/trip': () => import('../screens/ActiveTrip'),
    '/earnings': () => import('../screens/Earnings'),
    '/profile': () => import('../screens/Profile'),
}

/**
 * Hook that preloads the next likely routes whenever the current route changes.
 * Uses idle callback (or setTimeout fallback) to avoid competing with
 * critical rendering work.
 */
export function usePreload(): void {
    const { pathname } = useLocation()
    const preloadedRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        const nextRoutes = PRELOAD_MAP[pathname]
        if (!nextRoutes || nextRoutes.length === 0) return

        const preloadWithIdle = () => {
            for (const route of nextRoutes) {
                if (preloadedRef.current.has(route)) continue
                preloadedRef.current.add(route)

                const loader = ROUTE_IMPORT_MAP[route]
                if (loader) {
                    loader().catch(() => {
                        preloadedRef.current.delete(route)
                    })
                }
            }
        }

        // Use globalThis property access to avoid ReferenceError in jsdom
        // when cancelIdleCallback is not defined.
        const g = globalThis as Record<string, unknown>
        const ric = g.requestIdleCallback as ((cb: () => void, opts?: { timeout?: number }) => number) | undefined
        const cic = g.cancelIdleCallback as ((handle: number) => void) | undefined

        if (typeof ric === 'function' && typeof cic === 'function') {
            const handle = ric(preloadWithIdle, { timeout: 2000 })
            return () => { cic(handle) }
        } else {
            const handle = setTimeout(preloadWithIdle, 300) as unknown as number
            return () => clearTimeout(handle)
        }
    }, [pathname])
}