/**
 * Foundation Button — wraps the shadcn Button with the app's variant names.
 *
 * The old API used `variant="primary" | "secondary" | "ghost" | "danger" | "ai"`.
 * We map those to the shadcn Button variants so all existing callers work unchanged.
 */
import * as React from 'react'
import {
  Button as ShadcnButton,
  type ButtonProps as ShadcnButtonProps,
} from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface Props
  extends Omit<ShadcnButtonProps, 'variant' | 'size' | 'asChild'> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

const VARIANT_MAP: Record<ButtonVariant, ShadcnButtonProps['variant']> = {
  primary:   'default',
  secondary: 'secondary',
  ghost:     'ghost',
  danger:    'destructive',
  ai:        'outline',
}

const SIZE_MAP: Record<ButtonSize, ShadcnButtonProps['size']> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
}

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  (
    {
      variant = 'primary',
      size = 'md',
      className,
      asChild,
      ...rest
    },
    ref,
  ) => (
    <ShadcnButton
      ref={ref}
      variant={VARIANT_MAP[variant]}
      size={SIZE_MAP[size]}
      asChild={asChild}
      className={cn(
        // Keep ai variant tinted toward the brand AI colour
        variant === 'ai' && 'text-[var(--color-ai)] border-primary/20 hover:bg-primary/10',
        className,
      )}
      {...rest}
    />
  ),
)
Button.displayName = 'Button'
