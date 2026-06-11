import { initSentry, captureException, captureMessage } from './sentry';
import * as Sentry from '@sentry/react';

describe('Sentry', () => {
    it('skips init when DSN is empty', () => {
        initSentry();
        expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('captures exceptions with context', () => {
        const error = new Error('test');
        captureException(error, { userId: '123' });
        expect(Sentry.captureException).toHaveBeenCalledWith(error, { extra: { userId: '123' } });
    });

    it('captures messages with level', () => {
        captureMessage('test msg', 'warning');
        expect(Sentry.captureMessage).toHaveBeenCalledWith('test msg', 'warning');
    });
});