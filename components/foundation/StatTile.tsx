'use client'

/**
 * Foundation StatTile — a compact metric tile.
 *
 * Mono-caps label + GeistMono tabular value + optional tone. Lighter than
 * `StatCard` (which stays for big dashboard KPIs) — this replaces the three
 * inline reimplementations (`Stat` / `MiniCell` / `Metric`) scattered across
 * strategy + scanner surfaces.
 *
 * Motion: a numeric `value` counts up on mount / in-view (framer-motion
 * `animate`); reduced motion (or SSR/headless) shows the final value
 * instantly. String / node values render as-is (already-formatted strings,
 * dashes, ranges — never animated).
 *
 * @example
 *   <StatTile label="Win rate" value={62} suffix="%" tone="up" />
 *   <StatTile label="Stop loss" value="4%" tone="down" />
 */

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { MONO } from '@/lib/tokens'

export type StatTileTone = 'up' | 'down' | 'neutral'

const TONE_CLASS: Record<StatTileTone, string> = {
  up: 'text-up',
  down: 'text-down',
  neutral: 'text-d-text-primary',
}

interface Props {
  /** Mono-caps label above the value. */
  label: string
  /**
   * The metric. A `number` animates a tabular count-up; a string / node
   * renders verbatim (already-formatted values, dashes, ranges).
   */
  value: number | string
  tone?: StatTileTone
  /** Decimal places when `value` is a number (default 0). */
  decimals?: number
  /** Rendered immediately before the number (e.g. '₹'). */
  prefix?: string
  /** Rendered immediately after the number (e.g. '%'). */
  suffix?: string
  /** Optional muted hint under the value. */
  hint?: React.ReactNode
  className?: string
}

export function StatTile({
  label,
  value,
  tone = 'neutral',
  decimals = 0,
  prefix,
  suffix,
  hint,
  className,
}: Props) {
  return (
    <div className={cn('rounded-sm border border-line bg-wrap p-2', className)}>
      <p className="font-mono text-[9px] font-normal uppercase tracking-[0.1em] text-d-text-muted">
        {label}
      </p>
      <p className={cn('mt-0.5 text-xs font-semibold', MONO, TONE_CLASS[tone])}>
        {typeof value === 'number' ? (
          <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
        ) : (
          <>
            {prefix}
            {value}
            {suffix}
          </>
        )}
      </p>
      {hint != null && <p className="mt-0.5 text-[10px] text-d-text-muted">{hint}</p>}
    </div>
  )
}

function formatNum(n: number, decimals: number): string {
  return Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(n.toFixed(decimals)))
}

/** Tabular count-up: renders the FINAL value by default (SSR / reduced-motion
 *  safe), then rewinds to 0 and animates up once on the client when motion is
 *  allowed and the tile scrolls into view. */
function CountUp({
  value,
  decimals,
  prefix,
  suffix,
}: {
  value: number
  decimals: number
  prefix?: string
  suffix?: string
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px' })
  const [display, setDisplay] = useState(() => formatNum(value, decimals))

  useEffect(() => {
    if (reduce || !inView) {
      setDisplay(formatNum(value, decimals))
      return
    }
    const controls = animate(0, value, {
      duration: 0.6,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (latest) => setDisplay(formatNum(latest, decimals)),
    })
    return () => controls.stop()
  }, [value, decimals, reduce, inView])

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}
