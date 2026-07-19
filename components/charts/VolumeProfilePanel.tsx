'use client'

/**
 * VolumeProfilePanel — institutional-style "Market Profile" display.
 *
 * Computes volume-at-price from historical OHLCV (no broker order book
 * required) and surfaces the levels that quant + institutional desks
 * watch:
 *
 *   - POC  : Point of Control      (price with the most traded volume)
 *   - VAH  : Value Area High       (top of the 70%-volume zone)
 *   - VAL  : Value Area Low        (bottom of the 70%-volume zone)
 *   - VWAP : Volume-Weighted Avg   (where the average share changed hands)
 *
 * Why it matters for retail beta testers: POC + VAH/VAL show where
 * smart money has accumulated. Price returning to those levels is a
 * high-conviction trade location.
 *
 * Computed entirely in-browser from public OHLCV — no Level-2 feed
 * required, so it works for every NSE symbol the user clicks on.
 */

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Loader2 } from '@/lib/icons'

import { Card, CardBody, CardHeader } from '@/components/foundation'
import { api } from '@/lib/api'

interface Props {
  symbol: string
  /** How many days of history to fold into the profile. Default 30. */
  lookbackDays?: number
  /** Number of price buckets. Default 20. */
  bins?: number
  className?: string
}

type Candle = {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface Profile {
  bins: Array<{ price: number; volume: number; pct: number }>
  poc: number
  vah: number
  val: number
  vwap: number
  totalVolume: number
  dayRange: { low: number; high: number }
  lastClose: number
}

export function VolumeProfilePanel({
  symbol,
  lookbackDays = 30,
  bins = 20,
  className,
}: Props) {
  const [candles, setCandles] = useState<Candle[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api.screener
      .getStockHistory(symbol, lookbackDays)
      .then((r: any) => {
        if (cancelled) return
        const arr: Candle[] = (r?.history || []).filter(
          (c: Candle) => c && c.high > 0 && c.low > 0,
        )
        setCandles(arr)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e?.message || 'Failed to load OHLCV')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [symbol, lookbackDays])

  const profile: Profile | null = useMemo(() => {
    if (!candles || candles.length === 0) return null
    return computeProfile(candles, bins)
  }, [candles, bins])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Volume profile · {symbol}
          </span>
        </CardHeader>
        <CardBody className="flex h-48 items-center justify-center text-d-text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardBody>
      </Card>
    )
  }

  if (error || !profile) {
    return (
      <Card className={className}>
        <CardHeader>
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Volume profile · {symbol}
          </span>
        </CardHeader>
        <CardBody className="py-8 text-center text-xs text-d-text-muted">
          {error || 'No OHLCV available — profile cannot be computed.'}
        </CardBody>
      </Card>
    )
  }

  const maxBinVol = Math.max(...profile.bins.map((b) => b.volume))

  return (
    <Card className={className}>
      <CardHeader>
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Volume profile · {symbol}
          </span>
          <span className="font-mono text-[10px] text-d-text-muted">
            {lookbackDays}d window
          </span>
        </span>
      </CardHeader>
      <CardBody className="space-y-3">
        {/* Key levels strip — what institutions watch. */}
        <div className="grid grid-cols-4 gap-2">
          <KeyLevel label="POC" value={profile.poc} hint="most-traded price" />
          <KeyLevel label="VAH" value={profile.vah} hint="value area top" />
          <KeyLevel label="VAL" value={profile.val} hint="value area bottom" />
          <KeyLevel label="VWAP" value={profile.vwap} hint="weighted avg" />
        </div>

        {/* Horizontal bar volume-at-price. Bars grow from the LEFT — that
            way the price axis is visible on the right where the user reads. */}
        <div className="rounded-md border border-line bg-main p-2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Volume at price
          </p>
          <div className="flex flex-col gap-px font-mono text-[10px]">
            {[...profile.bins].reverse().map((b, i) => {
              const widthPct = maxBinVol > 0 ? (b.volume / maxBinVol) * 100 : 0
              const isInValue = b.price >= profile.val && b.price <= profile.vah
              const isPoc = Math.abs(b.price - profile.poc) < (profile.dayRange.high - profile.dayRange.low) / bins
              const barColor = isPoc
                ? 'bg-primary'
                : isInValue
                  ? 'bg-primary/40'
                  : 'bg-d-text-muted/30'
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 rounded-sm bg-wrap relative overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 ${barColor}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right tabular-nums text-d-text-muted">
                    ₹{b.price.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Last close + day range — context for the profile. */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-md border border-line bg-wrap p-2">
            <p className="text-[9px] uppercase tracking-wider text-d-text-muted">
              Last close
            </p>
            <p className="font-mono text-sm font-semibold text-d-text-primary tabular-nums">
              ₹{profile.lastClose.toFixed(2)}
            </p>
          </div>
          <div className="rounded-md border border-line bg-wrap p-2">
            <p className="text-[9px] uppercase tracking-wider text-d-text-muted">
              {lookbackDays}d range
            </p>
            <p className="font-mono text-sm font-semibold text-d-text-primary tabular-nums">
              ₹{profile.dayRange.low.toFixed(2)} — ₹{profile.dayRange.high.toFixed(2)}
            </p>
          </div>
        </div>

        <p className="text-[10px] text-d-text-muted">
          Profile derived from {candles!.length} sessions of public OHLCV.
          Green band = 70% value area; bright green = POC.
        </p>
      </CardBody>
    </Card>
  )
}

function KeyLevel({
  label,
  value,
  hint,
}: {
  label: string
  value: number
  hint: string
}) {
  return (
    <div className="rounded-md border border-line bg-wrap p-2">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-d-text-muted">
        {label}
      </p>
      <p className="font-mono text-sm font-semibold text-primary tabular-nums">
        ₹{value.toFixed(2)}
      </p>
      <p className="text-[9px] text-d-text-muted">{hint}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Profile maths — keep pure so it's testable + obvious.
// ─────────────────────────────────────────────────────────────────────────

function computeProfile(candles: Candle[], bins: number): Profile {
  const lows = candles.map((c) => c.low)
  const highs = candles.map((c) => c.high)
  const lo = Math.min(...lows)
  const hi = Math.max(...highs)
  const range = Math.max(hi - lo, 1e-9)
  const binSize = range / bins

  // Bin each candle's volume into its overlapping price buckets. A
  // candle that spans 3 buckets contributes its volume evenly across
  // them — standard volume-at-price approximation when you don't have
  // tick data.
  const volumes = Array.from({ length: bins }, () => 0)
  for (const c of candles) {
    const v = c.volume || 0
    const startBin = Math.max(0, Math.floor((c.low - lo) / binSize))
    const endBin = Math.min(bins - 1, Math.floor((c.high - lo) / binSize))
    const span = endBin - startBin + 1
    const perBin = v / span
    for (let i = startBin; i <= endBin; i += 1) {
      volumes[i] += perBin
    }
  }

  const totalVolume = volumes.reduce((s, v) => s + v, 0)
  const binPrice = (i: number) => lo + (i + 0.5) * binSize
  const binArr = volumes.map((v, i) => ({
    price: binPrice(i),
    volume: v,
    pct: totalVolume > 0 ? v / totalVolume : 0,
  }))

  // POC = bin with max volume.
  let pocIdx = 0
  for (let i = 1; i < bins; i += 1) {
    if (volumes[i] > volumes[pocIdx]) pocIdx = i
  }
  const poc = binPrice(pocIdx)

  // Value area = expand symmetrically from POC until ≥ 70% of volume.
  let vaVol = volumes[pocIdx]
  let vaLow = pocIdx
  let vaHigh = pocIdx
  const target = totalVolume * 0.7
  while (vaVol < target && (vaLow > 0 || vaHigh < bins - 1)) {
    const left = vaLow > 0 ? volumes[vaLow - 1] : -1
    const right = vaHigh < bins - 1 ? volumes[vaHigh + 1] : -1
    if (left >= right) {
      vaLow -= 1
      vaVol += volumes[vaLow]
    } else {
      vaHigh += 1
      vaVol += volumes[vaHigh]
    }
  }
  const val = binPrice(vaLow)
  const vah = binPrice(vaHigh)

  // VWAP — use typical price * volume.
  let vwapNum = 0
  let vwapDen = 0
  for (const c of candles) {
    const tp = (c.high + c.low + c.close) / 3
    vwapNum += tp * (c.volume || 0)
    vwapDen += c.volume || 0
  }
  const vwap = vwapDen > 0 ? vwapNum / vwapDen : candles[candles.length - 1].close

  return {
    bins: binArr,
    poc,
    vah,
    val,
    vwap,
    totalVolume,
    dayRange: { low: lo, high: hi },
    lastClose: candles[candles.length - 1].close,
  }
}
