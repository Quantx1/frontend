/**
 * dsl-plain — turn a DSL Condition into a plain-English sentence.
 *
 * The Builder used to render conditions as code (`rsi14 < 30` with AND
 * badges). This reads them the way a person would say them, so the
 * generated strategy looks like a description, not a query.
 */

import type { Condition, CompareOp, EngineName } from '@/types/strategies'

/** "rsi14" → "RSI (14)", "sma50" → "50-day average", "ema21" → "21-day EMA". */
export function indicatorLabel(name?: string): string {
  if (!name) return 'it'
  const n = name.toLowerCase()
  const exact: Record<string, string> = {
    close: 'price',
    open: "the day's open",
    high: "the day's high",
    low: "the day's low",
    volume: 'volume',
    vwap: 'VWAP',
    macd: 'MACD',
    macd_signal: 'the MACD signal line',
    macd_hist: 'the MACD histogram',
    adx: 'ADX (trend strength)',
    atr: 'ATR (volatility)',
    obv: 'On-Balance Volume',
    supertrend: 'Supertrend',
    bb_upper: 'the upper Bollinger band',
    bb_lower: 'the lower Bollinger band',
    bb_mid: 'the middle Bollinger band',
  }
  if (exact[n]) return exact[n]

  // rsi14 → "RSI (14)"
  let m = n.match(/^rsi(\d+)$/)
  if (m) return `RSI (${m[1]})`
  // sma50 / sma_50 → "50-day average"
  m = n.match(/^sma_?(\d+)$/)
  if (m) return `the ${m[1]}-day average`
  // ema21 / ema_21 → "21-day EMA"
  m = n.match(/^ema_?(\d+)$/)
  if (m) return `the ${m[1]}-day EMA`
  // stoch_k / stoch → "Stochastic %K"
  if (n.startsWith('stoch')) return 'the Stochastic'
  // williams_r → "Williams %R"
  if (n.startsWith('williams')) return 'Williams %R'
  if (n.startsWith('mfi')) return 'the Money Flow Index'
  if (n.startsWith('cci')) return 'the CCI'

  // Fallback: strip underscores, keep it readable.
  return name.replace(/_/g, ' ')
}

function opPhrase(op?: CompareOp): { verb: string; twoValues?: boolean } {
  switch (op) {
    case '<':
      return { verb: 'drops below' }
    case '<=':
      return { verb: 'is at or below' }
    case '>':
      return { verb: 'rises above' }
    case '>=':
      return { verb: 'is at or above' }
    case '==':
      return { verb: 'reaches' }
    case '!=':
      return { verb: 'is not' }
    case 'crosses_above':
      return { verb: 'crosses above' }
    case 'crosses_below':
      return { verb: 'crosses below' }
    case 'between':
      return { verb: 'is between', twoValues: true }
    case 'outside':
      return { verb: 'moves outside', twoValues: true }
    default:
      return { verb: String(op ?? 'compares to') }
  }
}

function valuePhrase(v: Condition['value'], twoValues?: boolean): string {
  if (v == null) return '—'
  if (Array.isArray(v)) return twoValues ? `${v[0]} and ${v[1]}` : `${v[0]}–${v[1]}`
  // A value that is itself an indicator name (for crosses) reads better labelled.
  if (typeof v === 'string' && /[a-z]/i.test(v)) return indicatorLabel(v)
  return String(v)
}

function engineSentence(engine: EngineName | undefined, value: unknown): string {
  const e = engine ?? 'Regime'
  if (e === 'Regime') {
    const r = String(value).toLowerCase()
    if (r === 'bull' || r === 'bullish') return 'the market regime is bullish'
    if (r === 'bear' || r === 'bearish') return 'the market regime is bearish'
    if (r === 'sideways') return 'the market regime is sideways'
    return `the regime reads ${value}`
  }
  if (e === 'Alpha') return `the Alpha rank is ${value} or better`
  if (e === 'Mood') return `the Mood score is ${value}`
  return `${e} is ${value}`
}

/** One condition → a lower-case clause (no leading capital, no period). */
export function conditionToClause(c: Condition): string {
  if (c.kind === 'composite_and') {
    return (c.children || []).map(conditionToClause).join(' and ')
  }
  if (c.kind === 'composite_or') {
    return (c.children || []).map(conditionToClause).join(' or ')
  }
  if (c.kind === 'engine_signal') {
    return engineSentence(c.engine, c.value)
  }
  // indicator_compare + indicator_cross
  const { verb, twoValues } = opPhrase(c.op)
  return `${indicatorLabel(c.indicator)} ${verb} ${valuePhrase(c.value, twoValues)}`
}

/** Full entry/exit sentence, e.g. "Buy when RSI (14) drops below 30 and …". */
export function conditionToSentence(c: Condition, verb: 'Buy' | 'Sell'): string {
  return `${verb} when ${conditionToClause(c)}.`
}
