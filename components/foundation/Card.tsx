import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Card — the L1 surface. v5 "Instrument".
 *
 * Every card in the app used to be a `.glass-surface`: a backdrop-blurred,
 * translucent panel with a 44px drop shadow. On a 12-card page that is 12+
 * compositing layers, and — the real cost — it destroyed hierarchy. When every
 * surface floats, none of them is elevated.
 *
 * A card is now opaque, hairlined, and sits at a known step on the surface
 * ramp. Depth is `elevation`, which you choose deliberately.
 *
 *   flush     no shadow. Cards in a grid — the default for a dashboard, where
 *             a page of shadows reads as noise.
 *   raised    --elev-1. A card that should separate from the canvas.
 *   floating  --elev-2. Genuinely above the page: a summary that overlaps,
 *             a callout, a sticky footer card.
 *
 * NESTING RULE: a Card may not contain another Card. Content nested inside a
 * card uses <Panel>, which expresses nesting with a surface step and no border
 * at all. This is what stops the card-in-card-in-card stacking that made the
 * Markets briefing read as a pile of boxes rather than one briefing.
 */

type Elevation = 'flush' | 'raised' | 'floating'
type Density = 'compact' | 'default' | 'feature'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation
  /** Hover lift + pointer. Use for whole-card links. */
  interactive?: boolean
  /** Sets the padding of CardHeader/CardBody/CardFooter children. */
  density?: Density
  /** @deprecated use `elevation` / `interactive`. Kept so the ~8 existing
   *  `variant="glass" | "clickable"` call sites keep compiling. */
  variant?: 'static' | 'clickable' | 'glass'
}

const ELEVATION: Record<Elevation, string> = {
  flush: 'shadow-none',
  raised: 'shadow-elev-1',
  floating: 'shadow-elev-2',
}

/** Padding scale — 16 / 20 / 24. Nothing else.
 *
 *  Passed down as CSS custom properties rather than React context, so Card
 *  stays a SERVER component: it is imported by server files (app/loading.tsx
 *  among them), and a `createContext` here forces 'use client' on the whole
 *  foundation barrel and everything that touches it.
 *
 *  Sub-components read the vars with a fallback, so <CardBody> still has sane
 *  padding if it is ever used outside a Card. */
const PAD_VARS: Record<Density, React.CSSProperties> = {
  compact: { '--card-px': '16px', '--card-py': '12px' } as React.CSSProperties,
  default: { '--card-px': '20px', '--card-py': '16px' } as React.CSSProperties,
  feature: { '--card-px': '24px', '--card-py': '20px' } as React.CSSProperties,
}
const PAD = 'px-[var(--card-px,20px)] py-[var(--card-py,16px)]'

export const Card = ({
  elevation,
  interactive,
  density = 'default',
  variant,
  className,
  style,
  children,
  ...rest
}: CardProps) => {
  // Back-compat: the old variants map onto the new axes.
  const resolvedElevation: Elevation = elevation ?? (variant === 'glass' ? 'floating' : 'flush')
  const resolvedInteractive = interactive ?? variant === 'clickable'

  return (
    <div
      style={{ ...PAD_VARS[density], ...style }}
      className={cn(
        'relative rounded-md border border-line bg-wrap',
        ELEVATION[resolvedElevation],
        resolvedInteractive && [
          'cursor-pointer',
          'transition-[border-color,box-shadow,transform] duration-fast ease-out',
          'hover:-translate-y-px hover:border-wrap-line hover:shadow-elev-2',
          'active:translate-y-0 active:duration-instant',
          'focus-within:border-wrap-line',
        ],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

/**
 * Panel — the L2 nested surface. Use INSTEAD of a Card inside a Card.
 *
 * No border, no shadow: one step up the surface ramp is all the separation
 * nested content needs, and it keeps a card reading as a single object.
 */
export const Panel = ({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-sm bg-surface-2 p-4', className)} {...rest}>
    {children}
  </div>
)

/**
 * CardHeader — title row.
 *
 * The title was `text-sm font-normal`: a card title at 14px regular, the same
 * weight as the body text beneath it. Cards therefore had no visible head, and
 * a dashboard of them had no scan order. It is now the `heading` step —
 * 16px/600 — which is the single highest-leverage typography fix in the app.
 *
 * Pass `action` for a right-aligned control; it stays optically aligned with
 * the title rather than stretching the row.
 */
export const CardHeader = ({
  children,
  className,
  action,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { action?: React.ReactNode }) => (
  <div
    className={cn(
      'flex min-h-[44px] items-center justify-between gap-3 border-b border-line',
      PAD,
      className,
    )}
    {...rest}
  >
    <div className="min-w-0 text-[16px] font-semibold leading-[22px] tracking-[-0.01em] text-d-text-primary">
      {children}
    </div>
    {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
  </div>
)

export const CardBody = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(PAD, className)} {...rest}>
    {children}
  </div>
)

export const CardFooter = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('border-t border-line text-xs text-d-text-muted', PAD, className)}
    {...rest}
  >
    {children}
  </div>
)
