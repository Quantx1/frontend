import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { PROTECTED_ROUTES, captureErrors } from './helpers'

/**
 * Every protected route must redirect to /login when the visitor has no
 * Supabase session. If any route renders its content without auth, that's a
 * data-leak BLOCKER.
 *
 * WHERE THE GATE ACTUALLY IS
 * --------------------------
 * `frontend/middleware.ts` — and nowhere else. It is the only auth gate in
 * the app. Its last branch (line numbers deliberately omitted; grep for
 * `hasSessionCookie`) reads:
 *
 *   no `sb-*-auth-token` cookie   → redirect to /login?redirect=<pathname>
 *   ...unless NODE_ENV === 'development', in which case the request is
 *      WAIVED straight through.
 *
 * This file used to state that `app/(platform)/layout.tsx` and
 * `app/admin/layout.tsx` "render a client-side gate that redirects to /login
 * when AuthContext resolves with no user", and concluded the gate was
 * therefore effective in dev too. That was never true. All 137 lines of
 * `app/(platform)/layout.tsx` contain no auth check of any kind — it reads
 * the user only to decide whether to bounce a first-time visitor to the risk
 * quiz. `app/admin/layout.tsx` calls `useAuth()` for chrome, not for gating.
 *
 * The consequence: the default `npm run test:e2e` runs against `next dev`, so
 * NODE_ENV is 'development', so the waiver fires, so the gate is invisible —
 * and 6 routes duly recorded "did NOT gate auth". The assertion was right;
 * the premise about where the gate lived was not, so the failure read as a
 * product bug instead of a test that cannot see its subject.
 *
 * So the runtime sweep below runs in PROD MODE ONLY, where the waiver is off
 * and the gate is real:
 *
 *     npm run build && npm run start
 *     E2E_MODE=prod npm run test:e2e -- tests/e2e/02-auth-redirects.spec.ts
 *
 * In dev it declines rather than passing vacuously. The wiring checks at the
 * bottom run in both modes and hold the gate's shape in place.
 */

const E2E_MODE = process.env.E2E_MODE === 'prod' ? 'prod' : 'dev'

test.describe('Protected routes — middleware auth gate', () => {
  test.skip(
    E2E_MODE !== 'prod',
    "middleware.ts waives the auth check when NODE_ENV === 'development' " +
      '(grep hasSessionCookie) and `npm run dev` sets exactly that, so against ' +
      'a dev server this sweep cannot observe the gate and a green would mean ' +
      'nothing. Run it against a production build: `npm run build && npm run ' +
      'start`, then `E2E_MODE=prod npm run test:e2e`.',
  )

  for (const routePath of PROTECTED_ROUTES) {
    test(`${routePath} redirects an unauthenticated visitor to /login`, async ({
      page,
      context,
    }) => {
      // This project carries no storageState, but clear anyway — the gate keys
      // off cookie NAMES, so a leftover `sb-*-auth-token` from another spec
      // would wave us through and the test would pass for the wrong reason.
      await context.clearCookies()

      const errors = captureErrors(page)
      await page.goto(routePath, { waitUntil: 'domcontentloaded' })
      const final = new URL(page.url())

      // A prod build with no Supabase configured sends everything to
      // /login?error=auth_not_configured via an earlier branch. That looks
      // like a pass but exercises different code, so name it.
      expect(
        final.searchParams.get('error'),
        'the build under test has no Supabase config, so the session check ' +
          'never ran — set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
          'and rebuild',
      ).not.toBe('auth_not_configured')

      expect(
        final.pathname,
        `${routePath} did NOT gate auth — landed on ${final.pathname}${final.search}`,
      ).toBe('/login')

      // The gate must also preserve the deep link, or every gated visit dumps
      // the user on the dashboard and they lose where they were going.
      expect(
        final.searchParams.get('redirect'),
        `${routePath} redirected to /login but dropped the ?redirect= deep link`,
      ).toBe(routePath)

      expect(errors.pageErrors, `${routePath} threw: ${errors.pageErrors.join(' | ')}`).toHaveLength(
        0,
      )
    })
  }
})

/**
 * Static checks on the gate's wiring. These run in BOTH modes, so a dev-only
 * run still asserts something real about the one gate that exists rather than
 * reporting nothing at all.
 */
test.describe('Auth gate wiring', () => {
  const middleware = fs.readFileSync(path.resolve(__dirname, '..', '..', 'middleware.ts'), 'utf8')

  test('the unauthenticated branch redirects to /login carrying the deep link', () => {
    expect(
      middleware.includes("new URL('/login', request.url)"),
      'middleware.ts no longer builds a /login redirect — the only auth gate ' +
        'in the app has gone',
    ).toBe(true)
    expect(
      middleware.includes("loginUrl.searchParams.set('redirect', pathname)"),
      'the gate must preserve the requested path as ?redirect=',
    ).toBe(true)
  })

  test('the dev waiver is scoped to an exact NODE_ENV match and nothing wider', () => {
    // The waiver is acceptable only because it cannot reach production.
    // Widening it — to `!== 'production'`, to a feature flag, to an env var an
    // operator could set — turns a local convenience into an open door.
    const waivers = middleware.match(/process\.env\.NODE_ENV\s*[!=]==?\s*['"][a-z]+['"]/g) ?? []
    expect(
      waivers.length,
      'middleware.ts has no NODE_ENV branch at all — if the dev waiver was ' +
        'removed, drop the E2E_MODE skip in this file so the runtime sweep ' +
        'runs in dev too',
    ).toBeGreaterThan(0)
    for (const w of waivers) {
      expect(
        w,
        `middleware.ts gates on \`${w}\`. A negated or non-'development' check ` +
          'lets the bypass reach a deployed environment.',
      ).toMatch(/===\s*['"](development|production)['"]/)
    }
  })

  test('no layout is relied on as an auth gate', () => {
    // Pinned so the retired claim cannot quietly return: the platform layout
    // reads the user for onboarding routing only. If a real gate is ever added
    // there, update this file's header and re-enable the dev sweep.
    const layout = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'app', '(platform)', 'layout.tsx'),
      'utf8',
    )
    expect(
      /router\.(push|replace)\(\s*['"`]\/login/.test(layout),
      "app/(platform)/layout.tsx now redirects to /login. That's a second, " +
        'dev-effective gate — update the header comment here and remove the ' +
        'E2E_MODE skip above so the sweep runs in dev as well.',
    ).toBe(false)
  })
})
