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
import { EmbeddedAgent } from '@/components/copilot/EmbeddedAgent'
import { ChipRow, ArtifactCard, StatPills, ActionRow } from '@/components/copilot/artifacts'
import type { Tok } from '@/components/copilot/types'
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
      {/* F&O Advisor — real flow + VIX data (no LLM on load). The deep
          AI leg-builder (ai-suggest) lives in the Strategy Lab. */}
      <Reveal delay={0.04}>
        <FnoAdvisorHero onOpenLab={() => setTab('lab')} />
      </Reveal>

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

// ═══════════════════════════════════════════════════════════════════════
// F&O ADVISOR — embedded GenUI hero.
//
// LIVE mode: `run` pulls FII/DII flows + the OI-buildup buckets
// (/screener/fno/stock-scanners) and the VIX/index ticker (/public/indices)
// — both public, no LLM tokens. It reads the derivatives tape into a posture
// + a vol-aware structure hint. The real AI leg-builder (ai-suggest, LLM) and
// payoff sizing live in the Strategy Lab — the CTA links there. Degrades
// gracefully when the OI provider feed is down.
// ═══════════════════════════════════════════════════════════════════════

const fmtCr = (n?: number | null) => {
  if (n == null) return '—'
  const sign = n < 0 ? '−' : '+'
  return `${sign}₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`
}

function vixHint(vix: number | null): string {
  if (vix == null) return 'defined-risk spreads over naked legs'
  if (vix < 13) return 'low-vol, so directional debit spreads / long options carry better'
  if (vix < 18) return 'mid-vol, so defined-risk verticals beat naked legs'
  if (vix < 24) return 'elevated, so premium selling (credit spreads, iron condors) is favored'
  return 'high-vol, so sell premium but keep the wings tight'
}

// Never let one slow/stalled feed hang the agent: resolve to null after `ms`
// (and swallow rejections). The agent then renders with whatever arrived.
function settle<T>(p: Promise<T>, ms = 5000): Promise<T | null> {
  return Promise.race([
    p.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

type FnoPosture = {
  fii: number | null
  dii: number | null
  vix: number | null
  vixChg: number | null
  nifty: number | null
  bnf: number | null
  lb: number
  sb: number
  oiLive: boolean
}

function FnoAdvisorHero({ onOpenLab }: { onOpenLab: () => void }) {
  const [data, setData] = useState<FnoPosture | null>(null)

  const run = async () => {
    const [snap, idx] = await Promise.all([
      settle(api.screener.fnoStockScanners()),
      settle(api.publicTrust.indices()),
    ])
    const byKey = (k: string) => idx?.indices?.find((i) => i.key === k)
    const vix = byKey('vix')?.last ?? null
    const vixChg = byKey('vix')?.change_pct ?? null
    const nifty = byKey('nifty')?.change_pct ?? null
    const bnf = byKey('banknifty')?.change_pct ?? null
    const lb = snap?.counts?.long_buildup ?? 0
    const sb = snap?.counts?.short_buildup ?? 0
    const oiLive = (snap?.oi_source ?? '').toLowerCase() !== 'unavailable' && !!snap
    const fii = snap?.fii_dii?.fii_net ?? null
    const dii = snap?.fii_dii?.dii_net ?? null
    const posture: FnoPosture = { fii, dii, vix, vixChg, nifty, bnf, lb, sb, oiLive }
    setData(posture)

    const narration: Tok[] = []
    if (fii != null && dii != null) {
      const absorbing = fii < 0 && dii > 0
      narration.push(
        ['Today FIIs were ', 0],
        [fii < 0 ? `net sellers (${fmtCr(fii)})` : `net buyers (${fmtCr(fii)})`, 1],
        [' and DIIs ', 0],
        [dii >= 0 ? `net buyers (${fmtCr(dii)})` : `net sellers (${fmtCr(dii)})`, 1],
        [absorbing ? '. Domestic money is absorbing the foreign selling. ' : '. ', 0],
      )
    }
    if (vix != null) {
      narration.push(
        ['India VIX is ', 0],
        [vix.toFixed(1), 1],
        [vixChg != null ? ` (${vixChg >= 0 ? '+' : ''}${vixChg.toFixed(1)}%)` : '', 0],
        [`. ${vixHint(vix)}. `, 0],
      )
    }
    if (oiLive && (lb || sb)) {
      narration.push([`OI scanners flag ${lb} long-buildup vs ${sb} short-buildup names. `, 0])
    }
    narration.push(["Tell me your view and I'll size the option legs in the Strategy Lab.", 0])

    return {
      narration,
      trace: (
        <>
          FII/DII via NSE · VIX {vix != null ? vix.toFixed(1) : '—'} · OI feed {oiLive ? 'live' : 'unavailable'}
        </>
      ),
    }
  }

  return (
    <div className="space-y-2">
      <EmbeddedAgent
        name="F&O Advisor"
        scope="Derivatives agent · regime-aware VIX + flows → option structure"
        query="Reading the F&O tape live: flows, VIX, and the option structure that fits."
        run={run}
        askPrompt="Suggest an option structure for my view: neutral-to-bearish BANKNIFTY into expiry"
        renderArtifacts={(step) => {
          if (!data) return null
          return (
            <>
              {step >= 3 && (
                <ChipRow
                  label="F&O tape"
                  addable={false}
                  items={[
                    { icon: Sigma, k: 'India VIX', v: data.vix != null ? data.vix.toFixed(1) : '—' },
                    { icon: Activity, k: 'FII', v: fmtCr(data.fii) },
                    { icon: Activity, k: 'DII', v: fmtCr(data.dii) },
                  ]}
                />
              )}
              {step >= 4 && (
                <ArtifactCard title="Market posture" meta={data.oiLive ? 'OI live' : 'OI feed down'}>
                  <div className="p-3">
                    <StatPills
                      cols={4}
                      items={[
                        {
                          label: 'Nifty',
                          v: data.nifty != null ? `${data.nifty >= 0 ? '+' : ''}${data.nifty.toFixed(2)}%` : '—',
                          tone: (data.nifty ?? 0) >= 0 ? 'up' : 'down',
                        },
                        {
                          label: 'Bank Nifty',
                          v: data.bnf != null ? `${data.bnf >= 0 ? '+' : ''}${data.bnf.toFixed(2)}%` : '—',
                          tone: (data.bnf ?? 0) >= 0 ? 'up' : 'down',
                        },
                        { label: 'VIX', v: data.vix != null ? data.vix.toFixed(1) : '—', tone: 'ai' },
                        { label: 'Long/Short BU', v: data.oiLive ? `${data.lb}/${data.sb}` : '—' },
                      ]}
                    />
                  </div>
                </ArtifactCard>
              )}
              {step >= 5 && <ActionRow items={[[Layers, 'Build the legs'], [Sparkles, 'Ask Copilot']]} />}
            </>
          )
        }}
      />
      {/* Real CTA — the deep AI leg-builder + payoff sizing live in the Lab tab. */}
      <button
        type="button"
        onClick={onOpenLab}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[12px] font-medium text-d-text-secondary transition-colors hover:text-d-text-primary"
        style={{ borderColor: `color-mix(in srgb, ${AI} 30%, transparent)` }}
      >
        <Layers size={13} className="text-ai" /> Open the Strategy Lab · AI leg builder + payoff
      </button>
    </div>
  )
}
