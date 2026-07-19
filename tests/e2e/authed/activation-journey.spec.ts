import { test, expect } from '@playwright/test'

/**
 * Activation journey — the path a newly-signed-up paying user walks on
 * day 1. Per-page tests already verified each route renders in
 * isolation; this spec verifies the integration between steps:
 *
 *   1. Dashboard loads with regime + signals + portfolio summary
 *   2. Signals list renders, clicking through reaches a detail page
 *   3. Portfolio shows equity curve / holdings (or empty state)
 *   4. Watchlist renders with add-symbol affordance
 *   5. Paper trading loads with reset + equity
 *
 * Anchors target visible text rather than CSS selectors so a Tailwind
 * class change doesn't silently break the test. Empty states are
 * accepted as valid (a brand-new test user has no signals/positions).
 */
test.describe('Activation — day-1 navigation path', () => {
  test('dashboard hydrates with regime + signals + portfolio surfaces', async ({ page }) => {
    test.setTimeout(60_000)
    // The day-1 home (/dashboard) folded into /copilot (WP-CONSOLIDATE 3c).
    await page.goto('/copilot')

    // RegimeBanner is the top strip — it always renders the word
    // "regime" somewhere visible (current state or fallback copy).
    await expect(
      page.getByText(/regime|market state/i).first(),
      'regime banner copy present',
    ).toBeVisible({ timeout: 20_000 })

    // Either the signal carousel renders rows OR an empty/coming-soon
    // panel. Both are valid for an account with no traded signals yet.
    // We just check the dashboard heading area mounted.
    const dashboardLandmark = page.getByText(/dashboard|today'?s signals|portfolio/i).first()
    await expect(dashboardLandmark).toBeVisible({ timeout: 15_000 })
  })

  test('signals list → detail navigation', async ({ page }) => {
    test.setTimeout(45_000)
    await page.goto('/signals')
    await expect(
      page.getByRole('heading', { name: /signals|swing|today/i }).first(),
      'signals page title',
    ).toBeVisible({ timeout: 15_000 })

    // Try to navigate to a signal detail. If there are no signals
    // today, the list shows an empty state — accept that and skip the
    // detail-page assertion (we already test /signals/[id] structurally
    // in the per-page suite).
    const detailLinks = page.locator('a[href^="/signals/"]')
    const count = await detailLinks.count()
    if (count === 0) {
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'No live signals for this user — skipping detail navigation',
      })
      return
    }
    await detailLinks.first().click()
    await page.waitForURL(/\/signals\/[^/]+/, { timeout: 10_000 })
    // Detail page must show *something* substantive, not just an error.
    const body = await page.locator('body').innerText()
    expect(body.length, 'signal detail page rendered content').toBeGreaterThan(200)
    expect(body, 'signal detail not an error page').not.toMatch(/something went wrong|error 5\d\d/i)
  })

  test('portfolio renders chart + holdings (or empty state)', async ({ page }) => {
    test.setTimeout(90_000)
    // Brief settle to let background SWR polls from prior tests in the
    // same project drain — sometimes /api/positions/open hangs behind
    // them on cold backend cache.
    await page.waitForTimeout(500)
    await page.goto('/portfolio')
    // The page renders a skeleton until /api/portfolio settles, then
    // swaps in the <h1>Portfolio</h1> header.
    await expect(
      page.getByRole('heading', { name: /portfolio|holdings|equity/i }).first(),
    ).toBeVisible({ timeout: 60_000 })

    // Either an equity curve canvas/svg renders OR the empty state
    // explains how to fund the portfolio. Accept either.
    const hasChart = (await page.locator('svg, canvas').count()) > 0
    const body = await page.locator('body').innerText()
    const hasEmpty = /no positions|no holdings|paper trading|connect.*broker|fund/i.test(body)
    expect(hasChart || hasEmpty, 'portfolio shows chart or onboarding empty state').toBe(true)
  })

  test('watchlist renders with add-symbol affordance', async ({ page }) => {
    test.setTimeout(45_000)
    await page.goto('/watchlist')
    await expect(
      page.getByRole('heading', { name: /watchlist/i }).first(),
    ).toBeVisible({ timeout: 15_000 })

    // Either an "Add" button or a text input for new symbols must be
    // reachable — otherwise users can't build their watchlist.
    const addButton = page.getByRole('button', { name: /add|track/i })
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="symbol" i]')
    const ok =
      (await addButton.count().catch(() => 0)) > 0 || (await searchInput.count().catch(() => 0)) > 0
    expect(ok, 'watchlist exposes an add-symbol affordance').toBe(true)
  })

  test('paper-trading dashboard loads with equity + reset', async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto('/paper-trading')
    // Page short-circuits on Loader2 until 3 paper APIs settle; can
    // take 30+ seconds on cold backend cache.
    await expect(
      page.getByRole('button', { name: /^reset account$/i }).first(),
      'reset account button visible',
    ).toBeVisible({ timeout: 60_000 })
    // Heading is in the same title row, so once the button is up the
    // heading must be there too.
    await expect(
      page.getByRole('heading', { name: /paper trading/i }).first(),
    ).toBeVisible({ timeout: 5_000 })
  })
})
