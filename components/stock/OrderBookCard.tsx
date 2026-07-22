'use client'

/**
 * Order Book + Liquidity — live L2 depth with deterministic walls/imbalance.
 *
 * Reads GET /api/screener/depth/{symbol} (real broker depth + pure-math
 * analysis — 0 LLM tokens). Honest-empty: renders nothing when no live feed
 * (503), exactly like every other live surface under the Path-A data model.
 * Polls every 5s while mounted (modest; depth is a rate-limited broker quote).
 */

import { useEffect, useRef, useState } from 'react'
import { ArrowLeftRight } from '@/lib/icons'

import { api } from '@/lib/api'

interface Level { price: number; quantity: number; orders: number }
interface DepthResp {
  depth: { bids: Level[]; asks: Level[]; source: string }
  analysis: {
    total_bid_qty: number; total_ask_qty: number; imbalance: number; pressure: string
    best_bid: number | null; best_ask: number | null; spread: number | null; spread_pct: number | null
    bid_wall: Level | null; ask_wall: Level | null
  }
}

const UP = 'var(--color-up)'
const DOWN = 'var(--color-down)'

export default function OrderBookCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<DepthResp | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const r = await api.screener.marketDepth(symbol)
        if (cancelled) return
        setData(r as unknown as DepthResp)
        setState('ok')
      } catch {
        if (!cancelled && state !== 'ok') setState('empty')
      }
    }
    tick()
    timer.current = setInterval(tick, 5000)
    return () => { cancelled = true; if (timer.current) clearInterval(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  if (state === 'loading') return <div className="rounded-[20px] border border-line bg-wrap h-[200px] animate-pulse" />
  if (state === 'empty' || !data) return null // honest: no order book without a live feed

  const a = data.analysis
  const bids = data.depth.bids.slice(0, 5)
  const asks = data.depth.asks.slice(0, 5)
  const maxQty = Math.max(1, ...bids.map((b) => b.quantity), ...asks.map((x) => x.quantity))
  const bidPct = Math.round(((a.imbalance + 1) / 2) * 100) // -1..1 -> 0..100

  return (
    <div className="rounded-[20px] border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-d-text-primary">Order Book</span>
        </div>
        <span className="text-[10px] numeric text-d-text-muted">
          {a.spread != null ? `spread ₹${a.spread}` : ''}{a.spread_pct != null ? ` · ${a.spread_pct}%` : ''}
        </span>
      </div>

      {/* Imbalance bar */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span style={{ color: UP }}>Bids {a.total_bid_qty.toLocaleString('en-IN')}</span>
          <span className="text-d-text-muted uppercase tracking-wider">{a.pressure.replace('_', ' ')}</span>
          <span style={{ color: DOWN }}>{a.total_ask_qty.toLocaleString('en-IN')} Asks</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden flex bg-surface-2">
          <div style={{ width: `${bidPct}%`, background: UP }} />
          <div style={{ width: `${100 - bidPct}%`, background: DOWN }} />
        </div>
      </div>

      {/* Ladder (bids | asks) */}
      <div className="grid grid-cols-2 gap-px bg-line mt-3">
        <Side levels={bids} color={UP} align="left" maxQty={maxQty} wall={a.bid_wall} />
        <Side levels={asks} color={DOWN} align="right" maxQty={maxQty} wall={a.ask_wall} />
      </div>
    </div>
  )
}

function Side({ levels, color, align, maxQty, wall }: {
  levels: Level[]; color: string; align: 'left' | 'right'; maxQty: number; wall: Level | null
}) {
  return (
    <div className="bg-wrap">
      {levels.map((l, i) => {
        const isWall = wall && l.price === wall.price
        return (
          <div key={i} className="relative px-3 py-1.5 overflow-hidden">
            <div
              className="absolute inset-y-0"
              style={{
                width: `${(l.quantity / maxQty) * 100}%`,
                background: `color-mix(in srgb, ${color} 10%, transparent)`,
                [align]: 0,
              }}
            />
            <div className={`relative flex items-center justify-between text-[11px] numeric ${align === 'right' ? 'flex-row-reverse' : ''}`}>
              <span style={{ color }} className={isWall ? 'font-bold' : 'font-medium'}>{l.price.toFixed(2)}</span>
              <span className="text-d-text-secondary">{l.quantity.toLocaleString('en-IN')}{isWall ? ' ◀ wall' : ''}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
