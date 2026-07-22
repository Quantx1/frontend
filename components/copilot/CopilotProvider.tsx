'use client'

/**
 * CopilotProvider — the persistent, context-aware Copilot DOCK (rail panel).
 *
 * Revives the docked copilot (removed 2026-06-02) per the 2026-06-22 decision:
 * a Cursor-style panel available on EVERY page, aware of the current page's
 * symbol/signal, with mode switching (Ask · Analyze · Screen · Doctor · Trade)
 * and @-mention context. Collapsed, the existing 72px RightRail is the icon
 * strip; this panel slides in to its left. Dock threads persist server-side
 * (same copilot_conversations store as the Main Chat), so "Maximize" opens the
 * full-screen Main Chat (/copilot?c=<id>) with the WHOLE thread carried over
 * and the conversation resumable from the sidebar's Recent list.
 *
 * Mounted once via GlobalCopilot in the root Providers (2026-07-11 — chat
 * unification; previously (platform)-only, which left Ask-Copilot buttons on
 * /stock, /portfolio, /watchlist, /trades, /markets and /signals dispatching
 * into the void). It uses window CustomEvents (not React context) to talk to
 * the RightRail launcher, which lives in a separate subtree. Streams via
 * api.ai.copilotChatStream.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  X, ArrowUpRight, ChevronRight, Loader2, PlusCircle,
} from '@/lib/icons'
import { api, type CopilotStep, type CopilotReference, type CopilotArtifact } from '@/lib/api'
import { DisclaimerFooter } from '@/components/foundation'
import { cn } from '@/lib/utils'
import { MODES, type CopilotMode } from '@/lib/copilot-modes'
import { CopilotBot } from './CopilotBot'
import { ProgressRail } from './ProgressRail'
import { ReferencesRail } from './ReferencesRail'
import { ChatArtifacts } from './ChatArtifacts'
import { MarkdownMessage } from './MarkdownMessage'

// Re-exported so `dispatchCopilotOpen`'s public signature stays back-compatible
// for the many call sites that import from this module.
export type { CopilotMode }

// ---------------------------------------------------------------- modes
// `CopilotMode` + `MODES` (the 5-mode lens) now live in `@/lib/copilot-modes`,
// the single source-of-truth shared with the Main Chat home hero. Imported
// above; `PageContext` below is a structural superset of the modes' `ModeContext`
// so it passes straight into each mode's `prefix(ctx)`.

// ---------------------------------------------------------------- page context
export interface PageContext {
  route: string
  symbol?: string
  signalId?: string
  label: string
}

function titleCase(s: string): string {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function derivePageContext(pathname: string): PageContext {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'stock' || parts[0] === 'stocks') {
    const symbol = parts[1] ? decodeURIComponent(parts[1]).toUpperCase() : undefined
    return { route: pathname, symbol, label: symbol || 'Stocks' }
  }
  if (parts[0] === 'signals' && parts[1] && parts[1] !== 'momentum') {
    return { route: pathname, signalId: parts[1], label: `Signal ${parts[1].slice(0, 8)}` }
  }
  if (!parts.length) return { route: pathname, label: 'Home' }
  return { route: pathname, label: titleCase(parts[parts.length - 1]) }
}

// ---------------------------------------------------------------- open API
/** Open the dock from anywhere (back-compat with old call sites). */
export function dispatchCopilotOpen(prefill?: string, mode?: CopilotMode) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('copilot:open', { detail: { prefill, mode } }))
}

// ---------------------------------------------------------------- messages
type ActionKind = 'watchlist_add' | 'watchlist_remove' | 'run_screen' | 'place_order' | 'create_strategy_draft'

interface ActionState {
  id: string
  kind: ActionKind
  title: string
  summary: string
  args: Record<string, unknown>
  danger: boolean
  status: 'idle' | 'running' | 'done' | 'error'
  result?: string
}

interface Msg {
  role: 'user' | 'assistant'
  content: string
  tools?: string[]
  streaming?: boolean
  error?: boolean
  actions?: ActionState[]
  steps?: CopilotStep[]
  references?: CopilotReference[]
  artifacts?: CopilotArtifact[]
  followups?: string[]
}

const SYMBOL_RE = /@([A-Za-z][A-Za-z0-9_&-]{1,15})/g
// Cheap client gate so we only spend an LLM proposal call on plausibly-actionable
// turns (keeps pure Q&A fast). Trade/Screen modes always propose.
const ACTION_VERBS = /\b(add|remove|buy|sell|watch|screen|scan|alert|draft|create|place|exit|book|rebalance)\b/i

export default function CopilotProvider() {
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const ctx = useMemo(() => derivePageContext(pathname), [pathname])

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<CopilotMode>('ask')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [streaming, setStreaming] = useState(false)
  // Server-side thread id — set from the stream's `saved` frame so maximize
  // can hand the FULL conversation to the Main Chat.
  const [conversationId, setConversationId] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  // Now that the dock is global, some routes (e.g. /stock/*) render without
  // AppShell — no 72px utility rail. Anchor the panel to the window edge there
  // and keep the FAB as the launcher on desktop too.
  const [hasRail, setHasRail] = useState(true)
  useEffect(() => {
    setHasRail(!!document.querySelector('aside[aria-label="Utilities"]'))
  }, [pathname, open])

  const activeMode = MODES.find((m) => m.key === mode) ?? MODES[0]

  // ── open/close wiring: ⌘/ toggles, custom events from the rail launcher ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail || {}
      if (detail.mode) setMode(detail.mode as CopilotMode)
      if (typeof detail.prefill === 'string') setInput(detail.prefill)
      setOpen(true)
    }
    const onClose = () => setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('copilot:open', onOpen as EventListener)
    window.addEventListener('copilot:close', onClose)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('copilot:open', onOpen as EventListener)
      window.removeEventListener('copilot:close', onClose)
    }
  }, [])

  // Focus the composer + scroll to bottom when opened or on new messages.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
    setMessages((prev) =>
      prev.map((m, i) => (i === prev.length - 1 && m.streaming ? { ...m, streaming: false } : m)),
    )
  }, [])

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim()
      if (!text || streaming) return

      // @-mention symbols + the current page's symbol → grounding context.
      const mentioned = Array.from(
        new Set([
          ...(ctx.symbol ? [ctx.symbol] : []),
          ...Array.from(text.matchAll(SYMBOL_RE)).map((m) => m[1].toUpperCase()),
        ]),
      )
      const history = messages
        .filter((m) => !m.error)
        .map((m) => ({ role: m.role, content: m.content }))

      setInput('')
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: '', streaming: true },
      ])
      setStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller
      // Action-y turns get a reviewable card; tell the responder to describe the
      // PLAN and never claim it already happened — the card the user confirms is
      // the source of truth.
      const actiony = activeMode.key === 'trade' || activeMode.key === 'screen' || ACTION_VERBS.test(text)
      const guard = actiony
        ? ' (The user will review and CONFIRM any action via a button below your reply. Describe what you WILL do in one short line; do NOT say it is already done, added, placed, or removed.)'
        : ''
      const outgoing = `${activeMode.prefix(ctx)}${text}${guard}`

      const patchLast = (patch: Partial<Msg>) =>
        setMessages((prev) =>
          prev.map((m, i) => (i === prev.length - 1 ? { ...m, ...patch } : m)),
        )

      try {
        await api.ai.copilotChatStream(
          {
            message: outgoing,
            route: ctx.route,
            history,
            mentioned_symbols: mentioned,
            // Chat unification (2026-07-11): dock threads persist like the
            // Main Chat so maximize/Recent can resume them. display_message
            // keeps mode/guard scaffolding out of the saved thread.
            persist: true,
            conversation_id: conversationId ?? undefined,
            display_message: text,
          },
          {
            onMeta: (meta) =>
              patchLast({ tools: meta.tools_used, steps: meta.progress, references: meta.references, artifacts: meta.artifacts }),
            onToken: (t) =>
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: m.content + t } : m,
                ),
              ),
            onDone: (done) =>
              patchLast({
                content: done.reply || '',
                tools: done.tools_used,
                streaming: false,
                // done carries references with `cited` flags — prefer them.
                ...(done.references ? { references: done.references } : {}),
                ...(done.followups ? { followups: done.followups } : {}),
              }),
            onError: (msg) =>
              patchLast({ content: msg || 'Something went wrong.', streaming: false, error: true }),
            onSaved: (id) => {
              if (id) setConversationId(id)
            },
          },
          controller.signal,
        )

        // Cursor-style: after the reply, propose reviewable action cards on
        // action-y turns (mode- or verb-gated so pure Q&A skips the extra call).
        if (actiony) {
          try {
            const { actions } = await api.ai.copilotActions({
              message: text, route: ctx.route, symbol: ctx.symbol,
            })
            if (actions && actions.length) {
              const staged: ActionState[] = actions.map((a) => ({ ...a, status: 'idle' as const }))
              setMessages((prev) =>
                prev.map((m, i) => (i === prev.length - 1 ? { ...m, actions: staged } : m)),
              )
            }
          } catch {
            /* proposals are best-effort — never break the chat */
          }
        }
      } catch (err) {
        const msg =
          err instanceof Error && err.name === 'AbortError'
            ? '(stopped)'
            : err instanceof Error
              ? err.message
              : 'Copilot is unavailable right now.'
        patchLast({ content: msg, streaming: false, error: true })
      } finally {
        setStreaming(false)
        abortRef.current = null
      }
    },
    [input, streaming, ctx, activeMode, messages, conversationId],
  )

  const maximize = useCallback(() => {
    // Whole-thread carryover: the dock persists its conversation, so Main Chat
    // can load it by id. Fallback (nothing saved yet): prefill the last turn.
    if (conversationId) {
      router.push(`/copilot?c=${encodeURIComponent(conversationId)}`)
    } else {
      const last = [...messages].reverse().find((m) => m.role === 'user')
      router.push(`/copilot${last ? `?q=${encodeURIComponent(last.content)}` : ''}`)
    }
    setOpen(false)
  }, [conversationId, messages, router])

  const newThread = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
    setMessages([])
    setInput('')
    setConversationId(null)
    inputRef.current?.focus()
  }, [])

  // Execute a CONFIRMED action card against the existing gated endpoints. The
  // server re-validates everything (orders ride the full kill-switch→tier→broker
  // gate chain); this only fires on an explicit user click.
  const runAction = useCallback(
    async (msgIdx: number, actionId: string) => {
      const action = messages[msgIdx]?.actions?.find((a) => a.id === actionId)
      if (!action || action.status === 'running' || action.status === 'done') return
      const patch = (s: Partial<ActionState>) =>
        setMessages((prev) =>
          prev.map((m, i) =>
            i === msgIdx
              ? { ...m, actions: m.actions?.map((a) => (a.id === actionId ? { ...a, ...s } : a)) }
              : m,
          ),
        )
      patch({ status: 'running' })
      const args = action.args as Record<string, any>
      try {
        let result = ''
        if (action.kind === 'watchlist_add') {
          await api.watchlist.add(String(args.symbol))
          result = `Added ${args.symbol} to your watchlist`
        } else if (action.kind === 'watchlist_remove') {
          await api.watchlist.remove(String(args.symbol))
          result = `Removed ${args.symbol} from your watchlist`
        } else if (action.kind === 'run_screen') {
          const r = (await api.screener.nlScan(String(args.query))) as { count?: number; results?: unknown[] }
          const n = r?.count ?? r?.results?.length ?? 0
          result = `${n} match${n === 1 ? '' : 'es'} for that screen`
        } else if (action.kind === 'place_order') {
          const r = (await api.broker.order({
            symbol: args.symbol,
            transaction_type: args.side,
            quantity: args.quantity,
            order_type: args.order_type,
            price: args.price ?? 0,
            product: args.product,
            exchange: 'NSE',
          })) as { order_id?: string | null; status?: string; message?: string }
          result = r?.order_id ? `Order placed · ${r.order_id} (${r.status})` : r?.message || 'Order submitted'
        } else if (action.kind === 'create_strategy_draft') {
          router.push(`/strategies?prompt=${encodeURIComponent(String(args.prompt))}`)
          result = 'Opening Strategy Studio with your draft'
          setOpen(false)
        }
        patch({ status: 'done', result })
      } catch (err) {
        patch({ status: 'error', result: err instanceof Error ? err.message : 'Action failed' })
      }
    },
    [messages, router],
  )

  const starters = useMemo(() => STARTERS[mode](ctx), [mode, ctx])

  return (
    <>
    <aside
      aria-label="Copilot"
      aria-hidden={!open}
      className={cn(
        // Docked on every breakpoint: full-width on phones, a 400px panel from sm up,
        // left of the 72px utility rail on lg (window edge on rail-less routes).
        // Closed = translated off-screen.
        'fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-line bg-wrap shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)] transition-transform duration-200 sm:max-w-[400px]',
        hasRail && 'lg:right-[72px]',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-[calc(100%+72px)]',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-signature text-on-signature">
          <CopilotBot className="h-3.5 w-3.5" active={streaming} />
        </span>
        <span className="text-[13px] font-semibold text-d-text-primary">Copilot</span>
        <span className="ml-1 truncate rounded-full border border-line bg-main px-2 py-0.5 text-[10.5px] text-d-text-muted">
          {ctx.symbol ? `${ctx.symbol} · this page` : ctx.label}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {messages.length > 0 ? (
            <button
              type="button" onClick={newThread} title="New thread" aria-label="New thread"
              className="grid h-7 w-7 place-items-center rounded-md text-d-text-muted hover:bg-wrap-hover hover:text-d-text-primary"
            >
              <PlusCircle className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button" onClick={maximize} title="Open full Main Chat" aria-label="Maximize to Main Chat"
            className="grid h-7 w-7 place-items-center rounded-md text-d-text-muted hover:bg-wrap-hover hover:text-d-text-primary"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <button
            type="button" onClick={() => setOpen(false)} title="Close (Esc)" aria-label="Close copilot"
            className="grid h-7 w-7 place-items-center rounded-md text-d-text-muted hover:bg-wrap-hover hover:text-d-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-line px-2 py-1.5">
        {MODES.map((m) => {
          const Icon = m.icon
          const on = m.key === mode
          return (
            <button
              key={m.key} type="button" onClick={() => setMode(m.key)} title={m.label}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors',
                on
                  ? 'glass-control-accent'
                  : 'text-d-text-muted hover:bg-wrap-hover hover:text-d-text-primary',
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {m.label}
            </button>
          )
        })}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <div className="space-y-3 pt-2">
            <p className="text-[12.5px] text-d-text-secondary">
              {activeMode.placeholder}{ctx.symbol ? ` Context: ${ctx.symbol}.` : ''}
            </p>
            <div className="flex flex-col gap-1.5">
              {starters.map((s) => (
                <button
                  key={s} type="button" onClick={() => send(s)}
                  className="group flex items-center justify-between rounded-pill glass-control px-3.5 py-2 text-left text-[12px] text-d-text-secondary hover:text-d-text-primary"
                >
                  <span className="truncate">{s}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-d-text-muted group-hover:text-accent" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Bubble msg={m} />
              {m.role === 'assistant' && m.actions && m.actions.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {m.actions.map((a) => (
                    <ActionCard key={a.id} action={a} onRun={() => runAction(i, a.id)} />
                  ))}
                </div>
              ) : null}
              {/* Context-aware follow-up chips under the latest completed reply. */}
              {m.role === 'assistant' && !m.streaming && i === messages.length - 1 &&
               m.followups && m.followups.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {m.followups.map((f) => (
                    <button
                      key={f} type="button" onClick={() => send(f)}
                      className="rounded-pill glass-control px-2.5 py-1 text-[11px] text-d-text-secondary transition-colors hover:text-d-text-primary"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-line p-2.5">
        <div className="flex items-end gap-2 rounded-xl border border-line bg-main px-2.5 py-1.5 focus-within:border-accent/50">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            rows={1}
            placeholder={activeMode.placeholder}
            className="max-h-28 min-h-[22px] flex-1 resize-none bg-transparent py-1 text-[13px] text-d-text-primary placeholder:text-d-text-muted focus:outline-none"
          />
          {streaming ? (
            <button
              type="button" onClick={stop} title="Stop"
              className="shrink-0 rounded-lg glass-control px-2 py-1 text-[11px] font-medium text-d-text-secondary hover:text-d-text-primary"
            >
              Stop
            </button>
          ) : (
            <button
              type="button" onClick={() => send()} disabled={!input.trim()} title="Send (Enter)"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full glass-control-accent disabled:opacity-40 active:scale-[0.98]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1 px-1 text-[10px] text-d-text-muted">
          @ticker to add context · ⌘/ to toggle · Trade actions always ask before firing
        </p>
        {/* SEBI: single, non-intrusive disclaimer for all AI-generated dock replies. */}
        <DisclaimerFooter />
      </div>
    </aside>
    {/* Floating launcher — phones/tablets always (the RightRail desktop
        launcher is hidden below lg), and desktop too on rail-less routes. */}
    {!open ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Copilot"
        className={cn(
          'fixed bottom-5 right-4 z-40 grid h-12 w-12 place-items-center rounded-full glass-control-accent shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)] active:scale-[0.98]',
          hasRail && 'lg:hidden',
        )}
      >
        <CopilotBot className="h-6 w-6" />
      </button>
    ) : null}
    </>
  )
}

function Bubble({ msg }: { msg: Msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-d-text-primary px-3 py-2 text-[12.5px] text-main">
          {msg.content}
        </div>
      </div>
    )
  }
  // Thinking = streaming with no prose yet → the honest Progress timeline owns
  // this phase (WP-RAILS), replacing the old bare spinner.
  const thinking = !!msg.streaming && !msg.content && !msg.error
  return (
    <div className="flex flex-col gap-1.5">
      {/* GenUI artifacts — real charts/tables/stats, rendered before the prose
          (same shared cards as the Main Chat). Hidden while still thinking. */}
      {!thinking && msg.artifacts && msg.artifacts.length > 0 ? (
        <ChatArtifacts artifacts={msg.artifacts} />
      ) : null}
      {thinking ? (
        <ProgressRail steps={msg.steps ?? []} live />
      ) : (
        <div
          className={cn(
            'max-w-[92%] rounded-2xl rounded-bl-sm border px-3 py-2 text-[12.5px] leading-relaxed',
            msg.error
              ? 'border-down/30 whitespace-pre-wrap bg-down/10 text-down'
              : 'border-line bg-main text-d-text-secondary',
          )}
        >
          {/* Rich markdown (emoji headers + GFM tables), same renderer as the
              Main Chat. Errors stay plain text. */}
          {msg.error ? msg.content : <MarkdownMessage content={msg.content} />}
          {msg.streaming && msg.content ? <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-accent align-middle" /> : null}
        </div>
      )}
      {/* References — brand-safe entities the agent touched. Replaces the old
          `grounded · <raw tool names>` footer (which leaked raw tool names). */}
      {!thinking && msg.references && msg.references.length > 0 ? (
        <ReferencesRail refs={msg.references} />
      ) : null}
    </div>
  )
}

// A proposed action — reviewed + explicitly confirmed before it runs. Orders are
// danger-styled and route to the fully-gated /broker/order on confirm.
function ActionCard({ action, onRun }: { action: ActionState; onRun: () => void }) {
  const { status, danger } = action
  return (
    <div
      className={cn(
        'rounded-lg border px-2.5 py-2 text-[12px]',
        danger ? 'border-down/40 bg-down/5' : 'border-line bg-main',
      )}
    >
      <div className="flex items-start gap-1.5">
        {danger ? (
          <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-down" />
        ) : (
          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
        )}
        <div className="min-w-0">
          <p className="font-medium text-d-text-primary">{action.title}</p>
          {action.summary ? <p className="mt-0.5 text-d-text-muted">{action.summary}</p> : null}
        </div>
      </div>
      {status === 'idle' ? (
        <button
          type="button"
          onClick={onRun}
          className={cn(
            'mt-2 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors active:scale-[0.98]',
            danger ? 'glass-control-danger text-down' : 'glass-control-accent',
          )}
        >
          {danger ? 'Place order' : 'Confirm'}
        </button>
      ) : status === 'running' ? (
        <p className="mt-2 flex items-center gap-1 text-d-text-muted">
          <Loader2 className="h-3 w-3 animate-spin" /> running…
        </p>
      ) : (
        <p className={cn('mt-2', status === 'error' ? 'text-down' : 'text-accent')}>
          {status === 'done' ? '✓ ' : '✗ '}
          {action.result}
        </p>
      )}
    </div>
  )
}

// Mode-specific starter prompts (use the page symbol when present).
const STARTERS: Record<CopilotMode, (c: PageContext) => string[]> = {
  ask: (c) => [
    c.symbol ? `What's the setup on ${c.symbol}?` : 'Is the market bullish today?',
    'What are the top signals right now?',
    "What's driving the market today?",
  ],
  analyze: (c) => [
    c.symbol ? `Analyze ${c.symbol} — trend, levels, momentum` : 'Analyze RELIANCE — trend and key levels',
    c.symbol ? `Why is ${c.symbol} moving?` : 'Why is the Nifty moving today?',
    'Give me a technical read with entry/stop/target',
  ],
  screen: () => [
    'Oversold largecaps in an uptrend with rising volume',
    'Breakouts above 50-DMA with volume surge',
    'High-momentum names making new highs',
  ],
  doctor: () => [
    'Review my portfolio risk and concentration',
    'Which of my positions are most fragile?',
    'How should I rebalance?',
  ],
  trade: (c) => [
    c.symbol ? `Plan a swing trade in ${c.symbol}` : 'Plan a swing trade in RELIANCE',
    'Size a position with 1% risk and a sensible stop',
    'Find me an options play for a range-bound view',
  ],
}
