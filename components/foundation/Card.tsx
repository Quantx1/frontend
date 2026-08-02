/**
 * Foundation Card — wraps the shadcn Card with the app's variant/slot names.
 *
 * Old API: variant="static" | "clickable" | "glass" + CardHeader, CardBody, CardFooter.
 * We map these to the shadcn Card primitives so all callers work unchanged.
 * CardBody is aliased to CardContent for full backwards compat.
 */
import * as React from 'react'
import {
  Card as ShadcnCard,
  CardHeader as ShadcnCardHeader,
  CardContent,
  CardFooter as ShadcnCardFooter,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Re-export title / description for callers that use them directly.
export { CardTitle, CardDescription }

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'static' | 'clickable' | 'glass'
}

export const Card = ({
  variant = 'static',
  className,
  children,
  ...rest
}: CardProps) => (
  <ShadcnCard
    className={cn(
      // Base: shadcn Card already has `bg-card border rounded-lg`
      variant === 'clickable' && 'cursor-pointer transition-colors hover:bg-accent/5',
      // Glass variant: slight background tint for visual layering
      variant === 'glass' && 'bg-card/80 backdrop-blur-sm',
      className,
    )}
    {...rest}
  >
    {children}
  </ShadcnCard>
)

export const CardHeader = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <ShadcnCardHeader
    className={cn('px-4 py-3 space-y-0', className)}
    {...rest}
  >
    {children}
  </ShadcnCardHeader>
)

// CardBody is our alias for shadcn CardContent
export const CardBody = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <CardContent className={cn('px-4 py-3', className)} {...rest}>
    {children}
  </CardContent>
)

export const CardFooter = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <ShadcnCardFooter
    className={cn('px-4 py-3 text-xs text-muted-foreground', className)}
    {...rest}
  >
    {children}
  </ShadcnCardFooter>
)
