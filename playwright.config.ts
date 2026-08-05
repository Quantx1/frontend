import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

// Load env from the backend repo's .env (backend secrets, incl.
// SUPABASE_SERVICE_KEY) and frontend/.env.local (NEXT_PUBLIC_* used by both
// dev server and test setup script). Playwright runs from frontend/, so
// resolve both paths.
//
// Pre-split this was `<frontend>/../.env` — the monorepo root. The four-way
// split moved the backend secrets to `<frontend>/../backend/.env` and nothing
// updated this, so every authenticated spec (~60 of the 89) died in the
// `setup` project with a bare "SUPABASE_SERVICE_KEY not set" and no hint that
// the cause was a stale path. Candidates are tried in order; the first that
// exists wins, and E2E_BACKEND_ENV overrides for non-standard layouts (CI
// checks the two repos out side by side under different names).
function loadEnv(p: string) {
  if (!fs.existsSync(p)) return false
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    const [, k, raw] = m
    if (process.env[k]) continue
    process.env[k] = raw.trim().replace(/^["']|["']$/g, '')
  }
  return true
}

const BACKEND_ENV_CANDIDATES = [
  process.env.E2E_BACKEND_ENV,
  path.resolve(__dirname, '..', 'backend', '.env'),
  // Pre-split monorepo root. Kept last so an old checkout still works.
  path.resolve(__dirname, '..', '.env'),
].filter((p): p is string => Boolean(p))

const loadedBackendEnv = BACKEND_ENV_CANDIDATES.find(loadEnv)
loadEnv(path.resolve(__dirname, '.env.local'))

// Record where we looked so auth.setup.ts can name the paths in its failure
// instead of just reporting the symptom ("SUPABASE_SERVICE_KEY not set").
process.env.E2E_ENV_SEARCH_PATH = BACKEND_ENV_CANDIDATES.join(', ')

// Warn at config time — 40 seconds before the setup project would have hit it.
// Secrets can legitimately arrive as real environment variables (that is how
// CI supplies them), so a missing FILE only matters if the key it was supposed
// to carry is still absent. Anonymous specs don't need it at all, which is why
// this warns rather than throws: it must not block `--project=chromium-anon`.
if (!loadedBackendEnv && !process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    [
      '',
      '  [playwright] No backend .env found, and SUPABASE_SERVICE_KEY is not in the',
      '  environment. The `setup` project seeds the E2E user through the Supabase',
      '  Admin API and cannot run without it, so every authenticated spec will fail.',
      '',
      '  Looked in:',
      ...BACKEND_ENV_CANDIDATES.map((p) => `    - ${p}`),
      '',
      '  Fix: clone the backend repo next to this one, or point E2E_BACKEND_ENV at',
      '  its .env, or export SUPABASE_SERVICE_KEY directly. Anonymous specs run',
      '  without it: npm run test:e2e -- --project=chromium-anon',
      '',
    ].join('\n'),
  )
}

const E2E_MODE = process.env.E2E_MODE === 'prod' ? 'prod' : 'dev'
const STORAGE_STATE = path.resolve(__dirname, 'tests/e2e/.auth/user.json')

/**
 * E2E test config for Quant X.
 *
 *   • Dev (default)     — npm run test:e2e
 *   • Prod-build        — E2E_MODE=prod npm run test:e2e
 *     Assumes `npm run build && npm run start` already running on :3000.
 *
 * Project layout:
 *   - `setup` project runs auth.setup.ts once, drops storageState to
 *     tests/e2e/.auth/user.json
 *   - `chromium-anon` runs unauthenticated specs (01, 02, 03, 04 public)
 *   - `chromium-authed` runs the authenticated specs, depending on setup
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: E2E_MODE === 'prod' ? 30_000 : 75_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  // 1 retry: a handful of authed specs (portfolio, paper-trading, signup
  // funnel) hit the single-worker uvicorn backend under load and time
  // out on cold response. In isolation they pass in ~1s. Retrying once
  // covers the rare bottleneck without hiding real failures (a real
  // breakage will fail both attempts).
  retries: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: E2E_MODE === 'prod' ? 20_000 : 60_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-anon',
      testIgnore: /auth\.setup\.ts$|authed\/.*\.spec\.ts$|mobile\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-authed',
      testMatch: /authed\/.*\.spec\.ts$/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: STORAGE_STATE,
      },
    },
    {
      name: 'mobile-pixel-5',
      testMatch: /mobile\/.*\.spec\.ts$/,
      // Authenticated mobile specs reuse the storageState from setup;
      // anon mobile specs (01-mobile-public) don't care but still run
      // through this project.
      dependencies: ['setup'],
      use: {
        ...devices['Pixel 5'],
        // Pixel 5 default: 393×851, mobile UA, touch, DPR 2.75.
      },
    },
  ],
  webServer:
    E2E_MODE === 'prod' || process.env.E2E_NO_WEBSERVER
      ? undefined
      : {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: true,
          timeout: 180_000,
        },
})
