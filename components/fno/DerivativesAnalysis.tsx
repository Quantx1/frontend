'use client'

/**
 * DerivativesAnalysis (PR-S21) — flagship EOD F&O analysis surface.
 *
 * Reads the nightly-populated EOD derivatives tables via three public
 * endpoints (fnoEod / fnoParticipants / fnoBan) and renders a bento of
 * glass cards that a BEGINNER can read ("what this means") and an
 * ADVANCED trader respects (PCR, max-pain, OI walls, participant net).
 *
 * A Beginner⟷Pro toggle hides every plain-language line in Pro mode so
 * power users see only the numbers. Honest-empty + skeleton states
 * throughout — never a fabricated number.
 */

import { useEffect, useState } from 'react'
import {
  Activity,
  AlertOctagon,
  HelpCircle,
  Info,
  Layers3,
  Loader2,
  Search,
  Sigma,
  Target,
  Users,
} from '@/lib/icons'

import { api } from '@/lib/api'
import { useBrokerStatus } from '@/lib/hooks/useBrokerStatus'
import BrokerLock, { OptionChainPreview } from '@/components/broker/BrokerLock'

type EodData = Awaited<ReturnType<typeof api.screener.fnoEod>>
type ParticipantsData = Awaited<ReturnType<typeof api.screener.fnoParticipants>>
type BanData = Awaited<ReturnType<typeof api.screener.fnoBan>>

// ── helpers ─────────────────────────────────────────────────────────
const fmtOi = (n: number | null | undefined): string => {
  if (n == null) return '—'
  const a = Math.abs(n)
  if (a >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`
  if (a >= 1e5) return `${(n / 1e5).toFixed(2)}L`
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return `${n}`
}

const fmtNum = (n: number | null | undefined): string =>
  n == null ? '—' : n.toLocaleString('en-IN', { maximumFractionDigits: 2 })

// PCR → tone bucket. <0.8 call-heavy (bullish-leaning), 0.8–1.2 neutral,
// >1.2 put-heavy (bearish-leaning / hedged).
function pcrTone(pcr: number): { cls: string; bar: string; word: string } {
  if (pcr < 0.8) return { cls: 'text-up', bar: 'var(--color-up)', word: 'call-heavy — bullish-leaning' }
  if (pcr > 1.2) return { cls: 'text-down', bar: 'var(--color-down)', word: 'put-heavy — bearish / hedged' }
  return { cls: 'text-d-text-primary', bar: 'var(--color-warning)', word: 'balanced — no strong tilt' }
}

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
    <div className={`lg-surface rounded-xl p-4 ${className}`}>
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

export default function DerivativesAnalysis() {
  const [input, setInput] = useState('NIFTY')
  const [symbol, setSymbol] = useState('NIFTY')
  const [eod, setEod] = useState<EodData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [beginner, setBeginner] = useState(true)

  const [participants, setParticipants] = useState<ParticipantsData | null>(null)
  const [ban, setBan] = useState<BanData | null>(null)
  const { isConnected } = useBrokerStatus()

  const loadEod = async (sym: string) => {
    const s = sym.trim().toUpperCase()
    if (!s) return
    setSymbol(s)
    setLoading(true)
    setError(false)
    try {
      setEod(await api.screener.fnoEod(s))
    } catch {
      setError(true)
      setEod(null)
    } finally {
      setLoading(false)
    }
  }

  // Mount: default NIFTY analysis + the (symbol-agnostic) participant & ban cards.
  useEffect(() => {
    loadEod('NIFTY')
    api.screener.fnoParticipants().then(setParticipants).catch(() => setParticipants(null))
    api.screener.fnoBan().then(setBan).catch(() => setBan(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const m = eod?.metrics ?? null
  const hasData = !!m
  const pcr = m?.pcr_oi ?? 0
  const tone = pcrTone(pcr)
  // PCR meter: scale 0–2 with 1.0 centred.
  const pcrPct = Math.max(3, Math.min(97, (pcr / 2) * 100))

  // OI walls from the chain.
  const chain = eod?.chain ?? []
  const maxOi = chain.reduce((mx, r) => Math.max(mx, r.ce_oi, r.pe_oi), 1)
  const topPe = chain.reduce<{ strike: number; pe_oi: number } | null>(
    (best, r) => (best == null || r.pe_oi > best.pe_oi ? { strike: r.strike, pe_oi: r.pe_oi } : best),
    null,
  )
  const topCe = chain.reduce<{ strike: number; ce_oi: number } | null>(
    (best, r) => (best == null || r.ce_oi > best.ce_oi ? { strike: r.strike, ce_oi: r.ce_oi } : best),
    null,
  )

  // Headline verdict from PCR + max-pain heuristics.
  const verdict = ((): { text: string; cls: string } => {
    if (!hasData) return { text: 'Search a symbol to read its option-market positioning.', cls: 'text-d-text-secondary' }
    if (pcr < 0.8)
      return {
        text: 'Options market leans bullish — more calls than puts, sellers expect the floor to hold.',
        cls: 'text-up',
      }
    if (pcr > 1.2)
      return {
        text: 'Options market leans bearish / hedged — puts outweigh calls into this expiry.',
        cls: 'text-down',
      }
    return {
      text: 'Options market is balanced — no decisive call/put tilt; price likely pins near max-pain.',
      cls: 'text-d-text-primary',
    }
  })()

  const fii = participants?.participants?.find((p) => p.participant.toUpperCase() === 'FII') ?? null

  return (
    <div className="space-y-4">
      {/* ── HEADER ROW ─────────────────────────────────────────── */}
      <div className="lg-surface rounded-xl p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[18px] font-bold tracking-tight text-d-text-primary">
              <Sigma className="h-4 w-4 text-primary" /> EOD F&amp;O Analysis
            </h2>
            {hasData ? (
              <div className="mt-0.5 text-[11.5px] text-d-text-muted">
                <span className="font-medium text-d-text-secondary">{symbol}</span>
                {eod?.as_of ? ` · ${eod.as_of}` : ''}
                {eod?.expiry ? ` · ${eod.expiry} expiry` : ''}
              </div>
            ) : (
              <div className="mt-0.5 text-[11.5px] text-d-text-muted">End-of-day options positioning, in plain English.</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Beginner ⟷ Pro toggle */}
            <div className="flex items-center rounded-lg border border-line bg-surface-2 p-0.5 text-[10.5px] font-medium">
              <button
                type="button"
                onClick={() => setBeginner(true)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  beginner ? 'glass-control-accent' : 'text-d-text-muted hover:text-d-text-primary'
                }`}
              >
                Beginner
              </button>
              <button
                type="button"
                onClick={() => setBeginner(false)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  !beginner ? 'glass-control-accent' : 'text-d-text-muted hover:text-d-text-primary'
                }`}
              >
                Pro
              </button>
            </div>

            {/* symbol search */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                loadEod(input)
              }}
              className="flex items-center gap-1.5"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="NIFTY"
                spellCheck={false}
                className="w-28 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[12px] uppercase text-d-text-primary outline-none transition-colors placeholder:normal-case placeholder:text-d-text-muted focus:border-primary"
              />
              <button
                type="submit"
                disabled={loading}
                className="glass-control-accent inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-medium transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                Analyse
              </button>
            </form>
          </div>
        </div>

        {/* one-line verdict */}
        <div className="mt-3 border-t border-d-border pt-3">
          {loading ? (
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
          ) : (
            <p className={`text-[13px] font-medium leading-snug ${verdict.cls}`}>{verdict.text}</p>
          )}
        </div>
      </div>

      {/* ── EMPTY / ERROR for the symbol-driven cards ────────────── */}
      {(error || (!loading && !hasData)) && !isConnected ? (
        // No live chain AND no broker → frosted-glass "connect your broker".
        <BrokerLock
          feature="Live derivatives data"
          description={`PCR, max pain, OI support/resistance and the ${symbol} option chain stream from your own broker. Connect Zerodha, Upstox or Angel to unlock it.`}
          className="min-h-[300px]"
        >
          <OptionChainPreview />
        </BrokerLock>
      ) : error ? (
        <div className="lg-surface rounded-xl p-6 text-center text-[12px] text-down">
          Couldn&rsquo;t load F&amp;O data for {symbol} — try again.
        </div>
      ) : !loading && !hasData ? (
        <div className="lg-surface rounded-xl p-6 text-center text-[12px] text-d-text-muted">
          No EOD F&amp;O data yet for {symbol}. Try an index (NIFTY, BANKNIFTY) or an F&amp;O stock.
        </div>
      ) : (
        <>
          {/* ── METRICS BENTO: PCR · Max-pain ──────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* PCR gauge */}
            <CardShell
              icon={Activity}
              title="Put-Call Ratio (OI)"
              right={
                <InfoDot text="PCR = open put OI ÷ call OI. Low (<0.8) = traders bought more calls (bullish or complacent). High (>1.2) = more puts (bearish or hedging)." />
              }
            >
              {loading || !m ? (
                <div className="h-20 animate-pulse rounded-lg bg-surface-2" />
              ) : (
                <>
                  <div className="flex items-end justify-between gap-3">
                    <div className={`numeric text-[30px] font-bold leading-none ${tone.cls}`}>{pcr.toFixed(2)}</div>
                    <div className="text-right text-[10.5px] text-d-text-muted">
                      <div>
                        PCR-Vol <span className="numeric font-medium text-d-text-secondary">{m.pcr_volume?.toFixed(2)}</span>
                      </div>
                      <div className="mt-0.5">scale 0 – 2 · center 1.0</div>
                    </div>
                  </div>

                  {/* gauge bar */}
                  <div className="mt-3">
                    <div className="relative h-2.5 rounded-full bg-surface-2">
                      <div
                        className="absolute left-1/2 top-1/2 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 bg-d-text-muted/40"
                        aria-hidden
                      />
                      <div
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                        style={{ left: `${pcrPct}%`, background: tone.bar }}
                        aria-label={`PCR ${pcr.toFixed(2)}`}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[9.5px] font-medium uppercase tracking-wider">
                      <span className="text-up">Call-heavy</span>
                      <span className="text-d-text-muted">Neutral</span>
                      <span className="text-down">Put-heavy</span>
                    </div>
                  </div>

                  <Plain show={beginner}>
                    Put-Call Ratio <strong>{pcr.toFixed(2)}</strong>: about {pcr.toFixed(2)} puts open for every call —{' '}
                    {tone.word}.
                  </Plain>
                </>
              )}
            </CardShell>

            {/* Max pain */}
            <CardShell
              icon={Target}
              title="Max Pain"
              right={<InfoDot text="Max pain is the strike where the largest number of option BUYERS lose money at expiry. Price often drifts toward it as expiry nears (the 'pinning' effect)." />}
            >
              {loading || !m ? (
                <div className="h-20 animate-pulse rounded-lg bg-surface-2" />
              ) : (
                <>
                  <div className="flex items-end justify-between gap-3">
                    <div className="numeric text-[30px] font-bold leading-none text-d-text-primary">
                      {fmtNum(m.max_pain)}
                    </div>
                    <div className="text-right text-[10.5px] text-d-text-muted">
                      <div>
                        CE OI <span className="numeric font-medium text-down">{fmtOi(m.total_ce_oi)}</span>
                      </div>
                      <div className="mt-0.5">
                        PE OI <span className="numeric font-medium text-up">{fmtOi(m.total_pe_oi)}</span>
                      </div>
                    </div>
                  </div>

                  {/* CE vs PE total-OI split bar */}
                  <div className="mt-3">
                    <div className="flex h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="bg-up"
                        style={{
                          width: `${(m.total_pe_oi / Math.max(m.total_ce_oi + m.total_pe_oi, 1)) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-down"
                        style={{
                          width: `${(m.total_ce_oi / Math.max(m.total_ce_oi + m.total_pe_oi, 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[9.5px] font-medium uppercase tracking-wider">
                      <span className="text-up">Put OI (support)</span>
                      <span className="text-down">Call OI (resistance)</span>
                    </div>
                  </div>

                  <Plain show={beginner}>
                    Max pain <strong>{fmtNum(m.max_pain)}</strong>: the strike where the most option buyers lose by
                    expiry — price often drifts toward it.
                  </Plain>
                </>
              )}
            </CardShell>
          </div>

          {/* ── OI WALL DISTRIBUTION ───────────────────────────── */}
          <CardShell
            icon={Layers3}
            title="OI Walls · support & resistance"
            right={<InfoDot text="Each strike shows how much open interest sits there. Big PE walls (left, green) act as support — put writers defend that floor. Big CE walls (right, red) act as resistance — call writers cap the upside." />}
          >
            {loading ? (
              <div className="space-y-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-surface-2" />
                ))}
              </div>
            ) : chain.length === 0 ? (
              <p className="py-4 text-center text-[11.5px] text-d-text-muted">No by-strike OI in the EOD chain.</p>
            ) : (
              <>
                <div className="mb-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[9.5px] uppercase tracking-wider text-d-text-muted">
                  <span className="text-right text-up">Put OI · support</span>
                  <span className="text-center">Strike</span>
                  <span className="text-down">Call OI · resistance</span>
                </div>
                <div className="space-y-[3px]">
                  {chain.map((r) => {
                    const pePct = (r.pe_oi / maxOi) * 100
                    const cePct = (r.ce_oi / maxOi) * 100
                    const isSup = topPe?.strike === r.strike
                    const isRes = topCe?.strike === r.strike
                    return (
                      <div
                        key={r.strike}
                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[10.5px]"
                      >
                        {/* PE bar — green, grows leftward */}
                        <div className="relative flex h-4 items-center justify-end">
                          <div
                            className="absolute right-0 h-3 rounded-l bg-up/45"
                            style={{ width: `${pePct}%`, maxWidth: '100%' }}
                          />
                          <span className="relative z-10 mr-1 font-mono tabular-nums text-d-text-secondary">
                            {fmtOi(r.pe_oi)}
                          </span>
                        </div>
                        {/* strike */}
                        <div
                          className={`min-w-[3.5rem] text-center font-mono font-medium tabular-nums ${
                            isSup ? 'text-up' : isRes ? 'text-down' : 'text-d-text-primary'
                          }`}
                        >
                          {r.strike.toLocaleString('en-IN')}
                        </div>
                        {/* CE bar — red, grows rightward */}
                        <div className="relative flex h-4 items-center">
                          <div
                            className="absolute left-0 h-3 rounded-r bg-down/45"
                            style={{ width: `${cePct}%`, maxWidth: '100%' }}
                          />
                          <span className="relative z-10 ml-1 font-mono tabular-nums text-d-text-secondary">
                            {fmtOi(r.ce_oi)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* support / resistance badges */}
                <div className="mt-3 flex flex-wrap gap-2 border-t border-d-border pt-2.5 text-[10.5px]">
                  {topPe && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-up/10 px-2 py-0.5 font-medium text-up">
                      Support {topPe.strike.toLocaleString('en-IN')}
                    </span>
                  )}
                  {topCe && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-down/10 px-2 py-0.5 font-medium text-down">
                      Resistance {topCe.strike.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <Plain show={beginner}>
                  Biggest support <strong>{topPe ? topPe.strike.toLocaleString('en-IN') : '—'}</strong> (put writers),
                  biggest resistance <strong>{topCe ? topCe.strike.toLocaleString('en-IN') : '—'}</strong> (call
                  writers).
                </Plain>
              </>
            )}
          </CardShell>
        </>
      )}

      {/* ── PARTICIPANT POSITIONING + F&O BAN (symbol-agnostic) ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Participants */}
        <CardShell
          icon={Users}
          title="Participant Positioning"
          right={participants?.as_of ? <span className="text-[10px] text-d-text-muted">{participants.as_of}</span> : null}
        >
          {!participants ? (
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-surface-2" />
              ))}
            </div>
          ) : participants.participants.length === 0 ? (
            <p className="py-4 text-center text-[11.5px] text-d-text-muted">No participant OI data yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 text-[9.5px] uppercase tracking-wider text-d-text-muted">
                <span>Participant</span>
                <span className="text-right">Options bull / bear</span>
                <span className="text-right">Futures net</span>
              </div>
              <ul className="mt-1.5 divide-y divide-d-border">
                {participants.participants.map((p) => {
                  const isFii = p.participant.toUpperCase() === 'FII'
                  const longFut = p.fut_net >= 0
                  return (
                    <li
                      key={p.participant}
                      className={`grid grid-cols-[auto_1fr_auto] items-center gap-x-3 py-1.5 ${
                        isFii ? 'rounded-md bg-primary/5 px-1.5' : ''
                      }`}
                    >
                      <span
                        className={`text-[12px] font-semibold ${isFii ? 'text-primary' : 'text-d-text-primary'}`}
                      >
                        {p.participant}
                      </span>
                      <span className="flex items-center justify-end gap-2 text-[10.5px] font-mono tabular-nums">
                        <span className="text-up">{fmtOi(p.opt_bull)}</span>
                        <span className="text-d-text-muted">/</span>
                        <span className="text-down">{fmtOi(p.opt_bear)}</span>
                      </span>
                      <span
                        className={`text-right text-[12px] font-mono font-semibold tabular-nums ${
                          longFut ? 'text-up' : 'text-down'
                        }`}
                      >
                        {longFut ? '▲' : '▼'} {fmtOi(Math.abs(p.fut_net))}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <Plain show={beginner}>
                {fii ? (
                  <>
                    FII are net <strong>{fii.fut_net >= 0 ? 'long' : 'short'}</strong> futures — the smart-money stance.
                    {fii.fut_net >= 0 ? ' Foreign desks are positioned for upside.' : ' Foreign desks are positioned for downside.'}
                  </>
                ) : (
                  <>Net futures position per desk — ▲ long is bullish, ▼ short is bearish.</>
                )}
              </Plain>
            </>
          )}
        </CardShell>

        {/* F&O Ban */}
        <CardShell
          icon={AlertOctagon}
          title="F&O Ban List"
          right={ban?.as_of ? <span className="text-[10px] text-d-text-muted">{ban.as_of}</span> : null}
        >
          {!ban ? (
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 w-16 animate-pulse rounded-md bg-surface-2" />
              ))}
            </div>
          ) : ban.symbols.length === 0 ? (
            <p className="py-2 text-[12px] text-d-text-secondary">No stocks in F&amp;O ban today.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {ban.symbols.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-md border border-down/30 bg-down/10 px-2 py-1 text-[11px] font-medium text-down"
                >
                  <AlertOctagon className="h-3 w-3" /> {s}
                </span>
              ))}
            </div>
          )}

          <Plain show={beginner}>
            Banned = open interest maxed out; no <strong>new</strong> F&amp;O positions allowed today, only square-off
            of existing ones.
          </Plain>
        </CardShell>
      </div>

      <p className="border-t border-line pt-3 text-[10px] text-d-text-muted">
        End-of-day derivatives data (nightly snapshot) · PCR, max-pain &amp; OI walls from the option chain · participant
        OI from the NSE participant report. Honest-empty when a feed hasn&rsquo;t published. Not investment advice.
      </p>
    </div>
  )
}
