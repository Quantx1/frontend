/**
 * Foundation Select — wraps the shadcn Select with the app's options-array API.
 *
 * Old API: Select({ label?, error?, helper?, placeholder?, value?, defaultValue?,
 *                   onValueChange?, options, disabled?, size?, id?, name?, className? })
 * Preserved so all callers work unchanged.
 */
'use client'

import * as React from 'react'
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface Props {
  label?: string
  error?: string
  helper?: string
  placeholder?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  options: SelectOption[]
  disabled?: boolean
  size?: 'sm' | 'md'
  id?: string
  name?: string
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
  const describedBy = error
    ? `${triggerId}-err`
    : helper
      ? `${triggerId}-help`
      : undefined

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={triggerId} className="mb-1 block text-xs font-normal">
          {label}
        </Label>
      )}
      <ShadcnSelect
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
      >
        <SelectTrigger
          id={triggerId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            size === 'sm' ? 'h-8 text-xs' : 'h-10',
            error && 'border-destructive',
            className,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
            >
              <span>{opt.label}</span>
              {opt.description && (
                <span className="block text-[11px] text-muted-foreground">
                  {opt.description}
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>
      {error && (
        <p id={`${triggerId}-err`} className="mt-1 text-[11px] text-destructive">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${triggerId}-help`} className="mt-1 text-[11px] text-muted-foreground">
          {helper}
        </p>
      )}
    </div>
  )
}
