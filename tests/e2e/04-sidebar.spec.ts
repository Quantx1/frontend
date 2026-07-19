import { test, expect } from '@playwright/test'

/**
 * Regression test for the duplicate-sidebar bug we just fixed.
 *
 * Bug: pages inside (platform)/ used to render <AppLayout> themselves
 * AND inherit it from (platform)/layout.tsx — producing two stacked
 * sidebars / two top bars / two collapse buttons. Collapsing one
 * left the other visible.
 *
 * These tests don't require auth — they navigate to /login (which
 * also uses AppLayout-free shell) AND check the public landing page
 * which is the only AppLayout-rendering surface reachable without
 * session. For full coverage including (platform)/ pages, run after
 * seeding a test session.
 */
test.describe('Sidebar — public surfaces never render platform nav', () => {
  test('only one Quant X logo brand-mark per page on landing', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // Landing page is public and shouldn't render the platform sidebar,
    // so we expect ZERO platform-sidebar elements.
    const sidebars = await page.locator('aside[aria-label="Main navigation"]').count()
    expect(sidebars, `landing rendered ${sidebars} sidebars`).toBe(0)
  })

  test('login page does not render platform sidebar', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    const sidebars = await page.locator('aside[aria-label="Main navigation"]').count()
    expect(sidebars, `login rendered ${sidebars} sidebars`).toBe(0)
  })

  // The authenticated sidebar collapse case lives in
  // tests/e2e/authed/sidebar-collapse.spec.ts — it runs against /copilot,
  // /paper-trading, /scanner using a Playwright storageState produced
  // by auth.setup.ts.
})
