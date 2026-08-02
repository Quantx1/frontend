/**
 * Foundation Tooltip — wraps the shadcn Tooltip with the app's content-prop API.
 *
 * Old API: Tooltip({ content, children, delayMs?, disabled?, side?, ... })
 * Preserved so all callers work unchanged.
 */
'use client'

import * as React from 'react'
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Props
  extends Omit<React.ComponentPropsWithoutRef<typeof TooltipContent>, 'content'> {
  content: React.ReactNode
  children: React.ReactNode
  delayMs?: number
  disabled?: boolean
}

export const Tooltip = ({
  content,
  children,
  delayMs = 200,
  disabled = false,
  side = 'top',
  sideOffset = 6,
  className,
  ...rest
}: Props) => {
  if (disabled) return <>{children}</>
  return (
    <TooltipProvider delayDuration={delayMs} disableHoverableContent>
      <ShadcnTooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          sideOffset={sideOffset}
          className={cn(className)}
          {...rest}
        >
          {content}
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  )
}
