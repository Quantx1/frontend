'use client'

/* PR 89 — manual operations.
 *
 * Out-of-band triggers for ops recovery. Every action is recorded in
 * the audit log panel below. Use after fixing a data-source issue or
 * covering a missed scheduler run; live signals published by this run
 * go through the same regime gate + risk overlay as scheduled scans.
 */

import { useState } from 'react'
import { RefreshCw } from '@/lib/icons'
import { api, handleApiError } from '@/lib/api'

export default function ManualOperationsPanel() {
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<{ ok: boolean; message: string; at: string } | null>(null)

  const triggerScan = async () => {
    if (running) return
    if (!confirm('Trigger a fresh signal scan now? This re-runs the full pipeline on Nifty 500.')) {
      return
    }
    setRunning(true)
    try {
      const r = await api.admin.triggerScan()
      const msg = (r && (r.message || r.detail || JSON.stringify(r))) || 'Scan started'
      setLastResult({ ok: true, message: String(msg).slice(0, 200), at: new Date().toISOString() })
    } catch (err) {
      setLastResult({ ok: false, message: handleApiError(err), at: new Date().toISOString() })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Manual operations</h3>
          <p className="text-sm text-d-text-muted mt-1">
            Out-of-band triggers for ops recovery. Every action is recorded in the audit log below.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={triggerScan}
          disabled={running}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-warning/10 border border-warning/30 text-warning rounded-lg text-sm font-medium hover:bg-warning/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Scanning…' : 'Trigger signal scan now'}
        </button>
      </div>

      {lastResult && (
        <div
          className="mt-4 px-4 py-3 rounded-lg border text-sm"
          style={{
            borderColor: lastResult.ok ? 'rgba(5,184,120,0.30)' : 'rgba(255,89,71,0.30)',
            background: lastResult.ok ? 'rgba(5,184,120,0.06)' : 'rgba(255,89,71,0.06)',
            color: lastResult.ok ? '#05B878' : '#FF5947',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">
              {lastResult.ok ? 'Scan triggered' : 'Trigger failed'}
            </span>
            <span className="text-[11px] text-d-text-muted numeric">
              {new Date(lastResult.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <p className="text-[12px] mt-1 opacity-90 break-words">{lastResult.message}</p>
        </div>
      )}

      <p className="text-[11px] text-d-text-muted mt-4">
        Use after fixing a data-source issue or covering a missed scheduler run. Live signals
        published by this run go through the same regime gate + risk overlay as scheduled scans.
      </p>
    </div>
  )
}
