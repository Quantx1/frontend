import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as a percentage, smart-detecting whether the input
 * is on the 0-1 ratio scale or the 0-100 percent scale.
 *
 * Two scales co-exist in the codebase:
 *   - The DSL backtester returns ratios (0 → 1.0) — e.g. 0.7020 = 70.20%
 *   - The strategy_catalog table stores percentages (0 → 100) — e.g. 70.20
 *
 * Heuristic: if abs(value) <= 1, treat as ratio and multiply by 100.
 * Otherwise treat as already-percent.
 *
 * Returns '—' for null/undefined/NaN so callers don't need null-checks.
 */
export function formatPercent(
  value: number | null | undefined,
  decimals: number = 1,
): string {
  if (value == null || Number.isNaN(value)) return '—'
  const pct = Math.abs(value) <= 1 ? value * 100 : value
  return `${pct.toFixed(decimals)}%`
}

/** Same heuristic, but returns the rounded percentage as a number. */
export function asPercent(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null
  return Math.abs(value) <= 1 ? value * 100 : value
}
