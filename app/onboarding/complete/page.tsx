'use client'

import Link from 'next/link'
import { CheckCircle2, Sparkles } from '@/lib/icons'
import { Card, CardBody } from '@/components/foundation'
import { useBrokerStatus } from '@/lib/hooks/useBrokerStatus'

/**
 * /onboarding/complete — Step 3 of 3. Celebrates the activation and
 * routes the new user toward their first useful interaction.
 *
 * Plan 3 fires a Supabase update marking onboarding_completed=true on
 * arrival so the (platform)/layout redirect stops bouncing them here.
 */
export default function OnboardingCompletePage() {
  const { isConnected, brokerName } = useBrokerStatus()

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-12 text-center">
      <header className="space-y-3">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
          <CheckCircle2 className="h-7 w-7 text-primary" />
        </div>
        <p className="text-[11px] uppercase tracking-wider text-primary">
          Step 3 of 3
        </p>
        <h1 className="text-2xl font-semibold text-d-text-primary">
          You&apos;re set up.
        </h1>
        <p className="text-sm text-d-text-muted">
          Quant X is calibrated to your risk profile and ready to publish
          signals. Try one of these to start.
        </p>
        {isConnected ? (
          <p className="inline-flex items-center justify-center gap-1.5 text-[13px] font-medium text-up">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {brokerName} connected — live data is on.
          </p>
        ) : (
          <p className="text-[13px] text-d-text-muted">
            No broker yet — you&apos;re on the virtual ₹10L portfolio. Connect
            anytime in Settings.
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/copilot" className="contents">
          <Card variant="clickable">
            <CardBody className="space-y-1 text-left">
              <p className="text-sm font-medium text-d-text-primary">
                Open Command Center
              </p>
              <p className="text-[11px] text-d-text-muted">
                Live regime, today&apos;s top signals, your watchlist.
              </p>
            </CardBody>
          </Card>
        </Link>
        <Link href="/copilot" className="contents">
          <Card variant="clickable">
            <CardBody className="space-y-1 text-left">
              <p className="flex items-center gap-1.5 text-sm font-medium text-d-text-primary">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Ask Copilot
              </p>
              <p className="text-[11px] text-d-text-muted">
                &quot;Show me my top swing setup today.&quot;
              </p>
            </CardBody>
          </Card>
        </Link>
        <Link href="/paper-trading" className="contents">
          <Card variant="clickable">
            <CardBody className="space-y-1 text-left">
              <p className="text-sm font-medium text-d-text-primary">
                Place a paper trade
              </p>
              <p className="text-[11px] text-d-text-muted">
                ₹10L paper account seeded; equity-curve from day 1.
              </p>
            </CardBody>
          </Card>
        </Link>
        <Link href="/strategies" className="contents">
          <Card variant="clickable">
            <CardBody className="space-y-1 text-left">
              <p className="text-sm font-medium text-d-text-primary">
                Browse strategies
              </p>
              <p className="text-[11px] text-d-text-muted">
                Deploy a template or build one in plain English.
              </p>
            </CardBody>
          </Card>
        </Link>
      </div>

      <div>
        <Link
          href="/copilot"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-main transition-colors hover:bg-primary-hover"
        >
          Go to Command Center
        </Link>
      </div>
    </div>
  )
}
