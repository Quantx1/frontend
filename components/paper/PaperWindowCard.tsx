'use client'

/**
 * PaperWindowCard — "Model validation window" card for /paper-trading.
 *
 * Live Momentum/Swing signal stats vs. backtest expectations during the
 * paper evaluation window that gates real money. Honest-empty until the
 * first live signal lands after deploy; the backend computes status
 * server-side (collecting / on_track / off_track).
 */

import useSWR from 'swr'

import { api, type PaperWindowEngine } from '@/lib/api'
import { MONO } from '@/lib/tokens'

/** Card surface — xAI flat panel (matches the /paper-trading page). */
const CARD = 'rounded-[20px] border border-line bg-wrap p-4'

const STATUS_CHIP: Record<PaperWindowEngine['status'], { label: string; cls: string }> = {
  collecting: { label: 'Collecting', cls: 'border-line text-d-text-secondary' },
  on_track: { label: 'On track', cls: 'border-up/30 bg-up/10 text-up' },
  off_track: { label: 'Off track', cls: 'border-down/30 bg-down/10 text-down' },
}

/** 0..1 fraction → whole-percent string ("0.5913" → "59%"). */
function fmtHit(v: number | null): string | null {
  if (v === null) return null
  return `${Math.round(v * 100)}%`
}

/** 0..1 fraction → signed percent, trailing zero trimmed
 *  ("0.007" → "+0.7%", "0.00716" → "+0.72%"). */
function fmtExcess(v: number | null): string | null {
  if (v === null) return null
  const scaled = (v * 100).toFixed(2)
  const trimmed = scaled.endsWith('0') ? scaled.slice(0, -1) : scaled
  return `${v >= 0 ? '+' : ''}${trimmed}%`
}

export default function PaperWindowCard() {
  const { data, error, isLoading } = useSWR(
    'signals:paper-window',
    () => api.signals.getPaperWindow(),
    { revalidateOnFocus: false, refreshInterval: 60_000 },
  )

  return (
    <div className={CARD}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-d-text-muted">
            Model validation window
          </p>
          <p className="text-[11px] text-d-text-secondary mt-0.5">
            Live signals vs. backtest expectations — the real-money gate.
          </p>
        </div>
        {data?.as_of && (
          <span className={`${MONO} text-[10px] text-d-text-muted`}>as of {data.as_of}</span>
        )}
      </div>

      {/* Body — loading / error / honest-empty / engines */}
      {isLoading && !data ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4" aria-hidden="true">
          <div className="h-16 rounded-xl bg-hover animate-pulse" />
          <div className="h-16 rounded-xl bg-hover animate-pulse" />
        </div>
      ) : error && !data ? (
        <p className="mt-4 text-[11px] text-d-text-muted">
          Validation window unavailable right now — it appears once live tracking is up.
        </p>
      ) : data && data.window_start === null ? (
        <p className="mt-4 text-[11px] text-d-text-muted">
          Window starts with the first live signal after deploy.
        </p>
      ) : data ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <EngineSection name="Momentum" engine={data.engines.momentum} />
          <EngineSection name="Swing" engine={data.engines.swing} />
        </div>
      ) : null}
    </div>
  )
}

function EngineSection({ name, engine }: { name: string; engine: PaperWindowEngine }) {
  const chip = STATUS_CHIP[engine.status] ?? STATUS_CHIP.collecting
  const maturedFrac =
    engine.days_signaled > 0
      ? Math.max(0, Math.min(1, engine.days_matured / engine.days_signaled))
      : 0

  return (
    <div>
      {/* Engine name + status chip + day counter */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-d-text-primary">{name}</span>
          <span
            className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full border ${chip.cls}`}
          >
            {chip.label}
          </span>
        </div>
        <span className={`${MONO} text-[10px] text-d-text-muted`}>
          Day {engine.days_signaled} · {engine.days_matured} matured
        </span>
      </div>

      {/* Thin maturation bar — share of signaled days past the horizon. */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-hover">
        <div
          className="h-full rounded-full bg-signature transition-[width] duration-500"
          style={{ width: `${Math.round(maturedFrac * 100)}%` }}
        />
      </div>

      {/* Live vs expected */}
      <div className="mt-2 space-y-1">
        <MetricLine
          label="Hit rate"
          live={fmtHit(engine.live.hit_rate)}
          expected={`${fmtHit(engine.expected.hit_rate)} expected`}
          source={engine.expected.source}
        />
        <MetricLine
          label="Excess"
          live={fmtExcess(engine.live.mean_excess_h)}
          expected={`${fmtExcess(engine.expected.mean_excess_h)}/${engine.horizon}d expected`}
          source={engine.expected.source}
        />
      </div>
    </div>
  )
}

function MetricLine({
  label,
  live,
  expected,
  source,
}: {
  label: string
  live: string | null
  expected: string
  source: string
}) {
  return (
    <p className="text-[11px] text-d-text-secondary">
      <span className="text-d-text-muted">{label} </span>
      {live === null ? (
        <span className={`${MONO} text-d-text-muted`}>—</span>
      ) : (
        <span className={`${MONO} text-d-text-primary`}>{live}</span>
      )}{' '}
      <span className="text-d-text-muted" title={source}>
        vs {expected}
      </span>
    </p>
  )
}
