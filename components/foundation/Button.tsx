import * as React from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // The primary CTA — token-driven so it inverts per theme: a white-filled
  // pill in dark, an ink-filled pill in light. `bg-primary` = var(--primary)
  // (white→ink); `text-main` = canvas (near-black→near-white) → always the
  // legible counter-ink. Both themes clear AA (18.8:1).
  primary: 'bg-primary text-main border border-primary hover:opacity-90',
  // canonical outline pill — translucent-white border
  secondary: 'bg-transparent text-d-text-primary border border-white/20 hover:bg-white/[0.06]',
  ghost: 'bg-transparent text-d-text-secondary hover:text-d-text-primary hover:bg-white/[0.04]',
  danger: 'bg-transparent text-down border border-down/40 hover:bg-down/[0.08]',
  // PR-V1 — AI / Copilot action (purple, kept as an outline)
  ai: 'bg-transparent text-[var(--color-ai)] border border-[var(--color-ai)]/40 hover:bg-[var(--color-ai)]/[0.08]',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-4 text-xs',
  md: 'h-9 px-5 text-sm',
  lg: 'h-11 px-6 text-sm',
}

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', className, children, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-pill font-normal',
        // Press feedback (emil-design-eng): scale 0.97, ≤160ms ease-out.
        'transition-[transform,background-color,border-color] duration-150 ease-out',
        'active:scale-[0.97]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
