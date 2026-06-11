// ─── NotificationCenter: History Screen ───

import { useState, useCallback, useRef, useEffect, type TouchEvent } from 'react';
import { ArrowLeft, BellOff, CheckCheck, Trash2, RefreshCw, Loader2 } from 'lucide-react';
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
    // NEW: Phase 6 enhancements
    onRefresh?: () => Promise<void>;
    onLoadMore?: () => Promise<void>;
    hasMore?: boolean;
}

type FilterValue = NotificationType | 'all';

interface FilterOption {
    key: FilterValue;
    label: string;
    color: string;
}

const FILTERS: FilterOption[] = [
    { key: 'all', label: 'All', color: 'bg-ink' },
    { key: 'new_load', label: 'Loads', color: 'bg-blue-500' },
    { key: 'accepted', label: 'Accepted', color: 'bg-green-500' },
    { key: 'status_update', label: 'Status', color: 'bg-amber-500' },
    { key: 'earnings', label: 'Earnings', color: 'bg-emerald-500' },
    { key: 'trip_reminder', label: 'Reminders', color: 'bg-indigo-500' },
    { key: 'chat_message', label: 'Messages', color: 'bg-violet-500' },
    { key: 'announcement', label: 'Announcements', color: 'bg-slate-400' },
    { key: 'system_announcement', label: 'System', color: 'bg-red-500' },
];

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
    trip_reminder: 'bg-indigo-500',
    geofence_alert: 'bg-orange-500',
    chat_message: 'bg-violet-500',
    system_announcement: 'bg-red-500',
};

// ─── Per-filter empty state copy ───
const EMPTY_FILTER_MESSAGES: Partial<Record<FilterValue, { title: string; subtitle: string }>> = {
    new_load: { title: 'No load notifications', subtitle: 'New load alerts will appear here.' },
    accepted: { title: 'No accepted notifications', subtitle: 'Accepted bid confirmations will appear here.' },
    status_update: { title: 'No status updates', subtitle: 'Trip progress updates will appear here.' },
    earnings: { title: 'No earnings notifications', subtitle: 'Payment and withdrawal updates will appear here.' },
    trip_reminder: { title: 'No trip reminders', subtitle: 'Upcoming trip reminders will appear here.' },
    chat_message: { title: 'No messages', subtitle: 'Chat notifications from shippers will appear here.' },
    announcement: { title: 'No announcements', subtitle: 'General announcements will appear here.' },
    system_announcement: { title: 'No system notifications', subtitle: 'Important system updates will appear here.' },
};

export function NotificationCenter({
    notifications,
    unreadCount,
    onMarkRead,
    onMarkAllRead,
    onDelete,
    onClose,
    onRefresh,
    onLoadMore,
    hasMore,
}: NotificationCenterProps) {
    const { t } = useTranslation();
    const [swiping, setSwiping] = useState<string | null>(null);
    const [touchStartX, setTouchStartX] = useState(0);
    const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const scrollEl = useRef<HTMLDivElement>(null);
    const pullStartY = useRef(0);
    const isPulling = useRef(false);

    // ─── Filtered + grouped ───
    const filtered = activeFilter === 'all'
        ? notifications
        : notifications.filter((n) => n.type === activeFilter);

    const grouped = groupByDate(filtered);
    const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older'].filter((g) => grouped.has(g));

    // ─── Pull-to-refresh ───
    const handlePullStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
        if (!onRefresh || !scrollEl.current) return;
        if (scrollEl.current.scrollTop > 0) return;
        pullStartY.current = e.touches[0].clientY;
        isPulling.current = true;
    }, [onRefresh]);

    const handlePullMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
        if (!isPulling.current || !onRefresh) return;
        const dist = e.touches[0].clientY - pullStartY.current;
        if (dist > 0) {
            setPullDistance(Math.min(dist * 0.4, 64));
        }
    }, [onRefresh]);

    const handlePullEnd = useCallback(async () => {
        if (!isPulling.current) return;
        isPulling.current = false;
        if (pullDistance >= 48 && onRefresh) {
            setRefreshing(true);
            try {
                await onRefresh();
            } finally {
                setRefreshing(false);
            }
        }
        setPullDistance(0);
    }, [pullDistance, onRefresh]);

    // ─── Infinite scroll ───
    useEffect(() => {
        if (!onLoadMore || !hasMore) return;
        const el = scrollEl.current;
        if (!el) return;

        const handleScroll = () => {
            if (loadingMore) return;
            const { scrollTop, scrollHeight, clientHeight } = el;
            if (scrollHeight - scrollTop - clientHeight < 200) {
                setLoadingMore(true);
                onLoadMore().finally(() => setLoadingMore(false));
            }
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [onLoadMore, hasMore, loadingMore]);

    // ─── Swipe handlers ───
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

    // ─── Filter counts ───
    const filterCounts: Record<FilterValue, number> = { all: notifications.length } as Record<FilterValue, number>;
    for (const n of notifications) {
        filterCounts[n.type] = (filterCounts[n.type] || 0) + 1;
    }

    return (
        <div className="fixed inset-0 z-50 bg-surface-base flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-hairline safe-top">
                <button
                    onClick={onClose}
                    className="h-9 w-9 rounded-lg border border-hairline bg-surface flex items-center justify-center hover:bg-surface-grey transition"
                >
                    <ArrowLeft className="w-5 h-5 text-ink" />
                </button>
                <h2 className="text-lg font-black text-ink">
                    {t('notifications.center.title', 'Notifications')}
                </h2>
                <button
                    onClick={onMarkAllRead}
                    disabled={unreadCount === 0}
                    className="h-9 px-3 rounded-lg border border-accent/25 bg-accent-soft flex items-center gap-1.5 text-sm font-bold text-accent hover:bg-[#ffe8d6] transition disabled:opacity-30"
                >
                    <CheckCheck className="w-4 h-4" />
                </button>
            </div>

            {/* Filter tabs */}
            <div className="border-b border-hairline">
                <div className="flex gap-1 px-3 py-2.5 overflow-x-auto no-scrollbar">
                    {FILTERS.map((f) => {
                        const isActive = activeFilter === f.key;
                        const count = filterCounts[f.key];
                        const showCount = f.key === 'all' || (count && count > 0);
                        return (
                            <button
                                key={f.key}
                                onClick={() => setActiveFilter(f.key)}
                                className={`shrink-0 h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${isActive
                                        ? 'bg-ink text-white'
                                        : 'bg-surface-grey text-ink-muted hover:bg-surface-grey/80'
                                    }`}
                            >
                                {f.key !== 'all' && (
                                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${f.color} ${isActive ? 'ring-1 ring-white/40' : ''}`} />
                                )}
                                {f.label}
                                {showCount && (
                                    <span className={`text-[10px] font-black ${isActive ? 'text-white/70' : 'text-ink-faint'}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Pull-to-refresh indicator */}
            {pullDistance > 0 && (
                <div
                    className="flex items-center justify-center transition-all"
                    style={{ height: pullDistance, opacity: pullDistance / 48 }}
                >
                    <RefreshCw className={`w-5 h-5 text-ink-faint ${refreshing ? 'animate-spin' : ''}`} />
                </div>
            )}
            {refreshing && pullDistance === 0 && (
                <div className="flex items-center justify-center h-10">
                    <RefreshCw className="w-5 h-5 text-ink-faint animate-spin" />
                </div>
            )}

            {/* List */}
            <div
                ref={scrollEl}
                className="flex-1 overflow-y-auto"
                onTouchStart={handlePullStart}
                onTouchMove={handlePullMove}
                onTouchEnd={handlePullEnd}
            >
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                        <div className="h-16 w-16 rounded-3xl bg-surface-grey flex items-center justify-center mb-4">
                            <BellOff className="w-8 h-8 text-ink-faint" />
                        </div>
                        <p className="text-base font-black text-ink-muted">
                            {activeFilter === 'all'
                                ? t('notifications.center.empty', 'No notifications yet')
                                : (EMPTY_FILTER_MESSAGES[activeFilter]?.title || 'No notifications')
                            }
                        </p>
                        <p className="text-sm font-medium text-ink-faint mt-1">
                            {activeFilter === 'all'
                                ? t('notifications.center.empty_subtitle', 'You\'ll see trip updates, new loads, and earnings here.')
                                : (EMPTY_FILTER_MESSAGES[activeFilter]?.subtitle || '')
                            }
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
                                        className="shrink-0 h-8 w-8 rounded-lg border border-transparent flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition"
                                        aria-label="Delete notification"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-ink-faint hover:text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))
                )}

                {/* Infinite scroll loading footer */}
                {loadingMore && (
                    <div className="flex items-center justify-center py-4 gap-2">
                        <Loader2 className="w-4 h-4 text-ink-faint animate-spin" />
                        <span className="text-xs font-bold text-ink-faint">Loading more...</span>
                    </div>
                )}
                {hasMore === false && filtered.length > 0 && (
                    <div className="py-6 text-center">
                        <span className="text-[10px] font-black text-ink-faint uppercase tracking-wider">
                            All caught up
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
