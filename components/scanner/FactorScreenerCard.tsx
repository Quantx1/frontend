'use client'

/**
 * AI Factor Screener — compose CONTINUOUS factors (e.g. "low-volatility
 * momentum") instead of picking a preset scanner. Select one or more factor
 * chips, hit Run, get a ranked table: each name's composite (0..100) plus its
 * per-factor percentile mini-scores.
 *
 * Deterministic, 0 tokens — pure cross-sectional math on real candles. Run is
 * user-triggered (never on load). Honest-empty: returns null until the user
 * runs it, and renders an empty note when no names qualify.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Layers, Loader2, Play } from '@/lib/icons'

import { api } from '@/lib/api'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import { stockHref } from '@/lib/stock-href'
import { MONO } from '@/lib/tokens'

interface FactorMeta { key: string; label: string; description: string }
interface FactorResult {
  symbol: string
  composite: number
  factor_scores: Record<string, number>
}

// Composite percentile -> a calm emerald/amber/grey ramp (inline style, no
// arbitrary-hex Tailwind classes per the branding hooks).
function scoreColor(v: number): string {
  if (v >= 70) return '#05B878'
  if (v >= 40) return '#FEB113'
  return '#8b8f9a'
}

export default function FactorScreenerCard() {
  const [available, setAvailable] = useState<FactorMeta[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [results, setResults] = useState<FactorResult[]>([])
  const [usedFactors, setUsedFactors] = useState<string[]>([])
  const [universeSize, setUniverseSize] = useState(0)
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'empty'>('idle')

  // Load the honestly-computable factor list once (cheap metadata call).
  useEffect(() => {
    let cancelled = false
    api.screener.factorScreen([])
      .then((r) => {
        if (cancelled) return
        const av = r?.available_factors ?? []
        setAvailable(av)
        // Default to "low-volatility momentum" if both are offered.
        const def = av.filter((f) => f.key === 'momentum' || f.key === 'low_volatility').map((f) => f.key)
        setSelected(def.length ? def : av.slice(0, 1).map((f) => f.key))
      })
      .catch(() => { /* metadata is best-effort; card stays minimal */ })
    return () => { cancelled = true }
  }, [])

  const toggle = (key: string) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
  }

  const run = async () => {
    if (!selected.length) return
    setState('loading')
    try {
      const r = await api.screener.factorScreen(selected, undefined, 25)
      const rows = r?.results ?? []
      if (rows.length) {
        setResults(rows)
        setUsedFactors(r?.factors ?? selected)
        setUniverseSize(r?.universe_size ?? 0)
        setState('done')
      } else {
        setState('empty')
      }
    } catch {
      setState('empty')
    }
  }

  if (available.length === 0) return null

  const labelFor = (key: string) => available.find((f) => f.key === key)?.label ?? key

  return (
    <div className="rounded-lg border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <Layers className="h-3.5 w-3.5 text-primary" /> Factor Screener
        </span>
        <span className="text-[10px] text-d-text-muted">Compose factors · ranked by composite</span>
      </div>

      {/* Multiselect factor chips */}
      <div className="flex flex-wrap gap-1.5 px-4 py-3">
        {available.map((f) => {
          const active = selected.includes(f.key)
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => toggle(f.key)}
              title={f.description}
              aria-pressed={active}
              className={`rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              {f.label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={run}
          disabled={state === 'loading' || selected.length === 0}
          className="ml-auto flex items-center gap-1.5 rounded-md border border-primary bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
        >
          {state === 'loading'
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Play className="h-3.5 w-3.5" />}
          Run
        </button>
      </div>

      {state === 'empty' && (
        <p className="px-4 pb-3 text-[11px] text-d-text-muted">
          No names qualified — try fewer factors or check back after the next data refresh.
        </p>
      )}

      {state === 'done' && results.length > 0 && (
        <div className="border-t border-line">
          <div className="flex items-center justify-between px-4 py-1.5 text-[10px] text-d-text-muted">
            <span>{usedFactors.map(labelFor).join(' + ')}</span>
            <span className={`tabular-nums ${MONO}`}>{results.length} of {universeSize} names</span>
          </div>
          {/* header */}
          <div
            className="grid items-center gap-2 px-4 py-1.5 text-[9px] font-medium uppercase tracking-wide text-d-text-muted"
            style={{ gridTemplateColumns: `1.4fr 0.7fr repeat(${usedFactors.length}, 0.7fr)` }}
          >
            <span>Symbol</span>
            <span className="text-right">Composite</span>
            {usedFactors.map((f) => (
              <span key={f} className="truncate text-right" title={labelFor(f)}>{labelFor(f)}</span>
            ))}
          </div>
          <div className="max-h-[420px] divide-y divide-line overflow-y-auto">
            {results.map((r) => (
              <Link
                key={r.symbol}
                href={stockHref(r.symbol)}
                className="grid items-center gap-2 px-4 py-[7px] hover:bg-surface-2 transition-colors"
                style={{ gridTemplateColumns: `1.4fr 0.7fr repeat(${usedFactors.length}, 0.7fr)` }}
              >
                <span className="flex items-center gap-2 truncate text-[11.5px] font-medium text-d-text-primary">
                  <SymbolLogo symbol={r.symbol} size={24} />
                  {r.symbol.replace('.NS', '')}
                </span>
                <span
                  className={`text-right text-[11px] font-semibold tabular-nums ${MONO}`}
                  style={{ color: scoreColor(r.composite) }}
                >
                  {r.composite.toFixed(0)}
                </span>
                {usedFactors.map((f) => {
                  const v = r.factor_scores?.[f]
                  return (
                    <span key={f} className={`text-right text-[10.5px] tabular-nums ${MONO}`}
                      style={{ color: v == null ? '#8b8f9a' : scoreColor(v) }}>
                      {v == null ? '—' : v.toFixed(0)}
                    </span>
                  )
                })}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
