'use client'

/**
 * HomeNewsCta — the home's news + CTA surface.
 *   • MarketNewsFeed — full-width responsive grid of image news cards (Indian +
 *     global, free keyless RSS). Image-bearing items lead; any card without a
 *     usable image gets a branded gradient placeholder (never a blank box).
 *   • HomeCtaBand — a balanced full-width band: product upsell + feature jumps.
 * Full-width by design so the home fills evenly (no tall-news / short-rail gap).
 */

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import {
  Newspaper, ExternalLink, ArrowRight, Sparkles, Bot, BrainCircuit, ShieldCheck,
  ScanLine, Stethoscope, Radar, Layers, Zap,
} from '@/lib/icons'
import { api } from '@/lib/api'

type NewsItem = {
  title: string
  description: string
  image: string | null
  source: string
  region: string
  link: string
  published: string | null
  /** How hard this headline could move the tape (server-scored). */
  impact?: number
  /** A genuine market-mover — badged so it can't be missed. */
  is_big?: boolean
}
type Filter = 'all' | 'India' | 'Global'

function timeAgo(iso?: string | null): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const s = Math.max(0, (Date.now() - t) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── one news card: 16:9 image (with branded placeholder fallback) + text ──

function NewsCard({ n }: { n: NewsItem }) {
  const [broken, setBroken] = useState(false)
  const showImg = !!n.image && !broken
  return (
    <a
      href={n.link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-[20px] border border-line bg-wrap transition-all duration-200 hover:-translate-y-0.5 hover:border-d-text-muted/30 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {/* branded placeholder — always present; the image sits on top of it */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
          style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 16%, var(--color-main)), var(--color-main))' }}
        >
          <Newspaper className="h-7 w-7 text-d-text-muted/45" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-d-text-muted">{n.source}</span>
        </div>
        {showImg && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary news hosts; plain img avoids per-domain remotePatterns
          <img
            src={n.image as string}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          <span aria-hidden>{n.region === 'India' ? '🇮🇳' : '🌐'}</span>
          {n.source}
        </span>
        {/* Market-mover badge — server-scored impact (policy · M&A · earnings ·
            regulator · violent price action). Editorial marker, not P&L, so it
            wears the accent: white ink clears AA on the violet fill in both
            modes; the dark-mode red can't carry white. */}
        {n.is_big && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground backdrop-blur-sm">
            <Zap className="h-2.5 w-2.5" /> Market mover
          </span>
        )}
        {!n.is_big && (
          <ExternalLink className="absolute right-2 top-2 h-3.5 w-3.5 text-white/0 transition-colors group-hover:text-white/80" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <div className="flex items-center gap-1.5 text-[10px] text-d-text-muted">
          <span className="h-1 w-1 rounded-full bg-up" />
          {timeAgo(n.published) || 'live'}
        </div>
        <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-d-text-primary transition-colors group-hover:text-primary">
          {n.title}
        </h3>
        {n.description && (
          <p className="line-clamp-2 text-[11.5px] leading-relaxed text-d-text-muted">{n.description}</p>
        )}
      </div>
    </a>
  )
}

function NewsSkeleton() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-wrap">
      <div className="aspect-[16/9] w-full animate-pulse bg-wrap-hover" />
      <div className="space-y-2 p-3.5">
        <div className="h-2.5 w-16 animate-pulse rounded bg-wrap-hover/70" />
        <div className="h-3.5 w-full animate-pulse rounded bg-wrap-hover" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-wrap-hover/60" />
      </div>
    </div>
  )
}

// ── the feed: header + region filter + full-width responsive card grid ──

export function MarketNewsFeed() {
  const [filter, setFilter] = useState<Filter>('all')
  const { data, isLoading } = useSWR('home:market-news', () => api.market.news().catch(() => null), {
    revalidateOnFocus: true,   // refresh when the trader returns to the tab
    refreshInterval: 120_000,  // and every 2 min while it's open
    dedupingInterval: 90_000,
    keepPreviousData: true,
  })
  const all = (data?.items ?? []) as NewsItem[]
  // Top 8 most recent per tab — two clean rows of four.
  // The API already returns items newest-first WITHIN each region and then
  // INTERLEAVES India/Global, so:
  //   • All    → keep that order → a balanced, recent India+Global mix. (Never
  //     re-sort globally by time: global wires post far more often and would
  //     drown out the Indian headlines a trader here needs most.)
  //   • India / Global → filter; the region's own newest-first order survives.
  const items = (filter === 'all' ? all : all.filter((n) => n.region === filter)).slice(0, 8)

  return (
    <section aria-label="Market news">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-d-text-primary">
          <Newspaper className="h-4 w-4 text-primary" />
          <h2 className="text-[15px] font-semibold">Market news</h2>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-up" />
          </span>
          <span className="hidden text-[11px] text-d-text-muted sm:inline">Live · Indian &amp; global</span>
        </div>
        <div className="flex items-center gap-0.5 rounded-pill border border-line bg-wrap p-0.5">
          {(['all', 'India', 'Global'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-pill px-2.5 py-1 text-[11px] font-medium transition-colors ${
                filter === f ? 'glass-control-accent' : 'text-d-text-muted hover:text-d-text-secondary'
              }`}
            >
              {f === 'all' ? 'All' : f === 'India' ? '🇮🇳 India' : '🌐 Global'}
            </button>
          ))}
        </div>
      </header>

      {isLoading && all.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <NewsSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[20px] border border-line bg-wrap p-12 text-center text-[12px] text-d-text-muted">
          News tape is quiet — market headlines will stream in here as they break.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((n, i) => <NewsCard key={`${n.title.slice(0, 32)}-${i}`} n={n} />)}
        </div>
      )}
    </section>
  )
}

// ── product upsell + feature jumps, as ONE balanced full-width band ──

const FEATURE_LINKS = [
  { icon: ScanLine, title: 'AI Screener', desc: 'Describe a setup in plain English', href: '/scanner' },
  { icon: Stethoscope, title: 'Portfolio Doctor', desc: 'Fix concentration & drawdown risk', href: '/portfolio/doctor' },
  { icon: Radar, title: 'ML Signals', desc: 'Gated NSE calls across horizons', href: '/signals' },
  { icon: Layers, title: 'F&O Desk', desc: 'Chain, OI, greeks & strategies', href: '/fno' },
]

const CTA_FEATURES = [
  { icon: Bot, text: 'AutoPilot bot — hands-free buy / manage / exit' },
  { icon: BrainCircuit, text: '5 ML engines must agree before a signal fires' },
  { icon: ShieldCheck, text: 'Counterpoint bull vs bear debate on every call' },
]

function FeatureCard({ icon: Icon, title, desc, href }: (typeof FEATURE_LINKS)[number]) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-[20px] bg-wrap px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:ring-1 hover:ring-primary/25"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-d-text-secondary transition-colors group-hover:text-d-text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-d-text-primary">{title}</span>
        <span className="block truncate text-[11px] text-d-text-muted">{desc}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-d-text-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export function HomeCtaBand() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
      {/* product upsell */}
      <div className="relative overflow-hidden rounded-[24px] bg-wrap p-4 lg:col-span-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-30 blur-2xl"
          style={{ background: 'radial-gradient(circle, var(--color-primary), transparent 70%)' }}
        />
        {/* decorative upsell illustration — flat-vector on its tinted tile */}
        <div aria-hidden className="tile-tint pointer-events-none absolute right-3 top-3 hidden overflow-hidden rounded-2xl p-1 sm:block">
          <Image src="/v4/illus/copilot.png" alt="" width={76} height={76} sizes="76px" className="rounded-2xl" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3 w-3" /> Quant X Pro
          </div>
          <h3 className="mt-2 text-[15px] font-semibold tracking-tight text-d-text-primary sm:pr-24">Trade with the full AI desk</h3>
          <p className="mt-0.5 text-[11.5px] text-d-text-muted sm:pr-24">The engines, the bot, and the debate — working your book while you sleep.</p>
          <ul className="mt-3 space-y-1.5">
            {CTA_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-[11.5px] text-d-text-secondary">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary">
                  <f.icon className="h-3 w-3" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
          <Link
            href="/pricing"
            className="bg-gradient-cta cta-gloss mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-pill px-3 py-2 text-[12px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Explore Pro <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* feature jumps — 2×2 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
        {FEATURE_LINKS.map((f) => <FeatureCard key={f.href} {...f} />)}
      </div>
    </div>
  )
}
