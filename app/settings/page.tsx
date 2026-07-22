// ============================================================================
// QUANT X - SETTINGS PAGE
// User profile, trading preferences, broker connection, notifications
// ============================================================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { api, handleApiError } from '../../lib/api'
import {
  User,
  Shield,
  Bell,
  Wallet,
  TrendingUp,
  Settings,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  MessageCircle,
  Lock,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  Check,
  Palette,
} from '@/lib/icons'
import { AppShell } from '@/components/shell/AppShell'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  EyebrowMono,
  PageHeader,
  toast as ftoast,
} from '@/components/foundation'
import BrokerConnectTile, { BrokerName, BrokerStatus as BrokerConnStatus, OAUTH_BROKERS, TOKEN_BROKERS } from '@/components/broker/BrokerConnectTile'
import TierPanel from './_components/TierPanel'
import { AlertPreferencesGrid } from '@/components/settings/AlertPreferencesGrid'
import KillSwitchPanel from './_components/KillSwitchPanel'
import DataPanel from './_components/DataPanel'
import WatchlistPinsPanel from './_components/WatchlistPinsPanel'
import ModePanel from './_components/ModePanel'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { MONO } from '@/lib/tokens'

// ============================================================================
// SETTINGS PAGE
// ============================================================================

export default function SettingsPage() {
  const router = useRouter()
  const { user, profile, refreshProfile, loading: authLoading } = useAuth()

  // Form states
  type TabKey = 'profile' | 'trading' | 'broker' | 'notifications' | 'appearance' | 'tier' | 'kill_switch' | 'data'
  const VALID_TABS: TabKey[] = ['profile', 'trading', 'broker', 'notifications', 'appearance', 'tier', 'kill_switch', 'data']
  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  // Hash-anchored section nav (the reference archetype H: /settings#appearance).
  // Deep-link in on mount + keep the URL hash in sync as the tab changes so
  // sections are shareable/bookmarkable. Falls back to 'profile' on a bad hash.
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace('#', '') as TabKey
      if (VALID_TABS.includes(h)) setActiveTab(h)
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const selectTab = (id: TabKey) => {
    setActiveTab(id)
    if (typeof window !== 'undefined' && window.location.hash !== `#${id}`) {
      window.history.replaceState(null, '', `#${id}`)
    }
  }
  // PR 25 — tier + kill-switch panel state
  const [tierInfo, setTierInfo] = useState<{ tier: 'free'|'pro'|'elite'; is_admin: boolean; copilot_daily_cap: number } | null>(null)
  // PR 117 — onboarding quiz recommendation. Same gap as /pricing (PR 115),
  // but for the in-app surface where existing users actually open the
  // tier panel. Best-effort fetch; failure is silent.
  const [quizRec, setQuizRec] = useState<{
    recommended_tier: 'free' | 'pro' | 'elite'
    risk_profile: 'conservative' | 'moderate' | 'aggressive' | null
  } | null>(null)
  useEffect(() => {
    let active = true
    // PR 118 — cache helper avoids re-hit on every settings nav.
    import('@/lib/onboardingStatusCache').then(({ getOnboardingStatus }) => {
      getOnboardingStatus().then((s) => {
        if (!active || !s || !s.completed || !s.recommended_tier) return
        setQuizRec({
          recommended_tier: s.recommended_tier,
          risk_profile: s.current_risk_profile,
        })
      })
    }).catch(() => {})
    return () => { active = false }
  }, [])
  const [killPauseHours, setKillPauseHours] = useState<number>(24)
  const [dataBusy, setDataBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile form
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    capital: 100000,
  })

  // Trading form
  const [tradingForm, setTradingForm] = useState({
    risk_profile: 'moderate',
    trading_mode: 'signal_only',
    max_positions: 5,
    risk_per_trade: 2,
    fo_enabled: false,
    preferred_option_type: 'put_options',
    daily_loss_limit: 5,
    weekly_loss_limit: 10,
    monthly_loss_limit: 20,
    trailing_sl_enabled: true,
  })

  // Broker state — PR 6: 3-tile grid, one-click OAuth (Zerodha/Upstox) +
  // credentials modal (Angel One).
  const [brokerConnections, setBrokerConnections] = useState<
    Array<{
      broker_name: BrokerName
      status: BrokerConnStatus
      account_id: string | null
      last_synced_at: string | null
    }>
  >([])
  const [brokerBusy, setBrokerBusy] = useState<BrokerName | null>(null)
  // 2026-06-12 — kill-switch activation goes through a deliberate modal
  // (ConfirmDialog), never native confirm() which accepts on a stray Enter.
  const [killConfirmOpen, setKillConfirmOpen] = useState(false)
  const [angelModalOpen, setAngelModalOpen] = useState(false)
  const [angelForm, setAngelForm] = useState({
    api_key: '',
    client_id: '',
    password: '',
    totp_secret: '',
  })
  const [showAngelPassword, setShowAngelPassword] = useState(false)
  // Zerodha uses the licensed Kite Connect OAuth flow (the credential
  // quick-connect was retired for compliance). The tile opens a short consent
  // modal, then we redirect to Zerodha's own secure login — we never see the
  // user's password or TOTP.
  const [zerodhaModalOpen, setZerodhaModalOpen] = useState(false)
  // Dhan (DhanHQ Trading API) is token-based — no OAuth redirect. Its tile
  // opens a small credentials modal (Client ID + Access Token), mirroring the
  // Angel One flow. BETA.
  const [dhanModalOpen, setDhanModalOpen] = useState(false)
  const [dhanForm, setDhanForm] = useState({ client_id: '', access_token: '' })
  const [showDhanToken, setShowDhanToken] = useState(false)
  // Kotak Neo (Neo API) is token-based — no OAuth redirect. Three fields:
  // Client ID (UCC) + Access Token + Session Token (Kotak's "sid"). BETA.
  const [kotakModalOpen, setKotakModalOpen] = useState(false)
  const [kotakForm, setKotakForm] = useState({ client_id: '', access_token: '', session_token: '' })
  const [showKotakToken, setShowKotakToken] = useState(false)
  const [showKotakSession, setShowKotakSession] = useState(false)
  // Alice Blue (ANT API) is token-based — no OAuth redirect. Two fields:
  // User ID + Access Token. BETA.
  const [aliceModalOpen, setAliceModalOpen] = useState(false)
  const [aliceForm, setAliceForm] = useState({ client_id: '', access_token: '' })
  const [showAliceToken, setShowAliceToken] = useState(false)

  // Notification form
  const [notificationForm, setNotificationForm] = useState({
    notifications_enabled: true,
    email_signals: true,
    email_trades: true,
    push_enabled: false,
    push_signals: false,
    push_trades: false,
  })

  // Load profile data
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        capital: profile.capital || 100000,
      })
      setTradingForm({
        risk_profile: profile.risk_profile || 'moderate',
        trading_mode: profile.trading_mode || 'signal_only',
        max_positions: profile.max_positions || 5,
        risk_per_trade: profile.risk_per_trade || 2,
        fo_enabled: profile.fo_enabled || false,
        preferred_option_type: profile.preferred_option_type || 'put_options',
        daily_loss_limit: profile.daily_loss_limit || 5,
        weekly_loss_limit: profile.weekly_loss_limit || 10,
        monthly_loss_limit: profile.monthly_loss_limit || 20,
        trailing_sl_enabled: profile.trailing_sl_enabled ?? true,
      })
      setNotificationForm({
        notifications_enabled: profile.notifications_enabled ?? true,
        email_signals: true,
        email_trades: true,
        push_enabled: false,
        push_signals: false,
        push_trades: false,
      })
    }
  }, [profile])

  // Load per-broker connection list.
  const loadBrokerConnections = async () => {
    try {
      const resp = await api.broker.getConnections()
      setBrokerConnections(resp.brokers || [])
    } catch (err) {
      console.error('Failed to load broker connections:', err)
    }
  }

  useEffect(() => {
    if (user) loadBrokerConnections()
  }, [user])

  // No redirect — allow browsing without auth (middleware handles gating when Supabase is configured)

  // Save handlers
  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await api.user.updateProfile(profileForm)
      await refreshProfile()
      setMessage({ type: 'success', text: 'Profile saved.' })
    } catch (err) {
      setMessage({ type: 'error', text: handleApiError(err) })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTrading = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await api.user.updateProfile(tradingForm)
      await refreshProfile()
      setMessage({ type: 'success', text: 'Trading settings saved.' })
    } catch (err) {
      setMessage({ type: 'error', text: handleApiError(err) })
    } finally {
      setSaving(false)
    }
  }

  // One-click connect — Upstox + Fyers use plain OAuth redirects; Zerodha opens
  // a short consent modal first, then redirects to Kite's secure login. Angel
  // One (SmartAPI) and Dhan (DhanHQ) are credential-based — they open a small
  // credentials modal instead of redirecting.
  const handleConnectBroker = async (broker: BrokerName) => {
    setMessage(null)
    if (broker === 'angelone') {
      setAngelModalOpen(true)
      return
    }
    if (broker === 'dhan') {
      setDhanModalOpen(true)
      return
    }
    if (broker === 'kotakneo') {
      setKotakModalOpen(true)
      return
    }
    if (broker === 'aliceblue') {
      setAliceModalOpen(true)
      return
    }
    if (broker === 'zerodha') {
      setZerodhaModalOpen(true)
      return
    }
    setBrokerBusy(broker)
    try {
      const resp = await api.broker.initiateOAuth(broker)
      if (!resp.auth_url) {
        throw new Error('No auth URL returned from broker')
      }
      // Preserve state across redirect so /broker/callback can verify it.
      try {
        sessionStorage.setItem('broker_oauth_state', resp.state)
        sessionStorage.setItem('broker_oauth_broker', broker)
      } catch {}
      window.location.href = resp.auth_url
    } catch (err) {
      setMessage({ type: 'error', text: handleApiError(err) })
      setBrokerBusy(null)
    }
  }

  const handleDisconnectBroker = async (broker: BrokerName) => {
    setBrokerBusy(broker)
    setMessage(null)
    try {
      await api.broker.disconnect(broker)
      await loadBrokerConnections()
      setMessage({ type: 'success', text: `${broker} disconnected.` })
    } catch (err) {
      setMessage({ type: 'error', text: handleApiError(err) })
    } finally {
      setBrokerBusy(null)
    }
  }

  const handleAngelSubmit = async () => {
    setBrokerBusy('angelone')
    setMessage(null)
    try {
      await api.broker.connect({
        broker_name: 'angelone',
        api_key: angelForm.api_key,
        client_id: angelForm.client_id,
        password: angelForm.password,
        totp_secret: angelForm.totp_secret,
      })
      setAngelModalOpen(false)
      setAngelForm({ api_key: '', client_id: '', password: '', totp_secret: '' })
      await loadBrokerConnections()
      setMessage({ type: 'success', text: 'Angel One connected.' })
    } catch (err) {
      setMessage({ type: 'error', text: handleApiError(err) })
    } finally {
      setBrokerBusy(null)
    }
  }

  // Dhan (DhanHQ) — token-based connect. Client ID + a self-generated Access
  // Token (valid ~30 days); no OAuth redirect. Mirrors the Angel One submit.
  const handleDhanSubmit = async () => {
    setBrokerBusy('dhan')
    setMessage(null)
    try {
      await api.broker.connect({
        broker_name: 'dhan',
        client_id: dhanForm.client_id,
        access_token: dhanForm.access_token,
      })
      setDhanModalOpen(false)
      setDhanForm({ client_id: '', access_token: '' })
      await loadBrokerConnections()
      setMessage({ type: 'success', text: 'Dhan connected.' })
    } catch (err) {
      setMessage({ type: 'error', text: handleApiError(err) })
    } finally {
      setBrokerBusy(null)
    }
  }

  // Kotak Neo (Neo API) — token-based connect. Client ID (UCC) + Access Token +
  // Session Token (Kotak's "sid"); no OAuth redirect. Mirrors the Dhan submit.
  const handleKotakSubmit = async () => {
    setBrokerBusy('kotakneo')
    setMessage(null)
    try {
      await api.broker.connect({
        broker_name: 'kotakneo',
        client_id: kotakForm.client_id,
        access_token: kotakForm.access_token,
        session_token: kotakForm.session_token,
      })
      setKotakModalOpen(false)
      setKotakForm({ client_id: '', access_token: '', session_token: '' })
      await loadBrokerConnections()
      setMessage({ type: 'success', text: 'Kotak Neo connected.' })
    } catch (err) {
      setMessage({ type: 'error', text: handleApiError(err) })
    } finally {
      setBrokerBusy(null)
    }
  }

  // Alice Blue (ANT API) — token-based connect. User ID (client_id) + Access
  // Token; no OAuth redirect. Mirrors the Dhan submit.
  const handleAliceSubmit = async () => {
    setBrokerBusy('aliceblue')
    setMessage(null)
    try {
      await api.broker.connect({
        broker_name: 'aliceblue',
        client_id: aliceForm.client_id,
        access_token: aliceForm.access_token,
      })
      setAliceModalOpen(false)
      setAliceForm({ client_id: '', access_token: '' })
      await loadBrokerConnections()
      setMessage({ type: 'success', text: 'Alice Blue connected.' })
    } catch (err) {
      setMessage({ type: 'error', text: handleApiError(err) })
    } finally {
      setBrokerBusy(null)
    }
  }

  // Zerodha OAuth — kick off the licensed Kite Connect login. We persist the
  // returned `state` so /broker/callback can verify it, then hand the browser
  // to Zerodha's own domain. No password or TOTP ever touches our servers.
  const handleZerodhaOAuth = async () => {
    setBrokerBusy('zerodha')
    setMessage(null)
    try {
      const resp = await api.broker.initiateOAuth('zerodha', 'settings')
      if (!resp.auth_url) {
        throw new Error('No auth URL returned from Zerodha')
      }
      // Preserve state across redirect so /broker/callback can verify it.
      try {
        sessionStorage.setItem('broker_oauth_state', resp.state)
        sessionStorage.setItem('broker_oauth_broker', 'zerodha')
      } catch {}
      window.location.href = resp.auth_url
    } catch (err) {
      setMessage({ type: 'error', text: handleApiError(err) })
      setBrokerBusy(null)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await api.user.updateProfile({
        notifications_enabled: notificationForm.notifications_enabled,
        push_enabled: notificationForm.push_signals || notificationForm.push_trades,
      })
      await refreshProfile()
      setMessage({ type: 'success', text: 'Notification settings saved.' })
    } catch (err) {
      setMessage({ type: 'error', text: handleApiError(err) })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <AppShell>
      <div className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
      </AppShell>
    )
  }

  if (!user) return (
    <AppShell>
      <div className="p-4 md:p-6">
        <EmptyState
          icon={<Settings className="h-6 w-6" />}
          title="Sign in to open Settings"
          description="Your profile, risk profile, broker links, and alerts. All in one place."
          action={
            <a href="/login">
              <Button>Sign in</Button>
            </a>
          }
        />
      </div>
    </AppShell>
  )

  // Left-rail nav. Most entries switch the inline panel; a few (`href`)
  // route to dedicated pages — WhatsApp (PR 60) and Security/2FA (PR 62)
  // are full flows with their own state, so they live on their own URLs
  // instead of being inlined here.
  type NavItem =
    | { id: TabKey; label: string; icon: typeof User; href?: undefined }
    | { id: string; label: string; icon: typeof User; href: string }
  const tabs: NavItem[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'broker', label: 'Broker', icon: Wallet },
    { id: 'trading', label: 'Risk profile', icon: TrendingUp },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'whatsapp', label: 'WhatsApp digest', icon: MessageCircle, href: '/settings/whatsapp' },
    { id: 'security', label: 'Security + 2FA', icon: Lock, href: '/settings/security' },
    { id: 'tier', label: 'Tier + billing', icon: Shield },
    { id: 'kill_switch', label: 'Kill switch', icon: AlertCircle },
    { id: 'data', label: 'Data', icon: Save },
  ]

  return (
    <AppShell>
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" aria-hidden="true" />
            Settings
          </span> as unknown as string
        }
        description="Account, broker links, risk profile, alerts. Tune it once, trade with it daily."
      />
      <div className="p-4 md:p-6">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-sm flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-up/10 border border-up/20'
                : 'bg-down/10 border border-down/20'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-up" />
            ) : (
              <AlertCircle className="w-5 h-5 text-down" />
            )}
            <p className={message.type === 'success' ? 'text-up' : 'text-down'}>
              {message.text}
            </p>
          </div>
        )}

        {/* Section nav — the reference archetype H: a left sub-nav tab rail,
            hash-anchored (#profile, #appearance, …) so sections deep-link. */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <aside className="h-fit rounded-[20px] border border-line bg-wrap p-2">
            <EyebrowMono className="px-3 pt-1 pb-2">Settings</EyebrowMono>
            <nav className="flex lg:flex-col gap-0.5 overflow-x-auto lg:overflow-visible">
              {tabs.map((tab) => {
                const external = 'href' in tab && !!tab.href
                const isActive = !external && activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (external) {
                        router.push(tab.href!)
                      } else {
                        selectTab(tab.id as TabKey)
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-[12px] rounded-sm transition-colors whitespace-nowrap ${
                      isActive
                        ? 'glass-control text-d-text-primary'
                        : 'text-d-text-secondary hover:text-d-text-primary hover:bg-hover border border-transparent'
                    }`}
                  >
                    <tab.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {external && <ArrowUpRight className="w-3 h-3 shrink-0 text-d-text-muted" />}
                  </button>
                )
              })}
            </nav>
          </aside>

          <div className="rounded-[20px] border border-line bg-wrap p-6 md:p-8 min-h-[500px]">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <EyebrowMono className="mb-2">Account</EyebrowMono>
                  <h2 className="font-display text-xl font-semibold text-d-text-primary mb-1">Profile</h2>
                  <p className="text-sm text-d-text-muted">Who you are and the capital you trade with.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-d-text-secondary mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="w-full px-4 py-3 bg-main border border-line rounded-sm text-d-text-primary placeholder:text-d-text-muted focus:outline-none focus:border-primary/40"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-d-text-secondary mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-main border border-line rounded-sm text-d-text-muted cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-d-text-secondary mb-2">Phone</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-main border border-line rounded-sm text-d-text-primary placeholder:text-d-text-muted focus:outline-none focus:border-primary/40"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-d-text-secondary mb-2">Trading Capital ({'\u20B9'})</label>
                    <input
                      type="number"
                      value={profileForm.capital}
                      onChange={(e) => setProfileForm({ ...profileForm, capital: Number(e.target.value) })}
                      className={`w-full px-4 py-3 bg-main border border-line rounded-sm text-d-text-primary placeholder:text-d-text-muted focus:outline-none focus:border-primary/40 ${MONO}`}
                      min="10000"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </Button>
              </div>
            )}

            {/* Trading Tab */}
            {activeTab === 'trading' && (
              <div className="space-y-6">
                <div>
                  <EyebrowMono className="mb-2">Risk profile</EyebrowMono>
                  <h2 className="font-display text-xl font-semibold text-d-text-primary mb-1">Trading Preferences</h2>
                  <p className="text-sm text-d-text-muted">Set the rules. Position size, risk per trade, loss limits. AutoPilot trades inside them.</p>
                </div>

                {profile && (
                  <div className="p-4 rounded-sm border border-line bg-main">
                    <h3 className="text-sm font-medium text-d-text-secondary mb-2">Execution Status</h3>
                    {(() => {
                      const start = profile.paper_trading_started_at ? new Date(profile.paper_trading_started_at) : profile.created_at ? new Date(profile.created_at) : null
                      const paperEnds = start ? new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000) : null
                      const liveEligible = !!profile.live_trading_whitelisted && paperEnds ? new Date() >= paperEnds : false
                      return (
                        <div className="space-y-1 text-sm text-d-text-muted">
                          <div>Mode: <span className="text-d-text-primary">{liveEligible ? 'Live Eligible' : 'Paper Only'}</span></div>
                          <div>Paper trading until: <span className="text-d-text-primary">{paperEnds ? paperEnds.toDateString() : 'N/A'}</span></div>
                          <div>Live whitelist: <span className="text-d-text-primary">{profile.live_trading_whitelisted ? 'Yes' : 'No'}</span></div>
                          <div className="flex items-center justify-between">
                            <span>Kill switch:</span>
                            <button
                              type="button"
                              onClick={async () => {
                                if (profile.kill_switch_active) {
                                  try {
                                    await api.user.updateProfile({ kill_switch_active: false })
                                    await refreshProfile()
                                    setMessage({ type: 'success', text: 'Kill switch deactivated.' })
                                  } catch {
                                    setMessage({ type: 'error', text: 'Failed to deactivate kill switch.' })
                                  }
                                } else {
                                  // Destructive — deliberate modal confirm, never native confirm().
                                  setKillConfirmOpen(true)
                                }
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                                profile.kill_switch_active
                                  ? 'glass-control-danger text-down'
                                  : 'glass-control text-d-text-muted'
                              }`}
                            >
                              {profile.kill_switch_active ? 'ACTIVE - Deactivate' : 'Activate Kill Switch'}
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Risk Profile */}
                  <div>
                    <label className="block text-sm font-medium text-d-text-secondary mb-3">Risk Profile</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {['conservative', 'moderate', 'aggressive'].map((risk) => (
                        <button
                          key={risk}
                          onClick={() => setTradingForm({ ...tradingForm, risk_profile: risk })}
                          className={`p-4 rounded-sm transition-all duration-200 ${
                            tradingForm.risk_profile === risk
                              ? 'glass-control-accent'
                              : 'glass-control text-d-text-muted'
                          }`}
                        >
                          <span className="capitalize font-medium">{risk}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trading Mode */}
                  <div>
                    <label className="block text-sm font-medium text-d-text-secondary mb-3">Trading Mode</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        { id: 'signal_only', label: 'Signals Only', desc: 'You get the call. You place the trade.' },
                        { id: 'semi_auto', label: 'Semi-Auto', desc: 'AutoPilot proposes. You approve each one.' },
                        { id: 'full_auto', label: 'Full Auto', desc: 'AutoPilot executes inside your limits.' },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setTradingForm({ ...tradingForm, trading_mode: mode.id })}
                          className={`p-4 rounded-sm glass-control transition-all duration-200 text-left ${
                            tradingForm.trading_mode === mode.id
                              ? 'ring-1 ring-primary/50'
                              : ''
                          }`}
                        >
                          <span className={`font-medium ${tradingForm.trading_mode === mode.id ? 'text-primary' : 'text-d-text-primary'}`}>
                            {mode.label}
                          </span>
                          <p className="text-xs text-d-text-muted mt-1">{mode.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-d-text-secondary mb-2">Max Positions</label>
                      <input
                        type="number"
                        value={tradingForm.max_positions}
                        onChange={(e) => setTradingForm({ ...tradingForm, max_positions: Number(e.target.value) })}
                        className={`w-full px-4 py-3 bg-main border border-line rounded-sm text-d-text-primary placeholder:text-d-text-muted focus:outline-none focus:border-primary/40 ${MONO}`}
                        min="1"
                        max="20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-d-text-secondary mb-2">Risk Per Trade (%)</label>
                      <input
                        type="number"
                        value={tradingForm.risk_per_trade}
                        onChange={(e) => setTradingForm({ ...tradingForm, risk_per_trade: Number(e.target.value) })}
                        className={`w-full px-4 py-3 bg-main border border-line rounded-sm text-d-text-primary placeholder:text-d-text-muted focus:outline-none focus:border-primary/40 ${MONO}`}
                        min="0.5"
                        max="10"
                        step="0.5"
                      />
                    </div>
                  </div>

                  {/* Loss Limits */}
                  <div>
                    <label className="block text-sm font-medium text-d-text-secondary mb-3">Loss Limits (%)</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-d-text-muted mb-1">Daily</label>
                        <input
                          type="number"
                          value={tradingForm.daily_loss_limit}
                          onChange={(e) => setTradingForm({ ...tradingForm, daily_loss_limit: Number(e.target.value) })}
                          className={`w-full px-3 py-2 bg-main border border-line rounded-sm text-d-text-primary placeholder:text-d-text-muted focus:outline-none focus:border-primary/40 ${MONO}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-d-text-muted mb-1">Weekly</label>
                        <input
                          type="number"
                          value={tradingForm.weekly_loss_limit}
                          onChange={(e) => setTradingForm({ ...tradingForm, weekly_loss_limit: Number(e.target.value) })}
                          className={`w-full px-3 py-2 bg-main border border-line rounded-sm text-d-text-primary placeholder:text-d-text-muted focus:outline-none focus:border-primary/40 ${MONO}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-d-text-muted mb-1">Monthly</label>
                        <input
                          type="number"
                          value={tradingForm.monthly_loss_limit}
                          onChange={(e) => setTradingForm({ ...tradingForm, monthly_loss_limit: Number(e.target.value) })}
                          className={`w-full px-3 py-2 bg-main border border-line rounded-sm text-d-text-primary placeholder:text-d-text-muted focus:outline-none focus:border-primary/40 ${MONO}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* F&O Settings */}
                  <div className="p-4 bg-main border border-line rounded-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-d-text-primary">F&O Trading</h3>
                        <p className="text-sm text-d-text-muted">Turn on futures and options. Higher leverage, higher stakes.</p>
                      </div>
                      <button
                        onClick={() => setTradingForm({ ...tradingForm, fo_enabled: !tradingForm.fo_enabled })}
                        className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                          tradingForm.fo_enabled ? 'bg-primary' : 'bg-wrap-line'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                          tradingForm.fo_enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                    {tradingForm.fo_enabled && (
                      <div>
                        <label className="block text-sm text-d-text-muted mb-2">Preferred Option Type</label>
                        <select
                          value={tradingForm.preferred_option_type}
                          onChange={(e) => setTradingForm({ ...tradingForm, preferred_option_type: e.target.value })}
                          className="w-full px-3 py-2 bg-main border border-line rounded-sm text-d-text-primary focus:outline-none focus:border-primary/40"
                        >
                          <option value="put_options">Put Options</option>
                          <option value="futures">Futures</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Trailing SL */}
                  <div className="flex items-center justify-between p-4 bg-main border border-line rounded-sm">
                    <div>
                      <h3 className="font-medium text-d-text-primary">Trailing Stop Loss</h3>
                      <p className="text-sm text-d-text-muted">Lock in gains. The SL follows price as the trade runs your way.</p>
                    </div>
                    <button
                      onClick={() => setTradingForm({ ...tradingForm, trailing_sl_enabled: !tradingForm.trailing_sl_enabled })}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                        tradingForm.trailing_sl_enabled ? 'bg-primary' : 'bg-wrap-line'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                        tradingForm.trailing_sl_enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                <Button onClick={handleSaveTrading} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Settings
                </Button>
              </div>
            )}

            {/* Broker Tab — PR 6: one-click OAuth for Zerodha + Upstox, credentials modal for Angel One */}
            {activeTab === 'broker' && (
              <div className="space-y-6">
                <div>
                  <EyebrowMono className="mb-2">Broker</EyebrowMono>
                  <h2 className="font-display text-xl font-semibold text-d-text-primary mb-1">Broker connection</h2>
                  <p className="text-sm text-d-text-muted">
                    Pick a broker. One-click OAuth links your account. Live trading unlocks once connected, on Elite tier.
                  </p>
                </div>

                {message?.type === 'error' && activeTab === 'broker' && (
                  <div className="p-3 bg-down/10 border border-down/20 rounded-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-down mt-0.5 shrink-0" />
                    <p className="text-sm text-down">{message.text}</p>
                  </div>
                )}

                {(() => {
                  // Modal-less OAuth brokers carry a short reassurance on the
                  // tile; the credential brokers' help lives in their forms.
                  const TILE_HELP: Partial<Record<BrokerName, string>> = {
                    upstox: 'You’ll log in securely on Upstox. We never see your password.',
                    fyers: 'You’ll log in securely on Fyers. We never see your password.',
                  }
                  const renderTile = (b: BrokerName) => {
                    const row = brokerConnections.find((c) => c.broker_name === b)
                    return (
                      <BrokerConnectTile
                        key={b}
                        broker={b}
                        status={(row?.status as BrokerConnStatus) || 'not_connected'}
                        accountId={row?.account_id}
                        lastSyncedAt={row?.last_synced_at}
                        busy={brokerBusy === b}
                        help={TILE_HELP[b]}
                        onConnect={() => handleConnectBroker(b)}
                        onDisconnect={() => handleDisconnectBroker(b)}
                      />
                    )
                  }
                  return (
                    <div className="space-y-5">
                      <div className="space-y-3">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-d-text-muted">
                          Instant · one-click login
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {OAUTH_BROKERS.map(renderTile)}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-d-text-muted">
                          Connect with a token
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {TOKEN_BROKERS.map(renderTile)}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div className="rounded-sm border border-line bg-wrap p-4 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-d-text-muted mt-0.5 shrink-0" />
                  <div className="text-[12px] text-d-text-muted leading-relaxed space-y-1">
                    <p>
                      Your credentials are encrypted with AES-256 (Fernet) before they hit storage. Disconnect anytime and stored tokens are wiped.
                    </p>
                    <p>
                      Zerodha, Upstox, and Fyers connect via the official OAuth login — you authorise on the broker&apos;s own site and we never see your password. Angel One (SmartAPI), Dhan, Kotak Neo, and Alice Blue connect with API credentials.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Angel One credentials modal (SmartAPI has no OAuth redirect) */}
            {angelModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                onClick={() => !brokerBusy && setAngelModalOpen(false)}
              >
                <div
                  className="w-full max-w-md space-y-4 rounded-sm border border-line bg-wrap p-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <h3 className="text-d-text-primary font-semibold text-[16px]">Connect Angel One</h3>
                    <div className="mt-1 space-y-0.5 text-[11px] text-d-text-muted leading-relaxed">
                      <p>1) Go to <a href="https://smartapi.angelbroking.com" target="_blank" rel="noreferrer" className="text-primary underline">smartapi.angelbroking.com</a> and create an app → get your API key.</p>
                      <p>2) Your Client ID is your Angel login ID.</p>
                      <p>3) In the SmartAPI app, enable TOTP and copy the TOTP secret (base32). Paste all three below.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FieldInput
                      label="API key"
                      value={angelForm.api_key}
                      onChange={(v) => setAngelForm({ ...angelForm, api_key: v })}
                      placeholder="SmartAPI key"
                    />
                    <FieldInput
                      label="Client ID"
                      value={angelForm.client_id}
                      onChange={(v) => setAngelForm({ ...angelForm, client_id: v.toUpperCase() })}
                      placeholder="e.g. D12345"
                      uppercase
                    />
                    <FieldInput
                      label="PIN / Password"
                      value={angelForm.password}
                      onChange={(v) => setAngelForm({ ...angelForm, password: v })}
                      placeholder="Login password or MPIN"
                      type={showAngelPassword ? 'text' : 'password'}
                      adornment={
                        <button
                          type="button"
                          onClick={() => setShowAngelPassword(!showAngelPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-d-text-muted hover:text-d-text-primary"
                        >
                          {showAngelPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      }
                    />
                    <FieldInput
                      label="TOTP secret"
                      value={angelForm.totp_secret}
                      onChange={(v) => setAngelForm({ ...angelForm, totp_secret: v.replace(/\s/g, '').toUpperCase() })}
                      placeholder="TOTP secret key"
                      mono
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setAngelModalOpen(false)}
                      disabled={!!brokerBusy}
                      className="flex-1 py-2 text-[13px] text-d-text-secondary glass-control rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAngelSubmit}
                      disabled={!!brokerBusy || !angelForm.api_key || !angelForm.client_id || !angelForm.password || !angelForm.totp_secret}
                      className="flex-1 py-2 text-[13px] font-medium glass-control-accent rounded-full active:scale-[0.98] transition-opacity disabled:opacity-40"
                    >
                      {brokerBusy === 'angelone' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Connecting…
                        </span>
                      ) : (
                        'Connect Angel One'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dhan credentials modal — DhanHQ Trading API is token-based (no
                OAuth redirect). Two fields only: Client ID + Access Token. */}
            {dhanModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                onClick={() => !brokerBusy && setDhanModalOpen(false)}
              >
                <div
                  className="w-full max-w-md space-y-4 rounded-sm border border-line bg-wrap p-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-d-text-primary font-semibold text-[16px]">Connect Dhan</h3>
                      <span className="rounded-full border border-line px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-d-text-muted">
                        Beta
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5 text-[11px] text-d-text-muted leading-relaxed">
                      <p>1) Open <a href="https://web.dhan.co" target="_blank" rel="noreferrer" className="text-primary underline">web.dhan.co</a> → Profile → DhanHQ Trading API.</p>
                      <p>2) Copy your Client ID and generate an Access Token (valid ~30 days). Paste both below.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <FieldInput
                      label="Client ID"
                      value={dhanForm.client_id}
                      onChange={(v) => setDhanForm({ ...dhanForm, client_id: v })}
                      placeholder="Dhan Client ID"
                    />
                    <FieldInput
                      label="Access Token"
                      value={dhanForm.access_token}
                      onChange={(v) => setDhanForm({ ...dhanForm, access_token: v })}
                      placeholder="DhanHQ access token"
                      type={showDhanToken ? 'text' : 'password'}
                      mono
                      adornment={
                        <button
                          type="button"
                          onClick={() => setShowDhanToken(!showDhanToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-d-text-muted hover:text-d-text-primary"
                        >
                          {showDhanToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setDhanModalOpen(false)}
                      disabled={!!brokerBusy}
                      className="flex-1 py-2 text-[13px] text-d-text-secondary glass-control rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDhanSubmit}
                      disabled={!!brokerBusy || !dhanForm.client_id || !dhanForm.access_token}
                      className="flex-1 py-2 text-[13px] font-medium glass-control-accent rounded-full active:scale-[0.98] transition-opacity disabled:opacity-40"
                    >
                      {brokerBusy === 'dhan' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Connecting…
                        </span>
                      ) : (
                        'Connect Dhan'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Kotak Neo credentials modal — Neo API is token-based (no OAuth
                redirect). Three fields: Client ID (UCC) + Access Token +
                Session Token (Kotak's "sid"). */}
            {kotakModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                onClick={() => !brokerBusy && setKotakModalOpen(false)}
              >
                <div
                  className="w-full max-w-md space-y-4 rounded-sm border border-line bg-wrap p-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-d-text-primary font-semibold text-[16px]">Connect Kotak Neo</h3>
                      <span className="rounded-full border border-line px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-d-text-muted">
                        Beta
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5 text-[11px] text-d-text-muted leading-relaxed">
                      <p>1) Log in to the Kotak Neo API portal (<a href="https://napi.kotaksecurities.com" target="_blank" rel="noreferrer" className="text-primary underline">napi.kotaksecurities.com</a>) and create an app.</p>
                      <p>2) Generate your access token + session id (sid).</p>
                      <p>3) Paste your Client ID (UCC), Access Token and Session Token below.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <FieldInput
                      label="Client ID (UCC)"
                      value={kotakForm.client_id}
                      onChange={(v) => setKotakForm({ ...kotakForm, client_id: v })}
                      placeholder="Kotak Neo UCC"
                    />
                    <FieldInput
                      label="Access Token"
                      value={kotakForm.access_token}
                      onChange={(v) => setKotakForm({ ...kotakForm, access_token: v })}
                      placeholder="Neo API access token"
                      type={showKotakToken ? 'text' : 'password'}
                      mono
                      adornment={
                        <button
                          type="button"
                          onClick={() => setShowKotakToken(!showKotakToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-d-text-muted hover:text-d-text-primary"
                        >
                          {showKotakToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      }
                    />
                    <FieldInput
                      label="Session Token (sid)"
                      value={kotakForm.session_token}
                      onChange={(v) => setKotakForm({ ...kotakForm, session_token: v })}
                      placeholder="Neo API session id (sid)"
                      type={showKotakSession ? 'text' : 'password'}
                      mono
                      adornment={
                        <button
                          type="button"
                          onClick={() => setShowKotakSession(!showKotakSession)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-d-text-muted hover:text-d-text-primary"
                        >
                          {showKotakSession ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setKotakModalOpen(false)}
                      disabled={!!brokerBusy}
                      className="flex-1 py-2 text-[13px] text-d-text-secondary glass-control rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleKotakSubmit}
                      disabled={!!brokerBusy || !kotakForm.client_id || !kotakForm.access_token || !kotakForm.session_token}
                      className="flex-1 py-2 text-[13px] font-medium glass-control-accent rounded-full active:scale-[0.98] transition-opacity disabled:opacity-40"
                    >
                      {brokerBusy === 'kotakneo' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Connecting…
                        </span>
                      ) : (
                        'Connect Kotak Neo'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Alice Blue credentials modal — ANT API is token-based (no OAuth
                redirect). Two fields: User ID + Access Token. */}
            {aliceModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                onClick={() => !brokerBusy && setAliceModalOpen(false)}
              >
                <div
                  className="w-full max-w-md space-y-4 rounded-sm border border-line bg-wrap p-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-d-text-primary font-semibold text-[16px]">Connect Alice Blue</h3>
                      <span className="rounded-full border border-line px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-d-text-muted">
                        Beta
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5 text-[11px] text-d-text-muted leading-relaxed">
                      <p>1) Log in to Alice Blue → Apps → API.</p>
                      <p>2) Get your API key and generate a session/access token.</p>
                      <p>3) Paste your User ID and Access Token below.</p>
                      <p><a href="https://aliceblueonline.com" target="_blank" rel="noreferrer" className="text-primary underline">aliceblueonline.com</a></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <FieldInput
                      label="User ID"
                      value={aliceForm.client_id}
                      onChange={(v) => setAliceForm({ ...aliceForm, client_id: v })}
                      placeholder="Alice Blue User ID"
                    />
                    <FieldInput
                      label="Access Token"
                      value={aliceForm.access_token}
                      onChange={(v) => setAliceForm({ ...aliceForm, access_token: v })}
                      placeholder="Alice Blue access token"
                      type={showAliceToken ? 'text' : 'password'}
                      mono
                      adornment={
                        <button
                          type="button"
                          onClick={() => setShowAliceToken(!showAliceToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-d-text-muted hover:text-d-text-primary"
                        >
                          {showAliceToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setAliceModalOpen(false)}
                      disabled={!!brokerBusy}
                      className="flex-1 py-2 text-[13px] text-d-text-secondary glass-control rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAliceSubmit}
                      disabled={!!brokerBusy || !aliceForm.client_id || !aliceForm.access_token}
                      className="flex-1 py-2 text-[13px] font-medium glass-control-accent rounded-full active:scale-[0.98] transition-opacity disabled:opacity-40"
                    >
                      {brokerBusy === 'aliceblue' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Connecting…
                        </span>
                      ) : (
                        'Connect Alice Blue'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Zerodha OAuth consent modal — licensed Kite Connect login. No
                credentials: we redirect to Zerodha's own secure login and
                never see the user's password or TOTP. */}
            {zerodhaModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                onClick={() => !brokerBusy && setZerodhaModalOpen(false)}
              >
                <div
                  className="w-full max-w-md space-y-4 rounded-sm border border-line bg-wrap p-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <h3 className="text-d-text-primary font-semibold text-[16px]">Connect Zerodha</h3>
                    <p className="text-[12px] text-d-text-muted mt-0.5">
                      You&apos;ll be taken to Zerodha&apos;s secure Kite login to authorise access. Quant X never handles your Zerodha password or TOTP.
                    </p>
                  </div>

                  <div className="flex items-start gap-2 rounded-sm border border-line bg-main p-3">
                    <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] text-d-text-muted leading-relaxed">
                      Authorisation uses the official Kite Connect OAuth flow. Revoke access anytime from Zerodha, or by disconnecting here.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setZerodhaModalOpen(false)}
                      disabled={!!brokerBusy}
                      className="flex-1 py-2 text-[13px] text-d-text-secondary glass-control rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleZerodhaOAuth}
                      disabled={!!brokerBusy}
                      className="flex-1 py-2 text-[13px] font-medium glass-control-accent rounded-full active:scale-[0.98] transition-opacity disabled:opacity-40"
                    >
                      {brokerBusy === 'zerodha' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Redirecting…
                        </span>
                      ) : (
                        'Connect with Zerodha'
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-d-text-muted text-center">
                    You&apos;ll log in securely on Zerodha. We never see your password.
                  </p>
                </div>
              </div>
            )}


            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <EyebrowMono className="mb-2">Notifications</EyebrowMono>
                  <h2 className="font-display text-xl font-semibold text-d-text-primary mb-1">Notification Preferences</h2>
                  <p className="text-sm text-d-text-muted">Decide what reaches you, and where. Signals, fills, and market moves.</p>
                </div>

                <div className="space-y-4">
                  {/* WIRING #2 (2026-05-31) — Event-level preference grid.
                      Picks up the 8 new O.7 events (max_pain_shift, oi_spike,
                      position_unprotected, adjustment_recommended, vix_regime_change,
                      pcr_extreme, portfolio_drawdown, cron_failed) dynamically. */}
                  <AlertPreferencesGrid />

                  {/* The full Alerts Studio — channel tests, bulk enable/disable,
                      and the per-symbol price-alert links — lives at /alerts.
                      The grid is dual-mounted here + there (SWR dedupes the fetch). */}
                  <div className="flex justify-end">
                    <a
                      href="/alerts"
                      className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:underline"
                    >
                      Manage in Alerts Studio
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Master Toggle */}
                  <div className="flex items-center justify-between p-4 bg-main border border-line rounded-sm">
                    <div>
                      <h3 className="font-medium text-d-text-primary">Enable Notifications</h3>
                      <p className="text-sm text-d-text-muted">The master switch for signals, fills, and updates.</p>
                    </div>
                    <button
                      onClick={() => setNotificationForm({ ...notificationForm, notifications_enabled: !notificationForm.notifications_enabled })}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                        notificationForm.notifications_enabled ? 'bg-primary' : 'bg-wrap-line'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                        notificationForm.notifications_enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {notificationForm.notifications_enabled && (
                    <>
                      {/* Email Notifications */}
                      <div className="p-4 bg-main border border-line rounded-sm space-y-3">
                        <h3 className="font-medium text-d-text-primary">Email Notifications</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-d-text-secondary">New Signals</span>
                          <button
                            onClick={() => setNotificationForm({ ...notificationForm, email_signals: !notificationForm.email_signals })}
                            className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                              notificationForm.email_signals ? 'bg-primary' : 'bg-wrap-line'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                              notificationForm.email_signals ? 'translate-x-5' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-d-text-secondary">Trade Executions</span>
                          <button
                            onClick={() => setNotificationForm({ ...notificationForm, email_trades: !notificationForm.email_trades })}
                            className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                              notificationForm.email_trades ? 'bg-primary' : 'bg-wrap-line'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                              notificationForm.email_trades ? 'translate-x-5' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                      </div>

                      {/* Push Notifications */}
                      <div className="p-4 bg-main border border-line rounded-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-d-text-primary">Push: Signal Alerts</h3>
                            <p className="text-xs text-d-text-muted">A new gated signal hits your phone the moment it fires.</p>
                          </div>
                          <button
                            onClick={() => setNotificationForm({ ...notificationForm, push_signals: !notificationForm.push_signals })}
                            className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                              notificationForm.push_signals ? 'bg-primary' : 'bg-wrap-line'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                              notificationForm.push_signals ? 'translate-x-5' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-main border border-line rounded-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-d-text-primary">Push: Trade Updates</h3>
                            <p className="text-xs text-d-text-muted">Every fill, the second it executes.</p>
                          </div>
                          <button
                            onClick={() => setNotificationForm({ ...notificationForm, push_trades: !notificationForm.push_trades })}
                            className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                              notificationForm.push_trades ? 'bg-primary' : 'bg-wrap-line'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                              notificationForm.push_trades ? 'translate-x-5' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Cross-link to dedicated channel pages that have their own
                    opt-in flows (OTP, deep-links, TOTP). Sidebar already
                    shows these, but surfacing them from the channel tab
                    matches user intent when they come to "set up alerts". */}
                <div className="space-y-2">
                  <EyebrowMono>Additional channels</EyebrowMono>
                  <button
                    type="button"
                    onClick={() => router.push('/settings/whatsapp')}
                    className="w-full flex items-center justify-between gap-3 p-4 rounded-sm glass-control transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-[13px] font-medium text-d-text-primary">WhatsApp daily digest</p>
                        <p className="text-[11px] text-d-text-muted">Pro and up. Morning brief, evening wrap.</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-d-text-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTab('notifications')}
                    className="w-full flex items-center justify-between gap-3 p-4 rounded-sm glass-control transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-[13px] font-medium text-d-text-primary">Telegram bot</p>
                        <p className="text-[11px] text-d-text-muted">Free tier included. Instant alerts plus a daily digest.</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-d-text-muted" />
                  </button>
                </div>

                {/* PR 124 — watchlist preset pin manager. Cross-device
                    pins (PR 123) need a single surface to review and
                    edit; otherwise users have to open every symbol
                    individually to delete a pin. */}
                <WatchlistPinsPanel />

                <Button onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Preferences
                </Button>
              </div>
            )}

            {/* Appearance — light / dark / system (default system, 2026-06-20) */}
            {activeTab === 'appearance' && (
              <section className="space-y-6">
                <header>
                  <EyebrowMono className="mb-2">Appearance</EyebrowMono>
                  <div className="flex items-center gap-3 mb-1">
                    <Palette className="w-4 h-4 text-primary" />
                    <h2 className="font-display text-xl font-semibold text-d-text-primary">Appearance</h2>
                  </div>
                  <p className="text-[13px] text-d-text-muted">
                    Set how Quant X looks. System is the default. It tracks your
                    OS preference and flips live when your OS does. Light is a cool
                    near-white palette for daylight reading. Dark is a near-black
                    canvas for after-hours sessions.
                  </p>
                </header>

                {/* Dual-mode 2026-06-12 — managed vs pro experience.
                    Per-account (ui_preferences), unlike the per-device theme. */}
                <div>
                  <EyebrowMono className="mb-3">Experience</EyebrowMono>
                  <ModePanel />
                </div>

                {/* Tri-theme toggle — light / dark / system (next-themes, live). */}
                <div>
                  <EyebrowMono className="mb-3">Theme</EyebrowMono>
                  <ThemeToggle />
                </div>

                <div className="rounded-sm border border-line bg-main p-4 text-[12px] text-d-text-secondary leading-relaxed">
                  <p className="mb-2 font-medium text-d-text-primary">
                    Where your preference lives
                  </p>
                  <p>
                    It lives in your browser under <code className="font-mono text-[11px]">quantx.theme</code>. Clear site data or
                    switch browsers and you reset to the default
                    (System). The choice is per-device, not per-account.
                    Your phone can run dark while your desktop stays light.
                  </p>
                </div>
              </section>
            )}

            {/* PR 25 — Tier + billing tab */}
            {activeTab === 'tier' && (
              <TierPanel
                tierInfo={tierInfo}
                onLoad={setTierInfo}
                setMessage={setMessage}
                quizRec={quizRec}
              />
            )}

            {/* PR 25 — Kill switch tab */}
            {activeTab === 'kill_switch' && (
              <KillSwitchPanel
                profile={profile}
                pauseHours={killPauseHours}
                setPauseHours={setKillPauseHours}
                onRefreshProfile={refreshProfile}
                setMessage={setMessage}
              />
            )}

            {/* PR 25 — Data tab */}
            {activeTab === 'data' && (
              <DataPanel
                busy={dataBusy}
                setBusy={setDataBusy}
                setMessage={setMessage}
              />
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Kill-switch activation — deliberate modal (Cancel takes focus). */}
      <ConfirmDialog
        open={killConfirmOpen}
        onClose={() => setKillConfirmOpen(false)}
        title="Activate kill switch?"
        destructive
        confirmLabel="Close everything"
        body="This closes ALL open positions through your broker and freezes trading until you switch it back on. Positions already closed cannot be undone."
        onConfirm={async () => {
          try {
            await api.trades.killSwitch()
            await refreshProfile()
            setMessage({ type: 'success', text: 'Kill switch activated. All positions closed.' })
          } catch {
            setMessage({ type: 'error', text: 'Failed to activate kill switch.' })
          }
        }}
      />
    </AppShell>
  )
}

// ============================================================================
// FieldInput — tiny helper used in Angel One credentials modal
// ============================================================================

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  mono,
  uppercase,
  adornment,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  mono?: boolean
  uppercase?: boolean
  adornment?: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-d-text-secondary mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={`w-full px-3 py-2 bg-main border border-line rounded-sm text-[13px] text-d-text-primary placeholder:text-d-text-muted focus:outline-none focus:border-primary/50 ${
            mono ? 'font-mono tracking-wider' : ''
          } ${uppercase ? 'uppercase' : ''}`}
        />
        {adornment}
      </div>
    </div>
  )
}
