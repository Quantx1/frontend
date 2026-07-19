'use client'

import { Card, CardBody, CardHeader } from '@/components/foundation'
import type { ManagedOverview } from '@/lib/api'

const SEVERITY_CLASS: Record<string, string> = {
  high: 'text-danger',
  medium: 'text-warning',
  low: 'text-d-text-muted',
}

const REGIME_COPY: Record<string, string> = {
  bull: 'Markets are trending up — the AI can take more positions.',
  bear: 'Markets are weak — the AI keeps exposure small.',
  sideways: 'Markets are range-bound — the AI stays selective.',
}

/** Risk level + active flags + market weather + drawdown, in plain words. */
export default function RiskRegimeCard({
  risk,
  regime,
  drawdown,
}: {
  risk: ManagedOverview['risk']
  regime: ManagedOverview['regime']
  drawdown: ManagedOverview['drawdown']
}) {
  const regimeName = regime?.name?.toLowerCase() ?? null
  return (
    <Card>
      <CardHeader>Risk &amp; market weather</CardHeader>
      <CardBody className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-wide text-d-text-muted">Your risk level</span>
          <span className="text-sm font-semibold capitalize text-d-text-primary">
            {risk.level ?? '—'}
          </span>
        </div>

        {risk.flags.length > 0 ? (
          <ul className="space-y-1.5 border-t border-wrap-hover pt-2">
            {risk.flags.map((f) => (
              <li key={f.key} className={`text-xs ${SEVERITY_CLASS[f.severity] ?? 'text-d-text-muted'}`}>
                {f.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-wrap-hover pt-2 text-xs text-d-text-muted">
            No risk warnings right now.
          </p>
        )}

        {regimeName && (
          <div className="border-t border-wrap-hover pt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wide text-d-text-muted">Market weather</span>
              <span className="text-sm font-semibold capitalize text-d-text-primary">{regimeName}</span>
            </div>
            <p className="mt-1 text-xs text-d-text-muted">
              {REGIME_COPY[regimeName] ?? 'The AI adjusts position sizes to current conditions.'}
            </p>
          </div>
        )}

        {drawdown && (
          <div className="flex items-baseline justify-between border-t border-wrap-hover pt-2">
            <span className="text-[11px] uppercase tracking-wide text-d-text-muted">Dip from your peak</span>
            <span className={`text-sm font-semibold ${drawdown.current_pct < -5 ? 'text-warning' : 'text-d-text-primary'}`}>
              {drawdown.current_pct.toFixed(1)}%
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
