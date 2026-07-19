'use client'

/**
 * SavedScansTab (PR-S6) — manage saved scans + alert history.
 *
 * Three sections:
 *   1. Saved scans list — name, schedule, last run, last hit count,
 *      enable/disable toggle, run-now, delete
 *   2. Alert history — recent fires with new_symbols list
 *   3. (Create modal lives in PowerScreenersTab via "Save this scan" CTA)
 */

import { useState } from 'react'
import useSWR from 'swr'
import {
  AlertCircle,
  Bell,
  Play,
  Power,
  RefreshCw,
  Trash2,
} from '@/lib/icons'

import {
  Badge,
  Button,
  EmptyState,
  Skeleton,
  toast,
} from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'

const SCHEDULE_LABELS: Record<string, string> = {
  hourly: 'Hourly',
  open_close: 'Open + Close',
  every_15min: 'Every 15 min',
  manual: 'Manual only',
}

export default function SavedScansTab() {
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data: scansData, error: scansError, isLoading: scansLoading, mutate: refreshScans } = useSWR(
    'saved_scans',
    () => api.screener.listSavedScans(),
    { revalidateOnFocus: false, refreshInterval: 30_000 },
  )

  const { data: alertsData, mutate: refreshAlerts } = useSWR(
    'saved_scan_alerts',
    () => api.screener.listSavedScanAlerts(20),
    { revalidateOnFocus: false, refreshInterval: 60_000 },
  )

  const scans = scansData?.scans ?? []
  const alerts = alertsData?.alerts ?? []

  const runScan = async (scanId: string) => {
    setBusyId(scanId)
    try {
      const r = await api.screener.runSavedScan(scanId)
      if (r.error) {
        toast.error('Scan run failed', { description: r.error })
      } else if (r.new_symbols.length === 0) {
        toast.info('No new matches', {
          description: `${r.total_count} symbols matched (unchanged from last run)`,
        })
      } else {
        toast.success(`${r.new_symbols.length} new match${r.new_symbols.length === 1 ? '' : 'es'}`, {
          description: r.new_symbols.slice(0, 5).join(', '),
        })
      }
      refreshScans()
      refreshAlerts()
    } catch (e) {
      toast.error('Run failed', { description: handleApiError(e) })
    } finally {
      setBusyId(null)
    }
  }

  const toggleScan = async (scanId: string, enabled: boolean) => {
    setBusyId(scanId)
    try {
      await api.screener.updateSavedScan(scanId, { enabled: !enabled })
      refreshScans()
    } catch (e) {
      toast.error('Update failed', { description: handleApiError(e) })
    } finally {
      setBusyId(null)
    }
  }

  const deleteScan = async (scanId: string, name: string) => {
    if (!confirm(`Delete saved scan "${name}"?`)) return
    setBusyId(scanId)
    try {
      await api.screener.deleteSavedScan(scanId)
      toast.success('Saved scan deleted')
      refreshScans()
    } catch (e) {
      toast.error('Delete failed', { description: handleApiError(e) })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* My Saved Scans */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-d-text-primary">My Saved Scans</h2>
          <Button size="sm" variant="ghost" onClick={() => refreshScans()}>
            <RefreshCw className={`h-3.5 w-3.5 ${scansLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {scansError ? (
          <EmptyState
            tone="error"
            icon={<AlertCircle className="h-6 w-6" />}
            title="Could not load saved scans"
            description={handleApiError(scansError)}
          />
        ) : scansLoading && scans.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} w="100%" h="80px" />)}
          </div>
        ) : scans.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-7 w-7" />}
            title="No saved scans yet"
            description="From the Power tab, click 'Save this scan' to set up a screener that auto-runs during market hours."
          />
        ) : (
          <div className="space-y-2">
            {scans.map((s) => (
              <article
                key={s.id}
                className={`rounded-lg border p-3 ${
                  s.enabled
                    ? 'border-line bg-wrap/60'
                    : 'border-line/50 bg-wrap/30 opacity-60'
                }`}
              >
                <header className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-d-text-primary">{s.name}</h3>
                      <Badge tone={s.enabled ? 'up' : 'muted'}>
                        {s.enabled ? 'enabled' : 'paused'}
                      </Badge>
                      <Badge tone="muted">{SCHEDULE_LABELS[s.schedule] ?? s.schedule}</Badge>
                      <span className="font-mono text-[10px] text-d-text-muted">
                        {s.scanner_ids.length} scanner{s.scanner_ids.length === 1 ? '' : 's'} · {s.universe}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-d-text-muted">
                      {s.last_run_at
                        ? `Last run ${timeAgo(s.last_run_at)} · ${s.last_hit_count} matches`
                        : 'Never run yet'}
                    </p>
                    {s.last_hit_symbols.length > 0 && (
                      <p className="mt-1 font-mono text-[11px] text-d-text-secondary truncate">
                        {s.last_hit_symbols.slice(0, 6).join(', ')}
                        {s.last_hit_symbols.length > 6 && ` +${s.last_hit_symbols.length - 6}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost"
                            disabled={busyId === s.id}
                            onClick={() => runScan(s.id)}
                            aria-label="Run now">
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost"
                            disabled={busyId === s.id}
                            onClick={() => toggleScan(s.id, s.enabled)}
                            aria-label={s.enabled ? 'Pause' : 'Enable'}>
                      <Power className={`h-3.5 w-3.5 ${s.enabled ? 'text-up' : 'text-d-text-muted'}`} />
                    </Button>
                    <Button size="sm" variant="ghost"
                            disabled={busyId === s.id}
                            onClick={() => deleteScan(s.id, s.name)}
                            aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </header>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Alert history */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-d-text-primary">
            Recent Alerts <span className="font-mono text-[10px] text-d-text-muted">({alerts.length})</span>
          </h2>
        </div>

        {alerts.length === 0 ? (
          <p className="rounded-md border border-line bg-wrap p-3 text-[11px] text-d-text-muted">
            No alerts yet. They fire automatically when a saved scan finds NEW symbols not in its previous run.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-md border border-line bg-wrap p-2.5 text-xs">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono text-d-text-primary">
                    {a.new_symbols.slice(0, 5).join(', ')}
                    {a.new_symbols.length > 5 && ` +${a.new_symbols.length - 5}`}
                  </span>
                  <span className="font-mono text-[10px] text-d-text-muted">
                    {timeAgo(a.fired_at)} · {a.total_match_count} total
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}
