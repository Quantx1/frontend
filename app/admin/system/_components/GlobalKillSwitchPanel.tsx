'use client'

/* PR 47 — Global kill switch.
 *
 * Platform-wide trading halt. Once active, every order-placing path
 * stops until an admin clears it. Distinct from the per-user kill
 * switch in /settings.
 */

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle, Loader2, Power, ShieldAlert } from '@/lib/icons'
import { api, handleApiError } from '@/lib/api'
import { ConfirmDialog } from '@/components/foundation'

type KillSwitchState = Awaited<ReturnType<typeof api.admin.getGlobalKillSwitch>>

export default function GlobalKillSwitchPanel() {
  const [state, setState] = useState<KillSwitchState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  // 2026-06-12 — deliberate modal confirm (Cancel takes focus), never
  // native confirm() which accepts on a stray Enter keypress.
  const [confirmActivate, setConfirmActivate] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const r = await api.admin.getGlobalKillSwitch()
      setState(r)
      setReason(r.reason || '')
      setError(null)
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const flip = async (nextActive: boolean) => {
    if (nextActive && !reason.trim()) {
      setError('Reason is required when activating.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const r = await api.admin.setGlobalKillSwitch(nextActive, reason.trim() || null)
      setState({ ...(state || {}), ...r } as KillSwitchState)
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const active = state?.active || false
  const color = active ? 'var(--color-down)' : 'var(--color-up)'

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor: `color-mix(in srgb, ${color} 33%, transparent)`,
        background: `color-mix(in srgb, ${color} 4%, transparent)`,
        borderLeftWidth: 3,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShieldAlert className={`w-5 h-5 ${active ? 'text-down' : 'text-primary'}`} />
            Global kill switch
          </h2>
          <p className="text-xs text-d-text-muted mt-0.5">
            Platform-wide trading halt. Once active, every order-placing path
            stops until an admin clears it.
          </p>
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase rounded-full px-2.5 py-1 border"
            style={{ color, borderColor: `color-mix(in srgb, ${color} 33%, transparent)`, background: `color-mix(in srgb, ${color} 8%, transparent)` }}
          >
            <span className="relative flex h-2 w-2">
              {active && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
            </span>
            {active ? 'ACTIVE — trading halted' : 'Inactive — normal ops'}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-down/40 bg-down/10 px-3 py-2 text-[12px] text-down">
          {error}
        </div>
      )}

      {state && state.updated_at && (
        <p className="text-[10px] text-d-text-muted mb-3 numeric">
          Last update: {new Date(state.updated_at).toLocaleString('en-IN')}
          {state.updated_by && ` · by ${state.updated_by.slice(0, 8)}…`}
        </p>
      )}

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={active ? 'Current reason (edit before clearing if needed)' : 'Why are you activating? (required)'}
          disabled={saving}
          className="flex-1 bg-main border border-d-border rounded-md px-3 py-2 text-[12px] text-white focus:outline-none focus:border-primary/50 disabled:opacity-60"
        />
        {active ? (
          <button
            onClick={() => flip(false)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-black text-[12px] font-semibold hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Clear kill switch
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmActivate(true)}
            disabled={saving || !reason.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-down/15 border border-down/40 text-down text-[12px] font-semibold hover:bg-down/25 disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
            Activate kill switch
          </button>
        )}
      </div>

      {state?.description && (
        <p className="text-[10px] text-d-text-muted mt-3">{state.description}</p>
      )}

      <ConfirmDialog
        open={confirmActivate}
        onClose={() => setConfirmActivate(false)}
        onConfirm={() => flip(true)}
        title="Activate GLOBAL kill switch?"
        destructive
        confirmLabel="Halt all trading"
        body={
          <>
            This halts every order-placing path across <strong>ALL users</strong>{' '}
            until an admin clears it.
            <br />
            Reason: <em>{reason.trim() || '(none)'}</em>
          </>
        }
      />
    </div>
  )
}
