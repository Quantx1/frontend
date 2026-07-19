'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from '@/lib/icons'
import { Dialog } from '@/components/foundation'

interface PaletteEntry {
  href: string
  label: string
  group: string
}

// Post-2026-05-25 nav surface. The in-app engine showcase was retired
// 2026-06-20 — engines are internal-only now (they still power signals in the
// backend), and engine names live only on the public landing as marketing. The
// /engines discovery entries are gone from the palette.
const ENTRIES: PaletteEntry[] = [
  // Main nav — /copilot is the single home (Main Chat + authed cockpit band);
  // the retired /dashboard Command Center entry folded into it (WP-CONSOLIDATE 3c).
  { href: '/copilot', label: 'Copilot', group: 'Workspace' },
  { href: '/signals', label: 'Signals', group: 'Workspace' },
  { href: '/strategies', label: 'AI Algos', group: 'Workspace' },
  { href: '/scanner', label: 'AI Scanner', group: 'Workspace' },
  { href: '/stocks', label: 'Stocks', group: 'Workspace' },
  { href: '/portfolio', label: 'Portfolio', group: 'Workspace' },
  { href: '/watchlist', label: 'Watchlist', group: 'Workspace' },
  { href: '/autopilot', label: 'AutoPilot', group: 'Workspace' },
  { href: '/inbox', label: 'Inbox', group: 'Workspace' },
  { href: '/alerts', label: 'Alerts Studio', group: 'Workspace' },
  { href: '/settings', label: 'Settings', group: 'Workspace' },

  // Sub-surfaces
  { href: '/portfolio/doctor', label: 'Portfolio Doctor', group: 'Portfolio' },
  { href: '/paper-trading', label: 'Paper trading', group: 'Paper' },
  { href: '/trades', label: 'Trade journal', group: 'Paper' },
  { href: '/referrals', label: 'Referrals', group: 'Account' },

  // Public — the three trust surfaces (track record / model accuracy /
  // regime) folded into one tabbed /proof page (WP-CONSOLIDATE 3d).
  { href: '/proof', label: 'Proof (track record · accuracy · regime)', group: 'Public' },
  { href: '/pricing', label: 'Pricing', group: 'Public' },
]

// Group iteration order in the rendered list — guarantees deterministic
// sorting regardless of which groups happen to have visible entries.
const GROUP_ORDER = ['Workspace', 'Agents', 'Portfolio', 'Paper', 'Account', 'Public']

interface Props {
  open: boolean
  onClose: () => void
}

export const CommandPalette = ({ open, onClose }: Props) => {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Reset query + selection whenever the palette opens fresh.
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
    }
  }, [open])

  // Filtered + group-sorted entries. We compute a flat list for keyboard
  // navigation and a grouped map for rendering.
  const { flat, grouped } = useMemo(() => {
    const q = query.toLowerCase().trim()
    const filtered = q
      ? ENTRIES.filter((e) => e.label.toLowerCase().includes(q))
      : ENTRIES
    const grouped: Record<string, PaletteEntry[]> = {}
    for (const e of filtered) {
      ;(grouped[e.group] ||= []).push(e)
    }
    const flat: PaletteEntry[] = []
    for (const g of GROUP_ORDER) {
      if (grouped[g]) flat.push(...grouped[g])
    }
    return { flat, grouped }
  }, [query])

  // Clamp selection when filter results change.
  useEffect(() => {
    if (activeIdx >= flat.length) setActiveIdx(Math.max(0, flat.length - 1))
  }, [flat.length, activeIdx])

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = flat[activeIdx]
      if (target) {
        router.push(target.href)
        onClose()
      }
    }
  }

  // Scroll the active item into view on selection change.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-palette-idx="${activeIdx}"]`,
    )
    node?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  let runningIdx = 0

  return (
    <Dialog open={open} onClose={onClose} className="max-w-xl p-0">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Search className="h-4 w-4 text-d-text-muted" aria-hidden="true" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Search nav, symbols, strategies…"
          aria-label="Search command palette"
          aria-controls="palette-results"
          aria-activedescendant={`palette-item-${activeIdx}`}
          className="flex-1 bg-transparent text-sm text-d-text-primary outline-none placeholder:text-d-text-muted"
        />
        <kbd className="text-[10px] text-d-text-muted">ESC</kbd>
      </div>
      <div
        ref={listRef}
        id="palette-results"
        role="listbox"
        className="max-h-96 overflow-y-auto p-2"
      >
        {flat.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-d-text-muted">
            No matches
          </p>
        ) : (
          GROUP_ORDER.map((group) => {
            const items = grouped[group]
            if (!items?.length) return null
            return (
              <div key={group} className="mb-2 last:mb-0">
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                  {group}
                </p>
                {items.map(({ href, label }) => {
                  const idx = runningIdx++
                  const active = idx === activeIdx
                  return (
                    <button
                      key={href}
                      id={`palette-item-${idx}`}
                      data-palette-idx={idx}
                      role="option"
                      aria-selected={active}
                      type="button"
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => {
                        router.push(href)
                        onClose()
                      }}
                      className={`block w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                        active
                          ? 'bg-wrap-hover text-d-text-primary'
                          : 'text-d-text-secondary hover:bg-wrap-hover hover:text-d-text-primary'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )
          })
        )}
      </div>
    </Dialog>
  )
}
