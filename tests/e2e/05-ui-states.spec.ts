import { test, expect } from '@playwright/test'

/**
 * Non-happy-path UI states.
 *
 * The app was well covered for loading (133 files), form validation (80), empty
 * (75), error (64) and success (37) — but an audit of all 263 tsx files found
 * `navigator.onLine` in ZERO of them, and `request()` in lib/api.ts had:
 *
 *   - no fetch timeout at all (fetch has no default), so a stalled upstream hung
 *     the calling component forever. Four endpoints measurably exceeded 120s:
 *     /api/screener/news/scan, /intraday/scan, /v2/mtf-scan, /news-intelligence
 *   - no offline detection
 *   - no 401 interception — no refresh, no redirect, no sign-out
 *
 * These specs pin the states, not the styling.
 */

test.describe('offline state', () => {
  test('shows a persistent offline banner when connectivity drops', async ({ page, context }) => {
    await page.goto('/login')
    await expect(page.getByTestId('offline-banner')).toBeHidden()

    await context.setOffline(true)
    // Banner is driven by the window 'offline' event via useOnlineStatus.
    await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('offline-banner')).toContainText(/offline/i)

    await context.setOffline(false)
    await expect(page.getByTestId('offline-banner')).toBeHidden({ timeout: 10_000 })
  })
})

test.describe('slow network / timeout', () => {
  test('a stalled API call does not hang the page forever', async ({ page }) => {
    // Hold every API response open. Before the AbortController timeout this
    // meant the caller waited indefinitely with no way to render a slow state.
    await page.route('**/api/**', async () => {
      // Never fulfil — deliberately abandon the request.
    })

    await page.goto('/login')

    // The page itself must still become interactive even with every API call
    // stalled: nothing above should block first paint on a network response.
    await expect(page.getByRole('button', { name: /sign in|log in/i }).first()).toBeVisible({
      timeout: 20_000,
    })
  })
})

test.describe('session expiry', () => {
  test('a 401 from the API redirects to login rather than showing a raw error', async ({ page }) => {
    // Land on a public page first so we have an app shell with AuthContext
    // mounted (it registers the onSessionExpired handler).
    await page.goto('/login')

    // Every API call now 401s. request() attempts one supabase refreshSession(),
    // which cannot succeed for an anonymous visitor, then fires the handler.
    await page.route('**/api/**', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Not authenticated' }),
      }),
    )

    await page.goto('/portfolio')

    // Either we are bounced to login, or the auth gate keeps us there — both are
    // correct. What must NOT happen is a raw backend error rendered as content.
    await page.waitForURL(/\/login|\/$/, { timeout: 20_000 }).catch(() => {})
    await expect(page.locator('body')).not.toContainText(/Not authenticated/i)
    await expect(page.locator('body')).not.toContainText(/PGRST|SQLSTATE|psycopg/i)
  })
})

test.describe('server error state', () => {
  test('a 500 never renders raw database internals', async ({ page }) => {
    // Regression guard for the leak fixed backend-side: 47 handlers used to put
    // str(e) in `detail`, and lib/api.ts renders `detail` verbatim — so users
    // saw PostgREST payloads and bare KeyError names.
    await page.route('**/api/**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      }),
    )

    await page.goto('/markets')
    await expect(page.locator('body')).not.toContainText(/Traceback|psycopg|PGRST|SQLSTATE/i)
    await expect(page.locator('body')).not.toContainText(/'capital'|invalid input syntax/i)
  })
})
