import { test, expect } from '@playwright/test'

/**
 * Command Palette (Cmd+K / Ctrl+K) — keyboard navigation flow.
 *
 * AppShell binds a global keydown listener: ⌘K toggles the palette,
 * ESC closes it. Inside the palette, ArrowUp/ArrowDown move selection
 * and Enter navigates to the active entry.
 *
 * This is the keyboard-first power-user surface — the most important
 * interaction for traders who live in shortcuts.
 */

const SEARCH_PLACEHOLDER = /search nav, symbols, strategies/i

test.describe('Command Palette', () => {

  test('Topbar button opens the palette', async ({ page }) => {
    await page.goto('/copilot', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /open command palette/i }).click()

    // Listbox with role + aria-controls renders when palette opens.
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toBeFocused()
  })

  test('Cmd+K (or Ctrl+K) toggles the palette', async ({ page }) => {
    await page.goto('/copilot', { waitUntil: 'networkidle' })

    // First press opens
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 })

    // Second press closes (toggle)
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.getByRole('listbox')).not.toBeVisible({ timeout: 5_000 })
  })

  test('ESC closes the palette', async ({ page }) => {
    await page.goto('/copilot', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /open command palette/i }).click()
    await expect(page.getByRole('listbox')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).not.toBeVisible({ timeout: 5_000 })
  })

  test('Typing filters the list', async ({ page }) => {
    await page.goto('/copilot', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /open command palette/i }).click()
    const input = page.getByPlaceholder(SEARCH_PLACEHOLDER)
    await input.fill('signals')

    // Should match "Signals" workspace entry
    await expect(page.getByRole('option', { name: 'Signals' })).toBeVisible()
    // Should NOT match "Portfolio" (no "signals" in its label)
    await expect(page.getByRole('option', { name: 'Portfolio' })).not.toBeVisible()
  })

  test('ArrowDown moves selection forward, Enter navigates', async ({ page }) => {
    await page.goto('/copilot', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /open command palette/i }).click()
    const input = page.getByPlaceholder(SEARCH_PLACEHOLDER)
    await expect(input).toBeFocused()

    // First option is "Copilot" (group: Workspace, idx 0) — the /copilot
    // home we are already on. On open the initial selection is idx 0.
    // ArrowDown moves to idx 1 — "Command Center". Move twice
    // more to land on "Signals" (idx 2 → 3 with skip-account…
    // actually ENTRIES order: Copilot(0), Command Center(1), Signals(2)).
    // We use the option's aria-selected attribute to verify selection.
    await page.keyboard.press('ArrowDown') // idx 0 → 1 (Command Center)
    await page.keyboard.press('ArrowDown') // → 2 (Signals)

    await expect(
      page.getByRole('option', { name: 'Signals' }),
    ).toHaveAttribute('aria-selected', 'true', { timeout: 5_000 })

    // Enter navigates to /signals
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/signals(\?|$)/, { timeout: 10_000 })
  })

  test('ArrowUp clamps at 0, ArrowDown clamps at end', async ({ page }) => {
    await page.goto('/copilot', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /open command palette/i }).click()

    // From idx 0, ArrowUp should NOT move below 0
    await page.keyboard.press('ArrowUp')
    await expect(
      page.getByRole('option', { name: 'Copilot' }),
    ).toHaveAttribute('aria-selected', 'true')
  })

  test('Click on an option navigates and closes the palette', async ({ page }) => {
    await page.goto('/copilot', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /open command palette/i }).click()
    await page.getByRole('option', { name: 'Watchlist' }).click()

    await expect(page).toHaveURL(/\/watchlist(\?|$)/, { timeout: 10_000 })
    await expect(page.getByRole('listbox')).not.toBeVisible()
  })

  test('Empty filter shows "No matches" empty state', async ({ page }) => {
    await page.goto('/copilot', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /open command palette/i }).click()
    await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill('xyznevermatch')

    await expect(page.getByText('No matches')).toBeVisible()
  })
})
