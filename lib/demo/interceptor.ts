/**
 * DEV-ONLY demo-data harness.
 *
 * Patches window.fetch so that, WHEN demo mode is enabled, requests to the
 * public market `/api/*` endpoints resolve to the shape-accurate fixtures in
 * ./fixtures instead of hitting the (here unreachable) FastAPI backend. This
 * exists purely so the data-heavy UI can be designed and reviewed against
 * populated layouts.
 *
 * Reversibility / safety:
 *  - Hard-gated by NODE_ENV !== 'production' — cannot run on the live site.
 *  - Runtime-gated by a `quantx.demo` localStorage flag (or NEXT_PUBLIC_DEMO_MODE),
 *    read on every call, so toggling the flag off instantly restores real fetch.
 *  - Unmatched paths always fall through to the original fetch untouched.
 */

import {
  demoGlobal,
  demoRegimeHistory,
  demoMarketPulse,
  demoSectorHeatmap,
  demoMarketNews,
  demoNewsScan,
  demoBriefing,
  demoMoversWhy,
  demoBreadth,
  demoSectorRotation,
  demoMarketExplainer,
  demoDeals,
  demoLiveAlerts,
  demoSetupFinder,
  demoSignalsToday,
  demoSignalsHistory,
  demoStyleSignals,
  demoPaperWindow,
  demoUserProfile,
} from './fixtures'

const FLAG_KEY = 'quantx.demo'

/** A real backend is configured only when NEXT_PUBLIC_API_URL is non-empty. */
const HAS_BACKEND = Boolean((process.env.NEXT_PUBLIC_API_URL || '').trim())

/**
 * Whether demo data is active. Resolution order:
 *  1. Never in production.
 *  2. Explicit localStorage flag wins ('1' → on, '0' → off).
 *  3. NEXT_PUBLIC_DEMO_MODE === 'true' forces on.
 *  4. Default: ON only when NO real backend is configured (this review env),
 *     so developers pointed at a live API keep getting real data untouched.
 */
export function isDemoEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  if (typeof window !== 'undefined') {
    try {
      const flag = window.localStorage.getItem(FLAG_KEY)
      if (flag === '1') return true
      if (flag === '0') return false
    } catch {
      /* ignore */
    }
  }
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true
  return !HAS_BACKEND
}

type Handler = (params: URLSearchParams) => unknown

/**
 * Map of exact pathname → fixture handler. Kept exact-match for clarity; add
 * new endpoints here as more pages are lit up for design review.
 */
const ROUTES: Record<string, Handler> = {
  '/api/market/global': () => demoGlobal(),
  '/api/market/news': () => demoMarketNews(),
  '/api/market/briefing': () => demoBriefing(),
  '/api/market/deals': () => demoDeals(),
  '/api/public/regime/history': (p) => demoRegimeHistory(Number(p.get('days')) || 60),
  '/api/screener/market-pulse': () => demoMarketPulse(),
  '/api/screener/v2/sector-heatmap': () => demoSectorHeatmap(),
  '/api/screener/news/scan': (p) => demoNewsScan(Number(p.get('limit')) || 12),
  '/api/screener/movers-why': () => demoMoversWhy(),
  '/api/screener/breadth': (p) => demoBreadth(Number(p.get('days')) || 90),
  '/api/screener/sector-rotation': () => demoSectorRotation(),
  '/api/screener/market-explainer': () => demoMarketExplainer(),
  '/api/screener/alerts/live': (p) => demoLiveAlerts(Number(p.get('limit')) || 24),
  '/api/screener/setups': () => demoSetupFinder(),
  // Signals hub
  '/api/signals/today': () => demoSignalsToday(),
  '/api/signals/history': (p) => demoSignalsHistory(Number(p.get('limit')) || 300),
  '/api/signals/momentum': (p) => demoStyleSignals('momentum', Number(p.get('top_n')) || 50),
  '/api/signals/swing': (p) => demoStyleSignals('swing', Number(p.get('top_n')) || 50),
  '/api/signals/style/paper-window': () => demoPaperWindow(),
  '/api/user/profile': () => demoUserProfile(),
}

function resolvePathname(input: RequestInfo | URL): { pathname: string; search: string } | null {
  try {
    let raw: string
    if (typeof input === 'string') raw = input
    else if (input instanceof URL) raw = input.toString()
    else if (input instanceof Request) raw = input.url
    else return null
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const u = new URL(raw, base)
    return { pathname: u.pathname, search: u.search }
  } catch {
    return null
  }
}

let installed = false

export function installDemoInterceptor(): void {
  if (installed) return
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV === 'production') return
  installed = true

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (isDemoEnabled()) {
      const resolved = resolvePathname(input)
      if (resolved && resolved.pathname in ROUTES) {
        const params = new URLSearchParams(resolved.search)
        // Small latency so streaming/skeleton states are still visible in review.
        await new Promise((r) => setTimeout(r, 220))
        try {
          const data = ROUTES[resolved.pathname](params)
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'content-type': 'application/json', 'x-quantx-demo': '1' },
          })
        } catch {
          // On any fixture error, fall through to the real fetch.
        }
      }
    }
    return originalFetch(input, init)
  }
}

/** Enable/disable demo mode from the browser console or a UI toggle. Writes an
 *  explicit '0' when turning off so it overrides the "no backend → default on"
 *  fallback (otherwise the exit toggle would be a no-op in this review env). */
export function setDemoMode(on: boolean): void {
  try {
    window.localStorage.setItem(FLAG_KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
}
