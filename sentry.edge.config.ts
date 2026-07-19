/**
 * Sentry edge init — runs in Next.js middleware + any Edge runtime
 * Route Handlers. Today we only use middleware (frontend/middleware.ts)
 * for CSP/nonce + the dev auth bypass; this catches edge errors there.
 */

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    release:
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
      undefined,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    sampleRate: 1.0,
    sendDefaultPii: false,
  })
}
