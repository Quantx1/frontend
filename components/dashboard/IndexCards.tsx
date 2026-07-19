// ============================================================================
// IndexCards — NIFTY 50 / BANK NIFTY / SENSEX / INDIA VIX as discrete cards.
// ============================================================================
// Card variant of IndexTickerStrip, used under the Main Chat composer. Shares
// the same public SWR feed ('public-indices', /api/public/indices) so it
// dedupes with any ticker mounted elsewhere. Public endpoint → works pre-auth.
// Responsive: 2 columns on mobile, 4 from sm up.
// ============================================================================

'use client'

import useSWR from 'swr'
import { ArrowDown, ArrowUp } from '@/lib/icons'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

type IndexKey = 'nifty' | 'banknifty' | 'sensex' | 'vix'

interface IndexRow {
  key: IndexKey
  label: string
  last: number | null
  change: number | null
  change_pct: number | null
}

const FALLBACK: IndexRow[] = [
  { key: 'nifty', label: 'NIFTY 50', last: null, change: null, change_pct: null },
  { key: 'banknifty', label: 'BANK NIFTY', last: null, change: null, change_pct: null },
  { key: 'sensex', label: 'SENSEX', last: null, change: null, change_pct: null },
  { key: 'vix', label: 'INDIA VIX', last: null, change: null, change_pct: null },
]

function fmt(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(n)) return '--'
  return n.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function IndexCard({ row }: { row: IndexRow }) {
  const up = (row.change ?? 0) > 0
  const down = (row.change ?? 0) < 0
  const isVix = row.key === 'vix'
  // VIX inverts: rising VIX is fear (bad) → reads red; falling VIX is calm → green.
  const tone = isVix
    ? up ? 'text-down' : down ? 'text-up' : 'text-d-text-muted'
    : up ? 'text-up' : down ? 'text-down' : 'text-d-text-muted'
  const Arrow = up ? ArrowUp : down ? ArrowDown : null
  return (
    <div className="lg-surface rounded-xl px-3 py-2.5">
      <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">{row.label}</div>
      <div className="mt-1.5 flex items-baseline justify-between gap-1.5">
        <span className="numeric text-[15px] font-bold leading-none text-d-text-primary">{fmt(row.last)}</span>
        <span className={`numeric inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium ${tone}`}>
          {Arrow && <Arrow className="h-3 w-3" />}
          {fmt(row.change_pct, 2)}%
        </span>
      </div>
    </div>
  )
}

export default function IndexCards({ className }: { className?: string }) {
  const { data } = useSWR('public-indices', () => api.publicTrust.indices(), {
    refreshInterval: 30_000,
    dedupingInterval: 15_000,
    revalidateOnFocus: false,
  })
  const rows = data?.indices ?? FALLBACK
  return (
    <div className={cn('grid grid-cols-2 gap-2.5 sm:grid-cols-4', className)} aria-label="Market indices">
      {rows.map((row) => (
        <IndexCard key={row.key} row={row} />
      ))}
    </div>
  )
}
