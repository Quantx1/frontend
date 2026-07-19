import { test, expect, Page } from '@playwright/test'

/**
 * Smoke coverage for every page rewritten in PR-O / PR-P / PR-P2.
 *
 * Each test checks the page renders the Foundation primitives it now
 * advertises (PageHeader title, key tabs, StatCards, etc.) so a future
 * refactor that silently drops one surface gets caught here.
 *
 * Kept deliberately loose on data — empty + populated states both must
 * pass (the test user is fresh, so most lists are empty).
 */

const HEADING = (page: Page, title: string) =>
  page.getByRole('heading', { name: title, exact: false }).first()

test.describe('Redesigned pages — PageHeader + key sections', () => {

  test('/copilot — Copilot hero + KPI strip + signals section', async ({ page }) => {
    // /dashboard folded into /copilot (WP-CONSOLIDATE 3c); the folded
    // HomeCockpit renders the Command Center hero + KPI strip below the chat.
    await page.goto('/copilot', { waitUntil: 'domcontentloaded' })
    await expect(HEADING(page, 'Command Center')).toBeVisible({ timeout: 15_000 })

    // Copilot hero — the chat-first signal
    await expect(page.getByRole('heading', { name: 'Ask Copilot anything' })).toBeVisible()
    // Each quick-prompt is a button
    await expect(
      page.getByRole('button', { name: /regime today/i }),
    ).toBeVisible()

    // KPI strip — 4 StatCards. Each card has its label text.
    for (const label of ['Equity', 'Day P&L', 'Win rate', 'Open positions']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
    }

    // Today's signals section header + Open positions section header
    await expect(page.getByRole('heading', { name: "Today's signals" })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Open positions' })).toBeVisible()
  })

  test('/signals — 4 horizon tabs + sortable table', async ({ page }) => {
    await page.goto('/signals', { waitUntil: 'domcontentloaded' })
    await expect(HEADING(page, 'Signals')).toBeVisible({ timeout: 15_000 })

    for (const label of ['Intraday', 'Swing', 'Positional', 'Momentum']) {
      await expect(page.getByRole('tab', { name: new RegExp(`^${label}`, 'i') })).toBeVisible()
    }

    // Refresh button is in the actions slot
    await expect(page.getByRole('button', { name: /refresh signals/i })).toBeVisible()

    // Tabpanel renders — either populated table or the empty-state CTA.
    // We just assert the tabpanel exists with some content; the data
    // path is exercised by direct API tests.
    await expect(page.getByRole('tabpanel').first()).toBeVisible()
  })

  test('/watchlist — 4 filter tabs + add form', async ({ page }) => {
    await page.goto('/watchlist', { waitUntil: 'domcontentloaded' })
    await expect(HEADING(page, 'Watchlist')).toBeVisible({ timeout: 15_000 })

    for (const label of ['All', 'Bullish', 'Bearish', 'Warnings']) {
      await expect(page.getByRole('tab', { name: new RegExp(`^${label}`, 'i') })).toBeVisible()
    }
    // Add-symbol input present
    await expect(page.getByPlaceholder(/add symbol/i)).toBeVisible()
  })

  test('/strategies — 3 tabs (Library, My strategies, Builder)', async ({ page }) => {
    // networkidle so React hydrates before the Builder click — otherwise
    // the native click fires but the tab's onClick isn't attached yet.
    await page.goto('/strategies', { waitUntil: 'networkidle' })
    await expect(HEADING(page, 'Strategies')).toBeVisible({ timeout: 15_000 })

    for (const name of ['Library', 'My strategies', 'Builder']) {
      await expect(page.getByRole('tab', { name })).toBeVisible()
    }

    // Builder tab has a textarea
    await page.getByRole('tab', { name: 'Builder' }).click()
    await expect(page.getByPlaceholder(/Buy Nifty 50 stocks when 20EMA/i)).toBeVisible()
  })

  test('/portfolio — 4 KPI cards + period tabs + positions section', async ({ page }) => {
    await page.goto('/portfolio', { waitUntil: 'domcontentloaded' })
    await expect(HEADING(page, 'Portfolio')).toBeVisible({ timeout: 15_000 })

    // KPI labels
    for (const label of ['Portfolio Value', 'Total P&L', 'Open positions', 'Total invested']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
    }

    // Performance section + period tabs (1W / 1M / 3M / 1Y)
    await expect(page.getByRole('heading', { name: 'Performance', exact: true })).toBeVisible()
    for (const p of ['1W', '1M', '3M', '1Y']) {
      await expect(page.getByRole('tab', { name: p })).toBeVisible()
    }

    // Positions table heading
    await expect(page.getByRole('heading', { name: 'Positions' })).toBeVisible()
  })

  test('/scanner — Scanner Lab w/ tier badge', async ({ page }) => {
    await page.goto('/scanner', { waitUntil: 'domcontentloaded' })
    await expect(HEADING(page, 'Scanner Lab')).toBeVisible({ timeout: 15_000 })

    // Either Pro-locked EmptyState ("Upgrade to Pro" link) OR the two
    // scanner tabs — both are valid depending on test-user tier.
    const upgradeCta = page.getByRole('link', { name: /upgrade to pro/i })
    const screenersTab = page.getByRole('tab', { name: /screeners/i })
    await expect(upgradeCta.or(screenersTab)).toBeVisible({ timeout: 15_000 })
  })

  test('/inbox — 4 filter tabs + refresh', async ({ page }) => {
    await page.goto('/inbox', { waitUntil: 'domcontentloaded' })
    await expect(HEADING(page, 'Inbox')).toBeVisible({ timeout: 15_000 })

    for (const name of ['All', 'Signals', 'Positions', 'AI insights']) {
      await expect(page.getByRole('tab', { name })).toBeVisible()
    }
    await expect(page.getByRole('button', { name: /refresh inbox/i })).toBeVisible()
  })

  test('/stock/RELIANCE — Watch button + 3 detail tabs', async ({ page }) => {
    await page.goto('/stock/RELIANCE', { waitUntil: 'domcontentloaded' })
    // The PageHeader title contains the symbol — wait for it.
    await expect(page.getByRole('heading', { name: /^RELIANCE/i }).first()).toBeVisible({
      timeout: 30_000,
    })

    for (const name of ['Overview', 'Technical', /ai insight/i]) {
      await expect(page.getByRole('tab', { name: name as any })).toBeVisible()
    }

    // Watch / Watching toggle button is in PageHeader actions
    const watchBtn = page.getByRole('button', { name: /(add to watchlist|remove from watchlist)/i })
    await expect(watchBtn).toBeVisible()
  })

  test('/autopilot — closed-beta dashboard OR auth-gate empty state', async ({ page }) => {
    await page.goto('/autopilot', { waitUntil: 'domcontentloaded' })
    // The page either renders the full dashboard (broker connected,
    // Elite tier) OR an EmptyState with Retry (status fetch failed —
    // free tier, no broker, or 5xx). Both are valid rendered outcomes;
    // both expose a known element we can assert on.
    const closedBeta = page.getByText('Closed beta').first()
    const errorRetry = page.getByRole('button', { name: 'Retry' })
    await expect(closedBeta.or(errorRetry)).toBeVisible({ timeout: 30_000 })
  })

  test('/settings — sign-in gate vs settings nav (depending on auth)', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'domcontentloaded' })
    // Either the signed-in PageHeader OR the signed-out EmptyState renders.
    const settingsHeading = HEADING(page, 'Settings')
    await expect(settingsHeading).toBeVisible({ timeout: 15_000 })
  })
})
