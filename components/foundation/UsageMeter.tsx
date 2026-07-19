'use client'

/**
 * UsageMeter — compact "X / Y" usage indicator with optional Upgrade
 * CTA. Used wherever a tier-gated resource has a numeric cap that the
 * user should see (watchlist symbol count, signals/day, Copilot
 * credits, Doctor runs/mo).
 *
 * Renders a single-line badge:
 *
 *   ┌───────────────────────────────┐
 *   │  3 / 5 symbols  · Upgrade →   │
 *   └───────────────────────────────┘
 *
 * Color crosses from muted → warning → down as usage approaches cap.
 */

import Link from 'next/link'
import { ArrowRight } from '@/lib/icons'

import { cn } from '@/lib/utils'

type Tone = 'muted' | 'warning' | 'down'

export interface UsageMeterProps {
  used: number
  cap: number
  /** Suffix label (e.g. "symbols", "signals today"). */
  label: string
  /** Path the Upgrade link routes to. Default ``/pricing``. */
  upgradeHref?: string
  /** Show the Upgrade link. Default true if used >= 80% of cap. */
  showUpgrade?: boolean
  /** Compact mode: single line, smaller padding. Default true. */
  compact?: boolean
  className?: string
}

export function UsageMeter({
  used,
  cap,
  label,
  upgradeHref = '/pricing',
  showUpgrade,
  compact = true,
  className,
}: UsageMeterProps) {
  const safeCap = Math.max(0, cap)
  const safeUsed = Math.max(0, used)
  const pct = safeCap > 0 ? safeUsed / safeCap : 1
  const tone: Tone = pct >= 1 ? 'down' : pct >= 0.8 ? 'warning' : 'muted'

  const TONE_TEXT: Record<Tone, string> = {
    muted: 'text-d-text-muted',
    warning: 'text-warning',
    down: 'text-down',
  }
  const TONE_BG: Record<Tone, string> = {
    muted: 'bg-wrap-hover',
    warning: 'bg-warning/10 border-warning/30',
    down: 'bg-down/10 border-down/30',
  }
  const TONE_BORDER: Record<Tone, string> = {
    muted: 'border-line',
    warning: 'border-warning/30',
    down: 'border-down/30',
  }

  const upgradeVisible =
    showUpgrade !== undefined ? showUpgrade : pct >= 0.8

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border font-mono text-[11px] tabular-nums',
        compact ? 'px-2 py-0.5' : 'px-2.5 py-1',
        TONE_BG[tone],
        TONE_BORDER[tone],
        className,
      )}
      role="status"
      aria-label={`${safeUsed} of ${safeCap} ${label} used`}
    >
      <span className={cn('font-normal', TONE_TEXT[tone])}>
        {safeUsed} / {safeCap}
      </span>
      <span className="text-d-text-muted">{label}</span>
      {upgradeVisible && (
        <Link
          href={upgradeHref}
          className="ml-1 inline-flex items-center gap-0.5 text-d-text-primary hover:underline"
        >
          Upgrade
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      )}
    </span>
  )
}
