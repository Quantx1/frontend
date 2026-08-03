'use client'

/**
 * CommandPalette (⌘K) — the product's command bar. v5 "Instrument".
 *
 * Now built on shadcn/ui's `Command` (cmdk) rather than hand-rolled list +
 * keyboard code. cmdk owns roving focus, `aria-activedescendant`, the
 * listbox/option semantics and value tracking; this file owns what is
 * genuinely product-specific: what goes IN the list, and in what order.
 *
 * Filtering is `shouldFilter={false}` on purpose. Symbols arrive already
 * ranked from the instrument endpoint plus a local re-rank, and routes are
 * scored by prefix/word-start. Letting cmdk re-filter on top would fight both.
 *
 * ── AI FIRST, not AI-last ────────────────────────────────────────────────
 * The one real product idea here: the palette reads INTENT and reorders
 * itself. "reliance" is a lookup, so the AI row sits at the bottom as a
 * fallback. "why is reliance falling" is a question — no ticker match will
 * ever satisfy it — so Ask Quant X is promoted to the TOP and pre-selected.
 * The user types the same box either way; the palette decides whether this is
 * navigation or a question. See `looksLikeQuestion`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import useSWR from 'swr'

import {
  ArrowRight, Award, BarChart3, Bell, Bot, Brain, Briefcase, CreditCard, Eye,
  FlaskConical, Gift, Inbox, Layers, LineChart, ScanLine, ScrollText, Search,
  Settings, ShieldAlert, Sparkles, TrendingUp, Wand2,
} from '@/lib/icons'
import { Dialog } from '@/components/foundation'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { api } from '@/lib/api'
import { useThemeMode } from '@/contexts/ThemeModeContext'
import { useTier } from '@/lib/hooks/useTier'
import { stockHref } from '@/lib/stock-href'
import { MONO } from '@/lib/tokens'
import { cn } from '@/lib/utils'

/** Every route in the app, including ones with no sidebar item — the palette
 *  is the guarantee that no surface is unreachable. */
const ROUTES: { href: string; label: string; hint?: string; tier?: 'pro' | 'elite' }[] = [
  { href: '/copilot', label: 'Copilot', hint: 'Ask anything' },
  { href: '/markets', label: 'Markets', hint: 'The daily read' },
  { href: '/stocks', label: 'Stocks', hint: 'Browse the universe' },
  { href: '/signals', label: 'Signals', hint: 'All horizons' },
  { href: '/signals/alpha-picks', label: 'Alpha Picks' },
  { href: '/signals/momentum-picks', label: 'Momentum Picks' },
  { href: '/signals/swing', label: 'Swing signals' },
  { href: '/signals/momentum', label: 'Momentum signals' },
  { href: '/signals/index-momentum-30', label: 'Index Momentum 30' },
  { href: '/scanner', label: 'Screener', hint: 'Describe a setup' },
  { href: '/scanner/new', label: 'New screen' },
  { href: '/patterns', label: 'Chart Patterns' },
  { href: '/strategies', label: 'AI Algos', hint: 'Build & backtest' },
  { href: '/strategies/deployed', label: 'Deployed strategies' },
  { href: '/fno', label: 'F&O', tier: 'elite' },
  { href: '/autopilot', label: 'AutoPilot', hint: 'Automated execution' },
  { href: '/autopilot/track-record', label: 'AutoPilot track record' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/paper-trading', label: 'Paper trading' },
  { href: '/trades', label: 'Trade journal' },
  { href: '/risk', label: 'Risk' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/alerts', label: 'Alerts Studio' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/referrals', label: 'Referrals' },
  { href: '/settings', label: 'Settings' },
  { href: '/proof', label: 'Proof', hint: 'Track record · accuracy · regime' },
  { href: '/pricing', label: 'Pricing' },
]

// One glyph per route FAMILY — an icon that appears next to everything
// communicates nothing. Longest-prefix wins.
const ROUTE_ICONS: [string, React.ElementType][] = [
  ['/copilot', Bot], ['/markets', LineChart], ['/stocks', Search],
  ['/signals', BarChart3], ['/scanner', ScanLine], ['/patterns', Brain],
  ['/strategies', Wand2], ['/fno', Layers], ['/autopilot', Bot],
  ['/portfolio', Briefcase], ['/paper-trading', FlaskConical], ['/trades', ScrollText],
  ['/risk', ShieldAlert], ['/watchlist', Eye], ['/alerts', Bell],
  ['/inbox', Inbox], ['/referrals', Gift], ['/settings', Settings],
  ['/proof', Award], ['/pricing', CreditCard],
]

const ROUTE_ICON = (href: string): React.ElementType =>
  ROUTE_ICONS.reduce<{ len: number; icon: React.ElementType }>(
    (best, [prefix, icon]) =>
      href.startsWith(prefix) && prefix.length > best.len ? { len: prefix.length, icon } : best,
    { len: 0, icon: TrendingUp },
  ).icon

/* ── Recents ──────────────────────────────────────────────────────────────
   Local, capped at 6, entity-only (symbols and pages you opened) rather than
   a full history: a recents list that shows everything is just a second,
   worse search. */
const RECENTS_KEY = 'quantx.palette.recents.v1'
type Recent = { label: string; href: string; hint?: string }

function readRecents(): Recent[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    return raw ? (JSON.parse(raw) as Recent[]).slice(0, 6) : []
  } catch {
    return []
  }
}

export function pushRecent(entry: Recent) {
  try {
    const next = [entry, ...readRecents().filter((r) => r.href !== entry.href)].slice(0, 6)
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
  } catch {
    /* storage disabled — recents just won't persist */
  }
}

/** Prefix > word-start > contains > subsequence. Negative means "no match". */
function score(label: string, q: string): number {
  if (!q) return 0
  const l = label.toLowerCase()
  if (l.startsWith(q)) return 100 - l.length * 0.1
  if (l.split(/[\s/·-]+/).some((w) => w.startsWith(q))) return 80 - l.length * 0.1
  if (l.includes(q)) return 60 - l.length * 0.1
  let i = 0
  for (const ch of l) if (ch === q[i]) i++
  return i === q.length ? 30 - l.length * 0.1 : -1
}

/**
 * Is this a question for the agent rather than a thing to look up?
 *
 * Deliberately conservative — it only promotes the AI row when the input
 * could not plausibly be a ticker or a page name. Three or more words, or a
 * leading interrogative/imperative, is a question. "hdfc bank" (two words,
 * no verb) stays a lookup.
 */
const INTENT_WORDS =
  /^(analyse|analyze|why|what|how|when|should|is|are|find|show|compare|explain|build|screen|scan|create|optimi[sz]e|backtest|summari[sz]e|tell)\b/i

function looksLikeQuestion(q: string): boolean {
  const t = q.trim()
  if (!t) return false
  if (t.endsWith('?')) return true
  if (INTENT_WORDS.test(t)) return true
  return t.split(/\s+/).length >= 3
}

interface Props {
  open: boolean
  onClose: () => void
}

export const CommandPalette = ({ open, onClose }: Props) => {
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const [query, setQuery] = useState('')
  const [recents, setRecents] = useState<Recent[]>([])
  const { mode, setMode } = useThemeMode()
  const { tier } = useTier()

  // `mode` may be 'auto'; resolve against the class next-themes actually set so
  // the action names the theme the user can currently see.
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('dark')
  useEffect(() => {
    if (!open) return
    setQuery('')
    setRecents(readRecents())
    setResolvedMode(
      mode === 'auto'
        ? document.documentElement.classList.contains('light') ? 'light' : 'dark'
        : mode,
    )
  }, [open, mode])

  const q = query.trim()
  const lower = q.toLowerCase()
  const isQuestion = looksLikeQuestion(q)

  // Symbol search — only for inputs that could BE a ticker, so typing a
  // sentence for the agent never hammers the instrument endpoint.
  const symbolQuery = q.length >= 2 && !q.includes(' ') ? q : null
  const [debounced, setDebounced] = useState<string | null>(null)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(symbolQuery), 140)
    return () => clearTimeout(t)
  }, [symbolQuery])

  const { data: symbolData, isLoading: symbolsLoading, error: symbolsError } = useSWR(
    open && debounced ? ['palette:instruments', debounced] : null,
    ([, term]) => api.screener.searchInstruments(term as string, 6),
    { revalidateOnFocus: false, keepPreviousData: true, shouldRetryOnError: false },
  )

  const go = useCallback(
    (href: string, recent?: Recent) => {
      if (recent) pushRecent(recent)
      router.push(href)
      onClose()
    },
    [router, onClose],
  )

  const ask = useCallback(
    (prompt: string) => go(`/copilot?q=${encodeURIComponent(prompt)}`),
    [go],
  )

  // Instruments, re-ranked locally: the endpoint returns RELINFRA above
  // RELIANCE for "reliance" — a match, but never what was meant.
  const instruments = useMemo(() => {
    const list = symbolData?.instruments ?? []
    return [...list].sort(
      (a, b) =>
        Math.max(score(b.symbol, lower), score(b.name ?? '', lower) - 5) -
        Math.max(score(a.symbol, lower), score(a.name ?? '', lower) - 5),
    )
  }, [symbolData, lower])

  const routes = useMemo(
    () =>
      ROUTES.filter((r) => !q || score(r.label, lower) >= 0 || score(r.hint ?? '', lower) >= 0)
        .sort((a, b) => score(b.label, lower) - score(a.label, lower)),
    [q, lower],
  )

  const actions = useMemo(() => {
    const all: { label: string; hint?: string; run: () => void }[] = [
      { label: 'New chat', hint: 'Copilot', run: () => go('/copilot') },
      { label: 'New screen', hint: 'Describe a setup', run: () => go('/scanner/new') },
      { label: 'New strategy', hint: 'Plain English → backtest', run: () => go('/strategies') },
      { label: 'Connect broker', hint: 'Zerodha · Upstox · Angel One', run: () => go('/onboarding/broker-connect') },
      {
        // Through ThemeModeContext, never localStorage + a classList toggle —
        // that would leave next-themes and the Settings toggle holding stale state.
        label: `Switch to ${resolvedMode === 'light' ? 'dark' : 'light'} theme`,
        hint: 'Appearance',
        run: () => {
          setMode(resolvedMode === 'light' ? 'dark' : 'light')
          onClose()
        },
      },
      ...(tier && tier !== 'free'
        ? []
        : [{ label: 'Upgrade plan', hint: 'Pro · Elite', run: () => go('/pricing') }]),
    ]
    return all.filter((a) => !q || score(a.label, lower) >= 0)
  }, [q, lower, tier, resolvedMode, setMode, go, onClose])

  /** Contextual asks — seeded from the surface the user is standing on, so the
   *  agent starts with the context the user already has on screen. */
  const contextual = useMemo(() => {
    if (q) return []
    const sym = pathname.startsWith('/stock/') ? decodeURIComponent(pathname.split('/')[2] ?? '') : null
    if (sym) {
      return [
        `Analyse ${sym}: trend, key levels, entry, stop and target`,
        `Why is ${sym} moving today?`,
        `Is ${sym} a buy right now — the bull vs bear case`,
      ]
    }
    if (pathname.startsWith('/portfolio')) {
      return ['Analyse my portfolio for concentration and drawdown risk', 'Which holding is my biggest risk?']
    }
    if (pathname.startsWith('/markets')) {
      return ["What's driving the market today?", 'Find the strongest swing setups on the tape']
    }
    if (pathname.startsWith('/strategies')) {
      return ['Build a momentum strategy for Nifty 50 and backtest it']
    }
    return []
  }, [q, pathname])

  const aiRow = q ? (
    <CommandGroup heading={isQuestion ? 'Ask Quant X' : undefined}>
      <CommandItem
        value="__ask__"
        onSelect={() => ask(q)}
        className="group data-[selected=true]:bg-surface-2"
      >
        <Sparkles size={15} className="shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-d-text-primary">
          Ask Quant X: <span className="text-d-text-secondary">“{q}”</span>
        </span>
        <kbd className={cn('shrink-0 rounded border border-line px-1 text-[10px] text-d-text-muted', MONO)}>↵</kbd>
      </CommandItem>
    </CommandGroup>
  ) : null

  return (
    <Dialog open={open} onClose={onClose} className="max-w-[600px] overflow-hidden p-0">
      <Command
        shouldFilter={false}
        loop
        className="bg-transparent"
        // cmdk pre-selects the first item. When the input reads as a question
        // that first item IS the agent, so ↵ sends it straight to the Copilot.
        value={isQuestion ? '__ask__' : undefined}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search size={16} className="shrink-0 text-d-text-muted" aria-hidden="true" />
          <CommandInput
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Ask anything, or jump to a stock or page…"
            className="h-12 border-0 px-0 text-sm placeholder:text-d-text-muted focus:ring-0"
          />
          {symbolsLoading && debounced && (
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-d-text-muted border-r-transparent"
            />
          )}
          <kbd className={cn('shrink-0 rounded-xs border border-line px-1.5 py-0.5 text-[10px] text-d-text-muted', MONO)}>
            esc
          </kbd>
        </div>

        <CommandList className="max-h-[400px] px-1.5 py-1.5">
          <CommandEmpty className="px-3 py-10 text-center">
            <p className="text-sm font-semibold text-d-text-primary">Nothing matched “{q}”</p>
            <p className="mt-1 text-xs text-d-text-secondary">
              Press <kbd className={cn('rounded border border-line px-1', MONO)}>↵</kbd> to ask Quant X instead.
            </p>
          </CommandEmpty>

          {/* A question can't be answered by a ticker match — so it leads. */}
          {isQuestion && aiRow}

          {contextual.length > 0 && (
            <CommandGroup heading="Ask about this page">
              {contextual.map((prompt) => (
                <CommandItem key={prompt} value={prompt} onSelect={() => ask(prompt)}>
                  <Sparkles size={15} className="shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{prompt}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!q && recents.length > 0 && (
            <CommandGroup heading="Recent">
              {recents.map((r) => (
                <CommandItem key={r.href} value={`recent-${r.href}`} onSelect={() => go(r.href, r)}>
                  <ArrowRight size={15} className="shrink-0 text-d-text-muted" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{r.label}</span>
                  {r.hint && <span className="shrink-0 truncate text-[11px] text-d-text-muted">{r.hint}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* A lookup that FAILED must not look like a lookup that found
              nothing. Without this, a backend outage renders exactly like
              "no such ticker" — the user retypes a symbol that does exist and
              concludes the product is broken or the stock is missing. Name the
              failure, and keep the agent reachable underneath it. */}
          {symbolsError && debounced && (
            <CommandGroup heading="Symbols">
              <CommandItem value="__sym_err__" disabled className="opacity-100">
                <ShieldAlert size={15} className="shrink-0 text-warning" aria-hidden="true" />
                <span className="min-w-0 flex-1 text-[13px] text-d-text-secondary">
                  Symbol search is unavailable right now — pages and actions still work.
                </span>
              </CommandItem>
            </CommandGroup>
          )}

          {instruments.length > 0 && (
            <CommandGroup heading="Symbols">
              {instruments.map((s) => (
                <CommandItem
                  key={s.symbol}
                  value={`sym-${s.symbol}`}
                  onSelect={() =>
                    go(stockHref(s.symbol), { label: s.symbol, href: stockHref(s.symbol), hint: s.name })
                  }
                >
                  <TrendingUp size={15} className="shrink-0 text-d-text-muted" aria-hidden="true" />
                  <span className={cn('min-w-0 flex-1 truncate text-[13px]', MONO)}>{s.symbol}</span>
                  <span className="max-w-[45%] shrink-0 truncate text-[11px] text-d-text-muted">{s.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {routes.length > 0 && (
            <CommandGroup heading="Go to">
              {routes.map((r) => {
                const Icon = ROUTE_ICON(r.href)
                return (
                  <CommandItem
                    key={r.href}
                    value={`route-${r.href}`}
                    onSelect={() => go(r.href, { label: r.label, href: r.href, hint: r.hint })}
                  >
                    <Icon size={15} className="shrink-0 text-d-text-muted" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-[13px]">{r.label}</span>
                    {r.tier && (
                      <span className="shrink-0 rounded-xs bg-highlight/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-highlight">
                        {r.tier}
                      </span>
                    )}
                    {r.hint && <span className="shrink-0 truncate text-[11px] text-d-text-muted">{r.hint}</span>}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}

          {actions.length > 0 && (
            <CommandGroup heading="Actions">
              {actions.map((a) => (
                <CommandItem key={a.label} value={`act-${a.label}`} onSelect={a.run}>
                  <Sparkles size={15} className="shrink-0 text-d-text-muted" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{a.label}</span>
                  {a.hint && <span className="shrink-0 truncate text-[11px] text-d-text-muted">{a.hint}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* A lookup that found nothing still has somewhere to go. */}
          {!isQuestion && aiRow}
        </CommandList>
      </Command>

      <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[10px] text-d-text-muted">
        <span className="flex items-center gap-1">
          <kbd className={cn('rounded border border-line px-1', MONO)}>↑↓</kbd> navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className={cn('rounded border border-line px-1', MONO)}>↵</kbd> open
        </span>
        <span className="ml-auto flex items-center gap-1">
          <kbd className={cn('rounded border border-line px-1', MONO)}>⌘K</kbd> toggle
        </span>
      </div>
    </Dialog>
  )
}
