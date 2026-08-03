'use client'

/**
 * ThinkingLine — the streaming state. One dot, one word, one real number.
 *
 * Spec: docs/REDESIGN.md §4.3.
 *
 *     ● Thinking 4s ›
 *
 * ── The counter is real ────────────────────────────────────────────────────
 * It counts from the moment the turn started, in whole seconds. That matters
 * more than it sounds: the thing it replaces cycled six canned phrases on a
 * 1500ms timer — "Reading the market…", "Checking the levels…" — none of which
 * corresponded to anything the agent was doing. A rotating phrase that does
 * not track the work is a reasoning animation implying actions the system did
 * not perform, which is the one thing this product must never do.
 *
 * An elapsed counter cannot lie. It is the smallest honest thing that still
 * communicates "something is happening".
 *
 * ── The only infinite animation in the product ─────────────────────────────
 * The dot pulses 0.4 → 1 → 0.4 over 1600ms. §4.3 grants this one exception,
 * and `validate-classes` holds an `animate-pulse` ratchet at 7 so it cannot
 * quietly become a house style. It respects `prefers-reduced-motion` — under
 * that setting the dot simply sits at full opacity, which still reads as
 * "active" without moving.
 */

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export interface ThinkingLineProps {
  /** Epoch ms the turn began. Defaults to first mount. */
  startedAt?: number
  /** Optional live stage label from the agent. Shown ONLY when it is real. */
  label?: string | null
  className?: string
}

export function ThinkingLine({ startedAt, label, className }: ThinkingLineProps) {
  // Captured once on mount so a re-render (a token arriving) cannot reset the
  // clock — the counter has to measure the turn, not the render.
  const start = useRef(startedAt ?? Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - start.current) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className={cn('flex items-center gap-2 text-meta text-d-text-muted', className)}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-[var(--state-active,var(--color-primary))] motion-safe:animate-pulse"
      />
      {/* The label is the agent's own stage name when there is one, and the
          bare word when there is not. It is never invented to fill the gap. */}
      <span>{label || 'Thinking'}</span>
      <span className="tabular-nums">{elapsed}s</span>
    </div>
  )
}
