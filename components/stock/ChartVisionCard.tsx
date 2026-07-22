'use client'

/**
 * ChartVisionCard — B2 chart-vision result surface.
 *
 * Server runs an open vision model (via the OpenRouter gateway) on a
 * 120-bar chart image and returns:
 *   - Trend tag         (uptrend / downtrend / range / unclear)
 *   - Dominant pattern
 *   - Support + resistance levels (up to 3 each)
 *   - Volume signal     (accumulation / distribution / neutral)
 *   - Setup label
 *   - Confidence 0-100
 *   - 2-3 sentence narrative
 *
 * Free tier: hidden (gated upstream — card never renders).
 * Pro:       enabled for signal + watchlist symbols only; prompts
 *            upgrade on 403 ``vision_symbol_restricted``.
 * Elite:     fires via ``anywhere=true`` for any symbol.
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  Eye,
  Loader2,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from '@/lib/icons'

import { api, handleApiError } from '@/lib/api'
import ModelBadge from '@/components/ModelBadge'
import type { VisionAnalysisData } from '@/types/strategies'


type Analysis = VisionAnalysisData

const TREND_META: Record<string, { label: string; color: string; icon: any }> = {
  uptrend:   { label: 'Uptrend',   color: 'var(--color-up)', icon: TrendingUp },
  downtrend: { label: 'Downtrend', color: 'var(--color-down)', icon: TrendingDown },
  range:     { label: 'Range',     color: 'var(--color-warning)', icon: Minus },
  unclear:   { label: 'Unclear',   color: 'var(--color-muted)', icon: Minus },
}

const VOLUME_COLOR: Record<string, string> = {
  accumulation: 'var(--color-up)',
  distribution: 'var(--color-down)',
  neutral:      'var(--color-muted)',
}


interface Props {
  symbol: string
  /** Elite-only flag — uses the unrestricted endpoint. */
  anywhere?: boolean
}


export default function ChartVisionCard({ symbol, anywhere = false }: Props) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await api.ai.visionAnalyze(symbol, anywhere)
      setAnalysis(r)
      if (!r.available && r.notes?.length) {
        setError(`Chart vision unavailable: ${r.notes.join(', ')}`)
      }
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-[20px] border border-d-border bg-wrap overflow-hidden">
      <header className="px-5 py-3 border-b border-d-border flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-d-text-primary flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          Chart vision
          {anywhere && (
            <span className="text-[9px] font-semibold tracking-wider uppercase rounded-full px-2 py-0.5 bg-highlight/10 text-highlight border border-highlight/40">
              Elite
            </span>
          )}
        </h3>
        {!analysis && !loading && (
          <button
            onClick={run}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary-hover"
          >
            <Sparkles className="w-3 h-3" />
            Run analysis
          </button>
        )}
        {analysis && !loading && (
          <button
            onClick={run}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-d-border text-[10px] text-d-text-secondary hover:text-d-text-primary"
          >
            <Sparkles className="w-3 h-3" />
            Re-run
          </button>
        )}
      </header>

      <div className="px-5 py-4 space-y-3">
        {loading && (
          <div className="flex items-center gap-2 text-[12px] text-d-text-muted">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Reading the chart…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-down/40 bg-down/10 px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-down mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-down">{error}</p>
              {error.toLowerCase().includes('restricted') && (
                <Link
                  href="/pricing"
                  className="inline-block mt-1 text-[11px] text-primary hover:underline"
                >
                  Upgrade to Elite for chart vision on any symbol →
                </Link>
              )}
            </div>
          </div>
        )}

        {!analysis && !loading && !error && (
          <p className="text-[12px] text-d-text-muted leading-relaxed">
            Our vision engine reads a 120-bar candlestick chart and returns trend,
            pattern, support/resistance, and a plain-language setup thesis.
            One-click — no prompts.
          </p>
        )}

        {analysis && analysis.available && !loading && (
          <AnalysisView a={analysis} />
        )}
      </div>
    </section>
  )
}


/* ───────────────────────── components ───────────────────────── */


export function AnalysisView({ a }: { a: Analysis }) {
  const trendMeta = a.trend ? (TREND_META[a.trend] || TREND_META.unclear) : TREND_META.unclear
  const TrendIcon = trendMeta.icon
  const setupColor =
    a.setup?.includes('bullish') ? 'var(--color-up)'
    : a.setup?.includes('bearish') ? 'var(--color-down)'
    : 'var(--color-warning)'

  return (
    <div className="space-y-3">
      {/* Top chips row */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase rounded-full px-2 py-0.5 border"
          style={{ color: trendMeta.color, borderColor: `color-mix(in srgb, ${trendMeta.color} 33%, transparent)`, background: `color-mix(in srgb, ${trendMeta.color} 8%, transparent)` }}
        >
          <TrendIcon className="w-3 h-3" />
          {trendMeta.label}
        </span>
        {a.pattern && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 border border-d-border bg-main text-d-text-secondary">
            {a.pattern}
          </span>
        )}
        {a.volume_signal && (
          <span
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 border"
            style={{
              color: VOLUME_COLOR[a.volume_signal],
              borderColor: `color-mix(in srgb, ${VOLUME_COLOR[a.volume_signal]} 33%, transparent)`,
              background: `color-mix(in srgb, ${VOLUME_COLOR[a.volume_signal]} 8%, transparent)`,
            }}
          >
            <Activity className="w-3 h-3" />
            {a.volume_signal}
          </span>
        )}
        {a.confidence != null && (
          <span className="text-[10px] text-d-text-muted numeric ml-auto">
            conf {a.confidence}
          </span>
        )}
      </div>

      {/* Setup banner */}
      {a.setup && (
        <div
          className="rounded-xl border px-3 py-2"
          style={{ borderColor: `color-mix(in srgb, ${setupColor} 33%, transparent)`, background: `color-mix(in srgb, ${setupColor} 6%, transparent)` }}
        >
          <p className="text-[10px] uppercase tracking-wider text-d-text-muted mb-0.5">Setup</p>
          <p className="text-[13px] font-semibold capitalize" style={{ color: setupColor }}>
            {a.setup}
          </p>
        </div>
      )}

      {/* Levels */}
      <div className="grid grid-cols-2 gap-2">
        <LevelBox label="Support" values={a.support_levels} color="var(--color-up)" />
        <LevelBox label="Resistance" values={a.resistance_levels} color="var(--color-down)" />
      </div>

      {/* Narrative */}
      {a.narrative && (
        <div className="rounded-xl bg-main border border-d-border px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-d-text-muted mb-1">Read</p>
          <p className="text-[12px] text-d-text-primary leading-relaxed">{a.narrative}</p>
        </div>
      )}

      <p className="text-[9px] text-d-text-muted pt-1 border-t border-d-border flex items-center gap-1">
        Powered by our <ModelBadge modelKey="sentiment_engine" size="xs" /> vision extension — read is a snapshot, not investment advice.
      </p>
    </div>
  )
}


function LevelBox({
  label,
  values,
  color,
}: {
  label: string
  values: number[]
  color: string
}) {
  return (
    <div className="rounded-xl bg-main border border-d-border px-3 py-2">
      <p className="text-[9px] uppercase tracking-wider text-d-text-muted">{label}</p>
      {values.length === 0 ? (
        <p className="text-[12px] text-d-text-muted mt-0.5">—</p>
      ) : (
        <div className="flex flex-wrap gap-1 mt-1">
          {values.map((v, i) => (
            <span
              key={i}
              className="numeric text-[11px] font-semibold px-2 py-0.5 rounded-full border"
              style={{ color, borderColor: `color-mix(in srgb, ${color} 25%, transparent)`, background: `color-mix(in srgb, ${color} 6%, transparent)` }}
            >
              ₹{v.toFixed(2)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
