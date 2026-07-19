'use client'

/**
 * SimpleView (WP-SIMPLEVIEW, 2026-07-02) — the plain-language "Simple view"
 * band that replaces the retired /home + /activity managed shell. A per-user
 * Simple/Full toggle lives on the real pages (/copilot home, /portfolio);
 * when ON it renders a subset of the four managed cards (reused verbatim) plus,
 * on the `home` variant, the 7-day AutoPilot activity log that used to live on
 * its own /activity page.
 *
 * The `managed:overview` aggregate is fetched ONLY when Simple view is ON (a
 * null SWR key otherwise) so Full-view users never trigger the positions /
 * trades / regime / snapshots read on the high-traffic home + portfolio pages.
 * The key matches the managed cards' `mutate('managed:overview')` calls so
 * AutoPilot toggles still refresh the band.
 *
 * "Simple view ON" is reinterpreted from UiMode via `useSimpleView`
 * ('managed' = prefers Simple), so existing managed users default to Simple ON
 * and the toggle persists cross-device through `UiModeContext.setMode`.
 */

import type { ReactNode } from 'react'
import useSWR from 'swr'
import { motion, useReducedMotion } from 'framer-motion'
import { Activity as ActivityIcon } from '@/lib/icons'
import { api, type ManagedOverview } from '@/lib/api'
import { useSimpleView } from '@/contexts/UiModeContext'
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Segmented,
  Skeleton,
  type SegmentedOption,
} from '@/components/foundation'
import { cn } from '@/lib/utils'
import HealthScoreCard from './HealthScoreCard'
import MoneyCard from './MoneyCard'
import AutopilotCard from './AutopilotCard'
import RiskRegimeCard from './RiskRegimeCard'

export type SimpleViewVariant = 'home' | 'portfolio' | 'autopilot'

const TOGGLE_OPTIONS: SegmentedOption<'simple' | 'full'>[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'full', label: 'Full' },
]

// Reduced-motion-safe staggered entrance: under `prefers-reduced-motion` the
// initial state equals the final one (no transform, no fade), so content is
// always visible by default rather than gated behind a transition.
function Enter({
  children,
  index = 0,
  reduce,
}: {
  children: ReactNode
  index?: number
  reduce: boolean | null
}) {
  if (reduce) return <>{children}</>
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// The 7-day plain-English AutoPilot log — folded here from the retired
// /activity page. Honest-empty when the AI hasn't acted. `id` anchors the
// AutopilotCard "See all activity →" in-page jump (no navigation loop).
function ActivityLog({ autopilot }: { autopilot: ManagedOverview['autopilot'] }) {
  return (
    <div id="simple-activity">
      <Card>
        <CardHeader>Last 7 days</CardHeader>
        <CardBody>
          {autopilot.activity.length === 0 ? (
            <p className="text-xs text-d-text-muted">
              {autopilot.enabled
                ? 'The AI only acts when its conditions are met — quiet weeks are normal.'
                : 'AutoPilot is off. Turn it on above — Paper AutoPilot is free, with virtual money.'}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {autopilot.activity.map((line, i) => (
                <li
                  key={i}
                  className="py-2.5 text-sm text-d-text-secondary first:pt-0 last:pb-0"
                >
                  {line}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function SimpleCards({
  variant,
  data,
  reduce,
}: {
  variant: SimpleViewVariant
  data: ManagedOverview
  reduce: boolean | null
}) {
  if (variant === 'portfolio') {
    // My-Money band: money + health + risk (no AutoPilot control on /portfolio).
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Enter index={0} reduce={reduce}>
          <MoneyCard pnl={data.pnl} />
        </Enter>
        <Enter index={1} reduce={reduce}>
          <HealthScoreCard health={data.health} />
        </Enter>
        <Enter index={2} reduce={reduce}>
          <RiskRegimeCard risk={data.risk} regime={data.regime} drawdown={data.drawdown} />
        </Enter>
      </div>
    )
  }

  if (variant === 'autopilot') {
    return (
      <div className="space-y-4">
        <Enter index={0} reduce={reduce}>
          <AutopilotCard autopilot={data.autopilot} />
        </Enter>
        <ActivityLog autopilot={data.autopilot} />
      </div>
    )
  }

  // home: all four cards + the folded 7-day activity log.
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Enter index={0} reduce={reduce}>
          <HealthScoreCard health={data.health} />
        </Enter>
        <Enter index={1} reduce={reduce}>
          <MoneyCard pnl={data.pnl} />
        </Enter>
        <Enter index={2} reduce={reduce}>
          <AutopilotCard autopilot={data.autopilot} />
        </Enter>
        <Enter index={3} reduce={reduce}>
          <RiskRegimeCard risk={data.risk} regime={data.regime} drawdown={data.drawdown} />
        </Enter>
      </div>
      <ActivityLog autopilot={data.autopilot} />
    </div>
  )
}

export default function SimpleView({
  variant,
  className,
}: {
  variant: SimpleViewVariant
  className?: string
}) {
  const { simple, setSimple } = useSimpleView()
  const reduce = useReducedMotion()

  // Gate strictly behind Simple=ON: a null key means the aggregate (which reads
  // positions/trades/regime/snapshots/profiles) never fires for Full-view users.
  const { data, isLoading } = useSWR(
    simple ? 'managed:overview' : null,
    () => api.managed.overview().catch(() => null),
    { refreshInterval: 60_000 },
  )

  const toggle = (
    <Segmented
      value={simple ? 'simple' : 'full'}
      onChange={(v) => void setSimple(v === 'simple')}
      options={TOGGLE_OPTIONS}
      size="sm"
      aria-label="Switch between Simple and Full view"
    />
  )

  // Full view — expose only the toggle so the user can switch back. The null
  // SWR key above means nothing is fetched in this branch.
  if (!simple) {
    return <div className={cn('flex justify-end', className)}>{toggle}</div>
  }

  return (
    <section aria-label="Simple view" className={cn('space-y-4', className)}>
      <div className="flex items-center justify-end">{toggle}</div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: variant === 'portfolio' ? 3 : 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : !data ? (
        <EmptyState
          tone="error"
          icon={<ActivityIcon className="h-6 w-6" />}
          title="Couldn't load your overview"
          description="Pull to refresh or try again shortly."
          size="sm"
        />
      ) : (
        <SimpleCards variant={variant} data={data} reduce={reduce} />
      )}
    </section>
  )
}
