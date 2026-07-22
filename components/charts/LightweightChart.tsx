'use client'

/**
 * LightweightChart (PR-S16, terminal upgrade 2026-07-21) — TradingView
 * Lightweight Charts wrapped around our own OHLCV data.
 *
 * Drop-in replacement for the legacy TradingViewWidget (`tv.js`) which
 * gated NSE data behind a paywall. Same TradingView look-and-feel, but the
 * candles come from /api/screener/prices/{sym}/history (our Kite/jugaad/
 * yfinance pipeline) so we never hit a "this symbol is only on
 * TradingView" upsell.
 *
 * Terminal feature set:
 *   * Candles / Line / Area chart types
 *   * Volume histogram pane
 *   * Ranges 1W → ALL (backend serves up to "max" period)
 *   * D / W / M intervals (client-side aggregation of daily bars)
 *   * EMA 21 + 50 + 200 overlays with warm-up fetch (correct at left edge)
 *   * Log / linear price scale
 *   * TradingView-style OHLC crosshair legend (ref-driven, no re-renders)
 *   * Pattern overlay: entry/stop/target price lines + detection marker
 *
 * Bare minimum API stays caller-compatible:
 *   <LightweightChart symbol="RELIANCE" height={520} />
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  PriceScaleMode,
  createChart,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type LineData,
  type MouseEventParams,
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
  defaultRange?: '1W' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '2Y' | '5Y' | 'ALL'
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

type RangeKey = '1W' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '2Y' | '5Y' | 'ALL'
type IntervalKey = 'D' | 'W' | 'M'
type ChartType = 'candles' | 'line' | 'area'

const RANGE_DAYS: Record<Exclude<RangeKey, 'YTD'>, number> = {
  '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '2Y': 730, '5Y': 1825, 'ALL': 7300,
}
const RANGE_ORDER: RangeKey[] = ['1W', '1M', '3M', '6M', 'YTD', '1Y', '2Y', '5Y', 'ALL']

/** Extra daily bars fetched beyond the visible window so EMA 200 is
 *  already warmed up at the left edge of the requested range. */
const EMA_WARMUP_BARS = 300

function rangeToDays(range: RangeKey): number {
  if (range === 'YTD') {
    const jan1 = new Date(new Date().getFullYear(), 0, 1).getTime()
    return Math.max(7, Math.ceil((Date.now() - jan1) / 86_400_000))
  }
  return RANGE_DAYS[range]
}

/** Sensible default interval for a range — daily until charts get dense. */
function autoInterval(range: RangeKey): IntervalKey {
  if (range === 'ALL') return 'M'
  if (range === '5Y') return 'W'
  return 'D'
}

// Theme colors aligned with Quant X tokens (see globals.css).
const PALETTE = {
  dark: {
    background: '#151517',
    text: '#96969E',
    grid: '#FFFFFF0F',
    border: '#29292D',
    primary: '#406AE4',
    crosshair: '#8FB0FF',
    up: '#10B981',
    down: '#F5808C',
    volumeUp: '#10B98140',
    volumeDown: '#F5808C40',
    ema21: '#8FB0FF',
    ema50: '#F0A94F',
    ema200: '#5290F4',
    strongText: '#F7F7F8',
  },
  light: {
    background: '#FFFFFF',
    text: '#5F6B75',
    grid: '#1D1D1D0F',
    border: '#D5DEF4',
    primary: '#406AE4',
    crosshair: '#406AE4',
    up: '#0A6B50',
    down: '#B81C22',
    volumeUp: '#0A6B5040',
    volumeDown: '#B81C2240',
    ema21: '#406AE4',
    ema50: '#9A4D00',
    ema200: '#2563EB',
    strongText: '#1D1D1D',
  },
}

type Palette = (typeof PALETTE)['dark']

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

/** Aggregate daily bars into weekly (ISO week) or monthly bars.
 *  time = first session of the bucket, OHLC merged, volume summed. */
function aggregateBars(daily: OHLCBar[], interval: IntervalKey): OHLCBar[] {
  if (interval === 'D' || daily.length === 0) return daily
  const keyOf = (d: string): string => {
    if (interval === 'M') return d.slice(0, 7)
    // ISO week key: year + week number
    const dt = new Date(d + 'T00:00:00Z')
    const day = (dt.getUTCDay() + 6) % 7 // Mon=0
    const thursday = new Date(dt)
    thursday.setUTCDate(dt.getUTCDate() - day + 3)
    const jan1 = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1))
    const week = Math.ceil(((thursday.getTime() - jan1.getTime()) / 86_400_000 + 1) / 7)
    return `${thursday.getUTCFullYear()}-W${week}`
  }
  const out: OHLCBar[] = []
  let cur: OHLCBar | null = null
  let curKey = ''
  for (const b of daily) {
    const k = keyOf(b.date)
    if (!cur || k !== curKey) {
      if (cur) out.push(cur)
      cur = { ...b }
      curKey = k
    } else {
      cur.high = Math.max(cur.high, b.high)
      cur.low = Math.min(cur.low, b.low)
      cur.close = b.close
      cur.volume += b.volume
    }
  }
  if (cur) out.push(cur)
  return out
}

/** Snap an ISO date to the covering aggregated bar's time (last bar whose
 *  date <= target) so markers land on a real bar in W/M intervals. */
function snapToBar(dateStr: string, bars: OHLCBar[]): string | null {
  let best: string | null = null
  for (const b of bars) {
    if (b.date <= dateStr) best = b.date
    else break
  }
  return best
}

const fmtVol = (v: number): string =>
  v >= 1e7 ? `${(v / 1e7).toFixed(2)}Cr` : v >= 1e5 ? `${(v / 1e5).toFixed(2)}L` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : String(v)

/** Paint the TradingView-style OHLC legend straight into the DOM (safe
 *  createElement/textContent nodes only) so mousemove never re-renders
 *  React. */
function paintLegend(el: HTMLElement | null, b: OHLCBar | null, palette: Palette): void {
  if (!el) return
  el.textContent = ''
  if (!b) return
  const chg = b.close - b.open
  const pct = b.open > 0 ? (chg / b.open) * 100 : 0
  const addPair = (label: string, value: string, color?: string) => {
    const l = document.createElement('span')
    l.textContent = `${label} `
    l.style.opacity = '0.55'
    const v = document.createElement('span')
    v.textContent = `${value}  `
    if (color) v.style.color = color
    el.append(l, v)
  }
  addPair('O', b.open.toFixed(2))
  addPair('H', b.high.toFixed(2))
  addPair('L', b.low.toFixed(2))
  addPair(
    'C',
    `${b.close.toFixed(2)} ${chg >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
    chg >= 0 ? palette.up : palette.down,
  )
  addPair('Vol', fmtVol(b.volume))
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
  const legendRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const ema21Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ema50Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ema200Ref = useRef<ISeriesApi<'Line'> | null>(null)
  // Held-onto price-line handles so we can remove old ones when the
  // pattern overlay changes (e.g. user swaps symbol).
  const overlayLinesRef = useRef<IPriceLine[]>([])
  // Displayed bars mirrored into a ref so the crosshair handler (bound
  // once per chart) can read them without re-subscribing.
  const displayBarsRef = useRef<OHLCBar[]>([])

  const [range, setRange] = useState<RangeKey>(defaultRange)
  const [interval, setBarInterval] = useState<IntervalKey>(autoInterval(defaultRange))
  const [chartType, setChartType] = useState<ChartType>('candles')
  const [logScale, setLogScale] = useState(false)
  const [rawBars, setRawBars] = useState<OHLCBar[] | null>(null)
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
  // "M%26M" for the NSE ticker "M&M").
  const decodedSymbol = useMemo(() => {
    try { return decodeURIComponent(symbol) } catch { return symbol }
  }, [symbol])

  // Fetch daily bars whenever symbol or range changes. We over-fetch by
  // EMA_WARMUP_BARS so the 200-EMA is already correct at the left edge of
  // the visible window, then clamp the viewport below.
  useEffect(() => {
    if (!decodedSymbol) return
    let cancelled = false
    setStatus('loading')
    setErrorMsg('')
    const fetchDays = Math.min(7300, rangeToDays(range) + EMA_WARMUP_BARS)
    api.screener.getStockHistory(decodedSymbol, fetchDays)
      .then((res: any) => {
        if (cancelled) return
        const hist: OHLCBar[] = res?.history || []
        if (hist.length === 0) {
          setStatus('empty')
          setRawBars(null)
          return
        }
        setRawBars(hist)
        setStatus('ready')
      })
      .catch((e) => {
        if (cancelled) return
        setStatus('error')
        setErrorMsg(e?.message || 'Failed to load chart data')
      })
    return () => { cancelled = true }
  }, [decodedSymbol, range])

  // Range change picks a sensible interval (user can override afterwards).
  useEffect(() => { setBarInterval(autoInterval(range)) }, [range])

  // Aggregate to the selected interval.
  const bars = useMemo(
    () => (rawBars ? aggregateBars(rawBars, interval) : null),
    [rawBars, interval],
  )

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

  // Create the chart once when container mounts (re-created on theme flip
  // via the caller's key= remount + this effect's dep).
  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: palette.background },
        textColor: palette.text,
        fontFamily: 'var(--font-geist-mono), monospace',
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
    const line = chart.addLineSeries({
      color: palette.primary, lineWidth: 2,
      priceLineVisible: false, visible: false,
    })
    const area = chart.addAreaSeries({
      lineColor: palette.primary, lineWidth: 2,
      topColor: palette.primary + '40', bottomColor: palette.primary + '00',
      priceLineVisible: false, visible: false,
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
    lineSeriesRef.current = line
    areaSeriesRef.current = area
    volumeSeriesRef.current = volume
    ema21Ref.current = e21
    ema50Ref.current = e50
    ema200Ref.current = e200

    const onCrosshair = (param: MouseEventParams) => {
      const all = displayBarsRef.current
      const lastBar = all.length ? all[all.length - 1] : null
      if (!param.time || !param.point) {
        paintLegend(legendRef.current, lastBar, palette)
        return
      }
      const t = String(param.time)
      const hit = all.find((b) => b.date === t)
      paintLegend(legendRef.current, hit ?? lastBar, palette)
    }
    chart.subscribeCrosshairMove(onCrosshair)

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshair)
      chart.remove()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  // Chart type visibility + scale mode
  useEffect(() => {
    candleSeriesRef.current?.applyOptions({ visible: chartType === 'candles' })
    lineSeriesRef.current?.applyOptions({ visible: chartType === 'line' })
    areaSeriesRef.current?.applyOptions({ visible: chartType === 'area' })
  }, [chartType])
  useEffect(() => {
    chartRef.current?.priceScale('right').applyOptions({
      mode: logScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
    })
  }, [logScale])

  // Feed bars + EMAs into the chart whenever they change
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || !volumeSeriesRef.current) return
    if (!bars || bars.length === 0) return
    displayBarsRef.current = bars

    const candles: CandlestickData[] = bars.map((b) => ({
      time: dateToTime(b.date),
      open: b.open, high: b.high, low: b.low, close: b.close,
    }))
    candleSeriesRef.current.setData(candles)
    const closesLine: LineData[] = bars.map((b) => ({ time: dateToTime(b.date), value: b.close }))
    lineSeriesRef.current?.setData(closesLine)
    areaSeriesRef.current?.setData(closesLine)

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

    // Clamp the viewport to the *requested* window — the warm-up bars stay
    // off-screen to the left (scrollable) but keep EMAs honest.
    const fromMs = Date.now() - rangeToDays(range) * 86_400_000
    const first = bars.find((b) => new Date(b.date + 'T00:00:00Z').getTime() >= fromMs)
    if (range !== 'ALL' && first && first.date !== bars[0].date) {
      chartRef.current.timeScale().setVisibleRange({
        from: dateToTime(first.date),
        to: dateToTime(bars[bars.length - 1].date),
      })
    } else {
      chartRef.current.timeScale().fitContent()
    }

    // Seed the legend with the latest bar
    paintLegend(legendRef.current, bars[bars.length - 1], palette)
  }, [bars, showEMA, palette, range])

  // ── Pattern overlay layer ─────────────────────────────────────────
  // Draw entry/stop/target as horizontal priceLines + a marker on the
  // detection bar. Markers must land on a real bar, so the detection date
  // is snapped to the covering bar in W/M intervals.
  useEffect(() => {
    const series = candleSeriesRef.current
    if (!series) return
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

    if (overlay.detected_at && bars && bars.length) {
      const snapped = snapToBar(overlay.detected_at.slice(0, 10), bars)
      if (snapped) {
        const marker: SeriesMarker<Time> = {
          time: dateToTime(snapped),
          position: overlay.direction === 'bearish' ? 'aboveBar' : 'belowBar',
          color: overlay.direction === 'bearish' ? palette.down : palette.up,
          shape: overlay.direction === 'bearish' ? 'arrowDown' : 'arrowUp',
          text: overlay.pattern_type.replace(/_/g, ' '),
        }
        series.setMarkers([marker])
      }
    }
  }, [overlay, showOverlay, palette, bars])

  const last = bars && bars.length > 0 ? bars[bars.length - 1] : null
  const prev = bars && bars.length > 1 ? bars[bars.length - 2] : null
  const change = last && prev ? last.close - prev.close : 0
  const changePct = last && prev && prev.close > 0 ? (change / prev.close) * 100 : 0

  // Shared pill style for toolbar buttons
  const pill = (active: boolean, activeColor?: string): React.CSSProperties => ({
    padding: '2px 8px', fontSize: 11, fontFamily: 'var(--font-geist-mono), monospace',
    background: active ? (activeColor ?? palette.primary) : 'transparent',
    color: active ? '#FFFFFF' : palette.text,
    border: `1px solid ${active ? (activeColor ?? palette.primary) : palette.border}`,
    borderRadius: 4, cursor: 'pointer', lineHeight: '18px',
  })

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
      {/* Row 1 — identity + OHLC legend */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px 4px', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 12,
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <strong style={{ color: palette.strongText, fontSize: 14 }}>{decodedSymbol}</strong>
          {last && (
            <>
              <span style={{ color: palette.strongText }}>₹{last.close.toFixed(2)}</span>
              <span style={{ color: change >= 0 ? palette.up : palette.down }}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
              </span>
              <span style={{ opacity: 0.5, fontSize: 10 }}>
                {interval === 'D' ? 'Daily' : interval === 'W' ? 'Weekly' : 'Monthly'} · EOD
              </span>
            </>
          )}
        </div>
        <div ref={legendRef} style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
      </div>

      {/* Row 2 — toolbar: ranges · interval · type · EMA · log · pattern */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '4px 12px 8px', borderBottom: `1px solid ${palette.border}`,
        flexWrap: 'wrap', gap: 6, fontFamily: 'var(--font-geist-mono), monospace',
      }}>
        {RANGE_ORDER.map((r) => (
          <button key={r} type="button" onClick={() => setRange(r)} style={pill(range === r)}>
            {r}
          </button>
        ))}

        <span style={{ width: 1, height: 16, background: palette.border, margin: '0 4px' }} />
        {(['D', 'W', 'M'] as const).map((iv) => (
          <button key={iv} type="button" onClick={() => setBarInterval(iv)} style={pill(interval === iv)} title={iv === 'D' ? 'Daily bars' : iv === 'W' ? 'Weekly bars' : 'Monthly bars'}>
            {iv}
          </button>
        ))}

        <span style={{ width: 1, height: 16, background: palette.border, margin: '0 4px' }} />
        {([['candles', 'Candles'], ['line', 'Line'], ['area', 'Area']] as const).map(([t, label]) => (
          <button key={t} type="button" onClick={() => setChartType(t)} style={pill(chartType === t)}>
            {label}
          </button>
        ))}

        <span style={{ width: 1, height: 16, background: palette.border, margin: '0 4px' }} />
        <span style={{ opacity: 0.6, fontSize: 11 }}>EMA</span>
        {(['e21', 'e50', 'e200'] as const).map((k, i) => {
          const label = ['21', '50', '200'][i]
          const color = [palette.ema21, palette.ema50, palette.ema200][i]
          return (
            <button
              key={k}
              type="button"
              onClick={() => setShowEMA((s) => ({ ...s, [k]: !s[k] }))}
              style={{
                padding: '2px 6px', fontSize: 11, fontFamily: 'var(--font-geist-mono), monospace',
                background: showEMA[k] ? color + '33' : 'transparent',
                color: showEMA[k] ? color : palette.text + '60',
                border: `1px solid ${showEMA[k] ? color + '80' : palette.border}`,
                borderRadius: 4, cursor: 'pointer', lineHeight: '18px',
              }}
            >
              {label}
            </button>
          )
        })}

        <button type="button" onClick={() => setLogScale((v) => !v)} style={{ ...pill(logScale), marginLeft: 4 }} title="Logarithmic price scale">
          Log
        </button>

        {overlay && (
          <button
            type="button"
            onClick={() => setShowOverlay((v) => !v)}
            title={`${overlay.pattern_type.replace(/_/g, ' ')} · entry ${overlay.entry.toFixed(2)} · stop ${overlay.stop.toFixed(2)} · target ${overlay.target.toFixed(2)}`}
            style={{
              marginLeft: 4, padding: '2px 8px', fontSize: 11, fontFamily: 'var(--font-geist-mono), monospace',
              background: showOverlay ? palette.crosshair + '33' : 'transparent',
              color: showOverlay ? palette.crosshair : palette.text + '80',
              border: `1px solid ${showOverlay ? palette.crosshair + '80' : palette.border}`,
              borderRadius: 4, cursor: 'pointer', lineHeight: '18px',
            }}
          >
            {showOverlay ? '✓ ' : ''}Pattern
          </button>
        )}
      </div>

      {/* Chart container */}
      <div ref={containerRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {status !== 'ready' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: palette.background + 'CC', color: palette.text,
            fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, zIndex: 5,
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
