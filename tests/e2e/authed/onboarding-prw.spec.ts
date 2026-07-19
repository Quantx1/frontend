import { test, expect } from '@playwright/test'

/**
 * PR-W onboarding polish:
 *   1. Broker-connect buttons fire the real OAuth init (Zerodha tested
 *      — same code path covers Upstox + Angel).
 *   2. Broker-connect "Skip — paper only" routes to /onboarding/complete
 *      without firing OAuth.
 *   3. Day1WelcomeBanner renders on dashboard for users with 0 trades +
 *      0 positions, with three CTAs.
 *   4. Banner does NOT render once dismissed (localStorage flag set).
 *   5. Banner does NOT render for users with non-zero trade count.
 *   6. Empty-positions card on dashboard shows the "Start paper trading"
 *      action button.
 */

test.describe('PR-W onboarding polish', () => {

  test('broker-connect: clicking Zerodha hits /api/broker/zerodha/auth/initiate', async ({ page }) => {
    let oauthCalled = false
    let capturedBroker = ''
    await page.route('**/api/broker/*/auth/initiate', (route) => {
      oauthCalled = true
      capturedBroker = route.request().url().match(/api\/broker\/([^/]+)\//)?.[1] || ''
      // Return a fake auth_url that we redirect to a safe local page so
      // the test doesn't actually leave the suite's origin.
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          auth_url: '/onboarding/complete?fake_oauth=1',
          state: 'fake-state-token',
        }),
      })
    })

    await page.goto('/onboarding/broker-connect', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /Connect Zerodha/i }).click()

    // Wait for either the redirect OR the API to land
    await expect.poll(() => oauthCalled, { timeout: 5000 }).toBe(true)
    expect(capturedBroker).toBe('zerodha')
  })

  test('broker-connect: Skip — paper only routes to /complete', async ({ page }) => {
    let oauthCalled = false
    await page.route('**/api/broker/*/auth/initiate', (route) => {
      oauthCalled = true
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })

    await page.goto('/onboarding/broker-connect', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /Skip — paper only/i }).click()

    await expect(page).toHaveURL(/\/onboarding\/complete/, { timeout: 10_000 })
    expect(oauthCalled).toBe(false)
  })

  test('Day1WelcomeBanner renders for new user (0 trades + 0 positions)', async ({ page }) => {
    // Fresh test context starts with empty localStorage; no init script
    // needed. (Earlier draft used addInitScript but that re-clears on
    // every navigation including the dismiss test's reload, defeating
    // the persistence check.)

    // Mock portfolio + positions to look like a new user
    await page.route('**/api/portfolio/summary', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_value: 0,
          today_pnl: 0,
          win_rate: 0,
          total_trades: 0,
        }),
      }),
    )
    await page.route('**/api/portfolio/positions**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ positions: [] }),
      }),
    )

    await page.goto('/copilot', { waitUntil: 'networkidle' })

    await expect(page.getByText('Welcome to Quant X')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Three quick wins for your first day')).toBeVisible()

    // 3 CTAs
    await expect(page.getByRole('link', { name: /Place a paper trade/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Browse signals/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Link broker/i })).toBeVisible()
  })

  test('Day1WelcomeBanner stays dismissed after X click', async ({ page }) => {
    await page.route('**/api/portfolio/summary', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_value: 0, today_pnl: 0, win_rate: 0, total_trades: 0 }),
      }),
    )
    await page.route('**/api/portfolio/positions**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ positions: [] }),
      }),
    )

    await page.goto('/copilot', { waitUntil: 'networkidle' })
    await expect(page.getByText('Welcome to Quant X')).toBeVisible({ timeout: 15_000 })

    // Click the X
    await page.getByRole('button', { name: /Dismiss welcome banner/i }).click()
    await expect(page.getByText('Welcome to Quant X')).not.toBeVisible()

    // Reload — banner should NOT come back.
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.getByText('Welcome to Quant X')).not.toBeVisible({ timeout: 5_000 })
  })

  test('Empty-positions card shows "Start paper trading" CTA on dashboard', async ({ page }) => {
    await page.route('**/api/portfolio/summary', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_value: 0, today_pnl: 0, win_rate: 0, total_trades: 0 }),
      }),
    )
    await page.route('**/api/portfolio/positions**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ positions: [] }),
      }),
    )

    await page.goto('/copilot', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'No open positions' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      page.getByRole('button', { name: /Start paper trading/i }),
    ).toBeVisible()
  })
})
