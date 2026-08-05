import { marketingUrl } from '@/lib/marketing-url'

/**
 * ComplianceFooter — the statutory block, on EVERY authenticated surface.
 *
 * ── Why this is a shell component and not a page one ───────────────────────
 * This text used to live only inside `HomeFooter`, which is mounted on exactly
 * one route (`/copilot`). It renders for signed-in users — it sits one line
 * past the auth ternary — but a user who lands on /markets, /portfolio,
 * /settings or any of the other authed routes had NO path to the legal pages
 * and no route to the SEBI grievance mechanism.
 *
 * For a product that is explicitly **not** a registered Research Analyst, the
 * statement saying so is the single most important sentence in the interface,
 * and "reachable from one route" is not reachable.
 *
 * ── The placeholders are deliberate ────────────────────────────────────────
 * CIN, SEBI registration, GSTIN, address and grievance email read `[pending]`
 * / `[to be confirmed]`. That is honest and intentional: a fabricated
 * registration number is materially worse than a visible gap, and the original
 * carried a header saying exactly that ("HONEST placeholders — never fabricate
 * reg numbers"). Fill them from the real entity record; do not invent them.
 */

const IMPORTANT_LINKS: [string, string][] = [
  ['SEBI', 'https://www.sebi.gov.in'],
  ['SCORES', 'https://scores.sebi.gov.in'],
  ['NSE', 'https://www.nseindia.com'],
  ['BSE', 'https://www.bseindia.com'],
]

// The legal pages live on the MARKETING deployment, not in this app — as bare
// relative paths all four 404'd, which is the worst possible failure for the
// one block that has to be reachable. Absolute, cross-origin, plain <a>.
const LEGAL_LINKS: [string, string][] = [
  ['Terms of Usage', marketingUrl('/legal/terms')],
  ['Privacy Policy', marketingUrl('/legal/privacy')],
  ['Disclaimer', marketingUrl('/legal/disclaimer')],
  ['Risk Disclosure', marketingUrl('/legal/risk')],
]

export function ComplianceFooter({ className = '' }: { className?: string }) {
  return (
    <footer
      className={`space-y-2.5 border-t border-line px-4 py-8 text-micro leading-relaxed text-d-text-muted md:px-6 ${className}`}
    >
      <p>
        © 2021–2026 Quant X Technologies Private Limited [entity to be confirmed]. All rights
        reserved. CIN: [pending].
      </p>
      <p>
        Quant X is{' '}
        <span className="text-d-text-secondary">
          not a SEBI-registered Research Analyst or Investment Adviser
        </span>{' '}
        and holds no stock-exchange algo empanelment. All tools, signals, backtests and AI outputs
        are informational and educational only — not investment advice, not a recommendation to buy
        or sell, and not a guarantee of returns. You trade on your own broker account at your own
        risk. Investments in the securities market are subject to market risks; read all related
        documents carefully.
      </p>
      <p>
        SEBI registration: [pending] · GSTIN: [pending] · Registered &amp; Corporate Office:
        [address to be confirmed].
      </p>
      <p>
        For any query / feedback / grievance, email [grievance email to be confirmed]. Unresolved
        complaints can be escalated on SEBI SCORES.
      </p>
      <div className="flex flex-wrap items-start gap-x-6 gap-y-2 pt-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-d-text-secondary">Important Links:</span>
          {IMPORTANT_LINKS.map(([label, href]) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary transition-colors hover:opacity-80"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-d-text-secondary">Important Information:</span>
          {LEGAL_LINKS.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-primary transition-colors hover:opacity-80"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
