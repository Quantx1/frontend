'use client'

/**
 * Foundation Sparkline — tiny inline trend chart.
 *
 * Lightweight SVG, no lib. Renders a path through the given values
 * with auto-derived color (last vs first → up/down). Use for inline
 * watchlist rows, stat cards, signal cards — anywhere a one-line
 * "shape of the trend" hint is more useful than a number.
 *
 * Loading state: pass an empty array; a 1px line placeholder renders.
 *
 * @example  Inline cell
 *   <Sparkline data={lastNCloses} width={64} height={20} />
 *
 * @example  Stat card with explicit color
 *   <Sparkline data={equityCurve} tone="up" width={120} height={32} />
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

interface Props {
  /** Array of numeric Y values (e.g. close prices). 2 minimum for a line. */
  data: number[]
  width?: number
  height?: number
  /** Stroke + fill tone. ``auto`` derives from first vs last value. */
  tone?: 'auto' | 'up' | 'down' | 'neutral'
  /** Stroke width in px. */
  strokeWidth?: number
  /** Fill the area under the curve with a faint tone gradient. */
  filled?: boolean
  className?: string
  ariaLabel?: string
}

const TONE_STROKE = {
  up: 'stroke-up',
  down: 'stroke-down',
  neutral: 'stroke-d-text-muted',
} as const

const TONE_FILL = {
  up: 'fill-up/10',
  down: 'fill-down/10',
  neutral: 'fill-wrap-hover',
} as const

export const Sparkline = ({
  data,
  width = 80,
  height = 24,
  tone = 'auto',
  strokeWidth = 1.5,
  filled,
  className,
  ariaLabel,
}: Props) => {
  // Empty state — single horizontal placeholder line.
  if (data.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={cn('shrink-0', className)}
        aria-label={ariaLabel ?? 'No trend data'}
        role="img"
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          className="stroke-line"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </svg>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  // Inset by half stroke width to avoid clipping.
  const pad = strokeWidth / 2

  const points = data.map((v, i) => {
    const x = i * stepX
    const y = pad + (1 - (v - min) / range) * (height - 2 * pad)
    return [x, y] as const
  })

  const pathD = points
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(' ')

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`

  const resolvedTone =
    tone === 'auto'
      ? data[data.length - 1] >= data[0]
        ? 'up'
        : 'down'
      : tone

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0', className)}
      role="img"
      aria-label={ariaLabel ?? `Trend ${resolvedTone}`}
    >
      {filled && (
        <path d={areaD} className={TONE_FILL[resolvedTone]} stroke="none" />
      )}
      <path
        d={pathD}
        className={TONE_STROKE[resolvedTone]}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
