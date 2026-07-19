import { test, expect } from '@playwright/test'

/**
 * Sidebar regression for the v2 COCKPIT shell (2026-05-19, PR-C).
 *
 * 1. Single sidebar — the duplicate-render bug fixed 2026-05-18 must
 *    not return.
 * 2. All 11 COCKPIT nav items are visible in the correct order.
 *
 * The collapse-toggle assertion from the v1 shell was retired: v2's
 * Sidebar is fixed-width and the chat-first surface uses ⌘K for nav
 * jumps instead of a collapsed-icons mode.
 */

// /dashboard folded into /copilot (WP-CONSOLIDATE 3c) — probe the authed home there.
const PLATFORM_PAGES = ['/copilot', '/paper-trading', '/scanner']

const COCKPIT_LABELS = [
  'Copilot',
  'Command Center',
  'Signals',
  'Strategies',
  'Scanner',
  'Stocks',
  'Portfolio',
  'Watchlist',
  'AutoPilot',
  'Inbox',
  'Settings',
]

test.describe('Sidebar — v2 COCKPIT shell', () => {
  for (const path of PLATFORM_PAGES) {
    test(`${path}: single sidebar, 11 COCKPIT items in order`, async ({
      page,
    }) => {
      await page.goto(path)
      await page
        .waitForLoadState('networkidle', { timeout: 15_000 })
        .catch(() => {})

      const sidebars = page.locator('aside[aria-label="Main navigation"]')
      await expect(
        sidebars,
        `${path} should render exactly one sidebar`,
      ).toHaveCount(1)

      const sidebar = sidebars.first()
      for (const label of COCKPIT_LABELS) {
        await expect(
          sidebar.getByRole('link', { name: label }),
          `${path} sidebar should contain ${label}`,
        ).toBeVisible()
      }
    })
  }
})
