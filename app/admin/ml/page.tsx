// ============================================================================
// QUANT X - ADMIN ML DASHBOARD
// ML model monitoring, regime status, strategy performance, retrain controls
// ============================================================================

'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Brain,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Cpu,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  BarChart3,
  Zap,
  FileText,
  Hash,
  Calendar,
  Play,
} from '@/lib/icons'
import { api, handleApiError } from '@/lib/api'

import DriftPanel, { type DriftData } from './_components/DriftPanel'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MLModel {
  name: string
  type: string
  status: string
  accuracy: number | null
  last_trained: string | null
  model_path: string
  features: number
}

interface StrategyPerformance {
  strategy: string
  signals_30d: number
  win_rate: number
  avg_return: number
}

interface MLPerformanceData {
  models: MLModel[]
  strategy_performance: StrategyPerformance[]
}

interface RegimeCurrent {
  regime: string
  regime_id: number
  confidence: number
  since: string
  days_active: number
  probabilities: Record<string, number>
}

interface RegimeData {
  current: RegimeCurrent
  strategy_weights: Record<string, number>
  history: unknown[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const typeBadgeColor: Record<string, string> = {
  classifier: 'bg-primary/10 text-primary border-primary/20',
  regime: 'bg-ai/10 text-ai border-ai/20',
  ensemble: 'bg-warning/10 text-warning border-warning/20',
  ranker: 'bg-cyan/10 text-cyan border-cyan/20',
  forecaster: 'bg-down/10 text-down border-down/20',
}

const regimeConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof TrendingUp }> = {
  bull: {
    label: 'Bullish',
    color: 'text-up',
    bgColor: 'bg-up/10',
    borderColor: 'border-up/20',
    icon: TrendingUp,
  },
  sideways: {
    label: 'Sideways',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/20',
    icon: Minus,
  },
  bear: {
    label: 'Bearish',
    color: 'text-down',
    bgColor: 'bg-down/10',
    borderColor: 'border-down/20',
    icon: TrendingDown,
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminMLPage() {
  const [performance, setPerformance] = useState<MLPerformanceData | null>(null)
  const [regime, setRegime] = useState<RegimeData | null>(null)
  const [drift, setDrift] = useState<DriftData | null>(null)
  const [driftWindow, setDriftWindow] = useState<7 | 30 | 90>(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrainLoading, setRetrainLoading] = useState<string | null>(null)
  const [retrainMsg, setRetrainMsg] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [perfData, regimeData, driftData] = await Promise.all([
        api.admin.getMLPerformance().catch(() => null),
        api.admin.getMLRegime().catch(() => null),
        api.admin.getMLDrift(driftWindow).catch(() => null),
      ])

      if (perfData) {
        setPerformance(perfData as unknown as MLPerformanceData)
      }

      if (regimeData) {
        setRegime(regimeData as unknown as RegimeData)
      }

      if (driftData) {
        setDrift(driftData)
      }

      if (!perfData && !regimeData && !driftData) {
        setError('Failed to fetch ML data')
      }
    } catch (err) {
      console.error('Failed to fetch ML data:', err)
      setError('Failed to connect to backend')
    } finally {
      setLoading(false)
    }
  }, [driftWindow])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRetrain = async (model: string = 'all') => {
    try {
      setRetrainLoading(model)
      setRetrainMsg(null)
      const data = await api.admin.retrain(model)
      setRetrainMsg((data as any).message || `Retrain triggered for ${model}`)
    } catch {
      setRetrainMsg(`Failed to trigger retrain for ${model}`)
    } finally {
      setRetrainLoading(null)
    }
  }

  if (loading && !performance) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loader-rings" />
      </div>
    )
  }

  const currentRegime = regime?.current
  const rc = regimeConfig[currentRegime?.regime || 'sideways'] || regimeConfig.sideways
  const RegimeIcon = rc.icon

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-ai" />
            ML Dashboard
          </h1>
          <p className="text-d-text-muted mt-1">
            Model performance, regime detection, and strategy metrics
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/10 border border-warning/20 text-warning text-sm font-medium transition-all hover:bg-warning/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-down/10 border border-down/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-down" />
          <p className="text-down">{error}</p>
        </div>
      )}

      {/* ── Regime Indicator ── */}
      {currentRegime && (
        <div className={`rounded-2xl border p-6 ${rc.bgColor} ${rc.borderColor}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left: Regime state */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${rc.bgColor} flex items-center justify-center`}>
                <RegimeIcon className={`w-7 h-7 ${rc.color}`} />
              </div>
              <div>
                <p className="text-sm text-d-text-muted mb-1">Current Market Regime</p>
                <h2 className={`text-2xl font-bold ${rc.color}`}>{rc.label}</h2>
                <p className="text-xs text-d-text-muted mt-1">
                  Active for {currentRegime.days_active} days (since {currentRegime.since})
                </p>
              </div>
            </div>

            {/* Center: Probabilities */}
            <div className="flex gap-6">
              {Object.entries(currentRegime.probabilities).map(([key, val]) => {
                const cfg = regimeConfig[key] || regimeConfig.sideways
                return (
                  <div key={key} className="text-center">
                    <p className={`text-lg font-bold font-mono num-display ${cfg.color}`}>
                      {(val * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-d-text-muted capitalize">{key}</p>
                  </div>
                )
              })}
            </div>

            {/* Right: Confidence */}
            <div className="text-right">
              <p className="text-sm text-d-text-muted mb-1">Confidence</p>
              <p className={`text-3xl font-bold font-mono num-display ${rc.color}`}>
                {(currentRegime.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Strategy Weights */}
          {regime?.strategy_weights && (
            <div className="mt-6 pt-6 border-t border-d-border">
              <p className="text-sm text-d-text-muted mb-3">Strategy Weights (Regime-adjusted)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(regime.strategy_weights).map(([strategy, weight]) => (
                  <div
                    key={strategy}
                    className="bg-white/[0.04] rounded-lg px-3 py-2 text-center"
                  >
                    <p className="text-xs text-d-text-muted truncate" title={strategy}>
                      {strategy.replace(/_/g, ' ')}
                    </p>
                    <p className={`text-sm font-bold ${weight >= 0.8 ? 'text-up' : weight >= 0.5 ? 'text-warning' : 'text-down'}`}>
                      {weight.toFixed(2)}x
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Model Cards Grid ── */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          ML Models ({performance?.models.length || 0})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performance?.models.map((model) => (
            <div
              key={model.name}
              className="glass-card hover:border-primary transition-colors p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{model.name}</h3>
                  <span
                    className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      typeBadgeColor[model.type] || 'bg-white/[0.04] text-d-text-muted border-d-border/50'
                    }`}
                  >
                    {model.type}
                  </span>
                </div>
                {/* Status indicator */}
                {model.status === 'active' ? (
                  <div className="flex items-center gap-1.5 text-up">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-warning">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Pending</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-3">
                {/* Accuracy */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-d-text-muted flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Accuracy
                  </span>
                  {model.accuracy !== null ? (
                    <span className={`text-sm font-bold ${model.accuracy >= 70 ? 'text-up' : model.accuracy >= 60 ? 'text-warning' : 'text-down'}`}>
                      <span className="font-mono num-display">{model.accuracy}%</span>
                    </span>
                  ) : (
                    <span className="text-sm text-d-text-muted">N/A</span>
                  )}
                </div>

                {/* Features */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-d-text-muted flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    Features
                  </span>
                  <span className="text-sm text-white font-medium">{model.features}</span>
                </div>

                {/* Last trained */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-d-text-muted flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Trained
                  </span>
                  <span className="text-sm text-white">
                    {model.last_trained || 'Never'}
                  </span>
                </div>

                {/* Model path */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-d-text-muted flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Path
                  </span>
                  <code className="text-xs text-d-text-muted bg-white/[0.04] px-1.5 py-0.5 rounded truncate max-w-[180px]" title={model.model_path}>
                    {model.model_path}
                  </code>
                </div>
              </div>

              {/* Accuracy bar */}
              {model.accuracy !== null && (
                <div className="mt-4">
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        model.accuracy >= 70 ? 'bg-up' : model.accuracy >= 60 ? 'bg-warning' : 'bg-down'
                      }`}
                      style={{ width: `${model.accuracy}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Strategy Performance Table ── */}
      <div>
        <div className="glass-card hover:border-primary transition-colors p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-ai" />
            Strategy Performance (30 days)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-d-border">
                  <th className="text-left text-sm text-d-text-muted font-medium py-3 pr-4">Strategy</th>
                  <th className="text-right text-sm text-d-text-muted font-medium py-3 px-4">Signals</th>
                  <th className="text-right text-sm text-d-text-muted font-medium py-3 px-4">Win Rate</th>
                  <th className="text-right text-sm text-d-text-muted font-medium py-3 px-4">Avg Return</th>
                  <th className="text-right text-sm text-d-text-muted font-medium py-3 pl-4">Weight</th>
                </tr>
              </thead>
              <tbody>
                {(performance?.strategy_performance?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-sm text-d-text-muted">
                      No per-strategy stats — the hand-coded strategies were retired
                      from signal generation (Scanner Lab only). Per-model realised
                      performance is in the cards above and the drift panel below.
                    </td>
                  </tr>
                )}
                {performance?.strategy_performance.map((sp) => {
                  const weight = regime?.strategy_weights?.[sp.strategy] ?? 1.0
                  return (
                    <tr key={sp.strategy} className="border-b border-white/[0.04] last:border-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-warning" />
                          <span className="text-white font-medium text-sm">
                            {sp.strategy.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="text-white text-sm">{sp.signals_30d}</span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span
                          className={`text-sm font-bold ${
                            sp.win_rate >= 65 ? 'text-up' : sp.win_rate >= 55 ? 'text-warning' : 'text-down'
                          }`}
                        >
                          <span className="font-mono num-display">{sp.win_rate.toFixed(1)}%</span>
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={`text-sm font-bold font-mono num-display ${sp.avg_return >= 0 ? 'text-up' : 'text-down'}`}>
                          +{sp.avg_return.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 pl-4">
                        <span className={`text-sm font-medium ${weight >= 0.8 ? 'text-up' : weight >= 0.5 ? 'text-warning' : 'text-down'}`}>
                          {weight.toFixed(2)}x
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Retrain Controls ── */}
      {/* PR 43 — Drift monitoring */}
      <DriftPanel
        drift={drift}
        window={driftWindow}
        setWindow={(w) => setDriftWindow(w)}
        onRetrain={handleRetrain}
        retrainLoading={retrainLoading}
      />

      <div>
        <div className="glass-card hover:border-primary transition-colors p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-warning" />
            Retrain Controls
          </h2>
          <p className="text-sm text-d-text-muted mb-4">
            Trigger a background retraining job for one or all models. This runs the retrain pipeline asynchronously.
          </p>

          {retrainMsg && (
            <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <AlertCircle className="w-4 h-4 text-primary" />
              <p className="text-sm text-primary">{retrainMsg}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleRetrain('all')}
              disabled={retrainLoading !== null}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-warning/10 border border-warning/20 text-warning text-sm font-medium transition-all hover:bg-warning/20 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {retrainLoading === 'all' ? 'Starting...' : 'Retrain All Models'}
            </button>
            {performance?.models.map((model) => (
              <button
                key={model.name}
                onClick={() => handleRetrain(model.name)}
                disabled={retrainLoading !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-d-border text-d-text-muted text-sm font-medium transition-all hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retrainLoading === model.name ? 'animate-spin' : ''}`} />
                {model.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
