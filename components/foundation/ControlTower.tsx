'use client'

/**
 * Foundation ControlTower — the redesigned data-page shell.
 *
 * Establishes the "control-tower" hierarchy the 2026 trading desks use
 * (LuxAlgo / Intellectia / TradeAlgo): one decisive primary column carrying
 * the telemetry + tables, and a supporting `rail` that sticks alongside on
 * large screens (typically an <InsightRail/> AI panel). Collapses to a single
 * stack under lg. Pair with <DeskSection/> to title regions inside `primary`.
 *
 * @example
 *   <ControlTower rail={<InsightRail ... />}>
 *     <MetricGrid>...</MetricGrid>
 *     <DeskSection label="Signals">...</DeskSection>
 *   </ControlTower>
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ControlTowerProps {
  children: React.ReactNode
  /** Supporting column — sticky on lg+. Omit for a full-width single column. */
  rail?: React.ReactNode
  className?: string
}

export function ControlTower({ children, rail, className }: ControlTowerProps) {
  if (!rail) {
    return <div className={cn('flex flex-col gap-4', className)}>{children}</div>
  }
  return (
    <div className={cn('control-tower', className)}>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
      <aside className="control-tower__rail flex flex-col gap-4">{rail}</aside>
    </div>
  )
}

/** A titled region inside the primary column: mono-caps label + optional
 *  action, then the content. Keeps every desk section visually consistent. */
export function DeskSection({
  label,
  action,
  children,
  className,
}: {
  label: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-2.5', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="desk-label">{label}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Responsive metric strip — auto-fit grid of MetricCards. */
export function MetricGrid({
  children,
  min = 160,
  className,
}: {
  children: React.ReactNode
  /** Minimum column width in px before wrapping. */
  min?: number
  className?: string
}) {
  return (
    <div
      className={cn('grid gap-3', className)}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}
    >
      {children}
    </div>
  )
}
