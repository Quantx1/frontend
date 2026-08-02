/**
 * Foundation Dialog — wraps the shadcn Dialog with the app's simpler API.
 *
 * Old API: Dialog({ open, onClose, title?, children, className? })
 * Preserved so all callers work unchanged.
 */
'use client'

import * as React from 'react'
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export const Dialog = ({ open, onClose, title, children, className }: Props) => (
  <ShadcnDialog
    open={open}
    onOpenChange={(o) => {
      if (!o) onClose()
    }}
  >
    <DialogContent className={className}>
      {title ? (
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
      ) : (
        <DialogHeader className="sr-only">
          <DialogTitle>Dialog</DialogTitle>
          <DialogDescription>Dialog content</DialogDescription>
        </DialogHeader>
      )}
      {children}
    </DialogContent>
  </ShadcnDialog>
)
