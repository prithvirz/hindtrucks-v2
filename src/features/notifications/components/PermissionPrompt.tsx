// ─── PermissionPrompt: Push Opt-In Modal ───

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PermissionPromptProps {
    onEnable: () => Promise<boolean>;
    onDismiss: () => void;
    visible: boolean;
}

export function PermissionPrompt({ onEnable, onDismiss, visible }: PermissionPromptProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    if (!visible) return null;

    const handleEnable = async () => {
        setLoading(true);
        try {
            await onEnable();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-sm mx-4 rounded-3xl shadow-elevated animate-slide-up safe-bottom">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-3">
                    <div className="h-12 w-12 rounded-2xl bg-accent-soft flex items-center justify-center">
                        <Bell className="w-6 h-6 text-accent" />
                    </div>
                    <button
                        onClick={onDismiss}
                        className="h-8 w-8 rounded-full bg-surface-grey flex items-center justify-center hover:bg-hairline transition"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4 text-ink-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-2">
                    <h3 className="text-xl font-black text-ink">
                        {t('notifications.permission.title', 'Stay Updated')}
                    </h3>
                    <p className="text-sm font-medium text-ink-muted mt-2">
                        {t(
                            'notifications.permission.subtitle',
                            'Get notified when new loads are available, your trip status changes, or earnings are credited.',
                        )}
                    </p>
                    <ul className="mt-4 space-y-2.5">
                        {[
                            { key: 'new_load', label: t('notifications.types.new_load', 'New loads available') },
                            { key: 'accepted', label: t('notifications.types.accepted', 'Load accepted confirmation') },
                            { key: 'status_update', label: t('notifications.types.status_update', 'Trip status changes') },
                            { key: 'earnings', label: t('notifications.types.earnings', 'Earnings credited') },
                        ].map((item) => (
                            <li key={item.key} className="flex items-center gap-3 text-sm font-medium text-ink-muted">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                                {item.label}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 pt-4 pb-6">
                    <button
                        onClick={onDismiss}
                        className="flex-1 h-12 rounded-2xl bg-surface-grey text-ink-muted font-bold text-sm hover:bg-hairline transition"
                    >
                        {t('common.maybe_later', 'Maybe Later')}
                    </button>
                    <button
                        onClick={handleEnable}
                        disabled={loading}
                        className="flex-1 h-12 rounded-2xl bg-accent text-white font-bold text-sm hover:bg-accent-dark transition disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="inline-block h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                            t('common.enable', 'Enable')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}