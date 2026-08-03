/**
 * tool-labels — the brand firewall, pinned.
 *
 * Run with: npx tsx lib/copilot/tool-labels.test.ts
 *
 * The backend's own docblock calls a raw tool name reaching the UI the
 * "highest-frequency failure". It reached the UI anyway — a `get_verdict` chip
 * rendered in a real turn — because the transform lived at the call sites and
 * one of three forgot it. These tests exist because the failure is silent:
 * a leaked name looks like a label until someone reads it closely.
 */
import assert from 'node:assert/strict'

import { prettyTools, toolLabel } from './tool-labels'

let passed = 0
const check = (label: string, fn: () => void) => {
  fn()
  passed++
  console.log('  ✓', label)
}

console.log('\ntool-labels\n')

check('every known tool maps to a public label', () => {
  assert.equal(toolLabel('get_verdict'), 'Indicator read')
  assert.equal(toolLabel('get_portfolio'), 'Your book')
  assert.equal(toolLabel('get_current_regime'), 'Market regime')
  assert.equal(toolLabel('run_screen'), 'Screener')
})

check('an unknown tool is GENERIC, never a prettified raw name', () => {
  // The old map fell through to title-casing, so `get_verdict` rendered as
  // "Get Verdict" — the internal name wearing a capital letter. Vague is a
  // missing label; prettified is a leaked one.
  assert.equal(toolLabel('get_some_future_thing'), 'Market data')
  assert.equal(toolLabel('run_whatever'), 'Market data')
})

check('no label contains an underscore or a get_/run_ prefix', () => {
  const raws = [
    'get_portfolio', 'get_watchlist', 'get_signal', 'get_todays_signals',
    'get_stock_snapshot', 'explain_move', 'get_current_regime',
    'suggest_options_strategy', 'get_fundamentals', 'get_technicals',
    'get_verdict', 'get_news_sentiment', 'get_fno_snapshot',
    'get_sector_performance', 'get_fii_dii_flow', 'run_screen',
    'run_fundamental_screen', 'compile_strategy', 'get_my_strategies',
    'a_tool_nobody_added',
  ]
  for (const raw of raws) {
    const out = toolLabel(raw)
    assert.ok(!out.includes('_'), `"${out}" leaks an underscore`)
    assert.ok(!/^(get|run)\b/i.test(out), `"${out}" leaks a ${raw.split('_')[0]}_ prefix`)
  }
})

check('the label is never just the raw name re-cased', () => {
  const raws = ['get_verdict', 'get_stock_snapshot', 'run_fundamental_screen']
  for (const raw of raws) {
    const flattened = raw.replace(/[_-]/g, ' ').toLowerCase()
    assert.notEqual(toolLabel(raw).toLowerCase(), flattened)
  }
})

check('prettyTools dedupes — two tools can share one public label', () => {
  // get_fundamentals and run_fundamental_screen both read "Fundamentals";
  // showing it twice implies two distinct things were consulted.
  assert.deepEqual(prettyTools(['get_fundamentals', 'run_fundamental_screen']), ['Fundamentals'])
})

check('prettyTools caps at six', () => {
  const many = [
    'get_portfolio', 'get_watchlist', 'get_signal', 'get_stock_snapshot',
    'get_current_regime', 'get_verdict', 'get_news_sentiment', 'get_fno_snapshot',
  ]
  assert.equal(prettyTools(many).length, 6)
})

check('prettyTools preserves plan order', () => {
  assert.deepEqual(
    prettyTools(['get_current_regime', 'get_verdict']),
    ['Market regime', 'Indicator read'],
  )
})

check('an empty list yields an empty list, not a placeholder', () => {
  assert.deepEqual(prettyTools([]), [])
})

console.log(`\n${passed} checks passed\n`)
