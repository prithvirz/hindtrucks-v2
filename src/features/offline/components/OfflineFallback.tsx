import { WifiOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OfflineFallback() {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <WifiOff className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">
                {t('offline.title', 'No Connection')}
            </h3>
            <p className="text-sm text-ink-muted mb-6 max-w-xs">
                {t('offline.description', 'This feature requires an internet connection. Please check your connection and try again.')}
            </p>
            <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            >
                <RefreshCw className="w-4 h-4" />
                {t('offline.retry', 'Retry')}
            </button>
        </div>
    );
}