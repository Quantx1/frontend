import { test, expect } from '@playwright/test'

/**
 * Authenticated paper-trade reset flow. Verifies the feature wired in
 * 2026-05-18: a "Reset account" button on /paper-trading opens a
 * confirmation modal; confirming POSTs /api/paper/reset and shows a
 * success banner. Cancelling the modal leaves state untouched.
 */
test.describe('Paper trading reset (authenticated)', () => {

  // Mock the backend so the test exercises the UI flow without
  // depending on a live API server. The reset endpoint returns a
  // success payload; the page's data-loading calls just need a
  // 200 response so the page renders past its initial loader.
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/paper/reset', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Account reset to ₹10,00,000',
        }),
      }),
    )
    // Equity / achievements / league — the page tolerates these
    // via .catch(() => null) but they need to settle quickly so the
    // loader resolves. Return minimal valid shapes.
    await page.route('**/api/paper/v2/equity-curve**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          points: [],
          latest: { equity: 1_000_000, cash: 1_000_000, invested: 0 },
        }),
      }),
    )
    await page.route('**/api/paper/v2/achievements**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          streak_days: 0,
          trade_count: 0,
          total_return_pct: 0,
          current_equity: 1_000_000,
          badges: [],
        }),
      }),
    )
    await page.route('**/api/paper/v2/league**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ top_20: [], user_rank: null }),
      }),
    )
  })

  test('reset modal confirm path', async ({ page }) => {
    await page.goto('/paper-trading')
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})

    const openBtn = page.getByRole('button', { name: /^reset account$/i }).first()
    await expect(openBtn, '"Reset account" trigger button should be visible').toBeVisible()
    await openBtn.click()

    const dialog = page.getByRole('dialog', { name: /reset paper account/i })
    await expect(dialog, 'confirmation dialog opens').toBeVisible()
    await expect(dialog, 'dialog explains what reset does').toContainText(/₹10,00,000/)
    await expect(dialog, 'dialog warns this cannot be undone').toContainText(/cannot be undone/i)

    // Cancel path — modal closes, no API call.
    await dialog.getByRole('button', { name: /cancel/i }).click()
    await expect(dialog, 'cancel closes the dialog').toBeHidden()

    // Reopen + confirm — listen for the POST.
    await openBtn.click()
    await expect(dialog).toBeVisible()

    const respPromise = page.waitForResponse(
      (r) => r.url().endsWith('/api/paper/reset') && r.request().method() === 'POST',
      { timeout: 12_000 },
    )
    await dialog.getByRole('button', { name: /^reset account$/i }).click()

    const resp = await respPromise
    expect(resp.status(), 'reset endpoint returns 200').toBe(200)

    // Success banner — auto-clears after 4s in the component, so assert
    // within that window.
    await expect(
      page.getByText(/account reset to ₹10,00,000/i),
      'success banner appears',
    ).toBeVisible({ timeout: 5_000 })
  })

  test('reset modal cancel keeps state', async ({ page }) => {
    await page.goto('/paper-trading')
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})

    const openBtn = page.getByRole('button', { name: /^reset account$/i }).first()
    await openBtn.click()

    const dialog = page.getByRole('dialog', { name: /reset paper account/i })
    await expect(dialog).toBeVisible()

    // Cancel should NOT trigger a POST. We watch for ~1.5s; if a request
    // fires during that window, fail.
    let posted = false
    const handler = (req: import('@playwright/test').Request) => {
      if (req.url().endsWith('/api/paper/reset') && req.method() === 'POST') posted = true
    }
    page.on('request', handler)

    await dialog.getByRole('button', { name: /cancel/i }).click()
    await page.waitForTimeout(1500)
    page.off('request', handler)

    expect(posted, 'cancel must not POST /api/paper/reset').toBe(false)
    await expect(dialog).toBeHidden()
  })
})
