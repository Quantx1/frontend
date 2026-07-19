'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Client-side auth gate. Mounted globally; redirects to /login when
 * the visitor has no Supabase session and is on a protected path.
 *
 * This is defence-in-depth alongside middleware.ts — the middleware
 * has a dev-mode bypass for the cookie-vs-localStorage race
 * (frontend/middleware.ts:248-253), so without this client gate the
 * platform is reachable in dev without auth. The gate closes that
 * hole and lets the auth-redirect E2E suite run in both dev and prod.
 *
 * Public paths and auth flow paths are skipped; everything else that
 * isn't in PROTECTED_PREFIXES is treated as "unknown — leave alone".
 */

// DEV-ONLY auth bypass (local design review). Double-guarded: requires the
// explicit env flag AND a non-production build, so it can NEVER weaken the live
// site. Keep `NEXT_PUBLIC_DISABLE_AUTH` in .env.local only — never commit it.
const AUTH_DISABLED =
  process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' && process.env.NODE_ENV !== 'production'

const PROTECTED_PREFIXES = [
  // /dashboard retired (WP-CONSOLIDATE 3c) — folded into /copilot, which is
  // already gated below.
  '/portfolio',
  '/trades',
  '/watchlist',
  '/signals',
  '/scanner',
  '/stocks',
  '/stock',
  '/autopilot',
  '/paper-trading',
  '/assistant',
  '/copilot',
  '/referrals',
  '/settings',
  '/admin',
  '/strategies',
  '/inbox',
]

function isProtected(path: string | null): boolean {
  if (!path) return false
  return PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

// Grace period after a navigation before we may redirect. Closes the
// race where login → router.push('/dashboard') fires the navigation
// before React has re-rendered AuthProvider with the freshly-set
// user. Without the grace period, the gate sees user=null on the
// /dashboard route and bounces the user back to /login → loop.
const NAV_GRACE_MS = 600

export function ClientAuthGate() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const pathStartedAt = useRef<{ path: string | null; at: number }>({
    path: null,
    at: 0,
  })

  // Track when the current pathname first appeared, so the redirect
  // effect can defer for ``NAV_GRACE_MS`` after a transition.
  if (pathStartedAt.current.path !== pathname) {
    pathStartedAt.current = { path: pathname, at: Date.now() }
  }

  useEffect(() => {
    if (AUTH_DISABLED) return // dev-only: browse the full app without login
    if (loading) return
    if (user) return
    if (!isProtected(pathname)) return

    const elapsed = Date.now() - pathStartedAt.current.at
    const next = pathname && pathname !== '/login' ? `?redirect=${encodeURIComponent(pathname)}` : ''

    if (elapsed >= NAV_GRACE_MS) {
      router.replace(`/login${next}`)
      return
    }

    // Defer for the remaining grace window; if user state still hasn't
    // arrived after that, redirect for real.
    const t = setTimeout(() => {
      router.replace(`/login${next}`)
    }, NAV_GRACE_MS - elapsed)
    return () => clearTimeout(t)
  }, [loading, user, pathname, router])

  return null
}
