'use client'

/**
 * Probability Engine — empirical setup follow-through rates from the stock's own
 * history (breakout / oversold bounce / uptrend continuation), each with its
 * sample size. Real outcomes, not fabricated. Honest-empty when history is thin.
 */

import { useEffect, useState } from 'react'
import { Percent } from '@/lib/icons'

import { api } from '@/lib/api'

interface Setup { name: string; active_now: boolean; occurrences: number; prob_pct: number | null }

function color(p: number | null) {
  if (p == null) return '#8b8f9a'
  if (p >= 60) return '#05B878'
  if (p >= 45) return '#FEB113'
  return '#FF5947'
}

export default function ProbabilityCard({ symbol }: { symbol: string }) {
  const [setups, setSetups] = useState<Setup[]>([])
  const [meta, setMeta] = useState<{ horizon: number; target: number }>({ horizon: 10, target: 2 })
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.screener.probability(symbol)
        if (cancelled) return
        const valid = (r?.setups || []).filter((s) => s.prob_pct != null && s.occurrences >= 5)
        if (valid.length) { setSetups(valid); setMeta({ horizon: r.horizon_days, target: r.target_pct }); setState('ok') } else setState('empty')
      } catch { if (!cancelled) setState('empty') }
    })()
    return () => { cancelled = true }
  }, [symbol])

  if (state === 'loading') return <div className="rounded-lg border border-line bg-wrap h-[140px] animate-pulse" />
  if (state === 'empty') return null

  return (
    <div className="rounded-lg border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <Percent className="w-3.5 h-3.5 text-primary" /> Setup Probabilities
        </span>
        <span className="text-[10px] text-d-text-muted">{'>='}{meta.target}% within {meta.horizon}d</span>
      </div>
      <div className="divide-y divide-line">
        {setups.map((s) => (
          <div key={s.name} className="flex items-center justify-between px-4 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-d-text-primary capitalize">{s.name}</span>
                {s.active_now && (
                  <span className="text-[8px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">Active now</span>
                )}
              </div>
              <div className="text-[10px] text-d-text-muted">{s.occurrences} past occurrences</div>
            </div>
            <span className="text-[18px] numeric font-semibold shrink-0" style={{ color: color(s.prob_pct) }}>
              {s.prob_pct}%
            </span>
          </div>
        ))}
      </div>
      <p className="px-4 py-2 text-[9px] text-d-text-muted border-t border-line">
        Historical base rates from this stock&apos;s own past — not a prediction.
      </p>
    </div>
  )
}
