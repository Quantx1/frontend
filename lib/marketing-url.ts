/**
 * App → marketing URL resolution. The mirror image of `landing/lib/app-url.ts`.
 *
 * Post monorepo-split the product app and the marketing site are separate
 * deployments on separate origins. This app advertises marketing/legal routes
 * — /pricing, /proof, /legal/*, /terms, /privacy — that do NOT exist in
 * `frontend/app`. Left as bare relative paths they resolve against the product
 * origin and 404, which took out the ENTIRE upgrade funnel (the sidebar
 * Upgrade pill, every tier paywall CTA) and the compliance footer's four
 * statutory links.
 *
 * Everything the product app actually owns stays relative: /copilot, /signals,
 * /stocks, /portfolio, /settings, and the rest of the authenticated surface.
 *
 * NEXT_PUBLIC_MARKETING_URL is the marketing origin (no trailing slash), e.g.
 * https://quantx.app. Left unset (local single-origin dev) links stay relative
 * and behave exactly as they did before the split.
 *
 * Links built from this helper are CROSS-ORIGIN: render them as plain `<a>`,
 * never `next/link`. The App Router client router cannot navigate to another
 * deployment, and prefetching an absolute URL is a wasted request.
 */

const RAW = process.env.NEXT_PUBLIC_MARKETING_URL ?? ''

/** Marketing site origin, trailing slash stripped. Empty string when unset. */
export const MARKETING_URL = RAW.replace(/\/+$/, '')

/**
 * Absolute URL for a marketing-site route.
 *
 * `marketingUrl('/pricing')` → `https://quantx.app/pricing`, or `/pricing`
 * when NEXT_PUBLIC_MARKETING_URL is unset.
 */
export function marketingUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${MARKETING_URL}${p}`
}

/** The upgrade funnel's single destination. Used by every Upgrade CTA. */
export const PRICING_URL = marketingUrl('/pricing')
