'use client'

/**
 * Sector Rotation (RRG) — leaders/laggards by relative strength + momentum vs
 * the market, over short (~5d) and long (~20d) windows. Real candle data (no
 * LLM by default); honest-empty when the candle history is too thin.
 */

import { useEffect, useState } from 'react'
import { RefreshCw } from '@/lib/icons'

import { api } from '@/lib/api'

interface Row {
  sector: string; count: number; rs_short: number; rs_long: number; quadrant: string
}

const QUAD: Record<string, { label: string; color: string }> = {
  leading: { label: 'Leading', color: '#05B878' },
  improving: { label: 'Improving', color: '#3B82F6' },
  weakening: { label: 'Weakening', color: '#FEB113' },
  lagging: { label: 'Lagging', color: '#FF5947' },
}

export default function SectorRotationCard() {
  const [rows, setRows] = useState<Row[]>([])
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.screener.sectorRotation(false)
        if (cancelled) return
        if (r?.sectors?.length) { setRows(r.sectors as Row[]); setState('ok') } else setState('empty')
      } catch { if (!cancelled) setState('empty') }
    })()
    return () => { cancelled = true }
  }, [])

  if (state === 'loading') return <div className="rounded-lg border border-line bg-wrap h-[160px] animate-pulse" />
  if (state === 'empty') return null

  return (
    <div className="rounded-lg border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <RefreshCw className="w-3.5 h-3.5 text-primary" /> Sector Rotation
        </span>
        <span className="text-[10px] text-d-text-muted">RS vs market · 5d / 20d</span>
      </div>
      <div className="divide-y divide-line">
        {rows.map((r) => {
          const q = QUAD[r.quadrant] || { label: r.quadrant, color: '#8b8f9a' }
          return (
            <div key={r.sector} className="flex items-center justify-between px-4 py-2">
              <div className="min-w-0">
                <div className="text-[12px] text-d-text-primary truncate">{r.sector}</div>
                <div className="text-[10px] text-d-text-muted">{r.count} names</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] numeric" style={{ color: r.rs_long >= 0 ? '#05B878' : '#FF5947' }}>
                  {r.rs_long >= 0 ? '+' : ''}{r.rs_long.toFixed(1)}
                </span>
                <span
                  className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ color: q.color, background: `${q.color}1A` }}
                >
                  {q.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
