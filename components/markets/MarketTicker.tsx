'use client'

/**
 * MarketTicker — ONE continuous, full-bleed market tape.
 *
 * Streams the headline indices (NIFTY 50 · BANK NIFTY · SENSEX · INDIA VIX) then
 * the NIFTY 50 constituents with live quotes, as a single linear marquee that
 * runs edge-to-edge across the app pane — never boxed, never stuck.
 *
 * Reference style (2026-07-13): each item is `logo · SYMBOL · price · change%`,
 * so the tape reads like a real market ticker. Stocks get their brand logo;
 * indices get a duotone dot. The track is duplicated so a -50% translate loops
 * seamlessly; it pauses on hover and fades at both edges. Honest-empty: if BOTH
 * feeds are down we say so — never a fabricated price. Reduced-motion collapses
 * to a static wrapped strip (no scroll, no flash).
 */

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'

import { Skeleton } from '@/components/foundation'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import { api } from '@/lib/api'
import { MONO } from '@/lib/tokens'

const NIFTY50_INDEX = 'NIFTY 50'

const cleanSym = (s: string) => String(s || '').replace('.NS', '').toUpperCase()

/** Mirror the field access the /stocks browser uses for the live-price payload. */
function readQuote(p: Record<string, any>) {
  return {
    price: Number(p.price ?? p.last_price ?? 0),
    changePct: Number(p.change_percent ?? p.change_pct ?? 0),
  }
}

interface TickerItem {
  key: string
  label: string
  price: number | null
  changePct: number | null
  /** Stocks render a brand logo; indices render a duotone dot. */
  isStock?: boolean
  /** VIX: a rising print is FEAR — flip the tone. */
  invert?: boolean
}

/** One tape item. Holds its own last-seen price so it flashes ONLY on a real
 *  change (unchanged values never re-animate). */
function TickerCell({ item, animate }: { item: TickerItem; animate: boolean }) {
  const loading = item.price == null
  const lastRef = useRef<number | null>(null)
  const [flash, setFlash] = useState<{ dir: 'up' | 'down'; key: number } | null>(null)
  useEffect(() => {
    if (item.price == null) return
    const prev = lastRef.current
    if (animate && prev != null && item.price !== prev) {
      setFlash({ dir: item.price > prev ? 'up' : 'down', key: Date.now() })
    }
    lastRef.current = item.price
  }, [item.price, animate])

  const rawUp = (item.changePct ?? 0) >= 0
  const up = item.invert ? !rawUp : rawUp

  return (
    <li className="relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-md px-1">
      {flash && (
        <span
          key={flash.key}
          aria-hidden
          className={`pointer-events-none absolute inset-0 rounded-md ${flash.dir === 'up' ? 'price-flash-up' : 'price-flash-down'}`}
        />
      )}

      {item.isStock ? (
        <SymbolLogo symbol={item.label} size={18} />
      ) : (
        <span
          aria-hidden
          className={`h-1.5 w-1.5 shrink-0 rounded-pill ${loading ? 'bg-d-text-muted/40' : up ? 'bg-up' : 'bg-down'}`}
        />
      )}

      <span className="whitespace-nowrap text-[12.5px] font-semibold tracking-tight text-d-text-primary">
        {item.label}
      </span>

      {loading ? (
        <Skeleton w="52px" h="12px" rounded="sm" />
      ) : (
        <>
          <span className={`numeric whitespace-nowrap tabular-nums text-[12.5px] text-d-text-secondary ${MONO}`}>
            {item.isStock ? '₹' : ''}
            {item.price!.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {item.changePct != null && (
            <span className={`numeric whitespace-nowrap tabular-nums text-[11.5px] font-medium ${MONO} ${up ? 'text-up' : 'text-down'}`}>
              {rawUp ? '+' : ''}
              {item.changePct.toFixed(2)}%
            </span>
          )}
        </>
      )}
    </li>
  )
}

/** Detect prefers-reduced-motion in JS — the CSS guard neutralises the marquee,
 *  but we ALSO need to drop the duplicated track and wrap statically. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** Global cues (S&P · NASDAQ · GOLD · BRENT …) — already fetched by the page via
 *  /api/market/global, passed straight through so we don't double-fetch. */
type GlobalCue = { key: string; label: string; last: number | null; change_pct: number | null }

export function MarketTicker({
  global = [],
  className = '',
}: {
  global?: GlobalCue[]
  className?: string
}) {
  const reduced = usePrefersReducedMotion()

  // Headline indices (shared SWR key → dedupes with anything else on the page).
  const { data: idxData, error: idxErr } = useSWR('public-indices', () => api.publicTrust.indices(), {
    refreshInterval: 30_000, dedupingInterval: 15_000, revalidateOnFocus: false,
  })

  // NIFTY 50 constituents (once) — the real membership the app already knows.
  const { data: constData, error: constErr } = useSWR(
    'ticker:nifty50-constituents',
    () => api.screener.indexConstituents(NIFTY50_INDEX, 60),
    { revalidateOnFocus: false, dedupingInterval: 5 * 60_000 },
  )
  const symbols: string[] = (constData?.constituents ?? []).map((c) => c.symbol).slice(0, 50)

  // Live quotes for the constituents — chunked, refreshed every 20s.
  const { data: quotes } = useSWR<Record<string, { price: number; changePct: number }>>(
    symbols.length ? ['ticker:nifty50-prices', symbols.join(',')] : null,
    async () => {
      const map: Record<string, { price: number; changePct: number }> = {}
      for (let i = 0; i < symbols.length; i += 50) {
        const chunk = symbols.slice(i, i + 50)
        try {
          const json = await api.screener.getLivePrices(chunk)
          if (json?.success && Array.isArray(json.prices)) {
            for (const p of json.prices) {
              const key = cleanSym(p.symbol)
              if (key) map[key] = readQuote(p)
            }
          }
        } catch { /* honest-empty: items stay shimmering until quotes resolve */ }
      }
      return map
    },
    { refreshInterval: 20_000, dedupingInterval: 10_000, revalidateOnFocus: false, keepPreviousData: true },
  )

  const idxItems: TickerItem[] = (idxData?.indices ?? []).map((r) => ({
    key: `idx-${r.key}`,
    label: r.label,
    price: r.last,
    changePct: r.change_pct,
    invert: r.key === 'vix',
  }))
  const cueItems: TickerItem[] = global.map((g) => ({
    key: `g-${g.key}`,
    label: g.label,
    price: g.last,
    changePct: g.change_pct,
  }))
  const stockItems: TickerItem[] = symbols.map((s) => {
    const q = quotes?.[cleanSym(s)]
    const has = q && q.price > 0
    return {
      key: `stk-${cleanSym(s)}`,
      label: cleanSym(s),
      price: has ? q!.price : null,
      changePct: has ? q!.changePct : null,
      isStock: true,
    }
  })
  // Indian indices → global cues → NIFTY 50 constituents, as one continuous tape.
  const items = [...idxItems, ...cueItems, ...stockItems]

  // Honest-empty ONLY when both feeds have settled with nothing usable.
  const idxSettled = !!idxData || !!idxErr
  const constSettled = !!constData || !!constErr
  const indicesDown = idxErr || (idxData && idxData.indices.length === 0)
  const stocksDown = constErr || (constData && symbols.length === 0)

  // Full-bleed: cancel the AppShell gutter so the tape runs edge-to-edge.
  const bleed = `-mx-4 md:-mx-6 ${className}`

  if (items.length === 0 && idxSettled && constSettled && indicesDown && stocksDown) {
    return (
      <div className={`relative border-y border-line bg-wrap/30 ${bleed}`}>
        <p className="py-3 text-center font-sans text-[10.5px] uppercase tracking-[0.12em] text-d-text-muted">
          Live market data unavailable
        </p>
      </div>
    )
  }

  // Nothing yet but a feed is still in flight → shimmering placeholders so the
  // tape has shape immediately.
  const list: TickerItem[] = items.length
    ? items
    : Array.from({ length: 14 }, (_, i) => ({ key: `ph-${i}`, label: '•••', price: null, changePct: null }))

  // Duration scales with item count so linear speed stays constant as the tape
  // grows from indices-only → indices + 50 stocks.
  const duration = Math.max(60, Math.round(list.length * 3.2))

  if (reduced) {
    return (
      <div className={`relative border-y border-line bg-wrap/30 ${bleed}`}>
        <ul className="flex flex-wrap items-center gap-x-7 gap-y-2 px-4 py-2.5 md:px-6" aria-label="Live market data">
          {list.map((it) => <TickerCell key={it.key} item={it} animate={false} />)}
        </ul>
      </div>
    )
  }

  return (
    <div className={`relative border-y border-line bg-wrap/30 ${bleed}`}>
      <div className="marquee-pause mask-edge-fade relative overflow-hidden py-2.5">
        <ul
          className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap"
          style={{ ['--marquee-duration' as string]: `${duration}s` }}
          aria-label="Live market data"
        >
          {[...list, ...list].map((it, i) => (
            <TickerCell key={`${it.key}-${i}`} item={it} animate />
          ))}
        </ul>
      </div>
    </div>
  )
}
