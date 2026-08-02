'use client'

import { useState } from 'react'
import { Calculator, TrendingUp, Shield, DollarSign, Percent, AlertTriangle } from '@/lib/icons'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
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

  const typeLabel =
    type === 'position'
      ? 'Position Sizing Calculator'
      : type === 'risk'
      ? 'Risk Management Calculator'
      : 'Trade Planner'

  const typeDesc =
    type === 'position'
      ? 'Calculate optimal position size for Indian stocks'
      : type === 'risk'
      ? 'Analyze risk and potential returns'
      : 'Plan entry, size, targets and drawdown before you trade'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                type === 'risk' ? 'bg-accent/10' : 'bg-primary/10',
              )}
            >
              {type === 'risk' ? (
                <Shield className="h-5 w-5 text-primary" />
              ) : (
                <Calculator className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle>{typeLabel}</DialogTitle>
              <DialogDescription>{typeDesc}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Position Sizing ── */}
        {type === 'position' && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="calc-capital">Total Capital (₹)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="calc-capital"
                    type="number"
                    value={capital}
                    onChange={(e) => setCapital(e.target.value)}
                    placeholder="100000"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="calc-risk-pct">Risk Per Trade (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="calc-risk-pct"
                    type="number"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(e.target.value)}
                    placeholder="2"
                    step="0.5"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="calc-entry">Entry Price (₹)</Label>
                <Input
                  id="calc-entry"
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="2500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="calc-stop">Stop Loss (₹)</Label>
                <Input
                  id="calc-stop"
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="2400"
                />
              </div>
            </div>

            {positionResults && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">Recommended Position</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <ResultTile label="Quantity to Buy" value={String(positionResults.quantity)} suffix="shares" tone="primary" />
                  <ResultTile label="Position Size" value={`₹${positionResults.positionSize}`} tone="neutral" />
                  <ResultTile label="Risk Amount" value={`₹${positionResults.riskAmount}`} tone="down" />
                  <ResultTile label="Stop Loss %" value={`${positionResults.stopLossPercent}%`} tone="down" />
                </div>
                <div className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning/20 px-3 py-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <p className="text-xs text-muted-foreground">
                    Maximum loss if stop loss hits:{' '}
                    <strong className="text-destructive">₹{positionResults.maxLoss}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Risk Management ── */}
        {type === 'risk' && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="rc-capital">Total Capital (₹)</Label>
                <Input
                  id="rc-capital"
                  type="number"
                  value={totalCapital}
                  onChange={(e) => setTotalCapital(e.target.value)}
                  placeholder="500000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rc-pos-value">Position Value (₹)</Label>
                <Input
                  id="rc-pos-value"
                  type="number"
                  value={positionValue}
                  onChange={(e) => setPositionValue(e.target.value)}
                  placeholder="50000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rc-current">Current Price (₹)</Label>
                <Input
                  id="rc-current"
                  type="number"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="2500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rc-target">Target Price (₹)</Label>
                <Input
                  id="rc-target"
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="2800"
                />
              </div>
            </div>

            {riskResults && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">Risk Analysis</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <ResultTile label="Position %" value={`${riskResults.positionPercent}%`} suffix="of total capital" tone="neutral" />
                  <ResultTile label="Potential Profit" value={`+${riskResults.potentialProfit}%`} suffix={`₹${riskResults.profitAmount}`} tone="up" />
                  <ResultTile label="Risk:Reward" value={`${riskResults.riskReward}:1`} tone="primary" />
                </div>

                <div
                  className={cn(
                    'flex items-start gap-2 rounded-md border px-3 py-2',
                    riskResults.recommendation === 'HIGH RISK'
                      ? 'bg-destructive/10 border-destructive/20'
                      : riskResults.recommendation === 'MODERATE'
                      ? 'bg-warning/10 border-warning/20'
                      : 'bg-green-500/10 border-green-500/20',
                  )}
                >
                  <Shield
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      riskResults.recommendation === 'HIGH RISK'
                        ? 'text-destructive'
                        : riskResults.recommendation === 'MODERATE'
                        ? 'text-warning'
                        : 'text-green-500',
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        'text-xs font-semibold',
                        riskResults.recommendation === 'HIGH RISK'
                          ? 'text-destructive'
                          : riskResults.recommendation === 'MODERATE'
                          ? 'text-warning'
                          : 'text-green-500',
                      )}
                    >
                      {riskResults.recommendation}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {riskResults.recommendation === 'HIGH RISK'
                        ? 'Position exceeds recommended 10% of capital. Consider reducing position size.'
                        : riskResults.recommendation === 'MODERATE'
                        ? 'Position is within acceptable range. Monitor closely and maintain stop loss.'
                        : 'Position size is conservative and well-managed. Good risk control.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Trade Planner ── */}
        {type === 'planner' && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tp-entry">Entry Price (₹)</Label>
                <Input
                  id="tp-entry"
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="2500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tp-stop">Stop Loss (₹) — above entry = short</Label>
                <Input
                  id="tp-stop"
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="2400"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tp-capital">Total Capital (₹)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="tp-capital"
                    type="number"
                    value={capital}
                    onChange={(e) => setCapital(e.target.value)}
                    placeholder="100000"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tp-risk">Risk Per Trade (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="tp-risk"
                    type="number"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(e.target.value)}
                    placeholder="2"
                    step="0.5"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="tp-target">Target Price (₹) — optional for R:R display</Label>
                <Input
                  id="tp-target"
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="2700"
                />
              </div>
            </div>

            {entryPrice && stopLoss && capital && (
              <TradePlannerCard
                entry={parseFloat(entryPrice)}
                stop={parseFloat(stopLoss)}
                capital={parseFloat(capital)}
                riskPct={parseFloat(riskPercent)}
                target={targetPrice ? parseFloat(targetPrice) : undefined}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ── Compact result tile ── */
interface ResultTileProps {
  label: string
  value: string
  suffix?: string
  tone: 'up' | 'down' | 'primary' | 'neutral'
}

function ResultTile({ label, value, suffix, tone }: ResultTileProps) {
  const valueCls =
    tone === 'up'
      ? 'text-green-500'
      : tone === 'down'
      ? 'text-destructive'
      : tone === 'primary'
      ? 'text-primary'
      : 'text-foreground'

  return (
    <div className="rounded-md bg-card border border-border/60 px-3 py-3">
      <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-xl font-semibold tabular-nums', valueCls)}>{value}</p>
      {suffix && <p className="mt-0.5 text-[11px] text-muted-foreground">{suffix}</p>}
    </div>
  )
}
