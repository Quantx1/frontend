/**
 * Sentry server-side init — runs in every Next.js request handler that
 * executes server-side (Server Components, Route Handlers, server actions,
 * middleware fallthrough).
 *
 * The Python FastAPI backend has its OWN Sentry init at
 * backend/api/app.py:50-119. This file only covers the Next.js
 * serverless layer (rare for us since most logic lives on the FastAPI
 * side, but still worth catching SSR errors before users see a 500).
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
