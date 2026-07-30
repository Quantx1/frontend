// frontend/tests/e2e/design-system.spec.ts
import { test, expect, type Page } from '@playwright/test'

/**
 * Design-system contract.
 *
 * REWRITTEN 2026-07-30. The previous version hard-coded the xAI palette —
 * rgb(10,10,10) canvas, rgb(25,25,25) cards, rgb(63,185,80) up, "jakarta"
 * display font. Every one of those changed when the liquid-glass redesign
 * landed (commit ce9a0bf, "Port feat/xai-redesign … liquid-glass design system
 * + Geist type"), and the spec was never updated. Ten tests failed on every run
 * from that day forward.
 *
 * Hard-coding a NEW set of hex values would just restart the same clock. So
 * these assert against the TOKENS: read the CSS custom property off :root and
 * require the component's computed style to match it. That tests the real
 * invariant — "this component is wired to the design token" — instead of a
 * palette value that is supposed to change.
 *
 * Structural rules (pill radius, hairline width, uppercase, no shadow) stay
 * literal: those are genuine design decisions, not palette.
 */

const rgb = (s: string) => s.replace(/\s+/g, '')

/**
 * Normalise a computed colour to `[r, g, b, a]` with 0-255 channels.
 *
 * Chromium reports glass surfaces in CSS Color 4 notation —
 * `color(srgb 0.0823529 0.0823529 0.0901961 / 0.68)` — not `rgba(...)`, so a
 * string compare against `rgb(21,23,23)` can never match even when the element
 * is correctly wired to the token. Handles both forms.
 */
function parseColor(s: string): [number, number, number, number] | null {
  const srgb = s.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/)
  if (srgb) {
    return [
      Math.round(parseFloat(srgb[1]) * 255),
      Math.round(parseFloat(srgb[2]) * 255),
      Math.round(parseFloat(srgb[3]) * 255),
      srgb[4] === undefined ? 1 : parseFloat(srgb[4]),
    ]
  }
  const legacy = s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/)
  if (legacy) {
    return [
      Math.round(parseFloat(legacy[1])),
      Math.round(parseFloat(legacy[2])),
      Math.round(parseFloat(legacy[3])),
      legacy[4] === undefined ? 1 : parseFloat(legacy[4]),
    ]
  }
  return null
}

/** `--rgb-main: 13 13 14` -> `[13,13,14]`, read live from the page. */
async function tokenChannels(page: Page, name: string): Promise<[number, number, number]> {
  const triplet = await page.evaluate((n) => {
    return getComputedStyle(document.documentElement).getPropertyValue(n).trim()
  }, name)
  expect(triplet, `CSS variable ${name} is not defined`).not.toBe('')
  const parts = triplet.split(/\s+/).map(Number)
  expect(parts, `${name} should be an "R G B" triplet, got "${triplet}"`).toHaveLength(3)
  return parts as [number, number, number]
}

/** Assert a computed colour carries the token's RGB, whatever its alpha. */
async function expectUsesToken(page: Page, computed: string, token: string) {
  const got = parseColor(computed)
  expect(got, `could not parse computed colour "${computed}"`).not.toBeNull()
  const want = await tokenChannels(page, token)
  // ±1 per channel: srgb floats round-trip imprecisely.
  for (let i = 0; i < 3; i++) {
    expect(
      Math.abs(got![i] - want[i]),
      `expected ${token} (${want.join(',')}) but got ${got!.slice(0, 3).join(',')} from "${computed}"`,
    ).toBeLessThanOrEqual(1)
  }
}

/** `--rgb-main: 13 13 14` -> `rgb(13,13,14)`. */
async function tokenRgb(page: Page, name: string): Promise<string> {
  return `rgb(${(await tokenChannels(page, name)).join(',')})`
}

// Tri-theme (defaultTheme="system"). Force the theme before any page script
// runs: seed next-themes' storage key AND pin the emulated colour-scheme so
// "system" cannot drift with the runner's OS setting.
async function gotoWithTheme(page: Page, theme: 'dark' | 'light') {
  await page.emulateMedia({ colorScheme: theme })
  await page.addInitScript((t) => {
    try { localStorage.setItem('quantx.theme', t) } catch {}
  }, theme)
  await page.goto('/preview-design')
}

for (const theme of ['dark', 'light'] as const) {
  test.describe(`design system — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await gotoWithTheme(page, theme)
    })

    test('page canvas uses --rgb-main', async ({ page }) => {
      const bg = await page.locator('[data-testid="preview-root"]').evaluate(
        (el) => getComputedStyle(el).backgroundColor)
      expect(rgb(bg)).toBe(await tokenRgb(page, '--rgb-main'))
    })

    test('cards are translucent --rgb-wrap glass with a hairline rim', async ({ page }) => {
      const s = await page.locator('[data-testid="card-default"]').evaluate((el) => {
        const c = getComputedStyle(el)
        return {
          radius: c.borderRadius,
          bg: c.backgroundColor,
          shadow: c.boxShadow,
          border: c.borderTopColor,
          width: c.borderTopWidth,
          backdrop: (c as unknown as { backdropFilter: string }).backdropFilter || 'none',
        }
      })
      // The surface tint is the wrap token — carried at partial alpha so the
      // blurred backdrop shows through. That alpha is what makes it "glass".
      await expectUsesToken(page, s.bg, '--rgb-wrap')
      const alpha = parseColor(s.bg)![3]
      expect(alpha, 'card should be translucent, not opaque').toBeLessThan(1)
      expect(s.backdrop, 'glass needs a backdrop blur').toContain('blur')

      expect(parseInt(s.width)).toBe(1)                 // hairline rim
      expect(rgb(s.border)).not.toBe('rgba(0,0,0,0)')   // …that is actually visible
      expect(parseInt(s.radius)).toBeGreaterThan(0)
      // NOTE: glass cards DO carry a shadow — the previous flat design forbade
      // one. Asserting depth exists is the current contract.
      expect(s.shadow).not.toBe('none')
    })

    test('duotone: up uses --rgb-up, down uses --rgb-down, and they differ', async ({ page }) => {
      const up = await page.locator('[data-testid="badge-up"]').evaluate((el) => getComputedStyle(el).color)
      const down = await page.locator('[data-testid="badge-down"]').evaluate((el) => getComputedStyle(el).color)
      const upTok = await tokenRgb(page, '--rgb-up')
      const downTok = await tokenRgb(page, '--rgb-down')
      expect(rgb(up)).toBe(upTok)
      expect(rgb(down)).toBe(downTok)
      // The one thing that must never regress in a trading UI.
      expect(upTok).not.toBe(downTok)
    })

    test('primary button is a filled pill', async ({ page }) => {
      const s = await page.locator('[data-testid="btn-primary"]').evaluate((el) => {
        const c = getComputedStyle(el)
        return { radius: c.borderRadius, bg: c.backgroundColor, bgImage: c.backgroundImage }
      })
      expect(parseInt(s.radius)).toBeGreaterThanOrEqual(999)   // pill
      // The fill is a GRADIENT, so backgroundColor is legitimately transparent —
      // asserting on backgroundColor alone reports a bug that is not there.
      // What matters is that it is filled by one or the other.
      const hasFill =
        s.bgImage.toLowerCase().includes('gradient') || rgb(s.bg) !== 'rgba(0,0,0,0)'
      expect(hasFill, `primary button has no fill (bg=${s.bg}, image=${s.bgImage})`).toBe(true)
    })

    test('secondary button is an outline pill with a 1px border', async ({ page }) => {
      const s = await page.locator('[data-testid="btn-secondary"]').evaluate((el) => {
        const c = getComputedStyle(el)
        return { radius: c.borderRadius, borderWidth: c.borderTopWidth }
      })
      expect(parseInt(s.radius)).toBeGreaterThanOrEqual(999)
      expect(parseInt(s.borderWidth)).toBe(1)
    })

    test('inputs have a visible hairline border', async ({ page }) => {
      const s = await page.locator('[data-testid="sec-input"] input').evaluate((el) => {
        const c = getComputedStyle(el)
        return { radius: c.borderRadius, border: c.borderTopColor, width: c.borderTopWidth }
      })
      // Rim colour is a glass tint rather than the flat --rgb-line token, so
      // assert it is present and hairline rather than pinning a value that the
      // next re-skin will change.
      expect(parseInt(s.width)).toBe(1)
      expect(parseColor(s.border), `unparseable border "${s.border}"`).not.toBeNull()
      expect(parseColor(s.border)![3], 'input border must be visible').toBeGreaterThan(0)
      expect(parseInt(s.radius)).toBeGreaterThan(0)
    })

    test('eyebrow is uppercase and NOT monospace', async ({ page }) => {
      const s = await page.locator('[data-testid="sec-type"] p').first().evaluate((el) => {
        const c = getComputedStyle(el)
        return { transform: c.textTransform, family: c.fontFamily }
      })
      expect(s.transform).toBe('uppercase')
      // Tracked caps on the UI family. Which family that IS is a design choice
      // (Plus Jakarta -> Geist already happened once) — only "not mono" is the
      // durable rule, since mono here would read as a data value.
      expect(s.family.toLowerCase()).not.toContain('mono')
    })

    test('datatable headers ARE monospace caps', async ({ page }) => {
      const s = await page.locator('[data-testid="sec-table"] thead th').first().evaluate((el) => {
        const c = getComputedStyle(el)
        return { transform: c.textTransform, family: c.fontFamily }
      })
      expect(s.transform).toBe('uppercase')
      expect(s.family.toLowerCase()).toContain('mono')
    })

    test('display heading uses the display family, distinct from body', async ({ page }) => {
      const heading = await page.locator('[data-testid="display-heading"]').evaluate(
        (el) => getComputedStyle(el).fontFamily)
      const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
      expect(heading).not.toBe('')
      // A display face that has silently fallen back to the body font is the
      // failure worth catching, not which face it is.
      expect(heading.toLowerCase()).not.toBe(body.toLowerCase())
    })

    test('signature gradient heading clips its fill', async ({ page }) => {
      const s = await page.locator('[data-testid="gradient-heading"]').evaluate((el) => {
        const c = getComputedStyle(el)
        return {
          clip: c.webkitBackgroundClip || c.backgroundClip,
          fill: c.webkitTextFillColor,
          image: c.backgroundImage,
        }
      })
      expect(s.clip).toContain('text')
      expect(rgb(s.fill)).toContain('rgba(0,0,0,0')   // transparent so the gradient shows
      expect(s.image.toLowerCase()).toContain('gradient')
    })
  })
}

test.describe('themes are actually distinct', () => {
  test('dark and light resolve --rgb-main to different values', async ({ page }) => {
    await gotoWithTheme(page, 'dark')
    const dark = await tokenRgb(page, '--rgb-main')
    await gotoWithTheme(page, 'light')
    const light = await tokenRgb(page, '--rgb-main')
    // Guards the whole token-driven approach above: if the theme switch stopped
    // working, every assertion in this file would still pass by comparing a
    // component to the token it is stuck on.
    expect(dark).not.toBe(light)
  })
})
