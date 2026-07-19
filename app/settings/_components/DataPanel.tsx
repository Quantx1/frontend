'use client'

import { Loader2, Save } from '@/lib/icons'
import { api } from '@/lib/api'
import { EyebrowMono } from '@/components/foundation'

type Message = { type: 'success' | 'error'; text: string } | null

export default function DataPanel({
  busy,
  setBusy,
  setMessage,
}: {
  busy: boolean
  setBusy: (v: boolean) => void
  setMessage: (m: Message) => void
}) {
  const downloadJson = async () => {
    setBusy(true)
    try {
      const [profile, trades, signals] = await Promise.all([
        api.user.getProfile().catch(() => null),
        api.trades.getAll?.({}).catch(() => null),
        api.signals.getToday().catch(() => null),
      ])
      const payload = {
        exported_at: new Date().toISOString(),
        profile,
        trades,
        signals,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `swingai-export-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: 'Data exported.' })
    } catch {
      setMessage({ type: 'error', text: 'Export failed. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <EyebrowMono className="mb-2">Data</EyebrowMono>
        <h2 className="font-display text-xl font-semibold text-d-text-primary mb-1">Data + account</h2>
        <p className="text-sm text-d-text-muted">Export everything we have on you, or delete your account outright.</p>
      </div>

      <div className="rounded-sm border border-line bg-wrap p-5 space-y-2">
        <h3 className="text-[13px] font-medium text-d-text-primary">Download my data (GDPR-style)</h3>
        <p className="text-[12px] text-d-text-muted">
          JSON export of your profile, trades, signals, and preferences. Does not include password hashes or
          broker tokens — those are encrypted at rest and never leave our infrastructure.
        </p>
        <button
          onClick={downloadJson}
          disabled={busy}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-[12px] border border-line text-d-text-primary rounded-sm hover:bg-hover transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Download JSON
        </button>
      </div>

      <div className="rounded-sm border border-line border-l-2 border-l-down bg-wrap p-5 space-y-2">
        <h3 className="text-[13px] font-medium text-down">Delete account</h3>
        <p className="text-[12px] text-d-text-muted">
          Permanently deletes your profile, trades, signals, watchlists, and broker connections. Irreversible.
          Any active subscription is cancelled; you keep access through the end of your paid period.
        </p>
        <button
          onClick={() => setMessage({ type: 'error', text: 'Delete-account flow is pending admin-signoff wiring.' })}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium bg-down/10 border border-down/30 text-down rounded-sm hover:bg-down/20 transition-colors"
        >
          Delete account…
        </button>
      </div>
    </div>
  )
}
