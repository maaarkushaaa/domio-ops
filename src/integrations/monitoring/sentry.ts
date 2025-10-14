export function initSentry(options?: {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
}) {
  const { dsn, environment, tracesSampleRate = 0.1, replaysSessionSampleRate = 0.0 } = options || {};
  if (!dsn) return; // no-op unless DSN provided

  // Dynamic import so build doesn't fail if @sentry/react is not installed
  import('@sentry/react')
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
