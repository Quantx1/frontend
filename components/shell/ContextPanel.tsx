'use client'

/**
 * ContextPanel — what [Details] opens.
 *
 * Spec: docs/REDESIGN.md §4.6. A right-hand slide-over with tabbed faces,
 * holding the deep data that used to be stacked down the page.
 *
 * ── The question this answers ──────────────────────────────────────────────
 * "What can Details do?" — the card's Details button had no destination, so
 * every dense surface stayed on the page beneath the answer and the page read
 * as two designs bolted together. The panel is the destination: the page
 * answers the question, the panel holds the evidence, and the user decides
 * which of those they want.
 *
 * ── Why a panel and not a route ────────────────────────────────────────────
 * A route loses the answer. You read "breadth is 41–12, a broad move", tap
 * through to the internals, and the sentence that sent you there is gone —
 * so you cannot check the detail against the claim. The panel overlays, so
 * both are on screen and closing it returns you exactly where you were.
 *
 * ── Behaviour ──────────────────────────────────────────────────────────────
 * ESC closes. Focus moves to the panel on open and returns to the trigger on
 * close. Body scroll locks while open. Below `md` it is full-width, because a
 * 420px overlay on a 390px screen is a modal pretending to be a panel.
 */

import { useEffect, useId, useRef } from 'react'

import { X } from '@/lib/icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/foundation'
import { cn } from '@/lib/utils'

export interface PanelFace {
  /** Stable key. Also the deep-link value if a caller wires one. */
  value: string
  label: string
  content: React.ReactNode
}

export interface ContextPanelProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  faces: PanelFace[]
  /** Which face to show. Uncontrolled from the first face when omitted. */
  value?: string
  onValueChange?: (v: string) => void
}

export function ContextPanel({
  open,
  onClose,
  title,
  subtitle,
  faces,
  value,
  onValueChange,
}: ContextPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const returnFocusTo = useRef<Element | null>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    returnFocusTo.current = document.activeElement
    panelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    // Lock the page behind the overlay. Without this, scrolling inside the
    // panel scrolls the page underneath once the panel hits its end.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      // Returning focus is what makes the panel usable from the keyboard —
      // otherwise closing it drops focus to the top of the document.
      ;(returnFocusTo.current as HTMLElement | null)?.focus?.()
    }
  }, [open, onClose])

  if (!open || faces.length === 0) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 animate-overlay-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-main outline-none',
          'border-l border-line md:w-[420px]',
          'animate-sheet-in-right',
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p id={titleId} className="truncate text-heading text-d-text-primary">
              {title}
            </p>
            {subtitle && <p className="truncate text-meta text-d-text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="grid size-7 shrink-0 place-items-center rounded-xs text-d-text-muted transition-colors hover:bg-wrap-hover hover:text-d-text-primary"
          >
            <X size={14} />
          </button>
        </div>

        <Tabs
          value={value ?? faces[0].value}
          onValueChange={onValueChange}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="overflow-x-auto border-b border-line px-2">
            <TabsList className="border-b-0">
              {faces.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {faces.map((f) => (
            <TabsContent
              key={f.value}
              value={f.value}
              className="min-h-0 flex-1 overflow-y-auto p-4"
            >
              {f.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  )
}
