'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Zap, X } from '@/lib/icons'
import { useBrokerStatus } from '@/lib/hooks/useBrokerStatus'

export function ConnectBrokerBanner() {
  const { isConnected, isLoading } = useBrokerStatus()
  const [dismissed, setDismissed] = useState(false)
  if (isLoading || isConnected || dismissed) return null
  return (
    <div className="flex items-center gap-3 border-b border-line bg-wrap px-4 py-2 text-[12.5px] text-d-text-secondary">
      <Zap className="h-4 w-4 shrink-0 text-signature" />
      <span className="min-w-0 flex-1">
        Connect your broker to unlock <span className="text-d-text-primary">live data</span> and live trading. Until then you&apos;re on the virtual ₹10L portfolio.
      </span>
      <Link href="/settings#broker" className="shrink-0 rounded-md bg-primary px-3 py-1 font-medium text-primary-foreground hover:bg-primary-hover">
        Connect
      </Link>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="shrink-0 text-d-text-muted hover:text-d-text-primary">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
