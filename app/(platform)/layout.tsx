'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

import { AppShell } from '@/components/shell/AppShell'
import { AutopilotStickyStop } from '@/components/shell/AutopilotStickyStop'
import { api } from '@/lib/api'

// System-wide overlays. Dynamic-only so they don't block first paint.
// (The Copilot dock + quota modal moved to the root Providers on 2026-07-11 —
// chat unification — so they exist on EVERY authed route, not just this group.)
const SystemHaltBanner = dynamic(
  () => import('@/components/shared/SystemHaltBanner'),
  { ssr: false },
)

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  // First-login redirect to risk-profile quiz (PR 37, 118).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { getOnboardingStatus } = await import(
          '@/lib/onboardingStatusCache'
        )
        const s = await getOnboardingStatus()
        if (cancelled || !s) return
        if (!s.completed) router.replace('/onboarding/broker-connect')
      } catch {
        /* user may not be authed yet — other flows handle it */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  // Referral attribution fallback (PR 42).
  useEffect(() => {
    let pending: string | null = null
    try {
      pending = localStorage.getItem('pending_ref')
    } catch {
      return
    }
    if (!pending) return
    ;(async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user?.id) return
        await api.referrals.attribute({
          referred_user_id: user.id,
          code: pending!,
          referred_email: user.email ?? undefined,
        })
      } catch {
        /* non-fatal */
      } finally {
        try {
          localStorage.removeItem('pending_ref')
        } catch {}
      }
    })()
  }, [])

  // Web Push subscription setup.
  useEffect(() => {
    async function setupPush() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const existing = await reg.pushManager.getSubscription()
        if (existing) return
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const resp = await fetch(`${apiBase}/api/push/vapid-key`)
        if (!resp.ok) return
        const { public_key } = await resp.json()
        if (!public_key) return
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            public_key,
          ) as BufferSource,
        })
        const { supabase } = await import('@/lib/supabase')
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.access_token) return
        await fetch(`${apiBase}/api/push/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(sub.toJSON()),
        })
      } catch (err) {
        console.debug('Push subscription setup failed:', err)
      }
    }
    setupPush()
  }, [])

  return (
    <>
      <SystemHaltBanner />
      <AppShell>{children}</AppShell>
      <AutopilotStickyStop />
    </>
  )
}
