'use client'

/**
 * Foundation Segmented — a generic value-filter segmented control.
 *
 * Fills the gap between `Tabs` (page/section nav — Radix pill rail) and
 * hand-rolled chip rows. The active segment is a solid `--primary` pill
 * (white ink) that SLIDES between options via framer-motion `layoutId`;
 * reduced motion swaps instantly. Do NOT use this for signals horizon tabs
 * (those stay Radix `Tabs`).
 *
 * @example
 *   <Segmented
 *     value={dir}
 *     onChange={setDir}
 *     options={[
 *       { value: 'all', label: 'All', count: 42 },
 *       { value: 'bullish', label: 'Bullish', tone: 'up' },
 *       { value: 'bearish', label: 'Bearish', tone: 'down' },
 *     ]}
 *   />
 */

import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** Optional trailing count badge. */
  count?: number
  /** Tint for the inactive label (active is always ink-on-pill). */
  tone?: 'up' | 'down' | 'neutral'
}

interface Props<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: Props<T>) {
  const reduce = useReducedMotion()
  const uid = useId()

  const pad = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5'
  const text = size === 'sm' ? 'text-[11px]' : 'text-xs'

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-line bg-wrap p-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        const inactiveTone =
          opt.tone === 'up'
            ? 'text-up'
            : opt.tone === 'down'
              ? 'text-down'
              : 'text-d-text-secondary hover:text-d-text-primary'
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative rounded-full font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'active:scale-[0.98]',
              pad,
              text,
              // The active pill is the solid `--primary` fill → white ink.
              active ? 'text-primary-foreground' : inactiveTone,
            )}
          >
            {active && (
              <motion.span
                aria-hidden="true"
                layoutId={reduce ? undefined : `segmented-pill-${uid}`}
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            )}
            <span className="relative z-[1] inline-flex items-center gap-1.5 whitespace-nowrap">
              {opt.label}
              {opt.count != null && (
                <span className={cn('tabular-nums', active ? 'opacity-70' : 'opacity-60')}>
                  {opt.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
