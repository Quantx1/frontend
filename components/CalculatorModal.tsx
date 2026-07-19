'use client'

import { useState } from 'react'
import { X, Calculator, TrendingUp, Shield, DollarSign, Percent, AlertTriangle } from '@/lib/icons'

import TradePlannerCard from '@/components/TradePlannerCard'

interface CalculatorModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'position' | 'risk' | 'planner'
  /**
   * Optional point-of-action pre-fill (e.g. a signal's computed levels). Used
   * only as the initial `useState` value, so callers MUST remount the modal on
   * open (conditional render, or a changing `key`) for fresh values to load.
   * Accept number | string; a signal passes numbers, a form passes strings.
   */
  initialEntry?: number | string
  initialStop?: number | string
  initialTarget?: number | string
  initialCapital?: number | string
  initialRiskPct?: number | string
}

/** Coerce a number | string pre-fill to the string the inputs expect. Empty /
 *  null / non-finite → '' so the field renders blank (not "NaN"/"0"). */
function seed(v?: number | string): string {
  if (v === undefined || v === null || v === '') return ''
  const n = typeof v === 'string' ? Number(v) : v
  if (typeof n === 'number' && !Number.isFinite(n)) return ''
  return String(v)
}

export default function CalculatorModal({
  isOpen,
  onClose,
  type,
  initialEntry,
  initialStop,
  initialTarget,
  initialCapital,
  initialRiskPct,
}: CalculatorModalProps) {
  // Position Sizing Calculator State
  const [capital, setCapital] = useState(() => seed(initialCapital))
  const [riskPercent, setRiskPercent] = useState(() => seed(initialRiskPct) || '2')
  const [entryPrice, setEntryPrice] = useState(() => seed(initialEntry))
  const [stopLoss, setStopLoss] = useState(() => seed(initialStop))

  // Risk Management Calculator State
  const [totalCapital, setTotalCapital] = useState(() => seed(initialCapital))
  const [positionValue, setPositionValue] = useState('')
  const [targetPrice, setTargetPrice] = useState(() => seed(initialTarget))
  const [currentPrice, setCurrentPrice] = useState(() => seed(initialEntry))

  // Position Sizing Calculations
  const calculatePositionSize = () => {
    const cap = parseFloat(capital)
    const risk = parseFloat(riskPercent)
    const entry = parseFloat(entryPrice)
    const stop = parseFloat(stopLoss)

    if (!cap || !risk || !entry || !stop || entry <= stop) return null

    const riskAmount = (cap * risk) / 100
    const stopLossPercent = ((entry - stop) / entry) * 100
    const quantity = Math.floor(riskAmount / (entry - stop))
    const positionSize = quantity * entry

    return {
      riskAmount: riskAmount.toFixed(2),
      quantity,
      positionSize: positionSize.toFixed(2),
      stopLossPercent: stopLossPercent.toFixed(2),
      maxLoss: riskAmount.toFixed(2),
    }
  }

  // Risk Management Calculations
  const calculateRisk = () => {
    const cap = parseFloat(totalCapital)
    const posValue = parseFloat(positionValue)
    const target = parseFloat(targetPrice)
    const current = parseFloat(currentPrice)

    if (!cap || !posValue || !target || !current) return null

    const positionPercent = (posValue / cap) * 100
    const potentialProfit = ((target - current) / current) * 100
    const profitAmount = posValue * (potentialProfit / 100)
    const riskReward = target > current ? (target - current) / (current - (current * 0.95)) : 0

    return {
      positionPercent: positionPercent.toFixed(2),
      potentialProfit: potentialProfit.toFixed(2),
      profitAmount: profitAmount.toFixed(2),
      riskReward: riskReward.toFixed(2),
      recommendation: positionPercent > 10 ? 'HIGH RISK' : positionPercent > 5 ? 'MODERATE' : 'LOW RISK',
    }
  }

  const positionResults = type === 'position' ? calculatePositionSize() : null
  const riskResults = type === 'risk' ? calculateRisk() : null

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl rounded-2xl border border-border/60 bg-background-surface shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 p-6">
          <div className="flex items-center gap-3">
            {type === 'risk' ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15">
                <Shield className="h-6 w-6 text-accent" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-d-text-primary">
                {type === 'position'
                  ? 'Position Sizing Calculator'
                  : type === 'risk'
                  ? 'Risk Management Calculator'
                  : 'Trade Planner'}
              </h2>
              <p className="text-sm text-d-text-muted">
                {type === 'position'
                  ? 'Calculate optimal position size for Indian stocks'
                  : type === 'risk'
                  ? 'Analyze risk and potential returns'
                  : 'Plan entry, size, targets and drawdown before you trade'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 text-d-text-muted transition hover:border-down/60 hover:text-down"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {type === 'position' ? (
            <>
              {/* Position Sizing Form */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-d-text-muted">
                    Total Capital (₹)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-d-text-muted" />
                    <input
                      type="number"
                      value={capital}
                      onChange={(e) => setCapital(e.target.value)}
                      placeholder="100000"
                      className="w-full rounded-lg border border-border/60 bg-main/60 py-3 pl-10 pr-4 text-d-text-primary placeholder-text-secondary transition focus:border-primary/60 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-d-text-muted">
                    Risk Per Trade (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-d-text-muted" />
                    <input
                      type="number"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(e.target.value)}
                      placeholder="2"
                      step="0.5"
                      className="w-full rounded-lg border border-border/60 bg-main/60 py-3 pl-10 pr-4 text-d-text-primary placeholder-text-secondary transition focus:border-primary/60 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-d-text-muted">
                    Entry Price (₹)
                  </label>
                  <input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="2500"
                    className="w-full rounded-lg border border-border/60 bg-main/60 py-3 px-4 text-d-text-primary placeholder-text-secondary transition focus:border-primary/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-d-text-muted">
                    Stop Loss (₹)
                  </label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="2400"
                    className="w-full rounded-lg border border-border/60 bg-main/60 py-3 px-4 text-d-text-primary placeholder-text-secondary transition focus:border-primary/60 focus:outline-none"
                  />
                </div>
              </div>

              {/* Results */}
              {positionResults && (
                <div
                  className="mt-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6"
                >
                  <h3 className="mb-4 text-lg font-semibold text-d-text-primary">Recommended Position</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-background-surface/60 p-4">
                      <div className="text-sm text-d-text-muted">Quantity to Buy</div>
                      <div className="mt-1 text-2xl font-bold text-primary">{positionResults.quantity}</div>
                      <div className="mt-1 text-xs text-d-text-muted">shares</div>
                    </div>

                    <div className="rounded-lg bg-background-surface/60 p-4">
                      <div className="text-sm text-d-text-muted">Position Size</div>
                      <div className="mt-1 text-2xl font-bold text-d-text-primary">₹{positionResults.positionSize}</div>
                    </div>

                    <div className="rounded-lg bg-background-surface/60 p-4">
                      <div className="text-sm text-d-text-muted">Risk Amount</div>
                      <div className="mt-1 text-2xl font-bold text-down">₹{positionResults.riskAmount}</div>
                    </div>

                    <div className="rounded-lg bg-background-surface/60 p-4">
                      <div className="text-sm text-d-text-muted">Stop Loss %</div>
                      <div className="mt-1 text-2xl font-bold text-down">{positionResults.stopLossPercent}%</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-warning/10 p-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning" />
                    <p className="text-sm text-d-text-muted">
                      Maximum loss if stop loss hits: <strong className="text-down">₹{positionResults.maxLoss}</strong>
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : type === 'risk' ? (
            <>
              {/* Risk Management Form */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-d-text-muted">
                    Total Capital (₹)
                  </label>
                  <input
                    type="number"
                    value={totalCapital}
                    onChange={(e) => setTotalCapital(e.target.value)}
                    placeholder="500000"
                    className="w-full rounded-lg border border-border/60 bg-main/60 py-3 px-4 text-d-text-primary placeholder-text-secondary transition focus:border-accent/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-d-text-muted">
                    Position Value (₹)
                  </label>
                  <input
                    type="number"
                    value={positionValue}
                    onChange={(e) => setPositionValue(e.target.value)}
                    placeholder="50000"
                    className="w-full rounded-lg border border-border/60 bg-main/60 py-3 px-4 text-d-text-primary placeholder-text-secondary transition focus:border-accent/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-d-text-muted">
                    Current Price (₹)
                  </label>
                  <input
                    type="number"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    placeholder="2500"
                    className="w-full rounded-lg border border-border/60 bg-main/60 py-3 px-4 text-d-text-primary placeholder-text-secondary transition focus:border-accent/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-d-text-muted">
                    Target Price (₹)
                  </label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="2800"
                    className="w-full rounded-lg border border-border/60 bg-main/60 py-3 px-4 text-d-text-primary placeholder-text-secondary transition focus:border-accent/60 focus:outline-none"
                  />
                </div>
              </div>

              {/* Results */}
              {riskResults && (
                <div
                  className="mt-6 rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 to-transparent p-6"
                >
                  <h3 className="mb-4 text-lg font-semibold text-d-text-primary">Risk Analysis</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-background-surface/60 p-4">
                      <div className="text-sm text-d-text-muted">Position %</div>
                      <div className="mt-1 text-2xl font-bold text-d-text-primary">{riskResults.positionPercent}%</div>
                      <div className="mt-1 text-xs text-d-text-muted">of total capital</div>
                    </div>

                    <div className="rounded-lg bg-background-surface/60 p-4">
                      <div className="text-sm text-d-text-muted">Potential Profit</div>
                      <div className="mt-1 text-2xl font-bold text-up">+{riskResults.potentialProfit}%</div>
                      <div className="mt-1 text-xs text-d-text-muted">₹{riskResults.profitAmount}</div>
                    </div>

                    <div className="rounded-lg bg-background-surface/60 p-4">
                      <div className="text-sm text-d-text-muted">Risk:Reward</div>
                      <div className="mt-1 text-2xl font-bold text-accent">{riskResults.riskReward}:1</div>
                    </div>
                  </div>

                  <div
                    className={`mt-4 rounded-lg p-4 ${
                      riskResults.recommendation === 'HIGH RISK'
                        ? 'bg-down/10 border border-down/30'
                        : riskResults.recommendation === 'MODERATE'
                        ? 'bg-warning/10 border border-warning/30'
                        : 'bg-up/10 border border-up/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield
                        className={`h-5 w-5 ${
                          riskResults.recommendation === 'HIGH RISK'
                            ? 'text-down'
                            : riskResults.recommendation === 'MODERATE'
                            ? 'text-warning'
                            : 'text-up'
                        }`}
                      />
                      <span
                        className={`font-semibold ${
                          riskResults.recommendation === 'HIGH RISK'
                            ? 'text-down'
                            : riskResults.recommendation === 'MODERATE'
                            ? 'text-warning'
                            : 'text-up'
                        }`}
                      >
                        {riskResults.recommendation}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-d-text-muted">
                      {riskResults.recommendation === 'HIGH RISK'
                        ? 'Position exceeds recommended 10% of capital. Consider reducing position size.'
                        : riskResults.recommendation === 'MODERATE'
                        ? 'Position is within acceptable range. Monitor closely and maintain stop loss.'
                        : 'Position size is conservative and well-managed. Good risk control.'}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* AI Trade Planner — reuses position-tab state + risk-tab target */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-d-text-muted">
                    Entry Price (₹)
                  </label>
                  <input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="2500"
                    className="w-full rounded-lg border border-border/60 bg-main/60 py-3 px-4 text-d-text-primary placeholder-text-secondary transition focus:border-primary/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-d-text-muted">
                    Stop Loss (₹) — above entry = short
                  </label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="2400"
                    className="w-full rounded-lg border border-border/60 bg-main/60 py-3 px-4 text-d-text-primary placeholder-text-secondary transition focus:border-primary/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-d-text-muted">
                    Total Capital (₹)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-d-text-muted" />
                    <input
                      type="number"
                      value={capital}
                      onChange={(e) => setCapital(e.target.value)}
                      placeholder="100000"
                      className="w-full rounded-lg border border-border/60 bg-main/60 py-3 pl-10 pr-4 text-d-text-primary placeholder-text-secondary transition focus:border-primary/60 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-d-text-muted">
                    Risk Per Trade (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-d-text-muted" />
                    <input
                      type="number"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(e.target.value)}
                      placeholder="2"
                      step="0.5"
                      className="w-full rounded-lg border border-border/60 bg-main/60 py-3 pl-10 pr-4 text-d-text-primary placeholder-text-secondary transition focus:border-primary/60 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-d-text-muted">
                    Target Price (₹) — optional
                  </label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="2800"
                    className="w-full rounded-lg border border-border/60 bg-main/60 py-3 px-4 text-d-text-primary placeholder-text-secondary transition focus:border-primary/60 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6">
                <TradePlannerCard
                  entry={parseFloat(entryPrice)}
                  stop={parseFloat(stopLoss)}
                  capital={parseFloat(capital)}
                  riskPct={parseFloat(riskPercent)}
                  target={targetPrice ? parseFloat(targetPrice) : undefined}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
