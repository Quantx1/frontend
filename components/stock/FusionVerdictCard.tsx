'use client'

/**
 * Fusion Verdict — the single, explainable per-symbol setup verdict.
 *
 * The "RELIANCE setup → high-quality" card: one weighted verdict fused from
 * the specialist signals (Alpha rank · trend/momentum · smart-money OI ·
 * volume · news mood · regime), each shown with its own lean. Event risk is
 * a gate (caps the verdict to "Hold off"), never a vote. Deterministic load;
 * the optional "Explain" adds a grounded narrative (cached per symbol/day).
 */

import { useState } from 'react'
import useSWR from 'swr'
import { Layers, Loader2, Sparkles } from '@/lib/icons'

import { Card, CardBody, CardHeader, Skeleton } from '@/components/foundation'
import { api } from '@/lib/api'

const LEAN_CLASS: Record<string, string> = {
  bullish: 'text-success',
  bearish: 'text-danger',
  neutral: 'text-d-text-muted',
  blocked: 'text-warning',
}

const VERDICT_CLASS: Record<string, string> = {
  'Strong setup': 'text-success',
  Constructive: 'text-success',
  Mixed: 'text-d-text-primary',
  Weak: 'text-warning',
  Avoid: 'text-danger',
  'Hold off — event risk': 'text-warning',
  'Insufficient data': 'text-d-text-muted',
}

export default function FusionVerdictCard({ symbol }: { symbol: string }) {
  const [narrative, setNarrative] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)

  const { data, isLoading } = useSWR(
    `verdict:${symbol}`,
    () => api.screener.verdict(symbol).catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 120_000 },
  )

  const explain = async () => {
    setExplaining(true)
    try {
      const r = await api.screener.verdict(symbol, true)
      setNarrative(r?.narrative ?? null)
    } catch {
      /* honest-empty */
    } finally {
      setExplaining(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <span className="inline-flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-primary" /> Fusion verdict
        </span>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : !data || data.verdict === 'Insufficient data' ? (
          <p className="text-sm text-d-text-muted">
            Not enough live signals to fuse a verdict for {symbol} right now.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xl font-semibold ${VERDICT_CLASS[data.verdict] ?? 'text-d-text-primary'}`}>
                  {data.verdict}
                </p>
                <p className="text-xs capitalize text-d-text-muted">
                  {data.direction} · fused from {data.factors.filter((f) => f.score !== null).length} signals
                </p>
              </div>
              {data.composite !== null && (
                <div className="text-right">
                  <p className="text-2xl font-semibold text-d-text-primary">{data.composite}</p>
                  <p className="text-[10px] uppercase tracking-wide text-d-text-muted">/ 100</p>
                </div>
              )}
            </div>

            {data.composite !== null && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-wrap-hover">
                <div
                  className={`h-full rounded-full ${
                    data.composite >= 58 ? 'bg-success' : data.composite >= 42 ? 'bg-warning' : 'bg-danger'
                  }`}
                  style={{ width: `${Math.max(data.composite, 2)}%` }}
                />
              </div>
            )}

            <ul className="space-y-1.5 border-t border-wrap-hover pt-3">
              {data.factors.map((f) => (
                <li key={f.key} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="text-d-text-secondary">{f.label}</span>
                  <span className={`shrink-0 font-medium capitalize ${LEAN_CLASS[f.lean] ?? 'text-d-text-muted'}`}>
                    {f.lean}
                  </span>
                </li>
              ))}
            </ul>

            {data.gated && (
              <p className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                Earnings inside the blackout window — new entries are suppressed even though the signals may look constructive.
              </p>
            )}

            {narrative ? (
              <p className="border-t border-wrap-hover pt-3 text-sm leading-relaxed text-d-text-secondary">{narrative}</p>
            ) : (
              <button
                onClick={explain}
                disabled={explaining}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-60"
              >
                {explaining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Explain this verdict
              </button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
