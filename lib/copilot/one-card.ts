/**
 * The one-card rule — which single card a turn is allowed to render.
 *
 * Spec: docs/REDESIGN.md §4.2. "Prose first, always. **Exactly one card** per
 * turn, hard cap."
 *
 * ── Why a hard cap and not a soft preference ────────────────────────────────
 * `build_artifacts` caps at three, and the old thread rendered all three
 * stacked above the prose. That inverts the design: the answer is the
 * sentences, and a card exists to make one claim in them checkable. Three
 * cards means the reader has to work out which of them the paragraph was
 * about — so the paragraph stops being the answer and becomes a caption.
 *
 * ── The collapse, and the one place the spec's wording does not survive ─────
 * §4.2 says nine artifact types collapse to three, with `EntityCard` absorbing
 * `sparkline` / `gauge` / `stat` / `bars`. Taken mechanically that does not
 * work, and it is worth writing down why rather than half-doing it:
 * `EntityCard`'s anatomy is a SYMBOL's — logo, price, session move, indicator
 * votes, sparkline. A regime gauge has no symbol, no price and no votes.
 * Rendering one through `EntityCard` would mean inventing every field that
 * makes the card worth reading.
 *
 * So the collapse here is by what a payload actually CARRIES:
 *
 *   entity                              → EntityCard      (the real thing)
 *   strategy                            → RulesCard       (already correct)
 *   table · linechart · payoff ·
 *   sparkline · gauge · stat · bars     → DataStub        (summary + a chip)
 *
 * `/markets` gets a card that LOOKS like `EntityCard` — §4.4's NIFTY 50 card
 * with "Overall signal · 6 internals" — by the backend emitting a real
 * `entity` artifact for the index, not by the frontend coercing a gauge into
 * one. That is Phase 4.4's work, and it is a better fix than a coercion here.
 *
 * ── Precedence ─────────────────────────────────────────────────────────────
 * entity > strategy > the first stub-able. Turns rarely produce more than one
 * kind; when they do, the entity card is the most specific claim on screen and
 * the one a follow-up is most likely to be about. Within stub-ables the FIRST
 * wins, because the agent emits artifacts in tool order, which is plan order,
 * which is the order it decided mattered.
 */

import type { CopilotArtifact } from '@/lib/api'

/** Artifacts that become a `DataStub` — a one-line summary plus a chip that
 *  opens the panel. Notably `table`: no table ever renders inline (§4.2). */
const STUBBABLE = new Set([
  'table', 'linechart', 'payoff', 'sparkline', 'gauge', 'stat', 'bars',
])

export type TurnCard =
  | { kind: 'entity'; artifact: Extract<CopilotArtifact, { type: 'entity' }> }
  | { kind: 'rules'; artifact: Extract<CopilotArtifact, { type: 'strategy' }> }
  | { kind: 'stub'; artifact: CopilotArtifact; summary: string; action: string }

/**
 * Pick the one card, or none.
 *
 * Returns `null` for an empty list and for a turn whose only artifacts are of
 * a type we have no honest rendering for — a card we cannot draw properly is
 * worse than prose alone.
 */
export function selectTurnCard(artifacts: CopilotArtifact[] | null | undefined): TurnCard | null {
  if (!artifacts?.length) return null

  const entity = artifacts.find((a) => a.type === 'entity')
  if (entity) return { kind: 'entity', artifact: entity as Extract<CopilotArtifact, { type: 'entity' }> }

  const strategy = artifacts.find((a) => a.type === 'strategy')
  if (strategy) return { kind: 'rules', artifact: strategy as Extract<CopilotArtifact, { type: 'strategy' }> }

  const stub = artifacts.find((a) => STUBBABLE.has(a.type))
  if (stub) return { kind: 'stub', artifact: stub, ...stubText(stub) }

  return null
}

/** How many cards the turn produced but did not show. Rendered as a chip, not
 *  hidden: dropping evidence silently is the failure mode the cap invites. */
export function suppressedCount(artifacts: CopilotArtifact[] | null | undefined): number {
  return Math.max((artifacts?.length ?? 0) - 1, 0)
}

/**
 * The stub's one line, derived from the payload and nothing else.
 *
 * Every number here is counted off the artifact, never estimated — "14 rows"
 * means the array had 14 entries. A summary that rounds or approximates would
 * be a second, worse rendering of data the panel is about to show exactly.
 */
function stubText(a: CopilotArtifact): { summary: string; action: string } {
  switch (a.type) {
    case 'table': {
      const rows = a.rows?.length ?? 0
      const cols = a.columns?.length ?? 0
      return {
        summary: `${a.title} · ${rows} ${rows === 1 ? 'row' : 'rows'}${cols ? ` · ${a.columns.join(' · ')}` : ''}`,
        action: rows ? `Open all ${rows}` : 'Open',
      }
    }
    case 'linechart':
    case 'sparkline': {
      const n = a.series?.length ?? 0
      return {
        summary: `${a.title}${a.subtitle ? ` · ${a.subtitle}` : ''}${n ? ` · ${n} points` : ''}`,
        action: 'Open the chart',
      }
    }
    case 'payoff': {
      const be = a.breakevens?.length ?? 0
      return {
        summary: `${a.title}${be ? ` · ${be} breakeven${be === 1 ? '' : 's'}` : ''}`,
        action: 'Open the payoff',
      }
    }
    case 'gauge':
      // `valueLabel` already reads as a sentence ("Sideways · 100% confidence"),
      // so repeating the raw value beside it would say the same thing twice.
      return {
        summary: `${a.title}${a.valueLabel ? ` · ${a.valueLabel}` : ''}`,
        action: 'Open',
      }
    case 'stat': {
      const n = a.stats?.length ?? 0
      return {
        summary: `${a.title}${n ? ` · ${n} figure${n === 1 ? '' : 's'}` : ''}`,
        action: 'Open',
      }
    }
    case 'bars': {
      const n = a.items?.length ?? 0
      return {
        summary: `${a.title}${n ? ` · ${n} ${n === 1 ? 'series' : 'series'}` : ''}`,
        action: 'Open',
      }
    }
    default:
      return { summary: (a as { title?: string }).title ?? 'Details', action: 'Open' }
  }
}

/**
 * The two footnote rows every card carries (§R2, extended by §4.2).
 *
 * They are DIFFERENT STATEMENTS and an earlier draft — including the first
 * cut of `EntityCard` — ran them together into one line:
 *
 *   "Indicator votes on settled closes to 2026-08-01. Analysis, not advice."
 *
 * The first half says where the numbers came from and how stale they are. The
 * second is the regulatory statement that we are not telling anyone what to
 * do. Merging them lets the reader's eye treat the whole line as boilerplate
 * and skip both — and the provenance half is the one that changes per card and
 * actually needs reading.
 */
export const ADVICE_FOOTNOTE = 'Research and education only. Not investment advice.'
