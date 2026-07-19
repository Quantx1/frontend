import { test, expect } from '@playwright/test'

/**
 * PR-X — /signals daily-cap meter.
 *
 * The backend (signals_routes.py) emits ``tier_cap`` + ``tier_cap_applied``
 * on the /api/signals/today response. Frontend reads those fields and
 * mounts <UsageMeter> in the PageHeader description for Free users.
 *
 * Pro/Elite/admin receive ``tier_cap: null`` and fall back to the
 * "N active · last updated ..." string.
 */

const FAKE_SIGNAL = {
  id: 'sig-1',
  symbol: 'RELIANCE',
  direction: 'LONG',
  confidence: 72,
  entry_price: 1240.5,
  target_price: 1295.2,
  stop_loss: 1210.0,
  segment: 'EQUITY',
  signal_type: 'swing',
  status: 'active',
  created_at: '2026-05-28T09:15:00.000Z',
  risk_reward: 1.8,
}

test.describe('/signals — PR-X tier cap meter', () => {

  test('Free user with tier_cap=1 sees UsageMeter "1 / 1 signals today"', async ({ page }) => {
    await page.route('**/api/signals/today**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          date: '2026-05-28',
          total: 1,
          long_signals: [FAKE_SIGNAL],
          short_signals: [],
          equity_signals: [FAKE_SIGNAL],
          futures_signals: [],
          options_signals: [],
          all_signals: [FAKE_SIGNAL],
          tier_cap_applied: true,
          tier_cap: 1,
        }),
      }),
    )

    await page.goto('/signals', { waitUntil: 'networkidle' })

    // Meter renders the "1 / 1" line.
    await expect(page.getByText('1 / 1')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('signals today')).toBeVisible()

    // At 100% → Upgrade link auto-shows (≥80% threshold).
    await expect(page.getByRole('link', { name: /Upgrade/i })).toBeVisible()
  })

  test('Pro user (tier_cap=null) shows the count + last-updated line, no meter', async ({ page }) => {
    await page.route('**/api/signals/today**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          date: '2026-05-28',
          total: 12,
          long_signals: Array(8).fill(FAKE_SIGNAL),
          short_signals: Array(4).fill(FAKE_SIGNAL),
          equity_signals: Array(12).fill(FAKE_SIGNAL),
          futures_signals: [],
          options_signals: [],
          all_signals: Array(12).fill(FAKE_SIGNAL),
          tier_cap_applied: false,
          tier_cap: null,
        }),
      }),
    )

    await page.goto('/signals', { waitUntil: 'networkidle' })

    // Falls back to active-count description.
    await expect(page.getByText(/12 active · last updated/i)).toBeVisible({ timeout: 15_000 })

    // No "X / Y" meter.
    await expect(page.getByText(/^\d+\s*\/\s*\d+$/)).not.toBeVisible()
  })
})
