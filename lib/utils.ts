import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge, taught about our custom type roles.
 *
 * ⚠️ Without this, `cn('text-title', 'text-up')` silently returns `'text-up'`.
 * tailwind-merge resolves conflicts by CLASS GROUP, and it only knows the
 * font-size keys shipped by default (xs…9xl). Our v6 roles — `title`,
 * `heading`, `num-lg` and the rest (tailwind.config.ts fontSize,
 * docs/REDESIGN-VISUAL.md §2.2) — are unknown to it, so it files them under
 * `text-color` alongside `text-up` / `text-d-text-muted` and drops the earlier
 * one. The class vanishes from the DOM with no error and no build warning.
 *
 * This was caught on the entity card: the verdict word rendered at 16px/400
 * instead of 24px/600 because `text-title` never reached the element. Since
 * size-plus-colour is the normal case for every numeric and semantic role, the
 * bug would have hit most of the typography sweep.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display', 'title', 'heading', 'body', 'label', 'meta', 'micro',
            'num-hero', 'num-lg', 'num', 'num-sm',
          ],
        },
      ],
    },
  },
})

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
