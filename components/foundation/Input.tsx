import * as React from 'react'
import { cn } from '@/lib/utils'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ error, label, className, id, ...rest }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? `input-${generatedId}`
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-normal text-d-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-9 w-full rounded-sm border bg-wrap-hover px-3 text-sm text-d-text-primary',
            'placeholder:text-d-text-muted',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:border-white/30',
            'disabled:opacity-50',
            error ? 'border-down' : 'border-line',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-down">
            {error}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
