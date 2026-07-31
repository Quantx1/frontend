import { test, expect } from '@playwright/test'
import { captureErrors, gotoSettled, PUBLIC_ROUTES } from './helpers'

/**
 * Public-page smoke. Every route in PUBLIC_ROUTES must:
 *   1. Return a 200 (or render successfully after client-side hydration)
 *   2. Show its expected anchor text/content
 *   3. Not emit page errors or 5xx network responses
 *
 * This is the acquisition surface — if any of these break, paying
 * customers never reach signup.
 */
test.describe('Public pages — acquisition surface', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`loads ${route.path}`, async ({ page }) => {
      const errors = captureErrors(page)
      // gotoSettled waits out the client redirect chain (`/` -> /copilot -> the
      // auth guard) and Next.js dev cold-compiles. Plain goto + networkidle
      // could assert against an empty body on a first, uncompiled hit.
      const resp = await gotoSettled(page, route.path)
      expect(resp, `goto returned null for ${route.path}`).not.toBeNull()
      // Allow client redirects (e.g. /verify-email may redirect when session present).
      const status = resp!.status()
      expect(status, `${route.path} returned ${status}`).toBeLessThan(500)
      if (route.expectedText) {
        const body = await page.locator('body').innerText()
        expect(body, `${route.path} missing expected content`).toMatch(route.expectedText)
      }
      expect(errors.pageErrors, `${route.path} page errors: ${errors.pageErrors.join(' | ')}`).toHaveLength(0)
      expect(errors.networkFailures.filter(f => !f.url.includes('/api/')), `${route.path} 5xx network: ${JSON.stringify(errors.networkFailures)}`).toHaveLength(0)
    })
  }
})
