'use client'

/**
 * EmptyState — v5 "Instrument".
 *
 * An empty state is not an apology, it is a fork in the road: the user got
 * here on purpose and something they expected isn't there. It must say what
 * is missing, why that is (or isn't) normal, and give exactly one obvious
 * next move.
 *
 * What changed: the headline was `text-sm font-normal` — an empty-state title
 * at 14px regular, indistinguishable from its own description, which is why
 * these read as flat grey boxes. It is now the `heading` step (16/600), the
 * description is one line of body, and `action` is genuinely primary.
 *
 * COPY RULE: never "No data found". Name the thing, name the reason, name the
 * action. Compare:
 *   ✗  "No data found."
 *   ✓  title="No signals today"
 *      description="The scan runs at 09:15 IST and only publishes setups that
 *                   clear the backtest gate. Some sessions produce none."
 *      action=<Button>Browse yesterday's book</Button>
 *
 * @example
 *   <EmptyState
 *     icon={<Wand2 size={20} />}
 *     title="Build your first strategy"
 *     description="Describe what you want in plain English — Copilot writes the rules, backtests them, and shows you the equity curve before anything trades."
 *     action={<Button onClick={newStrategy}>Describe a strategy</Button>}
 *   />
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

interface Props {
  /** Lucide icon (or any JSX), ~20px. Auto-tinted to match tone. */
  icon?: React.ReactNode
  title: string
  description?: React.ReactNode
  /** The one obvious next move. Typically a primary Button. */
  action?: React.ReactNode
  /** A quieter escape hatch beside the primary action. */
  secondaryAction?: React.ReactNode
  tone?: 'info' | 'success' | 'warning' | 'error'
  /** `sm` for inline empty cells inside a card; `md` for a full section. */
  size?: 'sm' | 'md'
  className?: string
  /**
   * Heading tag for `title`. Defaults to `h3`, which is right when the empty
   * state sits inside a section that already has an h2 — the common case
   * across the ~37 files using this.
   *
   * Pass `h2` when the empty state is the FIRST heading under a page's h1, or
   * the document jumps h1 -> h3 and screen-reader users lose a level.
   */
  headingLevel?: 'h2' | 'h3' | 'h4'
}

const TONE: Record<Required<Props>['tone'], string> = {
  info: 'text-d-text-muted',
  success: 'text-up',
  warning: 'text-warning',
  error: 'text-down',
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  tone = 'info',
  size = 'md',
  className,
  headingLevel: Heading = 'h3',
}: Props) => (
  <div
    role="status"
    aria-live="polite"
    className={cn(
      // L2 recessed well, no border: an empty state is a hole in the page, so
      // it reads as recessed rather than as one more card competing for weight.
      'flex flex-col items-center justify-center rounded-xl bg-surface-2 text-center',
      size === 'sm' ? 'gap-2.5 p-6' : 'gap-3 p-10',
      className,
    )}
  >
    {icon && (
      <div
        className={cn(
          'grid place-items-center rounded-full border border-line bg-wrap',
          size === 'sm' ? 'h-9 w-9' : 'h-11 w-11',
          TONE[tone],
        )}
        aria-hidden="true"
      >
        {icon}
      </div>
    )}

    <div className="max-w-[42ch]">
      <Heading
        className={cn(
          'font-semibold tracking-[-0.01em] text-d-text-primary',
          size === 'sm' ? 'text-sm leading-5' : 'text-[16px] leading-[22px]',
        )}
      >
        {title}
      </Heading>
      {description && (
        <p
          className={cn(
            'mt-1.5 text-d-text-secondary',
            size === 'sm' ? 'text-xs leading-[18px]' : 'text-sm leading-[21px]',
          )}
        >
          {description}
        </p>
      )}
    </div>

    {(action || secondaryAction) && (
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        {action}
        {secondaryAction}
      </div>
    )}
  </div>
)
