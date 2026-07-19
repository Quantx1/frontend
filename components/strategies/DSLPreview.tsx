'use client'

/**
 * DSLPreview — a clean, plain-English reading of a compiled strategy.
 *
 * Reads like a description a person wrote ("Buy when RSI (14) drops below
 * 30 and price rises above the 200-day average"), not a query. The raw DSL
 * is tucked behind an "Advanced" toggle for power users. Used by the
 * Builder, /strategies/[slug], and /strategies/mine/[id].
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, Code2, ArrowRight } from '@/lib/icons'

import { Badge, Card, CardBody } from '@/components/foundation'
import { labelUniverse, humanRegime } from '@/lib/dsl'
import { conditionToClause } from '@/lib/dsl-plain'
import type { DSLStrategy } from '@/types/strategies'

interface Props {
  dsl: DSLStrategy
  /** Hide the Advanced (raw DSL) toggle. */
  compact?: boolean
}

export function DSLPreview({ dsl, compact }: Props) {
  const [showJson, setShowJson] = useState(false)

  const risk: { label: string; value: string; tone?: 'up' | 'down' | 'warning' }[] = []
  if (dsl.stop_loss_pct != null)
    risk.push({ label: 'Stop loss', value: `${dsl.stop_loss_pct}%`, tone: 'down' })
  if (dsl.take_profit_pct != null)
    risk.push({ label: 'Target', value: `${dsl.take_profit_pct}%`, tone: 'up' })
  if (dsl.trailing_stop_pct != null)
    risk.push({ label: 'Trailing', value: `${dsl.trailing_stop_pct}%`, tone: 'warning' })
  risk.push({ label: 'Position', value: positionSizeLabel(dsl.position_size) })
  risk.push({ label: 'History', value: `${dsl.lookback_days} days` })

  return (
    <Card>
      <CardBody className="space-y-5 p-5">
        {/* Title + meta */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-[17px] font-semibold leading-tight text-d-text-primary" title={dsl.name}>
            {dsl.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="muted">{dsl.instrument_segment === 'OPTIONS' ? 'Options' : 'Equity'}</Badge>
            <Badge tone="muted">{dsl.timeframe}</Badge>
            <Badge tone="muted">{labelUniverse(dsl.universe)}</Badge>
            {dsl.regime_filter !== 'any' && (
              <Badge tone="warning">{humanRegime(dsl.regime_filter)}</Badge>
            )}
          </div>
        </div>

        {/* The rules, as plain English */}
        <div className="space-y-3">
          <RuleLine kind="enter" text={conditionToClause(dsl.entry)} symbol={dsl.symbol} />
          <RuleLine kind="exit" text={conditionToClause(dsl.exit)} />
        </div>

        {/* Risk & sizing — quiet stat row, not code cells */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4">
          {risk.map((r) => (
            <div key={r.label}>
              <p className="text-[10px] font-medium uppercase tracking-wider text-d-text-muted">
                {r.label}
              </p>
              <p
                className={`mt-0.5 text-sm font-semibold tabular-nums ${
                  r.tone === 'up'
                    ? 'text-up'
                    : r.tone === 'down'
                      ? 'text-down'
                      : r.tone === 'warning'
                        ? 'text-warning'
                        : 'text-d-text-primary'
                }`}
              >
                {r.value}
              </p>
            </div>
          ))}
        </div>

        {/* Advanced — raw DSL for power users, de-emphasised */}
        {!compact && (
          <div className="border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setShowJson((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[11px] text-d-text-muted transition-colors hover:text-d-text-secondary"
            >
              {showJson ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <Code2 className="h-3 w-3" />
              Advanced — view the raw rule definition
            </button>
            {showJson && (
              <pre className="mt-2 max-h-[360px] overflow-auto rounded-md border border-line bg-main p-3 font-mono text-[11px] leading-relaxed text-d-text-secondary">
                {JSON.stringify(dsl, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function RuleLine({
  kind,
  text,
  symbol,
}: {
  kind: 'enter' | 'exit'
  text: string
  symbol?: string | null
}) {
  const isEnter = kind === 'enter'
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-semibold ${
          isEnter ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
        }`}
      >
        <ArrowRight className="h-3 w-3" />
        {isEnter ? 'Buy' : 'Sell'}
      </span>
      <p className="pt-0.5 text-[15px] leading-relaxed text-d-text-primary">
        when {text}
        {isEnter && symbol ? <span className="text-d-text-muted"> · {symbol}</span> : null}
        <span className="text-d-text-muted">.</span>
      </p>
    </div>
  )
}

function positionSizeLabel(p: DSLStrategy['position_size']): string {
  switch (p.kind) {
    case 'percent_of_capital':
      return `${p.value}% of capital`
    case 'fixed_qty':
      return `${p.value} shares`
    case 'risk_based':
      return `${p.value}% risk`
  }
}
