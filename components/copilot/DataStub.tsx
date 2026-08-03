'use client'

/**
 * DataStub — a one-line summary and a chip, for everything that must not
 * render inline.
 *
 * Spec: docs/REDESIGN.md §4.2. `table` · `linechart` · `payoff` · `sparkline`
 * · `gauge` · `stat` · `bars` all arrive here.
 *
 * ── Why a table is never drawn in the thread ───────────────────────────────
 * A 14-row grid inside a chat bubble is a grid that fits neither: too wide for
 * the column, too small to scan, and it buries the sentence that was the
 * actual answer. The panel is a better table than the thread will ever be, so
 * the thread says what is in it and hands over.
 *
 * The summary is COUNTED, never estimated — "14 rows" means the array had 14
 * entries. The panel is about to show the same data exactly, so a stub that
 * rounded would be a second, worse rendering of it.
 *
 * ── Two footnote rows, not one ─────────────────────────────────────────────
 * Same rule as `EntityCard`: provenance and the advice statement are separate
 * lines because they are separate claims. See `lib/copilot/one-card.ts`.
 */

import { ArrowRight } from '@/lib/icons'

import { ADVICE_FOOTNOTE } from '@/lib/copilot/one-card'
import { cn } from '@/lib/utils'

export interface DataStubProps {
  summary: string
  action: string
  onOpen?: () => void
  /** Where the numbers came from and how stale they are. Card-specific. */
  provenance?: string
  className?: string
}

export function DataStub({ summary, action, onOpen, provenance, className }: DataStubProps) {
  return (
    <div className={cn('rounded-md border border-line bg-wrap px-4 py-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-body text-d-text-primary">{summary}</p>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2.5 py-1 text-meta text-d-text-secondary transition-colors hover:text-d-text-primary"
        >
          {action}
          <ArrowRight size={11} aria-hidden />
        </button>
      </div>
      {provenance && <p className="mt-2.5 text-micro text-d-text-muted">{provenance}</p>}
      <p className="mt-1 text-micro text-d-text-muted">{ADVICE_FOOTNOTE}</p>
    </div>
  )
}
