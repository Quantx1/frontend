'use client'

/**
 * Earnings preview — pre-event grounded agent on the stock page.
 *
 * USER-TRIGGERED (button), never on load — the facts hit yfinance + the
 * option chain. First click loads deterministic drivers (announce date /
 * implied move / IV rank / run-up / RS vs NIFTY); a secondary "Explain"
 * click fills the grounded AI narrative (cached per symbol/day).
 * Honest-empty when no confirmed earnings date exists in the next 60 days.
 */

import { useState } from 'react'
import { Calendar, Loader2 } from '@/lib/icons'

import { api } from '@/lib/api'

interface Resp {
  drivers: string[]
  narrative: string | null
}

export default function EarningsPreviewCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<Resp | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'empty'>('idle')
  const [explaining, setExplaining] = useState(false)

  const ask = async () => {
    setState('loading')
    try {
      const r = await api.screener.earningsPreview(symbol, false)
      if (r?.drivers?.length) {
        setData({ drivers: r.drivers || [], narrative: r.narrative || null })
        setState('done')
      } else {
        setState('empty')
      }
    } catch {
      setState('empty')
    }
  }

  const explain = async () => {
    setExplaining(true)
    try {
      const r = await api.screener.earningsPreview(symbol, true)
      setData({ drivers: r.drivers || [], narrative: r.narrative || null })
    } catch {
      // keep the deterministic drivers; the narrative stays empty
    } finally {
      setExplaining(false)
    }
  }

  return (
    <div className="rounded-lg border border-line bg-wrap overflow-hidden">
      <button
        onClick={ask}
        disabled={state === 'loading'}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-2 transition-colors disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-d-text-primary">Earnings preview</span>
        </span>
        {state === 'loading'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-d-text-muted" />
          : <span className="text-[11px] text-primary">{state === 'idle' ? 'Ask AI' : 'Refresh'}</span>}
      </button>

      {state === 'empty' && (
        <p className="px-4 pb-3 text-[11px] text-d-text-muted">No confirmed earnings date in the next 60 days.</p>
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
          {!data.narrative && (
            <button
              onClick={explain}
              disabled={explaining}
              className="flex items-center gap-1.5 text-[11px] text-primary hover:underline disabled:opacity-60"
            >
              {explaining && <Loader2 className="w-3 h-3 animate-spin" />}
              Explain
            </button>
          )}
        </div>
      )}
    </div>
  )
}
