import type { Page, ConsoleMessage } from '@playwright/test'

/**
 * Attaches a recorder that captures console errors and failed network
 * requests for the duration of a test. Returns an inspector + a flush
 * function so tests can assert "no console errors" or read the list.
 *
 * Whitelisted noise: Next.js dev mode HMR pings, source-map 404s in dev,
 * and known browser deprecation warnings.
 */
/**
 * Navigate and wait for any CLIENT-SIDE redirect chain to settle.
 *
 * `/` is `redirect('/copilot')` and /copilot's auth guard may bounce again, so a
 * bare `page.goto(next)` immediately afterwards races the in-flight redirect and
 * dies with `net::ERR_ABORTED`. That is exactly how the console-noise sweep
 * failed: it visited `/`, then `/login`, and the pending hop killed the second
 * navigation.
 *
 * It also absorbs Next.js dev-mode cold compiles — the first hit on a route
 * compiles it, so `networkidle` can fire against an empty body.
 *
 * Returns the response of the initial navigation (null for a client-side hop).
 */
export async function gotoSettled(page: Page, path: string) {
  let resp: Awaited<ReturnType<Page['goto']>> = null
  try {
    resp = await page.goto(path, { waitUntil: 'domcontentloaded' })
  } catch (err) {
    // A redirect that lands mid-navigation aborts it; the hop itself is the
    // behaviour under test, so continue and let the settle loop below observe
    // where we ended up. Anything else is a real failure.
    if (!String(err).includes('ERR_ABORTED')) throw err
  }
  // Poll until the URL stops moving — cheaper and far more reliable than
  // guessing a fixed timeout for a chain of unknown length.
  let last = ''
  for (let i = 0; i < 25; i++) {
    const now = page.url()
    if (now === last) break
    last = now
    await page.waitForTimeout(200)
  }
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  // Wait for the body to actually HAVE TEXT, not merely to exist.
  //
  // On the app-shell routes the <body> element is attached immediately while its
  // content arrives after React hydration and the client auth guard resolves —
  // so `waitFor({state:'attached'})` returned instantly and callers read "".
  // That is the real condition every caller goes on to assert.
  await page
    .waitForFunction(() => (document.body?.innerText ?? '').trim().length > 0, null, {
      timeout: 20_000,
    })
    .catch(() => {})
  return resp
}

export function captureErrors(page: Page) {
  const consoleErrors: { text: string; location?: string }[] = []
  const networkFailures: { url: string; status: number; method: string }[] = []
  const pageErrors: string[] = []

  const NOISE = [
    /Download the React DevTools/i,
    /\/_next\/static\/webpack/i,
    /sourcemap/i,
    /Failed to load resource.*favicon/i,
    /\.map\b.*404/i,
  ]

  const isNoise = (s: string) => NOISE.some((r) => r.test(s))

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (!isNoise(text)) {
        consoleErrors.push({ text, location: msg.location()?.url })
      }
    }
  })

  page.on('pageerror', (err) => {
    if (!isNoise(err.message)) pageErrors.push(err.message)
  })

  page.on('response', (res) => {
    const status = res.status()
    const url = res.url()
    if (status >= 500 && !isNoise(url)) {
      networkFailures.push({ url, status, method: res.request().method() })
    }
  })

  return {
    consoleErrors,
    networkFailures,
    pageErrors,
    summary() {
      return {
        consoleErrors: consoleErrors.length,
        pageErrors: pageErrors.length,
        networkFailures: networkFailures.length,
      }
    },
  }
}

/**
 * Public routes — accessible without auth. If any of these errors out,
 * acquisition is broken.
 */
/**
 * Public routes THIS app still serves.
 *
 * The acquisition surface — `/`, `/pricing`, `/proof`, `/privacy`, `/terms` —
 * moved to the standalone `landing` app during the monorepo split. app/page.tsx
 * now just `redirect('/copilot')`, and the rest 404 here because they live in
 * the other repo. Six specs kept asserting them and failed on every run.
 *
 * They are removed rather than marked skip: the landing repo owns those routes
 * and has its own suite, so a permanently-red duplicate here only trains people
 * to ignore the report.
 *
 * `/` stays, asserting what it ACTUALLY does — redirect to /copilot and render
 * the app shell. Verified by probe: status 200, final url /copilot, body begins
 * "Quant X / TRADING OS / New Chat / Markets…". The client auth guard runs after
 * hydration, so an anonymous visitor sees the shell first; the pattern accepts
 * either that or a completed bounce to /login. Worth keeping — this is the entry
 * point, and a broken redirect chain strands every visitor.
 */
export const PUBLIC_ROUTES: { path: string; expectedText?: string | RegExp }[] = [
  { path: '/', expectedText: /Quant X|Copilot|Sign in|Login/i },
  { path: '/login', expectedText: /Sign in|Login|email|password/i },
  { path: '/signup', expectedText: /Sign up|Create|account|email/i },
  { path: '/forgot-password', expectedText: /reset|password|email/i },
  { path: '/verify-email', expectedText: /verify|email/i },
]

/**
 * Authenticated routes — should redirect to /login when no session.
 */
export const PROTECTED_ROUTES: string[] = [
  '/portfolio',
  '/trades',
  '/watchlist',
  '/signals',
  '/scanner',
  '/stocks',
  '/autopilot',
  '/paper-trading',
  '/copilot',
  '/referrals',
  '/settings',
  '/admin',
]
