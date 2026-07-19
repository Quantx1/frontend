// frontend/tests/e2e/design-system.spec.ts
import { test, expect, type Page } from '@playwright/test'

const rgb = (s: string) => s.replace(/\s+/g, '')

// v2 is tri-theme (defaultTheme="system"). To keep these assertions
// deterministic regardless of the runner's OS colour-scheme, force the
// theme before any page script runs: seed next-themes' storage key
// (quantx.theme) AND pin the emulated colorScheme so "system" can't drift.
async function gotoWithTheme(page: Page, theme: 'dark' | 'light') {
  await page.emulateMedia({ colorScheme: theme })
  await page.addInitScript((t) => {
    try { localStorage.setItem('quantx.theme', t) } catch {}
  }, theme)
  await page.goto('/preview-design')
}

test.describe('xAI design system — dark', () => {
  // Pin dark for the original near-mono assertions.
  test.beforeEach(async ({ page }) => {
    await gotoWithTheme(page, 'dark')
  })

  test('canvas is near-black #0a0a0a', async ({ page }) => {
    const bg = await page.locator('[data-testid="preview-root"]').evaluate(
      (el) => getComputedStyle(el).backgroundColor)
    expect(rgb(bg)).toBe('rgb(10,10,10)')
  })

  test('primary button is a white-filled pill', async ({ page }) => {
    const btn = page.locator('[data-testid="btn-primary"]')
    const s = await btn.evaluate((el) => {
      const c = getComputedStyle(el)
      return { radius: c.borderRadius, bg: c.backgroundColor }
    })
    expect(parseInt(s.radius)).toBeGreaterThanOrEqual(999)   // pill
    expect(rgb(s.bg)).toBe('rgb(255,255,255)')               // white-filled
  })

  test('secondary button is an outline pill with 1px border', async ({ page }) => {
    const s = await page.locator('[data-testid="btn-secondary"]').evaluate((el) => {
      const c = getComputedStyle(el)
      return { radius: c.borderRadius, borderWidth: c.borderTopWidth }
    })
    expect(parseInt(s.radius)).toBeGreaterThanOrEqual(999)
    expect(parseInt(s.borderWidth)).toBe(1)
  })

  test('cards are 8px charcoal with hairline border, no shadow', async ({ page }) => {
    const s = await page.locator('[data-testid="card-default"]').evaluate((el) => {
      const c = getComputedStyle(el)
      return { radius: c.borderRadius, bg: c.backgroundColor, shadow: c.boxShadow, border: c.borderTopColor }
    })
    expect(s.radius).toBe('8px')
    expect(rgb(s.bg)).toBe('rgb(25,25,25)')
    expect(s.shadow).toBe('none')
    expect(rgb(s.border)).toBe('rgb(33,35,39)')
  })

  test('duotone: up is green, down is red', async ({ page }) => {
    const up = await page.locator('[data-testid="badge-up"]').evaluate((el) => getComputedStyle(el).color)
    const down = await page.locator('[data-testid="badge-down"]').evaluate((el) => getComputedStyle(el).color)
    expect(rgb(up)).toBe('rgb(63,185,80)')
    expect(rgb(down)).toBe('rgb(248,81,73)')
  })

  test('eyebrow is uppercase Plus Jakarta (NOT mono)', async ({ page }) => {
    const s = await page.locator('[data-testid="sec-type"] p').first().evaluate((el) => {
      const c = getComputedStyle(el)
      return { transform: c.textTransform, family: c.fontFamily }
    })
    expect(s.transform).toBe('uppercase')
    // Tracked caps on the primary family, not monospace.
    expect(s.family.toLowerCase()).toContain('jakarta')
    expect(s.family.toLowerCase()).not.toContain('mono')
  })

  test('inputs use hairline border + 8px radius', async ({ page }) => {
    const s = await page.locator('[data-testid="sec-input"] input').evaluate((el) => {
      const c = getComputedStyle(el)
      return { radius: c.borderRadius, border: c.borderTopColor }
    })
    expect(s.radius).toBe('8px')
    expect(s.border.replace(/\s+/g,'')).toBe('rgb(33,35,39)')
  })

  test('datatable header is mono-caps', async ({ page }) => {
    const th = page.locator('[data-testid="sec-table"] thead th').first()
    const s = await th.evaluate((el) => {
      const c = getComputedStyle(el)
      return { transform: c.textTransform, family: c.fontFamily }
    })
    expect(s.transform).toBe('uppercase')
    expect(s.family.toLowerCase()).toContain('mono')
  })

  test('display heading uses the Plus Jakarta Sans family', async ({ page }) => {
    const family = await page.locator('[data-testid="display-heading"]').evaluate(
      (el) => getComputedStyle(el).fontFamily)
    expect(family.toLowerCase()).toContain('jakarta')
  })

  test('signature gradient heading clips its fill', async ({ page }) => {
    const s = await page.locator('[data-testid="gradient-heading"]').evaluate((el) => {
      const c = getComputedStyle(el)
      return { clip: c.webkitBackgroundClip || c.backgroundClip, fill: c.webkitTextFillColor, image: c.backgroundImage }
    })
    expect(s.clip).toContain('text')
    // transparent fill so the gradient shows through
    expect(rgb(s.fill)).toContain('rgba(0,0,0,0')
    // emerald → cyan signature stops present
    expect(s.image.toLowerCase()).toContain('gradient')
  })
})

test.describe('xAI design system — light', () => {
  // The new tri-theme light assertion: same preview, light theme forced.
  test.beforeEach(async ({ page }) => {
    await gotoWithTheme(page, 'light')
  })

  test('canvas is the refined cool near-white #FBFBFD', async ({ page }) => {
    const bg = await page.locator('[data-testid="preview-root"]').evaluate(
      (el) => getComputedStyle(el).backgroundColor)
    expect(rgb(bg)).toBe('rgb(251,251,253)')
  })

  test('cards are white with a light hairline border', async ({ page }) => {
    const s = await page.locator('[data-testid="card-default"]').evaluate((el) => {
      const c = getComputedStyle(el)
      return { bg: c.backgroundColor, border: c.borderTopColor }
    })
    expect(rgb(s.bg)).toBe('rgb(255,255,255)')        // L1 card = white
    expect(rgb(s.border)).toBe('rgb(230,232,236)')    // hairline #E6E8EC
  })

  test('primary button inverts to an ink-filled pill', async ({ page }) => {
    const s = await page.locator('[data-testid="btn-primary"]').evaluate((el) => {
      const c = getComputedStyle(el)
      return { radius: c.borderRadius, bg: c.backgroundColor }
    })
    expect(parseInt(s.radius)).toBeGreaterThanOrEqual(999)
    expect(rgb(s.bg)).toBe('rgb(11,13,18)')           // ink #0B0D12
  })
})
