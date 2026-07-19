/**
 * tradePlan — PURE deterministic pre-trade planner math (no React, no I/O).
 *
 * planTrade sizes a position with fixed-fractional risk: risk budget =
 * capital × riskPct / 100, qty floored by per-share risk |entry − stop|.
 * Direction-aware: stop below entry = long, stop above entry = short.
 *
 * Deterministic math is the single source of truth — the AI only narrates a
 * plan elsewhere, it never changes these numbers. The consecutive-loss line is
 * honest framing ("if the next N trades all hit stop"), no probability claims.
 */

export interface TradePlanInput {
  entry: number
  stop: number
  capital: number
  riskPct: number
  /** Optional price target — enables rMultipleToTarget. */
  target?: number
}

export interface RTarget {
  r: number
  price: number
}

export interface DrawdownAtRisk {
  n: number
  amount: number
  /** Honest framing — describes the arithmetic, claims no probability. */
  label: string
}

export interface TradePlan {
  direction: 'long' | 'short'
  qty: number
  positionValue: number
  positionPctOfCapital: number
  /** Actual rupee loss if the stop hits (qty × riskPerShare; ≤ the riskPct budget because qty is floored). */
  riskAmount: number
  riskPerShare: number
  /** Signed R multiple from entry to the user's target (null when no valid target given). */
  rMultipleToTarget: number | null
  /** Direction-aware 1R/2R/3R prices projected from entry vs stop. */
  targets: RTarget[]
  /** Cumulative loss if the next N trades ALL hit stop (N = 3, 5). */
  expectedDrawdownAtRisk: DrawdownAtRisk[]
}

const round2 = (x: number) => Math.round(x * 100) / 100

/**
 * Build a deterministic trade plan. Returns null on invalid input
 * (non-finite values, entry ≤ 0, stop ≤ 0, stop === entry, capital ≤ 0, riskPct ≤ 0).
 */
export function planTrade(input: TradePlanInput): TradePlan | null {
  const { entry, stop, capital, riskPct, target } = input

  if (![entry, stop, capital, riskPct].every((v) => Number.isFinite(v))) return null
  if (entry <= 0 || stop <= 0 || capital <= 0 || riskPct <= 0) return null
  if (stop === entry) return null

  const direction: 'long' | 'short' = stop < entry ? 'long' : 'short'
  const sign = direction === 'long' ? 1 : -1

  const riskPerShare = Math.abs(entry - stop)
  const riskBudget = (capital * riskPct) / 100
  const qty = Math.floor(riskBudget / riskPerShare)
  const positionValue = qty * entry
  const riskAmount = qty * riskPerShare

  const targets: RTarget[] = [1, 2, 3].map((r) => ({
    r,
    price: round2(entry + sign * r * riskPerShare),
  }))

  let rMultipleToTarget: number | null = null
  if (target !== undefined && Number.isFinite(target) && target > 0) {
    rMultipleToTarget = round2((sign * (target - entry)) / riskPerShare)
  }

  const expectedDrawdownAtRisk: DrawdownAtRisk[] = [3, 5].map((n) => ({
    n,
    amount: round2(riskAmount * n),
    label: `if the next ${n} trades all hit stop`,
  }))

  return {
    direction,
    qty,
    positionValue: round2(positionValue),
    positionPctOfCapital: round2((positionValue / capital) * 100),
    riskAmount: round2(riskAmount),
    riskPerShare: round2(riskPerShare),
    rMultipleToTarget,
    targets,
    expectedDrawdownAtRisk,
  }
}
