'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, ChevronDown, Loader2, Sparkles } from '@/lib/icons'
import { api } from '@/lib/api'
import { EyebrowMono } from '@/components/foundation'
import { MONO } from '@/lib/tokens'
import {
  type DeltaVariant,
  type RiskProfile as TierRiskProfile,
  type Tier,
  quizRecCopy,
  quizRecDelta,
  quizRecReason,
  tierRank,
} from '@/lib/tierUpsell'

type RiskProfile = TierRiskProfile | null
type Message = { type: 'success' | 'error'; text: string } | null

type TierInfo = { tier: Tier; is_admin: boolean; copilot_daily_cap: number }
type QuizRec = { recommended_tier: Tier; risk_profile: RiskProfile } | null

export default function TierPanel({
  tierInfo,
  onLoad,
  setMessage,
  quizRec,
}: {
  tierInfo: TierInfo | null
  onLoad: (v: TierInfo) => void
  setMessage: (m: Message) => void
  quizRec: QuizRec
}) {
  useEffect(() => {
    if (tierInfo) return
    api.user.getTier()
      .then((t) => onLoad({ tier: t.tier, is_admin: t.is_admin, copilot_daily_cap: t.copilot_daily_cap }))
      .catch(() => setMessage({ type: 'error', text: 'Failed to load tier info' }))
  }, [tierInfo, onLoad, setMessage])

  // Per-session dismiss for the recommendation banner. Same helper as
  // /pricing so a dismiss in one surface mutes the other.
  const [recDismissed, setRecDismissed] = useState(false)
  // Collapsed by default; expanding reveals 3-bullet delta.
  const [recExpanded, setRecExpanded] = useState(false)
  useEffect(() => {
    if (!quizRec) return
    let active = true
    import('@/lib/quizRecDismiss').then(({ isQuizRecDismissed }) => {
      if (!active) return
      if (quizRec.recommended_tier === 'free') return
      setRecDismissed(isQuizRecDismissed(quizRec.recommended_tier))
    }).catch(() => {})
    return () => { active = false }
  }, [quizRec])

  if (!tierInfo) {
    return <div className="flex items-center justify-center min-h-[200px]"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
  }

  const tierMeta: Record<Tier, { name: string; price: string; bullets: string[]; cta: string; href: string }> = {
    free: {
      name: 'Free',
      price: '₹0',
      bullets: [
        '1 Alpha Pick / day',
        'Copilot 5 messages / day',
        'Paper trading + League',
        'Watchlist (5 symbols) + Telegram digest',
      ],
      cta: 'Upgrade to Pro',
      href: '/pricing',
    },
    pro: {
      name: 'Pro',
      price: '₹999/mo',
      bullets: [
        'Unlimited swing + intraday signals',
        'Momentum Picks + Scanner Lab',
        'Copilot 150 messages / day',
        'WhatsApp digest + Alerts Studio',
        'Portfolio Doctor + Weekly Review',
      ],
      cta: 'Upgrade to Elite',
      href: '/pricing',
    },
    elite: {
      name: 'Elite',
      price: '₹1,999/mo',
      bullets: [
        'AutoPilot (live auto-trader)',
        'F&O strategies',
        'Counterpoint debate on signals',
        'Copilot unlimited',
        'Portfolio Doctor unlimited',
      ],
      cta: 'Manage billing',
      href: '/pricing',
    },
  }
  const current = tierMeta[tierInfo.tier] ?? tierMeta.free

  const showQuizRec =
    quizRec !== null &&
    quizRec.recommended_tier !== 'free' &&
    tierRank(quizRec.recommended_tier) > tierRank(tierInfo.tier) &&
    !recDismissed
  const recCopy = showQuizRec ? quizRecCopy(quizRec!.recommended_tier) : null

  const recReason = showQuizRec
    ? quizRecReason(quizRec!.recommended_tier, quizRec!.risk_profile)
    : null

  // A/B variant. Fires EXPERIMENT_EXPOSED on tier-tab mount so Settings
  // users count toward the denominator.
  const [recVariant, setRecVariant] = useState<DeltaVariant>('feature_led')
  useEffect(() => {
    if (!showQuizRec) return
    let active = true
    Promise.all([
      import('@/lib/abVariant'),
      import('@/lib/supabase').then((m) => m.supabase.auth.getUser()),
    ]).then(([mod, userResp]) => {
      if (!active) return
      const uid = userResp?.data?.user?.id ?? null
      const v = mod.getVariant('quiz_rec_delta_copy', ['feature_led', 'outcome_led'] as const, uid)
      setRecVariant(v)
      // Tag exposure with tier so per-arm conversion is decomposable by
      // tier. tierInfo is non-null here since showQuizRec is gated on it.
      void mod.reportExposure('quiz_rec_delta_copy', v, {
        current_tier: tierInfo?.tier ?? null,
      })
    }).catch(() => {})
    return () => { active = false }
  }, [showQuizRec, tierInfo?.tier])

  const recDelta = showQuizRec
    ? quizRecDelta(tierInfo.tier, quizRec!.recommended_tier, recVariant)
    : null

  return (
    <div className="space-y-6">
      <div>
        <EyebrowMono className="mb-2">Tier + billing</EyebrowMono>
        <h2 className="font-display text-xl font-semibold text-d-text-primary mb-1">Tier + billing</h2>
        <p className="text-sm text-d-text-muted">Your current plan, usage, and upgrade options.</p>
      </div>

      {showQuizRec && recCopy && (
        <div className="relative rounded-sm border border-highlight/35 bg-highlight/[0.06] px-4 py-3 pr-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-highlight/[0.14] border border-highlight/40">
                <Sparkles className="w-3.5 h-3.5 text-highlight" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-d-text-primary">
                  Quiz recommended: <span className="text-highlight">{recCopy.name}</span>
                  {quizRec!.risk_profile && (
                    <span className="text-d-text-muted font-normal text-[11px] ml-2 capitalize">
                      · {quizRec!.risk_profile} risk profile
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-d-text-secondary mt-0.5 leading-relaxed">{recReason ?? recCopy.pitch}</p>
                {recDelta && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = !recExpanded
                      setRecExpanded(next)
                      // Fire on expand only. Tag with the variant rendered
                      // on this surface so /pricing and /settings share
                      // funnel decomposition by arm.
                      const tier = quizRec!.recommended_tier
                      if (next && (tier === 'pro' || tier === 'elite')) {
                        import('@/lib/reportUpgradeIntent').then(({ reportUpgradeIntent }) => {
                          void reportUpgradeIntent(tier, 'quiz_rec_what_changes', recVariant)
                        }).catch(() => {})
                      }
                    }}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-highlight hover:text-d-text-primary transition-colors"
                    aria-expanded={recExpanded}
                  >
                    {recExpanded ? 'Hide' : 'What changes for you'}
                    <ChevronDown className={`w-3 h-3 transition-transform ${recExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>
            <a
              href="/onboarding/risk-quiz"
              className="text-[11px] text-d-text-muted hover:text-d-text-primary whitespace-nowrap"
            >
              Retake quiz →
            </a>
          </div>
          {recExpanded && recDelta && (
            <ul className="mt-2 ml-11 space-y-1.5">
              {recDelta.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[11px] text-d-text-secondary leading-relaxed">
                  <CheckCircle className="w-3 h-3 text-highlight mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => {
              setRecDismissed(true)
              import('@/lib/quizRecDismiss').then(({ dismissQuizRec }) => {
                if (quizRec!.recommended_tier !== 'free') {
                  dismissQuizRec(quizRec!.recommended_tier)
                }
              }).catch(() => {})
            }}
            aria-label="Dismiss recommendation"
            className="absolute top-2 right-2 p-1 rounded text-d-text-muted hover:text-d-text-primary hover:bg-hover"
          >
            <span aria-hidden className="text-[12px] leading-none">×</span>
          </button>
        </div>
      )}

      <div className="rounded-sm border border-line border-l-2 border-l-primary bg-wrap p-5 flex flex-col md:flex-row gap-5">
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <EyebrowMono>Current plan</EyebrowMono>
            {tierInfo.is_admin && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                Admin
              </span>
            )}
          </div>
          <p className={`${MONO} text-[28px] font-semibold text-d-text-primary`}>{current.name}</p>
          <p className={`${MONO} text-[13px] text-d-text-muted`}>{current.price}</p>
          <ul className="mt-3 space-y-1">
            {current.bullets.map((b) => (
              <li key={b} className="text-[12px] text-d-text-primary flex items-start gap-1.5">
                <CheckCircle className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2 shrink-0 min-w-[180px]">
          {tierInfo.tier !== 'elite' && (
            <a
              href={current.href}
              onClick={() => {
                // Fire UPGRADE_INITIATED so the conversion-funnel report
                // can credit the Settings panel for upgrades that started
                // here vs. /pricing direct.
                const target = tierInfo.tier === 'free' ? 'pro' : 'elite'
                import('@/lib/reportUpgradeIntent').then(({ reportUpgradeIntent }) => {
                  void reportUpgradeIntent(target, 'settings_tier_panel')
                }).catch(() => {})
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] font-medium glass-control-accent rounded-full active:scale-[0.98] transition-opacity"
            >
              {current.cta}
            </a>
          )}
          <a
            href="/pricing"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] glass-control text-d-text-primary rounded-full transition-colors"
          >
            Compare plans
          </a>
        </div>
      </div>

      <div className="rounded-sm border border-line bg-wrap p-5">
        <EyebrowMono className="mb-2">Copilot usage today</EyebrowMono>
        <div className="flex items-baseline gap-2">
          <span className={`${MONO} text-[24px] font-semibold text-d-text-primary`}>{tierInfo.copilot_daily_cap}</span>
          <span className="text-[11px] text-d-text-muted">messages / day cap</span>
        </div>
        <p className="text-[11px] text-d-text-muted mt-2">
          Resets every 00:00 UTC. Exceeding the cap returns an upgrade prompt — no account penalty.
        </p>
      </div>

      <div className="rounded-sm border border-line bg-wrap p-5">
        <EyebrowMono className="mb-2">Billing history</EyebrowMono>
        <p className="text-[12px] text-d-text-muted">
          Invoice download + Razorpay subscription details — wiring lands with the Razorpay webhook PR.
        </p>
      </div>
    </div>
  )
}
