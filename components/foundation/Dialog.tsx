'use client'

import * as React from 'react'
import * as RD from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export const Dialog = ({ open, onClose, title, children, className }: Props) => (
  <RD.Root
    open={open}
    onOpenChange={(o) => {
      if (!o) onClose()
    }}
  >
    <RD.Portal>
      <RD.Overlay
        className={cn(
          'fixed inset-0 z-40 bg-black/60',
          'data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out',
        )}
      />
      <RD.Content
        className={cn(
          // Centered modal — stays centered, scales from 0.97 (origin center).
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-md rounded-sm border border-line bg-wrap p-5 shadow-soft',
          'focus:outline-none',
          'data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out',
          className,
        )}
      >
        {title && (
          <RD.Title className="mb-2 text-base font-normal text-d-text-primary">
            {title}
          </RD.Title>
        )}
        {/* Radix requires a Description for a11y; fall back to a visually-hidden one. */}
        <RD.Description className="sr-only">
          {title ?? 'Dialog content'}
        </RD.Description>
        {children}
      </RD.Content>
    </RD.Portal>
  </RD.Root>
)
