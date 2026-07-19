'use client'

/**
 * BrokerLock — the "connect your broker to unlock" state shown in place of any
 * feature that needs a live broker feed (vs rendering empty/erroring data).
 *
 * Two modes:
 *  - Plain card (default) — a clean lock card.
 *  - Frosted glass (pass `children`) — blurs a decorative preview behind a
 *    frosted-glass lock overlay, the "there's data here, unlock it" tease.
 *    The preview is decorative shapes only (no fabricated prices) — honest.
 *
 * Compliance note: per-user broker OAuth is the licence-clean source for live
 * NSE market data (SEBI / NSE data-licensing). This card routes the user to
 * connect THEIR broker rather than showing scraped/uncleared data.
 */
import Link from 'next/link'
import { Lock, Plug } from '@/lib/icons'

export default function BrokerLock({
  feature,
  description,
  className = '',
  children,
}: {
  feature: string
  description?: string
  className?: string
  /** Optional decorative preview blurred behind a frosted-glass lock overlay. */
  children?: React.ReactNode
}) {
  const body = (
    <>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-wrap">
        <Lock className="h-5 w-5 text-d-text-secondary" />
      </div>
      <h3 className="text-[15px] font-semibold text-d-text-primary">
        {feature} needs a connected broker
      </h3>
      <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-d-text-muted">
        {description ||
          'This uses your live broker feed. Connect a broker to unlock it — your data stays your own.'}
      </p>
      <Link
        href="/settings?tab=broker"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plug className="h-3.5 w-3.5" /> Connect your broker
      </Link>
    </>
  )

  // Frosted-glass mode: decorative preview blurred behind the lock overlay.
  if (children) {
    return (
      <div className={`relative overflow-hidden rounded-xl border border-line ${className}`}>
        {/* Repeated so the blurred "data behind glass" fills the whole card. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 select-none opacity-70 blur-[6px] saturate-[0.5]">
          {children}
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-main/30 px-4 text-center backdrop-blur-[1.5px]">
          {body}
        </div>
      </div>
    )
  }

  return (
    <div className={`lg-surface flex flex-col items-center rounded-xl p-6 text-center ${className}`}>
      {body}
    </div>
  )
}

/**
 * OptionChainPreview — a decorative faux option-chain grid (CE · Strike · PE
 * with muted OI bars, no real numbers). Purely to sit BLURRED behind a
 * BrokerLock glass — never presented as real data.
 */
export function OptionChainPreview() {
  const rows = [0.35, 0.6, 0.85, 1, 0.75, 0.5, 0.3, 0.55]
  return (
    <div className="p-3">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 border-b border-line pb-1.5 text-[9px] uppercase tracking-wider text-d-text-muted">
        <span className="text-right">Call OI</span>
        <span className="px-6 text-center">Strike</span>
        <span>Put OI</span>
      </div>
      <div className="mt-1.5 space-y-1.5">
        {rows.map((w, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex justify-end">
              <div className="h-2 rounded-pill bg-up/40" style={{ width: `${w * 100}%` }} />
            </div>
            <div className="w-12 text-center font-mono text-[11px] text-d-text-muted">•••••</div>
            <div className="h-2 rounded-pill bg-down/40" style={{ width: `${(rows[rows.length - 1 - i]) * 100}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}
