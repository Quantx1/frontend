'use client'

/**
 * NewsMoodCard — standalone on-demand news "Mood" + News Digest for ANY stock.
 *
 * Calls /api/screener/news-digest/{symbol} live (the standalone SentimentEngine
 * synthesized with the prior-day stored mood + price reaction), NOT the stored
 * news_sentiment table alone — so it works for any symbol on demand. Shows the
 * deterministic drivers always (0 LLM tokens); the grounded "what the news
 * means" narrative only on click (cached per symbol/day server-side).
 * Honest-empty when there's no recent news or the classifier is unavailable
 * (never a fabricated score). Mood was removed from the signal ensemble on
 * 2026-06-06; this card is its home.
 */

import { useState, useEffect } from 'react'
import { Newspaper, Loader2, RefreshCw } from '@/lib/icons'
import { api } from '@/lib/api'

type MoodData = Awaited<ReturnType<typeof api.screener.newsDigest>>

const LABEL_META: Record<string, { text: string; cls: string }> = {
  bullish: { text: 'Bullish', cls: 'text-up' },
  bearish: { text: 'Bearish', cls: 'text-down' },
  neutral: { text: 'Neutral', cls: 'text-d-text-muted' },
}

export default function NewsMoodCard({ symbol, autoFetch = false }: { symbol: string; autoFetch?: boolean }) {
  const [data, setData] = useState<MoodData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [llm, setLlm] = useState<'idle' | 'loading' | 'done'>('idle')

  const run = async () => {
    const sym = symbol?.trim()
    if (!sym) return
    setLoading(true)
    setError(false)
    try {
      setData(await api.screener.newsDigest(sym, false))
      setLlm('idle')
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // The grounded narrative is fetched only on click, cached per symbol/day
  // server-side. A failed explain keeps the deterministic content.
  const explain = async () => {
    const sym = symbol?.trim()
    if (!sym) return
    setLlm('loading')
    try {
      setData(await api.screener.newsDigest(sym, true))
    } catch { /* keep deterministic drivers */ }
    setLlm('done')
  }

  // Auto-load once when the caller already signalled intent (e.g. the Markets
  // lookup, where the user just searched a symbol). The stock page leaves this
  // off so sentiment is opt-in (one LLM call per click, not per page view).
  useEffect(() => {
    if (autoFetch && symbol) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Derived view-model for the meter (safe when data is null/unavailable).
  const mood = data?.facts?.mood
  const score = mood?.mean_score ?? 0
  const meta = LABEL_META[(mood?.label as string) || 'neutral'] ?? LABEL_META.neutral
  const pos = mood?.positive ?? 0
  const neu = mood?.neutral ?? 0
  const neg = mood?.negative ?? 0
  const total = Math.max(pos + neu + neg, 1)
  // score is −1..+1 → 0..100% along the bearish→bullish meter.
  const meterPct = Math.max(3, Math.min(97, ((score + 1) / 2) * 100))

  return (
    <div className="lg-surface rounded-[20px] p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-d-text-muted">
          <Newspaper className="h-3.5 w-3.5" /> News Mood{symbol ? ` · ${symbol}` : ''}
        </h3>
        <button
          onClick={run}
          disabled={loading || !symbol}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2 py-1 text-[10.5px] text-d-text-muted transition-colors hover:text-d-text-primary disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {data ? 'Refresh' : 'Check Mood'}
        </button>
      </div>

      {!data && !loading && !error && (
        <p className="mt-3 text-[12px] text-d-text-muted">
          AI-scored sentiment from recent news headlines. Tap &ldquo;Check Mood&rdquo;.
        </p>
      )}
      {loading && <p className="mt-3 text-[12px] text-d-text-muted">Reading the latest headlines…</p>}
      {error && <p className="mt-3 text-[12px] text-down">Couldn&rsquo;t fetch Mood — try again.</p>}

      {data && !data.facts?.mood && (
        <p className="mt-3 text-[12px] text-d-text-muted">
          No recent news for {data.symbol} — Mood unavailable (we don&rsquo;t fabricate a score).
        </p>
      )}

      {data && mood && (
        <div className="mt-3 space-y-4">
          {/* headline label + score */}
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className={`text-[22px] font-bold leading-none ${meta.cls}`}>{meta.text}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-d-text-muted">
                {mood.headline_count} headlines analysed
              </div>
            </div>
            <div className="text-right">
              <div className={`numeric text-[22px] font-bold leading-none ${meta.cls}`}>
                {score >= 0 ? '+' : ''}{score.toFixed(2)}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-d-text-muted">score · −1 to +1</div>
            </div>
          </div>

          {/* diverging sentiment meter — bearish ← neutral → bullish */}
          <div>
            <div
              className="relative h-2.5 rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--color-down) 0%, var(--color-warning) 50%, var(--color-up) 100%)' }}
            >
              <div className="absolute left-1/2 top-1/2 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 bg-d-text-muted/40" />
              <div
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-d-text-primary shadow"
                style={{ left: `${meterPct}%` }}
                aria-label={`Sentiment ${score.toFixed(2)}`}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[9.5px] font-medium uppercase tracking-wider">
              <span className="text-down">Bearish</span>
              <span className="text-d-text-muted">Neutral</span>
              <span className="text-up">Bullish</span>
            </div>
          </div>

          {/* headline distribution bar */}
          <div>
            <div className="flex h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="bg-up" style={{ width: `${(pos / total) * 100}%` }} />
              <div className="bg-d-text-muted/50" style={{ width: `${(neu / total) * 100}%` }} />
              <div className="bg-down" style={{ width: `${(neg / total) * 100}%` }} />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px]">
              <span className="inline-flex items-center gap-1 text-up"><span className="h-1.5 w-1.5 rounded-full bg-up" />{pos} positive</span>
              <span className="inline-flex items-center gap-1 text-d-text-muted"><span className="h-1.5 w-1.5 rounded-full bg-d-text-muted" />{neu} neutral</span>
              <span className="inline-flex items-center gap-1 text-down"><span className="h-1.5 w-1.5 rounded-full bg-down" />{neg} negative</span>
            </div>
          </div>

          {/* deterministic digest drivers + grounded "what the news means" */}
          {data.drivers.length > 0 && (
            <div className="space-y-2 border-t border-d-border pt-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider text-d-text-muted">News digest</span>
                <button
                  onClick={explain}
                  disabled={llm === 'loading'}
                  className="flex items-center gap-1 text-[11px] text-primary disabled:opacity-60"
                >
                  {llm === 'loading' && <Loader2 className="h-3 w-3 animate-spin" />}
                  {llm === 'idle' ? 'What does it mean?' : llm === 'loading' ? 'Thinking…' : 'Refresh'}
                </button>
              </div>
              {data.narrative && (
                <p className="text-[12.5px] leading-relaxed text-d-text-secondary">{data.narrative}</p>
              )}
              <ul className="space-y-1">
                {data.drivers.map((d, i) => (
                  <li key={i} className="flex gap-2 text-[11.5px] text-d-text-secondary">
                    <span className="text-primary mt-0.5">•</span>{d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* top headlines */}
          {mood.headlines.length > 0 && (
            <ul className="space-y-1.5 border-t border-d-border pt-2.5">
              {mood.headlines.slice(0, 4).map((h, i) => (
                <li key={i} className="flex gap-2 text-[11.5px] leading-snug text-d-text-secondary">
                  <span className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${h.label === 'positive' ? 'bg-up' : h.label === 'negative' ? 'bg-down' : 'bg-d-text-muted'}`} />
                  <span className="min-w-0">
                    {h.title}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="text-[10px] text-d-text-muted">AI news-sentiment · not investment advice.</p>
        </div>
      )}
    </div>
  )
}
