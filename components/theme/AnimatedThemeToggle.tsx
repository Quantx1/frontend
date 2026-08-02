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

import { forwardRef, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from '@/lib/icons'
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler'
import type { TransitionVariant } from '@/components/magicui/animated-theme-toggler'
import { useThemeMode } from '@/contexts/ThemeModeContext'

// forwardRef because RightRail wraps this in `<TooltipTrigger asChild>`, which
// clones the child and passes a ref. A plain function component drops it, React
// logs "Function components cannot be given refs", and the tooltip has no
// element to anchor to. The ref must reach the real <button>, so it is passed
// straight through to AnimatedThemeToggler (which forwards it in turn).
export const AnimatedThemeToggle = forwardRef<
  HTMLButtonElement,
  {
    className?: string
    variant?: TransitionVariant
    iconClassName?: string
  }
>(function AnimatedThemeToggle({
  className = '',
  variant = 'circle',
  iconClassName = 'h-5 w-5',
}, ref) {
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
      ref={ref}
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
})
