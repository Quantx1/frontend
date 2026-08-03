'use client'

/**
 * RenderedSurface — a deterministic surface, rendered as a turn.
 *
 * The reusable half of the template renderer (docs/REDESIGN.md §R1, §4.4/§4.5).
 * Point it at a template key and it produces the same shape a chat answer has —
 * prose, one card, one disclosure, follow-up chips — using **zero chat
 * credits** and running **no model**.
 *
 * ── Why a surface and not a page ───────────────────────────────────────────
 * `/markets` was 18 card surfaces, 250+ values and 19 requests. The replacement
 * is a paragraph and one card, because the page's job is to answer "how's the
 * market" and everything past the answer is the user choosing to dig. This
 * component is that answer, and it is the same component `/book` and the
 * signals surface will use — one implementation, not one per route.
 *
 * ── It uses the same `useChat` the thread uses ─────────────────────────────
 * Not for novelty: the backend emits an identical event dialect whether the
 * words were generated or written down, so a rendered surface and a chat turn
 * go through the same reducer and the same components. That equivalence is
 * what lets navigation stop being chat without becoming a second front-end.
 *
 * ── The metering guarantee ─────────────────────────────────────────────────
 * Free tier is 5 chat messages a day. This surface costs none of them —
 * `/copilot/render` has no cap call in it, and a backend test asserts the route
 * cannot even name the credit limiter. If this ever routes through
 * `/copilot/chat/stream` instead, a sidebar tap starts paywalling navigation on
 * the sixth one, invisibly, because the cap check returns early for admins.
 */

import { useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'

import {
  createCopilotRenderTransport,
  type CopilotRenderContext,
  type CopilotTemplate,
} from '@/lib/copilot/transport'
import { msgData } from '@/lib/copilot/selectors'
import type { CopilotUIMessage } from '@/lib/copilot/ui-message'
import { cn } from '@/lib/utils'

import { MarkdownMessage } from './MarkdownMessage'
import { ThinkingLine } from './ThinkingLine'
import { TurnCard } from './TurnCard'
import { TurnDisclosure } from './TurnDisclosure'

export interface RenderedSurfaceProps {
  template: CopilotTemplate
  params?: Record<string, unknown>
  /** A chip tap — the caller renders the next turn. */
  onFollowUp?: (question: string) => void
  /** The card's [Details]. Opens the context panel; omitted leaves it inert. */
  onOpenDetails?: () => void
  className?: string
}

export function RenderedSurface({
  template,
  params,
  onFollowUp,
  onOpenDetails,
  className,
}: RenderedSurfaceProps) {
  // Read at send time rather than closed over, so a param change is picked up
  // without rebuilding the transport.
  const ctxRef = useRef<CopilotRenderContext>({ template, params })
  ctxRef.current = { template, params }

  const { messages, sendMessage, status, error } = useChat<CopilotUIMessage>({
    transport: createCopilotRenderTransport(() => ctxRef.current),
  })

  // Fire once on mount. A render is idempotent and cheap — the backend serves
  // it from a stale-while-revalidate cache in ~0.2s — but re-firing on every
  // dependency change would turn a page into a poller.
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    void sendMessage({ text: template })
  }, [sendMessage, template])

  const last = messages.filter((m) => m.role === 'assistant').at(-1)
  const meta = last ? msgData(last, 'meta') : undefined
  const thinking = status === 'submitted' || (status === 'streaming' && !meta?.reply)

  if (error) {
    return (
      <p className={cn('text-body text-d-text-muted', className)}>
        This read is unavailable right now.
      </p>
    )
  }

  const followups = last ? (msgData(last, 'followups') ?? []) : []

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {thinking && <ThinkingLine />}

      {!thinking && meta?.reply && (
        <div className="max-w-[68ch] text-body leading-relaxed text-d-text-secondary">
          <MarkdownMessage content={meta.reply} />
        </div>
      )}

      {!thinking && (
        <TurnCard
          artifacts={last ? msgData(last, 'artifacts') : undefined}
          onOpen={onOpenDetails ? () => onOpenDetails() : undefined}
        />
      )}

      {!thinking && followups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {followups.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFollowUp?.(f)}
              className="rounded-full border border-line px-3 py-1 text-meta text-d-text-secondary transition-colors hover:text-d-text-primary"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {!thinking && (
        <TurnDisclosure
          steps={last ? msgData(last, 'progress') : undefined}
          references={last ? msgData(last, 'references') : undefined}
          tools={meta?.tools_used}
        />
      )}
    </div>
  )
}
