'use client'

/**
 * LightweightChart (PR-S16) — TradingView Lightweight Charts wrapped
 * around our own OHLCV data.
 *
 * Drop-in replacement for the legacy TradingViewWidget (`tv.js`) which
 * recently gated NSE data behind a paywall. Same TradingView brand /
 * look-and-feel, but the candles come from /api/screener/prices/{sym}/
 * history (our Kite/jugaad/yfinance pipeline) so we never have a "this
 * symbol is only available on TradingView" upsell.
 *
 * What's included out of the box:
 *   * Candle chart (green up / red down — matches Quant X tokens)
 *   * Volume histogram on a separate pane
 *   * EMA 21 + 50 + 200 overlay (toggleable)
 *   * Crosshair with OHLC + change% tooltip
 *   * 6 timeframe presets (1M/3M/6M/1Y/2Y/5Y)
 *   * Auto-resize to container
 *
 * Bare minimum API to keep callers compatible with the old widget:
 *   <LightweightChart symbol="RELIANCE" height={520} />
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type LineData,
  type SeriesMarker,
  type Time,
} from 'lightweight-charts'

import { api } from '@/lib/api'

interface Props {
  symbol: string                       // raw NSE/BSE ticker
  height?: number | string             // CSS pixels or '100%'
  theme?: 'light' | 'dark'
  className?: string
  /** Initial timeframe — defaults to 1y. */
  defaultRange?: '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y'
  /**
   * When true (default), fetches /patterns/v2/explain/{symbol} and draws
   * entry/stop/target price lines + a marker on the detection bar.
   * Pass false on test/debug pages where we just want raw candles.
   */
  showPatternOverlay?: boolean
}

interface OHLCBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

const RANGE_DAYS: Record<string, number> = {
  '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '2Y': 730, '5Y': 1825,
}


// Theme colors aligned with Quant X tokens (see globals.css).
const PALETTE = {
  dark: {
    background: '#0A0D14',
    text: '#8B92A5',
    grid: '#14172180',
    border: '#1C1E29',
    crosshair: '#3D80FF',
    up: '#05B878',
    down: '#FF5947',
    volumeUp: '#05B87840',
    volumeDown: '#FF594740',
    ema21: '#3D80FF',
    ema50: '#F5A524',
    ema200: '#A371F7',
  },
  light: {
    background: '#FFFFFF',
    text: '#5B5F6B',
    grid: '#E5E1D580',
    border: '#E5E1D5',
    crosshair: '#1949C2',
    up: '#05B878',
    down: '#FF5947',
    volumeUp: '#05B87840',
    volumeDown: '#FF594740',
    ema21: '#1949C2',
    ema50: '#A66B00',
    ema200: '#7A4FCC',
  },
}


/** Compute exponential moving average over a closes array. */
function ema(values: number[], period: number): number[] {
  if (values.length === 0) return []
  const k = 2 / (period + 1)
  const out: number[] = new Array(values.length).fill(NaN)
  out[0] = values[0]
  for (let i = 1; i < values.length; i++) {
    out[i] = values[i] * k + out[i - 1] * (1 - k)
  }
  return out
}


function dateToTime(d: string): Time {
  // lightweight-charts accepts 'YYYY-MM-DD' as a business-day time
  return d as Time
}


interface PatternOverlayState {
  pattern_type: string
  direction: 'bullish' | 'bearish' | null
  detected_at: string
  entry: number
  stop: number
  target: number
  target2: number | null
  rr: number
}


export function LightweightChart({
  symbol, height = 520, theme = 'dark', className,
  defaultRange = '1Y',
  showPatternOverlay = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const ema21Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ema50Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ema200Ref = useRef<ISeriesApi<'Line'> | null>(null)
  // Held-onto price-line handles so we can remove old ones when the
  // pattern overlay changes (e.g. user swaps symbol).
  const overlayLinesRef = useRef<IPriceLine[]>([])

  const [range, setRange] = useState(defaultRange)
  const [bars, setBars] = useState<OHLCBar[] | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [showEMA, setShowEMA] = useState<{ e21: boolean; e50: boolean; e200: boolean }>({
    e21: true, e50: true, e200: true,
  })
  const [overlay, setOverlay] = useState<PatternOverlayState | null>(null)
  const [showOverlay, setShowOverlay] = useState<boolean>(showPatternOverlay)

  const palette = PALETTE[theme]

  // Decode the symbol once for display + API calls. Callers sometimes
  // pass through `useParams().symbol` which arrives URL-encoded (e.g.
  // "M%26M" for the NSE ticker "M&M"). We decode here so the chart
  // header reads "M&M" and the backend fetch hits /history/M&M, not
  // /history/M%26M.
  const decodedSymbol = useMemo(() => {
    try { return decodeURIComponent(symbol) } catch { return symbol }
  }, [symbol])

  // Fetch bars whenever symbol or range changes
  useEffect(() => {
    if (!decodedSymbol) return
    let cancelled = false
    setStatus('loading')
    setErrorMsg('')
    api.screener.getStockHistory(decodedSymbol, RANGE_DAYS[range])
      .then((res: any) => {
        if (cancelled) return
        const hist: OHLCBar[] = res?.history || []
        if (hist.length === 0) {
          setStatus('empty')
          setBars(null)
          return
        }
        setBars(hist)
        setStatus('ready')
      })
      .catch((e) => {
        if (cancelled) return
        setStatus('error')
        setErrorMsg(e?.message || 'Failed to load chart data')
      })
    return () => { cancelled = true }
  }, [decodedSymbol, range])

  // Fetch the pattern overlay once per symbol (cheap — the explain endpoint
  // caches). Skip LLM thesis since we don't render it here.
  useEffect(() => {
    if (!decodedSymbol || !showPatternOverlay) {
      setOverlay(null)
      return
    }
    let cancelled = false
    api.screener.patternsV2Explain(decodedSymbol, false)
      .then((res) => {
        if (cancelled || !res?.suggested?.entry) return
        // Derive direction from pattern_type prefix where possible
        const ptype = res.pattern_type || ''
        const bearTokens = ['head_shoulders', 'double_top', 'triple_top', 'rising_wedge', 'bear_flag', 'bear_pennant', 'desc_triangle']
        const direction: 'bullish' | 'bearish' | null =
          ptype && bearTokens.some((t) => ptype.includes(t)) ? 'bearish'
            : ptype ? 'bullish' : null
        setOverlay({
          pattern_type: ptype,
          direction,
          detected_at: res.detected_at,
          entry: res.suggested.entry,
          stop: res.suggested.stop,
          target: res.suggested.target1,
          target2: res.suggested.target2,
          rr: res.suggested.risk_reward,
        })
      })
      .catch(() => { if (!cancelled) setOverlay(null) })
    return () => { cancelled = true }
  }, [decodedSymbol, showPatternOverlay])

  // Create the chart once when container mounts
  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: palette.background },
        textColor: palette.text,
        fontFamily: 'monospace',
      },
      grid: {
        vertLines: { color: palette.grid },
        horzLines: { color: palette.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: palette.crosshair, width: 1, style: LineStyle.Dashed },
        horzLine: { color: palette.crosshair, width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: { borderColor: palette.border },
      timeScale: {
        borderColor: palette.border,
        timeVisible: true,
        rightOffset: 4,
      },
      autoSize: true,
    })

    const candle = chart.addCandlestickSeries({
      upColor: palette.up,
      downColor: palette.down,
      borderUpColor: palette.up,
      borderDownColor: palette.down,
      wickUpColor: palette.up,
      wickDownColor: palette.down,
    })
    const volume = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      color: palette.volumeUp,
    })
    // Volume scale lives at the bottom 20% of the chart
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    })
    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0.05, bottom: 0.2 },
    })

    const e21 = chart.addLineSeries({ color: palette.ema21, lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    const e50 = chart.addLineSeries({ color: palette.ema50, lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    const e200 = chart.addLineSeries({ color: palette.ema200, lineWidth: 1, priceLineVisible: false, lastValueVisible: false })

    chartRef.current = chart
    candleSeriesRef.current = candle
    volumeSeriesRef.current = volume
    ema21Ref.current = e21
    ema50Ref.current = e50
    ema200Ref.current = e200

    return () => {
      chart.remove()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  // Feed bars + EMAs into the chart whenever they change
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || !volumeSeriesRef.current) return
    if (!bars || bars.length === 0) return

    const candles: CandlestickData[] = bars.map((b) => ({
      time: dateToTime(b.date),
      open: b.open, high: b.high, low: b.low, close: b.close,
    }))
    candleSeriesRef.current.setData(candles)

    const volumes: HistogramData[] = bars.map((b, i) => {
      const prev = i > 0 ? bars[i - 1].close : b.open
      const up = b.close >= prev
      return {
        time: dateToTime(b.date),
        value: b.volume,
        color: up ? palette.volumeUp : palette.volumeDown,
      }
    })
    volumeSeriesRef.current.setData(volumes)

    const closes = bars.map((b) => b.close)
    const e21 = ema(closes, 21)
    const e50 = ema(closes, 50)
    const e200 = ema(closes, 200)
    const toLine = (vals: number[]): LineData[] =>
      vals.map((v, i) => ({ time: dateToTime(bars[i].date), value: v }))
          .filter((d) => Number.isFinite((d as any).value))

    ema21Ref.current?.setData(showEMA.e21 ? toLine(e21) : [])
    ema50Ref.current?.setData(showEMA.e50 ? toLine(e50) : [])
    ema200Ref.current?.setData(showEMA.e200 ? toLine(e200) : [])

    chartRef.current.timeScale().fitContent()
  }, [bars, showEMA, palette])

  // ── Pattern overlay layer ─────────────────────────────────────────
  // Draw entry/stop/target as horizontal priceLines + a marker on the
  // detection bar. Recompute when overlay state, candle series, or the
  // user's toggle changes. Lines are removed before re-adding so stale
  // levels from a previous symbol don't linger.
  useEffect(() => {
    const series = candleSeriesRef.current
    if (!series) return
    // Always clear previous overlay artefacts first
    for (const line of overlayLinesRef.current) {
      try { series.removePriceLine(line) } catch { /* noop */ }
    }
    overlayLinesRef.current = []
    series.setMarkers([])

    if (!overlay || !showOverlay) return

    const entryLine = series.createPriceLine({
      price: overlay.entry,
      color: palette.crosshair,
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: `Entry ${overlay.entry.toFixed(2)}`,
    })
    const stopLine = series.createPriceLine({
      price: overlay.stop,
      color: palette.down,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `Stop ${overlay.stop.toFixed(2)}`,
    })
    const targetLine = series.createPriceLine({
      price: overlay.target,
      color: palette.up,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `Target ${overlay.target.toFixed(2)} · ${overlay.rr.toFixed(1)}R`,
    })
    overlayLinesRef.current = [entryLine, stopLine, targetLine]

    if (overlay.target2 && overlay.target2 !== overlay.target) {
      const t2 = series.createPriceLine({
        price: overlay.target2,
        color: palette.up,
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: `Target 2 ${overlay.target2.toFixed(2)}`,
      })
      overlayLinesRef.current.push(t2)
    }

    // Marker on detection bar — only add if we can resolve the date
    if (overlay.detected_at) {
      const marker: SeriesMarker<Time> = {
        time: dateToTime(overlay.detected_at.slice(0, 10)),
        position: overlay.direction === 'bearish' ? 'aboveBar' : 'belowBar',
        color: overlay.direction === 'bearish' ? palette.down : palette.up,
        shape: overlay.direction === 'bearish' ? 'arrowDown' : 'arrowUp',
        text: overlay.pattern_type.replace(/_/g, ' '),
      }
      series.setMarkers([marker])
    }
  }, [overlay, showOverlay, palette])

  const last = bars && bars.length > 0 ? bars[bars.length - 1] : null
  const prev = bars && bars.length > 1 ? bars[bars.length - 2] : null
  const change = last && prev ? last.close - prev.close : 0
  const changePct = last && prev && prev.close > 0 ? (change / prev.close) * 100 : 0

  return (
    <div
      className={className}
      style={{
        height, width: '100%', position: 'relative',
        background: palette.background, color: palette.text,
        display: 'flex', flexDirection: 'column',
        border: `1px solid ${palette.border}`, borderRadius: 6,
      }}
    >
      {/* Top header strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderBottom: `1px solid ${palette.border}`,
        fontFamily: 'monospace', fontSize: 12,
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <strong style={{ color: theme === 'dark' ? '#FFFFFF' : '#0A0D14', fontSize: 14 }}>{decodedSymbol}</strong>
          {last && (
            <>
              <span style={{ color: theme === 'dark' ? '#FFFFFF' : '#0A0D14' }}>₹{last.close.toFixed(2)}</span>
              <span style={{ color: change >= 0 ? palette.up : palette.down }}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
              </span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Range toggles */}
          {(Object.keys(RANGE_DAYS) as Array<keyof typeof RANGE_DAYS>).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r as any)}
              style={{
                padding: '2px 8px', fontSize: 11, fontFamily: 'monospace',
                background: range === r ? palette.crosshair : 'transparent',
                color: range === r ? '#FFFFFF' : palette.text,
                border: `1px solid ${range === r ? palette.crosshair : palette.border}`,
                borderRadius: 3, cursor: 'pointer',
              }}
            >
              {r}
            </button>
          ))}
          {/* EMA toggles */}
          <span style={{ marginLeft: 8, opacity: 0.6 }}>EMA:</span>
          {(['e21', 'e50', 'e200'] as const).map((k, i) => {
            const label = ['21', '50', '200'][i]
            const color = [palette.ema21, palette.ema50, palette.ema200][i]
            return (
              <button
                key={k}
                type="button"
                onClick={() => setShowEMA((s) => ({ ...s, [k]: !s[k] }))}
                style={{
                  padding: '2px 6px', fontSize: 11, fontFamily: 'monospace',
                  background: showEMA[k] ? color + '33' : 'transparent',
                  color: showEMA[k] ? color : palette.text + '60',
                  border: `1px solid ${showEMA[k] ? color + '80' : palette.border}`,
                  borderRadius: 3, cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          })}
          {/* Pattern overlay toggle — only meaningful when we have a detection */}
          {overlay && (
            <button
              type="button"
              onClick={() => setShowOverlay((v) => !v)}
              title={`${overlay.pattern_type.replace(/_/g, ' ')} · entry ${overlay.entry.toFixed(2)} · stop ${overlay.stop.toFixed(2)} · target ${overlay.target.toFixed(2)}`}
              style={{
                marginLeft: 8, padding: '2px 8px', fontSize: 11, fontFamily: 'monospace',
                background: showOverlay ? palette.crosshair + '33' : 'transparent',
                color: showOverlay ? palette.crosshair : palette.text + '80',
                border: `1px solid ${showOverlay ? palette.crosshair + '80' : palette.border}`,
                borderRadius: 3, cursor: 'pointer',
              }}
            >
              {showOverlay ? '✓ ' : ''}Pattern
            </button>
          )}
        </div>
      </div>

      {/* Chart container */}
      <div ref={containerRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {status !== 'ready' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: palette.background + 'CC', color: palette.text,
            fontFamily: 'monospace', fontSize: 13, zIndex: 5,
            textAlign: 'center', padding: 24,
          }}>
            {status === 'loading' && `Loading ${decodedSymbol}…`}
            {status === 'empty' && `No price history available for ${decodedSymbol}.`}
            {status === 'error' && `Chart unavailable — ${errorMsg}`}
          </div>
        )}
      </div>
    </div>
  )
}
