'use client'

/**
 * Weekly Review card — renders the persisted weekly portfolio review.
 *
 * Cost-frugal by design: reads the row the Sunday cron already generated
 * (GET /weekly-review/latest) — ZERO LLM tokens per view. The optional
 * "Regenerate" button is the only on-demand LLM path (Pro+, rare). Honest-empty
 * when no review exists yet (never auto-generates on view).
 */

import { useEffect, useState } from 'react'
import { CalendarRange, RefreshCw, TrendingUp, TrendingDown } from '@/lib/icons'

import { api } from '@/lib/api'

interface Review {
  week_of: string
  content_markdown: string
  week_return_pct: number | null
  nifty_return_pct: number | null
  generated_at: string
}

export default function WeeklyReviewCard() {
  const [review, setReview] = useState<Review | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const r = await api.weeklyReview.latest()
      if (r && r.content_markdown) {
        setReview(r as Review)
        setState('ok')
      } else {
        setState('empty')
      }
    } catch {
      setState('empty')
    }
  }

  useEffect(() => { load() }, [])

  const regenerate = async () => {
    setBusy(true)
    try {
      const r = await api.weeklyReview.generate?.()
      if (r && (r as Review).content_markdown) { setReview(r as Review); setState('ok') }
    } catch { /* keep current */ } finally { setBusy(false) }
  }

  if (state === 'loading') {
    return <div className="rounded-lg border border-line bg-wrap h-[120px] animate-pulse" />
  }
  if (state === 'empty') {
    return (
      <div className="rounded-lg border border-line bg-wrap p-4">
        <div className="flex items-center gap-2 text-[12px] text-d-text-muted">
          <CalendarRange className="w-3.5 h-3.5" />
          No weekly review yet — it&apos;s generated automatically every Sunday.
        </div>
      </div>
    )
  }

  const r = review!
  const out = r.week_return_pct
  const bench = r.nifty_return_pct
  const beat = out != null && bench != null ? out - bench : null

  return (
    <div className="rounded-lg border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-d-text-primary">Weekly Review</span>
          <span className="text-[10px] text-d-text-muted">week of {r.week_of}</span>
        </div>
        <button
          onClick={regenerate}
          disabled={busy}
          title="Regenerate (uses one AI call)"
          className="inline-flex items-center gap-1 text-[10px] text-d-text-muted hover:text-d-text-primary disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${busy ? 'animate-spin' : ''}`} /> Regenerate
        </button>
      </div>

      {(out != null || bench != null) && (
        <div className="flex items-center gap-5 px-4 py-2.5 border-b border-line text-[11px]">
          {out != null && (
            <span className="flex items-center gap-1">
              <span className="text-d-text-muted">You</span>
              <span className={`numeric font-medium ${out >= 0 ? 'text-up' : 'text-down'}`}>
                {out >= 0 ? '+' : ''}{out.toFixed(2)}%
              </span>
            </span>
          )}
          {bench != null && (
            <span className="flex items-center gap-1">
              <span className="text-d-text-muted">NIFTY</span>
              <span className={`numeric ${bench >= 0 ? 'text-up' : 'text-down'}`}>
                {bench >= 0 ? '+' : ''}{bench.toFixed(2)}%
              </span>
            </span>
          )}
          {beat != null && (
            <span className="flex items-center gap-1 ml-auto">
              {beat >= 0 ? <TrendingUp className="w-3 h-3 text-up" /> : <TrendingDown className="w-3 h-3 text-down" />}
              <span className={`numeric font-medium ${beat >= 0 ? 'text-up' : 'text-down'}`}>
                {beat >= 0 ? '+' : ''}{beat.toFixed(2)}% vs NIFTY
              </span>
            </span>
          )}
        </div>
      )}

      <div className="px-4 py-3">
        <Markdown text={r.content_markdown} />
      </div>
    </div>
  )
}

/** Minimal deterministic markdown -> JSX (headers / bullets / bold). 0 tokens. */
function Markdown({ text }: { text: string }) {
  const lines = (text || '').split('\n')
  const out: React.ReactNode[] = []
  let bullets: string[] = []
  const flush = () => {
    if (bullets.length) {
      out.push(
        <ul key={`u${out.length}`} className="list-disc pl-4 space-y-0.5 my-1">
          {bullets.map((b, i) => <li key={i} className="text-[12px] text-d-text-secondary leading-relaxed">{bold(b)}</li>)}
        </ul>,
      )
      bullets = []
    }
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) { flush(); continue }
    if (/^#{1,6}\s/.test(line)) {
      flush()
      out.push(<h4 key={out.length} className="text-[13px] font-semibold text-d-text-primary mt-2 mb-1">{line.replace(/^#{1,6}\s/, '')}</h4>)
    } else if (/^[-*]\s/.test(line)) {
      bullets.push(line.replace(/^[-*]\s/, ''))
    } else {
      flush()
      out.push(<p key={out.length} className="text-[12px] text-d-text-secondary leading-relaxed my-1">{bold(line)}</p>)
    }
  }
  flush()
  return <div>{out}</div>
}

function bold(s: string): (string | React.ReactNode)[] {
  const parts = s.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    /^\*\*[^*]+\*\*$/.test(p)
      ? <strong key={i} className="text-d-text-primary font-semibold">{p.slice(2, -2)}</strong>
      : p)
}
