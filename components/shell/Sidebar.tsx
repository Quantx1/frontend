'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { Skeleton } from '@/components/foundation'
import {
  Menu, MessageSquare, PanelLeftClose, Plus, Search, Sparkles, Trash2,
} from '@/lib/icons'
import { NavList } from './NavList'
import { QuantXMark } from '@/components/brand/QuantXMark'
import { cn } from '@/lib/utils'
import { MONO } from '@/lib/tokens'
import { api } from '@/lib/api'

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
  /** Opens the command palette. */
  onSearch: () => void
}

// The five social links that used to sit in the footer were removed: every one
// of them pointed at `href: '#'`. Five dead controls occupied the most valuable
// strip of persistent chrome in the product, directly under the upgrade CTA.
// Social links belong in the marketing footer, not in a trading workspace —
// and certainly not when they go nowhere.

// 3-zone reference shell — LEFT SIDEBAR (Wave 1, 2026-06-20).
// Fixed 240px, bg-wrap, 1px border-line right border. Top→bottom:
//   New Chat (primary action) → top nav + grouped feature nav (NavList) →
//   History (recent chats) → footer (socials · Upgrade pill · collapse
//   toggle). Notifications + Settings live on the right rail only.
// Re-skinned to OUR theme-aware tokens (no teal, no hex). Collapses below `lg`
// where the MobileDrawer takes over.
export const Sidebar = ({ pathname, collapsed, onToggle, animate, onSearch }: Props) => {
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
      {/* brand — logo + wordmark only */}
      <div className={cn('flex h-14 shrink-0 items-center border-b border-line', collapsed ? 'justify-center px-0' : 'px-4')}>
        <Link
          href="/copilot"
          className="flex min-w-0 items-center gap-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label="Quant X — Trading OS, go to home"
        >
          <QuantXMark className="h-8 w-8 shrink-0 drop-shadow-[0_2px_8px_rgba(58,119,229,0.35)]" />
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15px] font-bold tracking-tight text-d-text-primary">Quant X</span>
              <span className="block text-[9.5px] font-medium uppercase tracking-[0.16em] text-d-text-muted">Trading OS</span>
            </span>
          )}
        </Link>
      </div>

      {/* New Chat — primary action */}
      <div className="shrink-0 px-2 pt-3">
        <Link
          href="/copilot"
          title="New Chat"
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-sm border border-line bg-surface-2 font-medium text-d-text-secondary transition-colors duration-instant ease-out hover:border-wrap-line hover:text-d-text-primary',
            collapsed ? 'h-10' : 'px-3 py-2.5 text-[13px]',
          )}
        >
          <Plus className={collapsed ? 'h-[22px] w-[22px]' : 'h-4 w-4'} /> {!collapsed && 'New Chat'}
        </Link>
      </div>

      {/* Search — the command palette's visible affordance.
          ⌘K was previously a hidden keystroke with no UI anywhere, so the
          palette effectively did not exist for anyone who had not been told
          about it. A keyboard-first tool still has to advertise its keys. */}
      <div className="shrink-0 px-2 pt-1.5">
        <button
          type="button"
          onClick={onSearch}
          title="Search — ⌘K"
          aria-keyshortcuts="Meta+K Control+K"
          className={cn(
            'flex w-full items-center gap-2 rounded-sm text-d-text-muted transition-colors duration-instant ease-out hover:bg-surface-2 hover:text-d-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
            collapsed ? 'h-10 justify-center' : 'px-2.5 py-2 text-[13px]',
          )}
        >
          <Search className={collapsed ? 'h-[19px] w-[19px]' : 'h-4 w-4 shrink-0'} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Search</span>
              <kbd className={`rounded border border-line px-1 py-px text-[10px] leading-4 ${MONO}`}>⌘K</kbd>
            </>
          )}
        </button>
      </div>

      {/* top nav + grouped feature nav */}
      <NavList pathname={pathname} collapsed={collapsed} />

      {/* History — recent chats, date-grouped, active-highlighted, delete on hover */}
      {/* First load: show a skeleton so History doesn't silently pop in. */}
      {/* The skeleton keeps its own "History" heading. Without it, three bare
          grey bars appear directly under the last nav group and read as nav
          items that failed to load, rather than as history still arriving. A
          skeleton has to be recognisable as the thing it is standing in for. */}
      {!collapsed && convLoading && conversations.length === 0 && (
        <div className="shrink-0 space-y-2 border-t border-line px-4 py-3">
          <div className="text-[12px] font-semibold text-d-text-secondary">History</div>
          <div aria-hidden="true" className="space-y-2">
            <Skeleton h="14px" />
            <Skeleton h="14px" />
          </div>
          <span className="sr-only">Loading recent chats…</span>
        </div>
      )}

      {!collapsed && conversations.length > 0 && (
        <nav aria-label="History" className="min-h-0 max-h-[34%] flex-shrink overflow-y-auto border-t border-line px-2 py-2">
          <div className="px-2 pb-1 pt-1 text-[12px] font-semibold text-d-text-secondary">History</div>
          {groupByDate(conversations).map(([label, list]) => (
            <div key={label} className="mb-1">
              <div className="px-2 pb-1 pt-1.5 text-[11px] font-medium text-d-text-muted">{label}</div>
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
                        'flex items-center gap-2 rounded-full py-1.5 pl-2 pr-7 text-[12px] transition-colors',
                        active ? 'bg-primary/10 text-primary' : 'text-d-text-secondary hover:bg-wrap-hover hover:text-d-text-primary',
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
        {/* Upgrade pill — glossy blue FintechX CTA (gradient + gloss bevel) */}
        <div className="border-t border-line p-2">
          <Link
            href="/pricing"
            title="Upgrade"
            className={cn(
              'cta-gloss flex items-center gap-2 rounded-full bg-gradient-cta font-semibold text-primary-foreground transition-opacity hover:opacity-90',
              collapsed ? 'h-10 justify-center' : 'px-3 py-2.5 text-[13px]',
            )}
          >
            <Sparkles className={collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4'} aria-hidden="true" />
            {!collapsed && 'Upgrade'}
          </Link>
        </div>

        {/* collapse / expand toggle — bottom */}
        <div className="border-t border-line p-2">
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Open menu' : 'Collapse menu'}
            aria-pressed={collapsed}
            aria-controls="app-sidebar"
            className={cn(
              'flex w-full items-center gap-2.5 rounded-full text-d-text-secondary transition-colors hover:bg-wrap-hover hover:text-d-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
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

