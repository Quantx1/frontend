# QUANT X — SCREEN INVENTORY (AS-BUILT)

> Every screen, overlay and route-state surface in the app, extracted from source.
> Read [`01-DESIGN-SYSTEM.md`](01-DESIGN-SYSTEM.md) first — it defines every token used here.
> Paste-ready generation prompts: [`04-STITCH-PROMPTS.md`](04-STITCH-PROMPTS.md).
> Primitive component specs: [`05-COMPONENT-CATALOGUE.md`](05-COMPONENT-CATALOGUE.md).

**196 surfaces across 20 families.** Each family is its own file so the
detail stays navigable; every surface entry carries its own Stitch prompt inline.

| Family | Surfaces | File |
|---|---|---|
| **Global app chrome** | 19 | [`screens/shell-chrome.md`](screens/shell-chrome.md) |
| **Shell coverage & routing defects** | 3 | [`screens/shell-map.md`](screens/shell-map.md) |
| **Route-level loading / error / 404 / share-card surfaces** | 14 | [`screens/route-states.md`](screens/route-states.md) |
| **Auth, onboarding & callbacks** | 13 | [`screens/auth-onboarding.md`](screens/auth-onboarding.md) |
| **The Copilot home (AI thread)** | 9 | [`screens/home-copilot.md`](screens/home-copilot.md) |
| **Markets, stock universe & watchlist** | 8 | [`screens/markets-stocks.md`](screens/markets-stocks.md) |
| **Stock dossier — header & tab bodies** | 4 | [`screens/stock-tabs.md`](screens/stock-tabs.md) |
| **Stock dossier — the AI analysis cards** | 17 | [`screens/stock-cards.md`](screens/stock-cards.md) |
| **Signals hub & signal detail** | 7 | [`screens/signals.md`](screens/signals.md) |
| **Screener & chart patterns** | 6 | [`screens/scanner-patterns.md`](screens/scanner-patterns.md) |
| **AI Algos (strategies)** | 10 | [`screens/strategies.md`](screens/strategies.md) |
| **Portfolio, trades & paper trading** | 4 | [`screens/portfolio-trades.md`](screens/portfolio-trades.md) |
| **AutoPilot, track record & risk** | 5 | [`screens/autopilot-risk-fno.md`](screens/autopilot-risk-fno.md) |
| **F&O hub — all six tabs** | 6 | [`screens/fno-tabs.md`](screens/fno-tabs.md) |
| **F&O Lab — strategy workspace** | 11 | [`screens/fno-lab.md`](screens/fno-lab.md) |
| **Inbox, alerts & referrals** | 4 | [`screens/inbox-alerts-settings.md`](screens/inbox-alerts-settings.md) |
| **Settings — every section** | 24 | [`screens/settings.md`](screens/settings.md) |
| **Overlay surfaces (modals & sheets that behave like screens)** | 9 | [`screens/overlays.md`](screens/overlays.md) |
| **Paywall & locked states** | 12 | [`screens/paywalls.md`](screens/paywalls.md) |
| **Admin console** | 11 | [`screens/admin.md`](screens/admin.md) |

---

## Every surface, A–Z by family

### Global app chrome → [`screens/shell-chrome.md`](screens/shell-chrome.md)

| Route / path | Screen |
|---|---|
| `components/shell/AppShell.tsx` | App Shell — 3-zone authenticated frame |
| `components/shell/Sidebar.tsx` | Left Sidebar — brand, actions, nav, chat history, upgrade |
| `components/shell/NavList.tsx + nav.ts` | Navigation list — grouped IA (shared desktop + mobile) |
| `components/shell/Topbar.tsx` | Mobile Topbar |
| `components/shell/MobileDrawer.tsx` | Mobile navigation drawer |
| `components/shell/RightRail.tsx` | Right utility rail — Copilot, watchlist, alerts, account, theme |
| `components/shell/CommandPalette.tsx (⌘K)` | Command Palette — intent-aware ⌘K command bar |
| `components/shell/ComplianceFooter.tsx` | Compliance Footer — statutory block on every authed surface |
| `components/shell/AutopilotStickyStop.tsx` | AutoPilot sticky stop — mobile panic FAB + confirm sheet |
| `app/layout.tsx` | Root document + provider stack |
| `app/loading.tsx` | Root loading skeleton |
| `app/error.tsx` | Root error boundary |
| `app/not-found.tsx` | 404 — Page not found |
| `app/global-error.tsx` | Global error — last line of defence |
| `/preview-design` | Design system preview (dev-only) |
| `components/system/OfflineBanner.tsx + components/shared/SystemHaltBanner.tsx + components/broker/ConnectBrokerBanner.tsx` | Global status banners — offline, trading halt, broker prompt |
| `components/brand/QuantXMark.tsx + components/ui/BrandLogo.tsx + app/icon.svg` | Brand mark & logo system |
| `components/theme/ThemeToggle.tsx + AnimatedThemeToggle.tsx` | Theme controls — 3-way segmented + rail quick flip |
| `(global chrome — no route of its own; rendered by AppShell on every route whose page/layout mounts AppShell: /markets, /stocks, /watchlist, /settings, /portfolio, /trades, /trades/[id], /signals/[id], /alerts, /copilot and the whole app/(platform) group)` | Right Utility Rail — 72px fixed icon rail |

### Shell coverage & routing defects → [`screens/shell-map.md`](screens/shell-map.md)

| Route / path | Screen |
|---|---|
| `* (every route in the app)` | Shell coverage map |
| `middleware.ts — RETIRED_ROUTE_REDIRECTS + publicPaths + PUBLIC_PREFIXES` | Broken redirect targets |
| `n/a — components with zero importers` | Dead and unreferenced UI |

### Route-level loading / error / 404 / share-card surfaces → [`screens/route-states.md`](screens/route-states.md)

| Route / path | Screen |
|---|---|
| `/portfolio (Next.js route-level loading UI)` | Portfolio loading skeleton |
| `/settings (Next.js route-level loading UI)` | Settings loading skeleton |
| `/stocks (Next.js route-level loading UI)` | Stocks loading skeleton |
| `/trades (Next.js route-level loading UI)` | Trades loading skeleton |
| `/watchlist (Next.js route-level loading UI)` | Watchlist loading skeleton |
| `/signals (Next.js route-level loading UI)` | Signals loading skeleton |
| `/copilot, /scanner, /autopilot, /risk, /strategies, /patterns, /fno, /inbox, /paper-trading, /referrals (the entire (platform) route group)` | Platform group loading skeleton (inside AppShell) |
| `/admin, /admin/users, /admin/payments, /admin/signals, /admin/ml, /admin/training, /admin/system (route-level loading UI)` | Admin loading skeleton (inside AdminLayout) |
| `/ and any route without a nearer loading.tsx (root loading UI)` | Root loading skeleton |
| `Rendered in place of the page at 7 route segments (see notableCopy). Component path: app/<segment>/error.tsx` | Route error boundary (canonical) |
| `/ (root error boundary — catches errors in app/page.tsx and any segment lacking its own boundary)` | Root error boundary |
| `/admin and all /admin/* segments (component path: app/admin/error.tsx)` | Admin error boundary |
| `Any unmatched URL (Next.js global 404) — /not-found, /portfolio/typo, etc.` | 404 — Page not found |
| `/opengraph-image — edge-rendered 1200×630 PNG, referenced by openGraph.images and twitter.images in app/layout.tsx` | OpenGraph share card (live data) |

### Auth, onboarding & callbacks → [`screens/auth-onboarding.md`](screens/auth-onboarding.md)

| Route / path | Screen |
|---|---|
| `/login` | Sign In |
| `/signup` | Sign Up — Step 1 (Account details) |
| `/signup (step 2)` | Sign Up — Step 2 (Pick your plan) |
| `/signup (step 3)` | Sign Up — Step 3 (Confirm & create account) |
| `/forgot-password` | Forgot Password |
| `/verify-email` | Verify Email |
| `/auth/callback` | OAuth Callback (Supabase) |
| `/broker/callback` | Broker OAuth Callback |
| `/onboarding/broker-connect` | Onboarding Step 1 — Connect a broker |
| `/onboarding/risk-quiz` | Onboarding Step 2 — Risk calibration quiz |
| `/onboarding/risk-quiz (result)` | Onboarding Step 2 — Risk profile result |
| `/onboarding/risk-quiz (mode choice)` | Onboarding Step 2b — Managed vs Pro mode |
| `/onboarding/complete` | Onboarding Step 3 — You're set up |

### The Copilot home (AI thread) → [`screens/home-copilot.md`](screens/home-copilot.md)

| Route / path | Screen |
|---|---|
| `/` | Root landing (server redirect to /copilot) |
| `/copilot` | Copilot — AI Home (hero composer + market cockpit) |
| `/copilot (view: thread)` | Copilot — Main Chat thread (full-height conversation) |
| `(global overlay on every authed route incl. /copilot)` | Copilot dock — persistent right-side chat panel |
| `/copilot (and every (platform) route) — loading` | Platform route loading skeleton |
| `/copilot (and every (platform) route) — error` | Platform route error boundary |
| `No route of its own — renders inside a turn on /copilot (thread + inline answer card), the global Copilot dock (mounted app-wide by CopilotProvider), /portfolio (via RenderedSurface my_book), /signals and /signals/index-momentum-30 (via SignalsHub → SignalsOverview → RenderedSurface signals_today), and /preview-design (dev-only; notFound() in production)` | EntityCard — the one card a reply is allowed to render |
| `/portfolio (template 'my_book') and /signals + /signals/index-momentum-30 (template 'signals_today', via SignalsHub → SignalsOverview)` | RenderedSurface — a deterministic answer, rendered as a turn |
| `No route of its own — mounted on /copilot (the thread at page.tsx:947 and the inline answer card at page.tsx:223), the global Copilot dock (components/copilot/CopilotProvider.tsx:616, available on every authed route), inside RenderedSurface on /portfolio and /signals, and on /preview-design (dev-only)` | TurnCard — the one-card cap, rendered |

### Markets, stock universe & watchlist → [`screens/markets-stocks.md`](screens/markets-stocks.md)

| Route / path | Screen |
|---|---|
| `/markets` | Markets — the twelve-card research desk |
| `/stocks` | Stocks — full NSE universe discovery |
| `/stock/[symbol]` | Stock terminal — single-symbol entity page |
| `/watchlist` | Watchlist — active monitoring surface |
| `/markets#daily-briefing` | DailyBriefingCard — the time-aware AI market hero |
| `/markets#big-deals` | BigDealsCard — bulk & block institutional paper trail |
| `/markets#breadth` | BreadthCard — advance/decline counts + cumulative A/D line |
| `/markets#market-explainer` | MarketExplainerCard — 'What's happening in the market' |

### Stock dossier — header & tab bodies → [`screens/stock-tabs.md`](screens/stock-tabs.md)

| Route / path | Screen |
|---|---|
| `/stock/[symbol] — header band (shell-less)` | Stock Terminal — Breadcrumb + Identity/Price Header |
| `/stock/[symbol]?tab=technical` | Tab body — Engine Read |
| `/stock/[symbol]?tab=why` | Tab body — Why It Moves |
| `/stock/[symbol]?tab=forecast` | Tab body — Forecast |

### Stock dossier — the AI analysis cards → [`screens/stock-cards.md`](screens/stock-cards.md)

| Route / path | Screen |
|---|---|
| `components/stock/AIDossierPanel.tsx` | AI Dossier — engine meter panel |
| `components/stock/FusionVerdictCard.tsx` | Fusion Verdict |
| `components/stock/AITradeDeskCard.tsx` | AI Trade Desk |
| `components/stock/ProbabilityCard.tsx` | Setup Probabilities |
| `components/stock/TabAiRead.tsx` | Tab AI Read strip |
| `components/stock/WhyMovingCard.tsx` | Why is it moving? — grounded driver agent |
| `components/stock/TechnicalsPanelCard.tsx` | Technicals & Levels — full technical system panel |
| `components/stock/RelativeStrengthCard.tsx` | Relative Strength vs NIFTY |
| `components/stock/VolumeIntelCard.tsx` | Volume Intelligence (spike · percentile · delivery · CVD proxy) |
| `components/stock/OrderBookCard.tsx` | Order Book + Liquidity (live L2 depth) |
| `components/stock/ChartVisionCard.tsx` | Chart vision — AI candlestick read (Elite) |
| `components/stock/IndicatorInterpreterCard.tsx` | What the indicators say — Indicator Interpreter (DEAD CODE, zero importers) |
| `components/stock/SentimentCard.tsx` | Sentiment (three-layer fusion tile card) |
| `components/stock/NewsMoodCard.tsx` | News Mood (on-demand headline sentiment meter + digest) |
| `components/stock/NewsIntelligenceCard.tsx` | News intelligence (multi-source deduped story feed) |
| `components/stock/FundamentalsCard.tsx` | Fundamentals (beginner→advanced quality & valuation bento) |
| `components/stock/EarningsPreviewCard.tsx` | Earnings preview (collapsed ask-AI strip) |

### Signals hub & signal detail → [`screens/signals.md`](screens/signals.md)

| Route / path | Screen |
|---|---|
| `/signals` | Signals Hub — Overview (master blotter) |
| `/signals/alpha-picks (also reachable as /signals?horizon=swing; /signals/swing 308-redirects here)` | Alpha Picks book (engine-as-landing) |
| `/signals/momentum-picks (also /signals?horizon=momentum; /signals/momentum 308-redirects here)` | Momentum Picks book (ranked, engine-as-landing) |
| `/signals/index-momentum-30` | Index Momentum 30 book (Nifty-200 cross-sectional) |
| `/signals/[id]` | Signal detail — thesis, pressure-test and execution |
| `/signals (segment loading UI, also covers /signals/* children)` | Signals route loading skeleton |
| `/signals (segment error boundary, also covers /signals/* children)` | Signals route error boundary |

### Screener & chart patterns → [`screens/scanner-patterns.md`](screens/scanner-patterns.md)

| Route / path | Screen |
|---|---|
| `/scanner` | Screener gallery (screen library) |
| `/scanner/[screen]` | Prebuilt screen detail (record + live matches) |
| `/scanner/fundamental/[preset]` | Fundamental screen detail |
| `/scanner/my/[id]` | My saved screen (AI-generated screen detail + management) |
| `/scanner/new` | AI screen generator (3-step builder) |
| `/patterns` | AI chart-pattern scanner |

### AI Algos (strategies) → [`screens/strategies.md`](screens/strategies.md)

| Route / path | Screen |
|---|---|
| `/strategies` | AI Algos — Library tab (default) |
| `/strategies` | AI Algos — My strategies tab |
| `/strategies` | AI Algos — Builder tab, compose state (NL → DSL) |
| `/strategies` | AI Algos — Builder tab, compiled state (DSL preview → backtest → results) |
| `/strategies` | AI Algos — Discovered tab, run list + new-run modal |
| `/strategies` | AI Algos — Discovered tab, run detail (ranked candidates) |
| `/strategies/[slug]` | Strategy template detail |
| `/strategies/mine/[id]` | My strategy detail — DSL, backtest runner, results, AI read |
| `/strategies/mine/[id]` | Promote-to-live confirmation modal |
| `/strategies/deployed` | Deployed strategies — live P&L dashboard |

### Portfolio, trades & paper trading → [`screens/portfolio-trades.md`](screens/portfolio-trades.md)

| Route / path | Screen |
|---|---|
| `/portfolio` | Portfolio (book + live broker) |
| `/trades` | Trade History (journal + closed trades) |
| `/trades/[id]` | Trade Review (single-trade journal entry) |
| `/paper-trading` | Paper Trading (virtual ₹10,00,000 book) |

### AutoPilot, track record & risk → [`screens/autopilot-risk-fno.md`](screens/autopilot-risk-fno.md)

| Route / path | Screen |
|---|---|
| `/autopilot` | AutoPilot Cockpit |
| `/autopilot/track-record` | AutoPilot Track Record |
| `/risk` | Risk & Analytics Centre |
| `/fno` | F&O Desk (unified derivatives hub) |
| `/fno?tab=lab` | Strategy Lab (F&O workspace) |

### F&O hub — all six tabs → [`screens/fno-tabs.md`](screens/fno-tabs.md)

| Route / path | Screen |
|---|---|
| `/fno?tab=overview` | F&O Desk — Overview (index snapshots + flow + copilot + strategy hints) |
| `/fno?tab=analysis` | F&O Desk — EOD Derivatives Analysis (PCR gauge · max pain · OI walls · participants · ban list) |
| `/fno?tab=stocks` | F&O Desk — Stock Scanners (FII/DII strip + 5 OI-buildup buckets) |
| `/fno?tab=oi` | F&O Desk — OI Tracker (strike-wise CE/PE open-interest ladder with ΔOI overlay) |
| `/fno?tab=payoff` | F&O Desk — Payoff Calculator (leg builder + scenario sliders + expiry payoff chart) |
| `/fno?tab=lab` | F&O Desk — Strategy Lab (tab entry point for the folded F&O workspace) |

### F&O Lab — strategy workspace → [`screens/fno-lab.md`](screens/fno-lab.md)

| Route / path | Screen |
|---|---|
| `/fno?tab=lab` | Strategy Lab — workspace shell (header, KPI strip, regime strip, copilot, tab rail) |
| `/fno?tab=lab#recommendations` | Recommendations grid — live rule-based multi-leg proposals |
| `/fno?tab=lab#deploy-confirm` | Deploy to paper — confirmation dialog |
| `/fno?tab=lab#open` | Open paper positions — live 30s mark-to-market book |
| `/fno?tab=lab#close` | Close position flow — immediate, no confirm dialog |
| `/fno?tab=lab#adjust` | Defend & adjust — ranked roll/hedge/defend suggestions overlay |
| `/fno?tab=lab#closed` | Closed book — last 10 realised positions, headerless audit rows |
| `/fno?tab=lab#chain` | Live option chain (OI/LTP) + click-to-build strategy builder |
| `/fno?tab=lab#chain-analytics` | Chain analytics views — Greeks table, Volatility Smile, Term Structure, Vol Cone |
| `/fno?tab=lab#ai-suggest` | Ask the AI copilot — plain-English view to a pre-priced structure |
| `/fno?tab=lab#backtest` | Inline template backtest — 180-day results modal |

### Inbox, alerts & referrals → [`screens/inbox-alerts-settings.md`](screens/inbox-alerts-settings.md)

| Route / path | Screen |
|---|---|
| `/inbox` | Inbox (notifications feed) |
| `/alerts` | Alerts Studio (event × channel routing) |
| `/referrals` | Referrals (invite loop) |
| `/settings` | Settings (10-section account console) |

### Settings — every section → [`screens/settings.md`](screens/settings.md)

| Route / path | Screen |
|---|---|
| `/settings` | Settings shell — page header + left section rail |
| `/settings (route-level loading.tsx)` | Settings — route loading skeleton |
| `/settings (route-level error.tsx)` | Settings — route error boundary |
| `/settings (no session)` | Settings — signed-out gate + auth spinner |
| `/settings?tab=profile` | Profile section |
| `/settings?tab=broker` | Broker section — seven-tile connect grid |
| `/settings?tab=broker (Angel One modal)` | Broker credentials — Angel One (SmartAPI) |
| `/settings?tab=broker (Dhan modal)` | Broker credentials — Dhan (DhanHQ) |
| `/settings?tab=broker (Kotak Neo modal)` | Broker credentials — Kotak Neo (Neo API) |
| `/settings?tab=broker (Alice Blue modal)` | Broker credentials — Alice Blue (ANT API) |
| `/settings?tab=broker (Zerodha modal)` | Broker OAuth consent — Zerodha (Kite Connect) |
| `/settings?tab=broker (tile component)` | BrokerConnectTile — single broker card |
| `/settings?tab=trading` | Risk profile / Trading Preferences section |
| `/settings?tab=appearance` | Appearance section |
| `/settings?tab=appearance (ModePanel)` | ModePanel — Managed vs Pro experience switch |
| `/settings?tab=notifications` | Notifications section |
| `/settings?tab=notifications (grid)` | AlertPreferencesGrid — event × channel matrix |
| `/settings?tab=notifications (pins)` | WatchlistPinsPanel — per-symbol alert preset pins |
| `/settings?tab=tier` | Tier + billing section |
| `/settings?tab=kill_switch` | Kill switch section |
| `/settings?tab=data` | Data + account section |
| `/settings?tab=security (nav row → dead end)` | Security + 2FA — external nav row |
| `/settings?tab=whatsapp (nav row → dead end)` | WhatsApp digest — external nav row |
| `/settings (destructive confirms)` | Kill-switch confirmation dialogs — two variants |

### Overlay surfaces (modals & sheets that behave like screens) → [`screens/overlays.md`](screens/overlays.md)

| Route / path | Screen |
|---|---|
| `/signals/[id] → overlay (no URL change; state `showTrade`, mode from `tradeMode` = 'paper' \| 'live')` | QuickTrade — order ticket (collect step) |
| `/signals/[id] → confirm overlay (Radix portal, no URL change; opens when `pendingLiveTrade` is set after the QuickTrade ticket is submitted in live mode)` | Confirm live order — mandatory second step (signal detail) |
| `/paper-trading and /signals/[id] → overlay (state `plannerOpen` / `showCalc`; type="planner")` | CalculatorModal — Trade Planner mode |
| `/paper-trading → overlay (state `sizerOpen`; type="position", conditionally rendered so it remounts fresh each open)` | CalculatorModal — Position Sizing mode |
| `(unreachable) type="risk" — implemented in full, zero call sites in the repo` | CalculatorModal — Risk Management mode (dead branch) |
| `/watchlist → overlay (state `editingAlerts` on a WatchCard; opened from the card's "alerts on"/"alerts off" footer button with a pencil glyph)` | AlertEditModal — watchlist alert thresholds |
| `Mounted on /portfolio, /stock/[symbol], /watchlist (table cell + WatchCard footer) and /signals (SignalsOverview) — overlay, no URL change` | TradeTicketButton — main order-entry flow (trigger → ticket → confirm → toast) |
| `Global — mounted once by GlobalCopilot in root Providers; opens on the `copilot:quota_exhausted` window event after any /api/assistant/chat 429` | CopilotQuotaModal — credits-exhausted upsell |
| `Inline gate rendered in place of gated content — inside QuickTrade's body, BrokerPositionsPanel, /autopilot risk-rail card, OiHeatmap and DerivativesAnalysis on /fno and /stock/[symbol]` | BrokerLock — no-broker gate (plain + frosted-preview modes) |

### Paywall & locked states → [`screens/paywalls.md`](screens/paywalls.md)

| Route / path | Screen |
|---|---|
| `/alerts (Free / non-Pro tier)` | Alerts Studio — full-page Pro paywall (replace-the-page) |
| `/signals/[id] — "Pressure-test" section, non-Elite branch` | Inline replace-with-card lock (Counterpoint debate, Elite gate) |
| `components/broker/BrokerLock.tsx (children/glass mode) — rendered inside /markets F&O, /stock F&O panels` | Frosted-glass blur-over lock + CTA (BrokerLock glass mode) |
| `components/broker/BrokerLock.tsx (plain mode) — /autopilot, QuickTrade modal, BrokerPositionsPanel` | Plain lock card (BrokerLock default mode) |
| `/watchlist (Free tier at or over cap)` | Soft cap lock — usage meter + truncation banner + disabled control + 402 toast |
| `/settings?tab=tier (component: app/settings/_components/TierPanel.tsx)` | TierPanel — plan, quiz recommendation, usage cap and upgrade surface |
| `Global overlay (mounted once at platform layout) — components/CopilotQuotaModal.tsx` | Quota-exhausted upgrade modal (429 credits) |
| `components/stock/AIDossierPanel.tsx — Free-tier footer strip (rendered on /stock/[symbol] Engine Read tab)` | Inline footer upgrade strip (partial-content lock) |
| `components/foundation/UsageMeter.tsx (used in /watchlist header; designed for signals/day, Copilot credits, Doctor runs)` | Inline usage chip (quota as a badge) |
| `/stock/[symbol] (e.g. /stock/RELIANCE)` | Stock terminal — as-built gating (broker-conditional modules, NO tier paywall) |
| `components/charts/LightweightChart.tsx (embedded at /stock/[symbol] and /signals/[id], height 520)` | Chart status scrim — the only overlay (NOT a paywall) |
| `Global — components/broker/ConnectBrokerBanner.tsx (AppShell) + components/shell/Sidebar.tsx upgrade pill` | Persistent chrome upsells — dismissible broker strip + gradient sidebar CTA |

### Admin console → [`screens/admin.md`](screens/admin.md)

| Route / path | Screen |
|---|---|
| `/admin/*` | Admin shell |
| `/admin` | Admin Dashboard |
| `/admin/users` | Users |
| `/admin/users/[id]` | User detail |
| `/admin/payments` | Payments |
| `/admin/signals` | Signal Analytics |
| `/admin/ml` | ML Dashboard |
| `/admin/training` | Training pipeline |
| `/admin/system` | System Health |
| `/admin/model-performance` | Model Performance |
| `/admin (route-level states)` | Admin loading skeleton & error boundary |
