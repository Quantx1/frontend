'use client'

/**
 * AIDossierPanel — N2 consolidated engine output for one stock.
 *
 * Data source: ``/api/dossier/{symbol}``. Every engine is labeled by
 * its public product brand name (Forecast / Alpha / Mood /
 * Regime / Intraday / EarningsScout).
 * Internal architecture names never appear in this component — they
 * come through the backend already translated.
 *
 * Free tier: directional tags only + upgrade CTA.
 * Pro+:     numeric scores, quantile bands, confidence.
 * Elite:    reserved hook for `/ai/debate/signal/:id` (Counterpoint).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Layers,
  Lock,
  Minus,
  Sparkles,
} from '@/lib/icons'

import { api, handleApiError, type DossierEngineBlock } from '@/lib/api'
import ModelBadge from '@/components/ModelBadge'

type Dossier = Awaited<ReturnType<typeof api.dossier.get>>


const CONSENSUS_COLOR: Record<string, string> = {
  bullish: '#05B878',
  bearish: '#FF5947',
  mixed:   '#FEB113',
  neutral: '#8e8e8e',
}


export default function AIDossierPanel({ symbol }: { symbol: string }) {
  const [d, setD] = useState<Dossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol) return
    ;(async () => {
      try {
        const r = await api.dossier.get(symbol)
        setD(r)
        setError(null)
      } catch (err) {
        setError(handleApiError(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [symbol])

  if (loading) {
    return (
      <section className="rounded-xl border border-d-border bg-wrap p-5">
        <p className="text-[12px] text-d-text-muted">Loading engine dossier…</p>
      </section>
    )
  }

  if (error || !d) {
    return (
      <section className="rounded-xl border border-d-border bg-wrap p-5">
        <p className="text-[12px] text-down">{error || 'Dossier unavailable'}</p>
      </section>
    )
  }

  const consensusColor = CONSENSUS_COLOR[d.consensus] || '#8e8e8e'
  const available = d.engines.filter((e) => e.available)
  const isFree = d.tier === 'free'

  return (
    <section className="rounded-xl border border-d-border bg-wrap overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-d-border flex items-center justify-between gap-3"
        style={{ borderLeft: `3px solid ${consensusColor}` }}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-semibold text-d-text-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Dossier
            <span className="text-[10px] text-d-text-muted font-normal">
              · {available.length} of {d.engines.length} engines reporting
            </span>
          </h2>
          <p className="text-[11px] text-d-text-secondary mt-0.5">
            Eight proprietary engines read {d.symbol} — their independent conclusions below.
          </p>
        </div>
        <ConsensusPill consensus={d.consensus} />
      </div>

      {/* Engines grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-d-border">
        {[d.engines.slice(0, 4), d.engines.slice(4, 8)].map((col, idx) => (
          <div key={idx} className="divide-y divide-d-border">
            {col.map((e) => (
              <EngineRow key={e.engine} e={e} isFree={isFree} />
            ))}
          </div>
        ))}
      </div>

      {/* Alpha Factory — unified per-stock scores (rendered only when present) */}
      {d.scores && d.scores.scores.length > 0 ? <ScoresBlock block={d.scores} /> : null}

      {/* Free upgrade CTA */}
      {isFree && (
        <div className="px-5 py-3 border-t border-d-border bg-[rgba(255,209,102,0.04)] flex items-center justify-between gap-3">
          <p className="text-[11px] text-d-text-secondary flex items-center gap-2">
            <Lock className="w-3 h-3 text-highlight" />
            Upgrade to <span className="text-highlight font-semibold">Pro</span> to see scores, quantile bands, and engine numerics.
          </p>
          <Link
            href="/pricing"
            className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
          >
            See plans <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Debate hook (Elite) */}
      {d.debate_available && d.latest_signal?.id && (
        <div className="px-5 py-3 border-t border-d-border flex items-center justify-between gap-3">
          <p className="text-[11px] text-d-text-secondary">
            <ModelBadge modelKey="debate_engine" size="xs" /> available for the latest signal
          </p>
          <Link
            href={`/signals/${d.latest_signal.id}`}
            className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
          >
            Run debate <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* PR 81 — latest signal trade levels. Pro+ engines already
          surface these to /signals/{id}; we mirror them here so the
          dossier doubles as a one-stop trade plan. */}
      {d.latest_signal && d.latest_signal.entry_price != null && (
        <LatestSignalLevels
          signal={d.latest_signal}
          spot={d.spot}
        />
      )}

      {/* Latest signal explanation (Pro+) */}
      {d.latest_signal?.explanation_text && (
        <div className="px-5 py-3 border-t border-d-border">
          <p className="text-[9px] uppercase tracking-wider text-d-text-muted mb-1">
            Latest signal · thesis
          </p>
          <p className="text-[12px] text-d-text-secondary leading-relaxed">
            {d.latest_signal.explanation_text}
          </p>
        </div>
      )}
    </section>
  )
}


/* ───────────────────────── latest signal trade levels ───────────────────────── */


function LatestSignalLevels({
  signal,
  spot,
}: {
  signal: NonNullable<Dossier['latest_signal']>
  spot: number | null | undefined
}) {
  const dir = (signal.direction || '').toUpperCase()
  const isLong = dir === 'LONG' || dir === 'BUY'
  const dirColor = isLong ? '#05B878' : '#FF5947'
  const entry = signal.entry_price
  const sl = signal.stop_loss
  const tgt = signal.target
  if (entry == null) return null

  // Risk:reward — only meaningful when both SL + target are set.
  const rr = (sl != null && tgt != null && entry !== sl)
    ? Math.abs((tgt - entry) / (entry - sl))
    : null

  // Distance from current spot.
  const distFromSpot = spot != null ? ((entry - spot) / spot) * 100 : null

  return (
    <div className="px-5 py-3 border-t border-d-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] uppercase tracking-wider text-d-text-muted">
          Latest signal · trade levels
        </p>
        <span
          className="text-[9px] font-semibold tracking-wider uppercase rounded-full px-2 py-0.5 border"
          style={{ color: dirColor, borderColor: `${dirColor}55`, background: `${dirColor}14` }}
        >
          {dir || (isLong ? 'LONG' : 'SHORT')}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <LevelCell label="Entry" value={entry} accentClass="text-d-text-primary" />
        {sl != null && <LevelCell label="Stop" value={sl} accentClass="text-down" />}
        {tgt != null && <LevelCell label="Target" value={tgt} accentClass="text-up" />}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-d-text-muted">
        {rr != null ? (
          <span>R:R <span className="numeric text-d-text-primary">1:{rr.toFixed(2)}</span></span>
        ) : <span />}
        {distFromSpot != null && (
          <span>
            {Math.abs(distFromSpot) < 0.05 ? 'at spot' : (
              <>entry is <span className="numeric text-d-text-primary">{distFromSpot >= 0 ? '+' : ''}{distFromSpot.toFixed(2)}%</span> vs spot</>
            )}
          </span>
        )}
      </div>
    </div>
  )
}


function LevelCell({ label, value, accentClass }: { label: string; value: number; accentClass: string }) {
  return (
    <div className="rounded-md bg-main border border-d-border px-2.5 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-d-text-muted">{label}</p>
      <p className={`numeric text-[13px] font-semibold mt-0.5 ${accentClass}`}>
        ₹{value.toFixed(2)}
      </p>
    </div>
  )
}


/* ───────────────────────── unified scores ───────────────────────── */


type ScoresBlockData = NonNullable<Dossier['scores']>

function ScoresBlock({ block }: { block: ScoresBlockData }) {
  return (
    <div className="px-5 py-3 border-t border-d-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] uppercase tracking-wider text-d-text-muted">Scores</p>
        {block.composite != null ? (
          <span className="text-[10px] text-d-text-muted">
            Composite{' '}
            <span className="numeric text-[12px] font-semibold text-primary">
              {block.composite.toFixed(0)}
            </span>
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {block.scores.map((s) => (
          <ScoreCell key={s.key} s={s} />
        ))}
      </div>
    </div>
  )
}


function ScoreCell({ s }: { s: ScoresBlockData['scores'][number] }) {
  return (
    <div className="rounded-md bg-main border border-d-border px-2.5 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] uppercase tracking-wider text-d-text-muted truncate">{s.label}</p>
        <p className="numeric text-[12px] font-semibold text-d-text-primary shrink-0">
          {s.pct != null ? s.pct.toFixed(0) : s.value != null ? String(s.value) : '—'}
        </p>
      </div>
      {s.pct != null ? (
        <div className="mt-1.5 h-1 rounded-full bg-d-border overflow-hidden">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, Math.max(2, s.pct))}%` }}
          />
        </div>
      ) : null}
      {s.note ? <p className="text-[9px] text-d-text-muted mt-1 truncate">{s.note}</p> : null}
    </div>
  )
}


/* ───────────────────────── components ───────────────────────── */


function ConsensusPill({ consensus }: { consensus: string }) {
  const color = CONSENSUS_COLOR[consensus] || '#8e8e8e'
  const label = consensus === 'mixed' ? 'Mixed signal' : consensus.charAt(0).toUpperCase() + consensus.slice(1)
  const Icon = consensus === 'bullish' ? ArrowUpRight : consensus === 'bearish' ? ArrowDownRight : Minus
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase rounded-full px-2.5 py-1 border"
      style={{
        color,
        borderColor: `${color}55`,
        background: `${color}14`,
      }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}


function EngineRow({ e, isFree }: { e: DossierEngineBlock; isFree: boolean }) {
  // Map engine display name → internal key used by ModelBadge registry.
  const modelKey = KEY_BY_ENGINE[e.engine] || 'swing_forecast'
  const direction = e.direction

  return (
    <div className="px-5 py-3 flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <ModelBadge modelKey={modelKey} size="xs" />
          {!e.available && (
            <span className="text-[9px] text-d-text-muted">no data yet</span>
          )}
        </div>
        <p className="text-[10px] text-d-text-muted mt-1 leading-tight line-clamp-1">
          {e.role}
        </p>
      </div>
      <div className="text-right shrink-0">
        {e.available ? (
          <EngineValue e={e} isFree={isFree} />
        ) : (
          <p className="text-[11px] text-d-text-muted">—</p>
        )}
      </div>
    </div>
  )
}


function EngineValue({ e, isFree }: { e: DossierEngineBlock; isFree: boolean }) {
  const colorClass =
    e.direction === 'bullish' || e.direction === 'bullish_tilt'
      ? 'text-up'
      : e.direction === 'bearish' || e.direction === 'bearish_tilt'
        ? 'text-down'
        : e.direction === 'non_directional' || e.direction === 'mixed'
          ? 'text-warning'
          : 'text-d-text-primary'

  // Free tier — directional tag only.
  if (isFree) {
    return (
      <p className={`text-[11px] font-semibold ${colorClass}`}>
        {formatDirection(e.direction)}
      </p>
    )
  }

  // Pro+: engine-specific numeric detail.
  const rich = richValueFor(e)
  return (
    <div>
      <p className={`text-[12px] font-semibold ${colorClass}`}>
        {formatDirection(e.direction)}
      </p>
      {rich && (
        <p className="text-[10px] text-d-text-muted mt-0.5 numeric">{rich}</p>
      )}
    </div>
  )
}


function richValueFor(e: DossierEngineBlock): string | null {
  // Forecast — p10 / p50 / p90 quantile band.
  if (e.engine === 'Forecast' && e.p50 != null) {
    const parts = [
      e.p10 != null ? `p10 ${e.p10.toFixed(2)}` : null,
      `p50 ${e.p50.toFixed(2)}`,
      e.p90 != null ? `p90 ${e.p90.toFixed(2)}` : null,
    ].filter(Boolean)
    return parts.join(' · ')
  }
  // Alpha — rank + raw score.
  if (e.engine === 'Alpha' && e.rank != null) {
    const parts: string[] = [`rank #${e.rank}`]
    if (e.score != null) parts.push(`score ${e.score.toFixed(3)}`)
    return parts.join(' · ')
  }
  // Mood — score + headline count.
  if (e.engine === 'Mood' && e.score != null) {
    const hc = e.headline_count ?? 0
    return `score ${e.score.toFixed(2)} · ${hc} headlines`
  }
  // Regime — regime probabilities.
  if (e.engine === 'Regime' && e.regime) {
    const p = (e.regime === 'bull' ? e.prob_bull : e.regime === 'bear' ? e.prob_bear : e.prob_sideways) ?? null
    const vix = e.vix != null ? ` · VIX ${e.vix.toFixed(1)}` : ''
    return p != null ? `${(p * 100).toFixed(0)}% confidence${vix}` : (vix || null)
  }
  // Intraday — up probability.
  if (e.engine === 'Intraday' && e.up_prob != null) {
    return `up prob ${(e.up_prob * 100).toFixed(0)}%`
  }
  return null
}


function formatDirection(d?: string): string {
  if (!d) return '—'
  if (d === 'bullish_tilt') return 'Bullish tilt'
  if (d === 'bearish_tilt') return 'Bearish tilt'
  if (d === 'non_directional') return 'Non-directional'
  return d.charAt(0).toUpperCase() + d.slice(1)
}


const KEY_BY_ENGINE: Record<string, string> = {
  Forecast:     'swing_forecast',
  Alpha:     'cross_sectional_ranker',
  Mood:      'sentiment_engine',
  Regime:      'regime_detector',
  Intraday:     'intraday_forecast',
  AutoPilot:     'execution_engine',
  InsightAI:     'cot_agents',
  Counterpoint:  'debate_engine',
  PatternScope:  'pattern_scorer',
}
