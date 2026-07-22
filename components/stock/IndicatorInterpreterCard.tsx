'use client'

/**
 * Indicator Interpreter — RSI / MACD / ADX / trend / volume translated into
 * plain English, with an overall bias. Deterministic reads (no LLM by default);
 * honest-empty when indicators can't be computed.
 */

import { useEffect, useState } from 'react'
import { Brain } from '@/lib/icons'

import { api } from '@/lib/api'

interface Note { indicator: string; value: number | null; signal: string; read: string }

const SIG_COLOR: Record<string, string> = {
  bullish: 'var(--color-up)', oversold: 'var(--color-up)',
  bearish: 'var(--color-down)', overbought: 'var(--color-down)',
  high: 'var(--color-primary-text)', neutral: 'var(--color-muted)',
}
const BIAS: Record<string, { label: string; color: string }> = {
  bullish: { label: 'Bullish', color: 'var(--color-up)' },
  bearish: { label: 'Bearish', color: 'var(--color-down)' },
  mixed: { label: 'Mixed', color: 'var(--color-warning)' },
}

export default function IndicatorInterpreterCard({ symbol }: { symbol: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [bias, setBias] = useState('mixed')
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.screener.interpretIndicators(symbol, false)
        if (cancelled) return
        if (r?.indicators?.length) { setNotes(r.indicators); setBias(r.bias); setState('ok') } else setState('empty')
      } catch { if (!cancelled) setState('empty') }
    })()
    return () => { cancelled = true }
  }, [symbol])

  if (state === 'loading') return <div className="rounded-[20px] border border-line bg-wrap h-[140px] animate-pulse" />
  if (state === 'empty') return null

  const b = BIAS[bias] || BIAS.mixed
  return (
    <div className="rounded-[20px] border border-line bg-wrap overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <Brain className="w-3.5 h-3.5 text-primary" /> What the indicators say
        </span>
        <span
          className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ color: b.color, background: `color-mix(in srgb, ${b.color} 10%, transparent)` }}
        >
          {b.label}
        </span>
      </div>
      <div className="divide-y divide-line">
        {notes.map((n) => (
          <div key={n.indicator} className="flex items-start gap-2.5 px-4 py-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SIG_COLOR[n.signal] || 'var(--color-muted)' }} />
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-d-text-primary">{n.indicator}</span>
              {n.value != null && <span className="ml-1.5 text-[10px] numeric text-d-text-muted">{n.value}</span>}
              <p className="text-[11.5px] text-d-text-secondary leading-snug">{n.read}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
