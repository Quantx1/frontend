'use client'

import * as React from 'react'
import * as RT from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = RT.Root

export const TabsList = ({
  className,
  ...rest
}: React.ComponentProps<typeof RT.List>) => (
  <RT.List
    className={cn(
      // xAI: a hairline rail, mono-caps labels, underline indicator — no
      // boxed background, no sliding pill.
      'inline-flex items-center gap-1 border-b border-line',
      className,
    )}
    {...rest}
  />
)

export const TabsTrigger = ({
  className,
  ...rest
}: React.ComponentProps<typeof RT.Trigger>) => (
  <RT.Trigger
    className={cn(
      'px-3 py-2 -mb-px font-mono text-xs uppercase tracking-[0.08em] font-normal',
      'border-b border-transparent text-d-text-muted',
      'hover:text-d-text-secondary',
      'data-[state=active]:border-white data-[state=active]:text-d-text-primary',
      'transition-colors',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40',
      className,
    )}
    {...rest}
  />
)

export const TabsContent = RT.Content
