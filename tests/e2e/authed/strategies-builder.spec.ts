import { test, expect, type Route } from '@playwright/test'

/**
 * /strategies — Builder + My strategies + Library flow.
 *
 * Tests the full PR-S surface:
 *   1. Builder: NL prompt → /studio/compile → DSL preview → save → backtest
 *   2. My strategies: list + transition controls
 *   3. Library: catalog sections render template cards
 *
 * All /api/strategies/* endpoints are mocked so the suite is hermetic
 * (no backend dependency). The shapes mirror the real backend contract
 * defined in backend/api/strategies_routes.py.
 */

const FAKE_DSL = {
  name: 'EMA Crossover Demo',
  instrument_segment: 'EQUITY',
  symbol: 'RELIANCE',
  universe: 'single',
  timeframe: '1d',
  entry: {
    kind: 'composite_and',
    children: [
      {
        kind: 'indicator_cross',
        indicator: 'ema_20',
        op: 'crosses_above',
        value: 0,
      },
      {
        kind: 'indicator_compare',
        indicator: 'rsi_14',
        op: 'between',
        value: [50, 70],
      },
    ],
  },
  exit: {
    kind: 'indicator_cross',
    indicator: 'ema_20',
    op: 'crosses_below',
    value: 0,
  },
  stop_loss_pct: 3,
  take_profit_pct: null,
  trailing_stop_pct: null,
  position_size: { kind: 'percent_of_capital', value: 20 },
  legs: null,
  regime_filter: 'any',
  lookback_days: 180,
  mode: 'backtest',
}

const FAKE_STRATEGY = {
  id: 'strat-demo-001',
  user_id: 'user-test',
  name: 'EMA Crossover Demo',
  description: null,
  status: 'draft',
  dsl: FAKE_DSL,
  source: 'studio',
  template_slug: null,
  capital_allocated: null,
  created_at: '2026-05-27T00:00:00.000Z',
  updated_at: '2026-05-27T00:00:00.000Z',
  last_backtest: null,
}

const FAKE_BACKTEST = {
  symbol: 'RELIANCE',
  strategy_name: 'EMA Crossover Demo',
  start_date: '2025-11-27',
  end_date: '2026-05-26',
  initial_capital: 500_000,
  final_capital: 547_320,
  total_trades: 4,
  win_rate: 0.75,
  total_return_pct: 9.46,
  max_drawdown_pct: 3.21,
  sharpe_ratio: 1.42,
  profit_factor: 2.18,
  avg_hold_days: 12.5,
  trades: [
    {
      entry_date: '2025-12-05',
      entry_price: 1240.5,
      exit_date: '2025-12-20',
      exit_price: 1295.2,
      quantity: 80,
      direction: 'LONG',
      hold_days: 15,
      gross_pnl_pct: 4.4,
      net_pnl_pct: 4.2,
      net_pnl_amount: 21500,
      exit_reason: 'exit_condition',
    },
    {
      entry_date: '2026-01-15',
      entry_price: 1310.8,
      exit_date: '2026-01-22',
      exit_price: 1275.4,
      quantity: 75,
      direction: 'LONG',
      hold_days: 7,
      gross_pnl_pct: -2.7,
      net_pnl_pct: -2.9,
      net_pnl_amount: -12750,
      exit_reason: 'stop_loss',
    },
  ],
  equity_curve: [
    { date: '2025-11-27', equity: 500000 },
    { date: '2025-12-05', equity: 500000 },
    { date: '2025-12-20', equity: 521500 },
    { date: '2026-01-15', equity: 521500 },
    { date: '2026-01-22', equity: 508750 },
    { date: '2026-05-26', equity: 547320 },
  ],
}

async function mockBaseEndpoints(page: Parameters<typeof test>[1] extends never ? never : any) {
  // The Library tab hits getCatalogSections on mount. Mock with sections
  // so the tab loads (not the focus of these tests).
  await page.route('**/api/strategies/catalog/sections', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sections: {
          exclusive: [],
          featured: [
            {
              id: 'tmpl-1',
              slug: 'ema-golden-cross',
              name: 'EMA Golden Cross',
              description: 'Classic 50/200 EMA crossover',
              category: 'trend',
              segment: 'EQUITY',
              tier_required: 'free',
              min_capital: 25000,
              backtest_win_rate: 0.58,
              backtest_sharpe: 1.12,
              is_featured: true,
            },
          ],
          intraday: [],
          swing: [],
          options: [],
        },
      }),
    }),
  )

  // My strategies list — default empty
  await page.route('**/api/strategies?**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ strategies: [], count: 0 }),
    }),
  )
  await page.route('**/api/strategies', (route: Route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ strategies: [], count: 0 }),
      })
    } else {
      route.continue()
    }
  })
}

test.describe('/strategies — PR-S surface', () => {

  test('Library tab renders catalog sections', async ({ page }) => {
    await mockBaseEndpoints(page)
    await page.goto('/strategies', { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { name: /^Strategies$/ })).toBeVisible({
      timeout: 15_000,
    })

    // Featured section heading + the one template card we mocked.
    await expect(page.getByText('Featured', { exact: true })).toBeVisible()
    await expect(page.getByText('EMA Golden Cross')).toBeVisible()
  })

  test('Builder compiles a prompt into a DSL preview and saves a draft', async ({ page }) => {
    await mockBaseEndpoints(page)

    // /studio/compile mock — returns DSL + a saved draft row.
    let compileCalled = 0
    await page.route('**/api/strategies/studio/compile', (route) => {
      compileCalled += 1
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          strategy: FAKE_DSL,
          saved_row: FAKE_STRATEGY,
          save_error: null,
        }),
      })
    })

    await page.goto('/strategies', { waitUntil: 'networkidle' })
    await page.getByRole('tab', { name: 'Builder' }).click()

    // Compile button should be disabled until prompt has content
    const compileBtn = page.getByRole('button', { name: /Compile to DSL/i })
    await expect(compileBtn).toBeDisabled()

    const textarea = page.getByPlaceholder(/Buy Nifty 50 stocks when 20EMA/i)
    await textarea.fill('Buy when 20EMA crosses above 50EMA and RSI between 50 and 70.')

    await expect(compileBtn).toBeEnabled()
    await compileBtn.click()

    // DSL preview card renders the strategy name + the entry + exit rows
    await expect(page.getByText('EMA Crossover Demo')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Entry', { exact: true })).toBeVisible()
    await expect(page.getByText('Exit', { exact: true })).toBeVisible()

    // Backtest form appears
    await expect(page.getByRole('button', { name: /Run backtest/i })).toBeVisible()

    expect(compileCalled).toBe(1)
  })

  test('Run backtest after compile renders equity curve + trade table', async ({ page }) => {
    await mockBaseEndpoints(page)

    await page.route('**/api/strategies/studio/compile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          strategy: FAKE_DSL,
          saved_row: FAKE_STRATEGY,
        }),
      }),
    )

    await page.route('**/api/strategies/strat-demo-001/backtest', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_BACKTEST),
      }),
    )

    await page.goto('/strategies', { waitUntil: 'networkidle' })
    await page.getByRole('tab', { name: 'Builder' }).click()
    await page
      .getByPlaceholder(/Buy Nifty 50 stocks when 20EMA/i)
      .fill('Buy when 20EMA crosses above 50EMA.')
    await page.getByRole('button', { name: /Compile to DSL/i }).click()

    // Backtest form appears; click Run.
    const runBtn = page.getByRole('button', { name: /Run backtest/i })
    await expect(runBtn).toBeEnabled({ timeout: 10_000 })
    await runBtn.click()

    // Backtest viewer renders metrics + the equity-curve card heading
    await expect(page.getByText('Equity curve', { exact: true })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText('Trade log', { exact: true })).toBeVisible()

    // Final capital displayed — en-IN locale uses lakh separators (5,47,320).
    await expect(page.locator('body')).toContainText(/5,47,320/)
  })

  test('My strategies tab shows EmptyState when list is empty', async ({ page }) => {
    await mockBaseEndpoints(page)
    await page.goto('/strategies', { waitUntil: 'networkidle' })
    await page.getByRole('tab', { name: 'My strategies' }).click()

    await expect(
      page.getByRole('heading', { name: 'No strategies yet' }),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('Template detail page renders DSL + clone button + KPI strip', async ({ page }) => {
    const detailTemplate = {
      id: 'tmpl-1',
      slug: 'ema-golden-cross',
      name: 'EMA Golden Cross',
      description: 'Classic 50/200 EMA crossover with regime filter',
      category: 'trend',
      segment: 'EQUITY',
      tier_required: 'free',
      min_capital: 25000,
      backtest_win_rate: 0.58,
      backtest_cagr: 0.32,
      backtest_sharpe: 1.12,
      backtest_max_drawdown: 0.087,
      engines_used: ['Regime'],
      is_featured: true,
      dsl: FAKE_DSL,
    }
    await page.route('**/api/strategies/catalog/ema-golden-cross', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ template: detailTemplate }),
      }),
    )

    let cloneCalled = 0
    await page.route('**/api/strategies/from-template/ema-golden-cross', (route) => {
      cloneCalled += 1
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ strategy: { ...FAKE_STRATEGY, id: 'cloned-001' } }),
      })
    })

    // /strategies/mine/cloned-001 is the redirect target — short-circuit it.
    await page.route('**/api/strategies/cloned-001', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          strategy: { ...FAKE_STRATEGY, id: 'cloned-001' },
        }),
      }),
    )

    await page.goto('/strategies/ema-golden-cross', { waitUntil: 'networkidle' })

    // Heading + KPI strip render
    await expect(page.getByRole('heading', { name: /EMA Golden Cross/ })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText('Win rate', { exact: true })).toBeVisible()
    await expect(page.getByText('Sharpe', { exact: true })).toBeVisible()

    // DSL preview present
    await expect(page.getByText('Entry', { exact: true })).toBeVisible()

    // Clone CTA navigates to /strategies/mine/cloned-001
    await page
      .getByRole('button', { name: /Clone to my strategies/i })
      .click()

    await expect(page).toHaveURL(/\/strategies\/mine\/cloned-001/, { timeout: 10_000 })
    expect(cloneCalled).toBe(1)
  })

  test('My strategies tab lists user-saved strategies with transition controls', async ({ page }) => {
    await page.route('**/api/strategies/catalog/sections', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sections: { exclusive: [], featured: [], intraday: [], swing: [], options: [] },
        }),
      }),
    )

    // Return one draft strategy
    await page.route('**/api/strategies?**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          strategies: [FAKE_STRATEGY],
          count: 1,
        }),
      }),
    )
    await page.route('**/api/strategies', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ strategies: [FAKE_STRATEGY], count: 1 }),
        })
      } else {
        route.continue()
      }
    })

    await page.goto('/strategies', { waitUntil: 'networkidle' })
    await page.getByRole('tab', { name: 'My strategies' }).click()

    await expect(page.getByText('EMA Crossover Demo')).toBeVisible({ timeout: 10_000 })

    // Draft → "Promote to paper" + Archive buttons
    await expect(page.getByRole('button', { name: /Promote to paper/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Archive' })).toBeVisible()
  })
})
