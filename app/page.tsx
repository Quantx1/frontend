import { redirect } from 'next/navigation'

/**
 * The public marketing/legal routes (/, /pricing, /privacy, /terms, /proof)
 * were split out into the standalone `landing` app during the monorepo
 * split. This app now starts at the authenticated product surface.
 *
 * /copilot is the app's real home (see middleware.ts RETIRED_ROUTE_REDIRECTS:
 * /dashboard, /tools, /home, and /activity all 301 to /copilot). Unauthenticated
 * users hitting /copilot get redirected to /login by the existing auth guard.
 */
export default function RootPage() {
  redirect('/copilot')
}
