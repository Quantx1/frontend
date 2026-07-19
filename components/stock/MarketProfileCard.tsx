'use client'

/**
 * Market Profile (TPO) — time-at-price distribution with Point of Control + 70%
 * Value Area. Horizontal histogram (price on the y-axis). Daily-bracket
 * approximation; honest-empty when data is thin.
 */

import { useEffect, useState } from 'react'
import { AlignLeft } from '@/lib/icons'

import { api } from '@/lib/api'

interface Bin { price: number; tpo: number }
interface Profile { poc: number | null; vah: number | null; val: number | null; profile: Bin[] }

export default function MarketProfileCard({ symbol }: { symbol: string }) {
  const [p, setP] = useState<Profile | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'empty'>('loading')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.screener.marketProfile(symbol, 60)
        if (cancelled) return
        if (r?.poc != null && r.profile?.length) { setP(r as Profile); setState('ok') } else setState('empty')
      } catch { if (!cancelled) setState('empty') }
    })()
    return () => { cancelled = true }
  }, [symbol])

  if (state === 'loading') return <div className="rounded-lg border border-line bg-wrap h-[200px] animate-pulse" />
  if (state === 'empty' || !p) return null

  const maxTpo = Math.max(1, ...p.profile.map((b) => b.tpo))
  const rows = [...p.profile].reverse() // highest price at top
  const inVA = (price: number) => p.val != null && p.vah != null && price >= p.val && price <= p.vah

  return (
    <div className="rounded-lg border border-line bg-wrap px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <AlignLeft className="w-3.5 h-3.5 text-primary" /> Market Profile (TPO)
        </span>
        <span className="text-[10px] text-d-text-muted">
          POC <b className="text-d-text-primary numeric">{p.poc}</b> · VA {p.val}–{p.vah}
        </span>
      </div>
      <div className="space-y-px">
        {rows.map((b) => {
          const isPoc = b.price === p.poc
          const w = Math.round((b.tpo / maxTpo) * 100)
          return (
            <div key={b.price} className="flex items-center gap-2">
              <span className="w-12 text-right text-[9px] numeric text-d-text-muted shrink-0">{b.price}</span>
              <div className="flex-1 h-2.5 rounded-sm overflow-hidden bg-surface-2">
                <div
                  className="h-full rounded-sm"
                  style={{ width: `${w}%`, background: isPoc ? '#FEB113' : inVA(b.price) ? 'var(--color-primary,#00E6A7)' : 'color-mix(in srgb, var(--color-primary,#00E6A7) 35%, transparent)' }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[9px] text-d-text-muted">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: '#FEB113' }} /> POC</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: 'var(--color-primary,#00E6A7)' }} /> Value area (70%)</span>
      </div>
    </div>
  )
}
