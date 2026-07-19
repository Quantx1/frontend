'use client'

/**
 * Foundation Select — Radix-backed accessible dropdown picker.
 *
 * For native-feeling form selects with full keyboard control.
 * For free-text + typeahead use a Combobox (future); for action lists
 * use ``DropdownMenu``.
 *
 * Accessibility:
 *  - ↑↓ + Enter + type-ahead navigation
 *  - aria-* wired via Radix
 *  - Focus returns to trigger on close
 *  - Touch-friendly tap target (≥44px on mobile)
 *  - Optional ``label`` + ``error`` slots match Foundation Input
 *
 * @example  Single picker
 *   <Select
 *     label="Timeframe"
 *     value={tf}
 *     onValueChange={setTf}
 *     options={[
 *       { value: '5m',  label: '5 min' },
 *       { value: '15m', label: '15 min' },
 *       { value: '1d',  label: 'Daily' },
 *     ]}
 *   />
 *
 * @example  With error state
 *   <Select
 *     label="Strategy segment"
 *     placeholder="Pick one…"
 *     value={segment}
 *     onValueChange={setSegment}
 *     options={SEGMENTS}
 *     error={errors.segment?.message}
 *   />
 */
import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from '@/lib/icons'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  /** Optional description below the label inside the dropdown. */
  description?: string
  disabled?: boolean
}

interface Props {
  /** Optional label rendered above the trigger. */
  label?: string
  /** Optional error message rendered below — colored ``down``. */
  error?: string
  /** Optional helper text rendered below (mutually exclusive with error). */
  helper?: string
  /** Placeholder shown when no value selected. */
  placeholder?: string
  /** Current value. */
  value?: string
  /** Default value (uncontrolled mode). */
  defaultValue?: string
  /** Value-change handler. */
  onValueChange?: (value: string) => void
  /** The options to render. */
  options: SelectOption[]
  /** Disable the entire control. */
  disabled?: boolean
  /** Render with a smaller height for dense forms. */
  size?: 'sm' | 'md'
  /** Optional id for label-htmlFor pairing. */
  id?: string
  /** Optional name for native form association. */
  name?: string
  /** Extra className for the trigger. */
  className?: string
}

export const Select = ({
  label,
  error,
  helper,
  placeholder = 'Select…',
  value,
  defaultValue,
  onValueChange,
  options,
  disabled,
  size = 'md',
  id,
  name,
  className,
}: Props) => {
  const reactId = React.useId()
  const triggerId = id ?? `select-${reactId}`
  const describedBy = error ? `${triggerId}-err` : helper ? `${triggerId}-help` : undefined

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={triggerId}
          className="mb-1 block text-xs font-normal text-d-text-secondary"
        >
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
      >
        <SelectPrimitive.Trigger
          id={triggerId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-sm border bg-wrap-hover px-3 text-sm',
            'text-d-text-primary transition-colors',
            'placeholder:text-d-text-muted',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:border-white/30',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[placeholder]:text-d-text-muted',
            size === 'sm' ? 'h-8' : 'h-10',
            error ? 'border-down' : 'border-line',
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 opacity-60" aria-hidden="true" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className={cn(
              'z-50 max-h-[--radix-select-content-available-height] min-w-[var(--radix-select-trigger-width)]',
              'overflow-hidden rounded-sm border border-line bg-wrap text-d-text-primary',
              // Origin-aware pop from the trigger (Radix transform-origin var).
              'origin-[--radix-select-content-transform-origin]',
              'data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out',
            )}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none',
                    'text-d-text-secondary',
                    'data-[highlighted]:bg-wrap-hover data-[highlighted]:text-d-text-primary',
                    'data-[state=checked]:text-d-text-primary',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  )}
                >
                  <SelectPrimitive.ItemIndicator className="absolute left-0 inline-flex w-6 items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                  <div className="pl-5">
                    <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                    {opt.description && (
                      <p className="text-[11px] text-d-text-muted">{opt.description}</p>
                    )}
                  </div>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && (
        <p id={`${triggerId}-err`} className="mt-1 text-[11px] text-down">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${triggerId}-help`} className="mt-1 text-[11px] text-d-text-muted">
          {helper}
        </p>
      )}
    </div>
  )
}
