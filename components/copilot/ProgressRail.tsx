'use client'

/* ============================================================================
   QUANT X — Agent activity timeline. v5 "Instrument".

   This is the product's signature moment. Quant X does not just answer; it
   consults tools, reads live market data, and reasons in stages — and the user
   is being asked to risk money on the result. Showing that work is what turns
   "an AI said so" into "I watched it reason". So this is designed as a
   first-class surface, not a loading state.

   CONTRACT — unchanged. It consumes the `CopilotStep[]` the backend already
   streams (lib/api.ts:544): { stage, label, tool?, status, duration_ms?, error? }
   with status ∈ ok | error | running.

   WHAT CHANGED VISUALLY
   · A 1px connector rail now links the steps and DRAWS DOWNWARD as each lands,
     so the timeline reads as one continuous process rather than a list.
   · Completed steps recede to MUTED, not green. Previously a finished step got
     `bg-up/12 text-up` — the P&L green. In a trading product green means money,
     and spending it on "a function returned" both cheapens the signal and makes
     a working agent look like a winning trade. Green is reserved for P&L.
   · On completion the whole thing collapses to a single summary row
     ("6 steps · 2.4s") that expands on click, so a finished answer is not
     preceded by a wall of spent machinery.

   HONESTY CONSTRAINT: the backend emits ok | error | running only. There is no
   fabricated "awaiting approval" state here — a human-in-the-loop gate will be
   rendered when the backend can actually emit one, not mocked before it exists.
   ============================================================================ */

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, Brain, Check, ChevronRight, LineChart, Pencil, Search, Sparkles, XCircle,
} from '@/lib/icons'
import { MONO } from '@/lib/tokens'
import { cn } from '@/lib/utils'
import type { CopilotStep } from '@/lib/api'

const EASE = [0.22, 1, 0.36, 1] as const

function fmtDur(ms?: number): string | null {
  if (ms == null || ms <= 0) return null
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`
}

function totalDur(steps: CopilotStep[]): string | null {
  const sum = steps.reduce((a, s) => a + (s.duration_ms ?? 0), 0)
  return fmtDur(sum)
}

/** A brand-safe glyph per stage. Never leaks a real tool or model name. */
function stageIcon(s: CopilotStep, size = 12) {
  const l = (s.label || '').toLowerCase()
  if (l.includes('understand') || l.includes('question')) return <Brain size={size} />
  if (l.includes('plan') || l.includes('skill') || l.includes('re-check')) return <Search size={size} />
  if (l.includes('market') || l.includes('data') || l.includes('price') || l.includes('quote')) return <Activity size={size} />
  if (l.includes('analy') || l.includes('level') || l.includes('setup')) return <LineChart size={size} />
  if (l.includes('compos') || l.includes('writ')) return <Pencil size={size} />
  return <Sparkles size={size} />
}

/* The live glyph — a bright arc orbiting a sparkle. Reads as "working" at a
   glance without a boxy spinner. */
function AiOrb({ size = 20 }: { size?: number }) {
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, color-mix(in srgb, var(--color-primary) 92%, transparent) 300deg, transparent 350deg)',
          WebkitMask: 'radial-gradient(closest-side, transparent 62%, #000 64%)',
          mask: 'radial-gradient(closest-side, transparent 62%, #000 64%)',
        }}
      />
      <motion.span
        aria-hidden
        className="relative text-ai"
        animate={{ scale: [1, 1.1, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Sparkles size={Math.round(size * 0.5)} />
      </motion.span>
    </span>
  )
}

// Shown only in the pre-meta window — before the backend has announced any
// step. Deliberately generic-but-honest: these are the phases the agent really
// moves through, not invented tool names.
const THINKING_PHASES = [
  'Reading your question',
  'Choosing the right tools',
  'Reading the live market',
  'Analysing the setup',
  'Weighing bull vs bear',
  'Composing the analysis',
]

function ThinkingPulse() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % THINKING_PHASES.length), 1500)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex items-center gap-2.5 py-1">
      <AiOrb size={20} />
      <motion.span
        key={phase}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: EASE }}
        className="ai-shimmer text-[13px] font-medium tracking-tight"
      >
        {THINKING_PHASES[phase]}
      </motion.span>
    </div>
  )
}

/** One step row. `last` suppresses the connector below it. */
function StepRow({ step, index, live, last }: { step: CopilotStep; index: number; live: boolean; last: boolean }) {
  const failed = step.status === 'error'
  const running = step.status === 'running'
  const dur = fmtDur(step.duration_ms)

  return (
    <motion.li
      initial={{ opacity: 0, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.22, ease: EASE }}
      className="relative flex items-start gap-2.5 pl-0"
    >
      {/* marker + connector */}
      <span className="relative grid w-4 shrink-0 justify-center pt-[3px]">
        {!last && (
          // The rail draws downward as the next step arrives, so the timeline
          // grows rather than appearing all at once.
          <motion.span
            aria-hidden
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.24, ease: EASE, delay: Math.min(index, 8) * 0.04 + 0.1 }}
            className="absolute left-1/2 top-[15px] h-[calc(100%-7px)] w-px origin-top -translate-x-1/2 bg-line"
          />
        )}
        {failed ? (
          <XCircle size={13} className="relative text-down" />
        ) : running ? (
          <motion.span
            aria-hidden
            className="relative h-[7px] w-[7px] rounded-full bg-primary"
            animate={{ opacity: [1, 0.35, 1], scale: [1, 0.86, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : (
          // Completed: a muted check. NOT green — see the header note.
          <Check size={12} className="relative text-d-text-muted" />
        )}
      </span>

      <span className="grid h-4 w-4 shrink-0 place-items-center pt-px text-d-text-muted">
        {stageIcon(step, 12)}
      </span>

      <span
        className={cn(
          'min-w-0 flex-1 pb-2 text-[12.5px] leading-[17px]',
          failed ? 'text-d-text-muted line-through' : running ? 'ai-shimmer font-medium' : 'text-d-text-secondary',
        )}
        title={failed ? step.error || step.label : step.label}
      >
        {step.label}
      </span>

      {dur && !running && (
        <span className={cn('shrink-0 pt-px text-[10px] tabular-nums text-d-text-muted', MONO)}>{dur}</span>
      )}
    </motion.li>
  )
}

/**
 * The agent activity timeline.
 *
 * · empty + live  → the pre-meta thinking pulse
 * · steps         → the timeline; the active phase shimmers under a live orb
 * · done          → collapses to a one-line summary, expandable
 * · empty + idle  → nothing (a greeting or pure-knowledge answer did no work)
 */
export function ProgressRail({ steps, live = false }: { steps: CopilotStep[]; live?: boolean }) {
  const hasSteps = steps && steps.length > 0
  const [expanded, setExpanded] = useState(false)

  if (!hasSteps) return live ? <ThinkingPulse /> : null

  const failedCount = steps.filter((s) => s.status === 'error').length
  const total = totalDur(steps)

  // Finished: collapse the spent machinery into one quiet, expandable line so
  // the ANSWER is what the user lands on, not the process that produced it.
  if (!live && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-expanded={false}
        className="group -ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-[11.5px] text-d-text-muted transition-colors duration-instant ease-out hover:text-d-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <ChevronRight size={12} className="transition-transform duration-fast ease-out group-hover:translate-x-px" />
        <span>
          {steps.length} step{steps.length === 1 ? '' : 's'}
          {total ? ` · ${total}` : ''}
          {failedCount ? ` · ${failedCount} failed` : ''}
        </span>
      </button>
    )
  }

  return (
    <div className="py-0.5">
      {!live && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-expanded
          className="mb-1.5 -ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-[11.5px] text-d-text-muted transition-colors duration-instant ease-out hover:text-d-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <ChevronRight size={12} className="rotate-90" />
          <span>How this was worked out</span>
        </button>
      )}

      <ol className="relative">
        <AnimatePresence initial={false}>
          {steps.map((s, i) => (
            <StepRow
              key={`${s.stage}-${i}`}
              step={s}
              index={i}
              live={live}
              last={i === steps.length - 1 && !live}
            />
          ))}
        </AnimatePresence>

        {live && (
          <motion.li
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(steps.length, 8) * 0.04, duration: 0.22, ease: EASE }}
            className="flex items-center gap-2.5 pt-0.5"
          >
            <AiOrb size={18} />
            <span className="ai-shimmer text-[12.5px] font-medium tracking-tight">Composing the analysis</span>
          </motion.li>
        )}
      </ol>
    </div>
  )
}
