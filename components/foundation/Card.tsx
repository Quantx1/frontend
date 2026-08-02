import * as React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'static' | 'clickable' | 'glass'
}

export const Card = ({
  variant = 'static',
  className,
  children,
  ...rest
}: CardProps) => (
  <div
    className={cn(
      // FintechX v4 + liquid glass: the default/elevated card is a frosted
      // .glass-surface (translucent wrap fill, backdrop blur, light edge +
      // top highlight) — text contrast holds in both themes since the fill
      // stays ~78% opaque. `glass` keeps the lifted variant of the same
      // surface. Fallback to flat --color-wrap on old engines (see globals).
      variant === 'glass'
        ? 'glass-surface lift rounded-2xl'
        : 'glass-surface rounded-2xl',
      variant === 'clickable' && 'cursor-pointer lift',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const CardHeader = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'px-4 py-3 border-b border-line text-sm font-normal text-d-text-primary',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

export const CardBody = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-4 py-3', className)} {...rest}>
    {children}
  </div>
)

export const CardFooter = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'px-4 py-3 border-t border-line text-xs text-d-text-muted',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)
