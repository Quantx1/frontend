'use client'

/**
 * CategorySignalsPage — one trading-horizon page (Intraday / Swing / Positional /
 * Momentum), rebuilt to the competitor "engine-as-landing" archetype (B),
 * re-skinned to Quant X v2 tokens.
 *
 * Structure (1:1 with the reference engine-as-landing pages):
 *   breadcrumb → 56px Bricolage H1 + tagline (decorative render bleeds right)
 *   → CTA row (How it works · Paper-trade · primary Ask AI) → description +
 *   "Learn more →" → "Key Stats" 3-up tiles (real data, honest "—") →
 *   Opening / Closed toggle → "Today's Trade" 3-up signal-CARD grid →
 *   FAQ accordion.
 *
 * Data wiring:
 *   • signals:today / signals:history (getToday + getHistory) for the 3 horizons
 *   • signals:momentum (getMomentum) for the Momentum engine (already ranked)
 *   • signals:swing-ml (getSwing) for the Swing engine — the ML book drives the
 *     open list while the feed serves status 'ok'; anything else (endpoint down,
 *     non-ok status) falls back to the rule-based ensemble path (folded, not
 *     deleted). Closed swing history stays on getHistory either way.
 *   • user:profile drives the min-confidence preset
 *   • computeStats → Key Stats; per-signal link to /signals/[id] preserved
 *   • the intraday broker-gate (BrokerLock) is preserved verbatim
 *
 * Brand firewall: only public engine names (Alpha · Mood · Regime · AutoPilot)
 * ship — never model architectures.
 */

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, Inbox, Play, Sparkles, Star } from '@/lib/icons'

import {
  Badge,
  EmptyState,
  Reveal,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/foundation'
import { SignalCard, type DisplaySignal } from './SignalCard'
import { FaqAccordion } from './FaqAccordion'
import { CATEGORIES, type CategoryId, normalize, categoryOf, isOpen, isClosed, computeStats } from './categories'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { AppShell } from '@/components/shell/AppShell'
import { api } from '@/lib/api'
import { MONO, AI } from '@/lib/tokens'
import { useBrokerStatus } from '@/lib/hooks/useBrokerStatus'
import BrokerLock from '@/components/broker/BrokerLock'

const PERIOD_DAYS = 90

export interface CategoryDemo {
  open: DisplaySignal[]
  closed: DisplaySignal[]
  series?: (s: DisplaySignal) => number[]
}

/** Extra ranked-book fields (momentum + ML-served swing) keyed by signal id,
 *  rendered inline above each card. percentile/expected_return are 0..1
 *  fractions from the API — ×100 at display time. */
interface StyleMeta {
  rank: number
  percentile: number
  expected_return: number
}

export function CategorySignalsPage({
  category,
  demo,
  embedded = false,
}: {
  category: CategoryId
  demo?: CategoryDemo
  /** When embedded inside the /signals hub, drop the outer AppShell + the
   *  breadcrumb and render the intraday BrokerLock inline (only the Intraday
   *  panel is gated — the hub keeps the tab strip so users can switch away). */
  embedded?: boolean
}) {
  const cat = CATEGORIES[category]
  const Icon = cat.icon
  const isMomentum = category === 'momentum'
  const isSwing = category === 'swing'
  const [tab, setTab] = useState<'opening' | 'closed'>('opening')
  // Min-confidence filter — defaults from the user's onboarding preset
  // (user_profiles.signal_filter_defaults.min_confidence, set by the risk
  // quiz). `minConfOverride` is null until the user clicks a chip, so the
  // persisted preset drives the default with no effect/derived-state.
  const [minConfOverride, setMinConfOverride] = useState<number | null>(null)
  const profile = useSWR(demo ? null : 'user:profile', () => api.user.getProfile().catch(() => null), {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  })
  const presetMinConf = Number(profile.data?.signal_filter_defaults?.min_confidence) || 0
  const minConf = minConfOverride ?? presetMinConf

  const today = useSWR(
    demo || isMomentum ? null : 'signals:today',
    () => api.signals.getToday(),
    { revalidateOnFocus: false, refreshInterval: 30_000, dedupingInterval: 10_000, keepPreviousData: true },
  )
  const history = useSWR(
    demo || isMomentum ? null : `signals:history:${PERIOD_DAYS}`,
    () => api.signals.getHistory({ days: PERIOD_DAYS, limit: 300 }),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  )
  // Momentum-specific data source — dedicated endpoint, already ranked.
  const momentumSWR = useSWR(
    demo || !isMomentum ? null : 'signals:momentum',
    () => api.signals.getMomentum(50),
    { revalidateOnFocus: false, refreshInterval: 30_000, dedupingInterval: 10_000 },
  )
  // Swing ML feed — same per-style contract as momentum. It drives the open
  // book ONLY while it serves status:'ok'; endpoint down / non-ok status →
  // the rule-based ensemble path below stays authoritative (honest fallback,
  // never a blend of the two).
  const swingSWR = useSWR(
    demo || !isSwing ? null : 'signals:swing-ml',
    () => api.signals.getSwing(50),
    { revalidateOnFocus: false, refreshInterval: 30_000, dedupingInterval: 10_000 },
  )
  const swingML = isSwing && swingSWR.data?.status === 'ok'

  const { open, closed, styleMeta } = useMemo(() => {
    if (demo) return { open: demo.open, closed: demo.closed, styleMeta: new Map<string, StyleMeta>() }

    // Closed book — history feed. (Momentum's history fetch is disabled above,
    // so its closed list stays empty: the weekly ranked book has no persisted
    // history yet. Swing keeps its closed history even while the ML feed is live.)
    const closedList = (history.data?.signals ?? [])
      .map(normalize)
      .filter((s) => categoryOf(s) === category && isClosed(s))
      .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())

    // Ranked ML book — momentum always; swing while its feed reports 'ok'.
    if (isMomentum || swingML) {
      const raw = (isMomentum ? momentumSWR.data?.signals : swingSWR.data?.signals) ?? []
      const metaMap = new Map<string, StyleMeta>()
      const openList = raw.map((sig) => {
        // Map StyleSignalRaw → DisplaySignal. The ranked books are long-only
        // today (direction 'BUY'), so anything non-short coerces to 'LONG'.
        const symbol = sig.symbol
        const id = `${isMomentum ? 'mom' : 'swing'}-${symbol}`
        const ds: DisplaySignal = {
          id,
          symbol,
          direction: sig.direction === 'SHORT' || sig.direction === 'SELL' ? 'SHORT' : 'LONG',
          entry_price: sig.entry_price,
          target_price: sig.target,
          stop_loss: sig.stop_loss,
          confidence: sig.confidence,
          risk_reward: sig.risk_reward,
          generated_at: new Date().toISOString(),
          status: 'active',
          signal_type: category,
        }
        metaMap.set(id, { rank: sig.rank, percentile: sig.percentile, expected_return: sig.expected_return })
        return ds
      })
      return { open: openList, closed: closedList, styleMeta: metaMap }
    }

    const t = today.data
    const todayRows = t?.all_signals ?? [...(t?.long_signals ?? []), ...(t?.short_signals ?? [])]
    const openList = todayRows
      .map(normalize)
      .filter((s) => categoryOf(s) === category && isOpen(s) && s.confidence >= minConf)
      .sort((a, b) => b.confidence - a.confidence)
    return { open: openList, closed: closedList, styleMeta: new Map<string, StyleMeta>() }
  }, [demo, isMomentum, swingML, momentumSWR.data, swingSWR.data, today.data, history.data, category, minConf])

  const stats = useMemo(() => computeStats(open, closed, cat), [open, closed, cat])
  // Loading — swing waits on BOTH feeds (the ML probe decides which path
  // renders, the ensemble feed is the fallback), so neither state flashes.
  const loading =
    !demo &&
    (isMomentum
      ? momentumSWR.isLoading && !momentumSWR.data
      : (today.isLoading && !today.data) || (isSwing && swingSWR.isLoading && !swingSWR.data))

  const { isConnected, isLoading: brokerLoading } = useBrokerStatus()

  if (category === 'intraday' && !brokerLoading && !isConnected) {
    const lock = (
      <div className="mx-auto max-w-2xl p-4">
        <BrokerLock
          feature="Live intraday signals"
          description="Tick-reactive intraday signals run on your live broker feed. Connect a broker to see them — daily/EOD signals work without one."
        />
      </div>
    )
    // Embedded: gate ONLY the Intraday panel (the hub's tab strip stays, so the
    // user can switch to another horizon). Standalone: full-page gate.
    return embedded ? lock : <AppShell>{lock}</AppShell>
  }

  const list = tab === 'opening' ? open : closed
  const seriesFor = (s: DisplaySignal) => demo?.series?.(s)

  // Key Reads — always-on, honest coverage/freshness. Never a fabricated win-rate
  // or return (those live on the public /track-record once there's a real sample).
  const KEY_READS = [
    { label: 'Setups today', v: loading ? '…' : String(stats.signalsToday) },
    { label: 'Universe', v: 'NSE main board' },
    { label: 'Engines', v: cat.engines.join(' · ') },
  ]

  const body = (
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-4 md:px-6 xl:px-8">
        {/* ── 1. breadcrumb — standalone only; the hub owns the tab strip ── */}
        {!embedded && (
          <Link
            href="/signals"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-d-text-muted transition-colors hover:text-d-text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Signals
          </Link>
        )}

        {/* ── 2. hero — H1 left, decorative render bleeds right ── */}
        <Reveal className="relative mt-8 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_0.78fr]">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-pill border border-line bg-wrap/70 px-3 py-1">
              <Icon size={13} className="text-ai" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-d-text-secondary">
                {cat.hold}
              </span>
            </div>

            <h1 className="heading-display mt-5 text-[clamp(2.4rem,5.4vw,3.5rem)] font-semibold leading-[1.04] tracking-tight text-d-text-primary">
              {cat.title.replace(/ signals$/i, '')}{' '}
              <span className="text-gradient font-bold">Signals</span>
            </h1>
            <p className="mt-3 max-w-md text-[15px] text-d-text-secondary">{cat.tagline}</p>

            {/* ── 3. CTA row ── */}
            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <a
                href="#how-it-works"
                className="inline-flex h-10 items-center gap-1.5 rounded-pill border border-white/20 px-4 text-[13px] font-medium text-d-text-primary transition-colors hover:bg-white/[0.06]"
              >
                <Play className="h-3.5 w-3.5" /> How it works
              </a>
              <Link
                href="/watchlist"
                className="inline-flex h-10 items-center gap-1.5 rounded-pill border border-white/20 px-4 text-[13px] font-medium text-d-text-primary transition-colors hover:bg-white/[0.06]"
              >
                <Star className="h-3.5 w-3.5" /> Add to watchlist
              </Link>
              <button
                type="button"
                onClick={() => dispatchCopilotOpen(`Explain today's ${cat.label.toLowerCase()} signals and how you found them.`)}
                className="bg-gradient-cta group inline-flex h-10 items-center gap-1.5 rounded-pill px-5 text-[13px] font-semibold text-on-signature transition-transform active:scale-[0.97]"
              >
                <Sparkles className="h-3.5 w-3.5" /> Ask AI about these
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* ── 4. description + Learn more → ── */}
            <p className="mt-6 max-w-xl text-[14px] leading-relaxed text-d-text-secondary">{cat.whatIs}</p>
            <a
              href="#how-it-works"
              className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-primary transition-colors hover:opacity-80"
            >
              Learn more <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* per-category hero — a 3D illustrated render (Higgsfield), clearly
              DECORATIVE so it is never mistaken for a live signal (the real,
              live signals are the signal CARDS below). Framed as a clean
              contained premium panel over a soft AI depth pool. */}
          <div className="relative hidden min-h-[240px] items-center lg:flex">
            <div aria-hidden className="bg-radial-glow-ai absolute -inset-6 -z-10 opacity-70" />
            <div className="dark-media relative aspect-[4/3] w-full overflow-hidden rounded-2xl border shadow-[0_30px_70px_-30px_rgba(0,0,0,0.5)]">
              <Image
                src={cat.heroImage}
                alt=""
                aria-hidden
                fill
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>

        {/* ── 5. Key Reads — always-on coverage/freshness (no blank stat, no
            fabricated performance). Win rate + full track record one click away. ── */}
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="heading-display text-[22px] font-bold text-d-text-primary">Key reads</h2>
            <Link
              href="/proof?tab=track-record"
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary transition-opacity hover:opacity-80"
            >
              Win rate &amp; full track record <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {KEY_READS.map((k, i) => (
              <Reveal key={k.label} delay={0.03 * i}>
                <div className="min-h-[92px] rounded-sm border border-line bg-wrap p-4">
                  <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-d-text-muted">
                    {k.label}
                  </div>
                  <div className="mt-2 text-[20px] font-semibold leading-tight text-d-text-primary">{k.v}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 6. Opening / Closed toggle → "Today's Trade" 3-up signal-card grid ── */}
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="heading-display text-[22px] font-bold text-d-text-primary">Today&rsquo;s trade</h2>
            <Tabs value={tab} onValueChange={(v) => setTab(v as 'opening' | 'closed')}>
              <TabsList>
                <TabsTrigger value="opening">
                  Opening
                  {open.length > 0 && <CountPill n={open.length} />}
                </TabsTrigger>
                <TabsTrigger value="closed">
                  Closed
                  {closed.length > 0 && <CountPill n={closed.length} />}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {tab === 'opening' && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-d-text-muted">Min confidence</span>
              {[0, 60, 70, 80].map((c) => {
                const active = minConf === c
                return (
                  <button
                    key={c}
                    onClick={() => setMinConfOverride(c)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                      active
                        ? 'bg-primary/15 text-primary'
                        : 'bg-wrap-hover text-d-text-muted hover:text-d-text-primary'
                    }`}
                  >
                    {c === 0 ? 'All' : `≥ ${c}%`}
                  </button>
                )
              })}
              {minConfOverride === null && presetMinConf > 0 && (
                <span className="text-[10px] text-d-text-muted">· from your risk profile</span>
              )}
            </div>
          )}

          <div className="mt-5">
            {loading ? (
              <CardSkeletons />
            ) : list.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-6 w-6" />}
                title={tab === 'opening' ? `No open ${cat.label.toLowerCase()} signals` : `No closed ${cat.label.toLowerCase()} signals yet`}
                description={
                  <span>
                    {tab === 'opening'
                      ? 'Fresh setups publish here as the scans run. Ask Copilot what’s likely to fire next.'
                      : 'Closed signals with their outcome will appear here as positions resolve.'}
                  </span>
                }
                action={
                  tab === 'opening' ? (
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        `What ${cat.label.toLowerCase()} setups are likely today?`,
                        'Show me names with clean risk-reward',
                        'How is the Nifty regime leaning right now?',
                      ].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => dispatchCopilotOpen(q)}
                          className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-wrap px-3 py-1.5 text-[12px] font-medium text-d-text-secondary transition-colors hover:border-[var(--color-ai)]/40 hover:text-d-text-primary"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-ai" /> {q}
                        </button>
                      ))}
                    </div>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((s, i) => (
                  <Reveal key={s.id} delay={Math.min(i, 6) * 0.03}>
                    <div className="flex flex-col gap-1">
                      {styleMeta.has(s.id) && (
                        <MomentumMetaBar meta={styleMeta.get(s.id)!} />
                      )}
                      <SignalCard s={s} series={seriesFor(s)} />
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── how it works — the AI explainer (anchor target for CTAs) ── */}
        <section id="how-it-works" className="mt-14 max-w-2xl scroll-mt-24">
          <h2 className="heading-display flex items-center gap-2 text-[22px] font-bold text-d-text-primary">
            <Sparkles size={18} className="text-ai" /> How our AI finds them
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {cat.engines.map((e) => (
              <span
                key={e}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium text-ai"
                style={{ borderColor: `color-mix(in srgb, ${AI} 32%, transparent)`, background: `${AI}0F` }}
              >
                <Sparkles size={10} /> {e}
              </span>
            ))}
          </div>
          <ul className="mt-5 space-y-3">
            {cat.howAI.map((line) => (
              <li key={line} className="flex gap-2.5 text-[13.5px] leading-relaxed text-d-text-secondary">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ai" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── 7. FAQ accordion ── */}
        <section className="mt-14 max-w-3xl">
          <h2 className="heading-display text-[22px] font-bold text-d-text-primary">Frequently asked questions</h2>
          <div className="mt-5">
            <FaqAccordion items={cat.faq} />
          </div>
        </section>

        {/* honest disclaimer + detail-link footer */}
        <p className="mt-12 max-w-3xl text-[11px] leading-relaxed text-d-text-muted">
          AI-generated research signals, not investment advice. Markets carry risk; every signal can lose. Tap any
          card above to open its full breakdown at{' '}
          <span className="font-mono">/signals/&lt;id&gt;</span>.
          {' '}
          <Link href="/proof?tab=track-record" className="inline-flex items-center gap-0.5 text-primary hover:opacity-80">
            See the verified track record <ArrowUpRight className="h-3 w-3" />
          </Link>
        </p>
      </div>
  )

  // Standalone route wraps its own AppShell; embedded, the hub owns the single
  // AppShell so we return body-only.
  return embedded ? body : <AppShell>{body}</AppShell>
}

function CountPill({ n }: { n: number }) {
  return (
    <span className="ml-1.5 rounded bg-wrap-hover px-1.5 py-0.5 text-[10px] font-medium text-d-text-muted">{n}</span>
  )
}

function CardSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-sm border border-line bg-wrap p-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 animate-pulse rounded bg-wrap-hover" />
            <div className="h-5 w-12 animate-pulse rounded bg-wrap-hover" />
          </div>
          <div className="mt-3 h-10 w-full animate-pulse rounded bg-wrap-hover" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((j) => <div key={j} className="h-10 animate-pulse rounded bg-wrap-hover" />)}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Momentum-only info bar rendered above each SignalCard on the /signals/momentum page. */
function MomentumMetaBar({ meta }: { meta: { rank: number; percentile: number; expected_return: number } }) {
  const pctSign = meta.expected_return >= 0 ? '+' : ''
  return (
    <div className="flex items-center justify-between rounded-sm border border-line bg-main px-3 py-1.5 text-[11px]">
      <span className="text-d-text-muted">
        Rank <span className={`font-semibold text-d-text-primary ${MONO}`}>#{meta.rank}</span>
      </span>
      <span className="text-d-text-muted">
        Pct <span className={`font-semibold text-d-text-primary ${MONO}`}>{(meta.percentile * 100).toFixed(1)}%</span>
      </span>
      <span className="text-d-text-muted">
        Exp <span className={`font-semibold ${meta.expected_return >= 0 ? 'text-up' : 'text-down'} ${MONO}`}>
          {pctSign}{(meta.expected_return * 100).toFixed(2)}%
        </span>
      </span>
    </div>
  )
}
