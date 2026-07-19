'use client'

/**
 * /copilot — Main Chat hub + marketing home (the default landing).
 *
 * HOME: a centred "ask anything" hero (glowing orb + big composer + agent
 * pills + 3 slim feature cards), then marketing bands below — real track
 * record, how-the-AI-works pipeline, and capability cards that deep-link into
 * each feature page. ACTIVE: messages stream, composer docks. Conversations
 * persist; ?c=<id> resumes a thread picked from the sidebar. Backend:
 * /api/ai/copilot/chat. Public data only on the marketing bands (no LLM).
 *
 * DYNAMIC HOME (chat unification, 2026-07-11): sending from the hero no longer
 * always flips into the full thread. Quick queries — greetings, education,
 * one-tool fact reads — stream into a compact inline answer card right under
 * the composer, keeping the cockpit visible; big tasks (a non-Ask lens,
 * portfolio review, stock research, multi-tool plans — decided from the SSE
 * `meta` frame) expand into the full ChatGPT-style thread mid-stream. Either
 * way the exchange persists as a normal conversation ("Open in chat" resumes
 * it full-page).
 */

import {
  ArrowRight, ArrowUp, ArrowUpRight,
  Loader2, Plus, RefreshCw, Sparkles, Target, X,
} from '@/lib/icons'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'

import { Badge, Button, DisclaimerFooter, EyebrowMono, Reveal, Skeleton, Sparkline } from '@/components/foundation'
import { dispatchCopilotQuotaExhausted } from '@/components/CopilotQuotaModal'
import { HomeCockpit } from '@/components/home/HomeCockpit'
import { useAuth } from '@/contexts/AuthContext'
import { MarkdownMessage } from '@/components/copilot/MarkdownMessage'
import { ProgressRail } from '@/components/copilot/ProgressRail'
import { ReferencesRail } from '@/components/copilot/ReferencesRail'
import { DotPattern } from '@/components/ui/dot-pattern'
import { BlurFade } from '@/components/ui/blur-fade'
import { api, handleApiError, ApiError, type CopilotArtifact, type CopilotStep, type CopilotReference } from '@/lib/api'
import { ChatArtifacts } from '@/components/copilot/ChatArtifacts'
import { useTier } from '@/lib/hooks/useTier'
import { MONO } from '@/lib/tokens'
import { MODES, MODE_PROMPTS, pickGrid, type CopilotMode } from '@/lib/copilot-modes'

// Decorative motif keys for the image-topped feature cards. Each renders a
// lightweight, on-brand SVG/CSS render (no photos) — see FeatureMotif.
type MotifKey = 'candles' | 'sparkline' | 'scan' | 'gauge' | 'flow' | 'pilot'

// Image-topped feature cards — Intellectia's "AI Trading Strategies" 3-up wall,
// mapped to OUR features. Each is a real link with a category eyebrow, title,
// one-line description and a decorative render.
const FEATURE_CARDS: {
  category: string
  name: string
  blurb: string
  href: string
  motif: MotifKey
  /** Optional decorative image backdrop (the 3 cards we have on-brand art for).
   *  When set, the card renders an image media band (dark, fades into the
   *  surface) instead of the SVG motif. */
  image?: string
  tier?: string
}[] = [
  { category: 'SIGNALS', name: 'Swing Signals', blurb: 'Multi-day setups, gated by Regime. Entry, stop, target and the thesis behind every call.', href: '/signals/swing', motif: 'candles', image: '/images/v3/ai-signal.webp' },
  { category: 'SIGNALS', name: 'Momentum', blurb: 'Alpha ranks the whole NSE board by trend strength. The fast-movers, surfaced first.', href: '/signals/momentum', motif: 'sparkline', image: '/images/v3/ai-momentum.webp' },
  { category: 'TOOLS', name: 'AI Scanner', blurb: 'Sweep the board by momentum, breakout, OI or news. No filter fits? Just describe the setup.', href: '/scanner', motif: 'scan', image: '/images/v3/ai-scanner.webp' },
  { category: 'PORTFOLIO', name: 'Portfolio Doctor', blurb: 'Know where your book breaks before it does. Concentration, drawdown, hedges and a rebalance plan.', href: '/portfolio/doctor', motif: 'gauge', image: '/images/v3/ai-risk.webp' },
  { category: 'TOOLS', name: 'AI Algos', blurb: 'Describe a strategy in plain English. We backtest it and gate it before a single rupee trades.', href: '/strategies', motif: 'flow', image: '/images/v3/ai-strategy.webp' },
  { category: 'EXECUTION', name: 'AutoPilot', blurb: 'Hands-off execution on the names the engines rank highest. Regime-aware, hard stops authoritative.', href: '/autopilot', motif: 'pilot', tier: 'Elite', image: '/images/v3/ai-autopilot.webp' },
]

// Cycled through the hero placeholder to hint at what the copilot can do.
const ROTATING_PROMPTS = [
  'Analyse RELIANCE: entry, stop, target and the key risks',
  "What's the strongest swing setup on the tape right now?",
  'Check my portfolio for concentration and drawdown risk',
  'Build a momentum strategy for Nifty 50 and backtest it',
  'Given the VIX, what option structure fits a neutral view?',
  'Scan for oversold large-caps with bullish momentum',
]

interface Turn {
  role: 'user' | 'assistant'
  text: string
  tools?: string[]
  artifacts?: CopilotArtifact[]
  steps?: CopilotStep[]
  references?: CopilotReference[]
  followups?: string[]
}

// Public, brand-safe labels for the tools the copilot consulted — shown as the
// "algorithm trace" under each answer. Never leaks real model/provider names.
const TOOL_LABEL: Record<string, string> = {
  signals: 'Signals', signal: 'Signals', regime: 'Regime', mood: 'Mood',
  sentiment: 'Mood', news: 'Mood', alpha: 'Alpha', portfolio: 'Portfolio',
  doctor: 'Portfolio Doctor', scanner: 'Scanner', screener: 'Scanner',
  stock: 'Analysis', dossier: 'Analysis', vision: 'Analysis', chart: 'Analysis',
  strategy: 'Strategy', backtest: 'Strategy', fno: 'F&O', options: 'F&O',
  market: 'Markets', indices: 'Markets', earnings: 'Markets',
}
const toolLabel = (t: string) =>
  TOOL_LABEL[t.toLowerCase().replace(/[_-].*$/, '')] ??
  TOOL_LABEL[t.toLowerCase()] ??
  t.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const prettyTools = (tools: string[]): string[] =>
  Array.from(new Set(tools.map(toolLabel))).slice(0, 6)

const pctFmt = (v: number | null | undefined, signed = false): string => {
  if (v == null || Number.isNaN(v)) return '—'
  const n = Math.abs(v) <= 1 ? v * 100 : v
  return `${signed && n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

// Follow-up chips offered under the latest assistant reply.
const FOLLOWUPS = ['Explain simply', 'Show the risks', 'What would change this?']

// ── Context-aware ("AI awareness") suggestions ── when the composer input names
// a stock/index, the suggestion sheet swaps to that instrument across every
// intent (analyse · buy-or-not · trade plan · news · portfolio fit) instead of
// the generic lens prompts. Detection is a real curated NSE set + common
// aliases + @MENTION + a lone ALL-CAPS ticker — client-only, no backend call.
const POPULAR_SYMBOLS = [
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'TATASTEEL',
  'ADANIENT', 'ADANIPORTS', 'WIPRO', 'HCLTECH', 'ITC', 'LT', 'AXISBANK', 'KOTAKBANK',
  'BHARTIARTL', 'HINDUNILVR', 'MARUTI', 'BAJFINANCE', 'BAJAJFINSV', 'SUNPHARMA', 'ASIANPAINT',
  'TITAN', 'NESTLEIND', 'ULTRACEMCO', 'POWERGRID', 'NTPC', 'ONGC', 'COALINDIA', 'JSWSTEEL',
  'DRREDDY', 'CIPLA', 'DMART', 'ZOMATO', 'PAYTM', 'IRCTC', 'DLF', 'VEDL', 'HINDALCO',
  'NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX',
]
const SYMBOL_ALIASES: Record<string, string> = {
  'bank nifty': 'BANKNIFTY', 'nifty bank': 'BANKNIFTY', 'fin nifty': 'FINNIFTY',
  'tata motors': 'TATAMOTORS', 'tata steel': 'TATASTEEL', 'hdfc bank': 'HDFCBANK',
  'icici bank': 'ICICIBANK', 'axis bank': 'AXISBANK', 'kotak bank': 'KOTAKBANK',
  'state bank': 'SBIN', 'reliance industries': 'RELIANCE', 'bajaj finance': 'BAJFINANCE',
  infosys: 'INFY', reliance: 'RELIANCE', icici: 'ICICIBANK', sbi: 'SBIN', hdfc: 'HDFCBANK',
  airtel: 'BHARTIARTL', maruti: 'MARUTI', titan: 'TITAN', zomato: 'ZOMATO', adani: 'ADANIENT',
}

/** Best-effort stock/index the input is about, or null. @MENTION and aliases
 *  win over a bare ALL-CAPS token so "buy hdfc bank" resolves cleanly. */
function detectSymbol(text: string): string | null {
  const t = text.trim()
  if (!t) return null
  const at = t.match(/@([A-Za-z][A-Za-z0-9&_-]{1,14})/)
  if (at) return at[1].toUpperCase()
  const lower = t.toLowerCase()
  for (const [alias, sym] of Object.entries(SYMBOL_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(lower)) return sym
  }
  const upper = t.toUpperCase()
  for (const sym of POPULAR_SYMBOLS) {
    if (new RegExp(`\\b${sym}\\b`).test(upper)) return sym
  }
  const tok = t.match(/\b([A-Z]{3,12})\b/)
  return tok ? tok[1] : null
}

/** Cross-intent, instrument-aware prompts once we know what the user means. */
function symbolSuggestions(sym: string): string[] {
  return [
    `Analyse ${sym}: trend, key levels, entry, stop and target.`,
    `Is ${sym} a buy right now — the bull vs bear case.`,
    `Plan a swing trade in ${sym} with position sizing.`,
    `What's the latest news and sentiment on ${sym}?`,
    `How would ${sym} fit my portfolio's risk?`,
  ]
}

// The "thinking" trace is now the honest, streamed <ProgressRail> (WP-RAILS) —
// it replaces the old hardcoded THINK_STEPS terminal with real telemetry
// (reasoning stages + tool calls + durations) projected from the copilot.

// GenUI artifact cards (ArtifactCard / ChatArtifacts) moved to the shared
// components/copilot/ChatArtifacts module (2026-07-11) so the Main Chat, the
// dynamic-home inline answer, AND the dock render them identically. Imported
// above as ChatArtifacts.

// ── Inline quick answer (dynamic home) ── the latest exchange, rendered
// borderless INSIDE the hero composer box (2026-07-12): the box "draws down" to
// hold the live thinking trace + streamed answer, so quick queries never yank
// the user away from the cockpit. "Open in chat" switches to the full thread
// (same turns, same saved conversation); dismissing only clears local state —
// the conversation stays in the sidebar's Recent list. Task-sized turns escalate
// to the full chat page (see isBigTask) and never render here.
function HomeInlineAnswer({
  turns,
  pending,
  onOpenThread,
  onDismiss,
  onFollowUp,
}: {
  turns: Turn[]
  pending: boolean
  onOpenThread: () => void
  onDismiss: () => void
  onFollowUp: (p: string) => void
}) {
  const last = turns[turns.length - 1]
  const ask = turns[turns.length - 2]
  if (!last || last.role !== 'assistant') return null
  const thinking = pending && !last.text
  return (
    <div className="text-left">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2 shrink-0">
          {pending && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ai opacity-60" />}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-ai" />
        </span>
        <EyebrowMono className="shrink-0 text-d-text-primary">QUANT X</EyebrowMono>
        {ask?.role === 'user' && (
          <span className="min-w-0 truncate font-mono text-[11px] text-d-text-muted">· {ask.text}</span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onOpenThread}
            aria-label="Open in full chat"
            className="inline-flex items-center gap-1 rounded-pill border border-line px-2 py-1 font-mono text-[10.5px] text-d-text-muted transition-colors hover:border-white/30 hover:text-d-text-primary"
          >
            Open in chat <ArrowUpRight size={11} />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss answer"
            className="grid h-6 w-6 place-items-center rounded-md text-d-text-muted transition-colors hover:bg-wrap-hover hover:text-d-text-primary"
          >
            <X size={12} />
          </button>
        </div>
      </div>
      <div className="mt-3 max-h-[46vh] space-y-3 overflow-y-auto pr-1">
        {last.artifacts && last.artifacts.length > 0 && <ChatArtifacts artifacts={last.artifacts} />}
        {thinking ? (
          <ProgressRail steps={last.steps ?? []} live />
        ) : (
          <div className="text-[13.5px] leading-relaxed text-d-text-secondary">
            <MarkdownMessage content={last.text} />
          </div>
        )}
        {!thinking && last.references && last.references.length > 0 && (
          <ReferencesRail refs={last.references} />
        )}
        {!pending && last.text && (
          <div className="flex flex-wrap gap-1.5">
            {(last.followups && last.followups.length ? last.followups : FOLLOWUPS).map((f) => (
              <Button key={f} variant="secondary" size="sm" onClick={() => onFollowUp(f)}>
                <ArrowRight size={10} />
                {f}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Home ticker ("loader") ── ONE continuous horizontal scrolling marquee
// below the composer that streams BOTH the headline indices (NIFTY 50 ·
// India VIX · BANK NIFTY · SENSEX, from publicTrust.indices, 30s CDN cache) AND
// the 50 NIFTY constituents with live quotes (screener.indexConstituents +
// screener.getLivePrices, chunked, 20s refresh — the SAME data approach the old
// grid used). Each item resolves IN: a compact shimmer while its price loads,
// then a brief duotone green/red flash ONLY on a genuine tick. Linear scroll,
// pauses on hover, reduced-motion-safe (static wrapped strip — no scroll, no
// flash). Honest-empty: if BOTH feeds are down we show "Live market data
// unavailable" — never a fabricated price. Thin full-width strip, border-y,
// mono tabular ₹, Plus-Jakarta caps labels, masked edge fades.
const NIFTY50_INDEX = 'NIFTY 50'

const cleanSym = (s: string) => String(s || '').replace('.NS', '').toUpperCase()

// Mirror the field access the /stocks browser uses for the live-price payload.
function readQuote(p: Record<string, any>) {
  return {
    price: Number(p.price ?? p.last_price ?? 0),
    changePct: Number(p.change_percent ?? p.change_pct ?? 0),
  }
}

// A single resolved ticker item. `loading` → compact shimmer (the "loader"
// feel); otherwise label + mono ₹ price + duotone %. `invert` flips the tone
// for VIX (rising fear reads red).
interface TickerItem {
  key: string
  label: string
  price: number | null
  changePct: number | null
  invert?: boolean
}

// One marquee item. Holds its own last-seen price so it flashes ONLY on a real
// change (unchanged values never re-animate). The flash is a GPU opacity-only
// overlay that re-mounts per tick (≤300ms, ease-out; the global reduced-motion
// guard collapses it to ~0). `animate` is false under reduced motion.
function TickerCell({ item, animate }: { item: TickerItem; animate: boolean }) {
  const loading = item.price == null
  const lastRef = useRef<number | null>(null)
  const [flash, setFlash] = useState<{ dir: 'up' | 'down'; key: number } | null>(null)
  useEffect(() => {
    if (item.price == null) return
    const prev = lastRef.current
    if (animate && prev != null && item.price !== prev) {
      setFlash({ dir: item.price > prev ? 'up' : 'down', key: Date.now() })
    }
    lastRef.current = item.price
  }, [item.price, animate])

  // VIX inverts: rising VIX (fear) reads red, falling reads green.
  const rawUp = (item.changePct ?? 0) >= 0
  const up = item.invert ? !rawUp : rawUp
  return (
    <li className="relative inline-flex shrink-0 items-baseline gap-2.5 overflow-hidden rounded-sm px-1 text-[13px]">
      {flash && (
        <span
          key={flash.key}
          aria-hidden
          className={`pointer-events-none absolute inset-0 rounded-sm ${flash.dir === 'up' ? 'price-flash-up' : 'price-flash-down'}`}
        />
      )}
      <span aria-hidden className={`h-1.5 w-1.5 self-center rounded-pill ${loading ? 'bg-d-text-muted/40' : up ? 'bg-up' : 'bg-down'}`} />
      <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-d-text-muted">{item.label}</span>
      {loading ? (
        <Skeleton w="56px" h="13px" rounded="sm" className="self-center" />
      ) : (
        <>
          <span className={`numeric tabular-nums font-medium text-d-text-primary ${MONO}`}>
            ₹{item.price!.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {item.changePct != null && (
            <span className={`numeric tabular-nums text-[12px] ${MONO} ${up ? 'text-up' : 'text-down'}`}>
              {rawUp ? '+' : ''}{item.changePct.toFixed(2)}%
            </span>
          )}
        </>
      )}
    </li>
  )
}

// Detect prefers-reduced-motion in JS (the CSS guard already neutralises the
// marquee + flash; we ALSO need it to drop the duplicated track and let the
// strip wrap statically rather than freeze mid-scroll with double items).
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

function HomeTicker() {
  const reduced = usePrefersReducedMotion()

  // Headline indices — the same public feed the cockpit already used.
  const { data: idxData, error: idxErr } = useSWR('public-indices', () => api.publicTrust.indices(), {
    refreshInterval: 30_000, dedupingInterval: 15_000, revalidateOnFocus: false,
  })

  // NIFTY 50 constituents (once) — the real membership the app already knows.
  const { data: constData, error: constErr } = useSWR(
    'home:nifty50-constituents',
    () => api.screener.indexConstituents(NIFTY50_INDEX, 60),
    { revalidateOnFocus: false, dedupingInterval: 5 * 60_000 },
  )
  const symbols: string[] = (constData?.constituents ?? []).map((c) => c.symbol).slice(0, 50)

  // Live quotes for the constituents — chunked by 50, refreshed every 20s.
  const { data: quotes } = useSWR<Record<string, { price: number; changePct: number }>>(
    symbols.length ? ['home:nifty50-prices', symbols.join(',')] : null,
    async () => {
      const map: Record<string, { price: number; changePct: number }> = {}
      for (let i = 0; i < symbols.length; i += 50) {
        const chunk = symbols.slice(i, i + 50)
        try {
          const json = await api.screener.getLivePrices(chunk)
          if (json?.success && Array.isArray(json.prices)) {
            for (const p of json.prices) {
              const key = cleanSym(p.symbol)
              if (key) map[key] = readQuote(p)
            }
          }
        } catch { /* honest-empty: items stay shimmering until quotes resolve */ }
      }
      return map
    },
    { refreshInterval: 20_000, dedupingInterval: 10_000, revalidateOnFocus: false, keepPreviousData: true },
  )

  // Build the single stream: indices first, then the 50 constituents.
  const idxItems: TickerItem[] = (idxData?.indices ?? []).map((r) => ({
    key: `idx-${r.key}`,
    label: r.label,
    price: r.last,
    changePct: r.change_pct,
    invert: r.key === 'vix',
  }))
  const stockItems: TickerItem[] = symbols.map((s) => {
    const q = quotes?.[cleanSym(s)]
    const has = q && q.price > 0
    return {
      key: `stk-${cleanSym(s)}`,
      label: cleanSym(s),
      price: has ? q!.price : null,
      changePct: has ? q!.changePct : null,
    }
  })
  const items = [...idxItems, ...stockItems]

  // A feed is "settled" once it has either returned data or errored; "down"
  // means it settled with nothing usable. We only show honest-empty when BOTH
  // feeds are settled-and-down — while either is still in flight we keep the
  // shimmering loader up (never a fabricated row, never a premature error).
  const idxSettled = !!idxData || !!idxErr
  const constSettled = !!constData || !!constErr
  const indicesDown = idxErr || (idxData && idxData.indices.length === 0)
  const stocksDown = constErr || (constData && symbols.length === 0)
  if (items.length === 0 && idxSettled && constSettled && indicesDown && stocksDown) {
    return (
      <div className="relative -mx-4 border-y border-line bg-wrap/30">
        <p className="py-3 text-center font-sans text-[10.5px] uppercase tracking-[0.12em] text-d-text-muted">
          Live market data unavailable
        </p>
      </div>
    )
  }

  // No items yet but at least one feed is still loading — render shimmering
  // placeholders so the strip has shape immediately (the "loader" reads in).
  const list: TickerItem[] = items.length
    ? items
    : Array.from({ length: 12 }, (_, i) => ({ key: `ph-${i}`, label: '•••', price: null, changePct: null }))

  // Duration scales with item count so the linear speed stays consistent as the
  // stream grows from indices-only → indices + 50 stocks.
  const duration = Math.max(40, Math.round(list.length * 2.4))

  // Reduced-motion: a static, WRAPPED strip (no scroll, single track, no flash).
  if (reduced) {
    return (
      <div className="relative -mx-4 border-y border-line bg-wrap/30">
        <ul className="flex flex-wrap items-center gap-x-7 gap-y-2 px-4 py-3" aria-label="Live market data">
          {list.map((it) => <TickerCell key={it.key} item={it} animate={false} />)}
        </ul>
      </div>
    )
  }

  // Default: one continuous linear marquee. The track is duplicated so a -50%
  // translate loops seamlessly; it pauses on hover and fades at both edges.
  return (
    <div className="relative -mx-4 border-y border-line bg-wrap/30">
      <div className="marquee-pause mask-edge-fade relative overflow-hidden py-3">
        <ul
          className="flex w-max items-center gap-9 whitespace-nowrap animate-marquee"
          style={{ ['--marquee-duration' as string]: `${duration}s` }}
          aria-label="Live market data"
        >
          {[...list, ...list].map((it, i) => (
            <TickerCell key={`${it.key}-${i}`} item={it} animate />
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── Decorative feature-card renders ── lightweight, on-brand SVG motifs (mono
// strokes + duotone green/red + the signature mint), NOT photos. They sit on
// the right edge of each image-topped card, masked to fade out so the title
// stays the focus. currentColor inherits the muted ink; up/down use tokens.
function FeatureMotif({ kind }: { kind: MotifKey }) {
  const UP = 'var(--color-up)'
  const DOWN = 'var(--color-down)'
  const SIG = 'var(--color-primary)' // v2 signature teal-green token
  const common = 'h-full w-full'
  switch (kind) {
    case 'candles': // mini candlestick chart
      return (
        <svg viewBox="0 0 120 80" className={common} fill="none" preserveAspectRatio="xMidYMid meet">
          {[
            { x: 14, o: 50, c: 34, h: 26, l: 58, up: true }, { x: 30, o: 44, c: 52, h: 38, l: 60, up: false },
            { x: 46, o: 40, c: 28, h: 22, l: 46, up: true }, { x: 62, o: 30, c: 38, h: 24, l: 44, up: false },
            { x: 78, o: 36, c: 20, h: 14, l: 40, up: true }, { x: 94, o: 22, c: 16, h: 10, l: 30, up: true },
          ].map((b, i) => {
            const col = b.up ? UP : DOWN
            const top = Math.min(b.o, b.c); const ht = Math.max(4, Math.abs(b.o - b.c))
            return (
              <g key={i} stroke={col}>
                <line x1={b.x} y1={b.h} x2={b.x} y2={b.l} strokeWidth="1.5" />
                <rect x={b.x - 4} y={top} width="8" height={ht} fill={col} opacity={0.85} />
              </g>
            )
          })}
        </svg>
      )
    case 'sparkline': // momentum sparkline with a glowing endpoint
      return (
        <svg viewBox="0 0 120 80" className={common} fill="none" preserveAspectRatio="xMidYMid meet">
          <path d="M4 62 L24 56 L40 60 L58 44 L74 48 L92 26 L116 14" stroke={SIG} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 62 L24 56 L40 60 L58 44 L74 48 L92 26 L116 14 L116 78 L4 78 Z" fill={SIG} opacity={0.1} />
          <circle cx="116" cy="14" r="3.5" fill={SIG} />
          <circle cx="116" cy="14" r="6.5" fill={SIG} opacity={0.25} />
        </svg>
      )
    case 'scan': // scanner — scattered dots with a sweep line
      return (
        <svg viewBox="0 0 120 80" className={common} fill="none" preserveAspectRatio="xMidYMid meet">
          {[[18, 22], [40, 50], [30, 64], [62, 30], [54, 16], [80, 58], [72, 44], [96, 24], [104, 52], [88, 70]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 3 : 2} fill="currentColor" opacity={0.5} />
          ))}
          <line x1="74" y1="6" x2="74" y2="74" stroke={SIG} strokeWidth="1.5" />
          <circle cx="62" cy="30" r="4" fill={SIG} />
        </svg>
      )
    case 'gauge': // portfolio doctor — risk arc gauge
      return (
        <svg viewBox="0 0 120 80" className={common} fill="none" preserveAspectRatio="xMidYMid meet">
          <path d="M22 64 A38 38 0 0 1 98 64" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity={0.25} />
          <path d="M22 64 A38 38 0 0 1 80 33" stroke={SIG} strokeWidth="6" strokeLinecap="round" />
          <line x1="60" y1="64" x2="78" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="60" cy="64" r="4" fill="currentColor" />
        </svg>
      )
    case 'flow': // strategy — node/pattern flow lines
      return (
        <svg viewBox="0 0 120 80" className={common} fill="none" preserveAspectRatio="xMidYMid meet">
          <path d="M16 24 H52 M52 24 V56 M52 56 H86" stroke="currentColor" strokeWidth="1.5" opacity={0.5} />
          <path d="M52 24 H86" stroke={SIG} strokeWidth="1.5" />
          {[[16, 24], [52, 24], [52, 56], [86, 24], [86, 56]].map(([cx, cy], i) => (
            <rect key={i} x={cx - 5} y={cy - 5} width="10" height="10" rx="2" fill={i === 3 ? SIG : 'currentColor'} opacity={i === 3 ? 1 : 0.6} />
          ))}
          <circle cx="104" cy="24" r="3.5" stroke={SIG} strokeWidth="1.5" />
        </svg>
      )
    case 'pilot': // autopilot — orbiting target / automation
    default:
      return (
        <svg viewBox="0 0 120 80" className={common} fill="none" preserveAspectRatio="xMidYMid meet">
          <circle cx="70" cy="40" r="26" stroke="currentColor" strokeWidth="1.5" opacity={0.4} />
          <circle cx="70" cy="40" r="14" stroke={SIG} strokeWidth="1.5" />
          <circle cx="70" cy="40" r="4" fill={SIG} />
          <circle cx="96" cy="40" r="3.5" fill="currentColor" opacity={0.7} />
          <path d="M70 14 A26 26 0 0 1 96 40" stroke={SIG} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
  }
}

function CopilotHub() {
  const { tier, copilotDailyCap, isAdmin } = useTier()
  const { user, loading: authLoading } = useAuth()
  const { mutate } = useSWRConfig()
  const searchParams = useSearchParams()
  const lastLoadedRef = useRef<string | null>(null)

  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loadingThread, setLoadingThread] = useState(false)
  const [streamIdx, setStreamIdx] = useState<number | null>(null) // assistant turn being typed out
  const [streamN, setStreamN] = useState(0)
  const [phIdx, setPhIdx] = useState(0) // rotating hero placeholder
  const [mode, setMode] = useState<CopilotMode>('ask') // active empty-state lens
  const [gridOffset, setGridOffset] = useState(0) // rotates the suggestion window
  const [composerFocused, setComposerFocused] = useState(false) // drives the in-box suggestion drop-down
  // Dynamic home (2026-07-11): which surface owns the conversation. 'home'
  // keeps the hero + cockpit with quick answers inline; 'thread' is the full
  // ChatGPT-style Main Chat. Escalation is decided per-send from the stream's
  // meta frame (see isBigTask).
  const [view, setView] = useState<'home' | 'thread'>('home')
  // MODES is an ARRAY — look the active lens up by key (never MODES[mode]).
  const activeMode = MODES.find((m) => m.key === mode) ?? MODES[0]
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // True while a live token stream is in flight — disables the client-side
  // typewriter (which is only used for the non-streaming fallback path).
  const streamingRef = useRef(false)

  // Auto-grow the composer to fit the prompt — the box "draws down" as you type
  // and snaps back to one line on send. Capped at 176px (≈7 lines), then the
  // textarea scrolls. Re-measures on view change (hero ↔ docked textarea).
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 176)}px`
  }, [input, view])

  // Real, public track record for the marketing band (no auth, no LLM).
  const { data: track } = useSWR(
    'home:track-record',
    () => api.publicTrust.trackRecord({ days: 90 }).catch(() => null),
    { revalidateOnFocus: false },
  )

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns, pending, streamN])

  // Typewriter reveal (fallback path only): when a fresh assistant turn lands
  // via the non-streaming call, type it out. Live token streams set
  // streamingRef + streamN=MAX so this no-ops for them.
  useEffect(() => {
    if (streamingRef.current) return
    const i = turns.length - 1
    if (turns[i]?.role === 'assistant' && i !== streamIdx) {
      setStreamIdx(i)
      setStreamN(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turns])
  useEffect(() => {
    if (streamIdx == null) return
    const full = turns[streamIdx]?.text ?? ''
    if (streamN >= full.length) return
    const t = setTimeout(() => setStreamN((v) => Math.min(full.length, v + 4)), 14)
    return () => clearTimeout(t)
  }, [streamN, streamIdx, turns])

  const isHome = view === 'home' && !loadingThread

  useEffect(() => {
    if (!loadingThread) inputRef.current?.focus()
  }, [isHome, loadingThread])

  // Rotate the hero placeholder through example prompts while the box is empty.
  useEffect(() => {
    if (!isHome || input) return
    const t = setInterval(() => setPhIdx((i) => (i + 1) % ROTATING_PROMPTS.length), 3800)
    return () => clearInterval(t)
  }, [isHome, input])

  // Resume a thread picked from the sidebar (/copilot?c=<id>) — reactive to the
  // query param so it works even when already on /copilot. Guarded so clicking
  // the same chat twice is a no-op.
  const cParam = searchParams?.get('c') ?? null
  useEffect(() => {
    if (cParam && cParam !== lastLoadedRef.current) {
      lastLoadedRef.current = cParam
      openConversation(cParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cParam])

  // Prefill the composer from /copilot?q=<question> — the embedded-agent
  // "Ask a follow-up" composers hand off here with the question loaded, ready
  // for the user to review and send (one credit is only spent on send).
  const qParam = searchParams?.get('q') ?? null
  const qLoadedRef = useRef<string | null>(null)
  useEffect(() => {
    if (qParam && qParam !== qLoadedRef.current) {
      qLoadedRef.current = qParam
      setInput(qParam)
      inputRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam])

  const tierLabel = isAdmin
    ? 'Admin · unlimited'
    : tier === 'elite'
      ? 'Elite · unlimited'
      : tier === 'pro'
        ? `Pro · ${copilotDailyCap}/day`
        : `Free · ${copilotDailyCap}/day`

  const openConversation = async (id: string) => {
    setLoadingThread(true)
    setError(null)
    setView('thread')
    try {
      const r = await api.ai.copilotGetConversation(id)
      setConversationId(r.id)
      setTurns(r.messages.map((m) => ({ role: m.role, text: m.content })))
      // A loaded thread is already complete — don't type it out.
      setStreamIdx(r.messages.length - 1)
      setStreamN(Number.MAX_SAFE_INTEGER)
    } catch (e) {
      setError(handleApiError(e))
    } finally {
      setLoadingThread(false)
    }
  }

  const newConversation = () => {
    setConversationId(null)
    setTurns([])
    setInput('')
    setError(null)
    setStreamIdx(null)
    setStreamN(0)
    setView('home')
    inputRef.current?.focus()
  }

  const isQuota = (msg: string, e?: unknown) =>
    /exhausted|quota|daily.*(cap|limit)|too many/i.test(msg) || (e instanceof ApiError && e.status === 402)

  const showQuotaModal = async () => {
    try {
      const u = await api.assistant.getUsage()
      dispatchCopilotQuotaExhausted(u.usage)
    } catch {
      /* fall through to inline error */
    }
  }

  // Small-vs-big triage for the dynamic home (2026-07-11). The stream's meta
  // frame arrives BEFORE any prose (the copilot graph plans + calls tools
  // eagerly), so by first paint we know what this turn actually needed:
  // greetings/education/one-tool fact reads stay in the inline home card;
  // a non-Ask lens, portfolio/stock/signal work, or a multi-tool plan is a
  // task → escalate to the full thread mid-stream.
  const isBigTask = (meta: { intent?: string; tools_used?: string[] }) =>
    mode !== 'ask' ||
    ['portfolio_review', 'stock_research', 'signal_explain'].includes(meta.intent ?? '') ||
    (meta.tools_used?.length ?? 0) >= 2

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || pending) return
    setError(null)
    setPending(true)
    const fromHome = view === 'home'

    const history = turns.map((t) => ({ role: t.role, content: t.text }))
    // Display-raw / send-augmented (mirror CopilotProvider L189-206): the stored
    // user turn + history are built from the RAW text; the active mode-lens
    // directive is applied ONLY to the outgoing API message field, so it never
    // enters history and compounds. 'ask' → prefix '' → free typing unchanged.
    const outgoing = `${activeMode.prefix({})}${message}`
    // Append the user turn + an empty assistant turn we stream into.
    const assistantIdx = turns.length + 1
    setTurns((t) => [...t, { role: 'user', text: message }, { role: 'assistant', text: '' }])
    setInput('')
    // Mark the streamed turn as already-revealed so the typewriter no-ops.
    streamingRef.current = true
    setStreamIdx(assistantIdx)
    setStreamN(Number.MAX_SAFE_INTEGER)

    const patch = (fn: (a: Turn) => Turn) =>
      setTurns((t) => t.map((x, i) => (i === assistantIdx ? fn(x) : x)))

    let acc = ''
    let gotToken = false

    try {
      await api.ai.copilotChatStream(
        {
          message: outgoing,
          history,
          conversation_id: conversationId ?? undefined,
          persist: true,
          // Keep mode-lens scaffolding out of the saved thread.
          display_message: message,
        },
        {
          onMeta: ({ tools_used, artifacts, progress, references, intent }) => {
            patch((a) => ({
              ...a,
              tools: tools_used,
              artifacts,
              steps: progress ?? a.steps,
              references: references ?? a.references,
            }))
            // Dynamic home: escalate task-sized turns into the full thread.
            if (fromHome && isBigTask({ intent, tools_used })) setView('thread')
          },
          onToken: (tok) => {
            gotToken = true
            acc += tok
            patch((a) => ({ ...a, text: acc }))
          },
          onDone: ({ reply, tools_used, references, followups }) =>
            patch((a) => ({
              ...a,
              text: reply || a.text || acc,
              tools: a.tools && a.tools.length ? a.tools : tools_used,
              // done carries references with `cited` flags → prefer them.
              references: references ?? a.references,
              followups: followups ?? a.followups,
            })),
          onSaved: (cid) => {
            if (cid) {
              setConversationId(cid)
              mutate('copilot:conversations') // refresh the sidebar Recent list
            }
          },
          onError: (m) => {
            // Only surface as a hard error if nothing streamed yet; otherwise
            // keep the partial reply and let the catch below handle fallback.
            if (!gotToken) throw new Error(m)
          },
        },
      )
    } catch (streamErr) {
      const sMsg = handleApiError(streamErr)
      // On a dead send from the home hero, drop BOTH staged turns so the hero
      // stays clean (in the thread only the empty assistant bubble goes).
      const dropStaged = (t: Turn[]) =>
        t.filter((_, i) => i !== assistantIdx && !(fromHome && i === assistantIdx - 1))
      if (isQuota(sMsg, streamErr)) {
        await showQuotaModal()
        setTurns(dropStaged)
        setError(sMsg)
        setInput(message)
      } else if (!gotToken) {
        // Streaming broke before any token — fall back to the non-streaming
        // endpoint so the user still gets an answer.
        try {
          const r = await api.ai.copilotChat({
            message: outgoing,
            history,
            conversation_id: conversationId ?? undefined,
            persist: true,
            display_message: message,
          })
          patch((a) => ({ ...a, text: r.reply, tools: r.tools_used }))
          if (fromHome && isBigTask({ intent: r.intent, tools_used: r.tools_used })) {
            setView('thread')
          }
          if (r.conversation_id) {
            setConversationId(r.conversation_id)
            mutate('copilot:conversations')
          }
        } catch (e2) {
          const msg = handleApiError(e2)
          if (isQuota(msg, e2)) await showQuotaModal()
          setTurns(dropStaged)
          setError(msg)
          setInput(message)
        }
      } else {
        // Partial stream then dropped — keep what we have, soft-note it.
        setError(sMsg)
      }
    } finally {
      setPending(false)
      streamingRef.current = false
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends · Shift+Enter newline · ⌘/Ctrl+Enter also sends.
    if (e.key === 'Enter' && (!e.shiftKey || e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      send(input)
    }
  }

  const usePrompt = (p: string) => {
    setInput(p)
    inputRef.current?.focus()
  }

  // Context-aware suggestions for the in-box drop-down (AI awareness):
  //  1. input names a stock/index → that instrument across every intent
  //     (analyse · buy-or-not · trade plan · news · portfolio fit),
  //  2. else typing → fuzzy-filter the active lens's pool,
  //  3. else empty + focused → a rotating starter window (Shuffle pages it).
  // Selecting one FILLS the box (usePrompt → no surprise send). Kept to the
  // empty home state (turns === 0) — once an answer is live the box owns it.
  const q = input.trim().toLowerCase()
  const detectedSym = detectSymbol(input)
  const pool = MODE_PROMPTS[mode]
  const suggestions = detectedSym
    ? symbolSuggestions(detectedSym)
    : q
      ? pool.filter((p) => p.toLowerCase().includes(q)).slice(0, 6)
      : pickGrid(pool, gridOffset, 5)
  const SugIcon = detectedSym ? Target : activeMode.icon
  const sugLabel = detectedSym ? detectedSym : activeMode.label
  const sugKind = detectedSym ? 'About' : q ? 'Matching' : 'Suggested'
  const showSuggest = composerFocused && !pending && turns.length === 0 && suggestions.length > 0

  // ── Composer ── hero = a rounded-2xl hairline card with a leading AI glyph,
  // an in-box mode toolbar (the 5-lens selector) and a circular signature send
  // button; an animated suggestion sheet drops down from the box on focus.
  // Docked (non-hero) keeps the slim xAI pill. Enter sends · Shift+Enter newline
  // · ⌘-Enter also sends (see onKey) · disabled while streaming.
  const composer = (hero: boolean) => {
    const isz = hero ? 18 : 16
    const sendBtn = (
      <button
        onClick={() => send(input)}
        disabled={pending || !input.trim()}
        aria-label={pending ? 'Sending…' : 'Send message'}
        aria-busy={pending}
        className={
          hero
            ? 'bg-gradient-cta grid h-10 w-10 shrink-0 place-items-center rounded-pill text-main transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30'
            : 'grid h-9 w-9 shrink-0 place-items-center rounded-pill border border-white bg-white text-main transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] enabled:hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30'
        }
      >
        {pending ? <Loader2 size={hero ? 18 : 16} className="animate-spin" /> : <ArrowUp size={isz} />}
      </button>
    )

    if (!hero) {
      // Docked pill — unchanged single-row layout.
      return (
        <div className="group relative flex items-end gap-2 rounded-pill border border-line bg-wrap-hover p-2 pl-4 transition-colors duration-150 ease-out focus-within:border-white/30">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            aria-label="Ask Quant X. Type @SYMBOL to reference a stock"
            placeholder="Ask anything. A stock, your book, a setup."
            rows={1}
            maxLength={2000}
            disabled={pending}
            className="max-h-40 min-h-[2.25rem] flex-1 resize-none self-center bg-transparent py-2 font-mono text-[14px] text-d-text-primary outline-none focus:outline-none focus-visible:outline-none placeholder:font-mono placeholder:text-d-text-muted disabled:opacity-50"
          />
          {sendBtn}
        </div>
      )
    }

    // Hero — a premium chat panel: a roomy rounded box with an accent-glow
    // border on focus, split by a hairline divider into an INPUT region (glyph +
    // textarea) and a TOOLBAR region (the 5-lens selector + send). The in-box
    // answer draws down below it; the suggestion sheet drops from the box.
    return (
      <div className="relative">
        <div
          className="group relative overflow-hidden rounded-2xl border border-line bg-wrap-hover transition-[border-color,box-shadow] duration-200 ease-out"
          style={
            composerFocused
              ? {
                  borderColor: 'color-mix(in srgb, var(--color-up) 60%, transparent)',
                  boxShadow:
                    '0 0 0 1px color-mix(in srgb, var(--color-up) 42%, transparent), 0 14px 50px -16px color-mix(in srgb, var(--color-up) 42%, transparent)',
                }
              : undefined
          }
        >
          {/* accent-glow wash across the top edge, on focus */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24 transition-opacity duration-300"
            style={{
              opacity: composerFocused ? 1 : 0,
              background:
                'radial-gradient(90% 80% at 50% 0%, color-mix(in srgb, var(--color-up) 16%, transparent), transparent 65%)',
            }}
          />

          {/* ── INPUT region — leading AI glyph + auto-growing textarea ── */}
          <div className="relative flex items-start gap-3 px-4 pt-4 pb-3">
            <span aria-hidden className="mt-1.5 grid h-6 w-6 shrink-0 place-items-center text-ai">
              <Sparkles size={18} />
            </span>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              aria-label="Ask Quant X. Type @SYMBOL to reference a stock"
              placeholder={mode === 'ask' ? ROTATING_PROMPTS[phIdx] : activeMode.placeholder}
              rows={1}
              maxLength={2000}
              disabled={pending}
              className="max-h-44 min-h-[3rem] flex-1 resize-none self-center bg-transparent py-1.5 font-mono text-[15px] text-d-text-primary outline-none focus:outline-none focus-visible:outline-none placeholder:font-mono placeholder:text-d-text-muted disabled:opacity-50"
            />
          </div>

          {/* full-bleed hairline divider (premium chat-box split) */}
          <div aria-hidden className="relative h-px w-full bg-line" />

          {/* ── TOOLBAR region — the 5-lens selector + send ── */}
          <div className="relative flex items-center justify-between gap-2 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-1">
              {MODES.map((m) => {
                const Icon = m.icon
                const on = m.key === mode
                return (
                  <button
                    key={m.key}
                    type="button"
                    // preventDefault keeps focus on the textarea so switching a
                    // lens updates the suggestion sheet live (never closes it).
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setMode(m.key)
                      setGridOffset(0)
                    }}
                    disabled={pending}
                    aria-pressed={on}
                    title={m.label}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-all duration-150 disabled:opacity-50 ${
                      on
                        ? 'bg-d-text-primary text-main shadow-sm'
                        : 'text-d-text-secondary hover:bg-white/[0.06] hover:text-d-text-primary'
                    }`}
                  >
                    <Icon size={14} className={on ? undefined : m.color} />
                    <span className="hidden sm:inline">{m.label}</span>
                  </button>
                )
              })}
            </div>
            {sendBtn}
          </div>

          {/* ── inline SUGGESTIONS — rendered INSIDE the box (premium chat style):
              on focus the box draws down to reveal context-aware prompts; a
              detected symbol swaps them to that instrument across intents. ── */}
          <AnimatePresence initial={false}>
            {showSuggest && (
              <motion.div
                key="inbox-suggest"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden border-t border-line"
              >
                <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-d-text-muted">
                    <SugIcon size={12} className={detectedSym ? 'text-ai' : activeMode.color} />
                    {sugKind} · {sugLabel}
                  </span>
                  {!q && !detectedSym && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setGridOffset((o) => o + 5)}
                      className="inline-flex items-center gap-1 font-mono text-[10.5px] text-d-text-muted transition-colors hover:text-d-text-primary"
                    >
                      <RefreshCw size={11} /> Shuffle
                    </button>
                  )}
                </div>
                <ul className="px-2 pb-2">
                  {suggestions.map((p, i) => (
                    <motion.li
                      key={`${mode}-${gridOffset}-${p.slice(0, 24)}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 + i * 0.035, duration: 0.2 }}
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => usePrompt(p)}
                        className="group/row flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <Sparkles size={13} className="shrink-0 text-ai" />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-d-text-secondary transition-colors group-hover/row:text-d-text-primary">
                          {p}
                        </span>
                        <ArrowUpRight size={13} className="shrink-0 text-d-text-muted opacity-0 transition-opacity group-hover/row:opacity-100" />
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── in-box ANSWER — the box draws down to hold the live thinking
              trace + streamed reply, so a quick query never leaves the home.
              Task-sized turns escalate to the full chat page (isBigTask). ── */}
          <AnimatePresence>
            {turns.length > 0 && (
              <motion.div
                key="inbox-answer"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="relative border-t border-line px-4 pb-4 pt-3.5"
              >
                <HomeInlineAnswer
                  turns={turns}
                  pending={pending}
                  onOpenThread={() => setView('thread')}
                  onDismiss={newConversation}
                  onFollowUp={(f) => send(f)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // ── ACTIVE chat ── xAI message stream: user right (charcoal bubble),
  // assistant left (no bubble, MarkdownMessage), EyebrowMono role labels,
  // BlurFade enter. The REAL SSE stream drives the assistant reveal (onToken
  // appends to acc → patch → re-render); we do NOT fake-type over it.
  if (!isHome) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col px-4 [height:calc(100dvh-3.5rem)] lg:[height:100dvh]">
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between py-3">
            <h1 className="flex items-center gap-2 text-[15px] font-normal text-d-text-primary">
              <EyebrowMono className="text-d-text-primary">MAIN CHAT</EyebrowMono>
            </h1>
            <Button variant="secondary" size="sm" onClick={newConversation}>
              <Plus className="h-3.5 w-3.5" /> New chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto py-2" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation">
            <div className="flex flex-col space-y-5">
              {loadingThread ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-d-text-muted" /></div>
              ) : (
                turns.map((t, i) => {
                  // The live stream already reveals incrementally via patch();
                  // streamN gates the fallback (non-streamed) typewriter only.
                  const streaming = i === streamIdx && streamN < t.text.length
                  const shown = streaming ? t.text.slice(0, streamN) : t.text
                  if (t.role === 'user') {
                    return (
                      <BlurFade key={i} offset={6} duration={0.22}>
                        <div className="flex flex-col items-end gap-1.5">
                          <EyebrowMono>YOU</EyebrowMono>
                          <div className="max-w-[82%] whitespace-pre-wrap rounded-sm border border-line bg-wrap-hover px-3.5 py-2.5 text-[13.5px] leading-relaxed text-d-text-primary">
                            <span className="sr-only">You: </span>{t.text}
                          </div>
                        </div>
                      </BlurFade>
                    )
                  }
                  const isLast = i === turns.length - 1
                  const liveStreaming = pending && isLast           // streamed turn in flight
                  const showCursor = streaming || liveStreaming
                  const isThinking = liveStreaming && !shown        // no prose yet → tool-trace terminal
                  const showTools = !showCursor && t.tools && t.tools.length > 0
                  const showFollowups = isLast && !streaming && !pending
                  return (
                    <BlurFade key={i} offset={6} duration={0.22}>
                      <div className="flex flex-col gap-2">
                        <EyebrowMono>QUANT X</EyebrowMono>
                        <div className="min-w-0 space-y-3">
                          {/* GenUI artifacts — real charts/stats, rendered before the prose */}
                          {t.artifacts && t.artifacts.length > 0 && <ChatArtifacts artifacts={t.artifacts} />}
                          {/* References — market-data entities the agent touched (WP-RAILS).
                              Hidden while thinking (the ProgressRail owns that phase). */}
                          {!isThinking && t.references && t.references.length > 0 && (
                            <ReferencesRail refs={t.references} />
                          )}
                          <div className="text-[13.5px] leading-relaxed text-d-text-secondary">
                            <span className="sr-only">Assistant: </span>
                            {isThinking ? (
                              // Honest streamed telemetry — replaces the old fake THINK_STEPS.
                              <ProgressRail steps={t.steps ?? []} live />
                            ) : (
                              <span className="inline">
                                <MarkdownMessage content={shown} />
                                {showCursor && <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[3px] animate-pulse bg-white align-middle" />}
                              </span>
                            )}
                          </div>
                          {showTools && (
                            <div className="flex flex-wrap items-center gap-1.5 px-0.5">
                              <EyebrowMono className="text-[9.5px]">CONSULTED</EyebrowMono>
                              {prettyTools(t.tools!).map((tl) => (
                                <span key={tl} className="inline-flex items-center gap-1 rounded-sm border border-line bg-wrap-hover px-2 py-0.5 font-mono text-[10.5px] text-d-text-secondary">
                                  {tl}
                                </span>
                              ))}
                            </div>
                          )}
                          {showFollowups && (
                            <div className="flex flex-wrap gap-1.5">
                              {(t.followups && t.followups.length ? t.followups : FOLLOWUPS).map((f) => (
                                <Button key={f} variant="secondary" size="sm" onClick={() => send(f)}>
                                  <ArrowRight size={10} />{f}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </BlurFade>
                  )
                })
              )}
              <div ref={endRef} />
            </div>
          </div>
          {error && <p role="alert" className="px-1 py-1 text-[12px] text-down">{error}</p>}
          <div className="border-t border-line pb-4 pt-3">
            {composer(false)}
            <p className="mt-1.5 text-center font-mono text-[10px] text-d-text-secondary">
              Enter to send · Shift+Enter for newline{conversationId && ' · saved'} · {tierLabel} · AI is educational only, not investment advice.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── HOME (hero + marketing) ──
  const stats = track?.stats
  const curve = (track?.curve ?? []).map((p) => p.cum_return_pct).filter((n): n is number => Number.isFinite(n))
  // Only surface headline performance once there's a real, two-sided sample —
  // never a "0.0%" or a "100% off one trade" (the no-fabricated-stats rule).
  const hasPerf = (stats?.wins ?? 0) > 0 && (stats?.losses ?? 0) > 0 && (stats!.wins + stats!.losses) >= 20
  const hasCurve = curve.length > 1 && curve.some((v) => v !== 0)

  // Auth-aware home branching (WP-CONSOLIDATE 3c): authed users get the
  // personalized cockpit band below the composer; signed-out visitors keep the
  // marketing bands. While auth resolves we render neither (the hero composer
  // stays usable) so we never flash the marketing home at a signed-in user or
  // the cockpit at a signed-out one.
  const authedHome = !!user
  const signedOutHome = !authLoading && !user

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 pb-16">
      {/* ── HERO BAND ── mirrors Intellectia's home: a large ghosted "Quant X"
          wordmark watermark behind the hero with a soft radial signature glow,
          then a single centred subline (NOT a giant "Ask Quant X" headline). ── */}
      <section className="relative flex flex-col items-center pb-2 pt-[clamp(2rem,8vh,5.5rem)]">
        {/* signature radial glow + mono dot field, behind everything */}
        <div aria-hidden className="bg-radial-glow pointer-events-none absolute inset-x-0 top-0 -z-20 h-[460px]" />
        <DotPattern
          width={22}
          height={22}
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] [mask-image:radial-gradient(ellipse_at_top,white,transparent_70%)] fill-white/[0.05]"
        />
        {/* ghosted wordmark — large mono watermark behind the subline
            (a faint ghosted brand watermark). Solid ink
            at very low opacity so it reads as a clean watermark on BOTH themes,
            never a coloured blob. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[clamp(0.5rem,3vh,2rem)] -z-10 flex justify-center overflow-hidden opacity-[0.07]">
          <span className="select-none whitespace-nowrap font-display text-[clamp(4.5rem,18vw,12rem)] font-bold leading-none tracking-tight text-d-text-primary">
            Quant X
          </span>
        </div>

        {/* Full-width home column — the composer, prompt chips, index data, news
            and CTAs all share THIS container's edges so the page reads as one
            aligned column (no more 784-vs-992 jag). The input itself keeps a
            comfortable centered max-width; everything below spans the column. */}
        <div className="relative w-full pt-[clamp(2.5rem,7vw,5.5rem)]">
          <p className="mx-auto max-w-2xl text-center text-[19px] font-normal leading-snug text-d-text-secondary">
            The AI trading desk for India. Five engines. One gated signal. Every call explained.
          </p>

          {/* ── COMPOSER ── the chat box: hairline input spanning the column,
              in-box mode toolbar, an on-focus suggestion sheet, and the in-box
              answer (the box grows to hold the thinking trace + streamed reply).
              Task-sized turns escalate to the full chat page. ── */}
          <div className="mt-7">{composer(true)}</div>

          {error && <p role="alert" className="mt-4 text-center text-[12px] text-down">{error}</p>}
        </div>
      </section>

      {/* ── AUTHED HOME BAND vs SIGNED-OUT MARKETING ──
          Authed  → the personalized cockpit below the composer.
          Signed-out → the marketing bands (ticker · Explore · track record ·
          prompts), unchanged. While auth is still resolving we render neither
          (the composer stays usable) so we never flash one at the other. */}
      {authedHome ? (
        <Reveal className="mt-10">
          {/* One home for everyone — the full personalized cockpit (news, index
              data, product + feature CTAs). The Simple/Full toggle was retired
              2026-07-12: a single Full experience, no beginner shell. */}
          <HomeCockpit />
        </Reveal>
      ) : signedOutHome ? (
        <>
          {/* ── LIVE TICKER STRIP ── one continuous scrolling marquee ("loader")
              streaming the headline indices + the 50 NIFTY constituents. Replaces
              the boxed index cards AND the NIFTY 50 grid. ── */}
          <div className="mt-7">
            <HomeTicker />
          </div>

      {/* ── "EXPLORE QUANT X" ── 42px display heading, left-aligned. ── */}
      <section className="mt-14">
        <h2 className="font-display text-[clamp(2rem,5vw,2.625rem)] font-semibold leading-[1.05] tracking-tight text-d-text-primary">
          Explore Quant X
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-d-text-secondary">
          The whole desk. Signals, scanners, strategy and execution. Each opens its own page.
        </p>

        {/* ── IMAGE-TOPPED FEATURE CARDS ── 3-up, 8px radius, bg-wrap, hairline,
            gap-24px, 2 rows. Category eyebrow · title · 1-line desc · "See More →"
            link · decorative SVG render on the right. Each card is a real link. ── */}
        <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CARDS.map(({ category, name, blurb, href, motif, image, tier: t }, i) => (
            <BlurFade key={name} delay={i * 0.04} offset={8} duration={0.3}>
              <Link
                href={href}
                className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-wrap transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              >
                {image ? (
                  // ── IMAGE-TOPPED media band ── on-brand dark art as the card
                  // top. Pinned to the dark surface via .dark-media so it reads
                  // as deliberate on BOTH themes; a bottom gradient fades the
                  // image into the card surface. Decorative (alt=""), below the
                  // fold → lazy (no priority).
                  <div className="dark-media relative h-[112px] overflow-hidden border-b">
                    <Image
                      src={image}
                      alt=""
                      aria-hidden
                      fill
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                    />
                    {/* fade the image into the (theme-aware) card surface below */}
                    <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-wrap/95" />
                    {t && <div className="absolute left-4 top-4 z-10"><Badge tone="warning">{t}</Badge></div>}
                  </div>
                ) : (
                  // decorative render band (the "image top", re-imagined as a motif)
                  <div className="relative h-[112px] overflow-hidden border-b border-line bg-wrap-hover/50">
                    <div aria-hidden className="bg-radial-glow pointer-events-none absolute inset-0 opacity-60" />
                    <div className="absolute inset-y-0 right-0 w-[62%] py-4 pr-4 text-d-text-muted [mask-image:linear-gradient(to_right,transparent,black_28%)]">
                      <FeatureMotif kind={motif} />
                    </div>
                    {t && <div className="absolute left-4 top-4"><Badge tone="warning">{t}</Badge></div>}
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <EyebrowMono className="text-[10.5px] text-primary">{category}</EyebrowMono>
                  <h3 className="mt-2 font-display text-[22px] font-semibold leading-tight tracking-tight text-d-text-primary">{name}</h3>
                  <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-d-text-secondary">{blurb}</p>
                  <span className="mt-4 inline-flex items-center gap-1 font-mono text-[12px] text-d-text-muted transition-colors group-hover:text-d-text-primary">
                    See More <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ── marketing: track record (real, gated) ── kept below the fold. ── */}
      <section className="mt-14 border-t border-line pt-10">
        <SectionHead eyebrow="Proof, not promises" title="A track record you can audit, line by line" />
        {hasPerf ? (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Win rate" value={pctFmt(stats!.win_rate)} tone="up" />
                <Stat label="Avg return / trade" value={pctFmt(stats!.avg_return_pct, true)} tone={(stats!.avg_return_pct ?? 0) >= 0 ? 'up' : 'down'} />
                <Stat label="Profit factor" value={stats!.profit_factor != null ? stats!.profit_factor.toFixed(2) : '—'} />
                <Stat label="Signals tracked" value={String(stats!.n)} />
              </div>
              <div className="rounded-lg border border-line bg-wrap p-4">
                <div className="flex items-center justify-between">
                  <EyebrowMono className="text-[11px]">Cumulative return · 90d</EyebrowMono>
                  {track?.current_regime?.regime && <Badge tone="primary">{track.current_regime.regime} regime</Badge>}
                </div>
                <div className="mt-3">
                  {hasCurve ? (
                    <Sparkline data={curve} width={520} height={88} filled strokeWidth={2} tone={(curve[curve.length - 1] ?? 0) >= (curve[0] ?? 0) ? 'up' : 'down'} className="w-full" ariaLabel="90-day cumulative return" />
                  ) : (
                    <p className="py-6 text-center text-[12px] text-d-text-secondary">The live curve builds as trades resolve.</p>
                  )}
                </div>
                <Link href="/proof?tab=track-record" className="mt-2 inline-flex items-center gap-1 text-[12px] text-d-text-primary underline underline-offset-2 hover:text-d-text-secondary">See the full record <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-d-text-secondary">Live, outcome-tracked signal performance over the last 90 days. Past performance does not guarantee future results.</p>
          </>
        ) : (
          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-line bg-wrap p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-[13.5px] leading-relaxed text-d-text-secondary">
              Every signal we publish gets tracked to its outcome: win, loss or expiry. Audited, unedited, no cherry-picking. The live record builds right here as trades resolve.
              {(stats?.n ?? 0) > 0 && <span className="font-normal text-d-text-primary"> {stats!.n} signals tracked so far.</span>}
            </p>
            <Link href="/proof?tab=track-record" className="inline-flex shrink-0 items-center gap-1 text-[13px] text-d-text-primary underline underline-offset-2 hover:text-d-text-secondary">
              See the methodology <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

          <DisclaimerFooter />
        </>
      ) : null}
    </div>
  )
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <EyebrowMono className="text-[11px]">{eyebrow}</EyebrowMono>
      <h2 className="mt-2 font-sans text-display-sm font-normal tracking-tight text-d-text-primary">{title}</h2>
    </div>
  )
}

function Stat({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'up' | 'down' | 'neutral' }) {
  const color = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-d-text-primary'
  return (
    <div className="rounded-sm border border-line bg-wrap p-4">
      <EyebrowMono className="text-[11px]">{label}</EyebrowMono>
      <div className={`mt-1 text-[26px] font-normal leading-none ${MONO} ${color}`}>{value}</div>
    </div>
  )
}

// useSearchParams() requires a Suspense boundary.
export default function CopilotHubPage() {
  return (
    <Suspense fallback={null}>
      <CopilotHub />
    </Suspense>
  )
}
