import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Retired routes from PR-A cleanup (2026-05-19). Each maps a deprecated URL
 * to its v2 equivalent. We 301-redirect so existing notification deep-links,
 * SEO equity, and user bookmarks survive the rename.
 *
 * Source-of-truth: docs/superpowers/specs/2026-05-19-quantx-v2-design.md §9.3
 */
const RETIRED_ROUTE_REDIRECTS: Record<string, string> = {
  '/swingmax-signal': '/signals',
  '/swingmax-portfolio': '/portfolio',
  '/quantai-alpha-pick': '/strategies?filter=momentum',
  '/ai-intelligence': '/models',
  '/screener': '/scanner',
  '/pattern-detection': '/scanner',
  '/scanner-lab': '/scanner',
  '/momentum': '/strategies?filter=momentum',
  '/earnings-calendar': '/strategies?filter=earnings',
  '/fo-strategies': '/fno?tab=lab',
  // '/alerts' is a LIVE page again (WP-ALERTS-CALC) — the Alerts Studio. Do
  // NOT re-add a redirect here or it silently 301s over the real surface.
  '/notifications': '/inbox',
  '/weekly-review': '/portfolio/doctor',
  '/ai-portfolio': '/portfolio',
  '/login/mfa': '/settings?tab=security',
  '/settings/security': '/settings?tab=security',
  '/settings/whatsapp': '/settings?tab=channels',
  // WP-CONSOLIDATE 3c — /dashboard folded into /copilot (Main Chat home + authed
  // cockpit band). The old /tools alias now points at the same home.
  '/dashboard': '/copilot',
  '/tools': '/copilot',
  '/analytics': '/portfolio',
  '/onboarding/telegram': '/onboarding/risk-quiz',
  '/marketplace': '/strategies',
  '/my-strategies': '/strategies',
  '/auto-trader': '/autopilot',
  // /assistant folded into /copilot (Main Chat) — the assistant_chat backend
  // endpoint stays alive for back-compat; only the standalone page is retired.
  '/assistant': '/copilot',
  // In-app engine showcase retired 2026-06-20 — engines are internal-only now
  // (they still power signals in the backend); engine names live only on the
  // public landing as marketing. Old /engines and /engines/<slug> bookmarks
  // land on /signals (the product). The /engines/<slug> prefix is handled in
  // the middleware body below since this map is exact-match only.
  '/engines': '/signals',
  // WP-CONSOLIDATE 3d — the three public trust pages folded into one tabbed
  // /proof surface. Bare-route bookmarks 301 to the matching tab; the
  // /models/<slug> and /track-record/<id> detail routes are re-homed under
  // /proof and handled by the path-preserving prefix rules in the middleware
  // body below (this map is exact-match only, and those must keep their
  // slug/id segment + any query like regime's ?highlight).
  '/models': '/proof?tab=models',
  '/track-record': '/proof?tab=track-record',
  '/regime': '/proof?tab=regime',
  // WP-SIMPLEVIEW 2026-07-02 — the managed /home + /activity shell folded into a
  // per-user Simple view band on /copilot. Old bookmarks (and the retired
  // MANAGED_NAV) 301 to the single home; the Simple view defaults ON there for
  // managed users and carries the folded 7-day activity log.
  '/home': '/copilot',
  '/activity': '/copilot',
}

const publicPaths = new Set([
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/privacy',
  '/terms',
  '/forgot-password',
  '/verify-email',
  '/auth/callback',
  '/broker/callback',
])

// Public trust surfaces — the methodology + accuracy + track-record
// pages are the v2 acquisition narrative and need to be crawlable +
// linkable without an auth gate. `/proof` is the consolidated home
// (WP-CONSOLIDATE 3d); the old /models,/track-record,/regime prefixes
// stay so their 301 redirects still resolve for signed-out users.
const PUBLIC_PREFIXES = ['/proof', '/models', '/track-record', '/regime', '/markets', '/preview-design']

function isPublicPath(pathname: string): boolean {
  if (publicPaths.has(pathname)) return true
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )
}

// Check if Supabase is configured — when it isn't, allow all routes (dev/demo)
const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ---------------------------------------------------------------------------
// CSP nonce strategy — drops 'unsafe-inline' from script-src.
//
// Next 14 App Router emits inline RSC flight-data scripts (__next_f). When
// middleware sets a CSP header containing 'nonce-<X>', Next auto-applies that
// nonce to its own inline scripts during render — so we don't have to touch
// any layout/component code, as long as we don't emit our own inline scripts
// without the nonce.
//
// Codebase audit on 2026-05-07 confirmed zero raw-HTML inline scripts and
// zero raw-HTML injection sites in app/ + components/. Only third-party JS
// is Razorpay, loaded via external script src; its checkout runs in an
// iframe with its own CSP, so unaffected by ours.
//
// If a future PR adds an inline <Script>, it MUST receive
// nonce={headers().get('x-nonce')} in its props or the browser will block it.
// (See Next.js docs → Routing → Middleware → CSP example.)
// ---------------------------------------------------------------------------

function generateNonce(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  let s = ''
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i])
  return btoa(s)
}

function buildCsp(nonce: string, isProd: boolean, apiOrigin: string, apiWsOrigin: string): string {
  const connectSrcProd = [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    apiOrigin,
    apiWsOrigin,
    'https://*.tradingview.com',
    'https://*.razorpay.com',
    'https://app.posthog.com',
    'https://us.i.posthog.com',
    'https://us-assets.i.posthog.com',
  ].filter(Boolean).join(' ')

  const connectSrcDev = "'self' https: wss: ws: http://localhost:* ws://localhost:*"

  // CSP script-src — pragmatic strategy.
  //
  // The previous 'strict-dynamic' + nonce-only approach was incompatible
  // with Next.js static prerendering: prerendered pages emit <script>
  // tags WITHOUT the per-request nonce, so every bundle was blocked
  // by CSP in production and pages never hydrated.
  //
  // Switched 2026-05-18 to: explicit host allowlist + 'unsafe-inline' for
  // the small Next.js bootstrap inline scripts that ship in the static
  // HTML. We accept the minor XSS exposure of 'unsafe-inline' (mitigated
  // by React's JSX escaping and the codebase audit confirming zero
  // raw-HTML inline scripts) in exchange for a working production app.
  // The host allowlist (no wildcards on 'self', explicit CDNs) still
  // prevents host-injected scripts.
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    !isProd && "'unsafe-eval'", // Fast Refresh (dev only)
    'https://s3.tradingview.com',
    'https://s.tradingview.com',
    'https://www.tradingview.com',
    'https://*.tradingview.com',
    'https://checkout.razorpay.com',
    'https://app.posthog.com',
    'https://us-assets.i.posthog.com',
  ].filter(Boolean).join(' ')

  // style-src keeps 'unsafe-inline' — Tailwind + framer-motion + styled-jsx
  // emit inline style attributes that don't carry nonces, and CSP3
  // 'unsafe-hashes' coverage isn't broad enough to enumerate them. The
  // XSS surface from inline styles is much narrower than from inline scripts.
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://*.tradingview.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://*.tradingview.com",
    "frame-src 'self' https://*.tradingview.com https://*.razorpay.com",
    `connect-src ${isProd ? connectSrcProd : connectSrcDev}`,
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}

function buildResponseWithCsp(request: NextRequest): NextResponse {
  const nonce = generateNonce()
  const isProd = process.env.NODE_ENV === 'production'
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  let apiOrigin = ''
  try {
    apiOrigin = apiUrl ? new URL(apiUrl).origin : ''
  } catch {
    apiOrigin = ''
  }
  const apiWsOrigin = apiOrigin
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://')

  const csp = buildCsp(nonce, isProd, apiOrigin, apiWsOrigin)

  // CRITICAL: Next.js only auto-applies the nonce to its own inline scripts
  // when it reads `x-nonce` from the *propagated request headers* on
  // NextResponse.next({ request: { headers } }). Mutating request.headers
  // directly does NOT propagate to the render layer and silently disables
  // hydration in production (every emitted <script> is blocked by CSP).
  //
  // Discovered 2026-05-18 by prod-build E2E: /signup, /verify-email and
  // every other page would SSR but never hydrate, stuck on their Suspense
  // fallback or initial server HTML. Fixed by using the documented
  // propagation pattern below.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  response.headers.set('x-nonce', nonce)
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // PR-A: 301 redirect retired v1 routes BEFORE any auth gate so they
  // resolve even for signed-out users following old bookmarks.
  const redirectTarget = RETIRED_ROUTE_REDIRECTS[pathname]
  if (redirectTarget) {
    const url = new URL(redirectTarget, request.url)
    // Carry through any incoming query params so deep-links survive the
    // rename — e.g. /regime?highlight=transitions → /proof?tab=regime&
    // highlight=transitions. The redirect target's own params win on a key
    // clash (so ?tab=regime is never clobbered).
    request.nextUrl.searchParams.forEach((value, key) => {
      if (!url.searchParams.has(key)) url.searchParams.set(key, value)
    })
    return NextResponse.redirect(url, 301)
  }

  // Retired in-app engine detail pages (/engines/<slug>) → /signals. The
  // exact-match map above only catches the bare /engines; per-engine slugs
  // need this prefix check.
  if (pathname.startsWith('/engines/')) {
    return NextResponse.redirect(new URL('/signals', request.url), 301)
  }

  // WP-CONSOLIDATE 3d — the /models/<slug> and /track-record/<id> detail
  // pages were re-homed under /proof when the three public trust surfaces
  // folded into one. The exact-match map above only catches the bare
  // /models,/track-record,/regime routes; these prefix rules preserve the
  // trailing slug/id segment (and any query string) into the new /proof path.
  if (pathname.startsWith('/models/') || pathname.startsWith('/track-record/')) {
    const url = new URL(`/proof${pathname}${request.nextUrl.search}`, request.url)
    return NextResponse.redirect(url, 301)
  }

  // Allow public paths (still apply CSP).
  if (isPublicPath(pathname)) {
    return buildResponseWithCsp(request)
  }

  // Allow static assets and API routes (no CSP injection on assets — they
  // don't carry HTML, and applying a CSP to API JSON is wasted bandwidth).
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/ws') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // If Supabase is not configured:
  // - In production, redirect to login with an error
  // - In development, allow all routes for dev/demo
  if (!isSupabaseConfigured) {
    if (process.env.NODE_ENV === 'production') {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'auth_not_configured')
      return NextResponse.redirect(loginUrl)
    }
    return buildResponseWithCsp(request)
  }

  // Check for Supabase auth token in cookies.
  // @supabase/supabase-js stores tokens in localStorage by default, so
  // cookie-based check only works with @supabase/ssr. For now, check both
  // cookies and let client-side AuthContext handle gaps.
  const hasSessionCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && (c.name.endsWith('-auth-token') || c.name.endsWith('-auth-token.0'))
  )
  const hasStorageToken = request.cookies.getAll().some(
    (c) => c.name.includes('supabase') || c.name.includes('auth-token')
  )

  if (!hasSessionCookie && !hasStorageToken) {
    // Dev: allow through; localStorage auth hasn't synced to cookies yet.
    if (process.env.NODE_ENV === 'development') {
      return buildResponseWithCsp(request)
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return buildResponseWithCsp(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
