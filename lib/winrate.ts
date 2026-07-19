/**
 * lib/winrate.ts — single source of truth for win-rate tone thresholds.
 *
 * Three scanner surfaces historically hard-coded slightly different WR
 * ternaries (scanner rows, the track-record bar, PowerScreenersTab). This
 * centralises the shared boundaries so `WinRateGauge` — and future adopters —
 * agree on what "good / neutral / weak" reads as.
 *
 * `win_rate` is a fraction in 0..1 (0.55 = 55%). `null`/`undefined` means no
 * backfilled stat → honest-empty (a dash), never a misleading 0%.
 *
 * Reference: docs/superpowers/specs/2026-07-02-quantx-phase0-streamline-design.md
 * (WP-PRIMITIVES · WinRateGauge · "resolve canonical WR window").
 */

export type WinRateTone = 'up' | 'neutral' | 'down'

/** ≥ this fraction reads as a strong (green) win rate. */
export const WIN_RATE_GOOD = 0.55
/** ≥ this fraction reads as neutral; below it reads as weak (red). */
export const WIN_RATE_WEAK = 0.45

/** Tone bucket for a win rate, or `null` when there's no data (honest-empty). */
export function winRateTone(wr: number | null | undefined): WinRateTone | null {
  if (wr == null || Number.isNaN(wr)) return null
  if (wr >= WIN_RATE_GOOD) return 'up'
  if (wr >= WIN_RATE_WEAK) return 'neutral'
  return 'down'
}

/** Map a tone to its CSS custom property (for SVG stroke / inline style). */
export function winRateToneVar(tone: WinRateTone): string {
  switch (tone) {
    case 'up':
      return 'var(--color-up)'
    case 'down':
      return 'var(--color-down)'
    case 'neutral':
      return 'var(--color-muted)'
  }
}

/** Map a tone to its Tailwind text-token class. */
export function winRateToneClass(tone: WinRateTone): string {
  switch (tone) {
    case 'up':
      return 'text-up'
    case 'down':
      return 'text-down'
    case 'neutral':
      return 'text-d-text-secondary'
  }
}

/** "55%" from 0.55 — honest em-dash on null/NaN. */
export function formatWinRate(wr: number | null | undefined): string {
  if (wr == null || Number.isNaN(wr)) return '—'
  return `${Math.round(wr * 100)}%`
}
