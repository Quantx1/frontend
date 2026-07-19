import { test, expect } from '@playwright/test'
import { PROTECTED_ROUTES, captureErrors } from './helpers'

/**
 * Every protected route must redirect to /login (or render a sign-in
 * gate) when the visitor has no Supabase session. If any route renders
 * its content without auth, that's a data-leak BLOCKER.
 *
 * The middleware has an intentional dev bypass for the cookie-vs-
 * localStorage race (frontend/middleware.ts:248-253). To close that
 * hole, app/(platform)/layout.tsx and app/admin/layout.tsx render a
 * client-side gate that redirects to /login when AuthContext resolves
 * with no user. That makes the gate effective in BOTH dev and prod,
 * so these tests can run in either mode.
 */
test.describe('Protected routes — auth gate', () => {
  for (const path of PROTECTED_ROUTES) {
    test(`${path} redirects unauthenticated visitor`, async ({ page }) => {
      const errors = captureErrors(page)
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      // Either server-redirect (URL changed) or client-redirect (URL changes within ~5s)
      await page.waitForURL(/(login|signup|auth|signin)/i, { timeout: 8_000 }).catch(() => {})
      const final = new URL(page.url()).pathname
      const okPaths = [/^\/login/, /^\/signup/, /^\/auth/]
      const redirected = okPaths.some((r) => r.test(final))
      // Some routes may also render an inline "Sign in to continue" panel
      const body = await page.locator('body').innerText().catch(() => '')
      const inlineGate = /sign in|please log in|authentication required|create an account/i.test(body)
      expect(
        redirected || inlineGate,
        `${path} did NOT gate auth — final URL ${final}; body excerpt: ${body.slice(0, 200)}`,
      ).toBe(true)
      expect(errors.pageErrors, `${path} threw: ${errors.pageErrors.join(' | ')}`).toHaveLength(0)
    })
  }
})
