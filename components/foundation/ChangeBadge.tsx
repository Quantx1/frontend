/**
 * Foundation ChangeBadge — semantic +/− indicator for trading data.
 *
 * Used in every row / card / cell that shows a price change. Auto-
 * derives the up/down color, the arrow, and the sign. Never has a
 * background by default to fit dense tables; pass ``filled`` for a
 * pill style.
 *
 * @example  Inline percent change
 *   <ChangeBadge value={pct} kind="percent" />
 *
 * @example  Absolute rupee change in a price cell
 *   <ChangeBadge value={delta} kind="currency-inr" filled />
 *
 * @example  Compact format for sparkline labels
 *   <ChangeBadge value={pct} kind="percent" size="xs" hideArrow />
 */
import * as React from 'react'
import { ArrowDown, ArrowUp } from '@/lib/icons'
import { cn } from '@/lib/utils'

export type ChangeKind = 'percent' | 'currency-inr' | 'plain'

interface Props {
  value: number
  kind?: ChangeKind
  /** Pill background (filled) vs inline text (default). */
  filled?: boolean
  size?: 'xs' | 'sm' | 'md'
  hideArrow?: boolean
  /** Force a tone instead of deriving from value sign. */
  toneOverride?: 'up' | 'down' | 'neutral'
  className?: string
}

const format = (value: number, kind: ChangeKind): string => {
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (kind === 'percent') {
    return `${sign}${abs.toFixed(2)}%`
  }
  if (kind === 'currency-inr') {
    // Indian numbering (lakh/crore separators)
    return `${sign}₹${abs.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
  }
  return `${sign}${abs.toLocaleString('en-IN')}`
}

const SIZE_CLASSES = {
  xs: 'text-[10px] gap-0.5 px-1 py-0',
  sm: 'text-[11px] gap-1 px-1.5 py-0.5',
  md: 'text-xs gap-1 px-2 py-0.5',
} as const

const ARROW_SIZE = { xs: 'h-2.5 w-2.5', sm: 'h-3 w-3', md: 'h-3.5 w-3.5' } as const

export const ChangeBadge = ({
  value,
  kind = 'percent',
  filled,
  size = 'sm',
  hideArrow,
  toneOverride,
  className,
}: Props) => {
  const tone = toneOverride ?? (value > 0 ? 'up' : value < 0 ? 'down' : 'neutral')

  const toneText =
    tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-d-text-muted'
  const toneFill =
    tone === 'up' ? 'bg-up/10' : tone === 'down' ? 'bg-down/10' : 'bg-wrap-hover'

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-normal tabular-nums',
        SIZE_CLASSES[size],
        toneText,
        filled && cn('rounded-sm', toneFill),
        className,
      )}
      // Make screen-readers say the value as a number, not "plus-sign 1 dot 2 percent"
      aria-label={`${tone === 'up' ? 'up' : tone === 'down' ? 'down' : ''} ${format(value, kind)}`}
    >
      {!hideArrow && tone !== 'neutral' && (
        tone === 'up' ? (
          <ArrowUp className={ARROW_SIZE[size]} aria-hidden="true" />
        ) : (
          <ArrowDown className={ARROW_SIZE[size]} aria-hidden="true" />
        )
      )}
      <span>{format(value, kind)}</span>
    </span>
  )
}
