'use client'

/* ============================================================================
   QUANT X — WP-RAILS References panel. The market-data entities the copilot
   actually touched (symbols / signals / regime / positions / watchlist /
   options — F4: entities only, no news/URL). Every chip is a brand-safe,
   whitelisted projection from the stream (never a raw result row).

   xAI skin: hairline charcoal chips, mono sublabels, per-kind glyph. Symbols /
   positions / watchlist deep-link to /stock/[sym]; signals deep-link to
   /signals/[id] when the id is known. A cited-in-the-answer chip carries a
   small green dot. framer-motion staggered pop-in (ease-out) — global
   <MotionConfig reducedMotion="user"> handles reduced motion.
   ============================================================================ */

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { ComponentType } from 'react'
import { LineChart, Zap, Gauge, Briefcase, Eye, Layers } from '@/lib/icons'
import { MONO } from '@/lib/tokens'
import { EyebrowMono } from '@/components/foundation'
import type { CopilotReference, CopilotReferenceKind } from '@/lib/api'

const EASE = [0.23, 1, 0.32, 1] as const

const KIND_ICON: Record<CopilotReferenceKind, ComponentType<any>> = {
  symbol: LineChart,
  signal: Zap,
  regime: Gauge,
  position: Briefcase,
  watch: Eye,
  options: Layers,
}

function hrefFor(r: CopilotReference): string | null {
  if (r.kind === 'symbol' || r.kind === 'position' || r.kind === 'watch') {
    return `/stock/${encodeURIComponent(r.label)}`
  }
  if (r.kind === 'signal' && r.id) return `/signals/${encodeURIComponent(r.id)}`
  return null
}

export function ReferencesRail({ refs }: { refs: CopilotReference[] }) {
  if (!refs || refs.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <EyebrowMono className="text-[9.5px]">References</EyebrowMono>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {refs.map((r, i) => {
          const Icon = KIND_ICON[r.kind] ?? LineChart
          const href = hrefFor(r)
          const cls =
            'group inline-flex items-center gap-1.5 rounded-sm glass-control px-2 py-1 text-[11px] transition-colors'
          const inner = (
            <>
              <Icon size={11} className="shrink-0 text-d-text-muted" />
              <span className="text-d-text-secondary group-hover:text-d-text-primary">{r.label}</span>
              {r.sublabel && <span className={`text-d-text-muted ${MONO}`}>{r.sublabel}</span>}
              {r.cited && (
                <span
                  aria-label="Cited in the answer"
                  title="Cited in the answer"
                  className="ml-0.5 h-1 w-1 shrink-0 rounded-pill bg-up"
                />
              )}
            </>
          )
          return (
            <motion.div
              key={`${r.kind}-${r.label}-${i}`}
              initial={{ opacity: 0, scale: 0.97, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.22, ease: EASE }}
            >
              {href ? (
                <Link href={href} className={cls}>
                  {inner}
                </Link>
              ) : (
                <span className={cls}>{inner}</span>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
