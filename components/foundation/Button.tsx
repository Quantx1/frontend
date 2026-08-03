'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check } from '@/lib/icons'

/**
 * Button — v5 "Instrument".
 *
 * Previously all five variants resolved to `.glass-control*`: a
 * backdrop-blurred translucent surface. A button is the smallest, most-clicked
 * target in the product; it needs an unambiguous edge and a fill you can read a
 * label against, not a refraction of whatever is behind it. The variants are
 * now solid (the `.glass-control*` CLASSES were redefined in globals.css, so
 * this change lands on all 67 call sites at once).
 *
 * NEW — `state`. The product generates things: strategies, screens, backtests,
 * reports. Those actions need to show their own progress, and previously the
 * button just sat there while the caller rendered a spinner somewhere else.
 *
 *   idle → loading → success → idle
 *
 * The label is swapped but the button's WIDTH IS PINNED to its idle width, so
 * a generating button never reflows the toolbar around it. `success` holds a
 * check for 1.2s and returns to idle on its own.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonState = 'idle' | 'loading' | 'success'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Progress feedback for generative/async actions. */
  state?: ButtonState
  /** Label shown while `state="loading"`. Defaults to the idle children. */
  loadingLabel?: React.ReactNode
  /** Leading glyph. Sized to the button; hidden while loading. */
  icon?: React.ReactNode
}

const VARIANT: Record<ButtonVariant, string> = {
  // Solid accent fill, white ink at 4.77:1. The primary action should be the
  // most legible thing on screen, not the most decorated.
  primary: 'glass-control-accent',
  secondary: 'glass-control text-d-text-primary',
  // ghost is the only borderless variant — it earns its edge on hover.
  ghost:
    'border border-transparent bg-transparent text-d-text-secondary hover:bg-surface-2 hover:text-d-text-primary',
  danger: 'glass-control-danger text-down',
  ai: 'glass-control text-[var(--color-ai)]',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-7 gap-1.5 px-3 text-xs',
  md: 'h-8 gap-2 px-3.5 text-[13px]',
  lg: 'h-10 gap-2 px-5 text-sm',
}

const ICON_PX: Record<ButtonSize, number> = { sm: 13, md: 14, lg: 16 }

/** 2px ring spinner. Sized off the button so it never dwarfs a sm button. */
const Spinner = ({ px }: { px: number }) => (
  <span
    aria-hidden="true"
    className="inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent opacity-70"
    style={{ width: px, height: px }}
  />
)

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  (
    {
      variant = 'primary',
      size = 'md',
      state = 'idle',
      loadingLabel,
      icon,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const px = ICON_PX[size]
    const busy = state === 'loading'

    // Pin the width to the idle label so loading/success never reflow the row.
    // Measured WHILE IDLE (not on transition) so the value is already known by
    // the time the label swaps — and with useEffect rather than useLayoutEffect,
    // which would warn on the server render.
    const innerRef = React.useRef<HTMLButtonElement | null>(null)
    const [idleWidth, setIdleWidth] = React.useState<number>()
    React.useEffect(() => {
      if (state !== 'idle') return
      const w = innerRef.current?.offsetWidth
      if (w) setIdleWidth(w)
    }, [state, children])
    const pinnedWidth = state === 'idle' ? undefined : idleWidth

    return (
      <button
        ref={(node) => {
          innerRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        style={pinnedWidth ? { minWidth: pinnedWidth } : undefined}
        className={cn(
          'inline-flex select-none items-center justify-center rounded-sm font-semibold',
          // Level 1 motion: colour + a 0.98 press. Nothing that moves layout.
          'transition-[transform,background-color,border-color,color] duration-instant ease-out',
          'active:scale-[0.98]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-main',
          VARIANT[variant],
          SIZE[size],
          className,
        )}
        {...rest}
      >
        {state === 'loading' && <Spinner px={px} />}
        {state === 'success' && <Check size={px} className="shrink-0" aria-hidden="true" />}
        {state === 'idle' && icon && (
          <span className="grid shrink-0 place-items-center" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="truncate">
          {state === 'loading' ? (loadingLabel ?? children) : children}
        </span>
      </button>
    )
  },
)
Button.displayName = 'Button'

/**
 * useButtonState — drives the idle → loading → success → idle morph.
 *
 * Wraps an async action so callers do not each reimplement the timing:
 *
 *   const [state, run] = useButtonState()
 *   <Button state={state} onClick={() => run(generateStrategy)}>Generate</Button>
 */
export function useButtonState(successMs = 1200) {
  const [state, setState] = React.useState<ButtonState>('idle')
  const timer = React.useRef<ReturnType<typeof setTimeout>>()

  React.useEffect(() => () => clearTimeout(timer.current), [])

  const run = React.useCallback(
    async (action: () => Promise<unknown> | unknown) => {
      setState('loading')
      try {
        await action()
        setState('success')
        timer.current = setTimeout(() => setState('idle'), successMs)
      } catch (err) {
        // Failure is the caller's to report (a toast, inline validation) — the
        // button just stops pretending to work.
        setState('idle')
        throw err
      }
    },
    [successMs],
  )

  return [state, run] as const
}
