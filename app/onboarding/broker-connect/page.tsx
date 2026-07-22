'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from '@/lib/icons'

import { Button, Card, CardBody, CardHeader, toast } from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'

type BrokerCard = {
  slug: string
  name: string
  blurb: string
  /** Muted reassurance under an OAuth card (credential brokers show their
   *  step-by-step help inside the inline form instead). */
  help?: string
  beta?: boolean
}

const BROKERS: BrokerCard[] = [
  {
    slug: 'zerodha',
    name: 'Zerodha',
    blurb: 'Kite Connect · OAuth · India’s largest discount broker',
    help: 'You’ll log in securely on Zerodha (Kite). We never see your password.',
  },
  {
    slug: 'upstox',
    name: 'Upstox',
    blurb: 'API v2 · OAuth · Tier-1 NSE access',
    help: 'You’ll log in securely on Upstox. We never see your password.',
  },
  {
    slug: 'fyers',
    name: 'Fyers',
    blurb: 'OAuth · API v3',
    help: 'You’ll log in securely on Fyers. We never see your password.',
    beta: true,
  },
  {
    slug: 'angel',
    name: 'Angel One',
    blurb: 'SmartAPI · API key + TOTP · Pan-India retail',
  },
  {
    slug: 'dhan',
    name: 'Dhan',
    blurb: 'Access token',
    beta: true,
  },
  {
    slug: 'kotakneo',
    name: 'Kotak Neo',
    blurb: 'Neo API · Session token',
    beta: true,
  },
  {
    slug: 'aliceblue',
    name: 'Alice Blue',
    blurb: 'ANT API · API session',
    beta: true,
  },
]

/**
 * /onboarding/broker-connect — Step 1 of 3.
 *
 * Each broker card launches the real OAuth init (POST
 * /api/broker/{slug}/auth/initiate). The auth_url + state come back,
 * we stash state in sessionStorage so /broker/callback can read it,
 * then full-window redirect to the broker's consent page.
 *
 * Skip path goes to /onboarding/risk-quiz so users who only want a
 * virtual ₹10L paper portfolio aren't blocked here.
 */
export default function BrokerConnectPage() {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  // Angel One (SmartAPI) is credential-based — no OAuth redirect. Its card
  // reveals this inline form instead of bouncing through a broker consent page.
  const [angelOpen, setAngelOpen] = useState(false)
  const [angel, setAngel] = useState({
    api_key: '',
    client_id: '',
    password: '',
    totp_secret: '',
  })

  // Dhan (DhanHQ Trading API) is token-based — also inline, two fields only.
  const [dhanOpen, setDhanOpen] = useState(false)
  const [dhan, setDhan] = useState({ client_id: '', access_token: '' })
  const [showDhanToken, setShowDhanToken] = useState(false)

  // Kotak Neo (Neo API) is token-based — inline, three fields:
  // Client ID (UCC) + Access Token + Session Token (sid).
  const [kotakOpen, setKotakOpen] = useState(false)
  const [kotak, setKotak] = useState({ client_id: '', access_token: '', session_token: '' })
  const [showKotakToken, setShowKotakToken] = useState(false)
  const [showKotakSession, setShowKotakSession] = useState(false)

  // Alice Blue (ANT API) is token-based — inline, two fields:
  // User ID (client_id) + Access Token.
  const [aliceOpen, setAliceOpen] = useState(false)
  const [alice, setAlice] = useState({ client_id: '', access_token: '' })
  const [showAliceToken, setShowAliceToken] = useState(false)

  const onConnect = async (slug: string) => {
    setPending(slug)
    try {
      const r = await api.broker.initiateOAuth(slug, 'onboarding')
      if (!r?.auth_url) {
        throw new Error('Broker returned no auth_url')
      }
      try {
        sessionStorage.setItem('broker_oauth_state', r.state || '')
        sessionStorage.setItem('broker_oauth_broker', slug)
        sessionStorage.setItem('broker_oauth_return', 'onboarding')
      } catch {
        // Storage might be blocked (private mode etc.) — Upstox passes
        // state in the URL fallback so the callback still works.
      }
      window.location.href = r.auth_url
    } catch (e) {
      toast.error(`Could not start ${slug} OAuth`, { description: handleApiError(e) })
      setPending(null)
    }
  }

  const submitAngel = async () => {
    setPending('angel')
    try {
      await api.broker.connect({
        broker_name: 'angelone',
        api_key: angel.api_key,
        client_id: angel.client_id,
        password: angel.password,
        totp_secret: angel.totp_secret,
      })
      toast.success('Angel One connected')
      router.push('/onboarding/risk-quiz')
    } catch (e) {
      toast.error('Angel One connect failed', { description: handleApiError(e) })
      setPending(null)
    }
  }

  const submitDhan = async () => {
    setPending('dhan')
    try {
      await api.broker.connect({
        broker_name: 'dhan',
        client_id: dhan.client_id,
        access_token: dhan.access_token,
      })
      toast.success('Dhan connected')
      router.push('/onboarding/risk-quiz')
    } catch (e) {
      toast.error('Dhan connect failed', { description: handleApiError(e) })
      setPending(null)
    }
  }

  const submitKotak = async () => {
    setPending('kotakneo')
    try {
      await api.broker.connect({
        broker_name: 'kotakneo',
        client_id: kotak.client_id,
        access_token: kotak.access_token,
        session_token: kotak.session_token,
      })
      toast.success('Kotak Neo connected')
      router.push('/onboarding/risk-quiz')
    } catch (e) {
      toast.error('Kotak Neo connect failed', { description: handleApiError(e) })
      setPending(null)
    }
  }

  const submitAlice = async () => {
    setPending('aliceblue')
    try {
      await api.broker.connect({
        broker_name: 'aliceblue',
        client_id: alice.client_id,
        access_token: alice.access_token,
      })
      toast.success('Alice Blue connected')
      router.push('/onboarding/risk-quiz')
    } catch (e) {
      toast.error('Alice Blue connect failed', { description: handleApiError(e) })
      setPending(null)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-12">
      <header className="space-y-1 text-center">
        <p className="text-[11px] uppercase tracking-wider text-primary">
          Step 1 of 3
        </p>
        <h1 className="text-2xl font-semibold text-d-text-primary">
          Let the agents run live
        </h1>
        <p className="text-sm text-d-text-muted">
          Connect your broker so AutoPilot and the trading agents can act on
          real positions. Read-only at first. Place trades later from Settings →
          Broker. Free users can skip and run on the ₹10L paper account.
        </p>
      </header>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Link a broker for live execution</span>
        </CardHeader>
        <CardBody className="space-y-2">
          {BROKERS.map((b) => {
            const isAngel = b.slug === 'angel'
            const isDhan = b.slug === 'dhan'
            const isKotak = b.slug === 'kotakneo'
            const isAlice = b.slug === 'aliceblue'
            const inline = isAngel || isDhan || isKotak || isAlice
            const expanded = isAngel
              ? angelOpen
              : isDhan
                ? dhanOpen
                : isKotak
                  ? kotakOpen
                  : isAlice
                    ? aliceOpen
                    : false
            return (
              <div key={b.slug} className="space-y-2">
                {b.slug === 'zerodha' && (
                  <p className="text-[11px] font-medium uppercase tracking-wider text-d-text-muted">
                    Instant · one-click login
                  </p>
                )}
                {isAngel && (
                  <p className="pt-2 text-[11px] font-medium uppercase tracking-wider text-d-text-muted">
                    Connect with a token
                  </p>
                )}
                <button
                  type="button"
                  onClick={() =>
                    isAngel
                      ? setAngelOpen((v) => !v)
                      : isDhan
                        ? setDhanOpen((v) => !v)
                        : isKotak
                          ? setKotakOpen((v) => !v)
                          : isAlice
                            ? setAliceOpen((v) => !v)
                            : onConnect(b.slug)
                  }
                  disabled={pending !== null}
                  aria-label={`Connect ${b.name}`}
                  aria-expanded={inline ? expanded : undefined}
                  className="glass-control flex w-full items-center justify-between rounded-md p-3 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-d-text-primary">
                      {b.name}
                      {b.beta && (
                        <span className="rounded-full border border-line px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-d-text-muted">
                          Beta
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-d-text-muted">{b.blurb}</p>
                  </div>
                  {pending === b.slug ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <ArrowRight
                      className={`h-4 w-4 text-d-text-muted transition-transform ${
                        inline && expanded ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                </button>

                {/* OAuth reassurance (credential brokers show step-by-step help
                    inside their inline form instead). */}
                {!inline && b.help && (
                  <p className="px-1 text-[10px] leading-snug text-d-text-muted">
                    {b.help}
                  </p>
                )}

                {isAngel && angelOpen && (
                  <div className="space-y-3 rounded-md border border-line bg-main p-3">
                    <div className="space-y-0.5 text-[11px] leading-relaxed text-d-text-muted">
                      <p>
                        1) Go to{' '}
                        <a
                          href="https://smartapi.angelbroking.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          smartapi.angelbroking.com
                        </a>{' '}
                        and create an app → get your API key.
                      </p>
                      <p>2) Your Client ID is your Angel login ID.</p>
                      <p>
                        3) In the SmartAPI app, enable TOTP and copy the TOTP
                        secret (base32). Paste all three below.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-d-text-secondary">
                          API key
                        </label>
                        <input
                          type="text"
                          value={angel.api_key}
                          onChange={(e) =>
                            setAngel({ ...angel, api_key: e.target.value })
                          }
                          placeholder="SmartAPI key"
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full rounded-sm border border-line bg-main px-3 py-2 text-[13px] text-d-text-primary placeholder:text-d-text-muted focus:border-primary/50 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-d-text-secondary">
                          Client ID
                        </label>
                        <input
                          type="text"
                          value={angel.client_id}
                          onChange={(e) =>
                            setAngel({
                              ...angel,
                              client_id: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="e.g. D12345"
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full rounded-sm border border-line bg-main px-3 py-2 text-[13px] uppercase text-d-text-primary placeholder:text-d-text-muted focus:border-primary/50 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-d-text-secondary">
                          PIN / Password
                        </label>
                        <input
                          type="password"
                          value={angel.password}
                          onChange={(e) =>
                            setAngel({ ...angel, password: e.target.value })
                          }
                          placeholder="Login password or MPIN"
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full rounded-sm border border-line bg-main px-3 py-2 text-[13px] text-d-text-primary placeholder:text-d-text-muted focus:border-primary/50 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-d-text-secondary">
                          TOTP secret
                        </label>
                        <input
                          type="text"
                          value={angel.totp_secret}
                          onChange={(e) =>
                            setAngel({
                              ...angel,
                              totp_secret: e.target.value
                                .replace(/\s/g, '')
                                .toUpperCase(),
                            })
                          }
                          placeholder="TOTP secret key"
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full rounded-sm border border-line bg-main px-3 py-2 font-mono text-[13px] tracking-wider text-d-text-primary placeholder:text-d-text-muted focus:border-primary/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={submitAngel}
                      disabled={
                        pending !== null ||
                        !angel.api_key ||
                        !angel.client_id ||
                        !angel.password ||
                        !angel.totp_secret
                      }
                      className="w-full"
                    >
                      {pending === 'angel' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Connecting…
                        </span>
                      ) : (
                        'Connect Angel One'
                      )}
                    </Button>
                  </div>
                )}

                {isDhan && dhanOpen && (
                  <div className="space-y-3 rounded-md border border-line bg-main p-3">
                    <div className="space-y-0.5 text-[11px] leading-relaxed text-d-text-muted">
                      <p>
                        1) Open{' '}
                        <a
                          href="https://web.dhan.co"
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          web.dhan.co
                        </a>{' '}
                        → Profile → DhanHQ Trading API.
                      </p>
                      <p>
                        2) Copy your Client ID and generate an Access Token
                        (valid ~30 days). Paste both below.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-d-text-secondary">
                          Client ID
                        </label>
                        <input
                          type="text"
                          value={dhan.client_id}
                          onChange={(e) =>
                            setDhan({ ...dhan, client_id: e.target.value })
                          }
                          placeholder="Dhan Client ID"
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full rounded-sm border border-line bg-main px-3 py-2 text-[13px] text-d-text-primary placeholder:text-d-text-muted focus:border-primary/50 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-d-text-secondary">
                          Access Token
                        </label>
                        <div className="relative">
                          <input
                            type={showDhanToken ? 'text' : 'password'}
                            value={dhan.access_token}
                            onChange={(e) =>
                              setDhan({ ...dhan, access_token: e.target.value })
                            }
                            placeholder="DhanHQ access token"
                            autoComplete="off"
                            spellCheck={false}
                            className="w-full rounded-sm border border-line bg-main px-3 py-2 pr-9 font-mono text-[13px] tracking-wide text-d-text-primary placeholder:text-d-text-muted focus:border-primary/50 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDhanToken((v) => !v)}
                            aria-label={showDhanToken ? 'Hide access token' : 'Show access token'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-d-text-muted hover:text-d-text-primary"
                          >
                            {showDhanToken ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={submitDhan}
                      disabled={
                        pending !== null ||
                        !dhan.client_id ||
                        !dhan.access_token
                      }
                      className="w-full"
                    >
                      {pending === 'dhan' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Connecting…
                        </span>
                      ) : (
                        'Connect Dhan'
                      )}
                    </Button>
                  </div>
                )}

                {isKotak && kotakOpen && (
                  <div className="space-y-3 rounded-md border border-line bg-main p-3">
                    <div className="space-y-0.5 text-[11px] leading-relaxed text-d-text-muted">
                      <p>
                        1) Log in to the Kotak Neo API portal (
                        <a
                          href="https://napi.kotaksecurities.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          napi.kotaksecurities.com
                        </a>
                        ) and create an app.
                      </p>
                      <p>2) Generate your access token + session id (sid).</p>
                      <p>
                        3) Paste your Client ID (UCC), Access Token and Session
                        Token below.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-d-text-secondary">
                          Client ID (UCC)
                        </label>
                        <input
                          type="text"
                          value={kotak.client_id}
                          onChange={(e) =>
                            setKotak({ ...kotak, client_id: e.target.value })
                          }
                          placeholder="Kotak Neo UCC"
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full rounded-sm border border-line bg-main px-3 py-2 text-[13px] text-d-text-primary placeholder:text-d-text-muted focus:border-primary/50 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-d-text-secondary">
                          Access Token
                        </label>
                        <div className="relative">
                          <input
                            type={showKotakToken ? 'text' : 'password'}
                            value={kotak.access_token}
                            onChange={(e) =>
                              setKotak({ ...kotak, access_token: e.target.value })
                            }
                            placeholder="Neo API access token"
                            autoComplete="off"
                            spellCheck={false}
                            className="w-full rounded-sm border border-line bg-main px-3 py-2 pr-9 font-mono text-[13px] tracking-wide text-d-text-primary placeholder:text-d-text-muted focus:border-primary/50 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKotakToken((v) => !v)}
                            aria-label={showKotakToken ? 'Hide access token' : 'Show access token'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-d-text-muted hover:text-d-text-primary"
                          >
                            {showKotakToken ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-d-text-secondary">
                          Session Token (sid)
                        </label>
                        <div className="relative">
                          <input
                            type={showKotakSession ? 'text' : 'password'}
                            value={kotak.session_token}
                            onChange={(e) =>
                              setKotak({ ...kotak, session_token: e.target.value })
                            }
                            placeholder="Neo API session id (sid)"
                            autoComplete="off"
                            spellCheck={false}
                            className="w-full rounded-sm border border-line bg-main px-3 py-2 pr-9 font-mono text-[13px] tracking-wide text-d-text-primary placeholder:text-d-text-muted focus:border-primary/50 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKotakSession((v) => !v)}
                            aria-label={showKotakSession ? 'Hide session token' : 'Show session token'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-d-text-muted hover:text-d-text-primary"
                          >
                            {showKotakSession ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={submitKotak}
                      disabled={
                        pending !== null ||
                        !kotak.client_id ||
                        !kotak.access_token ||
                        !kotak.session_token
                      }
                      className="w-full"
                    >
                      {pending === 'kotakneo' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Connecting…
                        </span>
                      ) : (
                        'Connect Kotak Neo'
                      )}
                    </Button>
                  </div>
                )}

                {isAlice && aliceOpen && (
                  <div className="space-y-3 rounded-md border border-line bg-main p-3">
                    <div className="space-y-0.5 text-[11px] leading-relaxed text-d-text-muted">
                      <p>
                        1) Log in to{' '}
                        <a
                          href="https://aliceblueonline.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          Alice Blue
                        </a>{' '}
                        → Apps → API.
                      </p>
                      <p>2) Get your API key and generate a session/access token.</p>
                      <p>3) Paste your User ID and Access Token below.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-d-text-secondary">
                          User ID
                        </label>
                        <input
                          type="text"
                          value={alice.client_id}
                          onChange={(e) =>
                            setAlice({ ...alice, client_id: e.target.value })
                          }
                          placeholder="Alice Blue User ID"
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full rounded-sm border border-line bg-main px-3 py-2 text-[13px] text-d-text-primary placeholder:text-d-text-muted focus:border-primary/50 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-d-text-secondary">
                          Access Token
                        </label>
                        <div className="relative">
                          <input
                            type={showAliceToken ? 'text' : 'password'}
                            value={alice.access_token}
                            onChange={(e) =>
                              setAlice({ ...alice, access_token: e.target.value })
                            }
                            placeholder="Alice Blue access token"
                            autoComplete="off"
                            spellCheck={false}
                            className="w-full rounded-sm border border-line bg-main px-3 py-2 pr-9 font-mono text-[13px] tracking-wide text-d-text-primary placeholder:text-d-text-muted focus:border-primary/50 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAliceToken((v) => !v)}
                            aria-label={showAliceToken ? 'Hide access token' : 'Show access token'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-d-text-muted hover:text-d-text-primary"
                          >
                            {showAliceToken ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={submitAlice}
                      disabled={
                        pending !== null ||
                        !alice.client_id ||
                        !alice.access_token
                      }
                      className="w-full"
                    >
                      {pending === 'aliceblue' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Connecting…
                        </span>
                      ) : (
                        'Connect Alice Blue'
                      )}
                    </Button>
                  </div>
                )}

              </div>
            )
          })}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between text-xs text-d-text-muted">
        <span>Connect later anytime in Settings → Broker</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/onboarding/risk-quiz')}
          disabled={pending !== null}
        >
          Skip — explore with a virtual ₹10L portfolio
        </Button>
      </div>
    </div>
  )
}
