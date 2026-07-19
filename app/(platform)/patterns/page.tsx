'use client'

/**
 * /patterns — Chart Patterns (its own AI feature, split out of the Screener).
 *
 * Stacks our chart-pattern algorithm with an ML breakout scorer, a regime
 * gate and volume confirm, then explains each match. Separate from the
 * Screener so both stay clean and focused.
 */

import { Suspense } from 'react'

import { PageHeader, Skeleton, DisclaimerFooter } from '@/components/foundation'
import { DataBadge } from '@/components/common/DataBadge'
import PatternsV2Tab from '@/components/scanner/PatternsV2Tab'

export default function PatternsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <div className="w-full pb-8">
        <PageHeader
          eyebrow="Chart Patterns"
          title="AI chart-pattern scanner"
          description="Our pattern algorithm, an ML breakout scorer, a regime gate and volume confirm — stacked, then explained. Scores are model outputs, not trade recommendations."
          actions={<DataBadge mode="eod" />}
        />
        <div className="space-y-6 px-4 py-5 md:px-6">
          <PatternsV2Tab />
          <DisclaimerFooter />
        </div>
      </div>
    </Suspense>
  )
}

function PageSkeleton() {
  return (
    <div className="w-full p-4 md:p-6">
      <Skeleton w="40%" h="32px" />
      <div className="mt-6 space-y-3">
        <Skeleton w="100%" h="40px" />
        <Skeleton w="100%" h="240px" />
      </div>
    </div>
  )
}
