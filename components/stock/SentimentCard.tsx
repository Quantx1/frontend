'use client'

/**
 * Sentiment — three layers, one card (2026-07-21).
 *
 * Technical sentiment (indicator/MA vote tally) · News mood (scored
 * headlines) · Market backdrop (Regime engine). Deterministic tiles load
 * free; the "AI read" button asks the grounded reasoner to fuse the
 * layers — where they agree, where they conflict, which to weight —
 * cached per symbol/day. No chat box: follow-ups go to the Copilot dock.
 */

import { useState } from 'react'
import useSWR from 'swr'
import { Loader2, Scale, Sparkles } from '@/lib/icons'

import { api } from '@/lib/api'

const toneClass = (label?: string | null): string =>
  !label ? 'text-d-text-muted'
  : label.includes('bull') ? 'text-up'
  : label.includes('bear') ? 'text-down'
  : 'text-d-text-primary'

function Tile({ title, value, sub, tone }: { title: string; value: string; sub?: string | null; tone: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2/40 p-2.5 text-center">
      <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-d-text-muted">{title}</div>
      <div className={`mt-0.5 text-[13px] font-semibold capitalize ${tone}`}>{value}</div>
      {sub && <div className="font-mono text-[9px] text-d-text-muted">{sub}</div>}
    </div>
  )
}

export default function SentimentCard({ symbol }: { symbol: string }) {
  const [narrative, setNarrative] = useState<string | null>(null)
  const [fusing, setFusing] = useState(false)

  const { data, isLoading } = useSWR(
    `sent-read:${symbol}`,
    () => api.screener.sentimentRead(symbol).catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  )

  const fuse = async () => {
    setFusing(true)
    try {
      const r = await api.screener.sentimentRead(symbol, true)
      setNarrative(r?.narrative ?? null)
    } catch {
      /* honest-empty */
    } finally {
      setFusing(false)
    }
  }

  if (isLoading) return <div className="h-[150px] animate-pulse rounded-[20px] border border-line bg-wrap" />

  const tech = data?.technical?.summary
  const news = data?.news
  const market = data?.market
  const hasAny = !!(tech || news || market)

  return (
    <div className="rounded-[20px] border border-line bg-wrap px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-3.5 w-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-d-text-primary">Sentiment</span>
          <span className="text-[10px] text-d-text-muted">technical · news · market</span>
        </div>
        {hasAny && !narrative && (
          <button
            type="button"
            onClick={fuse}
            disabled={fusing}
            className="inline-flex items-center gap-1 rounded-pill border border-ai/30 px-2 py-0.5 text-[10px] font-medium text-ai transition-colors hover:bg-ai/10 disabled:opacity-60"
          >
            {fusing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            AI read
          </button>
        )}
      </div>

      {!hasAny ? (
        <p className="text-[11px] text-d-text-muted">
          No sentiment layers available for {symbol} right now.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Tile
            title="Technical"
            value={tech ? tech.label : '—'}
            sub={tech ? `${tech.bullish}↑ ${tech.bearish}↓ ${tech.neutral}→` : 'no panel'}
            tone={toneClass(tech?.label)}
          />
          <Tile
            title="News mood"
            value={news ? news.label : 'no news'}
            sub={news ? `${news.mood_score >= 0 ? '+' : ''}${news.mood_score.toFixed(2)} · ${news.headline_count ?? '—'} heads` : null}
            tone={toneClass(news?.label)}
          />
          <Tile
            title="Market"
            value={market?.regime ?? '—'}
            sub={market?.confidence != null ? `Regime · ${Math.round(market.confidence * 100)}%` : 'Regime engine'}
            tone={
              market?.regime === 'bull' ? 'text-up' : market?.regime === 'bear' ? 'text-down' : 'text-d-text-primary'
            }
          />
        </div>
      )}

      {narrative && (
        <p className="mt-2.5 border-t border-line pt-2 text-[12px] leading-relaxed text-d-text-primary">
          {narrative}
        </p>
      )}
    </div>
  )
}
