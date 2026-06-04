// ─── NotificationCenter: History Screen ───

import { useState } from 'react';
import { ArrowLeft, BellOff, CheckCheck, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PushNotification, NotificationType } from '../types';
import { NOTIFICATION_TYPE_LABELS } from '../types';

interface NotificationCenterProps {
    notifications: PushNotification[];
    unreadCount: number;
    onMarkRead: (id: string) => Promise<void>;
    onMarkAllRead: () => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onClose: () => void;
}

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function groupByDate(notifications: PushNotification[]): Map<string, PushNotification[]> {
    const groups = new Map<string, PushNotification[]>();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 7 * 86400000;

    for (const n of notifications) {
        const date = new Date(n.receivedAt);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

        let group: string;
        if (dayStart >= today) {
            group = 'Today';
        } else if (dayStart >= yesterday) {
            group = 'Yesterday';
        } else if (dayStart >= weekAgo) {
            group = 'This Week';
        } else {
            group = 'Older';
        }

        if (!groups.has(group)) groups.set(group, []);
        groups.get(group)!.push(n);
    }

    return groups;
}

const TYPE_DOT_COLORS: Record<NotificationType, string> = {
    new_load: 'bg-blue-500',
    accepted: 'bg-green-500',
    status_update: 'bg-amber-500',
    earnings: 'bg-emerald-500',
    announcement: 'bg-slate-400',
};

export function NotificationCenter({
    notifications,
    unreadCount,
    onMarkRead,
    onMarkAllRead,
    onDelete,
    onClose,
}: NotificationCenterProps) {
    const { t } = useTranslation();
    const [swiping, setSwiping] = useState<string | null>(null);
    const [touchStartX, setTouchStartX] = useState(0);

    const grouped = groupByDate(notifications);
    const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older'].filter((g) => grouped.has(g));

    const handleTouchStart = (id: string, e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
        setSwiping(id);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!swiping) return;
        const diff = touchStartX - e.touches[0].clientX;
        if (diff > 80) {
            onDelete(swiping);
            setSwiping(null);
        }
    };

    const handleTouchEnd = () => {
        setSwiping(null);
    };

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-hairline safe-top">
                <button
                    onClick={onClose}
                    className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-surface-grey transition"
                >
                    <ArrowLeft className="w-5 h-5 text-ink" />
                </button>
                <h2 className="text-lg font-black text-ink">
                    {t('notifications.center.title', 'Notifications')}
                </h2>
                <button
                    onClick={onMarkAllRead}
                    disabled={unreadCount === 0}
                    className="h-10 px-3 rounded-full flex items-center gap-1.5 text-sm font-bold text-accent hover:bg-accent-soft transition disabled:opacity-30"
                >
                    <CheckCheck className="w-4 h-4" />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                        <div className="h-16 w-16 rounded-3xl bg-surface-grey flex items-center justify-center mb-4">
                            <BellOff className="w-8 h-8 text-ink-faint" />
                        </div>
                        <p className="text-base font-black text-ink-muted">
                            {t('notifications.center.empty', 'No notifications yet')}
                        </p>
                        <p className="text-sm font-medium text-ink-faint mt-1">
                            {t(
                                'notifications.center.empty_subtitle',
                                'You\'ll see trip updates, new loads, and earnings here.',
                            )}
                        </p>
                    </div>
                ) : (
                    groupOrder.map((group) => (
                        <div key={group}>
                            <div className="px-5 pt-5 pb-2">
                                <span className="text-xs font-black text-ink-faint uppercase tracking-wider">
                                    {group}
                                </span>
                            </div>
                            {grouped.get(group)!.map((n) => (
                                <div
                                    key={n.id}
                                    onTouchStart={(e) => handleTouchStart(n.id, e)}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                    onClick={() => {
                                        if (!n.read) onMarkRead(n.id);
                                    }}
                                    className={`px-5 py-3.5 flex items-start gap-3 border-b border-hairline/50 transition hover:bg-surface-grey/50 ${swiping === n.id ? 'translate-x-[-80px] opacity-50' : ''
                                        }`}
                                >
                                    {/* Unread dot */}
                                    <div className="mt-1.5 shrink-0">
                                        {!n.read && (
                                            <span className="block h-2.5 w-2.5 rounded-full bg-accent" />
                                        )}
                                    </div>

                                    {/* Type indicator */}
                                    <div className="shrink-0 mt-0.5">
                                        <span
                                            className={`inline-block h-2 w-2 rounded-full ${TYPE_DOT_COLORS[n.type] || 'bg-slate-400'}`}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-black text-ink-faint uppercase tracking-wider">
                                                {NOTIFICATION_TYPE_LABELS[n.type] || n.type}
                                            </span>
                                            <span className="text-[10px] font-bold text-ink-faint shrink-0">
                                                {formatTime(n.receivedAt)}
                                            </span>
                                        </div>
                                        <p className={`text-sm mt-0.5 leading-tight ${n.read ? 'font-medium text-ink-muted' : 'font-black text-ink'}`}>
                                            {n.title}
                                        </p>
                                        <p className={`text-xs mt-0.5 leading-normal ${n.read ? 'text-ink-faint' : 'font-medium text-ink-muted'}`}>
                                            {n.body}
                                        </p>
                                    </div>

                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(n.id);
                                        }}
                                        className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center hover:bg-red-50 transition"
                                        aria-label="Delete notification"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-ink-faint hover:text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}