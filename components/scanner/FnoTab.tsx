'use client'

/**
 * FnoTab (PR-S19) — F&O index option-chain snapshot + strategy suggestions.
 *
 * Surfaces verified F&O metrics (Max Pain, PCR, IV ATM, top OI strikes,
 * VIX regime) for Nifty / BankNifty / FinNifty / MidcapSelect in one
 * dashboard. Rule-based strategy suggestions (Iron Condor / Short Strangle
 * / Calendar / debit spread / Max-Pain pull) fire from the snapshot +
 * current India VIX.
 *
 * Data source: admin Kite option chain (public-safe, no per-user broker).
 * Lot sizes follow the Jan 2026 NSE revision (Nifty=65, BankNifty=30).
 *
 * Per memory locks:
 *   - LLMs do NOT gate trades — strategy suggestions are descriptive only
 *   - No fallbacks: when option chain is offline we show a clear error,
 *     not synthetic/mocked data
 */

import { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import {
  AlertTriangle,
  Layers,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from '@/lib/icons'

import { Badge, Button, EmptyState, Skeleton } from '@/components/foundation'
import OptionsFlowCard from '@/components/fno/OptionsFlowCard'
import { api, handleApiError, type FnoIndexSnapshot, type FnoStrategy } from '@/lib/api'
import OptionsCopilotCard from '@/components/fno/OptionsCopilotCard'

const INDICES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'] as const

const PCR_TAG_TONE: Record<string, string> = {
  extreme_bullish: 'border-up bg-up/10 text-up',
  bullish: 'border-up/60 bg-up/5 text-up',
  normal: 'border-line bg-main text-d-text-secondary',
  bearish: 'border-down/60 bg-down/5 text-down',
  extreme_bearish: 'border-down bg-down/10 text-down',
}

const REGIME_TONE: Record<string, string> = {
  complacent: 'bg-warning/10 text-warning border-warning/40',
  normal: 'bg-primary/10 text-primary border-primary/40',
  elevated: 'bg-up/10 text-up border-up/40',
  stressed: 'bg-down/10 text-down border-down/40',
  unknown: 'bg-d-text-muted/10 text-d-text-muted border-line',
}


export default function FnoTab() {
  const [selectedIndex, setSelectedIndex] = useState<(typeof INDICES)[number]>('NIFTY')

  const { data: allSnap, error: allErr, isLoading: allLoading, mutate: refreshAll } = useSWR(
    'fno_snapshot_all',
    () => api.screener.fnoSnapshotAll(),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  const { data: detail, error: detailErr, isLoading: detailLoading, mutate: refreshDetail } = useSWR(
    ['fno_snapshot', selectedIndex],
    () => api.screener.fnoSnapshot(selectedIndex, true),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  const refresh = useCallback(() => { void refreshAll(); void refreshDetail() }, [refreshAll, refreshDetail])

  if (allErr) {
    return (
      <EmptyState
        tone="error"
        icon={<AlertTriangle className="h-6 w-6" />}
        title="F&O snapshot unavailable"
        description={handleApiError(allErr)}
        action={<Button onClick={refresh}>Retry</Button>}
      />
    )
  }

  if (allSnap && !allSnap.any_live) {
    return (
      <EmptyState
        tone="warning"
        icon={<Layers className="h-6 w-6" />}
        title="Option chain provider offline"
        description="The admin Kite F&O feed is down. F&O snapshots return once it's restored."
        action={<Button onClick={refresh}>Retry</Button>}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Index selector + refresh */}
      <div className="flex flex-wrap items-center gap-2 rounded-full border border-line bg-wrap/60 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">Index</span>
        {INDICES.map((idx) => {
          const snap = allSnap?.indices?.[idx]
          const active = selectedIndex === idx
          const offline = allSnap && snap == null
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              disabled={offline ?? false}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? 'glass-control-accent'
                  : 'glass-control text-d-text-secondary hover:text-d-text-primary'
              } ${offline ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {idx}
              {offline && <span className="ml-1 text-[10px]">(off)</span>}
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-2 text-[10px] text-d-text-muted">
          {detail?.india_vix != null && (
            <Badge tone="muted">VIX · {detail.india_vix.toFixed(2)}</Badge>
          )}
          {detail?.regime && (
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] capitalize ${REGIME_TONE[detail.regime] || REGIME_TONE.normal}`}>
              {detail.regime}
            </span>
          )}
          <Button size="sm" variant="ghost" onClick={refresh} aria-label="Refresh">
            <RefreshCw className={`h-3.5 w-3.5 ${(allLoading || detailLoading) ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 4-up summary cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {INDICES.map((idx) => (
          <SnapshotCard
            key={idx}
            symbol={idx}
            snap={allSnap?.indices?.[idx] ?? null}
            loading={allLoading && !allSnap}
            isSelected={selectedIndex === idx}
            onClick={() => setSelectedIndex(idx)}
          />
        ))}
      </div>

      {/* Consolidated options-flow card (writing balance / PCR / max-pain / lean) */}
      <OptionsFlowCard />

      {/* Options Teacher — deterministic plain-English read (0 LLM tokens) */}
      {detail?.teach?.length ? (
        <section className="rounded-[20px] border border-line bg-wrap p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-[12px] font-semibold text-d-text-primary">
              What this means · {selectedIndex}
            </h3>
          </div>
          <ul className="space-y-1.5">
            {detail.teach.map((line, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-d-text-secondary">
                <span className="mt-0.5 text-primary">•</span>{line}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* AI Options Copilot — best-trade wrapper over the rule-based suggester */}
      <OptionsCopilotCard />

      {/* Strategy suggestions for the selected index */}
      <section className="space-y-2">
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-d-text-primary">
            Strategy suggestions · {selectedIndex}
          </h3>
          <span className="text-[10px] text-d-text-muted">
            Descriptive — not trade recommendations. AutoPilot routing is opt-in (Phase 3).
          </span>
        </header>
        {detailErr ? (
          <EmptyState
            tone="error"
            icon={<AlertTriangle className="h-6 w-6" />}
            title="Strategy suggestions failed"
            description={handleApiError(detailErr)}
            size="sm"
          />
        ) : detailLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} w="100%" h="80px" />
            ))}
          </div>
        ) : detail?.strategies?.length ? (
          <ul className="space-y-2">
            {detail.strategies.map((s, i) => <StrategyRow key={`${s.name}_${i}`} s={s} />)}
          </ul>
        ) : (
          <div className="tile-tint px-6 py-8">
            <Image
              src="/v4/illus/screener.png"
              alt=""
              aria-hidden
              width={220}
              height={220}
              sizes="220px"
              className="mx-auto mb-2 w-full max-w-[220px] rounded-2xl"
            />
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="No strategy hits right now"
              description="VIX regime + PCR + IV configuration didn't trigger any rule."
              size="sm"
            />
          </div>
        )}
      </section>
    </div>
  )
}


function SnapshotCard({
  symbol, snap, loading, isSelected, onClick,
}: {
  symbol: string
  snap: FnoIndexSnapshot | null
  loading: boolean
  isSelected: boolean
  onClick: () => void
}) {
  if (loading) {
    return (
      <div className="rounded-[20px] border border-line bg-wrap p-4">
        <Skeleton w="100%" h="120px" />
      </div>
    )
  }
  if (!snap) {
    return (
      <div className="rounded-[20px] border border-line bg-wrap p-4 opacity-60">
        <p className="text-xs font-medium text-d-text-primary">{symbol}</p>
        <p className="mt-1 text-[10px] text-d-text-muted">Snapshot unavailable.</p>
      </div>
    )
  }
  const pcrTone = PCR_TAG_TONE[snap.pcr_tag] || PCR_TAG_TONE.normal
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[20px] border bg-wrap p-4 text-left transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-line hover:border-wrap-line'
      }`}
    >
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-d-text-secondary">{snap.symbol}</p>
        <span className="font-mono text-[10px] text-d-text-muted">{snap.days_to_expiry ?? '—'} DTE</span>
      </div>
      <p className="mt-1 font-mono text-lg font-medium tabular-nums text-d-text-primary">
        ₹{snap.spot.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-d-text-muted">PCR</p>
          <p className="font-mono tabular-nums">{snap.pcr_oi.toFixed(2)}</p>
          <span className={`mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[9px] capitalize ${pcrTone}`}>
            {snap.pcr_tag.replace('_', ' ')}
          </span>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-d-text-muted">Max Pain</p>
          <p className="font-mono tabular-nums">
            {snap.max_pain != null ? snap.max_pain.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
          </p>
          {snap.max_pain_distance_pct != null && (
            <p className={`font-mono text-[10px] ${snap.max_pain_distance_pct > 0 ? 'text-down' : 'text-up'}`}>
              {snap.max_pain_distance_pct > 0 ? '▼' : '▲'} {Math.abs(snap.max_pain_distance_pct).toFixed(1)}%
            </p>
          )}
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-d-text-muted">IV ATM</p>
          <p className="font-mono tabular-nums">
            {snap.iv_atm != null ? (snap.iv_atm * 100).toFixed(1) + '%' : '—'}
          </p>
          {snap.hv?.hv?.['20'] != null && (
            <p className="font-mono text-[9px] text-d-text-muted">
              HV(20) {snap.hv.hv['20'].toFixed(1)}%
            </p>
          )}
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-d-text-muted">IV Rank</p>
          <p className="font-mono tabular-nums">
            {snap.iv_rank != null ? snap.iv_rank.toFixed(0) : '—'}
            {snap.iv_percentile != null && (
              <span className="ml-1 text-[9px] text-d-text-muted">· {snap.iv_percentile.toFixed(0)}%ile</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-d-text-muted">Top Strikes</p>
          <p className="font-mono text-[10px] text-up">
            S: {snap.top_put_oi_strikes.slice(0, 2).map((v) => v.toFixed(0)).join(', ') || '—'}
          </p>
          <p className="font-mono text-[10px] text-down">
            R: {snap.top_call_oi_strikes.slice(0, 2).map((v) => v.toFixed(0)).join(', ') || '—'}
          </p>
        </div>
      </div>
      {snap.pull_to_max_pain_signal && (
        <div className="mt-2 rounded-full border border-primary/40 bg-primary/5 px-2.5 py-1 text-[10px] text-primary">
          🎯 Pull-to-MaxPain signal active
        </div>
      )}
    </button>
  )
}


function StrategyRow({ s }: { s: FnoStrategy }) {
  const biasIcon =
    s.bias === 'bullish' ? <TrendingUp className="h-3.5 w-3.5 text-up" />
      : s.bias === 'bearish' ? <TrendingDown className="h-3.5 w-3.5 text-down" />
        : <Layers className="h-3.5 w-3.5 text-d-text-muted" />
  const confTone =
    s.confidence === 'high' ? 'border-up bg-up/10 text-up'
      : s.confidence === 'medium' ? 'border-primary/60 bg-primary/5 text-primary'
        : 'border-line bg-main text-d-text-muted'
  return (
    <li className="rounded-[20px] border border-line bg-wrap p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          {biasIcon}
          <span className="text-sm font-medium text-d-text-primary">{s.name}</span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] capitalize ${confTone}`}>
            {s.confidence}
          </span>
        </div>
        {s.margin_estimate_inr != null && (
          <span className="font-mono text-[11px] text-d-text-secondary">
            ~₹{(s.margin_estimate_inr / 1000).toFixed(0)}k margin
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-d-text-secondary">{s.rationale}</p>
      {s.suggested_legs.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[11px] text-d-text-secondary">
          {s.suggested_legs.map((leg, i) => (
            <li key={i} className="font-mono">• {leg}</li>
          ))}
        </ul>
      )}
      {s.risk_notes.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-t border-line/60 pt-2 text-[10px] text-d-text-muted">
          {s.risk_notes.map((r, i) => (
            <li key={i}>⚠ {r}</li>
          ))}
        </ul>
      )}
      {s.source_label && (
        <p className="mt-1 text-[9px] text-d-text-muted opacity-70">{s.source_label}</p>
      )}
    </li>
  )
}
