import type {
  AssistantUsageResponse,
  DashboardOverview,
  ManagedOverview,
  Notification,
  Position,
  Signal,
  SignalFilters,
  StrategyCatalog,
  StrategyBacktest,
  StrategyDeployment,
  Trade,
  UserStats,
} from '../types'
import { supabase } from './supabase'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

type Primitive = string | number | boolean | null | undefined

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
  query?: Record<string, Primitive>
  auth?: boolean
}

type StructuredDetail = {
  error?: string
  message?: string
  // FastAPI tier-gate (RequireFeature/RequireTier) payloads — kept on the
  // thrown Error as `.tierGate` so callers can branch without regexing
  // the message.
  current_tier?: string
  required_tier?: string
  feature?: string
  upgrade_url?: string
  [key: string]: unknown
}

type ApiErrorShape = {
  detail?: string | StructuredDetail
  error?: string
  message?: string
}

/** Extract a human-readable message from any error payload shape. */
function extractErrorMessage(payload: ApiErrorShape, status: number): string {
  const { detail, error, message } = payload || {}
  if (typeof detail === 'string') return detail
  if (detail && typeof detail === 'object') {
    return detail.message || detail.error || `Request failed (${status})`
  }
  return error || message || `Request failed (${status})`
}

/** Thrown by ``request`` on non-2xx — carries structured detail for callers
 *  that want to branch on tier-gate payloads without parsing the message. */
export class ApiError extends Error {
  status: number
  detail: StructuredDetail | string | null
  constructor(message: string, status: number, detail: StructuredDetail | string | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

function buildPath(path: string, query?: Record<string, Primitive>): string {
  if (!query) {
    return path
  }

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue
    }
    params.set(key, String(value))
  }

  const queryString = params.toString()
  return queryString ? `${path}?${queryString}` : path
}

async function getAuthToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      return session.access_token
    }
  } catch {
    // fall back to local storage below
  }

  if (typeof window === 'undefined') {
    return null
  }

  return (
    localStorage.getItem('sb-access-token') ||
    localStorage.getItem('supabase.auth.token') ||
    null
  )
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options
  const fullPath = buildPath(path, query)

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = await getAuthToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  try {
    const response = await fetch(`${API_BASE}${fullPath}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    let payload: unknown = null
    const text = await response.text()
    if (text) {
      try {
        payload = JSON.parse(text)
      } catch {
        payload = text
      }
    }

    if (!response.ok) {
      const err = (payload as ApiErrorShape) || {}
      const message = extractErrorMessage(err, response.status)
      const detailPayload =
        err.detail && typeof err.detail === 'object' ? (err.detail as StructuredDetail)
        : typeof err.detail === 'string' ? err.detail
        : null
      throw new ApiError(message, response.status, detailPayload)
    }

    return payload as T
  } catch (error) {
    throw error
  }
}

export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object') {
    return extractErrorMessage(error as ApiErrorShape, 0)
  }
  return 'Unknown API error'
}

export type {
  AssistantUsageResponse,
  DashboardOverview,
  ManagedOverview,
  Notification,
  Position,
  Signal,
  Trade,
  UserStats,
}

/** Raw ranked-book signal from the per-style ML serving endpoints
 *  (`/api/signals/momentum`, `/api/signals/swing`). Both share this exact
 *  contract. `percentile`, `expected_return` and `top_decile_prob` arrive as
 *  0..1 FRACTIONS — multiply by 100 at display time. */
export interface StyleSignalRaw {
  symbol: string
  style: string
  rank: number
  percentile: number
  confidence: number
  direction: string
  entry_price: number
  stop_loss: number
  target: number
  risk_reward: number
  reasons: string[]
  expected_return: number
  top_decile_prob: number
}

/** Back-compat alias — momentum was the first ML-served style. */
export type MomentumSignalRaw = StyleSignalRaw

/** Shared response envelope for the per-style ranked-book endpoints. */
export type StyleSignalsResponse = {
  signals: StyleSignalRaw[]
  count: number
  status: string
  style: string
}

/** One style engine's live-vs-expected stats inside the paper evaluation
 *  window (`/api/signals/style/paper-window`). Rates/returns arrive as
 *  0..1 FRACTIONS — multiply by 100 at display time. `live` fields are
 *  null until at least one signal date has matured (horizon elapsed). */
export interface PaperWindowEngine {
  /** Holding horizon in trading days (e.g. 20 for momentum, 10 for swing). */
  horizon: number
  days_signaled: number
  days_matured: number
  live: {
    hit_rate: number | null
    mean_excess_h: number | null
    mean_gross_h: number | null
    n_dates: number
  }
  expected: {
    hit_rate: number
    mean_excess_h: number
    /** Provenance of the expectation, e.g. "backtest 2023-07..2026-06". */
    source: string
  }
  status: 'collecting' | 'on_track' | 'off_track'
}

/** Paper-trading evaluation window — live signals vs backtest expectations.
 *  `window_start` is null until the first live signal after deploy. */
export type PaperWindowResponse = {
  window_start: string | null
  as_of: string
  engines: {
    momentum: PaperWindowEngine
    swing: PaperWindowEngine
  }
}

export type SignalsTodayResponse = {
  date: string
  total: number
  long_signals: Signal[]
  short_signals: Signal[]
  equity_signals?: Signal[]
  futures_signals?: Signal[]
  options_signals?: Signal[]
  all_signals: Signal[]
  // PR-U — Free tier cap surfaced from backend so the FE can render a
  // usage meter without re-fetching the user's tier.
  tier_cap_applied?: boolean
  tier_cap?: number | null
}

export type SignalsHistoryResponse = {
  signals: Signal[]
  tier_cap_applied?: boolean
  tier_cap?: number | null
}

export type TradesResponse = {
  trades: Trade[]
}

export type PositionsResponse = {
  positions: Position[]
}

export type NewsIntelStory = {
  title: string
  source: string | null
  link: string | null
  published: string | null
  member_count: number
  sources: string[]
  label: string
  score: number
  event_type: string
  event_label: string
  impact: 'high' | 'medium' | 'low'
  urgency: 'breaking' | 'recent' | 'today' | 'older'
  agreement: {
    llm: number
    lexicon: number
    finbert: number | null
    models_total: number
    models_agree: number
    consensus: string
  } | null
}

export type PortfolioHistoryResponse = {
  history: Array<Record<string, any>>
}

export type NotificationsResponse = {
  notifications: Notification[]
}

// PR-V37 — structured chart/stat artifacts the Copilot emits inline in chat.
// Every value is sourced from real tool data (price series, regime probs, …).
export type ArtifactTone = 'up' | 'down' | 'neutral'
// Optional deep-link chip under an artifact (uTrade-style action handoff, 2026-07-11).
export interface ArtifactCta { label: string; href: string }
export type CopilotArtifact =
  | {
      type: 'sparkline'
      title: string
      subtitle?: string | null
      series: number[]
      last?: number | null
      changePct?: number | null
      cta?: ArtifactCta
    }
  | {
      // Real interactive area/line chart with axes + tooltip (Recharts).
      type: 'linechart'
      title: string
      subtitle?: string | null
      series: number[]
      last?: number | null
      changePct?: number | null
      yLabel?: string
      cta?: ArtifactCta
    }
  | {
      type: 'bars'
      title: string
      subtitle?: string | null
      items: Array<{ label: string; value: number; tone?: ArtifactTone }>
      unit?: string
      caption?: string | null
      cta?: ArtifactCta
    }
  | {
      type: 'stat'
      title: string
      subtitle?: string | null
      stats: Array<{ label: string; value: string; tone?: ArtifactTone }>
      cta?: ArtifactCta
    }
  | {
      // Semicircular score gauge (0-100) — regime confidence, verdict score, etc.
      type: 'gauge'
      title: string
      subtitle?: string | null
      value: number
      valueLabel?: string
      tone?: ArtifactTone
      cta?: ArtifactCta
    }
  | {
      // Option strategy payoff diagram — P&L across underlying price at expiry.
      type: 'payoff'
      title: string
      subtitle?: string | null
      points: Array<{ x: number; y: number }>
      breakevens?: number[]
      spot?: number | null
      maxProfit?: number | null
      maxLoss?: number | null
      cta?: ArtifactCta
    }
  | {
      // Results table — a screener hit list, etc. Header cells in `columns`,
      // one `rows` entry per symbol with a leading symbol label + value cells.
      type: 'table'
      title: string
      subtitle?: string | null
      columns: string[]
      rows: Array<{
        symbol: string
        cells: Array<{ value: string; tone?: ArtifactTone }>
      }>
      cta?: ArtifactCta
    }
  | {
      // Compiled strategy card — Buy/Sell rule lines + risk, from the chat
      // strategy compiler. The cta deep-links to Studio for backtest + deploy.
      type: 'strategy'
      title: string
      subtitle?: string | null
      rules: Array<{ label: string; value: string }>
      cta?: ArtifactCta
    }

// WP-RAILS — honest transparent-agent telemetry streamed alongside the reply.
// Both are brand-safe, whitelisted projections of AgentState (never raw tool
// names / result rows). `progress` = the reasoning/tool step timeline;
// `references` = the market-data entities the agent touched (F4: entities only).
export type CopilotStepStatus = 'ok' | 'error' | 'running'
export type CopilotStep = {
  stage: string
  label: string
  tool?: string
  status: CopilotStepStatus
  duration_ms?: number
  error?: string
}
export type CopilotReferenceKind = 'symbol' | 'signal' | 'regime' | 'position' | 'watch' | 'options'
export type CopilotReference = {
  kind: CopilotReferenceKind
  label: string
  sublabel?: string | null
  tool: string
  id?: string | null
  cited?: boolean
}

// PR 30 — F&O strategy proposal shape (shared between overview + single-symbol + price)
export type FnoIndexSnapshot = {
  symbol: string
  spot: number
  expiry: string | null
  days_to_expiry: number | null
  pcr_oi: number
  pcr_volume: number | null
  pcr_tag: 'extreme_bullish' | 'bullish' | 'normal' | 'bearish' | 'extreme_bearish'
  total_call_oi: number
  total_put_oi: number
  max_pain: number | null
  max_pain_distance_pct: number | null
  pull_to_max_pain_signal: boolean
  iv_atm: number | null
  iv_rank?: number | null
  iv_percentile?: number | null
  iv_skew: number | null
  hv?: {
    hv: Record<string, number>
    latest_hv: number
    note: string
  } | null
  top_call_oi_strikes: number[]
  top_put_oi_strikes: number[]
  biggest_oi_buildup: {
    strike: number
    side: 'CE' | 'PE'
    oi_change: number
    direction: 'writing' | 'unwinding'
  } | null
  source: string
  strike_count: number
  timestamp: string | null
}

export type FnoStrategy = {
  name: string
  bias: 'bullish' | 'bearish' | 'neutral'
  confidence: 'high' | 'medium' | 'low'
  rationale: string
  margin_estimate_inr: number | null
  suggested_legs: string[]
  risk_notes: string[]
  source_label: string
}

export type FoStrategyLeg = {
  action: 'BUY' | 'SELL'
  option_type: 'CE' | 'PE'
  strike: number
  expiry: string
  premium: number
  delta: number
  gamma: number
  theta: number
  vega: number
  iv: number
}

export type FoStrategyProposal = {
  symbol: string
  strategy: string
  name: string
  regime: string
  vix_direction: string
  vix_level: number | null
  view: string
  legs: FoStrategyLeg[]
  max_profit: number | null
  max_loss: number | null
  breakevens: number[]
  net_premium: number
  credit_debit: 'credit' | 'debit'
  lot_size: number
  probability_of_profit: number | null
  expiry: string
  strike_interval: number
}

// PR 33 — AI Dossier engine block shape (shared by every engine row)
export type DossierEngineBlock = {
  engine: string
  role: string
  available: boolean
  direction?: 'bullish' | 'bearish' | 'bullish_tilt' | 'bearish_tilt' | 'neutral' | 'non_directional' | 'mixed'
  // Forecast
  p10?: number | null
  p50?: number | null
  p90?: number | null
  // Alpha
  rank?: number
  score?: number
  date?: string
  // Trajectory
  horizon_days?: number
  // Thales
  headline_count?: number
  trade_dates?: number
  // Regime
  regime?: string
  prob_bull?: number | null
  prob_sideways?: number | null
  prob_bear?: number | null
  vix?: number | null
  // Intraday
  up_prob?: number
  // EarningsScout
  announce_date?: string
  beat_prob?: number
  confidence?: string | null
}

// PR 34 — Portfolio Doctor report shape (shared: analyze + report)
export type DoctorRiskFlag = {
  kind: 'concentration' | 'sector_skew' | 'drawdown' | 'stale_stop'
  severity: 'low' | 'medium' | 'high'
  message: string
  meta?: Record<string, any>
}
export type DoctorPositionResult = {
  symbol: string
  weight: number
  composite_score: number
  action: string
  narrative: string
}
export type DoctorReport = {
  id: string
  created_at: string
  source: 'manual' | 'broker' | 'csv'
  position_count: number
  capital: number | null
  composite_score: number
  diversification_score?: number
  risk_score?: number
  action: 'rebalance' | 'hold' | 'reduce_risk' | 'increase_risk'
  narrative: string
  per_position: DoctorPositionResult[]
  risk_flags: DoctorRiskFlag[]
  agents: Record<string, any>
  quota: {
    tier: 'free' | 'pro' | 'elite'
    runs_this_month: number
    quota: number | null
    remaining: number | null
  }
}

// Phase 4 — one IPO issue in the primary-market calendar. `subscription_x` is
// only present for currently-open issues; GMP is intentionally absent.
export interface IpoIssue {
  symbol: string | null
  company: string | null
  price_band: string | null
  price_band_low?: number | null
  price_band_high?: number | null
  open_date: string | null
  close_date: string | null
  status: string
  series?: string | null
  subscription_x: number | null
}

export const api = {
  user: {
    getProfile: () => request<Record<string, any>>('/api/user/profile'),
    updateProfile: (data: Record<string, any>) =>
      request<{ success: boolean; data?: Record<string, any> }>('/api/user/profile', {
        method: 'PUT',
        body: data,
      }),
    getStats: () => request<UserStats>('/api/user/stats'),
    // PR 14 — tier + feature access map + Copilot daily cap.
    getTier: () =>
      request<{
        user_id: string
        tier: 'free' | 'pro' | 'elite'
        is_admin: boolean
        features: Record<string, boolean>
        copilot_daily_cap: number
      }>('/api/user/tier'),
    // PR 123 — cross-device UI prefs blob (watchlist preset pins, etc.).
    getUIPreferences: () =>
      request<{ ui_preferences: Record<string, any> }>('/api/user/ui-preferences'),
    updateUIPreferences: (ui_preferences: Record<string, any>) =>
      request<{ success: boolean; ui_preferences: Record<string, any> }>(
        '/api/user/ui-preferences',
        { method: 'PUT', body: { ui_preferences } },
      ),
  },

  // Phase 4 — IPO calendar (NSE primary-market feed). Public, honest-empty.
  ipo: {
    calendar: () =>
      request<{
        success: boolean; available: boolean; as_of: string | null; note?: string | null
        open: IpoIssue[]; upcoming: IpoIssue[]
      }>('/api/ipo/calendar', { auth: false }),
  },

  // Dual-mode 2026-06-12 — the beginner ("managed") Home aggregate.
  // Deterministic, honest-null, NOT tier-gated (Free/Pro get
  // autopilot.available=false so the UI shows an upsell, not a 403).
  managed: {
    overview: () => request<ManagedOverview>('/api/managed/overview'),
    // Pricing v2 — Paper AutoPilot opt-in (any tier; always virtual money).
    paperAutopilot: (enabled: boolean) =>
      request<{ enabled: boolean; mode: 'paper'; ok: boolean }>(
        '/api/managed/paper-autopilot',
        { method: 'POST', body: { enabled } },
      ),
  },

  dashboard: {
    /** Single round-trip aggregate: stats + signals + positions + notifications + equity curve. */
    getOverview: (equity_days: number = 30) =>
      request<DashboardOverview>(`/api/dashboard/overview?equity_days=${equity_days}`),
  },

  assistant: {
    // The daily chat-credit meter (the Copilot cap window). The legacy
    // `assistant.chat` brain was removed 2026-07-11 — ai.copilotChatStream
    // is the one chat path.
    getUsage: () => request<AssistantUsageResponse>('/api/assistant/usage'),
  },

  signals: {
    getToday: (filters?: SignalFilters) =>
      request<SignalsTodayResponse>('/api/signals/today', {
        query: {
          segment: filters?.segment,
          direction: filters?.direction,
        },
      }),
    getById: (signalId: string) => request<Signal>(`/api/signals/${signalId}`),
    // PR 50 — F1 intraday signals (last 60 min by default)
    getIntraday: (windowMinutes = 60) =>
      request<{
        window_minutes: number
        total: number
        signals: Signal[]
      }>('/api/signals/intraday', { query: { window_minutes: windowMinutes } }),
    // 4-engine ML/DL — momentum style engine (cross-section ranked book)
    getMomentum: (topN = 50) =>
      request<StyleSignalsResponse>('/api/signals/momentum', { query: { top_n: topN } }),
    // 4-engine ML/DL — swing style engine. Same contract as momentum:
    // ranked book, fractions for percentile/expected_return/top_decile_prob.
    getSwing: (topN = 50) =>
      request<StyleSignalsResponse>('/api/signals/swing', { query: { top_n: topN } }),
    // Paper evaluation window — live Momentum/Swing stats vs backtest
    // expectations (the pre-real-money gate).
    getPaperWindow: () =>
      request<PaperWindowResponse>('/api/signals/style/paper-window'),
    getHistory: (filters?: Record<string, Primitive>) =>
      request<SignalsHistoryResponse>('/api/signals/history', { query: filters }),
    getPerformance: (days = 30) =>
      request<Record<string, any>>('/api/signals/performance', { query: { days } }),
  },

  trades: {
    getAll: (filters?: Record<string, Primitive>) =>
      request<TradesResponse>('/api/trades', { query: filters }),
    journalInsights: (useLlm = false) =>
      request<{
        stats: {
          n: number; win_rate?: number; avg_win?: number; avg_loss?: number
          by_session?: Array<{ label: string; n: number; win_rate: number; total_pnl: number }>
          by_hold?: Array<{ label: string; n: number; win_rate: number; total_pnl: number }>
          best_symbols?: Array<{ symbol: string; n: number; total_pnl: number }>
          worst_symbols?: Array<{ symbol: string; n: number; total_pnl: number }>
        }
        narrative: string | null
      }>('/api/trades/journal-insights', { query: { use_llm: useLlm } }),
    coachReview: (useLlm = false) =>
      request<{
        flags: Array<{ key: string; label: string; detail: string }>
        stats: Record<string, any>
        narrative: string | null
      }>('/api/trades/coach', { query: { use_llm: useLlm } }),
    reviewTrade: (tradeId: string, useLlm = false) =>
      request<{ trade: Record<string, any>; facts: Record<string, any>; points: string[]; narrative: string | null }>(`/api/trades/${tradeId}/analysis`, { query: { use_llm: useLlm } }),
    execute: (data: Record<string, any>) =>
      request<{
        success: boolean
        trade_id: string
        status: 'pending' | 'open' | string
        quantity: number
        entry_price: number
        stop_loss: number
        target: number
      }>('/api/trades/execute', {
        method: 'POST',
        body: data,
      }),
    close: (tradeId: string, data?: Record<string, any>) =>
      request<{ success: boolean }>(`/api/trades/${tradeId}/close`, {
        method: 'POST',
        body: data || {},
      }),
    approve: (tradeId: string) =>
      request<{ success: boolean; message: string }>(`/api/trades/${tradeId}/approve`, {
        method: 'POST',
      }),
    killSwitch: () =>
      request<{ success: boolean; message: string }>('/api/trades/kill-switch', {
        method: 'POST',
      }),
  },

  positions: {
    getAll: () => request<PositionsResponse>('/api/positions'),
    getOpen: () => request<PositionsResponse>('/api/positions/open'),
    getById: (positionId: string) => request<Position>(`/api/positions/${positionId}`),
    close: (positionId: string, data?: Record<string, any>) =>
      request<{ success: boolean }>(`/api/positions/${positionId}/close`, {
        method: 'POST',
        body: data || {},
      }),
    updateSlTarget: (positionId: string, data: { stop_loss?: number; target?: number }) =>
      request<{ success: boolean }>(`/api/positions/${positionId}`, {
        method: 'PUT',
        body: data,
      }),
  },

  portfolio: {
    getSummary: () => request<Record<string, any>>('/api/portfolio'),
    getHistory: (days = 30) =>
      request<PortfolioHistoryResponse>('/api/portfolio/history', { query: { days } }),
    getPerformance: () => request<Record<string, any>>('/api/portfolio/performance'),
  },

  notifications: {
    getAll: (params?: { unread_only?: boolean; limit?: number }) =>
      request<NotificationsResponse>('/api/notifications', {
        query: {
          unread_only: params?.unread_only,
          limit: params?.limit,
        },
      }),
    markRead: (notificationId: string) =>
      request<{ success: boolean }>(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      }),
    markAllRead: () =>
      request<{ success: boolean }>('/api/notifications/read-all', {
        method: 'POST',
      }),
  },

  watchlist: {
    getAll: () => request<{ watchlist: Array<Record<string, any>> }>('/api/watchlist'),
    add: (symbol: string, segment: 'EQUITY' | 'FUTURES' | 'OPTIONS' = 'EQUITY') =>
      request<{ success: boolean; message?: string }>('/api/watchlist', {
        method: 'POST',
        body: { symbol, segment },
      }),
    remove: (symbol: string) =>
      request<{ success: boolean }>(`/api/watchlist/${symbol}`, {
        method: 'DELETE',
      }),
    update: (symbol: string, data: { notes?: string; target_price?: string; stop_loss?: string }) =>
      request<{ success: boolean }>(`/api/watchlist/${symbol}`, {
        method: 'PUT',
        query: {
          notes: data.notes || undefined,
          target_price: data.target_price || undefined,
          stop_loss: data.stop_loss || undefined,
        },
      }),

    // PR 112 — partial update for alert thresholds. Backend re-arms
    // the PR 109 price-alert debounce when a threshold value changes,
    // so the next crossing fires fresh.
    updateAlerts: (
      symbol: string,
      data: {
        alert_price_above?: number | null
        alert_price_below?: number | null
        alert_enabled?: boolean
        notes?: string
      },
    ) =>
      request<{ success: boolean; updated: boolean; rearmed?: boolean }>(
        `/api/watchlist/${symbol}/alerts`,
        { method: 'PUT', body: data },
      ),

    // PR 39 — enriched per-symbol engine snapshots
    live: () =>
      request<{
        items: Array<{
          symbol: string
          added_at: string | null
          alert_enabled: boolean
          alert_price_above: number | null
          alert_price_below: number | null
          notes: string | null
          last_price: number | null
          change_pct: number | null
          engines: {
            consensus: 'bullish' | 'bearish' | 'mixed' | 'neutral'
            swing_direction: 'bullish' | 'bearish' | 'neutral' | null
            regime: 'bull' | 'sideways' | 'bear' | null
            regime_warning: boolean
            sentiment_score: number | null
          } | null
          latest_signal: {
            id: string
            direction: 'LONG' | 'SHORT'
            confidence: number
            status: string
            created_at: string
            entry_price: number | null
            target: number | null
            stop_loss: number | null
          } | null
          upcoming_earnings: {
            announce_date: string
            beat_prob: number
            confidence: string | null
          } | null
        }>
        tier: 'free' | 'pro' | 'elite'
        cap: number | null
        count: number
        capped: boolean
      }>('/api/watchlist/live'),

    limits: () =>
      request<{
        tier: 'free' | 'pro' | 'elite'
        cap: number | null
        used: number
        remaining: number | null
      }>('/api/watchlist/limits'),

    // Watchlist Daily Digest — deterministic per-symbol bullets + summary
    // always; grounded narrative only when useLlm (cached per user/day
    // server-side). Authenticated (watchlist is per-user).
    digest: (useLlm = false) =>
      request<{
        success: boolean
        items: Array<{ symbol: string; bullets: string[] }>
        summary: string | null
        narrative: string | null
        count: number
        llm_capped?: boolean
      }>('/api/watchlist/digest', { query: { use_llm: useLlm } }),
  },

  market: {
    getStatus: () => request<Record<string, any>>('/api/market/status', { auth: false }),
    getQuote: (symbol: string) =>
      request<Record<string, any>>(`/api/market/quote/${symbol}`, { auth: false }),
    getIndices: () => request<Record<string, any>>('/api/market/indices', { auth: false }),
    // PR-V4 — global pre-market cues (US / Asia / commodities / DXY / US10Y / BTC)
    getGlobal: () =>
      request<{
        items: Array<{ key: string; label: string; last: number | null; change_pct: number | null }>
        source: string
      }>('/api/market/global', { auth: false }),
    // Live market-moving news (Indian + global) from free keyless RSS feeds (public).
    news: () =>
      request<{
        items: Array<{
          title: string
          description: string
          image: string | null
          source: string
          region: string
          link: string
          published: string | null
        }>
        source: string
      }>('/api/market/news', { auth: false }),
    getOHLC: (symbol: string, interval = '1d', days = 30) =>
      request<Record<string, any>>(`/api/market/ohlc/${symbol}`, {
        query: { interval, days },
        auth: false,
      }),
    // Standalone "Mood" — on-demand news sentiment for ANY stock.
    sentiment: (symbol: string) =>
      request<{
        symbol: string
        available: boolean
        mean_score: number | null
        label: 'bullish' | 'bearish' | 'neutral' | null
        headline_count: number
        positive_count: number
        negative_count: number
        neutral_count: number
        headlines: Array<{
          title: string
          source: string | null
          published: string | null
          label: string
          score: number
        }>
        sources: string[]
      }>(`/api/market/sentiment/${encodeURIComponent(symbol)}`, { auth: false }),
  },

  broker: {
    getStatus: () => request<Record<string, any>>('/api/broker/status'),
    getConnections: () =>
      request<{
        brokers: Array<{
          broker_name: 'zerodha' | 'upstox' | 'angelone' | 'fyers' | 'dhan' | 'kotakneo' | 'aliceblue'
          status: 'connected' | 'disconnected' | 'expired' | 'error' | 'not_connected'
          account_id: string | null
          last_synced_at: string | null
          expires_at: string | null
        }>
      }>('/api/broker/connections'),
    connect: (data: Record<string, any>) =>
      request<{ success: boolean; broker?: string; account_id?: string; auto_refresh?: boolean }>('/api/broker/connect', {
        method: 'POST',
        body: data,
      }),
    order: (data: Record<string, any>) =>
      request<{ success: boolean; order_id: string | null; status: string; message: string; symbol: string; transaction_type: string; quantity: number }>(
        '/api/broker/order',
        { method: 'POST', body: data },
      ),
    disconnect: (broker?: string) =>
      request<{ success: boolean; disconnected: string }>(
        broker ? `/api/broker/disconnect?broker=${broker}` : '/api/broker/disconnect',
        { method: 'POST' }
      ),
    initiateOAuth: (broker: string, returnTo?: string) =>
      request<{ auth_url: string; state: string; auth_type?: string; required_fields?: any[] }>(
        `/api/broker/${broker}/auth/initiate${returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ''}`,
        { method: 'POST' }
      ),
    getPositions: () => request<{ positions: Array<Record<string, any>> }>('/api/broker/positions'),
    getOrders: () =>
      request<{ orders: Array<{ order_id: string; symbol: string; transaction_type: string; quantity: number; filled_quantity: number; order_type: string; price: number; average_price: number; status: string; product: string }> }>('/api/broker/orders'),
    getHoldings: () => request<{ holdings: Array<Record<string, any>> }>('/api/broker/holdings'),
    getMargin: () =>
      request<{ available_margin: number; used_margin: number }>('/api/broker/margin'),
  },

  // PR 18 — public trust-surface endpoints (/regime, /track-record, /models)
  publicTrust: {
    regimeHistory: (days = 90) =>
      request<{
        days: number
        current: {
          regime: 'bull' | 'sideways' | 'bear'
          prob_bull: number
          prob_sideways: number
          prob_bear: number
          vix: number | null
          nifty_close: number | null
          detected_at: string
        } | null
        history: Array<{
          regime: 'bull' | 'sideways' | 'bear'
          prob_bull: number
          prob_sideways: number
          prob_bear: number
          vix: number | null
          nifty_close: number | null
          detected_at: string
        }>
        counts: { bull: number; sideways: number; bear: number }
      }>('/api/public/regime/history', { auth: false, query: { days } }),

    trackRecord: (opts?: {
      days?: number
      segment?: 'EQUITY' | 'FUTURES' | 'OPTIONS'
      direction?: 'LONG' | 'SHORT'
      limit?: number
    }) =>
      request<{
        days: number
        stats: {
          n: number
          wins: number
          losses: number
          expired: number
          win_rate: number
          avg_return_pct: number
          avg_win_pct: number
          avg_loss_pct: number
          profit_factor: number | null
          best_return_pct: number
          best_symbol: string | null
          worst_return_pct: number
          worst_symbol: string | null
        }
        curve: Array<{ date: string; cum_return_pct: number }>
        current_regime: { regime: string; detected_at: string } | null
        signals: Array<Record<string, any>>
      }>('/api/public/track-record', {
        auth: false,
        query: {
          days: opts?.days ?? 90,
          segment: opts?.segment,
          direction: opts?.direction,
          limit: opts?.limit ?? 200,
        },
      }),

    models: (windowDays = 30) =>
      request<{
        window_days: number
        models: Array<{
          model_name: string
          window_days: number
          win_rate: number | null
          avg_pnl_pct: number | null
          signal_count: number
          directional_accuracy: number | null
          sharpe_ratio: number | null
          max_drawdown_pct: number | null
          computed_at: string
          sparkline: number[]
          // Backend may add these when falling back to model_versions
          // (pre-launch, when model_rolling_performance is still empty).
          primary_metric?: string | null
          primary_value?: number | null
          primary_label?: string | null
          source?: 'rolling' | 'calibration'
          version?: number
          is_prod?: boolean
          is_shadow?: boolean
        }>
      }>('/api/public/models', { auth: false, query: { window_days: windowDays } }),

    // PR 48 — public ops status (trading halt flag only, no reason text)
    systemStatus: () =>
      request<{
        trading_halted: boolean
        computed_at: string
      }>('/api/public/system/status', { auth: false }),

    // PR 52 — public model-availability flags so the UI hides features
    // whose trained models haven't shipped yet. Never returns architecture names.
    modelsStatus: () =>
      request<{
        models: {
          earnings_scout: boolean
        }
        computed_at: string
      }>('/api/public/models/status', { auth: false }),

    // PR 66 — live index ticker. Backed by 30s CDN cache so a
    // dashboard-wide refresh storm is one upstream call.
    indices: () =>
      request<{
        indices: Array<{
          key: 'nifty' | 'banknifty' | 'sensex' | 'vix'
          label: string
          last: number | null
          change: number | null
          change_pct: number | null
        }>
        computed_at: string
      }>('/api/public/indices', { auth: false }),

    // PR 108 — landing-hero "today's best" card. Returns either an
    // active high-confidence signal from today, or the best closed
    // winner from the last 7 days, or a `none` sentinel when neither
    // exists. Three response shapes share `kind` as the discriminator.
    signalOfTheDay: () =>
      request<
        | {
            kind: 'active'
            symbol: string
            direction: 'LONG' | 'SHORT'
            segment: string
            confidence: number
            entry_price: number | null
            regime_at_signal: string | null
            generated_at: string | null
            computed_at: string
          }
        | {
            kind: 'closed_winner'
            symbol: string
            direction: 'LONG' | 'SHORT'
            segment: string
            return_pct: number
            closed_on: string
            computed_at: string
          }
        | { kind: 'none'; computed_at: string }
      >('/api/public/signal-of-the-day', { auth: false }),
  },

  // PR 17 — AI agent endpoints (Copilot / FinRobot / Debate)
  ai: {
    copilotChat: (body: {
      message: string
      route?: string
      history?: Array<{ role: string; content: string }>
      mentioned_symbols?: string[]
      // PR-BF.2 — Persist + resume conversations
      conversation_id?: string
      persist?: boolean
      // What the user actually typed, when `message` carries mode/guard
      // scaffolding — persisted instead of `message` so threads reopen clean.
      display_message?: string
    }) =>
      request<{
        reply: string
        refused: boolean
        intent?: string
        tools_used: string[]
        trace: Array<{ agent: string; duration_ms: number }>
        conversation_id?: string | null
      }>('/api/ai/copilot/chat', { method: 'POST', body }),

    // Cursor-style action proposals — maps an NL request + page context to
    // reviewable action cards. PROPOSES ONLY; the dock executes confirmed actions
    // against the existing gated endpoints (watchlist / screener / broker order).
    copilotActions: (body: { message: string; route?: string; symbol?: string }) =>
      request<{
        actions: Array<{
          id: string
          kind: 'watchlist_add' | 'watchlist_remove' | 'run_screen' | 'place_order' | 'create_strategy_draft'
          title: string
          summary: string
          args: Record<string, unknown>
          danger: boolean
        }>
      }>('/api/ai/copilot/actions', { method: 'POST', body }),

    // PR-V36 — token-streaming Copilot chat (Server-Sent Events). Reads the
    // SSE body with fetch + getReader (EventSource can't POST a JSON body or
    // attach a Bearer token). Invokes handlers as frames arrive. Resolves when
    // the stream ends; throws (incl. ApiError 402) if the request itself fails.
    copilotChatStream: async (
      body: {
        message: string
        route?: string
        history?: Array<{ role: string; content: string }>
        mentioned_symbols?: string[]
        conversation_id?: string
        persist?: boolean
        display_message?: string
      },
      handlers: {
        onMeta?: (meta: {
          tools_used: string[]
          artifacts: CopilotArtifact[]
          intent?: string
          progress?: CopilotStep[]
          references?: CopilotReference[]
        }) => void
        onToken?: (text: string) => void
        onDone?: (done: {
          reply: string
          intent?: string
          tools_used: string[]
          refused: boolean
          references?: CopilotReference[]
          followups?: string[]
        }) => void
        onSaved?: (conversationId: string | null) => void
        onError?: (message: string) => void
      },
      signal?: AbortSignal,
    ): Promise<void> => {
      const token = await getAuthToken()
      const res = await fetch(`${API_BASE}/api/ai/copilot/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal,
      })

      if (!res.ok) {
        // Mirror request()'s error shaping so a 402 cap surfaces structured.
        const text = await res.text().catch(() => '')
        let payload: ApiErrorShape = {}
        try {
          payload = text ? (JSON.parse(text) as ApiErrorShape) : {}
        } catch {
          /* non-JSON body */
        }
        const detailPayload =
          payload.detail && typeof payload.detail === 'object' ? (payload.detail as StructuredDetail)
          : typeof payload.detail === 'string' ? payload.detail
          : null
        throw new ApiError(extractErrorMessage(payload, res.status), res.status, detailPayload)
      }

      if (!res.body) {
        handlers.onError?.('No response stream')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        // SSE frames are separated by a blank line.
        let sep: number
        while ((sep = buf.indexOf('\n\n')) !== -1) {
          const frame = buf.slice(0, sep).trim()
          buf = buf.slice(sep + 2)
          if (!frame.startsWith('data:')) continue
          const jsonStr = frame.slice(5).trim()
          if (!jsonStr) continue
          let ev: any
          try {
            ev = JSON.parse(jsonStr)
          } catch {
            continue
          }
          switch (ev.type) {
            case 'meta':
              handlers.onMeta?.({
                tools_used: ev.tools_used || [],
                artifacts: ev.artifacts || [],
                intent: ev.intent,
                progress: ev.progress || [],
                references: ev.references || [],
              })
              break
            case 'token':
              handlers.onToken?.(ev.text || '')
              break
            case 'done':
              handlers.onDone?.({
                reply: ev.reply || '',
                intent: ev.intent,
                tools_used: ev.tools_used || [],
                refused: !!ev.refused,
                references: ev.references,
                followups: ev.followups,
              })
              break
            case 'saved':
              handlers.onSaved?.(ev.conversation_id ?? null)
              break
            case 'error':
              handlers.onError?.(ev.message || 'Copilot error')
              break
          }
        }
      }
    },

    // PR-BF.2 — Saved conversation CRUD
    copilotListConversations: () =>
      request<{
        conversations: Array<{
          id: string
          title: string | null
          created_at: string
          updated_at: string
        }>
        count: number
      }>('/api/ai/copilot/conversations'),

    copilotGetConversation: (id: string) =>
      request<{
        id: string
        title: string | null
        created_at: string
        updated_at: string
        messages: Array<{
          id: string
          role: 'user' | 'assistant'
          content: string
          tools_used: string[]
          trace: Array<{ agent: string; duration_ms: number }>
          intent: string | null
          refused: boolean
          created_at: string
        }>
      }>(`/api/ai/copilot/conversations/${id}`),

    copilotDeleteConversation: (id: string) =>
      request<{ ok: boolean }>(`/api/ai/copilot/conversations/${id}`, {
        method: 'DELETE',
      }),

    finrobotAnalyze: (body: {
      symbol: string
      fundamentals?: Record<string, any>
      concall_transcript?: string
      management_headlines?: string[]
      promoter_holding?: Record<string, any>
      peers?: Array<Record<string, any>>
    }) =>
      request<{
        symbol: string
        narrative: string
        action: 'add' | 'hold' | 'trim' | 'exit'
        composite_score: number
        agents: Record<string, any>
        trace: Array<{ agent: string; duration_ms: number }>
      }>('/api/ai/finrobot/analyze', { method: 'POST', body }),

    debate: (signalId: string, body: {
      fundamentals?: Record<string, any>
      stock_snapshot?: Record<string, any>
      news_headlines?: string[]
      regime?: Record<string, any>
      vix?: number
    }) =>
      request<{
        signal_id: string
        symbol: string
        decision: 'enter' | 'skip' | 'half_size' | 'wait'
        confidence: number
        summary: string
        transcript: Record<string, any>
        trace: Array<{ agent: string; duration_ms: number }>
      }>(`/api/ai/debate/signal/${signalId}`, { method: 'POST', body }),

    // PR 46 — Chart vision analysis (B2)
    visionAnalyze: (symbol: string, anywhere = false) =>
      request<{
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
      }>(anywhere
        ? `/api/ai/vision/analyze/any/${encodeURIComponent(symbol)}`
        : `/api/ai/vision/analyze/${encodeURIComponent(symbol)}`,
        { method: 'POST' },
      ),
  },

  // PR 28 — Auto-trader (F4 Elite) dashboard
  autoTrader: {
    status: () =>
      request<{
        enabled: boolean
        paused: boolean
        /** 'paper' = virtual money, 'live' = real broker account (pricing v2). */
        mode: 'paper' | 'live'
        last_run_at: string | null
        broker_connected: boolean
        broker_name: string | null
        open_positions: number
        today_trades: number
        today_pnl_pct: number
        regime: {
          name: 'bull' | 'sideways' | 'bear'
          prob_bull: number
          prob_sideways: number
          prob_bear: number
          as_of: string
        } | null
        vix_band: 'calm' | 'normal' | 'elevated' | 'high' | 'stressed' | 'panic' | null
        equity_scaler_pct: number
        config: {
          risk_profile: 'conservative' | 'moderate' | 'aggressive'
          max_position_pct: number
          daily_loss_limit_pct: number
          max_concurrent_positions: number
          allow_fno: boolean
        }
      }>('/api/auto-trader/status'),

    getConfig: () =>
      request<{
        risk_profile: 'conservative' | 'moderate' | 'aggressive'
        max_position_pct: number
        daily_loss_limit_pct: number
        max_concurrent_positions: number
        allow_fno: boolean
      }>('/api/auto-trader/config'),

    updateConfig: (patch: {
      risk_profile?: 'conservative' | 'moderate' | 'aggressive'
      max_position_pct?: number
      daily_loss_limit_pct?: number
      max_concurrent_positions?: number
      allow_fno?: boolean
    }) =>
      request<{
        risk_profile: 'conservative' | 'moderate' | 'aggressive'
        max_position_pct: number
        daily_loss_limit_pct: number
        max_concurrent_positions: number
        allow_fno: boolean
      }>('/api/auto-trader/config', { method: 'PATCH', body: patch }),

    // Pricing v2 — optional explicit mode switch ('live' clears a paper
    // opt-in; broker + suitability gates apply to live only).
    toggle: (enabled: boolean, mode?: 'paper' | 'live') =>
      request<{ enabled: boolean; ok: boolean }>('/api/auto-trader/toggle', {
        method: 'POST',
        body: mode ? { enabled, mode } : { enabled },
      }),

    trades: (days = 7) =>
      request<
        Array<{
          id: string
          symbol: string
          direction: 'LONG' | 'SHORT'
          quantity: number
          entry_price: number | null
          exit_price: number | null
          status: string
          net_pnl: number | null
          pnl_percent: number | null
          created_at: string | null
          closed_at: string | null
          signal_id: string | null
        }>
      >('/api/auto-trader/trades', { query: { days } }),

    weekly: () =>
      request<{
        days: number
        trades_executed: number
        trades_closed: number
        wins: number
        losses: number
        win_rate: number
        total_pnl_pct: number
        net_pnl: number
        symbols: string[]
      }>('/api/auto-trader/weekly'),

    // HIGH #6 — SEBI compliance metadata (footer disclaimer + reg number).
    compliance: () =>
      request<{
        sebi_ra_reg_number: string
        sebi_ra_valid_until: string | null
        requires_suitability_quiz_for_live: boolean
        disclaimer_short: string
        disclaimer_long: string
      }>('/api/auto-trader/compliance', { auth: false }),

    // CRITICAL #2 — realised P&L track record over 30/60/90 day window.
    // Reads the daily snapshot table for fast response; falls back to
    // live aggregation when no snapshot exists yet.
    trackRecord: (windowDays: 30 | 60 | 90 = 30, source: 'paper' | 'live' = 'paper') =>
      request<{
        snapshot_date?: string
        window_days: number
        source: 'paper' | 'live'
        trades_count: number
        winning_trades: number
        losing_trades: number
        win_rate: number
        avg_return_pct: number
        median_return_pct: number
        total_pnl_inr: number
        realised_sharpe: number | null
        max_drawdown_pct: number | null
        best_trade_pct: number | null
        worst_trade_pct: number | null
        avg_holding_days: number | null
        profit_factor: number | null
        last_trade_at: string | null
        first_trade_at: string | null
        notes: string[]
        surface: 'snapshot' | 'live_aggregate'
      }>('/api/auto-trader/track-record', {
        query: { window_days: windowDays, source },
      }),

    // PR 69 — recent rebalance ticks for the dashboard log.
    runs: (limit = 10) =>
      request<
        Array<{
          id: string
          ran_at: string
          regime: 'bull' | 'sideways' | 'bear' | null
          vix: number | null
          vix_band: string | null
          equity_scaler_pct: number | null
          actions_count: number
          trades_executed: number
          summary: string | null
        }>
      >('/api/auto-trader/runs', { query: { limit } }),

    // PR 133 — today's planned weights + VIX/Kelly/VaR overlay diagnostics.
    todayPlan: () =>
      request<{
        ran_at: string | null
        regime: 'bull' | 'sideways' | 'bear' | null
        target_weights: Record<string, number>
        diagnostics: {
          vix_level?: number
          vix_exposure_cap?: number
          bear_scale?: number
          applied_scale?: number
          var_95_inr?: number
          var_capped?: boolean
        }
        status: string | null
      }>('/api/auto-trader/plan/today'),

    killSwitch: () =>
      request<{ success: boolean; message: string }>('/api/trades/kill-switch', {
        method: 'POST',
      }),
  },


  // PR 30 — F&O strategies (F6 Elite)
  // 2026-05-17 — vix_tft dropped; VIX direction now comes from a
  // rule-based 5-day slope (regime_history.vix). Payload swaps
  // forecast_p50_5d / p10 / p90 / forecast_date → mean_5d / method.
  foStrategies: {
    overview: () =>
      request<{
        as_of: string
        regime: {
          name: 'bull' | 'sideways' | 'bear'
          prob_bull: number | null
          prob_sideways: number | null
          prob_bear: number | null
        } | null
        vix: {
          current: number | null
          direction: 'rising' | 'falling' | 'stable'
          mean_5d: number | null
          n_history_days: number
          method: '5d_slope_rule'
        }
        symbols: string[]
        recommendations: Record<string, Array<FoStrategyProposal>>
      }>('/api/fo-strategies/overview'),

    recommend: (symbol: string) =>
      request<{
        symbol: string
        spot: number
        regime: string
        vix_direction: string
        vix_level: number | null
        vix_5d_mean: number | null
        recommendations: FoStrategyProposal[]
      }>(`/api/fo-strategies/recommend/${symbol}`),

    price: (body: { strategy: string; symbol: string; expiry?: string }) =>
      request<FoStrategyProposal>('/api/fo-strategies/price', {
        method: 'POST',
        body,
      }),

    // PR-AT — Paper multi-leg options trading
    paperOpen: (body: {
      template?: string
      symbol: string
      lots: number
      legs?: Array<Record<string, any>>
    }) =>
      request<{
        success: boolean
        position_id: string
        trade_id: string
        net_premium: number
        max_profit: number | null
        max_loss: number | null
        legs: Array<Record<string, any>>
      }>('/api/fo-strategies/paper/open', { method: 'POST', body }),

    paperPositions: () =>
      request<{
        positions: Array<{
          id: string
          user_id: string
          strategy_id: string | null
          template_slug: string | null
          underlying: string
          expiry_date: string
          net_premium: number
          max_profit: number | null
          max_loss: number | null
          current_value: number | null
          unrealized_pnl: number | null
          realized_pnl: number | null
          status: 'open' | 'closed' | 'expired'
          exit_reason: string | null
          entry_at: string
          last_marked_at: string | null
          closed_at: string | null
          metadata: Record<string, any>
          legs: Array<{
            id: string
            side: 'BUY' | 'SELL'
            option_type: 'CE' | 'PE'
            strike: number
            expiry_date: string
            lots: number
            lot_size: number
            entry_price: number
            current_price: number | null
            exit_price: number | null
          }>
        }>
        count: number
      }>('/api/fo-strategies/paper/positions'),

    paperClose: (positionId: string) =>
      request<{
        success: boolean
        position_id: string
        realized_pnl: number | null
        realized_pnl_pct: number | null
      }>(`/api/fo-strategies/paper/${positionId}/close`, { method: 'POST' }),

    // PR-AW.2 — Backtest a template without saving a strategy first
    backtestTemplate: (body: {
      template: string
      symbol: string
      lookback_days?: number
      initial_capital?: number
    }) =>
      request<Record<string, any>>('/api/fo-strategies/backtest', {
        method: 'POST',
        body,
      }),

    // PR-BD — AI strategy advisor (advisory only; never auto-deploys).
    // PR-BE — Optional portfolio-aware hedge sizing.
    // PR-BF.1 — focus_symbol narrows hedge to one underlying.
    aiSuggest: (body: {
      prompt: string
      symbol: string
      capital_inr?: number
      include_portfolio?: boolean
      focus_symbol?: string
    }) =>
      request<{
        template: string
        symbol: string
        spot: number
        lots_suggestion: number
        reasoning: string
        expected_outcome: string
        risk_summary: string
        confidence: number
        context: {
          regime: string
          vix: number
          vix_direction: string
        }
        portfolio_context: {
          has_positions: boolean
          equity_delta_inr: number
          option_delta_inr: number
          net_delta_inr: number
          equity_count: number
          options_count: number
          by_symbol: Record<string, {
            equity_delta_inr: number
            option_delta_inr: number
            total_delta_inr: number
            equity_qty: number
            options_count: number
            bias: 'LONG' | 'SHORT' | 'FLAT'
          }>
        } | null
        proposal: FoStrategyProposal | null
      }>('/api/fo-strategies/ai-suggest', { method: 'POST', body }),

    // PR-BB — Vol cone: realised vol percentiles across windows, with
    // current ATM IV per expiry overlaid for richness-vs-history check.
    volCone: (symbol: string) =>
      request<{
        symbol: string
        spot: number
        source: 'broker' | 'rv_only'
        windows: Array<{
          window_days: number
          p10: number
          p25: number
          p50: number
          p75: number
          p90: number
          current_rv: number
          samples: number
        }>
        current_ivs: Array<{
          expiry: string
          days: number
          window_days?: number
          iv: number
        }>
      }>(`/api/fo-strategies/vol-cone/${encodeURIComponent(symbol)}`),

    // PR-BA — Term structure: ATM IV across current week / next week /
    // current month / next month for the symbol's option chains.
    termStructure: (symbol: string) =>
      request<{
        symbol: string
        spot: number
        source: 'broker' | 'unavailable'
        shape: 'flat' | 'contango' | 'backwardation'
        expiries: Array<{
          anchor: string
          expiry: string
          days_to_expiry: number
          atm_strike: number
          atm_iv: number
          ce_iv: number | null
          pe_iv: number | null
        }>
      }>(`/api/fo-strategies/term-structure/${encodeURIComponent(symbol)}`),

    // PR-AX — Live option chain via user's connected broker
    // PR-AY — augmented with computed IV + Greeks per row
    chain: (symbol: string, expiry?: string) =>
      request<{
        symbol: string
        expiry: string | null
        spot?: number
        source: 'broker' | 'unavailable'
        rows: Array<{
          strike: number
          option_type: 'CE' | 'PE'
          expiry: string
          ltp: number
          bid: number
          ask: number
          oi: number
          volume: number
          iv: number | null
          delta: number | null
          gamma: number | null
          theta: number | null
          vega: number | null
          tradingsymbol: string
        }>
      }>(
        `/api/fo-strategies/chain/${encodeURIComponent(symbol)}${expiry ? `?expiry=${expiry}` : ''}`,
      ),
  },

  // PR 31 — Earnings predictor (F9)
  earnings: {
    upcoming: (days = 14) =>
      request<
        Array<{
          symbol: string
          announce_date: string
          beat_prob: number | null
          confidence: 'low' | 'medium' | 'high' | null
          direction: 'bullish' | 'bearish' | 'non_directional' | null
          thesis: string | null
          evidence: Record<string, any>
        }>
      >('/api/earnings/upcoming', { query: { days } }),

    symbol: (symbol: string) =>
      request<{
        symbol: string
        announce_date: string
        beat_prob: number | null
        confidence: 'low' | 'medium' | 'high' | null
        direction: 'bullish' | 'bearish' | 'non_directional' | null
        thesis: string | null
        evidence: Record<string, any>
        computed_at?: string
      }>(`/api/earnings/symbol/${symbol}`),
  },

  // PR 33 — AI Dossier (per-stock consolidated engine output)
  dossier: {
    get: (symbol: string) =>
      request<{
        symbol: string
        as_of: string
        spot: number | null
        tier: 'free' | 'pro' | 'elite'
        consensus: 'bullish' | 'bearish' | 'mixed' | 'neutral'
        engines: Array<DossierEngineBlock>
        debate_available: boolean
        scores: {
          symbol: string
          scores: Array<{
            key: string
            label: string
            value: number | null
            pct: number | null
            note: string | null
          }>
          composite: number | null
        } | null
        latest_signal: {
          id: string | null
          direction: string | null
          entry_price: number | null
          stop_loss: number | null
          target: number | null
          created_at: string | null
          explanation_text: string | null
        } | null
      }>(`/api/dossier/${symbol}`),
  },

  // PR 34 — Portfolio Doctor (F7, Pro+)
  portfolioDoctor: {
    analyze: (body: {
      source?: 'manual' | 'broker' | 'csv'
      capital?: number
      positions: Array<{
        symbol: string
        weight: number
        qty?: number
        entry_price?: number
        current_price?: number
      }>
    }) =>
      request<DoctorReport>('/api/portfolio/doctor/analyze', {
        method: 'POST',
        body,
      }),

    rebalance: (positions: Array<{ symbol: string; weight: number }>, useLlm = true) =>
      request<{
        success: boolean
        correlation: { avg_corr: number | null; pairs: Array<{ a: string; b: string; corr: number }>; symbols: string[] }
        suggestions: Array<{ action: string; symbol: string | null; sector?: string; pair?: string[]; from_pct?: number; to_pct?: number | null; reason: string }>
        narrative: string | null
      }>('/api/portfolio/doctor/rebalance', { method: 'POST', body: { positions }, query: { use_llm: useLlm } }),

    quota: () =>
      request<{
        tier: 'free' | 'pro' | 'elite'
        runs_this_month: number
        quota: number | null
        remaining: number | null
        engine: string
      }>('/api/portfolio/doctor/quota'),

    reports: (limit = 20) =>
      request<
        Array<{
          id: string
          created_at: string
          source: 'manual' | 'broker' | 'csv'
          position_count: number
          composite_score: number
          action: string
        }>
      >('/api/portfolio/doctor/reports', { query: { limit } }),

    report: (id: string) =>
      request<DoctorReport>(`/api/portfolio/doctor/reports/${id}`),
  },

  // PR 37 — Onboarding risk-profile quiz (N5)
  onboarding: {
    quiz: () =>
      request<{
        quiz: Array<{
          key: string
          question: string
          options: Array<{ value: string; label: string; score: number }>
        }>
      }>('/api/onboarding/quiz', { auth: false }),

    status: () =>
      request<{
        completed: boolean
        completed_at: string | null
        current_tier: 'free' | 'pro' | 'elite'
        current_risk_profile: 'conservative' | 'moderate' | 'aggressive' | null
        recommended_tier: 'free' | 'pro' | 'elite' | null
      }>('/api/onboarding/status'),

    submit: (answers: Record<string, string>) =>
      request<{
        risk_profile: 'conservative' | 'moderate' | 'aggressive'
        recommended_tier: 'free' | 'pro' | 'elite'
        score: number
        rationale: string
        suggested_filters: Record<string, any>
        auto_trader_defaults: Record<string, any>
      }>('/api/onboarding/quiz', { method: 'POST', body: { answers } }),

    skip: () =>
      request<{ completed: boolean; skipped: boolean }>('/api/onboarding/skip', {
        method: 'POST',
      }),
  },

  // PR 55 — Telegram connect flow (onboarding activation funnel)
  telegram: {
    linkStart: () =>
      request<{
        token: string
        bot_username: string | null
        deep_link: string | null
        expires_at: string
      }>('/api/telegram/link/start', { method: 'POST' }),

    linkStatus: () =>
      request<{
        connected: boolean
        chat_id: string | null
        linked_at: string | null
      }>('/api/telegram/link/status'),

    disconnect: () =>
      request<{ connected: boolean }>('/api/telegram/link/disconnect', {
        method: 'POST',
      }),
  },

  // PR 60 — F12 WhatsApp digest (Pro tier)
  whatsapp: {
    status: () =>
      request<{
        phone: string | null
        verified: boolean
        digest_enabled: boolean
        provider_configured: boolean
      }>('/api/whatsapp/link/status'),

    linkStart: (phone: string) =>
      request<{
        phone: string
        expires_at: string
        provider_configured: boolean
        delivered: boolean
      }>('/api/whatsapp/link/start', { method: 'POST', body: { phone } }),

    linkVerify: (code: string) =>
      request<{ verified: boolean }>('/api/whatsapp/link/verify', {
        method: 'POST',
        body: { code },
      }),

    disconnect: () =>
      request<{
        phone: string | null
        verified: boolean
        digest_enabled: boolean
        provider_configured: boolean
      }>('/api/whatsapp/link/disconnect', { method: 'POST' }),

    toggleDigest: (enabled: boolean) =>
      request<{
        phone: string | null
        verified: boolean
        digest_enabled: boolean
        provider_configured: boolean
      }>('/api/whatsapp/digest/toggle', { method: 'POST', body: { enabled } }),
  },

  // PR 38 — Weekly portfolio review (N10 Pro+)
  weeklyReview: {
    latest: () =>
      request<{
        week_of: string
        content_markdown: string
        week_return_pct: number | null
        nifty_return_pct: number | null
        generated_at: string
      }>('/api/weekly-review/latest'),

    history: (limit = 8) =>
      request<
        Array<{
          week_of: string
          content_markdown: string
          week_return_pct: number | null
          nifty_return_pct: number | null
          generated_at: string
        }>
      >('/api/weekly-review/history', { query: { limit } }),

    generate: () =>
      request<{
        week_of: string
        content_markdown: string
        week_return_pct: number | null
        nifty_return_pct: number | null
        generated_at: string
      }>('/api/weekly-review/generate', { method: 'POST' }),
  },

  // PR 40 — Alerts Studio (N11 Pro)
  alerts: {
    preferences: () =>
      request<{
        preferences: Record<string, Record<string, boolean>>
        events: Array<{ key: string; label: string; description: string }>
        channels: Array<{
          channel: 'push' | 'telegram' | 'whatsapp' | 'email'
          connected: boolean
          detail?: string | null
        }>
      }>('/api/alerts/preferences'),

    toggle: (event: string, channel: 'push' | 'telegram' | 'whatsapp' | 'email', enabled: boolean) =>
      request<{
        preferences: Record<string, Record<string, boolean>>
        events: Array<{ key: string; label: string; description: string }>
        channels: Array<{
          channel: 'push' | 'telegram' | 'whatsapp' | 'email'
          connected: boolean
          detail?: string | null
        }>
      }>('/api/alerts/preferences', {
        method: 'PATCH',
        body: { toggle: { event, channel, enabled } },
      }),

    bulkUpdate: (preferences: Record<string, Record<string, boolean>>) =>
      request<{
        preferences: Record<string, Record<string, boolean>>
        events: Array<{ key: string; label: string; description: string }>
        channels: Array<{
          channel: 'push' | 'telegram' | 'whatsapp' | 'email'
          connected: boolean
          detail?: string | null
        }>
      }>('/api/alerts/preferences', {
        method: 'PATCH',
        body: { bulk: { preferences } },
      }),

    test: (channel: 'push' | 'telegram' | 'whatsapp' | 'email') =>
      request<{ delivered: boolean; channel: string; detail: string }>(
        '/api/alerts/test',
        { method: 'POST', body: { channel } },
      ),
  },

  // PR 42 — Referral loop (N12)
  referrals: {
    status: () =>
      request<{
        code: string
        share_url: string
        stats: {
          invited: number
          signed_up: number
          rewarded: number
          pending: number
          credit_months: number
        }
        recent: Array<{
          id: string
          referred_email: string | null
          referred_user_id: string | null
          status: 'pending' | 'signed_up' | 'rewarded' | 'expired'
          created_at: string
          signed_up_at: string | null
          rewarded_at: string | null
        }>
      }>('/api/referrals/status'),

    rotateCode: () =>
      request<{
        code: string
        share_url: string
        stats: {
          invited: number
          signed_up: number
          rewarded: number
          pending: number
          credit_months: number
        }
        recent: Array<any>
      }>('/api/referrals/rotate-code', { method: 'POST' }),

    resolve: (code: string) =>
      request<{ valid: boolean; referrer_id?: string }>(
        `/api/referrals/resolve/${encodeURIComponent(code)}`,
        { auth: false },
      ),

    attribute: (body: { referred_user_id: string; code: string; referred_email?: string }) =>
      request<{ attributed: boolean; reason?: string; referrer_id?: string }>(
        '/api/referrals/attribute',
        { method: 'POST', auth: false, body },
      ),
  },

  payments: {
    getPlans: () => request<{ plans: Array<Record<string, any>> }>('/api/plans', { auth: false }),
    createOrder: (planId: string, billingPeriod: string) =>
      request<{ order_id: string; amount: number; currency: string; key_id: string }>('/api/payments/create-order', {
        method: 'POST',
        body: { plan_id: planId, billing_period: billingPeriod },
      }),
    verify: (data: { order_id: string; payment_id: string; signature: string }) =>
      request<{ success: boolean; subscription_status: string }>('/api/payments/verify', {
        method: 'POST',
        body: data,
      }),
  },

  marketplace: {
    getStrategies: (filters?: {
      category?: string
      segment?: string
      risk_level?: string
      tier?: string
      search?: string
      sort_by?: string
    }) =>
      request<{
        success: boolean
        strategies: StrategyCatalog[]
        total: number
        category_counts: Record<string, number>
      }>('/api/marketplace/strategies', { query: filters as Record<string, string>, auth: false }),

    getStrategy: (slug: string) =>
      request<{ success: boolean; strategy: StrategyCatalog }>(
        `/api/marketplace/strategies/${slug}`,
        { auth: false },
      ),

    getBacktest: (slug: string) =>
      request<{ success: boolean; backtest: StrategyBacktest | null; summary?: Record<string, unknown> }>(
        `/api/marketplace/strategies/${slug}/backtest`,
        { auth: false },
      ),

    deploy: (data: {
      strategy_slug: string
      allocated_capital: number
      max_positions: number
      trade_mode: string
      custom_params: Record<string, unknown>
    }) =>
      request<{ success: boolean; deployment: StrategyDeployment; message: string }>(
        '/api/marketplace/deploy',
        { method: 'POST', body: data },
      ),

    getMyStrategies: () =>
      request<{ success: boolean; deployments: StrategyDeployment[]; total: number }>(
        '/api/marketplace/my-strategies',
      ),

    updateDeployment: (deploymentId: string, data: Record<string, unknown>) =>
      request<{ success: boolean; deployment: StrategyDeployment }>(
        `/api/marketplace/deployments/${deploymentId}`,
        { method: 'PUT', body: data },
      ),

    deactivateDeployment: (deploymentId: string) =>
      request<{ success: boolean; message: string }>(
        `/api/marketplace/deployments/${deploymentId}`,
        { method: 'DELETE' },
      ),
  },

  // PR-S — DSL strategy studio (Builder + backtest + my-strategies).
  // Backend: backend/api/strategies_routes.py, prefix /api/strategies.
  // Pulse/Vision/Verdict/Horizon engines were removed; only Alpha/Mood/Regime
  // are valid in engine_signal conditions.
  strategies: {
    // ── Schema introspection ─────────────────────────────────────────
    getEnums: () =>
      request<{ enums: import('@/types/strategies').SchemaEnums }>(
        '/api/strategies/enums',
        { auth: false },
      ),
    getIndicators: () =>
      request<{
        indicators: import('@/types/strategies').IndicatorSpec[]
        groups: string[]
        count: number
      }>('/api/strategies/indicators', { auth: false }),
    getEngines: () =>
      request<{
        engines: import('@/types/strategies').EngineName[]
        values_by_engine: Record<string, string[]>
      }>('/api/strategies/engines', { auth: false }),

    // ── Validation ───────────────────────────────────────────────────
    validate: (dsl: Record<string, unknown>) =>
      request<{
        valid: boolean
        strategy?: import('@/types/strategies').DSLStrategy
        errors?: import('@/types/strategies').ValidationError[]
      }>('/api/strategies/validate', {
        method: 'POST',
        body: dsl,
        auth: false,
      }),

    // ── Catalog (public) ─────────────────────────────────────────────
    getCatalog: (filters?: {
      segment?: import('@/types/strategies').InstrumentSegment
      category?: string
      tier?: string
      featured_only?: boolean
      engine_only?: boolean
      exclusive_only?: boolean
      max_min_capital?: number
      limit?: number
    }) =>
      request<{
        templates: import('@/types/strategies').CatalogTemplate[]
        count: number
      }>('/api/strategies/catalog', {
        query: filters as Record<string, string>,
        auth: false,
      }),
    getCatalogSections: () =>
      request<{ sections: import('@/types/strategies').CatalogSections }>(
        '/api/strategies/catalog/sections',
        { auth: false },
      ),
    getCatalogTemplate: (slug: string) =>
      request<{ template: import('@/types/strategies').CatalogTemplate }>(
        `/api/strategies/catalog/${slug}`,
        { auth: false },
      ),
    cloneFromTemplate: (slug: string) =>
      request<{ strategy: import('@/types/strategies').UserStrategy }>(
        `/api/strategies/from-template/${slug}`,
        { method: 'POST' },
      ),

    // ── User strategies (CRUD) ───────────────────────────────────────
    list: (filters?: {
      status?: import('@/types/strategies').StrategyStatus
      limit?: number
    }) =>
      request<{
        strategies: import('@/types/strategies').UserStrategy[]
        count: number
      }>('/api/strategies', {
        query: filters as Record<string, string>,
      }),
    /** Head-to-head compare of 2–6 of the caller's strategies (OOS metrics + gate). */
    compare: (strategyIds: string[]) =>
      request<{
        strategies: Array<{
          id: string; name: string; status: string | null; has_backtest: boolean
          metrics: {
            oos_sharpe: number | null; oos_consistency: number | null
            holdout_return_pct: number | null; oos_worst_drawdown_pct: number | null
            oos_trades: number | null
          }
          gate_pass: boolean; gate_failures: string[]
        }>
        winners: Record<string, string | null>
        best_overall: string | null
      }>('/api/strategies/compare', { method: 'POST', body: { strategy_ids: strategyIds } }),
    /** PR-AP — one round-trip aggregate for the deployed-strategies dashboard. */
    deployed: () =>
      request<{
        deployed: Array<{
          id: string
          name: string
          status: 'paper' | 'live'
          deployed_at: string | null
          template_slug: string | null
          universe: string
          symbol: string | null
          stop_loss_pct: number | null
          take_profit_pct: number | null
          backtest_win_rate_pct: number | null
          backtest_total_return_pct: number | null
          backtest_sharpe: number | null
          open_positions: Array<{
            id: string
            symbol: string
            quantity: number
            entry_price: number
            current_price: number | null
            stop_loss: number | null
            target_1: number | null
            unrealized_pnl: number
            unrealized_pnl_pct: number
          }>
          stats: {
            open_count: number
            total_signals: number
            entries_emitted: number
            exits_emitted: number
            winning_exits: number
            losing_exits: number
            realized_pnl: number
            unrealized_pnl: number
            total_pnl: number
            win_rate_pct: number | null
          }
          recent_events: Array<{
            kind: 'entry' | 'exit'
            symbol: string | null
            price: number
            at: string | null
            reason: string | null
          }>
        }>
        count: number
      }>('/api/strategies/deployed'),
    get: (strategyId: string) =>
      request<{ strategy: import('@/types/strategies').UserStrategy }>(
        `/api/strategies/${strategyId}`,
      ),
    create: (body: {
      dsl: Record<string, unknown>
      name?: string
      description?: string
      template_slug?: string
      source: 'user' | 'studio' | 'template'
    }) =>
      request<{ strategy: import('@/types/strategies').UserStrategy }>(
        '/api/strategies',
        { method: 'POST', body },
      ),
    updateDsl: (strategyId: string, dsl: Record<string, unknown>) =>
      request<{ strategy: import('@/types/strategies').UserStrategy }>(
        `/api/strategies/${strategyId}/dsl`,
        { method: 'PATCH', body: { dsl } },
      ),
    transition: (
      strategyId: string,
      to: import('@/types/strategies').StrategyStatus,
      capitalAllocated?: number,
    ) =>
      request<{ strategy: import('@/types/strategies').UserStrategy }>(
        `/api/strategies/${strategyId}/transition`,
        {
          method: 'POST',
          body: { to, capital_allocated: capitalAllocated },
        },
      ),
    archive: (strategyId: string) =>
      request<{ strategy: import('@/types/strategies').UserStrategy }>(
        `/api/strategies/${strategyId}`,
        { method: 'DELETE' },
      ),
    /** Read the promotion-gate verdict without attempting a transition —
     *  powers the Builder's GATE PASS / NEEDS WORK badge. */
    gate: (strategyId: string) =>
      request<{
        has_backtest: boolean
        passed: boolean
        failures: string[]
        metrics: Record<string, unknown>
      }>(`/api/strategies/${strategyId}/gate`),
    getExecutions: (strategyId: string, limit = 50) =>
      request<{
        executions: Array<Record<string, unknown>>
        count: number
      }>(`/api/strategies/${strategyId}/executions`, {
        query: { limit },
      }),

    // ── Studio (NL → DSL) ────────────────────────────────────────────
    studioCompile: (prompt: string, saveAsDraft = true) =>
      request<import('@/types/strategies').StudioCompileResult>(
        '/api/strategies/studio/compile',
        {
          method: 'POST',
          body: { prompt, save_as_draft: saveAsDraft },
        },
      ),

    // ── Vision-to-Strategy draft (chart image → synthesized prompt) ──
    studioVisionDraft: (
      imageB64: string,
      opts: { mime: string; symbol?: string; timeframe: string; compile?: boolean; saveAsDraft?: boolean },
    ) =>
      request<import('@/types/strategies').VisionStrategyDraftResult>(
        '/api/strategies/studio/vision-draft',
        {
          method: 'POST',
          body: {
            image_b64: imageB64,
            mime: opts.mime,
            symbol: opts.symbol,
            timeframe: opts.timeframe,
            compile: opts.compile ?? false,
            save_as_draft: opts.saveAsDraft ?? false,
          },
        },
      ),

    // ── Backtest (single symbol) ─────────────────────────────────────
    backtest: (
      strategyId: string,
      body: {
        symbol: string
        lookback_days?: number
        initial_capital?: number
      },
    ) =>
      request<import('@/types/strategies').DSLBacktestResult>(
        `/api/strategies/${strategyId}/backtest`,
        { method: 'POST', body },
      ),
    // ── AI read of the stored backtest (drivers always; LLM on demand) ─
    explainBacktest: (strategyId: string, useLlm = false) =>
      request<{
        drivers: string[]
        suggestions: string[]
        narrative: string | null
      }>(`/api/strategies/${strategyId}/explain-backtest`, {
        method: 'POST',
        query: { use_llm: useLlm },
      }),
    // ── Backtest across a universe — PR-AB ───────────────────────────
    backtestUniverse: (
      strategyId: string,
      body: {
        universe?:
          | 'nifty50' | 'nifty100' | 'nifty500'
          | 'sector:IT' | 'sector:BANK' | 'sector:AUTO' | 'sector:PHARMA'
          | 'sector:FMCG' | 'sector:METAL' | 'sector:ENERGY' | 'sector:INFRA'
          | 'single'
        lookback_days?: number
        initial_capital_per_symbol?: number
        max_symbols?: number
      },
    ) =>
      request<{
        universe: string
        lookback_days: number
        initial_capital_per_symbol: number
        symbols_attempted: number
        aggregate: {
          symbols_run: number
          winners: number
          losers: number
          win_pct: number
          total_capital_deployed: number
          total_pnl_inr: number
          total_return_pct: number
          avg_return_pct_per_symbol: number
          avg_sharpe: number
          avg_win_rate: number
          avg_max_drawdown_pct: number
          sum_trades: number
        } | null
        results: Array<{
          symbol: string
          status: 'ok'
          total_return_pct: number | null
          sharpe_ratio: number | null
          win_rate: number | null
          max_drawdown_pct: number | null
          total_trades: number | null
          final_capital: number
          pnl_inr: number
        }>
        skipped: Array<{ symbol: string; status: 'skipped'; reason: string }>
        failed: Array<{ symbol: string; status: 'failed'; reason: string }>
      }>(`/api/strategies/${strategyId}/backtest/universe`, {
        method: 'POST',
        body,
      }),
  },

  screener: {
    getCategories: () =>
      request<{ success: boolean; categories: Record<string, any>; total_scanners: number }>('/api/screener/pk/categories', { auth: false }),
    runScan: (scannerId: number, universe = 'nifty500', limit = 50) =>
      request<{ success: boolean; results: Array<Record<string, any>> }>('/api/screener/pk/scan/batch', {
        method: 'POST',
        query: { scanner_id: scannerId, universe, limit },
        auth: false,
      }),
    getSwingCandidates: (limit = 30) =>
      request<{ success: boolean; source?: string; stale?: boolean; as_of?: string; count?: number; results: Array<Record<string, any>> }>('/api/screener/swing-candidates', {
        query: { limit },
        auth: false,
      }),

    // PR-S5 — chart-pattern v2 scanner (rule engine + ML + regime + volume gates)
    patternsV2Types: () =>
      request<{ types: Array<{ pattern: string; direction: 'bullish' | 'bearish' }>; count: number }>(
        '/api/screener/patterns/v2/types',
        { auth: false },
      ),
    patternsV2Scan: (opts?: {
      universe?: 'nifty50' | 'nifty100' | 'nifty500'
      timeframe?: '1d' | '1h' | '15m'
      limit?: number
      direction?: 'bullish' | 'bearish'
      min_quality?: number
      min_ml?: number
    }) =>
      request<{
        success: boolean
        feature: string
        regime: string | null
        universe: string
        symbols_scanned: number
        timestamp: string
        matches: Array<{
          symbol: string
          pattern_type: string
          direction: 'bullish' | 'bearish' | 'neutral'
          quality_score: number
          ml_score: number
          composite_score: number
          entry_price: number
          stop_loss: number
          take_profit: number
          risk_reward: number
          detected_at: string
          last_price: number
          volume_ratio: number
          regime_at_detection: string | null
          pattern_height_pct: number
          duration_bars: number
          candle_confirmed_touches: number
        }>
        count: number
      }>('/api/screener/patterns/v2/scan', {
        query: opts as Record<string, string | number | undefined>,
        auth: false,
      }),

    // PR-S3 — deep AI explain for one symbol's pattern
    patternsV2Explain: (symbol: string, useLlm: boolean = true) =>
      request<{
        symbol: string
        pattern_type: string
        last_price: number
        detected_at: string
        quality_score: number
        pattern_height_pct: number
        duration_bars: number
        candle_confirmed_touches: number
        ml_score: number
        composite_score: number
        regime: string | null
        why_matched: Array<{
          name: string
          value: number
          threshold: number | null
          operator: string | null
          fired: boolean
          note: string | null
        }>
        suggested: {
          entry: number
          stop: number
          stop_basis: string
          target1: number
          target1_basis: string
          target2: number | null
          risk_reward: number
        }
        ai_thesis: string | null
        similar_setups: Array<Record<string, unknown>>
        historical_winrate_pct: number | null
      }>(
        `/api/screener/patterns/v2/explain/${encodeURIComponent(symbol)}`,
        { query: { use_llm: useLlm }, auth: false },
      ),

    // PR-S7 — Power Screeners v2: confluence scoring
    // Natural-language screener — maps free text -> scanner IDs (rule fast-path
    // + LLM agent, cached) -> confluence scan.
    /** Compile-only NL screener — free text → editable scanner blocks (no scan run). */
    nlCompile: (q: string) =>
      request<{
        success: boolean; query: string; recognized: boolean; source: string
        blocks: Array<{ id: number; name: string }>
      }>('/api/screener/v2/nl-compile', { query: { q }, auth: false }),
    nlScan: (q: string, opts?: { min_hits?: number; limit?: number }) =>
      request<{
        success: boolean; query: string; recognized: boolean; source: string
        scanners_used: Array<{ id: number; name: string }>
        count: number
        results: Array<Record<string, any>>
      }>('/api/screener/v2/nl-scan', { query: { q, ...opts }, auth: false }),
    // Phase 3 — fundamental screener (screens fundamentals_history, not the
    // technical confluence engine). Presets + a 0-5 Quality Score.
    fundamentalPresets: () =>
      request<{ success: boolean; presets: Array<{ key: string; name: string; blurb: string }> }>(
        '/api/screener/fundamental/presets', { auth: false },
      ),
    fundamentalScreen: (preset: string, limit = 30) =>
      request<{
        success: boolean; preset: string; name: string; count: number; note?: string | null
        results: Array<{
          symbol: string; pe: number | null; roe: number | null; roce: number | null
          dividend_yield: number | null; sales_growth: number | null; profit_growth: number | null
          promoter_pct: number | null; market_cap_cr: number | null; debt_to_equity: number | null
          quality_score: number
        }>
      }>('/api/screener/fundamental', { query: { preset, limit }, auth: false }),
    powerConfluence: (opts?: {
      scanners?: number[]
      min_hits?: number
      limit?: number
      sectors?: string[]
    }) =>
      request<{
        success: boolean
        scanners_used: number[]
        symbols_evaluated: number
        timestamp: string
        matches: Array<{
          symbol: string
          name: string
          sector: string | null
          last_price: number
          change_pct: number
          volume: number
          rsi: number
          hit_count: number
          bull_count: number
          bear_count: number
          category_diversity: number
          composite_score: number
          hits: Array<{
            scanner_id: number
            scanner_name: string
            category: string
            weight: number
            bullish: boolean
          }>
        }>
        count: number
      }>('/api/screener/v2/confluence', {
        query: {
          scanners: opts?.scanners?.join(','),
          min_hits: opts?.min_hits,
          limit: opts?.limit,
          sectors: opts?.sectors?.length ? opts.sectors.join(',') : undefined,
        } as Record<string, string | number | undefined>,
        auth: false,
      }),

    // PR-S7 — Deep-dive enrichment for one symbol
    powerExplain: (symbol: string, opts?: { use_llm?: boolean; use_news?: boolean; use_earnings?: boolean }) =>
      request<{
        symbol: string
        name: string
        sector: string | null
        last_price: number
        change_pct: number
        indicators_firing: Array<{
          name: string
          value: number | null
          threshold: number | null
          status: 'bullish' | 'bearish' | 'neutral'
          note: string | null
        }>
        suggested_levels: {
          entry: number
          stop: number
          target1: number
          target2: number | null
          stop_basis: string
          target_basis: string
          risk_reward: number
        } | null
        regime: string | null
        sector_breadth: {
          sector: string
          peer_count: number
          up_today: number
          breadth_pct: number
        } | null
        news_sentiment: number | null
        top_headlines: Array<{ title: string; source: string; link: string; published: string | null }>
        earnings_in_days: number | null
        earnings_note: string | null
        ai_thesis: string | null
      }>(`/api/screener/v2/explain/${encodeURIComponent(symbol)}`, {
        query: opts as Record<string, string | number | undefined>,
        auth: false,
      }),

    // PR-S6 — Saved Scans + Alerts
    listSavedScans: () =>
      request<{
        scans: Array<{
          id: string
          name: string
          scanner_ids: number[]
          universe: string
          sectors: string[]
          min_hits: number
          schedule: 'hourly' | 'open_close' | 'every_15min' | 'manual'
          notify_channels: string[]
          enabled: boolean
          last_run_at: string | null
          last_hit_count: number
          last_hit_symbols: string[]
          created_at: string
        }>
      }>('/api/screener/saved-scans'),
    createSavedScan: (body: {
      name: string
      scanner_ids: number[]
      universe?: 'nifty50' | 'nifty100' | 'nifty500' | 'nse_all'
      sectors?: string[]
      min_hits?: number
      schedule?: 'hourly' | 'open_close' | 'every_15min' | 'manual'
      notify_channels?: Array<'push' | 'email' | 'whatsapp' | 'telegram'>
    }) =>
      request<{ id: string; name: string }>('/api/screener/saved-scans', {
        method: 'POST', body,
      }),
    updateSavedScan: (scan_id: string, body: Record<string, unknown>) =>
      request<{ id: string }>(`/api/screener/saved-scans/${encodeURIComponent(scan_id)}`, {
        method: 'PATCH', body,
      }),
    deleteSavedScan: (scan_id: string) =>
      request<{ deleted: boolean }>(`/api/screener/saved-scans/${encodeURIComponent(scan_id)}`, {
        method: 'DELETE',
      }),
    runSavedScan: (scan_id: string) =>
      request<{
        matched_symbols: string[]
        new_symbols: string[]
        total_count: number
        error: string | null
      }>(`/api/screener/saved-scans/${encodeURIComponent(scan_id)}/run`, {
        method: 'POST',
      }),
    listSavedScanAlerts: (limit = 30) =>
      request<{
        alerts: Array<{
          id: string
          scan_id: string
          new_symbols: string[]
          total_match_count: number
          notified: boolean
          fired_at: string
        }>
      }>('/api/screener/saved-scans/alerts', { query: { limit } }),

    // PR-S10 — Per-scanner historical WR + avg return
    scannerStats: (scanner_id?: number) =>
      request<{
        stats: Array<{
          scanner_id: number
          total_hits: number
          win_rate_5d: number
          win_rate_10d: number
          avg_return_5d_pct: number
          avg_return_10d_pct: number
          median_return_5d_pct: number
          median_return_10d_pct: number
          avg_drawdown_pct: number
          lookback_days: number
          computed_at: string
        }>
      }>('/api/screener/v2/scanner-stats', {
        query: scanner_id !== undefined ? { scanner_id } : undefined,
        auth: false,
      }),

    // PR-S12 — Multi-timeframe agreement
    mtfScan: (opts?: {
      universe?: 'nifty50' | 'nifty100' | 'nifty500'
      timeframes?: string[]      // joined comma — '15m,1h,1d'
      direction?: 'bullish' | 'bearish'
      limit?: number
      sectors?: string[]
    }) =>
      request<{
        success: boolean
        timeframes: string[]
        symbols_scanned: number
        matches: Array<{
          symbol: string
          sector: string | null
          direction: 'bullish' | 'bearish'
          agreement_count: number
          total_timeframes: number
          last_price: number
          change_pct: number
          composite_score: number
          votes: Array<{
            timeframe: string
            direction: string
            rsi: number
            close: number
            ema21: number
            volume_ratio: number
            note: string
          }>
        }>
        count: number
      }>('/api/screener/v2/mtf-scan', {
        query: {
          ...opts,
          timeframes: opts?.timeframes?.join(','),
          sectors: opts?.sectors?.length ? opts.sectors.join(',') : undefined,
        } as Record<string, string | number | undefined>,
        auth: false,
      }),

    // PR-S13 — Sector heatmap
    // True market breadth — advance/decline counts today + cumulative A/D line.
    breadth: (days = 120) =>
      request<{
        success: boolean
        today: { date: string; adv: number; dec: number; net: number; ad_line: number } | null
        ratio: number | null
        ad_line: Array<{ date: string; ad_line: number }>
      }>('/api/screener/breadth', { query: { days }, auth: false }),
    // Smart Alerts — conditions firing right now (volume 3x / OI 15% / 20d breakout / IV>=80).
    liveAlerts: (limit = 60) =>
      request<{
        success: boolean; count: number
        alerts: Array<{ symbol: string; type: string; severity: string; message: string }>
      }>('/api/screener/alerts/live', { query: { limit }, auth: false }),
    // AI Setup Finder — labeled counts for the 4 canonical setups
    // (Breakout / Pullback / Trend continuation / Reversal). Reuses existing
    // scanners; deterministic, 0 tokens. `ok` is false only if all scanners failed.
    setupFinder: (universe?: string) =>
      request<{
        success: boolean
        ok: boolean
        total: number
        setups: Array<{ key: string; label: string; count: number; symbols: string[] }>
      }>('/api/screener/setups', { query: universe ? { universe } : {}, auth: false }),
    // Multi-period sector rotation (RRG quadrants) vs market average.
    sectorRotation: (narrate = false) =>
      request<{
        success: boolean
        count: number
        narrative?: string | null
        sectors: Array<{
          sector: string; count: number; ret_5d: number; ret_20d: number
          rs_short: number; rs_long: number; quadrant: string
        }>
      }>('/api/screener/sector-rotation', { query: { narrate }, auth: false }),
    // AI Market Explainer — index-level plain-English summary. Deterministic
    // drivers load at 0 tokens; the grounded narrative is fetched only when
    // useLlm. Honest-empty (no drivers) when no real facts can be assembled.
    marketExplainer: (useLlm = false) =>
      request<{
        facts: Record<string, any>
        drivers: string[]
        narrative: string | null
      }>('/api/screener/market-explainer', { query: { use_llm: useLlm }, auth: false }),
    // AI Factor Screener — compose continuous factors (e.g. low-volatility
    // momentum) into one cross-sectional ranking. Deterministic, 0 tokens.
    // Empty `factors` returns just the available-factor list for the picker.
    factorScreen: (factors: string[], universe?: string, top = 25) =>
      request<{
        success: boolean
        factors: string[]
        available_factors: Array<{ key: string; label: string; description: string }>
        universe_size: number
        results: Array<{ symbol: string; composite: number; factor_scores: Record<string, number> }>
      }>('/api/screener/factor-screen', {
        query: { factors: factors.join(','), universe: universe || undefined, top },
        auth: false,
      }),
    sectorHeatmap: () =>
      request<{
        success: boolean
        timestamp: string
        sectors: Array<{
          sector: string
          peer_count: number
          avg_change_pct: number
          median_change_pct: number
          breadth_pct: number
          volume_surge_pct: number
          rsi_oversold_count: number
          rsi_overbought_count: number
          top_movers: Array<{ symbol: string; name: string; change_pct: number; close: number }>
        }>
        count: number
      }>('/api/screener/v2/sector-heatmap', { auth: false }),

    // PR-S14 — Comparable historical setups
    comparable: (scanner_id: number, symbol: string, opts?: { k?: number; since_days?: number }) =>
      request<{
        scanner_id: number
        sample_size: number
        median_return_5d_pct: number | null
        median_return_10d_pct: number | null
        win_rate_5d: number | null
        avg_drawdown_pct: number | null
        setups: Array<{
          symbol: string
          hit_date: string
          entry_price: number
          return_5d_pct: number | null
          return_10d_pct: number | null
          max_drawdown_pct: number | null
          distance: number
          won_5d: boolean | null
        }>
      }>(`/api/screener/v2/comparable/${scanner_id}/${encodeURIComponent(symbol)}`, {
        query: opts as Record<string, string | number | undefined>,
        auth: false,
      }),

    // PR-S19 — F&O index option-chain snapshot + strategy suggestions
    // O.2 — Strategy adjustment engine (rule-based roll/hedge/defend/scale-out)
    fnoAdjustments: (payload: {
      position: { net_premium: number; unrealized_pnl: number; expiry_date?: string | null }
      legs: Array<{ side: 'BUY' | 'SELL'; option_type: 'CE' | 'PE'; strike: number; lots: number; lot_size: number }>
      spot: number
      vix?: number | null
    }) =>
      request<{
        count: number
        adjustments: Array<{
          action: 'roll' | 'hedge' | 'defend' | 'close' | 'scale_in'
          name: string
          urgency: 'critical' | 'recommended' | 'optional'
          rationale: string
          steps: string[]
          expected_outcome: string
          risk_notes: string[]
          source_label: string
        }>
      }>('/api/screener/fno/adjustments', {
        method: 'POST',
        body: payload,
        auth: false,
      }),

    fnoSnapshotAll: () =>
      request<{
        any_live: boolean
        indices: Record<string, FnoIndexSnapshot | null>
      }>('/api/screener/fno/snapshot-all', { auth: false }),

    fnoSnapshot: (symbol: string, includeStrategies = true) =>
      request<{
        snapshot: FnoIndexSnapshot
        teach?: string[]
        india_vix: number | null
        regime?: string
        strategies?: FnoStrategy[]
      }>(`/api/screener/fno/snapshot/${encodeURIComponent(symbol)}`, {
        query: { include_strategies: includeStrategies },
        auth: false,
      }),

    fnoBestTrade: (symbol: string, useLlm = true) =>
      request<{
        success: boolean
        symbol: string
        facts: {
          symbol: string
          spot: number | null
          pcr_oi: number | null
          pcr_tag: string
          bias: 'bullish' | 'bearish' | 'neutral'
          max_pain: number | null
          max_pain_distance_pct: number | null
          pull_to_max_pain_signal: boolean
          atm_iv: number | null
          iv_rank: number | null
          india_vix: number | null
          vix_regime: string
          days_to_expiry: number | null
        } | null
        strategies: FnoStrategy[]
        narrative: string | null
      }>(`/api/screener/fno/best-trade/${encodeURIComponent(symbol)}`, {
        query: { use_llm: useLlm },
        auth: false,
      }),

    // PR-P2 — intraday setup scanner (5m/15m)
    intradayCatalog: () =>
      request<{
        setups: Array<{ id: string; name: string; tf: string; direction: string }>
        count: number
      }>('/api/screener/intraday/catalog', { auth: false }),

    intradayScan: (opts?: {
      universe?: 'nifty50' | 'nifty100' | 'nifty500'
      setups?: string[]
      limit?: number
    }) =>
      request<{
        universe: string
        symbols_scanned: number
        setups_run: number
        matches: Array<{
          symbol: string
          setup_id: string
          direction: 'bullish' | 'bearish' | 'neutral'
          detected_at: string
          timeframe: string
          entry: number
          stop: number
          target: number
          risk_reward: number
          last_price: number
          volume_ratio: number
          confidence: 'high' | 'medium' | 'low'
          reason: string
          notes: string[]
        }>
        count: number
        timestamp: string
      }>('/api/screener/intraday/scan', {
        query: {
          universe: opts?.universe,
          setups: opts?.setups?.length ? opts.setups.join(',') : undefined,
          limit: opts?.limit,
        } as Record<string, string | number | undefined>,
        auth: false,
      }),

    fnoOiHeatmap: (symbol: string) =>
      request<{
        symbol: string
        spot: number
        rows: Array<{
          strike: number
          call_oi: number
          put_oi: number
          call_oi_change: number
          put_oi_change: number
          distance_pct: number | null
        }>
        strike_count: number
      }>(`/api/screener/fno/oi-heatmap/${encodeURIComponent(symbol)}`, { auth: false }),

    fnoFlow: (symbol: string) =>
      request<{
        symbol: string
        spot: number | null
        total_call_writing: number
        total_put_writing: number
        pcr: number | null
        max_pain: number | null
        max_pain_pull_pct: number | null
        top_buildup: Array<{
          strike: number
          side: 'CE' | 'PE'
          oi_change: number
          direction: 'writing' | 'unwinding'
        }>
        biggest_buildup: {
          strike: number
          side: 'CE' | 'PE'
          oi_change: number
          direction: 'writing' | 'unwinding'
        } | null
        writing_vote: 'bullish' | 'bearish' | 'neutral'
        pcr_vote: 'bullish' | 'bearish' | 'neutral'
        lean: 'bullish' | 'bearish' | 'neutral'
        strike_count: number
      }>(`/api/screener/fno/flow/${encodeURIComponent(symbol)}`, { auth: false }),

    fnoStockScanners: () =>
      request<{
        fii_dii: { fii_net: number; dii_net: number; date: string | null; source: string; last_error: string | null }
        oi_source: string | null
        oi_last_error: string | null
        buckets: {
          long_buildup: Array<{ symbol: string; change_pct: number; oi_change_pct: number; oi: number }>
          short_buildup: Array<{ symbol: string; change_pct: number; oi_change_pct: number; oi: number }>
          long_unwinding: Array<{ symbol: string; change_pct: number; oi_change_pct: number; oi: number }>
          short_covering: Array<{ symbol: string; change_pct: number; oi_change_pct: number; oi: number }>
          oi_spike: Array<{ symbol: string; change_pct: number; oi_change_pct: number; oi: number }>
        }
        counts: Record<string, number>
      }>('/api/screener/fno/stock-scanners', { auth: false }),

    // PR-S21 — Derivatives (F&O) EOD analysis (reads the nightly EOD tables).
    fnoEod: (symbol: string) =>
      request<{
        success: boolean
        symbol: string
        expiry: string | null
        as_of: string | null
        metrics: null | {
          pcr_oi: number
          pcr_volume: number
          max_pain: number
          total_ce_oi: number
          total_pe_oi: number
        }
        chain: Array<{ strike: number; ce_oi: number; pe_oi: number }>
      }>(`/api/screener/fno/eod/${encodeURIComponent(symbol)}`, { auth: false }),

    fnoParticipants: () =>
      request<{
        success: boolean
        as_of: string | null
        participants: Array<{ participant: string; fut_net: number; opt_bull: number; opt_bear: number }>
      }>('/api/screener/fno/participants', { auth: false }),

    fnoBan: () =>
      request<{ success: boolean; as_of: string | null; symbols: string[] }>(
        '/api/screener/fno/ban',
        { auth: false },
      ),

    fnoLotSizes: () =>
      request<{
        effective_from: string
        lot_sizes: Record<string, number>
        tick_sizes: Record<string, number>
        note: string
      }>('/api/screener/fno/lot-sizes', { auth: false }),

    // PR-S22 — Institutional Order-Flow (FII/DII flow + bulk/block deals + shorts).
    orderflowFiiDii: () =>
      request<{
        success: boolean
        as_of: string | null
        segment: string
        fii: { buy: number; sell: number; net: number }
        dii: { buy: number; sell: number; net: number }
      }>('/api/screener/orderflow/fii-dii', { auth: false }),

    orderflowDeals: (limit: number = 15) =>
      request<{
        success: boolean
        as_of: string | null
        deals: Array<{
          symbol: string
          deal_type: string
          side: string
          qty: number
          price: number
          value: number
          client: string
        }>
      }>('/api/screener/orderflow/deals', { query: { limit }, auth: false }),

    orderflowShorts: (limit: number = 15) =>
      request<{
        success: boolean
        as_of: string | null
        shorts: Array<{ symbol: string; qty: number }>
      }>('/api/screener/orderflow/shorts', { query: { limit }, auth: false }),

    // PR-S23 — Fundamentals (reads fundamentals_history; live screener.in fallback).
    fundamentals: (symbol: string) =>
      request<{
        success: boolean
        symbol: string
        as_of: string | null
        source: string | null
        fundamentals: null | {
          pe: number | null
          roe: number | null
          roce: number | null
          market_cap_cr: number | null
          book_value: number | null
          dividend_yield: number | null
          current_price: number | null
          sales_growth: number | null
          profit_growth: number | null
          promoter_pct: number | null
        }
      }>(`/api/screener/fundamentals/${symbol}`, { auth: false }),

    // PR-S7 + PR-S18 — Scanner catalog with category/weight/direction/horizon/setup_type
    powerCatalog: () =>
      request<{
        scanners: Array<{
          id: number
          name: string
          description: string
          category: string
          weight: number
          direction: 'bullish' | 'bearish'
          horizon: 'intraday' | 'swing' | 'positional'
          setup_type: string
        }>
        count: number
      }>('/api/screener/v2/scanner-catalog', { auth: false }),

    // PR-S2 — universe sector chips with per-sector counts
    patternsV2Sectors: () =>
      request<{
        universe_size: number
        tagged_count: number
        untagged_count: number
        sectors: Array<{ sector: string; count: number }>
      }>('/api/screener/patterns/v2/sectors', { auth: false }),

    // PR-S2 — streaming scan URL (consumed via EventSource on the client)
    patternsV2StreamUrl: (opts?: {
      universe?: 'nifty50' | 'nifty100' | 'nifty500' | 'nse_all'
      timeframe?: '1d' | '1h' | '15m'
      sectors?: string[]            // canonical names — joined with comma
      direction?: 'bullish' | 'bearish'
      limit?: number
    }) => {
      const params = new URLSearchParams()
      if (opts?.universe) params.set('universe', opts.universe)
      if (opts?.timeframe) params.set('timeframe', opts.timeframe)
      if (opts?.sectors?.length) params.set('sectors', opts.sectors.join(','))
      if (opts?.direction) params.set('direction', opts.direction)
      if (opts?.limit != null) params.set('limit', String(opts.limit))
      const qs = params.toString()
      return `/api/screener/patterns/v2/scan/stream${qs ? '?' + qs : ''}`
    },

    // PR-S4 + PR-S2.1 — news-driven scanner (now accepts nse_all + sectors)
    newsScan: (opts?: {
      universe?: 'nifty50' | 'nifty100' | 'nifty500' | 'nse_all'
      sectors?: string[]
      lookback_days?: number
      limit?: number
      max_symbols?: number
    }) =>
      request<{
        success: boolean
        feature: string
        universe: string
        symbols_scanned: number
        lookback_days: number
        timestamp: string
        hits: Array<{
          symbol: string
          setup_tag: string
          news_sentiment: number
          headline_count: number
          top_headline: string | null
          top_headline_source: string | null
          last_price: number
          change_pct_today: number
          headlines: Array<{
            title: string
            source: string
            link: string
            published: string | null
          }>
        }>
        count: number
      }>('/api/screener/news/scan', {
        query: {
          ...opts,
          // Backend expects comma-separated sectors string, not an array
          sectors: opts?.sectors?.length ? opts.sectors.join(',') : undefined,
        } as Record<string, string | number | undefined>,
        auth: false,
      }),
    searchInstruments: (q: string, limit: number = 20, sector?: string) =>
      request<{ success: boolean; instruments: Array<{ symbol: string; name: string; sector?: string; mcap_category?: string }> }>(
        '/api/screener/instruments', { query: { q, sector: sector || undefined, limit }, auth: false }),
    // Index catalog (broad-market / sectoral / derivatives) for browse surfaces.
    listIndices: () =>
      request<{ success: boolean; indices: Array<{ index_name: string; category: string }> }>(
        '/api/screener/indices', { auth: false }),
    indexConstituents: (indexName: string, limit: number = 800) =>
      request<{ success: boolean; index_name: string; count: number; constituents: Array<{ symbol: string; name?: string; sector?: string; mcap_category?: string }> }>(
        `/api/screener/index/${encodeURIComponent(indexName)}/constituents`, { query: { limit }, auth: false }),
    getLivePrices: (symbols: string[]) =>
      request<{ success: boolean; prices: Array<Record<string, any>> }>('/api/screener/prices/live', {
        query: { symbols: symbols.join(',') },
        auth: false,
      }),
    getStockPrice: (symbol: string) =>
      request<Record<string, any>>(`/api/screener/prices/${symbol}`, { auth: false }),
    // Probability Engine — empirical setup follow-through rates from history.
    probability: (symbol: string) =>
      request<{
        success: boolean; symbol: string; horizon_days: number; target_pct: number
        setups: Array<{ name: string; active_now: boolean; occurrences: number; success: number; prob_pct: number | null }>
      }>(`/api/screener/probability/${encodeURIComponent(symbol)}`, { auth: false }),
    // Market Profile / TPO — time-at-price distribution + POC + value area.
    marketProfile: (symbol: string, days = 60) =>
      request<{
        success: boolean; symbol: string
        poc: number | null; vah: number | null; val: number | null; total_tpo: number
        profile: Array<{ price: number; tpo: number }>
      }>(`/api/screener/market-profile/${encodeURIComponent(symbol)}`, { query: { days }, auth: false }),
    // Footprint / Cumulative Volume Delta (bar-level proxy).
    footprint: (symbol: string, days = 60) =>
      request<{
        success: boolean; symbol: string; trend: string | null
        latest: { delta: number; cvd: number; buy_pct: number } | null
        cvd: Array<{ date: string; cvd: number }>
      }>(`/api/screener/footprint/${encodeURIComponent(symbol)}`, { query: { days }, auth: false }),
    // Indicator Interpreter — RSI/MACD/ADX/trend/volume in plain English + bias.
    interpretIndicators: (symbol: string, useLlm = false) =>
      request<{
        success: boolean; symbol: string; bias: string
        indicators: Array<{ indicator: string; value: number | null; signal: string; read: string }>
        narrative: string | null
      }>(`/api/screener/interpret/${encodeURIComponent(symbol)}`, { query: { use_llm: useLlm }, auth: false }),
    // Volume Intelligence — spike + percentile + delivery trend + signal.
    volumeIntel: (symbol: string, useLlm = false) =>
      request<{
        success: boolean; symbol: string; signal: string
        x_avg: number | null; vol_percentile: number | null
        today_volume: number | null; avg_volume_20d: number | null
        delivery_today: number | null; avg_delivery: number | null; delivery_trend: number | null
        drivers: string[]; narrative: string | null
      }>(`/api/screener/volume-intel/${encodeURIComponent(symbol)}`, { query: { use_llm: useLlm }, auth: false }),
    // True relative strength vs NIFTY (multi-window).
    relativeStrength: (symbol: string) =>
      request<{
        success: boolean; symbol: string; benchmark: string; outperforming: boolean
        rs_20d: number | null; rs_50d: number | null; rs_120d: number | null
      }>(`/api/screener/rs/${encodeURIComponent(symbol)}`, { auth: false }),
    // News Intelligence — multi-source, deduped, event-typed, materiality-weighted.
    newsIntelligence: (
      symbol: string,
      opts?: { narrative?: boolean; direction?: 'LONG' | 'SHORT' },
    ) =>
      request<{
        success: boolean; cached: boolean; llm_capped?: boolean
        symbol: string; available: boolean
        mood_score: number | null; label: 'bullish' | 'bearish' | 'neutral'
        story_count: number; raw_headline_count: number
        providers: string[]; models: string[]
        impact_counts: { high: number; medium: number; low: number }
        event_breakdown: { event: string; count: number }[]
        top_story: NewsIntelStory | null
        stories: NewsIntelStory[]
        thesis: {
          at_risk: boolean; severity: 'high' | 'medium'; position: string; reason: string
          stories: { title: string; event: string; impact: string; link: string | null }[]
        } | null
        narrative: string | null; as_of: string
      }>(`/api/screener/news-intelligence/${encodeURIComponent(symbol)}`, {
        query: {
          ...(opts?.narrative ? { use_narrative: true } : {}),
          ...(opts?.direction ? { direction: opts.direction } : {}),
        },
      }),
    // Fusion Verdict — one fused, explainable per-symbol setup verdict.
    verdict: (symbol: string, useLlm = false) =>
      request<{
        success: boolean; symbol: string
        verdict: string; composite: number | null
        direction: 'bullish' | 'bearish' | 'neutral'; gated: boolean
        factors: { key: string; label: string; lean: string; score: number | null; weight: number; detail: string | null }[]
        as_of: string; narrative: string | null
      }>(`/api/screener/verdict/${encodeURIComponent(symbol)}`, { query: { use_llm: useLlm }, auth: false }),
    // Why is a stock moving today — deterministic drivers + grounded AI narrative (cached/day).
    whyMoving: (symbol: string, useLlm = true) =>
      request<{
        success: boolean; symbol: string
        facts: Record<string, any>
        drivers: string[]
        narrative: string | null
      }>(`/api/screener/why-moving/${encodeURIComponent(symbol)}`, { query: { use_llm: useLlm }, auth: false }),
    // Earnings Preview — next confirmed date (best-effort probe; honest-empty) +
    // implied move / IV rank / run-up. Narrative only when useLlm (cached/day).
    earningsPreview: (symbol: string, useLlm = false) =>
      request<{
        success: boolean; symbol: string
        facts: Record<string, any>
        drivers: string[]
        narrative: string | null
      }>(`/api/screener/earnings-preview/${encodeURIComponent(symbol)}`, { query: { use_llm: useLlm }, auth: false }),
    // News Digest — per-symbol news/sentiment synthesis. Deterministic drivers
    // (headline counts, mood + trend vs prior day, price reaction) always;
    // the grounded "what the news means" narrative only when useLlm
    // (cached per symbol/day server-side). Honest-empty when no recent news.
    newsDigest: (symbol: string, useLlm = false) =>
      request<{
        success: boolean
        symbol: string
        facts: {
          mood?: {
            mean_score: number
            label: 'bullish' | 'bearish' | 'neutral'
            headline_count: number
            positive: number
            negative: number
            neutral: number
            headlines: Array<{ title: string; source: string | null; published: string | null; label: string; score: number }>
            sources: string[]
          }
          mood_prior?: { mean_score: number; trade_date: string; headline_count: number }
          price?: { ltp: number | null; change_pct: number | null }
        }
        drivers: string[]
        narrative: string | null
      }>(`/api/screener/news-digest/${encodeURIComponent(symbol)}`, { query: { use_llm: useLlm }, auth: false }),
    // Live L2 order book + deterministic liquidity read (walls/imbalance). 503 when no feed.
    marketDepth: (symbol: string) =>
      request<{
        success: boolean
        symbol: string
        depth: {
          levels: number; source: string
          bids: Array<{ price: number; quantity: number; orders: number }>
          asks: Array<{ price: number; quantity: number; orders: number }>
        }
        analysis: {
          total_bid_qty: number; total_ask_qty: number; imbalance: number; pressure: string
          best_bid: number | null; best_ask: number | null; spread: number | null; spread_pct: number | null
          bid_wall: { price: number; quantity: number; orders: number } | null
          ask_wall: { price: number; quantity: number; orders: number } | null
          levels: number
        }
      }>(`/api/screener/depth/${encodeURIComponent(symbol)}`, { auth: false }),
    // PR-AA — typed OHLCV history for the Volume Profile + chart panels.
    getStockHistory: (symbol: string, days: number = 30) =>
      request<{
        success?: boolean
        symbol: string
        history: Array<{
          date: string
          open: number
          high: number
          low: number
          close: number
          volume: number
        }>
        error?: string
      }>(`/api/screener/prices/${symbol}/history`, {
        query: { days },
        auth: false,
      }),
    getTechnicals: (symbol: string) =>
      request<Record<string, any>>(`/api/screener/technicals/${symbol}`, { auth: false }),
    getAI: (endpoint: string) =>
      request<Record<string, any>>(endpoint, { auth: false }),
  },

  // PR 19 — paper trading v2 endpoints
  paper: {
    getEquityCurve: (days = 90) =>
      request<{
        days: number
        initial_equity: number
        latest: {
          snapshot_date: string
          equity: number
          cash: number
          invested: number
          drawdown_pct: number | null
          nifty_close: number | null
        } | null
        points: Array<{
          snapshot_date: string
          equity: number
          cash: number
          invested: number
          drawdown_pct: number | null
          nifty_close: number | null
          return_pct: number
          nifty_pct: number
        }>
      }>('/api/paper/v2/equity-curve', { query: { days } }),
    getLeague: (weeks = 1) =>
      request<{
        weeks: number
        top_20: Array<{
          rank: number
          handle: string
          return_pct: number
          final_equity: number
          snapshots: number
        }>
        computed_at: string
      }>('/api/paper/v2/league', { auth: false, query: { weeks } }),
    getAchievements: () =>
      request<{
        streak_days: number
        trade_count: number
        days_trading: number
        total_return_pct: number
        current_equity: number
        badges: Array<{ key: string; label: string; tier: 'bronze' | 'silver' | 'gold' }>
        go_live_eligible: boolean
      }>('/api/paper/v2/achievements'),
    reset: () =>
      request<{ success: boolean; message: string }>('/api/paper/reset', {
        method: 'POST',
      }),
  },

  // User-level Risk Manager — deterministic warn-only checks (never blocks)
  riskStatus: () =>
    request<{
      ok: boolean
      warnings: Array<{ key: string; severity: 'high' | 'medium'; message: string }>
      day_pnl: number
      capital: number
      positions_value: number
      positions_count: number
      risk_profile: string | null
      daily_loss_limit_pct: number | null
    }>('/api/risk/status'),

  admin: {
    getSystemHealth: () => request<Record<string, any>>('/api/admin/system/health'),
    // MED #5 — Per-model performance dashboard (admin-only)
    getModelPerformance: () =>
      request<{
        models: Array<{
          model_name: string
          version: number
          trained_at: string
          backtest_sharpe: number | null
          live_sharpe_30d: number | null
          drift_ratio: number | null
          rolling: Array<{
            window_days: number
            win_rate: number
            avg_pnl_pct: number
            signal_count: number
            directional_accuracy: number
            sharpe_ratio: number
            max_drawdown_pct: number
            computed_at: string
          }>
        }>
        errors: string[]
      }>('/api/admin/model-performance'),
    getPaymentStats: (days = 30) =>
      request<Record<string, any>>('/api/admin/payments/stats', { query: { days } }),
    getSignalStats: (days = 30) =>
      request<Record<string, any>>('/api/admin/signals/stats', { query: { days } }),
    getUsers: (params?: { page?: number; page_size?: number; search?: string; subscription_status?: string; is_suspended?: string }) =>
      request<Record<string, any>>('/api/admin/users', { query: params as Record<string, string> }),
    getUser: (userId: string) => request<Record<string, any>>(`/api/admin/users/${userId}`),
    suspendUser: (userId: string) =>
      request<Record<string, any>>(`/api/admin/users/${userId}/suspend`, { method: 'POST' }),
    unsuspendUser: (userId: string) =>
      request<Record<string, any>>(`/api/admin/users/${userId}/unsuspend`, { method: 'POST' }),
    banUser: (userId: string) =>
      request<Record<string, any>>(`/api/admin/users/${userId}/ban`, { method: 'POST' }),
    resetSubscription: (userId: string) =>
      request<Record<string, any>>(`/api/admin/users/${userId}/reset-subscription`, { method: 'POST' }),
    exportUsers: () => request<string>('/api/admin/users/export/csv'),
    getPayments: (params?: { page?: number; page_size?: number; status?: string }) =>
      request<Record<string, any>>('/api/admin/payments', { query: params as Record<string, string> }),
    getMLPerformance: () => request<Record<string, any>>('/api/admin/ml/performance'),
    getMLRegime: () => request<Record<string, any>>('/api/admin/ml/regime'),
    // PR 43 — Admin drift monitoring
    getMLDrift: (windowDays = 30) =>
      request<{
        window_days: number
        models: Array<{
          model_name: string
          window_days: number
          win_rate: number | null
          avg_pnl_pct: number | null
          signal_count: number
          directional_accuracy: number | null
          sharpe_ratio: number | null
          max_drawdown_pct: number | null
          computed_at: string
        }>
        drifted: Array<{
          model_name: string
          win_rate: number | null
          signal_count: number
          computed_at: string
        }>
        drift_threshold: number
        computed_at: string
      }>('/api/admin/ml/drift', { query: { window_days: windowDays } }),
    retrain: (model?: string) =>
      request<Record<string, any>>('/api/admin/ml/retrain', { method: 'POST', query: model ? { model } : undefined }),
    triggerScan: () => request<Record<string, any>>('/api/admin/scan/trigger', { method: 'POST' }),
    seedDemo: () => request<Record<string, any>>('/api/admin/scan/seed-demo', { method: 'POST' }),

    // PR 47 — N9 Command Center expansions
    getSchedulerJobs: (params?: { job_id?: string; status?: string; limit?: number }) =>
      request<{
        rows: Array<{
          id: string
          job_id: string
          started_at: string
          finished_at: string | null
          status: 'ok' | 'failed' | 'skipped'
          err_msg: string | null
          items_processed: number | null
          metadata: Record<string, any> | null
        }>
        latest_by_job: Array<{
          job_id: string
          started_at: string
          status: 'ok' | 'failed' | 'skipped'
          items_processed: number | null
          err_msg: string | null
        }>
        count: number
        computed_at: string
      }>('/api/admin/scheduler/jobs', { query: params as Record<string, string> | undefined }),

    // PR-V — LLM cost dashboard. Reads llm_usage_events and rolls up
    // by feature, top spender, and model over a lookback window.
    getLlmCost: (hours: number = 24) =>
      request<{
        by_feature: Array<{
          feature: string
          calls: number
          input_tokens: number
          output_tokens: number
          usd: number
        }>
        by_user: Array<{ user_id: string; calls: number; usd: number }>
        by_model: Array<{ provider: string; model: string; calls: number; usd: number }>
        total: {
          calls: number
          usd: number
          window_hours: number
          computed_at: string
          error?: string
        }
      }>('/api/admin/llm-cost', { query: { hours } }),

    getGlobalKillSwitch: () =>
      request<{
        active: boolean
        reason: string | null
        updated_by: string | null
        updated_at: string | null
        description?: string | null
      }>('/api/admin/system/global-kill-switch'),

    setGlobalKillSwitch: (active: boolean, reason?: string | null) =>
      request<{
        active: boolean
        reason: string | null
        updated_by: string | null
        updated_at: string | null
      }>('/api/admin/system/global-kill-switch', {
        method: 'POST',
        body: { active, reason: reason ?? null },
      }),

    // PR 49 — admin audit log viewer
    getAuditLog: (params?: {
      actor_id?: string
      action?: string
      target_type?: string
      target_id?: string
      limit?: number
    }) =>
      request<{
        rows: Array<{
          id: string
          actor_id: string | null
          actor_email: string | null
          action: string
          target_type: string
          target_id: string | null
          payload: Record<string, any> | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }>
        count: number
        actions: string[]
        computed_at: string
      }>('/api/admin/audit-log', { query: params as Record<string, string> | undefined }),

    // PR 129 — unified training pipeline
    listTrainers: () =>
      request<{
        trainers: Array<{ name: string; requires_gpu: boolean; depends_on: string[] }>
        count: number
      }>('/api/admin/training/trainers'),
    listTrainingRuns: () =>
      request<{
        runs: Array<{
          run_id: string
          status: 'running' | 'ok' | 'partial' | 'failed'
          started_at: string
          finished_at: string | null
          triggered_by: string
          params: { only?: string[] | null; skip_gpu?: boolean; promote?: boolean; dry_run?: boolean }
          reports: Array<{
            name: string
            status: 'ok' | 'skipped' | 'failed'
            duration_sec: number
            metrics: Record<string, any>
            error: string | null
            version: number | null
            promoted: boolean
          }>
          error: string | null
        }>
        last_versions: Array<{
          model_name: string
          version: number
          trained_at: string
          trained_by: string | null
          metrics: Record<string, any>
          is_prod: boolean
          is_shadow: boolean
        }>
      }>('/api/admin/training/runs'),
    triggerTrainingRun: (body: {
      only?: string[]
      skip_gpu?: boolean
      promote?: boolean
      dry_run?: boolean
    }) =>
      request<{ run_id: string; status: string; started_at: string }>(
        '/api/admin/training/run',
        { method: 'POST', body },
      ),
  },

  // ── Strategy Discovery Engine (PR-G2) ───────────────────────────────
  // Lets the user kick off a "find me new strategies" batch and then
  // browse / promote the discovered candidates. The backend samples
  // candidates from the DSL parameter space, backtests each across N
  // symbols, scores, and persists results. LLMs do NOT generate any
  // strategy — search is deterministic over the DSL space.
  discovery: {
    /** Start a new run; returns immediately with a poll-able run_id. */
    createRun: (body: {
      kind:
        | 'equity_swing' | 'equity_position'
        | 'fo_weekly' | 'fo_monthly'
        | 'intraday_5m' | 'intraday_15m'
      /** `random` = N random draws. `ga` = elitist genetic algorithm. */
      mode?: 'random' | 'ga'
      sample_size?: number
      universe?: string                // nifty50 / nifty100 / NIFTY / BANKNIFTY
      symbols_per_candidate?: number
      history_period?: string          // e.g. "2y", "3y", "60d"
      seed?: number
      ga_pop_size?: number
      ga_generations?: number
      ga_elite?: number
      ga_children_per_elite?: number
      /** 0/1 = off. 3 = standard 3-fold walk-forward (needs ≥240 bars). */
      walk_forward_folds?: number
    }) =>
      request<{
        run_id: string
        status: 'pending' | 'running' | 'completed' | 'failed'
        kind: string
        config: Record<string, unknown>
      }>('/api/discovery/runs', { method: 'POST', body }),

    /** Recent runs — for the Discovered tab landing list. */
    listRuns: (filters?: {
      kind?: 'equity_swing' | 'equity_position' | 'fo_weekly' | 'fo_monthly' | 'intraday_5m' | 'intraday_15m'
      status?: 'pending' | 'running' | 'completed' | 'failed'
      limit?: number
    }) =>
      request<{
        runs: Array<{
          id: string
          kind: string
          status: string
          started_at: string | null
          completed_at: string | null
          candidates_total: number
          candidates_viable: number
          best_score: number | null
          triggered_by_user_id: string | null
          error: string | null
          created_at: string
        }>
      }>('/api/discovery/runs', { query: filters as Record<string, string> }),

    /** Run detail — used to poll status while a run is in progress. */
    getRun: (runId: string) =>
      request<{
        id: string
        kind: string
        status: string
        config: Record<string, unknown>
        started_at: string | null
        completed_at: string | null
        candidates_total: number
        candidates_viable: number
        best_score: number | null
        error: string | null
        created_at: string
      }>(`/api/discovery/runs/${encodeURIComponent(runId)}`),

    /** Top-K candidates from a run, scored DESC. */
    listCandidates: (runId: string, opts?: { limit?: number; only_viable?: boolean }) =>
      request<{
        candidates: Array<{
          id: string
          run_id: string
          kind: string
          label: string
          score: number
          sharpe: number | null
          calmar: number | null
          max_drawdown_pct: number | null
          win_rate: number | null
          profit_factor: number | null
          total_return_pct: number | null
          trade_count: number | null
          avg_hold_days: number | null
          regime_scores: {
            bull?: number; sideways?: number; bear?: number
            bull_trades?: number; sideways_trades?: number; bear_trades?: number
          }
          status: 'candidate' | 'promoted' | 'archived' | 'failed'
          created_at: string
        }>
      }>(
        `/api/discovery/runs/${encodeURIComponent(runId)}/candidates`,
        { query: opts as Record<string, string> },
      ),

    /** Full candidate detail — includes the DSL document for review. */
    getCandidate: (candidateId: string) =>
      request<{
        id: string
        run_id: string
        kind: string
        label: string
        score: number
        dsl: Record<string, unknown>
        regime_scores: Record<string, number>
        walk_forward: Array<Record<string, unknown>>
        status: string
        promoted_to_strategy_id: string | null
        promoted_at: string | null
      }>(`/api/discovery/candidates/${encodeURIComponent(candidateId)}`),

    /** Promote → copies the candidate's DSL into user_strategies. */
    promote: (candidateId: string, body?: { name?: string; mode?: 'paper' | 'live' }) =>
      request<{
        promoted: boolean
        candidate_id: string
        user_strategy_id: string
        mode: string
      }>(
        `/api/discovery/candidates/${encodeURIComponent(candidateId)}/promote`,
        { method: 'POST', body: body ?? {} },
      ),

    /** Dismiss a candidate — soft-archive, keeps the row for audit. */
    archive: (candidateId: string) =>
      request<{ archived: boolean; candidate_id: string }>(
        `/api/discovery/candidates/${encodeURIComponent(candidateId)}/archive`,
        { method: 'POST' },
      ),
  },
}
