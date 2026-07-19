'use client'

/**
 * Footprint / Cumulative Volume Delta — bar-level proxy (volume × close-location
 * value). Shows the CVD line + today's buy/sell pressure split. Honestly a
 * daily-bar approximation (not tick-level); honest-empty when data is thin.
 */

import { useEffect, useState } from 'react'
import { Activity } from '@/lib/icons'

import { api } from '@/lib/api'

interface FP {
  trend: string | null
  latest: { delta: number; cvd: number; buy_pct: number } | null
  cvd: Array<{ cvd: number }>
}

const UP = '#05B878'
const DOWN = '#FF5947'

export default function FootprintCard({ symbol }: { symbol: string }) {
  const [fp, setFp] = useState<FP | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.screener.footprint(symbol, 60)
        if (cancelled) return
        if (r?.latest && r.cvd?.length > 2) { setFp(r as FP); setState('ok') } else setState('empty')
      } catch { if (!cancelled) setState('empty') }
    })()
    return () => { cancelled = true }
  }, [symbol])

  if (state === 'loading') return <div className="rounded-lg border border-line bg-wrap h-[120px] animate-pulse" />
  if (state === 'empty' || !fp?.latest) return null

  const buy = fp.latest.buy_pct
  const line = fp.cvd.map((p) => p.cvd)

  return (
    <div className="rounded-lg border border-line bg-wrap px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <Activity className="w-3.5 h-3.5 text-primary" /> Cumulative Delta
          <span className="text-[9px] text-d-text-muted">(bar proxy)</span>
        </span>
        {fp.trend && (
          <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: fp.trend === 'rising' ? UP : DOWN }}>
            {fp.trend === 'rising' ? 'Accumulating' : 'Distributing'}
          </span>
        )}
      </div>

      <Sparkline values={line} />

      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span style={{ color: UP }}>Buy {buy.toFixed(0)}%</span>
          <span style={{ color: DOWN }}>{(100 - buy).toFixed(0)}% Sell</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden flex bg-surface-2">
          <div style={{ width: `${buy}%`, background: UP }} />
          <div style={{ width: `${100 - buy}%`, background: DOWN }} />
        </div>
      </div>
    </div>
  )
}

function Sparkline({ values }: { values: number[] }) {
  const w = 100, h = 30
  const min = Math.min(...values), max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`).join(' ')
  const rising = values[values.length - 1] >= values[0]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-8">
      <polyline points={pts} fill="none" stroke={rising ? UP : DOWN} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
