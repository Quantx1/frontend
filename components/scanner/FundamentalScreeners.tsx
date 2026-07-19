'use client'

/**
 * FundamentalScreeners — the fundamental-screen gallery section (Phase 3).
 *
 * A separate plane from the technical prebuilt screeners: these screen the
 * fundamentals snapshot (PE / ROE / ROCE / growth / dividend / promoter).
 * Each card links to /scanner/fundamental/[preset].
 */

import Link from 'next/link'
import { ArrowRight, Coins } from '@/lib/icons'

import { FUNDAMENTAL_PRESETS } from '@/lib/prebuilt-screeners'

export function FundamentalScreeners() {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-d-text-primary">
          <Coins className="h-4 w-4 text-primary" />
          Fundamental
        </h2>
        <p className="text-[12.5px] text-d-text-muted">
          Screen by the numbers that matter to investors — valuation, quality, growth and dividends.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {FUNDAMENTAL_PRESETS.map((p) => (
          <Link
            key={p.key}
            href={`/scanner/fundamental/${p.key}`}
            className="group grid min-h-[92px] grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-line bg-wrap p-4 transition-colors hover:border-d-text-muted/40 hover:bg-wrap-hover"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13.5px] font-semibold text-d-text-primary">{p.name}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-d-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="text-[12px] text-d-text-muted">{p.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
