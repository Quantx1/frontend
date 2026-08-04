# QUANT X — SCREEN INVENTORY (AS-BUILT)

> Every screen, overlay and route-state surface in the app, extracted from source.
> Read [`01-DESIGN-SYSTEM.md`](01-DESIGN-SYSTEM.md) first — it defines every token used here.
> Paste-ready generation prompts: [`04-STITCH-PROMPTS.md`](04-STITCH-PROMPTS.md).
> Primitive component specs: [`05-COMPONENT-CATALOGUE.md`](05-COMPONENT-CATALOGUE.md).

**89 surfaces across 11 families.** Each family is its own file so the
detail stays navigable; every surface entry carries its own Stitch prompt inline.

| Family | Surfaces | File |
|---|---|---|
| **Global app chrome** | 19 | [`screens/shell-chrome.md`](screens/shell-chrome.md) |
| **Auth, onboarding & callbacks** | 13 | [`screens/auth-onboarding.md`](screens/auth-onboarding.md) |
| **The Copilot home (AI thread)** | 6 | [`screens/home-copilot.md`](screens/home-copilot.md) |
| **Markets, stock universe & watchlist** | 4 | [`screens/markets-stocks.md`](screens/markets-stocks.md) |
| **Signals hub & signal detail** | 7 | [`screens/signals.md`](screens/signals.md) |
| **Screener & chart patterns** | 6 | [`screens/scanner-patterns.md`](screens/scanner-patterns.md) |
| **AI Algos (strategies)** | 10 | [`screens/strategies.md`](screens/strategies.md) |
| **Portfolio, trades & paper trading** | 4 | [`screens/portfolio-trades.md`](screens/portfolio-trades.md) |
| **AutoPilot, track record & risk** | 5 | [`screens/autopilot-risk-fno.md`](screens/autopilot-risk-fno.md) |
| **Inbox, alerts & referrals** | 4 | [`screens/inbox-alerts-settings.md`](screens/inbox-alerts-settings.md) |
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
| ~~`components/shell/ContextPanel.tsx`~~ | REMOVED — deleted with the `/markets` revert; there is no slide-over panel in the app |
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

### Markets, stock universe & watchlist → [`screens/markets-stocks.md`](screens/markets-stocks.md)

| Route / path | Screen |
|---|---|
| `/markets` | Markets — regime-aware desk |
| `/stocks` | Stocks — full NSE universe discovery |
| `/stock/[symbol]` | Stock terminal — single-symbol entity page |
| `/watchlist` | Watchlist — active monitoring surface |

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

### Inbox, alerts & referrals → [`screens/inbox-alerts-settings.md`](screens/inbox-alerts-settings.md)

| Route / path | Screen |
|---|---|
| `/inbox` | Inbox (notifications feed) |
| `/alerts` | Alerts Studio (event × channel routing) |
| `/referrals` | Referrals (invite loop) |
| `/settings` | Settings (10-section account console) |

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
