/**
 * format — the ONE money / number / time formatting module.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * An audit found the same value being formatted by hand in ~27 places, with
 * mutually inconsistent results. The same rupee figure rendered as
 * `₹1,23,456`, `₹1.23L Cr`, `₹0.12Cr` and `₹0.12 cr` on four screens of the
 * same product. Percentages had eight signatures with three different
 * null tokens (`--`, `—`, `-`), and `timeAgo` existed in four copies.
 *
 * ── Why no library ─────────────────────────────────────────────────────────
 * `Intl.NumberFormat('en-IN')` already produces the Indian 2-2-3 grouping
 * (1,23,456) natively, and crore/lakh compaction is domain-specific to us.
 * dinero.js / numbro / currency.js would add weight and still need a wrapper
 * for the crore rules — so the wrapper IS the deliverable.
 *
 * ── Conventions ────────────────────────────────────────────────────────────
 * · Null/NaN always renders as EM DASH `—`. Never `-` (reads as negative)
 *   and never `--`.
 * · Negative money uses U+2212 MINUS `−`, not a hyphen, so it aligns in
 *   tabular-nums columns and cannot be mistaken for a dash.
 * · Nothing here applies colour. P&L colour is a rendering decision that
 *   belongs to the component (`text-up` / `text-down`).
 */

const DASH = '—'

/* ── Core number ───────────────────────────────────────────────────────── */

const inrGrouped = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

function isNil(v: number | null | undefined): v is null | undefined {
  return v == null || Number.isNaN(v)
}

/**
 * `1234567` → `12,34,567` (Indian grouping).
 *
 * Omit `decimals` for JS default behaviour — identical to a bare
 * `.toLocaleString('en-IN')`, i.e. up to 3 fraction digits, trailing zeros
 * dropped. Pass `decimals` for a FIXED count (`num(1234, 2)` → `1,234.00`),
 * which is what money columns want so they align in tabular-nums.
 */
export function num(v: number | null | undefined, decimals?: number): string {
  if (isNil(v)) return DASH
  return new Intl.NumberFormat(
    'en-IN',
    decimals == null
      ? {}
      : { minimumFractionDigits: decimals, maximumFractionDigits: decimals },
  ).format(v)
}

/**
 * Up to `max` fraction digits, trailing zeros dropped — the exact semantics of
 * `.toLocaleString('en-IN', { maximumFractionDigits: max })`.
 *
 * Exists so the sweep of ~100 inline call sites is provably behaviour-
 * preserving: `maximumFractionDigits: 2` renders `1234.5` as `1,234.5`, where
 * a fixed-2 format would render `1,234.50`. Where a column genuinely wants the
 * fixed form, use `num(v, 2)` deliberately rather than by accident.
 */
export function numMax(v: number | null | undefined, max: number): string {
  if (isNil(v)) return DASH
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: max }).format(v)
}

/* ── Money ─────────────────────────────────────────────────────────────── */

/** `1234567` → `₹12,34,567`. Use for exact amounts (order value, P&L). */
export function inr(v: number | null | undefined, decimals = 0): string {
  if (isNil(v)) return DASH
  const abs = Math.abs(v)
  const body = decimals
    ? new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(abs)
    : inrGrouped.format(abs)
  return `${v < 0 ? '−' : ''}₹${body}`
}

/** Always carries an explicit sign. Use for deltas and P&L. */
export function inrSigned(v: number | null | undefined, decimals = 0): string {
  if (isNil(v)) return DASH
  const s = inr(Math.abs(v), decimals)
  return v < 0 ? `−${s.replace('−', '')}` : `+${s}`
}

/**
 * Compact Indian money: `₹1.2 Cr`, `₹85.0 L`, `₹12,340`.
 *
 * ONE rule, replacing eight competing implementations that variously emitted
 * `Cr` / `cr` / `L Cr` / `K Cr`, with 1 or 2 decimals and inconsistent spacing.
 * Crore ≥ 1e7, lakh ≥ 1e5, otherwise grouped rupees. Always a space before the
 * unit; unit always uppercase.
 */
export function inrCompact(v: number | null | undefined, decimals = 1): string {
  if (isNil(v)) return DASH
  const sign = v < 0 ? '−' : ''
  const abs = Math.abs(v)
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(decimals)} Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(decimals)} L`
  return `${sign}₹${inrGrouped.format(abs)}`
}

/**
 * Money that ALREADY arrives denominated in ₹ crore — market cap, FII/DII cash
 * flows and the EOD feeds all do. **Not** interchangeable with `inrCompact`,
 * which takes rupees; passing crore to that one under-reports by 1e7.
 *
 * Replaces three local `fmtCr` helpers that disagreed on every axis:
 * `₹1.2K Cr` (MarketPulse) vs `₹450 cr` (OrderFlow, lowercase) vs `12.34L Cr`
 * (Fundamentals, no ₹). The invented "K Cr" tier is dropped — `₹1,200 Cr` reads
 * better than `₹1.2 K Cr` and matches how Indian markets are actually quoted.
 * Lakh-crore is kept, because that IS the convention above ₹1,00,000 Cr.
 *
 * ⚠️ Returns the MAGNITUDE — no sign. Every call site composes its own, either
 * as a coloured +/− next to a BOUGHT/SOLD label or as `|…|` magnitude notation.
 */
export function inrCrore(v: number | null | undefined, decimals = 2): string {
  if (isNil(v)) return DASH
  const abs = Math.abs(v)
  if (abs >= 1e5) return `₹${(abs / 1e5).toFixed(decimals)} L Cr`
  return `₹${inrGrouped.format(abs)} Cr`
}

/** Compact share/contract counts: `86.3 L`, `1.2 Cr`, `4,310`. */
export function qtyCompact(v: number | null | undefined, decimals = 1): string {
  if (isNil(v)) return DASH
  const abs = Math.abs(v)
  const sign = v < 0 ? '−' : ''
  if (abs >= 1e7) return `${sign}${(abs / 1e7).toFixed(decimals)} Cr`
  if (abs >= 1e5) return `${sign}${(abs / 1e5).toFixed(decimals)} L`
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(decimals)} K`
  return `${sign}${inrGrouped.format(abs)}`
}

/* ── Percent ───────────────────────────────────────────────────────────── */

/**
 * Percentage, smart-detecting the 0–1 ratio scale vs the 0–100 percent scale.
 *
 * Two scales genuinely co-exist: the DSL backtester returns ratios (0.7020)
 * while strategy_catalog stores percentages (70.20). Heuristic: |v| <= 1 is a
 * ratio.
 *
 * ⚠️ The heuristic is wrong for a true 0.5% figure, which it reads as 50%.
 * Pass `assume: 'percent'` wherever the scale is known — prefer that over
 * relying on the guess.
 */
export function pct(
  v: number | null | undefined,
  decimals = 1,
  assume?: 'ratio' | 'percent',
): string {
  if (isNil(v)) return DASH
  const scaled =
    assume === 'percent' ? v : assume === 'ratio' ? v * 100 : Math.abs(v) <= 1 ? v * 100 : v
  return `${scaled.toFixed(decimals)}%`
}

/** Percentage with an explicit sign — for changes. */
export function pctSigned(
  v: number | null | undefined,
  decimals = 2,
  assume?: 'ratio' | 'percent',
): string {
  if (isNil(v)) return DASH
  const scaled =
    assume === 'percent' ? v : assume === 'ratio' ? v * 100 : Math.abs(v) <= 1 ? v * 100 : v
  return `${scaled >= 0 ? '+' : '−'}${Math.abs(scaled).toFixed(decimals)}%`
}

/* ── Direction ─────────────────────────────────────────────────────────── */

/** Semantic direction of a value. Components map this to `text-up`/`text-down`. */
export function direction(v: number | null | undefined): 'up' | 'down' | 'flat' {
  if (isNil(v) || v === 0) return 'flat'
  return v > 0 ? 'up' : 'down'
}

/* ── Time ──────────────────────────────────────────────────────────────── */

/**
 * Relative time, IST-agnostic (operates on absolute instants).
 * Replaces four separate copies. Returns `—` for unparseable input rather
 * than the `Invalid Date` / `NaNm ago` those copies could produce.
 */
export function timeAgo(input: string | number | Date | null | undefined): string {
  if (input == null) return DASH
  const t = input instanceof Date ? input.getTime() : new Date(input).getTime()
  if (!Number.isFinite(t)) return DASH
  const secs = Math.floor((Date.now() - t) / 1000)
  // Under a minute reads as "just now", matching three of the four local
  // implementations this replaced (and clock skew, which yields negatives).
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

/** `2026-08-02` → `02 Aug`. */
export function shortDate(input: string | number | Date | null | undefined): string {
  if (input == null) return DASH
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return DASH
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

/** Exchange clock, always IST — the only timezone this product trades in. */
export function istTime(input: string | number | Date | null | undefined): string {
  if (input == null) return DASH
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return DASH
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  })
}
