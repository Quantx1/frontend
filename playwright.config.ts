import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

// Load env from root .env (backend secrets, incl. SUPABASE_SERVICE_KEY)
// and frontend/.env.local (NEXT_PUBLIC_* used by both dev server and test
// setup script). Playwright runs from frontend/, so resolve both paths.
function loadEnv(p: string) {
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    const [, k, raw] = m
    if (process.env[k]) continue
    process.env[k] = raw.trim().replace(/^["']|["']$/g, '')
  }
}
loadEnv(path.resolve(__dirname, '..', '.env'))
loadEnv(path.resolve(__dirname, '.env.local'))

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
