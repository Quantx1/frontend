'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BellOff,
  CalendarDays,
  Minus,
  Pencil,
  Trash2,
  Zap,
} from '@/lib/icons'
import ModelBadge from '@/components/ModelBadge'
import { TradeTicketButton } from '@/components/trade/TradeTicketButton'
import { stockHref } from '@/lib/stock-href'

import type { Item } from './types'
import AlertEditModal from './AlertEditModal'

const CONSENSUS_COLOR: Record<string, string> = {
  bullish: '#05B878',
  bearish: '#FF5947',
  mixed:   '#FEB113',
  neutral: '#8e8e8e',
}

// Theme-aware text token per consensus value (re-derives per theme, WCAG-tuned
// for light). The hex map above is kept only for the faint bg/border tints.
const CONSENSUS_TEXT: Record<string, string> = {
  bullish: 'text-up',
  bearish: 'text-down',
  mixed:   'text-warning',
  neutral: 'text-d-text-muted',
}

export default function WatchCard({
  i,
  onRemove,
  onAlertSaved,
}: {
  i: Item
  onRemove: () => void
  onAlertSaved: () => void
}) {
  const consensus = i.engines?.consensus || 'neutral'
  const consensusColor = CONSENSUS_COLOR[consensus]
  const regime = i.engines?.regime
  const warning = i.engines?.regime_warning || false
  const sentiment = i.engines?.sentiment_score ?? null
  const sig = i.latest_signal
  const earnings = i.upcoming_earnings
  const [editingAlerts, setEditingAlerts] = useState(false)

  const change = i.change_pct
  const changeColorClass = change == null ? 'text-d-text-muted' : change >= 0 ? 'text-up' : 'text-down'

  return (
    <article
      className="rounded-xl border bg-wrap overflow-hidden hover:border-d-border-hover transition-colors"
      style={{ borderLeft: `3px solid ${consensusColor}`, borderColor: '#242838' }}
    >
      {/* Header */}
      <header className="px-4 py-3 border-b border-d-border flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <SymbolLogo symbol={i.symbol} size={30} className="mt-0.5" />
          <div className="min-w-0">
            <Link
              href={stockHref(i.symbol)}
              className="text-[15px] font-semibold text-d-text-primary hover:text-primary"
            >
              {i.symbol}
            </Link>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="numeric text-[14px] font-semibold text-d-text-primary">
                {i.last_price != null ? `₹${i.last_price.toFixed(2)}` : '—'}
              </span>
              <span className={`numeric text-[11px] font-medium ${changeColorClass}`}>
                {change == null ? '' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`inline-flex items-center gap-1 text-[9px] font-semibold tracking-wider uppercase rounded-full px-2 py-0.5 border ${CONSENSUS_TEXT[consensus]}`}
            style={{
              borderColor: `${consensusColor}55`,
              background: `${consensusColor}14`,
            }}
          >
            {consensus === 'bullish' && <ArrowUpRight className="w-2.5 h-2.5" />}
            {consensus === 'bearish' && <ArrowDownRight className="w-2.5 h-2.5" />}
            {(consensus === 'neutral' || consensus === 'mixed') && <Minus className="w-2.5 h-2.5" />}
            {consensus}
          </span>
          <button
            onClick={onRemove}
            className="p-1 rounded border border-d-border text-d-text-muted hover:text-down hover:border-down/40"
            aria-label={`Remove ${i.symbol}`}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Regime warning */}
      {warning && (
        <div className="px-4 py-2 border-b border-d-border bg-warning/5 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
          <p className="text-[10px] text-warning/95 leading-snug">
            Open {sig?.direction} signal conflicts with current{' '}
            <span className="numeric">{regime}</span> regime — consider reducing size.
          </p>
        </div>
      )}

      {/* Engines row */}
      <div className="px-4 py-2.5 border-b border-d-border flex flex-wrap items-center gap-1.5">
        {regime && (
          <span className="inline-flex items-center gap-1">
            <ModelBadge modelKey="regime_detector" size="xs" variant="outline" value={regime} />
          </span>
        )}
        {sentiment != null && (
          <span className="inline-flex items-center gap-1">
            <ModelBadge
              modelKey="sentiment_engine"
              size="xs"
              variant="outline"
              value={`${sentiment >= 0 ? '+' : ''}${sentiment.toFixed(2)}`}
            />
          </span>
        )}
        {i.engines?.swing_direction && i.engines.swing_direction !== 'neutral' && (
          <span className="inline-flex items-center gap-1">
            <ModelBadge
              modelKey="swing_forecast"
              size="xs"
              variant="outline"
              value={i.engines.swing_direction}
            />
          </span>
        )}
      </div>

      {/* Latest signal row */}
      {sig && (
        <div className="px-4 py-2 border-b border-d-border flex items-center gap-2 text-[11px]">
          <Zap className="w-3 h-3 text-primary shrink-0" />
          <span className="text-d-text-muted shrink-0">Latest signal</span>
          <span className="text-d-text-primary font-semibold shrink-0">{sig.direction}</span>
          {sig.entry_price != null && (
            <span className="numeric text-d-text-muted">@ ₹{Number(sig.entry_price).toFixed(2)}</span>
          )}
          <span className="numeric text-d-text-muted ml-auto shrink-0">
            conf {Math.round(sig.confidence)}%
          </span>
          <Link
            href={`/signals/${sig.id}`}
            className="text-primary hover:underline shrink-0"
          >
            View →
          </Link>
        </div>
      )}

      {/* Earnings row */}
      {earnings && (
        <div className="px-4 py-2 border-b border-d-border flex items-center gap-2 text-[11px]">
          <CalendarDays className="w-3 h-3 text-warning shrink-0" />
          <span className="text-d-text-muted">Announce</span>
          <span className="numeric text-d-text-primary font-semibold">
            {new Date(earnings.announce_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      )}

      {/* Footer */}
      <footer className="px-4 py-2 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={stockHref(i.symbol)} className="inline-flex items-center gap-1 text-primary hover:underline shrink-0">
            Open dossier →
          </Link>
          {/* Alert chip is a button that opens the edit modal. The badge
              state still reflects whether thresholds are armed, but a click
              lets the user actually change them. */}
          <button
            type="button"
            onClick={() => setEditingAlerts(true)}
            className="inline-flex items-center gap-1 text-d-text-muted hover:text-d-text-primary transition-colors shrink-0"
          >
            {i.alert_enabled
              ? (<><Bell className="w-3 h-3 text-primary" /> alerts on</>)
              : (<><BellOff className="w-3 h-3" /> alerts off</>)}
            <Pencil className="w-2.5 h-2.5 opacity-60" />
          </button>
        </div>
        <TradeTicketButton
          symbol={i.symbol}
          currentPrice={i.last_price ?? undefined}
          label="Trade"
          size="sm"
          variant="secondary"
        />
      </footer>

      {editingAlerts && (
        <AlertEditModal
          item={i}
          onClose={() => setEditingAlerts(false)}
          onSaved={() => { setEditingAlerts(false); onAlertSaved() }}
        />
      )}
    </article>
  )
}
