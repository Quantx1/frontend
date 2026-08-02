'use client'

/**
 * DeskTopbar — the persistent desktop page-level header.
 *
 * Uses shadcn Breadcrumb + SidebarTrigger for proper keyboard accessibility
 * and alignment with the shadcn sidebar system.
 *
 * Usage:
 *   <DeskTopbar title="Markets" status="live" />
 *   <DeskTopbar title="Signals" eyebrow="ML Signal Stack" actions={<Button>...</Button>} />
 */

import * as React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  eyebrow?: string
  status?: 'live' | 'delayed' | 'closed' | 'none'
  actions?: React.ReactNode
  className?: string
}

const STATUS: Record<NonNullable<Props['status']>, { color: string; glow: string; label: string }> = {
  live:    { color: 'bg-green-500',            glow: 'shadow-[0_0_6px_rgba(22,199,132,0.7)]',  label: 'Live' },
  delayed: { color: 'bg-amber-500',            glow: 'shadow-[0_0_6px_rgba(240,169,79,0.6)]',  label: 'Delayed' },
  closed:  { color: 'bg-muted-foreground',     glow: '',                                        label: 'Closed' },
  none:    { color: '',                        glow: '',                                        label: '' },
}

export function DeskTopbar({ title, eyebrow, status = 'none', actions, className }: Props) {
  const s = STATUS[status]

  return (
    <header
      className={cn(
        'hidden md:flex sticky top-0 z-20',
        'h-14 shrink-0 items-center gap-2 px-4',
        'border-b border-border bg-sidebar/80 backdrop-blur-sm',
        className,
      )}
    >
      {/* Sidebar toggle */}
      <SidebarTrigger className="-ml-1 text-muted-foreground" />
      <Separator orientation="vertical" className="h-5 mr-1" />

      {/* Breadcrumb */}
      <Breadcrumb className="flex-1 min-w-0">
        <BreadcrumbList className="flex-nowrap">
          {eyebrow && (
            <>
              <BreadcrumbItem className="hidden lg:block text-eyebrow text-muted-foreground/60">
                {eyebrow}
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden lg:block opacity-40" />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage
              className="font-display text-[15px] font-semibold tracking-tight"
              style={{
                background: 'linear-gradient(125deg, #AFC6FF 0%, #7FA3FF 45%, #5290F4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {title}
            </BreadcrumbPage>
          </BreadcrumbItem>
          {status !== 'none' && (
            <BreadcrumbItem>
              <span className="flex items-center gap-1.5 ml-1">
                <span
                  aria-hidden="true"
                  className={cn('inline-block size-1.5 rounded-full shrink-0', s.color, s.glow)}
                />
                <span className="text-[11px] font-medium text-muted-foreground">{s.label}</span>
              </span>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right actions */}
      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  )
}
