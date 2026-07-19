'use client'

/**
 * AI Setup Finder — runs the 4 canonical setup families across the universe
 * (Breakout / Pullback / Trend continuation / Reversal) and shows labeled
 * count chips. Clicking a bucket expands its matched-symbol list.
 *
 * Deterministic, 0 tokens — REUSES the existing scanners via /api/screener/
 * setups; there is no LLM here. Honest-empty: renders null when every scanner
 * failed (and nothing fired), matching LiveAlertsCard's styling.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Crosshair, TrendingUp, CornerDownRight, Activity, Repeat } from '@/lib/icons'

import { api } from '@/lib/api'
import { stockHref } from '@/lib/stock-href'

interface Setup { key: string; label: string; count: number; symbols: string[] }

const ICON: Record<string, { icon: any; color: string }> = {
  breakout: { icon: TrendingUp, color: '#05B878' },
  pullback: { icon: CornerDownRight, color: '#3B82F6' },
  trend: { icon: Activity, color: '#8B5CF6' },
  reversal: { icon: Repeat, color: '#FEB113' },
}

export default function SetupFinderCard() {
  const [setups, setSetups] = useState<Setup[]>([])
  const [total, setTotal] = useState(0)
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const r = await api.screener.setupFinder()
        if (cancelled) return
        // Honest-empty: render nothing only when every scanner failed AND
        // nothing fired. A real "all four are 0 today" still shows the card.
        if (r?.ok && r.setups?.length) { setSetups(r.setups); setTotal(r.total ?? 0); setState('ok') } else setState('empty')
      } catch { if (!cancelled) setState('empty') }
    }
    run()
    return () => { cancelled = true }
  }, [])

  if (state === 'loading') return <div className="rounded-lg border border-line bg-wrap h-[120px] animate-pulse" />
  if (state === 'empty') return null

  return (
    <div className="rounded-lg border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <Crosshair className="w-3.5 h-3.5 text-primary" /> Setup Finder
        </span>
        <span className="text-[10px] text-d-text-muted">{total} setups firing</span>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        {setups.map((s) => {
          const t = ICON[s.key] || { icon: Crosshair, color: '#8b8f9a' }
          const Icon = t.icon
          const active = open === s.key
          const disabled = s.count === 0
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setOpen(active ? null : s.key)}
              disabled={disabled}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors disabled:opacity-50 ${
                active ? 'border-primary bg-surface-2' : 'border-line bg-main hover:bg-surface-2'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: t.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-medium text-d-text-primary">{s.label}</span>
              </span>
              <span className="font-mono text-[12px] tabular-nums text-d-text-secondary">{s.count}</span>
            </button>
          )
        })}
      </div>

      {open && (() => {
        const sel = setups.find((s) => s.key === open)
        if (!sel || sel.count === 0) return null
        return (
          <div className="border-t border-line px-3 py-2">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
              {sel.label} · {sel.count}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sel.symbols.map((sym) => (
                <Link
                  key={sym}
                  href={stockHref(sym)}
                  className="rounded-md border border-line bg-main px-2 py-1 text-[11px] font-medium text-d-text-secondary hover:bg-surface-2 hover:text-d-text-primary transition-colors"
                >
                  {sym.replace('.NS', '')}
                </Link>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
