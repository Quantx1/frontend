import { test, expect } from '@playwright/test'

/**
 * /autopilot kill-switch Dialog flow.
 *
 * The autopilot page can render in 3 states for our test user:
 *   1. Broker connected + Elite → full dashboard with controls
 *   2. No broker / non-Elite → EmptyState with Retry
 *   3. Loading
 *
 * The test user has neither broker nor Elite tier, so we intercept the
 * status API and inject a fake "active + 2 open positions" response so
 * the kill switch button is clickable. This exercises the Dialog flow
 * without depending on a real broker connection.
 *
 * The kill-switch POST is also stubbed so we don't accidentally hit a
 * backend endpoint with side effects.
 */

const FAKE_STATUS = {
  enabled: true,
  paused: false,
  last_run_at: '2026-05-26T09:50:00.000Z',
  broker_connected: true,
  broker_name: 'zerodha',
  open_positions: 2,
  today_trades: 1,
  today_pnl_pct: 0.42,
  regime: {
    name: 'bull',
    prob_bull: 0.62,
    prob_sideways: 0.25,
    prob_bear: 0.13,
    as_of: '2026-05-26T15:50:00.000Z',
  },
  vix_band: 'normal',
  equity_scaler_pct: 47,
  config: {
    risk_profile: 'moderate',
    max_position_pct: 5,
    daily_loss_limit_pct: 2,
    max_concurrent_positions: 5,
    allow_fno: false,
  },
}

test.describe('/autopilot kill-switch', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept the autopilot status endpoint and inject a state that
    // shows the kill-switch button enabled. open_positions=2 makes the
    // button clickable; broker_connected=true bypasses the gated CTA.
    await page.route('**/api/auto-trader/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_STATUS),
      })
    })

    // Mock the four secondary endpoints — the page Promise.all's them
    // and only renders when all 5 resolve. If we don't mock these the
    // page stays in loading state and nothing visible mounts.
    await page.route('**/api/auto-trader/trades**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.route('**/api/auto-trader/weekly**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }),
    )
    await page.route('**/api/auto-trader/runs**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.route('**/api/auto-trader/plan/today**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }),
    )
  })

  test('Kill switch button opens confirm dialog with Cancel + Yes buttons', async ({ page }) => {
    await page.goto('/autopilot', { waitUntil: 'networkidle' })

    // PageHeader / Closed beta badge proves we are past the EmptyState branch.
    await expect(page.getByText('Closed beta').first()).toBeVisible({ timeout: 15_000 })

    const killBtn = page.getByRole('button', { name: /kill switch: close all positions/i })
    await expect(killBtn).toBeEnabled({ timeout: 10_000 })

    await killBtn.click()

    // Dialog renders title + confirm button
    await expect(
      page.getByRole('heading', { name: /Kill switch.*close ALL positions/i }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Yes, close everything/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  })

  test('Cancel button dismisses the kill-switch dialog without firing API', async ({ page }) => {
    let killFired = false
    await page.route('**/api/trades/kill-switch', async (route) => {
      killFired = true
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })

    await page.goto('/autopilot', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /kill switch: close all positions/i }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Dialog title should no longer be visible
    await expect(
      page.getByRole('heading', { name: /Kill switch.*close ALL positions/i }),
    ).not.toBeVisible()

    // Confirm API was NOT called
    expect(killFired).toBe(false)
  })

  test('Confirm "Yes" fires the kill-switch API and closes dialog', async ({ page }) => {
    let killCallCount = 0
    await page.route('**/api/trades/kill-switch', async (route) => {
      killCallCount += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'closed 2' }),
      })
    })

    await page.goto('/autopilot', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /kill switch: close all positions/i }).click()
    await page.getByRole('button', { name: /Yes, close everything/i }).click()

    // Wait for the network call to land in our handler. Polls the
    // closure variable since the call is fire-and-forget from click().
    await expect.poll(() => killCallCount, { timeout: 10_000 }).toBe(1)

    // Dialog dismisses (setKillConfirmOpen(false) runs synchronously
    // on click, so this should be true immediately).
    await expect(
      page.getByRole('heading', { name: /Kill switch.*close ALL positions/i }),
    ).not.toBeVisible({ timeout: 5_000 })
  })
})
