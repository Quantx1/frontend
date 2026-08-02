'use client'

/**
 * Foundation Popover — Radix-backed anchored overlay for INTERACTIVE
 * content. Use ``Tooltip`` for non-interactive hints; this one is for
 * forms, mini-detail previews, filter pickers, anything users click.
 *
 * Accessibility:
 *  - Click-outside + Escape auto-close
 *  - Focus trapped inside while open
 *  - aria-haspopup + aria-expanded wired automatically
 *  - Returns focus to the trigger on close
 *
 * @example  Filter popover
 *   <Popover
 *     trigger={<Button variant="ghost"><Filter className="h-4 w-4" /></Button>}
 *   >
 *     <div className="space-y-3 p-3 w-64">
 *       <h4 className="text-sm font-semibold">Filter signals</h4>
 *       <Input label="Min confidence" type="number" />
 *       <Button>Apply</Button>
 *     </div>
 *   </Popover>
 */
import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

interface Props {
  /** The element that opens the popover. Single child only. */
  trigger: React.ReactNode
  /** Popover body — any JSX. */
  children: React.ReactNode
  /** Side of the trigger to render on. Default ``bottom``. */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Alignment along the chosen side. Default ``start``. */
  align?: 'start' | 'center' | 'end'
  /** Offset from trigger in px. Default 6. */
  sideOffset?: number
  /** Controlled open state — omit for uncontrolled. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Extra className for the content panel. */
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
  <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 rounded-sm border border-line bg-wrap text-d-text-primary',
          // Origin-aware scale from the trigger (Radix transform-origin var).
          'origin-[--radix-popover-content-transform-origin]',
          'data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out',
          'focus-visible:outline-none',
          className,
        )}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  </PopoverPrimitive.Root>
)
