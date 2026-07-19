'use client'

/**
 * Trading Patterns — behavioral mining of the user's own closed trades:
 * win-rate by session + best/worst symbols + avg win/loss. Deterministic stats
 * load automatically (0 tokens); the "Discover" button runs the grounded agent
 * for the one-line pattern summary (user-triggered). Honest-empty < 5 trades.
 */

import { useEffect, useState } from 'react'
import { LineChart, Sparkles, Loader2, AlertTriangle } from '@/lib/icons'

import { api } from '@/lib/api'

interface Bucket { label: string; n: number; win_rate: number; total_pnl: number }
interface SymRow { symbol: string; n: number; total_pnl: number }
interface Stats {
  n: number; win_rate?: number; avg_win?: number; avg_loss?: number
  by_session?: Bucket[]; best_symbols?: SymRow[]; worst_symbols?: SymRow[]
}

interface CoachFlag { key: string; label: string; detail: string }

export default function TradePatternsCard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')
  const [busy, setBusy] = useState(false)
  const [coachFlags, setCoachFlags] = useState<CoachFlag[]>([])
  const [coachNote, setCoachNote] = useState<string | null>(null)
  const [coachBusy, setCoachBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.trades.journalInsights(false)
        if (cancelled) return
        if (r?.stats?.n >= 5) { setStats(r.stats); setState('ok') } else setState('empty')
      } catch { if (!cancelled) setState('empty') }
    })()
    ;(async () => {
      try {
        const c = await api.trades.coachReview(false)
        if (!cancelled && c?.flags?.length) setCoachFlags(c.flags)
      } catch { /* honest-empty */ }
    })()
    return () => { cancelled = true }
  }, [])

  const discover = async () => {
    setBusy(true)
    try {
      const r = await api.trades.journalInsights(true)
      setNarrative(r?.narrative || null)
    } catch { /* keep */ } finally { setBusy(false) }
  }

  const coachMe = async () => {
    setCoachBusy(true)
    try {
      const r = await api.trades.coachReview(true)
      setCoachNote(r?.narrative || null)
    } catch { /* keep */ } finally { setCoachBusy(false) }
  }

  if (state === 'loading') return <div className="rounded-lg border border-line bg-wrap h-[120px] animate-pulse" />
  if (state === 'empty' || !stats) return null

  const topSession = stats.by_session?.[0]
  return (
    <div className="rounded-lg border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <LineChart className="w-3.5 h-3.5 text-primary" /> Your Trading Patterns
        </span>
        <button onClick={discover} disabled={busy}
          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline disabled:opacity-50">
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Discover
        </button>
      </div>

      {narrative && <p className="px-4 py-2.5 text-[12px] leading-relaxed text-d-text-secondary border-b border-line">{narrative}</p>}

      <div className="grid grid-cols-2 gap-px bg-line">
        <Stat label="Trades" value={`${stats.n}`} />
        <Stat label="Win rate" value={`${stats.win_rate}%`} />
        <Stat label="Avg win" value={`+${stats.avg_win}`} tone="text-up" />
        <Stat label="Avg loss" value={`${stats.avg_loss}`} tone="text-down" />
      </div>

      {topSession && (
        <div className="px-4 py-2 border-t border-line text-[11px] text-d-text-secondary">
          Best session: <b className="text-d-text-primary">{topSession.label}</b> ({topSession.win_rate}% win, {topSession.n} trades)
        </div>
      )}
      {(stats.best_symbols?.length || stats.worst_symbols?.length) ? (
        <div className="px-4 py-2 border-t border-line flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          {stats.best_symbols?.[0] && <span className="text-up">Best: {stats.best_symbols[0].symbol} (+{stats.best_symbols[0].total_pnl})</span>}
          {stats.worst_symbols?.[0] && <span className="text-down">Worst: {stats.worst_symbols[0].symbol} ({stats.worst_symbols[0].total_pnl})</span>}
        </div>
      ) : null}
      {coachFlags.length > 0 && (
        <div className="border-t border-line">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[10px] uppercase tracking-wider text-d-text-muted">Coach flags</span>
            <button onClick={coachMe} disabled={coachBusy}
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline disabled:opacity-50">
              {coachBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Coach me
            </button>
          </div>
          {coachFlags.map((f) => (
            <div key={f.key} className="flex items-start gap-2 px-4 py-1.5 text-[11px]">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-warning" />
              <span className="text-d-text-secondary">
                <b className="text-warning">{f.label}:</b> {f.detail}
              </span>
            </div>
          ))}
          {coachNote && <p className="px-4 py-2.5 text-[12px] leading-relaxed text-d-text-secondary border-t border-line">{coachNote}</p>}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-wrap px-3 py-2 text-center">
      <div className="text-[9px] uppercase tracking-wider text-d-text-muted">{label}</div>
      <div className={`text-[14px] numeric font-semibold ${tone || 'text-d-text-primary'}`}>{value}</div>
    </div>
  )
}
