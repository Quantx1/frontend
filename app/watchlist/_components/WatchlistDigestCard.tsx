'use client'

/**
 * Watchlist Daily Digest — per-user "what changed today" agent card.
 *
 * The watchlist analogue of MarketExplainerCard: deterministic per-symbol
 * bullets + a summary line load instantly with 0 LLM tokens; the grounded
 * AI narrative is fetched ONLY when the user clicks "Explain" (cached per
 * user/day server-side, metered by the watchlist_digest cap — a capped
 * request degrades silently to deterministic-only). Honest-empty — renders
 * null when the watchlist is empty.
 */

import { useEffect, useState } from 'react'
import { Sparkles, Loader2 } from '@/lib/icons'

import { api } from '@/lib/api'

interface DigestItem {
  symbol: string
  bullets: string[]
}

export default function WatchlistDigestCard() {
  const [items, setItems] = useState<DigestItem[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')
  const [narrative, setNarrative] = useState<string | null>(null)
  const [llm, setLlm] = useState<'idle' | 'loading' | 'done'>('idle')

  // Deterministic digest loads instantly (no LLM).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.watchlist.digest(false)
        if (cancelled) return
        if (r?.items?.length) {
          setItems(r.items)
          setSummary(r.summary)
          setState('ok')
        } else setState('empty')
      } catch { if (!cancelled) setState('empty') }
    })()
    return () => { cancelled = true }
  }, [])

  // The grounded narrative is fetched only on click, cached per user/day.
  const explain = async () => {
    setLlm('loading')
    try {
      const r = await api.watchlist.digest(true)
      setNarrative(r?.narrative || null)
      if (r?.items?.length) {
        setItems(r.items)
        setSummary(r.summary)
      }
    } catch { /* keep deterministic digest */ }
    setLlm('done')
  }

  if (state === 'loading') return <div className="rounded-[20px] border border-line bg-wrap h-[140px] animate-pulse" />
  if (state === 'empty') return null

  const withBullets = items.filter((it) => it.bullets.length > 0)

  return (
    <div className="rounded-[20px] border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Daily Digest
        </span>
        <button
          onClick={explain}
          disabled={llm === 'loading'}
          className="flex items-center gap-1 text-[11px] text-primary disabled:opacity-60"
        >
          {llm === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
          {llm === 'idle' ? 'Explain' : llm === 'loading' ? 'Thinking…' : 'Refresh'}
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {narrative && (
          <p className="text-[12.5px] leading-relaxed text-d-text-secondary">{narrative}</p>
        )}
        {summary && (
          <p className="text-[12px] text-d-text-primary">{summary}</p>
        )}
        {withBullets.length > 0 && (
          <div className="space-y-2">
            {withBullets.map((it) => (
              <div key={it.symbol}>
                <div className="text-[11.5px] font-semibold text-d-text-primary">{it.symbol}</div>
                <ul className="mt-0.5 space-y-0.5">
                  {it.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-[11.5px] text-d-text-secondary">
                      <span className="text-primary mt-0.5">•</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
