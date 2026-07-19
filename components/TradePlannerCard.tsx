'use client'

/**
 * AI Trade Planner — deterministic pre-trade plan panel (0 LLM tokens here).
 *
 * Every number comes from lib/tradePlan (pure math): fixed-fractional position
 * size, R-ladder, and the honest consecutive-loss drawdown line. "Ask AI about
 * this plan" hands a summary to the Main Chat copilot — the AI only reviews
 * and narrates; it never gates, sizes or changes the plan.
 */

import { ClipboardList, Sparkles } from '@/lib/icons'

import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { planTrade } from '@/lib/tradePlan'

const UP = 'text-up'
const DOWN = 'text-down'

const inr = (x: number) => `₹${x.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

interface TradePlannerCardProps {
  entry: number
  stop: number
  capital: number
  riskPct: number
  target?: number
  symbol?: string
}

export default function TradePlannerCard({ entry, stop, capital, riskPct, target, symbol }: TradePlannerCardProps) {
  const plan = planTrade({ entry, stop, capital, riskPct, target })

  if (!plan) {
    return (
      <div className="rounded-lg border border-line bg-wrap px-4 py-3">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <ClipboardList className="w-3.5 h-3.5 text-primary" /> Trade Plan
        </span>
        <p className="mt-1.5 text-[11px] text-d-text-muted">
          Enter a valid entry, stop, capital and risk % to build the plan (stop must differ from entry).
        </p>
      </div>
    )
  }

  const askAI = () => {
    const t = plan.targets
    const dd3 = plan.expectedDrawdownAtRisk.find((d) => d.n === 3)
    const parts = [
      `Review this trade plan${symbol ? ` for ${symbol.replace('.NS', '')}` : ''}:`,
      `${plan.direction.toUpperCase()} entry ${inr(entry)}, stop ${inr(stop)},`,
      `${plan.qty} shares (position ${inr(plan.positionValue)}, ${plan.positionPctOfCapital}% of capital),`,
      `risking ${inr(plan.riskAmount)} (${riskPct}% of capital, ${inr(plan.riskPerShare)}/share).`,
      `R-ladder: 1R ${inr(t[0].price)} / 2R ${inr(t[1].price)} / 3R ${inr(t[2].price)}.`,
    ]
    if (plan.rMultipleToTarget !== null && target !== undefined) {
      parts.push(`My target ${inr(target)} is ${plan.rMultipleToTarget}R.`)
    }
    if (dd3) parts.push(`Drawdown ${inr(dd3.amount)} ${dd3.label}.`)
    parts.push('Is the sizing and risk-reward sensible?')
    dispatchCopilotOpen(parts.join(' '))
  }

  return (
    <div className="rounded-lg border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <ClipboardList className="w-3.5 h-3.5 text-primary" /> Trade Plan
        </span>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider ${plan.direction === 'long' ? UP : DOWN}`}
        >
          {plan.direction}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-line">
        <Stat label="Quantity" value={`${plan.qty}`} sub="shares" />
        <Stat label="Position" value={inr(plan.positionValue)} sub={`${plan.positionPctOfCapital}% of capital`} />
        <Stat label="Risk if stop hits" value={inr(plan.riskAmount)} sub={`${inr(plan.riskPerShare)}/share`} colorClass={DOWN} />
        <Stat
          label="R to target"
          value={plan.rMultipleToTarget !== null ? `${plan.rMultipleToTarget}R` : '—'}
          sub={plan.rMultipleToTarget !== null ? 'at your target' : 'no target set'}
          colorClass={plan.rMultipleToTarget !== null ? (plan.rMultipleToTarget >= 0 ? UP : DOWN) : undefined}
        />
      </div>

      {plan.qty === 0 && (
        <p className="px-4 py-2 border-t border-line text-[11px] text-d-text-muted">
          Risk budget is too small for even 1 share at this stop distance — raise capital/risk % or tighten the stop.
        </p>
      )}

      <div className="px-4 py-2.5 border-t border-line">
        <div className="text-[9px] uppercase tracking-wider text-d-text-muted mb-1.5">R-ladder (from entry vs stop)</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px]">
          {plan.targets.map((t) => (
            <span key={t.r} className="text-d-text-secondary">
              {t.r}R <b className="numeric text-d-text-primary">{inr(t.price)}</b>
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-line space-y-0.5">
        {plan.expectedDrawdownAtRisk.map((d) => (
          <p key={d.n} className="text-[11px] text-d-text-secondary">
            <span className={`numeric font-semibold ${DOWN}`}>−{inr(d.amount)}</span> {d.label}
          </p>
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-line">
        <button
          onClick={askAI}
          className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline"
        >
          <Sparkles className="w-3.5 h-3.5" /> Ask AI about this plan
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, sub, colorClass }: { label: string; value: string; sub?: string; colorClass?: string }) {
  return (
    <div className="bg-wrap px-3 py-2 text-center">
      <div className="text-[9px] uppercase tracking-wider text-d-text-muted">{label}</div>
      <div className={`text-[14px] numeric font-semibold ${colorClass || 'text-d-text-primary'}`}>{value}</div>
      {sub && <div className="text-[9px] text-d-text-muted mt-0.5">{sub}</div>}
    </div>
  )
}
