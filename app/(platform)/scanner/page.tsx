'use client'

/**
 * /scanner — the Screener (Tradomate screen-library pattern).
 *
 * A clean gallery of prebuilt screeners grouped by trading style, each with
 * its REAL out-of-sample win-rate. Every card opens its own page at
 * /scanner/[key] with the full record + live results; result rows go on to
 * /stock/[symbol]. No embedded chat here — the ONE agent is the global
 * Copilot (⌘/ or the Ask-Copilot action), which carries page context.
 *
 * Chart Patterns is its own feature at /patterns. The old 7-tab Lab was
 * retired 2026-07-09 (Screeners/Power/MTF/Intraday/Sentiment folded into the
 * prebuilt gallery + per-screen pages; Saved scans live in /scanner/[key] →
 * "Save as screen" + the inbox alerts).
 */

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Plus, ArrowRight } from '@/lib/icons'

import {
  Badge,
  DisclaimerFooter,
  PageHeader,
  Reveal,
  Skeleton,
} from '@/components/foundation'
import { api } from '@/lib/api'
import { DataBadge } from '@/components/common/DataBadge'
import { PrebuiltScreeners } from '@/components/scanner/PrebuiltScreeners'
import { MyScreens } from '@/components/scanner/MyScreens'
import { FundamentalScreeners } from '@/components/scanner/FundamentalScreeners'

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────

export default function ScannerPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ScannerContent />
    </Suspense>
  )
}

function PageSkeleton() {
  return (
    <div className="w-full p-4 md:p-6">
      <Skeleton w="40%" h="32px" />
      <div className="mt-6 space-y-3">
        <Skeleton w="100%" h="40px" />
        <Skeleton w="100%" h="200px" />
      </div>
    </div>
  )
}

function ScannerContent() {
  const [tier, setTier] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    api.user.getTier()
      .then((t) => { setTier(t.tier); setIsAdmin(t.is_admin) })
      .catch(() => setTier('free'))
  }, [])

  return (
    <div className="w-full pb-8">
      <PageHeader
        eyebrow="Screener"
        title="Find the setup. Skip the noise."
        description="The screens Indian traders run most — grouped by style, with each screen's real historical record. Open one for live matches, or ask the Copilot for anything custom."
        actions={
          <>
            <DataBadge mode="eod" />
            {tier ? <Badge tone="primary">{isAdmin ? 'Admin' : tier.toUpperCase()}</Badge> : null}
            <Link
              href="/scanner/new"
              className="bg-gradient-cta inline-flex h-9 items-center gap-1.5 rounded-pill px-4 text-[13px] font-semibold text-on-signature transition-transform active:scale-[0.97]"
            >
              <Sparkles className="h-4 w-4" /> Create with AI
            </Link>
          </>
        }
      />

      <div className="space-y-8 px-4 py-5 md:px-6">
        {/* Create-with-AI banner — the generator entry point. */}
        <Reveal delay={0.03}>
          <Link
            href="/scanner/new"
            className="group flex items-center gap-4 rounded-xl border border-line bg-wrap p-4 transition-colors hover:border-wrap-line hover:bg-wrap-hover"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Plus className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-d-text-primary">Create a screen with AI</p>
              <p className="text-[12.5px] text-d-text-muted">
                Describe any setup in plain English — QuantX builds editable rule blocks, previews the matches, and saves it to run for you.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-d-text-muted transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>

        <Reveal delay={0.05}>
          <MyScreens />
        </Reveal>

        <Reveal delay={0.06}>
          <PrebuiltScreeners />
        </Reveal>

        <Reveal delay={0.07}>
          <FundamentalScreeners />
        </Reveal>
        <DisclaimerFooter />
      </div>
    </div>
  )
}
