// frontend/components/foundation/EyebrowMono.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

interface Props extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

/**
 * Section eyebrow (2026-06-20): uppercase, tracked Plus Jakarta Sans (the
 * primary `font-sans` family) at a heavier weight — NOT mono. Tracked-caps
 * style. The component name + exports stay `EyebrowMono` so callers don't
 * break.
 */
export const EyebrowMono = ({ className, children, ...rest }: Props) => (
  <p
    className={cn(
      'font-sans font-semibold uppercase tracking-[0.12em] text-xs text-d-text-muted',
      className,
    )}
    {...rest}
  >
    {children}
  </p>
)
EyebrowMono.displayName = 'EyebrowMono'
