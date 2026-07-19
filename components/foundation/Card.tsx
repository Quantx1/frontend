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
      // xAI: flat charcoal panel, 8px radius, hairline border, no shadow.
      // `glass` = v4 liquid-glass surface (PR-V1) kept for that surface only.
      variant === 'glass'
        ? 'lg-surface lift rounded-sm'
        : 'rounded-sm border border-line bg-wrap',
      variant === 'clickable' &&
        'cursor-pointer transition-colors hover:bg-wrap-hover',
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
