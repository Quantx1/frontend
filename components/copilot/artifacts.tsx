'use client'

/* ============================================================================
   QUANT X — embedded-agent GenUI artifact primitives (PR-V1, promoted from /os).
   ChipRow · ArtifactCard · Bars · StatPills · Gauge · ActionRow.

   xAI skin: hairline charcoal surfaces (bg-wrap / border-line / rounded-sm),
   mono / EyebrowMono labels, and DUOTONE (text-up / text-down) only on
   financial numbers. No purple chrome, no hardcoded hex — chart stroke/fill
   come from var(--color-up|down)/white. Data wiring is unchanged.
   ============================================================================ */

import { motion } from 'framer-motion'
import type { ReactNode, ComponentType } from 'react'
import { Plus, X, SlidersHorizontal, Filter } from '@/lib/icons'
import { MONO } from '@/lib/tokens'
import { EyebrowMono } from '@/components/foundation'
import type { ChipItem } from './types'

/** Generated chips/rules with staggered pop-in. Reveal with `step >= 3`. */
export function ChipRow({ label = 'Generated filters', items, addable = true }: { label?: string; items: ChipItem[]; addable?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Filter size={11} className="text-d-text-muted" />
        <EyebrowMono className="text-[10px]">{label}</EyebrowMono>
        <button className="ml-auto inline-flex items-center gap-1 rounded text-[10px] font-normal text-d-text-muted hover:text-d-text-primary"><SlidersHorizontal size={10} /> Edit</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((c, i) => (
          <motion.span key={c.k + i} initial={{ opacity: 0, scale: 0.97, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="group inline-flex items-center gap-1.5 rounded-sm border border-line bg-wrap-hover px-2 py-1 text-[11px]">
            {c.icon && <c.icon size={11} className="text-d-text-muted" />}
            <span className="text-d-text-secondary">{c.k}</span>
            {c.op && <span className="font-normal text-d-text-muted">{c.op}</span>}
            {c.v && <span className={`font-normal text-d-text-primary ${MONO}`}>{c.v}</span>}
            <X size={11} className="ml-0.5 cursor-pointer text-d-text-muted opacity-0 transition-opacity hover:text-d-text-primary group-hover:opacity-100" />
          </motion.span>
        ))}
        {addable && <button className="inline-flex items-center gap-1 rounded-sm border border-dashed border-line px-2 py-1 text-[11px] text-d-text-muted hover:text-d-text-primary"><Plus size={11} /> Add</button>}
      </div>
    </motion.div>
  )
}

/** Bordered sub-card wrapper for generated tables/blocks. Slides in. */
export function ArtifactCard({ title, meta, children }: { title?: ReactNode; meta?: ReactNode; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="overflow-hidden rounded-sm border border-line bg-wrap">
      {(title || meta) && <div className="flex items-center justify-between border-b border-line px-3 py-2 text-[11px]"><span className="font-normal text-d-text-primary">{title}</span>{meta && <span className="text-d-text-muted">{meta}</span>}</div>}
      {children}
    </motion.div>
  )
}

/** Labeled horizontal bars (factor breakdown, sector strength, etc.). Bar fill
 *  is mono white by default; pass var(--color-up|down) for duotone direction. */
export function Bars({ rows, color = 'rgb(255 255 255 / 0.55)' }: { rows: [string, number][]; color?: string }) {
  return (
    <div className="space-y-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2.5">
          <span className="w-28 shrink-0 truncate text-[11.5px] text-d-text-secondary">{k}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-wrap-hover"><div className="h-full rounded-pill" style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: color }} /></div>
          <span className={`w-8 text-right text-[11px] text-d-text-secondary ${MONO}`}>{v}</span>
        </div>
      ))}
    </div>
  )
}

/** Grid of stat pills (backtest metrics, key levels…). tone duotones the NUMBER
 *  only: up | down → green/red; everything else (incl. the legacy 'ai') is mono.
 *  ('ai' is kept in the union for back-compat but no longer renders purple —
 *  duotone discipline reserves colour for direction.) */
export function StatPills({ items, cols = 4 }: { items: { label: string; v: string; tone?: 'up' | 'down' | 'ai' | 'neutral' }[]; cols?: number }) {
  const cls = (t?: string) => (t === 'up' ? 'text-up' : t === 'down' ? 'text-down' : 'text-d-text-primary')
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {items.map((s) => (
        <div key={s.label} className="rounded-sm border border-line bg-wrap px-2.5 py-2">
          <EyebrowMono className="text-[9.5px]">{s.label}</EyebrowMono>
          <div className={`mt-0.5 text-[14px] font-normal ${MONO} ${cls(s.tone)}`}>{s.v}</div>
        </div>
      ))}
    </div>
  )
}

/** Compact semicircular gauge (health/sentiment score). Arc stroke is mono
 *  white by default; pass var(--color-up|down) for duotone. */
export function Gauge({ value, label, tone = 'rgb(255 255 255 / 0.85)' }: { value: number; label?: string; tone?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-3">
      <svg width="88" height="54" viewBox="0 0 88 54" className="text-d-text-primary">
        <path d="M9 49 A35 35 0 0 1 79 49" fill="none" stroke="var(--color-wrap-hover)" strokeWidth="8" strokeLinecap="round" pathLength={100} />
        <path d="M9 49 A35 35 0 0 1 79 49" fill="none" stroke={tone} strokeWidth="8" strokeLinecap="round" pathLength={100} strokeDasharray={`${pct} 100`} />
        <text x="44" y="45" textAnchor="middle" fill="currentColor" className={MONO} style={{ fontSize: 18, fontWeight: 400 }}>{value}</text>
      </svg>
      {label && <div className="text-[11.5px] leading-snug text-d-text-secondary">{label}</div>}
    </div>
  )
}

/** Generated artifact actions row. Reveal with `step >= 5`.
 *  Each item may carry an optional third element: a string href (rendered as a
 *  link — supports same-page `#anchor` targets) or a click handler. Bare
 *  [Icon, label] pairs stay valid for back-compat. */
export function ActionRow({ items }: { items: Array<[ComponentType<any>, string] | [ComponentType<any>, string, string | (() => void)]> }) {
  const cls = 'inline-flex items-center gap-1.5 rounded-pill glass-control px-2.5 py-1.5 text-[11.5px] text-d-text-secondary transition-colors hover:text-d-text-primary active:scale-[0.98]'
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="flex flex-wrap gap-2 pt-0.5">
      {items.map(([Icon, label, action]) =>
        typeof action === 'string' ? (
          <a key={label} href={action} className={cls}><Icon size={12} /> {label}</a>
        ) : (
          <button key={label} onClick={action} className={cls}><Icon size={12} /> {label}</button>
        )
      )}
    </motion.div>
  )
}
