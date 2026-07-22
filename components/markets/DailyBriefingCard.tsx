'use client'

/* ============================================================================
   QUANT X — Daily Briefing (the markets-page hero, shown to EVERYONE)
   A time-aware AI market read: the full setup BEFORE the bell (pre-market /
   intraday) and the WRAP after the close (post-market). Built entirely from
   SAFE data — global overnight cues + EOD/derived India context + FII/DII EOD
   provisional + events — so it renders for logged-out users too. No live
   intraday NSE quotes flow through here (those stay Path-A gated on the live
   board below). EOD/provisional data is always labelled as such.
   FintechX design: .tile-tint flat cards, rounded-[20px], token classes only.
   ============================================================================ */

import useSWR from 'swr'
import { motion } from 'framer-motion'
import {
  Sun, Moon, Activity, Globe, Wallet, Calendar, Sparkles, RefreshCw,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ClipboardList,
} from '@/lib/icons'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/foundation'
import { MONO } from '@/lib/tokens'

// ── formatters ──────────────────────────────────────────────────────────────
const num = (n?: number | null) =>
  n == null || Number.isNaN(n) ? '--' : n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
const pct = (n?: number | null, d = 2) =>
  n == null || Number.isNaN(n) ? '--' : `${n >= 0 ? '+' : ''}${n.toFixed(d)}%`
const crore = (n?: number | null) =>
  n == null ? '--' : `${n >= 0 ? '+' : '−'}₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`
const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '--')
const fmtDate = (s?: string | null) => {
  if (!s) return '--'
  try { return new Date(s).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }) } catch { return s }
}
const shortDate = (s?: string | null) => {
  if (!s) return '--'
  try { return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) } catch { return s }
}

// Resilient loading: keep the last-good briefing on screen across a failed
// refresh (never flash the honest-empty state on a transient blip), and retry
// a few times before giving up.
const SWR_OPTS = {
  revalidateOnFocus: false,
  dedupingInterval: 60_000,
  keepPreviousData: true,
  errorRetryCount: 5,
  errorRetryInterval: 4_000,
}

// framer-motion staggered reveal
const container = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } }
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] as any } },
}

// small section title used across tiles
function SectionLabel({ icon: Icon, children, meta }: { icon: any; children: React.ReactNode; meta?: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
      <Icon size={14} className="text-primary" />
      {children}
      {meta && <span className="ml-auto text-[10px] font-normal text-d-text-muted">{meta}</span>}
    </div>
  )
}

// ── FII/DII EOD mini 5-session trend (provisional) ──────────────────────────
function FlowTrend({ trend }: { trend: Array<{ date: string; fii_cash: number; dii_cash: number }> }) {
  if (!trend.length) return null
  const max = Math.max(1, ...trend.flatMap((t) => [Math.abs(t.fii_cash || 0), Math.abs(t.dii_cash || 0)]))
  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="mb-2 text-[10px] uppercase tracking-wide text-d-text-muted">Last {trend.length} sessions · FII cash</div>
      <div className="flex items-end gap-2">
        {trend.map((t) => {
          const up = (t.fii_cash ?? 0) >= 0
          const h = Math.max(4, Math.round((Math.abs(t.fii_cash || 0) / max) * 34))
          return (
            <div key={t.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-9 w-full items-end justify-center">
                <div className={`w-full max-w-[16px] rounded-[3px] ${up ? 'bg-up/70' : 'bg-down/70'}`} style={{ height: `${h}px` }} />
              </div>
              <span className="text-[9px] text-d-text-muted">{shortDate(t.date).split(' ')[0]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── FII/DII EOD flows block (used by both sessions) ─────────────────────────
function FlowsBlock({ flows }: { flows: NonNullable<Briefing['flows']> }) {
  const fii = flows.fii?.cash_net
  const dii = flows.dii?.cash_net
  if (fii == null && dii == null && !flows.trend.length) return null
  return (
    <div className="tile-tint p-4">
      <SectionLabel icon={Wallet} meta="EOD · provisional">Smart money (FII / DII)</SectionLabel>
      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <div className="text-d-text-muted">FII cash (net)</div>
          <div className={`text-[16px] font-semibold ${MONO} ${(fii ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>{crore(fii)}</div>
        </div>
        <div>
          <div className="text-d-text-muted">DII cash (net)</div>
          <div className={`text-[16px] font-semibold ${MONO} ${(dii ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>{crore(dii)}</div>
        </div>
      </div>
      <FlowTrend trend={flows.trend} />
      <div className="mt-2.5 text-[10px] text-d-text-muted">{flows.date ? `${fmtDate(flows.date)} · ` : ''}{flows.source}</div>
    </div>
  )
}

// ── small labelled chip ─────────────────────────────────────────────────────
function Chip({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' | 'neutral' | null }) {
  const t = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-d-text-primary'
  return (
    <div className="tile-tint flex min-w-[104px] flex-col px-3 py-2">
      <span className="text-[10px] uppercase tracking-wide text-d-text-muted">{label}</span>
      <span className={`mt-0.5 text-[14px] font-semibold ${MONO} ${t}`}>{value}</span>
    </div>
  )
}

// ── events / tomorrow list ──────────────────────────────────────────────────
function EventList({ items, expiry }: { items: Array<{ type: string; label: string; date: string }>; expiry?: { weekly: string | null; monthly: string | null } }) {
  const hasExpiry = expiry && (expiry.weekly || expiry.monthly)
  if (!items.length && !hasExpiry) return <p className="text-[11.5px] text-d-text-muted">No scheduled events.</p>
  return (
    <div className="flex h-full flex-col">
      {hasExpiry && (
        <div className="grid grid-cols-2 gap-2">
          {expiry?.weekly && (
            <div className="rounded-[12px] bg-main px-3 py-2.5">
              <div className="text-[9.5px] uppercase tracking-wide text-d-text-muted">Weekly expiry</div>
              <div className={`mt-0.5 text-[14px] font-semibold text-d-text-primary ${MONO}`}>{shortDate(expiry.weekly)}</div>
            </div>
          )}
          {expiry?.monthly && (
            <div className="rounded-[12px] bg-main px-3 py-2.5">
              <div className="text-[9.5px] uppercase tracking-wide text-d-text-muted">Monthly expiry</div>
              <div className={`mt-0.5 text-[14px] font-semibold text-d-text-primary ${MONO}`}>{shortDate(expiry.monthly)}</div>
            </div>
          )}
        </div>
      )}
      {items.length > 0 ? (
        <div className={`space-y-2 ${hasExpiry ? 'mt-3 border-t border-line pt-3' : ''}`}>
          {items.slice(0, 5).map((e, i) => (
            <div key={`${e.label}-${i}`} className="flex items-center justify-between gap-2 text-[11.5px]">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[9.5px] uppercase tracking-wide text-primary">{e.type}</span>
                <span className="truncate text-d-text-secondary">{e.label}</span>
              </div>
              <span className={`shrink-0 text-[10.5px] text-d-text-muted ${MONO}`}>{shortDate(e.date)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[11px] leading-relaxed text-d-text-muted">
          No corporate earnings in the forward window — the index expiry dates above are the sessions to watch.
        </p>
      )}
    </div>
  )
}

// ── narrative prose (plan / wrap) ───────────────────────────────────────────
function Narrative({ block }: { block: { narrative: string | null; drivers: string[]; disclaimer: string } }) {
  const hasBody = block.narrative || block.drivers.length
  if (!hasBody) return null
  return (
    <div className="tile-tint p-4">
      <SectionLabel icon={Sparkles}>The read</SectionLabel>
      {block.narrative && (
        <p className="whitespace-pre-line text-[13px] leading-relaxed text-d-text-secondary">{block.narrative}</p>
      )}
      {block.drivers.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {block.drivers.map((d, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-snug text-d-text-secondary">
              <span className="mt-[3px] text-primary">•</span>{d}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 border-t border-line pt-2.5 text-[10.5px] italic text-d-text-muted">
        {block.disclaimer || 'For educational purposes — not investment advice.'}
      </p>
    </div>
  )
}

// ── types (mirror the api client) ───────────────────────────────────────────
type Briefing = Awaited<ReturnType<typeof api.market.briefing>>

export default function DailyBriefingCard() {
  // Let the fetcher throw on failure so SWR keeps the previously-loaded briefing
  // (keepPreviousData) instead of replacing it with null — the headline stays on
  // screen through a transient backend/network blip and SWR retries in the bg.
  const { data, isLoading, mutate, isValidating } = useSWR<Briefing>(
    'mkt-briefing',
    () => api.market.briefing('auto'),
    SWR_OPTS,
  )
  // Movers-with-WHY: lazy cause-attribution for the EOD movers (post-market
  // only — that's the only session that renders the movers block).
  const why = useSWR(
    data?.session === 'postmarket' && (data?.movers?.items?.length ?? 0) > 0 ? 'mkt-movers-why' : null,
    () => api.screener.moversWhy().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 300_000, keepPreviousData: true },
  )
  const whyBySymbol: Record<string, { driver: string; has_news: boolean }> = {}
  for (const it of (why.data as any)?.items ?? []) whyBySymbol[it.symbol] = it

  // ── loading skeleton (first load / retrying with nothing cached yet) ──
  if (!data && (isLoading || isValidating)) {
    return (
      <div className="rounded-[24px] bg-wrap p-5 md:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-[12px]" />
          <div className="space-y-1.5"><Skeleton className="h-3 w-24" /><Skeleton className="h-2.5 w-32" /></div>
        </div>
        <Skeleton className="mt-4 h-7 w-3/4" />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-[20px]" />)}
        </div>
      </div>
    )
  }

  // ── total honest-empty (endpoint unavailable) ──
  if (!data || !data.headline) {
    return (
      <div className="rounded-[24px] bg-wrap p-5 md:p-6">
        <div className="flex items-center gap-2.5 text-[13px] font-semibold text-d-text-primary">
          <Sparkles size={16} className="text-primary" /> AI Daily Briefing
        </div>
        <p className="mt-2 text-[12.5px] text-d-text-muted">Today&rsquo;s briefing is being prepared. Check back shortly for the full market read.</p>
      </div>
    )
  }

  const session = data.session
  const isPost = session === 'postmarket'
  const isLive = session === 'intraday'
  const sessLabel = isPost ? 'Post-market' : isLive ? 'Market live' : 'Pre-market'
  const SessIcon = isPost ? Moon : isLive ? Activity : Sun

  // headline accent (from structured data — never a fabricated number)
  const biasVal = isPost
    ? data.tape?.nifty?.change_pct
    : data.global?.gift_nifty?.change_pct ?? data.global?.items?.find((g) => g.key === 'sp500')?.change_pct
  const bias = biasVal == null ? 'neutral' : biasVal > 0.1 ? 'up' : biasVal < -0.1 ? 'down' : 'neutral'
  const BiasIcon = bias === 'up' ? TrendingUp : bias === 'down' ? TrendingDown : Activity
  const biasClass = bias === 'up' ? 'text-up' : bias === 'down' ? 'text-down' : 'text-primary'

  // global setup (pre): de-dup GIFT NIFTY out of the scroller, highlight it
  const gift = data.global?.gift_nifty ?? null
  const globalItems = (data.global?.items ?? []).filter((g) => g.last != null && g.key !== 'giftnifty')

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="rounded-[24px] bg-wrap p-5 md:p-6"
    >
      {/* ── header ── */}
      <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-primary/12 text-primary"><SessIcon size={19} /></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-d-text-primary">{sessLabel} briefing</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-primary"><Sparkles size={10} /> AI</span>
            </div>
            <div className="text-[11px] text-d-text-muted">{fmtDate(data.trading_date)}</div>
          </div>
        </div>
        <button
          onClick={() => mutate()}
          disabled={isValidating}
          aria-label="Refresh briefing"
          title="Refresh briefing"
          className="glass-control inline-flex h-8 w-8 items-center justify-center rounded-full text-d-text-secondary transition-colors disabled:opacity-60"
        >
          <RefreshCw size={13} className={isValidating ? 'animate-spin' : ''} />
        </button>
      </motion.div>

      {/* ── headline ── */}
      <motion.div variants={item} className="mt-4 flex items-start gap-2.5">
        <BiasIcon size={20} className={`mt-1 shrink-0 ${biasClass}`} />
        <h2 className="heading-display text-[clamp(1.15rem,2.4vw,1.6rem)] font-semibold leading-tight tracking-tight text-d-text-primary">
          {data.headline}
        </h2>
      </motion.div>

      {/* ── sections grid ── */}
      <div className={`mt-4 grid grid-cols-1 items-stretch gap-3 ${isPost ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
        {/* GLOBAL SETUP (pre / intraday) */}
        {!isPost && (globalItems.length > 0 || gift?.last != null) && (
          <motion.div variants={item} className="tile-tint p-4 lg:col-span-2">
            <SectionLabel icon={Globe} meta="overnight + Asia — sets the India open">Global setup</SectionLabel>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gift?.last != null && (
                <div className="flex min-w-[150px] shrink-0 flex-col rounded-[14px] border border-primary/40 bg-primary/8 px-3 py-2">
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {(gift.change_pct ?? 0) >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />} {gift.label}
                  </span>
                  <span className={`text-[14px] font-semibold text-d-text-primary ${MONO}`}>{num(gift.last)}</span>
                  <span className={`text-[11px] ${MONO} ${(gift.change_pct ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>{pct(gift.change_pct)}</span>
                  {data.global?.gap_read && <span className="mt-0.5 truncate text-[9.5px] text-d-text-muted">{data.global.gap_read}</span>}
                </div>
              )}
              {globalItems.map((g) => (
                <div key={g.key} className="flex min-w-[112px] shrink-0 flex-col rounded-[12px] bg-main px-3 py-2">
                  <span className="truncate text-[10px] uppercase tracking-wide text-d-text-muted">{g.label}</span>
                  <span className={`text-[13px] font-semibold text-d-text-primary ${MONO}`}>{num(g.last)}</span>
                  <span className={`text-[11px] ${MONO} ${(g.change_pct ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>{pct(g.change_pct)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAPE (post) — EOD close */}
        {isPost && data.tape && (data.tape.nifty || data.tape.vix != null || data.tape.breadth) && (
          <motion.div variants={item} className="tile-tint flex flex-col p-4">
            <SectionLabel icon={Activity} meta="EOD · provisional">The tape</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {data.tape.nifty && (
                <Chip label="NIFTY close" value={data.tape.nifty.ltp != null ? `${num(data.tape.nifty.ltp)} · ${pct(data.tape.nifty.change_pct)}` : '--'} tone={(data.tape.nifty.change_pct ?? 0) >= 0 ? 'up' : 'down'} />
              )}
              {data.tape.vix != null && <Chip label="India VIX" value={data.tape.vix.toFixed(2)} tone="neutral" />}
              {data.tape.breadth?.adv_pct != null && (
                <Chip label="Breadth (adv)" value={`${Math.round(data.tape.breadth.adv_pct)}%`} tone={data.tape.breadth.adv_pct >= 50 ? 'up' : 'down'} />
              )}
            </div>
            {data.tape.breadth?.adv_pct != null && (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[10px] text-d-text-muted">
                  <span className="text-up">Advancers {Math.round(data.tape.breadth.adv_pct)}%</span>
                  <span className="text-down">Decliners {100 - Math.round(data.tape.breadth.adv_pct)}%</span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-down/25">
                  <div className="h-full rounded-full bg-up/80" style={{ width: `${Math.round(data.tape.breadth.adv_pct)}%` }} />
                </div>
              </div>
            )}
            {data.tape.note && <div className="mt-auto pt-3 text-[10px] text-d-text-muted">{data.tape.note}</div>}
          </motion.div>
        )}

        {/* FLOWS — FII/DII EOD (both sessions) */}
        {data.flows && (
          <motion.div variants={item}>
            <FlowsBlock flows={data.flows} />
          </motion.div>
        )}

        {/* INDIA CONTEXT (pre) — derived / EOD */}
        {!isPost && data.india && (data.india.regime || data.india.vix != null || data.india.breadth || data.india.sectors || data.india.eod) && (
          <motion.div variants={item} className="tile-tint p-4 lg:col-span-2">
            <SectionLabel icon={TrendingUp} meta={data.india.note}>India context</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {data.india.eod?.nifty && <Chip label="NIFTY 50 · prev" value={num(data.india.eod.nifty.prev_close)} tone="neutral" />}
              {data.india.eod?.banknifty && <Chip label="Bank Nifty · prev" value={num(data.india.eod.banknifty.prev_close)} tone="neutral" />}
              {data.india.regime && <Chip label="Regime" value={cap(data.india.regime)} tone="neutral" />}
              {data.india.vix != null && <Chip label="India VIX" value={data.india.vix.toFixed(1)} tone="neutral" />}
              {data.india.breadth?.adv_pct != null && (
                <Chip label="Breadth" value={`${Math.round(data.india.breadth.adv_pct)}%`} tone={data.india.breadth.adv_pct >= 50 ? 'up' : 'down'} />
              )}
            </div>
            {data.india.sectors && (data.india.sectors.leading.length > 0 || data.india.sectors.lagging.length > 0) && (
              <div className="mt-3 space-y-1 border-t border-line pt-2.5 text-[11px]">
                {data.india.sectors.leading.length > 0 && (
                  <div className="flex gap-1.5"><span className="text-d-text-muted">Leading</span><span className="truncate text-up">{data.india.sectors.leading.slice(0, 3).join(' · ')}</span></div>
                )}
                {data.india.sectors.lagging.length > 0 && (
                  <div className="flex gap-1.5"><span className="text-d-text-muted">Lagging</span><span className="truncate text-down">{data.india.sectors.lagging.slice(0, 3).join(' · ')}</span></div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* SECTORS (post) — EOD winners/losers */}
        {isPost && data.sectors && (data.sectors.leading.length > 0 || data.sectors.lagging.length > 0) && (
          <motion.div variants={item} className="tile-tint flex flex-col p-4">
            <SectionLabel icon={TrendingUp} meta="EOD">Sector performance</SectionLabel>
            <div className="space-y-3">
              {data.sectors.leading.length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-up"><ArrowUpRight size={12} /> Leaders</div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.sectors.leading.slice(0, 4).map((x) => (
                      <span key={x} className="rounded-full bg-up/10 px-2.5 py-1 text-[11px] font-medium text-up">{x}</span>
                    ))}
                  </div>
                </div>
              )}
              {data.sectors.lagging.length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-down"><ArrowDownRight size={12} /> Laggards</div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.sectors.lagging.slice(0, 4).map((x) => (
                      <span key={x} className="rounded-full bg-down/10 px-2.5 py-1 text-[11px] font-medium text-down">{x}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* MOVERS (post) — EOD gainers/losers, each with its WHY (freshest
            headline via the news pipeline, or an honest "no identifiable
            news" — which is itself information: pure momentum/sector beta). */}
        {isPost && (data.movers?.items?.length ?? 0) > 0 && (
          <motion.div variants={item} className="tile-tint flex flex-col p-4">
            <SectionLabel icon={Activity} meta="EOD · settled">Top movers · why</SectionLabel>
            <div className="space-y-2">
              {data.movers!.items.slice(0, 8).map((m) => {
                const w = whyBySymbol[m.symbol]
                return (
                  <div key={m.symbol} className="text-[11.5px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-d-text-primary">{m.symbol}</span>
                      <span className={`numeric ${(m.change_pct ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>{pct(m.change_pct)}</span>
                    </div>
                    {w && (
                      <p className={`mt-0.5 line-clamp-1 text-[10.5px] leading-snug ${w.has_news ? 'text-d-text-secondary' : 'italic text-d-text-muted'}`}>
                        {w.driver}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* TOMORROW'S GAMEPLAN (post) — the desk checklist: deterministic
            bullets from pulse + flows + calendar + tape. Facts, not advice. */}
        {isPost && (data.gameplan?.bullets?.length ?? 0) > 0 && (
          <motion.div variants={item} className="tile-tint flex flex-col p-4 lg:col-span-2">
            <SectionLabel icon={ClipboardList} meta={data.gameplan!.note}>Tomorrow&rsquo;s gameplan</SectionLabel>
            <ul className="space-y-1.5">
              {data.gameplan!.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-d-text-secondary">
                  <span className="mt-0.5 text-primary">▸</span>{b}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* EVENTS (pre) / TOMORROW (post) */}
        {(() => {
          const ev = isPost ? data.tomorrow : data.events
          if (!ev) return null
          return (
            <motion.div variants={item} className="tile-tint flex flex-col p-4">
              <SectionLabel icon={Calendar}>{isPost ? 'Tomorrow' : "Today's events"}</SectionLabel>
              <EventList items={ev.items} expiry={ev.expiry} />
            </motion.div>
          )
        })()}

        {/* NARRATIVE — the AI plan (pre) / wrap (post) */}
        {(() => {
          const block = isPost ? data.wrap : data.plan
          if (!block) return null
          return (
            <motion.div variants={item} className={isPost ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <Narrative block={block} />
            </motion.div>
          )
        })()}
      </div>
    </motion.section>
  )
}
