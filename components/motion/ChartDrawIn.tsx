'use client'

/* ============================================================================
   ChartDrawIn (§38/§48) — a lightweight sparkline/area that DRAWS its line in
   (SVG pathLength 0→1) and fades its gradient fill up, the "data materialising"
   moment from the brief. Pure SVG + framer-motion, no chart lib. Token-driven:
   pass tone `up | down | ai` and the stroke + fill derive from theme vars.

   Under reduced motion the path renders fully drawn with no animation (the
   global MotionConfig also neutralises the tween).
   ============================================================================ */

import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Tone = 'up' | 'down' | 'ai'

const TONE_VAR: Record<Tone, string> = {
  up: 'var(--color-up)',
  down: 'var(--color-down)',
  ai: 'var(--color-ai)',
}

interface ChartDrawInProps {
  data: number[]
  tone?: Tone
  /** draw duration (s) */
  duration?: number
  delay?: number
  className?: string
  /** viewBox height; width is fixed at 100 and scales responsively */
  height?: number
  strokeWidth?: number
  area?: boolean
  'aria-label'?: string
}

function buildPath(data: number[], w: number, h: number, pad = 2) {
  if (data.length < 2) return { line: '', area: '' }
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const stepX = (w - pad * 2) / (data.length - 1)
  const pts = data.map((v, i) => {
    const x = pad + i * stepX
    const y = pad + (h - pad * 2) * (1 - (v - min) / span)
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(2)},${h} L${pts[0][0].toFixed(2)},${h} Z`
  return { line, area }
}

export function ChartDrawIn({
  data,
  tone = 'ai',
  duration = 1.1,
  delay = 0,
  className,
  height = 40,
  strokeWidth = 2,
  area = true,
  'aria-label': ariaLabel,
}: ChartDrawInProps) {
  const reduce = useReducedMotion()
  const gradId = useId()
  const W = 100
  const { line, area: areaPath } = buildPath(data, W, height)
  const color = TONE_VAR[tone]

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      className={cn('h-full w-full overflow-visible', className)}
      role="img"
      aria-label={ariaLabel ?? 'trend chart'}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && areaPath && (
        <motion.path
          d={areaPath}
          fill={`url(#${gradId})`}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: duration * 0.8, delay: delay + duration * 0.35, ease: 'easeOut' }}
        />
      )}
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={reduce ? false : { pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration, delay, ease: [0.4, 0, 0.2, 1] }}
      />
    </svg>
  )
}
