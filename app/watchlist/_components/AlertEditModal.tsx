'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, X as XIcon } from '@/lib/icons'
import { api, handleApiError } from '@/lib/api'

import type { Item } from './types'

/* PR 114 — alert edit modal.
 *
 * Two-field modal that posts to PR 112's /api/watchlist/{symbol}/alerts.
 * Backend re-arms the PR 109 debounce on threshold change, so saving
 * here resets the "next crossing fires fresh" state automatically.
 */

type PresetId = 'pct5' | 'pct10' | 'pct5_breakout' | 'pct5_drop' | 'atr1' | 'atr2'

export default function AlertEditModal({
  item,
  onClose,
  onSaved,
}: {
  item: Item
  onClose: () => void
  onSaved: () => void
}) {
  // Mode toggle: absolute ₹ vs relative ±% from current price. Most retail
  // watchlist users think in "alert me if it moves 5%", not "alert me at
  // ₹2,847.20". Relative mode computes the absolute level on save (since
  // the backend stores absolute prices). Disabled when we don't have a
  // live price to anchor the percentage to.
  const live = item.last_price
  const [mode, setMode] = useState<'abs' | 'pct'>('abs')
  const [above, setAbove] = useState<string>(
    item.alert_price_above != null ? String(item.alert_price_above) : '',
  )
  const [below, setBelow] = useState<string>(
    item.alert_price_below != null ? String(item.alert_price_below) : '',
  )
  const [enabled, setEnabled] = useState(Boolean(item.alert_enabled))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // ATR(14) for the ATR-based preset. Fetched lazily on modal open from
  // the public technicals endpoint. Failure is silent — the preset just
  // stays disabled if ATR isn't available.
  const [atr, setAtr] = useState<number | null>(null)
  useEffect(() => {
    let active = true
    api.screener.getTechnicals(item.symbol)
      .then((r: any) => {
        if (!active) return
        if (r && r.success && typeof r.atr === 'number' && r.atr > 0) setAtr(r.atr)
      })
      .catch(() => {})
    return () => { active = false }
  }, [item.symbol])

  // Session-scoped preset memory. Last preset used in this tab is
  // highlighted on next modal open (across symbols). For ATR presets we
  // apply once `atr` actually loads, otherwise we fall back to the
  // closest % preset so users aren't left with empty fields.
  const [activePreset, setActivePreset] = useState<PresetId | null>(null)
  // Per-symbol pin. When checked, saves the preset under a symbol-scoped
  // key so the next open of this symbol reads it back even if global
  // memory has changed (e.g. user picked ATR for ETFs but ±5% globally
  // for individual stocks).
  const [pinPerSymbol, setPinPerSymbol] = useState(false)
  useEffect(() => {
    let cancelled = false
    import('@/lib/watchlistPresetMemory').then(({ hasSymbolPreset }) => {
      if (cancelled) return
      setPinPerSymbol(hasSymbolPreset(item.symbol))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [item.symbol])
  // Apply preset only on initial load (when fields are blank), not on
  // every render — otherwise we'd overwrite user-typed values.
  const initialAppliedRef = useRef(false)
  useEffect(() => {
    if (initialAppliedRef.current) return
    if (item.alert_price_above != null || item.alert_price_below != null) {
      initialAppliedRef.current = true
      return
    }
    let cancelled = false
    import('@/lib/watchlistPresetMemory').then(({ loadAlertPreset }) => {
      if (cancelled) return
      const id = loadAlertPreset(item.symbol)
      if (!id) { initialAppliedRef.current = true; return }
      // ATR presets need atr to be loaded; defer until it arrives.
      if ((id === 'atr1' || id === 'atr2') && atr == null) return
      applyPreset(id, /* persist */ false)
      initialAppliedRef.current = true
    }).catch(() => { initialAppliedRef.current = true })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atr])

  const rawAbove = above.trim() === '' ? null : Number(above)
  const rawBelow = below.trim() === '' ? null : Number(below)
  // In percent mode, the inputs are interpreted as ±% from `live`.
  // Backend always receives absolute prices.
  const aboveNum =
    mode === 'pct' && live != null && rawAbove != null && Number.isFinite(rawAbove)
      ? live * (1 + rawAbove / 100)
      : rawAbove
  const belowNum =
    mode === 'pct' && live != null && rawBelow != null && Number.isFinite(rawBelow)
      ? live * (1 - rawBelow / 100)
      : rawBelow
  const aboveValid = aboveNum === null || (Number.isFinite(aboveNum) && aboveNum > 0)
  const belowValid = belowNum === null || (Number.isFinite(belowNum) && belowNum > 0)
  // Percent inputs must be positive in either field — "below = -5%" doesn't
  // make sense (the field is already a downward delta).
  const pctValid =
    mode !== 'pct' ||
    ((rawAbove === null || (Number.isFinite(rawAbove) && rawAbove > 0)) &&
      (rawBelow === null || (Number.isFinite(rawBelow) && rawBelow > 0)))
  const orderingValid =
    aboveNum === null || belowNum === null || aboveNum > belowNum
  const canSave = aboveValid && belowValid && orderingValid && pctValid && !saving

  // Distance preview, recomputed from the resolved absolute numbers so
  // the same logic works in both modes.
  const aboveDist =
    live != null && aboveNum != null && Number.isFinite(aboveNum) && aboveNum > 0
      ? ((aboveNum - live) / live) * 100
      : null
  const belowDist =
    live != null && belowNum != null && Number.isFinite(belowNum) && belowNum > 0
      ? ((live - belowNum) / live) * 100
      : null

  // Single applyPreset to keep state in sync (mode, fields, enabled,
  // activePreset, and optional persistence). Called from the preset
  // buttons and from the auto-apply effect above.
  function applyPreset(id: PresetId, persist: boolean) {
    setActivePreset(id)
    setEnabled(true)
    if (id === 'pct5')           { setMode('pct'); setAbove('5');  setBelow('5')  }
    else if (id === 'pct10')     { setMode('pct'); setAbove('10'); setBelow('10') }
    else if (id === 'pct5_breakout') { setMode('pct'); setAbove('5'); setBelow('') }
    else if (id === 'pct5_drop')     { setMode('pct'); setAbove('');  setBelow('5') }
    else if ((id === 'atr1' || id === 'atr2') && atr != null && live != null) {
      const m = id === 'atr1' ? 1 : 2
      setMode('abs')
      setAbove((live + m * atr).toFixed(2))
      setBelow((live - m * atr).toFixed(2))
    }
    if (persist) {
      import('@/lib/watchlistPresetMemory').then((m) => {
        // Always update global so the next new-symbol add inherits it.
        m.saveAlertPreset(id)
        // Plus per-symbol if the user has pinned this symbol.
        if (pinPerSymbol) {
          m.saveAlertPreset(id, { symbol: item.symbol, perSymbol: true })
          // Keep server in sync so the new preset choice overrides
          // what's stored cross-device.
          m.syncSymbolPinToServer(item.symbol, id)
        }
      }).catch(() => {})
    }
  }

  const onSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      await api.watchlist.updateAlerts(item.symbol, {
        alert_price_above: aboveNum,
        alert_price_below: belowNum,
        // If the user blanked both thresholds, force-disable; otherwise
        // honor the toggle.
        alert_enabled:
          aboveNum === null && belowNum === null ? false : enabled,
      })
      onSaved()
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const onClear = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.watchlist.updateAlerts(item.symbol, {
        alert_price_above: null,
        alert_price_below: null,
        alert_enabled: false,
      })
      onSaved()
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[20px] border border-d-border bg-main p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-d-text-muted">Alert thresholds</p>
            <h3 className="text-[15px] font-semibold text-d-text-primary mt-0.5">
              {item.symbol}
              {item.last_price != null && (
                <span className="text-d-text-muted text-[12px] font-normal ml-2 numeric">
                  ₹{item.last_price.toFixed(2)}
                </span>
              )}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10"
            aria-label="Close"
          >
            <XIcon className="w-4 h-4 text-d-text-muted" />
          </button>
        </header>

        <div className="space-y-3">
          {/* Absolute ₹ vs relative ±% mode toggle. Disabled entirely
              when we don't have a live price to anchor against. */}
          <div className="flex items-center gap-1 rounded-full border border-d-border p-0.5 w-fit text-[10px]">
            <button
              type="button"
              onClick={() => { setMode('abs'); setAbove(''); setBelow(''); setActivePreset(null) }}
              className={`px-2.5 py-1 rounded-full ${mode === 'abs' ? 'glass-control-accent' : 'text-d-text-muted hover:text-d-text-primary'}`}
            >
              ₹ absolute
            </button>
            <button
              type="button"
              onClick={() => { setMode('pct'); setAbove(''); setBelow(''); setActivePreset(null) }}
              disabled={live == null}
              className={`px-2.5 py-1 rounded-full ${mode === 'pct' ? 'glass-control-accent' : 'text-d-text-muted hover:text-d-text-primary disabled:opacity-40 disabled:cursor-not-allowed'}`}
            >
              ±% from current
            </button>
          </div>

          {/* Quick-pick templates. Single click pre-fills both fields.
              Switches into % mode automatically since the four % templates
              are relative — typing absolute ₹ levels for each symbol
              manually was the slowest part of the flow. ATR-based preset
              uses the symbol's actual 14-day ATR (volatility-aware)
              instead of a fixed % so a slow large-cap and a fast mid-cap
              don't share the same trigger distance. Falls back to
              disabled when ATR unavailable. */}
          {live != null && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-d-text-muted mb-1">Quick presets</p>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: 'pct5' as const,           label: '±5%' },
                  { id: 'pct10' as const,          label: '±10%' },
                  { id: 'pct5_breakout' as const,  label: '+5% breakout' },
                  { id: 'pct5_drop' as const,      label: '−5% drop' },
                ]).map((t) => {
                  const isActive = activePreset === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyPreset(t.id, true)}
                      className={`px-2.5 py-1 rounded-full text-[10px] transition-colors ${
                        isActive
                          ? 'glass-control-accent'
                          : 'glass-control text-d-text-secondary hover:text-d-text-primary'
                      }`}
                    >
                      {t.label}
                    </button>
                  )
                })}
                {atr != null && atr > 0 && live != null && (
                  <>
                    {([
                      { id: 'atr1' as const, label: '±1× ATR', mult: 1 },
                      { id: 'atr2' as const, label: '±2× ATR', mult: 2 },
                    ]).map((t) => {
                      const isActive = activePreset === t.id
                      return (
                        <button
                          key={t.id}
                          type="button"
                          title={`ATR(14) = ₹${atr.toFixed(2)} · ±${t.mult}× ATR`}
                          onClick={() => applyPreset(t.id, true)}
                          className={`px-2.5 py-1 rounded-full text-[10px] transition-colors ${
                            isActive
                              ? 'glass-control-accent'
                              : 'glass-control text-primary'
                          }`}
                        >
                          {t.label}
                        </button>
                      )
                    })}
                  </>
                )}
              </div>
              {atr != null && atr > 0 && (
                <p className="text-[10px] text-d-text-muted mt-1 numeric">
                  ATR(14) = ₹{atr.toFixed(2)} ({((atr / live!) * 100).toFixed(2)}% of price)
                </p>
              )}
              {/* Per-symbol pin. Off by default — global memory is the
                  right behavior for most users. Power-user opt-in. */}
              <label className="mt-2 flex items-center gap-1.5 text-[10px] text-d-text-muted cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={pinPerSymbol}
                  onChange={(e) => {
                    const next = e.target.checked
                    setPinPerSymbol(next)
                    import('@/lib/watchlistPresetMemory').then((m) => {
                      if (next && activePreset) {
                        m.saveAlertPreset(activePreset, { symbol: item.symbol, perSymbol: true })
                        m.syncSymbolPinToServer(item.symbol, activePreset)
                      } else if (!next) {
                        m.clearSymbolPreset(item.symbol)
                        m.syncSymbolPinToServer(item.symbol, null)
                      }
                    }).catch(() => {})
                  }}
                  className="accent-primary"
                />
                Pin this preset to {item.symbol} (syncs across devices)
              </label>
            </div>
          )}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-d-text-muted mb-1">
              {mode === 'pct' ? 'Notify on % gain above current' : 'Notify when price goes above'}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-d-text-muted">{mode === 'pct' ? '+' : '₹'}</span>
              <input
                type="number"
                inputMode="decimal"
                step={mode === 'pct' ? '0.1' : '0.01'}
                value={above}
                onChange={(e) => { setAbove(e.target.value); setActivePreset(null) }}
                placeholder={mode === 'pct' ? 'e.g. 5 = +5% above' : 'leave blank to disable'}
                className="numeric flex-1 bg-main border border-d-border rounded-xl px-3 py-1.5 text-[13px] text-d-text-primary placeholder:text-d-text-muted focus:outline-none focus:border-primary/50"
              />
              {mode === 'pct' && <span className="text-[12px] text-d-text-muted">%</span>}
            </div>
            {mode === 'pct' && aboveNum !== null && aboveValid && live != null && (
              <p className="text-[10px] mt-1 text-d-text-muted numeric">
                = ₹{aboveNum.toFixed(2)}
              </p>
            )}
            {mode === 'abs' && aboveDist !== null && aboveValid && (
              <p className={`text-[10px] mt-1 numeric ${aboveDist < 1 ? 'text-warning' : 'text-d-text-muted'}`}>
                {aboveDist <= 0
                  ? `Already ${Math.abs(aboveDist).toFixed(2)}% past threshold, fires on next tick`
                  : `${aboveDist.toFixed(2)}% above current ₹${live!.toFixed(2)}`}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-d-text-muted mb-1">
              {mode === 'pct' ? 'Notify on % drop below current' : 'Notify when price drops below'}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-d-text-muted">{mode === 'pct' ? '−' : '₹'}</span>
              <input
                type="number"
                inputMode="decimal"
                step={mode === 'pct' ? '0.1' : '0.01'}
                value={below}
                onChange={(e) => { setBelow(e.target.value); setActivePreset(null) }}
                placeholder={mode === 'pct' ? 'e.g. 5 = −5% below' : 'leave blank to disable'}
                className="numeric flex-1 bg-main border border-d-border rounded-xl px-3 py-1.5 text-[13px] text-d-text-primary placeholder:text-d-text-muted focus:outline-none focus:border-primary/50"
              />
              {mode === 'pct' && <span className="text-[12px] text-d-text-muted">%</span>}
            </div>
            {mode === 'pct' && belowNum !== null && belowValid && live != null && (
              <p className="text-[10px] mt-1 text-d-text-muted numeric">
                = ₹{belowNum.toFixed(2)}
              </p>
            )}
            {mode === 'abs' && belowDist !== null && belowValid && (
              <p className={`text-[10px] mt-1 numeric ${belowDist < 1 ? 'text-warning' : 'text-d-text-muted'}`}>
                {belowDist <= 0
                  ? `Already ${Math.abs(belowDist).toFixed(2)}% past threshold, fires on next tick`
                  : `${belowDist.toFixed(2)}% below current ₹${live!.toFixed(2)}`}
              </p>
            )}
          </div>
          {!pctValid && (
            <p className="text-[11px] text-down">
              Percent values must be positive. Use the toggle above to switch modes.
            </p>
          )}
          {!orderingValid && (
            <p className="text-[11px] text-down">
              Above must be greater than below.
            </p>
          )}
          <label className="flex items-center gap-2 text-[12px] text-d-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="accent-primary"
            />
            Alerts enabled
          </label>
        </div>

        {error && (
          <div className="rounded border border-down/30 bg-down/[0.08] p-2 text-[11px] text-down">
            {error}
          </div>
        )}

        <p className="text-[10px] text-d-text-muted">
          Saving with a new threshold re-arms the alert — the next crossing fires fresh,
          even if you previously hit this level.
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={saving}
            className="flex-1 py-2 text-[12px] text-d-text-muted glass-control rounded-full disabled:opacity-50"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium glass-control-accent rounded-full active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
