import { renderHook } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"

import { usePreload } from "./usePreload"

function wrapper(initialEntry: string) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    }
}

describe("usePreload", () => {
    it("does not throw when rendered on a known route", () => {
        const { result } = renderHook(() => usePreload(), {
            wrapper: wrapper("/home"),
        })
        expect(result.current).toBeUndefined()
    })

    it("does not throw when rendered on an unknown route", () => {
        const { result } = renderHook(() => usePreload(), {
            wrapper: wrapper("/some-unknown-path"),
        })
        expect(result.current).toBeUndefined()
    })

    it("does not throw when PRELOAD_MAP entry exists for route", () => {
        const { result } = renderHook(() => usePreload(), {
            wrapper: wrapper("/language"),
        })
        expect(result.current).toBeUndefined()
    })

    it("handles multiple route changes without crashing", () => {
        const { result, rerender } = renderHook(() => usePreload(), {
            wrapper: wrapper("/home"),
        })
        rerender()
        expect(result.current).toBeUndefined()
    })

    it("preloads expected next routes from /login without crashing", () => {
        const { result } = renderHook(() => usePreload(), {
            wrapper: wrapper("/login"),
        })
        expect(result.current).toBeUndefined()
    })

    it("works with setTimeout fallback when requestIdleCallback is absent", () => {
        vi.useFakeTimers()
        try {
            const { result } = renderHook(() => usePreload(), {
                wrapper: wrapper("/home"),
            })
            vi.advanceTimersByTime(500)
            expect(result.current).toBeUndefined()
        } finally {
            vi.useRealTimers()
        }
    })

    it("uses requestIdleCallback when available", () => {
        const g = globalThis as Record<string, unknown>
        const origRIC = g.requestIdleCallback
        const origCIC = g.cancelIdleCallback

        g.requestIdleCallback = (fn: () => void) => { void fn; return 1 }
        g.cancelIdleCallback = vi.fn()

        try {
            const { result } = renderHook(() => usePreload(), {
                wrapper: wrapper("/home"),
            })
            expect(result.current).toBeUndefined()
        } finally {
            if (origRIC !== undefined) {
                g.requestIdleCallback = origRIC
            } else {
                delete g.requestIdleCallback
            }
            if (origCIC !== undefined) {
                g.cancelIdleCallback = origCIC
            } else {
                delete g.cancelIdleCallback
            }
        }
    })
})