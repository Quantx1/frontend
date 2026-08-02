'use client'

/**
 * Foundation InsightRail — the persistent AI "why" panel built on shadcn Card.
 *
 * A shadcn Card with a thick left-border AI accent, crisp section structure,
 * and a tinted header to signal AI ownership.
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
import { Sparkles } from 'lucide-react'
import { AiStreamingText } from '@/components/motion'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type Tone = 'up' | 'down' | 'neutral' | 'warning'

const VERDICT_CLASSES: Record<Tone, { badge: string; dot: string }> = {
  up:      { badge: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', dot: 'bg-green-500' },
  down:    { badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',         dot: 'bg-red-500' },
  warning: { badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
  neutral: { badge: 'bg-primary/10 text-primary border-primary/20',                           dot: 'bg-primary' },
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
    <Card
      className={cn(
        // Strong left accent border for AI ownership signal
        'border-l-2 border-l-primary overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <CardHeader className="flex flex-row items-center gap-2 px-4 py-3 space-y-0 border-b">
        <span className="grid size-[22px] shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="size-3" />
        </span>
        <span className="flex-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </span>
        {verdict && (
          <Badge variant="outline" className={cn('rounded px-2 py-0.5 text-[10.5px] font-semibold', vc.badge)}>
            {verdict.label}
          </Badge>
        )}
      </CardHeader>

      {/* Body */}
      <div className="flex flex-col divide-y divide-border">
        {/* Summary */}
        <CardContent className="px-4 py-3">
          <p className="text-[12.5px] leading-[1.6] text-muted-foreground">
            <AiStreamingText text={summary} />
          </p>
        </CardContent>

        {/* Drivers */}
        {drivers && drivers.length > 0 && (
          <CardContent className="px-4 py-3">
            <p className="mb-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              Drivers
            </p>
            <ul className="flex flex-col gap-1.5">
              {drivers.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <span className={cn('mt-[5px] size-1 shrink-0 rounded-full', vc.dot)} />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}

        {/* What to watch */}
        {watch && watch.length > 0 && (
          <CardContent className="px-4 py-3">
            <p className="mb-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              What to watch
            </p>
            <ul className="flex flex-col gap-1.5">
              {watch.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <span className="mt-[5px] size-1 shrink-0 rounded-full bg-amber-500" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}

        {/* Footer */}
        {footer && (
          <CardContent className="px-4 py-2.5 text-[10.5px] text-muted-foreground">
            {footer}
          </CardContent>
        )}
      </div>
    </Card>
  )
}
