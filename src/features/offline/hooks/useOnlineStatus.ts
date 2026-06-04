import { useState, useEffect, useCallback, useRef } from 'react';

interface OnlineStatus {
    isOnline: boolean;
    wasOffline: boolean;
    lastOnlineAt: number;
    lastOfflineAt: number;
}

export function useOnlineStatus(): OnlineStatus {
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    const [lastOnlineAt, setLastOnlineAt] = useState<number>(Date.now());
    const [lastOfflineAt, setLastOfflineAt] = useState<number>(0);
    const wasOfflineRef = useRef<boolean>(false);
    const [wasOffline, setWasOffline] = useState<boolean>(false);

    const handleOnline = useCallback(() => {
        setIsOnline(true);
        setLastOnlineAt(Date.now());
        wasOfflineRef.current = true;
        setWasOffline(true);
    }, []);

    const handleOffline = useCallback(() => {
        setIsOnline(false);
        setLastOfflineAt(Date.now());
    }, []);

    useEffect(() => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [handleOnline, handleOffline]);

    // Reset wasOffline after it's been consumed
    useEffect(() => {
        if (wasOffline && isOnline) {
            const timer = setTimeout(() => {
                setWasOffline(false);
                wasOfflineRef.current = false;
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [wasOffline, isOnline]);

    return {
        isOnline,
        wasOffline,
        lastOnlineAt,
        lastOfflineAt,
    };
}