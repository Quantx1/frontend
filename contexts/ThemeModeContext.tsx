'use client'

/**
 * ThemeModeContext — the app's theme *intent*, layered on top of next-themes.
 *
 * next-themes only understands the resolved value ('light' | 'dark') and its
 * built-in 'system' (device / prefers-color-scheme). Quant X adds a smarter
 * "auto" that adapts to BOTH the device AND the time of day:
 *
 *     auto → dark when the device prefers dark OR it is night locally,
 *            light otherwise.
 *
 * We keep next-themes as the single applier of the html.light / html.dark
 * class (so its pre-paint boot script still prevents a flash — it writes the
 * last *resolved* value into `quantx.theme`). This context just remembers the
 * user's intent in `quantx.theme.mode` and, while in auto, recomputes the
 * resolved value on the accurate triggers: the OS theme flipping, the local
 * clock crossing dawn/dusk, and the tab regaining focus.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTheme } from 'next-themes'

export type ThemeMode = 'light' | 'dark' | 'auto'

const MODE_KEY = 'quantx.theme.mode'
const NEXT_THEMES_KEY = 'quantx.theme' // must match ThemeProvider storageKey

// Local-clock day/night boundaries. Night runs [DUSK_HOUR, 24) ∪ [0, DAWN_HOUR).
// Fixed hours (not geolocated sunrise/sunset) so it needs no permission and is
// predictable; tuned for Indian market hours — light through the trading day,
// dark for after-hours review.
const DAWN_HOUR = 7 // 07:00 → day
const DUSK_HOUR = 19 // 19:00 → night

function isNight(now: Date): boolean {
  const h = now.getHours()
  return h >= DUSK_HOUR || h < DAWN_HOUR
}

function devicePrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** The resolved light/dark value for "auto": device preference OR local night. */
function resolveAuto(): 'light' | 'dark' {
  return devicePrefersDark() || isNight(new Date()) ? 'dark' : 'light'
}

/** Milliseconds until the next dawn/dusk boundary, so we flip exactly on time
 *  instead of polling. Clamped to ≥1s and re-armed after each fire. */
function msToNextBoundary(now: Date): number {
  const next = new Date(now)
  const h = now.getHours()
  next.setMinutes(0, 0, 0)
  if (h < DAWN_HOUR) {
    next.setHours(DAWN_HOUR)
  } else if (h < DUSK_HOUR) {
    next.setHours(DUSK_HOUR)
  } else {
    // past dusk → next boundary is dawn tomorrow
    next.setDate(next.getDate() + 1)
    next.setHours(DAWN_HOUR)
  }
  return Math.max(1000, next.getTime() - now.getTime())
}

function readInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'
  const stored = window.localStorage.getItem(MODE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored
  // Migrate from a pre-existing next-themes choice: explicit light/dark carry
  // over; 'system' (device-only) and first-run both upgrade to the smarter auto.
  const legacy = window.localStorage.getItem(NEXT_THEMES_KEY)
  return legacy === 'light' || legacy === 'dark' ? legacy : 'auto'
}

interface ThemeModeContextValue {
  /** The user's intent: light | dark | auto. */
  mode: ThemeMode
  /** Set intent. 'auto' resolves to device+time; light/dark are explicit. */
  setMode: (mode: ThemeMode) => void
  /** True once mounted on the client (SSR-safe gating for consumers). */
  mounted: boolean
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()
  const [mode, setModeState] = useState<ThemeMode>('auto')
  const [mounted, setMounted] = useState(false)
  const setThemeRef = useRef(setTheme)
  setThemeRef.current = setTheme

  // Hydrate intent from storage after mount (avoids SSR/client mismatch).
  useEffect(() => {
    setModeState(readInitialMode())
    setMounted(true)
  }, [])

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next)
      try {
        window.localStorage.setItem(MODE_KEY, next)
      } catch {
        /* private-mode / storage-disabled — intent just won't persist */
      }
      setThemeRef.current(next === 'auto' ? resolveAuto() : next)
    },
    []
  )

  // While in auto, keep the resolved value accurate to device + clock.
  useEffect(() => {
    if (!mounted || mode !== 'auto') return

    const apply = () => setThemeRef.current(resolveAuto())
    apply() // reconcile immediately (e.g. boundary crossed while tab was closed)

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onFocus = () => {
      if (document.visibilityState !== 'hidden') apply()
    }

    let timer: ReturnType<typeof setTimeout>
    const armBoundary = () => {
      timer = setTimeout(() => {
        apply()
        armBoundary() // re-arm for the following boundary
      }, msToNextBoundary(new Date()))
    }
    armBoundary()

    mql.addEventListener('change', apply)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      clearTimeout(timer)
      mql.removeEventListener('change', apply)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [mounted, mode])

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, mounted }}>
      {children}
    </ThemeModeContext.Provider>
  )
}

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider')
  }
  return ctx
}
