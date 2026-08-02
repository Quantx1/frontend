'use client'

/* ============================================================================
   AiStreamingText (§34/§35) — reveals a known answer word-by-word with a soft
   per-word fade + a blinking caret, imitating a live token stream. Use it for
   canned/demo AI answers and any place you have the full text up front but want
   the "AI is writing" feel. For genuinely streamed SSE text, feed the growing
   string to `text` and set `streaming` — new words fade in as they arrive.

   Motion is honored globally by <MotionConfig reducedMotion="user">; we also
   short-circuit to the full text when the user prefers reduced motion so no
   word is ever hidden.
   ============================================================================ */

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AiStreamingTextProps {
  /** Full text to reveal. */
  text: string
  /** ms between revealed words (ignored under reduced motion). */
  speed?: number
  /** Keep the caret blinking after the last word (external stream not done). */
  streaming?: boolean
  /** Auto-start on mount; when false, reveals nothing until true. */
  play?: boolean
  className?: string
  onDone?: () => void
}

export function AiStreamingText({
  text,
  speed = 34,
  streaming = false,
  play = true,
  className,
  onDone,
}: AiStreamingTextProps) {
  const reduce = useReducedMotion()
  const words = text.split(/(\s+)/) // keep whitespace tokens for spacing fidelity
  const [count, setCount] = useState(reduce || !play ? words.length : 0)
  const doneRef = useRef(false)

  useEffect(() => {
    if (reduce || !play) {
      setCount(words.length)
      return
    }
    setCount(0)
    doneRef.current = false
    let i = 0
    const id = setInterval(() => {
      i += 1
      setCount(i)
      if (i >= words.length) {
        clearInterval(id)
        if (!doneRef.current) {
          doneRef.current = true
          onDone?.()
        }
      }
    }, Math.max(12, speed))
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, play, reduce, speed])

  const revealed = words.slice(0, count)
  const isComplete = count >= words.length

  return (
    <span className={cn('leading-relaxed text-d-text-primary', className)}>
      {revealed.map((w, i) =>
        /\s+/.test(w) ? (
          <span key={i}>{w}</span>
        ) : (
          <motion.span
            key={i}
            initial={reduce ? false : { opacity: 0, filter: 'blur(4px)', y: 2 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="inline-block"
          >
            {w}
          </motion.span>
        ),
      )}
      {(streaming || !isComplete) && !reduce && (
        <span className="animate-blink-cursor ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] bg-ai align-middle" />
      )}
    </span>
  )
}
