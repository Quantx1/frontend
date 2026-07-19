'use client'

/**
 * PayoffCalculator (PR-S20) — standalone multi-leg option payoff explorer.
 *
 * Wraps the existing PayoffDiagram component with a leg builder UI so
 * any trader can model a custom strategy without opening the deep
 * /fo-strategies workspace.
 *
 * Spot + lot-size dropdowns drive the calculation; user adds up to 4
 * legs (matching the broker leg-cap in the paper executor). Diagram
 * updates live as legs change.
 */

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Plus, Trash2 } from '@/lib/icons'

import { Badge, Button } from '@/components/foundation'
import { api } from '@/lib/api'
import PayoffDiagram from '@/components/strategy/PayoffDiagram'

interface Leg {
  id: string
  strike: number
  option_type: 'CE' | 'PE'
  direction: 'BUY' | 'SELL'
  lots: number
  entry_price: number
}

const SYMBOL_DEFAULTS: Record<string, { spot: number; step: number }> = {
  NIFTY:     { spot: 24000, step: 50 },
  BANKNIFTY: { spot: 51000, step: 100 },
  FINNIFTY:  { spot: 23000, step: 50 },
  MIDCPNIFTY:{ spot: 13000, step: 25 },
}


export default function PayoffCalculator() {
  const [symbol, setSymbol] = useState<keyof typeof SYMBOL_DEFAULTS>('NIFTY')
  const [spotPrice, setSpotPrice] = useState(SYMBOL_DEFAULTS.NIFTY.spot)
  const [legs, setLegs] = useState<Leg[]>([
    { id: '1', strike: 24000, option_type: 'CE', direction: 'SELL', lots: 1, entry_price: 120 },
    { id: '2', strike: 24000, option_type: 'PE', direction: 'SELL', lots: 1, entry_price: 130 },
  ])
  // O.6 — scenario analyzer state (spot shift + IV multiplier).
  const [spotShiftPct, setSpotShiftPct] = useState(0)
  const [ivMult, setIvMult] = useState(1.0)
  const adjustedSpot = useMemo(
    () => spotPrice * (1 + spotShiftPct / 100),
    [spotPrice, spotShiftPct],
  )
  const adjustedLegs = useMemo(
    () => legs.map((l) => ({ ...l, entry_price: l.entry_price * ivMult })),
    [legs, ivMult],
  )

  const { data: lotData } = useSWR('fno_lot_sizes', () => api.screener.fnoLotSizes(), {
    revalidateOnFocus: false, dedupingInterval: 86_400_000,
  })

  const lotSize = lotData?.lot_sizes?.[symbol] ?? 65

  const onSymbolChange = (s: keyof typeof SYMBOL_DEFAULTS) => {
    setSymbol(s)
    setSpotPrice(SYMBOL_DEFAULTS[s].spot)
    // Round all leg strikes to the new step
    const step = SYMBOL_DEFAULTS[s].step
    setLegs((prev) => prev.map((l) => ({ ...l, strike: Math.round(l.strike / step) * step })))
  }

  const updateLeg = (id: string, patch: Partial<Leg>) => {
    setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  const addLeg = () => {
    if (legs.length >= 4) return
    setLegs([...legs, {
      id: String(Date.now()),
      strike: spotPrice,
      option_type: 'CE',
      direction: 'BUY',
      lots: 1,
      entry_price: 50,
    }])
  }

  const removeLeg = (id: string) => {
    setLegs((prev) => prev.filter((l) => l.id !== id))
  }

  const netPremium = useMemo(() =>
    legs.reduce((sum, l) => sum + (l.direction === 'BUY' ? -1 : 1) * l.entry_price * l.lots * lotSize, 0)
  , [legs, lotSize])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <aside className="lg:col-span-2 space-y-3">
        {/* Symbol + spot */}
        <div className="rounded-xl border border-line bg-wrap p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">Underlying</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(SYMBOL_DEFAULTS).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSymbolChange(s as keyof typeof SYMBOL_DEFAULTS)}
                className={`rounded-md border px-2 py-1 text-[11px] ${
                  symbol === s
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-d-text-muted">Spot ₹</label>
              <input
                type="number"
                value={spotPrice}
                onChange={(e) => setSpotPrice(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-md border border-line bg-main px-2 py-1 text-sm font-mono tabular-nums text-d-text-primary outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-d-text-muted">Lot size</label>
              <input
                type="number"
                value={lotSize}
                disabled
                className="mt-1 w-full rounded-md border border-line bg-wrap-hover px-2 py-1 text-sm font-mono tabular-nums text-d-text-muted"
              />
            </div>
          </div>
        </div>

        {/* Leg builder */}
        <div className="rounded-xl border border-line bg-wrap">
          <header className="flex items-center justify-between border-b border-line px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">Legs ({legs.length}/4)</p>
            <Button size="sm" variant="ghost" onClick={addLeg} disabled={legs.length >= 4}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </header>
          <ul className="divide-y divide-line/40">
            {legs.map((l) => (
              <li key={l.id} className="space-y-2 p-3">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <select
                    value={l.direction}
                    onChange={(e) => updateLeg(l.id, { direction: e.target.value as 'BUY' | 'SELL' })}
                    className="rounded border border-line bg-main px-1.5 py-0.5"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                  <input
                    type="number"
                    value={l.lots}
                    min={1}
                    onChange={(e) => updateLeg(l.id, { lots: Math.max(1, Number(e.target.value)) })}
                    className="w-12 rounded border border-line bg-main px-1.5 py-0.5 font-mono tabular-nums"
                  />
                  <span className="text-[10px] text-d-text-muted">×</span>
                  <input
                    type="number"
                    value={l.strike}
                    step={SYMBOL_DEFAULTS[symbol].step}
                    onChange={(e) => updateLeg(l.id, { strike: Number(e.target.value) || 0 })}
                    className="w-20 rounded border border-line bg-main px-1.5 py-0.5 font-mono tabular-nums"
                  />
                  <select
                    value={l.option_type}
                    onChange={(e) => updateLeg(l.id, { option_type: e.target.value as 'CE' | 'PE' })}
                    className="rounded border border-line bg-main px-1.5 py-0.5"
                  >
                    <option value="CE">CE</option>
                    <option value="PE">PE</option>
                  </select>
                  <Button size="sm" variant="ghost" onClick={() => removeLeg(l.id)} aria-label="Remove leg">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <label className="text-d-text-muted">Premium ₹</label>
                  <input
                    type="number"
                    step="0.05"
                    value={l.entry_price}
                    onChange={(e) => updateLeg(l.id, { entry_price: Number(e.target.value) || 0 })}
                    className="w-20 rounded border border-line bg-main px-1.5 py-0.5 font-mono tabular-nums"
                  />
                </div>
              </li>
            ))}
          </ul>
          <footer className="flex items-center justify-between border-t border-line px-3 py-2 text-[11px]">
            <span className="text-d-text-muted">Net premium</span>
            <span className={`font-mono tabular-nums ${netPremium >= 0 ? 'text-up' : 'text-down'}`}>
              {netPremium >= 0 ? '+' : ''}₹{Math.abs(netPremium).toLocaleString('en-IN')}
            </span>
          </footer>
        </div>

        {/* O.6 (2026-05-31) — scenario analyzer sliders.
            Adjust spot ±N% to see how the payoff diagram shifts under
            various market moves. Premium slider scales each leg's premium
            (proxy for IV-change since leg premiums move with IV). */}
        <div className="rounded-xl border border-line bg-wrap">
          <header className="border-b border-line px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Scenario analyzer
          </header>
          <div className="space-y-3 p-3">
            <div>
              <div className="flex items-center justify-between text-[11px]">
                <label className="text-d-text-muted">Spot shift</label>
                <span className="font-mono tabular-nums text-d-text-primary">
                  {spotShiftPct >= 0 ? '+' : ''}{spotShiftPct.toFixed(1)}% → ₹{adjustedSpot.toFixed(0)}
                </span>
              </div>
              <input
                type="range"
                min={-10} max={10} step={0.5}
                value={spotShiftPct}
                onChange={(e) => setSpotShiftPct(Number(e.target.value))}
                className="mt-1 w-full accent-primary"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px]">
                <label className="text-d-text-muted">IV shift (premium ×)</label>
                <span className="font-mono tabular-nums text-d-text-primary">
                  {(ivMult * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0.5} max={2.0} step={0.05}
                value={ivMult}
                onChange={(e) => setIvMult(Number(e.target.value))}
                className="mt-1 w-full accent-primary"
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => { setSpotShiftPct(0); setIvMult(1.0) }}
                className="rounded-md border border-line bg-main px-2 py-1 text-[10px] text-d-text-secondary hover:text-d-text-primary"
              >
                Reset scenario
              </button>
              <span className="text-[10px] text-d-text-muted">Diagram updates live</span>
            </div>
          </div>
        </div>

        <Badge tone="muted">
          Educational tool — verify legs in your broker terminal before trading.
        </Badge>
      </aside>

      <section className="lg:col-span-3 rounded-xl border border-line bg-wrap p-3">
        {legs.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-d-text-muted">
            Add at least one leg to see payoff.
          </div>
        ) : (
          <PayoffDiagram
            legs={adjustedLegs.map(({ id: _id, ...rest }) => rest)}
            spotPrice={adjustedSpot}
            lotSize={lotSize}
            label={
              spotShiftPct !== 0 || ivMult !== 1.0
                ? `Scenario: spot ${spotShiftPct >= 0 ? '+' : ''}${spotShiftPct.toFixed(1)}% · IV ${(ivMult * 100).toFixed(0)}%`
                : "Custom strategy"
            }
          />
        )}
      </section>
    </div>
  )
}
