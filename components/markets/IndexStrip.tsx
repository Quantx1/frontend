'use client'

/**
 * IndexStrip — the command-center index-ticker strip (the multi-widget
 * dashboard archetype, top-of-page row). A single horizontal, scrollable row of index chips
 * (NSE indices + optional global cues), each showing label · last · duotone
 * change %. Static and scannable (not a marquee — that's the landing surface).
 *
 * Shares the `public-indices` SWR key so it dedupes with any ticker/cards
 * mounted elsewhere. Global cues are passed in by the page (already fetched
 * via /api/market/global). Theme-aware, no hardcoded dark. Honest-empty:
 * placeholder chips until real quotes land.
 */

import useSWR from 'swr'
import { ArrowDown, ArrowUp } from '@/lib/icons'

import { api } from '@/lib/api'
import { MONO } from '@/lib/tokens'

interface Chip {
  key: string
  label: string
  last: number | null
  change_pct: number | null
  invert?: boolean // VIX: up = fear (red)
}

const fmt = (n?: number | null, d = 2) =>
  n == null || Number.isNaN(n) ? '—' : n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })

function QuoteChip({ c }: { c: Chip }) {
  const up = (c.change_pct ?? 0) > 0
  const down = (c.change_pct ?? 0) < 0
  const tone = c.invert
    ? up ? 'text-down' : down ? 'text-up' : 'text-d-text-muted'
    : up ? 'text-up' : down ? 'text-down' : 'text-d-text-muted'
  const Arrow = up ? ArrowUp : down ? ArrowDown : null
  return (
    <div className="tile-tint flex min-w-[124px] shrink-0 flex-col gap-0.5 px-4 py-2.5">
      <span className="truncate font-mono text-[9.5px] uppercase tracking-[0.12em] text-d-text-muted">{c.label}</span>
      <div className="flex items-baseline justify-between gap-1.5">
        <span className={`text-[13px] font-semibold leading-none text-d-text-primary ${MONO}`}>{fmt(c.last)}</span>
        {c.change_pct != null && (
          <span className={`inline-flex shrink-0 items-center gap-0.5 text-[11px] ${MONO} ${tone}`}>
            {Arrow && <Arrow className="h-2.5 w-2.5" />}
            {(c.change_pct >= 0 ? '+' : '') + c.change_pct.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  )
}

const PLACEHOLDER: Chip[] = [
  { key: 'nifty', label: 'NIFTY 50', last: null, change_pct: null },
  { key: 'banknifty', label: 'BANK NIFTY', last: null, change_pct: null },
  { key: 'sensex', label: 'SENSEX', last: null, change_pct: null },
  { key: 'vix', label: 'INDIA VIX', last: null, change_pct: null, invert: true },
]

export function IndexStrip({
  global = [],
  entitled = true,
}: {
  global?: { key: string; label: string; last: number | null; change_pct: number | null }[]
  // SEBI Path-A: raw NSE index quotes render only from the user's own licensed
  // broker feed (or a genuine NSE display licence). When false, render nothing —
  // the page shows the unified broker-connect gate card in this strip's place.
  entitled?: boolean
}) {
  const { data } = useSWR('public-indices', () => api.publicTrust.indices(), {
    refreshInterval: 30_000,
    dedupingInterval: 15_000,
    revalidateOnFocus: false,
  })
  const indices: Chip[] = (data?.indices ?? PLACEHOLDER).map((r: any) => ({
    key: r.key, label: r.label, last: r.last, change_pct: r.change_pct, invert: r.key === 'vix',
  }))
  const cues: Chip[] = global.map((g) => ({ key: `g-${g.key}`, label: g.label, last: g.last, change_pct: g.change_pct }))
  const all = [...indices, ...cues]

  if (!entitled) return null

  return (
    <div className="overflow-hidden rounded-[24px] bg-wrap p-2" aria-label="Index ticker">
      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {all.map((c) => <QuoteChip key={c.key} c={c} />)}
      </div>
    </div>
  )
}
