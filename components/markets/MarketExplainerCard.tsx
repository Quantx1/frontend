'use client'

/**
 * AI Market Explainer — index-level plain-English market summary.
 *
 * The whole-market analogue of WhyMovingCard: deterministic drivers (NIFTY %,
 * advance/decline breadth, leading/lagging sectors, regime) load instantly with
 * 0 LLM tokens; the grounded AI narrative is fetched ONLY when the user clicks
 * "Explain" (cached per day). Honest-empty — renders null when no real facts.
 * Matches markets/BreadthCard + SectorRotationCard styling.
 */

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { Sparkles, Loader2 } from '@/lib/icons'

import { api } from '@/lib/api'

interface Resp {
  drivers: string[]
  narrative: string | null
}

// SEBI Path-A: the deterministic drivers/narrative come from the backend as
// freeform strings that embed raw NSE numbers (the NIFTY level/return and the
// India VIX level). When the viewer is NOT data-entitled (no own-broker feed /
// no licence), strip those exchange quotes but keep the qualitative read
// (breadth, leading/lagging sectors, regime) — that's our derived analysis.
const VIX_QUOTE = /\s*\(?\s*VIX\s*[-+−]?\s*[\d.]+\s*\)?/gi
const NIFTY_QUOTE = /\bNIFTY\s*(?:50\s*)?(?:is|at|closed|near|around)?\s*[-+−]?[\d.,]+\s*%?/gi
function scrubDriver(s: string): string | null {
  // Drop a bullet that is essentially a raw NIFTY quote/return.
  if (/^\s*NIFTY\b/i.test(s.trim())) return null
  const cleaned = s.replace(VIX_QUOTE, '').replace(/\s{2,}/g, ' ').replace(/\s+([.,)])/g, '$1').replace(/\(\s*\)/g, '').trim()
  return cleaned || null
}
function scrubNarrative(s: string): string {
  return s.replace(NIFTY_QUOTE, 'NIFTY').replace(VIX_QUOTE, ' VIX').replace(/\s{2,}/g, ' ').replace(/\s+([.,])/g, '$1').trim()
}

export default function MarketExplainerCard({ entitled = false }: { entitled?: boolean }) {
  const [drivers, setDrivers] = useState<string[]>([])
  const [narrative, setNarrative] = useState<string | null>(null)
  const [llm, setLlm] = useState<'idle' | 'loading' | 'done'>('idle')

  // Deterministic drivers load instantly (no LLM). SWR with retry +
  // keep-last-good — the old one-shot useEffect rendered null forever
  // after a single transient error.
  const { data: swrDrivers, isLoading } = useSWR<string[] | null>(
    'mkt-explainer-drivers',
    () => api.screener.marketExplainer(false).then((r) => (r?.drivers?.length ? r.drivers : null)).catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 300_000, keepPreviousData: true, errorRetryCount: 4 },
  )
  const state: 'loading' | 'ok' | 'empty' =
    isLoading && !swrDrivers ? 'loading' : (drivers.length || swrDrivers?.length) ? 'ok' : 'empty'
  const shownDrivers = drivers.length ? drivers : (swrDrivers ?? [])

  // The grounded narrative is day-cached server-side (one shared LLM call),
  // so we AUTO-LOAD it once the deterministic drivers land — the complete
  // "what's happening" analysis appears without a click. The button remains
  // as a manual refresh.
  const explain = async () => {
    setLlm('loading')
    try {
      const r = await api.screener.marketExplainer(true)
      setNarrative(r?.narrative || null)
      if (r?.drivers?.length) setDrivers(r.drivers)
    } catch { /* keep deterministic drivers */ }
    setLlm('done')
  }
  const autoloaded = useRef(false)
  useEffect(() => {
    if (!autoloaded.current && (swrDrivers?.length ?? 0) > 0) {
      autoloaded.current = true
      void explain()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swrDrivers])

  // Visible loading card (header + shimmer lines) — never a blank white box.
  if (state === 'loading') return (
    <div className="rounded-[20px] bg-wrap overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-line">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-[12px] font-semibold text-d-text-primary">What&rsquo;s happening in the market</span>
      </div>
      <div className="px-4 py-3.5 space-y-2.5">
        {[90, 78, 84, 68].map((w, i) => (
          <div key={i} className="h-2.5 rounded-full bg-wrap-hover animate-pulse" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
  if (state === 'empty') return null

  return (
    <div className="rounded-[20px] bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> What&rsquo;s happening in the market
        </span>
        <button
          onClick={explain}
          disabled={llm === 'loading'}
          aria-label="Refresh market analysis"
          title={llm === 'done'
            ? 'Re-checks the live facts and drivers now — the AI narrative itself regenerates once a day'
            : 'Generate the AI read over the current market facts'}
          className="glass-control-accent flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] active:scale-[0.98] disabled:opacity-60"
        >
          {llm === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
          {llm === 'idle' ? 'Explain' : llm === 'loading' ? 'Thinking…' : 'Refresh'}
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {narrative && (
          <p className="text-[12.5px] leading-relaxed text-d-text-secondary">{entitled ? narrative : scrubNarrative(narrative)}</p>
        )}
        <ul className="space-y-1">
          {(entitled ? shownDrivers : shownDrivers.map(scrubDriver).filter((d): d is string => !!d)).map((d, i) => (
            <li key={i} className="flex gap-2 text-[11.5px] text-d-text-secondary">
              <span className="text-primary mt-0.5">•</span>{d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
