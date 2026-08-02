'use client'

/**
 * AnimatedThemeToggle — the app-bound quick light/dark flip with the MagicUI
 * View-Transition reveal. Controlled by next-themes (resolvedTheme) so it
 * respects "auto" (device + time), and a tap sets an explicit light/dark
 * intent via ThemeModeContext (a manual flip exits auto, like macOS).
 *
 * Renders the app's own Solar Sun/Moon glyph so it sits native in the rail.
 * Reduced-motion collapses the reveal to an instant swap.
 */

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from '@/lib/icons'
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler'
import type { TransitionVariant } from '@/components/magicui/animated-theme-toggler'
import { useThemeMode } from '@/contexts/ThemeModeContext'

export function AnimatedThemeToggle({
  className = '',
  variant = 'circle',
  iconClassName = 'h-5 w-5',
}: {
  className?: string
  variant?: TransitionVariant
  iconClassName?: string
}) {
  const { resolvedTheme } = useTheme()
  const { setMode } = useThemeMode()
  const [mounted, setMounted] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(mql.matches)
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [])

  // Until mounted, next-themes can't know the resolved value on the server —
  // render the Moon (light default) so SSR and first client paint agree.
  const isDark = mounted ? resolvedTheme === 'dark' : false
  const Icon = isDark ? Sun : Moon
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <AnimatedThemeToggler
      theme={isDark ? 'dark' : 'light'}
      onThemeChange={(t) => setMode(t)}
      variant={variant}
      duration={reduceMotion ? 0 : 460}
      aria-label={label}
      title={label}
      className={className}
    >
      <Icon className={iconClassName} aria-hidden="true" />
    </AnimatedThemeToggler>
  )
}
