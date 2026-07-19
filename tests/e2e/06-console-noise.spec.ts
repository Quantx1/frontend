import { test, expect } from '@playwright/test'
import { captureErrors, PUBLIC_ROUTES } from './helpers'

/**
 * Aggregate console-error sweep across every public route. Run last so
 * earlier suites have already exercised mounting/unmounting. If anything
 * here trips, the error is repro'd in isolation in the per-route smoke
 * suite (01).
 *
 * Threshold: zero page errors, zero uncaught promise rejections, zero
 * 5xx network responses (whitelisting /api/* since backend may be down).
 */
test('public surface — aggregate error sweep', async ({ page }) => {
  const errors = captureErrors(page)
  for (const route of PUBLIC_ROUTES) {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
    await page.waitForTimeout(400)
  }
  const ignoreApi = (f: { url: string }) => !f.url.includes('/api/') && !f.url.includes(':8000')
  expect(errors.pageErrors, `page errors:\n${errors.pageErrors.join('\n')}`).toHaveLength(0)
  expect(
    errors.networkFailures.filter(ignoreApi),
    `5xx network failures (non-api):\n${JSON.stringify(errors.networkFailures.filter(ignoreApi), null, 2)}`,
  ).toHaveLength(0)
  // Console errors are warned, not hard-failed (some libraries log inline).
  if (errors.consoleErrors.length > 0) {
    console.warn('Console errors detected:', errors.consoleErrors)
  }
})
