'use client'

/**
 * TabAiRead — the AI intelligence strip at the top of each stock tab
 * (2026-07-21). One grounded, day-cached narrative per tab:
 *
 *   Engine Read  → fused-verdict narrative (why the engines land there)
 *   Why It Moves → today's move attribution narrative
 *   Forecast     → probability-honest base-rate + structure framing
 *
 * Loads lazily when its tab mounts; the backend caches per symbol/day so
 * repeat visits are instant and cost nothing. Honest failure note, never
 * a spinner forever. No chat box — follow-ups go to the Copilot dock.
 */

import { useEffect, useRef, useState } from 'react'
import { Loader2, Sparkles } from '@/lib/icons'

export default function TabAiRead({
  symbol,
  title,
  fetchNarrative,
}: {
  symbol: string
  title: string
  fetchNarrative: () => Promise<string | null>
}) {
  const [narrative, setNarrative] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')
  const ran = useRef<string | null>(null)

  useEffect(() => {
    if (ran.current === symbol) return
    ran.current = symbol
    let cancelled = false
    setState('loading')
    setNarrative(null)
    fetchNarrative()
      .then((n) => {
        if (cancelled) return
        if (n) { setNarrative(n); setState('ok') } else setState('empty')
      })
      .catch(() => { if (!cancelled) setState('empty') })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  if (state === 'empty') return null // the deterministic cards below carry the tab

  return (
    <div className="rounded-[20px] border border-ai/25 bg-wrap px-4 py-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-ai" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ai">{title}</span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">· cached for today</span>
      </div>
      {state === 'loading' ? (
        <p className="flex items-center gap-2 text-[12px] text-d-text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading the evidence for {symbol}…
        </p>
      ) : (
        <p className="text-[13px] leading-relaxed text-d-text-primary">{narrative}</p>
      )}
    </div>
  )
}
