'use client'

/**
 * Market Pulse — the market-internals band of the daily desk. Everything here
 * is EOD-derived analytics (SEBI-safe, labelled): the "what changed vs
 * yesterday" diff chips, composite Breadth Score, %-above-DMA participation,
 * 52-week new highs/lows, today's A/D, NIFTY realized vol vs India VIX
 * (options rich/cheap read), and FII/DII flow STREAKS — the reads static
 * screener sites don't compute.
 */

import useSWR from 'swr'
import { Activity, TrendingUp, TrendingDown } from '@/lib/icons'
import { api } from '@/lib/api'

const UP = 'var(--color-up)'
const DOWN = 'var(--color-down)'

type Pulse = Awaited<ReturnType<typeof api.screener.marketPulse>>

const fmtCr = (v: number) => {
  const a = Math.abs(v)
  const s = a >= 1000 ? `${(a / 1000).toFixed(1)}K` : `${Math.round(a)}`
  return `₹${s} Cr`
}

export default function MarketPulseCard() {
  const { data, isLoading } = useSWR<Pulse | null>(
    'mkt-pulse',
    () => api.screener.marketPulse().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 120_000, keepPreviousData: true, errorRetryCount: 4 },
  )

  if (isLoading && !data) return <div className="h-[210px] animate-pulse rounded-[20px] bg-wrap" />
  const b = data?.breadth
  if (!b) return null
  const vol = data?.vol
  const flows = data?.flows
  const pos = data?.positioning
  const delivery = data?.delivery
  const val = data?.valuation
  const diff = data?.diff ?? []

  const scoreColor =
    b.score == null ? 'var(--color-muted)'
    : b.score >= 55 ? UP
    : b.score >= 45 ? 'var(--color-highlight)'
    : DOWN

  return (
    <section aria-label="Market pulse" className="rounded-[20px] bg-wrap px-4 py-3.5 sm:px-5">
      {/* header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-d-text-primary">
          <Activity className="h-4 w-4 text-primary" /> Market Pulse
        </span>
        <span className="text-[10px] uppercase tracking-wider text-d-text-muted">
          EOD · derived · {b.as_of} · {b.coverage.symbols} stocks
        </span>
      </div>

      {/* what changed vs yesterday */}
      {diff.length > 0 && (
        <div className="mb-3.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Since yesterday
          </span>
          {diff.map((d) => (
            <span
              key={d.metric}
              title={d.detail}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-d-text-secondary"
            >
              {d.delta >= 0
                ? <TrendingUp className="h-3 w-3" style={{ color: UP }} />
                : <TrendingDown className="h-3 w-3" style={{ color: DOWN }} />}
              {d.label}
              <span className="numeric text-d-text-muted">{d.detail}</span>
            </span>
          ))}
        </div>
      )}

      {/* internals grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* breadth score */}
        <div className="rounded-xl border border-line bg-surface-2/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-d-text-muted">Breadth score</p>
          <p className="numeric mt-1 text-2xl font-bold" style={{ color: scoreColor }}>
            {b.score ?? '—'}
            <span className="ml-1 text-[11px] font-medium text-d-text-muted">/ 100</span>
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-main">
            <div className="h-full rounded-full" style={{ width: `${b.score ?? 0}%`, background: scoreColor }} />
          </div>
          <p className="mt-1 text-[11px] font-medium text-d-text-secondary">{b.band ?? '—'}</p>
        </div>

        {/* % above DMAs */}
        <div className="rounded-xl border border-line bg-surface-2/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-d-text-muted">Above DMA</p>
          <div className="mt-1.5 space-y-1.5">
            {([['20D', b.pct_above_20dma], ['50D', b.pct_above_50dma], ['200D', b.pct_above_200dma]] as const).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-8 text-[10px] text-d-text-muted">{k}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-main">
                  <div className="h-full rounded-full" style={{ width: `${v ?? 0}%`, background: (v ?? 0) >= 50 ? UP : DOWN, opacity: 0.85 }} />
                </div>
                <span className="numeric w-10 text-right text-[11px] text-d-text-secondary">{v != null ? `${v}%` : '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 52w highs/lows + A/D */}
        <div className="rounded-xl border border-line bg-surface-2/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-d-text-muted">52-week · today</p>
          <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11.5px]">
            <span className="text-d-text-muted">New highs</span>
            <span className="numeric text-right font-semibold" style={{ color: UP }}>{b.new_highs}</span>
            <span className="text-d-text-muted">New lows</span>
            <span className="numeric text-right font-semibold" style={{ color: DOWN }}>{b.new_lows}</span>
            <span className="text-d-text-muted">Adv / Dec</span>
            <span className="numeric text-right text-d-text-secondary">
              <span style={{ color: UP }}>{b.adv}</span> / <span style={{ color: DOWN }}>{b.dec}</span>
            </span>
          </div>
        </div>

        {/* vol read */}
        <div className="rounded-xl border border-line bg-surface-2/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-d-text-muted">Volatility</p>
          <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11.5px]">
            <span className="text-d-text-muted">India VIX</span>
            <span className="numeric text-right font-semibold text-d-text-primary">{vol?.vix ?? '—'}</span>
            <span className="text-d-text-muted">NIFTY HV20</span>
            <span className="numeric text-right text-d-text-secondary">{vol?.hv?.['20'] ?? '—'}</span>
          </div>
          {vol?.read && (
            <p className="mt-1.5 text-[10.5px] font-medium capitalize text-d-text-secondary">{vol.read}</p>
          )}
        </div>
      </div>

      {/* flow streaks + FII index-futures positioning */}
      {(flows?.fii || flows?.dii || pos) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Flow streaks
          </span>
          {flows?.fii && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px]">
              <span className="font-semibold text-d-text-primary">FII</span>
              <span style={{ color: flows.fii.side === 'buying' ? UP : DOWN }}>
                {flows.fii.side} {flows.fii.days} session{flows.fii.days === 1 ? '' : 's'}
              </span>
              <span className="numeric text-d-text-muted">
                {flows.fii.cum_cr < 0 ? '−' : '+'}{fmtCr(flows.fii.cum_cr)}
              </span>
            </span>
          )}
          {flows?.dii && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px]">
              <span className="font-semibold text-d-text-primary">DII</span>
              <span style={{ color: flows.dii.side === 'buying' ? UP : DOWN }}>
                {flows.dii.side} {flows.dii.days} session{flows.dii.days === 1 ? '' : 's'}
              </span>
              <span className="numeric text-d-text-muted">
                {flows.dii.cum_cr < 0 ? '−' : '+'}{fmtCr(flows.dii.cum_cr)}
              </span>
            </span>
          )}
          {pos && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px]"
              title={`${pos.label} · long ${pos.long.toLocaleString('en-IN')} / short ${pos.short.toLocaleString('en-IN')} contracts · ${pos.date}`}
            >
              <span className="font-semibold text-d-text-primary">FII index futures</span>
              <span style={{ color: pos.net >= 0 ? UP : DOWN }}>
                net {pos.net >= 0 ? 'long' : 'short'} {Math.abs(pos.net).toLocaleString('en-IN')}
              </span>
              <span className="numeric text-d-text-muted">{pos.long_share_pct}% long</span>
              {pos.net_delta != null && pos.net_delta !== 0 && (
                <span className="numeric" style={{ color: pos.net_delta >= 0 ? UP : DOWN }}>
                  {pos.net_delta > 0 ? '▲' : '▼'} {Math.abs(pos.net_delta).toLocaleString('en-IN')}
                </span>
              )}
            </span>
          )}
          <span className="ml-auto text-[10px] text-d-text-muted">NSE · EOD provisional / published</span>
        </div>
      )}

      {/* delivery accumulation — strong-hands read from EOD delivery data */}
      {(delivery?.spikes?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted"
            title={delivery!.note}
          >
            Delivery accumulation
          </span>
          {delivery!.spikes.map((s) => (
            <span
              key={s.symbol}
              title={`Delivery ${s.delivery_pct}% vs 30-session avg ${s.avg_30d}% · price ${s.change_pct >= 0 ? '+' : ''}${s.change_pct}%`}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px]"
            >
              <span className="font-semibold text-d-text-primary">{s.symbol}</span>
              <span className="numeric" style={{ color: UP }}>{s.delivery_pct}%</span>
              <span className="numeric text-d-text-muted">avg {s.avg_30d}%</span>
            </span>
          ))}
          {delivery!.accumulation_count > delivery!.spikes.length && (
            <span className="text-[10.5px] text-d-text-muted">+{delivery!.accumulation_count - delivery!.spikes.length} more</span>
          )}
          <span className="ml-auto text-[10px] text-d-text-muted">EOD · derived</span>
        </div>
      )}

      {/* valuation snapshot — the investor shelf (published P/E, derived medians) */}
      {val && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[11px]" title={val.label}>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">Valuation</span>
          {val.nifty50_median_pe != null && (
            <span className="text-d-text-secondary">NIFTY 50 median P/E <span className="numeric font-semibold text-d-text-primary">{val.nifty50_median_pe}×</span></span>
          )}
          {val.nifty500_median_pe != null && (
            <span className="text-d-text-secondary">NIFTY 500 <span className="numeric font-semibold text-d-text-primary">{val.nifty500_median_pe}×</span></span>
          )}
          <span className="text-d-text-secondary">above 50× <span className="numeric" style={{ color: DOWN }}>{val.pct_above_50x}%</span></span>
          <span className="text-d-text-secondary">below 15× <span className="numeric" style={{ color: UP }}>{val.pct_below_15x}%</span></span>
          <span className="ml-auto text-[10px] text-d-text-muted">NSE P/E file · {val.coverage.toLocaleString('en-IN')} stocks</span>
        </div>
      )}
    </section>
  )
}
