'use client'

/* ============================================================================
   Skeleton primitives (§36/§46) — the "generating…" loading register.
   · SkeletonBlock  — a single shimmering placeholder bar/box.
   · SkeletonText   — n stacked lines with a shortened last line.
   · SkeletonMorph  — crossfades a skeleton out and the real content in when
                      `loading` flips false, with an optional one-shot accent
                      scan beam so freshly generated UI feels "resolved".

   Shimmer + beam come from token-driven utilities in globals.css and are
   reduced-motion guarded there; the crossfade is honored by MotionConfig.
   ============================================================================ */

import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function SkeletonBlock({
  className,
  rounded = 'rounded-lg',
}: {
  className?: string
  rounded?: string
}) {
  return <div className={cn('skeleton-shimmer', rounded, className)} aria-hidden="true" />
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          rounded="rounded-md"
          className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function SkeletonMorph({
  loading,
  skeleton,
  children,
  scan = true,
  className,
}: {
  loading: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
  /** show a one-shot accent scan beam when content resolves */
  scan?: boolean
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative overflow-hidden"
          >
            {scan && <span aria-hidden className="gen-scan-beam pointer-events-none absolute inset-x-0 top-0 z-10 h-8" />}
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
