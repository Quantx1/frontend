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
      <h3 className="text-sm font-normal text-d-text-primary">{title}</h3>
      {description && (
        <div className="mt-1 text-sm text-d-text-secondary">{description}</div>
      )}
    </div>
    {action && <div className="mt-2">{action}</div>}
  </div>
)
