'use client'

/**
 * SignalsHub — the single /signals surface. Collapses the master blotter +
 * the 4 per-horizon pages into ONE AppShell with horizon tabs:
 *   Overview · Swing · Momentum · Positional · Intraday
 *
 * The 4 per-horizon routes still exist and 200-render (NO redirect): each
 * passes `initialHorizon` so the URL is preserved as a shareable deep-link
 * (bookmarks, the public FeatureCarousel `/signals/momentum`, copilot cards).
 *
 * URL is the source of truth: `?horizon=` wins when present, else the route's
 * own default. Tab changes `router.replace` the same path (no route remount),
 * so exactly one AppShell mounts for the whole hub. The `useSearchParams` read
 * lives inside a <Suspense> boundary (App Router requirement).
 */

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { AppShell } from '@/components/shell/AppShell'
import { Tabs, TabsList, TabsTrigger } from '@/components/foundation'
import { CATEGORIES, type CategoryId } from './categories'
import { SignalsOverview } from './SignalsOverview'
import { CategorySignalsPage } from './CategorySignalsPage'

type Horizon = 'all' | CategoryId

// Deliberate order: Overview first, Intraday last (it is broker-gated).
const TABS: { value: Horizon; label: string }[] = [
  { value: 'all', label: 'Overview' },
  { value: 'swing', label: CATEGORIES.swing.label },
  { value: 'momentum', label: CATEGORIES.momentum.label },
  { value: 'positional', label: CATEGORIES.positional.label },
  { value: 'intraday', label: CATEGORIES.intraday.label },
]

const HORIZONS: Horizon[] = ['all', 'swing', 'momentum', 'positional', 'intraday']
const isHorizon = (v: string | null): v is Horizon => v != null && (HORIZONS as string[]).includes(v)

/** Presentational shell — sticky tab strip + the active panel. Reads NO search
 *  params, so it is also safe to render as the Suspense fallback. */
function HubContent({ horizon, onChange }: { horizon: Horizon; onChange: (v: string) => void }) {
  const reduce = useReducedMotion()
  return (
    <>
      {/* sticky horizon tabs — full-bleed within the shell gutter, hairline rail */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-main px-4 pt-3 md:-mx-6 md:px-6 xl:px-8">
        <Tabs value={horizon} onValueChange={onChange}>
          <TabsList className="border-b-0">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* tab panels — crossfade on switch; reduced-motion → instant swap, content
          always visible (never gated behind the transition). */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={horizon}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 1 } : { opacity: 0, y: -6 }}
          transition={{ duration: reduce ? 0 : 0.18, ease: 'easeOut' }}
        >
          {horizon === 'all' ? (
            <SignalsOverview />
          ) : (
            <CategorySignalsPage category={horizon} embedded />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

/** URL-driven body — the only thing that reads `useSearchParams` (hence the
 *  Suspense boundary in SignalsHub). */
function HubUrlBody({ initialHorizon }: { initialHorizon: Horizon }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const param = params.get('horizon')
  const horizon: Horizon = isHorizon(param) ? param : initialHorizon

  const onChange = (next: string) => {
    if (!isHorizon(next) || next === horizon) return
    // Selecting the route's own default → clean canonical URL (drop the query);
    // otherwise pin the tab in `?horizon=` on the SAME path (no route remount).
    const url = next === initialHorizon ? pathname : `${pathname}?horizon=${next}`
    router.replace(url, { scroll: false })
  }

  return <HubContent horizon={horizon} onChange={onChange} />
}

export function SignalsHub({ initialHorizon = 'all' }: { initialHorizon?: Horizon }) {
  // EXACTLY ONE AppShell for the whole hub (the embedded bodies do not re-wrap).
  return (
    <AppShell>
      <Suspense fallback={<HubContent horizon={initialHorizon} onChange={() => {}} />}>
        <HubUrlBody initialHorizon={initialHorizon} />
      </Suspense>
    </AppShell>
  )
}
