'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from './AppSidebar'
import { RightRail } from './RightRail'
import { CommandPalette } from './CommandPalette'
import { MobileDrawer } from './MobileDrawer'
import { appSans, appMono } from './appFont'
import { ConnectBrokerBanner } from '@/components/broker/ConnectBrokerBanner'
import { cn } from '@/lib/utils'

/**
 * AppShell — rebuilt on the shadcn SidebarProvider system (2026-08-redesign).
 *
 * Layout zones:
 *   LEFT  — AppSidebar (shadcn Sidebar, 240px expanded / icon-only collapsed)
 *   MAIN  — SidebarInset fills remaining space, scrolls
 *   RIGHT — RightRail (72px fixed utility column, desktop only)
 *
 * The shadcn SidebarProvider handles collapse state, cookies, and the mobile
 * Sheet drawer — MobileDrawer is kept for our custom mobile nav.
 */
export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname() ?? '/'
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

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
      className={cn(
        appSans.variable,
        appMono.variable,
        'app-canvas relative flex min-h-svh w-full bg-main',
      )}
      style={{ fontFamily: 'var(--font-app-sans)' }}
    >
      {/* Skip-to-content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>

      <SidebarProvider>
        {/* LEFT — shadcn sidebar */}
        <AppSidebar pathname={pathname} onSearch={() => setPaletteOpen(true)} />

        {/* MAIN — inset area, right-padded for the right rail on lg */}
        <SidebarInset className={cn('min-h-svh lg:mr-[72px]')}>
          {/* Mobile topbar — hamburger + brand, hidden on md+ (DeskTopbar takes over) */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-sidebar md:hidden">
            <SidebarTrigger className="ml-3 text-muted-foreground" />
            <Separator orientation="vertical" className="h-5" />
            <span
              className="font-display text-[15px] font-bold tracking-tight"
              style={{
                background: 'linear-gradient(125deg, #AFC6FF 0%, #7FA3FF 45%, #5290F4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Quant X
            </span>
          </header>

          {/* Content area */}
          <main id="main-content" className="flex-1">
            <ConnectBrokerBanner />
            <div className="mx-auto w-full max-w-[1440px]">
              {children}
            </div>
          </main>
        </SidebarInset>

        {/* RIGHT — fixed utility rail, desktop only */}
        <RightRail onSearch={() => setPaletteOpen(true)} />
      </SidebarProvider>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} pathname={pathname} />
    </div>
  )
}
