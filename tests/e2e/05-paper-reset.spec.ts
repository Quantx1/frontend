import { test, expect } from '@playwright/test'

/**
 * Unauthenticated guard for /paper-trading. Confirms that when no
 * session exists, the route gates auth (redirects to /login or
 * /signup). Run against `E2E_MODE=prod` — dev middleware intentionally
 * bypasses the gate.
 *
 * The full authenticated reset modal flow lives in
 * tests/e2e/authed/paper-reset.spec.ts.
 */
test.describe('Paper trading reset — anon guard', () => {
  test('paper-trading requires auth (no reset accessible to anon)', async ({ page }) => {
    await page.goto('/paper-trading')
    await page.waitForTimeout(1500)
    const url = new URL(page.url()).pathname
    const gated = /login|signup|auth/.test(url)
    expect(gated, `/paper-trading reachable without auth, ended on ${url}`).toBe(true)
  })
})
