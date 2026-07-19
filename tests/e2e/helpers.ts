import type { Page, ConsoleMessage } from '@playwright/test'

/**
 * Attaches a recorder that captures console errors and failed network
 * requests for the duration of a test. Returns an inspector + a flush
 * function so tests can assert "no console errors" or read the list.
 *
 * Whitelisted noise: Next.js dev mode HMR pings, source-map 404s in dev,
 * and known browser deprecation warnings.
 */
export function captureErrors(page: Page) {
  const consoleErrors: { text: string; location?: string }[] = []
  const networkFailures: { url: string; status: number; method: string }[] = []
  const pageErrors: string[] = []

  const NOISE = [
    /Download the React DevTools/i,
    /\/_next\/static\/webpack/i,
    /sourcemap/i,
    /Failed to load resource.*favicon/i,
    /\.map\b.*404/i,
  ]

  const isNoise = (s: string) => NOISE.some((r) => r.test(s))

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (!isNoise(text)) {
        consoleErrors.push({ text, location: msg.location()?.url })
      }
    }
  })

  page.on('pageerror', (err) => {
    if (!isNoise(err.message)) pageErrors.push(err.message)
  })

  page.on('response', (res) => {
    const status = res.status()
    const url = res.url()
    if (status >= 500 && !isNoise(url)) {
      networkFailures.push({ url, status, method: res.request().method() })
    }
  })

  return {
    consoleErrors,
    networkFailures,
    pageErrors,
    summary() {
      return {
        consoleErrors: consoleErrors.length,
        pageErrors: pageErrors.length,
        networkFailures: networkFailures.length,
      }
    },
  }
}

/**
 * Public routes — accessible without auth. If any of these errors out,
 * acquisition is broken.
 */
export const PUBLIC_ROUTES: { path: string; expectedText?: string | RegExp }[] = [
  { path: '/', expectedText: /Quant X|Sign in|Get started|Start free|Pricing/i },
  { path: '/login', expectedText: /Sign in|Login|email|password/i },
  { path: '/signup', expectedText: /Sign up|Create|account|email/i },
  { path: '/forgot-password', expectedText: /reset|password|email/i },
  { path: '/verify-email', expectedText: /verify|email/i },
  { path: '/pricing', expectedText: /Pricing|Pro|Elite|Free/i },
  { path: '/proof', expectedText: /track|record|signal/i },
  { path: '/proof?tab=models', expectedText: /Model|accuracy|win rate|engine/i },
  { path: '/proof?tab=regime', expectedText: /Regime|market|bull|bear/i },
  { path: '/privacy', expectedText: /privacy/i },
  { path: '/terms', expectedText: /terms/i },
]

/**
 * Authenticated routes — should redirect to /login when no session.
 */
export const PROTECTED_ROUTES: string[] = [
  '/portfolio',
  '/portfolio/doctor',
  '/trades',
  '/watchlist',
  '/signals',
  '/scanner',
  '/stocks',
  '/autopilot',
  '/paper-trading',
  '/copilot',
  '/referrals',
  '/settings',
  '/admin',
]
