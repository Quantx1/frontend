'use client'

/**
 * Market Breadth — true advance/decline issue counts today + the cumulative
 * A/D line (slope = participation). Real per-day counts over the universe.
 */

import useSWR from 'swr'
import { Scale } from '@/lib/icons'

import { api } from '@/lib/api'

interface Breadth {
  today: { adv: number; dec: number; net: number } | null
  ratio: number | null
  ad_line: Array<{ ad_line: number }>
}

const UP = 'var(--color-up)'
const DOWN = 'var(--color-down)'

export default function BreadthCard() {
  // SWR with retry + keep-last-good — the old one-shot useEffect fetch left a
  // permanent hole on a single transient error.
  const { data, isLoading } = useSWR<Breadth | null>(
    'mkt-breadth',
    () => api.screener.breadth(90).then((r) => (r?.today ? (r as Breadth) : null)).catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 120_000, keepPreviousData: true, errorRetryCount: 4 },
  )
  const b = data

  if (isLoading && !b) return <div className="rounded-[20px] bg-wrap h-[120px] animate-pulse" />
  if (!b?.today) return null

  const { adv, dec } = b.today
  const tot = adv + dec || 1
  const advPct = Math.round((adv / tot) * 100)
  const line = b.ad_line.map((p) => p.ad_line)

  return (
    <div className="flex h-full flex-col rounded-[20px] bg-wrap px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <Scale className="w-3.5 h-3.5 text-primary" /> Market Breadth
        </span>
        <span className="text-[10px] text-d-text-muted">A/D ratio {b.ratio != null ? b.ratio.toFixed(2) : '—'}</span>
      </div>

      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="numeric font-medium" style={{ color: UP }}>{adv} adv</span>
        <span className="numeric font-medium" style={{ color: DOWN }}>{dec} dec</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden flex bg-surface-2 mb-3">
        <div style={{ width: `${advPct}%`, background: UP }} />
        <div style={{ width: `${100 - advPct}%`, background: DOWN }} />
      </div>

      <div className="mt-auto">
      {line.length > 2 && <AdSparkline values={line} />}
      <p className="mt-1 text-[9px] uppercase tracking-wider text-d-text-muted">Cumulative A/D line</p>
      </div>
    </div>
  )
}

function AdSparkline({ values }: { values: number[] }) {
  const w = 100
  const h = 28
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / span) * h
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const rising = values[values.length - 1] >= values[0]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-7">
      <polyline points={pts} fill="none" stroke={rising ? UP : DOWN} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
