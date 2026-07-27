'use client'

/**
 * Foundation Spinner + PageLoader — the ONE loading primitive for the app.
 *
 * Why: loading spinners were scattered as bare <Loader2 className="animate-spin" />
 * inside zero-height flex-center divs, so they collapsed to the top of the
 * page instead of centering. PageLoader guarantees vertical centering; Spinner
 * is the inline unit (buttons, cells, small panels).
 *
 * @example  Full-page / section loader (centered)
 *   if (loading) return <PageLoader label="Loading your portfolio…" />
 *
 * @example  Inline spinner (button, cell)
 *   {saving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
 */
import * as React from 'react'
import { Loader2 } from '@/lib/icons'
import { cn } from '@/lib/utils'

const SIZE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function Spinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <Loader2
      className={cn('animate-spin text-primary', SIZE[size], className)}
      aria-hidden="true"
    />
  )
}

/**
 * Centered loader for a page or a section. Always fills its band so the
 * spinner sits in the middle, never pinned to the top.
 */
export function PageLoader({
  label,
  className,
  minH = '60vh',
}: {
  label?: string
  className?: string
  /** Min height of the centering band. Use '100%' inside a fixed-height card. */
  minH?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex w-full flex-col items-center justify-center gap-3', className)}
      style={{ minHeight: minH }}
    >
      <Spinner size="lg" />
      {label && <p className="text-sm text-d-text-secondary">{label}</p>}
      <span className="sr-only">Loading</span>
    </div>
  )
}
