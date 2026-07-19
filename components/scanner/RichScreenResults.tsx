'use client'

/**
 * RichScreenResults — the generated-UI results block for a screen run.
 *
 * Reads the live design-system CSS variables (never the stale tokens.ts
 * mirror) so the chart matches whatever theme is active. Composition, per
 * the dataviz method:
 *   - Stat tiles for the headline numbers (count / avg change / breadth / top sector)
 *   - A single-hue horizontal bar chart of matches-by-sector (magnitude across
 *     categories → sorted bars, direct value labels, recessive axis, no legend)
 *   - A sortable data table with per-row hover
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  Tooltip,
} from 'recharts'
import { ArrowUp, ArrowDown } from '@/lib/icons'

import { MONO } from '@/lib/tokens'

export interface ScreenMatch {
  symbol: string
  name?: string
  sector?: string | null
  last_price: number
  change_pct: number
  rsi: number
  hit_count?: number
}

type SortKey = 'change_pct' | 'last_price' | 'rsi' | 'symbol'

function readVars() {
  const s = getComputedStyle(document.documentElement)
  const g = (n: string, fb: string) => s.getPropertyValue(n).trim() || fb
  return {
    primary: g('--color-primary', '#3FB950'),
    up: g('--color-up', '#3FB950'),
    down: g('--color-down', '#F85149'),
    line: g('--color-line', '#242830'),
    muted: g('--color-d-text-muted', '#8A8F9C'),
  }
}

export function RichScreenResults({ rows }: { rows: ScreenMatch[] }) {
  const [c, setC] = useState({ primary: '#3FB950', up: '#3FB950', down: '#F85149', line: '#242830', muted: '#8A8F9C' })
  useEffect(() => { setC(readVars()) }, [])

  const [sortKey, setSortKey] = useState<SortKey>('change_pct')
  const [asc, setAsc] = useState(false)

  const stats = useMemo(() => {
    const n = rows.length
    const avg = n ? rows.reduce((s, r) => s + (r.change_pct ?? 0), 0) / n : 0
    const adv = rows.filter((r) => (r.change_pct ?? 0) > 0).length
    const bySector = new Map<string, number>()
    for (const r of rows) {
      const k = r.sector || '—'
      bySector.set(k, (bySector.get(k) ?? 0) + 1)
    }
    const sectors = Array.from(bySector.entries())
      .filter(([k]) => k !== '—')
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count)
    // Top movers by absolute change — always available, unlike sector.
    const movers = [...rows]
      .sort((a, b) => Math.abs(b.change_pct ?? 0) - Math.abs(a.change_pct ?? 0))
      .slice(0, 8)
      .map((r) => ({ symbol: r.symbol, change: Number((r.change_pct ?? 0).toFixed(2)) }))
      .sort((a, b) => b.change - a.change)
    return { n, avg, adv, dec: n - adv, topSector: sectors[0]?.sector ?? '—', sectors: sectors.slice(0, 8), movers }
  }, [rows])

  const sorted = useMemo(() => {
    const arr = [...rows]
    arr.sort((a, b) => {
      const av = a[sortKey] as number | string
      const bv = b[sortKey] as number | string
      const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv)) : (av as number) - (bv as number)
      return asc ? cmp : -cmp
    })
    return arr
  }, [rows, sortKey, asc])

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setAsc((v) => !v)
    else {
      setSortKey(k)
      setAsc(k === 'symbol')
    }
  }

  return (
    <div className="space-y-4 p-4">
      {/* Stat tiles — the headline numbers */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="Matches" value={String(stats.n)} />
        <Tile label="Avg change" value={`${stats.avg >= 0 ? '+' : ''}${stats.avg.toFixed(2)}%`} tone={stats.avg >= 0 ? 'up' : 'down'} />
        <Tile label="Breadth" value={`${stats.adv}▲ ${stats.dec}▼`} />
        <Tile label="Top sector" value={stats.topSector} small />
      </div>

      {/* A chart: matches-by-sector when we have sectors (single-hue magnitude),
          else top movers (diverging around a zero baseline, duotone). */}
      {stats.sectors.length > 1 ? (
        <div className="rounded-lg border border-line bg-wrap p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-d-text-muted">Matches by sector</p>
          <ResponsiveContainer width="100%" height={Math.max(120, stats.sectors.length * 26)}>
            <BarChart data={stats.sectors} layout="vertical" margin={{ top: 2, right: 28, bottom: 2, left: 2 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="sector" width={96} tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: c.line, opacity: 0.4 }}
                contentStyle={{ background: 'var(--color-wrap)', border: `1px solid ${c.line}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: c.muted }}
                formatter={(v: number) => [`${v} names`, 'Matches']}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={false}>
                {stats.sectors.map((_, i) => <Cell key={i} fill={c.up} />)}
                <LabelList dataKey="count" position="right" style={{ fill: c.muted, fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : stats.movers.length > 1 ? (
        <div className="rounded-lg border border-line bg-wrap p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-d-text-muted">Top movers · change %</p>
          <ResponsiveContainer width="100%" height={Math.max(120, stats.movers.length * 26)}>
            <BarChart data={stats.movers} layout="vertical" margin={{ top: 2, right: 34, bottom: 2, left: 2 }}>
              <XAxis type="number" hide domain={['dataMin', 'dataMax']} />
              <YAxis type="category" dataKey="symbol" width={92} tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: c.line, opacity: 0.4 }}
                contentStyle={{ background: 'var(--color-wrap)', border: `1px solid ${c.line}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: c.muted }}
                formatter={(v: number) => [`${v >= 0 ? '+' : ''}${v}%`, 'Change']}
              />
              {/* No per-bar labels — every-point labels collide/clip; the
                  tooltip and the table below carry the exact numbers. */}
              <Bar dataKey="change" radius={2} barSize={14} isAnimationActive={false}>
                {stats.movers.map((m, i) => <Cell key={i} fill={m.change >= 0 ? c.up : c.down} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* Sortable data table */}
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wide text-d-text-muted">
              <Th label="Symbol" k="symbol" sortKey={sortKey} asc={asc} onSort={toggleSort} align="left" />
              <Th label="LTP" k="last_price" sortKey={sortKey} asc={asc} onSort={toggleSort} align="right" />
              <Th label="Change" k="change_pct" sortKey={sortKey} asc={asc} onSort={toggleSort} align="right" />
              <Th label="RSI" k="rsi" sortKey={sortKey} asc={asc} onSort={toggleSort} align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((m) => {
              const up = (m.change_pct ?? 0) >= 0
              return (
                <tr key={m.symbol} className="hover:bg-hover">
                  <td className="px-4 py-2.5">
                    <Link href={`/stock/${m.symbol}`} className="block">
                      <span className="font-semibold text-d-text-primary">{m.symbol}</span>
                      {m.sector ? <span className="ml-2 text-[11px] text-d-text-muted">{m.sector}</span> : null}
                    </Link>
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular-nums text-d-text-secondary ${MONO}`}>
                    ₹{Math.round(m.last_price ?? 0).toLocaleString('en-IN')}
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular-nums ${MONO} ${up ? 'text-up' : 'text-down'}`}>
                    <span className="inline-flex items-center justify-end gap-0.5">
                      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {Math.abs(m.change_pct ?? 0).toFixed(2)}%
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular-nums text-d-text-secondary ${MONO}`}>
                    {Math.round(m.rsi ?? 0)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Tile({ label, value, tone, small }: { label: string; value: string; tone?: 'up' | 'down'; small?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-wrap p-3">
      <p className="text-[9px] font-medium uppercase tracking-wider text-d-text-muted">{label}</p>
      <p
        className={`mt-0.5 ${small ? 'text-[13px]' : 'text-[18px]'} font-semibold tabular-nums ${MONO} ${
          tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-d-text-primary'
        } truncate`}
      >
        {value}
      </p>
    </div>
  )
}

function Th({
  label,
  k,
  sortKey,
  asc,
  onSort,
  align,
}: {
  label: string
  k: SortKey
  sortKey: SortKey
  asc: boolean
  onSort: (k: SortKey) => void
  align: 'left' | 'right'
}) {
  const active = sortKey === k
  return (
    <th className={`px-4 py-2 font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-0.5 hover:text-d-text-secondary ${active ? 'text-d-text-secondary' : ''}`}
      >
        {label}
        {active ? (asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : null}
      </button>
    </th>
  )
}
