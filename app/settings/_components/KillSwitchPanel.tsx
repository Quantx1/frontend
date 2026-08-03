'use client'

/**
 * KillSwitchPanel — the highest-stakes control in the product.
 *
 * ── Two defects fixed here (2026-08-02) ─────────────────────────────────────
 *
 * 1. THE COPY SAID THE OPPOSITE OF WHAT THE BUTTON DOES.
 *    This panel told the user "Open positions are NOT liquidated — close them
 *    manually from the Portfolio page." `POST /api/trades/kill-switch`
 *    (backend/backend/api/trades_routes.py:658) is documented as "close all
 *    positions and pause trading" and iterates every active position calling
 *    close_position / close_trade_record. Someone firing this expecting a soft
 *    halt got their entire book flattened.
 *
 *    The control is now named for what it does — FLATTEN — and the copy says so
 *    in both the panel and the confirm dialog.
 *
 * 2. THE PARTIAL-FAILURE PAYLOAD WAS THROWN AWAY.
 *    The endpoint attempts each position independently and returns
 *    `{ success, message, positions_closed, positions_failed[] }`, where
 *    positions_failed is a list of SYMBOLS. The panel replaced all of it with a
 *    hardcoded "Kill switch activated". When 3 of 5 closes failed the user was
 *    never told which 3 they were still exposed to — the single piece of
 *    information that determines what they do next.
 *
 *    The result is now rendered verbatim, per symbol, and persists on screen
 *    rather than living in a toast.
 */

import { useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle, Loader2 } from '@/lib/icons'
import { api, type KillSwitchResult } from '@/lib/api'
import { ConfirmDialog, EyebrowMono } from '@/components/foundation'

type Message = { type: 'success' | 'error'; text: string } | null

export default function KillSwitchPanel({
  profile,
  pauseHours,
  setPauseHours,
  onRefreshProfile,
  setMessage,
}: {
  profile: any
  pauseHours: number
  setPauseHours: (n: number) => void
  onRefreshProfile: () => Promise<void>
  setMessage: (m: Message) => void
}) {
  const [firing, setFiring] = useState(false)
  // 2026-06-12 — deliberate modal confirm (Cancel takes focus), never
  // native confirm() which accepts on a stray Enter keypress.
  const [confirmOpen, setConfirmOpen] = useState(false)
  /** Last result, kept on screen. A partial liquidation is not toast-sized news. */
  const [result, setResult] = useState<KillSwitchResult | null>(null)
  const active = !!profile?.kill_switch_active

  const fire = async () => {
    setFiring(true)
    setResult(null)
    try {
      const res = await api.trades.killSwitch()
      setResult(res)
      await onRefreshProfile()
      // The server already composed an accurate sentence naming the failures.
      // Prefer it over anything invented here.
      setMessage({
        type: res.success ? 'success' : 'error',
        text: res.message || 'Kill switch fired.',
      })
    } catch {
      setMessage({
        type: 'error',
        text: 'Could not reach the kill switch. Positions may still be open — check Portfolio or your broker.',
      })
    } finally {
      setFiring(false)
    }
  }

  const clear = async () => {
    setFiring(true)
    try {
      await api.user.updateProfile({ kill_switch_active: false })
      setResult(null)
      await onRefreshProfile()
      setMessage({ type: 'success', text: 'Kill switch cleared — trading re-armed.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to clear kill switch.' })
    } finally {
      setFiring(false)
    }
  }

  const failed = result?.positions_failed ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <EyebrowMono className="mb-2">Kill switch</EyebrowMono>
        <h2 className="mb-1 font-display text-xl font-semibold text-d-text-primary">Kill switch</h2>
        <p className="text-sm text-d-text-muted">
          Blocks new orders, turns AutoPilot off, cancels pending orders, and{' '}
          <strong className="text-d-text-secondary">closes every open position</strong> at market.
          This is a flatten, not a pause — it cannot be undone from here.
        </p>
      </div>

      <div
        className={`rounded-xl border border-l-2 bg-wrap p-5 ${
          active ? 'border-down/30 border-l-down bg-down/[0.05]' : 'border-line border-l-up'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <EyebrowMono>Status</EyebrowMono>
            <p className={`mt-1 text-[22px] font-semibold ${active ? 'text-down' : 'text-up'}`}>
              {active ? 'ACTIVE — trading halted' : 'Armed'}
            </p>
          </div>
          {active ? (
            <button
              onClick={clear}
              disabled={firing}
              className="glass-control inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium text-d-text-primary transition-colors disabled:opacity-50"
            >
              {firing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Clear kill switch
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={firing}
              className="glass-control-danger inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold text-down transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              {firing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              Flatten &amp; halt
            </button>
          )}
        </div>
      </div>

      {/* Outcome. A partial liquidation is the state the user most needs to see,
          and it must not disappear with a toast. */}
      {result && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl border p-5 ${
            result.success ? 'border-line bg-wrap' : 'border-warning/40 bg-warning/[0.06]'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {result.success ? (
              <CheckCircle className="mt-px h-4 w-4 shrink-0 text-up" />
            ) : (
              <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-warning" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-d-text-primary">{result.message}</p>

              {typeof result.positions_closed === 'number' && (
                <p className="mt-1 text-xs text-d-text-muted">
                  {result.positions_closed} position{result.positions_closed === 1 ? '' : 's'} closed.
                </p>
              )}

              {failed.length > 0 && (
                <div className="mt-3">
                  <EyebrowMono className="text-[10px] text-warning">
                    Still open — close manually
                  </EyebrowMono>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {failed.map((sym) => (
                      <span
                        key={sym}
                        className="rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 font-mono text-[11px] text-warning"
                      >
                        {sym}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-d-text-secondary">
                    New orders are already blocked, so nothing can re-open. Close these from
                    Portfolio or directly with your broker.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-line bg-wrap p-5">
        <EyebrowMono className="mb-3">Auto-resume timer</EyebrowMono>
        <p className="mb-3 text-[12px] text-d-text-muted">
          Optional: auto-clear the kill switch after N hours so you don&apos;t forget to re-arm.
          Leaving it off keeps the switch active until you manually clear it.
        </p>
        <div className="flex items-center gap-2">
          {[4, 12, 24, 48].map((h) => (
            <button
              key={h}
              onClick={() => setPauseHours(h)}
              className={`rounded-lg px-3 py-1.5 text-[11px] transition-colors ${
                pauseHours === h
                  ? 'glass-control-accent'
                  : 'glass-control text-d-text-muted hover:text-d-text-primary'
              }`}
            >
              {h}h
            </button>
          ))}
          <span className="ml-2 text-[11px] text-d-text-muted">
            (timer wiring lands with scheduler PR)
          </span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={fire}
        title="Flatten the book and halt trading?"
        destructive
        confirmLabel="Flatten & halt"
        body="Every open position will be CLOSED at market, pending orders cancelled, AutoPilot turned off and new orders blocked. Positions closed this way cannot be reopened from here."
      />
    </div>
  )
}
