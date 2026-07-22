'use client'

/**
 * /referrals — N12 virality loop.
 *
 * Both sides get +1 month Pro credit when the referred user makes
 * their first paid upgrade. Share via copy / WhatsApp / Telegram /
 * email deep links (no server-side email sender required).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Copy,
  Gift,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCw,
  Send,
  Share2,
  Users,
} from '@/lib/icons'

import { api, handleApiError } from '@/lib/api'
import { Reveal } from '@/components/foundation'
import { MONO } from '@/lib/tokens'


type Status = Awaited<ReturnType<typeof api.referrals.status>>


// Status → theme-aware Tailwind class set (border + bg + text). Duotone
// green/red reserved for terminal states (rewarded / expired); neutral and
// primary tones cover in-progress states so tri-theme stays honest.
const STATUS_COPY: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pending',    cls: 'text-d-text-muted border-line bg-wrap-hover' },
  signed_up: { label: 'Signed up',  cls: 'text-primary border-primary/30 bg-primary/10' },
  rewarded:  { label: 'Rewarded',   cls: 'text-up border-up/20 bg-up/10' },
  expired:   { label: 'Expired',    cls: 'text-down border-down/20 bg-down/10' },
}


export default function ReferralsPage() {
  const [data, setData] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [rotating, setRotating] = useState(false)
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const r = await api.referrals.status()
      setData(r)
      setError(null)
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const absoluteLink = useMemo(() => {
    if (!data?.share_url || typeof window === 'undefined') return ''
    return `${window.location.origin}${data.share_url}`
  }, [data?.share_url])

  const copy = async (text: string, tag: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(tag)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* fallthrough — user can still select manually */
    }
  }

  const rotate = async () => {
    if (!confirm('Rotate your referral code? The old link will stop working.')) return
    setRotating(true)
    try {
      const r = await api.referrals.rotateCode()
      setData(r as Status)
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setRotating(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <div className="rounded-md border border-down/40 bg-down/10 px-3 py-2 text-[12px] text-down">
          {error}
        </div>
      </div>
    )
  }

  if (!data) return null

  const stats = data.stats

  const shareText = `Join me on Quant X: institutional-grade engines for Indian traders. Use my link to get Pro free for a month: ${absoluteLink}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(absoluteLink)}&text=${encodeURIComponent('Join me on Quant X: institutional-grade engines for Indian traders')}`
  const emailUrl = `mailto:?subject=${encodeURIComponent('Try Quant X: get Pro free for a month')}&body=${encodeURIComponent(shareText)}`

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-5">
      <Reveal>
        <header>
          <h1 className="text-[22px] font-semibold text-d-text-primary flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Referrals
          </h1>
          <p className="text-[12px] text-d-text-muted mt-0.5">
            Put the trading copilot and ML signal engines in a friend&rsquo;s hands.
            When they upgrade to paid for the first time, you both get{' '}
            <span className="text-d-text-primary font-semibold">+1 month of Pro</span>, free.
          </p>
        </header>
      </Reveal>

      {error && (
        <div className="rounded-md border border-down/40 bg-down/10 px-3 py-2 text-[12px] text-down">
          {error}
        </div>
      )}

      {/* Hero share card */}
      <Reveal delay={0.05}>
      <section className="rounded-sm border border-primary/30 bg-wrap p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-d-text-muted">Your referral code</p>
            <p className={`${MONO} text-[32px] font-semibold text-primary tracking-widest mt-1`}>
              {data.code}
            </p>
            <button
              onClick={() => copy(data.code, 'code')}
              className="mt-1 inline-flex items-center gap-1 text-[10px] text-d-text-muted hover:text-d-text-primary"
            >
              {copied === 'code' ? <><CheckCircle2 className="w-3 h-3 text-up" /> copied</> : <><Copy className="w-3 h-3" /> copy</>}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={rotate}
              disabled={rotating}
              className="glass-control inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] text-d-text-secondary hover:text-d-text-primary disabled:opacity-60"
            >
              <RefreshCw className={`w-3 h-3 ${rotating ? 'animate-spin' : ''}`} />
              Rotate code
            </button>
          </div>
        </div>

        {/* Link + copy */}
        <div className="mt-4 flex items-center gap-2 rounded-md bg-main border border-d-border px-3 py-2.5">
          <Share2 className="w-4 h-4 text-primary shrink-0" />
          <input
            readOnly
            value={absoluteLink}
            className="flex-1 bg-transparent text-[12px] text-d-text-secondary focus:outline-none"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            onClick={() => copy(absoluteLink, 'link')}
            className="glass-control-accent shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-sm text-[11px] font-semibold active:scale-[0.98]"
          >
            {copied === 'link' ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied === 'link' ? 'Copied' : 'Copy link'}
          </button>
        </div>

        {/* Share channels */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {/* WhatsApp / Telegram keep their first-party brand colours (a brand
              asset, not part of our palette). Email uses our primary token. */}
          <ShareButton href={whatsappUrl} icon={MessageCircle} label="WhatsApp" color="#25D366" />
          <ShareButton href={telegramUrl} icon={Send} label="Telegram" color="#229ED9" />
          <ShareButton href={emailUrl} icon={Mail} label="Email" />
        </div>
      </section>
      </Reveal>

      {/* Stats grid */}
      <Reveal delay={0.1}>
      <section className="grid grid-cols-2 md:grid-cols-5 divide-x divide-line rounded-sm border border-line bg-wrap overflow-hidden">
        <Cell label="Invited" value={stats.invited} />
        <Cell label="Pending" value={stats.pending} />
        <Cell label="Signed up" value={stats.signed_up} accent="text-primary" />
        <Cell label="Rewarded" value={stats.rewarded} accent="text-up" />
        <Cell label="Months credited" value={`${stats.credit_months} mo`} accent="text-warning" />
      </section>
      </Reveal>

      {/* PR 44 — credit-on-renewal hint */}
      {stats.credit_months > 0 && (
        <Reveal delay={0.15}>
        <section className="rounded-sm border border-highlight/40 bg-highlight/10 px-4 py-3 flex items-start gap-3">
          <Gift className="w-4 h-4 text-highlight mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-highlight font-medium">
              You have {stats.credit_months} month{stats.credit_months === 1 ? '' : 's'} of Pro credit ready.
            </p>
            <p className="text-[11px] text-highlight/80 mt-0.5">
              Your credit applies automatically on your next paid upgrade or renewal.
              {' '}We extend your subscription by {stats.credit_months * 30} days without charge.
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-[11px] font-semibold text-highlight hover:underline whitespace-nowrap"
          >
            Renew →
          </Link>
        </section>
        </Reveal>
      )}

      {/* Recent list */}
      <Reveal delay={0.2}>
      <section className="rounded-sm border border-line bg-wrap overflow-hidden">
        <div className="px-5 py-3 border-b border-line flex items-center justify-between">
          <p className="text-[13px] font-semibold text-d-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Recent referrals
          </p>
          <p className="text-[10px] text-d-text-muted">{data.recent.length} total</p>
        </div>
        {data.recent.length === 0 ? (
          <div className="p-6 text-center text-[12px] text-d-text-muted">
            No referrals yet. Share your link above to get started.
          </div>
        ) : (
          <div className="divide-y divide-line">
            {data.recent.map((r, i) => (
              <Reveal key={r.id} delay={Math.min(i, 8) * 0.04}>
                <RecentRow r={r} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
      </Reveal>

      <p className="text-[10px] text-d-text-muted text-center">
        Rewards apply automatically on your friend&rsquo;s first paid upgrade.
        Self-referral not permitted. Refer to the <Link href="/pricing" className="text-primary hover:underline">Pricing</Link> page for tier details.
      </p>
    </div>
  )
}


/* ───────────────────────── components ───────────────────────── */


function ShareButton({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string
  icon: React.ElementType
  label: string
  /** First-party brand colour (WhatsApp/Telegram). Omit → uses primary token. */
  color?: string
}) {
  // Branded channels keep their inline brand colour; everything else rides the
  // theme-aware primary token so tri-theme contrast holds.
  if (!color) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="glass-control inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-primary text-[11px] font-medium transition-colors"
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </a>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm border text-[11px] font-medium transition-colors hover:bg-hover"
      style={{ borderColor: `${color}55`, color, background: `${color}14` }}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </a>
  )
}


function Cell({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  /** Tailwind text-colour class for the numeric. Defaults to primary text. */
  accent?: string
}) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-d-text-muted mb-1">{label}</p>
      <p className={`${MONO} text-[20px] font-semibold ${accent || 'text-d-text-primary'}`}>
        {value}
      </p>
    </div>
  )
}


function RecentRow({ r }: { r: Status['recent'][number] }) {
  const meta = STATUS_COPY[r.status] || STATUS_COPY.pending
  return (
    <div className="px-5 py-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-d-text-primary truncate">
          {r.referred_email || (r.referred_user_id ? 'Anonymous user' : '—')}
        </p>
        <p className={`text-[10px] text-d-text-muted ${MONO} mt-0.5`}>
          {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          {r.signed_up_at && ` · signed up ${new Date(r.signed_up_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
          {r.rewarded_at && ` · rewarded ${new Date(r.rewarded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
        </p>
      </div>
      <span
        className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border shrink-0 ${meta.cls}`}
      >
        {meta.label}
      </span>
    </div>
  )
}
