'use client'

/**
 * FaqAccordion — the honest Q&A accordion at the bottom of every
 * engine-as-landing page (competitor archetype B "Frequently Asked
 * Questions"). Re-skinned to v2: hairline `bg-wrap` rows, Bricolage
 * question, Geist-mono "+ / −" affordance, smooth height transition.
 * Accessible: real <button> toggles, aria-expanded, keyboard-operable.
 */

import { useState } from 'react'
import { Plus } from '@/lib/icons'
import { Reveal } from '@/components/foundation'

export interface FaqItem {
  q: string
  a: string
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  // First item open by default — gives the section visible content on load.
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <Reveal key={item.q} delay={Math.min(i, 6) * 0.03}>
            <div className="overflow-hidden rounded-sm border border-line bg-wrap">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-wrap-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
              >
                <span className="heading-display text-[15px] font-medium text-d-text-primary">
                  {item.q}
                </span>
                <Plus
                  className={`h-4 w-4 shrink-0 text-d-text-muted transition-transform duration-300 ${
                    isOpen ? 'rotate-45' : ''
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-[13.5px] leading-relaxed text-d-text-secondary">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}
