'use client'

import { Card, CardBody, CardHeader } from '@/components/foundation'
import type { ManagedOverview } from '@/lib/api'
import { fmtINR, fmtSignedINR, pnlClass } from './format'

/** Plain-money view: capital, overall and today's P&L — no trader jargon. */
export default function MoneyCard({ pnl }: { pnl: ManagedOverview['pnl'] }) {
  const rows: { label: string; value: string; cls?: string }[] = [
    { label: 'Capital', value: fmtINR(pnl.capital) },
    { label: 'Overall profit', value: fmtSignedINR(pnl.total_pnl), cls: pnlClass(pnl.total_pnl) },
    { label: 'Today', value: fmtSignedINR(pnl.today_pnl), cls: pnlClass(pnl.today_pnl) },
    { label: 'On open positions', value: fmtSignedINR(pnl.unrealized_pnl), cls: pnlClass(pnl.unrealized_pnl) },
  ]
  return (
    <Card>
      <CardHeader>My money</CardHeader>
      <CardBody>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {rows.map((r) => (
            <div key={r.label}>
              <dt className="text-[11px] uppercase tracking-wide text-d-text-muted">{r.label}</dt>
              <dd className={`text-base font-semibold ${r.cls ?? 'text-d-text-primary'}`}>{r.value}</dd>
            </div>
          ))}
        </dl>
        {pnl.total_trades > 0 && (
          <p className="mt-3 border-t border-wrap-hover pt-2 text-xs text-d-text-muted">
            {pnl.total_trades} trades so far
            {pnl.win_rate !== null && <> · {pnl.win_rate}% ended in profit</>}
          </p>
        )}
      </CardBody>
    </Card>
  )
}
