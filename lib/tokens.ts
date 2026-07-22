/**
 * Quant X "FintechX" design tokens (v4, 2026-07-14) — single source of
 * truth for programmatic access.
 *
 * Foundation components consume these values via Tailwind classes (which
 * resolve to CSS variables defined in app/globals.css). This file is the
 * canonical TS reference; new components MUST NOT inline hex literals.
 *
 * Both themes are first-class — every semantic colour has a `dark` and
 * `light` variant, WCAG-validated (matrix in DESIGN.md at the repo root;
 * re-check with frontend/scripts/validate-theme.mjs). The runtime
 * CSS variables in globals.css are intentionally kept in sync with these
 * values.
 *
 * System rules:
 *   · ONE accent (glossy fintech blue). It is a FILL — white ink sits on it.
 *     As TEXT use `primary-text` (Tailwind text-primary resolves there).
 *   · up/down are P&L semantics ONLY, never chrome.
 *   · No second gradient family, no neon, no glass tint.
 */

export const tokens = {
  color: {
    // Background layers (L0 → L4 depth system)
    main: { dark: '#0D0D0E', light: '#EDF1F4' }, // L0 page (near-black / cool blue-grey)
    wrap: { dark: '#151517', light: '#FFFFFF' }, // L1 cards
    'wrap-hover': { dark: '#1E1E21', light: '#F4F7F9' }, // L2 hover / elevated
    hover: { dark: '#1E1E21', light: '#F4F7F9' }, // L2 row hover
    line: { dark: '#29292D', light: '#DDE5ED' }, // L3 borders
    'wrap-line': { dark: '#3B3B40', light: '#C8D4DE' }, // L4 accent borders

    // Text
    'd-text-primary': { dark: '#F7F7F8', light: '#1D1D1D' },
    'd-text-secondary': { dark: '#D3D3D7', light: '#4D585F' },
    'd-text-muted': { dark: '#96969E', light: '#5F6B75' },

    // Brand accent — glossy fintech blue. `primary` is the FILL (wears white);
    // `primary-text` is the ink variant (lightened on dark, deepened on light).
    primary: { dark: '#406AE4', light: '#406AE4' },
    'primary-hover': { dark: '#3055C2', light: '#3055C2' },
    'primary-text': { dark: '#8FB0FF', light: '#3459C9' },

    // Financial semantics — P&L only
    up: { dark: '#10B981', light: '#0A6B50' },
    down: { dark: '#F5808C', light: '#B81C22' },
    warning: { dark: '#F0A94F', light: '#9A4D00' }, // true-caution only (rare)

    // AI / Copilot ink == brand ink (one accent, no separate blue family)
    ai: { dark: '#8FB0FF', light: '#3459C9' },
    // live/energy secondary accent
    cyan: { dark: '#5290F4', light: '#2563EB' },
    highlight: { dark: '#F0A94F', light: '#9A4D00' },
    accent: { dark: '#406AE4', light: '#406AE4' },
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

/** Monospace numerics — Geist Mono via --font-mono, set on <html> in
 *  layout.tsx. Unifies app-wide numerics on one mono face. */
export const MONO = '[font-family:var(--font-mono),ui-monospace,monospace] tabular-nums'

/** AI / Copilot accent as a raw hex — the accent FILL. Only for inline
 *  `${AI}22`-style alpha tints and solid fills that wear white ink; for
 *  text use the `text-ai` class (theme-aware ink). */
export const AI = '#406AE4'

export type ColorToken = keyof typeof tokens.color
export type SpacingToken = keyof typeof tokens.spacing
export type RadiusToken = keyof typeof tokens.radius
export type TypeSizeToken = keyof typeof tokens.type.size
export type MotionDurationToken = keyof typeof tokens.motion.duration
