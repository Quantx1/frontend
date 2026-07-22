'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { RightRail } from './RightRail'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { MobileDrawer } from './MobileDrawer'
import { appSans, appMono } from './appFont'
import { ConnectBrokerBanner } from '@/components/broker/ConnectBrokerBanner'
import { cn } from '@/lib/utils'

// 3-zone reference shell (Wave 1, 2026-06-20).
//   • LEFT sidebar — fixed 240px (240 expanded / 68 collapsed), bg-wrap.
//   • MAIN pane — fills between the rails (ml = sidebar width, mr = 72px right
//     rail), scrolls; inner content capped at max-w-[1440px] with 16/24 gutters.
//   • RIGHT rail — fixed 72px icon utilities, bg-main.
// No global top bar on desktop (per-page breadcrumb lives inside the page); the
// mobile-only Topbar opens the MobileDrawer below `lg`. All providers, the
// CommandPalette (⌘K) and AutopilotStickyStop are preserved by the layout.
export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname() ?? '/'
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Restore the user's sidebar collapse preference — defaults to the full
  // (expanded) rail. `mounted` gates the width/margin transition so a saved
  // collapsed rail doesn't animate-snap on load.
  useEffect(() => {
    setMounted(true)
    try {
      setCollapsed(localStorage.getItem('quantx.sidebar.collapsed.v2') === '1')
    } catch {
      /* ignore */
    }
  }, [])
  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem('quantx.sidebar.collapsed.v2', next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })

  // ⌘K opens the palette; ESC closes both surfaces.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false)
        setDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close mobile drawer on route change.
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  return (
    <div
      className={`${appSans.variable} ${appMono.variable} app-canvas relative min-h-screen min-h-[100dvh]`}
      style={{ fontFamily: 'var(--font-app-sans)' }}
    >
      {/* Skip-to-content — first focusable element. Becomes visible on focus
          (WCAG 2.4.1). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Zone 1 — left sidebar (fixed) */}
      <Sidebar pathname={pathname} collapsed={collapsed} onToggle={toggleCollapsed} animate={mounted} />

      {/* Zone 3 — right utility rail (fixed, desktop only) */}
      <RightRail onSearch={() => setPaletteOpen(true)} />

      {/* Zone 2 — main pane. Margins reserve the fixed rails on desktop; the
          mobile Topbar + full-width content take over below `lg`. */}
      <div
        className={cn(
          'relative z-10 flex min-h-screen min-h-[100dvh] flex-col lg:mr-[72px]',
          collapsed ? 'lg:ml-[68px]' : 'lg:ml-60',
          mounted && 'transition-[margin] duration-200',
        )}
      >
        <Topbar onMenuOpen={() => setDrawerOpen(true)} />
        <main id="main-content" className="min-h-0 flex-1">
          <ConnectBrokerBanner />
          {/* Content gutter + 1440px cap (reference: px-4 md:px-6, max-w-8xl). */}
          <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6">{children}</div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} pathname={pathname} />
    </div>
  )
}
