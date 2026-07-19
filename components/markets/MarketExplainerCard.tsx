'use client'

/**
 * AI Market Explainer — index-level plain-English market summary.
 *
 * The whole-market analogue of WhyMovingCard: deterministic drivers (NIFTY %,
 * advance/decline breadth, leading/lagging sectors, regime) load instantly with
 * 0 LLM tokens; the grounded AI narrative is fetched ONLY when the user clicks
 * "Explain" (cached per day). Honest-empty — renders null when no real facts.
 * Matches markets/BreadthCard + SectorRotationCard styling.
 */

import { useEffect, useState } from 'react'
import { Sparkles, Loader2 } from '@/lib/icons'

import { api } from '@/lib/api'

interface Resp {
  drivers: string[]
  narrative: string | null
}

export default function MarketExplainerCard() {
  const [drivers, setDrivers] = useState<string[]>([])
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')
  const [narrative, setNarrative] = useState<string | null>(null)
  const [llm, setLlm] = useState<'idle' | 'loading' | 'done'>('idle')

  // Deterministic drivers load instantly (no LLM).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.screener.marketExplainer(false)
        if (cancelled) return
        if (r?.drivers?.length) { setDrivers(r.drivers); setState('ok') } else setState('empty')
      } catch { if (!cancelled) setState('empty') }
    })()
    return () => { cancelled = true }
  }, [])

  // The grounded narrative is fetched only on click, cached per day server-side.
  const explain = async () => {
    setLlm('loading')
    try {
      const r = await api.screener.marketExplainer(true)
      setNarrative(r?.narrative || null)
      if (r?.drivers?.length) setDrivers(r.drivers)
    } catch { /* keep deterministic drivers */ }
    setLlm('done')
  }

  if (state === 'loading') return <div className="rounded-lg border border-line bg-wrap h-[140px] animate-pulse" />
  if (state === 'empty') return null

  return (
    <div className="rounded-lg border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Market Explainer
        </span>
        <button
          onClick={explain}
          disabled={llm === 'loading'}
          className="flex items-center gap-1 text-[11px] text-primary disabled:opacity-60"
        >
          {llm === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
          {llm === 'idle' ? 'Explain' : llm === 'loading' ? 'Thinking…' : 'Refresh'}
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {narrative && (
          <p className="text-[12.5px] leading-relaxed text-d-text-secondary">{narrative}</p>
        )}
        <ul className="space-y-1">
          {drivers.map((d, i) => (
            <li key={i} className="flex gap-2 text-[11.5px] text-d-text-secondary">
              <span className="text-primary mt-0.5">•</span>{d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
