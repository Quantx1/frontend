# QUANT X — INFORMATION ARCHITECTURE (AS-BUILT)

> Companion to `01-DESIGN-SYSTEM.md`. This is the complete route map, navigation
> model, layout shells, and access gating of the shipped app — the skeleton that
> `03-SCREEN-INVENTORY.md` fills in.

---

## 1. THE FOUR LAYOUT SHELLS

Every screen in the app renders inside exactly one of these.

### Shell A — Root only (`app/layout.tsx`)
Bare `<html>` + `<body>` + theme/data providers. No chrome. Used by the public
landing, auth screens, onboarding, callbacks, and the global error/404 pages.

```
<html class="{GeistSans} {GeistMono}" suppressHydrationWarning>
  <body class="font-sans bg-main antialiased noise-overlay">
    <Providers>{children}</Providers>
```
- `viewport`: `width=device-width, initialScale=1, maximumScale=5, userScalable`,
  `viewportFit: 'cover'`, `themeColor: #0D0D0E`
- Theme: next-themes, `defaultTheme="system"`, `enableSystem`

### Shell B — Platform AppShell (`app/(platform)/layout.tsx` → `components/shell/AppShell.tsx`)
The authenticated 3-zone product shell. **This is the app.**

```
┌─────────────┬────────────────────────────────────────────┬──────────┐
│  SIDEBAR    │  MAIN PANE (scrolls)                       │ RIGHT    │
│  fixed      │  ┌──────────────────────────────────────┐  │ RAIL     │
│  240 / 68px │  │ ConnectBrokerBanner (conditional)    │  │ fixed    │
│  bg L1      │  ├──────────────────────────────────────┤  │ 72px     │
│             │  │ page content                         │  │ icons    │
│             │  │ max-w-1440px · px-4 md:px-6          │  │ bg L0    │
│             │  ├──────────────────────────────────────┤  │          │
│             │  │ ComplianceFooter (always)            │  │          │
└─────────────┴──└──────────────────────────────────────┘──┴──────────┘
```

| Element | Spec |
|---|---|
| Skip-to-content link | first focusable, `sr-only` until focused, then absolute top-left, accent fill, 6px radius |
| Sidebar | fixed, `240px` expanded / `68px` collapsed, `bg-wrap` (L1), persisted to `localStorage["quantx.sidebar.collapsed.v2"]` |
| Right rail | fixed `72px`, icon-only utilities, `bg-main` (L0), **desktop only** |
| Main pane margins | `lg:ml-60` (or `lg:ml-[68px]` collapsed) · `lg:mr-[72px]`, `transition-[margin] 200ms` |
| Content cap | `max-w-[1440px]`, gutters `px-4` mobile / `px-6` ≥md |
| Desktop top bar | **none** — breadcrumbs live inside each page |
| Mobile (< lg) | `Topbar` appears with a hamburger → `MobileDrawer` |
| Command palette | `⌘K` / `Ctrl+K` toggle, `Esc` closes palette + drawer |
| Compliance footer | rendered on **every** authed surface, inside the 1440px cap |
| Sticky overlay | `AutopilotStickyStop` — a persistent kill-switch bar when the bot is live |

### Shell C — Admin (`app/admin/layout.tsx`)
Its own nav and chrome, outside the consumer IA. Nine screens.

### Shell D — Auth (`components/auth/AuthLayout.tsx`)
Centred single-column card on a forced register, used by login / signup /
forgot-password / verify-email.

---

## 2. SIDEBAR NAVIGATION — the canonical IA

Source: `components/shell/nav.ts`. Order below **is** render order.

```
┌────────────────────────────┐
│  ⌕  Search            ⌘K   │   ← opens CommandPalette
│  ✎  New Chat               │   ← top action → /copilot
├────────────────────────────┤
│  ▤  Markets                │   /markets
│  ⌕  Stocks                 │   /stocks
│  ⬡  AutoPilot              │   /autopilot
├─ SIGNALS ──────────────────┤
│  ▥  Signals                │   /signals
├─ AI TOOLS ─────────────────┤
│  ⌗  Screener               │   /scanner
│  ◈  Chart Patterns         │   /patterns
│  ✦  AI Algos               │   /strategies
│  ▤  F&O               ELITE│   /fno          ← tier-gated
├─ PORTFOLIO ────────────────┤
│  ▣  Portfolio              │   /portfolio
│  ⚗  Paper                  │   /paper-trading
│  ▤  Trades                 │   /trades
│  ⚠  Risk                   │   /risk
├────────────────────────────┤
│  History (recent chats)    │
├────────────────────────────┤
│  footer: theme · settings  │
└────────────────────────────┘
```

| Rule | Detail |
|---|---|
| Group labels | `micro` role — 11px uppercase, +0.06em, weight 500, muted ink. The `top` group has **no** label |
| Icons | lucide-react: `LineChart`, `Search`, `Bot`, `BarChart3`, `ScanLine`, `Brain`, `Wand2`, `Layers`, `Briefcase`, `FlaskConical`, `ScrollText`, `ShieldAlert` |
| Active state | longest-prefix match — `/signals/*` keeps **Signals** highlighted |
| Tier badge | `/fno` carries an `elite` chip; other tier gates happen at the action, not the nav |
| Collapsed | `68px`, icons only, labels become tooltips |
| Not in nav | every other route is reachable via the **Command Palette** (⌘K) and the right rail |

**Deliberately absent from the sidebar:** the AI engines (Alpha / Mood / Regime /
Counterpoint) have no in-app showcase page. They power signals internally; their
names appear only as marketing on the public landing.

---

## 3. COMPLETE ROUTE MAP

### 3.1 Public (no auth)

| Route | File | Screen |
|---|---|---|
| `/` | `app/page.tsx` | Public landing (14 LOC — delegates) |
| `/login` | `app/login/page.tsx` | Sign in |
| `/signup` | `app/signup/page.tsx` | Sign up |
| `/forgot-password` | `app/forgot-password/page.tsx` | Password reset request |
| `/verify-email` | `app/verify-email/page.tsx` | Email verification |
| `/auth/callback` | `app/auth/callback/page.tsx` | OAuth return |
| `/broker/callback` | `app/broker/callback/page.tsx` | Broker OAuth return |
| `/markets` | `app/markets/page.tsx` | Market overview — **public prefix** |
| `/preview-design` | `app/preview-design/page.tsx` | Internal design preview — **public prefix** |
| `/proof`, `/models`, `/track-record`, `/regime` | — | Public trust surfaces (crawlable, prefix-allowed) |
| `/pricing`, `/privacy`, `/terms` | — | Marketing/legal (public set) |

### 3.2 Onboarding (authed, pre-product)

| Route | File | Screen |
|---|---|---|
| `/onboarding/risk-quiz` | `app/onboarding/risk-quiz/page.tsx` | Risk-profile questionnaire |
| `/onboarding/broker-connect` | `app/onboarding/broker-connect/page.tsx` | Broker connection |
| `/onboarding/complete` | `app/onboarding/complete/page.tsx` | Welcome / done |

### 3.3 Platform — `(platform)` group, wrapped in AppShell

| Route | File | Screen |
|---|---|---|
| `/copilot` | `app/(platform)/copilot/page.tsx` | **The AI home.** Chat + authed cockpit band |
| `/autopilot` | `app/(platform)/autopilot/page.tsx` | Automated trading bot |
| `/autopilot/track-record` | `.../track-record/page.tsx` | Bot performance history |
| `/scanner` | `app/(platform)/scanner/page.tsx` | Screener hub |
| `/scanner/[screen]` | `.../[screen]/page.tsx` | Prebuilt screener results |
| `/scanner/fundamental/[preset]` | `.../fundamental/[preset]/page.tsx` | Fundamental preset results |
| `/scanner/my/[id]` | `.../my/[id]/page.tsx` | Saved screen results |
| `/scanner/new` | `.../new/page.tsx` | Screener builder |
| `/patterns` | `app/(platform)/patterns/page.tsx` | Chart-pattern detection |
| `/strategies` | `app/(platform)/strategies/page.tsx` | AI Algos hub |
| `/strategies/[slug]` | `.../[slug]/page.tsx` | Catalogue strategy detail |
| `/strategies/mine/[id]` | `.../mine/[id]/page.tsx` | My strategy — build/backtest/deploy |
| `/strategies/deployed` | `.../deployed/page.tsx` | Deployed strategies |
| `/fno` | `app/(platform)/fno/page.tsx` | F&O analytics — **elite tier** |
| `/paper-trading` | `app/(platform)/paper-trading/page.tsx` | Paper trading |
| `/risk` | `app/(platform)/risk/page.tsx` | Risk dashboard |
| `/inbox` | `app/(platform)/inbox/page.tsx` | Notifications |
| `/referrals` | `app/(platform)/referrals/page.tsx` | Referral programme |

### 3.4 Platform — root-level authed routes (own layout, not in `(platform)`)

| Route | File | Screen |
|---|---|---|
| `/signals` | `app/signals/page.tsx` | Signals hub (10 LOC — delegates to `SignalsHub`) |
| `/signals/[id]` | `app/signals/[id]/page.tsx` | Signal detail — thesis, debate, FAQ |
| `/signals/alpha-picks` | 6 LOC | Category deep-link → shared `CategorySignalsPage` |
| `/signals/momentum` | 6 LOC | ″ |
| `/signals/momentum-picks` | 6 LOC | ″ |
| `/signals/swing` | 6 LOC | ″ |
| `/signals/index-momentum-30` | 6 LOC | ″ |
| `/stocks` | `app/stocks/page.tsx` | Stock universe browser |
| `/stock/[symbol]` | `app/stock/[symbol]/page.tsx` | **Per-stock AI dossier** (17 cards) |
| `/watchlist` | `app/watchlist/page.tsx` | Watchlist |
| `/portfolio` | `app/portfolio/page.tsx` | Portfolio |
| `/trades` | `app/trades/page.tsx` | Trade log |
| `/trades/[id]` | `app/trades/[id]/page.tsx` | Trade detail |
| `/alerts` | `app/alerts/page.tsx` | Alerts Studio |
| `/settings` | `app/settings/page.tsx` | **Settings** (1,654 LOC — the largest page) |

### 3.5 Admin — `app/admin/*`, own shell, outside the consumer IA

| Route | Screen |
|---|---|
| `/admin` | Admin overview |
| `/admin/ml` | ML operations |
| `/admin/model-performance` | Model performance |
| `/admin/payments` | Payments |
| `/admin/signals` | Signal administration |
| `/admin/system` | System health |
| `/admin/training` | Training runs |
| `/admin/users` | User list |
| `/admin/users/[id]` | User detail |

### 3.6 Route-level states (per segment)

| File | Renders |
|---|---|
| `loading.tsx` | Suspense skeleton — present for `(platform)`, `admin`, `portfolio`, `settings`, `signals`, `stocks`, `trades`, `watchlist`, and root |
| `error.tsx` | Error boundary — present for the same segments |
| `not-found.tsx` | Global 404 (`app/not-found.tsx`) |

---

## 4. RETIRED ROUTES → 301 REDIRECTS

Nothing 404s. Every retired v1 URL 301s to its v2 home so deep-links, SEO equity
and bookmarks survive. **A redesign must keep these targets reachable.**

| Retired | → |
|---|---|
| `/dashboard`, `/tools`, `/assistant`, `/home`, `/activity` | `/copilot` |
| `/swingmax-signal`, `/engines`, `/engines/*` | `/signals` |
| `/swingmax-portfolio`, `/weekly-review`, `/ai-portfolio`, `/analytics` | `/portfolio` |
| `/screener`, `/pattern-detection`, `/scanner-lab` | `/scanner` |
| `/quantai-alpha-pick`, `/momentum` | `/strategies?filter=momentum` |
| `/earnings-calendar` | `/strategies?filter=earnings` |
| `/marketplace`, `/my-strategies` | `/strategies` |
| `/fo-strategies` | `/fno?tab=lab` |
| `/notifications` | `/inbox` |
| `/auto-trader` | `/autopilot` |
| `/ai-intelligence` | `/models` |
| `/models`, `/track-record`, `/regime` | `/proof?tab=…` |
| `/login/mfa`, `/settings/security` | `/settings?tab=security` |
| `/settings/whatsapp` | `/settings?tab=channels` |
| `/onboarding/telegram` | `/onboarding/risk-quiz` |

Unauthenticated access to a gated route redirects to `/login?redirect=<pathname>`.

### 4.1 ⚠ Redirects that are currently broken (verified against source)

Do **not** design destinations for these until they are fixed — they are dead ends today.

| Redirect | Verified reality |
|---|---|
| `/models`, `/track-record`, `/regime`, `/engines`, `/engines/*`, `/ai-intelligence` → `/proof?tab=…` | **`app/proof/` does not exist.** All of these land on the global 404 |
| `/pricing`, `/privacy`, `/terms` (whitelisted as public) | **No pages exist** in this app — they live in the separate `landing/` app |
| `/settings/security` → `?tab=security`, `/settings/whatsapp` → `?tab=channels`, `/login/mfa` → `?tab=security` | `VALID_TABS` is `['profile','trading','broker','notifications','appearance','tier','kill_switch','data']` — **neither `security` nor `channels` is valid**, so all three silently land on Profile |
| `/home`, `/activity` → `/copilot` "Simple view band" | `components/managed/SimpleView.tsx` has **zero importers** (only a stale comment in `nav.ts` mentions it). The promised surface no longer renders |
| `/quantai-alpha-pick`, `/momentum` → `/strategies?filter=momentum` | `/strategies` **never reads the `filter` param** — the redirect lands on the unfiltered hub |

See [`06-DEFECTS-AND-NOTES.md`](06-DEFECTS-AND-NOTES.md) for the full defect list.

---

## 5. ACCESS GATES

| Gate | Effect |
|---|---|
| **Auth** | Everything except §3.1 requires a Supabase session |
| **Tier — Pro** | Going *live* on AutoPilot. Paper AutoPilot is **free for all tiers** |
| **Tier — Elite** | `/fno` |
| **Broker connection** | `ConnectBrokerBanner` appears app-wide until a broker is linked; live positions/trade tickets are locked behind `BrokerLock` |
| **Simple view** | Managed users get a per-page plain-language **Simple / Full** toggle (`components/managed/SimpleView.tsx`) rather than a separate beginner shell |

---

## 6. GLOBAL OVERLAY SURFACES

These are not routes but behave like screens and must be designed.

| Surface | Component | Spec |
|---|---|---|
| **Command Palette** | `shell/CommandPalette.tsx` | ⌘K, floating (blurred, elev-3), the app's operating system |
| **Mobile Drawer** | `shell/MobileDrawer.tsx` | slide-in left, `< lg`, mirrors sidebar IA |
| **Right utility rail** | `shell/RightRail.tsx` | Fixed 72px icon rail, desktop only. **It does not expand into a panel.** It opens exactly three things: its own 224px account dropdown, the global Copilot dock, and the ⌘K palette. (`shell/ContextPanel.tsx` — a tabbed right slide-over — and `markets/MarketPanel.tsx` were both deleted by the 2026-08-05 markets revert `40c2ede`; nothing replaced them.) |
| **Autopilot Sticky Stop** | `shell/AutopilotStickyStop.tsx` | persistent kill switch when the bot is live |
| **Connect-broker banner** | `broker/ConnectBrokerBanner.tsx` | top of main pane, until a broker is linked |
| **Offline banner** | `system/OfflineBanner.tsx` | connectivity loss |
| **System halt banner** | `shared/SystemHaltBanner.tsx` | trading halted |
| **Toasts** | sonner via `foundation/Toast.tsx` | async feedback |
| **Trade ticket** | `trade/TradeTicketButton.tsx` | order entry overlay |
| **Global copilot** | `copilot/GlobalCopilot.tsx` | copilot reachable from any screen |

---

## 7. THE FIVE PRIMARY JOURNEYS

A redesign must keep these walkable end to end.

| # | Journey | Path |
|---|---|---|
| **J1** | Morning read | `/copilot` (cockpit band) → `/markets` → a signal |
| **J2** | Research a stock | `/stocks` → filter → `/stock/[symbol]` → AI dossier tabs |
| **J3** | Screen for a setup | `/scanner` → prebuilt tile **or** `/scanner/new` builder → results table |
| **J4** | Build → backtest → refine → deploy | `/strategies` → `/strategies/mine/[id]` → backtest → `/strategies/deployed` |
| **J5** | Check the book / react to an alert | `/inbox` or `/alerts` → `/portfolio` / `/trades` / `/paper-trading` / `/risk` |

---

*Next: `03-SCREEN-INVENTORY.md` — the per-screen anatomy of everything listed above.*
