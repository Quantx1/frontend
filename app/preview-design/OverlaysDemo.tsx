'use client'

import * as React from 'react'
import {
  Button,
  Dialog,
  Sheet,
  Popover,
  Tooltip,
  toast,
} from '@/components/foundation'

/** Dev-only interactive triggers for the overlay primitives. */
export function OverlaysDemo() {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        data-testid="open-dialog"
        variant="secondary"
        size="sm"
        onClick={() => setDialogOpen(true)}
      >
        Open dialog
      </Button>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Confirm action">
        <p className="text-sm text-d-text-secondary">
          Dialog body in the xAI surface. Stays centered, scales in.
        </p>
      </Dialog>

      <Button
        data-testid="open-sheet"
        variant="secondary"
        size="sm"
        onClick={() => setSheetOpen(true)}
      >
        Open sheet
      </Button>
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} side="right" title="Side sheet">
        <p className="text-sm text-d-text-secondary">Slides in from the right edge.</p>
      </Sheet>

      <Popover
        trigger={
          <Button data-testid="open-popover" variant="secondary" size="sm">
            Open popover
          </Button>
        }
      >
        <div className="w-56 space-y-2 p-3">
          <p className="text-sm text-d-text-primary">Popover content</p>
          <p className="text-xs text-d-text-muted">Scales from the trigger origin.</p>
        </div>
      </Popover>

      <Tooltip content="Non-interactive hint">
        <Button data-testid="open-tooltip" variant="ghost" size="sm">
          Hover for tooltip
        </Button>
      </Tooltip>

      <Button variant="ghost" size="sm" onClick={() => toast.success('Saved')}>
        Fire toast
      </Button>
    </div>
  )
}
