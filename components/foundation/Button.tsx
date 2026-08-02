import * as React from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Apple-style liquid glass, one register across every variant (see
  // `.glass-control*` in globals.css): translucent backdrop-blur surface,
  // bright top edge, soft shadow. The variant only changes the tint/ink.
  // primary = blue accent glass (white ink, AA-safe over any backdrop).
  primary: 'glass-control-accent',
  // secondary = neutral glass, primary ink.
  secondary: 'glass-control text-d-text-primary',
  // ghost = same neutral glass, muted ink (kept consistent, not a bare link).
  ghost: 'glass-control text-d-text-secondary hover:text-d-text-primary',
  // danger = red-tinted glass.
  danger: 'glass-control-danger text-down',
  // ai / Copilot = neutral glass, AI-violet ink.
  ai: 'glass-control text-[var(--color-ai)]',
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
        // FintechX v4 geometry: pill radius, Inter SemiBold labels (spec §2).
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
        // Press feedback (emil-design-eng): scale 0.97, ≤160ms ease-out.
        'transition-[transform,background-color,border-color] duration-150 ease-out',
        'active:scale-[0.97]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
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
