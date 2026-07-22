'use client'

import { useRouter } from 'next/navigation'
import { Bot, Check, LineChart } from '@/lib/icons'
import { toast } from 'sonner'
import { useUiMode, type UiMode } from '@/contexts/UiModeContext'

/**
 * Experience-mode switch (dual-mode 2026-06-12; WP-SIMPLEVIEW 2026-07-02).
 *
 *  Managed — turns on a plain-language Simple view on the real pages
 *            (/copilot, /portfolio): money, risk and what the AI is doing,
 *            no charts or jargon. The AI runs the account on the user's own
 *            broker. Toggle Simple/Full lives on each page too.
 *  Pro     — the full trading terminal (default).
 *
 * Stored per-account in ui_preferences (cross-device), unlike the theme
 * toggle below which is per-device.
 */
export default function ModePanel() {
  const { mode, setMode } = useUiMode()
  const router = useRouter()

  const choose = async (next: UiMode) => {
    if (next === mode) return
    await setMode(next)
    toast.success(
      next === 'managed'
        ? 'Simple view on — plain-language cards are ready.'
        : 'Full view on — the complete terminal is back.',
    )
    router.push('/copilot')
  }

  const options: { value: UiMode; icon: typeof Bot; label: string; desc: string }[] = [
    {
      value: 'managed',
      icon: Bot,
      label: 'Managed',
      desc: 'The AI trades on your own broker account within your limits. Turns on a plain-language Simple view — money, risk, activity — right on your pages. No charts or jargon.',
    },
    {
      value: 'pro',
      icon: LineChart,
      label: 'Pro',
      desc: 'The full terminal: signals, strategy builder, scanners, backtesting, bot execution and risk analytics.',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Experience mode">
      {options.map((o) => {
        const Icon = o.icon
        const active = mode === o.value
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => choose(o.value)}
            className={`relative rounded-sm p-4 text-left glass-control transition-colors ${
              active
                ? 'ring-1 ring-primary/50'
                : 'hover:bg-wrap-hover'
            }`}
          >
            {active && (
              <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
            <Icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-[14px] font-semibold text-d-text-primary">{o.label}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-d-text-muted">{o.desc}</p>
          </button>
        )
      })}
    </div>
  )
}
