'use client'

/* ============================================================================
   QUANT X — Markets (§4.4)

   The page answers ONE question — "how's the market" — and then stops.

   ── What it was ───────────────────────────────────────────────────────────
   18 card surfaces, 250+ values, 19 requests, three separate breadth readings,
   the regime stated three times, and an LLM call fired on mount that the
   component's own docstring said was click-only. It was the page the
   "so much data, very congested" verdict was about.

   ── What it is ────────────────────────────────────────────────────────────
       a paragraph          ← deterministic, from the briefing service
       one card             ← NIFTY 50, today's breadth as its vote bar
       four chips           ← each a REAL follow-up turn, not a nav link
       one disclosure       ← the steps, collapsed

   Tap a chip and the answer appends below, in the same shape, offering the
   questions it did not just answer. Tap [Details] and the depth opens in a
   side panel — internals, flows, sectors, radar, news — without losing the
   sentence that sent you there.

   ── Everything here is FREE ───────────────────────────────────────────────
   Every turn renders through the template renderer: zero LLM tokens, zero
   chat credits. A free user (5 chat messages/day) can walk the entire board
   and still have all five in hand for a question no template answers. That is
   §R1, and it is why the chips are templates rather than chat messages.

   ── One request on load ───────────────────────────────────────────────────
   The seven page-level `useSWR` hooks moved into `MarketPanel`, which only
   mounts when the panel opens. The default page pays for the answer; the
   depth is a choice, and so is its cost.
   ============================================================================ */

import { useCallback, useState } from 'react'
import Link from 'next/link'

import { LineChart, Zap } from '@/lib/icons'
import { useBrokerStatus } from '@/lib/hooks/useBrokerStatus'
import { AppShell } from '@/components/shell/AppShell'
import { ContextPanel } from '@/components/shell/ContextPanel'
import { Reveal, EyebrowMono, DisclaimerFooter } from '@/components/foundation'
import { RenderedThread, type FollowUpRoute } from '@/components/copilot/RenderedThread'
import { useMarketPanelFaces } from '@/components/markets/MarketPanel'

/**
 * Chip label → the turn that answers it.
 *
 * Every one is `market_detail` with a topic, so exploring the board costs
 * nothing. A label with no route returns null and the chip stays inert — a
 * chip that renders the wrong answer is worse than one that admits it has none.
 */
const TOPIC_BY_CHIP: Record<string, string> = {
  Breadth: 'breadth',
  'FII/DII flows': 'flows',
  Sectors: 'sectors',
  "What's firing": 'firing',
}

/**
 * MarketDataGate — the SEBI Path-A gate, for a viewer with no broker feed and
 * no NSE display licence.
 *
 * It sits BELOW the answer rather than above it. The answer is built entirely
 * from safe data — global cues, EOD/derived India context, FII/DII EOD — and
 * reads identically for everyone. Leading with a gate would imply the page
 * needs a broker to be useful, which it does not.
 */
function MarketDataGate() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-wrap p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
          <Zap size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-heading text-d-text-primary">Live NSE prices &amp; flows</h2>
          <p className="mt-1 max-w-xl text-meta leading-relaxed text-d-text-muted">
            Live quotes, FII/DII flows and F&amp;O data come straight from your own broker feed.
            Connect Zerodha, Upstox or Angel One to unlock the live board — free.
          </p>
        </div>
      </div>
      <Link
        href="/onboarding/broker-connect"
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-primary px-4 py-2 text-meta font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:self-auto"
      >
        Connect broker
      </Link>
    </div>
  )
}

export default function MarketsPage() {
  const { isConnected } = useBrokerStatus()
  const dataEntitled = isConnected || process.env.NEXT_PUBLIC_LICENSED_MARKET_DATA === 'true'

  const [panelOpen, setPanelOpen] = useState(false)
  const [face, setFace] = useState('overview')
  const faces = useMarketPanelFaces(dataEntitled)

  const route: FollowUpRoute = useCallback((label) => {
    const topic = TOPIC_BY_CHIP[label]
    return topic ? { template: 'market_detail' as const, params: { topic } } : null
  }, [])

  return (
    <AppShell>
      {/* A reading column, not a dashboard grid. The answer is prose, and prose
          past ~70 characters a line stops being readable. */}
      <div className="w-full max-w-[860px] space-y-6 py-6">
        <Reveal>
          <EyebrowMono>Regime-aware desk</EyebrowMono>
          <h1 className="heading-display mt-1 flex items-center gap-2 text-title text-d-text-primary">
            <LineChart size={20} className="text-primary" /> Markets
          </h1>
        </Reveal>

        {/* The answer, and everything the user asks after it. */}
        <RenderedThread
          template="market_brief"
          route={route}
          onOpenDetails={() => {
            setFace('overview')
            setPanelOpen(true)
          }}
        />

        {!dataEntitled && <MarketDataGate />}

        <DisclaimerFooter />
      </div>

      {/* The depth. Six faces; opening it is what pays for its data. */}
      <ContextPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Market detail"
        subtitle="EOD · derived · analysis, not advice"
        faces={faces}
        value={face}
        onValueChange={setFace}
      />
    </AppShell>
  )
}
