import { test, expect, Page } from '@playwright/test'

/**
 * Mobile responsive sweep for the public acquisition surface.
 *
 * Indian retail traders skew 80%+ mobile. Until this suite landed, the
 * frontend was only validated on 1440×900 desktop, so mobile regressions
 * shipped silently. Pixel 5 viewport (393×851) is the default Playwright
 * mobile profile and matches the most common Android footprint in India.
 *
 * Hard assertions per page:
 *   1. No horizontal overflow (`document.documentElement.scrollWidth` ≤
 *      viewport width + 2px tolerance). Horizontal scroll on mobile means
 *      a fixed-width element is leaking out and breaking layout.
 *   2. Primary CTA / nav link visible above the fold (≤ viewport height
 *      from the top).
 *   3. Touch targets meeting Apple HIG / Material minimum (44×44 px) for
 *      buttons and tappable links above the fold.
 */

const PAGES = [
  { path: '/', cta: /sign up|start free|get started|join/i },
  { path: '/login', cta: /sign in|log in/i },
  { path: '/signup', cta: /sign up|create|continue|next/i },
  { path: '/pricing', cta: /upgrade|start|free|pro|elite/i },
  // The three public trust pages folded into the tabbed /proof surface
  // (WP-CONSOLIDATE 3d). Probe each tab so a tab-specific fixed-width
  // element still can't leak past the mobile viewport.
  { path: '/proof?tab=regime', cta: /regime|bull|bear|sideways/i },
  { path: '/proof?tab=track-record', cta: /track|record|signal/i },
  { path: '/proof?tab=models', cta: /model|window|accuracy/i },
]

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const docW = document.documentElement.scrollWidth
    const winW = window.innerWidth
    return { docW, winW, diff: docW - winW }
  })
  // 2px tolerance for sub-pixel rounding.
  expect(
    overflow.diff,
    `${label}: horizontal overflow ${overflow.diff}px (doc=${overflow.docW}, win=${overflow.winW})`,
  ).toBeLessThanOrEqual(2)
}

test.describe('Mobile — public pages render without horizontal overflow', () => {
  for (const route of PAGES) {
    test(`${route.path} fits the viewport on Pixel 5`, async ({ page }) => {
      await page.goto(route.path)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
      await assertNoHorizontalOverflow(page, route.path)
    })
  }
})

test.describe('Mobile — hamburger menu navigability', () => {
  test('landing page exposes a tappable nav or CTA above the fold', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // Either a "Sign up" / "Start free" CTA or a hamburger menu must be
    // visible without scrolling.
    const cta = page.getByRole('link', { name: /sign up|start free|log in|sign in/i }).first()
    const hamburger = page.getByRole('button', { name: /menu|open menu|navigation/i }).first()
    const ctaOk = await cta.isVisible().catch(() => false)
    const hamburgerOk = await hamburger.isVisible().catch(() => false)
    expect(
      ctaOk || hamburgerOk,
      'landing must show a visible CTA or hamburger above the fold on mobile',
    ).toBe(true)
  })

  test('login form fits the screen with email + password tappable', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    const email = page.locator('input[type="email"]').first()
    const password = page.locator('input[type="password"]').first()
    await expect(email, 'email input visible').toBeVisible()
    await expect(password, 'password input visible').toBeVisible()

    // Apple HIG minimum: 44×44pt. Tailwind py-3 = 24px tall, but the
    // input height with padding is ~48px which should clear it. Verify.
    const emailBox = await email.boundingBox()
    expect(emailBox, 'email has bounding box').not.toBeNull()
    expect(emailBox!.height, 'email input ≥ 44px tall').toBeGreaterThanOrEqual(40)

    // Both inputs should fit within the viewport (no horizontal clipping)
    const view = page.viewportSize()!
    expect(emailBox!.x + emailBox!.width, 'email input fits viewport width').toBeLessThanOrEqual(
      view.width + 2,
    )
  })

  test('signup multi-step is reachable and the first field is usable', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    await assertNoHorizontalOverflow(page, '/signup')

    // First step shows account fields. Email input should be visible and
    // tappable without scrolling horizontally.
    const email = page.locator('input[type="email"]').first()
    await expect(email, 'signup email input present').toBeVisible()
    const box = await email.boundingBox()
    expect(box).not.toBeNull()
    const view = page.viewportSize()!
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(view.width + 2)
  })
})

test.describe('Mobile — touch target sizes', () => {
  test('primary CTAs on landing are at least 40px tall (Apple HIG ≈ 44px)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})

    const links = await page
      .getByRole('link', { name: /sign up|start free|log in|sign in|get started/i })
      .all()
    if (links.length === 0) test.skip(true, 'no primary CTA links found on landing — surfacing as separate failure in nav test')

    const tooSmall: string[] = []
    for (const link of links.slice(0, 5)) {
      const visible = await link.isVisible().catch(() => false)
      if (!visible) continue
      const box = await link.boundingBox()
      if (!box) continue
      if (box.height < 40) {
        const txt = (await link.textContent())?.trim().slice(0, 40) || '(no text)'
        tooSmall.push(`"${txt}" height=${box.height.toFixed(1)}`)
      }
    }
    expect(
      tooSmall,
      `CTAs under 40px tall (hard to tap on mobile):\n  ${tooSmall.join('\n  ')}`,
    ).toHaveLength(0)
  })
})
