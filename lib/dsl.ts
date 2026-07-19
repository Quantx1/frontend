/**
 * lib/dsl.ts — pure DSL humanisation helpers.
 *
 * Single source of truth for turning a `DSLStrategy` / `Condition` into
 * plain-language + GeistMono compiled-rule text. Extracted verbatim from
 * `components/strategies/DSLPreview.tsx`'s private humanisation so the same
 * logic backs the visual preview AND compact mono one-liners (My-strategy
 * rows, strategy-detail headers).
 *
 * Pure + framework-free (no React) — safe to import anywhere.
 *
 * Reference: docs/superpowers/specs/2026-07-02-quantx-phase0-streamline-design.md
 * (WP-PRIMITIVES · dsl serializer).
 */

import type { Condition, CompareOp, DSLStrategy } from '@/types/strategies'

/** Human-readable comparison operator glyph (↗ ↘ · in / out of · else raw op). */
export function humanOp(op?: CompareOp): string {
  if (!op) return '?'
  switch (op) {
    case 'crosses_above':
      return '↗'
    case 'crosses_below':
      return '↘'
    case 'between':
      return 'in'
    case 'outside':
      return 'out of'
    default:
      return op
  }
}

/** Format a condition value: scalar → string, [lo,hi] → "[lo, hi]", null → "?". */
export function formatValue(v: Condition['value']): string {
  if (v == null) return '?'
  if (Array.isArray(v)) return `[${v[0]}, ${v[1]}]`
  return String(v)
}

/** Human label for a universe token (sector:IT → IT · single → single · else UPPER). */
export function labelUniverse(u: DSLStrategy['universe']): string {
  if (u.startsWith('sector:')) return u.replace('sector:', '')
  if (u === 'single') return 'single'
  return u.toUpperCase()
}

/** Human label for a regime filter. */
export function humanRegime(r: DSLStrategy['regime_filter']): string {
  switch (r) {
    case 'bull_only':
      return 'Bull only'
    case 'bear_only':
      return 'Bear only'
    case 'sideways_only':
      return 'Sideways only'
    case 'any':
      return 'Any regime'
  }
}

/**
 * Serialize a Condition tree into a single-line human / GeistMono string.
 * Mirrors the DSLPreview leaf humanisation — `Engine = value` for engine
 * signals, `indicator op value` for indicator conditions — with composite
 * children joined by AND / OR and nested composites parenthesised for an
 * unambiguous one-liner.
 */
export function serializeCondition(c: Condition): string {
  if (c.kind === 'composite_and' || c.kind === 'composite_or') {
    const joiner = c.kind === 'composite_and' ? ' AND ' : ' OR '
    const parts = (c.children || []).map((child) => {
      const s = serializeCondition(child)
      return child.kind === 'composite_and' || child.kind === 'composite_or'
        ? `(${s})`
        : s
    })
    return parts.join(joiner)
  }
  if (c.kind === 'engine_signal') {
    return `${c.engine || 'Regime'} = ${String(c.value)}`
  }
  // indicator_cross | indicator_compare
  return `${c.indicator} ${humanOp(c.op)} ${formatValue(c.value)}`
}

/** One-line entry rule for a strategy DSL. */
export function dslEntryLine(dsl: DSLStrategy): string {
  return serializeCondition(dsl.entry)
}

/** One-line exit rule for a strategy DSL. */
export function dslExitLine(dsl: DSLStrategy): string {
  return serializeCondition(dsl.exit)
}
