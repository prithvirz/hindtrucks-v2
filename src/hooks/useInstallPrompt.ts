import { useState, useEffect, useCallback, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    prompt(): Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export interface InstallPromptState {
    canInstall: boolean
    isInstalled: boolean
    promptInstall: () => Promise<{ outcome: 'accepted' | 'dismissed' } | null>
}

export function useInstallPrompt(): InstallPromptState {
    const [canInstall, setCanInstall] = useState<boolean>(false)
    const [isInstalled, setIsInstalled] = useState<boolean>(false)
    const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

    const handleBeforeInstallPrompt = useCallback((event: Event) => {
        event.preventDefault()
        deferredPromptRef.current = event as BeforeInstallPromptEvent
        setCanInstall(true)
    }, [])

    const handleAppInstalled = useCallback(() => {
        setIsInstalled(true)
        setCanInstall(false)
        deferredPromptRef.current = null
    }, [])

    useEffect(() => {
        // Check if already in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
        }

        const standaloneListener = (e: MediaQueryListEvent) => {
            if (e.matches) setIsInstalled(true)
        }
        const mediaQuery = window.matchMedia('(display-mode: standalone)')
        mediaQuery.addEventListener('change', standaloneListener)

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)

        return () => {
            mediaQuery.removeEventListener('change', standaloneListener)
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
        }
    }, [handleBeforeInstallPrompt, handleAppInstalled])

    const promptInstall = useCallback(async (): Promise<{ outcome: 'accepted' | 'dismissed' } | null> => {
        const deferredPrompt = deferredPromptRef.current
        if (!deferredPrompt) return null

        deferredPromptRef.current = null
        setCanInstall(false)

        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice

        if (choice.outcome === 'accepted') {
            setIsInstalled(true)
        }

        return { outcome: choice.outcome }
    }, [])

    return { canInstall, isInstalled, promptInstall }
}