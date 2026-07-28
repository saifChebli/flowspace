import * as Sentry from '@sentry/node';

/**
 * Initialise error tracking. No-op unless SENTRY_DSN is set, so local dev and
 * self-hosted installs run untouched.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // Trace a small sample of requests; errors are always captured.
    tracesSampleRate: 0.1,
    // Never ship user content or credentials to a third party.
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.data) delete event.request.data;
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers['x-portal-token'];
      }
      return event;
    },
  });
  console.log('[sentry] error tracking enabled');
}

export const isSentryEnabled = (): boolean => !!process.env.SENTRY_DSN;
export { Sentry };
