/**
 * Sentry client-side init — runs in every visitor's browser.
 *
 * Guarded by NEXT_PUBLIC_SENTRY_DSN so a deploy without the DSN configured
 * silently no-ops rather than crashing on every page load. Release tag is
 * fed by the Vercel build env (NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA) so each
 * deploy gets a distinct release and the source maps land on the right one.
 *
 * Tracing is sampled at 10% to keep within the free tier's 50k/mo cap
 * without losing meaningful coverage; bump to 50%+ once we have a paid plan.
 */

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,

    // Release tag — matches the backend's preference order so frontend +
    // backend errors group on the same commit SHA.
    release:
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
      process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ||
      undefined,

    environment: process.env.NODE_ENV,

    // 10% trace sample for prod, 100% for dev to make debugging cheap.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Capture every error in dev; 1.0 is intentional even in prod since
    // errors are not the high-volume signal here (traces are).
    sampleRate: 1.0,

    // PII off by default. We never want to ship email / IP / auth headers
    // to Sentry — the backend has the same posture.
    sendDefaultPii: false,

    // Drop noisy / known-benign errors before they bill against the quota.
    ignoreErrors: [
      // Browser extensions / quarantined script errors that we can't fix.
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications.',
      'Non-Error promise rejection captured',
      // Auth cookie races during fast nav — handled by ClientAuthGate.
      /AbortError: The user aborted a request/,
    ],

    beforeSend(event) {
      // Belt-and-braces PII scrub. Mirrors backend behaviour in
      // backend/api/app.py:76-107.
      if (event.request?.headers) {
        for (const k of Object.keys(event.request.headers)) {
          if (/authorization|cookie|api[-_]?key|secret|password|broker[-_]?token/i.test(k)) {
            event.request.headers[k] = '[scrubbed]'
          }
        }
      }
      return event
    },
  })
}
