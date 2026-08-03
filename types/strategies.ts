/**
 * Strategy DSL TypeScript types — mirrors the Pydantic models in
 * backend/ai/strategy/dsl.py and the response shapes in
 * backend/api/strategies_routes.py.
 *
 * The DSL only references PROD engines (Alpha, Mood, Regime). Keep this
 * in sync with the backend EngineName enum — Pulse/Vision/Verdict/Horizon
 * were removed per memory project_engines_pulse_vision_verdict_removed_2026_05_25.
 */

// ─────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────

export type EngineName = 'Alpha' | 'Mood' | 'Regime'

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '1d'

export type InstrumentSegment = 'EQUITY' | 'OPTIONS'

export type Universe =
  | 'single'
  | 'nifty50'
  | 'nifty100'
  | 'nifty500'
  | 'sector:IT'
  | 'sector:BANK'
  | 'sector:AUTO'
  | 'sector:PHARMA'
  | 'sector:FMCG'
  | 'sector:METAL'
  | 'sector:ENERGY'
  | 'sector:INFRA'

export type RegimeFilter =
  | 'bull_only'
  | 'bear_only'
  | 'sideways_only'
  | 'any'

export type StrategyMode = 'backtest' | 'paper' | 'live'

export type PositionSizeKind =
  | 'percent_of_capital'
  | 'fixed_qty'
  | 'risk_based'

export type ConditionKind =
  | 'indicator_compare'
  | 'indicator_cross'
  | 'engine_signal'
  | 'composite_and'
  | 'composite_or'

export type CompareOp =
  | '<'
  | '>'
  | '<='
  | '>='
  | '=='
  | '!='
  | 'crosses_above'
  | 'crosses_below'
  | 'between'
  | 'outside'

export type StrategyStatus =
  | 'draft'
  | 'backtest'
  | 'paper'
  | 'live'
  | 'paused'
  | 'archived'

// ─────────────────────────────────────────────────────────────────────────
// DSL tree
// ─────────────────────────────────────────────────────────────────────────

export interface PositionSize {
  kind: PositionSizeKind
  value: number
}

export interface LegSpec {
  side: 'BUY' | 'SELL'
  option_type: 'CE' | 'PE'
  strike_anchor: 'ATM' | 'ITM' | 'OTM'
  strike_offset: number
  expiry: 'weekly' | 'monthly'
  qty_lots: number
}

export interface Condition {
  kind: ConditionKind
  indicator?: string
  op?: CompareOp
  // For between/outside: [lo, hi]; otherwise scalar
  value?: number | [number, number]
  engine?: EngineName
  // For composite_and / composite_or
  children?: Condition[]
}

export interface DSLStrategy {
  name: string
  instrument_segment: InstrumentSegment
  symbol?: string | null
  universe: Universe
  timeframe: Timeframe
  entry: Condition
  exit: Condition
  stop_loss_pct?: number | null
  take_profit_pct?: number | null
  trailing_stop_pct?: number | null
  position_size: PositionSize
  legs?: LegSpec[] | null
  regime_filter: RegimeFilter
  lookback_days: number
  mode: StrategyMode
}

// ─────────────────────────────────────────────────────────────────────────
// User strategy row (matches user_strategies table)
// ─────────────────────────────────────────────────────────────────────────

export interface UserStrategy {
  id: string
  user_id: string
  name: string
  description?: string | null
  status: StrategyStatus
  dsl: DSLStrategy
  source: 'user' | 'studio' | 'template'
  template_slug?: string | null
  capital_allocated?: number | null
  created_at: string
  updated_at: string
  last_backtest?: BacktestSummary | null
}

// Slim summary stored on the strategy row (full results from /backtest).
export interface BacktestSummary {
  symbol?: string
  start_date?: string
  end_date?: string
  total_trades: number
  win_rate: number
  total_return_pct: number
  max_drawdown_pct: number
  sharpe_ratio: number
  final_capital?: number
  ran_at?: string
}

// ─────────────────────────────────────────────────────────────────────────
// Backtest result (full payload from POST /backtest)
// ─────────────────────────────────────────────────────────────────────────

export interface DSLTrade {
  entry_date: string
  entry_price: number
  exit_date: string
  exit_price: number
  quantity: number
  direction: 'LONG' | 'SHORT'
  hold_days: number
  gross_pnl_pct: number
  net_pnl_pct: number
  net_pnl_amount: number
  exit_reason:
    | 'exit_condition'
    | 'stop_loss'
    | 'take_profit'
    | 'trailing_stop'
    | 'end_of_data'
}

export interface DSLEquityPoint {
  date: string
  equity: number
}

/** One walk-forward window. The last fold is the holdout. */
export interface DSLWalkForwardFold {
  index: number
  start_date: string
  end_date: string
  trades: number
  net_return_pct: number
  win_rate: number
  sharpe: number
  max_drawdown_pct: number
  profitable: boolean
}

/**
 * The out-of-sample block. `POST /{id}/backtest` is ALWAYS walk-forward
 * (STRATEGY_GATE_FOLDS, default 4) and has always returned this — the
 * frontend simply never modelled or read it, so every fold metric, the
 * holdout result and the consistency score were invisible.
 *
 * This is the honest counterweight to a single in-sample number, and it is
 * exactly what the promotion gate scores.
 */
export interface DSLOutOfSample {
  n_folds: number
  oos_trades: number
  oos_folds_profitable: number
  oos_consistency: number
  oos_mean_sharpe: number
  oos_worst_drawdown_pct: number
  holdout_return_pct: number
  holdout_sharpe: number
  holdout_trades: number
  folds: DSLWalkForwardFold[]
}

/**
 * A backtest payload.
 *
 * ⚠️ Most fields are OPTIONAL on purpose. `POST /{id}/backtest` dispatches on
 * the stored DSL, and the universe path
 * (`UniverseWalkForwardResult.to_full_dict()`, backend .../backtest.py:760)
 * returns only a summary — **no `equity_curve`, no `trades`, no capital or
 * date fields**. Typing them as required made `result.equity_curve.map(...)`
 * look safe and threw a TypeError for every universe-scoped strategy.
 */
export interface DSLBacktestResult {
  symbol: string
  strategy_name: string
  start_date?: string
  end_date?: string
  initial_capital?: number
  final_capital?: number
  total_trades: number
  win_rate: number
  total_return_pct?: number
  max_drawdown_pct?: number
  sharpe_ratio: number
  profit_factor?: number
  avg_hold_days?: number
  trades?: DSLTrade[]
  equity_curve?: DSLEquityPoint[]
  /** Present on the universe path only. */
  symbols_tested?: number
  out_of_sample?: DSLOutOfSample
}

// ─────────────────────────────────────────────────────────────────────────
// Catalog (template) row — read-only public surface
// ─────────────────────────────────────────────────────────────────────────

export interface CatalogTemplate {
  id: string
  slug: string
  name: string
  description?: string | null
  category: string
  segment: InstrumentSegment
  tier_required: 'free' | 'pro' | 'elite'
  min_capital: number
  tags?: string[]
  engines_used?: EngineName[]
  is_featured?: boolean
  is_exclusive?: boolean
  is_engine_compatible?: boolean
  backtest_win_rate?: number | null
  backtest_cagr?: number | null
  backtest_sharpe?: number | null
  backtest_max_drawdown?: number | null
  // Full DSL only returned on /catalog/{slug} detail endpoint
  dsl?: DSLStrategy
}

/** One named group on the Library page. Backend returns ``templates``
 *  capped at 50 per section; ``title`` + ``tagline`` are display strings. */
export interface CatalogSection {
  title: string
  tagline: string
  templates: CatalogTemplate[]
}

export interface CatalogSections {
  exclusive: CatalogSection
  featured: CatalogSection
  intraday: CatalogSection
  swing: CatalogSection
  options: CatalogSection
}

// ─────────────────────────────────────────────────────────────────────────
// Studio compile response
// ─────────────────────────────────────────────────────────────────────────

export interface StudioCompiled {
  needs_clarification?: false
  strategy: DSLStrategy
  saved_row?: UserStrategy | null
  save_error?: string | null
}

export interface StudioClarification {
  needs_clarification: true
  missing: string[]
  question: string
  assumptions: string[]
}

export type StudioCompileResult = StudioCompiled | StudioClarification

// ─────────────────────────────────────────────────────────────────────────
// Vision-to-Strategy draft (chart image → synthesized prompt)
// ─────────────────────────────────────────────────────────────────────────

export interface VisionAnalysisData {
  symbol: string
  available: boolean
  trend: 'uptrend' | 'downtrend' | 'range' | 'unclear' | null
  pattern: string | null
  support_levels: number[]
  resistance_levels: number[]
  volume_signal: 'accumulation' | 'distribution' | 'neutral' | null
  setup: string | null
  confidence: number | null
  narrative: string | null
  notes: string[]
}

export interface VisionStrategyDraftResult {
  analysis: VisionAnalysisData
  prompt: string | null
  note?: string | null
  // present only when the caller passed compile=true:
  strategy?: DSLStrategy | null
  saved_row?: UserStrategy | null
  save_error?: string | null
  needs_clarification?: boolean
  missing?: string[]
  question?: string
  assumptions?: string[]
}

// ─────────────────────────────────────────────────────────────────────────
// Schema introspection (used by Builder pickers)
// ─────────────────────────────────────────────────────────────────────────

export interface IndicatorSpec {
  key: string
  label: string
  group: string
  params?: Array<{ key: string; default: number }>
}

export interface SchemaEnums {
  EngineName: EngineName[]
  Timeframe: Timeframe[]
  Universe: Universe[]
  RegimeFilter: RegimeFilter[]
  StrategyMode: StrategyMode[]
  InstrumentSegment: InstrumentSegment[]
  PositionSizeKind: PositionSizeKind[]
  ConditionKind: ConditionKind[]
  CompareOp: CompareOp[]
}

export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}
