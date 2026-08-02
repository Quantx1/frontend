'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity, Bell, Eye, HelpCircle, LogOut, Search, Settings, User,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { CopilotBot } from '@/components/copilot/CopilotBot'
import { AnimatedThemeToggle } from '@/components/theme/AnimatedThemeToggle'
import { cn } from '@/lib/utils'

interface Props {
  onSearch: () => void
}

const btn =
  'grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors ' +
  'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-ring'

function RailTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="left" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export function RightRail({ onSearch }: Props) {
  const pathname = usePathname() ?? '/'
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const { user, profile, signOut } = useAuth()

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Account'
  const initial = (profile?.full_name || user?.email || 'A').trim().charAt(0).toUpperCase()

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        aria-label="Utilities"
        className="fixed right-0 top-0 z-40 hidden h-full w-[68px] flex-col items-center border-l border-border bg-sidebar py-3 lg:flex"
      >
        {/* Top group */}
        <div className="flex flex-col items-center gap-1">
          {/* Copilot launcher */}
          <RailTooltip label="Copilot (⌘/)">
            <button
              type="button"
              onClick={() => dispatchCopilotOpen()}
              aria-label="Open Copilot"
              className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CopilotBot className="size-5" />
            </button>
          </RailTooltip>

          <Separator className="my-1.5 w-8" />

          <RailTooltip label="Watchlist">
            <Link
              href="/watchlist"
              aria-current={isActive('/watchlist') ? 'page' : undefined}
              className={cn(btn, isActive('/watchlist') && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary')}
            >
              <Eye className="size-4" />
            </Link>
          </RailTooltip>

          <RailTooltip label="Notifications">
            <Link
              href="/inbox"
              aria-current={isActive('/inbox') ? 'page' : undefined}
              className={cn(btn, isActive('/inbox') && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary')}
            >
              <Bell className="size-4" />
            </Link>
          </RailTooltip>

          <RailTooltip label="Search (⌘K)">
            <button type="button" onClick={onSearch} aria-label="Search" className={btn}>
              <Search className="size-4" />
            </button>
          </RailTooltip>

          <RailTooltip label="Activity">
            <Link
              href="/copilot"
              aria-current={isActive('/copilot') ? 'page' : undefined}
              className={cn(btn, isActive('/copilot') && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary')}
            >
              <Activity className="size-4" />
            </Link>
          </RailTooltip>
        </div>

        {/* Bottom group */}
        <div className="mt-auto flex flex-col items-center gap-1">
          <RailTooltip label="Settings">
            <Link
              href="/settings"
              aria-current={isActive('/settings') ? 'page' : undefined}
              className={cn(btn, isActive('/settings') && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary')}
            >
              <Settings className="size-4" />
            </Link>
          </RailTooltip>

          <RailTooltip label="Help & Plans">
            <Link href="/pricing" className={btn}>
              <HelpCircle className="size-4" />
            </Link>
          </RailTooltip>

          <Separator className="my-1.5 w-8" />

          {/* Account dropdown */}
          {user && (
            <DropdownMenu>
              <RailTooltip label={name}>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="Account menu" className={cn(btn, 'rounded-full')}>
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-primary text-[11px] font-bold text-primary-foreground">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
              </RailTooltip>
              <DropdownMenuContent side="left" align="end" className="w-52 rounded-xl">
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-[12px] font-bold text-primary-foreground">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium">{name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <User className="size-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="size-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={async () => { await signOut() }}
                >
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Theme toggle */}
          <RailTooltip label="Toggle theme">
            <AnimatedThemeToggle className={btn} iconClassName="size-4" />
          </RailTooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
