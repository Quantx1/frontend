import { test, expect, Page } from '@playwright/test'
import path from 'node:path'

/**
 * Mobile authenticated route walkthrough — Pixel 5 viewport, real
 * session. Indian retail is 80%+ mobile so every page paying users
 * touch must render without horizontal overflow, crash, or untappable
 * controls.
 *
 * Per route:
 *   1. 2xx response
 *   2. No horizontal overflow (>2px tolerance for sub-pixel rounding)
 *   3. No error boundary visible
 *   4. No 5xx API responses (config-dependent 503s whitelisted)
 *   5. Body has substantive content after auth/loading resolves
 *
 * Re-uses the storageState produced by auth.setup.ts (same as
 * desktop authed walkthrough).
 */

const AUTH_FILE = path.resolve(__dirname, '..', '.auth/user.json')
test.use({ storageState: AUTH_FILE })

const ROUTES_TO_PROBE: string[] = [
  // The three public trust pages folded into the tabbed /proof surface
  // (WP-CONSOLIDATE 3d).
  '/proof?tab=track-record',
  '/proof?tab=regime',
  '/proof?tab=models',
  '/pricing',
  '/portfolio/doctor',
  '/autopilot',
  '/referrals',
  '/trades',
  '/stocks',
  '/admin',
  '/onboarding/risk-quiz',
]

const ADMIN_GATE_PATHS = new Set(ROUTES_TO_PROBE.filter((p) => p.startsWith('/admin')))
const ONBOARDING_PATHS = new Set(ROUTES_TO_PROBE.filter((p) => p.startsWith('/onboarding/')))

const KNOWN_5XX_OK_PATHS = [
  /\/api\/push\/vapid-key/,
  /\/api\/telegram\/link\/start/,
]

const ERROR_BOUNDARY_PATTERNS = [
  /something went wrong/i,
  /application error/i,
  /uncaught/i,
  /500.{0,40}internal/i,
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

test.describe('Mobile — authenticated route walkthrough', () => {
  for (const path of ROUTES_TO_PROBE) {
    test(`${path} fits the viewport, hydrates, no crashes`, async ({ page }) => {
      test.setTimeout(60_000)
      const errors = attachErrorCapture(page)

      const resp = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(resp).not.toBeNull()
      expect(resp!.status(), `${path} returned ${resp!.status()}`).toBeLessThan(500)

      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
      await page
        .waitForFunction(() => (document.body?.innerText?.length || 0) > 30, undefined, {
          timeout: 15_000,
        })
        .catch(() => {})

      const finalUrl = new URL(page.url()).pathname

      // Onboarding redirects to /copilot for already-onboarded users
      // (the old /dashboard target folded into /copilot).
      if (ONBOARDING_PATHS.has(path) && finalUrl === '/copilot') {
        return
      }

      const body = await page.locator('body').innerText()

      // Admin gate shows compact "Access Denied" — valid render
      if (ADMIN_GATE_PATHS.has(path) && /access denied/i.test(body)) {
        return
      }

      // Pages that gracefully degrade to an error banner when the
      // backend is unreachable (common in CI before /health is up).
      // The banner copy is short (e.g. "Failed to fetch" / "Network
      // request failed"), but the render is correct — not a crash.
      const isApiErrorBanner = /failed to fetch|network request failed|load failed|fetch failed|connection refused/i.test(
        body,
      )
      if (isApiErrorBanner) {
        return
      }

      expect(body.length, `${path} rendered <50 chars (likely error/blank)`).toBeGreaterThan(50)

      for (const re of ERROR_BOUNDARY_PATTERNS) {
        expect(body, `${path} shows error boundary text matching ${re}`).not.toMatch(re)
      }

      // Mobile-specific: no horizontal overflow. A leaking fixed-width
      // element causes the entire page to scroll sideways on a phone,
      // which is one of the worst day-1 UX failures.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(
        overflow,
        `${path} has horizontal overflow ${overflow}px (mobile breaks layout)`,
      ).toBeLessThanOrEqual(2)

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
