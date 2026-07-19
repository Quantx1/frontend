'use client'

/**
 * HomeCockpit — the authed home band under the Main Chat composer.
 *
 * Deliberately lean (2026-07-12 redesign): index data + a rich live market-news
 * feed (Indian + global, with images) + the product CTA. Everything the trader
 * needs to open the session, nothing that's better served on its own page
 * (signals → /signals, book → /portfolio, regime/movers → /markets). Real data;
 * both themes; SEBI footer.
 */

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/contexts/AuthContext'

import { DisclaimerFooter, EyebrowMono, Reveal } from '@/components/foundation'
import { IndexStrip } from '@/components/markets/IndexStrip'
import { MarketNewsFeed, HomeCtaBand } from '@/components/home/HomeNewsCta'
import { api } from '@/lib/api'

const greetingFor = (h: number) => (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')

type Market = { label: string; sub: string; tone: 'up' | 'warning' | 'muted' }
function marketStatus(): Market {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const m = ist.getHours() * 60 + ist.getMinutes()
  const weekday = ist.getDay() >= 1 && ist.getDay() <= 5
  if (weekday && m >= 555 && m < 930) return { label: 'Market live', sub: `closes in ${Math.floor((930 - m) / 60)}h ${(930 - m) % 60}m`, tone: 'up' }
  if (weekday && m >= 540 && m < 555) return { label: 'Pre-open', sub: 'opens 9:15 IST', tone: 'warning' }
  return { label: 'Market closed', sub: weekday ? 'opens 9:15 IST' : 'back Monday', tone: 'muted' }
}

export function HomeCockpit() {
  const { user, profile } = useAuth()
  const firstName =
    (profile as any)?.full_name?.trim()?.split(/\s+/)[0] ||
    (user as any)?.user_metadata?.full_name?.trim()?.split(/\s+/)[0] ||
    user?.email?.split('@')[0] ||
    ''

  const SWR = { revalidateOnFocus: false, dedupingInterval: 30_000, keepPreviousData: true }
  const { data: global } = useSWR('dash-global', () => api.market.getGlobal().catch(() => null), SWR)
  const globalItems = ((global as any)?.items ?? []) as any[]

  const [mkt, setMkt] = useState<Market>(marketStatus)
  useEffect(() => { const id = setInterval(() => setMkt(marketStatus()), 60_000); return () => clearInterval(id) }, [])

  const mktToneCls = mkt.tone === 'up' ? 'text-up' : mkt.tone === 'warning' ? 'text-warning' : 'text-d-text-muted'
  const mktDot = mkt.tone === 'up' ? 'bg-up' : mkt.tone === 'warning' ? 'bg-warning' : 'bg-d-text-muted'

  return (
    <div className="w-full space-y-4 lg:space-y-5">
      {/* ── Header: greeting + live market pulse ── */}
      <Reveal className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <EyebrowMono>{greetingFor(new Date().getHours())}{firstName ? `, ${firstName}` : ''}</EyebrowMono>
          <h1 className="heading-display mt-1 text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-tight text-d-text-primary">Your AI trading desk</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-wrap px-2.5 py-1.5 text-[11.5px]">
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full ${mkt.tone === 'up' ? 'animate-ping bg-up opacity-60' : ''}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${mktDot}`} />
          </span>
          <span className={`font-semibold ${mktToneCls}`}>{mkt.label}</span>
          <span className="text-d-text-muted">· {mkt.sub}</span>
        </span>
      </Reveal>

      {/* ── Index data ── */}
      <Reveal delay={0.02}><IndexStrip global={globalItems} /></Reveal>

      {/* ── Market news — full-width even grid (the star) ── */}
      <Reveal delay={0.04}><MarketNewsFeed /></Reveal>

      {/* ── Product upsell + feature jumps — balanced full-width band ── */}
      <Reveal delay={0.06}><HomeCtaBand /></Reveal>

      <DisclaimerFooter />
    </div>
  )
}
