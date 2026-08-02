'use client'

/**
 * Foundation Popover — wraps the shadcn Popover with the app's trigger-prop API.
 *
 * Old API: Popover({ trigger, children, side?, align?, sideOffset?, open?, onOpenChange?, className? })
 * Preserved so all callers work unchanged.
 */
import * as React from 'react'
import {
  Popover as ShadcnPopover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Props {
  trigger: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export const Popover = ({
  trigger,
  children,
  side = 'bottom',
  align = 'start',
  sideOffset = 6,
  open,
  onOpenChange,
  className,
}: Props) => (
  <ShadcnPopover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger asChild>{trigger}</PopoverTrigger>
    <PopoverContent
      side={side}
      align={align}
      sideOffset={sideOffset}
      className={cn('p-0', className)}
    >
      {children}
    </PopoverContent>
  </ShadcnPopover>
)
