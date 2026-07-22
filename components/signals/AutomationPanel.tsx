'use client'

/**
 * AutomationPanel — trade the signal books automatically (2026-07-21).
 *
 * Surfaces the EXISTING AutoPilot machinery right where the signals live:
 *   · the bot's on/off state + mode (paper = virtual book, free tier;
 *     live = real broker money, Pro+ + connected broker + suitability)
 *   · per-stream toggles for the swing + momentum signal books with a
 *     capital % allocation each (server validates the sum ≤ 100)
 *   · honest gating copy — live automation additionally sits behind the
 *     fail-closed SEBI algo flags (empanelment); paper is always allowed.
 *
 * Nothing here fabricates execution: toggles drive /api/auto-trader and
 * /api/autopilot/streams, the same backend the /autopilot console uses.
 */

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { ArrowRight, Bot, Loader2 } from '@/lib/icons'

import { Badge, Button } from '@/components/foundation'
import { api } from '@/lib/api'
import { MONO } from '@/lib/tokens'

const SIGNAL_STREAMS = [
  { key: 'swing', label: 'Alpha Picks' },
  { key: 'momentum', label: 'Momentum Picks' },
] as const

export function AutomationPanel() {
  const status = useSWR('autotrader:status', () => api.autoTrader.status().catch(() => null), {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  })
  const streams = useSWR('autopilot:streams', () => api.autopilotStreams.list().catch(() => null), {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  })
  const [busy, setBusy] = useState<string | null>(null)

  const s = status.data
  const st = streams.data
  const enabled = Boolean(s?.enabled)
  const mode = s?.mode ?? 'paper'
  const tierAllows = st?.tier_allows_autopilot ?? false

  const toggleBot = async () => {
    setBusy('bot')
    try {
      await api.autoTrader.toggle(!enabled, mode)
      await status.mutate()
    } catch {
      /* server said no — status refetch shows the truth */
      await status.mutate()
    } finally {
      setBusy(null)
    }
  }

  const toggleStream = async (name: string, cur: { enabled: boolean; allocated_capital_pct: number } | undefined) => {
    setBusy(name)
    try {
      await api.autopilotStreams.update(name, {
        enabled: !(cur?.enabled ?? false),
        // First enable defaults to a conservative 10% slice; keep the
        // user's prior allocation on re-enable.
        allocated_capital_pct: cur?.allocated_capital_pct || 10,
      })
      await streams.mutate()
    } catch {
      await streams.mutate()
    } finally {
      setBusy(null)
    }
  }

  const streamState = (name: string) => st?.streams.find((x) => x.stream === name && !x.user_strategy_id)

  return (
    <div className="lg-surface rounded-[20px] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-ai" />
          <span className="text-[13px] font-semibold text-d-text-primary">Automate these signals</span>
          <Badge tone={enabled ? 'up' : 'muted'}>
            {status.isLoading ? '…' : enabled ? `Bot on · ${mode}` : 'Bot off'}
          </Badge>
        </div>
        <Link
          href="/autopilot"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-d-text-primary underline-offset-4 hover:underline"
        >
          Full AutoPilot console <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="mb-3 text-[11.5px] leading-relaxed text-d-text-secondary">
        AutoPilot executes the signal books on your own account with regime sizing, a VIX overlay and
        hard caps. <span className="text-d-text-primary">Paper mode is free</span> — a virtual ₹10L book.
        Live mode needs Pro, your connected broker and the suitability check; live algo execution stays
        off until the SEBI empanelment flags are set.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {/* Master toggle */}
        <div className="rounded-xl border border-line bg-surface-2/40 p-3">
          <div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">Trading bot</div>
          <Button
            variant={enabled ? 'secondary' : 'ai'}
            size="sm"
            className="w-full"
            onClick={toggleBot}
            disabled={busy === 'bot' || status.isLoading}
          >
            {busy === 'bot' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : enabled ? 'Pause bot' : `Start bot (${mode})`}
          </Button>
        </div>

        {/* Signal-book streams */}
        {SIGNAL_STREAMS.map(({ key: name, label }) => {
          const cur = streamState(name)
          const on = Boolean(cur?.enabled)
          return (
            <div key={name} className="rounded-xl border border-line bg-surface-2/40 p-3">
              <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
                <span>{label}</span>
                {on && (
                  <span className={MONO}>{cur?.allocated_capital_pct ?? 0}% capital</span>
                )}
              </div>
              <Button
                variant={on ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full"
                onClick={() => toggleStream(name, cur)}
                disabled={busy === name || streams.isLoading || (!on && !tierAllows)}
              >
                {busy === name ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : on ? 'On — disable' : !tierAllows ? 'Pro required' : 'Enable stream'}
              </Button>
            </div>
          )
        })}
      </div>

      {st != null && (
        <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
          Total allocated {st.total_allocated_pct}% · tier {st.tier}
          {!tierAllows && ' · streams unlock on Pro'}
        </p>
      )}
    </div>
  )
}
