'use client'

/**
 * Today's AI Picks — the REAL books on the stocks board (2026-07-21).
 *
 * Renders today's Alpha Picks + Momentum Picks (the two walk-forward-gated
 * books bridged into the signals table daily) instead of the old raw Alpha
 * ranker rows. Every tile is a live signal — rank, side, entry — and links
 * to its full signal page (levels, decay, Bull-vs-Bear pressure-test).
 * Shares the 'signals:today' SWR key with the signals hub. Honest: renders
 * nothing when no book is live.
 */

import Link from 'next/link'
import useSWR from 'swr'
import { ArrowRight, Sparkles } from '@/lib/icons'

import { api } from '@/lib/api'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import { MONO } from '@/lib/tokens'

interface PickTile {
  id: string
  symbol: string
  book: 'Alpha Picks' | 'Momentum Picks'
  rank: number
  direction: string
  entry: number | null
  confidence: number | null
}

const PER_BOOK = 6

export default function AiTopPicks({ limit = PER_BOOK }: { limit?: number }) {
  const { data, isLoading } = useSWR('signals:today', () => api.signals.getToday().catch(() => null), {
    revalidateOnFocus: false,
    refreshInterval: 60_000,
    dedupingInterval: 30_000,
  })

  const tiles: PickTile[] = []
  for (const s of (data?.all_signals ?? []) as any[]) {
    if (!s?.symbol || !['active', 'triggered'].includes(s?.status)) continue
    const book = String(s.signal_type || '').includes('momentum') ? 'Momentum Picks' as const : 'Alpha Picks' as const
    const rank = Number(String((s.reasons ?? [])[0] ?? '').match(/#(\d+)/)?.[1] ?? 99)
    tiles.push({
      id: s.id,
      symbol: String(s.symbol).replace('.NS', ''),
      book,
      rank,
      direction: s.direction ?? 'LONG',
      entry: s.entry_price != null ? Number(s.entry_price) : null,
      confidence: s.confidence != null ? Number(s.confidence) : null,
    })
  }
  const alpha = tiles.filter((t) => t.book === 'Alpha Picks').sort((a, b) => a.rank - b.rank).slice(0, limit)
  const momentum = tiles.filter((t) => t.book === 'Momentum Picks').sort((a, b) => a.rank - b.rank).slice(0, limit)

  if (!isLoading && !alpha.length && !momentum.length) return null // honest: no card when no book is live

  const Tile = ({ p }: { p: PickTile }) => (
    <Link
      key={p.id}
      href={`/signals/${p.id}`}
      className="group bg-wrap p-3 transition-colors hover:bg-surface-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-d-text-muted">#{p.rank}</span>
        <span className={`text-[10px] font-semibold ${p.direction === 'SHORT' ? 'text-down' : 'text-up'}`}>
          {p.direction}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <SymbolLogo symbol={p.symbol} size={24} />
        <span className="text-[13px] font-semibold text-d-text-primary transition-colors group-hover:text-primary">
          {p.symbol}
        </span>
      </div>
      <div className={`mt-1 text-[10px] text-d-text-muted ${MONO}`}>
        {p.entry != null ? `entry ₹${p.entry.toFixed(2)}` : ''}
        {p.confidence != null ? ` · ${Math.round(p.confidence)}%` : ''}
      </div>
    </Link>
  )

  const Book = ({ label, picks }: { label: string; picks: PickTile[] }) =>
    picks.length ? (
      <div>
        <div className="flex items-center justify-between border-b border-line px-4 py-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ai">{label}</span>
          <span className="text-[10px] text-d-text-muted">{picks.length} shown</span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-3 xl:grid-cols-6">
          {picks.map((p) => <Tile key={p.id} p={p} />)}
        </div>
      </div>
    ) : null

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-wrap">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-ai" />
          <span className="text-[12px] font-semibold text-d-text-primary">Today&rsquo;s AI Picks</span>
          <span className="text-[10px] text-d-text-muted">walk-forward-gated books · tap a pick for levels + pressure-test</span>
        </div>
        <Link
          href="/signals"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-d-text-primary underline-offset-4 hover:underline"
        >
          All signals <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-wrap p-3"><div className="h-3 w-16 rounded bg-white/5" /></div>
          ))}
        </div>
      ) : (
        <>
          <Book label="Alpha Picks" picks={alpha} />
          <Book label="Momentum Picks" picks={momentum} />
        </>
      )}
    </div>
  )
}
