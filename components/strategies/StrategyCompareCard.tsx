'use client'

/**
 * Strategy Compare — head-to-head of 2–6 of your strategies.
 *
 * Closes the audit's one genuinely-missing capability: there was no way to
 * diff/rank user strategies against each other. Pick strategies → compare →
 * side-by-side out-of-sample metrics with the per-metric winner highlighted
 * and a best-overall pick (prefers gate-passers). All metrics from the same
 * OOS gate that decides live promotion.
 */

import { useState } from 'react'
import { GitCompare, Loader2, Trophy } from '@/lib/icons'

import { Card, CardBody, CardHeader, Button, DisclaimerFooter } from '@/components/foundation'
import { api } from '@/lib/api'

type CompareResult = Awaited<ReturnType<typeof api.strategies.compare>>

const ROWS: { key: keyof CompareResult['strategies'][number]['metrics']; label: string; fmt: (v: number) => string }[] = [
  { key: 'oos_sharpe', label: 'OOS Sharpe', fmt: (v) => v.toFixed(2) },
  { key: 'oos_consistency', label: 'Consistency', fmt: (v) => `${Math.round(v * 100)}%` },
  { key: 'holdout_return_pct', label: 'Holdout return', fmt: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` },
  { key: 'oos_worst_drawdown_pct', label: 'Worst drawdown', fmt: (v) => `${v.toFixed(1)}%` },
  { key: 'oos_trades', label: 'OOS trades', fmt: (v) => String(v) },
]

export function StrategyCompareCard({ strategies }: { strategies: { id: string; name: string }[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [result, setResult] = useState<CompareResult | null>(null)
  const [busy, setBusy] = useState(false)

  const toggle = (id: string) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 6 ? cur : [...cur, id],
    )

  const run = async () => {
    if (selected.length < 2) return
    setBusy(true)
    try {
      setResult(await api.strategies.compare(selected))
    } catch {
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <span className="inline-flex items-center gap-1.5">
          <GitCompare className="h-4 w-4 text-primary" /> Compare strategies
        </span>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-xs text-d-text-muted">Pick 2–6 to compare head-to-head on out-of-sample metrics.</p>
        <div className="flex flex-wrap gap-1.5">
          {strategies.map((s) => {
            const on = selected.includes(s.id)
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  on ? 'glass-control-accent' : 'glass-control text-d-text-muted hover:text-d-text-primary'
                }`}
              >
                {s.name}
              </button>
            )
          })}
        </div>
        <Button onClick={run} disabled={selected.length < 2 || busy} size="sm">
          {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
          Compare {selected.length >= 2 ? selected.length : ''}
        </Button>

        {result && result.strategies.length >= 2 && (
          <div className="overflow-x-auto border-t border-wrap-hover pt-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-d-text-muted">
                  <th className="py-1 text-left font-medium">Metric</th>
                  {result.strategies.map((s) => (
                    <th key={s.id} className="px-2 py-1 text-right font-medium">
                      <span className="inline-flex items-center gap-1">
                        {s.id === result.best_overall && <Trophy className="h-3 w-3 text-warning" />}
                        {s.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.key} className="border-t border-wrap-hover/50">
                    <td className="py-1.5 text-left text-d-text-secondary">{r.label}</td>
                    {result.strategies.map((s) => {
                      const v = s.metrics[r.key]
                      const win = result.winners[r.key] === s.id
                      return (
                        <td
                          key={s.id}
                          className={`px-2 py-1.5 text-right tabular-nums ${win ? 'font-semibold text-success' : 'text-d-text-primary'}`}
                        >
                          {v === null || v === undefined ? '—' : r.fmt(v as number)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                <tr className="border-t border-wrap-hover/50">
                  <td className="py-1.5 text-left text-d-text-secondary">Live-gate</td>
                  {result.strategies.map((s) => (
                    <td key={s.id} className={`px-2 py-1.5 text-right font-medium ${s.gate_pass ? 'text-success' : 'text-d-text-muted'}`}>
                      {s.gate_pass ? 'Pass' : 'Not yet'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <DisclaimerFooter compact />
          </div>
        )}
      </CardBody>
    </Card>
  )
}
