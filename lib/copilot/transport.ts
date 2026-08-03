/**
 * The AI SDK transport for the Copilot.
 *
 * Points `useChat` straight at the FastAPI backend — no Next.js proxy route is
 * involved, because this app has no server of its own (zero route handlers) and
 * all agent orchestration lives in Python.
 *
 * Three things this file exists to preserve, each of which breaks by default:
 *
 *  1. **The 402 quota gate.** `HttpChatTransport.sendMessages` does
 *     `if (!response.ok) throw new Error(await response.text())`
 *     (node_modules/ai/src/ui/http-chat-transport.ts:203-206) — the HTTP status
 *     is DISCARDED. Every `e instanceof ApiError && e.status === 402` branch
 *     would stop matching and the upgrade CTA would silently vanish for Free
 *     users. Fixed with a custom `fetch` that throws the real `ApiError` before
 *     the transport's own check can run.
 *
 *  2. **Auth.** The token is read per-request via the async `headers` form, so a
 *     refreshed session is picked up without rebuilding the transport.
 *
 *  3. **The request body.** The backend's `CopilotChatRequest` is a fixed schema
 *     (route, history, mentioned_symbols, conversation_id, persist,
 *     display_message). By default the SDK would POST `{id, messages, trigger}`
 *     instead. `prepareSendMessagesRequest` rewrites the body to exactly what the
 *     endpoint already accepts, so NO backend schema change is needed.
 */

import { DefaultChatTransport } from 'ai'

import { apiBase, authToken, throwStreamApiError } from '@/lib/api'

import type { CopilotUIMessage } from './ui-message'

/** Per-request context the composer owns (mode, route, symbols, thread). */
export interface CopilotSendContext {
  /** The prompt actually sent — may carry composer scaffolding/mode directives. */
  message: string
  /** What the user literally typed, when `message` is scaffolded. Persisted instead. */
  display_message?: string
  route?: string
  history?: Array<{ role: string; content: string }>
  mentioned_symbols?: string[]
  conversation_id?: string
  persist?: boolean
}

/**
 * Build the transport.
 *
 * @param getContext resolves the request context at send time. Called per send,
 *   so it always sees current mode/route/thread rather than a stale closure.
 */
export function createCopilotTransport(getContext: () => CopilotSendContext) {
  return new DefaultChatTransport<CopilotUIMessage>({
    api: `${apiBase()}/api/ai/copilot/chat/stream`,

    // Resolved per request (Resolvable<...>, http-chat-transport.ts:79).
    headers: async () => {
      const token = await authToken()
      return {
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    },

    // Preserve structured errors — see note 1 above. Throwing here short-circuits
    // the transport's status-discarding branch entirely.
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await fetch(input, init)
      if (!res.ok) await throwStreamApiError(res)
      return res
    }) as typeof fetch,

    // Send the backend's schema, not the SDK's default envelope.
    prepareSendMessagesRequest: ({ api, headers, credentials }) => {
      const ctx = getContext()
      return {
        api,
        headers,
        credentials,
        body: {
          message: ctx.message,
          ...(ctx.display_message ? { display_message: ctx.display_message } : {}),
          ...(ctx.route ? { route: ctx.route } : {}),
          ...(ctx.history ? { history: ctx.history } : {}),
          ...(ctx.mentioned_symbols?.length
            ? { mentioned_symbols: ctx.mentioned_symbols }
            : {}),
          ...(ctx.conversation_id ? { conversation_id: ctx.conversation_id } : {}),
          ...(ctx.persist ? { persist: true } : {}),
          // Opt this request into the AI SDK dialect. Omitting it yields the
          // original meta/token/done frames, which is the rollback path.
          protocol: 'ui-message',
        },
      }
    },
  })
}

/** The deterministic surfaces. Keys must match `TEMPLATES` in the backend's
 *  `ai/agents/templates.py` — a mismatch is a 404, not a silent fallback. */
export type CopilotTemplate = 'market_brief' | 'stock_read' | 'my_book' | 'signals_today'

export interface CopilotRenderContext {
  template: CopilotTemplate
  params?: Record<string, unknown>
  conversation_id?: string
  persist?: boolean
}

/**
 * A transport for DETERMINISTIC renders — navigation, not chat.
 *
 * Same wire format, same `useChat`, same components. The only differences are
 * the URL and the body, because the backend emits the identical event dialect
 * whether the words were generated or written down. That equivalence is the
 * point: it lets navigation stop being chat without becoming a second
 * front-end.
 *
 * **It costs zero chat credits.** Free tier is 5 chat messages a day, so
 * routing a sidebar tap through `/copilot/chat/stream` paywalls navigation on
 * the sixth one — and because the backend's cap check returns early for
 * admins, nobody building it would ever see that happen. `/copilot/render` has
 * no cap call in it at all; a backend test asserts the route cannot even reach
 * the credit limiter.
 *
 * The 402 handling below is therefore not for quota. It is kept because the
 * shared `fetch` wrapper is what preserves HTTP status through the SDK's
 * status-discarding error branch, and a 401 or 503 still needs to arrive as a
 * real `ApiError`.
 */
export function createCopilotRenderTransport(getContext: () => CopilotRenderContext) {
  return new DefaultChatTransport<CopilotUIMessage>({
    api: `${apiBase()}/api/ai/copilot/render`,

    headers: async () => {
      const token = await authToken()
      return {
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    },

    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await fetch(input, init)
      if (!res.ok) await throwStreamApiError(res)
      return res
    }) as typeof fetch,

    prepareSendMessagesRequest: ({ api, headers, credentials }) => {
      const ctx = getContext()
      return {
        api,
        headers,
        credentials,
        body: {
          template: ctx.template,
          ...(ctx.params ? { params: ctx.params } : {}),
          ...(ctx.conversation_id ? { conversation_id: ctx.conversation_id } : {}),
          ...(ctx.persist ? { persist: true } : {}),
        },
      }
    },
  })
}
