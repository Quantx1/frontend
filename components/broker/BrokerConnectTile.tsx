'use client'

// ============================================================================
// BrokerConnectTile — single broker card used in Settings → Broker tab
// ============================================================================
// One-click OAuth for Zerodha + Upstox; credential modal for Angel One
// (SmartAPI has no OAuth redirect). Matches Step 4 §7 trading-surface rule.
// ============================================================================

import { CheckCircle2, Loader2, AlertCircle, Unlink, Zap } from '@/lib/icons'
import type { ReactNode } from 'react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { BROKER_DOMAIN } from '@/lib/logo'

export type BrokerName = 'zerodha' | 'upstox' | 'angelone' | 'fyers' | 'dhan' | 'kotakneo' | 'aliceblue'

// Render order + grouping: the 1-click OAuth brokers lead, then the
// token/credential brokers. Both surfaces (Settings + onboarding) render these
// two groups in this order so the easy path is always first.
export const OAUTH_BROKERS: BrokerName[] = ['zerodha', 'upstox', 'fyers']
export const TOKEN_BROKERS: BrokerName[] = ['angelone', 'dhan', 'kotakneo', 'aliceblue']

export type BrokerStatus =
  | 'not_connected'
  | 'connected'
  | 'expired'
  | 'error'
  | 'disconnected'

interface Props {
  broker: BrokerName
  status: BrokerStatus
  accountId?: string | null
  lastSyncedAt?: string | null
  busy?: boolean
  /** Optional muted one-liner shown under the tagline — used for OAuth brokers
   *  (Upstox/Fyers) whose connect affordance is the tile itself (no modal). */
  help?: string
  onConnect: () => void
  onDisconnect: () => void
}

const META: Record<BrokerName, { name: string; tagline: string; logo: ReactNode; beta?: boolean; oauth?: boolean }> = {
  zerodha: {
    name: 'Zerodha',
    tagline: 'Kite Connect · OAuth',
    logo: <ZerodhaLogo />,
    oauth: true,
  },
  upstox: {
    name: 'Upstox',
    tagline: 'Upstox API v2 · OAuth',
    logo: <UpstoxLogo />,
    oauth: true,
  },
  angelone: {
    name: 'Angel One',
    tagline: 'SmartAPI · API key + TOTP',
    logo: <AngelLogo />,
  },
  fyers: {
    name: 'Fyers',
    tagline: 'OAuth · API v3',
    logo: <FyersLogo />,
    beta: true,
    oauth: true,
  },
  dhan: {
    name: 'Dhan',
    tagline: 'Access token',
    logo: <DhanLogo />,
    beta: true,
  },
  kotakneo: {
    name: 'Kotak Neo',
    tagline: 'Session token',
    logo: <KotakLogo />,
    beta: true,
  },
  aliceblue: {
    name: 'Alice Blue',
    tagline: 'API session',
    logo: <AliceLogo />,
    beta: true,
  },
}

export default function BrokerConnectTile({
  broker,
  status,
  accountId,
  lastSyncedAt,
  busy,
  help,
  onConnect,
  onDisconnect,
}: Props) {
  const m = META[broker]
  const isConnected = status === 'connected'
  const isExpired = status === 'expired'

  return (
    <div
      className="trading-surface group flex flex-col gap-4 transition-colors hover:border-d-text-muted/25"
      aria-label={`${m.name} broker connection`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white p-1.5 ring-1 ring-line">
            <BrandLogo domain={BROKER_DOMAIN[broker]} alt={m.name} size={28} fallback={m.logo} />
          </div>
          <StatusPill status={status} />
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold text-d-text-primary">{m.name}</span>
            {m.oauth && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-up/25 bg-up/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-up">
                <Zap className="h-2.5 w-2.5" />
                1-click
              </span>
            )}
            {m.beta && (
              <span className="rounded-full border border-d-border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-d-text-muted">
                Beta
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11.5px] leading-snug text-d-text-muted">{m.tagline}</p>
        </div>
      </div>

      {help && (
        <p className="-mt-1 text-[10px] leading-snug text-d-text-muted">{help}</p>
      )}

      {isConnected && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-d-text-muted border-t border-d-border pt-3">
          <span>
            <span className="text-d-text-secondary">Account</span>{' '}
            <span className="numeric text-d-text-primary">{accountId || '—'}</span>
          </span>
          {lastSyncedAt && (
            <span>
              <span className="text-d-text-secondary">Last sync</span>{' '}
              <span className="numeric text-d-text-primary">
                {new Date(lastSyncedAt).toLocaleString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        {isConnected || isExpired ? (
          <button
            onClick={onDisconnect}
            disabled={busy}
            className="flex items-center gap-1.5 text-[12px] text-down/80 border border-down/30 rounded-md px-3 py-1.5 hover:bg-down/10 hover:text-down transition-colors disabled:opacity-40"
          >
            <Unlink className="w-3.5 h-3.5" />
            Disconnect
          </button>
        ) : (
          <span />
        )}

        <button
          onClick={onConnect}
          disabled={busy}
          className={`flex items-center gap-1.5 text-[12px] font-medium rounded-md px-4 py-1.5 transition-colors disabled:opacity-40 ${
            isConnected
              ? 'border border-d-border text-d-text-secondary hover:bg-hover'
              : 'bg-primary text-primary-foreground hover:bg-primary-hover'
          }`}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          {isConnected ? 'Reconnect' : isExpired ? 'Reconnect' : 'Connect'}
        </button>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------- pill

function StatusPill({ status }: { status: BrokerStatus }) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-up bg-up/10 border border-up/20 rounded-full px-2 py-0.5">
        <CheckCircle2 className="w-3 h-3" />
        Connected
      </span>
    )
  }
  if (status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning bg-warning/10 border border-warning/20 rounded-full px-2 py-0.5">
        <AlertCircle className="w-3 h-3" />
        Expired
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-down bg-down/10 border border-down/20 rounded-full px-2 py-0.5">
        <AlertCircle className="w-3 h-3" />
        Error
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-d-text-muted border border-d-border rounded-full px-2 py-0.5">
      Not connected
    </span>
  )
}

// ---------------------------------------------------------------------- logos

function ZerodhaLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
      <rect width="32" height="32" rx="4" fill="#e85b2d" />
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="DM Sans, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill="#fff"
      >
        Z
      </text>
    </svg>
  )
}

function UpstoxLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
      <rect width="32" height="32" rx="4" fill="#682F91" />
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="DM Sans, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill="#fff"
      >
        U
      </text>
    </svg>
  )
}

function AngelLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
      <rect width="32" height="32" rx="4" fill="#1E88E5" />
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="DM Sans, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill="#fff"
      >
        A
      </text>
    </svg>
  )
}

// Neutral monogram fallbacks — we never hand-trace official broker marks; the
// live logo (BrandLogo → BROKER_DOMAIN) upgrades these when it resolves.
function FyersLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
      <rect width="32" height="32" rx="4" fill="#0F172A" />
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="DM Sans, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill="#fff"
      >
        F
      </text>
    </svg>
  )
}

function DhanLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
      <rect width="32" height="32" rx="4" fill="#334155" />
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="DM Sans, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill="#fff"
      >
        D
      </text>
    </svg>
  )
}

function KotakLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
      <rect width="32" height="32" rx="4" fill="#1E3A5F" />
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="DM Sans, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill="#fff"
      >
        K
      </text>
    </svg>
  )
}

function AliceLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
      <rect width="32" height="32" rx="4" fill="#1565C0" />
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="DM Sans, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill="#fff"
      >
        A
      </text>
    </svg>
  )
}
