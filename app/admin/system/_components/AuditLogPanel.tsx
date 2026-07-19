'use client'

/* PR 49 — Admin audit log panel.
 *
 * One row per admin mutation. Click a row to expand the full payload
 * + client info; the per-row id is shown in the expanded view for
 * cross-referencing with logs.
 */

import { useCallback, useEffect, useState } from 'react'
import { FileText, Loader2, RefreshCw, User } from '@/lib/icons'
import { api, handleApiError } from '@/lib/api'

type AuditData = Awaited<ReturnType<typeof api.admin.getAuditLog>>

export default function AuditLogPanel() {
  const [data, setData] = useState<AuditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState<string>('')
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.admin.getAuditLog({
        action: actionFilter || undefined,
        target_type: targetTypeFilter || undefined,
        limit: 100,
      })
      setData(r)
    } catch (err) {
      console.warn('audit-log fetch failed:', handleApiError(err))
    } finally {
      setLoading(false)
    }
  }, [actionFilter, targetTypeFilter])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="glass-card hover:border-primary transition-colors p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Admin audit log
          </h2>
          <p className="text-xs text-d-text-muted mt-0.5">
            One row per admin mutation — click any row to expand payload + client info.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-main border border-d-border rounded-md px-2 py-1 text-[11px] text-white focus:outline-none focus:border-primary/50"
          >
            <option value="">All actions</option>
            {(data?.actions || []).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="bg-main border border-d-border rounded-md px-2 py-1 text-[11px] text-white focus:outline-none focus:border-primary/50"
          >
            <option value="">All targets</option>
            <option value="user">user</option>
            <option value="tier">tier</option>
            <option value="ml_model">ml_model</option>
            <option value="scheduler_job">scheduler_job</option>
            <option value="system_flag">system_flag</option>
            <option value="signal">signal</option>
            <option value="payment">payment</option>
            <option value="other">other</option>
          </select>
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-d-border text-[11px] text-white hover:bg-white/[0.03] disabled:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6">
          <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
        </div>
      ) : !data || data.rows.length === 0 ? (
        <p className="text-[12px] text-d-text-muted text-center py-6">
          No audit rows for the current filter.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-d-border text-[10px] uppercase tracking-wider text-d-text-muted">
                <th className="text-left px-3 py-2 font-medium">When</th>
                <th className="text-left px-3 py-2 font-medium">Actor</th>
                <th className="text-left px-3 py-2 font-medium">Action</th>
                <th className="text-left px-3 py-2 font-medium">Target</th>
                <th className="text-left px-3 py-2 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const expanded = expandedId === r.id
                return (
                  <>
                    <tr
                      key={r.id}
                      className="border-b border-d-border/50 hover:bg-white/[0.02] cursor-pointer"
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                    >
                      <td className="px-3 py-2 numeric text-[11px] text-d-text-secondary whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString('en-IN', {
                          dateStyle: 'short', timeStyle: 'medium',
                        })}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-white">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3 text-d-text-muted" />
                          {r.actor_email || (r.actor_id ? r.actor_id.slice(0, 8) + '…' : 'system')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px]">
                        <code className="text-primary text-[11px]">{r.action}</code>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-d-text-secondary">
                        <span className="text-d-text-muted">{r.target_type}</span>
                        {r.target_id && <span className="ml-1">· {r.target_id.slice(0, 24)}</span>}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-d-text-muted numeric">
                        {r.ip_address || '—'}
                      </td>
                    </tr>
                    {expanded && (
                      <tr key={`${r.id}-expanded`} className="bg-main">
                        <td colSpan={5} className="px-6 py-3">
                          <div className="space-y-2 text-[11px]">
                            {r.payload && Object.keys(r.payload).length > 0 && (
                              <div>
                                <p className="text-[9px] uppercase tracking-wider text-d-text-muted mb-1">Payload</p>
                                <pre className="p-2 rounded bg-wrap border border-d-border text-[10px] text-d-text-secondary overflow-x-auto">
{JSON.stringify(r.payload, null, 2)}
                                </pre>
                              </div>
                            )}
                            {r.user_agent && (
                              <div>
                                <p className="text-[9px] uppercase tracking-wider text-d-text-muted mb-1">User agent</p>
                                <p className="text-[10px] text-d-text-secondary break-all">{r.user_agent}</p>
                              </div>
                            )}
                            <p className="text-[9px] text-d-text-muted">Row id: <code>{r.id}</code></p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
          <p className="text-[10px] text-d-text-muted mt-3 text-right">
            {data.count} rows · fetched {new Date(data.computed_at).toLocaleTimeString('en-IN')}
          </p>
        </div>
      )}
    </div>
  )
}
