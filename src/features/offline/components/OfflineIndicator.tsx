import { WifiOff } from 'lucide-react';
import { useShell } from '../../../state/ShellContext';
import { useTranslation } from 'react-i18next';

export function OfflineIndicator() {
    const { isOnline } = useShell();
    const { t } = useTranslation();

    if (isOnline) return null;

    return (
        <div className="bg-amber-500 text-white text-center py-1.5 text-sm font-medium flex items-center justify-center gap-1">
            <WifiOff className="w-4 h-4" />
            <span>{t('offline.banner', "You're offline. Changes will sync when connected.")}</span>
        </div>
    );
}