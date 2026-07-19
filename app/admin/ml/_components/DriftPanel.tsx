'use client'

/* PR 43 — Drift monitoring panel.
 *
 * Reads ``model_rolling_performance`` aggregates and flags engines whose
 * win rate drops below the configured threshold over the chosen window.
 * Pure render — caller (admin/ml page) owns the data fetch + retrain
 * orchestration.
 *
 * Admin sees the public engine label (so the table reads as the
 * customer surface) AND the internal model name (so they can reason
 * about which artifact to retrain).
 */

import { AlertCircle, CheckCircle, Play, RefreshCw } from '@/lib/icons'
import { api } from '@/lib/api'
import { publicLabel } from '@/lib/models'

// Internal → public engine-name map for admin display.
const ENGINE_NAME_MAP: Record<string, string> = {
  tft_swing:             'swing_forecast',
  qlib_alpha158:         'cross_sectional_ranker',
  lgbm_signal_gate:      'swing_forecast',
  regime_hmm:            'regime_detector',
  strategy:              'swing_forecast',
  breakout_meta_labeler: 'pattern_scorer',
  lstm_intraday:         'intraday_forecast',
  // trajectory (chronos) + timesfm removed — retired models
  finbert_india:         'sentiment_engine',
}

function adminEngineLabel(modelName: string): { label: string; internal: string } {
  const key = ENGINE_NAME_MAP[modelName]
  const label = key ? publicLabel(key) : modelName
  return { label, internal: modelName }
}

export type DriftData = Awaited<ReturnType<typeof api.admin.getMLDrift>>

export default function DriftPanel({
  drift,
  window,
  setWindow,
  onRetrain,
  retrainLoading,
}: {
  drift: DriftData | null
  window: 7 | 30 | 90
  setWindow: (w: 7 | 30 | 90) => void
  onRetrain: (model: string) => void
  retrainLoading: string | null
}) {
  if (!drift) {
    return (
      <div className="glass-card hover:border-primary transition-colors p-6">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          Engine drift monitor
        </h2>
        <p className="text-sm text-d-text-muted">
          Drift rows will appear once the weekly aggregator
          (<code>aggregate_model_rolling_performance</code>) has populated
          rolling performance — typically the Sunday after deploy.
        </p>
      </div>
    )
  }

  const hasDrift = drift.drifted.length > 0
  const threshold = drift.drift_threshold

  return (
    <div className="glass-card hover:border-primary transition-colors p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${hasDrift ? 'text-down' : 'text-primary'}`} />
            Engine drift monitor
          </h2>
          <p className="text-xs text-d-text-muted mt-0.5">
            Threshold: win rate &lt; {(threshold * 100).toFixed(0)}% with ≥30 signals flags drift.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] border border-d-border p-1">
          {[7, 30, 90].map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w as 7 | 30 | 90)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                window === w
                  ? 'bg-primary/15 text-primary'
                  : 'text-d-text-muted hover:text-white'
              }`}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>

      {hasDrift && (
        <div className="mb-4 rounded-xl bg-down/10 border border-down/30 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-down mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-down">
              {drift.drifted.length} engine{drift.drifted.length === 1 ? '' : 's'} drifting
            </p>
            <p className="text-xs text-down/80 mt-0.5">
              {drift.drifted.map((d) => adminEngineLabel(d.model_name).label).join(', ')}
              {' '}— consider retraining.
            </p>
          </div>
        </div>
      )}

      {drift.models.length === 0 ? (
        <p className="text-sm text-d-text-muted">
          No rolling-performance rows for {window}-day window yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-d-border text-[10px] uppercase tracking-wider text-d-text-muted">
                <th className="text-left px-3 py-2 font-medium">Engine</th>
                <th className="text-right px-3 py-2 font-medium">Win rate</th>
                <th className="text-right px-3 py-2 font-medium">Avg P&amp;L %</th>
                <th className="text-right px-3 py-2 font-medium">Signals</th>
                <th className="text-right px-3 py-2 font-medium">Sharpe</th>
                <th className="text-right px-3 py-2 font-medium">Max DD %</th>
                <th className="text-right px-3 py-2 font-medium">Status</th>
                <th className="text-right px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {drift.models.map((m) => {
                const wr = m.win_rate == null ? null : m.win_rate
                const isDrifted =
                  wr !== null && wr < threshold && m.signal_count >= 30
                const wrColor =
                  wr === null ? '#8e8e8e'
                  : wr >= 0.55 ? '#05B878'
                  : wr >= threshold ? '#FEB113'
                  : '#FF5947'
                const pnlColor =
                  m.avg_pnl_pct == null ? '#8e8e8e'
                  : m.avg_pnl_pct > 0 ? '#05B878'
                  : '#FF5947'
                const { label, internal } = adminEngineLabel(m.model_name)
                return (
                  <tr key={`${m.model_name}-${m.window_days}`} className="border-b border-d-border/50">
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{label}</span>
                        <code className="text-[10px] text-d-text-muted">{internal}</code>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right numeric font-medium" style={{ color: wrColor }}>
                      {wr == null ? '—' : `${(wr * 100).toFixed(1)}%`}
                    </td>
                    <td className="px-3 py-2.5 text-right numeric" style={{ color: pnlColor }}>
                      {m.avg_pnl_pct == null
                        ? '—'
                        : `${m.avg_pnl_pct >= 0 ? '+' : ''}${m.avg_pnl_pct.toFixed(2)}%`}
                    </td>
                    <td className="px-3 py-2.5 text-right numeric text-d-text-secondary">
                      {m.signal_count}
                    </td>
                    <td className="px-3 py-2.5 text-right numeric text-d-text-secondary">
                      {m.sharpe_ratio == null ? '—' : m.sharpe_ratio.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right numeric text-d-text-secondary">
                      {m.max_drawdown_pct == null ? '—' : `${m.max_drawdown_pct.toFixed(1)}%`}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {isDrifted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-down">
                          <AlertCircle className="w-3 h-3" /> drifting
                        </span>
                      ) : wr !== null && wr >= 0.55 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-up">
                          <CheckCircle className="w-3 h-3" /> healthy
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-d-text-muted">
                          watch
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => onRetrain(internal)}
                        disabled={retrainLoading !== null}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                          isDrifted
                            ? 'bg-down/10 text-down border border-down/30 hover:bg-down/20'
                            : 'bg-white/[0.04] text-d-text-secondary border border-d-border hover:text-white'
                        } disabled:opacity-50`}
                      >
                        {retrainLoading === internal ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        Retrain
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-d-text-muted mt-3">
        Data source: <code>model_rolling_performance</code> · refreshed Sunday 02:00 IST ·
        {' '}computed {drift.computed_at ? new Date(drift.computed_at).toLocaleString('en-IN') : '—'}
      </p>
    </div>
  )
}
