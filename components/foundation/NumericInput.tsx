'use client'

/**
 * Foundation NumericInput — controlled numeric field for trading forms.
 * Rebuilt on shadcn semantic tokens for consistent theming.
 */
import * as React from 'react'
import { Minus, Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'
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
  value: number | null
  onChange: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  formatter?: NumericFormatter
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

  const [raw, setRaw] = React.useState<string>(() =>
    value == null ? '' : value.toFixed(cfg.decimals).replace(/\.?0+$/, ''),
  )

  React.useEffect(() => {
    if (value == null) {
      setRaw('')
    } else {
      const parsed = parseFloat(raw)
      if (Number.isNaN(parsed) || parsed !== value) {
        setRaw(value.toString())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const commit = (next: number | null) => {
    if (next == null) { onChange(null); return }
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
    if (next === '' || next === '-') { onChange(null); return }
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
        <Label htmlFor={inputId} className="mb-1 block text-xs font-normal">
          {label}
        </Label>
      )}
      <div
        className={cn(
          'flex w-full items-center rounded-md border bg-background transition-colors',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          error ? 'border-destructive' : 'border-input',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        {cfg.prefix && (
          <span className="pl-3 text-sm text-muted-foreground">{cfg.prefix}</span>
        )}
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode={cfg.inputMode}
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
            'flex-1 bg-transparent px-3 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
            sizeClasses,
          )}
        />
        {cfg.suffix && (
          <span className="pr-3 text-sm text-muted-foreground">{cfg.suffix}</span>
        )}
        {!hideSteppers && (
          <div className="flex h-full flex-col border-l border-input">
            <button
              type="button"
              onClick={() => stepBy(step)}
              disabled={disabled || (max != null && (value ?? 0) >= max)}
              aria-label="Increase value"
              className="flex h-1/2 w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <Plus className="size-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => stepBy(-step)}
              disabled={disabled || (min != null && (value ?? 0) <= min)}
              aria-label="Decrease value"
              className="flex h-1/2 w-7 items-center justify-center border-t border-input text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <Minus className="size-3" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-err`} className="mt-1 text-[11px] text-destructive">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${inputId}-help`} className="mt-1 text-[11px] text-muted-foreground">
          {helper}
        </p>
      )}
    </div>
  )
}
