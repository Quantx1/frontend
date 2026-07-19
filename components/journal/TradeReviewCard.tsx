'use client'

/**
 * Per-trade AI Trade Review — the post-mortem on ONE closed trade.
 *
 * Deterministic review bullets load on mount (use_llm=false, 0 tokens) — hit
 * target / held N days / realized R-multiple / entry vs signal. The "Get AI
 * review" button fetches the grounded narrative (use_llm=true, cached per
 * trade), user-triggered so it costs nothing until asked. Returns null when the
 * API yields nothing (honest-empty).
 */

import { useEffect, useState } from 'react'
import { ClipboardCheck, Sparkles, Loader2 } from '@/lib/icons'

import { api } from '@/lib/api'

interface Resp {
  points: string[]
  narrative: string | null
}

export default function TradeReviewCard({ tradeId }: { tradeId: string }) {
  const [points, setPoints] = useState<string[]>([])
  const [narrative, setNarrative] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r: Resp = await api.trades.reviewTrade(tradeId, false)
        if (cancelled) return
        if (r?.points?.length) {
          setPoints(r.points)
          setState('ok')
        } else {
          setState('empty')
        }
      } catch {
        if (!cancelled) setState('empty')
      }
    })()
    return () => { cancelled = true }
  }, [tradeId])

  const review = async () => {
    setBusy(true)
    try {
      const r: Resp = await api.trades.reviewTrade(tradeId, true)
      setNarrative(r?.narrative || null)
      if (r?.points?.length) setPoints(r.points)
    } catch {
      /* keep deterministic points */
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading') return <div className="rounded-lg border border-line bg-wrap h-[96px] animate-pulse" />
  if (state === 'empty' || points.length === 0) return null

  return (
    <div className="rounded-lg border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <ClipboardCheck className="w-3.5 h-3.5 text-primary" /> Trade Review
        </span>
        <button
          onClick={review}
          disabled={busy}
          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Get AI review
        </button>
      </div>

      {narrative && (
        <p className="px-4 py-2.5 text-[12px] leading-relaxed text-d-text-secondary border-b border-line">{narrative}</p>
      )}

      <ul className="px-4 py-2.5 space-y-1">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2 text-[11.5px] text-d-text-secondary">
            <span className="text-primary mt-0.5">•</span>{p}
          </li>
        ))}
      </ul>
    </div>
  )
}
