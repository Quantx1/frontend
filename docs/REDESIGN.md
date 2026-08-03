All claims verified. The evidence resolves the reviewer disagreements decisively. Writing the plan.

---

# QUANT X — THE DEFINITIVE REDESIGN PLAN
**v1.0 · build document · supersedes the IA draft and visual spec v6**

Every number below was re-verified against source in this session. Where the three adversarial reviewers disagreed with the draft plan or with each other, §0 resolves it explicitly — no averaging.

---

## 0. RULINGS — disagreements resolved before anything else

The draft IA had six load-bearing errors. All three reviewers found real defects; two of their objections were themselves wrong. Rulings are binding on the rest of this document.

| # | Dispute | Ruling | Evidence |
|---|---|---|---|
| **R1** | Draft routes navigation through the Copilot. Reviewers 1 & 3: Free tier is **5 chat messages/day**, so a 4-item sidebar dies on tap 6. | **Reviewers win. Navigation is never metered.** `/markets`, `/book`, screener runs and the signals book render from deterministic REST through a **template renderer** that produces the same prose+card shape with zero LLM tokens. Only genuinely generative turns (a typed question, "explain this") spend a `chat` credit. This is the single most important correction in the document. | `backend/backend/core/tiers.py:185` — `"chat": {FREE: 5, PRO: 150, ELITE: 400}` |
| **R2** | Draft prints "SEBI-registered research analyst disclosures apply" under the composer. | **Reviewer 2 wins outright — this is a false regulatory claim and is struck.** The company states the opposite in its own footer. Replacement line is fixed verbatim in §5. | `HomeFooter.tsx:188-191` — "Quant X is **not** a SEBI-registered Research Analyst or Investment Adviser"; header at `:184` reads "HONEST placeholders — never fabricate reg numbers" |
| **R3** | Draft deletes HomeFooter as "dead signed-out code". | **Reviewer 2 wins. The premise is factually wrong.** HomeFooter is mounted at `copilot/page.tsx:1214`, which is **one line past** the `) : null}` that closes the auth ternary — it renders for authenticated users. It is the only route to legal pages, grievance/SCORES, and the not-registered statement. It becomes a persistent compliance footer in the shell. | Verified: `sed -n '1205,1220p'` shows `) : null}` at 1212, `<HomeFooter />` at 1214 |
| **R4** | Draft deletes RightRail ("one edge cannot be two things"). | **Reviewer 1 wins.** `signOut` has exactly two call sites: `RightRail.tsx:164` and `admin/layout.tsx:180`. `ThemeToggle` has two: `settings/page.tsx:1529` and `RightRail.tsx:58`. Deleting the rail without first re-homing both makes sign-out unreachable for every consumer user. Both move into the sidebar account row **before** the rail is cut. | grep confirmed both |
| **R5** | Draft says "monitors get created by typing", merging `/alerts` into Tasks. | **Reviewer 1 wins.** `ActionKind` is `'watchlist_add' \| 'watchlist_remove' \| 'run_screen' \| 'place_order' \| 'create_strategy_draft'` — there is no `create_alert`. NL monitors are a **new backend feature**, not a route merge. The `/watchlist` alert editor stays until monitors ship. | `CopilotProvider.tsx:86`, `lib/api.ts:1352` |
| **R6** | Draft's `?ask=` redirect contract. | **Reviewer 3 wins.** Copilot reads only `?q=`, and it merely prefills and focuses — `setInput(qParam)` at `page.tsx:462`, no send. `?ask=` does not exist. The 301 map is written **last**, after its targets exist. | `copilot/page.tsx:457-466` |
| **R7** | Draft's ticket = one face ending in one `[Confirm buy]`. Reviewer 2: collapses a two-step ritual restored after a real incident. | **Reviewer 2 wins on the ritual, draft wins on the layout.** The ticket is ONE panel face for collection; the confirm remains a **separate focus-safe ConfirmDialog with Cancel focused**. Not averaged — both constraints are satisfiable. | `TradeTicketButton.tsx:6-13`, `signals/[id]/page.tsx:557-567` (the incident), `ConfirmDialog.tsx:42-49` |
| **R8** | Draft deletes the `trade` mode chip in favour of a `[Buy]` button. Reviewer 2: it is the only lens contractually forbidden from executing, and one of two triggers for the anti-"already done" guard. | **Reviewer 2 wins.** The chip returns as **`[Plan]`**, absorbing both `trade` and `doctor` — both mean "tell me what to do, don't do it". Chip count stays 5. `[Buy]` is an action, not a lens; they coexist. | `copilot-modes.ts:50-51`, `CopilotProvider.tsx:306-310` |
| **R9** | Draft never mentions the SEBI Path-A data entitlement gate. | **Reviewer 2 wins.** `dataEntitled = isConnected \|\| LICENSED` is a **fail-closed licensing control**, not layout. Every surface rendering raw NSE quotes, FII/DII flows, OI or depth carries an entitlement branch, including the new entity card and Panel B. | `markets/page.tsx:108-109`, `:145`, `:165`, `:297` |
| **R10** | Draft turns `/markets` into a seeded thread. Reviewer 1: it is the only signed-out, crawlable in-app route. | **Reviewer 1 wins.** `/markets` stays a real route. It is re-cut to answer-shaped (prose + one card + chips), not converted to chat. | `middleware.ts:85` PUBLIC_PREFIXES |
| **R11** | Draft: `/fno` becomes "a derivatives-scoped composer". Reviewer 3: `fno_advisor` is `PRO:0`. | **Reviewer 3 wins.** `/fno` keeps deterministic surfaces as its default; the composer is an Elite affordance layered on top, never the only way in. | `tiers.py:190` |
| **R12** | Visual spec §7.4: "Add `<MotionConfig reducedMotion='user'>`". | **Reviewer 3 wins — it already exists.** `providers.tsx:99`. Step deleted from the build. | verified |
| **R13** | Visual spec: light-default is blocking on FOUC and 145 `text-white` sites. | **Reviewer 3 wins — overstated.** `next-themes` already injects a pre-paint boot script; the flip is one line. Most `text-white` sites are `app/admin/*`, which is exempt. Real work is `app/layout.tsx:96-98`, which hardcodes `noise-overlay` and an inline colour on `<body>`. Light drops from 5d to ~3d. | verified |
| **R14** | Draft: Tasks replaces Templates as sidebar item 4. | **Draft wins on principle, loses on timing.** Tasks has no backend — `alerts_routes.py` exposes preferences only; `saved_scans` has no `source_prompt` or `next_run_at` column. The 4th slot ships as **Library** and becomes **Tasks** when the backend lands. | verified: no monitors table, no NL compiler, no evaluator |

**Two things the reviewers got wrong, for the record.** Reviewer 3 counted 10 routes self-mounting `AppShell` outside `(platform)`; it is **9** (`/copilot` is inside the group). Reviewer 2 claimed the entity card's provenance row "replaces advice disclaimers" — the draft's own §R5 called it a data-vintage stamp, so the defect is a *missing* row, not a mislabelled one; §5 adds both.

---

## 1. THE DIAGNOSIS

The user said: *"so much data, very congested, not designed properly — I don't feel like this is an AI app."* That is a precise description of six measurable properties.

### 1.1 The product renders data because it computed it, not because anyone asked

| Route | Card surfaces | Discrete values | API calls on mount | Asked for? |
|---|---|---|---|---|
| `/markets` | 18 → 25 panels | 250+ | 19 (one LLM-billed) | none |
| `/stock/[symbol]` | 38 | ~200 | 15–19 (one LLM-billed) | none |
| `/scanner` | 38 tiles + 29 gauges | — | — | none |
| `/patterns` | ~25 controls + 550 cells | 550 | — | none |
| `/signals/alpha-picks` | up to 50 cards × 14 fields | ~700 | 5 + up to 50 sparkline fetches | none |
| `/copilot` **home** | 12 cards + a 108-cell tape | ~320 live, polling 20–30s | — | none |

The reference reply is **one card, five elements**. `/copilot` — the front door, which every legacy route funnels into via `middleware.ts` — puts ~320 live numbers below the composer before the user types a character.

### 1.2 The machinery is the wallpaper; the conclusion is buried

Every assistant reply is wrapped in **four** provenance strips — artifacts, `ReferencesRail`, `ProgressRail`, and a `CONSULTED` chip row — three of which say "here is what I touched" in three different visual languages. Artifacts render **before** the prose (`copilot/page.tsx:954`). FinStocks shows zero strips. Intellectia shows one collapsed disclosure.

Meanwhile **no reply anywhere in the product renders a conclusion object.** No verdict word, no confidence, no "Overall signal · 8 indicators" bar. The judgement exists only inside markdown prose. The system *produces* six real verdicts today — the briefing headline, the MarketPulse band, the regime label, OrderFlow's FII/DII verdict, the watchlist consensus word, NewsMoodCard's Bullish/Bearish. Each is rendered as one chip among dozens.

### 1.3 The thinking state is fabricated

`ProgressRail.tsx:96-125` rotates **6 canned phrases on a 1500ms `setInterval`** — "Reading your question", "Choosing the right tools" — with no connection to backend state. The file's own comment at `:93-95` concedes they render before the backend has announced any step, while `:27-29`, seventy lines above, states "no fabricated states" as policy.

**A timer-driven progress ticker in a product that asks people to risk money is the single most damaging element in the codebase.**

### 1.4 Typography is a terminal, not a product

Verified this session by grep across `app/` + `components/`:

- **658 occurrences at ≤10.5px.** Nine-pixel mono carries primary labels.
- **25 distinct arbitrary font sizes**, including half-pixel artefacts (9.5 / 10.5 / 11.5 / 12.5 / 13.5).
- **10 radius names → 6 values**, with two names per value, and `rounded-md` = **6px in Tailwind** but `--radius-md` = **12px in CSS**. The same card is two different shapes depending on which syntax you used.
- The composer textareas are `font-mono` (`copilot/page.tsx:778`, `:725`).

That 658 is the user's verdict, quantified.

### 1.5 Motion never stops

Verified counts: **`animate-spin` ×~130**, **`animate-pulse` ×~70**, `animate-ping` ×8, plus a bobbing robot mascot at `repeat: Infinity` on every page, a price marquee, a placeholder cycling 6 prompts every 3.8s, staggered `BlurFade` on every artifact, and blotter rows staggered at `idx × 0.04s` so row 100 arrives **four seconds** after load.

An idle `/copilot` home runs **five simultaneous animations** before the user types.

### 1.6 The same fact is rendered three to five times, from different endpoints

| Fact | Renders | Sources |
|---|---|---|
| FII/DII net flow | 3× on `/markets` alone | 3 different endpoints |
| Market breadth | 3× | 3 |
| Sector state | 3× | 3 |
| India VIX | 3× | 3 |
| Current price on `/stock/[symbol]` | **5×** | 2 |
| Support/resistance | **4 unreconciled systems** | 4 |
| Win rate / trade count | 2×, `/trades` vs `/risk` | 2 endpoints **that can disagree** |

Seven routes serve the signals cluster; **three have real bodies**, two are 6-line redirects the ⌘K palette lists as separate destinations, and one (`/signals/index-momentum-30`) is structurally dead — `categoryOf()` never returns `momentum30`, so its grid can never populate, yet it fires 4 requests and publishes an un-sourced "29.7% CAGR" claim.

### 1.7 The AI is a button

Every "AI" affordance outside `/copilot` is a hardcoded prompt string fired into a side dock: `dispatchCopilotOpen` across 16 files. There is no composer on `/markets`, `/stocks`, `/watchlist`, `/signals`, `/scanner`, `/patterns`, `/portfolio`, `/trades`, `/paper-trading`, `/risk` or `/fno`. Eleven routes, one input between them, and it is a fixed string.

**The diagnosis in one line:** the product computes cutting-edge model output and then renders it as a compliance dashboard, with the conclusion buried, the machinery promoted, the thinking faked, and the input absent.

---

## 2. THE PRODUCT MODEL

> **Quant X is one conversation with an Indian-market analyst that has already done the work.** You ask in plain English; it answers in two paragraphs and one card carrying a verdict — and everything that produced that verdict (engines, indicators, flows, folds, agents) is one click behind a single collapsed line, or one click into a right-hand panel, never on screen unasked.
>
> Four destinations exist — **New Chat, Markets, Book, Library** — because four questions matter: *what do I ask, what is the market doing, what do I hold, what can I start from.* Everything else that is a route today becomes a mode chip, a panel face, an in-thread answer, or a row on a board.
>
> The models do not shrink by one line of Python. They stop being the wallpaper.

---

## 3. COMPLETE ROUTE TRIAGE — all 55

Verified count: `find frontend/app -name page.tsx` → **55**.

**Legend** — `KEEP` route survives · `CHIP` composer mode · `PANEL` right-panel face · `THREAD` in-thread answer · `MERGE→X` · `CUT` (file deleted; URL survives via §7)

### Home & chat — 2

| # | Route | Becomes | Why |
|---|---|---|---|
| 1 | `/` | **KEEP** | 14-LOC `redirect('/copilot')`. Already minimal. |
| 2 | `/(platform)/copilot` | **KEEP — the product** | Home and thread collapse to ONE scrolling surface. Kills `isBigTask`, `HomeInlineAnswer`, the 46vh in-composer scroller, and the mid-stream view switch. `HomeCockpit`, `MarketTicker`, 8 news cards, CTA band and ~180 LOC unreachable signed-out branch deleted. **`HomeFooter` is NOT deleted — it becomes the shell compliance footer (§R3).** |

### Markets & discovery — 4

| # | Route | Becomes | Why |
|---|---|---|---|
| 3 | `/markets` | **KEEP** (sidebar 2) | **Stays a route — only signed-out crawlable surface (§R10).** Re-cut from 18 surfaces / 250+ values / 19 requests to headline + narrative + one market card + chips + Panel B. Rendered by the template renderer: **0 chat credits.** Entitlement gate preserved (§R9). |
| 4 | `/stocks` | **CUT** → `/markets?panel=universe` | A filter bar over a paginated grid — the Quantman counter-example. Its 3 inputs are the composer relocated; the table becomes Panel A › Peers. |
| 5 | `/watchlist` | **PANEL** — Book › Watchlist | Not in `nav.ts` today. Free tier caps it at 5 rows yet it ships 2 view modes + a 459-LOC alert editor. **The alert editor survives verbatim until monitors ship (§R5).** |
| 6 | `/stock/[symbol]` | **PANEL** — Entity face, **URL preserved** | 38 surfaces, 15–19 unprompted requests, zero AI output above 810px. Becomes one entity card + ≤6-tab panel. Dense version → `/terminal/[symbol]`. |

### Signals — 7

| # | Route | Becomes | Why |
|---|---|---|---|
| 7 | `/signals` | **THREAD** (template-rendered) | A computed summary of one array. Becomes "9 new picks · 6 long / 3 short · strongest RELIANCE" + `[Show the book]`. |
| 8 | `/signals/alpha-picks` | **CHIP** `[Screen]` › book switcher | 4 of 9 sections are static marketing copy. Hero + Key Reads + How-it-works + FAQ → one collapsed disclosure. **FAQ's "no guarantee" answer is promoted OUT of the collapse (§R2 discipline)** — it renders inline. |
| 9 | `/signals/momentum-picks` | **MERGE → #8** | 100% shared component code. Delta = one copy object + one endpoint name. |
| 10 | `/signals/index-momentum-30` | **CUT** | Structurally dead: `categoryOf()` (`categories.ts:192-195`) never returns `momentum30`. Publishes an un-sourced "29.7% CAGR". **Redirect goes to `/signals` (the hub), not to Alpha Picks** — 301'ing a bookmark onto a *different book* is product substitution. |
| 11 | `/signals/momentum` | **CUT** (6-LOC alias) | Palette lists it as a separate destination from its own target. |
| 12 | `/signals/swing` | **CUT** (6-LOC alias) | Same. Four palette rows → two pages. |
| 13 | `/signals/[id]` | **PANEL** — Signal face | The one genuinely useful surface here. 9 panels → 4 tabs + ticket. **The `AutomationPanel` SEBI algo-empanelment fail-closed gate moves with it, not into the bin.** |

### Screener & patterns — 6

| # | Route | Becomes | Why |
|---|---|---|---|
| 14 | `/scanner` | **CHIP** `[Screen]` + Library | 38 tiles, 29 gauges, 8 headings, 0 answers. Capability already ships in Copilot (`copilot-modes.ts:49-50` + `nlScan` + `run_screen` + `table` artifact). |
| 15 | `/scanner/[screen]` | **THREAD** (template-rendered) | 11 numbers above a 200-cell table → prose + one card + `[Details]`. |
| 16 | `/scanner/new` | **THREAD** (`[Screen]` mode) | The only AI-native surface in the cluster, buried under a 38-tile gallery and re-framed as a numbered wizard. |
| 17 | `/scanner/my/[id]` | **MERGE → Tasks** *(gated on backend)* | ~85% duplicate of #15. Merging surfaces `runSavedScan` + `listSavedScanAlerts`, reachable only from dead code today. |
| 18 | `/scanner/fundamental/[preset]` | **THREAD** | 400 cells, zero sentences. `debt_to_equity` is fetched and exported but never shown — on a preset called "Low Debt". |
| 19 | `/patterns` | **PANEL** (drawer) + THREAD | ~25 controls above 550 cells. Its `ExplainDrawer` is the only component in the cluster already obeying rule 3 — **kept verbatim** as Panel A › Patterns. |

### Strategies — 4

| # | Route | Becomes | Why |
|---|---|---|---|
| 20 | `/strategies` | **CHIP** `[Strategy]` | Five products in one route; default tab is `library`, so the composer is two clicks deep. |
| 21 | `/strategies/[slug]` | **PANEL** — Strategy face | A route for 13 scalars; 17 readouts above the fold, the 4 most prominent of which the page itself calls untrusted. |
| 22 | `/strategies/deployed` | **MERGE → Tasks** *(gated)* | It already *is* the Tasks board, mis-shelved. |
| 23 | `/strategies/mine/[id]` | **PANEL** — Rules/Backtest/Deploy | ~225 numeric cells after a universe backtest. Typed-name deploy ritual kept **verbatim** (§R7). |

### Portfolio · trades · derivatives · risk — 6

| # | Route | Becomes | Why |
|---|---|---|---|
| 24 | `/portfolio` | **KEEP → `/book`** | The only route answering "what do I hold". One BigNumber + one prose line + mode chips + ONE merged table (today the same six columns render twice, 400px apart). |
| 25 | `/trades` | **CHIP on /book** `[Trades]` | Blotter is correct-dense and stays. **The semi-auto Approve/Reject queue becomes Book › Approvals — a first-class face, not a casualty (§R-fatal-1.4).** |
| 26 | `/trades/[id]` | **CUT** → Book › Trade | Already duplicated inline on row click; half its body is a placeholder for an unbuilt feature. |
| 27 | `/paper-trading` | **TOGGLE** — Mock\|Live on /book | Paper is a mode. **The 30-day validation window survives as the Live-toggle precondition**, not as a card. League/badges/leaderboard cut. |
| 28 | `/fno` | **KEEP** | The one genuinely distinct workspace. **Deterministic surfaces stay the default (§R11)**; composer is an Elite layer. Chain/Greeks → Panel B tabs. Multi-leg positions get a **Book › Options face** — they are a different endpoint with different actions. |
| 29 | `/risk` | **PANEL** + status chip | 2 cards and 4 tiles given a URL. Its own docstring says it never blocks anything. Deleting its 4 tiles fixes a two-sources-of-truth bug. |

### Agent · notifications · settings · onboarding · auth — 17

| # | Route | Becomes | Why |
|---|---|---|---|
| 30 | `/autopilot` | **MERGE → Tasks** *(gated)* | Agent's home, must survive — as ONE task card, not a 10-band dashboard polling 5 endpoints every 20s for a system that acts once a day. **Compliance/reg-number slot moves with it.** |
| 31 | `/autopilot/track-record` | **PANEL** — Task › Track record | A route for 12 numbers that exist only after the bot has traded. |
| 32 | `/alerts` | **KEEP until monitors ship, then MERGE → Tasks** | **§R5: NL monitors are a new feature, not a merge.** Fix the `text-white`-on-white invisibility now (`AlertPreferencesGrid.tsx:76,110`, shipped twice). |
| 33 | `/inbox` | **PANEL** — top-bar tray | A top-level route for a notification list is a 2010 pattern. Tapping drops the item into the thread. |
| 34 | `/inbox/[id]` | **CUT** | Zero data sources, zero inbound links; ships the literal strings "Plan 3 wires this to /api/notifications/{id}" and "{ payload preview when wired }" to users. |
| 35 | `/settings` | **KEEP** | Re-cut to ONE scrolling column, 6 anchored sections. **Gains sign-out and the theme control (§R4).** Drops the left rail, 2 dead nav items, the dead Telegram row, the duplicate risk editor, the 3rd kill switch. |
| 35a | `#tier` | row in Account | "Copilot usage today" renders the **cap**, not usage. Billing-history placeholder cut. |
| 35b | `#kill_switch` | **PANEL** — Task › Danger | Best-written copy in the cluster; kept verbatim. Fake auto-resume timer deleted. 2 duplicate triggers deleted. |
| 35c | `#notifications` (WatchlistPins) | **CUT** | 376 LOC — larger than all of `/inbox` — for a preference set somewhere else entirely. |
| 35d | `#data` | row in Data | Client-assembled GDPR export silently swallows 3 failures; filename ships a legacy product name. "Delete account" removed until the flow exists. |
| 35e | `#appearance` | **CHIP** Simple\|Full | A settings control that navigates you to `/copilot` on select. **Theme toggle stays in Settings (§R4).** |
| 36 | `/referrals` | **PANEL** — Settings › Refer sheet | A route to display one string. Native `confirm()` for an irreversible rotate → `ConfirmDialog`. Also: **render the invitation on `/signup`**, where `refValid` is fetched and thrown away. |
| 37 | `/onboarding/broker-connect` | **CUT as a gate** → broker chip sheet (**URL kept**) | First screen a new user sees is 7 brokerage API rows described in API version numbers. Invert: land on the composer, Mock on, ₹10L live. **Full-screen sheet on mobile, not a composer popover (§Reviewer-1 mobile objection).** |
| 38 | `/onboarding/risk-quiz` | **THREAD** — the first conversation | The only place the product asks the user a question, and it asks with radio buttons. **But the profile write is mandatory** — `/risk`, `/autopilot`, `/settings` and `TierPanel` all read `risk_profile`. The conversation must produce it before Live unlocks. |
| 39 | `/onboarding/complete` | **CUT** | 3 of its 5 links go to `/copilot`; doesn't even write the flag its docblock claims. |
| 40 | `/login` | **KEEP** | Closest thing to the target aesthetic. Fix: password min 6→8 (matches signup), route by onboarding state, drop `font-bold`. |
| 41 | `/signup` | **KEEP — 1 step** | Steps 2–3 collect a plan that is **discarded** (`selectedPlan` never reaches `signUp()`) and abandon `AuthLayout` mid-flow. |
| 42 | `/forgot-password` | **KEEP** | Correct non-enumerating behaviour. Consistency only. |
| 43 | `/verify-email` | **KEEP** | Hierarchy inverted — "Resend" becomes primary with a 30s cooldown. |
| 44 | `/auth/callback` | **KEEP** | Fix three non-existent Tailwind tokens and the 10s timeout that manufactures auth failures. |
| 45 | `/broker/callback` | **KEEP** | OAuth handler. No IA change. |
| 46 | `/preview-design` | **KEEP — internal, + assert** | **It is in `middleware.ts:85` PUBLIC_PREFIXES.** The draft justified "internal" from an `import` of `notFound`; an import is not a call. Add an explicit `notFound()` guard. |

### Admin — 9 (exempt)

| # | Routes | Becomes | Why |
|---|---|---|---|
| 47–55 | `/admin`, `/payments`, `/training`, `/signals`, `/system`, `/model-performance`, `/ml`, `/users`, `/users/[id]` | **KEEP — separate shell, exempt from all three rules** | Operator console with its own layout, nav, `signOut` and server-side gate. Dashboards are the **correct** form here. Never in consumer nav or palette. Pre-existing gap: `/model-performance` and `/users/[id]` are absent from `adminNavItems` — fix while nearby. |

**Score:** 55 → **9 consumer URLs** (`/`, `/copilot`, `/markets`, `/book`, `/library`, `/fno`, `/settings`, `/stock/[symbol]`, + auth set) + `/alerts` and `/tasks` transitional + 9 admin + 1 internal. **0 URLs 404.**

---

## 4. PAGE-BY-PAGE REDESIGN

### 4.1 `/copilot` — the home

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ ⊕ New Chat │                                                              │
│            │                     What can I do for you?                   │ 34px, weight 600
│ ◷ Markets  │                                                              │
│ ▤ Book     │   ┌──────────────────────────────────────────────────────┐   │
│ ☰ Library  │   │  Ask about any NSE stock, sector or setup…           │   │ 15px SANS
│ ─────────  │   │                                                      │   │ static placeholder
│ TODAY      │   ├──────────────────────────────────────────────────────┤   │ ← one hairline
│  Why is T… │   │  🔗 Zerodha ▾   Mock | Live    Simple | Full    ( ↑ ) │   │ 44px toolbar
│ PREV 7 D   │   └──────────────────────────────────────────────────────┘   │
│  Screen: … │                                                              │
│  Tighten … │    [ Ask ] [ Analyse ] [ Screen ] [ Strategy ] [ Plan ]      │ chips OUTSIDE box
│ ─────────  │                                                              │
│ RK  ⚙︎  ⏻  │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
└────────────┤   │ Today's read│ │ Screen the  │ │ Build a     │            │
   account   │   │             │ │ market      │ │ strategy    │            │
   +settings │   │ What the    │ │ Describe a  │ │ Describe it │            │
   +SIGN OUT │   │ tape says.  │ │ setup.      │ │ in English. │            │
   +THEME    │   └─────────────┘ └─────────────┘ └─────────────┘            │
             │                          View All ›                          │
             │                                                              │
             │   ● All gates clear · ₹10,00,000 practice book               │
             │   Research and education only. Not investment advice.        │ ← FIXED TEXT
             │   Quant X is not a SEBI-registered Research Analyst or       │   §R2
             │   Investment Adviser.  Terms · Privacy · Risk · Grievance    │ ← §R3
             └──────────────────────────────────────────────────────────────┘
```

**Shows by default:** the composer, 5 chips, 3 suggestion cards, one status line, the compliance block. **12 elements.**

**On demand:** everything. Suggestion cards are persistent (never focus-gated). `View All ›` opens the Library sheet — 29 prebuilt screens + 8 fundamental presets + strategy templates + 2 signal books, searchable. Nothing is lost.

**Cut:** `HomeCockpit` greeting + status pill · `MarketTicker` (~108 cells, ~320 live numbers, polling 20–30s) · 8 news cards + 3 filter chips · 4-card CTA band · the 460px `bg-radial-glow` + 360px dual bloom · the 6-prompt/3.8s placeholder rotation · `font-mono` on the composer · ~180 LOC unreachable signed-out branch · `FEATURE_CARDS` · `FeatureMotif` · the wasted `publicTrust.trackRecord` call.

**Kept and relocated:** `HomeFooter`'s compliance block → the fixed footer above, on **every** authed surface (§R3). Sign-out + theme → the sidebar account row (§R4).

### 4.2 The reply

```
 Thinking 4s ›                       ← streaming: 2 words + REAL elapsed counter

──────────────────────────────────────────────────────────────

 TCS is holding its uptrend but momentum is cooling. Price is
 2.1% above the 50-day and volume has been below average for
 four sessions, so the breakout above ₹3,860 is unconfirmed.
 The nearest support that matters is ₹3,780.

 ┌────────────────────────────────────────────────────┐
 │ ▣  TCS                                  ₹3,842.10  │  logo tile, NOT emoji
 │    Tata Consultancy Services              +1.24%   │
 │  ────────────────────────────────────────────────  │
 │    OVERALL SIGNAL · 8 INDICATORS                   │
 │    ████████████░░░░░░░░░░░░▒▒▒▒                    │  bull/neutral/bear
 │                                                    │
 │    Buy                                  ╱╲__╱‾╲__  │  verdict + sparkline
 │  ────────────────────────────────────────────────  │
 │    [ Details ]                        [ Buy ]      │
 │    * Levels from 90 days of EOD data.              │  provenance
 │    Analysis, not investment advice.                │  ← ADVICE ROW (§R2)
 └────────────────────────────────────────────────────┘

 ✓ Worked it out · 6 steps · 2.4s · 3 sources ⌄       ← ONE disclosure

 Follow-ups
 [ Why is it cooling? ] [ Compare with INFY ]
 [ Alert me above ₹3,860 ] [ Plan a trade ]
```

**Rules.** Prose first, always. **Exactly one card** per turn, hard cap. Eight artifact types collapse to three: `EntityCard` (absorbs sparkline/gauge/stat/bars), `RulesCard` (today's `strategy` card, already correct), `DataStub` (`table`/`linechart`/`payoff` post a one-line summary + a chip that opens the panel — **no table ever renders inline**, and `MarkdownMessage`'s GFM table path is removed so there is one grid renderer, not two).

**Every card carries two footnote rows, not one** — data provenance *and* the advice disclaimer. The draft conflated them; they are different statements (§R2 ruling, extended).

**Entitlement branch (§R9):** if `!dataEntitled`, the price/flows region of the card renders the connect-broker gate instead of the number. The card still renders — the verdict is derived, not licensed.

### 4.3 The thinking state

**Streaming:** `● Thinking 4s ›` — a 6px dot at `--state-active` pulsing 0.4→1→0.4 over 1600ms (**the only infinite animation permitted in the product**), a `meta`-sized label, and a **real** elapsed counter.

**Deleted:** `ThinkingPulse`'s 6 canned phrases on a 1500ms timer. Stage-glyph substring matching (`'understand'/'plan'/'market'/'analy'/'compos'`) — iconography inferred from a string carries no meaning; replaced by three glyphs driven by `status` alone.

**Settled:** `✓ Worked it out · 6 steps · 2.4s · 3 sources ⌄`. Expanding reveals step list + tool chips + references **together**, in one `Panel` (no border, no shadow). `ReferencesRail` and the `CONSULTED` row are deleted as siblings.

> **One correction to the draft's own wording.** Its expanded example fronted a silent data substitution ("Upstream timed out — used the EOD chain instead") with a ✓ and the words "Worked it out". If any step failed, the collapsed line reads **`⚠ Worked it out · 6 steps · 1 failed ⌄`** and the substitution is stated in the row, not a tooltip. A failure the user cannot read is a failure the user cannot trust.

### 4.4 `/markets` — stays a route (§R10)

```
Markets                                    ● Live · 15:24 IST
────────────────────────────────────────────────────────────
Nifty closed +0.6% at 24,812 on narrow breadth — 61% of the
index advanced but the move was carried by two heavyweights.
FIIs were net sellers for a third session.

┌──────────────────────────────────────────────────┐
│ NIFTY 50                          24,812  +0.6%  │
│ Overall signal · 6 internals                     │
│ ███████████░░░░░░░░              RISK-ON         │
│ [ Details ]                                      │
│ EOD · derived · as of 3 Aug 15:30 IST            │
│ Research and education only. Not advice.         │
└──────────────────────────────────────────────────┘

✓ How we read the tape · Breadth · Flows · Delivery ⌄

[Global cues] [Breadth] [FII/DII] [Sectors] [What's firing]
```

**Default:** headline + narrative + one card + chips. **2 requests.** **0 chat credits** — the prose comes from the existing `briefing` endpoint through the template renderer.

**On demand:** Panel B tabs `Overview · Internals · Flows · Sectors · Derivatives` absorb MarketPulse's 4 tiles, BreadthCard, SectorHeatmap, SectorRotation, IndexStrip, OrderFlowAnalysis and `/fno`'s chain/Greeks/smile/term/cone. **Three FII/DII surfaces → one Flows tab. Three breadth surfaces → one number in the card. Two big-deals surfaces → one.**

**Entitlement (§R9):** `dataEntitled` gates the Flows, Internals and Derivatives tabs and the card's price row. Non-broker users see headline + narrative + one connect line — not a gate card sandwiched between a hero and an analytics band.

**Cut:** the client-side IST timer pill that can disagree with the API's own session label · `MarketExplainerCard`'s auto-fired LLM call (its own docstring says it should be click-only) · the NIFTY-100 `newsScan` whose output is discarded for non-broker users · `BreadthCard` · `BigDealsCard` · `OrderFlowAnalysis`'s second disclaimer paragraph.

### 4.5 `/book` — the merge of six routes

```
₹4,21,300              +₹6,240  (+1.5%)        Mock | Live
Six positions. Concentration is fine; IT is 38% of the book.

[Holdings] [Orders] [Trades] [Approvals] [Options] [Watchlist]

┌───────────────────────────────────────────────────────┐
│ TCS    25   3,780   3,842   +₹1,550   +1.6%   ▸       │
│ INFY   40   1,510   1,488   -₹  880   -1.5%   ▸       │
└───────────────────────────────────────────────────────┘

● All gates clear ›
```

**One BigNumber replaces 20 KPI tiles** across five routes. **One table** replaces two identical six-column tables 400px apart, merged from `api.positions.getOpen` + `api.broker.getPositions` with the Mock\|Live toggle deciding the source.

**Six mode chips, not four.** The draft had four; two are non-negotiable additions:
- **`[Approvals]`** — the semi-auto Approve/Reject queue (`api.trades.approve`). The draft dropped it silently; it is the human-in-the-loop gate on real orders.
- **`[Options]`** — multi-leg paper positions come from `/api/fo-strategies/paper/positions`, close via a different endpoint, and carry a rule-based adjustment engine. They cannot be represented in a six-column equity table.

**Live toggle precondition:** connected broker **AND** the 30-day paper validation window. The draft kept only the first.

**Cut:** the 4 KPI tiles × 5 routes · per-row P&L bars normalised to set max · `idx × 0.04s` row stagger · the duplicated mobile JSX branch · `StockAvatar` + `SymbolLogo` both rendering for one symbol · gamification (streaks, bronze/silver/gold, 20-row anonymised leaderboard) · `PaperWindowCard`'s 8 numbers + 2 bars → one sentence.

### 4.6 The right panel — 6 faces, 420px

```
┌──────────────────────────────────────────┐
│ TCS · Tata Consultancy            ⤢  ✕  │
│ ₹3,842.10   +1.24%      As of 15:30 IST │
│ Overview  Technicals  Financials  News   │
│ Patterns  Peers                    >_    │ ← Terminal escape
├──────────────────────────────────────────┤
│      ╱╲                                  │
│  ╱╲╱   ╲╱╲___                      ┈┈┈┈ │ dotted last-price
│  [ 1W ]  [ 3M ]  [ 3Y ]                  │ ← 3 pills, was 20 controls
│  Today's move                            │
│  3,801 ●────────────◆──────── 3,861      │
│  Prev close 3,795 · Open 3,812 · Now …   │
│  ─────────────────────────────────────   │
│  [ Buy ]                → Ticket face    │
│  Research & education only. Not advice.  │ ← disclaimer slot (§R2)
└──────────────────────────────────────────┘
```

| Face | Tabs | Absorbs |
|---|---|---|
| **A · Entity** | Overview · Technicals · Financials · News · Patterns · Peers | All 38 `/stock/[symbol]` surfaces. Technicals = verdict + votes + **3 nearest levels only**, resolving the 4 unreconciled S/R systems. Financials = 11 tiles → 6 rows, no per-tile essays. News = Tradomate timeline. Patterns = the `ExplainDrawer` **verbatim**. Peers = the old `/stocks` table, scoped. |
| **B · Market** | Overview · Internals · Flows · Sectors · Derivatives | `/markets`' 25 panels, `/fno`'s chain/Greeks/smile/term/cone. Entitlement-gated. |
| **C · Book** | Holdings · Orders · Trades · **Approvals** · **Options** · Watchlist · Risk · **Trade** | `/watchlist`, `/trades/[id]` (as `TradeReviewCard`), `/risk`, broker margin, equity chart. |
| **D · Signal** | Thesis · Levels · Chart · Pressure-test | All 9 `/signals/[id]` panels. Debate stays on-demand and collapsed (Elite-gated — `debate` is `{FREE:0, PRO:0, ELITE:10}`). |
| **E · Strategy** | Rules · Backtest · Deploy | DSLPreview, 3 inputs, 6-metric strip, equity curve, trade log, `UniverseBacktestResults`, typed-name deploy ritual. |
| **F · Task** | Summary · Track record · Safety rails · Danger | `/autopilot` internals, track-record, per-event alert overrides, `KillSwitchPanel` — the single surviving kill switch of four. |

**The ticket (§R7 — this is the ruling made concrete):**

```
Mock | Live      Buy | Sell      Delivery | Intraday
Qty  [  25  ] ▲▼      +10  +25  +50
Market | Limit
──────────────────────────────────────────
Order value                      ₹96,052.50
Charges & taxes                      ₹41.20   ← FROM THE SERVER
Net debit                        ₹96,093.70
──────────────────────────────────────────
⚠ Manual orders skip risk rules and backtests.
  Prefer Deploy via strategy to stay systematic.
[ Review order ]  ──→  ConfirmDialog, Cancel focused
```

The button says **Review order**, not Confirm. It opens the existing `ConfirmDialog` with Cancel focused, exactly as `ConfirmDialog.tsx:42-49` implements. **One face for collection, two steps to money.**

**Charges are server-computed.** `POST /order` returns no charge fields today, and the visual spec bans invented numbers. A `POST /api/broker/order/preview` endpoint is a build prerequisite; until it exists the ticket shows Order value only and omits the Charges/Net rows. **We do not fabricate STT/stamp/GST/brokerage client-side.**

### 4.7 `/fno`, `/settings`, onboarding — compressed

**`/fno`** keeps deterministic surfaces as its default face (§R11): one index chip row, one entity card per index (spot, verdict word, put/call writing bar, sparkline, `[Details][Trade]`). Chain/Greeks/smile/term/cone → Panel B. Positions → Book › Options. **Cut:** three levels of nested nav, the second `PageHeader` inside the Lab tab, the duplicate `OptionsCopilotCard` mount, **six independent copies of the index picker**, four ad-hoc overflow strategies. The Elite composer is a layer, never the only entrance. **The `derivatives` DisclaimerFooter variant — the only string saying "Derivatives carry a high risk of loss" — moves to `/fno` and Book › Options, not to `/terminal`.**

**`/settings`** becomes one scrolling column, six anchored sections: **Account** (profile, tier row, **sign-out**, **theme**, refer sheet) · **Broker** (one `<BrokerCredentialsSheet>` driven by a config table — 5 configs, ~120 LOC, replacing 822 LOC across two files) · **Risk** (**the single writer**; AutoPilot's Safety Rails links here, killing the three-editors-three-endpoints bug) · **Delivery** · **Appearance** · **Data**. Deleted: the left rail, 2 nav items pointing at non-existent directories, the dead Telegram row, the third kill switch, `WatchlistPinsPanel`, the global message bar.

**Onboarding** becomes the first conversation — but **the risk profile write is mandatory** (`/risk`, `/autopilot`, `/settings`, `TierPanel` all read it). The agent opens with *"What are you trying to do with your money?"*, five questions arrive as turns with chip answers, and the result is one message: *"You're moderate. I'll cap any single position at 8% and pause if we're down 3% in a day."* + `[Change these] [Why?] [Start]`. **Zero chat credits** — onboarding turns are scripted, not model-generated (§R1). Broker connect is a full-screen sheet on mobile.

---

## 5. THE VISUAL SPEC — developer rules

### 5.1 Type — 11 roles, floor 11px

```
display  34/40  600  -0.02em      num-hero  40/44  mono 500
title    24/32  600  -0.015em     num-lg    22/28  mono 500
heading  17/24  600  -0.01em      num       14/20  mono 450
body     15/24  400                num-sm    13/18  mono 450  ← TIER C ONLY
label    13/18  500
meta     12/16  400
micro    11/14  500  +0.06em  UPPERCASE
```

- **8 / 8.5 / 9 / 9.5 / 10 / 10.5px are banned.** 658 sites, verified. `text-[9px]` → `micro`, `text-[10px]` → `meta` or `micro` **by role** — this is a judgement call per site, not a `sed`.
- **Half-pixel sizes deleted** (9.5/10.5/11.5/12.5/13.5 = ~188 sites).
- **11px is `micro` only** — eyebrows, column headers, provenance. Nothing else.
- **Mono is numerics only.** Composers, prose, labels, buttons, headings are `font-sans`.
- **One `display`/`num-hero` per screen. One `title` per screen. One `num-lg` per card.**
- `EyebrowMono` → `micro`, tracking `0.06em` (it is `font-sans` already; the name lies, keep the export).
- `StatTile` rebuilt: label `micro`, value `num-lg`, **no border, no bg, `p-0`** — a layout unit, not a card. Today its value is `text-xs` (12px), smaller than body copy, inside its own border.

### 5.2 Radius — align names to values, then codemod

Tailwind's `rounded-md` is **6px**; CSS's `--radius-md` is **12px**. Fix the config, then:

```
rounded-md  → rounded-xs   (189)     final map:
rounded-lg  → rounded-sm   (157)     mark 2  · xs 6  · sm 8
rounded-xl  → rounded-md   (133)     md 12   · lg 16 · full 9999
rounded-2xl → rounded-lg   (147)
rounded-3xl|4xl|5xl → rounded-lg     Add --radius-full: 9999px
rounded-pill → rounded-full  (49)    (referenced by fallback only today)
rounded-[2px] → rounded-mark (2)
```

**Budget after codemod:** `md` = cards/panels/dropdowns · `sm` = inputs/buttons/rows/`Panel` · `full` = chips/badges/avatars/toggles · `lg` = modals/sheets/the one hero card. `xs` survives for table cell backgrounds only.

### 5.3 Cards — six rules

```
R1  A Card may not contain a Card. Nested content is <Panel> (bg-surface-2,
    no border, no shadow). Already the contract; 88 files bypass it.
R2  Max TWO borders on any containment path.
    Live violation: Bubble → ArtifactCard → stat pill = 3.
R3  Cards in a list are elevation="flush". Exactly ONE raised card per screen.
    Strip the unconditional box-shadow from .lg-surface/.glass-surface/.glass-card.
R4  Max per card: one num-lg, one accent element, one chart, 8 numbers (Tier A).
R5  Every card with a model-derived number carries TWO footnote rows:
    provenance ("EOD · derived · as of …") AND advice ("Analysis, not
    investment advice."). They are different statements. §R2.
R6  A card ends in an action or in nothing. Never a dangling statistic.
```

### 5.4 Density tiers — declare one per surface

| | **A · CALM** | **B · STANDARD** | **C · INSTRUMENT** |
|---|---|---|---|
| Where | thread, entity cards, onboarding, auth, settings | panel faces, task rows, watchlist, list rows | blotter, holdings, order book, option chain, Greeks, screener results, Peers |
| Width | 720px centred | 420px | fluid |
| Padding | 20 (24 hero) | 16 | `px-4 py-2` |
| Row | 56px | 44px | **36px** |
| Body | `body` 15/24 | `label` 13/18 | `num-sm` 13/18 |
| Floor | `micro` 11 | `micro` 11 | `micro` 11 |
| Max numbers | 8/card | 12/face | — |
| Impl | — | — | **`DataTable` with `dense`, no exceptions** |

Tier C is **legitimately dense** — a blotter exists to be scanned row-against-row and whitespace harms it. The failure today is not that C is dense; it is that C's typography leaked into A. Four hand-rolled tables die: `/trades`' 12-col grid + mobile branch, `FoStrategiesWorkspace`'s 9-col chain and 11-col Greeks, `PaperLeagueLeaderboard`'s raw `<table>`. **One truncation convention: 50 rows, then "Show all N ›"** (today: 12/15/25/30/50 + "top 8" + "last 10").

### 5.5 Colour — a per-screen budget

- **One accent element per viewport.** Nav-active and focus rings are exempt. **Banned:** accent on every `**bold**` run in AI prose — the agent bolds numbers heavily, so replies are speckled. Bold = `font-semibold`, no hue.
- **up/down = signed money and the verdict word only.** Banned as chrome: a 3px coloured left rule encoding consensus; `tone="down"` on a **LIVE** badge (healthy strategies currently read as alarms); a coloured badge for a relative timestamp.
- **Warning: max one per screen.**
- **Emoji: zero.** 📈📊📋🎛️🧮🧠💹 prefix every artifact title; 🇮🇳/🌐 badge every news card. This is the strongest "generated by a chatbot" tell in the codebase. Replace with a 40px logo tile, a 14px muted glyph, or nothing.
- **Multi-hue taxonomies banned.** `/autopilot` runs **six** simultaneously. State encodes with position and label; colour carries at most three values.

### 5.6 Motion — seven permitted, everything else deleted

**Permitted:** token streaming (no typewriter on already-received text) · the thinking dot (the **only** infinite animation) · disclosure open/close (200/160ms) · hover/focus/press (90ms) · overlays (180–250ms) · entity-card entrance (one fade + 4px rise, 240ms, **no stagger, no blur, no spring**) · price-tick flash (280ms, tied to a real state change).

**Deleted:** 6-phrase thinking ticker · placeholder rotation · bobbing mascot ×2 · price marquee ×4 · `BlurFade`/`Reveal` stagger (20 files) · blotter row stagger · `animate-pulse` ×~70 → layout-shaped `Skeleton` · `animate-spin` ×~130 → permitted **only** in `Button state="loading"` and `/auth/callback` · `animate-ping` ×8 · `.spin-border` · `.noise-overlay` (a fixed `z-index:9999` grain layer over the whole app) · the copilot glow stack.

> **Stillness budget: when nothing is streaming, nothing moves. At most ONE element animating in the viewport at any instant.**

`<MotionConfig reducedMotion="user">` **already exists** at `providers.tsx:99` (§R12). The remaining work is walking the thread, the disclosure, the card and one Tier C table with reduced motion on.

### 5.7 Light default

Ship **light**. All four references are light; Intellectia (dark) is the second reference and Quantman — the dark dashboard — is the counter-example. Light is a forcing function: on `#EDF1F4` with 16.9:1 ink, 658 sub-11px readouts are *visible*, so the discipline enforces itself. The palette is already built and AA-validated.

Real work (§R13 — smaller than the draft claimed): flip `defaultTheme` (one line; the pre-paint boot script already exists) · fix `app/layout.tsx:96-98`, which hardcodes `noise-overlay` and an inline colour on `<body>` · audit `LightweightChart`'s JS options object for a hardcoded dark background · fix `AlertPreferencesGrid`'s `text-white` (ships twice) · add light-only zebra to Tier C. Dark stays equal-effort and **pins `/terminal/*` regardless of theme**.

### 5.8 Enforcement — six guards

1. Extend `scripts/validate-theme.mjs` to assert the radius map 1:1 and that `--fs-*` matches `fontSize`. This validator once printed ALL PASS while validating a palette the app did not ship.
2. ESLint bans: `text-[8–10.5px]` · `text-white|black`, `bg-white|black` · `rounded-[Npx]` · hex in `className` · `animate-pulse` outside `Skeleton` · `repeat: Infinity` · `backdrop-blur` outside float/pill. Allowlist `components/landing/**`, `.mock-*`, `app/admin/**`.
3. `<DensityProvider tier="A|B|C">` at each route root.
4. One `<EntityPanel>`/`<PanelTab>` primitive — today 12 files hand-roll `rounded-2xl border border-line bg-wrap`, 3 use `<Card>`, 2 use `.lg-surface`, with four divergent loading states.
5. Give `PageHeader` a `badges?: ReactNode` slot. **Four** route files force-cast JSX through `as unknown as string` into a truncating single-line `<h1>`.
6. **Container queries**: `@tailwindcss/container-queries` is **not installed** and Tailwind is 3.4.1. Install before Tier B ships — `ChatArtifacts.tsx:320`'s `sm:grid-cols-2` currently renders 186px cards holding 132px charts with 44px axes inside the 400px dock.

---

## 6. WHAT WE DELIBERATELY DO NOT BUILD

| We do not build | Because |
|---|---|
| **Fake thinking states** | `ThinkingPulse`'s 6 phrases on a 1500ms timer are progress theatre in a product that asks people to risk money. Deleted, not restyled. The counter is real elapsed time or there is no counter. |
| **A "SEBI-registered" claim** | §R2. The company is **not** registered and says so at `HomeFooter.tsx:188`. The disclaimer says exactly what the footer says — no more. |
| **Client-computed charges, margin, premia or payoffs** | `StrategyActionRow` synthesises strikes from `NOMINAL_SPOT=100` and premia from a hand-rolled formula, then draws them with Max Profit / Max Loss / BE badges. Margin is `capital × position_size%`. `/strategies/deployed` divides by a hardcoded ₹1L. All of it renders at 18–34px with an 11px caveat. **If the server does not return the number, the row does not render.** |
| **Un-sourced return claims** | "29.7% CAGR vs 22.0% · 179 monthly rebalances" ships as static copy on a page with zero live signals. Cut with the route. No performance figure appears anywhere without a live endpoint behind it. |
| **A headline "₹ you would have made"** | `BacktestViewer.tsx:59-68` documents removing it as the most overfittable framing on a SEBI-constrained retail product — and `UniverseBacktestResults.tsx:121` renders it at 34px on the same route. The honest sibling wins; the string is deleted. |
| **Parameter optimisation surfaced to retail** | `NewRunModal` ships 9 GA/sampling knobs (`ga_pop_size`, `ga_generations`, `ga_elite`, `walk_forward_folds`…) to consumer users. It moves behind `/terminal/discovery` and is never in nav or the default palette. |
| **Monte Carlo, synthetic equity curves, simulated fills** | Not in the codebase. Not added. A backtest reports the folds it actually ran or it reports nothing. |
| **Gamification** | Streaks, bronze/silver/gold badges, medal icons, a 20-row leaderboard of anonymised strangers. Present in **none** of the four references. Cut. |
| **Controls that announce their own incompleteness** | Three ship today: the auto-resume timer with "(timer wiring lands with scheduler PR)", "Billing history — wiring lands with the Razorpay webhook PR", and a Delete-account button that returns "pending admin-signoff wiring". All three removed until the flow exists. |
| **Navigation that costs an LLM credit** | §R1. Deterministic answers are template-rendered from REST. |
| **A one-click path to real money** | §R7. Collection and confirmation are separate, and Cancel takes focus. |
| **Emoji as product iconography** | §5.5. |
| **A second dashboard** | `/stock/[symbol]` is a 703-LOC dashboard fronting 3,145 LOC of panels with a 3-tab rail inside it. Its replacement is a card and a panel — not a tidier dashboard. |

---

## 7. THE BUILD SEQUENCE

**Honest total: 90–115 engineer-days.** ~30 backend. ~15 blocked on a pricing decision that is not engineering's to make.

### Phase 0 — Free wins, no coordination, no flag · **8–10d**

| Step | Effort | Detail |
|---|---|---|
| 0.1 Delete dead code | 2d | `components/copilot/artifacts.tsx` (0 importers) · 8 `components/scanner/*` files, 2,083 LOC (0 importers each) · `/inbox/[id]` · `IndicatorInterpreterCard` · the unreachable `/copilot` signed-out branch. **Verified by import-grep.** |
| 0.2 **Strike the SEBI claim; add the compliance footer** | **1d** | **Do this first.** Move `HomeFooter`'s compliance block into the shell as a persistent footer. Fix the false-claim line before anything else ships. |
| 0.3 Radius codemod | 2d | ~1,200 mechanical sites, zero rendered delta. Add `--radius-full`. Extend the validator. |
| 0.4 Motion kill list | 2d | `animate-pulse` → `Skeleton`; `animate-spin` → `Button`/callback only; delete mascot, marquee, tickers, staggers. **Skip the `MotionConfig` step — it exists (§R12).** |
| 0.5 ESLint bans + container-queries install | 1d | Install the plugin before Tier B. |
| 0.6 Fix `AlertPreferencesGrid` invisibility | 0.5d | `text-white` on near-white, shipped twice. |

### Phase 1 — Typography · **4–5d**

Not mechanical. 658 sub-11px sites; `text-[9px]` → `micro` vs `text-[10px]` → `meta` is a per-site judgement and a blind `sed` regresses Tier C. Ships behind the `DensityProvider` so tiers are declared as you go.

### Phase 2 — Backend, fully parallel to 0–1 · **20–27d**

| Step | Effort | Why it blocks the frontend |
|---|---|---|
| 2.1 `copilot_messages` migration + writer + reader | 2d | Today the schema is `role, content, tools_used, trace, intent, refused`. Artifacts/steps/references are forwarded to the client and **discarded**. Without this, the one-card reply is invisible on reload. |
| 2.2 `entity` artifact type | 3–4d | Verdict word, indicator count and vote shares exist in **no** artifact payload. Needs a `get_verdict` tool (the copilot toolset has 20 tools, none of them verdict), a `build_artifacts` branch, pytest, and `verify-copilot-protocol.mts` (which replays frames through the AI SDK schema). |
| 2.3 **Template renderer** | **4d** | **§R1 — the keystone.** Deterministic prose + card from REST, zero tokens. Everything in §4.4/§4.5 depends on it. |
| 2.4 Order preview endpoint | 3d | Real domain work: STT/stamp/GST/exchange-txn per segment. Until it lands the ticket omits Charges/Net (§4.6). |
| 2.5 **Metering redesign** | 4–6d eng + a pricing decision | Separate deterministic renders from `chat`. Free must complete J1+J2+J3 without a 402. |
| 2.6 Monitors (table + NL compiler + evaluator + scheduler + CRUD + `create_alert` action) | 8–12d | §R5. A **feature**, not a merge. `saved_scans` also needs `source_prompt` and `next_run_at` columns before a Tasks row can render 3 of its 5 fields. A real APScheduler exists, so the pattern is proven. |

### Phase 3 — The thread · **10–12d**

Composer re-skin · collapse home+thread into one surface · `EntityCard`/`RulesCard`/`DataStub` · the `● Thinking 4s ›` state and the one collapsed disclosure · delete `ReferencesRail` + `CONSULTED` + `ThinkingPulse`. **Gated on 2.1 + 2.2.**

### Phase 4 — The atomic cut · **15–20d, one branch, three sub-steps**

Unsplittable in principle: the 301 map targets `/book` and `/library`, the sidebar cannot drop `/portfolio` before `/book` renders holdings, and a 301 is global and cannot be feature-flagged. **Mitigation that makes it revertable:**

1. **4a — Build additive** (~8d). `/book` and `/library` ship **alongside** `/portfolio` et al., behind a nav flag. Nothing is deleted. `/book` must include **Approvals** and **Options** faces on day one.
2. **4b — Re-home the chrome** (~4d). Sign-out + theme into the sidebar account row (§R4). Move the 9 routes self-mounting `AppShell` into `(platform)` so they get `SystemHaltBanner` and the mobile STOP FAB. **Add a visible ⌘K trigger to the mobile drawer** — it is keyboard-only today, and the palette is the reachability guarantee for everything cut from nav.
3. **4c — Flip** (~5d). Sidebar 12→4, palette 28→12, 301 map (including 7 new parameterised capture rules — the current map is exact-match only), delete old routes, update `01b-retired-route-redirects.spec.ts` and `04-sidebar.spec.ts`.

### Phase 5 — Panel & terminal · **25d**

Six panel faces (~20d) · `/terminal/*` re-homing (~5d, mostly file moves).

### Phase 6 — Light default · **3d** (§R13)

### 🔴 THE RISKIEST STEP

**Phase 2.5 — the metering redesign — and the rule that nothing in Phase 4c ships before it merges.**

Riskiest for three compounding reasons:

1. **Total failure mode.** Every free user hits HTTP 402 on their 6th tap of a 4-item sidebar. `tiers.py:185` caps `chat` at 5/day; `ai_routes.py` raises 402. Three of the five mode chips map onto buckets that are **0** for the tier being shown the chip (`scanner_thesis` FREE:0, `fno_advisor` PRO:0, `debate` PRO:0).
2. **Invisible in development.** `_enforce_copilot_cap` short-circuits for `user_tier.is_admin`. **The team building this never sees the wall.**
3. **Not revertable by dropping a branch.** By Phase 4c the deterministic free surfaces it replaced are deleted and 301'd, so rollback means restoring 25 routes *and* unwinding the redirect map. Every other risky step here is a branch you can drop.

**Gate:** Phase 4c does not start until 2.1, 2.2, 2.3 and 2.5 are merged and a **non-admin free account** completes J1 + J2 + J3 without a 402.

---

## 8. HOW WE VERIFY

| Step | Verification | Pass condition |
|---|---|---|
| **0.1** dead code | `grep -rL` for each deleted module across `app/`+`components/`; `next build` | 0 importers before deletion; build clean |
| **0.2** compliance | Manual read of the rendered footer against `HomeFooter.tsx:188-191`; screenshot every authed route | The word "registered" appears **only** in the phrase "not a SEBI-registered". Legal links + grievance + SCORES reachable from every authed route |
| **0.3** radius | `validate-theme.mjs` asserts name→value 1:1 and `--radius-md` == `rounded-md`; visual diff | ALL PASS; zero pixel delta |
| **0.4** motion | `grep -cE "animate-(spin\|pulse\|ping)"`; `repeat:\s*Infinity`; record 10s of an idle home | spin ≤2 (Button, callback); pulse only in `Skeleton`; Infinity == 1 (the dot); **zero motion on an idle home** |
| **1** type | `grep -cE "text-\[(8\|8\.5\|9\|9\.5\|10\|10\.5)px\]"` | **0** (from 658). ESLint blocks reintroduction |
| **2.1** persistence | Send a turn with an artifact + steps; reload; diff live vs resumed DOM | Byte-identical reply |
| **2.2** entity artifact | `pytest` on `build_artifacts`; `verify-copilot-protocol.mts` | Frames validate against `uiMessageChunkSchema`; verdict/count/shares present |
| **2.3 + 2.5** 🔴 metering | **Non-admin free account.** Walk J1+J2+J3. Assert `chat` counter before/after | **Counter unchanged by navigation.** Zero 402. Automated as an e2e gate on a seeded free user |
| **2.4** charges | Compare preview vs broker contract note on 5 real fills | Within ₹1, or the rows do not render |
| **2.6** monitors | Create via NL; assert row renders trigger sentence + **source prompt** + **next run**; fire it | All 5 Tasks fields populated from real columns |
| **3** reply shape | DOM assert per assistant turn | Exactly 1 card; prose precedes it; exactly 1 disclosure; 0 `ReferencesRail`; 0 `CONSULTED`; 2 footnote rows per card |
| **3** honesty | Force a tool failure | Collapsed line reads `⚠ … 1 failed`; substitution stated in the row, not a tooltip |
| **4a** `/book` | Seed an account with equity + options + a pending trade | All three visible; Approve fires `api.trades.approve`; option close fires the F&O endpoint |
| **4b** chrome | Fresh browser, mobile viewport, no keyboard | Sign out reachable ≤2 taps; theme reachable; ⌘K openable **by tap** |
| **4c** redirects | Extend `01b-retired-route-redirects.spec.ts` to all ~30 rows incl. the 7 parameterised | Every row 301s to a **200**. Zero 404. `/signals/index-momentum-30` lands on `/signals`, not a different book |
| **4c** entitlement | Broker-less account on `/markets`, Panel B, entity card | No raw NSE quote, FII/DII rupee flow, OI or depth renders. Gate copy shown instead |
| **5** ticket | Keyboard-only: open ticket, press Enter repeatedly | **No order fires.** Cancel holds focus in `ConfirmDialog` |
| **5** container | Panel at 420px with 2 artifacts | 1 column; no chart <200px; no horizontal page scroll |
| **6** light | Every authed route, light, screenshot | No invisible text; charts legible; no dark rectangles |
| **All** | **The screenshot test**: disable every gradient, blur and animation | Surface still looks deliberate. If it collapses, the design was decoration. Run on the thread, the card, the disclosure, the panel and one Tier C table — **in light** |

---

## APPENDIX — the ledger this plan must never lose

Reviewer 1's core contribution was that a route triage can silently delete working business logic. These eleven items are preservation obligations, each with a named destination. **Nothing ships that drops one without a written replacement.**

| Capability | Today | Destination |
|---|---|---|
| Sign out | `RightRail.tsx:164` (only consumer site) | Sidebar account row · Phase 4b |
| Theme control | `settings:1529` + `RightRail:58` | Settings › Account · Phase 4b |
| Price-alert creation | `api.watchlist.updateAlerts` via `AlertEditModal` | Stays until monitors (2.6) ship |
| Semi-auto approval queue | `trades:339-411`, `api.trades.approve` | Book › **Approvals** · Phase 4a |
| Multi-leg option positions | `/api/fo-strategies/paper/*` + `fnoAdjustments` | Book › **Options** · Phase 4a |
| SEBI data-entitlement gate | `dataEntitled` on `/markets`, order book | Every Flows/Internals/Derivatives tab + the card price row |
| Signed-out crawlable market page | `middleware.ts:85` | `/markets` stays a route |
| Persistent upgrade CTA | `Sidebar:221-234`, `RightRail:56` | Sidebar footer row (cross-app link to landing `/pricing`) |
| 30-day paper validation | `PaperWindowCard` + `go_live_eligible` | Live-toggle precondition |
| Risk-profile write | `/onboarding/risk-quiz` → 5 downstream readers | Mandatory output of the onboarding conversation |
| Derivatives suitability warning | `DisclaimerFooter variant="derivatives"`, one mount | `/fno` + Book › Options — **not** `/terminal` |
| Past-performance caveat | `DisclaimerFooter variant="compact"`, 4 mounts | Attached to every backtest result card, in-thread included |
| Journal coaching endpoints | `journalInsights`, `coachReview`, `weeklyReview` | Book › Trades follow-up chips |
| Alert channel test | `api.alerts.test(channel)` | Settings › Delivery |
| SEBI algo-empanelment gate | `AutomationPanel` fail-closed flags | Panel D, with the signal |

---

**Files referenced (absolute):** `/Users/rishi/QuantX/frontend/app/(platform)/copilot/page.tsx` · `/Users/rishi/QuantX/frontend/components/home/HomeFooter.tsx` · `/Users/rishi/QuantX/frontend/components/shell/RightRail.tsx` · `/Users/rishi/QuantX/frontend/components/copilot/CopilotProvider.tsx` · `/Users/rishi/QuantX/frontend/components/copilot/ProgressRail.tsx` · `/Users/rishi/QuantX/frontend/app/markets/page.tsx` · `/Users/rishi/QuantX/frontend/app/trades/page.tsx` · `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · `/Users/rishi/QuantX/frontend/middleware.ts` · `/Users/rishi/QuantX/frontend/app/providers.tsx` · `/Users/rishi/QuantX/backend/backend/core/tiers.py`