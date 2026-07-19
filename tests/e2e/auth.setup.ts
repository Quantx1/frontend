import { test as setup, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import path from 'node:path'
import fs from 'node:fs'

/**
 * One-time auth setup. Runs before every authenticated spec via the
 * `setup` Playwright project (see playwright.config.ts).
 *
 *   1. Uses the Supabase Admin API (service-role key) to upsert a
 *      deterministic test user with a pre-confirmed email.
 *   2. Uses the anon client to sign in with that user's password,
 *      capturing the session tokens directly (skips the UI form to
 *      avoid React-state race conditions).
 *   3. Injects the session into the browser's localStorage AND drops
 *      a placeholder `sb-<ref>-auth-token` cookie so middleware.ts's
 *      cookie-name check (frontend/middleware.ts:166-171) lets us
 *      through protected routes.
 *   4. Saves storageState to `.auth/user.json`. Authenticated specs
 *      load this via `use: { storageState }`.
 *
 * Background: the app uses plain `@supabase/supabase-js` which stores
 * the session in localStorage only. The middleware only inspects
 * cookies (and only their names, not values), so we inject a name-
 * matching cookie purely to pass that check. The real session lives
 * in localStorage and is read by AuthContext on client mount.
 */

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'e2e+playwright@quantx.app'
const TEST_PASSWORD =
  process.env.E2E_TEST_PASSWORD || 'pw-' + 'e2e-quantx-' + new Date().getFullYear()

const AUTH_FILE = path.resolve(__dirname, '.auth/user.json')

setup('authenticate test user', async ({ page, context }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL not set')
  if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY not set')
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_KEY not set — needed to seed test user')

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Upsert the test user with confirmed email so we can sign in by
  // password immediately (no inbox roundtrip).
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const existing = (list.data.users as any[]).find((u: any) => u?.email === TEST_EMAIL)

  let userId: string
  if (!existing) {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Playwright E2E', is_test_user: true },
    })
    if (error || !data.user) throw new Error(`Failed to create test user: ${error?.message}`)
    userId = data.user.id
  } else {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (error) throw new Error(`Failed to update test user: ${error.message}`)
    userId = existing.id
  }

  // Mark onboarding complete so /scanner, /paper-trading, etc. don't
  // bounce the test user to /onboarding/risk-quiz. The handle_new_user
  // trigger creates the user_profiles row on signup, so we just update.
  await admin
    .from('user_profiles')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      risk_profile: 'moderate',
    })
    .eq('id', userId)

  // Sign in via the anon client to get a real session (access + refresh
  // tokens). Doing this server-side (not via the login form) avoids
  // brittle UI timing.
  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: signed, error: signErr } = await anonClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (signErr) throw new Error(`signInWithPassword failed: ${signErr.message}`)
  expect(signed.session, 'signed-in session must exist').not.toBeNull()
  const session = signed.session!

  // Derive the Supabase project ref from the URL — used to build the
  // localStorage key and the cookie name the app + middleware expect.
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  const storageKey = `sb-${projectRef}-auth-token`

  // Land on the app origin so we can set its localStorage. /login is
  // public, won't redirect.
  await page.goto('/login')

  // Plant the session in localStorage in the shape @supabase/supabase-js
  // uses when persistSession=true. AuthContext re-hydrates from this on
  // mount so the React-side feels like a real signed-in user.
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value))
    },
    { key: storageKey, value: session },
  )

  // Plant a name-matching cookie so middleware.ts's redirect check
  // (which looks at cookie *names* only) passes. The cookie value is
  // never read; it just needs to exist.
  await context.addCookies([
    {
      name: storageKey,
      value: 'present',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ])

  // Sanity check: navigate to the home (/copilot) and confirm we land on it.
  await page.goto('/copilot')
  await page.waitForLoadState('domcontentloaded')
  const finalPath = new URL(page.url()).pathname
  expect(finalPath, `expected to land on /copilot, got ${finalPath}`).toMatch(/^\/copilot/)

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })
  await context.storageState({ path: AUTH_FILE })
  expect(fs.existsSync(AUTH_FILE), 'storage state should be persisted').toBe(true)
})
