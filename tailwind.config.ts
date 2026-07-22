import type { Config } from 'tailwindcss'
import flattenColorPalette from 'tailwindcss/lib/util/flattenColorPalette'

function addVariablesForColors({ addBase, theme }: any) {
  const allColors = flattenColorPalette(theme('colors'))
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  )

  addBase({
    ':root': newVars,
  })
}

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',   // class strings live in lib/ too (copilot-modes etc.)
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ──────────────────────────────────────────────────────────────
        // "FINTECHX" TOKENS (v4, 2026-07-14) — every semantic class
        // resolves to a CSS variable in globals.css, so the whole app
        // re-themes (dark ⇄ light) by variable values alone. No raw hex
        // here except nothing — additions MUST go through globals.css.
        // ──────────────────────────────────────────────────────────────
        // Channel-based (`rgb(var(--rgb-x) / <alpha-value>)`) so opacity
        // modifiers WORK — a plain var() string silently drops `bg-up/10`.
        main:               'rgb(var(--rgb-main) / <alpha-value>)',        // L0 page bg
        wrap:               'rgb(var(--rgb-wrap) / <alpha-value>)',        // L1 cards
        'wrap-hover':       'rgb(var(--rgb-wrap-hover) / <alpha-value>)',  // L2 hover/elevated
        hover:              'rgb(var(--rgb-wrap-hover) / <alpha-value>)',  // L2 row hover
        line:               'rgb(var(--rgb-line) / <alpha-value>)',        // L3 borders
        'wrap-line':        'rgb(var(--rgb-wrap-line) / <alpha-value>)',   // L4 accent borders
        'card-hover':       'rgb(var(--rgb-wrap-hover) / <alpha-value>)',
        'surface-2':        'rgb(var(--rgb-wrap-hover) / <alpha-value>)',
        'chart-bg':         'rgb(var(--rgb-main) / <alpha-value>)',
        up:                 'rgb(var(--rgb-up) / <alpha-value>)',          // P&L ONLY
        down:               'rgb(var(--rgb-down) / <alpha-value>)',        // P&L ONLY
        ai:                 'rgb(var(--rgb-ai) / <alpha-value>)',          // AI / Copilot accents
        cyan:               'rgb(var(--rgb-cyan) / <alpha-value>)',        // live / energy secondary
        highlight:          'rgb(var(--rgb-warning) / <alpha-value>)',     // pricing tier / quiz rec
        orange:             'rgb(var(--rgb-warning) / <alpha-value>)',     // true-caution surfaces
        signature:          'var(--color-signature-ink)',                  // brand ink, theme-aware
        'd-bg':             'rgb(var(--rgb-main) / <alpha-value>)',
        'd-bg-card':        'rgb(var(--rgb-wrap) / <alpha-value>)',
        'd-bg-sidebar':     'rgb(var(--rgb-wrap) / <alpha-value>)',
        'd-bg-elevated':    'rgb(var(--rgb-wrap-hover) / <alpha-value>)',
        'd-border':         'rgb(var(--rgb-line) / <alpha-value>)',
        'd-border-hover':   'rgb(var(--rgb-wrap-line) / <alpha-value>)',
        'd-text-primary':   'rgb(var(--rgb-ink) / <alpha-value>)',
        'd-text-secondary': 'rgb(var(--rgb-desc) / <alpha-value>)',
        'd-text-muted':     'rgb(var(--rgb-muted) / <alpha-value>)',

        background: {
          primary: 'rgb(var(--background-primary) / <alpha-value>)',
          surface: 'rgb(var(--background-surface) / <alpha-value>)',
          elevated: 'rgb(var(--background-elevated) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        'primary-dark': 'rgb(var(--primary) / 0.85)',
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        success: 'rgb(var(--success) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
      },
      // The accent is a FILL colour: white sits on it (5.3:1 dark / 5.9:1
      // light). As TEXT it needs its own ink — lightened violet on dark,
      // deepened on light — or every `bg-primary/10 text-primary` chip goes
      // low-contrast. Remap ONLY the text scale; bg-/border-primary keep the
      // true accent, and text-primary-foreground stays white.
      textColor: {
        primary: {
          DEFAULT: 'rgb(var(--rgb-primary-text) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        // accent == primary (one accent); as TEXT it takes the same ink split.
        accent: {
          DEFAULT: 'rgb(var(--rgb-primary-text) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
      },
      fontFamily: {
        // FintechX v4 — Inter (--font-sans) for body + UI; Bricolage
        // Grotesque (--font-display) for display headings (600/700).
        // Numerics: Geist Mono (--font-mono).
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        'display-sm': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-lg': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        'display-xl': ['5.5rem', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
      },
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '32': '128px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        // The ONE gradient family (glossy blue). Mirrors --gradient-signature /
        // --gradient-cta in globals.css; anything on these fills takes
        // text-primary-foreground (white).
        'gradient-signature': 'linear-gradient(180deg, #5290F4 0%, #406AE4 55%, #3055C2 100%)',
        'gradient-cta': 'linear-gradient(180deg, #5290F4 0%, #406AE4 55%, #3055C2 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        // ── Dep-free overlay motion (replaces tailwindcss-animate). ──
        // Strong ease-out, sub-300ms, scale from 0.97 (never 0). Origin is
        // set on the element (Radix transform-origin var) so pop/tip scale
        // from their trigger; dialog stays centered.
        'overlay-in':  'overlayIn 160ms cubic-bezier(0.23, 1, 0.32, 1)',
        'overlay-out': 'overlayOut 140ms cubic-bezier(0.23, 1, 0.32, 1)',
        'pop-in':      'popIn 180ms cubic-bezier(0.23, 1, 0.32, 1)',
        'pop-out':     'popOut 140ms cubic-bezier(0.23, 1, 0.32, 1)',
        'tip-in':      'popIn 125ms cubic-bezier(0.23, 1, 0.32, 1)',
        'tip-out':     'popOut 100ms cubic-bezier(0.23, 1, 0.32, 1)',
        'dialog-in':   'dialogIn 200ms cubic-bezier(0.23, 1, 0.32, 1)',
        'dialog-out':  'dialogOut 160ms cubic-bezier(0.23, 1, 0.32, 1)',
        'sheet-in-right':  'sheetInRight 250ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-out-right': 'sheetOutRight 200ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-in-left':   'sheetInLeft 250ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-out-left':  'sheetOutLeft 200ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-in-top':    'sheetInTop 250ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-out-top':   'sheetOutTop 200ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-in-bottom':  'sheetInBottom 250ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-out-bottom': 'sheetOutBottom 200ms cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // ── Dep-free overlay keyframes ──
        overlayIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        overlayOut: { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
        popIn:  { '0%': { opacity: '0', transform: 'scale(0.97)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        popOut: { '0%': { opacity: '1', transform: 'scale(1)' }, '100%': { opacity: '0', transform: 'scale(0.97)' } },
        dialogIn:  { '0%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.97)' }, '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' } },
        dialogOut: { '0%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' }, '100%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.97)' } },
        sheetInRight:  { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        sheetOutRight: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(100%)' } },
        sheetInLeft:   { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        sheetOutLeft:  { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-100%)' } },
        sheetInTop:    { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(0)' } },
        sheetOutTop:   { '0%': { transform: 'translateY(0)' }, '100%': { transform: 'translateY(-100%)' } },
        sheetInBottom:  { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        sheetOutBottom: { '0%': { transform: 'translateY(0)' }, '100%': { transform: 'translateY(100%)' } },
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
      },
      boxShadow: {
        // Neutral elevation only — depth comes from borders first, shadow
        // second. No colored glows; accent halos live in globals.css
        // (.glow-signature / .glow-ai) where they stay token-driven.
        'glass': '0 8px 32px -4px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
        'glass-lg': '0 16px 48px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'soft': '0 4px 24px -1px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        'sm': '8px',
        'pill': '9999px',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      transitionTimingFunction: {
        // Strong custom ease-out for UI. Built-in easings are too weak for
        // entering/exiting overlays.
        'xai-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
  plugins: [addVariablesForColors],
}

export default config
