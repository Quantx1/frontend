import { test, expect } from '@playwright/test'

/**
 * /watchlist PR-U Free-tier cap UX:
 *
 *   1. Free user at 5/5 sees the UsageMeter showing 5/5 + Upgrade link,
 *      and the Add button is disabled with label "At cap".
 *   2. Free user at 3/5 sees the UsageMeter showing 3/5 with no Upgrade
 *      link (under the 80% threshold), Add button is active.
 *   3. Pro user (cap=null in /watchlist/live) sees no UsageMeter — just
 *      the "unlimited" label, Add button always active.
 *
 * The /watchlist/live endpoint is mocked end-to-end so we don't need
 * a real backend OR a real tier-resolution roundtrip.
 */

const FAKE_SYMBOLS_FREE_AT_CAP = Array.from({ length: 5 }, (_, i) => ({
  symbol: `STK${i + 1}`,
  segment: 'EQUITY',
  price: 100 + i,
  change_pct: 0.5,
  alert_enabled: false,
  alert_price_above: null,
  alert_price_below: null,
  engines: { consensus: 'neutral', regime_warning: false },
  sentiment: null,
  events: [],
  pin: null,
}))

const FAKE_SYMBOLS_FREE_UNDER_CAP = FAKE_SYMBOLS_FREE_AT_CAP.slice(0, 3)

test.describe('/watchlist — PR-U tier cap UX', () => {

  test('Free user at 5/5 disables Add button and shows Upgrade link', async ({ page }) => {
    await page.route('**/api/watchlist/live', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tier: 'free',
          cap: 5,
          count: 5,
          capped: false,
          items: FAKE_SYMBOLS_FREE_AT_CAP,
        }),
      }),
    )

    await page.goto('/watchlist', { waitUntil: 'networkidle' })

    // UsageMeter renders the X / Y line + an Upgrade link (we are at
    // 100% so it shows by default — pct >= 0.8 threshold).
    await expect(page.getByText('5 / 5')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: /Upgrade/i })).toBeVisible()

    // Add button is disabled with "At cap" label.
    const sym = page.getByPlaceholder(/Add symbol/i)
    await sym.fill('RELIANCE')
    const addBtn = page.getByRole('button', { name: /^At cap$/i })
    await expect(addBtn).toBeDisabled()
  })

  test('Free user at 3/5 shows meter without Upgrade link and Add is active', async ({ page }) => {
    await page.route('**/api/watchlist/live', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tier: 'free',
          cap: 5,
          count: 3,
          capped: false,
          items: FAKE_SYMBOLS_FREE_UNDER_CAP,
        }),
      }),
    )

    await page.goto('/watchlist', { waitUntil: 'networkidle' })

    // 3 / 5 visible, no Upgrade link (under 80%)
    await expect(page.getByText('3 / 5')).toBeVisible({ timeout: 15_000 })
    // Upgrade is below threshold — should NOT be visible
    await expect(page.getByRole('link', { name: /^Upgrade$/i })).not.toBeVisible()

    // Add button is "Add", and active once a symbol is entered.
    await page.getByPlaceholder(/Add symbol/i).fill('RELIANCE')
    await expect(page.getByRole('button', { name: /^Add$/i })).toBeEnabled()
  })

  test('Pro user (cap=null) renders unlimited label, no UsageMeter', async ({ page }) => {
    await page.route('**/api/watchlist/live', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tier: 'pro',
          cap: null,
          count: 12,
          capped: false,
          items: FAKE_SYMBOLS_FREE_AT_CAP, // shape doesn't matter
        }),
      }),
    )

    await page.goto('/watchlist', { waitUntil: 'networkidle' })

    // The "unlimited (pro)" string is the fallback when cap is null.
    await expect(page.getByText(/unlimited \(pro\)/i)).toBeVisible({ timeout: 15_000 })
    // No "X / Y" meter for unlimited tier
    await expect(page.getByText(/^\d+\s*\/\s*\d+$/)).not.toBeVisible()

    // Add button is active immediately
    await page.getByPlaceholder(/Add symbol/i).fill('TCS')
    await expect(page.getByRole('button', { name: /^Add$/i })).toBeEnabled()
  })

  test('POST returning 402 surfaces upgrade toast', async ({ page }) => {
    // /watchlist/live still resolves so the page mounts. We say cap=5 +
    // count=4 to keep the Add button enabled, then the POST itself
    // returns 402 to simulate a server-side race with admin-changed cap.
    await page.route('**/api/watchlist/live', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tier: 'free',
          cap: 5,
          count: 4,
          capped: false,
          items: FAKE_SYMBOLS_FREE_AT_CAP.slice(0, 4),
        }),
      }),
    )

    await page.route('**/api/watchlist', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 402,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: {
              error: 'watchlist_cap_reached',
              message: 'Free watchlist is limited to 5 symbols. Upgrade to Pro for unlimited.',
              current_tier: 'free',
              required_tier: 'pro',
              feature: 'watchlist_unlimited',
              current_count: 5,
              cap: 5,
              upgrade_url: '/pricing',
            },
          }),
        })
      } else {
        route.continue()
      }
    })

    await page.goto('/watchlist', { waitUntil: 'networkidle' })
    await page.getByPlaceholder(/Add symbol/i).fill('RELIANCE')
    await page.getByRole('button', { name: /^Add$/i }).click()

    // The toast renders the upgrade-style error.
    await expect(page.getByText(/Watchlist limit reached/i)).toBeVisible({
      timeout: 10_000,
    })
  })
})
