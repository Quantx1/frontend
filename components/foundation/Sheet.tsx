'use client'

/**
 * Foundation Sheet — Radix Dialog with side-slide animation.
 *
 * Sister of ``Dialog`` (centered modal). Use Sheet for mobile filters,
 * detail panes, and any overlay that should slide in from an edge
 * rather than appear at center. On wide screens Sheet still slides
 * from the edge — that's intentional; it's the right shape for the
 * "secondary surface" pattern.
 *
 * Accessibility:
 *  - Focus trapped inside while open, returns on close
 *  - Esc + click-outside dismiss
 *  - role="dialog" + aria-modal="true" + auto-labelled by title
 *  - Body scroll locked when open
 *
 * Responsive:
 *  - side="right" / "left" with width responsive to viewport
 *  - side="bottom" full-width, max-height 85vh — natural mobile pattern
 *
 * @example  Mobile filter drawer
 *   <Sheet
 *     open={filtersOpen}
 *     onClose={() => setFiltersOpen(false)}
 *     side="right"
 *     title="Filter signals"
 *   >
 *     <div className="space-y-4">
 *       <Select label="Direction" options={DIRECTION_OPTS} … />
 *       <NumericInput label="Min confidence" value={minConf} … />
 *     </div>
 *   </Sheet>
 *
 * @example  Mobile-only bottom sheet for actions
 *   <Sheet open={actionsOpen} onClose={close} side="bottom" title="Actions">
 *     <div className="space-y-1">
 *       <Button className="w-full">Deploy</Button>
 *       <Button variant="ghost" className="w-full">Backtest</Button>
 *     </div>
 *   </Sheet>
 */
import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from '@/lib/icons'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const sheetVariants = cva(
  // xAI: hairline edge surface, no heavy shadow. Slides from its edge with
  // a dep-free keyframe (iOS-like drawer curve), ≤250ms enter / 200ms exit.
  'fixed z-50 flex flex-col gap-3 border-line bg-wrap p-6 outline-none',
  {
    variants: {
      side: {
        top:    'inset-x-0 top-0 border-b data-[state=open]:animate-sheet-in-top data-[state=closed]:animate-sheet-out-top',
        bottom: 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-sm border-t data-[state=open]:animate-sheet-in-bottom data-[state=closed]:animate-sheet-out-bottom',
        left:   'inset-y-0 left-0 h-full w-full max-w-sm border-r data-[state=open]:animate-sheet-in-left data-[state=closed]:animate-sheet-out-left',
        right:  'inset-y-0 right-0 h-full w-full max-w-sm border-l data-[state=open]:animate-sheet-in-right data-[state=closed]:animate-sheet-out-right',
      },
    },
    defaultVariants: { side: 'right' },
  },
)

interface Props extends VariantProps<typeof sheetVariants> {
  open: boolean
  onClose: () => void
  /** Header title — rendered + used as aria-label for the dialog. */
  title?: string
  /** Optional description displayed under the title. */
  description?: string
  /** Hide the close (X) button. Only do this if you have another close path. */
  hideCloseButton?: boolean
  children: React.ReactNode
  className?: string
}

export const Sheet = ({
  open,
  onClose,
  side = 'right',
  title,
  description,
  hideCloseButton,
  children,
  className,
}: Props) => (
  <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-40 bg-black/60',
          'data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out',
        )}
      />
      <DialogPrimitive.Content className={cn(sheetVariants({ side }), className)}>
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {title && (
                <DialogPrimitive.Title className="text-base font-normal text-d-text-primary">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="mt-1 text-sm text-d-text-secondary">
                  {description}
                </DialogPrimitive.Description>
              )}
              {/* Provide an sr-only description when caller didn't pass one,
                  so screen readers don't warn about missing dialog description. */}
              {!description && (
                <DialogPrimitive.Description className="sr-only">
                  {title ?? 'Side sheet'}
                </DialogPrimitive.Description>
              )}
            </div>
            {!hideCloseButton && (
              <DialogPrimitive.Close
                aria-label="Close"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-d-text-secondary transition-colors hover:bg-wrap-hover hover:text-d-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </DialogPrimitive.Close>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
)
