/* ============================================================================
   QuantX AI Motion System (brief §34–59) — a small, reusable set of motion
   primitives for the "AI feels alive" layer. All are token-driven and honored
   by the global <MotionConfig reducedMotion="user"> wrapper.

   Existing, complementary primitives live elsewhere and are re-exported for a
   single import surface:
     · NumberTicker  (count-up metrics, en-IN)   → components/ui/number-ticker
     · BlurFade / Reveal (entrance reveals)       → components/ui, components/foundation
   ============================================================================ */

export { AiStreamingText } from './AiStreamingText'
export { ChartDrawIn } from './ChartDrawIn'
export { SkeletonBlock, SkeletonText, SkeletonMorph } from './Skeleton'
export { StatusPop } from './StatusPop'
export { AgentTimeline, type TimelineStep, type TimelineStatus } from './AgentTimeline'
export { Stagger, StaggerItem, GenerativeReveal } from './GenerativeReveal'

// Re-exports of existing, complementary primitives for a single import surface.
export { NumberTicker } from '@/components/ui/number-ticker'
export { BlurFade } from '@/components/ui/blur-fade'
export { Reveal } from '@/components/foundation/Reveal'
