/**
 * Foundation Skeleton — wraps the shadcn Skeleton.
 *
 * Old API: Skeleton({ w?, h?, rounded?, className? })
 * Preserved so all callers work unchanged.
 */
import type { CSSProperties } from 'react'
import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type Rounded = 'sm' | 'md' | 'lg' | 'full'

interface Props {
  w?: string
  h?: string
  className?: string
  rounded?: Rounded
}

const ROUNDED: Record<Rounded, string> = {
  sm:   'rounded-sm',
  md:   'rounded-md',
  lg:   'rounded-lg',
  full: 'rounded-full',
}

export const Skeleton = ({ w, h, rounded = 'md', className }: Props) => {
  const style: CSSProperties = {}
  if (w) style.width = w
  if (h) style.height = h
  const hasSizeClass = /(^|\s)(h-|min-h-|aspect-|flex-1)/.test(className || '')
  return (
    <ShadcnSkeleton
      className={cn(
        !h && !hasSizeClass && 'h-4',
        ROUNDED[rounded],
        className,
      )}
      style={style}
    />
  )
}
