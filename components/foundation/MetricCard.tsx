'use client'

/**
 * Foundation MetricCard — the pro-finance KPI tile.
 *
 * A tighter, sharper card (`.metric-card`) with a coloured left accent keyed
 * to semantic tone, a mono-caps label, a large tabular value (count-up when
 * numeric), an optional signed delta, and an optional trailing sparkline.
 * This is the single repeating unit of the redesigned data desks
 * (Markets / Signals / Portfolio), replacing the assorted inline stat cells.
 *
 * @example
 *   <MetricCard label="Net P&L" value={128450} prefix="₹" tone="up"
 *               delta={+2.4} spark={[3,5,4,7,9]} />
 */

import * as React from 'react'
import { NumberTicker } from '@/components/motion'
import { Sparkline } from './Sparkline'
import { MONO } from '@/lib/tokens'
import { cn } from '@/lib/utils'

export type MetricTone = 'up' | 'down' | 'ai' | 'warning' | 'neutral'

const VALUE_TONE: Record<MetricTone, string> = {
  up: 'text-up',
  down: 'text-down',
  ai: 'text-d-text-primary',
  warning: 'text-warning',
  neutral: 'text-d-text-primary',
}

interface Props {
  label: string
  /** Numeric values count up + format with `decimals`; strings render as-is. */
  value: number | string
  tone?: MetricTone
  decimals?: number
  prefix?: string
  suffix?: string
  /** Signed % delta rendered as a coloured pill under the value. */
  delta?: number
  /** Optional icon shown at the top-right. */
  icon?: React.ReactNode
  /** Optional sparkline series drawn under the value. */
  spark?: number[]
  /** Optional muted hint line. */
  hint?: React.ReactNode
  className?: string
}

export function MetricCard({
  label,
  value,
  tone = 'neutral',
  decimals = 0,
  prefix,
  suffix,
  delta,
  icon,
  spark,
  hint,
  className,
}: Props) {
  const deltaTone = delta == null ? 'neutral' : delta >= 0 ? 'up' : 'down'
  return (
    <div data-tone={tone} className={cn('metric-card px-3.5 py-3', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="desk-label truncate">{label}</p>
        {icon && <span className="shrink-0 text-d-text-muted">{icon}</span>}
      </div>

      <div className={cn('mt-2 text-[22px] leading-none font-normal tabular-nums', MONO, VALUE_TONE[tone])}>
        {prefix}
        {typeof value === 'number' ? <NumberTicker value={value} decimalPlaces={decimals} /> : value}
        {suffix}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        {delta != null ? (
          <span
            className={cn(
              'inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
              deltaTone === 'up' ? 'bg-up/12 text-up' : 'bg-down/12 text-down',
            )}
          >
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(2)}%
          </span>
        ) : (
          <span />
        )}
        {spark && spark.length > 1 && (
          <Sparkline data={spark} width={64} height={20} tone={tone === 'down' ? 'down' : 'up'} />
        )}
      </div>

      {hint != null && <p className="mt-1.5 text-[11px] text-d-text-muted">{hint}</p>}
    </div>
  )
}
