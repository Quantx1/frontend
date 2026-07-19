'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { MONO } from '@/lib/tokens'
import { featureAccent } from '@/lib/feature-colors'
import { NAV, NAV_SECTIONS, type NavItem, type NavSection } from './nav'

interface Props {
  pathname: string
  /** Item height. Mobile drawer wants taller tap targets; desktop sidebar uses the
   *  reference 52px rhythm. */
  itemHeight?: 'compact' | 'tall'
  /** Called after a nav item is clicked — used by MobileDrawer to close itself. */
  onItemClick?: () => void
  /** Icon-rail mode (collapsed sidebar): icons only, no labels/group headers. */
  collapsed?: boolean
}

/**
 * Shared grouped nav used by the desktop Sidebar + the mobile MobileDrawer.
 * Single source of truth for active-state logic and styling.
 *
 * 3-zone reference shell (Wave 1, 2026-06-20): UPPERCASE mono group labels
 * (12px/600, the active group tints to accent), 52px rows with 16px padding and
 * a 12px icon→label gap, 14px/400 row text. Re-skinned to OUR theme-aware
 * tokens (bg-wrap-hover / border-line / text-d-* / accent) — no teal, no hex.
 */
export const NavList = ({ pathname, itemHeight = 'compact', onItemClick, collapsed }: Props) => {
  // WP-SIMPLEVIEW 2026-07-02 — the managed nav swap is gone; every user gets the
  // full NAV. Managed users opt into the plain-language Simple view per page via
  // the on-page Simple/Full toggle instead of a separate beginner shell.
  const source = NAV
  const tall = itemHeight === 'tall'

  // Most-specific match wins: the active item is the LONGEST nav href that
  // matches the current path, so /signals/swing highlights "Swing" — not the
  // /signals "All Signals" overview that is merely its prefix. Derived during
  // render (cheap O(n) over ~17 items; no memo needed).
  const activeHref = source.reduce(
    (best, n) =>
      (pathname === n.href || pathname.startsWith(n.href + '/')) && n.href.length > best.length
        ? n.href
        : best,
    '',
  )

  const renderRow = ({ href, label, icon: Icon, tier }: NavItem) => {
    const active = href === activeHref
    return (
      <Link
        key={href}
        href={href}
        onClick={onItemClick}
        aria-current={active ? 'page' : undefined}
        title={collapsed ? label : undefined}
        className={cn(
          'relative flex items-center rounded-md text-[14px] leading-5 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          collapsed
            ? 'justify-center px-0 py-3'
            : cn('gap-3 px-4', tall ? 'h-11' : 'h-[52px]'),
          active
            ? 'bg-wrap-hover text-accent'
            : 'text-d-text-secondary hover:bg-wrap-hover hover:text-d-text-primary',
        )}
      >
        {active && !collapsed && (
          <span
            className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-r bg-accent"
            aria-hidden="true"
          />
        )}
        <Icon
          className={cn(
            collapsed ? 'h-[22px] w-[22px]' : 'h-[18px] w-[18px]',
            'shrink-0 transition-colors',
            // Per-feature accent hue — colourful icons across the whole app.
            // Active row already reads via bg + accent label + left bar, so the
            // glyph keeps its feature colour (never washes to grey).
            featureAccent(href),
          )}
          aria-hidden="true"
        />
        {!collapsed && <span className="flex-1 truncate">{label}</span>}
        {!collapsed && tier === 'elite' && (
          <span className="rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">Elite</span>
        )}
        {!collapsed && tier === 'pro' && (
          <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">Pro</span>
        )}
      </Link>
    )
  }

  return (
    <nav aria-label="Primary navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-3">
      {NAV_SECTIONS.map((section) => {
        const items = source.filter((n) => n.section === section.key)
        if (items.length === 0) return null
        // Whether this whole group contains the active route → group label
        // tints to accent (the reference active-group cue).
        const groupActive = items.some((n) => n.href === activeHref)
        return (
          <div key={section.key} className="space-y-0.5">
            {!collapsed && section.label && (
              <div
                className={cn(
                  MONO,
                  'px-4 pb-1 pt-4 text-[12px] font-semibold uppercase leading-4 tracking-[0.06em]',
                  groupActive ? 'text-accent' : 'text-d-text-muted',
                )}
              >
                {section.label}
              </div>
            )}
            {items.map(renderRow)}
          </div>
        )
      })}
    </nav>
  )
}
