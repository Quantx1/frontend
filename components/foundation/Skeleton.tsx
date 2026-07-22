import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

type Rounded = 'sm' | 'md' | 'lg' | 'full'

interface Props {
  w?: string
  h?: string
  className?: string
  rounded?: Rounded
}

const ROUNDED: Record<Rounded, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

/**
 * Skeleton — loading placeholder. Size EITHER via the `w`/`h` props (inline
 * style) OR via Tailwind classes (`className="h-40 w-full"`); the two must not
 * fight. Previously an inline `height:16px`/`width:100%` default was ALWAYS set,
 * which silently overrode any `h-*`/`w-*` class (inline style wins over classes)
 * — so every className-sized skeleton collapsed to a faint 16px bar and loading
 * states looked empty. Now the inline style is applied ONLY when the prop is
 * passed; className controls size otherwise, with a 1rem height fallback when
 * neither is given. Tone bumped to `bg-line` so it actually reads as loading on
 * white cards.
 */
export const Skeleton = ({ w, h, rounded = 'md', className }: Props) => {
  const style: CSSProperties = {}
  if (w) style.width = w
  if (h) style.height = h
  const hasSizeClass = /(^|\s)(h-|min-h-|aspect-|flex-1)/.test(className || '')
  return (
    <div
      className={cn(
        'animate-pulse bg-line/80',
        !h && !hasSizeClass && 'h-4',
        ROUNDED[rounded],
        className,
      )}
      style={style}
    />
  )
}
