'use client'

/**
 * AIDossierPanel — consolidated engine output for one stock (2026-07-21).
 *
 * Data source: ``/api/dossier/{symbol}``. Engines are labeled by their
 * public brand names (Alpha / Mood / Regime / Forecast / Intraday);
 * internal architecture names never appear here.
 *
 * Cutting-edge-intelligence rules: ONLY live engines render — offline
 * engines (awaiting a fresh signal run or a live feed) are collapsed to
 * one footnote line, never dead rows. Every live engine is a visual
 * meter tile: Alpha = rank percentile bar, Mood = diverging score bar,
 * Regime = stacked probability split. The factor scoreboard keeps its
 * percentile bars.
 *
 * Free tier: directional tags only + upgrade CTA.
 * Pro+:     meters, numeric scores, probabilities.
 * Elite:    Counterpoint debate hook on the latest live signal.
 */

import useSWR from 'swr'
import Link from 'next/link'
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Lock,
  Minus,
  Sparkles,
} from '@/lib/icons'

import { api, handleApiError, type DossierEngineBlock } from '@/lib/api'
import ModelBadge from '@/components/ModelBadge'

type Dossier = Awaited<ReturnType<typeof api.dossier.get>>

const CONSENSUS_COLOR: Record<string, string> = {
  bullish: 'var(--color-up)',
  bearish: 'var(--color-down)',
  mixed:   'var(--color-warning)',
  neutral: 'var(--color-muted)',
}

const UP = 'var(--color-up)'
const DOWN = 'var(--color-down)'
const WARN = 'var(--color-warning)'

export default function AIDossierPanel({ symbol }: { symbol: string }) {
  // SWR with retries — a request that races a backend restart self-heals
  // instead of leaving the panel on "Loading…" forever.
  const { data: d, error: swrError, isLoading: loading } = useSWR(
    symbol ? `dossier:${symbol}` : null,
    () => api.dossier.get(symbol),
    { revalidateOnFocus: false, dedupingInterval: 120_000, errorRetryCount: 3, errorRetryInterval: 4_000 },
  )
  const error = swrError ? handleApiError(swrError) : null

  if (loading) {
    return (
      <section className="rounded-[20px] border border-d-border bg-wrap p-5">
        <p className="text-[12px] text-d-text-muted">Loading engine dossier…</p>
      </section>
    )
  }

  if (error || !d) {
    return (
      <section className="rounded-[20px] border border-d-border bg-wrap p-5">
        <p className="text-[12px] text-down">{error || 'Dossier unavailable'}</p>
      </section>
    )
  }

  const consensusColor = CONSENSUS_COLOR[d.consensus] || 'var(--color-muted)'
  const live = d.engines.filter((e) => e.available)
  const offline = d.engines.filter((e) => !e.available)
  const isFree = d.tier === 'free'

  return (
    <section className="overflow-hidden rounded-[20px] border border-d-border bg-wrap">
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 border-b border-d-border px-5 py-4"
        style={{ borderLeft: `3px solid ${consensusColor}` }}
      >
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-d-text-primary">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Dossier
            <span className="text-[10px] font-normal text-d-text-muted">
              · {live.length} engine{live.length === 1 ? '' : 's'} live
            </span>
          </h2>
          <p className="mt-0.5 text-[11px] text-d-text-secondary">
            Independent engine reads on {d.symbol}, then the fused factor scoreboard.
          </p>
        </div>
        <ConsensusPill consensus={d.consensus} />
      </div>

      {/* Live engine meter tiles */}
      {live.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-3">
          {live.map((e) => (
            <EngineTile key={e.engine} e={e} isFree={isFree} />
          ))}
        </div>
      ) : (
        <p className="px-5 py-4 text-[12px] text-d-text-muted">
          No engine has fresh output for {d.symbol} right now.
        </p>
      )}

      {/* Offline engines — one honest footnote, never dead rows */}
      {offline.length > 0 && (
        <p className="border-t border-d-border px-5 py-2 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
          Offline: {offline.map((e) => e.engine).join(' · ')} — awaiting a fresh signal run / live feed
        </p>
      )}

      {/* Alpha Factory — unified per-stock scores (rendered only when present) */}
      {d.scores && d.scores.scores.length > 0 ? <ScoresBlock block={d.scores} /> : null}

      {/* Free upgrade CTA */}
      {isFree && (
        <div className="flex items-center justify-between gap-3 border-t border-d-border bg-highlight/5 px-5 py-3">
          <p className="flex items-center gap-2 text-[11px] text-d-text-secondary">
            <Lock className="h-3 w-3 text-highlight" />
            Upgrade to <span className="font-semibold text-highlight">Pro</span> to see the meters, scores, and probabilities.
          </p>
          <Link href="/pricing" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
            See plans <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Debate hook (Elite) */}
      {d.debate_available && d.latest_signal?.id && (
        <div className="flex items-center justify-between gap-3 border-t border-d-border px-5 py-3">
          <p className="text-[11px] text-d-text-secondary">
            <ModelBadge modelKey="debate_engine" size="xs" /> available for the latest signal
          </p>
          <Link
            href={`/signals/${d.latest_signal.id}`}
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            Run debate <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Latest LIVE signal trade levels (backend only sends active/triggered) */}
      {d.latest_signal && d.latest_signal.entry_price != null && (
        <LatestSignalLevels signal={d.latest_signal} spot={d.spot} />
      )}

      {/* Latest signal explanation (Pro+) */}
      {d.latest_signal?.explanation_text && (
        <div className="border-t border-d-border px-5 py-3">
          <p className="mb-1 text-[9px] uppercase tracking-wider text-d-text-muted">
            Latest signal · thesis
          </p>
          <p className="text-[12px] leading-relaxed text-d-text-secondary">
            {d.latest_signal.explanation_text}
          </p>
        </div>
      )}
    </section>
  )
}

/* ───────────────────────── engine meter tiles ───────────────────────── */

function directionClass(d?: string): string {
  return d === 'bullish' || d === 'bullish_tilt' ? 'text-up'
    : d === 'bearish' || d === 'bearish_tilt' ? 'text-down'
    : d === 'non_directional' || d === 'mixed' ? 'text-warning'
    : 'text-d-text-primary'
}

function formatDirection(d?: string): string {
  if (!d) return '—'
  if (d === 'bullish_tilt') return 'Bullish tilt'
  if (d === 'bearish_tilt') return 'Bearish tilt'
  if (d === 'non_directional') return 'Non-directional'
  return d.charAt(0).toUpperCase() + d.slice(1)
}

function EngineTile({ e, isFree }: { e: DossierEngineBlock; isFree: boolean }) {
  const modelKey = KEY_BY_ENGINE[e.engine] || 'swing_forecast'
  return (
    <div className="rounded-xl border border-d-border bg-main px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <ModelBadge modelKey={modelKey} size="xs" />
        <span className={`text-[11px] font-semibold ${directionClass(e.direction ?? (e.engine === 'Regime' ? e.regime === 'bull' ? 'bullish' : e.regime === 'bear' ? 'bearish' : 'mixed' : undefined))}`}>
          {e.engine === 'Regime' && e.regime
            ? e.regime.charAt(0).toUpperCase() + e.regime.slice(1)
            : formatDirection(e.direction)}
        </span>
      </div>
      {!isFree && <EngineMeter e={e} />}
      <p className="mt-1.5 line-clamp-1 text-[9px] leading-tight text-d-text-muted">{e.role}</p>
    </div>
  )
}

/** Per-engine visual meter — Alpha rank percentile, Mood diverging bar,
 *  Regime probability split, Forecast quantile band, Intraday up-prob. */
function EngineMeter({ e }: { e: DossierEngineBlock }) {
  // Alpha: rank #N of ~500 universe → percentile bar.
  if (e.engine === 'Alpha' && e.rank != null) {
    const pct = Math.max(2, Math.min(100, 100 - (e.rank / 500) * 100))
    return (
      <div className="mt-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-d-border">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-d-text-muted">
          <span>rank <span className="text-d-text-primary">#{e.rank}</span></span>
          <span>top {Math.max(1, Math.round((e.rank / 500) * 100))}%</span>
        </div>
      </div>
    )
  }
  // Mood: score in [-1, +1] → diverging bar from center.
  if (e.engine === 'Mood' && e.score != null) {
    const mag = Math.min(1, Math.abs(e.score))
    const tone = e.score >= 0 ? UP : DOWN
    return (
      <div className="mt-2">
        <div className="relative h-1.5 overflow-hidden rounded-full bg-d-border">
          <span className="absolute inset-y-0 left-1/2 w-px bg-d-text-muted/40" />
          <span
            className="absolute inset-y-0 rounded-full"
            style={{
              background: tone,
              left: e.score >= 0 ? '50%' : `${50 - mag * 50}%`,
              width: `${Math.max(3, mag * 50)}%`,
            }}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-d-text-muted">
          <span>score <span className="text-d-text-primary">{e.score.toFixed(2)}</span></span>
          <span>{e.headline_count ?? 0} headlines</span>
        </div>
      </div>
    )
  }
  // Regime: bull / sideways / bear probability split.
  if (e.engine === 'Regime' && (e.prob_bull != null || e.prob_sideways != null || e.prob_bear != null)) {
    const pb = Math.max(0, e.prob_bull ?? 0)
    const ps = Math.max(0, e.prob_sideways ?? 0)
    const pr = Math.max(0, e.prob_bear ?? 0)
    const tot = pb + ps + pr || 1
    return (
      <div className="mt-2">
        <div className="flex h-1.5 gap-px overflow-hidden rounded-full">
          <span style={{ width: `${(pb / tot) * 100}%`, background: UP }} />
          <span style={{ width: `${(ps / tot) * 100}%`, background: WARN }} />
          <span style={{ width: `${(pr / tot) * 100}%`, background: DOWN }} />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-d-text-muted">
          <span>
            <span style={{ color: UP }}>{Math.round((pb / tot) * 100)}</span>·
            <span style={{ color: WARN }}>{Math.round((ps / tot) * 100)}</span>·
            <span style={{ color: DOWN }}>{Math.round((pr / tot) * 100)}%</span>
          </span>
          {e.vix != null && <span>VIX {e.vix.toFixed(1)}</span>}
        </div>
      </div>
    )
  }
  // Forecast: p10/p50/p90 quantile band.
  if (e.engine === 'Forecast' && e.p50 != null) {
    return (
      <p className="numeric mt-2 font-mono text-[9px] text-d-text-muted">
        {e.p10 != null ? `p10 ${e.p10.toFixed(2)} · ` : ''}p50{' '}
        <span className="text-d-text-primary">{e.p50.toFixed(2)}</span>
        {e.p90 != null ? ` · p90 ${e.p90.toFixed(2)}` : ''}
      </p>
    )
  }
  // Intraday: up-probability bar.
  if (e.engine === 'Intraday' && e.up_prob != null) {
    const pct = Math.round(e.up_prob * 100)
    return (
      <div className="mt-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-d-border">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 50 ? UP : DOWN }} />
        </div>
        <p className="mt-1 font-mono text-[9px] text-d-text-muted">up prob {pct}%</p>
      </div>
    )
  }
  return null
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
  const dirColor = isLong ? 'var(--color-up)' : 'var(--color-down)'
  const entry = signal.entry_price
  const sl = signal.stop_loss
  const tgt = signal.target
  if (entry == null) return null

  const rr = (sl != null && tgt != null && entry !== sl)
    ? Math.abs((tgt - entry) / (entry - sl))
    : null
  const distFromSpot = spot != null ? ((entry - spot) / spot) * 100 : null

  return (
    <div className="border-t border-d-border px-5 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-wider text-d-text-muted">
          Latest signal · trade levels
        </p>
        <span
          className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: dirColor, borderColor: `color-mix(in srgb, ${dirColor} 33%, transparent)`, background: `color-mix(in srgb, ${dirColor} 8%, transparent)` }}
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
    <div className="rounded-xl border border-d-border bg-main px-2.5 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-d-text-muted">{label}</p>
      <p className={`numeric mt-0.5 text-[13px] font-semibold ${accentClass}`}>
        ₹{value.toFixed(2)}
      </p>
    </div>
  )
}

/* ───────────────────────── unified scores ───────────────────────── */

type ScoresBlockData = NonNullable<Dossier['scores']>

function ScoresBlock({ block }: { block: ScoresBlockData }) {
  return (
    <div className="border-t border-d-border px-5 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-wider text-d-text-muted">Factor scoreboard · percentile vs universe</p>
        {block.composite != null ? (
          <span className="text-[10px] text-d-text-muted">
            Composite{' '}
            <span className="numeric text-[12px] font-semibold text-primary">
              {block.composite.toFixed(0)}
            </span>
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {block.scores.map((s) => (
          <ScoreCell key={s.key} s={s} />
        ))}
      </div>
    </div>
  )
}

function ScoreCell({ s }: { s: ScoresBlockData['scores'][number] }) {
  return (
    <div className="rounded-xl border border-d-border bg-main px-2.5 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[9px] uppercase tracking-wider text-d-text-muted">{s.label}</p>
        <p className="numeric shrink-0 text-[12px] font-semibold text-d-text-primary">
          {s.pct != null ? s.pct.toFixed(0) : s.value != null ? String(s.value) : '—'}
        </p>
      </div>
      {s.pct != null ? (
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-d-border">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, Math.max(2, s.pct))}%` }}
          />
        </div>
      ) : null}
      {s.note ? <p className="mt-1 truncate text-[9px] text-d-text-muted">{s.note}</p> : null}
    </div>
  )
}

/* ───────────────────────── components ───────────────────────── */

function ConsensusPill({ consensus }: { consensus: string }) {
  const color = CONSENSUS_COLOR[consensus] || 'var(--color-muted)'
  const label = consensus === 'mixed' ? 'Mixed signal' : consensus.charAt(0).toUpperCase() + consensus.slice(1)
  const Icon = consensus === 'bullish' ? ArrowUpRight : consensus === 'bearish' ? ArrowDownRight : Minus
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 33%, transparent)`,
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
      }}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
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
