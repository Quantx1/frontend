'use client'

/**
 * /alerts — Alerts Studio (WP-ALERTS-CALC).
 *
 * Un-buries the already-built event×channel preference grid and surfaces the
 * previously-unused `api.alerts.test()` (per-channel test send) and
 * `api.alerts.bulkUpdate()` (enable/mute every event at once).
 *
 * THREE distinct alert systems exist in the product — they stay VISUALLY
 * SEPARATE here and share NO backend:
 *   (a) event×channel preferences  → this page (AlertPreferencesGrid + channels)
 *   (b) per-symbol price thresholds → /watchlist (api.watchlist.updateAlerts)
 *   (c) per-signal push toggles     → /signals/[id]  (persistAlert)
 *
 * Pro gate: `alert_studio` is a Pro feature. Free / unauth users get an
 * explicit paywall state — never the grid's raw 403.
 */

import { useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import Link from 'next/link'
import {
  Bell,
  Send,
  Mail,
  MessageCircle,
  Lock,
  Loader2,
  Check,
  Sparkles,
  ArrowUpRight,
  Radio,
} from '@/lib/icons'

import { useAuth } from '@/contexts/AuthContext'
import { api, handleApiError } from '@/lib/api'
import { AppShell } from '@/components/shell/AppShell'
import {
  Button,
  Badge,
  EmptyState,
  PageHeader,
  StatTile,
  toast,
} from '@/components/foundation'
import { AlertPreferencesGrid } from '@/components/settings/AlertPreferencesGrid'

type Channel = 'push' | 'telegram' | 'whatsapp' | 'email'

const CHANNEL_META: Record<
  Channel,
  { label: string; icon: typeof Bell; hint: string }
> = {
  push: { label: 'Push', icon: Bell, hint: 'In-app + browser notifications' },
  telegram: { label: 'Telegram', icon: Send, hint: 'Instant messages to your Telegram' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, hint: 'Daily digest + urgent alerts' },
  email: { label: 'Email', icon: Mail, hint: 'Fills, drawdown + weekly review' },
}

const ALL_CHANNELS: Channel[] = ['push', 'telegram', 'whatsapp', 'email']

/** Card surface — xAI flat panel. */
const CARD = 'rounded-sm border border-line bg-wrap p-4'

export default function AlertsStudioPage() {
  const { user, loading: authLoading } = useAuth()

  // Tier → feature access. `alert_studio` is Pro; admins bypass. We branch on
  // the server-computed feature map so the paywall never shows the raw 402.
  const { data: tierData, isLoading: tierLoading } = useSWR(
    user ? 'user_tier' : null,
    () => api.user.getTier(),
    { revalidateOnFocus: false },
  )
  const hasStudio = Boolean(tierData?.features?.alert_studio || tierData?.is_admin)

  // ── Auth + tier gates ──────────────────────────────────────────────
  if (authLoading || (user && tierLoading)) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell>
        <div className="p-4 md:p-6">
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title="Sign in to open Alerts Studio"
            description="Route every signal, fill, and market move to push, Telegram, WhatsApp or email — per event."
            action={
              <a href="/login">
                <Button>Sign in</Button>
              </a>
            }
          />
        </div>
      </AppShell>
    )
  }

  // Explicit paywall — NOT the grid's raw 403. Free users see the value prop.
  if (!hasStudio) {
    return (
      <AppShell>
        <div className="p-4 md:p-6">
          <PageHeader
            eyebrow="Notifications"
            title="Alerts Studio"
            description="Per-event routing across every channel."
          />
          <div className="mt-6">
            <EmptyState
              icon={<Lock className="h-6 w-6" />}
              title="Alerts Studio is a Pro feature"
              description={
                <>
                  Upgrade to Pro to route each event — signals, fills, drawdown, F&amp;O
                  triggers — to push, Telegram, WhatsApp or email, with per-channel test
                  sends and bulk controls. Per-symbol price alerts stay free on your{' '}
                  <Link href="/watchlist" className="text-primary hover:underline">
                    watchlist
                  </Link>
                  .
                </>
              }
              action={
                <a href="/pricing">
                  <Button variant="ai">
                    <Sparkles className="h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                </a>
              }
            />
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AlertsStudio />
    </AppShell>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Pro-only studio body — only mounted once access is confirmed, so the
// preferences fetch (and the grid's own fetch) never fire for Free users.
// ─────────────────────────────────────────────────────────────────────

function AlertsStudio() {
  // Shares the 'alerts_preferences' SWR key with AlertPreferencesGrid — SWR
  // dedupes, so both read one fetch. Bulk actions push the fresh payload back
  // into the shared cache so the grid re-renders in lockstep.
  const { data, error, isLoading } = useSWR(
    'alerts_preferences',
    () => api.alerts.preferences(),
    { revalidateOnFocus: false },
  )

  const [testing, setTesting] = useState<Channel | null>(null)
  const [bulkBusy, setBulkBusy] = useState<'enable' | 'mute' | null>(null)

  const channels = data?.channels ?? []
  const events = data?.events ?? []
  const connectedCount = channels.filter((c) => c.connected).length

  async function sendTest(channel: Channel) {
    setTesting(channel)
    try {
      const res = await api.alerts.test(channel)
      if (res.delivered) {
        toast.success(`Test sent to ${CHANNEL_META[channel].label}`, {
          description: res.detail || 'Check the channel for the test alert.',
        })
      } else {
        toast.error(`${CHANNEL_META[channel].label} not delivered`, {
          description: res.detail || 'Connect the channel in Settings, then retry.',
        })
      }
    } catch (e) {
      toast.error('Test failed', { description: handleApiError(e) })
    } finally {
      setTesting(null)
    }
  }

  async function bulk(mode: 'enable' | 'mute') {
    if (!events.length) return
    setBulkBusy(mode)
    const on = mode === 'enable'
    // Full event×channel matrix — one entry per event, every channel set.
    const matrix: Record<string, Record<string, boolean>> = {}
    for (const ev of events) {
      matrix[ev.key] = { push: on, telegram: on, whatsapp: on, email: on }
    }
    try {
      const res = await api.alerts.bulkUpdate(matrix)
      // Push fresh data into the shared cache → grid + channels re-render.
      await globalMutate('alerts_preferences', res, false)
      toast.success(on ? 'All events enabled' : 'All events muted', {
        description: on
          ? 'Every event routes to all channels. Fine-tune per cell below.'
          : 'No alerts will be sent until you re-enable events.',
      })
    } catch (e) {
      toast.error('Bulk update failed', { description: handleApiError(e) })
    } finally {
      setBulkBusy(null)
    }
  }

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Notifications · Pro"
        title="Alerts Studio"
        description="Route every event to the right channel. Test a channel, tune per-event, or set them all at once."
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* ── Summary tiles ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Event types" value={events.length} />
          <StatTile
            label="Channels live"
            value={`${connectedCount}/${ALL_CHANNELS.length}`}
            tone={connectedCount > 0 ? 'up' : 'neutral'}
          />
          <StatTile label="Delivery" value="Real-time" />
          <StatTile label="Scope" value="Per event" />
        </div>

        {/* ── Channels panel — status + test send (api.alerts.test) ── */}
        <section className={CARD}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-1.5 font-medium text-d-text-primary">
                <Radio className="h-4 w-4 text-d-text-muted" />
                Channels
              </h2>
              <p className="mt-0.5 text-xs text-d-text-muted">
                Send a test to confirm delivery. Connect channels in{' '}
                <Link href="/settings#notifications" className="text-primary hover:underline">
                  Settings
                </Link>
                .
              </p>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-d-text-muted">Loading channels…</p>
          ) : error ? (
            <p className="text-sm text-down">Failed to load channels: {handleApiError(error)}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {ALL_CHANNELS.map((ch) => {
                const meta = CHANNEL_META[ch]
                const Icon = meta.icon
                const status = channels.find((c) => c.channel === ch)
                const connected = Boolean(status?.connected)
                const busy = testing === ch
                return (
                  <div
                    key={ch}
                    className="flex items-center justify-between gap-3 rounded-sm border border-line bg-main p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line bg-wrap text-d-text-secondary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-d-text-primary">{meta.label}</span>
                          <Badge tone={connected ? 'up' : 'muted'}>
                            {connected ? 'Connected' : 'Not connected'}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-d-text-muted">
                          {status?.detail || meta.hint}
                        </p>
                      </div>
                    </div>
                    {connected ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => sendTest(ch)}
                        disabled={busy}
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        {busy ? 'Sending…' : 'Send test'}
                      </Button>
                    ) : (
                      <Link
                        href="/settings#notifications"
                        className="shrink-0 text-[11px] text-primary hover:underline"
                      >
                        Connect →
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Bulk controls — api.alerts.bulkUpdate ── */}
        <section className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-medium text-d-text-primary">Bulk controls</h2>
              <p className="mt-0.5 text-xs text-d-text-muted">
                Set every event across all channels at once, then fine-tune below.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => bulk('enable')}
                disabled={bulkBusy !== null || events.length === 0}
              >
                {bulkBusy === 'enable' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Enable all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => bulk('mute')}
                disabled={bulkBusy !== null || events.length === 0}
              >
                {bulkBusy === 'mute' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Bell className="h-3.5 w-3.5" />
                )}
                Mute all
              </Button>
            </div>
          </div>
        </section>

        {/* ── Event × channel grid (built, self-fetches; shares SWR key) ── */}
        <section>
          <AlertPreferencesGrid />
        </section>

        {/* ── Per-symbol price alerts — a SEPARATE system; link, don't rebuild ── */}
        <section className={`${CARD} flex flex-wrap items-center justify-between gap-3`}>
          <div className="min-w-0">
            <h2 className="font-medium text-d-text-primary">Per-symbol price alerts</h2>
            <p className="mt-0.5 text-xs text-d-text-muted">
              Above / below price thresholds are set per symbol on your watchlist — a
              separate system from the event routing above.
            </p>
          </div>
          <Link href="/watchlist">
            <Button variant="secondary" size="sm">
              Open watchlist
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </section>
      </div>
    </div>
  )
}
