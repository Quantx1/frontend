/**
 * Foundation Badge — wraps the shadcn Badge with the app's semantic tone API.
 *
 * Old API: tone="primary" | "up" | "down" | "warning" | "muted" | "ai" | "buy" | "hold" | "sell"
 * We map financial tones to semantic Tailwind colours using className overrides
 * on the shadcn Badge, preserving the exact visual output callers expect.
 */
import * as React from 'react'
import { Badge as ShadcnBadge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type Tone =
  | 'primary'
  | 'up'
  | 'down'
  | 'warning'
  | 'muted'
  | 'ai'
  | 'buy'
  | 'hold'
  | 'sell'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  tone?: Tone
  children: React.ReactNode
}

// Map each tone to Tailwind classes that use the app's semantic tokens.
const TONE_CLASSES: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15',
  up:      'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400',
  down:    'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  muted:   'bg-muted text-muted-foreground border-border',
  ai:      'bg-primary/10 text-[var(--color-ai)] border-primary/20',
  buy:     'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400',
  hold:    'bg-muted text-muted-foreground border-border',
  sell:    'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
}

export const Badge = ({ tone = 'muted', className, children, ...rest }: Props) => (
  <ShadcnBadge
    variant="outline"
    className={cn(TONE_CLASSES[tone], className)}
    {...rest}
  >
    {children}
  </ShadcnBadge>
)
