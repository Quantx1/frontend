'use client'

/**
 * ChatArtifacts — GenUI artifact cards for the copilot (2026-07-11).
 *
 * Shared by the Main Chat page, the dynamic-home inline answer, AND the
 * Copilot dock so rich outputs (price sparkline, regime bars, stat pills,
 * screener result tables, option-chain reads) render identically everywhere —
 * "one brain, three surfaces". Every value is sourced from real tool data
 * (no synthetic values); an optional `cta` renders a deep-link handoff chip
 * (the uTrade "Open full screener →" pattern).
 *
 * xAI skin: hairline charcoal (bg-wrap / border-line / rounded-sm), mono
 * labels, DUOTONE (text-up / text-down) on numbers only.
 */

import Link from 'next/link'
import {
  Area, AreaChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ArrowRight } from '@/lib/icons'

import { BlurFade } from '@/components/ui/blur-fade'
import { EyebrowMono, Sparkline } from '@/components/foundation'
import { MONO } from '@/lib/tokens'
import type { CopilotArtifact, ArtifactCta, ArtifactTone } from '@/lib/api'

const artTone = (tone?: ArtifactTone) =>
  tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-d-text-primary'
const artBarBg = (tone?: ArtifactTone) =>
  tone === 'up' ? 'var(--color-up)' : tone === 'down' ? 'var(--color-down)' : 'rgb(255 255 255 / 0.55)'

// One matching icon per artifact type — a consistent visual identity in the card
// title so a table, chart, strategy or payoff is recognisable at a glance.
const TYPE_ICON: Record<string, string> = {
  sparkline: '📈',
  linechart: '📈',
  bars: '📊',
  table: '📋',
  gauge: '🎛️',
  payoff: '🧮',
  strategy: '🧠',
  stat: '💹',
}
const tIcon = (a: CopilotArtifact): string => TYPE_ICON[a.type] ?? '📊'

// Deep-link action chip under an artifact — the uTrade "Open full screener →"
// handoff. Renders nothing when the artifact carries no cta.
function ArtifactCtaChip({ cta }: { cta?: ArtifactCta }) {
  if (!cta) return null
  return (
    <div className="border-t border-line px-3 py-2">
      <Link
        href={cta.href}
        className="inline-flex items-center gap-1 rounded-pill glass-control px-2.5 py-1 text-[11px] text-d-text-secondary transition-colors hover:text-d-text-primary"
      >
        {cta.label}
        <ArrowRight size={11} />
      </Link>
    </div>
  )
}

export function ArtifactCard({ a }: { a: CopilotArtifact }) {
  if (a.type === 'sparkline') {
    const up = (a.changePct ?? 0) >= 0
    return (
      <div className="rounded-sm border border-line bg-wrap p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[12px] font-normal text-d-text-primary">{tIcon(a)} {a.title}</span>
          {a.changePct != null && (
            <span className={`shrink-0 text-[11px] ${MONO} ${up ? 'text-up' : 'text-down'}`}>
              {up ? '+' : ''}{a.changePct.toFixed(1)}%
            </span>
          )}
        </div>
        {a.subtitle && <div className="text-[10px] text-d-text-muted">{a.subtitle}</div>}
        <div className="mt-2">
          <Sparkline data={a.series} width={300} height={44} filled strokeWidth={1.75} tone={up ? 'up' : 'down'} className="w-full" ariaLabel={`${a.title} price`} />
        </div>
        {a.last != null && (
          <div className={`mt-1 text-[13px] ${MONO} text-d-text-primary`}>
            ₹{a.last.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        )}
        <ArtifactCtaChip cta={a.cta} />
      </div>
    )
  }
  if (a.type === 'linechart') {
    const up = (a.changePct ?? 0) >= 0
    const stroke = up ? 'var(--color-up)' : 'var(--color-down)'
    const data = a.series.map((v, i) => ({ i, v }))
    const lo = Math.min(...a.series)
    const hi = Math.max(...a.series)
    const pad = (hi - lo) * 0.08 || 1
    const gid = `lg-${a.title}-${up ? 'u' : 'd'}`
    return (
      <div className="rounded-sm border border-line bg-wrap p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[12px] font-normal text-d-text-primary">{tIcon(a)} {a.title}</span>
          {a.changePct != null && (
            <span className={`shrink-0 text-[11px] ${MONO} ${up ? 'text-up' : 'text-down'}`}>
              {up ? '▲ +' : '▼ '}{Math.abs(a.changePct).toFixed(1)}%
            </span>
          )}
        </div>
        {a.subtitle && <div className="text-[10px] text-d-text-muted">{a.subtitle}</div>}
        <div className="mt-2 h-[132px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="i" hide />
              <YAxis
                domain={[lo - pad, hi + pad]}
                width={44}
                tick={{ fill: 'var(--color-muted)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${a.yLabel ?? ''}${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0)}`}
              />
              <Tooltip
                cursor={{ stroke: 'var(--color-line)', strokeWidth: 1 }}
                contentStyle={{
                  background: 'var(--color-wrap)', border: '1px solid var(--color-line)',
                  borderRadius: 6, fontSize: 11, padding: '4px 8px',
                }}
                labelFormatter={() => ''}
                formatter={(v: number | string) => [`${a.yLabel ?? ''}${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, '']}
              />
              <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.75} fill={`url(#${gid})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {a.last != null && (
          <div className={`mt-1 text-[13px] ${MONO} text-d-text-primary`}>
            {a.yLabel ?? ''}{a.last.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        )}
        <ArtifactCtaChip cta={a.cta} />
      </div>
    )
  }
  if (a.type === 'bars') {
    return (
      <div className="rounded-sm border border-line bg-wrap p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[12px] font-normal text-d-text-primary">{tIcon(a)} {a.title}</span>
          {a.subtitle && <span className="shrink-0 text-[10px] text-d-text-secondary">{a.subtitle}</span>}
        </div>
        <div className="mt-2 space-y-1.5">
          {a.items.map((it) => (
            <div key={it.label} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-[11px] text-d-text-secondary">{it.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-pill bg-wrap-hover">
                <div className="h-full rounded-pill" style={{ width: `${Math.max(0, Math.min(100, it.value))}%`, background: artBarBg(it.tone) }} />
              </div>
              <span className={`w-12 shrink-0 text-right text-[11px] tabular-nums ${MONO} ${artTone(it.tone)}`}>{it.value}{a.unit ?? ''}</span>
            </div>
          ))}
        </div>
        {a.caption && <div className={`mt-2 text-[10px] text-d-text-muted ${MONO}`}>{a.caption}</div>}
        <ArtifactCtaChip cta={a.cta} />
      </div>
    )
  }
  if (a.type === 'table') {
    return (
      <div className="overflow-hidden rounded-sm border border-line bg-wrap">
        <div className="flex items-baseline justify-between gap-2 px-3 pt-3">
          <span className="text-[12px] font-normal text-d-text-primary">{tIcon(a)} {a.title}</span>
          {a.subtitle && <span className="shrink-0 truncate text-[10px] text-d-text-secondary">{a.subtitle}</span>}
        </div>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="border-b border-line text-d-text-muted">
                <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
                {a.columns.map((c) => (
                  <th key={c} className={`px-3 py-1.5 text-right font-medium ${MONO}`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {a.rows.map((r) => (
                <tr key={r.symbol} className="border-b border-line/50 last:border-0">
                  <td className="px-3 py-1.5">
                    <Link href={`/stock/${r.symbol}`} className="font-medium text-d-text-primary hover:text-ai">
                      {r.symbol}
                    </Link>
                  </td>
                  {r.cells.map((cell, ci) => (
                    <td key={ci} className={`px-3 py-1.5 text-right tabular-nums ${MONO} ${artTone(cell.tone)}`}>
                      {cell.value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ArtifactCtaChip cta={a.cta} />
      </div>
    )
  }
  if (a.type === 'gauge') {
    // Semicircular 0-100 gauge (same geometry as WinRateGauge).
    const v = Math.max(0, Math.min(100, a.value)) / 100
    const size = 132, strokeW = 9, pad = strokeW / 2 + 2
    const r = size / 2 - pad, cx = size / 2, cy = r + pad
    const col = a.tone === 'down' ? 'var(--color-down)' : a.tone === 'up' ? 'var(--color-up)' : 'var(--color-primary)'
    const arc = (from: number, to: number) => {
      const a0 = Math.PI * (1 - from), a1 = Math.PI * (1 - to)
      return `M ${cx + r * Math.cos(a0)} ${cy - r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy - r * Math.sin(a1)}`
    }
    return (
      <div className="rounded-sm border border-line bg-wrap p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[12px] font-normal text-d-text-primary">{tIcon(a)} {a.title}</span>
          {a.subtitle && <span className="shrink-0 text-[10px] text-d-text-secondary">{a.subtitle}</span>}
        </div>
        <div className="mt-1 flex flex-col items-center">
          <svg width={size} height={cy + 6} viewBox={`0 0 ${size} ${cy + 6}`} className="overflow-visible">
            <path d={arc(0, 1)} fill="none" stroke="var(--color-line)" strokeWidth={strokeW} strokeLinecap="round" />
            <path d={arc(0, v)} fill="none" stroke={col} strokeWidth={strokeW} strokeLinecap="round" />
            <text x={cx} y={cy - 6} textAnchor="middle" className={`${MONO} fill-d-text-primary`} style={{ fontSize: 22, fontWeight: 600 }}>
              {Math.round(a.value)}
            </text>
          </svg>
          {a.valueLabel && <div className="-mt-1 text-[11px] text-d-text-secondary">{a.valueLabel}</div>}
        </div>
        <ArtifactCtaChip cta={a.cta} />
      </div>
    )
  }
  if (a.type === 'payoff') {
    const zeroCross = a.points
    return (
      <div className="rounded-sm border border-line bg-wrap p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[12px] font-normal text-d-text-primary">{tIcon(a)} {a.title}</span>
          {a.subtitle && <span className="shrink-0 text-[10px] text-d-text-secondary">{a.subtitle}</span>}
        </div>
        <div className="mt-2 h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={zeroCross} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} tick={{ fill: 'var(--color-muted)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v.toFixed(0)} />
              <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 9 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v: number) => (v >= 1000 || v <= -1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0))} />
              <ReferenceLine y={0} stroke="var(--color-muted)" strokeDasharray="3 3" />
              {a.spot != null && <ReferenceLine x={a.spot} stroke="var(--color-line)" label={{ value: 'spot', fontSize: 9, fill: 'var(--color-muted)' }} />}
              {(a.breakevens ?? []).map((be, i) => (
                <ReferenceLine key={i} x={be} stroke="var(--color-primary)" strokeDasharray="2 2" />
              ))}
              <Tooltip
                cursor={{ stroke: 'var(--color-line)' }}
                contentStyle={{ background: 'var(--color-wrap)', border: '1px solid var(--color-line)', borderRadius: 6, fontSize: 11, padding: '4px 8px' }}
                labelFormatter={(l) => `At ${Number(l).toFixed(0)}`}
                formatter={(val: number | string) => [`${Number(val) >= 0 ? '+' : ''}₹${Number(val).toLocaleString('en-IN')}`, 'P&L']}
              />
              <Line type="monotone" dataKey="y" stroke="var(--color-up)" strokeWidth={1.75} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {(a.maxProfit != null || a.maxLoss != null) && (
          <div className={`mt-1 flex justify-between text-[11px] ${MONO}`}>
            <span className="text-up">max +₹{Number(a.maxProfit ?? 0).toLocaleString('en-IN')}</span>
            <span className="text-down">max −₹{Math.abs(Number(a.maxLoss ?? 0)).toLocaleString('en-IN')}</span>
          </div>
        )}
        <ArtifactCtaChip cta={a.cta} />
      </div>
    )
  }
  if (a.type === 'strategy') {
    return (
      <div className="overflow-hidden rounded-sm border border-line bg-wrap">
        <div className="flex items-baseline justify-between gap-2 px-3 pt-3">
          <span className="truncate text-[12px] font-semibold text-d-text-primary">{tIcon(a)} {a.title}</span>
          {a.subtitle && <span className={`shrink-0 text-[10px] ${MONO} text-d-text-secondary`}>{a.subtitle}</span>}
        </div>
        <div className="mt-2 space-y-1.5 px-3 pb-3">
          {a.rules.map((r) => (
            <div key={r.label} className="flex gap-2 text-[12px]">
              <span className="w-16 shrink-0 text-d-text-muted">{r.label}</span>
              <span className="min-w-0 flex-1 text-d-text-secondary">{r.value}</span>
            </div>
          ))}
        </div>
        <ArtifactCtaChip cta={a.cta} />
      </div>
    )
  }
  // stat pills
  return (
    <div className="rounded-sm border border-line bg-wrap p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-normal text-d-text-primary">{tIcon(a)} {a.title}</span>
        {a.subtitle && <span className="shrink-0 text-[10px] text-d-text-secondary">{a.subtitle}</span>}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {a.stats.map((s) => (
          <div key={s.label} className="rounded-sm border border-line bg-wrap-hover px-2.5 py-1.5">
            <EyebrowMono className="text-[9.5px]">{s.label}</EyebrowMono>
            <div className={`text-[13px] ${MONO} ${artTone(s.tone)}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <ArtifactCtaChip cta={a.cta} />
    </div>
  )
}

export function ChatArtifacts({ artifacts }: { artifacts: CopilotArtifact[] }) {
  const cols = artifacts.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
  return (
    <div className={`grid gap-2 ${cols}`}>
      {artifacts.map((a, i) => (
        <BlurFade key={i} delay={i * 0.05} offset={6} duration={0.25}>
          <ArtifactCard a={a} />
        </BlurFade>
      ))}
    </div>
  )
}
