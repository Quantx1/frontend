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
 * So when the cap drops something, the count is stated and the rest are one
 * tap away.
 */

import { ChatArtifacts } from './ChatArtifacts'
import { DataStub } from './DataStub'
import { EntityCard } from './EntityCard'

import type { CopilotArtifact } from '@/lib/api'
import { selectTurnCard, suppressedCount } from '@/lib/copilot/one-card'
import { cn } from '@/lib/utils'

export interface TurnCardProps {
  artifacts?: CopilotArtifact[] | null
  /** Opens the right panel with the full artifact. Phase 5 wires the panel;
   *  until then the chip is rendered but inert rather than faked away. */
  onOpen?: (artifact: CopilotArtifact) => void
  className?: string
}

export function TurnCard({ artifacts, onOpen, className }: TurnCardProps) {
  const picked = selectTurnCard(artifacts)
  if (!picked) return null

  const dropped = suppressedCount(artifacts)
  const rest = (artifacts ?? []).filter((a) => a !== picked.artifact)

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
          onDetails={() => onOpen?.(picked.artifact)}
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
          onOpen={() => onOpen?.(picked.artifact)}
          provenance={
            'subtitle' in picked.artifact && picked.artifact.subtitle
              ? String(picked.artifact.subtitle)
              : undefined
          }
        />
      )}

      {dropped > 0 && (
        <button
          type="button"
          onClick={() => onOpen?.(rest[0])}
          className="self-start text-micro text-d-text-muted underline-offset-2 transition-colors hover:text-d-text-secondary hover:underline"
        >
          {dropped} more {dropped === 1 ? 'card' : 'cards'} from this turn
        </button>
      )}
    </div>
  )
}
