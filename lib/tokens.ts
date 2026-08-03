/**
 * Quant X design tokens — v5 "Instrument" (2026-08-02).
 *
 * Foundation components consume these values via Tailwind classes (which
 * resolve to CSS variables defined in app/globals.css). This file is the
 * canonical TS reference; new components MUST NOT inline hex literals.
 *
 * ── Why the values changed ──────────────────────────────────────────────
 * This file used to claim it was "intentionally kept in sync" with
 * globals.css. It was not. Three sources disagreed:
 *
 *   token            tokens.ts   globals.css   validate-theme.mjs
 *   light main       #EDF1F4     #E9EEFB       #EDF1F4
 *   light line       #DDE5ED     #D5DEF4       #DDE5ED
 *   light up         #0A6B50     #15803D       #0A6B50
 *
 * The shipped light theme had drifted to a lavender-blue that the WCAG
 * validator never checked (it asserts the values in THIS file), which is why
 * light mode read washed out. globals.css has been restored to the validated
 * set, so all three now agree. Keep them that way: change a value here, in
 * globals.css and in scripts/validate-theme.mjs, or change it nowhere.
 *
 * System rules:
 *   · ONE accent (glossy fintech blue). It is a FILL — white ink sits on it.
 *     As TEXT use `primary-text` (Tailwind text-primary resolves there).
 *   · up/down are P&L semantics ONLY, never chrome, never an agent state.
 *   · Depth comes from the surface ramp + a hairline, never from blur.
 *   · Five radii. Four durations. Two easings. See docs/DESIGN.md.
 */

export const tokens = {
  color: {
    // Surface ramp — depth is a STEP on this ramp plus a hairline. Never blur.
    main: { dark: '#0D0D0E', light: '#EDF1F4' }, // L0 page canvas
    wrap: { dark: '#151517', light: '#FFFFFF' }, // L1 cards / sidebar
    'wrap-hover': { dark: '#1E1E21', light: '#F4F7F9' }, // L2 hover / elevated
    hover: { dark: '#1E1E21', light: '#F4F7F9' }, // L2 row hover
    'surface-2': { dark: '#1E1E21', light: '#F4F7F9' }, // L2 nested panel
    'surface-3': { dark: '#26262A', light: '#FFFFFF' }, // L3 overlay / palette
    'surface-inset': { dark: '#0A0A0B', light: '#E7ECF1' }, // L-1 wells, stripes
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
  // FIVE UI steps — the only permitted radii (was 16 distinct values).
  // `mark` is not part of the UI scale: it is reserved for data-viz marks
  // (volume bars, candles) whose micro-geometry breaks at 6px.
  radius: {
    mark: '2px',
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '16px',
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
  // Motion communicates state → action → result. Four durations, two easings;
  // anything outside the scale should pick the nearest step. Mirrors the
  // --dur-* / --ease-* variables in globals.css.
  motion: {
    duration: {
      instant: '90ms', // hover, focus, press — must feel free
      fast: '160ms', // chips, tabs, tooltips, toggles
      base: '240ms', // cards, panels, dropdowns, content
      slow: '380ms', // sheets, modals, layout, chart draw
    },
    ease: {
      out: 'cubic-bezier(0.22, 1, 0.36, 1)', // everything entering
      in: 'cubic-bezier(0.64, 0, 0.78, 0)', // everything leaving
    },
    /** Stagger between items in a generated list. Capped at 8 items — beyond
     *  that a stagger reads as lag rather than craft. */
    stagger: '40ms',
  },
  // Three neutral elevation levels. Colour never appears in a shadow.
  elevation: {
    0: 'none',
    1: 'var(--elev-1)', // resting card
    2: 'var(--elev-2)', // hover / popover
    3: 'var(--elev-3)', // modal / floating
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
