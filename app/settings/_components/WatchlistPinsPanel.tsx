'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2 } from '@/lib/icons'
import { api, handleApiError } from '@/lib/api'

const PRESET_LABEL: Record<string, string> = {
  pct5: '±5%',
  pct10: '±10%',
  pct5_breakout: '+5% breakout',
  pct5_drop: '−5% drop',
  atr1: '±1× ATR',
  atr2: '±2× ATR',
}

export default function WatchlistPinsPanel() {
  const [pins, setPins] = useState<Record<string, string> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [watchlist, setWatchlist] = useState<string[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkPreset, setBulkPreset] = useState<string>('atr2')
  const [bulkFilter, setBulkFilter] = useState('')
  // Undo state. Bulk-apply overwrites existing per-symbol pins, which is
  // destructive — the snapshot lets the user recover for ~10s.
  const [undoSnapshot, setUndoSnapshot] = useState<Record<string, string> | null>(null)
  const [undoCountdown, setUndoCountdown] = useState(0)

  const reload = async () => {
    try {
      const r = await api.user.getUIPreferences()
      const p = (r?.ui_preferences?.watchlist_preset_pins || {}) as Record<string, string>
      setPins(p)
    } catch (err) {
      setError(handleApiError(err))
    }
  }
  useEffect(() => { void reload() }, [])

  const loadWatchlist = async () => {
    try {
      const r = await api.watchlist.getAll()
      const symbols = (r.watchlist || [])
        .map((w) => String(w.symbol || '').toUpperCase())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
      setWatchlist(symbols)
    } catch (err) {
      setError(handleApiError(err))
    }
  }
  const openBulk = async () => {
    setBulkOpen(true)
    setSelected(new Set())
    setBulkFilter('')
    if (watchlist === null) await loadWatchlist()
  }
  const toggleSelected = (sym: string) => {
    const next = new Set(selected)
    if (next.has(sym)) next.delete(sym)
    else next.add(sym)
    setSelected(next)
  }
  // Select-all targets the filtered subset so a user can narrow with the
  // search box and bulk-pick just that group.
  const filteredWatchlist = (() => {
    if (!watchlist) return [] as string[]
    const q = bulkFilter.trim().toUpperCase()
    if (!q) return watchlist
    return watchlist.filter((s) => s.includes(q))
  })()
  const selectAll = () => setSelected(new Set(filteredWatchlist))
  const selectNone = () => setSelected(new Set())
  const applyBulk = async () => {
    if (selected.size === 0) return
    setBusy(true)
    setError(null)
    try {
      const r = await api.user.getUIPreferences()
      const before = { ...((r?.ui_preferences?.watchlist_preset_pins || {}) as Record<string, string>) }
      const cur = { ...before }
      Array.from(selected).forEach((sym) => { cur[sym] = bulkPreset })
      const merged = { ...(r?.ui_preferences || {}), watchlist_preset_pins: cur }
      await api.user.updateUIPreferences(merged)
      // Mirror to sessionStorage so an immediate watchlist visit picks
      // them up without a tab reload.
      try {
        const m = await import('@/lib/watchlistPresetMemory')
        Array.from(selected).forEach((sym) => {
          m.saveAlertPreset(bulkPreset as any, { symbol: sym, perSymbol: true })
        })
      } catch {}
      setPins(cur)
      setBulkOpen(false)
      setUndoSnapshot(before)
      setUndoCountdown(10)
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setBusy(false)
    }
  }

  // Undo countdown timer. Clears the snapshot when it hits 0.
  useEffect(() => {
    if (undoCountdown <= 0) {
      if (undoSnapshot) setUndoSnapshot(null)
      return
    }
    const t = setTimeout(() => setUndoCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoCountdown])

  const undoBulk = async () => {
    if (!undoSnapshot) return
    setBusy(true)
    setError(null)
    try {
      const r = await api.user.getUIPreferences()
      const merged = { ...(r?.ui_preferences || {}), watchlist_preset_pins: undoSnapshot }
      await api.user.updateUIPreferences(merged)
      // Reconcile sessionStorage: clear keys that were added, restore
      // keys that were overwritten with their prior value.
      try {
        const m = await import('@/lib/watchlistPresetMemory')
        const cur = (await api.user.getUIPreferences())?.ui_preferences?.watchlist_preset_pins || {}
        for (const sym of Object.keys(cur)) {
          if (!(sym in undoSnapshot)) m.clearSymbolPreset(sym)
        }
        for (const [sym, pid] of Object.entries(undoSnapshot)) {
          m.saveAlertPreset(pid as any, { symbol: sym, perSymbol: true })
        }
      } catch {}
      setPins(undoSnapshot)
      setUndoSnapshot(null)
      setUndoCountdown(0)
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setBusy(false)
    }
  }

  const removeOne = async (symbol: string) => {
    if (!pins) return
    setBusy(true)
    setError(null)
    try {
      const next = { ...pins }
      delete next[symbol]
      const r = await api.user.getUIPreferences()
      const merged = { ...(r?.ui_preferences || {}), watchlist_preset_pins: next }
      await api.user.updateUIPreferences(merged)
      setPins(next)
      // Drop the per-tab sessionStorage entry so the next modal open for
      // this symbol doesn't auto-apply the deleted pin.
      try {
        const m = await import('@/lib/watchlistPresetMemory')
        m.clearSymbolPreset(symbol)
      } catch {}
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setBusy(false)
    }
  }

  const clearAll = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await api.user.getUIPreferences()
      const merged = { ...(r?.ui_preferences || {}), watchlist_preset_pins: {} }
      await api.user.updateUIPreferences(merged)
      if (pins) {
        try {
          const m = await import('@/lib/watchlistPresetMemory')
          for (const sym of Object.keys(pins)) m.clearSymbolPreset(sym)
        } catch {}
      }
      setPins({})
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setBusy(false)
    }
  }

  if (pins === null) {
    return (
      <div className="p-4 bg-main border border-line rounded-sm">
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
      </div>
    )
  }

  const entries = Object.entries(pins)

  return (
    <div className="p-4 bg-main border border-line rounded-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-medium text-d-text-primary">Watchlist alert pins</h3>
          <p className="text-[12px] text-d-text-muted">
            Per-symbol presets that override your global default. Synced across devices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openBulk}
            disabled={busy}
            className="text-[11px] text-primary hover:text-primary-hover disabled:opacity-50 transition-colors"
          >
            Bulk apply
          </button>
          {entries.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              disabled={busy}
              className="text-[11px] text-d-text-muted hover:text-down disabled:opacity-50 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {undoSnapshot && undoCountdown > 0 && (
        <div className="rounded-sm border border-primary/40 bg-primary/[0.06] px-3 py-2 flex items-center justify-between gap-2 text-[12px]">
          <span className="text-d-text-primary">
            Bulk apply saved.{' '}
            <span className="text-d-text-muted">
              Reverts in {undoCountdown}s if you don&apos;t undo.
            </span>
          </span>
          <button
            type="button"
            onClick={undoBulk}
            disabled={busy}
            className="text-[11px] text-primary hover:text-primary-hover disabled:opacity-50 font-medium"
          >
            Undo
          </button>
        </div>
      )}

      {bulkOpen && (
        <div className="rounded-sm border border-line bg-wrap p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-medium text-d-text-primary">Pick symbols + preset</p>
            <button
              type="button"
              onClick={() => setBulkOpen(false)}
              className="text-[11px] text-d-text-muted hover:text-d-text-primary"
            >
              Cancel
            </button>
          </div>
          {watchlist === null ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : watchlist.length === 0 ? (
            <p className="text-[12px] text-d-text-muted">
              Your watchlist is empty. Add symbols first, then come back.
            </p>
          ) : (
            <>
              {watchlist.length > 8 && (
                <input
                  type="text"
                  value={bulkFilter}
                  onChange={(e) => setBulkFilter(e.target.value.toUpperCase())}
                  placeholder="Filter symbols (e.g. NIFTY)"
                  className="w-full bg-main border border-line rounded-sm px-2.5 py-1.5 text-[12px] text-d-text-primary placeholder:text-d-text-muted focus:outline-none focus:border-primary/50 font-mono"
                />
              )}
              <div className="flex items-center gap-2 text-[11px]">
                <button type="button" onClick={selectAll} className="text-d-text-muted hover:text-d-text-primary">
                  Select all{bulkFilter ? ' (filtered)' : ''}
                </button>
                <span className="text-d-text-muted">·</span>
                <button type="button" onClick={selectNone} className="text-d-text-muted hover:text-d-text-primary">
                  None
                </button>
                <span className="ml-auto text-d-text-muted">
                  {selected.size} selected{bulkFilter ? ` · ${filteredWatchlist.length} match` : ''}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-sm border border-line divide-y divide-line">
                {filteredWatchlist.length === 0 ? (
                  <p className="px-2.5 py-2 text-[11px] text-d-text-muted">
                    No symbols match &ldquo;{bulkFilter}&rdquo;.
                  </p>
                ) : filteredWatchlist.map((sym) => (
                  <label key={sym} className="flex items-center gap-2 px-2.5 py-1.5 text-[12px] cursor-pointer hover:bg-hover">
                    <input
                      type="checkbox"
                      checked={selected.has(sym)}
                      onChange={() => toggleSelected(sym)}
                      className="accent-primary"
                    />
                    <span className="font-mono text-d-text-primary">{sym}</span>
                    {pins?.[sym] && (
                      <span className="ml-auto text-[10px] text-d-text-muted">
                        currently: {PRESET_LABEL[pins[sym]] ?? pins[sym]}
                      </span>
                    )}
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-d-text-muted">Preset:</span>
                {(['pct5', 'pct10', 'pct5_breakout', 'pct5_drop', 'atr1', 'atr2'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setBulkPreset(id)}
                    className={`px-2.5 py-1 rounded-sm text-[10px] border transition-colors ${
                      bulkPreset === id
                        ? 'border-primary/60 bg-primary/[0.10] text-primary'
                        : 'border-line text-d-text-secondary hover:bg-hover hover:text-d-text-primary'
                    }`}
                  >
                    {PRESET_LABEL[id]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={applyBulk}
                disabled={busy || selected.size === 0}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium bg-primary text-main rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Pin {PRESET_LABEL[bulkPreset]} to {selected.size} {selected.size === 1 ? 'symbol' : 'symbols'}
              </button>
            </>
          )}
        </div>
      )}
      {entries.length === 0 ? (
        <p className="text-[12px] text-d-text-muted">
          No pins yet. Open any watchlist alert and check &ldquo;Pin this preset to {'{SYMBOL}'}&rdquo; to start.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-sm border border-line">
          {entries.sort(([a], [b]) => a.localeCompare(b)).map(([sym, presetId]) => (
            <li key={sym} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="text-[13px] font-mono text-d-text-primary">{sym}</p>
                <p className="text-[11px] text-d-text-muted">
                  {PRESET_LABEL[presetId] ?? presetId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeOne(sym)}
                disabled={busy}
                className="px-2 py-1 text-[11px] text-d-text-muted hover:text-down disabled:opacity-50 transition-colors"
                aria-label={`Remove pin for ${sym}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className="text-[11px] text-down">{error}</p>
      )}
    </div>
  )
}
