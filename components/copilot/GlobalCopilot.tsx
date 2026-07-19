'use client'

/**
 * GlobalCopilot — mounts the Copilot dock + quota modal ONCE for the whole
 * app (chat unification, 2026-07-11).
 *
 * The dock previously lived in the (platform) layout only, so the ~17
 * "Ask Copilot" buttons on /stock, /portfolio, /watchlist, /trades, /markets
 * and /signals dispatched their `copilot:open` event into the void. Rendering
 * from the root Providers keeps ONE dock instance (and its thread) alive
 * across every navigation. Hidden for signed-out visitors and on
 * auth/marketing/admin surfaces — the mobile FAB must not haunt the landing
 * or login pages.
 */

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/contexts/AuthContext'

const CopilotProvider = dynamic(
  () => import('@/components/copilot/CopilotProvider'),
  { ssr: false },
)
const CopilotQuotaModal = dynamic(
  () => import('@/components/CopilotQuotaModal'),
  { ssr: false },
)

const EXCLUDED =
  /^\/(login|signup|forgot-password|verify-email|auth|onboarding|admin|privacy|terms|preview-design)(\/|$)/

export function GlobalCopilot() {
  const pathname = usePathname() ?? '/'
  const { user } = useAuth()

  if (!user || pathname === '/' || EXCLUDED.test(pathname)) return null

  return (
    <>
      <CopilotProvider />
      <CopilotQuotaModal />
    </>
  )
}
