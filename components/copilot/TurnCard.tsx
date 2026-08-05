'use client'

/**
 * TurnCard — renders the one card a turn is allowed, or nothing.
 *
 * The selection rule lives in `lib/copilot/one-card.ts` (pure, tested); this
 * is only the rendering half. Both chat surfaces — the Main Chat page and the
 * dock — go through here, so "exactly one card" is a property of the product
 * rather than of one route.
 *
 * ── The suppressed-count chip ──────────────────────────────────────────────
 * A hard cap invites a specific failure: the turn produced three artifacts,
 * the user sees one, and nothing on screen says the other two existed. That is
 * quietly hiding evidence in a product that asks people to risk money on it.
 * So when the cap drops something, the count is stated — as a tappable chip
 * when there is a panel to open it in, and as a plain line when there is not.
 *
 * ── Handlers, not arrow functions ──────────────────────────────────────────
 * Every control below is guarded on `onOpen` (or on a real fallback route)
 * rather than on `() => onOpen?.(…)`. An arrow function is ALWAYS defined, so
 * the old guards passed on every mount while the right panel — which no
 * production caller passes — did not exist. That rendered a **Buy** button, a
 * **Details** button and an "open" chip that all did nothing.
 */

import { useRouter } from 'next/navigation'

import { ChatArtifacts } from './ChatArtifacts'
import { DataStub } from './DataStub'
import { EntityCard } from './EntityCard'

import type { CopilotArtifact } from '@/lib/api'
import { selectTurnCard, suppressedCount } from '@/lib/copilot/one-card'
import { stockHref } from '@/lib/stock-href'
import { cn } from '@/lib/utils'

export interface TurnCardProps {
  artifacts?: CopilotArtifact[] | null
  /** Opens the right panel with the full artifact. No production surface
   *  passes this yet; entity cards fall back to the stock page and every
   *  other control hides itself rather than rendering inert. */
  onOpen?: (artifact: CopilotArtifact) => void
  className?: string
}

export function TurnCard({ artifacts, onOpen, className }: TurnCardProps) {
  const router = useRouter()
  const picked = selectTurnCard(artifacts)
  if (!picked) return null

  const dropped = suppressedCount(artifacts)
  const rest = (artifacts ?? []).filter((a) => a !== picked.artifact)

  // An index identifies itself by counting `constituents`. There is no
  // /stock/NIFTY page, so an index card has no fallback destination — without
  // the panel it gets no Details button at all.
  const isIndex = picked.kind === 'entity' && picked.artifact.votesNoun === 'constituents'
  const entitySymbol = picked.kind === 'entity' ? picked.artifact.symbol : ''

  // The panel when a caller owns one, the stock page when it does not, and
  // nothing when neither can answer.
  const onEntityDetails = onOpen
    ? () => onOpen(picked.artifact)
    : !isIndex && entitySymbol
      ? () => router.push(stockHref(entitySymbol))
      : undefined

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {picked.kind === 'entity' && (
        <EntityCard
          symbol={picked.artifact.symbol}
          name={picked.artifact.name}
          exchange={picked.artifact.exchange}
          price={picked.artifact.price}
          change={picked.artifact.change}
          changePct={picked.artifact.changePct}
          verdict={picked.artifact.label}
          votes={picked.artifact.votes}
          votesNoun={picked.artifact.votesNoun}
          signalLabel={picked.artifact.signalLabel}
          series={picked.artifact.series}
          // Follows `votesNoun`, because the sentence has to describe what was
          // actually counted. An index card says breadth; a stock card says
          // indicator votes. Reusing one string for both would attach a
          // computation to numbers that did not come from it.
          provenance={
            picked.artifact.asOf
              ? picked.artifact.votesNoun === 'constituents'
                ? `Index breadth on settled closes to ${picked.artifact.asOf}.`
                : `Indicator votes on settled closes to ${picked.artifact.asOf}.`
              : undefined
          }
          onDetails={onEntityDetails}
        />
      )}

      {/* `strategy` already renders correctly through the shared artifact
          renderer — §4.2 calls it "already correct" — so it is reused rather
          than reimplemented as a RulesCard that would drift from it. */}
      {picked.kind === 'rules' && <ChatArtifacts artifacts={[picked.artifact]} />}

      {picked.kind === 'stub' && (
        <DataStub
          summary={picked.summary}
          action={picked.action}
          // Only when a panel exists to open it in. A stub is a summary of
          // data held back; there is no second place to render a 14-row table.
          onOpen={onOpen ? () => onOpen(picked.artifact) : undefined}
          provenance={
            'subtitle' in picked.artifact && picked.artifact.subtitle
              ? String(picked.artifact.subtitle)
              : undefined
          }
        />
      )}

      {/* The count is stated either way — that is the disclosure. It is only a
          BUTTON when there is a panel to open the rest in. */}
      {dropped > 0 &&
        (onOpen && rest.length > 0 ? (
          <button
            type="button"
            onClick={() => onOpen(rest[0])}
            className="self-start text-micro text-d-text-muted underline-offset-2 transition-colors hover:text-d-text-secondary hover:underline"
          >
            {dropped} more {dropped === 1 ? 'card' : 'cards'} from this turn
          </button>
        ) : (
          <p className="self-start text-micro text-d-text-muted">
            {dropped} more {dropped === 1 ? 'card' : 'cards'} from this turn
          </p>
        ))}
    </div>
  )
}
