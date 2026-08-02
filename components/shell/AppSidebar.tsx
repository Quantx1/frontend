'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageSquare,
  Plus,
  Sparkles,
  Trash2,
  ChevronUp,
  LogOut,
  Settings,
  User,
} from 'lucide-react'
import { QuantXMark } from '@/components/brand/QuantXMark'
import { NAV, NAV_SECTIONS } from './nav'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

type Conv = { id: string; title: string | null; created_at: string; updated_at: string }

function groupByDate(convs: Conv[]): [string, Conv[]][] {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const DAY = 86_400_000
  const groups: Record<string, Conv[]> = { Today: [], Yesterday: [], 'Previous 7 days': [], Earlier: [] }
  for (const c of convs) {
    const t = new Date(c.updated_at || c.created_at).getTime()
    if (t >= startOfToday) groups.Today.push(c)
    else if (t >= startOfToday - DAY) groups.Yesterday.push(c)
    else if (t >= startOfToday - 7 * DAY) groups['Previous 7 days'].push(c)
    else groups.Earlier.push(c)
  }
  return Object.entries(groups).filter(([, list]) => list.length > 0)
}

interface AppSidebarProps {
  pathname: string
  onSearch: () => void
}

export function AppSidebar({ pathname, onSearch }: AppSidebarProps) {
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  const { user, profile, signOut } = useAuth()
  const router = useRouter()

  const { data, isLoading: convLoading } = useSWR(
    'copilot:conversations',
    () => api.ai.copilotListConversations(),
    { revalidateOnFocus: false, keepPreviousData: true },
  )
  const conversations = (data?.conversations ?? []) as Conv[]
  const { mutate } = useSWRConfig()

  const [openId, setOpenId] = useState<string | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined')
      setOpenId(new URLSearchParams(window.location.search).get('c'))
  }, [pathname])

  const deleteConv = async (id: string) => {
    mutate(
      'copilot:conversations',
      (cur: any) => (cur ? { ...cur, conversations: cur.conversations.filter((c: Conv) => c.id !== id) } : cur),
      { revalidate: false },
    )
    try { await api.ai.copilotDeleteConversation(id) } catch { /* ignore */ }
    mutate('copilot:conversations')
    if (openId === id) router.push('/copilot')
  }

  // Active route detection: longest-prefix wins
  const activeHref = NAV.reduce(
    (best, n) =>
      (pathname === n.href || pathname.startsWith(n.href + '/')) && n.href.length > best.length
        ? n.href : best,
    '',
  )

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Account'
  const initial = (profile?.full_name || user?.email || 'A').trim().charAt(0).toUpperCase()

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* ── Header: brand ── */}
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Quant X — Trading OS">
              <Link href="/copilot" aria-label="Quant X — Trading OS">
                <QuantXMark className="size-8 shrink-0 drop-shadow-[0_2px_10px_rgba(58,119,229,0.45)]" />
                <div className="flex flex-col leading-tight">
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
                  <span className="flex items-center gap-1 text-eyebrow text-muted-foreground/70">
                    <span className="inline-block size-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(22,199,132,0.8)]" />
                    Trading OS
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* New Chat CTA */}
        <SidebarGroup className="py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="New Chat" className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-medium border border-primary/20">
                <Link href="/copilot">
                  <Plus className="size-4" />
                  <span>New Chat</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Main navigation groups */}
        {NAV_SECTIONS.map((section) => {
          const items = NAV.filter((n) => n.section === section.key)
          if (items.length === 0) return null
          return (
            <SidebarGroup key={section.key}>
              {section.label && (
                <SidebarGroupLabel className="text-eyebrow text-muted-foreground/60">
                  {section.label}
                </SidebarGroupLabel>
              )}
              <SidebarMenu>
                {items.map(({ href, label, icon: Icon, tier }) => {
                  const active = href === activeHref
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={label}
                        className={cn(
                          active && 'bg-primary/10 text-primary font-medium',
                        )}
                      >
                        <Link href={href}>
                          <Icon className="size-4" />
                          <span>{label}</span>
                          {tier === 'pro' && (
                            <Badge variant="secondary" className="ml-auto text-[9px] px-1 py-0 h-4">
                              Pro
                            </Badge>
                          )}
                          {tier === 'elite' && (
                            <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0 h-4 text-amber-500 border-amber-500/30">
                              Elite
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          )
        })}

        {/* Chat history */}
        {!collapsed && conversations.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-eyebrow text-muted-foreground/60">
                History
              </SidebarGroupLabel>
              <ScrollArea className="max-h-48">
                <SidebarMenu>
                  {groupByDate(conversations).map(([label, list]) => (
                    <React.Fragment key={label}>
                      <div className="px-2 py-1 text-[10px] text-muted-foreground">{label}</div>
                      {list.map((c) => {
                        const active = c.id === openId
                        return (
                          <SidebarMenuItem key={c.id} className="group/item">
                            <SidebarMenuButton
                              asChild
                              isActive={active}
                              tooltip={c.title ?? '(untitled)'}
                              className="pr-6"
                            >
                              <Link href={`/copilot?c=${c.id}`} onClick={() => setOpenId(c.id)}>
                                <MessageSquare className="size-3.5 shrink-0" />
                                <span className="truncate">{c.title ?? '(untitled)'}</span>
                              </Link>
                            </SidebarMenuButton>
                            <button
                              type="button"
                              onClick={() => deleteConv(c.id)}
                              aria-label={`Delete: ${c.title ?? 'untitled'}`}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 size-5 grid place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/item:opacity-100"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </SidebarMenuItem>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </SidebarMenu>
              </ScrollArea>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* ── Footer: Upgrade + Account ── */}
      <SidebarFooter className="border-t border-sidebar-border">
        {/* Upgrade CTA */}
        <SidebarMenu>
          <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Upgrade to Pro" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-semibold">
              <Link href="/pricing">
                <Sparkles className="size-4" />
                <div className="flex flex-col leading-tight">
                  <span className="font-display text-[12.5px] font-semibold tracking-tight">Upgrade to Pro</span>
                  <span className="text-eyebrow font-normal opacity-75">Unlimited signals & Copilot</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Account dropdown */}
        {user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={name}
                    className="data-[state=open]:bg-sidebar-accent"
                  >
                    <Avatar className="size-7 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary text-[12px] font-bold text-primary-foreground">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-[13px] font-medium">{name}</span>
                      <span className="truncate text-[11px] text-muted-foreground">{user.email}</span>
                    </div>
                    <ChevronUp className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="w-56 rounded-xl">
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
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
