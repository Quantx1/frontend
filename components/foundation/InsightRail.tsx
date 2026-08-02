'use client'

/**
 * Foundation InsightRail — the persistent AI "why" panel.
 *
 * The single feature that makes each data page read as AI-native (the
 * Intellectia / LuxAlgo "AI read" register): a tinted panel that states the
 * current read, the drivers behind it, and what to watch next — the insight
 * layer sitting beside the raw telemetry. Content is data-driven so every
 * page passes its own read; structure and styling stay identical.
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

const VERDICT_TONE: Record<Tone, string> = {
  up: 'bg-up/14 text-up',
  down: 'bg-down/14 text-down',
  warning: 'bg-warning/14 text-warning',
  neutral: 'bg-primary/14 text-primary-text',
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
  return (
    <div className={cn('insight-rail p-4', className)}>
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-ai/15 text-ai">
          <Sparkles size={13} />
        </span>
        <span className="desk-label text-d-text-secondary">{title}</span>
        {verdict && (
          <span
            className={cn(
              'ml-auto rounded-sm px-2 py-0.5 text-[11px] font-medium',
              VERDICT_TONE[verdict.tone ?? 'neutral'],
            )}
          >
            {verdict.label}
          </span>
        )}
      </div>

      <div className="mt-3 text-[13px] leading-relaxed text-d-text-secondary">
        <AiStreamingText text={summary} />
      </div>

      {drivers && drivers.length > 0 && (
        <div className="mt-4">
          <p className="desk-label mb-1.5">Drivers</p>
          <ul className="flex flex-col gap-1.5">
            {drivers.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-d-text-secondary">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ai" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {watch && watch.length > 0 && (
        <div className="mt-4">
          <p className="desk-label mb-1.5">What to watch</p>
          <ul className="flex flex-col gap-1.5">
            {watch.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-d-text-secondary">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-warning" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {footer && <div className="mt-4 border-t border-line pt-3 text-[11px] text-d-text-muted">{footer}</div>}
    </div>
  )
}
