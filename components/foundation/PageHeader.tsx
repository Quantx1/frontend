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
      'flex flex-col gap-4 border-b border-line px-4 py-5 md:flex-row md:items-end md:justify-between md:px-6',
      className,
    )}
  >
    <div className="min-w-0 flex-1">
      {eyebrow && (
        <p className="mb-1.5 font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-d-text-muted">
          {eyebrow}
        </p>
      )}
      <h1 className="truncate text-display-sm font-normal text-d-text-primary">
        {title}
      </h1>
      {description && (
        <div className="mt-1 text-sm text-d-text-secondary">{description}</div>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    )}
  </header>
)
