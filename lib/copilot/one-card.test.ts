/**
 * one-card — the hard cap, pinned.
 *
 * Run with: npx tsx lib/copilot/one-card.test.ts
 *
 * The rule under test is "exactly one card per turn". It is a HARD cap, so
 * most of what matters here is what gets dropped and why — a selection rule
 * that silently picks the wrong survivor is worse than showing all three,
 * because the reader has no way to tell it happened.
 */
import assert from 'node:assert/strict'

import type { CopilotArtifact } from '@/lib/api'

import { ADVICE_FOOTNOTE, selectTurnCard, suppressedCount } from './one-card'

let passed = 0
const check = (label: string, fn: () => void) => {
  fn()
  passed++
  console.log('  ✓', label)
}

const entity = {
  type: 'entity', symbol: 'RELIANCE', price: 1307.8, change: 14.9, changePct: 1.15,
  label: 'bullish', votes: { bull: 7, neutral: 2, bear: 3 }, series: [1290, 1307.8],
  asOf: '2026-08-01',
} as CopilotArtifact

const strategy = {
  type: 'strategy', title: 'EMA breakout', rules: [{ label: 'Entry', value: 'EMA21 > EMA50' }],
} as CopilotArtifact

const table = {
  type: 'table', title: 'Screener hits', columns: ['Change', 'Volume'],
  rows: Array.from({ length: 14 }, (_, i) => ({ symbol: `S${i}`, cells: [] })),
} as CopilotArtifact

const gauge = {
  type: 'gauge', title: 'Market regime', value: 100,
  valueLabel: 'Sideways · 100% confidence', tone: 'neutral',
} as CopilotArtifact

const chart = {
  type: 'linechart', title: 'RELIANCE', subtitle: 'Last 3 months · daily close',
  series: [1, 2, 3, 4, 5],
} as CopilotArtifact

const payoff = {
  type: 'payoff', title: 'Bull Call Spread', points: [], breakevens: [24800, 25100],
} as CopilotArtifact

console.log('\none-card\n')

// ── the cap itself ─────────────────────────────────────────────────────────

check('nothing in, nothing out', () => {
  assert.equal(selectTurnCard([]), null)
  assert.equal(selectTurnCard(null), null)
  assert.equal(selectTurnCard(undefined), null)
})

check('three artifacts yield exactly one card', () => {
  const picked = selectTurnCard([table, gauge, chart])
  assert.ok(picked)
  assert.equal(suppressedCount([table, gauge, chart]), 2)
})

check('an unknown artifact type draws no card rather than a broken one', () => {
  // A card we cannot render properly is worse than prose alone.
  assert.equal(selectTurnCard([{ type: 'something-new' } as unknown as CopilotArtifact]), null)
})

// ── precedence ─────────────────────────────────────────────────────────────

check('entity beats everything', () => {
  assert.equal(selectTurnCard([table, gauge, entity, strategy])?.kind, 'entity')
})

check('strategy beats a stub', () => {
  assert.equal(selectTurnCard([table, strategy])?.kind, 'rules')
})

check('among stubs the FIRST wins — tool order is plan order', () => {
  const picked = selectTurnCard([gauge, table])
  assert.equal(picked?.kind, 'stub')
  assert.ok(picked?.summary.startsWith('Market regime'))
})

check('a table never renders inline — it is always a stub', () => {
  // §4.2: "no table ever renders inline".
  assert.equal(selectTurnCard([table])?.kind, 'stub')
})

// ── the stub line: counted, never estimated ────────────────────────────────

check('a table stub counts the real rows and names the real columns', () => {
  const s = selectTurnCard([table]) as { summary: string; action: string }
  assert.equal(s.summary, 'Screener hits · 14 rows · Change · Volume')
  assert.equal(s.action, 'Open all 14')
})

check('one row is singular', () => {
  const one = { ...table, rows: [{ symbol: 'A', cells: [] }] } as CopilotArtifact
  assert.ok((selectTurnCard([one]) as { summary: string }).summary.includes('1 row ·'))
})

check('an empty table says Open, not "Open all 0"', () => {
  const none = { ...table, rows: [] } as CopilotArtifact
  assert.equal((selectTurnCard([none]) as { action: string }).action, 'Open')
})

check('a chart stub counts the points it actually has', () => {
  const s = selectTurnCard([chart]) as { summary: string }
  assert.equal(s.summary, 'RELIANCE · Last 3 months · daily close · 5 points')
})

check('a payoff stub pluralises breakevens', () => {
  assert.ok((selectTurnCard([payoff]) as { summary: string }).summary.endsWith('2 breakevens'))
  const one = { ...payoff, breakevens: [24800] } as CopilotArtifact
  assert.ok((selectTurnCard([one]) as { summary: string }).summary.endsWith('1 breakeven'))
})

check('a gauge stub does not repeat itself', () => {
  // `valueLabel` already reads as a sentence; echoing `value` beside it would
  // say "100" and "100% confidence" on the same line.
  const s = selectTurnCard([gauge]) as { summary: string }
  assert.equal(s.summary, 'Market regime · Sideways · 100% confidence')
  assert.equal(s.summary.match(/100/g)?.length, 1)
})

check('a missing count is omitted, not shown as zero', () => {
  const bare = { type: 'linechart', title: 'X', series: [] } as unknown as CopilotArtifact
  assert.equal((selectTurnCard([bare]) as { summary: string }).summary, 'X')
})

// ── the two footnote rows ──────────────────────────────────────────────────

check('the advice footnote stands alone and never mentions data', () => {
  // §R2: provenance and the advice statement are DIFFERENT statements. An
  // earlier EntityCard ran them together, which lets the eye treat the whole
  // line as boilerplate and skip the half that changes per card.
  assert.ok(!/settled|EOD|as of|derived/i.test(ADVICE_FOOTNOTE))
  assert.ok(/not investment advice/i.test(ADVICE_FOOTNOTE))
})

console.log(`\n${passed} checks passed\n`)
