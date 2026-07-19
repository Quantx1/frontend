'use client'

/**
 * Foundation StatCard — KPI display for dashboards.
 *
 * One label + one big value + optional delta + optional sparkline.
 * The "stat cell" every trading dashboard needs: equity, day P&L,
 * win rate, exposure, drawdown, etc.
 *
 * States:
 *  - Default: render value
 *  - Loading: pass ``loading={true}`` → shimmer placeholder for value
 *  - Error: pass ``error="..."`` → error message replaces value
 *
 * @example  Equity card
 *   <StatCard
 *     label="Equity"
 *     value="₹4,32,180"
 *     delta={{ value: 1.4, kind: 'percent' }}
 *     spark={equityCurve}
 *   />
 *
 * @example  With tooltip + loading
 *   <StatCard
 *     label="Win rate"
 *     value={loading ? null : `${winRate.toFixed(1)}%`}
 *     tooltip="Wins ÷ total closed trades over the selected period"
 *     loading={loading}
 *   />
 *
 * @example  Error state
 *   <StatCard
 *     label="Day P&L"
 *     value=""
 *     error="Couldn't fetch live P&L"
 *   />
 */
import * as React from 'react'
import { Info } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ChangeBadge, type ChangeKind } from './ChangeBadge'
import { Sparkline } from './Sparkline'
import { Skeleton } from './Skeleton'
import { Tooltip } from './Tooltip'

interface Props {
  label: string
  /** Big value — pre-formatted string. Use empty string when loading/error. */
  value: React.ReactNode
  /** Optional change indicator below value. */
  delta?: { value: number; kind?: ChangeKind }
  /** Optional sparkline trail data. */
  spark?: number[]
  /** Optional explainer in a tooltip — surfaces an ⓘ icon. */
  tooltip?: React.ReactNode
  loading?: boolean
  error?: string
  /** PR-V3 — v4 liquid-glass surface (else the flat panel). */
  glass?: boolean
  className?: string
}

export const StatCard = ({
  label,
  value,
  delta,
  spark,
  tooltip,
  loading,
  error,
  glass,
  className,
}: Props) => (
  <div
    className={cn(
      'flex flex-col gap-2 rounded-sm p-4',
      glass ? 'lg-surface lift' : 'border border-line bg-wrap',
      className,
    )}
    aria-busy={loading || undefined}
  >
    <div className="flex items-center gap-1.5">
      <p className="font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-d-text-muted">
        {label}
      </p>
      {tooltip && (
        <Tooltip content={tooltip}>
          <button
            type="button"
            aria-label={`${label} explanation`}
            className="text-d-text-muted hover:text-d-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
          >
            <Info className="h-3 w-3" aria-hidden="true" />
          </button>
        </Tooltip>
      )}
    </div>
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0 flex-1">
        {loading ? (
          <Skeleton w="60%" h="28px" rounded="md" />
        ) : error ? (
          <p className="text-sm text-down">{error}</p>
        ) : (
          <p className="truncate font-mono text-2xl font-normal text-d-text-primary tabular-nums">
            {value}
          </p>
        )}
        {!loading && !error && delta && (
          <ChangeBadge value={delta.value} kind={delta.kind ?? 'percent'} size="sm" className="mt-1" />
        )}
      </div>
      {spark && !loading && !error && (
        <Sparkline data={spark} width={72} height={28} filled />
      )}
    </div>
  </div>
)
