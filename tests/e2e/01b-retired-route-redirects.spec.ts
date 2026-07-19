import { test, expect, request as pwRequest } from '@playwright/test'

const RETIRED_ROUTES: Array<[string, string]> = [
  ['/swingmax-signal', '/signals'],
  ['/swingmax-portfolio', '/portfolio'],
  ['/quantai-alpha-pick', '/strategies?filter=momentum'],
  ['/ai-intelligence', '/models'],
  ['/screener', '/scanner'],
  ['/pattern-detection', '/scanner'],
  ['/scanner-lab', '/scanner'],
  ['/momentum', '/strategies?filter=momentum'],
  ['/earnings-calendar', '/strategies?filter=earnings'],
  ['/fo-strategies', '/fno?tab=lab'],
  // '/alerts' un-retired by WP-ALERTS-CALC — it now renders the Alerts Studio
  // (a real 200 page), so it must NOT be asserted as a 301 redirect here.
  ['/notifications', '/inbox'],
  ['/weekly-review', '/portfolio/doctor'],
  ['/ai-portfolio', '/portfolio'],
  // WP-CONSOLIDATE 3c — /dashboard folded into the /copilot home; /tools follows it.
  ['/dashboard', '/copilot'],
  ['/tools', '/copilot'],
  ['/analytics', '/portfolio'],
  ['/onboarding/telegram', '/onboarding/risk-quiz'],
  ['/marketplace', '/strategies'],
  ['/my-strategies', '/strategies'],
  ['/auto-trader', '/autopilot'],
  // WP-CONSOLIDATE 3d — /models,/track-record,/regime folded into the public /proof surface.
  ['/models', '/proof?tab=models'],
  ['/track-record', '/proof?tab=track-record'],
  ['/regime', '/proof?tab=regime'],
  // detail routes are slug/id-preserving via a middleware prefix rule.
  ['/models/alpha', '/proof/models/alpha'],
  ['/track-record/rec-1', '/proof/track-record/rec-1'],
  // WP-SIMPLEVIEW — the managed /home + /activity shell folded into a per-user
  // Simple view band on /copilot.
  ['/home', '/copilot'],
  ['/activity', '/copilot'],
]

test.describe('PR-A retired routes 301 redirect', () => {
  // Verify at the HTTP layer — Playwright's `page.goto` follows the redirect
  // chain through to /login when the v2 target route doesn't exist yet, so we
  // assert on the raw 301 response instead.
  for (const [from, to] of RETIRED_ROUTES) {
    test(`${from} → ${to}`, async ({ baseURL }) => {
      const ctx = await pwRequest.newContext({ baseURL })
      const resp = await ctx.get(from, { maxRedirects: 0 })
      expect(resp.status()).toBe(301)
      const location = resp.headers()['location']
      expect(location).toBeTruthy()
      // The Location header is relative (per Next.js middleware); the URL
      // constructor needs a base when the value doesn't start with a scheme.
      const url = new URL(location!, baseURL || 'http://localhost:3000')
      expect(url.pathname + url.search).toBe(to)
      await ctx.dispose()
    })
  }
})
