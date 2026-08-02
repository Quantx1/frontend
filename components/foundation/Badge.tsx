import * as React from 'react'
import { cn } from '@/lib/utils'

export type Tone = 'primary' | 'up' | 'down' | 'warning' | 'muted' | 'ai' | 'buy' | 'hold' | 'sell'

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  children: React.ReactNode
}

const TONE: Record<Tone, string> = {
  // FintechX v4: tinted pill chips (`bg-primary/10 text-primary` — the
  // text scale maps to --rgb-primary-text, contrast-validated on the tint).
  primary: 'bg-primary/10 text-primary border-primary/20',
  // Duotone — only on financial direction (up/down) + semantic state.
  up: 'bg-up/10 text-up border-up/20',
  down: 'bg-down/10 text-down border-down/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  muted: 'bg-wrap-hover text-d-text-muted border-line',
  // PR-V1 — verdict + AI tones. buy/sell carry duotone (financial direction).
  ai: 'border-transparent bg-[color-mix(in_srgb,var(--color-ai)_15%,transparent)] text-[var(--color-ai)]',
  buy: 'border-up/20 bg-up/10 text-up',
  hold: 'border-line bg-wrap-hover text-d-text-secondary',
  sell: 'border-down/20 bg-down/10 text-down',
}

export const Badge = ({ tone = 'muted', className, children, ...rest }: Props) => (
  <span
    className={cn(
      'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border',
      TONE[tone],
      className,
    )}
    {...rest}
  >
    {children}
  </span>
)
