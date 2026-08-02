'use client'

/* ============================================================================
   GenerativeReveal (§46/§47) — the container that "assembles" generative UI:
   children fade/scale in on a stagger, as if the AI is placing each block. Use
   <Stagger> around a group and <StaggerItem> per block, or the all-in-one
   <GenerativeReveal items={[…]} />. Honors reduced motion via MotionConfig.
   ============================================================================ */

import { motion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] },
  },
}

export function Stagger({
  children,
  className,
  once = true,
}: {
  children: React.ReactNode
  className?: string
  once?: boolean
}) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-40px' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}

export function GenerativeReveal({
  items,
  className,
  itemClassName,
}: {
  items: React.ReactNode[]
  className?: string
  itemClassName?: string
}) {
  return (
    <Stagger className={cn('flex flex-col gap-3', className)}>
      {items.map((node, i) => (
        <StaggerItem key={i} className={itemClassName}>
          {node}
        </StaggerItem>
      ))}
    </Stagger>
  )
}
