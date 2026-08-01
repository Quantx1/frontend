'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { Skeleton } from '@/components/foundation'
import {
  Instagram, Linkedin, Menu, MessageSquare, PanelLeftClose,
  Plus, Send, Sparkles, Trash2, Twitter, Youtube,
} from '@/lib/icons'
import { NavList } from './NavList'
import { QuantXMark } from '@/components/brand/QuantXMark'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { MONO } from '@/lib/tokens'

type Conv = { id: string; title: string | null; created_at: string; updated_at: string }

// Group threads into Today / Yesterday / Previous 7 days / Earlier (ChatGPT-style).
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

interface Props {
  pathname: string
  collapsed: boolean
  onToggle: () => void
  /** Only enable the width transition after mount (avoids a load-time snap). */
  animate: boolean
}

const SOCIALS = [
  { icon: Twitter, label: 'X / Twitter', href: '#' },
  { icon: Send, label: 'Telegram', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
]

// 3-zone reference shell — LEFT SIDEBAR (Wave 1, 2026-06-20).
// Fixed 240px, bg-wrap, 1px border-line right border. Top→bottom:
//   New Chat (primary action) → top nav + grouped feature nav (NavList) →
//   History (recent chats) → footer (socials · Upgrade pill · collapse
//   toggle). Notifications + Settings live on the right rail only.
// Re-skinned to OUR theme-aware tokens (no teal, no hex). Collapses below `lg`
// where the MobileDrawer takes over.
export const Sidebar = ({ pathname, collapsed, onToggle, animate }: Props) => {
  const { data, isLoading: convLoading } = useSWR(
    'copilot:conversations',
    () => api.ai.copilotListConversations(),
    { revalidateOnFocus: false, keepPreviousData: true },
  )
  const conversations = (data?.conversations ?? []) as Conv[]

  const { mutate } = useSWRConfig()
  const router = useRouter()

  // Track the open thread (?c=…) without useSearchParams (which would force a
  // CSR-bailout on every platform page since the sidebar lives in the layout).
  const [openId, setOpenId] = useState<string | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined') setOpenId(new URLSearchParams(window.location.search).get('c'))
  }, [pathname])

  // Optimistically drop the thread, then archive it server-side.
  const deleteConv = async (id: string) => {
    mutate(
      'copilot:conversations',
      (cur: any) => (cur ? { ...cur, conversations: cur.conversations.filter((c: Conv) => c.id !== id) } : cur),
      { revalidate: false },
    )
    try {
      await api.ai.copilotDeleteConversation(id)
    } catch {
      /* ignore — a revalidate will resync if it failed */
    }
    mutate('copilot:conversations')
    if (openId === id) router.push('/copilot')
  }

  return (
    <aside
      id="app-sidebar"
      aria-label="Main navigation"
      className={cn(
        'fixed left-0 top-0 z-30 hidden h-full flex-col overflow-hidden border-r border-line glass-chrome lg:flex',
        animate && 'transition-[width] duration-200',
        collapsed ? 'w-[68px]' : 'w-60',
      )}
    >
      {/* brand — logo + wordmark + live status */}
      <div className={cn('flex h-16 shrink-0 items-center border-b border-line', collapsed ? 'justify-center px-0' : 'px-4')}>
        <Link
          href="/copilot"
          className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label="Quant X — Trading OS, go to home"
        >
          <QuantXMark className="h-8 w-8 shrink-0 drop-shadow-[0_2px_10px_rgba(58,119,229,0.45)]" />
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15.5px] font-bold tracking-tight text-d-text-primary">Quant X</span>
              <span className="flex items-center gap-1.5 text-[9.5px] font-medium uppercase tracking-[0.16em] text-d-text-muted">
                <span aria-hidden="true" className="inline-flex h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_8px_rgba(22,199,132,0.8)]" />
                Trading OS
              </span>
            </span>
          )}
        </Link>
      </div>

      {/* New Chat — primary action (accent-tinted glass), with a ⌘ hint */}
      <div className="shrink-0 px-2.5 pt-3.5">
        <Link
          href="/copilot"
          title="New Chat"
          className={cn(
            'group/newchat flex items-center rounded-2xl border border-line bg-wrap-hover font-medium text-d-text-primary transition-all duration-150 hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
            collapsed ? 'h-11 justify-center' : 'gap-2.5 px-3 py-2.5 text-[13.5px]',
          )}
        >
          <span
            className={cn(
              'grid place-items-center rounded-xl bg-primary/15 text-primary transition-colors group-hover/newchat:bg-primary group-hover/newchat:text-primary-foreground',
              collapsed ? 'h-7 w-7' : 'h-6 w-6',
            )}
          >
            <Plus className={collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4'} />
          </span>
          {!collapsed && <span className="flex-1">New Chat</span>}
        </Link>
      </div>

      {/* top nav + grouped feature nav */}
      <NavList pathname={pathname} collapsed={collapsed} />

      {/* History — recent chats, date-grouped, active-highlighted, delete on hover */}
      {/* First load: show a skeleton so History doesn't silently pop in. */}
      {!collapsed && convLoading && conversations.length === 0 && (
        <div className="border-t border-line px-4 py-3 space-y-2" aria-hidden="true">
          <Skeleton w="56px" h="12px" />
          <Skeleton h="14px" />
          <Skeleton h="14px" />
        </div>
      )}

      {!collapsed && conversations.length > 0 && (
        <nav aria-label="History" className="min-h-0 max-h-[34%] flex-shrink overflow-y-auto border-t border-line px-2.5 py-2.5">
          <div className={cn(MONO, 'px-1.5 pb-1 pt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-d-text-muted/80')}>History</div>
          {groupByDate(conversations).map(([label, list]) => (
            <div key={label} className="mb-1">
              <div className="px-1.5 pb-1 pt-2 text-[10.5px] font-medium text-d-text-muted">{label}</div>
              {list.map((c) => {
                const active = c.id === openId
                return (
                  <div key={c.id} className="group/item relative">
                    <Link
                      href={`/copilot?c=${c.id}`}
                      onClick={() => setOpenId(c.id)}
                      title={c.title ?? '(untitled)'}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2 rounded-xl py-2 pl-2.5 pr-7 text-[12.5px] transition-colors',
                        active ? 'bg-primary/12 text-primary ring-1 ring-inset ring-primary/20' : 'text-d-text-secondary hover:bg-wrap-hover hover:text-d-text-primary',
                      )}
                    >
                      <MessageSquare className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-primary' : 'text-d-text-muted')} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{c.title ?? '(untitled)'}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteConv(c.id)}
                      aria-label={`Delete chat: ${c.title ?? 'untitled'}`}
                      title="Delete chat"
                      className="absolute right-1 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-d-text-muted opacity-0 transition-opacity hover:text-down focus-visible:opacity-100 group-hover/item:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </nav>
      )}

      {/* ── pinned footer: socials · upgrade · collapse ──
           Notifications + Settings live on the right rail only. */}
      <div className="mt-auto shrink-0">
        {/* Upgrade card — glossy blue FintechX CTA (gradient + gloss bevel).
            Expanded: a richer two-line pitch; collapsed: the gloss chip. */}
        <div className="border-t border-line p-2.5">
          <Link
            href="/pricing"
            title="Upgrade"
            className={cn(
              'cta-gloss group/upgrade flex items-center bg-gradient-cta font-semibold text-primary-foreground transition-transform duration-150 hover:-translate-y-0.5',
              collapsed ? 'h-10 justify-center rounded-2xl' : 'gap-2.5 rounded-2xl px-3 py-2.5',
            )}
          >
            <Sparkles className={collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4 shrink-0'} aria-hidden="true" />
            {!collapsed && (
              <span className="min-w-0 leading-tight">
                <span className="block text-[13px]">Upgrade to Pro</span>
                <span className="block text-[10.5px] font-medium text-primary-foreground/80">Unlimited signals &amp; Copilot</span>
              </span>
            )}
          </Link>
        </div>

        {/* socials */}
        {!collapsed && (
          <div className="flex items-center justify-between border-t border-line px-3 py-2.5">
            {SOCIALS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                title={label}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-7 w-7 place-items-center rounded-lg text-d-text-muted transition-colors hover:bg-wrap-hover hover:text-d-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <Icon className="h-[15px] w-[15px]" />
              </a>
            ))}
          </div>
        )}

        {/* collapse / expand toggle — bottom */}
        <div className="border-t border-line p-2">
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Open menu' : 'Collapse menu'}
            aria-pressed={collapsed}
            aria-controls="app-sidebar"
            className={cn(
              'flex w-full items-center gap-2.5 rounded-xl text-d-text-muted transition-colors hover:bg-wrap-hover hover:text-d-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
              collapsed ? 'justify-center py-2.5' : 'px-2.5 py-2',
            )}
          >
            {collapsed
              ? <Menu className="h-[22px] w-[22px]" />
              : <><PanelLeftClose className="h-[18px] w-[18px]" /><span className="text-[12.5px] font-medium">Collapse</span></>}
          </button>
        </div>
      </div>
    </aside>
  )
}

