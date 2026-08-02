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
      // FintechX v4: a tinted pill rail — active tab is a raised wrap pill.
      'inline-flex items-center gap-1 rounded-full border border-line bg-main p-1',
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
      'px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap',
      'text-d-text-muted hover:text-d-text-primary',
      'data-[state=active]:bg-wrap data-[state=active]:text-d-text-primary data-[state=active]:shadow-sm',
      'transition-colors',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      className,
    )}
    {...rest}
  />
)

export const TabsContent = RT.Content
