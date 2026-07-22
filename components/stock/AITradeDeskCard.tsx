'use client'

/**
 * AI Trade Desk — the stock-page hero (2026-07-21).
 *
 * One deep-reasoning read per symbol per day: the backend fuses every
 * deterministic read (fused verdict + factors, day-move facts, volume/
 * delivery intel, CVD proxy, RS vs NIFTY, empirical base rates, cached
 * fundamentals) into a facts JSON and the deep-reasoning tier writes a
 * PM-grade read: Setup · Evidence (with the contradiction) · Scenarios ·
 * Risk · Watch.
 *
 * Cost honesty: page load fetches ONLY the free deterministic facts +
 * evidence chips (zero LLM tokens). The narrative runs on the "Generate"
 * click and is cached per symbol/day, so repeat visitors get it instantly.
 * There is deliberately NO chat box here — questions go to the Copilot
 * dock (one brain, one conversation surface).
 */

import { useState } from 'react'
import useSWR from 'swr'
import { Loader2, Sparkles } from '@/lib/icons'

import { Button, Card, CardBody, CardHeader } from '@/components/foundation'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { api } from '@/lib/api'

const SECTION_LABELS = ['Setup', 'Evidence', 'Scenarios', 'Risk', 'Watch'] as const

/** Split the labelled-paragraph narrative into [{label, text}] sections.
 *  Falls back to one unlabelled block if the model ignored the template. */
function parseSections(narrative: string): { label: string | null; text: string }[] {
  const re = new RegExp(`(?:^|\\n|\\s)(${SECTION_LABELS.join('|')}):\\s`, 'g')
  const hits = Array.from(narrative.matchAll(re)).map((m) => ({
    label: m[1],
    index: m.index ?? 0,
    end: (m.index ?? 0) + m[0].length,
  }))
  if (hits.length < 2) return [{ label: null, text: narrative.trim() }]
  return hits.map((h, i) => ({
    label: h.label,
    text: narrative.slice(h.end, hits[i + 1]?.index ?? narrative.length).trim(),
  }))
}

export default function AITradeDeskCard({ symbol }: { symbol: string }) {
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(false)

  const { data, isLoading, mutate } = useSWR(
    `deep-read:${symbol}`,
    () => api.screener.deepRead(symbol).catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  )

  const generate = async () => {
    setGenerating(true)
    setGenError(false)
    try {
      const r = await api.screener.deepRead(symbol, true)
      if (r?.narrative) await mutate(r, { revalidate: false })
      else setGenError(true)
    } catch {
      setGenError(true)
    } finally {
      setGenerating(false)
    }
  }

  const sections = data?.narrative ? parseSections(data.narrative) : null

  return (
    <Card className="border-ai/25">
      <CardHeader>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-ai" /> AI Trade Desk
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-d-text-muted">
          Deep reasoning · cached for today
        </span>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="h-24 w-full animate-pulse rounded-lg bg-d-text-muted/10" />
        ) : !data ? (
          <p className="text-sm text-d-text-muted">
            Trade Desk evidence unavailable for {symbol} right now.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Evidence chips — deterministic, always free */}
            {data.drivers?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.drivers.map((d) => (
                  <span
                    key={d}
                    className="rounded-pill border border-d-border bg-d-bg-subtle px-2 py-0.5 font-mono text-[11px] text-d-text-secondary"
                  >
                    {d}
                  </span>
                ))}
              </div>
            )}

            {sections ? (
              <div className="space-y-3">
                {sections.map((s, i) => (
                  <p key={i} className="text-sm leading-relaxed text-d-text-primary">
                    {s.label && (
                      <span className="mr-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-ai">
                        {s.label}
                      </span>
                    )}
                    {s.text}
                  </p>
                ))}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] text-d-text-muted">
                    AI synthesis over EOD published data · analysis, not investment advice.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      dispatchCopilotOpen(
                        `Walk me through the ${symbol} Trade Desk read — challenge its weakest assumption and tell me what data would change it.`,
                      )
                    }
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="ml-1">Ask Copilot about this read</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-xl text-sm text-d-text-muted">
                  One deep-reasoning pass fuses the engines, tape, delivery, relative
                  strength, base rates and fundamentals above into a PM-grade read —
                  setup, contradictions, scenarios, risk. Generated once per day.
                </p>
                <Button variant="ai" size="sm" onClick={generate} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-1.5">Reasoning over the evidence…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span className="ml-1.5">Generate deep read</span>
                    </>
                  )}
                </Button>
                {genError && (
                  <p className="w-full text-xs text-warning">
                    The deep model didn&apos;t return a read — try again in a moment.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
