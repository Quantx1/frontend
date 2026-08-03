/**
 * EntityCard — the ONE card a chat reply is allowed to render.
 *
 * Spec: docs/REDESIGN-VISUAL.md §4.1 (7-row anatomy, 8-number budget).
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * The audit found `/stock/[symbol]` rendering 38 surfaces and ~200 numbers
 * before the user asks anything, and every assistant reply wrapped in four
 * separate provenance strips. This card is the opposite bet: prose carries the
 * answer, and exactly one card carries the evidence. Everything else moves
 * behind [Details].
 *
 * ── The budget is the design ───────────────────────────────────────────────
 * At most EIGHT numbers: price, absolute delta, % delta, three bar segments,
 * the indicator count, and one optional. No engine names, no model badges, no
 * "3/3 agree", no percentile-vs-universe. If a number is not one of those, it
 * belongs in the right panel.
 *
 * ── Colour licence ─────────────────────────────────────────────────────────
 * The verdict word is the card's SINGLE colour licence. The price is never
 * coloured — a price is not a direction. Direction always carries a second
 * channel (the sign on the delta), because `--color-up` and `--color-down` sit
 * at 1.01:1 luminance contrast to each other and are indistinguishable in
 * greyscale or under achromatopsia (REDESIGN-VISUAL.md §5.5).
 */

import { Button, Card, CardBody, ChangeBadge, Sparkline } from '@/components/foundation'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import { inr, num } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Fixed, short vocabulary. Never a score, never a percentage, never "0.72". */
export type EntityVerdict = 'Buy' | 'Accumulate' | 'Neutral' | 'Reduce' | 'Sell'

const VERDICT_TONE: Record<EntityVerdict, string> = {
  Buy: 'text-up',
  Accumulate: 'text-up',
  Neutral: 'text-d-text-primary',
  Reduce: 'text-down',
  Sell: 'text-down',
}

export interface EntityCardProps {
  symbol: string
  /** Company name. Rendered as "{name} · {exchange}", one line, truncated. */
  name?: string | null
  exchange?: string
  /** Last traded price in rupees. */
  price?: number | null
  /** Absolute change in rupees. */
  change?: number | null
  /** Percent change, already on the percent scale (1.14 → +1.14%). */
  changePct?: number | null
  verdict?: EntityVerdict | null
  /**
   * Indicator vote split. Omitted entirely rather than guessed — a fabricated
   * count is worse than no count.
   */
  votes?: { bull: number; neutral: number; bear: number } | null
  /** Close series for the sparkline. Needs ≥2 points to draw. */
  series?: number[] | null
  /** One line. Replaces the six distinct disclaimer strings on /stock today. */
  provenance?: string
  onDetails?: () => void
  onBuy?: () => void
  className?: string
}

export function EntityCard({
  symbol,
  name,
  exchange = 'NSE',
  price,
  change,
  changePct,
  verdict,
  votes,
  series,
  provenance,
  onDetails,
  onBuy,
  className,
}: EntityCardProps) {
  const total = votes ? votes.bull + votes.neutral + votes.bear : 0
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0)
  const tone: 'up' | 'down' | 'auto' =
    changePct == null ? 'auto' : changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'auto'

  return (
    // `md` = 12px — the card radius in the usage budget (REDESIGN-VISUAL §2.1).
    <Card elevation="raised" density="default" className={cn('rounded-md', className)}>
      {/* Card publishes --card-px/--card-py; CardBody is what consumes them. */}
      <CardBody>
      {/* ── row 1 — identity + price ─────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface-2">
          <SymbolLogo symbol={symbol} size={24} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-heading text-d-text-primary">{symbol}</p>
          <p className="truncate text-meta text-d-text-muted">
            {name ? `${name} · ${exchange}` : exchange}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {/* Never coloured — a price is not a direction. */}
          <p className="text-num-lg font-mono tabular-nums text-d-text-primary">{inr(price, 2)}</p>
          {changePct != null && (
            <div className="mt-0.5 flex items-center justify-end gap-2">
              {change != null && (
                <span
                  className={cn(
                    'text-meta font-mono tabular-nums',
                    change > 0 ? 'text-up' : change < 0 ? 'text-down' : 'text-d-text-muted',
                  )}
                >
                  {change > 0 ? '+' : change < 0 ? '−' : ''}
                  {num(Math.abs(change), 2)}
                </span>
              )}
              <ChangeBadge value={changePct} size="sm" />
            </div>
          )}
        </div>
      </div>

      <div className="my-4 border-t border-line" />

      {/* ── rows 2-4 — the signal read ───────────────────────────────────── */}
      {/* The indicator clause is OMITTED when the count is unknown, never faked. */}
      <p className="text-micro uppercase text-d-text-muted">
        Overall signal{total > 0 ? ` · ${total} indicators` : ''}
      </p>

      {votes && total > 0 && (
        <div className="mt-2 flex h-[6px] gap-[2px] overflow-hidden rounded-full bg-surface-2">
          <span className="bg-up" style={{ flexBasis: `${pct(votes.bull)}%` }} />
          <span className="bg-muted/40" style={{ flexBasis: `${pct(votes.neutral)}%` }} />
          <span className="bg-down" style={{ flexBasis: `${pct(votes.bear)}%` }} />
        </div>
      )}

      {verdict && (
        <p className={cn('mt-3 text-title', VERDICT_TONE[verdict])}>{verdict}</p>
      )}

      {/* ── row 5 — sparkline. No axes, no grid, no tooltip, no Recharts. ── */}
      {series && series.length >= 2 && (
        <Sparkline
          data={series}
          width={520}
          height={40}
          tone={tone}
          strokeWidth={1.75}
          filled
          className="mt-3 w-full"
          ariaLabel={`${symbol} recent price trend`}
        />
      )}

      <div className="my-4 border-t border-line" />

      {/* ── row 6 — exactly two actions. A third would be a follow-up chip. ─ */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="secondary" size="md" onClick={onDetails}>
          Details
        </Button>
        <Button variant="primary" size="md" onClick={onBuy}>
          Buy
        </Button>
      </div>

      {/* ── row 7 — provenance. Exactly one line. ────────────────────────── */}
      {provenance && <p className="mt-3 text-micro text-d-text-muted">{provenance}</p>}
      </CardBody>
    </Card>
  )
}
