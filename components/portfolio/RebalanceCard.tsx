'use client'

/**
 * AI Rebalancing — user-triggered. Concrete actions (trim overweight / cut
 * weakest / diversify a concentrated sector / de-risk a correlated pair) +
 * holdings correlation + a grounded rationale. 0 cost until asked.
 */

import { useState } from 'react'
import { Scale, Loader2 } from '@/lib/icons'

import { api } from '@/lib/api'
import { SymbolLogo } from '@/components/ui/BrandLogo'

interface Suggestion { action: string; symbol: string | null; sector?: string; pair?: string[]; from_pct?: number; to_pct?: number | null; reason: string }
interface Result {
  correlation: { avg_corr: number | null; pairs: Array<{ a: string; b: string; corr: number }> }
  suggestions: Suggestion[]
  narrative: string | null
}

const ACTION_COLOR: Record<string, string> = {
  trim: '#FF5947', reduce: '#FEB113', diversify: '#3B82F6', 'de-risk': '#8B5CF6',
}

export default function RebalanceCard({ positions }: { positions: Array<{ symbol: string; weight: number }> }) {
  const [data, setData] = useState<Result | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'empty'>('idle')

  const run = async () => {
    setState('loading')
    try {
      const r = await api.portfolioDoctor.rebalance(positions, true)
      if (r?.suggestions?.length || r?.correlation?.avg_corr != null || r?.narrative) {
        setData(r as Result); setState('done')
      } else setState('empty')
    } catch { setState('empty') }
  }

  return (
    <section className="rounded-xl border border-d-border bg-wrap p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold text-d-text-primary">
          <Scale className="h-4 w-4 text-primary" /> AI Rebalancing
        </h3>
        <button
          onClick={run}
          disabled={state === 'loading'}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12px] text-primary hover:border-primary/60 disabled:opacity-60"
        >
          {state === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {state === 'idle' ? 'Suggest rebalance' : 'Refresh'}
        </button>
      </div>

      {state === 'empty' && <p className="mt-3 text-[12px] text-d-text-muted">Portfolio looks balanced — no actions suggested.</p>}

      {state === 'done' && data && (
        <div className="mt-3 space-y-3">
          {data.narrative && <p className="text-[12.5px] leading-relaxed text-d-text-secondary">{data.narrative}</p>}

          {data.suggestions.length > 0 && (
            <ul className="space-y-2">
              {data.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                    style={{ color: ACTION_COLOR[s.action] || '#8b8f9a', background: `${ACTION_COLOR[s.action] || '#8b8f9a'}1A` }}>
                    {s.action}
                  </span>
                  <span className="text-[12px] text-d-text-secondary leading-snug">
                    {s.symbol && (
                      <span className="mr-1.5 inline-flex items-center gap-1.5 align-middle">
                        <SymbolLogo symbol={s.symbol} size={22} />
                        <b className="text-d-text-primary">{s.symbol}</b>
                      </span>
                    )}
                    {s.reason}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {data.correlation?.avg_corr != null && (
            <p className="text-[11px] text-d-text-muted">
              Avg holdings correlation <b className="text-d-text-primary numeric">{data.correlation.avg_corr}</b>
              {data.correlation.pairs[0] && ` · most correlated: ${data.correlation.pairs[0].a}/${data.correlation.pairs[0].b} (${data.correlation.pairs[0].corr})`}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
