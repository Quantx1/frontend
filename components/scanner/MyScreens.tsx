'use client'

/**
 * MyScreens — the user's own saved screens (created by the AI generator),
 * shown as a section in the Screener gallery. Each links to /scanner/my/[id].
 */

import useSWR from 'swr'
import Link from 'next/link'
import { ArrowRight, Bell, BellOff } from '@/lib/icons'

import { api } from '@/lib/api'
import { MONO } from '@/lib/tokens'

export function MyScreens() {
  const { data, isLoading } = useSWR('saved_scans', () => api.screener.listSavedScans(), {
    revalidateOnFocus: false,
  })
  const scans = data?.scans ?? []

  if (!isLoading && scans.length === 0) return null

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[15px] font-semibold text-d-text-primary">My screens</h2>
        <p className="text-[12.5px] text-d-text-muted">Screens you created — running on a schedule, alerting your inbox.</p>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {scans.map((s) => (
          <Link
            key={s.id}
            href={`/scanner/my/${s.id}`}
            className="group grid min-h-[92px] grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-line bg-wrap p-4 transition-colors hover:border-d-text-muted/40 hover:bg-wrap-hover"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13.5px] font-semibold text-d-text-primary">{s.name}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-d-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className={`text-[10.5px] ${MONO} text-d-text-muted`}>
                {s.scanner_ids.length} block{s.scanner_ids.length === 1 ? '' : 's'} · match ≥{s.min_hits || 1}
                {typeof s.last_hit_count === 'number' ? ` · ${s.last_hit_count} last run` : ''}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-pill px-2 py-1 text-[10px] ${
                s.enabled ? 'bg-up/10 text-up' : 'bg-line text-d-text-muted'
              }`}
              title={s.enabled ? 'Alerts on' : 'Alerts paused'}
            >
              {s.enabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
              {s.schedule.replace('_', ' ')}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
