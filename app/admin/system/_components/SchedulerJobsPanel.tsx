'use client'

/* PR 47 — Scheduler jobs history.
 *
 * Read-only view of recent cron / interval job runs. Filter by job id
 * + status; the latest-run-per-job summary strip surfaces the freshest
 * status of every distinct job at a glance.
 */

import { useCallback, useEffect, useState } from 'react'
import { History, Loader2, RefreshCw } from '@/lib/icons'
import { api, handleApiError } from '@/lib/api'

type SchedulerData = Awaited<ReturnType<typeof api.admin.getSchedulerJobs>>

export default function SchedulerJobsPanel() {
  const [data, setData] = useState<SchedulerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [jobFilter, setJobFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'' | 'ok' | 'failed' | 'skipped'>('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.admin.getSchedulerJobs({
        job_id: jobFilter || undefined,
        status: statusFilter || undefined,
        limit: 100,
      })
      setData(r)
    } catch (err) {
      console.warn('scheduler jobs fetch failed:', handleApiError(err))
    } finally {
      setLoading(false)
    }
  }, [jobFilter, statusFilter])

  useEffect(() => {
    refresh()
  }, [refresh])

  const jobIds = data ? Array.from(new Set(data.rows.map((r) => r.job_id))).sort() : []

  return (
    <div className="glass-card hover:border-primary transition-colors p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Scheduler job runs
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="bg-main border border-d-border rounded-md px-2 py-1 text-[11px] text-white focus:outline-none focus:border-primary/50"
          >
            <option value="">All jobs</option>
            {jobIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-main border border-d-border rounded-md px-2 py-1 text-[11px] text-white focus:outline-none focus:border-primary/50"
          >
            <option value="">All statuses</option>
            <option value="ok">ok</option>
            <option value="failed">failed</option>
            <option value="skipped">skipped</option>
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

      {/* Latest-by-job summary strip */}
      {data && data.latest_by_job.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 mb-4">
          {data.latest_by_job.slice(0, 12).map((j) => {
            const color =
              j.status === 'ok' ? '#05B878'
              : j.status === 'failed' ? '#FF5947'
              : '#FEB113'
            return (
              <div
                key={j.job_id}
                className="px-3 py-2 rounded-md border"
                style={{ borderColor: `${color}40`, background: `${color}0A` }}
              >
                <p className="text-[11px] font-medium text-white truncate">{j.job_id}</p>
                <p className="text-[9px] text-d-text-muted numeric mt-0.5">
                  {new Date(j.started_at).toLocaleString('en-IN', {
                    dateStyle: 'short', timeStyle: 'short',
                  })}
                </p>
                <p className="text-[10px] numeric mt-0.5" style={{ color }}>
                  {j.status}{j.items_processed != null ? ` · ${j.items_processed}` : ''}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="text-center py-6">
          <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
        </div>
      ) : !data || data.rows.length === 0 ? (
        <p className="text-[12px] text-d-text-muted text-center py-6">
          No scheduler job runs yet. Rows appear after the first cron fires.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-d-border text-[10px] uppercase tracking-wider text-d-text-muted">
                <th className="text-left px-3 py-2 font-medium">Job</th>
                <th className="text-left px-3 py-2 font-medium">Started</th>
                <th className="text-right px-3 py-2 font-medium">Duration</th>
                <th className="text-right px-3 py-2 font-medium">Items</th>
                <th className="text-right px-3 py-2 font-medium">Status</th>
                <th className="text-left px-3 py-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const color =
                  r.status === 'ok' ? '#05B878'
                  : r.status === 'failed' ? '#FF5947'
                  : '#FEB113'
                const dur =
                  r.finished_at && r.started_at
                    ? Math.max(0, (new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000)
                    : null
                return (
                  <tr key={r.id} className="border-b border-d-border/50 hover:bg-white/[0.02]">
                    <td className="px-3 py-2 font-medium text-white">{r.job_id}</td>
                    <td className="px-3 py-2 text-d-text-secondary numeric text-[11px]">
                      {new Date(r.started_at).toLocaleString('en-IN', {
                        dateStyle: 'short', timeStyle: 'medium',
                      })}
                    </td>
                    <td className="px-3 py-2 text-right numeric text-[11px] text-d-text-secondary">
                      {dur == null ? '—' : `${dur.toFixed(1)}s`}
                    </td>
                    <td className="px-3 py-2 text-right numeric text-[11px] text-d-text-secondary">
                      {r.items_processed ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-d-text-secondary max-w-[280px] truncate">
                      {r.err_msg
                        ? <span className="text-down">{r.err_msg}</span>
                        : r.metadata
                          ? <code className="text-[10px] text-d-text-muted">{JSON.stringify(r.metadata).slice(0, 120)}</code>
                          : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <p className="text-[10px] text-d-text-muted mt-3 text-right">
          {data.count} rows · fetched {new Date(data.computed_at).toLocaleTimeString('en-IN')}
        </p>
      )}
    </div>
  )
}
