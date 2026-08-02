'use client'

import { useEffect, useState } from 'react'
import { installDemoInterceptor, isDemoEnabled, setDemoMode } from '@/lib/demo/interceptor'
import { Sparkles, X } from '@/lib/icons'

// Install the fetch interceptor as early as this module is imported on the
// client (before any page's SWR calls fire). No-op in production / on the
// server — see installDemoInterceptor.
installDemoInterceptor()

/**
 * DEV-ONLY floating indicator shown while demo data is active, with a one-click
 * exit that restores real fetch. Renders nothing unless demo mode is on, so it
 * never appears for real users.
 */
export function DemoBadge() {
  const [on, setOn] = useState(false)

  useEffect(() => {
    setOn(isDemoEnabled())
  }, [])

  if (!on) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-[120] -translate-x-1/2">
      <div className="elev-3 flex items-center gap-2 rounded-pill border border-wrap-line bg-wrap/90 px-3 py-1.5 text-[12px] text-d-text-primary backdrop-blur-md">
        <Sparkles size={14} className="text-ai" aria-hidden />
        <span className="font-medium">Demo data</span>
        <span className="text-d-text-muted">— sample market content for design review</span>
        <button
          type="button"
          onClick={() => {
            setDemoMode(false)
            window.location.reload()
          }}
          className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-d-text-muted transition-colors hover:bg-hover hover:text-d-text-primary"
          aria-label="Exit demo mode"
        >
          <X size={13} aria-hidden />
        </button>
      </div>
    </div>
  )
}
