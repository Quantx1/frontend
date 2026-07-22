'use client'

/**
 * Live Alerts — the conditions firing right now across the universe (Volume 3×,
 * OI ±15%, 20-day-high breakout, IV-Rank ≥ 80). Deterministic feed, refreshed
 * on a light interval; honest-empty when nothing is firing.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Volume2, Layers, TrendingUp, Gauge } from '@/lib/icons'

import { api } from '@/lib/api'
import { stockHref } from '@/lib/stock-href'

interface Alert { symbol: string; type: string; severity: string; message: string }

const TYPE: Record<string, { icon: any; color: string }> = {
  volume: { icon: Volume2, color: 'var(--color-primary-text)' },
  oi: { icon: Layers, color: 'var(--color-ai)' },
  breakout: { icon: TrendingUp, color: 'var(--color-up)' },
  iv: { icon: Gauge, color: 'var(--color-warning)' },
}

export default function LiveAlertsCard() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const r = await api.screener.liveAlerts(40)
        if (cancelled) return
        if (r?.alerts?.length) { setAlerts(r.alerts); setState('ok') } else setState('empty')
      } catch { if (!cancelled) setState('empty') }
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  if (state === 'loading') return <div className="rounded-[20px] border border-line bg-wrap h-[120px] animate-pulse" />
  if (state === 'empty') return null

  return (
    <div className="rounded-[20px] border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <Bell className="w-3.5 h-3.5 text-primary" /> Live Alerts
        </span>
        <span className="text-[10px] text-d-text-muted">{alerts.length} firing</span>
      </div>
      <div className="max-h-[280px] overflow-y-auto divide-y divide-line">
        {alerts.map((a, i) => {
          const t = TYPE[a.type] || { icon: Bell, color: 'var(--color-muted)' }
          const Icon = t.icon
          return (
            <Link
              key={`${a.symbol}-${a.type}-${i}`}
              href={stockHref(a.symbol)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface-2 transition-colors"
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: t.color }} />
              <span className="text-[12px] font-medium text-d-text-primary w-24 truncate">{a.symbol.replace('.NS', '')}</span>
              <span className="text-[11px] text-d-text-secondary truncate">{a.message}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
