'use client'

/**
 * Day1WelcomeBanner — first-trade tour CTA.
 *
 * Renders on the dashboard for first-time users only. Three concrete next
 * steps in priority order:
 *
 *   1. Start with paper trading  (₹10L paper account — no card required)
 *   2. Browse today's signals    (see the AI's current calls)
 *   3. Connect a broker          (only when ready to go live)
 *
 * Detection (props.isDay1):
 *   - totalTrades === 0   (proxy for "no trade ever placed")
 *   - openPositions === 0 (proxy for "no live activity")
 *   - !localStorage('day1_dismissed')
 *
 * Banner is dismissible — the dismiss state lives in localStorage so it
 * doesn't reappear after the user reads it once. A backend
 * onboarding_step field is the right home in a future PR; for now this
 * keeps the change contained to the frontend.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Briefcase, ShieldCheck, X } from '@/lib/icons'

import { Card, CardBody } from '@/components/foundation'

const DISMISS_KEY = 'quantx.day1_banner_dismissed'

interface Props {
  /** True when the dashboard data signals "brand new user". */
  isDay1: boolean
}

export function Day1WelcomeBanner({ isDay1 }: Props) {
  const [dismissed, setDismissed] = useState(true) // start true to avoid flash

  useEffect(() => {
    if (!isDay1) {
      setDismissed(true)
      return
    }
    try {
      const flag = localStorage.getItem(DISMISS_KEY)
      setDismissed(flag === '1')
    } catch {
      setDismissed(false)
    }
  }, [isDay1])

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Storage blocked — banner will just reappear on reload; OK.
    }
  }

  if (!isDay1 || dismissed) return null

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Welcome to Quant X
            </p>
            <h2 className="mt-0.5 text-base font-semibold text-d-text-primary">
              Three quick wins for your first day
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss welcome banner"
            className="rounded-md p-1 text-d-text-muted transition-colors hover:bg-wrap-hover hover:text-d-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <CtaCard
            href="/paper-trading"
            icon={<BookOpen className="h-4 w-4 text-primary" />}
            title="Start paper trading"
            sub="₹10L practice account. No card required."
            label="Place a paper trade"
          />
          <CtaCard
            href="/signals"
            icon={<Briefcase className="h-4 w-4 text-primary" />}
            title="See today's signals"
            sub="The AI's ranked calls for the next session."
            label="Browse signals"
          />
          <CtaCard
            href="/onboarding/broker-connect"
            icon={<ShieldCheck className="h-4 w-4 text-primary" />}
            title="Connect a broker"
            sub="Zerodha · Upstox · Angel — read-only OAuth."
            label="Link broker"
          />
        </div>
      </CardBody>
    </Card>
  )
}

function CtaCard({
  href,
  icon,
  title,
  sub,
  label,
}: {
  href: string
  icon: React.ReactNode
  title: string
  sub: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="group block rounded-md border border-line bg-main p-3 transition-colors hover:border-primary/40 hover:bg-wrap-hover"
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold text-d-text-primary">{title}</p>
      </div>
      <p className="mt-1 text-[11px] text-d-text-muted">{sub}</p>
      <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary group-hover:underline">
        {label}
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </p>
    </Link>
  )
}
