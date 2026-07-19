'use client'

/**
 * Foundation Tooltip — Radix-backed hint overlay.
 *
 * Use for short, non-interactive hints. For interactive content (action
 * menus, mini-detail previews) use ``Popover`` instead.
 *
 * Accessibility:
 *  - Hover, focus, and touch all trigger
 *  - Auto-dismisses on Escape and outside click
 *  - Respects ``prefers-reduced-motion``
 *  - ``aria-describedby`` linked automatically
 *
 * @example  Wrap any trigger
 *   <Tooltip content="Confidence is the weighted ensemble score">
 *     <button>?</button>
 *   </Tooltip>
 *
 * @example  Long-form with keyboard shortcut hint
 *   <Tooltip
 *     content={
 *       <div className="flex items-center gap-2">
 *         <span>Open command palette</span>
 *         <kbd className="rounded border border-line px-1 text-[10px]">⌘K</kbd>
 *       </div>
 *     }
 *   >
 *     <button>Search</button>
 *   </Tooltip>
 */
import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

// Omit Radix's native `content` prop (string-only HTML title) — we replace it
// with a richer ReactNode-typed version below.
interface Props
  extends Omit<React.ComponentProps<typeof TooltipPrimitive.Content>, 'content'> {
  /** Tooltip body. Strings auto-wrap with sensible width; pass JSX for rich content. */
  content: React.ReactNode
  /** The element being annotated. Single child only (Radix Slot pattern). */
  children: React.ReactNode
  /** Delay before showing on hover. Default 200ms — fast enough for power users. */
  delayMs?: number
  /** Disable the tooltip without removing it from the tree. */
  disabled?: boolean
}

export const Tooltip = ({
  content,
  children,
  delayMs = 200,
  disabled = false,
  side = 'top',
  sideOffset = 6,
  className,
  ...rest
}: Props) => {
  if (disabled) return <>{children}</>
  return (
    <TooltipPrimitive.Provider delayDuration={delayMs} disableHoverableContent>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={sideOffset}
            className={cn(
              'z-50 max-w-xs rounded-sm border border-line bg-wrap-hover px-2.5 py-1.5',
              'text-xs text-d-text-primary',
              // xAI quiet motion — origin-aware scale from the trigger, 125ms.
              'origin-[--radix-tooltip-content-transform-origin]',
              'data-[state=delayed-open]:animate-tip-in data-[state=instant-open]:animate-tip-in',
              'data-[state=closed]:animate-tip-out',
              className,
            )}
            {...rest}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
