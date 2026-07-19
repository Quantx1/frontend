'use client'

/**
 * News Intelligence — the cutting-edge per-stock news read.
 *
 * Multi-source (Google News + GDELT + Yahoo + RSS), de-duplicated unique
 * stories with per-story EVENT TYPE, MATERIALITY and URGENCY badges, a
 * materiality-weighted Mood, multi-model AGREEMENT ("3/3 models agree"),
 * clickable source links with outlet-corroboration counts, and a thesis-change
 * alert when news contradicts a held position. Honest-empty without news.
 */

import { useState } from 'react'
import useSWR from 'swr'
import { AlertTriangle, ExternalLink, Layers, Loader2, Newspaper, Sparkles } from '@/lib/icons'

import { Card, CardBody, CardHeader, Skeleton } from '@/components/foundation'
import { api } from '@/lib/api'

const MOOD_CLASS: Record<string, string> = {
  bullish: 'text-success', bearish: 'text-danger', neutral: 'text-d-text-muted',
}
const LABEL_DOT: Record<string, string> = {
  positive: 'bg-success', negative: 'bg-danger', neutral: 'bg-d-text-muted',
}
const IMPACT_CLASS: Record<string, string> = {
  high: 'bg-danger/15 text-danger', medium: 'bg-warning/15 text-warning', low: 'bg-wrap-hover text-d-text-muted',
}
const URGENCY_LABEL: Record<string, string> = {
  breaking: 'Breaking', recent: 'Recent', today: 'Today', older: '',
}

export default function NewsIntelligenceCard({
  symbol,
  direction,
}: {
  symbol: string
  direction?: 'LONG' | 'SHORT'
}) {
  const [narrative, setNarrative] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)

  const { data, isLoading } = useSWR(
    `newsintel:${symbol}:${direction ?? ''}`,
    () => api.screener.newsIntelligence(symbol, { direction }).catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 120_000 },
  )

  const explain = async () => {
    setExplaining(true)
    try {
      const r = await api.screener.newsIntelligence(symbol, { narrative: true, direction })
      setNarrative(r?.narrative ?? null)
    } catch { /* honest-empty */ } finally {
      setExplaining(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <span className="inline-flex items-center gap-1.5">
          <Newspaper className="h-4 w-4 text-primary" /> News intelligence
        </span>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-44 w-full rounded-lg" />
        ) : !data || !data.available ? (
          <p className="text-sm text-d-text-muted">No recent news for {symbol} across our sources.</p>
        ) : (
          <div className="space-y-4">
            {/* thesis-change alert */}
            {data.thesis?.at_risk && (
              <div className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${data.thesis.severity === 'high' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{data.thesis.reason} Review your {data.thesis.position}.</span>
              </div>
            )}

            {/* headline mood + meta */}
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-lg font-semibold capitalize ${MOOD_CLASS[data.label] ?? 'text-d-text-primary'}`}>
                  {data.label}
                </p>
                <p className="text-xs text-d-text-muted">
                  {data.story_count} unique {data.story_count === 1 ? 'story' : 'stories'}
                  {data.raw_headline_count > data.story_count && ` · ${data.raw_headline_count} headlines deduped`}
                </p>
              </div>
              {data.mood_score !== null && (
                <div className="text-right">
                  <p className={`text-xl font-semibold ${MOOD_CLASS[data.label] ?? 'text-d-text-primary'}`}>
                    {data.mood_score > 0 ? '+' : ''}{data.mood_score.toFixed(2)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-d-text-muted">materiality-weighted</p>
                </div>
              )}
            </div>

            {/* sources + models disclosure */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-d-text-muted">
              <span>Sources:</span>
              {data.providers.map((p) => (
                <span key={p} className="rounded bg-wrap-hover px-1.5 py-0.5 capitalize">{p}</span>
              ))}
              <span className="ml-1">· {data.models.length} sentiment models</span>
            </div>

            {/* event breakdown */}
            {data.event_breakdown.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.event_breakdown.map((e) => (
                  <span key={e.event} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {e.event}{e.count > 1 ? ` ×${e.count}` : ''}
                  </span>
                ))}
              </div>
            )}

            {/* unique stories */}
            <ul className="space-y-2.5 border-t border-wrap-hover pt-3">
              {data.stories.slice(0, 6).map((s, i) => (
                <li key={i} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${LABEL_DOT[s.label] ?? 'bg-d-text-muted'}`} />
                    <div className="min-w-0 flex-1">
                      {s.link ? (
                        <a href={s.link} target="_blank" rel="noopener noreferrer"
                           className="text-[13px] leading-snug text-d-text-primary hover:text-primary hover:underline">
                          {s.title}<ExternalLink className="ml-1 inline h-3 w-3 align-baseline opacity-60" />
                        </a>
                      ) : (
                        <span className="text-[13px] leading-snug text-d-text-primary">{s.title}</span>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-d-text-muted">
                        {s.event_type !== 'other' && (
                          <span className="font-medium text-d-text-secondary">{s.event_label}</span>
                        )}
                        <span className={`rounded px-1.5 py-0.5 font-medium ${IMPACT_CLASS[s.impact]}`}>{s.impact}</span>
                        {URGENCY_LABEL[s.urgency] && <span>{URGENCY_LABEL[s.urgency]}</span>}
                        <span>{s.source}</span>
                        {s.member_count > 1 && <span>· +{s.member_count - 1} more outlets</span>}
                        {s.agreement && s.agreement.models_total > 1 && (
                          <span className="inline-flex items-center gap-0.5" title="sentiment models in agreement">
                            <Layers className="h-2.5 w-2.5" />
                            {s.agreement.models_agree}/{s.agreement.models_total} agree
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {narrative ? (
              <p className="border-t border-wrap-hover pt-3 text-sm leading-relaxed text-d-text-secondary">{narrative}</p>
            ) : (
              <button onClick={explain} disabled={explaining}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-60">
                {explaining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                What does this mean?
              </button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
