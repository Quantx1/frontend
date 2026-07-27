'use client'

/**
 * Foundation ErrorState — the ONE error surface for data/UI failures.
 *
 * A thin, opinionated wrapper over EmptyState(tone="error") so every "couldn't
 * load X" looks the same and always offers a retry. Use this instead of raw
 * error strings, alert(), or bespoke error JSX.
 *
 * @example
 *   if (error) return <ErrorState onRetry={() => mutate()} />
 *
 * @example  Custom copy
 *   <ErrorState
 *     title="Couldn't load signals"
 *     description="The signal service is warming up. Try again in a moment."
 *     onRetry={reload}
 *   />
 */
import * as React from 'react'
import { AlertCircle } from '@/lib/icons'
import { EmptyState } from './EmptyState'
import { Button } from './Button'

export function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this right now. Please try again.",
  onRetry,
  retryLabel = 'Retry',
  size = 'md',
  className,
}: {
  title?: string
  description?: React.ReactNode
  onRetry?: () => void
  retryLabel?: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <EmptyState
      tone="error"
      size={size}
      className={className}
      icon={<AlertCircle className="h-7 w-7" />}
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
    />
  )
}
