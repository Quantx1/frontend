'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Bot } from '@/lib/icons'

/**
 * Animated robot glyph for the Copilot — used in the right-rail launcher and the
 * dock header. Idle: a gentle bob; `active` (streaming/thinking): a quick wiggle.
 * Honors prefers-reduced-motion (renders the static Bot, no motion).
 */
export function CopilotBot({
  className = 'h-5 w-5',
  active = false,
}: {
  className?: string
  active?: boolean
}) {
  const reduce = useReducedMotion()
  if (reduce) return <Bot className={className} aria-hidden="true" />
  return (
    <motion.span
      aria-hidden="true"
      className="inline-flex"
      animate={active ? { rotate: [0, -9, 9, -5, 0] } : { y: [0, -1.6, 0] }}
      transition={{
        duration: active ? 0.8 : 2.4,
        repeat: Infinity,
        ease: 'easeInOut',
        repeatDelay: active ? 0 : 1.4,
      }}
    >
      <Bot className={className} />
    </motion.span>
  )
}
