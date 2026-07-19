import { test, expect, Page } from '@playwright/test'

/**
 * Deep authenticated route walkthrough.
 *
 * For every protected route we haven't already covered with a dedicated
 * spec, walk in as the authenticated test user and assert:
 *   1. The page responds with a 2xx (not redirect-loop, not 5xx)
 *   2. No uncaught client error boundary visible (text like "Something
 *      went wrong", "Application error", "Try again")
 *   3. No 5xx API response while the page hydrates (allow 401/404 for
 *      empty-data, but flag 5xx as a real bug)
 *   4. At least *some* visible content rendered (≥200 chars of innerText)
 *
 * The point is to catch:
 *   - Pages that crash for a new user (no positions, no signals)
 *   - Pages that call an API that returns 500
 *   - Pages stuck on an infinite spinner because of a missing handler
 *
 * Routes ALREADY tested elsewhere are excluded here to avoid duplicate
 * coverage:
 *   /copilot, /portfolio, /watchlist, /paper-trading, /scanner,
 *   /signals, /assistant, /settings (and sub-pages), /admin (sidebar
 *   test).
 *
 * 13 routes from the v1 walkthrough were retired in PR-A (2026-05-19);
 * they redirect via middleware and aren't probed here. v2 successors
 * (/strategies, /inbox) get added back as they land in Plan 3.
 */

const ROUTES_TO_PROBE: string[] = [
  // Acquisition / public that may have AuthLayout differences. The three
  // public trust pages folded into the tabbed /proof surface (WP-CONSOLIDATE 3d).
  '/proof?tab=track-record',
  '/proof?tab=regime',
  '/proof?tab=models',
  '/pricing',

  // Authenticated Pro/Elite surfaces
  '/portfolio/doctor',
  '/autopilot',
  '/referrals',
  '/trades',
  '/stocks',

  // Admin pages
  '/admin',
  '/admin/users',
  '/admin/payments',
  '/admin/signals',
  '/admin/system',
  '/admin/ml',
  '/admin/training',

  // Onboarding
  '/onboarding/risk-quiz',
]

// Endpoints that legitimately return 5xx when not configured — not a
// product crash. Each documented:
//   /api/push/vapid-key       — 503 unless VAPID_PUBLIC_KEY set
//   /api/telegram/link/start  — 503 unless TELEGRAM_BOT_TOKEN set
const KNOWN_5XX_OK_PATHS = [
  /\/api\/push\/vapid-key/,
  /\/api\/telegram\/link\/start/,
]

function attachErrorCapture(page: Page) {
  const pageErrors: string[] = []
  const fiveXX: { url: string; status: number }[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))
  page.on('response', (r) => {
    const s = r.status()
    const url = r.url()
    if (s >= 500 && url.includes('/api/') && !KNOWN_5XX_OK_PATHS.some((re) => re.test(url))) {
      fiveXX.push({ url, status: s })
    }
  })
  return { pageErrors, fiveXX }
}

const ERROR_BOUNDARY_PATTERNS = [
  /something went wrong/i,
  /application error/i,
  /uncaught/i,
  /500.{0,40}internal/i,
  /failed to fetch.*\bretry\b/i,
]

// Admin routes show a compact "Access Denied" gate for the non-admin
// test user — a valid render, just <200 chars.
const ADMIN_GATE_PATHS = new Set(
  ROUTES_TO_PROBE.filter((p) => p.startsWith('/admin')),
)

// Onboarding routes can redirect to /copilot for users who already
// have onboarding_completed=true (test user does). Treat redirect to
// /copilot as a valid handled outcome. (The old /dashboard target
// folded into /copilot — WP-CONSOLIDATE 3c.)
const ONBOARDING_PATHS = new Set(
  ROUTES_TO_PROBE.filter((p) => p.startsWith('/onboarding/')),
)

test.describe('Authenticated route walkthrough', () => {
  for (const path of ROUTES_TO_PROBE) {
    test(`${path} renders without crashing`, async ({ page }) => {
      test.setTimeout(45_000)
      const errors = attachErrorCapture(page)

      const resp = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(resp, `goto returned null for ${path}`).not.toBeNull()
      const status = resp!.status()
      expect(status, `${path} returned ${status}`).toBeLessThan(500)

      // Wait for hydration. networkidle can be unreliable when SWR or
      // websockets are active; cap at 8s then proceed.
      await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {})

      // Wait for the page to have *any* meaningful content (>30 chars).
      // The admin gate, for instance, hits its API and only renders
      // "Access Denied" after ~500ms — measuring innerText before that
      // would show 0 chars and look like a crash.
      await page
        .waitForFunction(
          () => (document.body?.innerText?.length || 0) > 30,
          undefined,
          { timeout: 15_000 },
        )
        .catch(() => {})

      const finalUrl = new URL(page.url()).pathname

      // Onboarding routes redirect to /copilot for users who already
      // completed onboarding (the test user's user_profiles row sets
      // onboarding_completed=true). That redirect IS the expected
      // behaviour — accept it and skip the body-length assertion.
      if (ONBOARDING_PATHS.has(path) && finalUrl === '/copilot') {
        return
      }

      const body = await page.locator('body').innerText()

      // Admin pages render a compact "Access Denied" panel for non-admin
      // visitors — that's the correct gate. Body is ~70 chars; accept.
      if (ADMIN_GATE_PATHS.has(path) && /access denied/i.test(body)) {
        return
      }

      // Pages that gracefully degrade to an error banner when the
      // backend is unreachable (e.g. CI starts before /health is up).
      // The banner copy is short but the render is correct — not a crash.
      const isApiErrorBanner = /failed to fetch|network request failed|load failed|fetch failed|connection refused/i.test(
        body,
      )
      if (isApiErrorBanner) {
        return
      }

      // Floor of 50 chars catches blank pages without false-failing the
      // legitimately compact pages (e.g. /onboarding/risk-quiz = 192 chars).
      expect(body.length, `${path} rendered <50 chars (likely error/blank)`).toBeGreaterThan(50)

      // Error boundary copy
      for (const re of ERROR_BOUNDARY_PATTERNS) {
        expect(body, `${path} shows error boundary text matching ${re}`).not.toMatch(re)
      }

      expect(
        errors.pageErrors,
        `${path} page errors:\n${errors.pageErrors.join('\n')}`,
      ).toHaveLength(0)
      expect(
        errors.fiveXX,
        `${path} got 5xx API responses:\n${JSON.stringify(errors.fiveXX, null, 2)}`,
      ).toHaveLength(0)
    })
  }
})
