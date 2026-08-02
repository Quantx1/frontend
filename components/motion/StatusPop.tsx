'use client'

/* ============================================================================
   StatusPop (§40/§41) — resolution feedback: a success check or error cross
   that pops in on a tinted disc while its glyph strokes draw themselves. Use
   for order-confirmed, save-succeeded, validation-failed, etc. Semantic tones
   only: success → up, error → down, info → ai. Reduced-motion renders the
   final state instantly (paths pre-drawn, no spring).
   ============================================================================ */

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Status = 'success' | 'error' | 'info'

const RING: Record<Status, string> = {
  success: 'bg-up/12 text-up',
  error: 'bg-down/12 text-down',
  info: 'bg-ai/12 text-ai',
}

const PATHS: Record<Status, string[]> = {
  success: ['M5 12.5l4.2 4.2L19 7.5'],
  error: ['M7 7l10 10', 'M17 7L7 17'],
  info: ['M12 8v.5', 'M12 11.5v5'],
}

export function StatusPop({
  status = 'success',
  size = 44,
  className,
  label,
}: {
  status?: Status
  size?: number
  className?: string
  label?: string
}) {
  const reduce = useReducedMotion()
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <motion.span
        className={cn('grid shrink-0 place-items-center rounded-full', RING[status])}
        style={{ width: size, height: size }}
        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {PATHS[status].map((d, i) => (
            <motion.path
              key={i}
              d={d}
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.12 + i * 0.12, ease: 'easeOut' }}
            />
          ))}
        </svg>
      </motion.span>
      {label && (
        <motion.span
          initial={reduce ? false : { opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.24 }}
          className="text-[14px] font-medium text-d-text-primary"
        >
          {label}
        </motion.span>
      )}
    </div>
  )
}
