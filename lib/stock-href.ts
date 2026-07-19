/**
 * stock-href — single source of truth for building /stock/[symbol] links.
 *
 * Why a helper: NSE tradingsymbols include `&`, `-`, and `.` (M&M,
 * BAJAJ-AUTO, RELIANCE.NS). Pasting them raw into a path breaks the
 * route — `&` starts a query string, `.NS` is a Yahoo artefact we
 * don't want in the URL, etc. Centralising the rule means we can't
 * ship a broken link site.
 */

export function stockHref(rawSymbol: string): string {
  if (!rawSymbol) return '/stocks'
  const cleaned = rawSymbol
    .trim()
    .replace(/\.(NS|BO)$/i, '')   // drop Yahoo suffix
    .replace(/^\^/, '')           // drop index marker

  return `/stock/${encodeURIComponent(cleaned)}`
}
