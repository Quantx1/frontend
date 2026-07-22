'use client'

/**
 * OrderFlowAnalysis (PR-S22) — institutional order-flow analysis surface.
 *
 * Reads three nightly-populated (but previously write-only) tables via
 * public endpoints (orderflowFiiDii / orderflowDeals / orderflowShorts)
 * and renders a bento of glass cards that a BEGINNER can read ("what this
 * means") and an ADVANCED trader respects (FII/DII net flow, big bulk/block
 * deals by notional, most-shorted names).
 *
 * Mirrors DerivativesAnalysis.tsx: glass `lg-surface` cards, text-up /
 * text-down / text-d-text-* tokens, a Beginner⟷Pro toggle that hides every
 * plain-language line in Pro mode, honest-empty + skeleton states, and the
 * Plain / InfoDot / CardShell helper pattern. No raw hex in className.
 */

import { useEffect, useState } from 'react'
import {
  ArrowLeftRight,
  Building2,
  HelpCircle,
  Info,
  Layers,
  Scissors,
  TrendingDown,
} from '@/lib/icons'

import { api } from '@/lib/api'

type FiiDiiData = Awaited<ReturnType<typeof api.screener.orderflowFiiDii>>
type DealsData = Awaited<ReturnType<typeof api.screener.orderflowDeals>>
type ShortsData = Awaited<ReturnType<typeof api.screener.orderflowShorts>>

// ── helpers ─────────────────────────────────────────────────────────
// Compact qty formatter — Indian L/Cr above 1L, M/k for round numbers.
const fmtQty = (n: number | null | undefined): string => {
  if (n == null) return '—'
  const a = Math.abs(n)
  if (a >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`
  if (a >= 1e5) return `${(n / 1e5).toFixed(2)}L`
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return `${Math.round(n)}`
}

// ₹ crore — values already arrive in ₹cr from the EOD feed.
const fmtCr = (n: number | null | undefined): string => {
  if (n == null) return '—'
  return `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })} cr`
}

// ₹ notional value for a deal (qty × price arrives as raw rupees).
const fmtValue = (n: number | null | undefined): string => {
  if (n == null) return '—'
  const a = Math.abs(n)
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)} cr`
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

const fmtPrice = (n: number | null | undefined): string =>
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
        className="glass-control inline-flex h-4 w-4 items-center justify-center rounded-full text-d-text-muted transition-colors hover:text-d-text-primary"
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

// Plain-language line — hidden in Pro mode.
function Plain({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null
  return (
    <p className="mt-2 flex gap-1.5 text-[11.5px] leading-snug text-d-text-secondary">
      <Info className="mt-[2px] h-3 w-3 shrink-0 text-primary" />
      <span>{children}</span>
    </p>
  )
}

// FII/DII sign-combo → beginner verdict. Covers all four sign combos.
function flowVerdict(
  fiiNet: number,
  diiNet: number,
): { text: React.ReactNode; cls: string } {
  const fx = fmtCr(fiiNet)
  const dx = fmtCr(diiNet)
  if (fiiNet < 0 && diiNet > 0)
    return {
      cls: 'text-d-text-primary',
      text: (
        <>
          Foreign institutions <strong className="text-down">SOLD {fx}</strong> while domestic institutions{' '}
          <strong className="text-up">BOUGHT {dx}</strong> — DIIs are absorbing FII selling (a tug-of-war; often a floor).
        </>
      ),
    }
  if (fiiNet > 0 && diiNet > 0)
    return {
      cls: 'text-up',
      text: (
        <>
          Both sides are buying — FII <strong className="text-up">+{fx}</strong> and DII{' '}
          <strong className="text-up">+{dx}</strong>. Broad institutional demand — a strong, well-supported bid.
        </>
      ),
    }
  if (fiiNet < 0 && diiNet < 0)
    return {
      cls: 'text-down',
      text: (
        <>
          Both sides are selling — FII <strong className="text-down">−{fx}</strong> and DII{' '}
          <strong className="text-down">−{dx}</strong>. Risk-off; no institutional bid to lean on.
        </>
      ),
    }
  if (fiiNet > 0 && diiNet < 0)
    return {
      cls: 'text-d-text-primary',
      text: (
        <>
          Foreign institutions <strong className="text-up">BOUGHT {fx}</strong> while domestic institutions{' '}
          <strong className="text-down">SOLD {dx}</strong> — a foreign-led rally; DIIs are booking profits into it.
        </>
      ),
    }
  return {
    cls: 'text-d-text-muted',
    text: <>Institutional flows are roughly flat today — no decisive FII/DII tilt.</>,
  }
}

// SEBI Path-A: FII/DII rupee flows, bulk/block deals and short-selling are raw
// NSE exchange data. Render (and fetch) only when the viewer is entitled — i.e.
// the data comes from their own connected broker feed or a genuine NSE display
// licence. When false, render nothing (the page shows the broker-connect gate).
export default function OrderFlowAnalysis({ entitled = true }: { entitled?: boolean }) {
  const [beginner, setBeginner] = useState(true)

  const [flow, setFlow] = useState<FiiDiiData | null>(null)
  const [deals, setDeals] = useState<DealsData | null>(null)
  const [shorts, setShorts] = useState<ShortsData | null>(null)
  const [flowErr, setFlowErr] = useState(false)
  const [dealsErr, setDealsErr] = useState(false)
  const [shortsErr, setShortsErr] = useState(false)

  useEffect(() => {
    if (!entitled) return
    api.screener.orderflowFiiDii().then(setFlow).catch(() => setFlowErr(true))
    api.screener.orderflowDeals(15).then(setDeals).catch(() => setDealsErr(true))
    api.screener.orderflowShorts(15).then(setShorts).catch(() => setShortsErr(true))
  }, [entitled])

  if (!entitled) return null

  // ── FII/DII derived ──
  const fiiNet = flow?.fii.net ?? 0
  const diiNet = flow?.dii.net ?? 0
  const hasFlow = !!flow && (flow.fii.net !== 0 || flow.dii.net !== 0 || !!flow.as_of)
  const verdict = flowVerdict(fiiNet, diiNet)
  // Diverging bar — |fii_net| vs |dii_net| share of the combined magnitude.
  const mag = Math.max(Math.abs(fiiNet) + Math.abs(diiNet), 1)
  const fiiPct = (Math.abs(fiiNet) / mag) * 100
  const diiPct = (Math.abs(diiNet) / mag) * 100

  const dealRows = deals?.deals ?? []
  const shortRows = shorts?.shorts ?? []
  const maxShort = shortRows.reduce((mx, r) => Math.max(mx, r.qty), 1)

  return (
    <div className="space-y-4">
      {/* ── HEADER ROW ─────────────────────────────────────────── */}
      <div className="lg-surface rounded-[20px] p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[18px] font-bold tracking-tight text-d-text-primary">
              <Building2 className="h-4 w-4 text-primary" /> Institutional Order-Flow
            </h2>
            <div className="mt-0.5 text-[11.5px] text-d-text-muted">
              Who the big money is buying &amp; selling — FII/DII flow, large deals &amp; short interest.
              {flow?.as_of ? <span className="text-d-text-secondary"> · {flow.as_of}</span> : ''}
            </div>
          </div>

          {/* Beginner ⟷ Pro toggle */}
          <div className="flex items-center rounded-full border border-line bg-surface-2 p-0.5 text-[10.5px] font-medium">
            <button
              type="button"
              onClick={() => setBeginner(true)}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                beginner ? 'glass-control-accent' : 'text-d-text-muted hover:text-d-text-primary'
              }`}
            >
              Beginner
            </button>
            <button
              type="button"
              onClick={() => setBeginner(false)}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                !beginner ? 'glass-control-accent' : 'text-d-text-muted hover:text-d-text-primary'
              }`}
            >
              Pro
            </button>
          </div>
        </div>

        {/* one-line verdict */}
        <div className="mt-3 border-t border-d-border pt-3">
          {!flow && !flowErr ? (
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
          ) : flowErr || !hasFlow ? (
            <p className="text-[13px] font-medium leading-snug text-d-text-muted">
              No institutional flow data yet — check back after the close.
            </p>
          ) : (
            <p className={`text-[13px] font-medium leading-snug ${verdict.cls}`}>{verdict.text}</p>
          )}
        </div>
      </div>

      {/* ── FII vs DII FLOW (headline) ─────────────────────────── */}
      <CardShell
        icon={ArrowLeftRight}
        title="FII vs DII · cash-market net flow"
        right={
          <InfoDot text="FII = foreign funds, DII = domestic (mutual funds / insurers). Net = buy − sell in ₹cr (cash market). Negative = net seller, positive = net buyer." />
        }
      >
        {!flow && !flowErr ? (
          <div className="h-28 animate-pulse rounded-lg bg-surface-2" />
        ) : flowErr || !hasFlow ? (
          <p className="py-6 text-center text-[11.5px] text-d-text-muted">No FII/DII flow data yet.</p>
        ) : (
          <>
            {/* two big stat blocks */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-surface-2/50 p-3">
                <div className="flex items-center justify-between text-[10.5px] uppercase tracking-wider text-d-text-muted">
                  <span>FII</span>
                  <span className={fiiNet >= 0 ? 'text-up' : 'text-down'}>{fiiNet >= 0 ? 'BOUGHT' : 'SOLD'}</span>
                </div>
                <div className={`numeric mt-1 text-[26px] font-bold leading-none ${fiiNet >= 0 ? 'text-up' : 'text-down'}`}>
                  {fiiNet >= 0 ? '+' : '−'}
                  {fmtCr(fiiNet)}
                </div>
                <div className="mt-1.5 text-[10px] text-d-text-muted">
                  buy <span className="numeric text-d-text-secondary">{fmtCr(flow?.fii.buy)}</span> · sell{' '}
                  <span className="numeric text-d-text-secondary">{fmtCr(flow?.fii.sell)}</span>
                </div>
              </div>
              <div className="rounded-lg border border-line bg-surface-2/50 p-3">
                <div className="flex items-center justify-between text-[10.5px] uppercase tracking-wider text-d-text-muted">
                  <span>DII</span>
                  <span className={diiNet >= 0 ? 'text-up' : 'text-down'}>{diiNet >= 0 ? 'BOUGHT' : 'SOLD'}</span>
                </div>
                <div className={`numeric mt-1 text-[26px] font-bold leading-none ${diiNet >= 0 ? 'text-up' : 'text-down'}`}>
                  {diiNet >= 0 ? '+' : '−'}
                  {fmtCr(diiNet)}
                </div>
                <div className="mt-1.5 text-[10px] text-d-text-muted">
                  buy <span className="numeric text-d-text-secondary">{fmtCr(flow?.dii.buy)}</span> · sell{' '}
                  <span className="numeric text-d-text-secondary">{fmtCr(flow?.dii.sell)}</span>
                </div>
              </div>
            </div>

            {/* diverging magnitude bar — |fii| vs |dii| */}
            <div className="mt-3">
              <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">
                <div style={{ width: `${fiiPct}%`, background: 'var(--color-warning)' }} />
                <div style={{ width: `${diiPct}%`, background: 'var(--color-primary)' }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[9.5px] font-medium uppercase tracking-wider">
                <span style={{ color: 'var(--color-warning)' }}>FII |{fmtCr(fiiNet)}|</span>
                <span style={{ color: 'var(--color-primary-text)' }}>DII |{fmtCr(diiNet)}|</span>
              </div>
            </div>

            <Plain show={beginner}>{verdict.text}</Plain>
          </>
        )}
      </CardShell>

      {/* ── BIG DEALS + MOST SHORTED ───────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Big deals (bulk / block) */}
        <CardShell
          icon={Layers}
          title="Big deals · bulk & block"
          right={deals?.as_of ? <span className="text-[10px] text-d-text-muted">{deals.as_of}</span> : null}
        >
          {!deals && !dealsErr ? (
            <div className="space-y-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-surface-2" />
              ))}
            </div>
          ) : dealsErr || dealRows.length === 0 ? (
            <p className="py-4 text-center text-[11.5px] text-d-text-muted">No institutional flow data yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-[1.4fr_auto_auto_1.3fr] items-center gap-x-2 text-[9.5px] uppercase tracking-wider text-d-text-muted">
                <span>Symbol</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Value</span>
                <span className="text-right">Client</span>
              </div>
              <ul className="mt-1.5 divide-y divide-d-border">
                {dealRows.map((d, i) => {
                  const isBuy = d.side === 'BUY'
                  return (
                    <li
                      key={`${d.symbol}-${i}`}
                      className="grid grid-cols-[1.4fr_auto_auto_1.3fr] items-center gap-x-2 py-1.5 text-[10.5px]"
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={`inline-flex shrink-0 rounded px-1 py-0.5 text-[8.5px] font-semibold ${
                            isBuy ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
                          }`}
                        >
                          {isBuy ? 'BUY' : 'SELL'}
                        </span>
                        <span className="truncate font-semibold text-d-text-primary">{d.symbol}</span>
                        {d.deal_type ? (
                          <span className="shrink-0 text-[8.5px] uppercase tracking-wide text-d-text-muted">{d.deal_type}</span>
                        ) : null}
                      </span>
                      <span className="text-right font-mono tabular-nums text-d-text-secondary">{fmtQty(d.qty)}</span>
                      <span className="text-right font-mono tabular-nums text-d-text-primary">{fmtValue(d.value)}</span>
                      <span className="truncate text-right text-d-text-muted" title={d.client}>
                        {d.client || '—'}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <Plain show={beginner}>
                Large negotiated trades flagged by NSE — a window into who is accumulating or distributing. Price shown is
                the deal price ({fmtPrice(dealRows[0]?.price)} for the top one).
              </Plain>
            </>
          )}
        </CardShell>

        {/* Most shorted */}
        <CardShell
          icon={Scissors}
          title="Most shorted · short-selling"
          right={shorts?.as_of ? <span className="text-[10px] text-d-text-muted">{shorts.as_of}</span> : null}
        >
          {!shorts && !shortsErr ? (
            <div className="space-y-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-5 animate-pulse rounded bg-surface-2" />
              ))}
            </div>
          ) : shortsErr || shortRows.length === 0 ? (
            <p className="py-4 text-center text-[11.5px] text-d-text-muted">No institutional flow data yet.</p>
          ) : (
            <>
              <div className="space-y-[5px]">
                {shortRows.map((s, i) => {
                  const pct = (s.qty / maxShort) * 100
                  return (
                    <div key={`${s.symbol}-${i}`} className="grid grid-cols-[1fr_auto] items-center gap-2 text-[10.5px]">
                      <div className="relative flex h-4 items-center">
                        <div
                          className="absolute left-0 h-3 rounded-r bg-down/40"
                          style={{ width: `${pct}%`, maxWidth: '100%' }}
                        />
                        <span className="relative z-10 ml-1.5 truncate font-semibold text-d-text-primary">
                          {s.symbol}
                        </span>
                      </div>
                      <span className="text-right font-mono tabular-nums text-d-text-secondary">{fmtQty(s.qty)}</span>
                    </div>
                  )
                })}
              </div>
              <Plain show={beginner}>
                Heavy intraday short-selling = bearish bets or hedging; watch for short-covering pops if these names turn
                up.
              </Plain>
            </>
          )}
        </CardShell>
      </div>

      <p className="flex items-center gap-1.5 border-t border-line pt-3 text-[10px] text-d-text-muted">
        <TrendingDown className="h-3 w-3 shrink-0" />
        End-of-day institutional flow (nightly snapshot) · FII/DII cash net from the exchange report · bulk/block deals
        ranked by notional value · short-selling from the NSE daily report. Honest-empty when a feed hasn&rsquo;t
        published. Not investment advice.
      </p>
    </div>
  )
}
