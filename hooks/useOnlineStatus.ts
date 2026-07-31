'use client'

import { useEffect, useState } from 'react'

/**
 * Tracks browser connectivity.
 *
 * `navigator.onLine` is only trustworthy in the negative direction — `false`
 * reliably means "no network", while `true` can still mean a captive portal or
 * a dead uplink. So this reports "definitely offline" rather than pretending to
 * know the connection is good, and callers should treat `true` as "no reason to
 * believe we are offline".
 *
 * Starts optimistic (`false`) so nothing flashes an offline banner during SSR
 * hydration, where `navigator` does not exist yet.
 */
export function useOnlineStatus(): { isOffline: boolean } {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Read once on mount: the browser may already have been offline before this
    // component existed, and no event fires for state we were never present for.
    setIsOffline(navigator.onLine === false)

    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  return { isOffline }
}
