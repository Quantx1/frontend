'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { api } from '@/lib/api'

/**
 * Dual-mode 2026-06-12 — the user's experience mode. Reinterpreted by
 * WP-SIMPLEVIEW (2026-07-02): the mode no longer swaps the whole shell; it is
 * a per-user "prefers Simple view" preference read by the on-page toggle.
 *
 *  'managed' — prefers the plain-language Simple view (a band of managed cards
 *              on /copilot + /portfolio; the AI runs the account on their own
 *              broker). Existing managed users default to Simple view ON.
 *  'pro'     — prefers the full trading terminal (default; existing users
 *              keep it).
 *
 * Source of truth is `user_profiles.ui_preferences.ui_mode` (cross-device).
 * localStorage mirrors it for an instant, flicker-free first paint; the
 * server value wins as soon as it loads.
 */
export type UiMode = 'managed' | 'pro'

const LS_KEY = 'quantx.ui_mode'

export function readCachedUiMode(): UiMode {
  try {
    return localStorage.getItem(LS_KEY) === 'managed' ? 'managed' : 'pro'
  } catch {
    return 'pro'
  }
}

interface UiModeValue {
  mode: UiMode
  /** True once the server value has been fetched (or fetch failed). */
  loaded: boolean
  setMode: (mode: UiMode) => Promise<void>
}

const UiModeContext = createContext<UiModeValue>({
  mode: 'pro',
  loaded: false,
  setMode: async () => {},
})

export function UiModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<UiMode>('pro')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Instant paint from the local mirror, then reconcile with the server.
    setModeState(readCachedUiMode())
    let cancelled = false
    ;(async () => {
      try {
        const { ui_preferences } = await api.user.getUIPreferences()
        if (cancelled) return
        const server = ui_preferences?.ui_mode === 'managed' ? 'managed' : 'pro'
        setModeState(server)
        try {
          localStorage.setItem(LS_KEY, server)
        } catch {}
      } catch {
        /* unauthenticated or offline — local mirror stands */
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setMode = useCallback(async (next: UiMode) => {
    setModeState(next)
    try {
      localStorage.setItem(LS_KEY, next)
    } catch {}
    // PUT replaces the whole prefs doc — read-merge-write so we never
    // clobber other keys (watchlist pins, etc.).
    try {
      const { ui_preferences } = await api.user.getUIPreferences()
      await api.user.updateUIPreferences({
        ...(ui_preferences || {}),
        ui_mode: next,
      })
    } catch {
      /* server sync best-effort; local mirror already updated */
    }
  }, [])

  return (
    <UiModeContext.Provider value={{ mode, loaded, setMode }}>
      {children}
    </UiModeContext.Provider>
  )
}

export function useUiMode() {
  return useContext(UiModeContext)
}

/**
 * WP-SIMPLEVIEW — the on-page Simple/Full toggle helper. `simple` reinterprets
 * UiMode ('managed' = prefers Simple, 'pro' = prefers Full); `setSimple`
 * persists the choice cross-device via `setMode`. Consumers gate the
 * `managed:overview` fetch strictly behind `simple` so Full-view users never
 * pay the aggregate cost.
 */
export function useSimpleView() {
  const { mode, setMode, loaded } = useContext(UiModeContext)
  const setSimple = useCallback(
    (on: boolean) => setMode(on ? 'managed' : 'pro'),
    [setMode],
  )
  return { simple: mode === 'managed', setSimple, loaded }
}
