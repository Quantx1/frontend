'use client'

/**
 * "Why is it moving?" — the flagship grounded agent on the stock page.
 *
 * USER-TRIGGERED (button), never on load, so it costs nothing until asked.
 * Shows deterministic drivers instantly (price / volume / OI build-up / RS vs
 * NIFTY / regime), then the grounded AI narrative (free-first model, cached per
 * symbol/day). Honest-empty when there are no drivers.
 */

import { useState } from 'react'
import { Sparkles, Loader2 } from '@/lib/icons'

import { api } from '@/lib/api'

interface Resp {
  drivers: string[]
  narrative: string | null
}

export default function WhyMovingCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<Resp | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'empty'>('idle')

  const ask = async () => {
    setState('loading')
    try {
      const r = await api.screener.whyMoving(symbol, true)
      if (r?.drivers?.length || r?.narrative) {
        setData({ drivers: r.drivers || [], narrative: r.narrative || null })
        setState('done')
      } else {
        setState('empty')
      }
    } catch {
      setState('empty')
    }
  }

  return (
    <div className="rounded-[20px] border border-line bg-wrap overflow-hidden">
      <button
        onClick={ask}
        disabled={state === 'loading'}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-2 transition-colors disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-d-text-primary">Why is {symbol.replace('.NS', '')} moving?</span>
        </span>
        {state === 'loading'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-d-text-muted" />
          : <span className="text-[11px] text-primary">{state === 'idle' ? 'Ask AI' : 'Refresh'}</span>}
      </button>

      {state === 'empty' && (
        <p className="px-4 pb-3 text-[11px] text-d-text-muted">No clear drivers in the data right now.</p>
      )}

      {state === 'done' && data && (
        <div className="px-4 pb-3 space-y-3">
          {data.narrative && (
            <p className="text-[12.5px] leading-relaxed text-d-text-secondary">{data.narrative}</p>
          )}
          {data.drivers.length > 0 && (
            <ul className="space-y-1">
              {data.drivers.map((d, i) => (
                <li key={i} className="flex gap-2 text-[11.5px] text-d-text-secondary">
                  <span className="text-primary mt-0.5">•</span>{d}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
