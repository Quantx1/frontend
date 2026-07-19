'use client'

/* ============================================================================
   QUANT X — Claude-style "AI thinking" indicator. Honest telemetry (each
   reasoning/tool step) streamed from the copilot; this component never sees raw
   tool names or result rows (labels are projected server-side, brand-safe).

   2026-07-13 redesign: dropped the boxy "Progress" rail for an airy, premium
   thinking choreography — a spinning conic AI glyph + shimmer-text that sweeps a
   bright highlight across muted labels (background-clip:text, the Claude cue).
   Completed steps settle to a check; the active phase shimmers. The pre-meta
   window rotates rich, trading-specific phases. Motion is neutralised by the
   global <MotionConfig reducedMotion="user"> + the .ai-shimmer reduced-motion
   guard.
   ============================================================================ */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Brain, Check, LineChart, Pencil, Search, Sparkles, XCircle,
} from '@/lib/icons'
import { MONO } from '@/lib/tokens'
import type { CopilotStep } from '@/lib/api'

const EASE = [0.23, 1, 0.32, 1] as const

function fmtDur(ms?: number): string | null {
  if (ms == null || ms <= 0) return null
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`
}

/** A brand-safe glyph for each stage/skill label. */
function stageIcon(s: CopilotStep, size = 12) {
  const l = (s.label || '').toLowerCase()
  if (l.includes('understand') || l.includes('question')) return <Brain size={size} />
  if (l.includes('plan') || l.includes('skill') || l.includes('re-check')) return <Search size={size} />
  if (l.includes('market') || l.includes('data') || l.includes('price') || l.includes('quote')) return <Activity size={size} />
  if (l.includes('analy') || l.includes('level') || l.includes('setup')) return <LineChart size={size} />
  if (l.includes('compos') || l.includes('writ')) return <Pencil size={size} />
  return <Sparkles size={size} />
}

/* The spinning conic AI glyph — a bright arc orbits a sparkle. The "the AI is
   working" cue, far more alive than a plain spinner. */
function AiOrb({ size = 22 }: { size?: number }) {
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, color-mix(in srgb, var(--color-up) 92%, transparent) 300deg, transparent 350deg)',
          WebkitMask: 'radial-gradient(closest-side, transparent 62%, #000 64%)',
          mask: 'radial-gradient(closest-side, transparent 62%, #000 64%)',
        }}
      />
      <motion.span
        aria-hidden
        className="relative text-up"
        animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Sparkles size={Math.round(size * 0.5)} />
      </motion.span>
    </span>
  )
}

// Rich, trading-specific phases shown while the agent is still deciding what to
// do (empty steps + live) — a lightweight thinking affordance, not backend data.
const THINKING_PHASES: string[] = [
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
      <AiOrb size={22} />
      <motion.span
        key={phase}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="ai-shimmer text-[13.5px] font-medium tracking-tight"
      >
        {THINKING_PHASES[phase]}
      </motion.span>
    </div>
  )
}

/**
 * The thinking indicator. Empty + live → the rotating pre-meta pulse. With
 * steps → completed phases settle to a check, and (while live) the active phase
 * shimmers under the spinning orb. Empty + not live → nothing (greeting / pure
 * knowledge answer).
 */
export function ProgressRail({ steps, live = false }: { steps: CopilotStep[]; live?: boolean }) {
  const hasSteps = steps && steps.length > 0
  if (!hasSteps) return live ? <ThinkingPulse /> : null

  return (
    <div className="py-0.5">
      <ol className="space-y-1.5">
        {steps.map((s, i) => {
          const err = s.status === 'error'
          const dur = fmtDur(s.duration_ms)
          return (
            <motion.li
              key={`${s.stage}-${i}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.22, ease: EASE }}
              className="flex items-center gap-2.5"
            >
              <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${err ? 'text-down' : 'bg-up/12 text-up'}`}>
                {err ? <XCircle size={12} /> : <Check size={11} />}
              </span>
              <span className="grid h-4 w-4 shrink-0 place-items-center text-d-text-muted">
                {stageIcon(s, 12)}
              </span>
              <span
                className={`min-w-0 flex-1 truncate text-[12.5px] ${err ? 'text-d-text-muted line-through' : 'text-d-text-secondary'}`}
                title={err ? s.error || s.label : s.label}
              >
                {s.label}
              </span>
              {dur && <span className={`shrink-0 text-[10px] text-d-text-muted ${MONO}`}>{dur}</span>}
            </motion.li>
          )
        })}
        {live && (
          <motion.li
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: steps.length * 0.05, duration: 0.22, ease: EASE }}
            className="flex items-center gap-2.5 pt-0.5"
          >
            <AiOrb size={20} />
            <span className="ai-shimmer text-[13px] font-medium tracking-tight">Composing the analysis</span>
          </motion.li>
        )}
      </ol>
    </div>
  )
}
