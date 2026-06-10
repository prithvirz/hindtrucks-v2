import { WifiOff, Loader2 } from 'lucide-react';
import { useShell } from '../../../state/ShellContext';
import { useTranslation } from 'react-i18next';

export function OfflineIndicator() {
    const { isOnline, offlineQueueSize, syncStatus, syncQueue } = useShell();
    const { t } = useTranslation();

    // Show nothing when online with no pending actions and not syncing
    if (isOnline && offlineQueueSize === 0 && syncStatus === 'idle') return null;

    return (
        <div data-testid="offline-indicator" className="bg-amber-500 text-white text-center py-1.5 text-sm font-medium flex items-center justify-center gap-1">
            {!isOnline && (
                <>
                    <WifiOff className="w-4 h-4" />
                    <span>
                        {offlineQueueSize > 0
                            ? t('offline.pending', `${offlineQueueSize} changes pending`)
                            : t('offline.banner', "You're offline. Changes will sync when connected.")}
                    </span>
                </>
            )}
            {isOnline && syncStatus === 'syncing' && (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('offline.syncing', 'Syncing changes...')}</span>
                </>
            )}
            {isOnline && offlineQueueSize > 0 && syncStatus === 'error' && (
                <button onClick={syncQueue} className="underline cursor-pointer">
                    {t('offline.retry', 'Sync failed. Tap to retry.')}
                </button>
            )}
        </div>
    );
}