import { renderHook, act } from "@testing-library/react"

import { useInstallPrompt } from "./useInstallPrompt"

describe("useInstallPrompt", () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it("returns canInstall=false when no prompt event has fired", () => {
        const { result } = renderHook(() => useInstallPrompt())
        expect(result.current.canInstall).toBe(false)
        expect(result.current.isInstalled).toBe(false)
    })

    it("sets canInstall=true when beforeinstallprompt fires", () => {
        const { result } = renderHook(() => useInstallPrompt())
        const fakeEvent = new Event("beforeinstallprompt")
        act(() => {
            window.dispatchEvent(fakeEvent)
        })
        expect(result.current.canInstall).toBe(true)
    })

    it("promptInstall returns null when no deferred prompt is stored", async () => {
        const { result } = renderHook(() => useInstallPrompt())
        const outcome = await act(() => result.current.promptInstall())
        expect(outcome).toBeNull()
    })

    it("promptInstall calls prompt() on stored event and sets canInstall=false", async () => {
        const { result } = renderHook(() => useInstallPrompt())
        const fakeEvent = new Event("beforeinstallprompt")
        Object.defineProperty(fakeEvent, "prompt", {
            value: vi.fn(async () => ({ outcome: "accepted", platform: "web" })),
        })
        Object.defineProperty(fakeEvent, "userChoice", {
            value: Promise.resolve({ outcome: "accepted", platform: "web" }),
        })

        act(() => {
            window.dispatchEvent(fakeEvent)
        })
        expect(result.current.canInstall).toBe(true)

        let outcome: { outcome: "accepted" | "dismissed" } | null = null
        await act(async () => {
            outcome = await result.current.promptInstall()
        })

        expect(
            (fakeEvent as unknown as { prompt: ReturnType<typeof vi.fn> }).prompt,
        ).toHaveBeenCalledOnce()
        expect(outcome).toEqual({ outcome: "accepted" })
        expect(result.current.canInstall).toBe(false)
    })

    it("sets isInstalled=true after appinstalled event", () => {
        const { result } = renderHook(() => useInstallPrompt())
        act(() => {
            window.dispatchEvent(new Event("appinstalled"))
        })
        expect(result.current.isInstalled).toBe(true)
    })

    it("promptInstall cannot be called twice — second call returns null", async () => {
        const { result } = renderHook(() => useInstallPrompt())
        const fakeEvent = new Event("beforeinstallprompt")
        Object.defineProperty(fakeEvent, "prompt", {
            value: vi.fn(async () => ({ outcome: "accepted", platform: "web" })),
        })
        Object.defineProperty(fakeEvent, "userChoice", {
            value: Promise.resolve({ outcome: "accepted", platform: "web" }),
        })

        act(() => {
            window.dispatchEvent(fakeEvent)
        })

        await act(async () => {
            await result.current.promptInstall()
        })

        const secondOutcome = await act(() => result.current.promptInstall())
        expect(secondOutcome).toBeNull()
    })

    it("handles dismissed prompt outcome", async () => {
        const { result } = renderHook(() => useInstallPrompt())
        const fakeEvent = new Event("beforeinstallprompt")
        Object.defineProperty(fakeEvent, "prompt", {
            value: vi.fn(async () => ({ outcome: "dismissed", platform: "web" })),
        })
        Object.defineProperty(fakeEvent, "userChoice", {
            value: Promise.resolve({ outcome: "dismissed", platform: "web" }),
        })

        act(() => {
            window.dispatchEvent(fakeEvent)
        })

        let outcome: { outcome: "accepted" | "dismissed" } | null = null
        await act(async () => {
            outcome = await result.current.promptInstall()
        })

        expect(outcome).toEqual({ outcome: "dismissed" })
        expect(result.current.isInstalled).toBe(false)
        expect(result.current.canInstall).toBe(false)
    })
})