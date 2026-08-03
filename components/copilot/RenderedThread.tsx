'use client'

/**
 * RenderedThread — a deterministic surface you can keep asking.
 *
 * `RenderedSurface` answers once. This stacks answers: tap a chip and the
 * follow-up appears below the one you were reading, in the same shape, and
 * offers the questions it did NOT just answer.
 *
 * ── Why this is the vibe-trading loop and not a navigation bar ─────────────
 * The alternative was chips that jump to a tab. That is a menu wearing
 * conversation's clothes: you leave the answer to go find the next one, and
 * the reasoning you just read scrolls away. Stacking keeps the whole line of
 * questioning on screen — the market read, then breadth, then flows — so the
 * page accumulates an argument instead of swapping panels.
 *
 * ── And every turn is free ────────────────────────────────────────────────
 * Each chip renders a TEMPLATE, not a chat message. Free tier is 5 chat
 * messages a day; a user can walk the entire board — breadth, flows, sectors,
 * what's firing — and still have all five in hand for a question no template
 * answers. If these were chat turns, the fourth chip would paywall the page.
 */

import { useCallback, useState } from 'react'

import type { CopilotTemplate } from '@/lib/copilot/transport'
import { cn } from '@/lib/utils'

import { RenderedSurface } from './RenderedSurface'

/** A chip label → the template + params that answer it. */
export type FollowUpRoute = (label: string) =>
  | { template: CopilotTemplate; params?: Record<string, unknown> }
  | null

interface Turn {
  id: string
  template: CopilotTemplate
  params?: Record<string, unknown>
  label?: string
}

export interface RenderedThreadProps {
  template: CopilotTemplate
  params?: Record<string, unknown>
  /**
   * Resolves a chip label to the next turn. Returning `null` leaves the chip
   * inert rather than guessing — a chip that renders the wrong answer is worse
   * than one that admits it has none.
   */
  route: FollowUpRoute
  /** The card's [Details], on every turn in the thread. */
  onOpenDetails?: () => void
  className?: string
}

export function RenderedThread({ template, params, route, onOpenDetails, className }: RenderedThreadProps) {
  const [turns, setTurns] = useState<Turn[]>([])

  const onFollowUp = useCallback(
    (label: string) => {
      const next = route(label)
      if (!next) return
      setTurns((prev) => [
        ...prev,
        // The id keys the React list AND forces a fresh `useChat` per turn.
        // Without the length in it, tapping the same chip twice would reuse a
        // mounted surface and render nothing.
        { id: `${label}-${prev.length}`, ...next, label },
      ])
    },
    [route],
  )

  return (
    <div className={cn('flex flex-col', className)}>
      <RenderedSurface template={template} params={params} onFollowUp={onFollowUp} onOpenDetails={onOpenDetails} />

      {turns.map((t) => (
        <div key={t.id} className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
          {/* The question, shown as the user's own. Without it a stack of
              answers reads as one long page rather than a conversation. */}
          {t.label && (
            <p className="text-meta text-d-text-muted">
              <span className="sr-only">You asked: </span>
              {t.label}
            </p>
          )}
          <RenderedSurface template={t.template} params={t.params} onFollowUp={onFollowUp} onOpenDetails={onOpenDetails} />
        </div>
      ))}
    </div>
  )
}
