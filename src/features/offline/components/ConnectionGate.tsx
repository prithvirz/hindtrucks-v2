import type { ReactNode } from 'react';
import { useShell } from '../../../state/ShellContext';
import { OfflineFallback } from './OfflineFallback';

interface ConnectionGateProps {
    children: ReactNode;
    fallback?: ReactNode;
    requireOnline?: boolean;
}

export function ConnectionGate({
    children,
    fallback,
    requireOnline = true,
}: ConnectionGateProps) {
    const { isOnline } = useShell();

    if (requireOnline && !isOnline) {
        return <>{fallback ?? <OfflineFallback />}</>;
    }

    return <>{children}</>;
}