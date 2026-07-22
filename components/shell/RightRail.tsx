'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Activity, Bell, Eye, HelpCircle, LogOut, Search, Settings, User,
} from '@/lib/icons'
import { useAuth } from '@/contexts/AuthContext'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { CopilotBot } from '@/components/copilot/CopilotBot'
import { AnimatedThemeToggle } from '@/components/theme/AnimatedThemeToggle'
import { cn } from '@/lib/utils'

interface Props {
  /** Opens the existing CommandPalette (⌘K). */
  onSearch: () => void
}

// 3-zone reference shell — RIGHT UTILITY RAIL (Wave 1, 2026-06-20).
// Fixed 72px, bg-main, 1px border-line left border. A vertical stack of
// icon-only utility buttons at a ~56px pitch: Watchlist · Notifications ·
// Search (⌘K) · Activity (top group); Help + 3-way ThemeToggle pinned bottom.
// Hidden below `lg` (the MobileDrawer + footer carry these on small screens).
// Re-skinned to OUR theme-aware tokens — no teal, no hex.
export function RightRail({ onSearch }: Props) {
  return (
    <aside
      aria-label="Utilities"
      className="fixed right-0 top-0 z-40 hidden h-full w-[72px] flex-col items-center border-l border-line bg-main py-3 lg:flex"
    >
      {/* top group */}
      <div className="flex flex-col items-center gap-2">
        {/* Copilot dock launcher — the primary affordance (⌘/). Opens the
            context-aware panel on the current page instead of navigating away. */}
        <button
          type="button"
          onClick={() => dispatchCopilotOpen()}
          aria-label="Open Copilot (⌘/)"
          title="Copilot (⌘/)"
          className="cta-gloss grid h-10 w-10 place-items-center rounded-full bg-gradient-cta text-primary-foreground transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <CopilotBot className="h-5 w-5" />
        </button>
        <div className="my-1 h-px w-6 bg-line" aria-hidden="true" />
        <RailLink href="/watchlist" label="Watchlist" icon={Eye} />
        <RailLink href="/inbox" label="Notifications" icon={Bell} />
        <RailButton label="Search (⌘K)" icon={Search} onClick={onSearch} />
        {/* WP-SIMPLEVIEW — /activity retired; its 7-day log is folded into the
            Simple band on the /copilot home. */}
        <RailLink href="/copilot" label="Activity" icon={Activity} />
      </div>

      {/* pinned bottom: settings · help · account · theme */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <RailLink href="/settings" label="Settings" icon={Settings} />
        <RailLink href="/pricing" label="Help & plans" icon={HelpCircle} />
        <RailProfile />
        <RailThemeToggle />
      </div>
    </aside>
  )
}

const railBtn =
  'grid h-10 w-10 place-items-center rounded-full text-d-text-muted transition-colors ' +
  'hover:bg-wrap-hover hover:text-d-text-primary focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-accent/40'

function RailLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  return (
    <Link href={href} aria-label={label} title={label} className={railBtn}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </Link>
  )
}

function RailButton({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={railBtn}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}

// Account avatar + dropdown — the profile / settings / sign-out menu, pinned to
// the right rail. The signed-in user's initial fills a mono/white pill chip;
// the menu opens to the LEFT (rail is on the right edge) and upward. signOut
// clears the session and returns to /. SSR-safe (renders nothing until a user).
function RailProfile() {
  const { user, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  const name = profile?.full_name || user.email?.split('@')[0] || 'Account'
  const initial = (profile?.full_name || user.email || 'A').trim().charAt(0).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        title={name}
        className={cn(railBtn, open && 'bg-wrap-hover text-d-text-primary')}
      >
        <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
          {initial}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-0 right-full z-50 mr-2 w-56 overflow-hidden rounded-2xl border border-line bg-wrap"
        >
          <div className="flex items-center gap-2.5 border-b border-line px-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-medium text-d-text-primary">{name}</p>
              <p className="truncate text-[10.5px] text-d-text-muted">{user.email}</p>
            </div>
          </div>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-d-text-secondary transition-colors hover:bg-wrap-hover hover:text-d-text-primary"
          >
            <User className="h-4 w-4" /> Profile
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 border-t border-line px-3 py-2.5 text-[13px] text-d-text-secondary transition-colors hover:bg-wrap-hover hover:text-d-text-primary"
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false)
              await signOut()
            }}
            className="flex w-full items-center gap-3 border-t border-line px-3 py-2.5 text-[13px] text-d-text-secondary transition-colors hover:bg-down/10 hover:text-down"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

// Quick light/dark flip with the View-Transition reveal. The full
// Light / Dark / Auto control lives in Settings → Appearance; this is the
// dense rail affordance. Bound to next-themes + ThemeModeContext (a tap sets
// an explicit intent, exiting Auto). SSR-safe inside AnimatedThemeToggle.
function RailThemeToggle() {
  return <AnimatedThemeToggle className={cn(railBtn)} iconClassName="h-5 w-5" />
}
