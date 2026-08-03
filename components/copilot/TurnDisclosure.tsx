'use client'

/**
 * TurnDisclosure — the ONE thing a finished turn discloses about its work.
 *
 * Spec: docs/REDESIGN.md §4.3.
 *
 * ── What this replaces ─────────────────────────────────────────────────────
 * A settled turn used to carry THREE sibling surfaces describing the same
 * work: `ProgressRail` (the step timeline), `ReferencesRail` (the entities)
 * and a `CONSULTED` chip row (the tools). Each is defensible alone; together
 * they say the same thing three times in three visual languages, and they
 * pushed the actual answer down the page.
 *
 * One line, collapsed:
 *
 *     ✓ Worked it out · 6 steps · 2.4s · 3 sources ⌄
 *
 * Expanding reveals steps, tool chips and references TOGETHER, in one panel.
 *
 * ── The failure line is the point ──────────────────────────────────────────
 * If any step failed the collapsed line reads
 *
 *     ⚠ Worked it out · 6 steps · 1 failed ⌄
 *
 * and the failing row states what happened inline — not in a tooltip, not
 * behind a hover. The redesign document corrects its own draft on exactly
 * this: the draft's example fronted a silent data substitution with a ✓ and
 * the words "Worked it out". A failure the user cannot read is a failure the
 * user cannot trust, and this product asks people to risk money on the result.
 *
 * ── Three glyphs, driven by status ─────────────────────────────────────────
 * `ProgressRail` chose its step icon by substring-matching the label
 * (`'understand'`, `'plan'`, `'market'`, `'analy'`, `'compos'`). Iconography
 * inferred from a string carries no meaning — it breaks silently when a label
 * is reworded, and it implies the system knows something about the step that
 * it does not. Icons here come from `status` alone, which is a real field.
 */

import { useState } from 'react'

import { Check, ChevronRight, XCircle } from '@/lib/icons'
import type { CopilotReference, CopilotStep } from '@/lib/api'
import { prettyTools } from '@/lib/copilot/tool-labels'
import { MONO } from '@/lib/tokens'
import { cn } from '@/lib/utils'

function fmtDur(ms?: number): string | null {
  if (ms == null || ms <= 0) return null
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`
}

/** The collapsed line's text, as data. Pure so it can be asserted directly. */
export function summarise(steps: CopilotStep[], refs: CopilotReference[]): {
  failed: number
  parts: string[]
} {
  const failed = steps.filter((s) => s.status === 'error').length
  const parts: string[] = []
  if (steps.length) parts.push(`${steps.length} step${steps.length === 1 ? '' : 's'}`)

  const total = steps.reduce((a, s) => a + (s.duration_ms ?? 0), 0)
  const dur = fmtDur(total)
  if (dur) parts.push(dur)

  // "Sources" counts the entities the agent actually consulted. Zero sources
  // is a real state — a greeting or a refusal touches nothing — and it is
  // omitted rather than shown as "0 sources", which reads like a failure.
  if (refs.length) parts.push(`${refs.length} source${refs.length === 1 ? '' : 's'}`)

  // The failure count goes LAST so it is the thing the eye lands on before
  // the chevron, and it is never merged into the step count.
  if (failed) parts.push(`${failed} failed`)

  return { failed, parts }
}

/**
 * Three glyphs, from `status` alone.
 *
 * `running` is a DOT, not a spinner. The product has exactly one "active"
 * signal — the pulsing dot in `ThinkingLine` — and adding a second vocabulary
 * for the same state inside a panel that only opens after the turn settled
 * would be two idioms for one meaning. The `animate-spin` ratchet in
 * `validate-classes.mjs` caught the first draft of this doing exactly that.
 */
function StatusGlyph({ status, size = 12 }: { status: CopilotStep['status']; size?: number }) {
  if (status === 'error') return <XCircle size={size} className="text-down" />
  if (status === 'running') {
    return (
      <span
        aria-label="running"
        className="block size-1.5 rounded-full bg-[var(--state-active,var(--color-primary))] motion-safe:animate-pulse"
      />
    )
  }
  return <Check size={size} className="text-d-text-muted" />
}

export interface TurnDisclosureProps {
  steps?: CopilotStep[] | null
  references?: CopilotReference[] | null
  /**
   * RAW tool names, as `meta.tools_used` carries them. This component maps
   * them to public labels itself — see `lib/copilot/tool-labels.ts`. Passing
   * pre-labelled strings is not the contract, because a firewall that depends
   * on each caller remembering to apply it leaks the first time one does not.
   * That already happened once, here, to this component.
   */
  tools?: string[] | null
  className?: string
}

export function TurnDisclosure({ steps, references, tools, className }: TurnDisclosureProps) {
  const [open, setOpen] = useState(false)
  const s = steps ?? []
  const refs = references ?? []
  const chips = prettyTools(tools ?? [])

  // Nothing to disclose is not an empty panel — it is no panel.
  if (!s.length && !refs.length && !chips.length) return null

  const { failed, parts } = summarise(s, refs)

  return (
    <div className={cn('mt-2', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group inline-flex items-center gap-1.5 text-meta text-d-text-muted transition-colors hover:text-d-text-secondary"
      >
        {failed ? (
          <span className="text-down" aria-hidden>⚠</span>
        ) : (
          <Check size={11} aria-hidden />
        )}
        <span>Worked it out</span>
        {parts.map((p) => (
          <span key={p} className={cn(p.endsWith('failed') && 'text-down')}>
            · {p}
          </span>
        ))}
        <ChevronRight
          size={11}
          aria-hidden
          className={cn('transition-transform', open && 'rotate-90')}
        />
      </button>

      {open && (
        // One panel, no border and no shadow — this is a disclosure, not a
        // card, and giving it card chrome would put it back in competition
        // with the one card the turn is allowed.
        <div className="mt-2 flex flex-col gap-3 rounded-sm bg-surface-2/40 px-3 py-2.5">
          {s.length > 0 && (
            <ol className="flex flex-col gap-1.5">
              {s.map((step, i) => (
                <li key={`${step.stage}-${i}`} className="flex items-start gap-2">
                  <span className="mt-[3px] shrink-0">
                    <StatusGlyph status={step.status} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'text-meta',
                        step.status === 'error' ? 'text-down' : 'text-d-text-secondary',
                      )}
                    >
                      {step.label}
                    </span>
                    {step.duration_ms != null && step.duration_ms > 0 && (
                      <span className={cn(MONO, 'ml-2 text-micro text-d-text-muted')}>
                        {fmtDur(step.duration_ms)}
                      </span>
                    )}
                    {/* Stated in the row. Never a tooltip — a failure the user
                        has to hover to find is a failure they will not find. */}
                    {step.error && (
                      <span className="block text-micro text-d-text-muted">{step.error}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {chips.map((t) => (
                <span
                  key={t}
                  className={cn(
                    MONO,
                    'rounded-sm border border-line px-2 py-0.5 text-micro text-d-text-muted',
                  )}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {refs.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {refs.map((r, i) => (
                <span key={`${r.label}-${i}`} className="text-micro text-d-text-muted">
                  {r.label}
                  {r.sublabel ? ` · ${r.sublabel}` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
