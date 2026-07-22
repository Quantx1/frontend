'use client'

/**
 * HomeFooter — full DhanHQ-style compliance footer for Quant X:
 *   1. brand + socials · 4 link columns
 *   2. "built with love" band + Made-in-India
 *   3. "Explore Quant X" — SEO accordion mega-row (8 expandable groups)
 *   4. About Quant X
 *   5. SEBI compliance block (HONEST placeholders — never fabricate reg numbers)
 *   6. Important links (regulators) + Important information (legal) rows
 *   7. giant ghosted "Quant X" wordmark bleeding off the bottom (Every-AI style)
 * Reused on the home and the /legal pages.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Twitter, Send, Instagram, Linkedin, Youtube } from '@/lib/icons'
import { QuantXMark } from '@/components/brand/QuantXMark'

type Links = [string, string][]

const SOCIALS = [
  { icon: Twitter, label: 'X / Twitter', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
  { icon: Send, label: 'Telegram', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
]

const COLUMNS: { title: string; links: Links }[] = [
  { title: 'Product', links: [['Markets', '/markets'], ['Signals', '/signals'], ['AI Screener', '/scanner'], ['Chart Patterns', '/patterns'], ['F&O Desk', '/fno']] },
  { title: 'AI Tools', links: [['Copilot', '/copilot'], ['AI Algos', '/strategies'], ['Portfolio Doctor', '/portfolio/doctor'], ['AutoPilot', '/autopilot'], ['News Intelligence', '/markets']] },
  { title: 'Company', links: [['Pricing', '/pricing'], ['Track record', '/proof'], ['About', '#'], ['Contact', '#']] },
  { title: 'Legal', links: [['Terms', '/legal/terms'], ['Privacy', '/legal/privacy'], ['Disclaimer', '/legal/disclaimer'], ['Risk Disclosure', '/legal/risk'], ['Refund Policy', '/legal/refund']] },
]

// "Explore Quant X" — SEO accordion groups (DhanHQ's "Explore APIs" pattern).
const EXPLORE: { title: string; links: Links }[] = [
  { title: 'Screeners', links: [['Momentum', '/scanner'], ['Breakout', '/scanner'], ['Oversold large-caps', '/scanner'], ['52-week highs', '/scanner'], ['Volume shockers', '/scanner']] },
  { title: 'Signals by segment', links: [['Nifty 50', '/signals'], ['Bank Nifty', '/signals'], ['Large-caps', '/signals'], ['Mid-caps', '/signals'], ['Swing setups', '/signals']] },
  { title: 'Strategies', links: [['Intraday', '/strategies'], ['Swing', '/strategies'], ['Options buying', '/strategies'], ['Options selling', '/strategies'], ['Hedging', '/strategies']] },
  { title: 'F&O & Options', links: [['Option chain', '/fno'], ['Vol cone', '/fno'], ['Term structure', '/fno'], ['Greeks', '/fno'], ['OI analysis', '/fno']] },
  { title: 'AI Tools', links: [['Copilot', '/copilot'], ['Portfolio Doctor', '/portfolio/doctor'], ['AutoPilot', '/autopilot'], ['Chart Patterns', '/patterns'], ['Backtesting', '/strategies']] },
  { title: 'Markets', links: [['Indices', '/markets'], ['Sectors', '/markets'], ['FII / DII', '/markets'], ['Global cues', '/markets'], ['Movers', '/markets']] },
  { title: 'Learn', links: [['Getting started', '#'], ['Paper trading', '#'], ['Connect broker', '#'], ['Pricing', '/pricing'], ['FAQ', '#']] },
  { title: 'Company', links: [['About', '#'], ['Track record', '/proof'], ['Careers', '#'], ['Contact', '#'], ['Blog', '#']] },
]

const IMPORTANT_LINKS: Links = [
  ['BSE', 'https://www.bseindia.com'],
  ['NSE', 'https://www.nseindia.com'],
  ['SEBI', 'https://www.sebi.gov.in'],
  ['SCORES', 'https://scores.sebi.gov.in'],
  ['CDSL', 'https://www.cdslindia.com'],
]

const LEGAL_LINKS: Links = [
  ['Terms of Usage', '/legal/terms'],
  ['Privacy Policy', '/legal/privacy'],
  ['Disclaimer', '/legal/disclaimer'],
  ['Risk Disclosure', '/legal/risk'],
  ['Refund Policy', '/legal/refund'],
]

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`h-4 w-4 shrink-0 text-d-text-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FooterAccordion({ title, links }: { title: string; links: Links }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-line bg-wrap">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[13px] font-medium text-d-text-secondary transition-colors hover:text-d-text-primary"
      >
        {title}
        <Chevron open={open} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <ul className="space-y-2 px-4 pb-3.5">
            {links.map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="text-[12.5px] text-d-text-muted transition-colors hover:text-primary">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function HomeFooter() {
  return (
    <footer className="mt-20 overflow-hidden border-t border-line pt-14">
      {/* 1 · brand + link columns */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-4 lg:col-span-1">
          <Link href="/copilot" className="inline-flex items-center gap-2.5" aria-label="Quant X home">
            <QuantXMark className="h-9 w-9 drop-shadow-[0_2px_8px_rgba(58,119,229,0.35)]" />
            <span className="leading-tight">
              <span className="block text-[15px] font-bold tracking-tight text-d-text-primary">Quant X</span>
              <span className="block text-[9.5px] font-medium uppercase tracking-[0.16em] text-d-text-muted">Trading Intelligence</span>
            </span>
          </Link>
          <p className="mt-4 text-[10.5px] font-medium uppercase tracking-[0.14em] text-d-text-muted">Follow us on</p>
          <div className="mt-2.5 flex items-center gap-1.5">
            {SOCIALS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                title={label}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-control grid h-8 w-8 place-items-center rounded-full text-d-text-muted transition-colors hover:text-d-text-primary"
              >
                <Icon className="h-[15px] w-[15px]" />
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title} className="min-w-0">
            <div className="mb-3.5 text-[13px] font-semibold text-d-text-primary">{col.title}</div>
            <ul className="space-y-2.5">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-[13px] text-d-text-secondary transition-colors hover:text-primary">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 2 · built-with-love band */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-8">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#E5484D" />
          </svg>
          <span className="leading-tight">
            <span className="block text-[12.5px] text-d-text-muted">built with love</span>
            <span className="block text-[14px] font-medium text-d-text-primary">for Indian traders who love the markets</span>
          </span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-wrap px-3.5 py-1.5 text-[12.5px] text-d-text-secondary">
          <span aria-hidden>🇮🇳</span> Made in India · for Indian markets
        </div>
      </div>

      {/* 3 · Explore Quant X — SEO accordion mega-row */}
      <div className="mt-12">
        <h4 className="text-[15px] font-semibold text-d-text-primary">Explore Quant X</h4>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EXPLORE.map((g) => (
            <FooterAccordion key={g.title} title={g.title} links={g.links} />
          ))}
        </div>
      </div>

      {/* 4 · About */}
      <div className="mt-12 border-t border-line pt-8">
        <h4 className="text-[15px] font-semibold text-d-text-primary">About Quant X</h4>
        <p className="mt-3 max-w-4xl text-[12.5px] leading-relaxed text-d-text-muted">
          Quant X is an AI trading desk for Indian markets — five ML engines, an AI copilot, screeners, backtesting and
          gated signals, with optional hands-free execution on your own broker account. Every call is explained and every
          strategy is backtested before it can fire. Paper trading is free so you can evaluate the whole desk before you pay.
          Quant X is a technology and analytics product — not a broker, not an adviser — built for traders who want an
          edge grounded in data, not tips.
        </p>
      </div>

      {/* 5 · SEBI / compliance block — HONEST placeholders, no fabricated numbers */}
      <div className="mt-8 space-y-2.5 border-t border-line pt-8 text-[11.5px] leading-relaxed text-d-text-muted">
        <p>© 2021–2026 Quant X Technologies Private Limited [entity to be confirmed]. All rights reserved. CIN: [pending].</p>
        <p>
          Quant X is <span className="text-d-text-secondary">not a SEBI-registered Research Analyst or Investment Adviser</span> and holds
          no stock-exchange algo empanelment. All tools, signals, backtests and AI outputs are informational and educational only — not
          investment advice, not a recommendation to buy or sell, and not a guarantee of returns. You trade on your own broker account at
          your own risk. Investments in the securities market are subject to market risks; read all related documents carefully.
        </p>
        <p>SEBI registration: [pending] · GSTIN: [pending] · Registered &amp; Corporate Office: [address to be confirmed].</p>
        <p>For any query / feedback / grievance, email [grievance email to be confirmed]. Unresolved complaints can be escalated on SEBI SCORES.</p>
        <div className="flex flex-wrap items-start gap-x-6 gap-y-2 pt-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-d-text-secondary">Important Links:</span>
            {IMPORTANT_LINKS.map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="text-primary transition-colors hover:opacity-80">{label}</a>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-d-text-secondary">Important Information:</span>
            {LEGAL_LINKS.map(([label, href]) => (
              <Link key={label} href={href} className="text-primary transition-colors hover:opacity-80">{label}</Link>
            ))}
          </div>
        </div>
      </div>

      {/* 6 · giant Quant X wordmark — Every-AI style: fills the full width,
            silver gradient, the WHOLE label shows (SVG scales to fit, nothing
            clipped). Tight glyph-bound viewBox so it reads as a full solid
            block, sitting flush at the very bottom. */}
      <div aria-hidden className="pointer-events-none mt-10 w-full select-none">
        <svg viewBox="0 0 960 216" className="block w-full" role="presentation">
          <defs>
            <linearGradient id="qx-word-silver" x1="0" y1="0" x2="960" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" className="qxw-a" />
              <stop offset="0.2671" className="qxw-b" />
              <stop offset="0.5111" className="qxw-c" />
              <stop offset="0.7557" className="qxw-b" />
              <stop offset="1" className="qxw-a" />
            </linearGradient>
          </defs>
          <text
            x="480"
            y="178"
            textAnchor="middle"
            textLength="956"
            lengthAdjust="spacingAndGlyphs"
            fill="url(#qx-word-silver)"
            fillOpacity="0.5"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '250px' }}
          >
            Quant X
          </text>
        </svg>
      </div>
    </footer>
  )
}
