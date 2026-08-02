/**
 * DEV-ONLY demo fixtures for QuantX design review.
 *
 * These are faithful, shape-accurate mock payloads for the public market
 * endpoints, used only when demo mode is enabled (see ./interceptor). They let
 * the data surfaces render with realistic Indian-market content in environments
 * where the FastAPI backend is unreachable, so the UI/UX can be designed and
 * verified against populated layouts instead of empty skeletons.
 *
 * NOTHING here ships to production: the interceptor is guarded by both a
 * runtime flag and a non-production NODE_ENV check.
 */

const now = () => new Date().toISOString()

/** Small deterministic wobble so repeated values don't look copy-pasted. */
function wob(base: number, seed: number, spread: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  const frac = x - Math.floor(x)
  return +(base + (frac - 0.5) * 2 * spread).toFixed(2)
}

/* ── /api/market/global ─────────────────────────────────────────────────── */
export function demoGlobal() {
  return {
    source: 'demo',
    items: [
      { key: 'gift_nifty', label: 'GIFT Nifty', last: 24862, change_pct: 0.34 },
      { key: 'sp500', label: 'S&P 500', last: 5738.2, change_pct: 0.21 },
      { key: 'nasdaq', label: 'Nasdaq', last: 20120.4, change_pct: 0.42 },
      { key: 'dowjones', label: 'Dow Jones', last: 42210.6, change_pct: -0.08 },
      { key: 'ftse', label: 'FTSE 100', last: 8290.1, change_pct: 0.12 },
      { key: 'nikkei', label: 'Nikkei 225', last: 38735.0, change_pct: 0.67 },
      { key: 'hangseng', label: 'Hang Seng', last: 18120.5, change_pct: -0.31 },
      { key: 'brent', label: 'Brent Crude', last: 74.28, change_pct: -0.54 },
    ],
  }
}

/* ── /api/public/regime/history ─────────────────────────────────────────── */
export function demoRegimeHistory(days = 60) {
  const history: Array<Record<string, unknown>> = []
  let nifty = 24200
  for (let i = days; i >= 0; i--) {
    const seed = i + 1
    nifty = +(nifty + wob(28, seed, 60)).toFixed(2)
    const pb = Math.min(0.9, Math.max(0.25, wob(0.62, seed, 0.18)))
    const ps = Math.min(0.5, Math.max(0.06, wob(0.26, seed * 2, 0.1)))
    const pbear = Math.max(0.02, +(1 - pb - ps).toFixed(2))
    const d = new Date()
    d.setDate(d.getDate() - i)
    history.push({
      regime: pb > 0.5 ? 'bull' : pbear > 0.4 ? 'bear' : 'sideways',
      prob_bull: +pb.toFixed(2),
      prob_sideways: +ps.toFixed(2),
      prob_bear: pbear,
      vix: wob(12.8, seed, 1.6),
      nifty_close: nifty,
      detected_at: d.toISOString(),
    })
  }
  const current = history[history.length - 1] as Record<string, unknown>
  const counts = { bull: 0, sideways: 0, bear: 0 }
  for (const h of history) {
    const r = (h as { regime: 'bull' | 'sideways' | 'bear' }).regime
    counts[r] += 1
  }
  return { days, current, history, counts }
}

/* ── /api/screener/market-pulse ─────────────────────────────────────────── */
export function demoMarketPulse() {
  return {
    success: true,
    label: 'Risk-on, broad participation',
    breadth: {
      as_of: now(),
      coverage: { symbols: 498, fresh_today: 486 },
      pct_above_20dma: 68.4,
      pct_above_50dma: 61.2,
      pct_above_200dma: 57.9,
      adv: 342,
      dec: 144,
      ad_pct: 70.4,
      new_highs: 61,
      new_lows: 12,
      score: 72,
      band: 'strong',
    },
    vol: {
      hv: { '10d': 11.2, '20d': 12.4, '30d': 13.1 },
      latest_hv: 11.2,
      vix: 12.8,
      vix_prev: 13.4,
      vix_vs_hv20: -1.2,
      read: 'Volatility easing — VIX below 20-day realized.',
    },
    flows: {
      fii: { side: 'buy', days: 4, cum_cr: 8420 },
      dii: { side: 'buy', days: 6, cum_cr: 11260 },
      last_date: new Date(Date.now() - 864e5).toISOString().slice(0, 10),
    },
    positioning: {
      date: new Date().toISOString().slice(0, 10),
      long: 62,
      short: 38,
      net: 24,
      long_share_pct: 62,
      net_prev: 18,
      net_delta: 6,
      label: 'Longs building',
    },
    delivery: {
      market_avg_delivery_pct: 48.6,
      accumulation_count: 37,
      spikes: [
        { symbol: 'RELIANCE', delivery_pct: 64.2, avg_30d: 46.1, change_pct: 18.1 },
        { symbol: 'INFY', delivery_pct: 58.9, avg_30d: 44.7, change_pct: 14.2 },
        { symbol: 'LT', delivery_pct: 61.3, avg_30d: 49.0, change_pct: 12.3 },
      ],
      note: 'Delivery-based accumulation above 30-day average.',
    },
    valuation: {
      as_of: now(),
      nifty50_median_pe: 22.4,
      nifty500_median_pe: 26.1,
      market_median_pe: 24.8,
      pct_above_50x: 9.2,
      pct_below_15x: 21.4,
      coverage: 486,
      label: 'Fair-to-rich',
    },
    diff: [
      { metric: 'breadth', delta: 4.2, label: 'Breadth improving', detail: '% above 20DMA +4.2 vs yesterday' },
      { metric: 'vix', delta: -0.6, label: 'Volatility cooling', detail: 'VIX -0.6 to 12.8' },
      { metric: 'flows', delta: 1.0, label: 'FII turned buyers', detail: '4th straight session of inflows' },
    ],
  }
}

/* ── /api/screener/v2/sector-heatmap ────────────────────────────────────── */
const SECTORS: Array<[string, number, Array<[string, string]>]> = [
  ['Nifty Bank', 1.42, [['HDFCBANK', 'HDFC Bank'], ['ICICIBANK', 'ICICI Bank'], ['SBIN', 'State Bank']]],
  ['Nifty IT', 1.86, [['TCS', 'Tata Consultancy'], ['INFY', 'Infosys'], ['HCLTECH', 'HCL Tech']]],
  ['Nifty Auto', 0.94, [['MARUTI', 'Maruti Suzuki'], ['M&M', 'Mahindra'], ['TATAMOTORS', 'Tata Motors']]],
  ['Nifty FMCG', -0.32, [['HINDUNILVR', 'HUL'], ['ITC', 'ITC'], ['NESTLEIND', 'Nestle']]],
  ['Nifty Pharma', 0.61, [['SUNPHARMA', 'Sun Pharma'], ['CIPLA', 'Cipla'], ['DRREDDY', "Dr Reddy's"]]],
  ['Nifty Metal', -0.78, [['TATASTEEL', 'Tata Steel'], ['JSWSTEEL', 'JSW Steel'], ['HINDALCO', 'Hindalco']]],
  ['Nifty Energy', 1.12, [['RELIANCE', 'Reliance'], ['NTPC', 'NTPC'], ['POWERGRID', 'Power Grid']]],
  ['Nifty Realty', 2.34, [['DLF', 'DLF'], ['GODREJPROP', 'Godrej Prop'], ['OBEROIRLTY', 'Oberoi Realty']]],
  ['Nifty Fin Services', 1.28, [['BAJFINANCE', 'Bajaj Finance'], ['BAJAJFINSV', 'Bajaj Finserv'], ['HDFCLIFE', 'HDFC Life']]],
  ['Nifty Media', -1.14, [['ZEEL', 'Zee Ent'], ['SUNTV', 'Sun TV'], ['PVRINOX', 'PVR Inox']]],
]

export function demoSectorHeatmap() {
  const sectors = SECTORS.map(([sector, avg, movers], si) => ({
    sector,
    peer_count: 10 + (si % 5),
    avg_change_pct: avg,
    median_change_pct: +(avg * 0.85).toFixed(2),
    breadth_pct: Math.min(100, Math.max(0, Math.round(50 + avg * 18))),
    volume_surge_pct: +wob(24, si + 3, 12).toFixed(1),
    rsi_oversold_count: avg < 0 ? 2 + (si % 3) : 0,
    rsi_overbought_count: avg > 1 ? 1 + (si % 2) : 0,
    top_movers: movers.map(([symbol, name], mi) => ({
      symbol,
      name,
      change_pct: +(avg + wob(0.4, si * 10 + mi, 1.1)).toFixed(2),
      close: +wob(1800, si * 7 + mi + 1, 900).toFixed(2),
    })),
  }))
  return { success: true, timestamp: now(), sectors, count: sectors.length }
}

/* ── /api/market/news ───────────────────────────────────────────────────── */
const NEWS: Array<[string, string, string, number, boolean]> = [
  ['RBI holds repo rate at 6.5%, keeps stance neutral', 'Central bank signals data-dependent path as inflation cools within target band.', 'Economic Times', 92, true],
  ['Nifty closes at record high led by IT and financials', 'Benchmark index gains 0.8% as FII flows turn positive for a fourth straight session.', 'Moneycontrol', 84, true],
  ['Reliance Q2 profit beats estimates on retail strength', 'Consolidated net profit rises 12% YoY; Jio ARPU inches higher.', 'Business Standard', 78, false],
  ['IT majors rally as US software spending outlook improves', 'TCS and Infosys lead gains after upbeat commentary from global peers.', 'Livemint', 71, false],
  ['Crude slips below $75 as demand worries resurface', 'Lower energy prices ease pressure on India import bill and OMC margins.', 'Reuters', 63, false],
  ['GST collections cross ₹1.8 lakh crore in the month', 'Robust indirect-tax mop-up points to resilient domestic consumption.', 'PTI', 58, false],
]
export function demoMarketNews() {
  return {
    source: 'demo',
    items: NEWS.map(([title, description, src, impact, big], i) => ({
      title,
      description,
      image: null,
      source: src,
      region: i % 4 === 0 ? 'global' : 'india',
      link: '#',
      published: new Date(Date.now() - i * 36e5).toISOString(),
      impact,
      is_big: big,
    })),
  }
}

/* ── /api/screener/news/scan ────────────────────────────────────────────── */
const NEWS_HITS: Array<[string, string, number, number, string, number]> = [
  ['RELIANCE', 'earnings_beat', 0.72, 8, 'Reliance Q2 profit beats estimates on retail strength', 2860.4],
  ['INFY', 'guidance_raise', 0.64, 6, 'Infosys lifts FY revenue guidance on deal momentum', 1912.3],
  ['TATAMOTORS', 'volume_breakout', 0.51, 5, 'Tata Motors JLR volumes surprise on the upside', 1042.8],
  ['DLF', 'sector_momentum', 0.58, 4, 'Realty stocks extend rally on housing demand', 842.1],
  ['SUNPHARMA', 'analyst_upgrade', 0.47, 3, 'Brokerage upgrades Sun Pharma on US pipeline', 1788.6],
]
export function demoNewsScan(limit = 12) {
  const hits = NEWS_HITS.slice(0, limit).map(([symbol, tag, sent, hc, top, price], i) => ({
    symbol,
    setup_tag: tag,
    news_sentiment: sent,
    headline_count: hc,
    top_headline: top,
    top_headline_source: 'Moneycontrol',
    last_price: price,
    change_pct_today: +wob(1.4, i + 2, 2.4).toFixed(2),
    headlines: [
      { title: top, source: 'Moneycontrol', link: '#', published: new Date(Date.now() - i * 72e5).toISOString() },
    ],
  }))
  return {
    success: true,
    feature: 'news_scan',
    universe: 'nifty100',
    symbols_scanned: 100,
    lookback_days: 3,
    timestamp: now(),
    hits,
    count: hits.length,
  }
}

/* ── /api/market/briefing (the hero) ────────────────────────────────────── */
export function demoBriefing() {
  return {
    session: 'premarket' as const,
    generated_at: now(),
    trading_date: new Date().toISOString().slice(0, 10),
    headline: 'Global cues firm, flows supportive — Nifty set for a steady open',
    global: {
      items: demoGlobal().items,
      gift_nifty: { key: 'gift_nifty', label: 'GIFT Nifty', last: 24862, change_pct: 0.34 },
      gap_read: 'GIFT Nifty points to a mildly positive open, tracking firm US and Asian markets.',
      source: 'demo',
    },
    flows: {
      date: new Date(Date.now() - 864e5).toISOString().slice(0, 10),
      provisional: true,
      fii: { cash_net: 2140, fno_net: 1180 },
      dii: { cash_net: 1860 },
      trend: Array.from({ length: 5 }).map((_, i) => ({
        date: new Date(Date.now() - (5 - i) * 864e5).toISOString().slice(0, 10),
        fii_cash: +wob(1200, i + 1, 1600).toFixed(0),
        dii_cash: +wob(1400, i + 5, 1200).toFixed(0),
      })),
      source: 'demo · EOD provisional',
    },
    india: {
      regime: 'Bull',
      vix: 12.8,
      eod: { nifty: { label: 'NIFTY 50', prev_close: 24790 }, banknifty: { label: 'BANK NIFTY', prev_close: 52140 } },
      breadth: { adv: 342, dec: 144, adv_pct: 70.4 },
      sectors: { leading: ['Nifty Realty', 'Nifty IT', 'Nifty Bank'], lagging: ['Nifty Media', 'Nifty Metal'] },
      note: 'Broad market firm with breadth above 70% and volatility easing.',
    },
    events: {
      items: [
        { type: 'earnings', label: 'INFY Q2 results', date: new Date(Date.now() + 864e5).toISOString().slice(0, 10) },
        { type: 'macro', label: 'India CPI print', date: new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10) },
      ],
      expiry: { weekly: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10), monthly: null },
    },
    plan: {
      narrative:
        'With global cues firm and FII/DII both net buyers, the tape favours dips being bought. Watch IT and financials for leadership; keep risk tight into the earnings-heavy week.',
      drivers: ['FII + DII both net buyers', 'VIX easing to 12.8', 'Breadth above 70%'],
      disclaimer: 'For educational purposes. Not investment advice.',
    },
  }
}

/* ── /api/screener/movers-why ───────────────────────────────────────────── */
export function demoMoversWhy() {
  return {
    success: true,
    note: 'EOD movers annotated with their probable cause.',
    items: [
      { symbol: 'DLF', change_pct: 4.2, driver: 'Realty rally on strong housing demand', source: 'Moneycontrol', link: '#', has_news: true },
      { symbol: 'INFY', change_pct: 3.1, driver: 'FY guidance raise on deal momentum', source: 'Livemint', link: '#', has_news: true },
      { symbol: 'TATASTEEL', change_pct: -2.4, driver: 'Metal weakness on soft China data', source: 'Reuters', link: '#', has_news: true },
      { symbol: 'ZEEL', change_pct: -3.0, driver: 'No identifiable single catalyst', source: null, link: null, has_news: false },
    ],
  }
}

/* ── /api/screener/breadth ──────────────────────────────────────────────── */
export function demoBreadth(days = 90) {
  const ad_line: Array<{ date: string; ad_line: number }> = []
  let line = 1200
  for (let i = days; i >= 0; i--) {
    line += wob(20, i + 1, 60)
    const d = new Date()
    d.setDate(d.getDate() - i)
    ad_line.push({ date: d.toISOString().slice(0, 10), ad_line: +line.toFixed(0) })
  }
  return {
    success: true,
    today: { date: new Date().toISOString().slice(0, 10), adv: 342, dec: 144, net: 198, ad_line: +line.toFixed(0) },
    ratio: 2.38,
    ad_line,
  }
}

/* ── /api/screener/sector-rotation ──────────────────────────────────────── */
export function demoSectorRotation() {
  const quad = (rs: number, mom: number) =>
    rs >= 0 && mom >= 0 ? 'Leading' : rs < 0 && mom >= 0 ? 'Improving' : rs < 0 && mom < 0 ? 'Lagging' : 'Weakening'
  const sectors = SECTORS.map(([sector], i) => {
    const ret_5d = +wob(1.0, i + 2, 2.6).toFixed(2)
    const ret_20d = +wob(2.2, i + 7, 4.0).toFixed(2)
    const rs_short = +wob(0.3, i + 3, 1.4).toFixed(2)
    const rs_long = +wob(0.2, i + 11, 1.2).toFixed(2)
    return { sector, count: 10 + (i % 5), ret_5d, ret_20d, rs_short, rs_long, quadrant: quad(rs_long, rs_short) }
  })
  return { success: true, count: sectors.length, narrative: null, sectors }
}

/* ── /api/screener/market-explainer ─────────────────────────────────────── */
export function demoMarketExplainer() {
  return {
    facts: { regime: 'bull', vix: 12.8, breadth_pct: 70.4, fii_side: 'buy', dii_side: 'buy' },
    drivers: [
      'Breadth strong — 70% of stocks advancing',
      'FII and DII both net buyers for a 4th session',
      'Volatility easing with VIX at 12.8',
      'IT and Realty leading; Media and Metal lagging',
    ],
    narrative: null,
  }
}

/* ── /api/market/deals ───────────────────────��──────────────────────────── */
export function demoDeals() {
  return {
    label: 'NSE EOD-published bulk & block deals',
    deals: [
      { date: new Date().toISOString().slice(0, 10), symbol: 'RELIANCE', client: 'Foreign Portfolio Investor', side: 'BUY', qty: 1_250_000, price: 2860.4, value_cr: 357.6, type: 'block' },
      { date: new Date().toISOString().slice(0, 10), symbol: 'INFY', client: 'Domestic Mutual Fund', side: 'BUY', qty: 820_000, price: 1912.3, value_cr: 156.8, type: 'bulk' },
      { date: new Date().toISOString().slice(0, 10), symbol: 'ZEEL', client: 'Retail HNI', side: 'SELL', qty: 2_100_000, price: 142.6, value_cr: 29.9, type: 'bulk' },
    ],
    corporate_actions: [
      { symbol: 'TCS', subject: 'Interim dividend ₹12/sh', ex_date: new Date(Date.now() + 4 * 864e5).toISOString().slice(0, 10) },
      { symbol: 'HDFCBANK', subject: 'AGM', ex_date: new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10) },
    ],
  }
}

/* ── /api/screener/alerts/live ──────────────────────────────────────────── */
export function demoLiveAlerts(limit = 24) {
  const all = [
    { symbol: 'DLF', type: 'breakout_20d', severity: 'high', message: '20-day breakout on 2.1x volume' },
    { symbol: 'INFY', type: 'volume_surge', severity: 'high', message: 'Volume 3.4x the 20-day average' },
    { symbol: 'TATAMOTORS', type: 'oi_buildup', severity: 'medium', message: 'OI +15% with price up 1.8%' },
    { symbol: 'SUNPHARMA', type: 'iv_spike', severity: 'medium', message: 'ATM IV rank at 82' },
    { symbol: 'RELIANCE', type: 'delivery_spike', severity: 'medium', message: 'Delivery 64% vs 46% average' },
    { symbol: 'BAJFINANCE', type: 'breakout_20d', severity: 'low', message: 'Approaching 20-day high' },
  ]
  return { success: true, count: Math.min(limit, all.length), alerts: all.slice(0, limit) }
}

/* ── /api/screener/setups ───────────────────────────────────────────────── */
export function demoSetupFinder() {
  const setups = [
    { key: 'breakout', label: 'Breakout', count: 14, symbols: ['DLF', 'INFY', 'LT', 'BAJFINANCE'] },
    { key: 'pullback', label: 'Pullback', count: 9, symbols: ['RELIANCE', 'HDFCBANK', 'MARUTI'] },
    { key: 'trend_continuation', label: 'Trend continuation', count: 11, symbols: ['TCS', 'SUNPHARMA', 'NTPC'] },
    { key: 'reversal', label: 'Reversal', count: 5, symbols: ['ZEEL', 'TATASTEEL'] },
  ]
  return { success: true, ok: true, total: setups.reduce((a, s) => a + s.count, 0), setups }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SIGNALS HUB — /signals (Overview + Alpha/Momentum books)
   ═══════════════════════════════════════════════════════════════════════════ */

const STOCKS: Array<{ s: string; px: number }> = [
  { s: 'RELIANCE', px: 2860 }, { s: 'INFY', px: 1912 }, { s: 'TCS', px: 4180 },
  { s: 'HDFCBANK', px: 1684 }, { s: 'ICICIBANK', px: 1244 }, { s: 'LT', px: 3620 },
  { s: 'DLF', px: 892 }, { s: 'BAJFINANCE', px: 7420 }, { s: 'MARUTI', px: 12680 },
  { s: 'SUNPHARMA', px: 1820 }, { s: 'TATAMOTORS', px: 984 }, { s: 'NTPC', px: 412 },
  { s: 'AXISBANK', px: 1156 }, { s: 'TITAN', px: 3480 }, { s: 'WIPRO', px: 548 },
  { s: 'HINDUNILVR', px: 2740 }, { s: 'ADANIPORTS', px: 1420 }, { s: 'POWERGRID', px: 336 },
]

/** One faithful `Signal` (types/index.ts). Deterministic per (symbol,index). */
function demoSignal(i: number, opts: { segment?: 'EQUITY' | 'FUTURES' | 'OPTIONS'; direction?: 'LONG' | 'SHORT' } = {}) {
  const base = STOCKS[i % STOCKS.length]
  const direction = opts.direction ?? (i % 4 === 0 ? 'SHORT' : 'LONG')
  const segment = opts.segment ?? 'EQUITY'
  const entry = +wob(base.px, i + 3, base.px * 0.01).toFixed(2)
  const long = direction === 'LONG'
  // Per-signal risk/reward variety so the book reads like real data rather than
  // one repeated multiple: stop 1.8–3.4%, target 3.5–9.5% from entry.
  const stopPct = Math.min(0.034, Math.max(0.018, Math.abs(wob(0.026, i + 31, 0.01))))
  const tgtPct = Math.min(0.095, Math.max(0.035, Math.abs(wob(0.062, i + 37, 0.03))))
  const stop = +(long ? entry * (1 - stopPct) : entry * (1 + stopPct)).toFixed(2)
  const target = +(long ? entry * (1 + tgtPct) : entry * (1 - tgtPct)).toFixed(2)
  const confidence = Math.round(Math.min(94, Math.max(58, wob(78, i + 5, 16))))
  const rr = +(Math.abs(target - entry) / Math.abs(entry - stop)).toFixed(2)
  return {
    id: `demo-sig-${segment}-${i}-${base.s}`,
    symbol: base.s,
    exchange: segment === 'OPTIONS' || segment === 'FUTURES' ? 'NFO' : 'NSE',
    segment,
    direction,
    entry_price: entry,
    stop_loss: stop,
    target,
    target_1: target,
    confidence,
    risk_reward: rr,
    risk_reward_ratio: rr,
    catboost_score: +Math.min(0.98, Math.max(0.5, wob(0.78, i + 9, 0.18))).toFixed(2),
    tft_score: +Math.min(0.98, Math.max(0.5, wob(0.74, i + 13, 0.2))).toFixed(2),
    stockformer_score: +Math.min(0.98, Math.max(0.5, wob(0.71, i + 17, 0.2))).toFixed(2),
    ensemble_confidence: confidence,
    model_agreement: +Math.min(1, Math.max(0.6, wob(0.85, i + 21, 0.14))).toFixed(2),
    strategy_names: long ? ['Momentum Breakout', 'ML Meta-Label'] : ['Mean Reversion'],
    reasons: long
      ? ['Price reclaimed 20-DMA on rising volume', 'ML ensemble agreement above 80%', 'Sector in leading quadrant']
      : ['Lost 50-DMA with expanding range', 'Bearish RSI divergence'],
    sentiment_score: +wob(0.2, i + 25, 0.5).toFixed(2),
    sentiment_label: long ? 'bullish' : 'bearish',
    regime_context: 'bull',
    regime_confidence: 0.81,
    is_premium: i % 3 === 0,
    status: 'active' as const,
    created_at: now(),
    generated_at: now(),
    date: new Date().toISOString().slice(0, 10),
  }
}

/* ── /api/signals/today ─────────────────────────────────────────────────── */
export function demoSignalsToday() {
  const all = Array.from({ length: 14 }).map((_, i) =>
    demoSignal(i, { segment: i < 8 ? 'EQUITY' : i < 11 ? 'FUTURES' : 'OPTIONS' }),
  )
  const longs = all.filter((s) => s.direction === 'LONG')
  const shorts = all.filter((s) => s.direction === 'SHORT')
  return {
    date: new Date().toISOString().slice(0, 10),
    total: all.length,
    long_signals: longs,
    short_signals: shorts,
    equity_signals: all.filter((s) => s.segment === 'EQUITY'),
    futures_signals: all.filter((s) => s.segment === 'FUTURES'),
    options_signals: all.filter((s) => s.segment === 'OPTIONS'),
    all_signals: all,
    tier_cap_applied: false,
    tier_cap: null,
  }
}

/* ── /api/signals/history ───────────────────────────────────────────────── */
export function demoSignalsHistory(limit = 300) {
  const n = Math.min(limit, 60)
  const signals = Array.from({ length: n }).map((_, i) => {
    const s = demoSignal(i, { segment: i % 5 === 0 ? 'FUTURES' : 'EQUITY' })
    const d = new Date()
    d.setDate(d.getDate() - (i + 1))
    const status: 'triggered' | 'executed' = i % 3 === 0 ? 'triggered' : 'executed'
    return { ...s, status, date: d.toISOString().slice(0, 10), created_at: d.toISOString(), generated_at: d.toISOString() }
  })
  return { signals, tier_cap_applied: false, tier_cap: null }
}

/* ── /api/signals/momentum · /api/signals/swing (ranked ML books) ───────── */
export function demoStyleSignals(style: 'momentum' | 'swing', topN = 50) {
  const n = Math.min(topN, 24)
  const signals = Array.from({ length: n }).map((_, i) => {
    const base = STOCKS[i % STOCKS.length]
    const entry = +wob(base.px, i + 2, base.px * 0.01).toFixed(2)
    const pct = 1 - i / (n + 4)
    return {
      symbol: base.s,
      style,
      rank: i + 1,
      percentile: +pct.toFixed(3),
      confidence: +Math.min(0.97, Math.max(0.55, wob(0.8, i + 6, 0.16))).toFixed(3),
      direction: 'long',
      entry_price: entry,
      stop_loss: +(entry * 0.97).toFixed(2),
      target: +(entry * (style === 'momentum' ? 1.07 : 1.05)).toFixed(2),
      risk_reward: +(style === 'momentum' ? 2.3 : 1.8),
      reasons: style === 'momentum'
        ? ['Top-decile 20d momentum', 'Volume expansion confirmed', 'Above all key DMAs']
        : ['Oversold bounce setup', 'Support reclaim on volume'],
      expected_return: +Math.max(0.01, wob(0.06, i + 8, 0.03)).toFixed(4),
      top_decile_prob: +Math.min(0.95, Math.max(0.3, pct * 0.9)).toFixed(3),
    }
  })
  return { signals, count: signals.length, status: 'ok', style }
}

/* ── /api/signals/style/paper-window ────────────────────────────────────── */
export function demoPaperWindow() {
  const engine = (horizon: number, hit: number, excess: number) => ({
    horizon,
    days_signaled: 42,
    days_matured: 30,
    live: { hit_rate: hit, mean_excess_h: excess, mean_gross_h: excess + 0.008, n_dates: 30 },
    expected: { hit_rate: hit - 0.02, mean_excess_h: excess - 0.004, source: 'backtest 2023-07..2026-06' },
    status: 'on_track' as const,
  })
  return {
    window_start: new Date(Date.now() - 42 * 864e5).toISOString().slice(0, 10),
    as_of: new Date().toISOString().slice(0, 10),
    engines: { momentum: engine(20, 0.58, 0.021), swing: engine(10, 0.61, 0.016) },
  }
}

/* ── /api/user/profile (Pro tier so nothing is gated in review) ─────────── */
export function demoUserProfile() {
  return {
    id: 'demo-user',
    email: 'demo@quantx.app',
    full_name: 'Demo Trader',
    subscription_tier: 'pro',
    tier: 'pro',
    is_premium: true,
    created_at: now(),
  }
}
