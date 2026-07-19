import { test, expect } from '@playwright/test'

/**
 * /copilot interaction smoke — the old /dashboard folded into /copilot
 * (WP-CONSOLIDATE 3c); the filename is kept but the surface is /copilot.
 * Copilot hero quick-prompts open the Copilot panel, KPI tooltips are
 * wired up, top-of-page actions fire.
 *
 * Validates the chat-first flow: a beginner can click a quick prompt
 * and the global copilot:open event fires (CopilotProvider listens).
 *
 * IMPORTANT: we use `networkidle` rather than `domcontentloaded` because
 * Next.js + React 18 hydrate after DOMContentLoaded. Clicking a button
 * before hydration runs the native click but skips React's onClick, so
 * `dispatchCopilotOpen` is never called.
 */

test.describe('/copilot interactions', () => {

  test('Quick-prompt button dispatches copilot:open', async ({ page }) => {
    await page.goto('/copilot', { waitUntil: 'networkidle' })

    const prompt = page.getByRole('button', {
      name: /summarize the highest-confidence signals/i,
    })
    await expect(prompt).toBeVisible({ timeout: 15_000 })

    await page.evaluate(() => {
      ;(window as any).__copilotOpenFired = false
      window.addEventListener('copilot:open', () => {
        ;(window as any).__copilotOpenFired = true
      })
    })

    await prompt.click()

    await page.waitForFunction(
      () => (window as any).__copilotOpenFired === true,
      undefined,
      { timeout: 5000 },
    )
  })

  test('Top "Ask Copilot" header button dispatches copilot:open', async ({ page }) => {
    await page.goto('/copilot', { waitUntil: 'networkidle' })

    // PageHeader's "Ask Copilot" — there are TWO buttons matching that
    // text (header + Copilot hero). The header button is first in DOM.
    const askBtn = page.getByRole('button', { name: 'Ask Copilot' }).first()
    await expect(askBtn).toBeVisible({ timeout: 15_000 })

    await page.evaluate(() => {
      ;(window as any).__copilotOpenFiredFromHeader = false
      window.addEventListener('copilot:open', () => {
        ;(window as any).__copilotOpenFiredFromHeader = true
      })
    })

    await askBtn.click()

    await page.waitForFunction(
      () => (window as any).__copilotOpenFiredFromHeader === true,
      undefined,
      { timeout: 5000 },
    )
  })

  test('All 4 KPI StatCard labels render on initial load', async ({ page }) => {
    await page.goto('/copilot', { waitUntil: 'domcontentloaded' })
    for (const label of ['Equity', 'Day P&L', 'Win rate', 'Open positions']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({
        timeout: 15_000,
      })
    }
  })

  test('KPI explanation tooltip buttons are reachable', async ({ page }) => {
    await page.goto('/copilot', { waitUntil: 'domcontentloaded' })
    // Each StatCard renders an aria-labeled tooltip trigger like
    // "Equity explanation" — assertion: all 4 exist + are reachable.
    for (const label of ['Equity', 'Day P&L', 'Win rate', 'Open positions']) {
      const btn = page.getByRole('button', { name: `${label} explanation` })
      await expect(btn).toBeVisible({ timeout: 15_000 })
    }
  })
})
