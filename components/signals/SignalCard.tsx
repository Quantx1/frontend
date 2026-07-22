'use client'

/**
 * SignalCard — data-dense signal card.
 *
 * Ticker + BUY/SELL pill, a per-symbol mini price chart, Entry / Stop /
 * Target tiles, a confidence meter and R:R + expected-move footer. Click
 * routes to the signal detail page. Layout reference: competitor-research
 * REPORT §19 (signal feed).
 */

import { useRouter } from 'next/navigation'
import useSWR from 'swr'

import { Badge, ChangeBadge, Sparkline } from '@/components/foundation'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import { api } from '@/lib/api'
import { MONO } from '@/lib/tokens'

export interface DisplaySignal {
  id: string
  symbol: string
  exchange?: string
  direction: 'LONG' | 'SHORT'
  entry_price: number
  target_price: number
  stop_loss: number
  confidence: number
  risk_reward: number
  generated_at: string
  status: string
  signal_type?: string
  /** Expiry of the signal's validity window — drives the decay meter. */
  valid_until?: string
  /** Realized return % once closed (target/SL hit). Undefined while open. */
  pnl_pct?: number
}

// Entry → target % (user-facing expected move, signed by direction).
export const expectedMovePct = (s: DisplaySignal): number => {
  if (!s.entry_price || !s.target_price) return 0
  const move = ((s.target_price - s.entry_price) / s.entry_price) * 100
  return s.direction === 'LONG' ? move : -move
}

// Entry → stop % risk (magnitude).
export const riskPct = (s: DisplaySignal): number => {
  if (!s.entry_price || !s.stop_loss) return 0
  return Math.abs(((s.entry_price - s.stop_loss) / s.entry_price) * 100)
}

function timeAgo(iso?: string): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms)) return ''
  const m = Math.floor(ms / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  triggered: 'Triggered',
  executed: 'Live',
  target_hit: 'Target hit',
  stop_loss_hit: 'SL hit',
  sl_hit: 'SL hit',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

export function SignalCard({ s, series }: { s: DisplaySignal; series?: number[] }) {
  const router = useRouter()
  const isLong = s.direction === 'LONG'
  const move = expectedMovePct(s)
  const risk = riskPct(s)

  return (
    <button
      type="button"
      onClick={() => router.push(`/signals/${s.id}`)}
      className="lg-surface lift group w-full rounded-xl p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {/* header — ticker + direction pill */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <SymbolLogo symbol={s.symbol} size={26} />
            <span className="truncate text-[15px] font-bold text-d-text-primary">{s.symbol}</span>
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-d-text-muted">
              {s.exchange ?? 'NSE'}
            </span>
          </div>
          <div className="mt-0.5 text-[10.5px] text-d-text-muted">
            {timeAgo(s.generated_at)}
            {s.status ? ` · ${STATUS_LABEL[s.status] ?? s.status}` : ''}
          </div>
        </div>
        <Badge tone={isLong ? 'buy' : 'sell'}>{isLong ? 'BUY' : 'SELL'}</Badge>
      </div>

      {/* mini chart + confidence */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <SignalSparkline symbol={s.symbol} direction={s.direction} series={series} />
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-d-text-muted">Confidence</div>
          <div className="mt-1 flex items-center justify-end gap-1.5">
            <ConfidenceMini value={s.confidence} />
            <span className={`text-[13px] font-semibold tabular-nums ${MONO} text-d-text-primary`}>
              {Math.round(s.confidence)}%
            </span>
          </div>
        </div>
      </div>

      {/* levels — Entry / Stop / Target */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <LevelTile label="Entry" value={s.entry_price} tone="neutral" />
        <LevelTile label="Stop" value={s.stop_loss} tone="down" sub={risk ? `−${risk.toFixed(1)}%` : undefined} />
        <LevelTile
          label="Target"
          value={s.target_price}
          tone="up"
          sub={move ? `${move >= 0 ? '+' : ''}${move.toFixed(1)}%` : undefined}
        />
      </div>

      {/* decay meter — a signal is a decaying claim, not a static row: it
          fills, closes, or expires at valid_until. */}
      <DecayMeter s={s} />

      {/* footer — R:R + expected move */}
      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-[11px]">
        <span className="text-d-text-muted">
          R:R <span className={`font-semibold text-d-text-primary ${MONO}`}>{s.risk_reward != null ? `1:${s.risk_reward.toFixed(2)}` : '—'}</span>
        </span>
        <ChangeBadge value={move} kind="percent" size="sm" />
      </div>
    </button>
  )
}

/** Signal-freshness meter: elapsed share of the validity window + days left.
 *  Only renders for open signals with a real valid_until. */
function DecayMeter({ s }: { s: DisplaySignal }) {
  if (!s.valid_until || !s.generated_at) return null
  if (!['active', 'triggered', 'executed'].includes(s.status)) return null
  const gen = new Date(s.generated_at).getTime()
  const until = new Date(s.valid_until).getTime()
  const now = Date.now()
  if (!Number.isFinite(gen) || !Number.isFinite(until) || until <= gen) return null
  const elapsed = Math.max(0, Math.min(1, (now - gen) / (until - gen)))
  const daysLeft = Math.max(0, Math.ceil((until - now) / 86_400_000))
  const tone =
    elapsed < 0.5 ? 'var(--color-primary)' : elapsed < 0.8 ? 'var(--color-warning)' : 'var(--color-down)'
  return (
    <div className="mt-2.5">
      <div className="flex items-center justify-between text-[9px] uppercase tracking-wide text-d-text-muted">
        <span>Signal decay</span>
        <span className={MONO}>{daysLeft}d left</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${Math.max(3, elapsed * 100)}%`, background: tone }} />
      </div>
    </div>
  )
}

/** Per-symbol mini trend. When the caller already has a price series it's
 *  passed via `series` (no fetch); otherwise we SWR-fetch 30d closes, keyed by
 *  symbol so duplicate tickers share one request. Public endpoint, no auth. */
function SignalSparkline({
  symbol,
  direction,
  series,
}: {
  symbol: string
  direction: 'LONG' | 'SHORT'
  series?: number[]
}) {
  const { data } = useSWR(
    series ? null : `sig-hist:${symbol}`,
    () =>
      api.screener
        .getStockHistory(symbol, 30)
        .then((r) => (r?.history ?? []).map((h) => h.close).filter((n): n is number => Number.isFinite(n)))
        .catch(() => [] as number[]),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  )
  return (
    <Sparkline
      data={series ?? data ?? []}
      width={132}
      height={40}
      tone={direction === 'LONG' ? 'up' : 'down'}
      filled
      strokeWidth={1.75}
      ariaLabel={`${symbol} 30-day trend`}
    />
  )
}

function ConfidenceMini({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value))
  const tone =
    v >= 75 ? 'var(--color-up)' : v >= 50 ? 'var(--color-primary)' : v >= 30 ? 'var(--color-warning)' : 'var(--color-down)'
  return (
    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full transition-all" style={{ width: `${v}%`, background: tone }} />
    </div>
  )
}

function LevelTile({
  label,
  value,
  tone,
  sub,
}: {
  label: string
  value: number
  tone: 'up' | 'down' | 'neutral'
  sub?: string
}) {
  const color = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-d-text-primary'
  return (
    <div className="rounded-lg border border-line bg-main px-2 py-1.5">
      <div className="text-[9px] font-medium uppercase tracking-wide text-d-text-muted">{label}</div>
      <div className={`mt-0.5 truncate font-mono text-[12.5px] font-semibold tabular-nums ${color}`}>
        ₹{value.toFixed(2)}
      </div>
      {sub && <div className="text-[9px] tabular-nums text-d-text-muted">{sub}</div>}
    </div>
  )
}
