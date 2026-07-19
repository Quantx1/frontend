/**
 * Next.js instrumentation hook — runs once per server bootstrap.
 * Loads the right Sentry config depending on the runtime
 * (Node.js → sentry.server.config; Edge → sentry.edge.config).
 *
 * The client-side config (sentry.client.config) is bundled into the
 * client bundle by withSentryConfig in next.config.js.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
