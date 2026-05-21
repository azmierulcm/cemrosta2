import * as Sentry from '@sentry/nextjs';

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Sentry] Exception:', error, context);
    return;
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Sentry] Message [${level}]:`, message);
    return;
  }
  Sentry.captureMessage(message, level);
}
