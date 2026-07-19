'use client'

/**
 * AlertPreferencesGrid (WIRING #2 · 2026-05-31).
 *
 * Renders a per-event × per-channel grid using `api.alerts.preferences()`.
 * Picks up every event type the backend ships, including the 8 new O.7
 * F&O / drawdown events (max_pain_shift, oi_spike, position_unprotected,
 * adjustment_recommended, vix_regime_change, pcr_extreme,
 * portfolio_drawdown, cron_failed) without code changes when new
 * events are added.
 *
 * Each toggle PATCHes /api/alerts/preferences with optimistic UI.
 */

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Loader2 } from '@/lib/icons'

import { api, handleApiError } from '@/lib/api'

const CHANNELS = ['push', 'telegram', 'whatsapp', 'email'] as const
type Channel = (typeof CHANNELS)[number]


export function AlertPreferencesGrid() {
  const { data, error, isLoading, mutate } = useSWR(
    'alerts_preferences',
    () => api.alerts.preferences(),
    { revalidateOnFocus: false },
  )
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [errMsg, setErrMsg] = useState<string | null>(null)

  async function onToggle(event: string, channel: Channel, current: boolean) {
    const key = `${event}_${channel}`
    setPending((p) => new Set(p).add(key))
    setErrMsg(null)
    try {
      const res = await api.alerts.toggle(event, channel, !current)
      // Optimistic update via SWR
      await mutate(res, false)
    } catch (e) {
      setErrMsg(handleApiError(e))
    } finally {
      setPending((p) => {
        const next = new Set(p)
        next.delete(key)
        return next
      })
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-down/30 bg-down/5 p-4 text-sm text-down">
        Failed to load preferences: {handleApiError(error)}
      </div>
    )
  }
  if (isLoading || !data) {
    return (
      <div className="rounded-lg border border-d-border bg-d-bg-card p-4 text-sm text-d-text-muted">
        Loading event-level preferences…
      </div>
    )
  }

  const events = data.events ?? []
  const prefs = data.preferences ?? {}
  const channels = data.channels ?? []

  return (
    <div className="rounded-lg border border-d-border bg-d-bg-card p-4">
      <div className="mb-3">
        <h3 className="font-medium text-white">Event-level preferences</h3>
        <p className="mt-1 text-xs text-d-text-muted">
          Choose channels per event. Defaults pre-selected for high-urgency events
          (e.g. unprotected position, drawdown alerts).
          {channels.length > 0 && (
            <>
              {' '}Connected channels: {channels.filter((c) => c.connected).map((c) => c.channel).join(', ') || 'none'}.
            </>
          )}
        </p>
      </div>

      {errMsg && (
        <div className="mb-3 rounded-md border border-down/30 bg-down/5 px-3 py-2 text-xs text-down">
          {errMsg}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-d-border text-[10px] uppercase tracking-wider text-d-text-muted">
              <th className="py-2 pr-2 text-left">Event</th>
              {CHANNELS.map((ch) => (
                <th key={ch} className="px-2 py-2 text-center capitalize">{ch}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-d-border/40">
            {events.map((ev) => {
              const row = prefs[ev.key] || {}
              return (
                <tr key={ev.key}>
                  <td className="py-2 pr-2">
                    <div className="font-medium text-white">{ev.label}</div>
                    <div className="text-[10px] text-d-text-muted">{ev.description}</div>
                  </td>
                  {CHANNELS.map((ch) => {
                    const on = !!row[ch]
                    const key = `${ev.key}_${ch}`
                    const busy = pending.has(key)
                    return (
                      <td key={ch} className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => onToggle(ev.key, ch, on)}
                          disabled={busy}
                          className={`mx-auto flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                            on ? 'bg-primary' : 'bg-white/[0.04]'
                          } ${busy ? 'opacity-50' : ''}`}
                          aria-label={`${ev.label} on ${ch}`}
                        >
                          {busy ? (
                            <Loader2 className="mx-auto h-3 w-3 animate-spin text-white" />
                          ) : (
                            <div
                              className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
                                on ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                            />
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[10px] text-d-text-muted">
        {events.length} event types · {CHANNELS.length} channels.
        Auto-syncs new event types as the backend adds them.
      </p>
    </div>
  )
}
