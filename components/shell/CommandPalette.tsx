'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, Sun, Moon, Settings, Bell, Inbox, Users,
  ShieldCheck, CreditCard, Sparkles, ArrowRight,
} from '@/lib/icons'
import { Dialog } from '@/components/foundation'
import { NAV } from './nav'
import { useThemeMode } from '@/contexts/ThemeModeContext'
import { MONO } from '@/lib/tokens'

// ── Command model ──────────────────────────────────────────────────────────
// Post-2026-08 upgrade (§14): the palette is now command-first — an "OS for the
// app". Entries can NAVIGATE (href) or RUN an action (perform). Every row has an
// icon; navigations are remembered as Recents; a live "Jump to" command lets you
// open any symbol's chart by typing its ticker. Nav/ESC/⌘K wiring is preserved.
interface Command {
  id: string
  label: string
  group: string
  icon: React.ElementType
  hint?: string           // right-aligned mono tag (e.g. "Action")
  href?: string           // navigation target
  perform?: () => void    // side-effecting action (overrides href)
  keepOpen?: boolean       // don't dismiss after running (e.g. theme toggle)
  recordable?: boolean    // eligible to appear under Recent
}

const RECENT_KEY = 'quantx.cmdk.recent'
const GROUP_ORDER = ['Recent', 'Actions', 'Jump to', 'Navigate', 'Account']

interface Props {
  open: boolean
  onClose: () => void
}

export const CommandPalette = ({ open, onClose }: Props) => {
  const router = useRouter()
  const { setMode } = useThemeMode()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [isDark, setIsDark] = useState(true)
  const [recentIds, setRecentIds] = useState<string[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  // On open: reset query/selection, read the live theme (to label the toggle),
  // and hydrate the recent list from localStorage.
  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveIdx(0)
    try {
      setIsDark(document.documentElement.classList.contains('dark'))
      const raw = localStorage.getItem(RECENT_KEY)
      setRecentIds(raw ? (JSON.parse(raw) as string[]) : [])
    } catch {
      /* ignore */
    }
  }, [open])

  const pushRecent = (id: string) => {
    try {
      const next = [id, ...recentIds.filter((r) => r !== id)].slice(0, 5)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  // The full command registry (stable per open — depends on theme + query only).
  const registry = useMemo<Command[]>(() => {
    const cmds: Command[] = [
      // Actions
      { id: 'act:new-chat', label: 'New chat', group: 'Actions', icon: Plus, hint: 'Action', href: '/copilot' },
      {
        id: 'act:theme',
        label: isDark ? 'Switch to light theme' : 'Switch to dark theme',
        group: 'Actions',
        icon: isDark ? Sun : Moon,
        hint: 'Action',
        perform: () => {
          setMode(isDark ? 'light' : 'dark')
          setIsDark((v) => !v)
        },
        keepOpen: true,
      },
      // Navigate — derived from the sidebar IA (icons come along for free).
      { id: 'nav:/copilot', label: 'Copilot', group: 'Navigate', icon: Sparkles, href: '/copilot', recordable: true },
      ...NAV.map((n) => ({
        id: `nav:${n.href}`,
        label: n.label,
        group: 'Navigate',
        icon: n.icon,
        href: n.href,
        recordable: true,
      })),
      // Account / trust surfaces
      { id: 'nav:/inbox', label: 'Inbox', group: 'Account', icon: Inbox, href: '/inbox', recordable: true },
      { id: 'nav:/alerts', label: 'Alerts Studio', group: 'Account', icon: Bell, href: '/alerts', recordable: true },
      { id: 'nav:/referrals', label: 'Referrals', group: 'Account', icon: Users, href: '/referrals', recordable: true },
      { id: 'nav:/proof', label: 'Proof · track record', group: 'Account', icon: ShieldCheck, href: '/proof', recordable: true },
      { id: 'nav:/pricing', label: 'Pricing & plans', group: 'Account', icon: CreditCard, href: '/pricing', recordable: true },
      { id: 'nav:/settings', label: 'Settings', group: 'Account', icon: Settings, href: '/settings', recordable: true },
    ]

    // Live "Jump to" — type a ticker to open its chart directly.
    const q = query.trim()
    if (/^[a-zA-Z][a-zA-Z0-9.&-]{1,11}$/.test(q)) {
      const sym = q.toUpperCase()
      cmds.push({
        id: `jump:${sym}`,
        label: `View chart · ${sym}`,
        group: 'Jump to',
        icon: Search,
        hint: 'Symbol',
        href: `/stock/${sym}`,
      })
    }
    return cmds
  }, [isDark, query, setMode])

  // Filter + group. When the query is empty we surface a Recent group at the top
  // (resolved from stored ids); otherwise we substring-match label text.
  const { flat, grouped } = useMemo(() => {
    const q = query.toLowerCase().trim()
    const byId = new Map(registry.map((c) => [c.id, c]))
    let pool = registry
    if (q) {
      pool = registry.filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q))
    }
    const grouped: Record<string, Command[]> = {}
    // Recent (only when not searching)
    if (!q) {
      const recents = recentIds.map((id) => byId.get(id)).filter(Boolean) as Command[]
      if (recents.length) grouped['Recent'] = recents
    }
    for (const c of pool) {
      if (!q && grouped['Recent']?.some((r) => r.id === c.id)) continue
      ;(grouped[c.group] ||= []).push(c)
    }
    const flat: Command[] = []
    for (const g of GROUP_ORDER) if (grouped[g]) flat.push(...grouped[g])
    return { flat, grouped }
  }, [query, registry, recentIds])

  useEffect(() => {
    if (activeIdx >= flat.length) setActiveIdx(Math.max(0, flat.length - 1))
  }, [flat.length, activeIdx])

  const run = (cmd: Command) => {
    if (cmd.recordable) pushRecent(cmd.id)
    if (cmd.perform) {
      cmd.perform()
      if (!cmd.keepOpen) onClose()
      return
    }
    if (cmd.href) {
      router.push(cmd.href)
      onClose()
    }
  }

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
      if (target) run(target)
    }
  }

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-palette-idx="${activeIdx}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  let runningIdx = 0

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl overflow-hidden rounded-[20px] border-wrap-line p-0 elev-3">
      {/* Search field */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
        <Search className="h-[18px] w-[18px] shrink-0 text-d-text-muted" aria-hidden="true" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Search or jump to… (try a ticker like RELIANCE)"
          aria-label="Search command palette"
          aria-controls="palette-results"
          aria-activedescendant={`palette-item-${activeIdx}`}
          className="flex-1 bg-transparent text-[15px] text-d-text-primary outline-none placeholder:text-d-text-muted"
        />
        <kbd className={`${MONO} rounded-md border border-line bg-main px-1.5 py-0.5 text-[10px] text-d-text-muted`}>ESC</kbd>
      </div>

      {/* Results */}
      <div ref={listRef} id="palette-results" role="listbox" className="max-h-[420px] overflow-y-auto p-2">
        {flat.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-12 text-center">
            <Search className="h-6 w-6 text-d-text-muted/60" aria-hidden="true" />
            <p className="text-sm text-d-text-secondary">No matches for &ldquo;{query}&rdquo;</p>
            <p className="text-[12px] text-d-text-muted">Try a page name, an action, or a stock ticker.</p>
          </div>
        ) : (
          GROUP_ORDER.map((group) => {
            const items = grouped[group]
            if (!items?.length) return null
            return (
              <div key={group} className="mb-1.5 last:mb-0">
                <p className={`${MONO} px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-d-text-muted/80`}>
                  {group}
                </p>
                {items.map((cmd) => {
                  const idx = runningIdx++
                  const active = idx === activeIdx
                  const Icon = cmd.icon
                  return (
                    <button
                      key={cmd.id}
                      id={`palette-item-${idx}`}
                      data-palette-idx={idx}
                      role="option"
                      aria-selected={active}
                      type="button"
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => run(cmd)}
                      className={`group/row relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition-colors ${
                        active
                          ? 'bg-primary/12 text-d-text-primary ring-1 ring-inset ring-primary/25'
                          : 'text-d-text-secondary hover:bg-wrap-hover hover:text-d-text-primary'
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_-1px_rgba(64,106,228,0.7)]"
                        />
                      )}
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors ${
                          active ? 'bg-primary/15 text-primary' : 'bg-wrap-hover text-d-text-muted group-hover/row:text-d-text-secondary'
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{cmd.label}</span>
                      {cmd.hint && (
                        <span className={`${MONO} hidden shrink-0 text-[10px] uppercase tracking-wider text-d-text-muted sm:inline`}>
                          {cmd.hint}
                        </span>
                      )}
                      {active && <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            )
          })
        )}
      </div>

      {/* Footer hint bar */}
      <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-d-text-muted">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <kbd className={`${MONO} rounded border border-line bg-main px-1 py-0.5 text-[10px]`}>↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className={`${MONO} rounded border border-line bg-main px-1 py-0.5 text-[10px]`}>↵</kbd> open
          </span>
        </div>
        <span className={`${MONO} flex items-center gap-1.5 text-[11px]`}>
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Quant X Command
        </span>
      </div>
    </Dialog>
  )
}
