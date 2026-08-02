'use client'

/**
 * Foundation NumericInput — controlled numeric field for trading forms.
 *
 * Different from a plain ``<Input type="number">`` because:
 *  - Accepts a ``formatter`` ('currency-inr' | 'percent' | 'multiplier' |
 *    custom) so the visible value matches the domain (₹, %, ×)
 *  - Step controls (←/→ keys + click) with safe bounds
 *  - Stops accidental scroll-wheel value changes (the #1 trading-form bug)
 *  - Mobile-friendly inputMode="decimal" so the right keypad shows
 *  - Empty state allowed (null) for "not set" semantics
 *
 * @example  Order quantity
 *   <NumericInput
 *     label="Quantity"
 *     value={qty}
 *     onChange={setQty}
 *     min={1}
 *     step={1}
 *     formatter="integer"
 *   />
 *
 * @example  Stop loss percent
 *   <NumericInput
 *     label="Stop loss"
 *     value={slPct}
 *     onChange={setSlPct}
 *     min={0.1}
 *     max={20}
 *     step={0.1}
 *     formatter="percent"
 *     helper="As % of entry price"
 *   />
 *
 * @example  Target rupee value
 *   <NumericInput
 *     label="Target"
 *     value={target}
 *     onChange={setTarget}
 *     min={0.01}
 *     step={0.05}
 *     formatter="currency-inr"
 *   />
 */
import * as React from 'react'
import { Minus, Plus } from '@/lib/icons'
import { cn } from '@/lib/utils'

export type NumericFormatter =
  | 'integer'
  | 'decimal'
  | 'percent'
  | 'currency-inr'
  | 'multiplier'

interface Props {
  label?: string
  error?: string
  helper?: string
  /** Current value. Use ``null`` for the empty state. */
  value: number | null
  /** Value-change handler. ``null`` when the field is cleared. */
  onChange: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  /** Visual formatter — affects suffix/prefix + decimal display. */
  formatter?: NumericFormatter
  /** Hide the −/+ step buttons (keyboard ←/→ still work via the native input). */
  hideSteppers?: boolean
  size?: 'sm' | 'md'
  disabled?: boolean
  placeholder?: string
  id?: string
  name?: string
  className?: string
}

const FMT_CONFIG: Record<NumericFormatter, { prefix?: string; suffix?: string; decimals: number; inputMode: 'decimal' | 'numeric' }> = {
  integer:        { decimals: 0, inputMode: 'numeric' },
  decimal:        { decimals: 2, inputMode: 'decimal' },
  percent:        { suffix: '%', decimals: 2, inputMode: 'decimal' },
  'currency-inr': { prefix: '₹', decimals: 2, inputMode: 'decimal' },
  multiplier:     { suffix: '×', decimals: 1, inputMode: 'decimal' },
}

export const NumericInput = ({
  label,
  error,
  helper,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatter = 'decimal',
  hideSteppers,
  size = 'md',
  disabled,
  placeholder,
  id,
  name,
  className,
}: Props) => {
  const reactId = React.useId()
  const inputId = id ?? `numeric-${reactId}`
  const describedBy = error ? `${inputId}-err` : helper ? `${inputId}-help` : undefined
  const cfg = FMT_CONFIG[formatter]

  // Local string state so users can type intermediate values like "1." while
  // typing 1.5. Sync to the numeric ``value`` on blur or on every keystroke
  // that parses cleanly.
  const [raw, setRaw] = React.useState<string>(() =>
    value == null ? '' : value.toFixed(cfg.decimals).replace(/\.?0+$/, ''),
  )

  // External value changes (e.g., form reset) sync into raw display.
  React.useEffect(() => {
    if (value == null) {
      setRaw('')
    } else {
      // Only update when the parsed numeric differs — preserves caret while typing.
      const parsed = parseFloat(raw)
      if (Number.isNaN(parsed) || parsed !== value) {
        setRaw(value.toString())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const commit = (next: number | null) => {
    if (next == null) {
      onChange(null)
      return
    }
    let clamped = next
    if (min != null && clamped < min) clamped = min
    if (max != null && clamped > max) clamped = max
    onChange(clamped)
  }

  const stepBy = (delta: number) => {
    const current = value ?? 0
    const next = Math.round((current + delta) * 1e8) / 1e8
    commit(next)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setRaw(next)
    if (next === '' || next === '-') {
      onChange(null)
      return
    }
    const parsed = parseFloat(next)
    if (!Number.isNaN(parsed)) commit(parsed)
  }

  const handleBlur = () => {
    if (raw === '' || raw === '-') return
    const parsed = parseFloat(raw)
    if (Number.isNaN(parsed)) {
      setRaw(value == null ? '' : value.toString())
      return
    }
    // Snap to clamped + formatted display
    let clamped = parsed
    if (min != null && clamped < min) clamped = min
    if (max != null && clamped > max) clamped = max
    setRaw(clamped.toString())
    onChange(clamped)
  }

  const sizeClasses = size === 'sm' ? 'h-8 text-sm' : 'h-10 text-sm'

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-xs font-normal text-d-text-secondary">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex w-full items-center rounded-sm border bg-wrap-hover transition-colors',
          'focus-within:ring-1 focus-within:ring-white/40 focus-within:border-white/30',
          error ? 'border-down' : 'border-line',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        {cfg.prefix && (
          <span className="pl-3 text-sm text-d-text-muted">{cfg.prefix}</span>
        )}
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode={cfg.inputMode}
          // Numeric inputs with the wheel are a #1 trading-form gotcha.
          // Disable scroll changes; keep keyboard ←/→ for power users.
          onWheel={(e) => (e.target as HTMLElement).blur()}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={describedBy}
          disabled={disabled}
          placeholder={placeholder}
          value={raw}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            'flex-1 bg-transparent px-3 text-d-text-primary outline-none placeholder:text-d-text-muted disabled:cursor-not-allowed',
            sizeClasses,
          )}
        />
        {cfg.suffix && (
          <span className="pr-3 text-sm text-d-text-muted">{cfg.suffix}</span>
        )}
        {!hideSteppers && (
          <div className="flex h-full flex-col border-l border-line">
            <button
              type="button"
              onClick={() => stepBy(step)}
              disabled={disabled || (max != null && (value ?? 0) >= max)}
              aria-label="Increase value"
              className="flex h-1/2 w-7 items-center justify-center text-d-text-muted hover:text-d-text-primary disabled:opacity-30"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => stepBy(-step)}
              disabled={disabled || (min != null && (value ?? 0) <= min)}
              aria-label="Decrease value"
              className="flex h-1/2 w-7 items-center justify-center border-t border-line text-d-text-muted hover:text-d-text-primary disabled:opacity-30"
            >
              <Minus className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-err`} className="mt-1 text-[11px] text-down">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${inputId}-help`} className="mt-1 text-[11px] text-d-text-muted">
          {helper}
        </p>
      )}
    </div>
  )
}
