/**
 * Foundation Input — wraps the shadcn Input with the app's label/error API.
 *
 * Old API: Input({ label?, error?, className?, ...inputProps })
 * Preserved so all callers work unchanged.
 */
import * as React from 'react'
import { Input as ShadcnInput } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
          <Label htmlFor={inputId} className="text-xs font-normal">
            {label}
          </Label>
        )}
        <ShadcnInput
          ref={ref}
          id={inputId}
          className={cn(
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
