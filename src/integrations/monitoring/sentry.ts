export function initSentry(options?: {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
}) {
  const { dsn, environment, tracesSampleRate = 0.1, replaysSessionSampleRate = 0.0 } = options || {};
  if (!dsn) return; // no-op unless DSN provided

  // Dynamic import with vite-ignore so build doesn't try to resolve when package is absent
  const sentryModuleName = '@sentry/react';
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  import(/* @vite-ignore */ sentryModuleName)
    .then((Sentry) => {
      try {
        Sentry.init({
          dsn,
          environment: environment || (import.meta as any)?.env?.MODE || 'production',
          tracesSampleRate,
          integrations: [],
        } as any);

        // Optional: replay only if package present
        // We won't import @sentry/replay to avoid hard dep
        // Users can extend this initializer later if needed
      } catch (e) {
        // swallow errors
        console.warn('[sentry] init failed:', e);
      }
    })
    .catch(() => {
      // Sentry not installed: ignore silently
    });
}
