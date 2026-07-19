'use client'

/**
 * /admin/model-performance — MED #5 (2026-05-31).
 *
 * Per-model PROD performance dashboard. Admin-only. Shows the live
 * IC vs backtest IC + drift ratio per model so we can answer
 * "is Qlib pulling its weight? is HMM regime still calibrated?"
 *
 * Stays admin-only per memory `project_greek_branding_2026_04_19` —
 * real model names (Qlib/HMM/TFT/FinBERT) are visible HERE but NEVER
 * exposed on user-facing surfaces.
 */

import useSWR from 'swr'
import { AlertTriangle, RefreshCw } from '@/lib/icons'

import { Badge, Button, EmptyState, Skeleton } from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'


export default function ModelPerformancePage() {
  const { data, error, isLoading, mutate } = useSWR(
    'admin_model_performance',
    () => api.admin.getModelPerformance(),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  )

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <header className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-d-text-primary">Model Performance</h1>
          <p className="mt-1 text-sm text-d-text-secondary">
            Live IC vs backtest IC per PROD model · drift detection · admin-only
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => mutate()} aria-label="Refresh">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </header>

      {error ? (
        <EmptyState
          tone="error"
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load model performance"
          description={handleApiError(error)}
          action={<Button onClick={() => mutate()}>Retry</Button>}
        />
      ) : isLoading || !data ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="140px" />)}
        </div>
      ) : data.models.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="No PROD models found"
          description="Seed model_versions with at least one is_prod=true row."
        />
      ) : (
        <div className="mt-6 space-y-3">
          {data.models.map((m) => (
            <ModelRow key={`${m.model_name}_${m.version}`} m={m} />
          ))}
        </div>
      )}

      {data?.errors && data.errors.length > 0 && (
        <div className="mt-4 rounded-md border border-down/30 bg-down/5 p-3 text-xs text-down">
          <p className="font-semibold">Errors</p>
          <ul className="mt-1 space-y-0.5">
            {data.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}


function ModelRow({ m }: { m: any }) {
  const drift = m.drift_ratio
  const driftTone =
    drift == null ? 'border-line text-d-text-muted'
      : drift >= 0.8 ? 'border-up bg-up/10 text-up'
        : drift >= 0.5 ? 'border-primary/60 bg-primary/5 text-primary'
          : 'border-down bg-down/10 text-down'
  const driftLabel =
    drift == null ? 'no live data'
      : `${(drift * 100).toFixed(0)}% of backtest`

  return (
    <div className="rounded-xl border border-line bg-wrap p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-d-text-primary">{m.model_name}</h3>
          <Badge tone="primary">v{m.version}</Badge>
          <span className="font-mono text-[10px] text-d-text-muted">
            trained {m.trained_at?.slice(0, 10) ?? '—'}
          </span>
        </div>
        <span className={`rounded-md border px-2 py-0.5 text-[11px] capitalize ${driftTone}`}>
          drift: {driftLabel}
        </span>
      </header>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Backtest Sharpe" value={m.backtest_sharpe?.toFixed(2) ?? '—'} />
        <Stat label="Live Sharpe (30d)" value={m.live_sharpe_30d?.toFixed(2) ?? '—'} />
        <Stat label="Rolling windows" value={String(m.rolling.length)} />
        <Stat
          label="Last computed"
          value={m.rolling[0]?.computed_at?.slice(0, 10) ?? '—'}
        />
      </div>

      {m.rolling.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-wrap/60">
              <tr className="text-[10px] uppercase tracking-wider text-d-text-muted">
                <th className="px-2 py-1.5 text-left">Window</th>
                <th className="px-2 py-1.5 text-right">Sharpe</th>
                <th className="px-2 py-1.5 text-right">Win rate</th>
                <th className="px-2 py-1.5 text-right">Avg P&L %</th>
                <th className="px-2 py-1.5 text-right">Signals</th>
                <th className="px-2 py-1.5 text-right">Dir. accuracy</th>
                <th className="px-2 py-1.5 text-right">Max DD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {m.rolling.slice(0, 5).map((r: any, i: number) => (
                <tr key={i} className="font-mono tabular-nums">
                  <td className="px-2 py-1.5 text-left">{r.window_days}d</td>
                  <td className="px-2 py-1.5 text-right">{r.sharpe_ratio?.toFixed(2) ?? '—'}</td>
                  <td className="px-2 py-1.5 text-right">{r.win_rate != null ? `${(r.win_rate * 100).toFixed(0)}%` : '—'}</td>
                  <td className={`px-2 py-1.5 text-right ${r.avg_pnl_pct >= 0 ? 'text-up' : 'text-down'}`}>
                    {r.avg_pnl_pct?.toFixed(2) ?? '—'}%
                  </td>
                  <td className="px-2 py-1.5 text-right">{r.signal_count ?? '—'}</td>
                  <td className="px-2 py-1.5 text-right">{r.directional_accuracy != null ? `${(r.directional_accuracy * 100).toFixed(0)}%` : '—'}</td>
                  <td className="px-2 py-1.5 text-right text-down">{r.max_drawdown_pct?.toFixed(1) ?? '—'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-d-text-muted">{label}</p>
      <p className="mt-0.5 font-mono text-sm tabular-nums text-d-text-primary">{value}</p>
    </div>
  )
}
