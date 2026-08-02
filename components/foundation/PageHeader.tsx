'use client'

/**
 * Foundation PageHeader — title + optional eyebrow / description /
 * actions. The "every page starts the same way" pattern.
 *
 * Responsive: collapses to stacked layout < md.
 *
 * @example  Simple
 *   <PageHeader title="Signals" />
 *
 * @example  With eyebrow + actions
 *   <PageHeader
 *     eyebrow="Today"
 *     title="Active swing signals"
 *     description="Generated at 09:15 IST · 12 candidates"
 *     actions={
 *       <>
 *         <Button variant="ghost"><RefreshCw className="h-4 w-4" /></Button>
 *         <Button>New strategy</Button>
 *       </>
 *     }
 *   />
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

interface Props {
  /** Small uppercase label above the title — section / context indicator. */
  eyebrow?: string
  title: string
  description?: React.ReactNode
  /** Right-side actions, typically Buttons. Wraps below title on mobile. */
  actions?: React.ReactNode
  /** Optional className for the outer container. */
  className?: string
}

export const PageHeader = ({
  eyebrow,
  title,
  description,
  actions,
  className,
}: Props) => (
  <header
    className={cn(
      // Pro-finance: compact, borderless, tight — the DeskTopbar carries the
      // page title on desktop, so PageHeader is a sub-section eyebrow.
      // On mobile (no DeskTopbar) it keeps the title visible with lighter padding.
      'flex flex-col gap-3 pt-4 pb-3 md:flex-row md:items-end md:justify-between',
      className,
    )}
  >
    <div className="min-w-0 flex-1">
      {eyebrow && (
        <p className="mb-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-d-text-muted">
          {eyebrow}
        </p>
      )}
      <h2 className="truncate text-[22px] font-semibold tracking-tight text-d-text-primary">
        {title}
      </h2>
      {description && (
        <div className="mt-0.5 text-[13px] text-d-text-secondary">{description}</div>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    )}
  </header>
)
