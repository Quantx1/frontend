'use client'

/* ============================================================================
   AgentTimeline (§37/§42) — a generic, reusable "agent is working" activity
   log: a vertical connector with per-step nodes that transition pending →
   active → done / error. The active node shows a spinning AI orb + shimmer
   label; done nodes settle to a check with an optional duration; errors mark a
   cross. Decoupled from the copilot's server telemetry so it can drive any
   multi-step flow (order routing, backtests, scans).

   All motion is honored by the global <MotionConfig reducedMotion="user">.
   ============================================================================ */

import { motion } from 'framer-motion'
import { Check, XCircle, Sparkles } from '@/lib/icons'
import { MONO } from '@/lib/tokens'
import { cn } from '@/lib/utils'

export type TimelineStatus = 'pending' | 'active' | 'done' | 'error'

export interface TimelineStep {
  label: string
  status: TimelineStatus
  detail?: string
  durationMs?: number
}

const EASE = [0.23, 1, 0.32, 1] as const

function fmtDur(ms?: number) {
  if (ms == null || ms <= 0) return null
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`
}

function OrbNode() {
  return (
    <span className="relative grid h-5 w-5 place-items-center">
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, color-mix(in srgb, var(--color-primary) 92%, transparent) 300deg, transparent 350deg)',
          WebkitMask: 'radial-gradient(closest-side, transparent 60%, #000 62%)',
          mask: 'radial-gradient(closest-side, transparent 60%, #000 62%)',
        }}
      />
      <Sparkles size={11} className="relative text-ai" />
    </span>
  )
}

export function AgentTimeline({
  steps,
  className,
}: {
  steps: TimelineStep[]
  className?: string
}) {
  return (
    <ol className={cn('relative flex flex-col gap-3', className)}>
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1
        const dur = fmtDur(s.durationMs)
        return (
          <motion.li
            key={`${s.label}-${i}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.24, ease: EASE }}
            className="relative flex gap-3"
          >
            {/* connector */}
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[9px] top-6 h-[calc(100%-6px)] w-px',
                  s.status === 'done' ? 'bg-up/40' : 'bg-line',
                )}
              />
            )}
            {/* node */}
            <span className="relative z-10 mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
              {s.status === 'done' && (
                <motion.span
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                  className="grid h-5 w-5 place-items-center rounded-full bg-up/15 text-up"
                >
                  <Check size={12} />
                </motion.span>
              )}
              {s.status === 'error' && (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-down/15 text-down">
                  <XCircle size={12} />
                </span>
              )}
              {s.status === 'active' && <OrbNode />}
              {s.status === 'pending' && (
                <span className="grid h-5 w-5 place-items-center">
                  <span className="h-2 w-2 rounded-full border border-wrap-line bg-transparent" />
                </span>
              )}
            </span>
            {/* body */}
            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-[13px]',
                    s.status === 'active' && 'ai-shimmer font-medium',
                    s.status === 'done' && 'text-d-text-secondary',
                    s.status === 'error' && 'text-d-text-muted line-through',
                    s.status === 'pending' && 'text-d-text-muted',
                  )}
                >
                  {s.label}
                </span>
                {dur && s.status === 'done' && (
                  <span className={cn('shrink-0 text-[10px] text-d-text-muted', MONO)}>{dur}</span>
                )}
              </div>
              {s.detail && (
                <p className="mt-0.5 truncate text-[11.5px] text-d-text-muted">{s.detail}</p>
              )}
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
