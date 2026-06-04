// ─── Notification Permission Hook ───

import { useState, useCallback, useEffect } from 'react';
import { NOTIFICATION_PERMISSION_KEY, NOTIFICATION_PRMPT_COOLDOWN_DAYS } from '../types';
import type { NotificationPermissionState } from '../types';

interface UseNotificationPermissionReturn {
    permissionState: NotificationPermissionState;
    checkPermission: () => void;
    markPrompted: () => void;
    resetPromptCooldown: () => void;
}

export function useNotificationPermission(): UseNotificationPermissionReturn {
    const [permissionState, setPermissionState] = useState<NotificationPermissionState>(() => {
        const promptedBefore = localStorage.getItem(NOTIFICATION_PERMISSION_KEY) !== null;
        return {
            push: 'prompt' as PermissionState,
            needsPrompt: false,
            promptedBefore,
        };
    });

    const checkPermission = useCallback(() => {
        if (!('Notification' in window)) {
            setPermissionState({
                push: 'denied' as PermissionState,
                needsPrompt: false,
                promptedBefore: true,
            });
            return;
        }

        const currentPermission = Notification.permission as PermissionState;
        const promptedBefore = localStorage.getItem(NOTIFICATION_PERMISSION_KEY) !== null;

        let needsPrompt = false;

        if (currentPermission === 'granted' || currentPermission === 'denied') {
            needsPrompt = false;
        } else if (currentPermission === 'prompt' || currentPermission === 'default') {
            if (!promptedBefore) {
                needsPrompt = true;
            } else {
                const lastPrompted = parseInt(localStorage.getItem(NOTIFICATION_PERMISSION_KEY) || '0', 10);
                const cooldownMs = NOTIFICATION_PRMPT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
                if (Date.now() - lastPrompted > cooldownMs) {
                    needsPrompt = true;
                }
            }
        }

        setPermissionState({
            push: currentPermission,
            needsPrompt,
            promptedBefore,
        });
    }, []);

    const markPrompted = useCallback(() => {
        localStorage.setItem(NOTIFICATION_PERMISSION_KEY, String(Date.now()));
        setPermissionState((prev) => ({
            ...prev,
            promptedBefore: true,
            needsPrompt: false,
        }));
    }, []);

    const resetPromptCooldown = useCallback(() => {
        localStorage.removeItem(NOTIFICATION_PERMISSION_KEY);
        checkPermission();
    }, [checkPermission]);

    useEffect(() => {
        checkPermission();
    }, [checkPermission]);

    return {
        permissionState,
        checkPermission,
        markPrompted,
        resetPromptCooldown,
    };
}