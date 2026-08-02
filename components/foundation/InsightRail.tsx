'use client'

/**
 * Foundation InsightRail — the persistent AI "why" panel.
 *
 * Pro-finance design: a clearly AI-owned region with a strong left-border
 * accent, tinted background, and crisp section structure. Inspired by
 * Intellectia's "AI Read" panel and LuxAlgo's market context sidebar.
 *
 * @example
 *   <InsightRail
 *     verdict={{ label: 'Risk-on', tone: 'up' }}
 *     summary="Breadth firm and flows supportive; dips favoured."
 *     drivers={['FII + DII net buyers', 'VIX easing to 12.8']}
 *     watch={['INFY earnings tomorrow', 'Weekly expiry Thu']}
 *   />
 */

import * as React from 'react'
import { Sparkles } from '@/lib/icons'
import { AiStreamingText } from '@/components/motion'
import { cn } from '@/lib/utils'

type Tone = 'up' | 'down' | 'neutral' | 'warning'

const VERDICT_CLASSES: Record<Tone, { pill: string; dot: string }> = {
  up:      { pill: 'bg-up/12 text-up border border-up/20',           dot: 'bg-up' },
  down:    { pill: 'bg-down/12 text-down border border-down/20',     dot: 'bg-down' },
  warning: { pill: 'bg-warning/12 text-warning border border-warning/20', dot: 'bg-warning' },
  neutral: { pill: 'bg-primary/10 text-[color:var(--color-ai)] border border-primary/20', dot: 'bg-[color:var(--color-ai)]' },
}

interface Props {
  /** Optional headline pill (e.g. current regime / stance). */
  verdict?: { label: string; tone?: Tone }
  /** One-to-two sentence AI read — streams in on mount. */
  summary: string
  /** Bullet drivers behind the read. */
  drivers?: string[]
  /** Forward-looking "what to watch" items. */
  watch?: string[]
  /** Optional footer (e.g. confidence, model, timestamp). */
  footer?: React.ReactNode
  /** Panel title. Defaults to "AI Read". */
  title?: string
  className?: string
}

export function InsightRail({
  verdict,
  summary,
  drivers,
  watch,
  footer,
  title = 'AI Read',
  className,
}: Props) {
  const tone = verdict?.tone ?? 'neutral'
  const vc = VERDICT_CLASSES[tone]

  return (
    <div
      className={cn(
        // Strong AI-owned panel: thick left border accent, tinted bg
        'relative overflow-hidden rounded-lg border border-[color:var(--color-line)]',
        'border-l-[3px] border-l-[color:var(--color-ai)]',
        className,
      )}
      style={{
        background:
          'linear-gradient(160deg, color-mix(in srgb, var(--color-ai) 6%, transparent) 0%, transparent 50%), var(--color-wrap)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md bg-[color:var(--color-ai)]/15 text-[color:var(--color-ai)]">
          <Sparkles size={12} />
        </span>
        <span className="flex-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-d-text-muted">
          {title}
        </span>
        {verdict && (
          <span className={cn('rounded px-2 py-0.5 text-[10.5px] font-semibold', vc.pill)}>
            {verdict.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-0 divide-y divide-line">
        {/* Summary */}
        <div className="px-4 py-3">
          <p className="text-[12.5px] leading-[1.6] text-d-text-secondary">
            <AiStreamingText text={summary} />
          </p>
        </div>

        {/* Drivers */}
        {drivers && drivers.length > 0 && (
          <div className="px-4 py-3">
            <p className="mb-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-d-text-muted/70">
              Drivers
            </p>
            <ul className="flex flex-col gap-1.5">
              {drivers.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-d-text-secondary">
                  <span className={cn('mt-[5px] h-1 w-1 shrink-0 rounded-full', vc.dot)} />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What to watch */}
        {watch && watch.length > 0 && (
          <div className="px-4 py-3">
            <p className="mb-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-d-text-muted/70">
              What to watch
            </p>
            <ul className="flex flex-col gap-1.5">
              {watch.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-d-text-secondary">
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-warning" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="px-4 py-2.5 text-[10.5px] text-d-text-muted">{footer}</div>
        )}
      </div>
    </div>
  )
}
