'use client'

/**
 * AI Top Picks — surfaces the Alpha (Qlib Alpha158) cross-sectional ranker.
 *
 * The ranker already runs nightly over the full NSE universe and persists to
 * alpha_scores; this is the first UI to render it. Real model output only
 * (the endpoint 503s rather than fabricating); shows an "as of <date>" note
 * when served from the persisted (non-live) ranking.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, TrendingUp } from '@/lib/icons'

import { api } from '@/lib/api'
import { stockHref } from '@/lib/stock-href'
import ModelBadge from '@/components/ModelBadge'
import { SymbolLogo } from '@/components/ui/BrandLogo'

interface Pick {
  symbol: string
  rank: number
  alpha_score: number | null
}

export default function AiTopPicks({ limit = 12 }: { limit?: number }) {
  const [picks, setPicks] = useState<Pick[]>([])
  const [asOf, setAsOf] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.screener.getSwingCandidates(limit)
        if (cancelled) return
        const rows = (r?.results || []).map((p: any) => ({
          symbol: String(p.symbol || '').replace('.NS', ''),
          rank: Number(p.rank ?? 0),
          alpha_score: p.alpha_score != null ? Number(p.alpha_score) : null,
        }))
        setPicks(rows)
        setStale(!!r?.stale)
        setAsOf(r?.as_of || null)
        setState(rows.length ? 'ok' : 'empty')
      } catch {
        if (!cancelled) setState('empty')
      }
    })()
    return () => { cancelled = true }
  }, [limit])

  if (state === 'empty') return null // honest: no card when the ranker is cold

  return (
    <div className="rounded-lg border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-d-text-primary">AI Top Picks</span>
          <ModelBadge modelKey="cross_sectional_ranker" size="xs" variant="soft" />
        </div>
        {stale && asOf && (
          <span className="text-[10px] text-d-text-muted">as of {asOf}</span>
        )}
      </div>

      {state === 'loading' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-px bg-line">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-wrap p-3 animate-pulse"><div className="h-3 w-16 bg-white/5 rounded" /></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-px bg-line">
          {picks.map((p) => (
            <Link
              key={p.symbol}
              href={stockHref(p.symbol)}
              className="bg-wrap p-3 hover:bg-surface-2 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-d-text-muted">#{p.rank}</span>
                {p.alpha_score != null && (
                  <span
                    className="text-[10px] numeric font-medium flex items-center gap-0.5"
                    style={{ color: p.alpha_score >= 0 ? '#05B878' : '#FF5947' }}
                  >
                    <TrendingUp className="w-3 h-3" />
                    {p.alpha_score >= 0 ? '+' : ''}{(p.alpha_score * 100).toFixed(2)}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <SymbolLogo symbol={p.symbol} size={24} />
                <span className="text-[13px] font-semibold text-d-text-primary group-hover:text-primary transition-colors">
                  {p.symbol}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
