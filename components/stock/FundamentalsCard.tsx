'use client'

/**
 * FundamentalsCard (PR-S23) — beginner→advanced fundamentals surface.
 *
 * Reads the populated `fundamentals_history` table (live screener.in
 * fallback) via the public `api.screener.fundamentals(symbol)` endpoint
 * and renders a glass bento that a BEGINNER can read ("what this means")
 * and an ADVANCED investor respects (P/E, ROE, ROCE, growth, dividend
 * yield, promoter holding).
 *
 * Mirrors DerivativesAnalysis.tsx / OrderFlowAnalysis.tsx: glass
 * `lg-surface` cards, text-up / text-down / text-d-text-* tokens, the
 * Plain / InfoDot / CardShell helper pattern, honest-empty + skeleton
 * states. No raw hex in className — bars use var(--color-*).
 *
 * 2026-07-21: the Beginner⟷Pro toggle is GONE — one view shows all the
 * data with the plain-language read under each number. Data comes via the
 * same SWR key the page header uses, so header P/E + Mkt Cap and this
 * card can never disagree.
 */

import { useState } from 'react'
import useSWR from 'swr'
import {
  Banknote,
  Coins,
  Gauge,
  HelpCircle,
  Info,
  Landmark,
  Percent,
  ScrollText,
  TrendingUp,
  Users,
} from '@/lib/icons'

import { api } from '@/lib/api'

type FundamentalsData = Awaited<ReturnType<typeof api.screener.fundamentals>>
type Fundamentals = NonNullable<FundamentalsData['fundamentals']>

// ── helpers ─────────────────────────────────────────────────────────
// A metric's tone bucket → text colour class + bar colour var + a one-word read.
type Tone = { cls: string; bar: string }
const UP: Tone = { cls: 'text-up', bar: 'var(--color-up)' }
const NEUTRAL: Tone = { cls: 'text-d-text-primary', bar: 'var(--color-warning)' }
const WARN: Tone = { cls: 'text-warning', bar: 'var(--color-warning)' }
const DOWN: Tone = { cls: 'text-down', bar: 'var(--color-down)' }

// ₹ value already in crore — compact Indian L Cr / Cr.
const fmtCr = (n: number | null | undefined): string => {
  if (n == null) return '—'
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)}L Cr`
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K Cr`
  return `${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`
}

const fmtNum = (n: number | null | undefined, d = 1): string =>
  n == null ? '—' : n.toLocaleString('en-IN', { maximumFractionDigits: d })

const fmtInr = (n: number | null | undefined): string =>
  n == null ? '—' : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

// Tiny info popover — click to toggle a plain-language definition.
function InfoDot({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        aria-label="What does this mean?"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-line text-d-text-muted transition-colors hover:text-d-text-primary"
      >
        <HelpCircle className="h-2.5 w-2.5" />
      </button>
      {open && (
        <span className="absolute right-0 top-5 z-20 w-56 rounded-lg border border-d-border bg-wrap p-2.5 text-[10.5px] leading-snug text-d-text-secondary shadow-lg">
          {text}
        </span>
      )}
    </span>
  )
}

function CardShell({
  icon: Icon,
  title,
  right,
  className = '',
  children,
}: {
  icon: React.ElementType
  title: string
  right?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`lg-surface rounded-[20px] p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-d-text-muted">
          <Icon className="h-3.5 w-3.5" /> {title}
        </h3>
        {right}
      </div>
      {children}
    </div>
  )
}

// Plain-language line — always shown (one view, all the data).
function Plain({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 flex gap-1.5 text-[11.5px] leading-snug text-d-text-secondary">
      <Info className="mt-[2px] h-3 w-3 shrink-0 text-primary" />
      <span>{children}</span>
    </p>
  )
}

// A single metric tile — big value + tone-scaled meter bar + plain-language
// one-liner. `meterPct` (0-100) positions the metric on its healthy range.
function MetricTile({
  icon: Icon,
  label,
  value,
  tone,
  info,
  meterPct,
  children,
}: {
  icon: React.ElementType
  label: string
  value: string
  tone: Tone
  info?: string
  meterPct?: number | null
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-2/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-d-text-muted">
          <Icon className="h-3 w-3" /> {label}
        </span>
        {info ? <InfoDot text={info} /> : null}
      </div>
      <div className={`numeric mt-1 text-[22px] font-bold leading-none ${tone.cls}`}>{value}</div>
      {meterPct != null && (
        <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-d-border">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.max(3, Math.min(100, meterPct))}%`, background: tone.bar }}
          />
        </div>
      )}
      <Plain>{children}</Plain>
    </div>
  )
}

// Meter positions — where the value sits on a sensible display range.
const peMeter = (v: number) => (1 - Math.min(v, 60) / 60) * 100          // lower P/E = fuller bar
const retMeter = (v: number) => (Math.min(Math.max(v, 0), 30) / 30) * 100 // ROE/ROCE 0-30%
const growthMeter = (v: number) => ((Math.min(Math.max(v, -10), 30) + 10) / 40) * 100
const dyMeter = (v: number) => (Math.min(Math.max(v, 0), 5) / 5) * 100
const promMeter = (v: number) => (Math.min(Math.max(v, 0), 75) / 75) * 100

// ── tone resolvers (thresholds per spec) ──
const peTone = (v: number): Tone => (v < 15 ? UP : v <= 25 ? NEUTRAL : v <= 40 ? WARN : DOWN)
const peWord = (v: number): string =>
  v < 15 ? 'cheap' : v <= 25 ? 'fairly priced' : v <= 40 ? 'rich' : 'expensive'

const roeTone = (v: number): Tone => (v > 20 ? UP : v >= 15 ? UP : v >= 10 ? NEUTRAL : DOWN)
const roeWord = (v: number): string =>
  v > 20 ? 'exceptional' : v >= 15 ? 'strong' : v >= 10 ? 'average' : 'weak'

const roceTone = (v: number): Tone => (v > 20 ? UP : v >= 15 ? UP : NEUTRAL)
const roceWord = (v: number): string => (v > 20 ? 'high' : v >= 15 ? 'good' : 'average')

const growthTone = (v: number): Tone => (v > 15 ? UP : v >= 8 ? NEUTRAL : v >= 0 ? WARN : DOWN)
const growthWord = (v: number): string =>
  v > 15 ? 'strong' : v >= 8 ? 'moderate' : v >= 0 ? 'slow' : 'declining'

const dyTone = (v: number): Tone => (v > 3 ? UP : v >= 1 ? NEUTRAL : DOWN)
const dyWord = (v: number): string => (v > 3 ? 'high-income' : v >= 1 ? 'moderate' : 'low')

const promTone = (v: number): Tone => (v > 50 ? UP : v >= 25 ? NEUTRAL : DOWN)
const promWord = (v: number): string => (v > 50 ? 'high' : v >= 25 ? 'moderate' : 'low')

// One-line quality verdict from ROE + growth + P/E.
function qualityVerdict(f: Fundamentals): { text: string; cls: string } {
  const roe = f.roe
  const pg = f.profit_growth
  const pe = f.pe
  if (roe != null && roe < 10)
    return { text: 'Modest returns on capital — quality looks below average.', cls: 'text-down' }
  if (roe != null && roe > 20 && pg != null && pg > 10) {
    if (pe != null && pe > 35)
      return {
        text: 'High-quality, profitable compounder — but richly valued.',
        cls: 'text-warning',
      }
    return { text: 'High-quality, profitable compounder.', cls: 'text-up' }
  }
  if (pe != null && pe > 35)
    return { text: 'Decent business, but the stock is richly valued.', cls: 'text-warning' }
  if (roe != null && roe >= 15)
    return { text: 'Solid, well-run business with healthy returns.', cls: 'text-up' }
  return { text: 'Mixed quality — read each metric below before deciding.', cls: 'text-d-text-primary' }
}

export default function FundamentalsCard({ symbol }: { symbol: string }) {
  const sym = (symbol || '').trim().toUpperCase()
  // Same SWR key as the page header's Mkt Cap / P/E stats — one fetch,
  // one source of truth for the whole page.
  const { data, isLoading: loading } = useSWR(
    sym ? `fundamentals:${sym}` : null,
    () => api.screener.fundamentals(sym).catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  )
  const error = !loading && data === null

  const f = data?.fundamentals ?? null
  const hasData = !!f
  const verdict = f ? qualityVerdict(f) : null
  // promoter: only meaningful when present AND > 0 (banks/widely-held → null/0).
  const showProm = f?.promoter_pct != null && f.promoter_pct > 0

  return (
    <div className="space-y-4">
      {/* ── HEADER ROW ─────────────────────────────────────────── */}
      <div className="lg-surface rounded-[20px] p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[18px] font-bold tracking-tight text-d-text-primary">
              <Landmark className="h-4 w-4 text-primary" /> Fundamentals
              {data?.as_of ? (
                <span className="text-[11.5px] font-normal text-d-text-muted">· {data.as_of}</span>
              ) : null}
            </h2>
            <div className="mt-0.5 text-[11.5px] text-d-text-muted">
              Is this a quality business — and is the price fair?
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data?.source ? (
              <span className="rounded-full border border-line bg-surface-2 px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider text-d-text-muted">
                {data.source}
              </span>
            ) : null}
          </div>
        </div>

        {/* one-line quality verdict */}
        <div className="mt-3 border-t border-d-border pt-3">
          {loading ? (
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
          ) : verdict ? (
            <p className={`text-[13px] font-medium leading-snug ${verdict.cls}`}>{verdict.text}</p>
          ) : (
            <p className="text-[13px] font-medium leading-snug text-d-text-muted">
              {error ? `Couldn’t load fundamentals for ${symbol}.` : `Fundamentals not available for ${symbol} yet.`}
            </p>
          )}
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </div>
      ) : !hasData || !f ? (
        <div className="lg-surface rounded-[20px] p-6 text-center text-[12px] text-d-text-muted">
          Fundamentals not available for {symbol} yet.
        </div>
      ) : (
        <>
          {/* ── METRIC GRID ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* P/E — valuation */}
            {f.pe != null && (
              <MetricTile
                icon={Gauge}
                label="P/E · valuation"
                value={fmtNum(f.pe, 1)}
                tone={peTone(f.pe)}
                meterPct={peMeter(f.pe)}

                info="Price-to-Earnings — how many rupees you pay for ₹1 of yearly profit. Lower is cheaper; very high means the market expects fast growth."
              >
                You pay ₹{fmtNum(f.pe, 1)} per ₹1 of annual profit — <strong>{peWord(f.pe)}</strong>.
              </MetricTile>
            )}

            {/* ROE — profitability */}
            {f.roe != null && (
              <MetricTile
                icon={Percent}
                label="ROE · profitability"
                value={`${fmtNum(f.roe, 1)}%`}
                tone={roeTone(f.roe)}
                meterPct={retMeter(f.roe)}

                info="Return on Equity — profit generated for every ₹100 of shareholder money. Above 15% is strong, above 20% is exceptional."
              >
                Generates ₹{fmtNum(f.roe, 1)} profit per ₹100 of shareholder money —{' '}
                <strong>{roeWord(f.roe)}</strong>.
              </MetricTile>
            )}

            {/* ROCE — capital quality */}
            {f.roce != null && (
              <MetricTile
                icon={TrendingUp}
                label="ROCE · capital quality"
                value={`${fmtNum(f.roce, 1)}%`}
                tone={roceTone(f.roce)}
                meterPct={retMeter(f.roce)}

                info="Return on Capital Employed — how efficiently the business uses ALL its capital (equity + debt). Above 20% signals a high-quality compounder."
              >
                Earns ₹{fmtNum(f.roce, 1)} on every ₹100 of total capital deployed —{' '}
                <strong>{roceWord(f.roce)}</strong> capital efficiency.
              </MetricTile>
            )}

            {/* Sales growth */}
            {f.sales_growth != null && (
              <MetricTile
                icon={TrendingUp}
                label="Sales growth"
                value={`${fmtNum(f.sales_growth, 1)}%`}
                tone={growthTone(f.sales_growth)}
                meterPct={growthMeter(f.sales_growth)}

                info="How fast revenue is growing (compounded). Above 15% is strong top-line momentum; negative means the business is shrinking."
              >
                Revenue is growing <strong>{growthWord(f.sales_growth)}</strong> at {fmtNum(f.sales_growth, 1)}% a
                year.
              </MetricTile>
            )}

            {/* Profit growth */}
            {f.profit_growth != null && (
              <MetricTile
                icon={TrendingUp}
                label="Profit growth"
                value={`${fmtNum(f.profit_growth, 1)}%`}
                tone={growthTone(f.profit_growth)}
                meterPct={growthMeter(f.profit_growth)}

                info="How fast net profit is growing (compounded). Profit growing faster than sales means margins are expanding — a great sign."
              >
                Profits are growing <strong>{growthWord(f.profit_growth)}</strong> at {fmtNum(f.profit_growth, 1)}% a
                year.
              </MetricTile>
            )}

            {/* Dividend yield */}
            {f.dividend_yield != null && (
              <MetricTile
                icon={Coins}
                label="Dividend yield"
                value={`${fmtNum(f.dividend_yield, 2)}%`}
                tone={dyTone(f.dividend_yield)}
                meterPct={dyMeter(f.dividend_yield)}

                info="Annual dividend as a % of the share price — the cash return you get just for holding. Above 3% is income-friendly."
              >
                Pays {fmtNum(f.dividend_yield, 2)}% a year in dividends — <strong>{dyWord(f.dividend_yield)}</strong>.
              </MetricTile>
            )}

            {/* Promoter holding — honest "widely held" when null/0 */}
            <MetricTile
              icon={Users}
              label="Promoter holding"
              value={showProm ? `${fmtNum(f.promoter_pct, 2)}%` : 'Widely held'}
              tone={showProm ? promTone(f.promoter_pct as number) : NEUTRAL}
              meterPct={showProm ? promMeter(f.promoter_pct as number) : null}

              info="The % owned by founders/promoters. High promoter ownership = aligned 'skin in the game'. Banks and widely-held firms have little or no promoter stake by design."
            >
              {showProm ? (
                <>
                  Founders own {fmtNum(f.promoter_pct, 2)}% — <strong>{promWord(f.promoter_pct as number)}</strong>{' '}
                  skin in the game.
                </>
              ) : (
                <>No single promoter — widely held across public shareholders (typical for banks &amp; large caps).</>
              )}
            </MetricTile>
          </div>

          {/* ── CONTEXT ROW: market cap · book value · price ───────── */}
          <CardShell icon={ScrollText} title="Context · size & price">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-line bg-surface-2/40 p-3">
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-d-text-muted">
                  <Landmark className="h-3 w-3" /> Market cap
                </span>
                <div className="numeric mt-1 text-[18px] font-bold leading-none text-d-text-primary">
                  {f.market_cap_cr != null ? `₹${fmtCr(f.market_cap_cr)}` : '—'}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-surface-2/40 p-3">
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-d-text-muted">
                  <Banknote className="h-3 w-3" /> Book value
                </span>
                <div className="numeric mt-1 text-[18px] font-bold leading-none text-d-text-primary">
                  {fmtInr(f.book_value)}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-surface-2/40 p-3">
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-d-text-muted">
                  <Coins className="h-3 w-3" /> Price
                </span>
                <div className="numeric mt-1 text-[18px] font-bold leading-none text-d-text-primary">
                  {fmtInr(f.current_price)}
                </div>
              </div>
            </div>
            <Plain>
              Market cap is the company&rsquo;s total size; book value is its net worth per share; price is what one
              share trades at today.
            </Plain>
          </CardShell>
        </>
      )}

      <p className="border-t border-line pt-3 text-[10px] text-d-text-muted">
        Fundamentals from the nightly snapshot (screener.in-sourced) · cached per symbol with a live fallback. Honest-
        empty when a symbol hasn&rsquo;t been scraped yet. Not investment advice.
      </p>
    </div>
  )
}
