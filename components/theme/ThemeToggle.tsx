'use client'

/**
 * ThemeToggle — three-option segmented control: Light / Dark / System.
 *
 * Wired into /settings under Appearance. Uses next-themes (configured in
 * app/providers.tsx with storageKey="quantx.theme", defaultTheme="system",
 * enableSystem). The OS-level "system" option follows prefers-color-scheme
 * and updates live if the OS theme flips.
 *
 * Tap target: 40px min-height (mobile AA).
 */

import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from '@/lib/icons'
import { useTheme } from 'next-themes'

type ThemeValue = 'light' | 'dark' | 'system'

const OPTIONS: Array<{
  value: ThemeValue
  label: string
  icon: React.ComponentType<{ className?: string }>
  hint: string
}> = [
  { value: 'light',  label: 'Light',  icon: Sun,     hint: 'Refined cool near-white, daylight reading' },
  { value: 'dark',   label: 'Dark',   icon: Moon,    hint: 'Near-black canvas, after-hours' },
  { value: 'system', label: 'System', icon: Monitor, hint: 'Follow your OS preference (default)' },
]


export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // next-themes can't know the resolved theme on the server, so we
  // wait one tick before mirroring it into the radio state. Until
  // then the buttons render unselected — the boot script has already
  // applied the right class to <html>, so this is purely about which
  // pill the user sees as active.
  useEffect(() => setMounted(true), [])
  const active = mounted ? (theme as ThemeValue | undefined) : undefined

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className={`inline-flex flex-wrap items-center gap-1 rounded-lg border border-d-border bg-wrap p-1 ${className}`}
    >
      {OPTIONS.map(({ value, label, icon: Icon, hint }) => {
        const selected = active === value
        return (
          <button
            key={value}
            role="radio"
            aria-checked={selected}
            title={hint}
            onClick={() => setTheme(value)}
            className={[
              'inline-flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-medium',
              'transition-all min-h-[40px] spring-press',
              selected
                ? 'bg-primary/10 text-primary border border-primary/30 shadow-[inset_0_0_0_1px_rgba(11,163,127,0.10)]'
                : 'text-d-text-secondary hover:bg-white/[0.03] border border-transparent',
            ].join(' ')}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}


/**
 * Compact single-button variant for top bars / app shells. Tap →
 * toggle between light and dark explicitly. Use ThemeToggle in
 * Settings; ThemeToggleCompact in dense navigation.
 */
export function ThemeToggleCompact({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // SSR-safe icon — render nothing theme-specific until mounted, then
  // swap to match the resolved theme (system-aware).
  const isDark = mounted ? resolvedTheme === 'dark' : false
  const Icon = isDark ? Sun : Moon
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      className={[
        'inline-flex h-8 w-8 items-center justify-center rounded-md',
        'border border-d-border text-d-text-muted',
        'transition-colors hover:border-primary/30 hover:text-primary',
        className,
      ].join(' ')}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}
