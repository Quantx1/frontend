'use client'

/**
 * Resizable — shadcn/ui, retargeted to react-resizable-panels v4.
 *
 * The shadcn registry item is still written against the v2/v3 API
 * (`PanelGroup`, `PanelResizeHandle`, `data-panel-group-direction`). This
 * project has v4.12.2 installed, which renamed the surface:
 *
 *   PanelGroup        → Group      (`direction` → `orientation`)
 *   PanelResizeHandle → Separator
 *   Panel             → Panel      (unchanged)
 *
 * Retargeted against node_modules/react-resizable-panels/dist/*.d.ts rather
 * than assumed — the registry version does not compile against v4.
 *
 * Used by the strategy workspace, where a trader rebalances the
 * conversation / logic / chart split to suit the task at hand.
 */

import * as ResizablePrimitive from 'react-resizable-panels'

import { GripVertical } from '@/lib/icons'
import { cn } from '@/lib/utils'

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group>) => (
  <ResizablePrimitive.Group
    className={cn('flex h-full w-full data-[orientation=vertical]:flex-col', className)}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  /** Renders a visible grip. Use on the primary split a user is meant to drag. */
  withHandle?: boolean
}) => (
  <ResizablePrimitive.Separator
    className={cn(
      // A 1px hairline that widens its HIT AREA (the ::after) to 9px without
      // widening its visual weight — the divider stays quiet, the target stays
      // reachable. Colour only shifts on hover/drag.
      'relative flex w-px items-center justify-center bg-line outline-none',
      'transition-colors duration-instant ease-out',
      'after:absolute after:inset-y-0 after:left-1/2 after:w-[9px] after:-translate-x-1/2',
      'hover:bg-wrap-line focus-visible:ring-2 focus-visible:ring-ring/60',
      'data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full',
      'data-[orientation=vertical]:after:inset-x-0 data-[orientation=vertical]:after:left-0',
      'data-[orientation=vertical]:after:h-[9px] data-[orientation=vertical]:after:w-full',
      'data-[orientation=vertical]:after:-translate-y-1/2 data-[orientation=vertical]:after:translate-x-0',
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-5 w-3 items-center justify-center rounded-xs border border-line bg-surface-2">
        <GripVertical className="h-3 w-3 text-d-text-muted" />
      </div>
    )}
  </ResizablePrimitive.Separator>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
