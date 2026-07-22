'use client'

/**
 * Technicals & Levels — the full technical system for one symbol (2026-07-21).
 *
 * Replaces the thin KeyLevels (SMA/MACD-only) card AND the separate
 * IndicatorInterpreter card with one dense, decision-grade panel:
 *
 *   · Technical-sentiment gauge — every oscillator + MA votes, tallied
 *     into bullish / bearish / neutral counts and a label
 *   · Oscillator suite with a plain read per indicator
 *   · Every moving average with its price-vs-MA vote and distance
 *   · Levels: KDE-clustered swing support/resistance (touch counts +
 *     distance), classic floor pivots (S3→R3), 52-week anchors, ATR
 *   · Candlestick patterns detected on the last bar
 *
 * Deterministic, EOD settled data, day-cached server-side. Analysis
 * language only (bullish/bearish/neutral) — never buy/sell.
 */

import useSWR from 'swr'
import { Gauge } from '@/lib/icons'

import { api } from '@/lib/api'

const VOTE_CLASS: Record<string, string> = {
  bullish: 'text-up',
  bearish: 'text-down',
  neutral: 'text-d-text-muted',
}

const UP = 'var(--color-up)'
const DOWN = 'var(--color-down)'
const MUTED = 'var(--color-muted)'

/** Bounded ranges for the oscillator position meters. */
const OSC_RANGE: Record<string, [number, number]> = {
  rsi: [0, 100], stoch: [0, 100], mfi: [0, 100],
  willr: [-100, 0], cci: [-250, 250],
}

/** Thin meter track with a position dot — the oscillator's place in its range. */
function OscMeter({ k, value, vote }: { k: string; value: number; vote: string }) {
  const range = OSC_RANGE[k]
  if (!range) return null
  const pct = Math.max(2, Math.min(98, ((value - range[0]) / (range[1] - range[0])) * 100))
  const tone = vote === 'bullish' ? UP : vote === 'bearish' ? DOWN : MUTED
  return (
    <span className="relative mt-[5px] block h-[3px] w-full rounded-full bg-d-border">
      <span
        className="absolute top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-full"
        style={{ left: `calc(${pct}% - 3px)`, background: tone }}
      />
    </span>
  )
}

/** Signed distance bar from a center line — for price-vs-MA distance. */
function DistBar({ pct, tone }: { pct: number; tone: string }) {
  const mag = Math.max(3, Math.min(50, (Math.abs(pct) / 6) * 50))
  return (
    <span className="relative mt-[5px] block h-[3px] w-full rounded-full bg-d-border">
      <span className="absolute inset-y-0 left-1/2 w-px bg-d-text-muted/40" />
      <span
        className="absolute inset-y-0 rounded-full"
        style={{ background: tone, left: pct >= 0 ? '50%' : `${50 - mag}%`, width: `${mag}%` }}
      />
    </span>
  )
}

function SentimentBadge({ s }: { s: { bullish: number; bearish: number; neutral: number; label: string } }) {
  const tone =
    s.label.includes('bullish') ? 'text-up' : s.label.includes('bearish') ? 'text-down' : 'text-d-text-primary'
  const tot = s.bullish + s.bearish + s.neutral || 1
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex items-baseline gap-2 font-mono text-[11px]">
        <span className={`font-semibold uppercase tracking-wider ${tone}`}>{s.label}</span>
        <span className="text-d-text-muted">
          <span className="text-up">{s.bullish}↑</span> · <span className="text-down">{s.bearish}↓</span> ·{' '}
          {s.neutral}→
        </span>
      </span>
      {/* segmented vote meter */}
      <span className="flex h-[5px] w-40 gap-px overflow-hidden rounded-full">
        <span style={{ width: `${(s.bullish / tot) * 100}%`, background: UP }} />
        <span style={{ width: `${(s.neutral / tot) * 100}%`, background: MUTED, opacity: 0.5 }} />
        <span style={{ width: `${(s.bearish / tot) * 100}%`, background: DOWN }} />
      </span>
    </span>
  )
}

function ColHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.1em] text-d-text-muted">{children}</div>
  )
}

export default function TechnicalsPanelCard({ symbol }: { symbol: string }) {
  const { data, isLoading } = useSWR(
    `tech-panel:${symbol}`,
    () => api.screener.technicalPanel(symbol).catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  )

  if (isLoading) return <div className="h-72 animate-pulse rounded-[20px] border border-line bg-wrap" />

  if (!data || !data.available) {
    return (
      <div className="rounded-[20px] border border-line bg-wrap px-4 py-3">
        <span className="text-[12px] font-semibold text-d-text-primary">Technicals &amp; Levels</span>
        <p className="mt-1 text-[11px] text-d-text-muted">
          Not enough price history to compute the technical panel for {symbol}.
        </p>
      </div>
    )
  }

  const { summary, oscillators = [], moving_averages: mas = [], pivots, supports = [], resistances = [], week52, atr, candle_patterns: patterns = [] } = data

  return (
    <div className="rounded-[20px] border border-line bg-wrap px-4 py-4">
      {/* Header — title + overall technical sentiment */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          <span className="text-[13px] font-semibold text-d-text-primary">Technicals &amp; Levels</span>
          {data.as_of && <span className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">EOD · {data.as_of}</span>}
        </div>
        {summary && <SentimentBadge s={summary.overall} />}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* ── Oscillators ── */}
        <div>
          <ColHeader>
            Oscillators{summary ? <span className="ml-2 normal-case">{summary.oscillators.label}</span> : null}
          </ColHeader>
          <div className="space-y-2">
            {oscillators.map((o) => (
              <div key={o.key} className="text-[12px]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-d-text-secondary">{o.label}</span>
                  <span className="flex items-baseline gap-2 text-right">
                    <span className="numeric font-medium text-d-text-primary">{o.value}</span>
                    <span className={`w-[86px] truncate text-[10px] ${VOTE_CLASS[o.vote] ?? ''}`} title={o.read}>
                      {o.read}
                    </span>
                  </span>
                </div>
                <OscMeter k={o.key} value={o.value} vote={o.vote} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Moving averages ── */}
        <div>
          <ColHeader>
            Moving averages{summary ? <span className="ml-2 normal-case">{summary.moving_averages.label}</span> : null}
          </ColHeader>
          <div className="space-y-2">
            {mas.map((m) => (
              <div key={m.key} className="text-[12px]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-d-text-secondary">{m.label}</span>
                  <span className="flex items-baseline gap-2 text-right">
                    <span className="numeric font-medium text-d-text-primary">₹{m.value.toLocaleString('en-IN')}</span>
                    <span className={`w-[64px] text-[10px] ${VOTE_CLASS[m.vote]}`}>
                      {m.vote === 'bullish' ? 'above' : 'below'} {m.dist_pct >= 0 ? '+' : ''}{m.dist_pct.toFixed(1)}%
                    </span>
                  </span>
                </div>
                <DistBar pct={m.dist_pct} tone={m.vote === 'bullish' ? UP : DOWN} />
              </div>
            ))}
          </div>
          {data.golden_cross != null && (
            <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
              50/200 cross:{' '}
              <span className={data.golden_cross ? 'text-up' : 'text-down'}>
                {data.golden_cross ? 'golden (50 > 200)' : 'death (50 < 200)'}
              </span>
            </p>
          )}
        </div>

        {/* ── Levels ── */}
        <div>
          <ColHeader>Support &amp; resistance · swing clusters</ColHeader>
          <div className="space-y-1">
            {[...resistances].reverse().map((r) => (
              <div key={`r${r.price}`} className="text-[12px]">
                <div className="flex items-baseline justify-between">
                  <span className="text-down">R · ₹{r.price.toLocaleString('en-IN')}</span>
                  <span className="font-mono text-[10px] text-d-text-muted">
                    {r.touches}× · {r.dist_pct >= 0 ? '+' : ''}{r.dist_pct.toFixed(1)}%
                  </span>
                </div>
                <DistBar pct={Math.abs(r.dist_pct)} tone={DOWN} />
              </div>
            ))}
            {data.price != null && (
              <div className="flex items-baseline justify-between border-y border-line py-1 text-[12px]">
                <span className="font-semibold text-d-text-primary">Price · ₹{data.price.toLocaleString('en-IN')}</span>
                {atr?.pct != null && (
                  <span className="font-mono text-[10px] text-d-text-muted">ATR {atr.pct.toFixed(1)}%/d</span>
                )}
              </div>
            )}
            {supports.map((s) => (
              <div key={`s${s.price}`} className="text-[12px]">
                <div className="flex items-baseline justify-between">
                  <span className="text-up">S · ₹{s.price.toLocaleString('en-IN')}</span>
                  <span className="font-mono text-[10px] text-d-text-muted">
                    {s.touches}× · {s.dist_pct.toFixed(1)}%
                  </span>
                </div>
                <DistBar pct={-Math.abs(s.dist_pct)} tone={UP} />
              </div>
            ))}
          </div>

          {pivots && (
            <div className="mt-3">
              <ColHeader>Floor pivots · next session</ColHeader>
              <div className="grid grid-cols-4 gap-x-2 gap-y-0.5 font-mono text-[10px] tabular-nums">
                <span className="text-d-text-muted">P</span>
                <span className="col-span-3 text-d-text-primary">₹{pivots.p.toLocaleString('en-IN')}</span>
                <span className="text-down">R1·R2</span>
                <span className="col-span-3 text-d-text-secondary">
                  ₹{pivots.r1.toLocaleString('en-IN')} · ₹{pivots.r2.toLocaleString('en-IN')}
                </span>
                <span className="text-up">S1·S2</span>
                <span className="col-span-3 text-d-text-secondary">
                  ₹{pivots.s1.toLocaleString('en-IN')} · ₹{pivots.s2.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {week52 && (week52.high != null || week52.low != null) && (
            <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
              52W ₹{week52.low?.toLocaleString('en-IN') ?? '—'} → ₹{week52.high?.toLocaleString('en-IN') ?? '—'}
            </p>
          )}
        </div>
      </div>

      {/* Footer — candle patterns + honesty note */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {patterns.length > 0 ? (
            <>
              <span className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">Candles:</span>
              {patterns.map((p) => (
                <span key={p} className="rounded-pill border border-d-border bg-d-bg-subtle px-2 py-0.5 text-[10px] capitalize text-d-text-secondary">
                  {p}
                </span>
              ))}
            </>
          ) : (
            <span className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
              No reversal candle on the last bar
            </span>
          )}
        </div>
        <span className="text-[10px] text-d-text-muted">{data.note}</span>
      </div>
    </div>
  )
}
