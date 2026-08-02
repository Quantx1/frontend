'use client'

/**
 * Foundation EmptyState — icon + headline + description + optional CTA.
 *
 * Every list view needs this. Standardised so the "no signals yet" /
 * "no positions" / "no trades" experience is consistent across the app.
 *
 * Tone hints: pass ``tone='info'`` (default) for neutral empty states,
 * ``tone='error'`` for failure states (broker disconnected, etc.).
 *
 * @example  Standard empty
 *   <EmptyState
 *     icon={<Inbox className="h-8 w-8" />}
 *     title="No signals yet"
 *     description="Today's scan finishes at 09:15 IST. Check back then."
 *   />
 *
 * @example  With action
 *   <EmptyState
 *     icon={<Wand2 className="h-8 w-8" />}
 *     title="Build your first strategy"
 *     description="Describe what you want in plain English — Copilot does the rest."
 *     action={<Button onClick={() => router.push('/strategies/new')}>New strategy</Button>}
 *   />
 *
 * @example  Error state
 *   <EmptyState
 *     tone="error"
 *     icon={<AlertCircle className="h-8 w-8" />}
 *     title="Broker disconnected"
 *     description="Your Zerodha session expired. Reconnect to keep AutoPilot running."
 *     action={<Button onClick={reconnect}>Reconnect broker</Button>}
 *   />
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

interface Props {
  /** Lucide icon (or any JSX). Auto-tinted to match tone. */
  icon?: React.ReactNode
  title: string
  description?: React.ReactNode
  /** Right-side CTA, typically a Button. */
  action?: React.ReactNode
  tone?: 'info' | 'success' | 'warning' | 'error'
  /** Compact size for inline empty cells; default is centered full-width. */
  size?: 'sm' | 'md'
  className?: string
  /**
   * Heading tag for `title`. Defaults to `h3`, which is right when the empty
   * state sits inside a section that already has an h2 — the common case
   * across the 37 files using this.
   *
   * Pass `h2` when the empty state is the FIRST heading under a page's h1, or
   * the document jumps h1 -> h3 and screen-reader users lose a level. That is
   * what /watchlist did: PageHeader renders the h1, and the only other heading
   * on the page was this component's "Put the AI on watch".
   *
   * Opt-in rather than changing the default, because for most of the other 36
   * call sites h3 is the correct level and a blanket change would just move
   * the skip somewhere else.
   */
  headingLevel?: 'h2' | 'h3' | 'h4'
}

const TONE_CLASSES: Record<Required<Props>['tone'], string> = {
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
  tone = 'info',
  size = 'md',
  className,
  headingLevel: Heading = 'h3',
}: Props) => (
  <div
    role="status"
    aria-live="polite"
    className={cn(
      // xAI: a framed charcoal panel, flat hairline, 8px radius.
      'flex flex-col items-center justify-center gap-3 rounded-sm bg-wrap-hover text-center',
      size === 'sm' ? 'p-8' : 'p-12',
      className,
    )}
  >
    {icon && (
      <div
        className={cn(
          'flex items-center justify-center rounded-full border border-line bg-wrap',
          size === 'sm' ? 'h-10 w-10' : 'h-14 w-14',
          TONE_CLASSES[tone],
        )}
        aria-hidden="true"
      >
        {icon}
      </div>
    )}
    <div className="max-w-sm">
      <Heading className="text-sm font-normal text-d-text-primary">{title}</Heading>
      {description && (
        <div className="mt-1 text-sm text-d-text-secondary">{description}</div>
      )}
    </div>
    {action && <div className="mt-2">{action}</div>}
  </div>
)
