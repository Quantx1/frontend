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
 * Unset in a production build means every link this module produces stays
 * relative and 404s on the product origin — i.e. the whole upgrade funnel is
 * broken again, silently and identically to before it was fixed.
 *
 * NEXT_PUBLIC_* is inlined by `next build`, not read at runtime, so this is
 * decided when the image is built and cannot be corrected by setting the
 * variable on the running host. Say so loudly rather than shipping a fix that
 * is inert. Deliberately not thrown: a hard failure here would take down an
 * otherwise working app over a link defect.
 */
if (!MARKETING_URL && process.env.NODE_ENV === 'production') {
  console.error(
    '[marketing-url] NEXT_PUBLIC_MARKETING_URL is not set in a production ' +
      'build. Every marketing and legal link (/pricing, /proof, /legal/*) ' +
      'will resolve against the product origin and 404 — this is the entire ' +
      'upgrade funnel and the compliance footer. Set it at BUILD time.',
  )
}

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
