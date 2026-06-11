import * as Sentry from '@sentry/react';

declare const __VITE_SENTRY_DSN__: string;
declare const __VITE_API_MODE__: string;
declare const __VITE_APP_VERSION__: string;

export function initSentry() {
    if (!__VITE_SENTRY_DSN__) return; // Skip in dev/mock mode

    Sentry.init({
        dsn: __VITE_SENTRY_DSN__,
        environment: __VITE_API_MODE__,
        release: __VITE_APP_VERSION__,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
    });
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
    Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
}