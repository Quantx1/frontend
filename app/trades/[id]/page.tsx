'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft } from '@/lib/icons'
import { AppShell } from '@/components/shell/AppShell'
import { Card, CardBody, CardHeader, DisclaimerFooter, EyebrowMono } from '@/components/foundation'
import TradeReviewCard from '@/components/journal/TradeReviewCard'

/**
 * /trades/[id] — per-trade journal entry.
 *
 * The AI review card (AIL v2 P3) reads the closed trade's real entry, exit,
 * P&L, hold duration and risk data from /api/trades/{id}/analysis and renders
 * deterministic review points instantly, with an optional grounded narrative
 * on demand. Honest-empty when the trade has no review data yet.
 */
export default function TradeDetailPage() {
  const params = useParams<{ id: string }>()

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <Link
          href="/trades"
          className="inline-flex items-center gap-1 text-xs text-d-text-muted transition-colors hover:text-d-text-primary"
        >
          <ChevronLeft className="h-3 w-3" />
          Trades
        </Link>

        <header className="space-y-1">
          <EyebrowMono>Trade #{params.id}</EyebrowMono>
          <h1 className="font-display text-xl font-normal text-d-text-primary">Trade review</h1>
          <p className="text-xs text-d-text-muted">
            Entry, exit, risk and the AI read on this trade.
          </p>
        </header>

        {/* Real per-trade AI review — deterministic points + cached grounded narrative */}
        <TradeReviewCard tradeId={params.id} />

        <Card>
          <CardHeader>Lessons</CardHeader>
          <CardBody className="text-sm text-d-text-muted">
            Per-trade notes are coming with the journal notes feature. For
            patterns across all your trades — best sessions, weekdays and
            behavioural flags — see the insights cards on the{' '}
            <Link href="/trades" className="text-primary hover:underline">
              Trades page
            </Link>
            .
          </CardBody>
        </Card>

        <DisclaimerFooter />
      </div>
    </AppShell>
  )
}
