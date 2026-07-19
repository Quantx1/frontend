/**
 * Quant X v2 design tokens — single source of truth for programmatic access.
 *
 * Foundation components consume these values via Tailwind classes (which
 * resolve to CSS variables defined in app/globals.css). This file is the
 * canonical TS reference; new components MUST NOT inline hex literals.
 *
 * Both themes are first-class — every semantic colour has a `dark` and
 * `light` variant. The variants here are the v2 design targets; the runtime
 * CSS variables in globals.css are intentionally kept in sync with these
 * values.
 *
 * Reference: docs/superpowers/specs/2026-05-19-quantx-v2-design.md §9.4
 */

export const tokens = {
  color: {
    // Background layers (L0 → L4 depth system) — AI Trading OS (2026-06-02)
    main: { dark: '#0B0E15', light: '#F6F8FB' }, // L0 page (navy-black / cool off-white)
    wrap: { dark: '#131722', light: '#FFFFFF' }, // L1 cards (TradingView panel)
    'wrap-hover': { dark: '#1C2131', light: '#EEF2F8' }, // L2 hover / elevated
    hover: { dark: '#161B27', light: '#F0F4F9' }, // L2 row hover
    line: { dark: '#252C3F', light: '#E2E8F1' }, // L3 borders
    'wrap-line': { dark: '#394259', light: '#CBD5E3' }, // L4 accent borders

    // Text
    'd-text-primary': { dark: '#EDEFF5', light: '#0E1422' },
    'd-text-secondary': { dark: '#80899F', light: '#475067' },
    'd-text-muted': { dark: '#7E879B', light: '#5C667D' }, // bumped to clear WCAG AA (~4.6:1)

    // Brand + semantic — palette B: LuxAlgo/TradingView teal-green hero, TV blue/red
    primary: { dark: '#2BD9BC', light: '#08A085' }, // signature teal-green
    'primary-hover': { dark: '#20BFA4', light: '#07876F' },
    up: { dark: '#16C995', light: '#07A368' }, // P&L only
    down: { dark: '#F23645', light: '#DE2A40' }, // P&L only (TradingView red)
    warning: { dark: '#F5A623', light: '#B45309' }, // true-caution only (rare)
    // AI / Copilot surfaces ONLY (purple — darker on light for AA)
    ai: { dark: '#8B5CF6', light: '#7C3AED' },
    // live/highlight energy accent (neon cyan, LuxAlgo)
    cyan: { dark: '#00E5FF', light: '#0AA8C7' },
    // highlight (tier badges) + accent (autopilot/regime) → TradingView blue
    highlight: { dark: '#2962FF', light: '#1D55E0' },
    accent: { dark: '#2962FF', light: '#1D55E0' },
  },
  spacing: {
    px: '1px',
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
  },
  radius: {
    none: '0',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  },
  type: {
    family: {
      sans: 'var(--font-sans), system-ui, sans-serif',
      mono: 'var(--font-mono), ui-monospace, "SF Mono", monospace',
    },
    size: {
      xs: '11px',
      sm: '12px',
      base: '13px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '22px',
      '3xl': '28px',
      '4xl': '34px',
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    'line-height': {
      tight: '1.2',
      normal: '1.5',
      loose: '1.7',
    },
  },
  motion: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    ease: {
      out: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  z: {
    base: 0,
    raised: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    toast: 50,
  },
} as const

/** Monospace numerics — Geist Mono (the xAI mono face) via --font-mono, set on
 *  <html> in layout.tsx. Unifies app-wide numerics on one mono face (the old
 *  JetBrains --font-app-mono is superseded by the xAI design language). */
export const MONO = '[font-family:var(--font-mono),ui-monospace,monospace] tabular-nums'

/** AI / Copilot accent (purple). Equals the --color-ai token. */
export const AI = '#8B5CF6'

export type ColorToken = keyof typeof tokens.color
export type SpacingToken = keyof typeof tokens.spacing
export type RadiusToken = keyof typeof tokens.radius
export type TypeSizeToken = keyof typeof tokens.type.size
export type MotionDurationToken = keyof typeof tokens.motion.duration
