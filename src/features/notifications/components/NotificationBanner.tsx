// ─── NotificationBanner: In-App Toast ───

import { useEffect } from 'react';
import { X, Bell, Package, CheckCircle, RefreshCw, CreditCard, Megaphone } from 'lucide-react';
import type { PushNotification, NotificationType } from '../types';

interface NotificationBannerProps {
    notification: PushNotification;
    onDismiss: () => void;
    onTap: (deepLink?: string) => void;
}

const ICON_MAP: Record<NotificationType, typeof Bell> = {
    new_load: Package,
    accepted: CheckCircle,
    status_update: RefreshCw,
    earnings: CreditCard,
    announcement: Megaphone,
};

const COLOR_MAP: Record<NotificationType, string> = {
    new_load: 'bg-blue-50 border-blue-200 text-blue-700',
    accepted: 'bg-green-50 border-green-200 text-green-700',
    status_update: 'bg-amber-50 border-amber-200 text-amber-700',
    earnings: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    announcement: 'bg-slate-50 border-slate-200 text-slate-700',
};

const ICON_BG_MAP: Record<NotificationType, string> = {
    new_load: 'bg-blue-100 text-blue-600',
    accepted: 'bg-green-100 text-green-600',
    status_update: 'bg-amber-100 text-amber-600',
    earnings: 'bg-emerald-100 text-emerald-600',
    announcement: 'bg-slate-100 text-slate-600',
};

export function NotificationBanner({ notification, onDismiss, onTap }: NotificationBannerProps) {
    const Icon = ICON_MAP[notification.type] || Bell;
    const colorClass = COLOR_MAP[notification.type] || COLOR_MAP.announcement;
    const iconBgClass = ICON_BG_MAP[notification.type] || ICON_BG_MAP.announcement;

    // Auto-dismiss after 8 seconds
    useEffect(() => {
        const timer = setTimeout(onDismiss, 8000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div
            onClick={() => onTap(notification.deepLink)}
            className={`animate-slide-down cursor-pointer select-none mx-4 mt-2 rounded-2xl border p-3.5 flex items-start gap-3 shadow-pop ${colorClass}`}
        >
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black leading-tight">{notification.title}</p>
                <p className="text-xs font-medium mt-0.5 leading-normal opacity-80">{notification.body}</p>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                }}
                className="shrink-0 h-7 w-7 rounded-lg border border-transparent flex items-center justify-center hover:bg-black/5 hover:border-black/10 transition"
                aria-label="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
