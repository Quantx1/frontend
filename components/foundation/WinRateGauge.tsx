'use client'

/**
 * Foundation WinRateGauge — a compact semicircle win-rate ring.
 *
 * Reuses RegimeGauge's polar / arc geometry (the same 180° score→angle
 * mapping) at a ~28-40px footprint — a genuine small component, NOT a size
 * prop on the 224px RegimeGauge. Tone (green / neutral / red) comes from
 * `lib/winrate.ts` so every WR surface agrees on the thresholds.
 *
 * Honest-empty: a `null` / missing win rate renders a muted dash, never a
 * misleading 0%.
 *
 * Motion: the value arc sweeps 0 → win_rate on mount / in-view; reduced
 * motion (or SSR) shows the final arc immediately.
 *
 * @example
 *   <WinRateGauge winRate={0.62} />
 *   <WinRateGauge winRate={null} />   // honest dash
 */

import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { MONO } from '@/lib/tokens'
import {
  winRateTone,
  winRateToneVar,
  winRateToneClass,
  formatWinRate,
} from '@/lib/winrate'

// Polar → cartesian on a 180° arc (score 0 = left, 100 = right) — the exact
// geometry RegimeGauge uses, kept local + pure for this small component.
function pt(cx: number, cy: number, r: number, score: number) {
  const angle = Math.PI * (1 - score / 100)
  return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) }
}

function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const a = pt(cx, cy, r, from)
  const b = pt(cx, cy, r, to)
  // On a 180°-mapped arc every span ≤100 is ≤180° → large-arc-flag is 0.
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
}

interface Props {
  /** Win rate as a fraction in 0..1. `null` / `undefined` → honest dash. */
  winRate: number | null | undefined
  /** Outer width in px (default 40; keep within ~28-40 for the compact read). */
  size?: number
  /** Show the "NN%" label under the arc (default true). */
  showLabel?: boolean
  className?: string
}

export function WinRateGauge({ winRate, size = 40, showLabel = true, className }: Props) {
  const reduce = useReducedMotion()
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px' })

  const tone = winRateTone(winRate)
  const target = tone == null ? 0 : Math.max(0, Math.min(100, (winRate as number) * 100))

  // Default = final value (SSR / reduced-motion safe); the effect only rewinds
  // to 0 and sweeps up on the client when motion is allowed.
  const [score, setScore] = useState(target)

  useEffect(() => {
    if (reduce || !inView || tone == null) {
      setScore(target)
      return
    }
    const controls = animate(0, target, {
      duration: 0.7,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: setScore,
    })
    return () => controls.stop()
  }, [target, reduce, inView, tone])

  const stroke = Math.max(3, Math.round(size * 0.12))
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = r + stroke / 2
  const H = r + stroke

  // Honest-empty: a muted dash, never a 0% ring.
  if (tone == null) {
    return (
      <div className={cn('flex flex-col items-center', className)}>
        <svg width={size} height={H} viewBox={`0 0 ${size} ${H}`} role="img" aria-label="Win rate: no data">
          <path
            d={arcPath(cx, cy, r, 0, 100)}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </svg>
        {showLabel && <span className={cn('mt-0.5 text-[10px] text-d-text-muted', MONO)}>—</span>}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg
        ref={ref}
        width={size}
        height={H}
        viewBox={`0 0 ${size} ${H}`}
        role="img"
        aria-label={`Win rate: ${formatWinRate(winRate)}`}
      >
        {/* neutral track */}
        <path
          d={arcPath(cx, cy, r, 0, 100)}
          fill="none"
          stroke="var(--color-wrap-hover)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* value arc */}
        {score > 0 && (
          <path
            d={arcPath(cx, cy, r, 0, score)}
            fill="none"
            stroke={winRateToneVar(tone)}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        )}
      </svg>
      {showLabel && (
        <span className={cn('mt-0.5 text-[10px] font-semibold', MONO, winRateToneClass(tone))}>
          {formatWinRate(winRate)}
        </span>
      )}
    </div>
  )
}
