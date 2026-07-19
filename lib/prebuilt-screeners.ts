/**
 * Prebuilt screeners — the named setups Indian retail traders reach for,
 * grouped by trading style. Each maps to a real scanner id in our engine
 * (see backend nl_screen CATALOG); running one = a confluence scan over
 * that scanner. This is the curated, one-tap layer over the raw engine.
 */

export interface PrebuiltScreener {
  /** URL slug — each screener has its own page at /scanner/[key]. */
  key: string
  /** Scanner ids to run as a confluence (usually one). */
  scanners: number[]
  name: string
  /** One plain-English line — what it finds. */
  blurb: string
}

export interface ScreenerStyle {
  key: string
  label: string
  /** One-line description of who trades this way. */
  tagline: string
  screeners: PrebuiltScreener[]
}

export const PREBUILT_STYLES: ScreenerStyle[] = [
  {
    key: 'intraday',
    label: 'Intraday',
    tagline: 'Same-day moves — volume, momentum and range breaks.',
    screeners: [
      { key: 'volume-surge', scanners: [8], name: 'Volume Surge', blurb: 'Trading 2.5×+ its average volume right now.' },
      { key: 'momentum-burst', scanners: [30], name: 'Momentum Burst', blurb: 'Sharp intraday thrust with expanding range.' },
      { key: 'pivot-breakout', scanners: [33], name: 'Pivot Breakout', blurb: 'Broke the day’s pivot resistance.' },
      { key: 'squeeze-release', scanners: [53], name: 'Squeeze Release', blurb: 'Volatility squeeze just fired — expansion starting.' },
      { key: 'top-gainers', scanners: [2], name: 'Top Gainers', blurb: 'Leading the tape by percent gain.' },
    ],
  },
  {
    key: 'swing',
    label: 'Swing',
    tagline: 'Multi-day setups — the retail sweet spot.',
    screeners: [
      { key: 'breakout-from-consolidation', scanners: [1], name: 'Breakout from Consolidation', blurb: 'Escaping a tight base on rising volume.' },
      { key: 'pullback-to-ema21', scanners: [59], name: 'Pullback to EMA21', blurb: 'Uptrend pulling back to the 21-day EMA — entry zone.' },
      { key: 'rsi-oversold-bounce', scanners: [57], name: 'RSI Oversold Bounce', blurb: 'Oversold inside an uptrend — bounce candidates.' },
      { key: 'bull-crossover-20-50-ema', scanners: [15], name: 'Bull Crossover (20/50 EMA)', blurb: '20-EMA crossed above the 50-EMA.' },
      { key: 'power-setup', scanners: [52], name: 'Power Setup', blurb: 'High-conviction multi-factor swing confluence.' },
    ],
  },
  {
    key: 'momentum',
    label: 'Momentum',
    tagline: 'Ride relative strength and fresh trends.',
    screeners: [
      { key: 'rs-leader', scanners: [61], name: 'RS Leader', blurb: 'Outperforming the market on relative strength.' },
      { key: 'trend-template', scanners: [31], name: 'Trend Template', blurb: 'Minervini-style stage-2 uptrend.' },
      { key: 'bull-momentum', scanners: [17], name: 'Bull Momentum', blurb: 'Strong, sustained upward momentum.' },
      { key: 'fresh-trend-start', scanners: [56], name: 'Fresh Trend Start', blurb: 'A new uptrend just turning up.' },
      { key: 'macd-crossover', scanners: [26], name: 'MACD Crossover', blurb: 'MACD crossed above its signal line.' },
    ],
  },
  {
    key: 'breakout',
    label: 'Breakout',
    tagline: 'Bases, coils and new highs.',
    screeners: [
      { key: 'breakout-w-volume', scanners: [58], name: 'Breakout w/ Volume', blurb: 'Stage-2 breakout confirmed by volume.' },
      { key: 'pre-breakout-coil', scanners: [55], name: 'Pre-Breakout Coil', blurb: 'Coiling tight, ready to break.' },
      { key: 'vcp', scanners: [14], name: 'VCP', blurb: 'Volatility Contraction Pattern — classic base.' },
      { key: '52-week-high', scanners: [5], name: '52-Week High', blurb: 'Printing a new 52-week high.' },
      { key: 'ipo-base-breakout', scanners: [16], name: 'IPO Base Breakout', blurb: 'Recent IPO breaking its first base.' },
    ],
  },
  {
    key: 'reversal',
    label: 'Reversal',
    tagline: 'Turns off oversold and support.',
    screeners: [
      { key: 'rsi-oversold-30', scanners: [9], name: 'RSI Oversold (<30)', blurb: 'Deeply oversold on RSI.' },
      { key: 'bullish-engulfing', scanners: [12], name: 'Bullish Engulfing', blurb: 'Bullish engulfing candle — reversal signal.' },
      { key: 'psar-reversal', scanners: [19], name: 'PSAR Reversal', blurb: 'Parabolic SAR flipped bullish.' },
      { key: 'bb-squeeze-release', scanners: [60], name: 'BB Squeeze Release', blurb: 'Bollinger squeeze releasing to the upside.' },
    ],
  },
  {
    key: 'positional',
    label: 'Positional & Smart-money',
    tagline: 'Longer holds and institutional footprints.',
    screeners: [
      { key: 'ma-stack-bullish', scanners: [54], name: 'MA Stack Bullish', blurb: 'Price stacked cleanly above rising MAs.' },
      { key: 'high-delivery', scanners: [34], name: 'High Delivery %', blurb: 'Heavy delivery volume — institutional accumulation.' },
      { key: 'fii-dii-buying', scanners: [38], name: 'FII + DII Buying', blurb: 'Both foreign and domestic institutions net buying.' },
      { key: 'long-buildup', scanners: [40], name: 'Long Buildup', blurb: 'Price up with rising open interest (F&O).' },
      { key: 'bulk-deals', scanners: [35], name: 'Bulk Deals', blurb: 'Large negotiated trades flagged by the exchange.' },
    ],
  },
]

/** Find one screener (and its style) by slug — for /scanner/[key] pages. */
export function findScreener(key: string): { screener: PrebuiltScreener; style: ScreenerStyle } | null {
  for (const style of PREBUILT_STYLES) {
    const screener = style.screeners.find((s) => s.key === key)
    if (screener) return { screener, style }
  }
  return null
}

// ── Fundamental screeners (Phase 3, 2026-07-11) ── a SEPARATE plane from the
// technical scanners above: these screen the fundamentals snapshot (PE / ROE /
// ROCE / growth / dividend / promoter), not the live indicator engine. Preset
// keys mirror backend/services/screener_v2/fundamental_screen.py PRESETS and
// resolve to /scanner/fundamental/[preset].
export interface FundamentalPreset {
  key: string
  name: string
  blurb: string
}

export const FUNDAMENTAL_PRESETS: FundamentalPreset[] = [
  { key: 'low-pe-value', name: 'Low PE Value', blurb: 'Profitable names at a low price-to-earnings multiple.' },
  { key: 'high-roce-quality', name: 'High ROCE Quality', blurb: 'Efficient capital allocators — ROCE above 20%.' },
  { key: 'quality-compounder', name: 'Quality Compounder', blurb: 'High ROCE and ROE with growing profit.' },
  { key: 'high-growth', name: 'High Growth', blurb: 'Sales and profit both growing above 15%.' },
  { key: 'dividend-payer', name: 'Dividend Payer', blurb: 'Dividend yield above 2% with positive profit growth.' },
  { key: 'promoter-backed', name: 'Promoter-Backed', blurb: 'Promoter holding above 55% — high conviction.' },
  { key: 'quality-score', name: 'Top Quality Score', blurb: 'Ranked by our 0-5 Quality Score.' },
  { key: 'low-debt', name: 'Low Debt', blurb: 'Conservative balance sheets — D/E below 0.3.' },
]

export function findFundamentalPreset(key: string): FundamentalPreset | null {
  return FUNDAMENTAL_PRESETS.find((p) => p.key === key) ?? null
}
