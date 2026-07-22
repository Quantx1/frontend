'use client'

/**
 * /onboarding/risk-quiz — N5 first-login wizard.
 *
 * 5-question quiz → risk profile (conservative / moderate / aggressive)
 * + recommended tier + signal-filter presets + auto-trader defaults.
 *
 * Quiz definition comes from ``/api/onboarding/quiz`` (public) so the
 * backend stays the source of truth. On submit, the result screen
 * shows the profile, rationale, and a CTA to the recommended tier
 * (upgrade) or to the dashboard (stay).
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Crown,
  LineChart,
  Loader2,
  ShieldCheck,
  Sparkles,
  Target,
} from '@/lib/icons'

import { api, handleApiError } from '@/lib/api'
import { useUiMode, type UiMode } from '@/contexts/UiModeContext'


type QuizQuestion = Awaited<ReturnType<typeof api.onboarding.quiz>>['quiz'][number]
type QuizResult = Awaited<ReturnType<typeof api.onboarding.submit>>

const PROFILE_COLOR: Record<string, string> = {
  conservative: 'var(--color-primary)',
  moderate:     'var(--color-warning)',
  aggressive:   'var(--color-warning)',
}

// Theme-aware text token per profile (the hex above stays for the faint
// border/bg tint, which reads fine; only the heading TEXT needs AA on light).
const PROFILE_TEXT: Record<string, string> = {
  conservative: 'text-signature',
  moderate:     'text-warning',
  aggressive:   'text-warning',
}

const TIER_COPY: Record<string, { label: string; icon: any; color: string }> = {
  free:  { label: 'Free',  icon: ShieldCheck, color: 'text-signature' },
  pro:   { label: 'Pro',   icon: Target,      color: 'text-signature' },
  elite: { label: 'Elite', icon: Crown,       color: 'text-warning' },
}


export default function RiskQuizPage() {
  const router = useRouter()
  const { setMode } = useUiMode()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [modeStep, setModeStep] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const [q, s] = await Promise.all([
          api.onboarding.quiz(),
          api.onboarding.status().catch(() => null),
        ])
        setQuestions(q.quiz || [])
        if (s?.completed) {
          // Already onboarded — bounce to the /copilot home.
          router.replace('/copilot')
          return
        }
      } catch (err) {
        setError(handleApiError(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const current = questions[idx]
  const isFirst = idx === 0
  const isLast = idx === questions.length - 1
  const progress = questions.length
    ? Math.round(((Object.keys(answers).length) / questions.length) * 100)
    : 0
  const canAdvance = current ? Boolean(answers[current.key]) : false
  const allAnswered = useMemo(
    () => questions.every((q) => Boolean(answers[q.key])),
    [questions, answers],
  )

  const pick = (value: string) => {
    if (!current) return
    setAnswers((a) => ({ ...a, [current.key]: value }))
    // Auto-advance unless last — user still gets to confirm on the final
    // question since submit is an explicit click.
    if (!isLast) {
      setTimeout(() => setIdx((i) => Math.min(i + 1, questions.length - 1)), 200)
    }
  }

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const r = await api.onboarding.submit(answers)
      setResult(r)
      // PR 118 — invalidate cache so /pricing + /settings reflect the
      // new recommended_tier without waiting for the 5-min TTL.
      try {
        const { invalidateOnboardingStatus } = await import('@/lib/onboardingStatusCache')
        invalidateOnboardingStatus()
      } catch {}
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const skip = async () => {
    try {
      await api.onboarding.skip()
      try {
        const { invalidateOnboardingStatus } = await import('@/lib/onboardingStatusCache')
        invalidateOnboardingStatus()
      } catch {}
      router.replace('/copilot')
    } catch (err) {
      setError(handleApiError(err))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  if (result) {
    // Dual-mode 2026-06-12 — after the result, ask HOW they want to use
    // Quant X (managed vs pro) before finishing onboarding. Broker-connect
    // is now Step 1 (before the quiz), so the quiz forwards to /complete.
    if (!modeStep) {
      return <ResultScreen result={result} onDone={() => setModeStep(true)} />
    }
    return (
      <ModeChoiceScreen
        recommended={answers.experience === 'new' ? 'managed' : 'pro'}
        onChoose={async (m) => {
          await setMode(m)
          router.replace('/onboarding/complete')
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-main text-d-text-primary">
      <main className="max-w-2xl mx-auto px-4 md:px-6 py-10 md:py-16">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase text-primary">
              <Sparkles className="w-3 h-3" />
              Calibrate the AI · 60 seconds
            </div>
            <button
              onClick={skip}
              className="text-[11px] text-d-text-muted hover:text-d-text-primary"
            >
              Skip for now
            </button>
          </div>
          <h1 className="text-[28px] md:text-[32px] font-semibold leading-tight">
            Teach AutoPilot how you trade.
          </h1>
          <p className="text-[13px] text-d-text-muted mt-2">
            5 quick questions set how the risk engine sizes positions for you, plus your
            tier, signal filters, and hands-free defaults.
          </p>

          {/* Progress */}
          <div className="mt-5 relative h-1 bg-wrap rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-d-text-muted mt-1 numeric">
            Question {idx + 1} of {questions.length}
          </p>
        </header>

        {error && (
          <div className="mb-5 rounded-md border border-down/40 bg-down/10 px-3 py-2 text-[12px] text-down">
            {error}
          </div>
        )}

        {/* Active question */}
        {current && (
          <section className="rounded-xl border border-d-border bg-wrap p-5 md:p-6">
            <h2 className="text-[15px] md:text-[17px] font-semibold text-d-text-primary">
              {current.question}
            </h2>
            <div className="mt-4 space-y-2">
              {current.options.map((opt) => {
                const picked = answers[current.key] === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => pick(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-md transition-all ${
                      picked
                        ? 'glass-control-accent'
                        : 'glass-control text-d-text-secondary hover:text-d-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          picked ? 'border-primary bg-primary' : 'border-d-border'
                        }`}
                      >
                        {picked && <Check className="w-3 h-3 text-primary-foreground" />}
                      </span>
                      <span className="text-[13px]">{opt.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Nav */}
        <footer className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className="inline-flex items-center gap-1.5 text-[12px] text-d-text-muted hover:text-d-text-primary disabled:opacity-40"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {isLast ? (
            <button
              onClick={submit}
              disabled={!allAnswered || submitting}
              className="glass-control-accent inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-semibold active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {submitting ? 'Calibrating…' : 'Calibrate AutoPilot'}
            </button>
          ) : (
            <button
              onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
              disabled={!canAdvance}
              className="inline-flex items-center gap-1.5 text-[12px] text-primary disabled:opacity-40"
            >
              Next
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </footer>

        <p className="text-[10px] text-d-text-muted text-center mt-10">
          You can always change your risk profile in <Link href="/settings" className="text-primary hover:underline">Settings</Link>.
        </p>
      </main>
    </div>
  )
}


/* ───────────────────────── result screen ───────────────────────── */


function ResultScreen({ result, onDone }: { result: QuizResult; onDone: () => void }) {
  const profileColor = PROFILE_COLOR[result.risk_profile] || 'var(--color-primary)'
  const tierCopy = TIER_COPY[result.recommended_tier]
  const TierIcon = tierCopy?.icon || Sparkles

  return (
    <div className="min-h-screen bg-main text-d-text-primary">
      <main className="max-w-2xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div
          className="rounded-2xl border p-6 md:p-8"
          style={{
            borderColor: `color-mix(in srgb, ${profileColor} 33%, transparent)`,
            background: `color-mix(in srgb, ${profileColor} 3%, transparent)`,
            borderLeftWidth: 4,
          }}
        >
          <p className="text-[10px] uppercase tracking-wider text-d-text-muted">
            Your risk-engine profile
          </p>
          <h1
            className={`text-[36px] md:text-[44px] font-semibold capitalize mt-1 ${PROFILE_TEXT[result.risk_profile] || 'text-signature'}`}
          >
            {result.risk_profile}
          </h1>
          <p className="numeric text-[12px] text-d-text-muted mt-1">
            Score {result.score}/15
          </p>

          <p className="text-[13px] text-d-text-secondary leading-relaxed mt-4">
            {result.rationale}
          </p>
        </div>

        {/* Recommended tier card */}
        <section className="mt-4 rounded-xl border border-d-border bg-wrap p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-d-text-muted">
                Recommended tier
              </p>
              <p
                className={`text-[20px] font-semibold mt-1 flex items-center gap-2 ${tierCopy?.color || 'text-d-text-primary'}`}
              >
                <TierIcon className="w-5 h-5" />
                {tierCopy?.label || result.recommended_tier}
              </p>
            </div>
            <Link
              href="/pricing"
              className="glass-control inline-flex items-center gap-1.5 px-4 py-2 text-[12px] text-d-text-primary rounded-full"
            >
              See plans
            </Link>
          </div>
        </section>

        {/* Presets applied */}
        <section className="mt-4 rounded-xl border border-d-border bg-wrap p-5">
          <p className="text-[10px] uppercase tracking-wider text-d-text-muted mb-3">
            How the engines are sized for you
          </p>
          <ul className="space-y-2 text-[12px] text-d-text-secondary">
            <li>
              <span className="text-d-text-primary">Signal filter:</span>{' '}
              min confidence{' '}
              <span className="numeric text-primary">
                {result.suggested_filters.min_confidence}%
              </span>
              {result.suggested_filters.include_intraday && ' · intraday on'}
              {result.suggested_filters.include_fno && ' · F&O on'}
            </li>
            <li>
              <span className="text-d-text-primary">AutoPilot sizing:</span>{' '}
              max{' '}
              <span className="numeric text-primary">
                {result.auto_trader_defaults.max_position_pct}%
              </span>{' '}
              per position · daily loss cap{' '}
              <span className="numeric text-primary">
                {result.auto_trader_defaults.daily_loss_limit_pct}%
              </span>
            </li>
            <li>
              <span className="text-d-text-primary">Concurrent positions:</span>{' '}
              <span className="numeric text-primary">
                up to {result.auto_trader_defaults.max_concurrent_positions}
              </span>
            </li>
          </ul>
          <p className="text-[10px] text-d-text-muted mt-3">
            You can tune any of these from <Link href="/settings" className="text-primary hover:underline">Settings</Link>.
          </p>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/settings"
            className="text-[12px] text-d-text-muted hover:text-d-text-primary"
          >
            Adjust defaults
          </Link>
          <button
            onClick={onDone}
            className="glass-control-accent inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-semibold active:scale-[0.98]"
          >
            Continue
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </main>
    </div>
  )
}


/* ─────────────────────── mode choice screen ─────────────────────── */
/* Dual-mode 2026-06-12 — beginners pick "Manage it for me" (managed:
 * AutoPilot on THEIR OWN broker account, 4-item simple shell); traders
 * keep the full terminal. Switchable any time in Settings. */


function ModeChoiceScreen({
  recommended,
  onChoose,
}: {
  recommended: UiMode
  onChoose: (mode: UiMode) => void | Promise<void>
}) {
  const [busy, setBusy] = useState<UiMode | null>(null)

  const choose = async (m: UiMode) => {
    if (busy) return
    setBusy(m)
    await onChoose(m)
  }

  const options: {
    mode: UiMode
    icon: typeof Bot
    title: string
    body: string
    points: string[]
  }[] = [
    {
      mode: 'managed',
      icon: Bot,
      title: 'Manage it for me',
      body: 'AutoPilot runs the book on your own broker account: ML-ranked picks, risk-gated sizing, and exits, all inside your limits with a kill switch always in your hands.',
      points: ['Plain-language Simple view: money, risk, activity', 'No charts or jargon', 'You stay in control: pause any time'],
    },
    {
      mode: 'pro',
      icon: LineChart,
      title: "I'll trade myself",
      body: 'The full terminal: ML signals, strategy builder, scanners, walk-forward backtesting and bot execution. Every tool, full control.',
      points: ['ML signals with entry / stop / target', 'Build + walk-forward backtest strategies', 'AI agents on every page'],
    },
  ]

  return (
    <div className="min-h-screen bg-main text-d-text-primary">
      <main className="max-w-2xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <header className="mb-8 text-center">
          <h1 className="text-[28px] md:text-[34px] font-semibold">
            Hand the AI the wheel, or grip it yourself?
          </h1>
          <p className="text-[13px] text-d-text-muted mt-2">
            Same engines underneath. Switch modes any time in Settings.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {options.map((o) => {
            const Icon = o.icon
            const isRec = o.mode === recommended
            return (
              <button
                key={o.mode}
                onClick={() => choose(o.mode)}
                disabled={busy !== null}
                className="glass-control relative rounded-2xl p-6 text-left transition-colors disabled:opacity-60"
              >
                {isRec && (
                  <span className="absolute right-4 top-4 rounded bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Suggested
                  </span>
                )}
                <Icon className="h-7 w-7 text-primary" />
                <h2 className="mt-3 text-[18px] font-semibold">{o.title}</h2>
                <p className="mt-2 text-[12px] leading-relaxed text-d-text-secondary">{o.body}</p>
                <ul className="mt-3 space-y-1.5">
                  {o.points.map((p) => (
                    <li key={p} className="flex items-start gap-1.5 text-[12px] text-d-text-muted">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                  {busy === o.mode ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                  Choose
                </span>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
