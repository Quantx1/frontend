'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBrokerStatus } from '@/lib/hooks/useBrokerStatus'
import { cn } from '@/lib/utils'

export function ConnectBrokerBanner() {
  const { isConnected, isLoading } = useBrokerStatus()
  const [dismissed, setDismissed] = useState(false)

  if (isLoading || isConnected || dismissed) return null

  return (
    <div className="flex items-center gap-2.5 border-b border-border bg-primary/5 px-4 py-2.5 text-sm">
      <Zap className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-[12.5px] text-muted-foreground">
        Connect your broker to unlock{' '}
        <span className="font-medium text-foreground">live data</span> and live
        trading. Until then you&apos;re on the virtual ₹10L portfolio.
      </p>
      <Button asChild size="sm" className="h-7 shrink-0 px-2.5 text-xs">
        <Link href="/settings#broker">Connect</Link>
      </Button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
