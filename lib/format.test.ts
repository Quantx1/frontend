/**
 * format — conventions pinned.
 *
 * Run with: npx tsx lib/format.test.ts   (no test runner configured in this app)
 *
 * These assert the conventions the ~27 hand-rolled formatters disagreed on:
 * Indian grouping, one crore/lakh rule, em-dash for null, U+2212 for negative.
 */
import assert from 'node:assert/strict'

import { direction, inr, inrCompact, inrCrore, inrSigned, num, numMax, pct, pctSigned, qtyCompact, timeAgo } from './format'

const DASH = '—'
let passed = 0
const check = (label: string, fn: () => void) => {
  fn()
  passed++
  console.log('  ✓', label)
}

console.log('format')

check('Indian grouping (2-2-3), not thousands', () => {
  assert.equal(num(1234567), '12,34,567')
  assert.equal(inr(1234567), '₹12,34,567')
})

check('num()/numMax() are exact drop-ins for the inline calls they replaced', () => {
  // ~100 inline sites were swept onto these. If the equivalence below ever
  // breaks, that sweep silently changed what users see.
  const samples = [0, 7, 1234, 1234.5, 1234.56, 1234.567, 1234.5678, 1e7, -98765.4321]
  for (const v of samples) {
    // bare .toLocaleString('en-IN')  →  num(v)
    assert.equal(num(v), v.toLocaleString('en-IN'), `num(${v})`)
    // { maximumFractionDigits: N }  →  numMax(v, N)
    for (const d of [0, 1, 2, 3]) {
      assert.equal(
        numMax(v, d),
        v.toLocaleString('en-IN', { maximumFractionDigits: d }),
        `numMax(${v}, ${d})`,
      )
    }
    // { min: N, max: N }  →  num(v, N)
    for (const d of [0, 2]) {
      assert.equal(
        num(v, d),
        v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }),
        `num(${v}, ${d})`,
      )
    }
  }
})

check('fixed vs max decimals genuinely differ (the trap this avoids)', () => {
  assert.equal(numMax(1234.5, 2), '1,234.5') // max: trailing zero dropped
  assert.equal(num(1234.5, 2), '1,234.50') // fixed: padded for alignment
})

check('null / NaN render as em dash everywhere', () => {
  for (const f of [num, inr, inrCompact, qtyCompact, pct, pctSigned]) {
    assert.equal(f(null as never), DASH)
    assert.equal(f(undefined as never), DASH)
    assert.equal(f(NaN as never), DASH)
  }
  assert.equal(timeAgo(null), DASH)
  assert.equal(timeAgo('not-a-date'), DASH)
})

check('negatives use U+2212 minus, not a hyphen', () => {
  assert.ok(inr(-500).startsWith('−'))
  assert.ok(!inr(-500).startsWith('-'))
})

check('ONE crore/lakh rule: space, uppercase unit, 1dp', () => {
  assert.equal(inrCompact(17_70_00_00_000), '₹1770.0 Cr')
  assert.equal(inrCompact(1.2e7), '₹1.2 Cr')
  assert.equal(inrCompact(8_500_000), '₹85.0 L')
  assert.equal(inrCompact(12_340), '₹12,340')
  // Never the old variants: 'L Cr', 'K Cr', lowercase 'cr', no-space '1.2Cr'.
  for (const bad of ['L Cr', 'K Cr', 'cr', '1.2Cr']) {
    assert.ok(!inrCompact(1.2e7).includes(bad), `must not emit ${bad}`)
  }
})

check('inrCrore: ONE rule for crore-denominated input, magnitude only', () => {
  assert.equal(inrCrore(450), '₹450 Cr')
  assert.equal(inrCrore(1200), '₹1,200 Cr') // NOT the invented "₹1.2 K Cr"
  assert.equal(inrCrore(1_234_00), '₹1.23 L Cr') // lakh-crore IS the convention
  assert.equal(inrCrore(null), '—')
  // Magnitude only — call sites render sign as coloured +/− or |…| notation.
  assert.equal(inrCrore(-450), inrCrore(450))
  // Never the old variants this replaced.
  for (const bad of ['cr', 'K Cr', 'L Cr']) {
    assert.ok(!inrCrore(1200).includes(bad), `must not emit ${bad} at 1200 Cr`)
  }
})

check('inrCrore and inrCompact are different unit domains, not aliases', () => {
  // 1200 CRORE vs 1200 RUPEES. Confusing them under-reports by 1e7 — the exact
  // mistake the three hand-rolled fmtCr helpers were one refactor away from.
  assert.equal(inrCrore(1200), '₹1,200 Cr')
  assert.equal(inrCompact(1200), '₹1,200')
  assert.notEqual(inrCrore(1200), inrCompact(1200))
})

check('signed money always carries a sign', () => {
  assert.equal(inrSigned(745), '+₹745')
  assert.ok(inrSigned(-745).startsWith('−'))
})

check('percent scale heuristic, and the explicit override', () => {
  assert.equal(pct(0.702), '70.2%') // ratio scale
  assert.equal(pct(70.2), '70.2%') // percent scale
  // The heuristic misreads a true 0.5% — the override exists for exactly this.
  assert.equal(pct(0.5), '50.0%')
  assert.equal(pct(0.5, 1, 'percent'), '0.5%')
})

check('pctSigned marks direction', () => {
  assert.equal(pctSigned(1.15, 2, 'percent'), '+1.15%')
  assert.equal(pctSigned(-0.64, 2, 'percent'), '−0.64%')
})

check('direction is semantic, not visual', () => {
  assert.equal(direction(1), 'up')
  assert.equal(direction(-1), 'down')
  assert.equal(direction(0), 'flat')
  assert.equal(direction(null), 'flat')
})

check('timeAgo buckets', () => {
  const ago = (ms: number) => timeAgo(Date.now() - ms)
  assert.equal(ago(5_000), 'just now')
  assert.equal(ago(5 * 60_000), '5m ago')
  assert.equal(ago(5 * 3_600_000), '5h ago')
  assert.equal(ago(3 * 86_400_000), '3d ago')
  assert.equal(timeAgo(Date.now() + 10_000), 'just now') // clock skew
})

console.log(`\n${passed} checks passed`)
