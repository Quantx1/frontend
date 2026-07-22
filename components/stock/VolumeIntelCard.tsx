'use client'

/**
 * Volume Intelligence — spike (× avg) + percentile + delivery trend + a signal
 * (accumulation / churn / high-activity / quiet). Pure data (no LLM by
 * default); honest-empty note when history is too thin.
 *
 * 2026-07-21: full visual upgrade — 20-session volume bars vs the average
 * line, the CVD proxy as a mini line chart (absorbed from the retired
 * FootprintCard; bar-level proxy, honestly labelled), and a percentile
 * meter. One volume card, all the volume evidence.
 */

import { useEffect, useState } from 'react'
import { BarChart3 } from '@/lib/icons'

import { api } from '@/lib/api'

interface Intel {
  signal: string
  x_avg: number | null; vol_percentile: number | null
  delivery_today: number | null; delivery_trend: number | null
  avg_volume_20d?: number | null
  series?: number[]
  drivers: string[]
}

interface Cvd {
  trend: string | null
  buy_pct: number | null
  series: number[]
}

const UP = 'var(--color-up)'
const DOWN = 'var(--color-down)'
const PRIMARY = 'var(--color-primary)'

const SIGNAL: Record<string, { label: string; color: string }> = {
  accumulation: { label: 'Accumulation', color: 'var(--color-up)' },
  high_activity: { label: 'High activity', color: 'var(--color-primary-text)' },
  churn: { label: 'Churn', color: 'var(--color-warning)' },
  quiet: { label: 'Quiet', color: 'var(--color-muted)' },
  normal: { label: 'Normal', color: 'var(--color-muted)' },
}

/** 20-session volume bars with the 20d-average as a dashed line. */
function VolBars({ series, avg }: { series: number[]; avg: number | null }) {
  if (series.length < 5) return null
  const max = Math.max(...series, avg ?? 0) || 1
  const avgY = avg != null ? (1 - avg / max) * 100 : null
  return (
    <div className="relative mt-1 flex h-12 items-end gap-[2px]">
      {avgY != null && (
        <span
          className="absolute inset-x-0 border-t border-dashed border-d-text-muted/40"
          style={{ top: `${avgY}%` }}
        />
      )}
      {series.map((v, i) => {
        const isToday = i === series.length - 1
        const aboveAvg = avg != null && v > avg
        return (
          <span
            key={i}
            className="flex-1 rounded-[1px]"
            style={{
              height: `${Math.max(4, (v / max) * 100)}%`,
              background: isToday ? PRIMARY : aboveAvg ? 'color-mix(in srgb, var(--color-primary) 55%, transparent)' : 'var(--color-border)',
            }}
          />
        )
      })}
    </div>
  )
}

/** CVD proxy mini line — cumulative buy/sell pressure over ~60 sessions. */
function CvdLine({ series, trend }: { series: number[]; trend: string | null }) {
  if (series.length < 10) return null
  const w = 220
  const h = 30
  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  const step = w / (series.length - 1)
  const d = series
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - ((v - min) / span) * (h - 4) - 2).toFixed(1)}`)
    .join(' ')
  const tone = trend === 'rising' ? UP : trend === 'falling' ? DOWN : 'var(--color-muted)'
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[30px] w-full" preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={tone} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default function VolumeIntelCard({ symbol }: { symbol: string }) {
  const [v, setV] = useState<Intel | null>(null)
  const [cvd, setCvd] = useState<Cvd | null>(null)
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
    // CVD (ex-FootprintCard) — best-effort, hides on thin data.
    ;(async () => {
      try {
        const f = await api.screener.footprint(symbol, 60)
        if (cancelled) return
        const latest = (f as any)?.latest
        const series = ((f as any)?.cvd || []).map((p: any) => Number(p?.cvd ?? p)).filter((n: number) => Number.isFinite(n))
        if (latest && (f as any)?.trend) {
          setCvd({ trend: (f as any).trend, buy_pct: latest.buy_pct ?? null, series })
        }
      } catch { /* honest-hide */ }
    })()
    return () => { cancelled = true }
  }, [symbol])

  if (state === 'loading') return <div className="rounded-[20px] border border-line bg-wrap h-[180px] animate-pulse" />
  if (state === 'empty' || !v) {
    return (
      <div className="rounded-[20px] border border-line bg-wrap px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-d-text-primary">Volume Intelligence</span>
        </div>
        <p className="text-[11px] text-d-text-muted">
          Not enough volume history for {symbol} yet — the spike / delivery read needs ~20 sessions.
        </p>
      </div>
    )
  }

  const sig = SIGNAL[v.signal] || SIGNAL.normal
  return (
    <div className="rounded-[20px] border border-line bg-wrap px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <BarChart3 className="h-3.5 w-3.5 text-primary" /> Volume Intelligence
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
          style={{ color: sig.color, background: `color-mix(in srgb, ${sig.color} 10%, transparent)` }}
        >
          {sig.label}
        </span>
      </div>

      {/* 20-session volume bars vs avg */}
      {v.series && v.series.length >= 5 && (
        <>
          <VolBars series={v.series} avg={v.avg_volume_20d ?? null} />
          <div className="mb-2 mt-0.5 flex justify-between font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
            <span>20 sessions</span>
            <span>dashed = 20d avg · today highlighted</span>
          </div>
        </>
      )}

      <div className="mb-2 grid grid-cols-3 gap-2">
        <Stat label="vs 20d avg" value={v.x_avg != null ? `${v.x_avg}×` : '—'} />
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-wider text-d-text-muted">percentile</div>
          <div className="numeric text-[14px] font-semibold text-d-text-primary">
            {v.vol_percentile != null ? `${v.vol_percentile}th` : '—'}
          </div>
          {v.vol_percentile != null && (
            <div className="mx-auto mt-1 h-[3px] w-full max-w-[64px] overflow-hidden rounded-full bg-d-border">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, v.vol_percentile)}%` }} />
            </div>
          )}
        </div>
        <Stat
          label="delivery"
          value={v.delivery_today != null ? `${v.delivery_today}%` : '—'}
          sub={v.delivery_trend != null ? `${v.delivery_trend >= 0 ? '+' : ''}${v.delivery_trend}pp vs avg` : undefined}
          subClass={v.delivery_trend != null ? (v.delivery_trend >= 0 ? 'text-up' : 'text-down') : undefined}
        />
      </div>

      {v.drivers?.length > 0 && (
        <p className="text-[11px] leading-relaxed text-d-text-muted">{v.drivers[v.drivers.length - 1]}</p>
      )}

      {cvd && (
        <div className="mt-2 border-t border-line pt-2">
          <div className="mb-0.5 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-d-text-muted">
              CVD 60d · bar proxy
            </span>
            <span className="numeric text-[11px] font-medium">
              <span className={cvd.trend === 'rising' ? 'text-up' : cvd.trend === 'falling' ? 'text-down' : 'text-d-text-primary'}>
                {cvd.trend}
              </span>
              {cvd.buy_pct != null && (
                <span className="ml-2 text-d-text-secondary">today {cvd.buy_pct}% buy-side</span>
              )}
            </span>
          </div>
          <CvdLine series={cvd.series} trend={cvd.trend} />
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, sub, subClass }: { label: string; value: string; sub?: string; subClass?: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-wider text-d-text-muted">{label}</div>
      <div className="numeric text-[14px] font-semibold text-d-text-primary">{value}</div>
      {sub && <div className={`numeric text-[9px] ${subClass ?? ''}`}>{sub}</div>}
    </div>
  )
}
