'use client'

/**
 * ThemeToggle — three-option segmented control: Light / Dark / Auto.
 *
 * Wired into /settings under Appearance. Backed by ThemeModeContext (which
 * layers on next-themes, storageKey="quantx.theme"). "Auto" adapts to BOTH the
 * device (prefers-color-scheme) AND the local time of day — light through the
 * day, dark after hours — updating live when the OS flips or the clock crosses
 * dawn/dusk. Light / Dark are explicit overrides.
 *
 * Tap target: 40px min-height (mobile AA).
 */

import { Monitor, Moon, Sun } from '@/lib/icons'
import { useThemeMode, type ThemeMode } from '@/contexts/ThemeModeContext'
import { AnimatedThemeToggle } from '@/components/theme/AnimatedThemeToggle'

const OPTIONS: Array<{
  value: ThemeMode
  label: string
  icon: React.ComponentType<{ className?: string }>
  hint: string
}> = [
  { value: 'light', label: 'Light', icon: Sun, hint: 'Refined cool near-white, daylight reading' },
  { value: 'dark', label: 'Dark', icon: Moon, hint: 'Near-black canvas, after-hours' },
  { value: 'auto', label: 'Auto', icon: Monitor, hint: 'Match your device + time of day (default)' },
]


export function ThemeToggle({ className = '' }: { className?: string }) {
  const { mode, setMode, mounted } = useThemeMode()

  // Until mounted the intent isn't known on the server, so render every pill
  // unselected — the next-themes boot script has already applied the right
  // class to <html>; this is only about which pill reads as active.
  const active = mounted ? mode : undefined

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
            onClick={() => setMode(value)}
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
 * animated light/dark reveal (View Transitions). A manual flip sets an
 * explicit light/dark intent (exits Auto). Use ThemeToggle in Settings;
 * ThemeToggleCompact in dense navigation.
 */
export function ThemeToggleCompact({ className = '' }: { className?: string }) {
  return (
    <AnimatedThemeToggle
      iconClassName="w-4 h-4"
      className={[
        'inline-flex h-8 w-8 items-center justify-center rounded-md',
        'border border-d-border text-d-text-muted',
        'transition-colors hover:border-primary/30 hover:text-primary',
        className,
      ].join(' ')}
    />
  )
}
