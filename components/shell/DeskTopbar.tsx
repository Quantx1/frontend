'use client'

/**
 * DeskTopbar — the persistent desktop-only header that all pro trading apps
 * have (LuxAlgo, Intellectia, Tradomate).
 *
 * It lives INSIDE the main pane (not fixed to the viewport), rendering as a
 * sticky top bar below any ConnectBrokerBanner. It shows:
 *   LEFT  — page breadcrumb / title with an optional live-status dot
 *   RIGHT — optional action slot + market clock
 *
 * Usage in any page:
 *   <DeskTopbar title="Markets" status="live" />
 *   <DeskTopbar title="Signals analysis" eyebrow="ML Signal Stack" actions={<Button>...</Button>} />
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

interface Props {
  /** Page title shown prominently. */
  title: string
  /** Small label above the title (mono-caps eyebrow). */
  eyebrow?: string
  /** Status indicator dot beside the title. */
  status?: 'live' | 'delayed' | 'closed' | 'none'
  /** Right-side actions (buttons, filters, toggles). */
  actions?: React.ReactNode
  /** Extra className on the outer bar. */
  className?: string
}

const STATUS_DOT: Record<NonNullable<Props['status']>, { bg: string; shadow: string; label: string }> = {
  live:    { bg: 'bg-up',      shadow: 'shadow-[0_0_6px_rgba(22,199,132,0.7)]',  label: 'Live' },
  delayed: { bg: 'bg-warning', shadow: 'shadow-[0_0_6px_rgba(240,169,79,0.6)]',  label: 'Delayed' },
  closed:  { bg: 'bg-[color:var(--color-muted)]', shadow: '', label: 'Closed' },
  none:    { bg: '', shadow: '', label: '' },
}

export function DeskTopbar({ title, eyebrow, status = 'none', actions, className }: Props) {
  const dot = STATUS_DOT[status]

  return (
    <div
      className={cn(
        // Sticky inside the main pane — sticks right below ConnectBrokerBanner.
        // Hidden on mobile (the Topbar handles mobile chrome).
        'hidden lg:flex sticky top-0 z-20',
        'h-12 shrink-0 items-center gap-4',
        'border-b border-line bg-wrap px-4 md:px-6',
        className,
      )}
    >
      {/* LEFT — breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {eyebrow && (
          <span className="hidden items-center text-[10.5px] font-semibold uppercase tracking-[0.12em] text-d-text-muted/70 xl:flex">
            {eyebrow}
            <span className="mx-2 text-d-text-muted/40">/</span>
          </span>
        )}
        <h1 className="truncate text-[14px] font-semibold tracking-tight text-d-text-primary">
          {title}
        </h1>
        {status !== 'none' && (
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', dot.bg, dot.shadow)}
            />
            <span className="text-[11px] font-medium text-d-text-muted">{dot.label}</span>
          </span>
        )}
      </div>

      {/* RIGHT — actions */}
      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
