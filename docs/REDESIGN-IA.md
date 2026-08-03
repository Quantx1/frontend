# QUANT X — NEW INFORMATION ARCHITECTURE

**Verified inventory:** 55 `page.tsx` route files exist under `frontend/app/` (enumerated by `find frontend -name page.tsx`; count confirmed = 55, of which 9 are `/admin/*`). Every one is triaged in §2.

Anchors verified by reading source, not inherited from the audits:
- `frontend/components/shell/nav.ts:36-66` — 12 nav items across 4 sections (`NAV_SECTIONS`, nav.ts:70-75). `/watchlist`, `/alerts`, `/inbox`, `/referrals`, `/settings` are **not** in `NAV`.
- `frontend/components/shell/Sidebar.tsx:119-129` — "New Chat" already exists as the primary sidebar action; `Sidebar.tsx:20-32, 161-210` already renders date-grouped chat History (`Today / Yesterday / Previous 7 days / Earlier`). **The reference sidebar is already half-built.**
- `frontend/middleware.ts:11-70` — a working 301 map (`RETIRED_ROUTE_REDIRECTS`) with query-carry-through at `middleware.ts:229-238`, plus prefix rules at `:243-259`. This is the machine that makes §7 free.
- `frontend/lib/copilot-modes.ts:41-53` — the 5 modes (`ask/analyze/screen/doctor/trade`) with prompt-prefix directives, and `:60-116` nine brand-safe NSE example prompts per mode. Mode chips are already a shipped primitive.
- `frontend/components/shell/CommandPalette.tsx:46-77` — 28 ROUTES entries; comment at `:44-45` states the palette "is the guarantee that no surface is unreachable."
- `frontend/app/(platform)/layout.tsx:44-47` — any user with `!onboarding.completed` is `router.replace('/onboarding/broker-connect')`. First impression = broker list.
- `frontend/app/preview-design/page.tsx:2` imports `notFound` (internal-only design harness); `frontend/app/broker/callback/page.tsx:1-30` is an OAuth handler, not a product surface.

---

## 1. THE NEW SIDEBAR — 4 items + history

```
┌────────────────────────┐
│  ◆ Quant X             │   240px, near-white, one hairline, no glow
│                        │
│  ⊕  New Chat           │ ← primary action (already exists, Sidebar.tsx:119-129)
│                        │
│  ◷  Markets            │
│  ▤  Book               │
│  ⟳  Tasks          (3) │ ← count badge = running agent tasks
│                        │
│ ─────────────────────  │
│  TODAY                 │
│   Why is TATAMOTORS…   │
│   Screen: volume surge │
│  PREVIOUS 7 DAYS       │
│   Tighten the stop on… │
│   What's the market d… │
│  EARLIER               │
│   …                    │
│ ─────────────────────  │
│  RK  rishi@…      ⚙︎   │ ← account + settings = chrome, not a destination
└────────────────────────┘
```

| Item | Absorbs | Why it earns a slot |
|---|---|---|
| **New Chat** | — | Already the primary action (`Sidebar.tsx:119-129`). Rule 1: the product is an input. Keeping it at the top makes "ask" the cheapest action in the app. |
| **Markets** | `/markets`, `/stocks`, `/watchlist`, `/patterns`, `/signals*`, `/stock/[symbol]`, `/fno` (discovery half) | The single "what should I look at" destination. The audits found the same fact rendered 3× across three routes (regime, VIX, FII/DII, breadth, sector state, movers). One destination, one answer, one panel. Corresponds to FinStocks' `Markets`. |
| **Book** | `/portfolio`, `/trades`, `/trades/[id]`, `/paper-trading`, `/risk`, `/fno` Lab positions | Six routes today answer "what do I hold" and none of them answers it completely (`api.positions.getOpen()` is consumed by `/portfolio` and `/risk` independently; option positions live only inside a nested `/fno` tab). One route, one Mock\|Live toggle, one blotter. Corresponds to FinStocks' `Portfolio`. |
| **Tasks** | `/autopilot`, `/autopilot/track-record`, `/alerts`, `/scanner/my/[id]`, `/strategies/deployed`, discovery runs | **This replaces FinStocks' `Templates` deliberately.** Templates are one click from the composer ("View All" on a suggestion card) and do not deserve a permanent slot. What *does* deserve one is the standing list of things the machine is doing for you — the Intellectia Tasks board. It is the only nav item a dashboard product cannot fake, and today that concept is scattered across 5 routes with no shared grammar (no trigger sentence, no source prompt, no next-run time, no per-task toggle anywhere in the product). |

**Deleted from the rail:** Stocks, AutoPilot, Signals, Screener, Chart Patterns, AI Algos, F&O, Portfolio, Paper, Trades, Risk (11 of the 12 items in `nav.ts:36-66`), the 4 group labels (`nav.ts:70-75`), and the 72px right utility rail (`RightRail.tsx`, 182 LOC) — the right edge is now the panel, and one edge cannot be two things.

**Kept as chrome, not as items:** ⌘K palette (`CommandPalette.tsx`), the notification tray (bell in the top bar), Settings (footer gear), the Mock\|Live + broker chips (they live on the composer, §5).

---

## 2. COMPLETE TRIAGE — all 55 routes

Legend: **KEEP** = survives as a URL in the 4-item IA · **CHIP** = becomes a composer mode chip · **PANEL** = becomes a right-panel face · **THREAD** = becomes an in-thread answer/artifact · **MERGE→X** · **CUT** (route file deleted; URL survives via §7 redirect/seed).

### Home & chat (2)
| # | Route | Becomes | Justification |
|---|---|---|---|
| 1 | `/` | **KEEP** | 14-LOC `redirect('/copilot')`. Already minimal; it is the funnel that makes /copilot carry 100% of first impression. |
| 2 | `/(platform)/copilot` | **KEEP — the product** | Home view and thread view collapse into ONE continuously-scrolling surface (kills `isBigTask` at page.tsx:523-526,576, `HomeInlineAnswer` 190-264, and the 46vh in-composer scroller at :237). Everything below the composer (HomeCockpit, MarketTicker, 8 news cards, CTA band, 73-link footer, and the ~180 LOC dead signed-out branch at :1097-1212) is removed. |

### Markets & discovery (4)
| # | Route | Becomes | Justification |
|---|---|---|---|
| 3 | `/markets` | **KEEP** (sidebar item 2) | Re-cut from 18 card surfaces / 250+ values / 19 mount requests to: briefing headline + narrative + ONE market entity card + follow-up chips + a `Market` panel. The three FII/DII surfaces, three breadth surfaces and three sector surfaces collapse to one each. |
| 4 | `/stocks` | **CUT** → seeds `/copilot` | A filter bar over a paginated 5-column grid — the Quantman counter-example. Its three inputs (universe search page.tsx:411, StockMoodLookup, add-symbol) are the composer relocated; the table becomes the Market panel's `Universe` tab. |
| 5 | `/watchlist` | **PANEL** — Book panel › Watchlist | Not in `nav.ts` already; the codebase treats it as secondary. Free tier caps it at 5 rows yet it ships 2 view modes + a 459-LOC alert editor. Becomes symbol · price · change · verdict word, `+` to add, per-row [Details]. |
| 6 | `/stock/[symbol]` | **PANEL** — Entity face (URL preserved) | 38 card surfaces, 15-19 unprompted requests, zero AI output above 810px. Becomes one in-thread entity card + a ≤6-tab panel. The dense version survives at `/terminal/[symbol]` (§7). |

### Signals (7)
| # | Route | Becomes | Justification |
|---|---|---|---|
| 7 | `/signals` | **THREAD** + Tasks card | It is a computed summary of one array (`getToday`). Becomes a proactive thread card: "9 new picks · 6 long / 3 short · strongest RELIANCE" + [Show the book]. |
| 8 | `/signals/alpha-picks` | **CHIP** `[Screen]` › book switcher | Alpha Picks is a filter value, not a place. Hero + Key Reads + How-it-works + FAQ (4 of 9 sections are static marketing copy from `categories.ts`) become one collapsed "How this book works ⌄". |
| 9 | `/signals/momentum-picks` | **MERGE → #8** | 100% shared component code; the entire delta is one copy object + one endpoint name. A FAQ entry exists solely to explain why the routes are split. |
| 10 | `/signals/index-momentum-30` | **CUT** | Structurally dead: `categoryOf()` (categories.ts:192-195) never returns `momentum30`, so the grid can never populate; still fires 4 requests and publishes an un-sourced "29.7% CAGR vs 22.0%" claim (categories.ts:134). Highest-risk copy in the app. |
| 11 | `/signals/momentum` | **CUT** (6-LOC alias) | Redirect file that the palette lists as a *separate* destination (CommandPalette.tsx:54 alongside :52). Handle in middleware. |
| 12 | `/signals/swing` | **CUT** (6-LOC alias) | Same (CommandPalette.tsx:53 alongside :51). Four palette rows resolve to two pages. |
| 13 | `/signals/[id]` | **PANEL** — Signal face | The one genuinely useful surface in the cluster; 9 stacked panels retab to 4 faces + ticket. Push-alert toggles move to Tasks (they are global prefs on a per-signal page, admitted at [id]/page.tsx:513). |

### Screener & patterns (6)
| # | Route | Becomes | Justification |
|---|---|---|---|
| 14 | `/scanner` | **CHIP** `[Screen]` + Library gallery | 38 tiles / 29 win-rate gauges / 8 headings and zero answers. The capability already ships in the Copilot (`copilot-modes.ts:49-50` + `nlScan` + `run_screen` action + `table` artifact). |
| 15 | `/scanner/[screen]` | **THREAD** | One answer to one question. 11 numbers above a 200-cell table becomes prose + one card + [Details]→panel record. |
| 16 | `/scanner/new` | **THREAD** (`[Screen]` mode) | The only AI-native surface in the cluster, buried under a 38-tile gallery and re-framed as a numbered 3-step wizard. Steps map 1:1 onto one streamed reply. |
| 17 | `/scanner/my/[id]` | **MERGE → /tasks** | Saved screens are scheduled agent tasks. Also ~85% duplicate of #15. Merging finally surfaces `runSavedScan` and `listSavedScanAlerts`, both currently reachable only from dead code. |
| 18 | `/scanner/fundamental/[preset]` | **THREAD** | Up to 400 table cells, zero sentences. `debt_to_equity` is fetched and exported but never shown — on a preset literally called "Low Debt". |
| 19 | `/patterns` | **PANEL** (drawer) + THREAD | ~25 controls above a 550-cell table. Its `ExplainDrawer` (PatternsV2Tab.tsx:545-705) is the only component in the cluster that already obeys rule 3 — keep it verbatim as the Entity panel's `Patterns` tab. |

### Strategies (4)
| # | Route | Becomes | Justification |
|---|---|---|---|
| 20 | `/strategies` | **CHIP** `[Strategy]` | Five products in one route; default tab is `library` so the NL composer — the actual product — is two clicks deep. Library → 3 suggestion cards + View All. |
| 21 | `/strategies/[slug]` | **PANEL** — Strategy face | A whole route for 13 scalars; 17 labelled readouts above the fold, the 4 most prominent of which the page itself calls untrusted. |
| 22 | `/strategies/deployed` | **MERGE → /tasks** | It already *is* the Tasks board, mis-shelved: standing things the machine is doing, one row each. Re-cut to filter chips + one row per strategy. |
| 23 | `/strategies/mine/[id]` | **PANEL** — Strategy face (Rules/Backtest/Deploy) | ~225 numeric cells after a universe backtest. The typed-name deploy ritual is kept verbatim as the panel's ticket. |

### Portfolio · trades · derivatives · risk (6)
| # | Route | Becomes | Justification |
|---|---|---|---|
| 24 | `/portfolio` | **KEEP → `/book`** (alias kept) | The only route that answers "what do I hold". Becomes one BigNumber + one prose line + mode chips + ONE merged positions table (today it renders the same six columns twice, page.tsx:148-216 vs BrokerPositionsPanel.tsx:112-176). |
| 25 | `/trades` | **CHIP on /book** `[Trades]` | The blotter is correct-dense and stays; the 4 KPI tiles, the per-row P&L bars, the 0.04s-per-row stagger, the duplicate mobile branch and both journal cards go. |
| 26 | `/trades/[id]` | **CUT** → Book panel › Trade | Already duplicated inline on row click (trades/page.tsx:609-613), and half its body is a "Lessons" placeholder for an unbuilt feature. |
| 27 | `/paper-trading` | **TOGGLE** — Mock\|Live on /book | Paper is a mode, not a place; this is literally FinStocks' Mock\|Live chip. League, badges, streaks and the 20-row leaderboard are cut — no reference product has gamification. |
| 28 | `/fno` | **KEEP** | The one genuinely distinct workspace and the cutting-edge model work worth preserving — but reduced to a derivatives-scoped composer + one entity card per index. Chain/Greeks/smile/term/cone become the Entity panel's tabs; positions move to /book. Three levels of nested nav and 6 duplicate index pickers are deleted. |
| 29 | `/risk` | **PANEL** + status chip | 2 cards and 4 tiles given a URL. The page's own docstring says it never blocks anything — a warn-only surface is a chip under the composer ("All gates clear" / "2 warnings ›"), not a navigation. Deleting its 4 tiles also fixes a two-sources-of-truth bug with `/trades`. |

### Agent, notifications, settings, onboarding, auth (17)
| # | Route | Becomes | Justification |
|---|---|---|---|
| 30 | `/autopilot` | **MERGE → /tasks** (alias kept) | It is the agent's home and must survive — as ONE task card ("Rebalance the book daily at 15:45 IST"), not a 10-band dashboard polling 5 endpoints every 20s for a system that acts once a day. |
| 31 | `/autopilot/track-record` | **PANEL** — Task panel › Track record | A route for 12 numbers that only exist after the bot has traded; for most users it is an EmptyState behind a click. Its empty-state copy also contradicts the parent's one-click "Go live". |
| 32 | `/alerts` | **MERGE → /tasks** (monitors) | A 60+ switch preferences matrix cannot be the answer to "alert me when X". Monitors get created by typing. (Also fixes the `text-white`-on-near-white invisibility in `AlertPreferencesGrid.tsx:76,110`, which currently ships twice.) |
| 33 | `/inbox` | **PANEL** — top-bar tray | A top-level route for a notification list is a 2010 pattern. Tapping an item drops it into the thread as an agent turn with follow-ups. |
| 34 | `/inbox/[id]` | **CUT** | Zero data sources, zero inbound links, and it ships the literal strings "Plan 3 wires this to /api/notifications/{id}" and "{ payload preview when wired }" to users. |
| 35 | `/settings` | **KEEP** | Legitimately a route, re-cut to ONE scrolling column of 6 anchored sections. Drops the left rail, the 2 dead nav items (`/settings/whatsapp`, `/settings/security` — no directories exist; middleware rewrites them to tabs not in `VALID_TABS`), the dead Telegram row, the duplicate risk editor and the 3rd kill switch. |
| 35a | `/settings#tier` | **PANEL/row** | Collapses to one Account row: "Pro · ₹999/mo · 42 of 150 messages today · [Manage]". Its "Copilot usage today" card renders the cap, not usage. Billing-history placeholder cut. |
| 35b | `/settings#kill_switch` | **PANEL** — Task panel › danger action | Best-written copy in the cluster; keep verbatim, move to where the agent lives, delete the fake auto-resume timer and the 2 duplicate triggers. |
| 35c | `/settings#notifications` (WatchlistPins) | **CUT** | 376 LOC — larger than all of `/inbox` — for a preference set somewhere else entirely. Pins become monitors. |
| 35d | `/settings#data` | **row** in Settings › Data | Client-assembled GDPR export that silently swallows 3 failures and ships a legacy product name in the filename; "Delete account" is removed until the flow exists. |
| 35e | `/settings#appearance` | **CHIP** — Simple\|Full next to the composer | A settings control that navigates you to `/copilot` on select is a chip pretending to be a page. |
| 36 | `/referrals` | **PANEL** — Settings › Refer sheet | A whole route to display one string and one link; not in the sidebar today. Native `confirm()` for an irreversible rotate is replaced by `ConfirmDialog`. |
| 37 | `/onboarding/broker-connect` | **CUT as a gate** → broker chip sheet (URL kept) | This is the first screen a new user sees (`(platform)/layout.tsx:44-47`): seven brokerage API rows described in API version numbers. Invert it — land on the composer with Mock already on and ₹10L live; broker connect is a chip. |
| 38 | `/onboarding/risk-quiz` | **THREAD** — the first conversation | The only place the product ever asks the user a question, and it asks with radio buttons instead of the composer it is built around. 5 questions become 5 agent turns with chip answers; the result is one sentence, not 3 cards and 9 numbers. |
| 39 | `/onboarding/complete` | **CUT** | 3 of its 5 links go to `/copilot`; it is a redirect in a celebration costume, and it does not even write the completion flag its docblock claims. |
| 40 | `/login` | **KEEP** | Closest thing in the app to the target aesthetic. Fix only: password min 6→8 (matches signup), route by onboarding state to kill the double navigation, drop `font-bold`. |
| 41 | `/signup` | **KEEP — 1 step** | Steps 2-3 collect a plan that is discarded (`selectedPlan` never reaches `signUp()`) and abandon `AuthLayout` mid-flow. Render the referral the page already resolves and throws away. |
| 42 | `/forgot-password` | **KEEP** | Correct non-enumerating behaviour. Consistency only: one heading, shared supabase client, matching CTA. |
| 43 | `/verify-email` | **KEEP** | Hierarchy inverted — make "Resend" primary with a cooldown, demote "Back to sign in". |
| 44 | `/auth/callback` | **KEEP** | Required for OAuth. Fix the three non-existent Tailwind tokens and the 10s timeout that manufactures auth failures. |
| 45 | `/broker/callback` | **KEEP** | Verified OAuth handler (`broker/callback/page.tsx:1-30`), not a product surface. No IA change. |
| 46 | `/preview-design` | **KEEP — internal** | Design harness; imports `notFound` at `:2`. Excluded from user IA; must never appear in nav or palette. |

### Admin console (9) — out of the consumer IA
| # | Route | Becomes | Justification |
|---|---|---|---|
| 47-55 | `/admin`, `/admin/payments`, `/admin/training`, `/admin/signals`, `/admin/system`, `/admin/model-performance`, `/admin/ml`, `/admin/users`, `/admin/users/[id]` | **KEEP — separate app shell** | An internal operator console. Dashboards are the *correct* form here (`admin/page.tsx:1-4` even declares "Clean cards, semantic colors, no animations"). It must not share the consumer sidebar, must not appear in `CommandPalette.ROUTES`, and is explicitly exempt from the three rules. |

**Score:** 55 routes → **9 consumer URLs** (`/`, `/copilot`, `/markets`, `/book`, `/tasks`, `/fno`, `/settings`, `/stock/[symbol]` as a panel deep-link, + auth set) + 9 admin + 1 internal. 25 routes cut or merged; **0 URLs 404** (§7).

---

## 3. COMPOSER MODE CHIPS — exactly 5

Reuses the shipped `MODES` array (`lib/copilot-modes.ts:41-53`) so no backend change is needed; the `prefix()` directive mechanism already exists and is applied to the API message only.

```
[ Ask ]  [ Analyse ]  [ Screen ]  [ Strategy ]  [ Book ]
```

| Chip | Replaces | Prefix / action | What it absorbs |
|---|---|---|---|
| **Ask** (default) | `ask` (modes.ts:42) | none | General market questions. Suggestion pool = `MODE_PROMPTS.ask` (:61-71). |
| **Analyse** | `analyze` (:43-44) | "Give a grounded technical + fundamental read of {sym}: " | `/stock/[symbol]`, `/signals/[id]`, `/patterns` explain, `/markets` deep reads. Reply = prose + **entity card**; [Details] opens the Entity panel. |
| **Screen** | `screen` (:45-46) | "Treat this as a stock-screener request and return matching names: " | All 6 screener/pattern routes + `/stocks` + the signal books. Reply = prose + **ChipRow of compiled filters** (`components/copilot/artifacts.tsx:21-45`, which already exists, labelled "Generated filters" with Edit/+Add) + a 5-row `table` artifact + "Expand ›". |
| **Strategy** | *new* → `studioCompile` | "Compile this into a testable strategy, then gate it: " | `/strategies`, `/strategies/new` builder, `/strategies/mine/[id]` backtest loop. Reply = prose + **strategy card** (name, plain-English entry/exit, gate pill, OOS fold sparkline, [Details][Deploy]). Refinement is conversational: each turn is a new version, with a diff. |
| **Book** | `doctor` (:47-48) | "Act as a portfolio doctor — assess risk, concentration and what to do: " | `/risk`, `/trades` journal cards (WeeklyReview, TradePatterns), `/portfolio` "Ask AI", `/paper-trading` risk banner. |

**Removed: `trade` (modes.ts:49-51).** FinStocks has no Trade chip — it has a **[Buy] button on the card** and an order ticket in the panel. Trading becomes an action, not a lens; the existing `trade` prefix is reused by the ticket's "Plan this trade" follow-up chip so nothing is lost.

**Persistent controls beside the chips (not chips):** broker chip (`Zerodha ▾` / `Connect broker`), **Mock \| Live** toggle, **Simple \| Full** toggle (from `/settings#appearance`), and the risk status chip (`All gates clear` / `2 warnings ›`, from `/risk`).

---

## 4. THE RIGHT PANEL — 6 faces

One surface, 400px on desktop / full-sheet on mobile, opened only by `[Details]`, a chip, or a deep link. **It replaces the current dock entirely** — the dock's composer, mode chips and message list are deleted (three chat surfaces → one), and its `ActionCard` logic (`CopilotProvider.tsx:639-682`) is promoted into the order ticket. Tabs use **container queries**, never `sm:` viewport breakpoints (today `ChatArtifacts.tsx:320` renders 186px cards holding 132px charts with 44px axes inside the 400px dock).

```
┌──────────────────────────────────────────┐
│ TCS · Tata Consultancy            ⤢  ✕  │  ← entity identity, 2 controls only
│ ₹3,842.10   +1.24%      As of 15:30 IST │  ← ONE big price, one delta, one stamp
│                                          │
│ Overview  Technicals  Financials  News   │  ← ≤6 tabs, scrollable
│ Patterns  Peers                    >_    │  ← Terminal escape (§7)
├──────────────────────────────────────────┤
│      ╱╲                                  │
│  ╱╲╱   ╲╱╲___                      ┈┈┈┈ │  ← area chart, dotted last-price line
│                                          │
│  [ 1W ]  [ 3M ]  [ 3Y ]                  │  ← 3 pills (was a 20-control toolbar)
│                                          │
│  Today's move                            │
│  3,801 ●────────────────◆──────── 3,861  │
│  Prev close 3,795 · Open 3,812 · Now …   │
│                                          │
│  ─────────────────────────────────────   │
│  [ Buy ]                                 │  → swaps panel to the Ticket face
└──────────────────────────────────────────┘
```

| Face | Opened from | Tabs | Absorbs |
|---|---|---|---|
| **A · Entity (stock/index)** | entity card [Details], `/stock/[symbol]`, ⌘K symbol, ticker mention | `Overview` · `Technicals` · `Financials` · `News` · `Patterns` · `Peers` | All of `/stock/[symbol]`'s 38 surfaces (Overview absorbs header + chart + RS; Technicals = verdict + vote counts + **3 nearest levels only**, resolving the 4 unreconciled S/R systems; Financials = 11 tiles → 6 rows, no per-tile essays; News = Tradomate timeline `Sentiment · Impact · Category · Source` + one expandable AI summary; Patterns = the `/patterns` ExplainDrawer verbatim; Peers = the `/stocks` DataTable as a scoped list). |
| **B · Market** | `/markets` follow-up chips, market entity card | `Overview` · `Internals` · `Flows` · `Sectors` · `Derivatives` | MarketPulse's 4 tiles, BreadthCard, SectorHeatmap, SectorRotation, IndexStrip, OrderFlowAnalysis, and `/fno`'s chain/Greeks/smile/term/cone. Three FII/DII surfaces → one `Flows` tab. |
| **C · Book** | sidebar `Book` rows, holdings/blotter row click | `Holdings` · `Orders` · `Trades` · `Watchlist` · `Risk` | `/watchlist`, `/trades/[id]` (as the `Trade` sub-face rendering `TradeReviewCard`), `/risk` gates + concentration, broker margin strip, `/portfolio` equity chart. |
| **D · Signal** | signal card [Details], `/signals/[id]` | `Thesis` · `Levels` · `Chart` · `Pressure-test` | All 9 panels of `/signals/[id]`. Debate stays exactly as it is — on-demand and collapsed. Meta + prior signals fold into a "Details ⌄" disclosure. |
| **E · Strategy** | strategy card [Details], `/strategies/*` | `Rules` · `Backtest` · `Deploy` | DSLPreview, the 3 backtest inputs, the 6-metric strip, equity curve, trade log, `UniverseBacktestResults`, and the typed-name deploy ritual as the single order-ticket-shaped confirm. |
| **F · Task** | Tasks row click, risk chip, kill switch | `Summary` · `Track record` · `Safety rails` · `Danger` | `/autopilot` internals (HMM posteriors, VIX band, equity scaler, VaR, Kelly scale, target weights, 10-tick rebalance log), `/autopilot/track-record`, `/alerts` per-event overrides, `KillSwitchPanel` (the single surviving kill switch of four). |

**Two trays (not faces):** the **notification tray** (bell → reverse-chron one-line list; tapping drops the item into the thread) and **sheets** (broker connect, order ticket, schedule/universe for saved screens, refer-a-friend).

**The Ticket** (FinStocks' order ticket, currently homeless — our nearest analogue is a 2-line ActionCard that exists only in the dock):

```
Mock | Live      Buy | Sell      Delivery | Intraday
Qty  [  25  ]  ▲▼        +10  +25  +50
Market | Limit
─────────────────────────────────────────
Order value                      ₹96,052.50
Charges & taxes                      ₹41.20
Net debit                        ₹96,093.70
─────────────────────────────────────────
⚠ Manual orders skip risk rules and backtests.
  Prefer Deploy via strategy to stay systematic.
[ Confirm buy · 25 TCS ]
```

---

## 5. THE NEW HOME SCREEN

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ ⊕ New Chat │                                                              │
│            │                                                              │
│ ◷ Markets  │                                                              │
│ ▤ Book     │                     What can I do for you?                   │  32px, normal weight
│ ⟳ Tasks(3) │                                                              │
│ ─────────  │   ┌──────────────────────────────────────────────────────┐   │
│ TODAY      │   │                                                      │   │
│  Why is T… │   │  Ask about any NSE stock, sector or setup…           │   │  15px sans (NOT mono)
│ PREV 7 D   │   │                                                      │   │  static placeholder
│  Screen: … │   ├──────────────────────────────────────────────────────┤   │  ← one hairline
│  Tighten … │   │  🔗 Zerodha ▾   Mock | Live      Simple | Full   ( ↑ )│   │  44px toolbar
│ ─────────  │   └──────────────────────────────────────────────────────┘   │
│ RK    ⚙︎   │                                                              │
│            │     [ Ask ] [ Analyse ] [ Screen ] [ Strategy ] [ Book ]     │  mode chips, below box
│            │                                                              │
│            │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│            │   │ ◷           │ │ ⌗           │ │ ✦           │            │
│            │   │ Today's read│ │ Screen the  │ │ Build a     │            │
│            │   │             │ │ market      │ │ strategy    │            │
│            │   │ What the    │ │ Describe a  │ │ Describe it │            │
│            │   │ tape is     │ │ setup in    │ │ in English, │            │
│            │   │ saying now. │ │ plain words.│ │ we backtest.│            │
│            │   └─────────────┘ └─────────────┘ └─────────────┘            │
│            │                          View All ›                          │
│            │                                                              │
│            │   ● All gates clear · ₹10,00,000 practice book               │  status line
│            │   Research and education only. Not investment advice.        │  10px, ALWAYS
│            │   SEBI-registered research analyst disclosures apply.        │  present
└────────────┴──────────────────────────────────────────────────────────────┘
```

**Exact spec**

| Element | Spec |
|---|---|
| Canvas | Near-white (`bg-main`), max-w-3xl centred column, content starts at ~28vh. No decorative glow layers (today: a 460px radial + a 360px dual indigo/violet bloom, page.tsx:1055-1065). |
| Heading | "What can I do for you?" — 32px, **normal weight**, one line. Personalised only on first session of the day: "Good morning, Rishi." above it at 15px muted. |
| Composer box | `rounded-2xl`, 1px `border-line`, no glass, no shadow. Two regions split by one hairline: input (auto-grow textarea, 15px **proportional sans** — the current `font-mono` at page.tsx:778 and :725 reads as a terminal) + a 44px toolbar. |
| Placeholder | **Static.** One string: "Ask about any NSE stock, sector or setup…". The 6-prompt / 3.8s rotation (page.tsx:436-440) is deleted — a moving placeholder reads as a demo reel. |
| Toolbar | Left: broker chip (`Zerodha ▾` with a live dot, or `Connect broker` when none — this is the *only* broker-connect entry point, replacing `/onboarding/broker-connect` as a gate). Then `Mock \| Live` segmented (defaults **Mock**; switching to Live requires a connected broker). Then `Simple \| Full`. Right: one circular send (⌘↵ and ↵ both send — today the two composers disagree). |
| Mode chips | 5 chips (§3) **outside and below** the box, 12px, pill, one active at a time. Selecting one changes the placeholder to that mode's `placeholder` (modes.ts:42-51) and re-rolls the suggestion cards from `MODE_PROMPTS`. |
| Suggestion cards | Exactly **3**, persistent (never focus-gated — today they only appear on focus and vanish on blur), equal width, `rounded-xl`, 1px border, no fill. Each = one glyph, a 2-3 word title, ONE line of copy ≤ 60 chars. Defaults: *Today's read* / *Screen the market* / *Build a strategy*. Under them, one text link **View All ›** → opens the Library sheet (the 29 prebuilt screens + 8 fundamental presets + strategy templates + the 2 signal books, all searchable, in a panel — nothing is lost). |
| Status line | `● All gates clear` (or `● 2 warnings ›` → Book panel › Risk) + the active book: `₹10,00,000 practice book` or `Zerodha · ₹4,21,300`. |
| Disclaimer | **Always present**, 10px, muted, two lines, directly under the composer on every surface. Today it is absent on the home hero (the only `DisclaimerFooter` at page.tsx:1210 sits inside a dead branch), buried in a 10px mono line with keybinding help and quota on the thread, and correct only in the dock. |
| Everything else | Deleted: `HomeCockpit` greeting + market-status pill, the ~108-cell `MarketTicker` (~320 live numbers polling every 20-30s), the 8-card news grid with 3 filter chips, the 4-card CTA band, `HomeFooter` (6 bands / 73 links / 8 SEO accordions), and the ~180 LOC unreachable signed-out branch. |
| First run | No wizard. New user lands here with Mock on and a ₹10L book live, and the agent's first message is already in the thread: *"You're set up. I'm watching 1,800 NSE names on a ₹10L practice book. What are you trying to do with your money?"* + 3 chip answers. That is `/onboarding/risk-quiz` re-expressed as conversation. |

**Design scale (enforced, replacing 13 hand-set sizes on the copilot page alone and 96 sub-11px occurrences in the stock cluster):** 32 / 20 / 15 / 13 / 11px. **Two radii:** `xl` (cards, composer) and `full` (chips, avatars). **One accent** (violet) spent on exactly one thing per screen — `MarkdownMessage.tsx:53-57` must stop colouring every `**bold**` run in the accent. Semantic up/down are the only other hues. Body copy 13-15px; nothing below 11px except the disclaimer.

**Motion budget:** zero infinite animations. Delete the bobbing robot (`CopilotBot.tsx:24-30`, `repeat: Infinity`), the marquee, the 1500ms thinking-phrase ticker, the per-artifact `BlurFade` stagger, the per-chip spring entrances, and the `idx × 0.04s` row stagger. Allowed: one 120ms fade on new turns, one 180ms panel slide.

---

## 6. WHAT A REPLY LOOKS LIKE

**Rule: prose first, ONE artifact, follow-ups, one collapsed work line.** Today every reply is wrapped in four provenance strips (artifacts, ReferencesRail, ProgressRail, and the CONSULTED chip row) with the artifacts rendering *before* the prose (page.tsx:954).

**While streaming** (replaces the animated orb + rotating 6-phrase ticker + growing connector rail + per-step icons and millisecond timings):

```
  Thinking 3s ›
```

Two words and a real elapsed counter. The timer-driven `ThinkingPulse` phases (`ProgressRail.tsx:96-125`, which the file's own comment at :93-95 concedes run before the backend announces any step) are **deleted** — a product asking people to risk money cannot ship fake progress, and `ProgressRail.tsx:27-29` already states "no fabricated states" as policy.

**After it lands:**

```
 QUANT X

 TCS is holding its uptrend but momentum is cooling. Price is 2.1%
 above the 50-day and volume has been below average for four
 sessions, so the breakout above ₹3,860 has not been confirmed.
 The nearest support that matters is ₹3,780.

 ┌────────────────────────────────────────────────────┐
 │ ▣  TCS                                  ₹3,842.10  │   ← logo tile + price
 │    Tata Consultancy Services              +1.24%   │
 │                                                    │
 │    Overall signal · 8 indicators                   │
 │    ████████████░░░░░░░░░░░░░░░░░░░░  Buy 5 · Neu 2 · Sell 1
 │                                                    │
 │    B U Y                          ╱╲╱╲___╱╲        │   ← verdict word + sparkline
 │                                                    │
 │    * Levels from 90 days of EOD data.              │   ← per-card provenance
 │    [ Details ]                        [ Buy ]      │
 └────────────────────────────────────────────────────┘

 Worked it out · 6 steps · 2.4s  ⌄                        ← ONE collapsed disclosure

 Follow-ups
 [ Why is it cooling? ]  [ Compare with INFY ]
 [ Alert me above ₹3,860 ]  [ Plan a trade ]

 Research and education only. Not investment advice.
```

| Part | Rule |
|---|---|
| **Prose** | 2-4 sentences, 15px, always first. Contains the judgement in words. Bold is normal ink, not accent. |
| **Artifacts** | **Exactly one** per turn (hard cap). Eight types collapse to **three**: `ENTITY` (absorbs sparkline / gauge / stat / bars), `RULES` (the current `strategy` card, already correct), and `DATA` — `table`, `linechart` and `payoff` stop rendering inline and instead post a one-line summary + a chip that opens the panel. No emoji (`ChatArtifacts.tsx:36-46` — 📈📊📋🎛️🧮 is the single strongest AI-slop tell in the codebase); the logo tile is the icon. Every card carries a **verdict word** and an asterisked provenance line (Tradomate's rule). Grid uses container queries. |
| **Work disclosure** | ONE line: `Worked it out · 6 steps · 2.4s ⌄`. Expanding reveals the ✓ step list, the tool chips (Technicals · News · Flows · Screener), and the references — the three strips that today speak in three different visual languages. The collapse-on-done behaviour already exists (`ProgressRail.tsx:208-224`); it becomes the default, not the epilogue. |
| **Follow-ups** | 2-4 chips, always present, generated from the answer. These carry all the destinations that used to be routes: `[Global cues]` `[Breadth]` `[FII/DII]` `[What's firing now]`, `[Alert me when this fires]`, `[Backtest this]`, `[Show the book]`. |
| **Disclaimer** | One persistent line under the composer, not per-card. Deletes the 3 stacked compliance paragraphs on `/markets`, the 4 on `/signals`, the ~15 provenance micro-labels across Markets & Discovery, and the double `DisclaimerFooter` after any backtest. |
| **Persistence** | Turns must serialise artifacts, steps, references and follow-ups. Today `copilotGetConversation` maps only `{role, content}` (page.tsx:483), so a resumed thread is strictly worse than a live one. |

---

## 7. URL / REDIRECT STRATEGY — nothing 404s, nothing is deleted

Three mechanisms. The first already exists and works.

**(1) 301 map — extend `middleware.ts:11-70`.** It already carries query params through (`:229-238`) and supports prefix rules (`:243-259`). Add:

```
/stocks                    → /markets?panel=universe
/watchlist                 → /book?panel=watchlist
/signals                   → /copilot?ask=signals.today
/signals/swing             → /copilot?ask=book.alpha        (kills the dup palette row)
/signals/momentum          → /copilot?ask=book.momentum
/signals/alpha-picks       → /copilot?ask=book.alpha
/signals/momentum-picks    → /copilot?ask=book.momentum
/signals/index-momentum-30 → /copilot?ask=book.alpha        (structurally dead book)
/scanner                   → /copilot?mode=screen
/scanner/new               → /copilot?mode=screen
/scanner/[screen]          → /copilot?mode=screen&run=[screen]
/scanner/fundamental/[p]   → /copilot?mode=screen&preset=[p]
/scanner/my/[id]           → /tasks?task=[id]
/patterns                  → /copilot?mode=screen&kind=patterns
/strategies                → /copilot?mode=strategy
/strategies/[slug]         → /copilot?panel=strategy&slug=[slug]
/strategies/mine/[id]      → /copilot?panel=strategy&id=[id]
/strategies/deployed       → /tasks?filter=live
/portfolio                 → /book
/trades                    → /book?view=trades
/trades/[id]               → /book?view=trades&panel=trade&id=[id]
/paper-trading             → /book?account=mock
/risk                      → /book?panel=risk
/autopilot                 → /tasks?task=autopilot
/autopilot/track-record    → /tasks?task=autopilot&tab=record
/alerts                    → /tasks?filter=monitors
/inbox                     → /copilot?tray=inbox
/inbox/[id]                → /copilot?tray=inbox&item=[id]
/referrals                 → /settings#refer
/onboarding/complete       → /copilot
/onboarding/broker-connect → /copilot?sheet=broker
```

`/stock/[symbol]` is **not** redirected — it stays a real, crawlable, shareable URL that opens `/copilot` with Entity panel A pre-opened on that symbol and a seeded first turn. Same for `/markets`, `/book`, `/tasks`, `/fno`, `/settings`.

**(2) Seeded threads — the `?ask=` contract.** A deep link does not open a dashboard; it opens the thread with the question already asked and the answer already streaming. One resolver maps a key to `{mode, prefilled prompt, panel face}`. This is how a 2,371-LOC route becomes a link without losing a single capability: `/markets` becomes "What's the market doing?" answered in-thread, with `[Global cues] [Breadth] [FII/DII] [Sectors]` as follow-ups and panel B behind them.

**(3) `/terminal/*` — the escape hatch that means "nothing is deleted".** FinStocks' panel has a literal `Terminal >_` button. Every dense surface we are removing from the IA moves, byte-for-byte, under `/terminal`:

```
/terminal/[symbol]     ← today's /stock/[symbol] (all 38 surfaces, chart toolbar, order book)
/terminal/markets      ← today's /markets (all 18 cards, order-flow, deals)
/terminal/screener     ← today's /scanner gallery + RichScreenResults
/terminal/fno          ← today's FoStrategiesWorkspace (chain, Greeks, smile, term, cone)
/terminal/signals      ← today's SignalsOverview blotter + distributions
/terminal/discovery    ← today's DiscoveredTab + NewRunModal (9 GA knobs)
```

Reached only from the `>_` button inside the relevant panel, never from nav or the palette's default list. This satisfies the power user, satisfies "nothing is actually deleted", and keeps the default experience minimal. The genuinely dead code (`/signals/index-momentum-30` body, `/inbox/[id]`, `components/copilot/artifacts.tsx` primitives, the 2,083 LOC of unimported `components/scanner/*`, `IndicatorInterpreterCard`, the signed-out `/copilot` branch) is the only code actually removed — none of it is reachable today.

**(4) Palette rewrite.** `CommandPalette.tsx:46-77` drops from 28 rows to ~12 (the 4 nav items, `/fno`, `/settings`, `/proof`, `/pricing`, plus `Terminal ›` entries), deleting the 4 rows that resolve to 2 destinations. Symbol search stays. `/preview-design` and `/admin/*` never appear.

---

## 8. THE FIVE JOURNEYS

### J1 — Morning read (was: land on /copilot cockpit → /markets → scroll 10 bands)
```
Sidebar ▸ Markets                 (or: home ▸ suggestion card "Today's read")
   │
   ▼  /markets  =  a seeded thread, not a dashboard
   Thinking 3s ›
   ┌ prose ──────────────────────────────────────────────┐
   │ Nifty closed +0.6% at 24,812 on narrow breadth —     │
   │ 61% of the index advanced but the move was carried   │
   │ by two heavyweights. FIIs were net sellers…          │
   └──────────────────────────────────────────────────────┘
   ┌ MARKET card: NIFTY 50 · 24,812 · +0.6%               │
   │ Overall signal · 6 internals   ███████░░░  RISK-ON   │
   │ [ Details ]                                          │
   └──────────────────────────────────────────────────────┘
   Worked it out · 5 steps · 3.1s ⌄
   [Global cues] [Breadth] [FII/DII] [Sectors] [What's firing]
   │
   ├─ tap [Details] ──▶ Panel B › Overview / Internals / Flows / Sectors
   └─ tap [Breadth]  ──▶ next turn, in the same thread
```
**Before:** 18 card surfaces, 250+ values, 19 requests, one of them an LLM call fired unasked. **After:** 2 requests on load, prose + 1 card, everything else one tap away.

### J2 — Research a stock (was: /stocks → filter → /stock/TCS → 810px before any AI output)
```
Type "why is TCS moving?"  ·  or ⌘K "TCS"  ·  or click a ticker anywhere
   │
   ▼  reply: prose + ENTITY card (verdict "Buy", 8-indicator bar, sparkline)
   │
   ├─ [ Details ] ─▶ Panel A ─ Overview ─ price, As of, area chart + dotted last,
   │                            1W/3M/3Y, Today's-move slider, Prev/Open/Now
   │                        ├ Technicals ─ verdict + votes + 3 nearest levels
   │                        ├ Financials ─ 6 rows, no essays
   │                        ├ News ─ timeline: Sentiment · Impact · Category · Source
   │                        ├ Patterns ─ the ExplainDrawer, verbatim
   │                        ├ Peers ─ the old /stocks table, scoped
   │                        └ >_ Terminal ─▶ /terminal/TCS (the full old page)
   │
   └─ [ Buy ] ─▶ Panel A › Ticket ─ Mock|Live, qty +10/+25/+50,
                  Order value → Charges → Net debit, amber note, one confirm
```
**Before:** 5 renderings of the price, 4 S/R systems, 8 independent AI buttons, 15-19 requests. **After:** one price, one levels list, one answer, 0 LLM calls until asked.

### J3 — Screen for a setup (was: /scanner 38 tiles → /scanner/new 3-step wizard → 50-row table)
```
Composer ▸ [Screen] ▸ "midcaps breaking out on above-average volume"
   │
   ▼  Thinking 4s ›
   ┌ prose: "14 names cleared the gate; 9 are in the same sector." ┐
   ┌ Generated filters:  [Volume > 1.5× avg ×] [20d high ×] [+ Add]│  ← existing ChipRow
   ┌ DATA card: 5 rows · Symbol · Why it matched · Change    Expand ›│  ← hit_count, not RSI
   Worked it out · 4 steps ⌄
   [ Alert me when this fires ]  [ Backtest this ]  [ Show all 14 ]
   │
   ├─ [Alert me…] ─▶ schedule sheet (hourly / open+close / 15min) ─▶ a row on Tasks
   └─ [Show all 14] ─▶ Panel: Matches / Record (the 90-day gauge + its disclosure) / Schedule
```
**Before:** 6 routes, ~1,150 rendered cells, 68 gauges, 4 loading vocabularies (incl. a 96-second skeleton loop). **After:** one chip, one reply, and `powerExplain` / `runSavedScan` / `listSavedScanAlerts` — currently orphaned inside dead files — finally reachable.

### J4 — Build → backtest → refine → deploy (was: 5 tabs, default tab = catalog, refine = destroy state)
```
Composer ▸ [Strategy] ▸ "buy the 20d breakout in Nifty 100, 2% stop, exit on 5d low"
   │
   ▼ turn 1: prose + STRATEGY card (plain-English rules, gate pill "not yet gated",
   │          [Details][Backtest])                       ← the DSL lives in the panel
   │
   User: "make the stop tighter — 1.2%"                  ← a MESSAGE, not a reset()
   ▼ turn 2: prose + diff ("stop 2.0% → 1.2%") + re-gated card
   │          "4 of 5 windows profitable · holdout +2.3%"  + OOS fold strip
   │
   ├─ [Details] ─▶ Panel E › Rules · Backtest · Deploy
   └─ [Deploy]  ─▶ Panel E › Deploy = the ONE ritual (type the name + acknowledge)
                    ─▶ appears as a row on Tasks
```
**Before:** three different locks on the same door to real money; no version list; no diff; `reset()` nulls preview, draft, result, error and prompt in one call. **After:** every edit is a turn, every turn is reviewable — the Cursor loop.

### J5 — Check the book / react to an alert (was: /portfolio, /trades, /paper-trading, /risk, /inbox, /fno Lab)
```
Bell (2) ─▶ tray: one line per item
   "AXISBANK hit its target at ₹1,208"        3h
   │  tap
   ▼  drops into the thread as an agent turn:
      "AXISBANK hit its ₹1,208 target — +4.2% on the position.
       Want me to trail the stop or close it?"
      [ Trail the stop ]  [ Close it ]  [ Show the book ]
                                            │
Sidebar ▸ Book ────────────────────────────┘
   ▼  /book
   ₹4,21,300          +₹6,240  (+1.5%)          ← ONE BigNumber (was 20 KPI tiles
   "Six positions. Concentration is fine; IT is 38% of the book."     across 5 routes)
   [ Holdings ] [ Orders ] [ Trades ] [ Watchlist ]   Mock | Live
   ┌ one table (broker + internal merged) ─────────────────────┐
   │ TCS   25   3,780   3,842   +₹1,550   +1.6%   ▸            │
   └───────────────────────────────────────────────────────────┘
   ● All gates clear ›                        ← Panel C › Risk
```
**Before:** two identical positions tables 400px apart, 5 polling loops, `api.positions.getOpen()` fetched by two routes, win-rate computed two ways from two endpoints that can disagree. **After:** one table, one source per column, one toggle deciding mock vs live.

---

### The three rules, checked

1. **One question per screen** — the home is a composer + 3 cards + a disclaimer (12 elements). `/markets`, `/book`, `/tasks` each open with one number or one sentence, not a KPI strip. Five 4-up KPI strips (20 tiles) across the portfolio cluster become one BigNumber.
2. **Data on demand** — the only unconditional fetches left are: the thread, the Book's positions, and the Tasks list. `MarketExplainerCard`'s auto-fired LLM call, `TabAiRead`'s `verdict(symbol, true)` on mount, the 300-row `getHistory` for an unopened tab, the per-card sparkline fan-out (up to 50 requests), and the NIFTY-100 `newsScan` whose output is discarded for non-broker users all die at once.
3. **Compress the machinery** — every reply carries exactly one collapsed line. Regime posteriors, VIX bands, Kelly scale, VaR, factor scoreboards, engine names, GA hyperparameters, `X/Y scanned`, and gate thresholds move behind it or behind `>_ Terminal`. The model work does not shrink by one line of Python; it just stops being the wallpaper.