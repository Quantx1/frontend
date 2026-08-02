/**
 * Foundation Sheet — wraps the shadcn Sheet with the app's side-panel API.
 *
 * Old API: Sheet({ open, onClose, side?, title?, description?, hideCloseButton?, children, className? })
 * Preserved so all callers work unchanged.
 */
'use client'

import * as React from 'react'
import {
  Sheet as ShadcnSheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

type Side = 'top' | 'bottom' | 'left' | 'right'

interface Props {
  open: boolean
  onClose: () => void
  side?: Side
  title?: string
  description?: string
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
  children,
  className,
}: Props) => (
  <ShadcnSheet open={open} onOpenChange={(o) => !o && onClose()}>
    <SheetContent side={side} className={className}>
      {(title || description) && (
        <SheetHeader>
          {title && <SheetTitle>{title}</SheetTitle>}
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : (
            <SheetDescription className="sr-only">
              {title ?? 'Side sheet'}
            </SheetDescription>
          )}
        </SheetHeader>
      )}
      {!title && !description && (
        <SheetHeader className="sr-only">
          <SheetTitle>Side sheet</SheetTitle>
          <SheetDescription>Side panel content</SheetDescription>
        </SheetHeader>
      )}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </SheetContent>
  </ShadcnSheet>
)
