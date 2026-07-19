'use client'

/**
 * MoversColumns — a "Gainer / Loser / Active" market-movers grid (the
 * market-movers archetype), mapped to OUR data and re-skinned to v2 tokens.
 *
 * Takes a flat list of movers (symbol · changePct · optional sub/value) and
 * splits it into top gainers and top losers, each in a hairline `bg-wrap`
 * column with a mono-caps title and duotone (green/red) percentages. The
 * optional third column ("Most active", sorted by |change| or volume) shows
 * only when activity data is provided. Honest-empty when nothing is moving.
 *
 * Theme-aware, no hardcoded dark. Rows link to the per-stock terminal.
 */

import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, Activity } from '@/lib/icons'

import { MONO } from '@/lib/tokens'
import { EyebrowMono } from '@/components/foundation'
import { SymbolLogo } from '@/components/ui/BrandLogo'

export interface Mover {
  symbol: string
  changePct: number | null
  sub?: string // sector / driver / headline
  value?: string // price or vol, pre-formatted
}

const pct = (n?: number | null, d = 2) =>
  n == null || Number.isNaN(n) ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(d)}%`

function Column({
  title,
  icon,
  tone,
  rows,
  emptyHint,
}: {
  title: string
  icon: React.ReactNode
  tone: 'up' | 'down' | 'muted'
  rows: Mover[]
  emptyHint: string
}) {
  const toneCls = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-d-text-secondary'
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-wrap">
      <header className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
        <span className={toneCls} aria-hidden>{icon}</span>
        <EyebrowMono className="text-[10.5px] tracking-[0.12em]">{title}</EyebrowMono>
      </header>
      {rows.length === 0 ? (
        <div className="px-3.5 py-8 text-center text-[11.5px] text-d-text-muted">{emptyHint}</div>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((m) => {
            const up = (m.changePct ?? 0) >= 0
            return (
              <li key={m.symbol}>
                <Link
                  href={`/stock/${m.symbol}`}
                  className="flex items-center justify-between gap-2 px-3.5 py-2.5 transition-colors hover:bg-wrap-hover"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <SymbolLogo symbol={m.symbol} size={26} />
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-d-text-primary">{m.symbol}</p>
                      {m.sub && <p className="truncate text-[10.5px] text-d-text-muted">{m.sub}</p>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-[12px] font-semibold ${MONO} ${up ? 'text-up' : 'text-down'}`}>{pct(m.changePct, 2)}</p>
                    {m.value && <p className={`text-[10.5px] text-d-text-muted ${MONO}`}>{m.value}</p>}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function MoversColumns({
  movers,
  active,
  limit = 7,
}: {
  movers: Mover[]
  active?: Mover[]
  limit?: number
}) {
  const withPct = movers.filter((m) => m.changePct != null && !Number.isNaN(m.changePct))
  const gainers = withPct.filter((m) => (m.changePct as number) > 0).sort((a, b) => (b.changePct as number) - (a.changePct as number)).slice(0, limit)
  const losers = withPct.filter((m) => (m.changePct as number) < 0).sort((a, b) => (a.changePct as number) - (b.changePct as number)).slice(0, limit)
  const activeRows = (active ?? withPct.slice().sort((a, b) => Math.abs(b.changePct as number) - Math.abs(a.changePct as number))).slice(0, limit)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Column title="Top gainers" icon={<ArrowUpRight className="h-3.5 w-3.5" />} tone="up" rows={gainers} emptyHint="No advancers yet." />
      <Column title="Top losers" icon={<ArrowDownRight className="h-3.5 w-3.5" />} tone="down" rows={losers} emptyHint="No decliners yet." />
      <Column title="Most active" icon={<Activity className="h-3.5 w-3.5" />} tone="muted" rows={activeRows} emptyHint="Movers appear when the market is live." />
    </div>
  )
}
