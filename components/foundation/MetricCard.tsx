'use client'

/**
 * Foundation MetricCard — pro-finance KPI tile built on shadcn Card.
 *
 * A shadcn Card with a 2px left-border accent keyed to semantic tone,
 * a mono-caps label, a large tabular value (count-up when numeric),
 * an optional signed delta, and an optional trailing sparkline.
 *
 * @example
 *   <MetricCard label="Net P&L" value={128450} prefix="₹" tone="up"
 *               delta={+2.4} spark={[3,5,4,7,9]} />
 */

import * as React from 'react'
import { NumberTicker } from '@/components/motion'
import { Sparkline } from './Sparkline'
import { MONO } from '@/lib/tokens'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type MetricTone = 'up' | 'down' | 'ai' | 'warning' | 'neutral'

const ACCENT_BORDER: Record<MetricTone, string> = {
  up:      'border-l-green-500',
  down:    'border-l-red-500',
  ai:      'border-l-primary',
  warning: 'border-l-amber-500',
  neutral: 'border-l-border',
}

const VALUE_GRADIENT: Record<MetricTone, React.CSSProperties> = {
  up:      { background: 'linear-gradient(125deg, #4FFFB0 0%, #16C784 55%, #0EA56A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  down:    { background: 'linear-gradient(125deg, #FF7090 0%, #EA3943 55%, #C42B32 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  ai:      { background: 'linear-gradient(125deg, #C4B5FD 0%, #8FB0FF 50%, #5290F4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  warning: { background: 'linear-gradient(125deg, #FFD980 0%, #F0A94F 50%, #E07B20 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  neutral: {},
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
    <Card
      className={cn(
        // Left accent border — the single strongest "trading terminal" signal
        'border-l-2',
        ACCENT_BORDER[tone],
        'px-3.5 py-3',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-eyebrow truncate text-muted-foreground/70">
          {label}
        </p>
        {icon && <span className="shrink-0 text-muted-foreground/70">{icon}</span>}
      </div>

      <div className="mt-2 text-[24px] leading-none font-semibold tabular-nums font-display tracking-tight">
        <span
          style={
            tone !== 'neutral'
              ? { ...VALUE_GRADIENT[tone], display: 'inline' }
              : { color: 'hsl(var(--foreground))' }
          }
        >
          {prefix}
          {typeof value === 'number'
            ? <NumberTicker value={value} decimalPlaces={decimals} style={tone !== 'neutral' ? VALUE_GRADIENT[tone] : undefined} />
            : value}
          {suffix}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        {delta != null ? (
          <span
            className={cn(
              'inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
              deltaTone === 'up'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400',
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

      {hint != null && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}
    </Card>
  )
}
