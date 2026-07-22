'use client'

/**
 * Relative Strength vs NIFTY — the FULL card (2026-07-21).
 *
 * True benchmark-relative return over 1m / 2.5m / 6m (positive =
 * outperforming), PLUS the classic RS ratio line (stock/NIFTY rebased to
 * 100 — rising means outperforming regardless of absolute direction) and
 * the current 20d-RS streak. Pure data, no LLM, cached server-side;
 * honest-empty note (never a silent hide) when history is too short.
 */

import { useEffect, useState } from 'react'
import { Activity } from '@/lib/icons'

import { api } from '@/lib/api'

interface Rs {
  benchmark: string; outperforming: boolean
  rs_20d: number | null; rs_50d: number | null; rs_120d: number | null
  ratio_line: number[]; streak_20d: number | null
}

const UP = 'var(--color-up)'
const DOWN = 'var(--color-down)'
const WINDOWS: Array<{ k: 'rs_20d' | 'rs_50d' | 'rs_120d'; label: string }> = [
  { k: 'rs_20d', label: '1M' },
  { k: 'rs_50d', label: '2.5M' },
  { k: 'rs_120d', label: '6M' },
]

/** Inline sparkline for the RS ratio line — tone follows end-vs-100. */
function RsSparkline({ points }: { points: number[] }) {
  if (points.length < 10) return null
  const w = 260
  const h = 44
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const step = w / (points.length - 1)
  const y = (v: number) => h - ((v - min) / span) * (h - 6) - 3
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const tone = points[points.length - 1] >= 100 ? UP : DOWN
  const y100 = y(Math.min(Math.max(100, min), max))
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-11 w-full" preserveAspectRatio="none" aria-hidden>
      <line x1="0" x2={w} y1={y100} y2={y100} stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3 3" />
      <path d={d} fill="none" stroke={tone} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

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

  if (state === 'loading') return <div className="rounded-[20px] border border-line bg-wrap h-[150px] animate-pulse" />
  if (state === 'empty' || !rs) {
    return (
      <div className="rounded-[20px] border border-line bg-wrap px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-d-text-primary">Relative Strength</span>
        </div>
        <p className="text-[11px] text-d-text-muted">
          Not enough shared history with NIFTY yet to compute relative strength for {symbol}.
        </p>
      </div>
    )
  }

  const streak = rs.streak_20d
  const ratioEnd = rs.ratio_line?.length ? rs.ratio_line[rs.ratio_line.length - 1] : null

  return (
    <div className="rounded-[20px] border border-line bg-wrap px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
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

      <div className="mb-2 grid grid-cols-3 gap-2">
        {WINDOWS.map(({ k, label }) => {
          const v = rs[k]
          // Signed bar from center — window RS clamped to ±8% for display.
          const mag = v == null ? 0 : Math.max(3, Math.min(50, (Math.abs(v) / 8) * 50))
          return (
            <div key={label} className="text-center">
              <div className="text-[9px] uppercase tracking-wider text-d-text-muted">{label}</div>
              <div
                className="numeric text-[14px] font-semibold"
                style={{ color: v == null ? 'var(--color-muted)' : v >= 0 ? UP : DOWN }}
              >
                {v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
              </div>
              {v != null && (
                <span className="relative mx-auto mt-1 block h-[3px] w-full max-w-[72px] rounded-full bg-d-border">
                  <span className="absolute inset-y-0 left-1/2 w-px bg-d-text-muted/40" />
                  <span
                    className="absolute inset-y-0 rounded-full"
                    style={{
                      background: v >= 0 ? UP : DOWN,
                      left: v >= 0 ? '50%' : `${50 - mag}%`,
                      width: `${mag}%`,
                    }}
                  />
                </span>
              )}
            </div>
          )
        })}
      </div>

      {rs.ratio_line?.length >= 10 && (
        <div className="text-d-text-muted">
          <RsSparkline points={rs.ratio_line} />
          <div className="mt-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider">
            <span>RS line · 6M · rebased 100</span>
            <span>
              now{' '}
              <span style={{ color: ratioEnd != null && ratioEnd >= 100 ? UP : DOWN }}>
                {ratioEnd != null ? ratioEnd.toFixed(1) : '—'}
              </span>
              {streak != null && streak !== 0 && (
                <span className="ml-2">
                  {Math.abs(streak)}d {streak > 0 ? 'outperf' : 'lagging'} streak
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
