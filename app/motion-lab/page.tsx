'use client'

/* ============================================================================
   /motion-lab — a public, previewable showcase of the QuantX AI Motion System
   (brief §34–59). Each section demos one primitive with a replay control so the
   motion can be verified live in both themes. Not linked in nav; a design lab.
   ============================================================================ */

import { useEffect, useState } from 'react'
import {
  AiStreamingText,
  ChartDrawIn,
  SkeletonMorph,
  SkeletonText,
  SkeletonBlock,
  StatusPop,
  AgentTimeline,
  type TimelineStep,
  Stagger,
  StaggerItem,
  NumberTicker,
} from '@/components/motion'
import { MONO } from '@/lib/tokens'
import { RotateCcw, TrendingUp, TrendingDown, Sparkles, ArrowUpRight } from '@/lib/icons'

function SectionCard({
  n,
  title,
  desc,
  children,
  onReplay,
}: {
  n: string
  title: string
  desc: string
  children: React.ReactNode
  onReplay?: () => void
}) {
  return (
    <section className="elev-1 flex flex-col rounded-[20px] border border-line bg-wrap p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] text-d-text-muted ${MONO}`}>{n}</span>
            <h2 className="text-[15px] font-semibold tracking-tight text-d-text-primary">{title}</h2>
          </div>
          <p className="mt-1 text-pretty text-[12.5px] leading-relaxed text-d-text-muted">{desc}</p>
        </div>
        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className="focus-ring-ai inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-wrap-hover px-2.5 py-1.5 text-[12px] font-medium text-d-text-secondary transition-colors hover:border-primary/40 hover:text-d-text-primary"
          >
            <RotateCcw size={13} /> Replay
          </button>
        )}
      </div>
      <div className="flex min-h-[120px] flex-1 items-center justify-center rounded-2xl border border-line bg-main/40 p-5">
        {children}
      </div>
    </section>
  )
}

const DEMO_ANSWER =
  'RELIANCE is showing a bullish momentum breakout above ₹2,940 with rising volume. The 20-day and 50-day moving averages have crossed, and RSI at 62 confirms strength without being overbought. Suggested entry ₹2,948 with a stop at ₹2,890.'

const SPARK = [12, 14, 13, 16, 15, 18, 17, 21, 20, 24, 23, 28]
const SPARK_DOWN = [28, 26, 27, 24, 25, 22, 23, 19, 20, 16, 15, 12]

const BASE_STEPS: TimelineStep[] = [
  { label: 'Reading your question', status: 'pending' },
  { label: 'Fetching live NSE quotes', status: 'pending', detail: 'RELIANCE · TCS · INFY' },
  { label: 'Running momentum engine', status: 'pending' },
  { label: 'Scoring risk & position size', status: 'pending' },
  { label: 'Composing the analysis', status: 'pending' },
]

export default function MotionLabPage() {
  const [streamKey, setStreamKey] = useState(0)
  const [chartKey, setChartKey] = useState(0)
  const [statusKey, setStatusKey] = useState(0)
  const [genKey, setGenKey] = useState(0)
  const [loading, setLoading] = useState(true)

  // Drive the agent timeline through its statuses on a loop / replay.
  const [tick, setTick] = useState(0)
  const [timelineKey, setTimelineKey] = useState(0)
  useEffect(() => {
    setTick(0)
    const id = setInterval(() => {
      setTick((t) => {
        if (t >= BASE_STEPS.length) {
          clearInterval(id)
          return t
        }
        return t + 1
      })
    }, 900)
    return () => clearInterval(id)
  }, [timelineKey])

  const steps: TimelineStep[] = BASE_STEPS.map((s, i) => {
    if (i < tick) return { ...s, status: 'done', durationMs: 400 + i * 220 }
    if (i === tick) return { ...s, status: 'active' }
    return s
  })

  // Skeleton morph auto-toggles so the load→resolve moment is always visible.
  useEffect(() => {
    const id = setInterval(() => setLoading((l) => !l), 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <main className="min-h-screen bg-main px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        {/* header */}
        <header className="mb-10">
          <span className={`chip-ai inline-flex items-center gap-2 rounded-pill px-3 py-1 text-[11.5px] font-medium ${MONO}`}>
            <Sparkles size={13} /> MOTION SYSTEM · §34–59
          </span>
          <h1 className="heading-display mt-4 text-[clamp(28px,4vw,40px)] font-bold tracking-tight text-d-text-primary">
            AI Motion &amp; Generative-UI Lab
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-[15px] leading-relaxed text-d-text-secondary">
            The reusable motion language that makes QuantX feel alive — streaming answers, agent
            activity, data materialising, and resolution feedback. Every primitive is token-driven and
            respects <span className="text-d-text-primary">prefers-reduced-motion</span>.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Streaming answer */}
          <SectionCard
            n="§34"
            title="Streaming answer"
            desc="Word-by-word reveal with a soft blur-in and a live caret — the Copilot writing to you."
            onReplay={() => setStreamKey((k) => k + 1)}
          >
            <div className="w-full">
              <AiStreamingText key={streamKey} text={DEMO_ANSWER} className="text-[13.5px]" />
            </div>
          </SectionCard>

          {/* Agent activity timeline */}
          <SectionCard
            n="§37"
            title="Agent activity timeline"
            desc="Multi-step reasoning log: pending → active (spinning orb + shimmer) → done / error."
            onReplay={() => setTimelineKey((k) => k + 1)}
          >
            <div className="w-full max-w-sm">
              <AgentTimeline steps={steps} />
            </div>
          </SectionCard>

          {/* Chart draw-in */}
          <SectionCard
            n="§38"
            title="Data materialising"
            desc="Sparklines draw their path in and the area fill rises — semantic up / down tones."
            onReplay={() => setChartKey((k) => k + 1)}
          >
            <div key={chartKey} className="grid w-full grid-cols-2 gap-4">
              <div className="rounded-xl border border-line bg-wrap p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[12px] text-up">
                  <TrendingUp size={14} /> RELIANCE
                </div>
                <div className="h-12">
                  <ChartDrawIn data={SPARK} tone="up" aria-label="Reliance uptrend" />
                </div>
              </div>
              <div className="rounded-xl border border-line bg-wrap p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[12px] text-down">
                  <TrendingDown size={14} /> NIFTYBANK
                </div>
                <div className="h-12">
                  <ChartDrawIn data={SPARK_DOWN} tone="down" aria-label="Nifty Bank downtrend" />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Count-up metrics */}
          <SectionCard
            n="§39"
            title="Count-up metrics"
            desc="Key numbers spring from zero to value (en-IN grouping) when they enter view."
          >
            <div className="grid w-full grid-cols-3 gap-3 text-center">
              {[
                { label: 'Win rate', value: 73.4, suffix: '%', dp: 1, tone: 'text-up' },
                { label: 'Signals today', value: 128, suffix: '', dp: 0, tone: 'text-d-text-primary' },
                { label: 'Avg return', value: 4.2, suffix: '%', dp: 1, tone: 'text-up' },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-line bg-wrap p-3">
                  <div className={`text-[26px] font-semibold leading-none ${MONO} ${m.tone}`}>
                    <NumberTicker value={m.value} decimalPlaces={m.dp} className={m.tone} />
                    {m.suffix}
                  </div>
                  <div className="mt-1.5 text-[11px] text-d-text-muted">{m.label}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Skeleton morph */}
          <SectionCard
            n="§36"
            title="Skeleton → content"
            desc="A shimmering placeholder crossfades into resolved content with a one-shot scan beam."
          >
            <div className="w-full max-w-sm">
              <SkeletonMorph
                loading={loading}
                skeleton={
                  <div className="rounded-xl border border-line bg-wrap p-4">
                    <div className="flex items-center gap-3">
                      <SkeletonBlock rounded="rounded-full" className="h-9 w-9" />
                      <div className="flex-1">
                        <SkeletonBlock className="mb-2 h-3 w-24" />
                        <SkeletonBlock className="h-3 w-16" />
                      </div>
                    </div>
                    <SkeletonText className="mt-3" lines={3} />
                  </div>
                }
              >
                <div className="rounded-xl border border-line bg-wrap p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary">
                      <Sparkles size={16} />
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-d-text-primary">Momentum Signal</div>
                      <div className="text-[11px] text-up">Strong Buy · 92% confidence</div>
                    </div>
                  </div>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-d-text-secondary">
                    Breakout confirmed above ₹2,940 with a favorable risk-reward of 1:3.2.
                  </p>
                </div>
              </SkeletonMorph>
            </div>
          </SectionCard>

          {/* Status pop */}
          <SectionCard
            n="§40"
            title="Resolution feedback"
            desc="Success / error / info states pop in on a tinted disc while the glyph draws itself."
            onReplay={() => setStatusKey((k) => k + 1)}
          >
            <div key={statusKey} className="flex w-full items-center justify-around">
              <StatusPop status="success" label="Order filled" />
              <StatusPop status="error" label="Rejected" />
              <StatusPop status="info" label="Queued" />
            </div>
          </SectionCard>

          {/* Generative reveal + micro-interactions */}
          <SectionCard
            n="§46"
            title="Generative UI assembly"
            desc="Blocks stagger in — scale + blur — as if the AI is placing each card. Cards lift on hover."
            onReplay={() => setGenKey((k) => k + 1)}
          >
            <Stagger key={genKey} className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3" once={false}>
              {['RELIANCE', 'TCS', 'HDFCBANK'].map((sym) => (
                <StaggerItem key={sym}>
                  <div className="card-lift elev-1 cursor-pointer rounded-xl border border-line bg-wrap p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-semibold text-d-text-primary">{sym}</span>
                      <ArrowUpRight size={14} className="text-d-text-muted" />
                    </div>
                    <div className={`mt-1 text-[15px] ${MONO} text-up`}>+2.4%</div>
                    <div className="mt-2 h-8">
                      <ChartDrawIn data={SPARK} tone="up" strokeWidth={1.5} area={false} />
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </SectionCard>
        </div>

        <footer className="mt-10 border-t border-line pt-5">
          <p className="text-[12px] text-d-text-muted">
            Import from <code className="rounded bg-wrap-hover px-1.5 py-0.5 text-d-text-secondary">@/components/motion</code>.
            All primitives are reduced-motion safe and theme-aware.
          </p>
        </footer>
      </div>
    </main>
  )
}
