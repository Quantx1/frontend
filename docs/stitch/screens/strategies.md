# AI Algos (strategies)

> Part of the Quant X as-built screen inventory — see [`../03-SCREEN-INVENTORY.md`](../03-SCREEN-INVENTORY.md)
> for the full index and [`../01-DESIGN-SYSTEM.md`](../01-DESIGN-SYSTEM.md) for every token used below.

**10 surfaces.**

## Family notes

SHARED SHELL — every route in this group renders inside app/(platform)/layout.tsx → components/shell/AppShell.tsx: fixed LEFT sidebar 240px expanded / 68px collapsed on bg-wrap (#151517 dark), fixed RIGHT icon rail 72px on bg-main (#0D0D0E dark), main pane with lg:ml-60 (or lg:ml-[68px]) and lg:mr-[72px], inner content mx-auto max-w-[1440px] px-4 md:px-6. Below lg both rails disappear and a mobile Topbar opens a MobileDrawer. A skip-to-content link is the first focusable element; ⌘/Ctrl+K opens the CommandPalette; a ConnectBrokerBanner sits above page content; ComplianceFooter (SEBI/SCORES statutory block) renders under EVERY page inside the same 1440px cap; AutopilotStickyStop and SystemHaltBanner are global overlays. There is no route-level loading.tsx or error.tsx inside /strategies — the group-level app/(platform)/loading.tsx (a max-w-7xl skeleton: 180×28, 280×14, four 80px tiles, one 320px block) and app/(platform)/error.tsx (an 80px dashed spinning ring with a red "!" glyph, "Something went wrong" / "An unexpected error occurred." / a fully-rounded accent "Try again" button) are the fallbacks.

TWO PAGE WIDTHS — /strategies and /strategies/deployed are full-bleed to the 1440px cap; /strategies/[slug] and /strategies/mine/[id] narrow themselves to mx-auto max-w-5xl (1024px). A redesign must preserve that deliberate difference between browsing/monitoring surfaces and reading/working surfaces.

SHARED COMPONENTS ACROSS SCREENS — DSLPreview renders identically on the Builder, template detail and my-strategy detail. BacktestViewer renders identically on the Builder and my-strategy detail. DisclaimerFooter appears in two forms: the standard "For educational purposes. Not investment advice. Markets carry risk." on page bodies, and the compact "Backtested on past data. Hypothetical results — not a guarantee of future returns. Not investment advice." directly under every backtest RESULT surface (BacktestViewer, UniverseBacktestResults, StrategyCompareCard, BacktestAIRead). The status→tone map is duplicated in two files but identical: draft muted, backtest muted, paper primary/blue, live up/green, paused warning/amber, archived muted. NOTE the one inversion: on /strategies/deployed a 'live' strategy gets a DOWN/RED badge (deliberate alarm), not the green used everywhere else.

GATING — the promotion gate is the spine of the product. Templates carry a display-only tier badge (free muted / pro+elite amber) and a hard 'coming-soon' state (NULL dsl, disabled clone). Paper deployment is ungated. Live deployment is gated three ways: the Builder's GateBadge (pass/needs-work popover from GET /api/strategies/{id}/gate), a server 422 gate_failed rendered verbatim in the Builder's "Deploy live?" dialog, and the my-strategy page's typed-name + checkbox friction modal.

RADIUS REALITY vs SPEC — the nominal scale is xs 6 / sm 8 / md 12 / lg 16 / full. In this group, Card defaults to md 12px, Button/Input/Dialog to sm 8px, badges/pills/segmented to full, and metric tiles + inner tables + inline segmented controls to xs 6px. Only three surfaces use lg 16px: the Builder's NL composer, its clarification card and the VisionUpload card. The DiscoveredTab new-run modal is hand-rolled at rounded-sm 8px on bg-main rather than using the foundation Dialog.

TYPE REALITY — PageHeader h1 uses text-display-sm (40px/1.1, -0.02em, font-NORMAL not 600). CardHeader is 16px/22px/600. Hero numbers are mono 34px (OOS folds, universe P&L), mono 28px (in-sample fallback), mono 24px (StatCards), mono 22px (avg per stock), mono 20px (in-sample return). There is heavy legitimate use of 9px/10px/11px mono uppercase micro-labels inside metric tiles and dense table headers across this group — below the stated 11px floor — and it is load-bearing for the density; a redesign that raises them all to 11px will reflow every table header and stat tile.

CHART INVENTORY — only two charts exist in the whole group, both Recharts AreaCharts, both green-on-transparent with a top-down gradient: the equity curve in BacktestViewer at ResponsiveContainer height 260 (dashed 3-3 grid, ₹Nk Y ticks, "26 May" X ticks, 8px-radius tooltip), and PayoffDiagram at a fixed 240px height (zero ReferenceLine, teal 'Spot' ReferenceLine, one dashed line per strike, ₹1.2K Y ticks). PayoffDiagram is the one component still carrying legacy hardcoded rgba(255,255,255,…) strokes and a teal accent (rgba(79,236,205,…)) rather than the token set — it is off-system and should be reconciled to the accent/hairline tokens on any redesign.

LIVE BEHAVIOUR — /strategies/deployed polls every 30s (SWR, dedupe 10s, keepPreviousData). The Discovered tab polls runs every 5s and candidates every 5s only while a run is non-terminal. Everything else (Library, My strategies, template detail, my-strategy detail) is a one-shot fetch with manual refetch after mutations. Nothing in the group uses optimistic updates — every mutation refetches.

CONFIRMATION INCONSISTENCY worth preserving or fixing deliberately: Archive uses a native window.confirm in three places (My strategies row, my-strategy detail, discovery candidate); live deploy uses a proper Radix Dialog with double friction; Pause on /strategies/deployed has no confirmation at all.

HARDCODED VALUE TO WATCH — on /strategies/deployed each card's "Total P&L" sub-line divides by a literal 100000 and prints "% of ₹1L" regardless of the strategy's real allocated capital.

---

## `/strategies` — AI Algos — Library tab (default)

**File** `app/(platform)/strategies/page.tsx` · **831 LOC** · **Access** authed (platform group redirects to /onboarding/broker-connect when onboarding incomplete). Catalog itself is a public endpoint; per-template tier gate is shown as a Badge only (free = muted badge, pro/elite = warning badge) — no hard block on this screen.

**Shell** — (platform) AppShell — fixed 240px left sidebar (68px collapsed) on bg-wrap, fixed 72px right icon rail on bg-main, main pane between with mx-auto max-w-[1440px] px-4 md:px-6; mobile Topbar + MobileDrawer below lg; ⌘K CommandPalette; ConnectBrokerBanner above content; ComplianceFooter under content.

**Purpose.** The default landing tab of AI Algos. The user comes here to browse pre-seeded, ready-made DSL strategy templates grouped into merchandising sections and to pick one to open and clone. It concludes with a click-through to a template detail page; nothing is deployed from here.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **PageHeader** | border-b border-line, px-4 py-5 md:px-6, flex-col gap-4 → md:flex-row md:items-end md:justify-between. Eyebrow font-mono 11px uppercase tracking-[0.1em] muted: "Build · Backtest · Gate". H1 text-display-sm = 40px/1.1 letterspacing -0.02em font-normal, truncate: "AI Algos". Description 14px secondary: "Describe a strategy in plain English. The AI compiles it, walk-forward backtests it on out-of-sample data, and gates it before it trades live." |
| 2 | **Header action** | Single Button variant="ai" (glass-control neutral fill + AI ink #8FB0FF dark / #3459C9 light), h-8 px-3.5 13px semibold, radius sm 8px: Sparkles 16px + "Ask Copilot". Dispatches the global Copilot dock with prefill "Help me pick a strategy that matches my risk profile and the current regime." |
| 3 | **Content wrapper** | space-y-6 px-4 py-5 md:px-6 xl:px-8. Everything below is wrapped in Reveal(delay 0.08) — fade-up from y=10, 0.45s, ease [0.16,1,0.3,1]. |
| 4 | **Tab rail** | Radix TabsList: inline-flex gap-1 rounded-full border border-line bg-main p-1. 5 triggers px-3.5 py-1.5 rounded-full 14px font-medium; inactive text-muted, active bg-wrap + text-primary + shadow-sm. Labels in order: "Library" · "My strategies" · "Deployed" · "Builder" · "Discovered". The Deployed trigger router.push()es to /strategies/deployed; its own panel only ever shows "Opening deployed strategies…" (13px muted, py-10, centered). |
| 5 | **Loading state** | grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 with exactly 6 skeleton cards. Each: rounded-sm(8px) border-line bg-wrap p-4 space-y-3 → Skeleton 60%×16px, 100%×32px, then a 3-col grid of three 100%×36px blocks. |
| 6 | **Section stack** | space-y-8. Sections rendered in a fixed order and skipped when empty: exclusive → featured → swing → intraday → options. Section titles/taglines come from the API, not hardcoded. |
| 7 | **Section header row** | mb-3 flex items-end justify-between gap-3. Left: h2 16px font-semibold primary (section.title) over 12px muted tagline. Right: font-mono 11px tabular-nums muted "{n} templates". |
| 8 | **Template grid** | grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 — 3 columns at lg and up. |
| 9 | **TemplateCard shell** | Card variant="clickable" → radius md 12px, border-line, bg-wrap, shadow-none at rest; hover -translate-y-px + border-wrap-line + shadow-elev-2; cursor-pointer. Whole card navigates to /strategies/{slug}. |
| 10 | **TemplateCard header** | CardHeader min-h-44px, border-b border-line, px-20/py-16 padding vars, title role 16px/22px semibold -0.01em. Truncated template name (title attr = full name) + right-aligned Badge: "Coming soon" (muted) when tags include coming-soon, else the raw lowercase tier string ("free" muted / "pro"/"elite" warning). |
| 11 | **TemplateCard body** | CardBody line-clamp-2 min-h-[2.5rem] 12px muted description. Omitted entirely when the template has no description. |
| 12 | **TemplateCard stat rail** | grid grid-cols-3 divide-x divide-line border-t border-line. Each cell p-3 text-center: label 10px font-medium uppercase tracking-wider muted, value mt-0.5 font-mono 14px tabular-nums primary. Labels exactly "Win rate" (formatPercent 1dp), "Sharpe" (2dp, else "-"), "Min capital" (₹{min_capital/1000}k, else "-"). |
| 13 | **Error state** | EmptyState tone="error" (recessed bg-surface-2 rounded-md, p-10, centered): 44px round icon well with TrendingUp 24px tinted down; h3 16px/22px semibold "Library wouldn't load"; 14px secondary = the API error string; action Button "Retry" (window.location.reload()). |
| 14 | **Empty state** | EmptyState tone info, Wand2 24px: title "Library's still filling up", description "The catalog is being seeded. Head to the Builder, describe your own in plain English, and let the AI compile and gate it." No action button. |
| 15 | **DisclaimerFooter** | Standard variant, pinned last in the page body: centered 10px muted "For educational purposes. Not investment advice. Markets carry risk." |
| 16 | **ComplianceFooter** | Injected by AppShell below the page content inside the same 1440px cap — statutory SEBI/SCORES block present on every authed surface. |

**Components** — `PageHeader — components/foundation/PageHeader.tsx` · `Button — components/foundation/Button.tsx` · `Tabs/TabsList/TabsTrigger/TabsContent — components/foundation/Tabs.tsx` · `Reveal — components/foundation/Reveal.tsx` · `Card/CardHeader/CardBody — components/foundation/Card.tsx` · `Badge — components/foundation/Badge.tsx` · `Skeleton — components/foundation/Skeleton.tsx` · `EmptyState — components/foundation/EmptyState.tsx` · `DisclaimerFooter — components/foundation/DisclaimerFooter.tsx` · `dispatchCopilotOpen — components/copilot/CopilotProvider.tsx` · `AppShell — components/shell/AppShell.tsx`

**States & data.** One-shot fetch on mount: api.strategies.getCatalogSections() → GET /api/strategies/catalog/sections (auth:false), cancelled on unmount. Loading = 6 skeleton cards in the 3-col grid. Error = EmptyState tone error with the raw handleApiError string + Retry (full page reload). Empty = totalCount across the 5 section keys is 0 → 'Library's still filling up'. No polling, no SWR, no revalidation on focus. Tier is display-only metadata on the card badge.

**Interactions.** Tab switching via Radix Tabs (client state, no URL sync). 'Deployed' trigger performs a router.push to /strategies/deployed on click while also switching the local tab value. Whole TemplateCard is clickable → router.push(`/strategies/${slug}`) with hover lift. 'Ask Copilot' opens the global Copilot dock with a prefilled prompt. Retry reloads the window. No filters, sorting, search or pagination on this tab.

**Responsive.** Template grid: 1 col < sm, 2 cols sm–lg, 3 cols ≥ lg. PageHeader stacks (title block above actions) below md and becomes a row with items-end at md. Body gutters px-4 → md:px-6 → xl:px-8. AppShell drops both fixed rails below lg and shows the mobile Topbar; main margins lg:ml-60 / lg:ml-[68px] and lg:mr-[72px] only apply at lg+. Tab rail is a single non-scrolling pill row — 5 triggers with whitespace-nowrap can crowd on very narrow phones.

**Key copy.** • Eyebrow: "Build · Backtest · Gate"
• Title: "AI Algos"
• Description: "Describe a strategy in plain English. The AI compiles it, walk-forward backtests it on out-of-sample data, and gates it before it trades live."
• Tabs: "Library" / "My strategies" / "Deployed" / "Builder" / "Discovered"
• Deployed placeholder: "Opening deployed strategies…"
• Stat labels: "Win rate" / "Sharpe" / "Min capital"
• Badge: "Coming soon"
• Section counter: "{n} templates"
• Error: "Library wouldn't load" + "Retry"
• Empty: "Library's still filling up" / "The catalog is being seeded. Head to the Builder, describe your own in plain English, and let the AI compile and gate it."
• CTA: "Ask Copilot"
• Footer: "For educational purposes. Not investment advice. Markets carry risk."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark-first web dashboard screen for an Indian (NSE) AI trading platform, inside a left 240px sidebar + right 72px icon rail app shell, content capped at 1440px with 24px gutters. Page canvas #0D0D0E, cards #151517, hairline borders #29292D, primary ink #F7F7F8, secondary #D3D3D7, muted #96969E. One accent: fill #406AE4 (white ink), accent text #8FB0FF. Top: a header band with a 1px bottom hairline — mono uppercase 11px eyebrow tracked 0.1em "BUILD · BACKTEST · GATE", then a 40px/600 title "AI Algos", then 14px secondary subtitle "Describe a strategy in plain English. The AI compiles it, walk-forward backtests it, and gates it before it trades live." Right-aligned pill button with a sparkle glyph: "Ask Copilot". Below, a fully-rounded pill tab rail on #0D0D0E with a 1px border, five tabs — Library (active, #151517 pill), My strategies, Deployed, Builder, Discovered. Then three merchandising sections stacked 32px apart: each has a 16px/600 heading, 12px muted tagline, and a right-aligned mono 11px count "6 templates". Under each, a 3-column card grid, 16px gaps, 12px radius cards: card title row with a full-radius tier chip ("free" grey / "pro" amber #F0A94F), a 2-line 12px muted description, then a 3-cell divided footer strip with 10px uppercase labels Win rate / Sharpe / Min capital over mono tabular numbers 62.4% / 1.38 / ₹50k. Sample names: "NIFTY 50 EMA Crossover", "BANKNIFTY Weekly Straddle", "RELIANCE Mean Reversion". Cards lift 1px on hover. Footer: centered 10px muted disclaimer "For educational purposes. Not investment advice. Markets carry risk."
```
</details>

---

## `/strategies` — AI Algos — My strategies tab

**File** `app/(platform)/strategies/page.tsx` · **831 LOC** · **Access** authed. Lists only the caller's own rows from GET /api/strategies. No tier gate on the list; the live promotion gate lives on the detail page.

**Shell** — (platform) AppShell — same 240/72 rails, 1440px cap. Same PageHeader + pill tab rail as the Library tab; only the panel below TabsContent changes.

**Purpose.** The user's own saved DSL strategies. They come here to see status at a glance (draft / paper / live / paused / archived), read the last backtest one-liner, run lifecycle transitions inline without opening the detail page, and — when they have 2+ — run a head-to-head out-of-sample comparison. It concludes with either a status change or a click into /strategies/mine/{id}.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Shared header + tab rail** | Identical to the Library tab: "Build · Backtest · Gate" eyebrow, "AI Algos" 40px title, Ask Copilot button, 5-tab pill rail with "My strategies" active. Panel is mt-5. |
| 2 | **Loading state** | space-y-3 with exactly 3 full-width Skeleton blocks at 80px height. |
| 3 | **Error state** | EmptyState tone="error", TrendingUp 24px in a 44px round well: "Your strategies wouldn't load" + the raw API error + Button "Retry" (re-runs the list fetch, not a page reload). |
| 4 | **Empty state** | EmptyState, Wand2 28px: h3 "Nothing built yet", 14px secondary "Grab a tested template from the Library, or describe one in plain English and let the AI compile and gate it in the Builder.", action Button "Ask Copilot for a pick" → opens the Copilot dock prefilled with "Suggest a strategy I can deploy with ₹1L starting capital." |
| 5 | **StrategyCompareCard (only when ≥2 strategies)** | Rendered above the list. Card 12px radius; CardHeader "Compare strategies" with a GitCompare glyph 16px in accent ink. Body: 12px muted "Pick 2–6 to compare head-to-head on out-of-sample metrics.", then a wrap of name chips rounded-full px-2.5 py-1 11px font-medium — selected chips are solid #406AE4 with white ink, unselected are neutral L2 fill with muted ink. Selection caps at 6. |
| 6 | **Compare action** | Button size sm labelled "Compare" plus the selected count when ≥2 (e.g. "Compare 3"); disabled below 2 selections; shows a spinning Loader2 12px while running. Failure clears the result and fires a toast "Compare failed" with the API detail. |
| 7 | **Compare result table** | overflow-x-auto, border-t border-wrap-hover, pt-3, w-full 12px table. Header: left "Metric", then one right-aligned column per selected strategy; the best_overall column name is prefixed with a 12px Trophy glyph tinted warning #F0A94F. Rows in fixed order: "OOS Sharpe" (2dp) · "Consistency" (rounded %) · "Holdout return" (signed 1dp %) · "Worst drawdown" (1dp %) · "OOS trades" (int) · "Live-gate" ("Pass" / "Not yet"). Per-metric winner cells go font-semibold success green; null renders as an em dash. Compact DisclaimerFooter closes the table. |
| 8 | **Strategy row card** | Card variant="glass" → elevation floating (shadow-elev-2), 12px radius, bg-wrap. CardBody flex-wrap items-center justify-between gap-3, so the action cluster wraps under the identity block on narrow widths. |
| 9 | **Row identity block** | A borderless button occupying min-w-0 flex-1 (focus ring 2px primary/40). First line wraps: strategy name (font-medium primary, truncate) then three badges — status badge (draft→muted, backtest→muted, paper→primary, live→up green, paused→warning amber, archived→muted; label is the raw lowercase status), timeframe badge (muted), universe badge (muted). |
| 10 | **Row backtest one-liner** | Only when last_backtest exists: mt-1 truncate font-mono 12px muted, e.g. "Last backtest · Sharpe 1.42 · Win 58% · Return +12.30%" — sharpe 2dp, win rate ×100 at 0dp, return 2dp with an explicit + for non-negative. |
| 11 | **Row action cluster** | flex-wrap gap-1.5 of size-sm Buttons, rendered conditionally by status: draft → primary "Promote to paper"; paper → secondary "Pause"; live → secondary "Pause"; paused → primary "Resume"; any non-archived → ghost "Archive". All disable together while a transition is in flight. |
| 12 | **Archive confirmation** | Native window.confirm with the literal string: Archive "{name}"? You can still see it but it won't trade. On success a toast "Strategy archived" and the list refetches. |
| 13 | **Transition feedback** | Sonner toasts: success `Strategy moved to {status}`; failures "Transition failed" / "Archive failed" with the API message as the description. |
| 14 | **DisclaimerFooter** | Standard variant at the bottom of the page body (outside the tab panel): "For educational purposes. Not investment advice. Markets carry risk." |

**Components** — `PageHeader — components/foundation/PageHeader.tsx` · `Tabs — components/foundation/Tabs.tsx` · `Card/CardHeader/CardBody — components/foundation/Card.tsx` · `Badge — components/foundation/Badge.tsx` · `Button — components/foundation/Button.tsx` · `EmptyState — components/foundation/EmptyState.tsx` · `Skeleton — components/foundation/Skeleton.tsx` · `toast — components/foundation/Toast.tsx` · `DisclaimerFooter — components/foundation/DisclaimerFooter.tsx` · `StrategyCompareCard — components/strategies/StrategyCompareCard.tsx` · `dispatchCopilotOpen — components/copilot/CopilotProvider.tsx`

**States & data.** api.strategies.list() → GET /api/strategies on mount and after every successful transition/archive (full refetch, not optimistic). api.strategies.transition(id, to) → POST /api/strategies/{id}/transition. api.strategies.archive(id) → DELETE /api/strategies/{id}. Compare card calls api.strategies.compare(ids) → POST /api/strategies/compare returning per-strategy OOS metrics, a winners map and best_overall. Loading = 3×80px skeletons; error = retryable EmptyState; empty = 'Nothing built yet'. No polling.

**Interactions.** Row identity block is a keyboard-focusable button → /strategies/mine/{id}. Status buttons mutate lifecycle inline and disable the whole cluster while busy. Archive goes through a blocking native confirm. Compare chips toggle multi-select with a hard cap of 6 and a floor of 2 before the Compare button enables; results render inline below, and re-running replaces them. Toasts are the only success feedback for transitions.

**Responsive.** Single-column stacked list at every breakpoint — no grid. Each row card uses flex-wrap so the action cluster drops beneath the name/badges block on narrow screens; badges themselves wrap. The compare result table is wrapped in overflow-x-auto and scrolls horizontally rather than shrinking columns. PageHeader stacks below md.

**Key copy.** • Empty title: "Nothing built yet"
• Empty body: "Grab a tested template from the Library, or describe one in plain English and let the AI compile and gate it in the Builder."
• Empty CTA: "Ask Copilot for a pick"
• Error: "Your strategies wouldn't load"
• Row prefix: "Last backtest · Sharpe … · Win …% · Return …%"
• Buttons: "Promote to paper" / "Pause" / "Resume" / "Archive"
• Confirm: Archive "{name}"? You can still see it but it won't trade.
• Toasts: "Strategy moved to paper" / "Strategy archived" / "Transition failed" / "Archive failed"
• Compare: "Compare strategies" / "Pick 2–6 to compare head-to-head on out-of-sample metrics." / rows "OOS Sharpe", "Consistency", "Holdout return", "Worst drawdown", "OOS trades", "Live-gate" / "Pass" / "Not yet"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark web dashboard panel listing a trader's own saved algorithmic strategies, inside a 240px-sidebar app shell, content max 1440px. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent fill #406AE4, P&L green #10B981, red #F5808C, amber #F0A94F. Reuse the page header (mono 11px eyebrow "BUILD · BACKTEST · GATE", 40px title "AI Algos") and the fully-rounded 5-tab pill rail with "My strategies" active. First card: "Compare strategies" with a compare glyph, 12px muted line "Pick 2–6 to compare head-to-head on out-of-sample metrics.", a row of selectable name pills (two filled solid #406AE4 with white ink), a small "Compare 2" button, and a 12px comparison table with rows OOS Sharpe / Consistency / Holdout return / Worst drawdown / OOS trades / Live-gate, winning cells in green, a small trophy beside the winning column head. Below, a vertical stack of 12px-radius elevated row cards, each 16px apart: strategy name in medium weight followed by three small full-radius chips — status ("live" green tint, "paper" blue tint, "paused" amber tint), timeframe "1d", universe "NIFTY50" — then a mono 12px muted line "Last backtest · Sharpe 1.42 · Win 58% · Return +12.30%". Right side of each row: small buttons "Pause" and ghost "Archive". Sample names: "NIFTY 50 EMA Pullback", "HDFCBANK RSI Reversion", "TCS Trend Rider". Centered 10px muted disclaimer at the bottom.
```
</details>

---

## `/strategies` — AI Algos — Builder tab, compose state (NL → DSL)

**File** `app/(platform)/strategies/page.tsx` · **831 LOC** · **Access** authed. Compiling calls the Studio LLM endpoint — the only token-spending action on the screen. Vision draft upload also hits an LLM vision endpoint.

**Shell** — (platform) AppShell; same PageHeader + 5-tab pill rail, Builder tab active. This is the pre-compile state (phase = idle | compiling).

**Purpose.** The natural-language strategy composer. The user describes a strategy in plain English (or uploads a chart screenshot to have one drafted for them), the Studio agent compiles it into the platform DSL, and the screen flips to the preview/backtest state. If the description is under-specified the agent asks one clarifying question inline rather than guessing.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Composer eyebrow** | EyebrowMono (font-sans 12px semibold uppercase tracking-[0.12em] muted) with a leading Wand2 14px in AI ink: "Describe it · AI compiles your entry and exit logic". |
| 2 | **NL composer shell** | rounded-lg 16px, bg-wrap, p-1, 1px border in AI ink at 28% opacity (color-mix), transitioning to ai/60 on focus-within. This is the one 16px-radius hero surface on the tab. |
| 3 | **Prompt textarea** | rows=5, w-full resize-none rounded-md bg-transparent p-3 14px primary ink, no outline, muted placeholder: "e.g. Buy Nifty 50 stocks when 20EMA crosses above 50EMA and RSI is between 50 and 70. Exit when 20EMA crosses back below 50EMA, or stop-loss at -3%." aria-label "Strategy description"; disabled while compiling. |
| 4 | **Composer footer row** | flex-wrap justify-between px-2 pb-2 pt-1. Left: 11px muted "The Studio agent turns your words into a DSL. Walk-forward backtest it, clear the gate, then deploy." Right: a solid accent pill button — glass-control-accent (#406AE4, white ink), h-9, rounded-full, px-4, 13px semibold, active:scale-0.97, disabled at 50% opacity — labelled "Compile to DSL" with a trailing ArrowRight 14px; swaps to "Compiling…" while in flight. |
| 5 | **Compile error banner** | mt-3 rounded-sm 8px, border-down/40, bg-down/10, px-3 py-2, 12px text-down. Renders the raw handleApiError string. |
| 6 | **Clarification card** | Shown when the compile returns needs_clarification. mt-3 rounded-lg 16px bg-wrap, 1px border in AI ink at 34%. Contents in order: the agent's question at 14px primary; a wrap of 'missing field' chips (rounded-full, 1px border-line, px-2 py-0.5, 11px capitalize, secondary ink); an assumptions line at 11px muted reading "If you don’t say, I’ll assume: {a} · {b}"; a 3-row textarea with placeholder "Add the missing details…" (rounded-md, border-line, focus:border-ai/60); and a right-aligned accent pill "Refine & compile" with ArrowRight. Answering appends " — {answer}" to the original prompt and recompiles. |
| 7 | **Example prompts section** | EyebrowMono "Hand the AI a starting point" then a vertical stack (flex-col gap-2) of exactly 3 full-width neutral chips: glass-control (L2 fill + hairline), rounded-sm 8px, px-3 py-2.5, text-left, 12px secondary ink, hover → primary ink. Clicking one replaces the textarea contents verbatim. |
| 8 | **Example prompt 1** | "Buy Nifty 50 stocks when 20EMA crosses above 50EMA and RSI is between 50 and 70. Exit when 20EMA crosses below 50EMA. Stop loss 3%." |
| 9 | **Example prompt 2** | "Mean-reversion: buy when RSI(14) drops under 28 in a bull regime. Exit when RSI crosses back above 50. Stop loss 4%." |
| 10 | **Example prompt 3** | "Trend-pullback: enter when price closes above 50EMA and pulls back to 20EMA, in any non-bear regime. Trail 5%." |
| 11 | **Vision section eyebrow** | EyebrowMono "Or read a chart screenshot". |
| 12 | **VisionUpload shell** | rounded-lg 16px, 1px border-line, bg-wrap, p-4. Top row flex-col → sm:flex-row items-end gap-3. |
| 13 | **Vision inputs** | Left flex-1 label: 11px muted "Symbol" over a bare input (rounded-sm, border-line, bg-transparent, px-3 py-2, 14px) placeholder "RELIANCE", auto-uppercasing on type. Right sm:w-36 label: 11px muted "Timeframe" over a native select with 6 options — "Daily", "1 hour", "30 min", "15 min", "5 min", "1 min" (values 1d/1h/30m/15m/5m/1m). |
| 14 | **Vision file row** | mt-3 flex-wrap gap-2: a hidden file input (accept image/*) fronted by a neutral pill "Choose chart image" with a ScanLine 14px glyph; the chosen filename truncated at 14rem in 11px muted; and an ml-auto accent pill h-9 rounded-full px-4 13px semibold "Read chart" + ArrowRight, which becomes a spinning Loader2 + "Reading…". Disabled until both a file and a non-empty symbol exist. |
| 15 | **Vision error / result** | Error: mt-3 rounded-sm border-down/40 bg-down/10 px-3 py-2 with AlertTriangle 14px and 12px down-tinted text. Success renders the shared AnalysisView — trend chip, pattern chip, volume chip, a right-aligned "conf N", a tinted "Setup" banner, a 2-col Support/Resistance level grid, and a "Read" narrative box — then either 11px muted "We filled in a starting prompt above from this read — review and edit it, then hit Compile to DSL." or, when the read is bearish/no-edge, an honest note box with AlertTriangle. It never auto-compiles. |

**Components** — `EyebrowMono — components/foundation/EyebrowMono.tsx` · `Tabs — components/foundation/Tabs.tsx` · `toast — components/foundation/Toast.tsx` · `VisionUpload — components/strategies/VisionUpload.tsx` · `AnalysisView — components/stock/ChartVisionCard.tsx` · `PageHeader — components/foundation/PageHeader.tsx` · `DisclaimerFooter — components/foundation/DisclaimerFooter.tsx`

**States & data.** Local phase machine: idle → compiling → preview (see next screen). api.strategies.studioCompile(prompt, saveAsDraft=true) → POST /api/strategies/studio/compile; a needs_clarification response drops back to idle and renders the clarify card instead of a DSL. A successful compile with a save_error fires toast.warning 'Compiled but could not save'. Sub-3-character prompts short-circuit with toast.error 'Describe the strategy in at least a few words.' VisionUpload base64-encodes the file client-side and posts api.strategies.studioVisionDraft(b64, {mime, symbol, timeframe, compile:false}); a null prompt in the response means the read was bearish/unreadable and only the note is shown. No skeletons on this state — the compile button itself carries the pending label.

**Interactions.** Type-to-compose; click an example chip to overwrite the textarea; Compile button disabled while empty or compiling. Clarify flow: answer textarea + 'Refine & compile' merges the answer into the prompt and re-fires the compile. Vision: file picker opens on pill click, symbol auto-uppercases, 'Read chart' fills the composer textarea above and clears any pending clarification. All errors are inline banners plus (for compile guardrails) toasts.

**Responsive.** Composer and vision card are full-width single-column at all sizes. VisionUpload's symbol/timeframe row is stacked below sm and becomes a row with a fixed 144px timeframe column at sm+. Example prompt chips are always full-width stacked. The accent pill buttons keep h-9/36px touch height. PageHeader stacks below md; body gutters px-4 → md:px-6 → xl:px-8.

**Key copy.** • "Describe it · AI compiles your entry and exit logic"
• Placeholder: "e.g. Buy Nifty 50 stocks when 20EMA crosses above 50EMA and RSI is between 50 and 70. Exit when 20EMA crosses back below 50EMA, or stop-loss at -3%."
• "The Studio agent turns your words into a DSL. Walk-forward backtest it, clear the gate, then deploy."
• Buttons: "Compile to DSL" / "Compiling…" / "Refine & compile"
• "If you don’t say, I’ll assume: …" / "Add the missing details…"
• "Hand the AI a starting point"
• "Or read a chart screenshot" / "Choose chart image" / "Read chart" / "Reading…"
• "We filled in a starting prompt above from this read — review and edit it, then hit Compile to DSL."
• Toasts: "Describe the strategy in at least a few words." / "Compiled but could not save"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark AI composer panel for an Indian stock-trading web app, inside a 240px-sidebar shell, content max 1440px. Canvas #0D0D0E, panels #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent fill #406AE4 with white ink, AI accent text #8FB0FF. Keep the page header (mono 11px eyebrow "BUILD · BACKTEST · GATE", 40px title "AI Algos") and the rounded 5-tab pill rail with "Builder" active. Hero: a 16px-radius panel with a 1px translucent blue-violet border and a wand glyph label above it in 12px semibold uppercase tracked caps: "DESCRIBE IT · AI COMPILES YOUR ENTRY AND EXIT LOGIC". Inside, a borderless 5-row textarea with muted placeholder "e.g. Buy Nifty 50 stocks when 20EMA crosses above 50EMA and RSI is between 50 and 70…", and a footer row: left 11px muted helper "The Studio agent turns your words into a DSL. Walk-forward backtest it, clear the gate, then deploy.", right a 36px-tall fully-rounded solid #406AE4 button "Compile to DSL →". Below: tracked-caps label "HAND THE AI A STARTING POINT" and three stacked full-width 8px-radius neutral chips containing example sentences about EMA crossovers, RSI mean-reversion on RELIANCE, and trend pullbacks. Below that: "OR READ A CHART SCREENSHOT" and a 16px-radius card with a "Symbol" text field prefilled RELIANCE, a 144px "Timeframe" dropdown set to Daily, a neutral pill "Choose chart image" with a scan glyph, and a right-aligned solid blue pill "Read chart →". Centered 10px muted compliance line at the bottom.
```
</details>

---

## `/strategies` — AI Algos — Builder tab, compiled state (DSL preview → backtest → results)

**File** `app/(platform)/strategies/page.tsx` · **831 LOC** · **Access** authed. Deploy-to-live is gated server-side by the out-of-sample backtest gate (422 gate_failed is surfaced verbatim); paper deploy is ungated.

**Shell** — (platform) AppShell; same PageHeader + tab rail. This is phase = preview | backtesting | backtested — it fully replaces the composer, which is only reachable again via 'Start over'.

**Purpose.** The validate-in-place surface. After compiling, the user reads the strategy back in plain English, sets the walk-forward backtest parameters, saves a draft, runs the backtest, checks the promotion gate, optionally inspects an options payoff and a margin estimate, and deploys to paper or live — all without leaving the tab.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **DSLPreview card — title row** | Card 12px radius, CardBody space-y-5 p-5. Header row flex-wrap justify-between: h3 17px/600 leading-tight primary (the compiled strategy name, title attr = full) and a right cluster of badges — segment ("Options" or "Equity", muted), timeframe (muted), universe label (muted; sector:IT renders as "IT", single as "single", else uppercased), and a warning-tone regime badge ("Bull only" / "Bear only" / "Sideways only") only when regime_filter ≠ any. |
| 2 | **DSLPreview — plain-English rules** | space-y-3 with two rule lines. Each: a 12px-tall pill (rounded-full px-2.5 py-1 11px semibold) with an ArrowRight 12px — entry pill is up-tinted (bg-up/10, green ink) labelled "Buy", exit pill is down-tinted labelled "Sell" — beside a 15px leading-relaxed sentence starting with the word "when", e.g. "when the 20-day EMA crosses above the 50-day EMA and RSI (14) is between 50 and 70". The entry line appends " · RELIANCE" in muted ink when the DSL pins a symbol; both end in a muted full stop. |
| 3 | **DSLPreview — risk & sizing strip** | border-t border-line pt-4, flex-wrap gap-x-6 gap-y-2. Each item: 10px uppercase tracking-wider muted label over a 14px semibold tabular-nums value. Items in order, conditional: "Stop loss" (down/red), "Target" (up/green), "Trailing" (warning/amber), always "Position" ("5% of capital" / "100 shares" / "2% risk") and "History" ("180 days"). |
| 4 | **DSLPreview — Advanced disclosure** | border-t border-line pt-3 with an 11px muted toggle button carrying a Chevron (right→down) and a Code2 glyph: "Advanced — view the raw rule definition". Expanded, it reveals a <pre> at max-h-360px overflow-auto, rounded-xs 6px, border-line, bg-main (page canvas — darker than the card), p-3, font-mono 11px leading-relaxed secondary, containing JSON.stringify(dsl, null, 2). |
| 5 | **Backtest config card** | Card 12px radius. CardHeader 16px/600: "Set up the walk-forward backtest". CardBody space-y-4. |
| 6 | **Config grid** | grid-cols-1 md:grid-cols-3 gap-4. Each field: an EyebrowMono label (12px semibold uppercase tracked 0.12em muted) over a control. "Symbol" → Input (h-9, rounded-sm, bg-wrap-hover, border-line, 14px), default "RELIANCE" or the DSL symbol. "Lookback (days)" → NumericInput default 180, min 30, max 730, step 30. "Initial capital (₹)" → NumericInput default 500000, min 10,000, max 100,000,000, step 50,000. |
| 7 | **Backtest error banner** | rounded-sm 8px, border-down/40, bg-down/10, px-3 py-2, 12px down-tinted — the raw API error from the backtest call. |
| 8 | **StrategyActionRow — row 1** | space-y-3 border-t border-line pt-4. Left: a Segmented control (rounded-full, border-line, bg-wrap, p-0.5) with two options "Paper" and "Live", Paper default; the active pill is a solid #406AE4 fill with white ink that slides between options via a framer-motion layoutId spring (stiffness 400, damping 34) and swaps instantly under reduced motion. Right: the gate badge. |
| 9 | **Gate badge states** | No backtest yet → 11px muted text "Run a backtest to check the gate". In flight → "Checking the gate…". Passed → Badge tone up with a ShieldCheck 14px: "Gate pass". Failed → a clickable Badge tone down with AlertTriangle: "Needs work", opening a 288px Popover (bottom/end) headed 11px uppercase muted "Gate — not cleared yet" listing each failure as a 12px bulleted line, or the fallback "Run a fresh walk-forward backtest to generate an out-of-sample result." |
| 10 | **StrategyActionRow — row 2 (actions)** | flex-wrap gap-1.5 of size-sm buttons, left to right: "Save as draft" (primary, Save 14px — only while no draft exists); "Run backtest"/"Running…" (secondary, PlayCircle, disabled without a draft); then either a secondary "Payoff" (LineChart) for options strategies with legs, or a static non-interactive pill (h-8, rounded-full, border-line, px-3, 12px muted, LineChart glyph) reading "Equity — no option payoff" with the tooltip "Payoff diagrams apply to options strategies only"; "Margin" (secondary, Coins) with a trailing 10px uppercase tracked "est."; the deploy button (primary, Zap) labelled "Deploy to paper" / "Deploy live" / "Deploying…"; and an ml-auto ghost "Start over" with RotateCcw. |
| 11 | **Margin popover** | 288px wide, p-3, opens top/start. 11px uppercase tracking-wider muted "Capital per trade · estimate"; an 18px mono tabular-nums rupee figure in Indian grouping (₹25,000) or an em dash; a 12px secondary basis line like "5% of ₹5,00,000 capital" or "100 units per trade"; then an 11px muted caveat — the default "Rough client-side estimate from your position sizing — real margin depends on live prices.", replaced for options by "Options margin also depends on live premiums (Σ premium × lot) and SPAN — this is a sizing estimate only." |
| 12 | **Payoff dialog** | Foundation Dialog capped at max-w-lg, title "Payoff at expiry". Body is PayoffDiagram with label "Schematic payoff (illustrative strikes)" against a nominal spot of 100 and lotSize 1 (strikes derived from ATM/ITM/OTM anchors at 5 units per offset; premia estimated). Closes with an 11px muted note: "Illustrative shape only — strikes and premia are estimated around a nominal spot because the Builder has no live option chain. Deploy to paper to see real fills." |
| 13 | **PayoffDiagram internals** | glass-card p-5. 14px semibold heading with a 16px inline trending-arrow SVG in accent ink. Badge row: up-tinted "Max Profit: ₹…", down-tinted "Max Loss: ₹…", and one neutral "BE: …" pill per breakeven (10px, rounded-full). Chart is a fixed 240px-tall Recharts AreaChart of P&L vs price with monotone stroke and a 0.25→0 vertical gradient fill, a dashed zero ReferenceLine, a dashed teal 'Spot' ReferenceLine, one faint dashed line per strike, dashed CartesianGrid, 10px axis ticks, X ticks Indian-grouped and Y ticks formatted ₹1.2K. Footer: one 10px pill per leg, e.g. "BUY 100 CE @ ₹3.5 ×2", green for BUY and red for SELL. |
| 14 | **Live-deploy dialog (Builder)** | Foundation Dialog titled "Deploy live?". 13px secondary body: "This will place real orders on your connected broker account when the strategy triggers. It must clear the out-of-sample backtest gate first." On a 422 gate_failed the server message is rendered verbatim in a rounded-sm down-tinted block with an AlertTriangle and a bulleted failure list. Footer right: ghost "Cancel" and primary "Confirm live deploy" / "Deploying…" with a Zap glyph. |
| 15 | **Save-first hint** | When a DSL is compiled but no draft row exists: 11px muted "Save the draft first. The backtest needs a strategy ID to log results against." |
| 16 | **BacktestViewer** | Appended below the config card once a result exists — the full hero + KPI strip + equity curve + trade log stack described on the /strategies/mine/[id] screen (identical component). |

**Components** — `DSLPreview — components/strategies/DSLPreview.tsx` · `StrategyActionRow — components/strategies/StrategyActionRow.tsx` · `BacktestViewer — components/strategies/BacktestViewer.tsx` · `PayoffDiagram — components/strategy/PayoffDiagram.tsx` · `Segmented — components/foundation/Segmented.tsx` · `Popover — components/foundation/Popover.tsx` · `Dialog — components/foundation/Dialog.tsx` · `Badge — components/foundation/Badge.tsx` · `Button — components/foundation/Button.tsx` · `Input — components/foundation/Input.tsx` · `NumericInput — components/foundation/NumericInput.tsx` · `Card/CardHeader/CardBody — components/foundation/Card.tsx` · `EyebrowMono — components/foundation/EyebrowMono.tsx` · `toast — components/foundation/Toast.tsx` · `conditionToClause — lib/dsl-plain.ts` · `labelUniverse/humanRegime — lib/dsl.ts`

**States & data.** Phase drives the whole layout: preview (DSL + form, no results), backtesting (Run button shows 'Running…'), backtested (BacktestViewer mounted). api.strategies.create({dsl, name, source:'studio'}) saves the draft when the compile did not; api.strategies.backtest(id, {symbol, lookback_days, initial_capital}) → POST /api/strategies/{id}/backtest; api.strategies.gate(id) → GET /api/strategies/{id}/gate re-fires on every new btResult and clears when either the draft or the result is missing; api.strategies.transition(id,'paper'|'live') deploys. Errors: compile/backtest render inline banners; deploy failures toast except a 422 gate_failed, which renders inside the live dialog. Toasts: 'Saved as draft', 'Deployed to paper' (description '{name} is now paper-trading on your account.'), 'Deployed live' ('… now trading live on your broker account.').

**Interactions.** Advanced disclosure toggles the raw DSL JSON block. Paper/Live segmented toggle re-labels the deploy button and routes it to either an immediate paper transition or the confirmation dialog. Payoff opens a modal chart (options only). Margin opens a hover/click popover. Failing gate badge is itself a popover trigger listing the exact failures. 'Start over' resets every piece of builder state back to an empty composer. Backtest button is disabled until a draft id exists.

**Responsive.** Backtest config grid collapses 3 → 1 column below md. The action row wraps freely; 'Start over' keeps its ml-auto so it can end up alone on the second line. DSLPreview's badge cluster and risk strip both wrap. Dialogs are centered fixed modals at w-full max-w-md (payoff max-w-lg) with 16px page padding, so they read as near-full-width sheets on phones. The raw-DSL <pre> scrolls in both axes inside its 360px cap.

**Key copy.** • Card header: "Set up the walk-forward backtest"
• Field labels: "Symbol" / "Lookback (days)" / "Initial capital (₹)"
• "Advanced — view the raw rule definition"
• Risk labels: "Stop loss" / "Target" / "Trailing" / "Position" / "History"
• Gate: "Run a backtest to check the gate" / "Checking the gate…" / "Gate pass" / "Needs work" / "Gate — not cleared yet" / "Run a fresh walk-forward backtest to generate an out-of-sample result."
• Actions: "Save as draft" / "Run backtest" / "Payoff" / "Equity — no option payoff" / "Margin est." / "Deploy to paper" / "Deploy live" / "Start over"
• "Capital per trade · estimate" / "Rough client-side estimate from your position sizing — real margin depends on live prices."
• "Payoff at expiry" / "Illustrative shape only — strikes and premia are estimated around a nominal spot because the Builder has no live option chain. Deploy to paper to see real fills."
• "Deploy live?" / "This will place real orders on your connected broker account when the strategy triggers. It must clear the out-of-sample backtest gate first." / "Confirm live deploy"
• "Save the draft first. The backtest needs a strategy ID to log results against."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark strategy-validation screen for an Indian trading web app, 1440px content width inside a 240px-sidebar shell. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent #406AE4 (white ink), green #10B981, red #F5808C, amber #F0A94F. Card radius 12px, buttons/inputs 8px, chips fully rounded. First card: strategy title "NIFTY 50 EMA Pullback" at 17px/600 with small grey chips "Equity", "1d", "NIFTY50" and an amber chip "Bull only"; below, two rule lines — a green fully-rounded "→ Buy" pill beside 15px text "when the 20-day EMA crosses above the 50-day EMA and RSI (14) is between 50 and 70 · RELIANCE." and a red "→ Sell" pill beside "when the 20-day EMA crosses below the 50-day EMA."; then a hairline-topped stat strip with 10px uppercase labels Stop loss 3% (red), Target 6% (green), Position 5% of capital, History 180 days; then a muted 11px disclosure link "Advanced — view the raw rule definition". Second card headed "Set up the walk-forward backtest": three fields in a row — Symbol RELIANCE, Lookback (days) 180, Initial capital (₹) 5,00,000. Beneath a hairline: a small fully-rounded two-segment toggle Paper|Live with Paper filled solid blue, and on the right a green "Gate pass" chip with a shield glyph. Then a wrapping button row: "Run backtest", "Equity — no option payoff" (disabled outline), "Margin est.", solid blue "Deploy to paper", and a far-right ghost "Start over".
```
</details>

---

## `/strategies` — AI Algos — Discovered tab, run list + new-run modal

**File** `app/(platform)/strategies/page.tsx` · **831 LOC** · **Access** authed. Discovery runs are per-user; promotion writes into the caller's user_strategies table.

**Shell** — (platform) AppShell; same PageHeader + tab rail, Discovered active. The tab renders components/strategies/DiscoveredTab.tsx (856 lines) inside the tab panel.

**Purpose.** The strategy-discovery engine console. The user starts batch runs that randomly sample (or genetically evolve) DSL strategies, backtest them across a basket of NSE symbols and rank the survivors. This screen lists recent batches with live status and best score, and hosts the configuration modal for launching a new one.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Section header strip** | flex-wrap justify-between gap-2. Left: h2 16px semibold primary with a leading Brain glyph 16px in accent ink — "Strategy Discovery" — over a 12px muted paragraph: "AI samples new strategies from the DSL space, backtests them across a basket of symbols, and ranks the survivors. Promote winners straight to your library." |
| 2 | **Header actions** | Right cluster gap-2: a ghost size-sm icon button with RefreshCw 14px (spins while fetching, aria-label "Refresh"), and a primary size-sm Button with a Plus 14px: "New discovery run". |
| 3 | **Loading state** | space-y-2 with exactly 3 full-width Skeletons at 72px height. |
| 4 | **Error state** | EmptyState tone error with AlertTriangle 24px: "Could not load discovery runs" + the API error + Button "Retry" (SWR mutate). |
| 5 | **Empty state** | EmptyState with Sparkles 28px: "No discovery runs yet" / "Start a new run to have the engine sample, backtest, and rank new strategies for equity or F&O." / primary Button with Plus: "Start one". |
| 6 | **Run row card** | Card 12px radius; CardBody flex-wrap items-center justify-between gap-3. Left is a focusable button (min-w-0 flex-1, focus ring primary/40) opening the run detail. |
| 7 | **Run row identity** | First line: a status Badge — pending muted, running warning/amber (both prefixed with a spinning Loader2 12px), completed up/green, failed down/red, cancelled muted, label is the raw status string — followed by the kind label in font-medium primary, truncated. |
| 8 | **Run row metrics line** | mt-1 truncate font-mono 12px muted, concatenated conditionally: "{viable}/{total} viable" then " · best score 1.34" (2dp) then " · 42.7s" (elapsed between started_at and completed_at, 1dp) then " · {first 60 chars of error}". |
| 9 | **Run row action** | Right: ghost size-sm Button labelled "View candidates →" (literal arrow in the label). |
| 10 | **New-run modal shell** | NOT the foundation Dialog — a hand-rolled overlay: fixed inset-0 z-50, bg-black/70, p-4, centered; panel w-full max-w-md, rounded-sm 8px, border-line, bg-main (page canvas), shadow-xl. |
| 11 | **Modal header** | border-b border-line px-4 py-3, flex justify-between: h3 14px semibold with a Sparkles 16px accent glyph — "New discovery run" — and a bare X 16px close button in muted ink. |
| 12 | **Strategy-type picker** | Label 10px semibold uppercase tracking-wider muted "Strategy type" over a single-column stack of 6 option buttons (rounded-xs 6px, px-3 py-2, 12px, left-aligned, selected = solid accent glass-control-accent with a trailing CheckCircle2 14px). Labels verbatim: "Equity · Swing (5–20 day hold)", "Equity · Position (20–90 day hold)", "F&O · Weekly contracts", "F&O · Monthly contracts", "Intraday · 5-minute bars", "Intraday · 15-minute bars". |
| 13 | **Universe picker** | Label switches between "Universe tier" and "Underlying" (for F&O kinds). Wrapping chips rounded-xs 6px px-2.5 py-1 12px: equity → nifty50 / nifty100 / nifty500; F&O → NIFTY / BANKNIFTY / FINNIFTY; intraday → nifty50 / nifty100. Selection auto-corrects when the kind changes. |
| 14 | **Search-mode picker** | Label "Search mode" over a 2-col grid of option cards (rounded-xs, px-3 py-2, left-aligned): "Random" with 10px muted sub "N independent draws — fast + broad", and "Genetic (GA)" with "Survivors breed mutated children — focused". Selected card takes the solid accent fill. |
| 15 | **Sizing controls** | Random mode → 2-col NumericInputs "Sample size (5–60)" (default 20, step 5, clamped 5–60) and "Seed" (default 42, 0–999999). GA mode → a 2×2 grid: "Pop size (4–30)" 12, "Generations (1–6)" 3, "Elite survivors" 4 (max = popSize−1), "Children / elite" 2 (1–5). |
| 16 | **Secondary controls row** | 2-col grid: "Symbols / candidate" NumericInput default 6, clamped 1–20 (hidden entirely for F&O kinds); "Walk-forward folds" as four equal-width segment buttons rounded-xs px-2 py-1.5 12px labelled "Off", "2-fold", "3-fold", "5-fold" (values 0/2/3/5, default Off); plus a "Seed" NumericInput appended in GA mode. |
| 17 | **Cost/time estimate paragraph** | rounded-xs 6px, border-line, bg-wrap, p-2.5, 11px muted. Random: "Random sample: 20 candidates × 6 symbols." GA: "GA: 12 candidates × 3 generations = 36 total scorings. Top 4 survive each gen → 2 mutated children each." Appends " Walk-forward enabled (3 folds)." when folds > 1, then always " Typical wall time: 18–48s." (computed from candidates × symbols × 0.15/0.4, or 0.25/0.6 with walk-forward). |
| 18 | **Modal footer** | border-t border-line px-4 py-3, right-aligned: ghost "Cancel" and primary "Start run" with a Play 14px glyph that becomes a spinning Loader2 while posting. On success the modal closes, the list revalidates and the app navigates straight into that run's detail view. |

**Components** — `DiscoveredTab — components/strategies/DiscoveredTab.tsx` · `Card/CardHeader/CardBody — components/foundation/Card.tsx` · `Badge — components/foundation/Badge.tsx` · `Button — components/foundation/Button.tsx` · `NumericInput — components/foundation/NumericInput.tsx` · `EmptyState — components/foundation/EmptyState.tsx` · `Skeleton — components/foundation/Skeleton.tsx` · `toast — components/foundation/Toast.tsx`

**States & data.** SWR key 'discovery:runs' → api.discovery.listRuns({limit: 30}) with refreshInterval 5000ms, revalidateOnFocus false, keepPreviousData true — so running batches tick live without a manual refresh. api.discovery.createRun({kind, mode, universe, sample_size, symbols_per_candidate, seed, ga_pop_size, ga_generations, ga_elite, ga_children_per_elite, walk_forward_folds}) starts a batch and returns run_id. Toasts: success 'Discovery run started' with description '{Random|GA} · {n} candidates × {m} symbols'; failure 'Failed to start run'. Loading/empty/error states as described above.

**Interactions.** Whole run row (and the trailing 'View candidates →' button) drills into the run-detail view, which replaces this list in place — it is not a separate route, so browser back does not return to the list. Manual refresh button. The new-run modal is a custom overlay (click-outside does not close it; only the X and Cancel do); every control mutates local state and the summary paragraph recomputes live, including the wall-time estimate. Universe options and the symbols-per-candidate field appear/disappear based on the selected kind.

**Responsive.** Run rows are a single stacked column with flex-wrap so the 'View candidates →' button drops below the identity block on narrow screens. The modal is max-w-md with 16px page padding, so it is effectively full-width on phones; its internal 2-col grids stay 2-col at all sizes (they are inside a 448px panel). The 6 strategy-type options are always a single column.

**Key copy.** • "Strategy Discovery"
• "AI samples new strategies from the DSL space, backtests them across a basket of symbols, and ranks the survivors. Promote winners straight to your library."
• "New discovery run" / "Start one" / "Start run" / "Cancel"
• Empty: "No discovery runs yet" / "Start a new run to have the engine sample, backtest, and rank new strategies for equity or F&O."
• Error: "Could not load discovery runs"
• Row: "12/20 viable · best score 1.34 · 42.7s" / "View candidates →"
• Kinds: "Equity · Swing (5–20 day hold)", "Equity · Position (20–90 day hold)", "F&O · Weekly contracts", "F&O · Monthly contracts", "Intraday · 5-minute bars", "Intraday · 15-minute bars"
• "Search mode" / "Random" — "N independent draws — fast + broad" / "Genetic (GA)" — "Survivors breed mutated children — focused"
• "Walk-forward folds": Off / 2-fold / 3-fold / 5-fold
• "Typical wall time: 18–48s."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark ML-experiment console panel for an Indian stock-trading web app, inside a 240px-sidebar shell, content max 1440px. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent #406AE4, green #10B981, amber #F0A94F, red #F5808C. Keep the page header ("AI Algos", 40px) and the rounded 5-tab pill rail with "Discovered" active. Section header: a brain glyph plus 16px/600 "Strategy Discovery" over a 12px muted paragraph about sampling and ranking strategies; right side a ghost refresh icon and a solid blue "+ New discovery run" button. Below, a stack of 12px-radius run rows, 8px apart. Each row: a small fully-rounded status chip — amber "running" with a spinner, green "completed", grey "pending" — then the run type in medium weight ("Equity · Swing (5–20 day hold)", "F&O · Weekly contracts"), then a mono 12px muted line "12/20 viable · best score 1.34 · 42.7s"; far right a ghost link "View candidates →". Overlay a centred 448px-wide modal on a 70% black scrim: 8px radius, page-dark fill, hairline border. Header "New discovery run" with a sparkle glyph and an X. Body: tracked-caps label "STRATEGY TYPE" over six stacked 6px-radius option rows (first one filled solid blue with a check); "UNIVERSE TIER" chips nifty50 / nifty100 / nifty500; "SEARCH MODE" as two option cards Random and Genetic (GA) with 10px descriptions; two numeric fields Sample size 20 and Seed 42; a "WALK-FORWARD FOLDS" four-button segment Off / 2-fold / 3-fold / 5-fold; and a muted 11px estimate box "Random sample: 20 candidates × 6 symbols. Typical wall time: 18–48s." Footer: ghost Cancel, solid blue "Start run".
```
</details>

---

## `/strategies` — AI Algos — Discovered tab, run detail (ranked candidates)

**File** `app/(platform)/strategies/page.tsx` · **831 LOC** · **Access** authed. 'Promote · Live' writes a live-mode user strategy directly from the candidate DSL.

**Shell** — (platform) AppShell; same PageHeader + tab rail, Discovered active. This view replaces the run list in place — no URL change, so it is a nested view rather than a route.

**Purpose.** The ranked output of one discovery batch. The user reads the top-K sampled strategies, judges each on its score and six risk/return metrics, checks whether its edge is concentrated in a single market regime, and promotes the winners into their own library as paper or live strategies — or archives the rest.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Detail header strip** | flex-wrap justify-between gap-2. Left column: a bare 12px muted back button "← Back to runs" (mb-1), then h2 16px semibold primary with the run's kind label (e.g. "Equity · Swing (5–20 day hold)"), then mono 11px muted "run 3f9ac2b1 · status completed" (run id truncated to 8 chars). Right: ghost size-sm RefreshCw 14px that spins while loading and revalidates both the run row and the candidate list. |
| 2 | **Loading state** | space-y-2 with exactly 4 full-width Skeletons at 90px height. |
| 3 | **Error state** | EmptyState tone error, AlertTriangle 24px: "Could not load candidates" + the API error + Button "Retry". |
| 4 | **Empty — still running** | EmptyState, Sparkles 28px: "Run still in progress" / "Backtests are running. Candidates appear as the run finishes — usually within 30-90s." No action. |
| 5 | **Empty — finished with nothing** | EmptyState, Sparkles 28px: "No candidates yet" / "This run completed without producing any usable candidates. Try a larger sample size or a different universe." |
| 6 | **Candidate card shell** | Card 12px radius, CardBody space-y-3. Stacked list with 8px gaps. |
| 7 | **Candidate badge row** | flex-wrap gap-2. Score badge always first, label "score 0.78" (2dp) with tone by threshold — up/green at ≥0.50, warning/amber at 0–0.49, down/red below 0. Then conditionally: a primary badge "promoted" with CheckCircle2 12px; a muted badge "archived"; and a warning badge "regime-concentrated" with AlertTriangle 12px, shown when any single regime holds more than 85% of the candidate's trades. |
| 8 | **Candidate label** | mt-1 truncate font-mono 12px secondary — the generated rule signature string from the engine. |
| 9 | **Candidate actions** | Rendered only while status === 'candidate': primary size-sm "Promote · Paper" with a Play 14px glyph; secondary size-sm "Promote · Live"; ghost size-sm icon button with Trash2 14px (aria-label "Archive"). All disable together while busy. |
| 10 | **Metrics strip** | border-t border-line pt-3, grid grid-cols-2 md:grid-cols-6 gap-2, each cell centered: 9px font-medium uppercase tracking-wider muted label over a mono 14px tabular-nums primary value. Six columns in fixed order: "Sharpe" (2dp), "Calmar" (2dp), "Max DD" (1dp %), "Win %" (0dp %), "PF" (2dp), "Trades" (int). Nulls render as em dashes. |
| 11 | **Regime score row** | Rendered only when the candidate has any regime-tagged trades. border-t border-line pt-3, flex-wrap items-center gap-3, 11px. Leading muted label "Regime scores:" followed by up to three badges — bull (TrendingUp 12px), sideways (a 12px muted dot), bear (TrendingDown 12px) — each reading "{regime} {score 2dp} · {n}t" (e.g. "bull 0.42 · 18t"). Tone: up/green above 0.30, down/red below −0.10, muted otherwise. A regime with zero trades renders nothing. |
| 12 | **Archive confirmation** | Native window.confirm with the literal string: "Archive this candidate? You can restore from the audit log later." |
| 13 | **Promotion feedback** | toast.success `Promoted to {paper\|live}` with description "Strategy id 3f9ac2b1" (the new user_strategy_id truncated to 8 chars); failures toast "Promote failed" / "Archive failed" with the API detail. |

**Components** — `DiscoveredTab (RunDetail/CandidateCard) — components/strategies/DiscoveredTab.tsx` · `Card/CardBody — components/foundation/Card.tsx` · `Badge — components/foundation/Badge.tsx` · `Button — components/foundation/Button.tsx` · `EmptyState — components/foundation/EmptyState.tsx` · `Skeleton — components/foundation/Skeleton.tsx` · `toast — components/foundation/Toast.tsx`

**States & data.** Two SWR subscriptions: ['discovery:run', runId] → api.discovery.getRun(runId) polled every 5s regardless of status; ['discovery:candidates', runId] → api.discovery.listCandidates(runId, {limit: 30, only_viable: false}) polled every 5s only while the run status is pending/running, then frozen. Both keepPreviousData and skip focus revalidation, so the list fills in live as backtests complete. api.discovery.promote(candidateId, {mode}) and api.discovery.archive(candidateId) mutate; promotion also refreshes the parent run list. Candidates are returned pre-ranked by score — there is no client-side sort control on this view.

**Interactions.** '← Back to runs' returns to the list (local state only — the browser back button leaves the tab entirely). Manual refresh revalidates both queries. Promote buttons fire immediately with no confirmation for either paper or live. Archive is behind a native confirm. Rows are not clickable — there is no candidate detail view; the mono label line is the only rule disclosure.

**Responsive.** Metrics strip is 2 columns below md and 6 columns at md+. Badge row, action cluster and regime row all wrap. Cards are full-width single column at every breakpoint. Long mono rule labels truncate with ellipsis rather than wrapping.

**Key copy.** • "← Back to runs"
• "run 3f9ac2b1 · status completed"
• "Could not load candidates"
• "Run still in progress" / "Backtests are running. Candidates appear as the run finishes — usually within 30-90s."
• "No candidates yet" / "This run completed without producing any usable candidates. Try a larger sample size or a different universe."
• Badges: "score 0.78", "promoted", "archived", "regime-concentrated"
• Metrics: "Sharpe" / "Calmar" / "Max DD" / "Win %" / "PF" / "Trades"
• "Regime scores:" · "bull 0.42 · 18t"
• Buttons: "Promote · Paper" / "Promote · Live"
• Confirm: "Archive this candidate? You can restore from the audit log later."
• Toast: "Promoted to paper" / description "Strategy id 3f9ac2b1"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark ranked-results list for an AI strategy-discovery engine in an Indian stock-trading web app. 240px sidebar shell, content max 1440px. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent #406AE4, green #10B981, red #F5808C, amber #F0A94F. Header block: a 12px muted back link "← Back to runs", a 16px/600 heading "Equity · Swing (5–20 day hold)", and a mono 11px muted line "run 3f9ac2b1 · status completed"; a ghost refresh icon on the right. Below, a vertical stack of 12px-radius candidate cards 8px apart. Each card: a top row of fully-rounded chips — a green "score 0.78" chip, optionally a blue "promoted" chip with a check and an amber "regime-concentrated" chip with a warning triangle — followed by a truncated mono 12px grey rule signature like "ema20>ema50 AND rsi14 in [50,70] | sl 3% | tp 6% | 1d". Right side of the top row: a solid blue small button "Promote · Paper", a neutral outlined "Promote · Live", and a ghost trash icon. Under a hairline, a six-column centred metric strip with 9px uppercase labels over mono numbers: Sharpe 1.42, Calmar 2.10, Max DD 8.4%, Win % 58%, PF 1.86, Trades 46. Under a second hairline, an 11px row reading "Regime scores:" followed by tinted chips "bull 0.42 · 18t" (green, up arrow), "sideways 0.11 · 9t" (grey dot), "bear -0.20 · 4t" (red, down arrow). Show three cards with varying score colours.
```
</details>

---

## `/strategies/[slug]` — Strategy template detail

**File** `app/(platform)/strategies/[slug]/page.tsx` · **271 LOC** · **Access** Catalog read is public (auth:false); the Clone action requires auth. Tier is displayed as a badge ("Free" muted / "Pro" and "Elite" warning) but is not enforced client-side. Coming-soon templates are hard-disabled: dsl is NULL, the clone button is replaced by a disabled "Coming soon" button, and the DSL slot renders an ETA card instead.

**Shell** — (platform) AppShell, but the page narrows itself to mx-auto max-w-5xl (1024px) inside the shell's 1440px cap — a noticeably narrower reading column than /strategies and /strategies/deployed.

**Purpose.** The read-only spec sheet for one catalog template. The user comes here to judge whether a pre-built strategy is worth adopting — indicative historical numbers, segment/category/capital metadata, and the full plain-English rule set — and concludes by cloning it into their own library as a draft, which redirects them to the editable copy.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Loading state** | mx-auto max-w-5xl space-y-4 p-6 with three Skeletons: 40%×32px, 70%×16px, 100%×240px. |
| 2 | **Not-found state** | mx-auto max-w-5xl p-6 wrapping an EmptyState tone error with a ChevronLeft 24px icon: "Template not found", description = the API error or the literal fallback `No template with slug "{slug}".`, action Button "Back to library" → /strategies. |
| 3 | **PageHeader title cluster** | Same header chrome as the tab pages (border-b, px-4 py-5 md:px-6) but with no eyebrow. The title slot holds an inline-flex gap-2 row: the truncated template name at display-sm 40px, then up to four badges — tier ("Free" muted, "Pro"/"Elite" warning), "Featured" (primary/blue), "Exclusive" (warning/amber), "Coming soon" (muted). |
| 4 | **PageHeader description** | 14px secondary — the template description, or the fallback "{segment} · {category}" when there is none. |
| 5 | **PageHeader action** | Primary Button with a Copy 14px glyph and a trailing ArrowRight 14px: "Clone to my strategies", switching to "Cloning…" while posting. For coming-soon templates it is replaced by a disabled Button reading "Coming soon" with the native title "This template isn't available to clone yet". |
| 6 | **Body wrapper** | space-y-4 p-4 md:p-6 inside the max-w-5xl column. |
| 7 | **Breadcrumb link** | Inline-flex 12px muted link with a ChevronLeft 12px: "All strategies" → /strategies, hovering to primary ink. |
| 8 | **Backtest KPI strip** | Rendered only when at least one of win rate / CAGR / Sharpe / max drawdown is non-null. grid grid-cols-2 md:grid-cols-4 gap-2. Each tile: rounded-xs 6px, border-line, bg-wrap, p-3; 10px font-medium uppercase tracking-wider muted label; mt-0.5 mono 14px semibold tabular-nums value. Labels and formats: "Win rate" (1dp %), "CAGR" (1dp %), "Sharpe" (2dp, else em dash), "Max DD" (always negative-signed, 1dp, rendered in down/red). |
| 9 | **KPI provenance caption** | mt-1.5 10px muted: "Indicative figures from the template author — not Quant X gate-verified. The backtest gate runs before any deploy." |
| 10 | **Metadata card** | Card 12px radius; CardBody is a grid grid-cols-2 md:grid-cols-4 gap-3 of label/value pairs with no borders — 10px uppercase tracking-wider muted label over a 14px primary value. Fields: "Segment", "Category", "Min capital" (₹{n/1000}k or em dash), "Engines used" (joined with " · ", or the literal "None (indicator-only)"). |
| 11 | **DSL section — normal** | The shared DSLPreview card: 17px/600 name, segment/timeframe/universe/regime badges, green "Buy when …" and red "Sell when …" plain-English rule lines at 15px, the hairline-topped risk strip (Stop loss / Target / Trailing / Position / History), and the collapsed "Advanced — view the raw rule definition" JSON disclosure. |
| 12 | **DSL section — coming soon** | Card with CardBody space-y-1 py-8 text-center: 14px font-medium primary "Coming soon" over 12px muted text — the ETA substring sliced from the description when it contains "ETA:", else "This template is being prepared and isn’t available to clone yet." |
| 13 | **DSL section — metadata only** | Card with CardBody py-8 text-center 14px muted: "No DSL attached — this is a metadata-only template." |
| 14 | **Clone outcome** | Success → toast "Template cloned to your strategies as a draft" then router.push(`/strategies/mine/{id}`) — the user never returns to this page. Failure → toast "Could not clone template" with the API detail and the button re-enables. |
| 15 | **Compliance** | No DisclaimerFooter on this page; only the AppShell's ComplianceFooter below the 1024px column. |

**Components** — `PageHeader — components/foundation/PageHeader.tsx` · `Card/CardBody — components/foundation/Card.tsx` · `Badge — components/foundation/Badge.tsx` · `Button — components/foundation/Button.tsx` · `EmptyState — components/foundation/EmptyState.tsx` · `Skeleton — components/foundation/Skeleton.tsx` · `toast — components/foundation/Toast.tsx` · `DSLPreview — components/strategies/DSLPreview.tsx` · `formatPercent/asPercent — lib/utils.ts`

**States & data.** Single fetch keyed on the slug param: api.strategies.getCatalogTemplate(slug) → GET /api/strategies/catalog/{slug} (auth:false), cancelled on unmount and re-run when the slug changes. api.strategies.cloneFromTemplate(slug) → POST /api/strategies/from-template/{slug}. Coming-soon detection is purely client-side from tags including 'coming-soon' (those rows carry a companion 'blocked:<reason>' tag and a NULL dsl, and cloning them 409s — hence the disabled button). No polling, no SWR. Loading = 3 skeleton bars; error/404 = 'Template not found' EmptyState.

**Interactions.** One primary action (Clone) plus one back link and one breadcrumb. The Advanced disclosure inside DSLPreview toggles the raw JSON. There are no tabs, filters, or charts on this page — the KPI strip is static tiles, not a chart. Cloning navigates away on success.

**Responsive.** Content column capped at 1024px and centered, so on wide monitors there is generous empty gutter compared with the full-bleed tab pages. KPI strip 2 → 4 columns at md. Metadata grid 2 → 4 columns at md. PageHeader stacks below md, putting the Clone button under the title cluster. Body padding p-4 → md:p-6.

**Key copy.** • Tier labels: "Free" / "Pro" / "Elite"
• Badges: "Featured" / "Exclusive" / "Coming soon"
• CTA: "Clone to my strategies" / "Cloning…" / disabled "Coming soon" (title "This template isn't available to clone yet")
• Breadcrumb: "All strategies" / "Back to library"
• KPI labels: "Win rate" / "CAGR" / "Sharpe" / "Max DD"
• "Indicative figures from the template author — not Quant X gate-verified. The backtest gate runs before any deploy."
• Metadata labels: "Segment" / "Category" / "Min capital" / "Engines used" / "None (indicator-only)"
• "No DSL attached — this is a metadata-only template."
• "This template is being prepared and isn’t available to clone yet."
• Error: "Template not found" / No template with slug "x".
• Toasts: "Template cloned to your strategies as a draft" / "Could not clone template"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark spec-sheet detail page for a pre-built trading strategy template in an Indian (NSE) web app. Place a centred 1024px reading column inside a 240px-sidebar shell. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent #406AE4, green #10B981, red #F5808C, amber #F0A94F. Card radius 12px, small tiles 6px, chips fully rounded, buttons 8px. Header band with a 1px bottom hairline: a 40px/600 title "BANKNIFTY Weekly Straddle" followed inline by a small amber "Pro" chip and a blue "Featured" chip; beneath it a 14px grey subtitle "Sells the weekly ATM straddle on expiry-minus-two and manages it with a 30% stop." Right-aligned solid blue button with a copy glyph: "Clone to my strategies →". Body: a 12px muted breadcrumb "‹ All strategies"; then a 4-across strip of 6px-radius bordered tiles with 10px uppercase labels over mono values — Win rate 62.4%, CAGR 24.8%, Sharpe 1.38, Max DD -11.2% (in red) — and a 10px muted caption "Indicative figures from the template author — not Quant X gate-verified." Then a 12px-radius card with four borderless label/value pairs: Segment OPTIONS, Category Volatility, Min capital ₹2,00,000, Engines used Regime · Mood. Finally a 12px-radius rule card: 17px/600 name, grey chips "Options", "1d", "BANKNIFTY", an amber "Sideways only" chip; a green fully-rounded "→ Buy" pill beside 15px text "when the market regime is sideways and India VIX drops below 14."; a red "→ Sell" pill beside "when profit reaches 30% of premium collected."; a hairline stat strip Stop loss 30%, Position 5% of capital, History 365 days; and a muted 11px "Advanced — view the raw rule definition" link.
```
</details>

---

## `/strategies/mine/[id]` — My strategy detail — DSL, backtest runner, results, AI read

**File** `app/(platform)/strategies/mine/[id]/page.tsx` · **735 LOC** · **Access** authed, owner-only. Lifecycle actions are status-gated (draft→paper, paper→live/paused, live→paused, paused→paper); paper→live additionally requires the typed-name + acknowledgement modal and passes through the server's out-of-sample gate.

**Shell** — (platform) AppShell with the page narrowed to mx-auto max-w-5xl (1024px) inside the 1440px cap — same reading column as the template detail page.

**Purpose.** The working surface for one saved strategy. The user reads the compiled rules, runs a fresh single-symbol or whole-universe walk-forward backtest with their own capital and lookback, reads the out-of-sample evidence and trade log, asks for an AI read of what drove the result, and moves the strategy through its lifecycle up to live deployment.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Loading state** | mx-auto max-w-5xl space-y-4 p-6 with two Skeletons: 40%×32px and 100%×200px. |
| 2 | **Error state** | EmptyState tone error, ChevronLeft 24px: "Could not load strategy" + the API error or the literal "Strategy not found." + Button "Back to strategies". |
| 3 | **PageHeader** | No eyebrow. Title slot = inline-flex gap-2 of the truncated strategy name at display-sm 40px plus a status Badge using the shared tone map (draft muted, paper primary/blue, live up/green, paused warning/amber, archived muted), label = raw lowercase status. Description = the strategy description or the fallback "DSL strategy detail". |
| 4 | **PageHeader lifecycle actions** | flex-wrap gap-1.5, md-size buttons rendered by status: draft → primary "Promote to paper"; paper → a red-filled "Promote to live" (className bg-down/90 hover:bg-down, white ink, Radio 16px glyph) plus secondary "Pause"; live → secondary "Pause"; paused → primary "Resume"; any non-archived → ghost "Archive" (native confirm `Archive "{name}"?`, then redirects to /strategies). |
| 5 | **Breadcrumb** | Inline-flex 12px muted link with ChevronLeft 12px: "All strategies". |
| 6 | **DSLPreview** | The shared rule card — 17px/600 name; Equity/Options, timeframe, universe and (conditional) regime badges; green "Buy when …" / red "Sell when …" 15px plain-English lines; hairline risk strip (Stop loss red, Target green, Trailing amber, Position, History); collapsible "Advanced — view the raw rule definition" JSON block in a 6px-radius bg-main <pre> capped at 360px. |
| 7 | **Last-backtest summary card** | Rendered only when a stored backtest has both sharpe_ratio and total_return_pct AND no fresh result is on screen. CardHeader "Last backtest"; CardBody a single mono 12px muted line: "RELIANCE · 2026-02-04 → 2026-08-01 · Sharpe 1.28 · Win 57% · Return +14.60%" with em dashes for any missing field. |
| 8 | **Backtest runner header** | CardHeader is a flex row: left the 16px/600 title "Run a backtest"; right an inline 6px-radius segmented control (border-line, p-0.5) with two 11px buttons — "Single symbol" (Target 12px glyph) and "Universe" (Globe 12px) — the active one taking the solid accent fill and font-semibold. |
| 9 | **Single-symbol form** | grid grid-cols-1 md:grid-cols-3 gap-3. Labels are 10px font-semibold uppercase tracking-wider muted paragraphs (not EyebrowMono here): "Symbol" → Input default RELIANCE or the DSL symbol; "Lookback (days)" → NumericInput 180, min 30 max 730 step 30; "Initial capital (₹)" → NumericInput 500000, min 10,000 max 100,000,000 step 50,000. |
| 10 | **Universe form — selector** | Label "Universe" over a native select (w-full, rounded-xs 6px, border-line, bg-main, px-3 py-2, 14px, focus:border-primary) with 11 options rendered "{label} — {hint}": "NIFTY 50 — Top 50 large-caps", "NIFTY 100 — Large + select mid-cap", "NIFTY 500 — Broad market", "IT Sector — 10 stocks · TCS, INFY, …", "Banking — 10 banks · HDFCBANK, ICICI, …", "Auto — MARUTI, M&M, TATAMOTORS, …", "Pharma — SUNPHARMA, DRREDDY, CIPLA, …", "FMCG — HUL, ITC, NESTLE, …", "Metals — TATASTEEL, JSW, HINDALCO, …", "Energy — RELIANCE, ONGC, BPCL, …", "Infrastructure — LT, ULTRACEMCO, ADANIPORTS, …". Default nifty50; the 'Single symbol' option is filtered out. |
| 11 | **Universe form — sizing** | grid grid-cols-1 md:grid-cols-3 gap-3 of NumericInputs: "Per-symbol capital (₹)" 100,000 (10k–10M, step 10k); "Lookback (days)" 180; "Max symbols" 30 (1–200, step 10). Followed by an 11px muted paragraph computing live: "Total capital = ₹30,00,000. Universe runs on up to 30 stocks in parallel (5 at a time) — typically 30-90 seconds. Strategy will trade on all of these when promoted to paper / live." |
| 12 | **Backtest error + run button** | Error banner rounded-xs 6px border-down/40 bg-down/10 px-3 py-2 12px down-tinted. Right-aligned Button with PlayCircle 14px whose label is one of "Run backtest", "Run universe backtest", "Running…", or "Running 30 symbols…"; disabled while running or (single mode) with an empty symbol. |
| 13 | **UniverseBacktestResults — hero** | Card tinted by outcome (border-up/30 bg-up/5 or border-down/30 bg-down/5). CardBody grid-cols-1 md:grid-cols-3 gap-4. Left (col-span-2): 11px uppercase tracking-wider muted "You would have made · NIFTY 50 · 28 stocks" (or "You would have lost"); mono 34px bold leading-none tabular-nums "+₹4,82,150" in green/red; mono 13px/500 "+9.64% portfolio return · 18 winners / 10 losers · 64% hit rate" with muted middots; mt-2 11px muted "₹30,00,000 total capital deployed · 180d lookback". Right (text-right, md:border-l md:pl-4): 11px uppercase muted "Avg per stock"; mono 22px/600 primary "+3.41%"; 11px muted "Sharpe 1.12 · 214 trades". |
| 14 | **UniverseBacktestResults — KPI + table + coverage** | KPI strip grid-cols-2 md:grid-cols-5 gap-2 of 6px-radius bordered tiles: "Symbols run", "Avg Sharpe", "Avg win rate", "Avg Max DD" (red), "Total trades". Then a Card "Per-symbol results" whose header carries three 10px uppercase sort chips — "Return%", "Sharpe", "P&L" — the active one filled accent; body is a 7-column DataTable (Symbol left mono semibold; P&L (₹), Return, Sharpe, Win%, Max DD, Trades all right-aligned mono tabular-nums, P&L/Return tinted green/red and Max DD always red). Finally an amber Card (border-warning/30 bg-warning/5) headed 11px uppercase "Coverage notes" listing "4 skipped — insufficient history. Skipped: ADANIENT, JIOFIN" and "2 failed — data provider error or computation issue. First reason: …". Compact DisclaimerFooter closes it. When aggregate is null the whole block collapses to an ErrorState: "Universe backtest produced no usable results". |
| 15 | **BacktestViewer — hero** | Card elevation raised. With out-of-sample data: left column 11px uppercase muted "Out-of-sample · RELIANCE", mono 34px/600 leading-none "3/4", 13px secondary "windows profitable on data the rules never saw"; right column text-right 11px uppercase muted "In-sample return", mono 20px/600 green/red "+18.42%", 11px muted "after costs · not a forecast". Without it, a single left block: "In-sample return · RELIANCE", mono 28px/600, and 12px secondary "No out-of-sample windows in this run, so there is nothing here that tests the rules against unseen data. In-sample numbers cannot support a decision to trade." |
| 16 | **BacktestViewer — fold strip** | Header row: EyebrowMono at 10px "Walk-forward windows" and right-aligned 10px muted "last = holdout". Below, an equal-width CSS grid with one cell per fold (gridTemplateColumns repeat(N, minmax(0,1fr)), gap 6px). Each cell: rounded-sm 8px, 1px border and a 7%-opacity tint in green or red by profitability, the final cell additionally ringed 1px inset in wrap-line. Contents: 10px muted "W1"…"Holdout" with a ✓/✕ glyph in the matching tone; mono 13px/500 "+6.2%"; 10px muted "14 trades". Native title tooltip: "2026-02-04 → 2026-04-01 · 14 trades · Sharpe 1.31". |
| 17 | **BacktestViewer — OOS metrics + caveat** | grid-cols-2 md:grid-cols-4 gap-2 of 6px tiles: "OOS Sharpe" (2dp), "Consistency" (rounded %), "Worst OOS DD" (red, 1dp), "Holdout" (signed 2dp, red when negative). Then an 11px leading-relaxed muted paragraph: "Walk-forward over 4 windows, 62 out-of-sample trades. The final window is a holdout the rules were never fitted against. Past behaviour on historical data does not predict future results." |
| 18 | **BacktestViewer — in-sample KPI strip** | grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 of 6px-radius bordered tiles (10px uppercase label, mono 14px/600 value): "Sharpe", "Win rate", "Max DD" (red, negative-signed 2dp), "Trades", "Profit factor" (2dp or ∞), "Avg hold" ("3.2d"). The last four are conditional on the field being present. |
| 19 | **BacktestViewer — equity curve** | Card headed "Equity curve". Recharts ResponsiveContainer at a fixed height of 260px containing an AreaChart (margin top 8 / right 12 / left 4 / bottom 0): a vertical linearGradient from the up-green at 0.4 opacity to 0; a dashed 3-3 CartesianGrid in the hairline colour; an X axis of short IST dates ("26 May") at 11px muted with no tick line; a Y axis domain [dataMin, dataMax] formatted "₹500k"; a tooltip on a 96%-opaque L2 surface with an 8px radius and 12px text showing Indian-grouped rupees labelled "Equity"; and a monotone Area with a 2px green stroke over the gradient fill. Empty: py-8 centered 14px muted "No equity points returned by the backtest." |
| 20 | **BacktestViewer — trade log** | Card headed "Trade log" with a right-aligned muted Badge "{n} trades"; CardBody p-0. A DataTable with five columns: "Entry" (mono 12px "26 May · ₹2,845.30"), "Exit" (same shape), "Hold" ("6d", muted), "Net P&L" (right-aligned mono 12px/500, signed 2dp %, green/red), and a second "Exit" column of Badges — take_profit → up "TP", stop_loss → down "SL", trailing_stop → warning "Trail", exit_condition → muted "Signal", end_of_data → muted "EOD". Table chrome: 8px-radius bordered wrapper, sticky header on the L2 hover surface with font-mono 11px uppercase tracked column heads, rows separated by 1px hairlines, 14px secondary cells at px-4 py-3. Empty copy is either "No trades fired in this window." or "This run covered a universe of symbols, so there is no single-symbol trade log." Closes with the compact DisclaimerFooter: "Backtested on past data. Hypothetical results — not a guarantee of future returns. Not investment advice." |
| 21 | **BacktestAIRead** | Rendered whenever a stored or fresh backtest exists. An 8px-radius bordered bg-wrap block: a full-width header button (px-4 py-2.5, hover bg-surface-2) with a Sparkles 14px accent glyph and 12px semibold "AI read of this backtest" on the left and, on the right, 11px accent text "Expand" (then "Refresh") or a spinning Loader2. Expanded: an optional 12.5px secondary narrative paragraph; a bulleted driver list at 11.5px with accent "•" markers; a suggestions box (6px radius, border-line, bg-main/40) headed 10px uppercase "Improve it" with a Wrench 12px glyph and "→"-prefixed items; an 11px accent link-button "Get AI narrative" with a Sparkles glyph shown only while no narrative exists; and a compact DisclaimerFooter. Honest-empty: "No backtest on record yet — run one above first." |

**Components** — `PageHeader — components/foundation/PageHeader.tsx` · `Card/CardHeader/CardBody — components/foundation/Card.tsx` · `Badge — components/foundation/Badge.tsx` · `Button — components/foundation/Button.tsx` · `Input — components/foundation/Input.tsx` · `NumericInput — components/foundation/NumericInput.tsx` · `Dialog — components/foundation/Dialog.tsx` · `EmptyState / ErrorState — components/foundation/EmptyState.tsx, ErrorState.tsx` · `Skeleton — components/foundation/Skeleton.tsx` · `DataTable — components/foundation/DataTable.tsx` · `DisclaimerFooter — components/foundation/DisclaimerFooter.tsx` · `toast — components/foundation/Toast.tsx` · `DSLPreview — components/strategies/DSLPreview.tsx` · `BacktestViewer — components/strategies/BacktestViewer.tsx` · `UniverseBacktestResults — components/strategies/UniverseBacktestResults.tsx` · `BacktestAIRead — components/strategies/BacktestAIRead.tsx` · `num/numMax — lib/format.ts`

**States & data.** api.strategies.get(id) → GET /api/strategies/{id} on mount and again after every backtest (so the stored last_backtest stays fresh); the DSL's symbol and lookback_days seed the form defaults. api.strategies.backtest(id, {symbol, lookback_days, initial_capital}) and api.strategies.backtestUniverse(id, {universe, lookback_days, initial_capital_per_symbol, max_symbols}) are mutually exclusive — running one clears the other's result. api.strategies.transition(id, to) and api.strategies.archive(id) drive lifecycle; archive redirects to /strategies. BacktestAIRead is strictly user-triggered: expanding calls api.strategies.explainBacktest(id, false) for zero-token deterministic drivers/suggestions, and only the explicit 'Get AI narrative' click re-calls it with use_llm=true. No polling anywhere on this page.

**Interactions.** Single/Universe segmented toggle swaps the entire form. Universe uses a native select, not the foundation Select. Run button label reflects mode and progress including the symbol count. Results append below the form and are replaced (not accumulated) on each run. Per-symbol results table has three client-side sort chips (Return% default, Sharpe, P&L) plus the DataTable's own per-column sorting. The Advanced disclosure in DSLPreview toggles raw JSON. 'Promote to live' opens the confirmation modal; every other transition is immediate. Archive is behind a native confirm and navigates away.

**Responsive.** 1024px centred column. Both backtest forms collapse 3 → 1 column below md. The universe hero drops its left border and right-alignment below md (grid 3 → 1). All KPI strips go 2-col below md (universe 5-col and viewer 6-col at md/lg). DataTables render as a real scrollable table at sm+ with a sticky header, and below sm each row becomes a stacked card with label/value pairs. The fold strip keeps N equal columns at every width, so a 5-fold run gets tight on phones. The live-deploy Dialog is a centred max-w-lg modal with 16px page padding.

**Key copy.** • Fallback description: "DSL strategy detail"
• "Last backtest" · "Run a backtest" · "Single symbol" / "Universe"
• "Total capital = ₹30,00,000. Universe runs on up to 30 stocks in parallel (5 at a time) — typically 30-90 seconds. Strategy will trade on all of these when promoted to paper / live."
• Buttons: "Run backtest" / "Run universe backtest" / "Running…" / "Running 30 symbols…" / "Promote to paper" / "Promote to live" / "Pause" / "Resume" / "Archive"
• BacktestViewer: "Out-of-sample · RELIANCE" / "windows profitable on data the rules never saw" / "In-sample return" / "after costs · not a forecast" / "Walk-forward windows" / "last = holdout" / "OOS Sharpe", "Consistency", "Worst OOS DD", "Holdout" / "Equity curve" / "No equity points returned by the backtest." / "Trade log" / "No trades fired in this window." / "This run covered a universe of symbols, so there is no single-symbol trade log."
• Universe: "You would have made" / "You would have lost" / "Avg per stock" / "Per-symbol results" / "Coverage notes" / "Universe backtest produced no usable results"
• AI read: "AI read of this backtest" / "Expand" / "Refresh" / "Improve it" / "Get AI narrative" / "No backtest on record yet — run one above first."
• Compact disclaimer: "Backtested on past data. Hypothetical results — not a guarantee of future returns. Not investment advice."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark strategy-detail and backtest-results page for an Indian (NSE) trading web app. Centre a 1024px column inside a 240px-sidebar shell. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent #406AE4, green #10B981, red #F5808C, amber #F0A94F. Cards 12px radius, metric tiles 6px, chips fully rounded. Header band: 40px/600 title "NIFTY 50 EMA Pullback" with a blue "paper" chip beside it, 14px grey subtitle, and right-aligned buttons — a red-filled "Promote to live" with a broadcast glyph, a neutral "Pause", a ghost "Archive". Below: a rule card (17px name, grey chips Equity / 1d / NIFTY50, green "→ Buy when the 20-day EMA crosses above the 50-day EMA" and red "→ Sell when RSI (14) rises above 70", a hairline strip Stop loss 3% / Target 6% / Position 5% of capital / History 180 days). Then a card "Run a backtest" whose header carries a two-button 6px segment "Single symbol | Universe", and three fields: Symbol RELIANCE, Lookback (days) 180, Initial capital (₹) 5,00,000, with a right-aligned solid blue "Run backtest" button. Then a raised results card: left "OUT-OF-SAMPLE · RELIANCE" over a mono 34px "3/4" and 13px "windows profitable on data the rules never saw"; right "IN-SAMPLE RETURN" over green mono 20px "+18.42%" and 11px "after costs · not a forecast"; beneath, a row of four equal tinted fold tiles (three green with ✓, one red with ✕) each showing "+6.2%" and "14 trades", the last ringed and labelled Holdout; then four tiles OOS Sharpe 1.12 / Consistency 75% / Worst OOS DD -9.4% / Holdout +4.1%. Then a six-tile KPI strip and a 260px-tall green area chart labelled "Equity curve" with ₹500k Y-axis ticks. Finally a dense "Trade log" table with mono columns Entry, Exit, Hold, Net P&L (green/red), and small TP/SL badges.
```
</details>

---

## `/strategies/mine/[id]` — Promote-to-live confirmation modal

**File** `app/(platform)/strategies/mine/[id]/page.tsx` · **735 LOC** · **Access** authed, owner-only, opened only from the paper → live action. Double friction: the typed strategy name must match exactly (trimmed) AND the acknowledgement checkbox must be ticked before 'Go live' enables. The server-side out-of-sample gate still runs after this.

**Shell** — Radix Dialog portal over the (platform) AppShell — fixed centred modal on a black/60 scrim, w-full max-w-lg (overridden via !max-w-lg), rounded-sm 8px, border-line, bg-wrap, p-5, shadow-soft, with scale/fade enter and exit animations.

**Purpose.** The real-money friction layer. Before a paper strategy starts firing broker orders, this modal states plainly what will happen, summarises the exact risk shape (equity or per-leg options), and forces two deliberate confirmations so a live deployment can never be a single mis-click.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Dialog title** | Radix Title, 16px font-normal primary, mb-2: "Promote to live — real money will move". |
| 2 | **Danger explainer block** | flex gap-3, rounded-xs 6px, border-down/30, bg-down/5, p-3. An AlertTriangle 20px in down/red on the left; on the right a 12px secondary stack: a bold primary line "This is not paper trading." then "Once promoted, the strategy runner fires **real broker orders** on your connected broker account every time the entry condition matches. Stop-loss and target levels are placed as GTT orders at the broker (Zerodha) or monitored every 5 min during market hours (others)." (the phrase 'real broker orders' is bolded inline). |
| 3 | **Equity risk summary** | grid grid-cols-2 gap-3 at 12px of six SummaryLine tiles (rounded-xs 6px, border-line, bg-wrap/60, p-2; label font-mono 9px uppercase tracking-wider muted; value mt-0.5 truncate font-mono 12px font-medium primary): "Strategy" (name), "Universe" ("Single — RELIANCE" when single, else the universe token), "Stop loss" ("3%" or the literal "Not set — DSL exit only"), "Target" ("6%" or "Not set"), "Day-loss breaker" ("3% (platform default)" or "{n}% (custom)"), "Position size" ("5% of capital", defaulting to 5). |
| 4 | **Options risk summary — tiles** | Swapped in when the DSL's instrument_segment is OPTIONS. A 2×2 grid of the same SummaryLine tiles: "Strategy", "Underlying" (uppercased symbol, default NIFTY), "Total legs" (count), "Max risk" — either "UNBOUNDED (naked short)" or "Bounded (debit/credit spread)", decided client-side by looking for any SELL leg with no same-type BUY hedge. |
| 5 | **Options leg table** | rounded-xs 6px, border-line, bg-wrap/60. A 12-column header row (border-b, bg-wrap/80, px-3 py-1.5, font-mono 9px uppercase tracking-wider muted): "Side" (2 cols), "Type" (2), "Strike anchor" (4), "Expiry" (2, right-aligned), "Lots" (2, right-aligned). Rows: 12-col grid, px-3 py-1.5, font-mono 11px, 1px hairline between rows and none on the last — side in bold green for BUY / red for SELL, option type CE/PE, anchor rendered "ATM" or e.g. "OTM+2", expiry in muted, lots right-aligned tabular-nums. |
| 6 | **Unbounded-risk callout** | Only when a naked short leg is detected: flex gap-2, rounded-xs, border-down/40, bg-down/10, p-2, 11px down-tinted, with an AlertTriangle 14px: "**Naked short leg detected.** Loss is unbounded if the underlying moves sharply against the position. The day-loss breaker still triggers, but you can lose much more than the entry credit before it fires." |
| 7 | **Options footnote** | 10px muted: "Lot size and per-leg premiums are resolved at order-placement time using the broker’s live option chain. Estimated margin: see the F&O panel after deploy." |
| 8 | **Friction step 1 — typed name** | space-y-1: a 12px font-medium primary <label> "Type the strategy name to confirm" over a foundation Input in font-mono whose placeholder is the strategy's own name. The value must equal the trimmed name exactly. |
| 9 | **Friction step 2 — acknowledgement** | A flex items-start gap-2 label at 12px secondary containing a 14px native checkbox (accent-primary, rounded, border-line, bg-main, mt-0.5) and the text: "I understand real broker orders will fire from this strategy. I accept the day-loss circuit breaker will auto-pause the strategy on breach, but losses up to that point are mine." |
| 10 | **Modal footer** | flex justify-end gap-2, border-t border-line, pt-3. Ghost "Cancel" (resets the typed text and checkbox) and a red-filled confirm Button with a Radio 16px glyph reading "Go live" (bg-down/90, hover bg-down, white ink), disabled until both friction conditions pass and no transition is in flight. |
| 11 | **Outcome** | On confirm the modal closes, state resets, and the shared transition runs → toast.success "Moved to live" and the header status badge flips to the green 'live' tone. A server-side failure surfaces as toast.error "Transition failed" with the API detail and the strategy stays on paper. |
| 12 | **Dismissal** | Radix overlay click, Escape, or Cancel all close and clear both friction fields; there is no partial-state persistence. |

**Components** — `Dialog — components/foundation/Dialog.tsx` · `Input — components/foundation/Input.tsx` · `Button — components/foundation/Button.tsx` · `toast — components/foundation/Toast.tsx` · `SummaryLine / OptionsRiskSummary — app/(platform)/strategies/mine/[id]/page.tsx (local)`

**States & data.** Purely local state — liveConfirmOpen, liveConfirmText, liveAcked. No fetch on open: every number shown is read from the already-loaded strategy row and its DSL (universe, symbol, stop_loss_pct, take_profit_pct, position_size, max_daily_loss_pct, legs). The naked-short determination and the ATM/OTM anchor formatting are computed client-side. Confirming calls api.strategies.transition(id, 'live') → POST /api/strategies/{id}/transition, which is where the server's out-of-sample gate can still reject the promotion.

**Interactions.** Two gating inputs: an exact-match text field (trim-compared against the strategy name) and a checkbox. The confirm button stays disabled until both pass. Escape / overlay click / Cancel all dismiss and reset. The modal body swaps entirely between an equity 6-tile summary and an options 4-tile summary plus per-leg table depending on instrument_segment.

**Responsive.** Centred fixed modal at w-full max-w-lg (512px). The 2-col summary grid stays 2-col at every width, so labels truncate on narrow phones. The 12-column leg table does not scroll — its columns compress, which is tightest on the 4-wide 'Strike anchor' cell. Long strategy names truncate inside the SummaryLine tiles.

**Key copy.** • Title: "Promote to live — real money will move"
• "This is not paper trading."
• "Once promoted, the strategy runner fires real broker orders on your connected broker account every time the entry condition matches. Stop-loss and target levels are placed as GTT orders at the broker (Zerodha) or monitored every 5 min during market hours (others)."
• Tile labels: "Strategy" / "Universe" / "Stop loss" / "Target" / "Day-loss breaker" / "Position size" / "Underlying" / "Total legs" / "Max risk"
• "Not set — DSL exit only" / "Not set" / "3% (platform default)"
• "UNBOUNDED (naked short)" / "Bounded (debit/credit spread)"
• Leg table heads: "Side" / "Type" / "Strike anchor" / "Expiry" / "Lots"
• "Naked short leg detected. Loss is unbounded if the underlying moves sharply against the position. The day-loss breaker still triggers, but you can lose much more than the entry credit before it fires."
• "Lot size and per-leg premiums are resolved at order-placement time using the broker’s live option chain. Estimated margin: see the F&O panel after deploy."
• "Type the strategy name to confirm"
• "I understand real broker orders will fire from this strategy. I accept the day-loss circuit breaker will auto-pause the strategy on breach, but losses up to that point are mine."
• Buttons: "Cancel" / "Go live"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark, high-friction confirmation modal for switching an algorithmic trading strategy from paper to real money in an Indian (NSE) app. Centre a 512px-wide panel on a 60% black scrim: 8px radius, #151517 fill, 1px #29292D border, 20px padding, soft shadow. Ink #F7F7F8 / #D3D3D7 / #96969E; danger red #F5808C, green #10B981, accent blue #406AE4. Title at 16px: "Promote to live — real money will move". Below, a 6px-radius red-tinted warning block (red border at 30% and a 5% red fill) with a 20px warning triangle and two lines: bold "This is not paper trading." then 12px grey body explaining real broker orders fire on every entry match and that stop-loss and target go in as GTT orders at Zerodha or are monitored every 5 minutes elsewhere. Then a 2-column grid of six small 6px-radius bordered tiles, each with a mono 9px uppercase label over a mono 12px value: Strategy "BANKNIFTY Weekly Straddle", Underlying BANKNIFTY, Total legs 4, Max risk "Bounded (debit/credit spread)", Day-loss breaker "3% (platform default)", Position size "5% of capital". Under it a compact mono leg table with a tinted header row — Side, Type, Strike anchor, Expiry (right), Lots (right) — and four rows: green bold SELL / CE / ATM / weekly / 1; red bold BUY / CE / OTM+2 / weekly / 1; and two matching PE rows. Then a labelled text field "Type the strategy name to confirm" in monospace, and a checkbox row in 12px grey acknowledging that real orders will fire and losses up to the circuit breaker are the user's. Footer above a hairline: ghost "Cancel" and a red-filled "Go live" button with a broadcast glyph, shown disabled.
```
</details>

---

## `/strategies/deployed` — Deployed strategies — live P&L dashboard

**File** `app/(platform)/strategies/deployed/page.tsx` · **519 LOC** · **Access** authed. Lists only paper and live strategies belonging to the caller; drafts, paused and archived rows never appear. Live rows are visually flagged with a red status badge.

**Shell** — (platform) AppShell, full-bleed inside the 1440px cap (no narrow column): the page itself is w-full space-y-5 p-4 md:p-6 xl:px-8.

**Purpose.** The operations view for everything currently trading. The user comes here to see aggregate and per-strategy mark-to-market P&L, which positions are open right now with entry versus LTP, whether the deployed win rate is beating its own backtest baseline, and what the strategy did most recently — and to pause anything misbehaving in one click.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **PageHeader** | Eyebrow font-mono 11px uppercase tracked "Strategies"; title display-sm 40px "Deployed strategies"; description 14px secondary "Live P&L on every paper/live strategy. Updates every 30s." |
| 2 | **Header actions** | A ghost Button with RefreshCw 16px that spins while fetching (aria-label "Refresh", the word "Refresh" hidden below sm), plus a Link-wrapped secondary Button with a Plus 16px: "Browse catalog" → /strategies. |
| 3 | **Aggregate KPI band** | section aria-label "Aggregate deployment stats", grid grid-cols-2 md:grid-cols-5 gap-3 of five StatCards. Each StatCard: rounded-sm 8px, border-line, bg-wrap, p-4, flex-col gap-2 — a font-mono 11px uppercase tracking-[0.1em] muted label over a font-mono 24px tabular-nums value; loading swaps the value for a 60%×28px shimmer. Cards: "Total P&L" (realized + unrealized, tinted green/red), "Realized", "Unrealized", "Open positions" (count), "Active strategies" (count). Money uses the signed Indian format with a U+2212 minus so negatives align, e.g. "+₹1,24,560" / "−₹8,420". |
| 4 | **Error state** | A Card with border-down/40 bg-down/5 whose body is a single 14px down-tinted line: "Could not load deployed strategies — {error}". |
| 5 | **Loading state** | space-y-3 with exactly 3 full-width Skeletons at 200px height (only while there is no previous data — SWR keepPreviousData means refreshes never blank the list). |
| 6 | **Empty state** | EmptyState with Sparkles 32px: "No deployed strategies yet" / "Promote a strategy from your drafts or pick one from the catalog to start. Once deployed, it'll show up here with live P&L." / Link-wrapped Button "Browse strategies". |
| 7 | **Strategy card grid** | grid grid-cols-1 xl:grid-cols-2 gap-4 — a single column until xl, then two side-by-side strategy cards. |
| 8 | **Strategy card header** | Card overflow-hidden, 12px radius. CardHeader flex justify-between gap-3: left an uppercase status Badge — tone down/red for "LIVE", primary/blue for "PAPER" — beside the truncated strategy name in semibold primary. Right: a ghost size-sm Pause button (Pause 14px, label "Pause" hidden below sm, swapping to a spinning RefreshCw while pausing) and a Link-wrapped ghost size-sm ChevronRight 16px → /strategies/mine/{id}. |
| 9 | **P&L hero row** | CardBody p-0. A grid grid-cols-3 gap-px on a bg-line/40 backdrop so the 1px gaps read as hairlines. Each Cell: bg-wrap p-3, font-mono 9px uppercase tracking-wider muted label, mono 14px/600 tabular-nums value tinted green/red, and a truncated mono 10px muted sub-line. Cells: "Total P&L" (sub "+12.5% of ₹1L" — the denominator is hardcoded to ₹1,00,000 regardless of actual allocation), "Realized" (sub "14 exits"), "Unrealized" (sub "3 open"). |
| 10 | **Meta row** | grid grid-cols-2 md:grid-cols-4 gap-3 px-4 at 12px. Each: 10px uppercase tracking-wider muted label, mono 12px/500 tabular-nums primary value, optional mono 10px tinted sub. Fields: "Universe" (mapped label — NIFTY 50, Banking, IT Sector, Single symbol…), "Win rate" ("58.3%" or the literal "— no closed trades") with sub "+4.1pp vs backtest" in green/red or the fallback "Backtest: 54.2%", "Stop loss" ("3%" or em dash), "Target" ("6%" or em dash). |
| 11 | **Open positions table** | mx-4 mt-2, rounded-xs 6px, border-line, overflow-hidden. Header: a 12-col grid on bg-wrap/60 with a bottom hairline, px-3 py-1.5, font-mono 9px uppercase tracking-wider muted — "Symbol" (3 cols), "Qty" (2, right), "Entry" (2, right), "LTP" (2, right), "P&L" (3, right). Rows are Links to the stock page: 12-col grid, items-center, px-3 py-1.5, 12px, hairline between rows, hover bg-wrap-hover — symbol in mono font-medium primary with a trailing ArrowUpRight 10px muted; quantity mono secondary; entry "₹2,845.3" mono muted (Indian grouping, max 1 decimal); LTP mono primary or em dash; P&L mono green/red with a trailing 10px "(+3.4%)". |
| 12 | **No-positions state** | mx-4, rounded-xs 6px, border-line, bg-wrap/40, px-3 py-3, centered 12px muted: "No open positions". |
| 13 | **Recent activity list** | px-4 pb-3. A mono 9px uppercase tracking-wider muted heading "Recent activity" over a ul of at most 5 items (space-y-1, 12px, flex items-center gap-2). Each item: a 12px glyph — Plus in accent for entries, TrendingUp green for target hits, TrendingDown red for stop losses, Target muted otherwise — then the mono secondary event label, the mono font-medium primary symbol, a mono muted "@ ₹2,845.3", and an ml-auto 10px muted IST timestamp formatted en-IN as "03 Aug, 02:45 pm" (2-digit day, short month, 2-digit hour and minute). |
| 14 | **Event label vocabulary** | Entries render as "Entry"; exits map their reason → "Target hit" (green), "Stop loss" (red), "Exit rule", "Manual", "Time exit" (all muted). |
| 15 | **DisclaimerFooter** | Standard variant closing the page: "For educational purposes. Not investment advice. Markets carry risk.", above the shell's ComplianceFooter. |

**Components** — `PageHeader — components/foundation/PageHeader.tsx` · `StatCard — components/foundation/StatCard.tsx` · `Card/CardHeader/CardBody — components/foundation/Card.tsx` · `Badge — components/foundation/Badge.tsx` · `Button — components/foundation/Button.tsx` · `EmptyState — components/foundation/EmptyState.tsx` · `Skeleton — components/foundation/Skeleton.tsx` · `DisclaimerFooter — components/foundation/DisclaimerFooter.tsx` · `toast — components/foundation/Toast.tsx` · `inrSigned/numMax — lib/format.ts` · `stockHref — lib/stock-href.ts`

**States & data.** SWR key 'strategies:deployed' → api.strategies.deployed() → GET /api/strategies/deployed, one round-trip returning everything pre-aggregated server-side. Options: refreshInterval 30,000ms (the '/Updates every 30s' promise in the header), dedupingInterval 10,000ms, revalidateOnFocus false, keepPreviousData true — so the list never blanks between polls and the skeletons only ever show on a cold first load. The five header KPIs are reduced client-side across the returned strategies (realized, unrealized, open_count, entries_emitted, exits_emitted). Pausing calls api.strategies.transition(id, 'paused') then mutates the cache; toasts are 'Strategy paused' or 'Could not pause'. ChangeBadge is imported but not rendered.

**Interactions.** Manual refresh button (disabled while loading, icon spins). Per-card Pause with a per-row busy state — no confirmation dialog, unlike Archive elsewhere. Chevron button and open-position rows navigate away: the chevron to /strategies/mine/{id}, each position row to the stock detail page via stockHref(symbol). Nothing is sortable or filterable; recent activity is capped at 5 items with no expand. There are no charts on this screen.

**Responsive.** Strategy card grid is 1 column until xl (1280px) and 2 columns above it — this is the only place in the group that uses an xl breakpoint for layout. KPI band is 2 columns below md and 5 across at md+. The per-card meta row is 2 columns below md, 4 at md+. The 'Refresh' and 'Pause' word labels are hidden below sm, leaving icon-only buttons. The 12-column position table compresses rather than scrolling. Page gutters p-4 → md:p-6 → xl:px-8.

**Key copy.** • Eyebrow "Strategies"; title "Deployed strategies"; description "Live P&L on every paper/live strategy. Updates every 30s."
• Actions: "Refresh" / "Browse catalog"
• KPI labels: "Total P&L" / "Realized" / "Unrealized" / "Open positions" / "Active strategies"
• Error: "Could not load deployed strategies — …"
• Empty: "No deployed strategies yet" / "Promote a strategy from your drafts or pick one from the catalog to start. Once deployed, it'll show up here with live P&L." / "Browse strategies"
• Card cells: "Total P&L" with hardcoded sub "…% of ₹1L", "Realized" + "{n} exits", "Unrealized" + "{n} open"
• Meta: "Universe" / "Win rate" / "— no closed trades" / "+4.1pp vs backtest" / "Backtest: 54.2%" / "Stop loss" / "Target"
• Table heads: "Symbol" / "Qty" / "Entry" / "LTP" / "P&L"
• "No open positions" / "Recent activity"
• Event labels: "Entry" / "Target hit" / "Stop loss" / "Exit rule" / "Manual" / "Time exit"
• Toasts: "Strategy paused" / "Could not pause"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark live-operations dashboard for deployed algorithmic trading strategies in an Indian (NSE) web app. Full-bleed inside a 240px-sidebar shell, content capped at 1440px with 24px gutters. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent #406AE4, P&L green #10B981, red #F5808C. Cards 12px radius, stat tiles 8px, inner tables 6px, chips fully rounded. Header: mono 11px uppercase eyebrow "STRATEGIES", 40px/600 title "Deployed strategies", 14px grey subtitle "Live P&L on every paper/live strategy. Updates every 30s.", right-aligned ghost refresh icon and a neutral "+ Browse catalog" button. Below, five equal stat tiles with mono 11px uppercase labels over mono 24px numbers: Total P&L +₹1,24,560 (green), Realized +₹96,140 (green), Unrealized +₹28,420 (green), Open positions 7, Active strategies 3. Then a two-column grid of strategy cards. Each card header: an uppercase red "LIVE" chip (or blue "PAPER") beside a bold name like "NIFTY 50 EMA Pullback", with a ghost "Pause" button and a chevron on the right. Body: a three-cell hairline-divided P&L strip with mono 9px uppercase labels and mono values — Total P&L +₹62,340 / "+62.3% of ₹1L", Realized +₹48,900 / "14 exits", Unrealized +₹13,440 / "3 open". Then a four-up meta row — Universe NIFTY 50, Win rate 58.3% with a green sub "+4.1pp vs backtest", Stop loss 3%, Target 6%. Then a compact 6px-radius table with a tinted mono header Symbol / Qty / Entry / LTP / P&L and rows RELIANCE 40 ₹2,845.3 ₹2,912.0 +₹2,668 (+2.3%), TCS 18 ₹3,910 ₹3,864 −₹828 (−1.2%), HDFCBANK 55 ₹1,642 ₹1,701 +₹3,245 (+3.6%). Finally a "RECENT ACTIVITY" list of five 12px rows with small glyphs: "Target hit RELIANCE @ ₹2,912" with a right-aligned muted timestamp "03 Aug, 02:45 pm". Centered 10px muted disclaimer at the bottom.
```
</details>

---
