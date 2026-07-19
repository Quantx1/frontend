'use client'

/**
 * Volume Intelligence — spike (× avg) + percentile + delivery trend + a signal
 * (accumulation / churn / high-activity / quiet). Pure data (no LLM by
 * default); honest-empty when history is too thin.
 */

import { useEffect, useState } from 'react'
import { BarChart3 } from '@/lib/icons'

import { api } from '@/lib/api'

interface Intel {
  signal: string
  x_avg: number | null; vol_percentile: number | null
  delivery_today: number | null; delivery_trend: number | null
  drivers: string[]
}

const SIGNAL: Record<string, { label: string; color: string }> = {
  accumulation: { label: 'Accumulation', color: '#05B878' },
  high_activity: { label: 'High activity', color: '#3B82F6' },
  churn: { label: 'Churn', color: '#FEB113' },
  quiet: { label: 'Quiet', color: '#8b8f9a' },
  normal: { label: 'Normal', color: '#8b8f9a' },
}

export default function VolumeIntelCard({ symbol }: { symbol: string }) {
  const [v, setV] = useState<Intel | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.screener.volumeIntel(symbol, false)
        if (cancelled) return
        if (r && r.x_avg != null) { setV(r as Intel); setState('ok') } else setState('empty')
      } catch { if (!cancelled) setState('empty') }
    })()
    return () => { cancelled = true }
  }, [symbol])

  if (state === 'loading') return <div className="rounded-lg border border-line bg-wrap h-[96px] animate-pulse" />
  if (state === 'empty' || !v) return null

  const sig = SIGNAL[v.signal] || SIGNAL.normal
  return (
    <div className="rounded-lg border border-line bg-wrap px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <BarChart3 className="w-3.5 h-3.5 text-primary" /> Volume Intelligence
        </span>
        <span
          className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ color: sig.color, background: `${sig.color}1A` }}
        >
          {sig.label}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <Stat label="vs 20d avg" value={v.x_avg != null ? `${v.x_avg}×` : '—'} />
        <Stat label="percentile" value={v.vol_percentile != null ? `${v.vol_percentile}th` : '—'} />
        <Stat
          label="delivery"
          value={v.delivery_today != null ? `${v.delivery_today}%` : '—'}
          sub={v.delivery_trend != null ? `${v.delivery_trend >= 0 ? '+' : ''}${v.delivery_trend}pp` : undefined}
          subClass={v.delivery_trend != null ? (v.delivery_trend >= 0 ? 'text-up' : 'text-down') : undefined}
        />
      </div>
      {v.drivers?.length > 0 && (
        <p className="text-[11px] text-d-text-muted leading-relaxed">{v.drivers[v.drivers.length - 1]}</p>
      )}
    </div>
  )
}

function Stat({ label, value, sub, subClass }: { label: string; value: string; sub?: string; subClass?: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-wider text-d-text-muted">{label}</div>
      <div className="text-[14px] numeric font-semibold text-d-text-primary">{value}</div>
      {sub && <div className={`text-[9px] numeric ${subClass ?? ''}`}>{sub}</div>}
    </div>
  )
}
