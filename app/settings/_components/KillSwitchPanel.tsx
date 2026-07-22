'use client'

import { useState } from 'react'
import { AlertCircle, Loader2 } from '@/lib/icons'
import { api } from '@/lib/api'
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
  const active = !!profile?.kill_switch_active

  const fire = async () => {
    setFiring(true)
    try {
      await api.trades.killSwitch()
      await onRefreshProfile()
      setMessage({ type: 'success', text: 'Kill switch activated — auto-trading paused.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to activate kill switch.' })
    } finally {
      setFiring(false)
    }
  }

  const clear = async () => {
    setFiring(true)
    try {
      await api.user.updateProfile({ kill_switch_active: false })
      await onRefreshProfile()
      setMessage({ type: 'success', text: 'Kill switch cleared.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to clear kill switch.' })
    } finally {
      setFiring(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <EyebrowMono className="mb-2">Kill switch</EyebrowMono>
        <h2 className="font-display text-xl font-semibold text-d-text-primary mb-1">Kill switch</h2>
        <p className="text-sm text-d-text-muted">
          Instantly pause auto-trading + cancel pending orders. Open positions are <strong>not</strong> liquidated —
          close them manually from the Portfolio page.
        </p>
      </div>

      <div
        className={`rounded-sm border bg-wrap p-5 border-l-2 ${
          active ? 'border-l-down bg-down/[0.05] border-down/30' : 'border-l-up border-line'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <EyebrowMono>Status</EyebrowMono>
            <p className={`text-[22px] font-semibold mt-1 ${active ? 'text-down' : 'text-up'}`}>
              {active ? 'ACTIVE — trading paused' : 'Armed'}
            </p>
          </div>
          {active ? (
            <button
              onClick={clear}
              disabled={firing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium glass-control text-d-text-primary rounded-full transition-colors disabled:opacity-50"
            >
              {firing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Clear kill switch
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={firing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold glass-control-danger text-down rounded-full active:scale-[0.98] transition-colors disabled:opacity-50"
            >
              {firing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
              Fire kill switch
            </button>
          )}
        </div>
      </div>

      <div className="rounded-sm border border-line bg-wrap p-5">
        <EyebrowMono className="mb-3">Auto-resume timer</EyebrowMono>
        <p className="text-[12px] text-d-text-muted mb-3">
          Optional: auto-clear the kill switch after N hours so you don&apos;t forget to re-arm. Leaving it off keeps
          the switch active until you manually clear it.
        </p>
        <div className="flex items-center gap-2">
          {[4, 12, 24, 48].map((h) => (
            <button
              key={h}
              onClick={() => setPauseHours(h)}
              className={`px-3 py-1.5 text-[11px] rounded-sm transition-colors ${
                pauseHours === h
                  ? 'glass-control-accent'
                  : 'glass-control text-d-text-muted hover:text-d-text-primary'
              }`}
            >
              {h}h
            </button>
          ))}
          <span className="text-[11px] text-d-text-muted ml-2">
            (timer wiring lands with scheduler PR)
          </span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={fire}
        title="Fire kill switch?"
        destructive
        confirmLabel="Fire kill switch"
        body="This halts all auto-trading and cancels pending orders. Open positions are not liquidated — close them manually from the Portfolio page."
      />
    </div>
  )
}
