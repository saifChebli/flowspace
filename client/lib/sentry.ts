import * as Sentry from '@sentry/react';

let started = false;

/**
 * Browser error tracking. No-op unless NEXT_PUBLIC_SENTRY_DSN is set.
 * Deliberately uses the plain React SDK rather than @sentry/nextjs so we don't
 * wrap this project's customised Next build config.
 */
export function initSentry(): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (started || !dsn || typeof window === 'undefined') return;
  started = true;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

export { Sentry };
