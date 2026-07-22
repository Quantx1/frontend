'use client'

/**
 * /fno — Unified F&O dashboard (PR-S20).
 *
 * A-to-Z hub for futures + options. Consolidates surfaces previously
 * scattered across /scanner (FnoTab) and the retired /fo-strategies. Tabs:
 *
 *   - Overview       — VIX regime + 4 index snapshot cards + strategy hints
 *   - Analysis       — derivatives analysis
 *   - Stock Scanners — Long/Short Buildup, Long Unwinding, Short Covering, OI Spike
 *   - OI Tracker     — strike-wise OI heatmap per index
 *   - Payoff Calc    — multi-leg payoff explorer (PayoffDiagram)
 *   - Strategy Lab   — the full deep workspace (FoStrategiesWorkspace), embedded
 *                      inline: recommendations, open positions w/ live MTM +
 *                      close + adjust, closed book, chain+builder, AI-suggest,
 *                      backtest. Deep-linkable via /fno?tab=lab.
 *
 * The former /fo-strategies route is 301-redirected here (?tab=lab); its
 * workspace body now lives in components/fno/FoStrategiesWorkspace.tsx so
 * users' open multi-leg paper option positions stay reachable + closeable.
 */

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Activity, Layers, Layers3, ScanLine, Sigma, Sparkles } from '@/lib/icons'

import {
  Badge,
  Button,
  Card,
  DisclaimerFooter,
  PageHeader,
  Reveal,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/foundation'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { api } from '@/lib/api'
import { AI } from '@/lib/tokens'

import FnoTab from '@/components/scanner/FnoTab'
import OiHeatmap from '@/components/fno/OiHeatmap'
import FnoStockScanners from '@/components/fno/FnoStockScanners'
import PayoffCalculator from '@/components/fno/PayoffCalculator'
import DerivativesAnalysis from '@/components/fno/DerivativesAnalysis'
import { FoStrategiesWorkspace } from '@/components/fno/FoStrategiesWorkspace'

type FnoHubTab = 'overview' | 'analysis' | 'stocks' | 'oi' | 'payoff' | 'lab'
const FNO_HUB_TABS: FnoHubTab[] = ['overview', 'analysis', 'stocks', 'oi', 'payoff', 'lab']

export default function FnoHubPage() {
  // `useSearchParams` (deep-linkable ?tab=lab — e.g. the retired /fo-strategies
  // 301 lands here) must sit inside a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <FnoHubBody />
    </Suspense>
  )
}

function FnoHubBody() {
  const params = useSearchParams()
  const requested = params.get('tab')
  const initialTab: FnoHubTab = (FNO_HUB_TABS as string[]).includes(requested ?? '')
    ? (requested as FnoHubTab)
    : 'overview'
  const [tab, setTab] = useState<FnoHubTab>(initialTab)

  return (
    <div className="w-full pb-8">
      <PageHeader
        eyebrow="AI Derivatives Desk · F&O"
        title={
          <span className="inline-flex items-center gap-2">
            F&amp;O Desk <Badge tone="warning">Elite</Badge>
          </span> as unknown as string
        }
        description="Agents read the derivatives tape live: index snapshots · per-stock OI scanners · option-chain heatmap · payoff explorer."
        actions={
          <Button
            variant="ai"
            onClick={() =>
              dispatchCopilotOpen(
                'Given the current VIX and FII/DII flows, what option strategy fits a neutral-to-bearish Nifty view?',
              )
            }
          >
            <Sparkles className="mr-1 h-4 w-4" /> Ask AI
          </Button>
        }
      />

      <div className="space-y-6 px-4 py-5 md:px-6 xl:px-8">
      {/* No embedded agent hero (chat unification 2026-07-21): the header's
          Ask AI button opens the global dock with derivatives context, and
          the deep AI leg-builder (ai-suggest) lives in the Strategy Lab tab. */}

      {/* tabs — every existing surface preserved */}
      <Reveal delay={0.08}>
        <Card className="p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="overview">
              <Sparkles className="mr-1 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analysis">
              <Sigma className="mr-1 h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="stocks">
              <ScanLine className="mr-1 h-4 w-4" />
              Stock Scanners
            </TabsTrigger>
            <TabsTrigger value="oi">
              <Layers3 className="mr-1 h-4 w-4" />
              OI Tracker
            </TabsTrigger>
            <TabsTrigger value="payoff">
              <Sigma className="mr-1 h-4 w-4" />
              Payoff Calc
            </TabsTrigger>
            <TabsTrigger value="lab">
              <Activity className="mr-1 h-4 w-4" />
              Strategy Lab
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <FnoTab />
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            <DerivativesAnalysis />
          </TabsContent>

          <TabsContent value="stocks" className="mt-4">
            <FnoStockScanners />
          </TabsContent>

          <TabsContent value="oi" className="mt-4">
            <OiHeatmap />
          </TabsContent>

          <TabsContent value="payoff" className="mt-4">
            <PayoffCalculator />
          </TabsContent>

          <TabsContent value="lab" className="mt-4">
            {/* Full F&O workspace — recommendations, open positions (30s live
                MTM + Close + Adjust), closed book, chain+builder, AI-suggest,
                backtest. Re-homed inline from the retired /fo-strategies route
                so open multi-leg paper positions stay reachable + closeable. */}
            <FoStrategiesWorkspace />
          </TabsContent>
        </Tabs>
        </Card>
      </Reveal>

      <p className="border-t border-line pt-4 text-[10px] text-d-text-muted">
        F&amp;O data via admin Kite (option chain, indices) + NSE live FII/DII API.
        When provider feeds are down, panels show the source/error tag rather than
        synthetic numbers. Lot sizes: NSE Jan-2026 revision.
      </p>
      <DisclaimerFooter />
      </div>
    </div>
  )
}

