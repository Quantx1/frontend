'use client'

/**
 * Relative Strength vs NIFTY — true benchmark-relative return over 1m / 2.5m /
 * 6m (positive = outperforming the index). Pure data (no LLM), cached server-
 * side; honest-empty when history is too short.
 */

import { useEffect, useState } from 'react'
import { Activity } from '@/lib/icons'

import { api } from '@/lib/api'

interface Rs {
  benchmark: string; outperforming: boolean
  rs_20d: number | null; rs_50d: number | null; rs_120d: number | null
}

const UP = '#05B878'
const DOWN = '#FF5947'
const WINDOWS: Array<{ k: keyof Rs; label: string }> = [
  { k: 'rs_20d', label: '1M' },
  { k: 'rs_50d', label: '2.5M' },
  { k: 'rs_120d', label: '6M' },
]

export default function RelativeStrengthCard({ symbol }: { symbol: string }) {
  const [rs, setRs] = useState<Rs | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.screener.relativeStrength(symbol)
        if (cancelled) return
        const any = r && (r.rs_20d != null || r.rs_50d != null || r.rs_120d != null)
        if (any) { setRs(r as Rs); setState('ok') } else { setState('empty') }
      } catch { if (!cancelled) setState('empty') }
    })()
    return () => { cancelled = true }
  }, [symbol])

  if (state === 'loading') return <div className="rounded-lg border border-line bg-wrap h-[72px] animate-pulse" />
  if (state === 'empty' || !rs) return null

  return (
    <div className="rounded-lg border border-line bg-wrap px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-d-text-primary">Relative Strength</span>
          <span className="text-[10px] text-d-text-muted">vs {rs.benchmark}</span>
        </div>
        <span
          className="text-[10px] font-medium uppercase tracking-wider"
          style={{ color: rs.outperforming ? UP : DOWN }}
        >
          {rs.outperforming ? 'Outperforming' : 'Lagging'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {WINDOWS.map(({ k, label }) => {
          const v = rs[k] as number | null
          return (
            <div key={label} className="text-center">
              <div className="text-[9px] uppercase tracking-wider text-d-text-muted">{label}</div>
              <div
                className="text-[14px] numeric font-semibold"
                style={{ color: v == null ? 'var(--d-text-muted,#8b8f9a)' : v >= 0 ? UP : DOWN }}
              >
                {v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
