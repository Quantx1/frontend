'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog } from './Dialog'
import { Button } from './Button'

interface Props {
  open: boolean
  onClose: () => void
  /** Runs on explicit confirm. The dialog closes itself afterwards. */
  onConfirm: () => void | Promise<void>
  title: string
  body: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Danger styling for the confirm button (kill switch, go-live, deletes). */
  destructive?: boolean
}

/**
 * Deliberate confirmation modal — replaces native `window.confirm()`.
 *
 * Why not `confirm()`: the native dialog accepts on a stray Enter keypress
 * and can't be styled or focus-managed. For destructive actions ("close ALL
 * open positions", "go live with real money") that's an incident waiting to
 * happen. Here CANCEL takes initial focus, so Enter always backs out;
 * confirming requires a deliberate click (or explicit Tab + Enter).
 */
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}: Props) => {
  const [busy, setBusy] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      setBusy(false)
      // Radix focuses the content; move it to Cancel so Enter is safe.
      const t = setTimeout(() => cancelRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  const confirm = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} className="glass-surface">
      <div className="text-sm leading-relaxed text-d-text-secondary">{body}</div>
      <div className="mt-5 flex justify-end gap-2">
        <Button ref={cancelRef} variant="ghost" size="sm" onClick={onClose} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          size="sm"
          onClick={confirm}
          disabled={busy}
        >
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
