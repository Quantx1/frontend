import {
  LineChart,
  BarChart3,
  Bot,
  ScanLine,
  Brain,
  Stethoscope,
  Wand2,
  Layers,
  Briefcase,
  FlaskConical,
  ScrollText,
  ShieldAlert,
  Search,
  Flame,
} from '@/lib/icons'

// Grouped 3-zone IA (Wave 1 shell redesign, 2026-06-20).
// The sidebar shows: New Chat (top action) → TOP items (Dashboard, Markets) →
// labelled feature groups (SIGNALS · AI TOOLS · PORTFOLIO) → History → footer.
// Every existing platform route is preserved here so no feature is lost;
// routes not surfaced in a group stay reachable via the Command Palette (⌘K)
// and the right rail.
//
// The engines (Alpha/Mood/Regime/Counterpoint) are internal-only: they power
// signals inside the box but have no in-app showcase page. Engine names live
// only on the public landing as marketing (founder decision 2026-06-20).
export type NavSection = 'top' | 'signals' | 'tools' | 'portfolio'

export interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  tier?: 'pro' | 'elite'
  section: NavSection
}

export const NAV: NavItem[] = [
  // ── TOP (no group label) ──
  // WP-CONSOLIDATE 3c — /dashboard retired; its Command Center cockpit now lives
  // as the authed home band on /copilot (Main Chat), reached via New Chat.
  { href: '/markets', label: 'Markets', icon: LineChart, section: 'top' },
  { href: '/stocks', label: 'Stocks', icon: Search, section: 'top' },
  // AutoPilot = the fully-automated trading bot. Front-and-center: the practice
  // (paper) bot is FREE for all tiers (no tier lock here); going live is Pro,
  // gated at the toggle. Pricing v2 "Paper AutoPilot → Free".
  { href: '/autopilot', label: 'AutoPilot', icon: Bot, section: 'top' },

  // ── SIGNALS ──
  // /signals = the single signals hub (Overview + horizon tabs). The 4 per-horizon
  // URLs still 200-render as deep-links into the matching tab (no redirect), and
  // NavList's longest-prefix match keeps "Signals" highlighted on /signals/*.
  { href: '/signals', label: 'Signals', icon: BarChart3, section: 'signals' },

  // ── AI TOOLS ──
  { href: '/scanner', label: 'Screener', icon: ScanLine, section: 'tools' },
  { href: '/patterns', label: 'Chart Patterns', icon: Brain, section: 'tools' },
  { href: '/ipo', label: 'IPO', icon: Flame, section: 'tools' },
  { href: '/portfolio/doctor', label: 'Portfolio Doctor', icon: Stethoscope, section: 'tools' },
  // Strategies = the unified equity + options hub. (The old /fo-strategies is
  // retired — middleware redirects it here with ?filter=options — so there is
  // no separate "F&O Strategies" item.) F&O analytics live on /fno.
  { href: '/strategies', label: 'AI Algos', icon: Wand2, section: 'tools' },
  { href: '/fno', label: 'F&O', icon: Layers, tier: 'elite', section: 'tools' },

  // ── PORTFOLIO ──
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase, section: 'portfolio' },
  { href: '/paper-trading', label: 'Paper', icon: FlaskConical, section: 'portfolio' },
  { href: '/trades', label: 'Trades', icon: ScrollText, section: 'portfolio' },
  { href: '/risk', label: 'Risk', icon: ShieldAlert, section: 'portfolio' },
]

// Group labels — rendered UPPERCASE/mono in the sidebar. The 'top' group has
// no label (its items sit directly under New Chat). Order here = render order.
export const NAV_SECTIONS: { key: NavSection; label: string | null }[] = [
  { key: 'top', label: null },
  { key: 'signals', label: 'Signals' },
  { key: 'tools', label: 'AI Tools' },
  { key: 'portfolio', label: 'Portfolio' },
]

// WP-SIMPLEVIEW 2026-07-02 — the 4-item managed ("MANAGED_NAV") beginner shell
// is retired. Every user now gets the full NAV; managed users opt into the
// plain-language Simple view per page via the on-page Simple/Full toggle
// (see components/managed/SimpleView.tsx). /home + /activity 301 to /copilot.
