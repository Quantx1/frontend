/**
 * feature-colors — one source of truth for the per-feature ICON accent hue used
 * across the app (sidebar nav · page headers · home cards · mode chips). Each
 * feature keeps a distinct, consistent colour so the same glyph reads the same
 * everywhere. Colours are Tailwind text-* classes wired to real tokens
 * (`up`/`down`/`ai`/`orange`/`signature`) plus the `ax-*` accent palette added
 * in tailwind.config — so JIT generates them.
 *
 * Keyed by route PREFIX, most-specific first (so `/portfolio/doctor` wins over
 * `/portfolio`). Unknown routes fall back to a neutral secondary ink.
 */

const ROUTE_ACCENTS: Array<[RegExp, string]> = [
  [/^\/(copilot|home)?$/, 'text-signature'],   // home · main chat  → mint
  [/^\/markets/, 'text-up'],                    // markets           → green
  [/^\/stocks?(\/|$)/, 'text-ax-blue'],         // stocks / stock    → blue
  [/^\/watchlist/, 'text-ax-cyan'],             // watchlist         → cyan
  [/^\/autopilot/, 'text-orange'],              // AutoPilot bot     → orange
  [/^\/signals/, 'text-ai'],                    // ML signals        → violet
  [/^\/scanner/, 'text-signature'],             // screener          → mint
  [/^\/patterns/, 'text-ax-pink'],              // chart patterns    → pink
  [/^\/ipo/, 'text-ax-amber'],                  // IPO               → amber
  [/^\/portfolio\/doctor/, 'text-down'],        // portfolio doctor  → red
  [/^\/strategies/, 'text-ai'],                 // AI algos          → violet
  [/^\/fno/, 'text-ax-indigo'],                 // F&O desk          → indigo
  [/^\/portfolio/, 'text-ax-blue'],             // portfolio         → blue
  [/^\/paper/, 'text-ax-cyan'],                 // paper trading     → cyan
  [/^\/trades/, 'text-ax-teal'],                // trade log         → teal
  [/^\/risk/, 'text-down'],                     // risk              → red
  [/^\/pricing/, 'text-ax-amber'],              // pricing           → amber
  [/^\/settings/, 'text-ax-teal'],              // settings          → teal
]

const FALLBACK = 'text-d-text-secondary'

/** The Tailwind text-color class for a route's feature icon. */
export function featureAccent(href: string | null | undefined): string {
  if (!href) return FALLBACK
  for (const [re, cls] of ROUTE_ACCENTS) {
    if (re.test(href)) return cls
  }
  return FALLBACK
}
