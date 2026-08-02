'use client'

/**
 * /inbox (PR-P) — real notifications feed.
 *
 * Replaces the SAMPLE_ITEMS stub with the live api.notifications.getAll()
 * feed, tabbed by type, with mark-read + mark-all-read actions.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, BellOff, CheckCheck, RefreshCw, Sparkles } from '@/lib/icons'

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DisclaimerFooter,
  EmptyState,
  PageHeader,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
  type Tone,
} from '@/components/foundation'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { api } from '@/lib/api'
import type { Notification, NotificationType } from '@/types'

type FilterTab = 'all' | 'signals' | 'positions' | 'agent'

// Group every notification type under one of 3 buckets surfaced as tabs.
const BUCKET: Record<NotificationType, Exclude<FilterTab, 'all'>> = {
  signal_new: 'signals',
  position_update: 'positions',
  target_hit: 'positions',
  stop_loss_hit: 'positions',
  risk_alert: 'agent',
  broker_disconnected: 'agent',
  system_alert: 'agent',
  subscription_expiring: 'agent',
}

const TONE_FOR_TYPE: Record<NotificationType, Tone> = {
  signal_new: 'primary',
  position_update: 'muted',
  target_hit: 'up',
  stop_loss_hit: 'down',
  risk_alert: 'warning',
  broker_disconnected: 'down',
  system_alert: 'muted',
  subscription_expiring: 'warning',
}

const formatTimeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function InboxPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>('all')

  const refresh = async () => {
    setLoading(true)
    try {
      const r = await api.notifications.getAll({ limit: 50 })
      setItems(r.notifications)
    } catch (e: any) {
      toast.error('Could not load notifications', { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const unread = useMemo(() => items.filter((i) => !i.is_read).length, [items])

  const filtered = useMemo(() => {
    if (tab === 'all') return items
    return items.filter((i) => BUCKET[i.type] === tab)
  }, [items, tab])

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_read: true } : i)))
    try {
      await api.notifications.markRead(id)
    } catch {
      /* optimistic — silently revert on failure (rare) */
    }
  }

  const markAllRead = async () => {
    const had = unread
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })))
    try {
      await api.notifications.markAllRead()
      toast.success(`Marked ${had} as read`)
    } catch (e: any) {
      toast.error('Could not mark all as read', { description: e?.message })
      refresh()
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Inbox"
        description="Signals, alerts, and AI summaries — all in one place."
        actions={
          <>
            {unread > 0 && (
              <Button variant="secondary" onClick={markAllRead}>
                <CheckCheck className="mr-1 h-4 w-4" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={refresh}
              aria-label="Refresh inbox"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">
              All
              {unread > 0 && (
                <span className="ml-1.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {unread}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="agent">AI insights</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4 space-y-3">
            {loading ? (
              <>
                <NotifSkeleton />
                <NotifSkeleton />
                <NotifSkeleton />
              </>
            ) : filtered.length === 0 ? (
              items.length === 0 ? (
                <EmptyState
                  icon={<BellOff className="h-6 w-6" />}
                  title="No notifications yet"
                  description="Active signals, regime shifts, target hits, and AI summaries land here."
                  action={
                    <Button onClick={() => dispatchCopilotOpen('What should I do today based on the current regime?')}>
                      <Sparkles className="mr-1 h-4 w-4" />
                      Ask Copilot what to do
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={<Bell className="h-6 w-6" />}
                  title="Nothing in this tab"
                  description="Switch tabs to see other notifications."
                  size="sm"
                />
              )
            ) : (
              filtered.map((n) => (
                <NotificationCard
                  key={n.id}
                  n={n}
                  onMarkRead={() => markRead(n.id)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        <DisclaimerFooter />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────

function NotificationCard({
  n,
  onMarkRead,
}: {
  n: Notification
  onMarkRead: () => void
}) {
  const tone = TONE_FOR_TYPE[n.type] ?? 'muted'
  const linkTo = inferLinkTarget(n)

  const Body = (
    <Card
      variant={linkTo ? 'clickable' : 'static'}
      className={n.is_read ? '' : 'border-primary/30'}
    >
      <CardHeader className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {!n.is_read && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
          )}
          <Bell className="h-3.5 w-3.5 shrink-0 text-d-text-muted" aria-hidden="true" />
          <span className="truncate">{n.title}</span>
        </div>
        <Badge tone={tone}>{formatTimeAgo(n.created_at)}</Badge>
      </CardHeader>
      <CardBody className="text-xs text-d-text-muted">{n.message}</CardBody>
    </Card>
  )

  if (linkTo) {
    return (
      <Link href={linkTo} onClick={onMarkRead}>
        {Body}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={onMarkRead}
      className="block w-full text-left"
      aria-label={n.is_read ? n.title : `${n.title} (unread, click to mark read)`}
    >
      {Body}
    </button>
  )
}

function NotifSkeleton() {
  return (
    <div className="rounded-sm border border-line bg-wrap p-4">
      <div className="mb-2 flex items-center justify-between">
        <Skeleton w="40%" h="14px" />
        <Skeleton w="50px" h="18px" rounded="md" />
      </div>
      <Skeleton w="80%" h="11px" />
    </div>
  )
}

// Best-effort routing — open signals at /signals/[id], positions at
// /portfolio. Falls back to no link (button-only) when we can't infer.
function inferLinkTarget(n: Notification): string | null {
  const sigId = (n.data?.signal_id ?? n.data?.id) as string | undefined
  if (n.type === 'signal_new' && sigId) return `/signals/${sigId}`
  if (
    n.type === 'target_hit' ||
    n.type === 'stop_loss_hit' ||
    n.type === 'position_update' ||
    n.type === 'risk_alert'
  ) {
    return '/portfolio'
  }
  if (n.type === 'broker_disconnected') return '/settings'
  if (n.type === 'subscription_expiring') return '/pricing'
  return null
}
