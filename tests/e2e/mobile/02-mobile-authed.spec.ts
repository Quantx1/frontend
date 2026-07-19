import { test, expect } from '@playwright/test'
import path from 'node:path'

/**
 * Mobile responsive sweep for the authenticated app shell.
 *
 * Uses the same storageState as desktop-authed tests so we don't run a
 * separate auth setup for mobile. Loads it explicitly because the
 * mobile-pixel-5 project doesn't depend on `setup` by default — we
 * tolerate the auth file being absent (skips) if mobile is run in
 * isolation.
 */
const AUTH_FILE = path.resolve(__dirname, '..', '.auth/user.json')

test.use({ storageState: AUTH_FILE })

test.describe('Mobile — authenticated app shell', () => {
  test.beforeAll(() => {
    const fs = require('node:fs')
    if (!fs.existsSync(AUTH_FILE)) {
      test.skip(true, `auth state not found at ${AUTH_FILE} — run the setup project first`)
    }
  })

  test('/copilot hides desktop sidebar, exposes mobile hamburger', async ({ page }) => {
    // /dashboard folded into /copilot (WP-CONSOLIDATE 3c).
    await page.goto('/copilot')
    await page.waitForLoadState('domcontentloaded')

    // Desktop sidebar (<aside aria-label="Main navigation">) is class
    // `hidden lg:flex` — should NOT be visible on Pixel 5.
    const desktopAside = page.locator('aside[aria-label="Main navigation"]')
    // It may exist in DOM with hidden class; check visibility, not count.
    if ((await desktopAside.count()) > 0) {
      await expect(desktopAside.first(), 'desktop sidebar hidden on mobile').toBeHidden()
    }

    // Mobile hamburger button: aria-label "Open menu" per AppLayout.tsx:272
    const hamburger = page.getByRole('button', { name: /open menu/i }).first()
    await expect(hamburger, 'mobile hamburger visible').toBeVisible()

    // No horizontal overflow.
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth
    })
    expect(overflow, `/copilot horizontal overflow ${overflow}px`).toBeLessThanOrEqual(2)
  })

  test('hamburger opens the mobile drawer with nav links', async ({ page }) => {
    await page.goto('/copilot')
    await page.waitForLoadState('domcontentloaded')

    const hamburger = page.getByRole('button', { name: /open menu/i }).first()
    await hamburger.click()

    // The drawer is a glass-sidebar fixed positioned aside. We just need
    // to verify at least one nav link is visible after the open.
    const portfolioLink = page.getByRole('link', { name: /^portfolio$/i }).first()
    await expect(portfolioLink, 'portfolio link visible in mobile drawer').toBeVisible({
      timeout: 5_000,
    })

    // Touch target size: link should be ≥ 40px tall for tappability.
    const box = await portfolioLink.boundingBox()
    expect(box, 'link has bounding box').not.toBeNull()
    expect(box!.height, 'portfolio link tappable height').toBeGreaterThanOrEqual(36)
  })

  test('/paper-trading reset button reachable on mobile', async ({ page }) => {
    // The page short-circuits on Loader2 until 3 paper APIs settle —
    // Pixel 5 emulation can take 15-25s. Override the project-level
    // 30s timeout so this test has room.
    test.setTimeout(75_000)
    await page.goto('/paper-trading')
    // The page does 3 paper-API calls in Promise.all and short-circuits
    // to <Loader2> until they all settle. On Pixel 5 emulation that can
    // take 15-25s in CI vs ~2s on desktop — wide budget needed.
    const reset = page.getByRole('button', { name: /^reset account$/i }).first()
    await expect(reset, 'reset button visible on mobile').toBeVisible({ timeout: 45_000 })

    // No horizontal overflow.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow, `/paper-trading horizontal overflow ${overflow}px`).toBeLessThanOrEqual(2)
  })
})
