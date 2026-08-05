# Stock dossier — header & tab bodies

> Part of the Quant X as-built screen inventory — see [`../03-SCREEN-INVENTORY.md`](../03-SCREEN-INVENTORY.md)
> for the full index and [`../01-DESIGN-SYSTEM.md`](../01-DESIGN-SYSTEM.md) for every token used below.

**4 surfaces.**

## Family notes

PART 1 of 3 — page header entry + the three tab-body entries. The 17 card entries follow in subsequent StructuredOutput calls (this call was split to stay inside the output limit). Key global facts established here and inherited by every card entry: (1) the route is SHELL-LESS — it sits outside app/(platform), so no Sidebar/RightRail/Topbar/ComplianceFooter, and the prose font is Geist Sans, not Plus Jakarta Sans; (2) the tab state is Radix-internal (defaultValue=\"technical\"), NOT URL-synced — ?tab= is a documentation convention only; (3) token map used throughout — bg-main #0D0D0E, bg-wrap #151517, bg-surface-2/wrap-hover #1E1E21, border-line & border-d-border #29292D, text-d-text-primary #F7F7F8, text-d-text-secondary #D3D3D7, text-d-text-muted #96969E, text-primary/text-ai #8FB0FF (ink) vs bg-primary #406AE4 (fill, white ink, hover #3055C2), text-up/success #10B981, text-down/danger #F5808C, text-warning/highlight #F0A94F, var(--color-muted) #96969E; light theme swaps to #EDF1F4 / #FFFFFF / #F4F7F9 / #DDE5ED / #1D1D1D / #4D585F / #5F6B75 / #3459C9 / #0A6B50 / #B81C22 / #9A4D00. Radii: xs 6 / sm 8 / md 12 / lg 16 / full 9999 / mark 2. (4) Two cards in components/stock/ are NOT rendered by this page: NewsMoodCard (only used by components/markets/StockMoodLookup.tsx with autoFetch) and IndicatorInterpreterCard (fully orphaned — superseded by TechnicalsPanelCard). Both are still documented per the brief. (5) A live defect worth recording: `bg-d-bg-subtle` (used on AITradeDeskCard driver chips and TechnicalsPanelCard candle chips) is NOT defined in tailwind.config.ts or globals.css, so those chips render with a transparent fill and only their 1px hairline.

---

## `/stock/[symbol] — header band (shell-less)` — Stock Terminal — Breadcrumb + Identity/Price Header

**File** `/Users/rishi/QuantX/frontend/app/stock/[symbol]/page.tsx` · **189 LOC** · **Access** Public route — no auth guard, no onboarding redirect. Price/technicals/fundamentals endpoints are auth:false. Watchlist state only resolves when useAuth() has a user.id; Trade ticket routes a real broker order and gates inside QuickTrade.

**Shell** — NONE. Outer <div class="min-h-screen bg-main" data-testid="stock-detail-page"> → inner <div class="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6"> (max-width 1280px; gutter 16px → 24px at md; vertical pad 16px → 24px). Because AppShell never wraps this route, the prose font is Geist Sans (--font-sans from the root layout), NOT Plus Jakarta Sans.

**Purpose.** The entity-terminal masthead. Renders SHELL-LESS (route lives outside app/(platform), so no Sidebar / RightRail / Topbar / ComplianceFooter) on a bare div.min-h-screen.bg-main. Carries its own breadcrumb back to /markets, symbol identity, live price + duotone change, live/EOD provenance badges, an 8-cell quick-stat grid, a 52-week position strip, and the Trade / Watchlist / Ask-Copilot / Refresh action cluster.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Breadcrumb (lines 320-331)** | <nav aria-label="Breadcrumb"> mb-4 (16px) · flex items-center gap-1.5 (6px) · font-mono text-[11px] uppercase tracking-[0.08em] · text-d-text-muted #96969E. Button "Markets" (hover → #D3D3D7) → router.push('/markets'); ChevronRight 12×12; span with the uppercased symbol in #D3D3D7. Wrapped in <Reveal> delay 0. |
| 2 | **Header shell (lines 337-501)** | <header> mb-5 (20px) · flex flex-col gap-4 · border-b border-line (#29292D) · pb-5 · lg:flex-row lg:items-start lg:justify-between. Wrapped in <Reveal delay={0.05}> — framer-motion fade-up y 10→0, 450ms, cubic-bezier(.16,1,.3,1). |
| 3 | **Identity row** | flex flex-wrap items-center gap-x-3 gap-y-1: SymbolLogo size 40 (rounded-full <img> 40×40, bg-white object-contain; on error a Monogram — 2 uppercase initials, 16px semibold, border-line, bg-wrap-hover #1E1E21, text #D3D3D7) · <h1 class="heading-display text-3xl md:text-4xl font-semibold tracking-tight text-d-text-primary"> = 30px/36px → 36px/40px, letter-spacing -0.02em, colour #F7F7F8 · company name span truncate text-sm (14px) #D3D3D7, falls back to the literal string "NSE" when name === symbol · exchange/sector span font-mono text-[10px] uppercase tracking-[0.08em] #96969E rendering "NSE · Refineries". |
| 4 | **Price band (lines 354-388)** | mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1. (1) font-mono text-3xl (30px) font-semibold tabular-nums #F7F7F8 → "₹2,948.6" (numMax 2, Indian grouping). (2) absolute change font-mono text-base (16px) font-medium tabular-nums, #10B981 up / #F5808C down → "+32.40". (3) <ChangeBadge value=change_percent kind="percent" size="sm"> — inline-flex font-mono tabular-nums text-[11px] gap-1 px-1.5 py-0.5, no fill, ArrowUp/ArrowDown 12×12, formats "+1.11%". (4) <DataBadge> — live: rounded-full border-up/30 bg-up/10 px-2 py-0.5 text-[10px] font-medium #10B981, Radio 12px, copy "Live · your broker"; eod: rounded-full border-line px-2 py-0.5 text-[10px] #96969E, Clock 12px, copy "EOD research". Both wear a Tooltip. |
| 5 | **Price band — stream + pick badges** | wsConnected → pill inline-flex gap-1 rounded-full bg-up/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] #10B981 with a 6×6 dot bg-up, copy "Streaming". Otherwise a bare span font-mono text-[10px] uppercase tracking-[0.08em] #96969E, copy "At close". When the symbol sits in today's live book, an AI-pick button: rounded-full border-ai/40 bg-ai/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ai #8FB0FF, hover bg-ai/20, Sparkles 12px, copy "Alpha Picks · #3 · LONG" (book from signal_type, rank parsed out of reasons[0] via /#(\d+)/) → router.push(`/signals/${id}`). |
| 6 | **Quick-stat grid (lines 391-427)** | <dl> mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4. Each QuickStat: <dt> font-mono text-[9px] uppercase tracking-[0.1em] #96969E; <dd> mt-0.5 truncate font-mono text-xs (12px) font-semibold tabular-nums, colour #F7F7F8 / #10B981 / #F5808C by tone; optional second <dd> font-mono text-[9px] #96969E. Eight cells in fixed order: Open · Prev Close · Day Range ("₹2,921.10 – ₹2,963.40") · 52W Range ("₹2,220 – ₹3,218") · Volume (qtyCompact → "86.3 L") with sub "1.8× avg" · Mkt Cap (inrCrore → "₹19.94 L Cr", falling back to price-payload rupees ÷ 1e7) · P/E ("24.8" or em-dash) · RSI 14 (tone: >70 → down, <30 → up). |
| 7 | **52-week position strip (lines 431-459)** | mt-3 max-w-md (448px), rendered only when both 52w bounds exist and high > low. Label row font-mono text-[9px] uppercase tracking-[0.1em] #96969E: left "52W position", right "78% of range · -8.4% vs high" where the vs-high span is #10B981 when offHigh ≥ -3 else #D3D3D7. Track: relative mt-1 h-1.5 rounded-full bg-surface-2 #1E1E21. Fill: absolute inset-y-0 left-0 rounded-full, width = posPct%, background linear-gradient(90deg, var(--color-down), var(--color-highlight), var(--color-up)) at opacity 0.55. Marker: absolute top-1/2 h-3 w-[3px] -translate-y-1/2 rounded-full bg-d-text-primary at left calc(posPct% - 1px). |
| 8 | **Action cluster (lines 463-500)** | flex shrink-0 items-center gap-2. TradeTicketButton → Button variant="primary" size="sm" (h-7 / 28px, px-3, text-xs, gap-1.5, rounded-sm 8px, glass-control-accent = fill #406AE4 + border #406AE4 + white ink, hover #3055C2) with Activity 16px and label "Trade". Watchlist → Button variant secondary\|ghost size sm, Bookmark / BookmarkCheck (check tinted #10B981) 16px, label hidden below sm: "Add to Watchlist" ⇄ "In Watchlist", aria-pressed. Ask Copilot → Button variant="ai" (glass-control surface, ink #8FB0FF) with Sparkles 16px + "Ask Copilot" → dispatchCopilotOpen("Give me a full read on RELIANCE: setup, key levels, and risks."). Refresh → Button ghost sm px-2 aria-label="Refresh", RefreshCw 16px, animate-spin while loading, disabled while loading. |
| 9 | **Page-level skeleton (lines 288-300)** | When loading && !stockData the entire page is replaced by: mx-auto max-w-7xl space-y-4 p-4 md:p-6 → Skeleton w=40% h=36px · Skeleton w=60% h=24px · Skeleton w=100% h=520px · grid grid-cols-1 lg:grid-cols-2 gap-4 with two 200px skeletons. Skeleton = animate-pulse bg-line/80 rounded-xs (6px). |
| 10 | **Sections below the header (page order)** | mb-6 primary chart (LightweightChart, height 520, re-keyed on resolved theme) → mb-6 AITradeDeskCard → mb-8 AI tabs section (eyebrow row: Sparkles 16px #8FB0FF + EyebrowMono "AI engines read RELIANCE" — font-sans font-semibold uppercase tracking-[0.12em] text-xs, tinted text-ai) → mb-6 Data Modules section (EyebrowMono "Data Modules" mb-3; grid grid-cols-1 lg:grid-cols-2 gap-4 with FundamentalsCard forced lg:col-span-2, VolumeProfilePanel lookbackDays=30 bins=20 taking lg:col-span-2 only when no broker, and OrderBookCard rendered ONLY when brokerConnected) → DisclaimerFooter: p pb-2 pt-1 text-center text-[10px] #96969E, copy "For educational purposes. Not investment advice. Markets carry risk." |

**Components** — `Reveal (framer-motion fade-up, delays 0 / .05 / .1 / .12 / .15 / .2)` · `SymbolLogo + Monogram fallback` · `ChangeBadge` · `DataBadge + Tooltip` · `Button (primary / secondary / ghost / ai, size sm)` · `TradeTicketButton → QuickTrade → ConfirmDialog` · `Skeleton` · `EyebrowMono` · `DisclaimerFooter` · `ErrorBoundary (labels: "Price chart", "AI Trade Desk", …)` · `LightweightChart (dynamic, ssr:false)` · `toast (sonner-style)`

**States & data.** Data: api.screener.getStockPrice + getStockTechnicals in parallel on mount, re-polled every 30 000 ms while document is visible; usePriceUpdates WebSocket patches price/change/change_percent in place; SWR `fundamentals:${symbol}` (dedupe 300 000 ms) is SHARED with FundamentalsCard so header Mkt Cap / P/E can never disagree with the card; SWR `signals:today` (refresh 60 000 ms) resolves the AI-pick badge; useBrokerStatus drives DataBadge mode and whether OrderBookCard mounts. States: full-page skeleton while loading && !stockData → populated header. Errors surface as toast.error(`Couldn't refresh RELIANCE`, { description }); watchlist writes optimistically and rolls back with toast.error('Could not update watchlist'). Success toasts: "RELIANCE added to watchlist" / "RELIANCE removed from watchlist". Chart theme resolves client-side only — dark until mounted, then re-keyed.

**Interactions.** "Markets" breadcrumb → /markets. AI-pick badge → /signals/{id}. Trade → QuickTrade sheet → mandatory ConfirmDialog ("Confirm order", body "BUY 10 RELIANCE · MARKET · CNC" + caption "Real order routed to your connected broker. Market/Limit only.", confirm label "Place order"). Watchlist toggles optimistically. Ask Copilot dispatches a prefilled prompt into the global Copilot dock. Refresh re-runs both fetches and spins its icon. Hover on the DataBadge reveals the provenance tooltip.

**Responsive.** Breakpoints sm 640 / md 768 / lg 1024. Below lg the header is a single column (flex-col gap-4) with the action cluster stacked beneath; at lg it becomes a two-column flex row with the actions right-aligned and top-aligned. Quick stats: 2 cols → 3 at sm → 4 at lg. h1 30px → 36px at md. Page gutter 16px → 24px at md. Watchlist button label is hidden below sm (icon-only). The 52W strip is capped at 448px at every width.

**Key copy.** "Markets" · "NSE · Refineries" · "Live · your broker" · "EOD research" · "Streaming" · "At close" · "Alpha Picks · #3 · LONG" · "52W position" · "78% of range · -8.4% vs high" · "1.8× avg" · "Add to Watchlist" / "In Watchlist" · "Ask Copilot" · "AI engines read RELIANCE" · "Data Modules" · "For educational purposes. Not investment advice. Markets carry risk."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark financial terminal page header, no sidebar, no top nav. Page background #0D0D0E, content centered at max-width 1280px with 24px gutters. Top: a 11px uppercase mono breadcrumb in #96969E — "MARKETS" then a 12px chevron then "RELIANCE" in #D3D3D7. Below it an identity row: a 40px circular company logo, then "RELIANCE" at 36px semibold #F7F7F8 with -0.02em tracking, then "Reliance Industries Ltd" at 14px #D3D3D7, then "NSE · REFINERIES" at 10px uppercase mono #96969E. Next line, baseline-aligned: "₹2,948.60" in 30px semibold tabular mono #F7F7F8, "+32.40" in 16px mono #10B981, a small "▲ +1.11%" chip in #10B981, a pill with a radio glyph reading "Live · your broker" (border #10B981 at 30%, fill 10%), a green-dot pill "STREAMING", and a blue-ink pill "ALPHA PICKS · #3 · LONG" in #8FB0FF on a 10% fill with a 40% border. Under that a 4-column stat grid: OPEN, PREV CLOSE, DAY RANGE, 52W RANGE, VOLUME (86.3 L / 1.8× avg), MKT CAP ₹19.94 L Cr, P/E 24.8, RSI 14 58.3 — labels 9px uppercase mono #96969E, values 12px semibold tabular mono #F7F7F8. Then a 448px-wide 6px rounded track on #1E1E21 with a red→amber→green gradient fill at 55% opacity to 78% and a 3px white tick, captioned "52W POSITION · 78% OF RANGE · -8.4% VS HIGH". Right side: a solid #406AE4 8px-radius "Trade" button, a ghost "Add to Watchlist", a blue-ink "Ask Copilot", and an icon-only refresh. Close with a 1px #29292D hairline.
```
</details>

---

## `/stock/[symbol]?tab=technical` — Tab body — Engine Read

**File** `/Users/rishi/QuantX/frontend/app/stock/[symbol]/page.tsx` · **40 LOC** · **Access** Public. AIDossierPanel and ChartVisionCard tier-gate internally (free = directional tags + upgrade CTA; Elite = chart vision anywhere).

**Shell** — Inside the page's AI-tabs <section class="mb-8">. TabsList: inline-flex items-center gap-1 rounded-full border border-line bg-main p-1, className="w-full overflow-x-auto". Triggers px-3.5 py-1.5 rounded-full text-sm font-medium; inactive #96969E, active bg-wrap #151517 + ink #F7F7F8 + shadow-sm. Three triggers: "Engine Read" · "Why It Moves" · "Forecast". TabsContent has pt-5 (20px). NOTE: the tab is NOT URL-synced — it is Radix internal state only; ?tab= is a documentation convention.

**Purpose.** The default tab (Radix defaultValue="technical", label "Engine Read"). Deterministic evidence only — the AI Trade Desk above synthesises it. Renders a day-cached AI strip, then the fused verdict beside the engine dossier, then the full technicals system, then a three-up strength/sentiment/volume row, then chart vision.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Content stack** | <div class="space-y-4"> — 16px vertical rhythm between every block. |
| 2 | **1 · TabAiRead** | Full width. title="AI engine read"; narrative from api.screener.verdict(symbol, true).narrative. ErrorBoundary label "AI engine read". Returns null entirely when the narrative is empty. |
| 3 | **2 · Two-up row** | grid grid-cols-1 gap-4 lg:grid-cols-2 → FusionVerdictCard (left) \| AIDossierPanel (right). ErrorBoundary labels "Fusion verdict" and "AI Dossier". |
| 4 | **3 · TechnicalsPanelCard** | Full width, its own 3-column internal grid. ErrorBoundary label "Technicals and levels". |
| 5 | **4 · Three-up row** | grid grid-cols-1 gap-4 lg:grid-cols-3 → RelativeStrengthCard \| SentimentCard \| VolumeIntelCard. ErrorBoundary labels "Relative strength", "Sentiment", "Volume intelligence". |
| 6 | **5 · ChartVisionCard** | Full width, passed the `anywhere` prop (Elite endpoint) so the header shows the amber "Elite" chip. ErrorBoundary label "Chart vision". |

**Components** — `Tabs / TabsList / TabsTrigger / TabsContent (Radix)` · `TabAiRead` · `FusionVerdictCard` · `AIDossierPanel` · `TechnicalsPanelCard` · `RelativeStrengthCard` · `SentimentCard` · `VolumeIntelCard` · `ChartVisionCard` · `ErrorBoundary`

**States & data.** Every child is a next/dynamic import with ssr:false, so each hydrates when the tab mounts. Independent fetches: verdict narrative (TabAiRead), SWR `verdict:${symbol}` (120s), SWR `dossier:${symbol}` (120s, 3 retries), SWR `tech-panel:${symbol}` (300s), one-shot relativeStrength / volumeIntel + footprint, SWR `sent-read:${symbol}` (300s), and ChartVision which fires only on button click. Cards fail independently — a crash renders the ErrorBoundary tile: rounded-sm border-d-border bg-wrap p-4, amber 12px heading "Relative strength couldn't load", 11px muted body "We logged the error on our side. Retrying usually works — if it keeps failing, refresh the page or switch views.", and a pill "Retry" with a RotateCcw glyph.

**Interactions.** Switching tabs is instant colour-only motion (transition-colors, no layout shift). Within the tab: "Explain this verdict" (Fusion), "AI read" (Sentiment), "Run analysis" / "Re-run" (Chart vision), "See plans" and "Run debate" links (Dossier).

**Responsive.** Below lg every row collapses to one column at 16px gap. The two-up becomes stacked; the three-up becomes stacked. TechnicalsPanelCard's internal grid is 1-col below md and 3-col at md and up. TabsList scrolls horizontally on narrow screens (overflow-x-auto, whitespace-nowrap triggers).

**Key copy.** Tab labels "Engine Read" · "Why It Moves" · "Forecast". Strip title "AI engine read" with "· cached for today".

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark analytics tab body on #0D0D0E. Above it, a pill tab rail: a 9999px-radius container with a 1px #29292D border on #0D0D0E and 4px padding, holding three 14px medium tabs at 14px/6px padding — "Engine Read" active on a #151517 pill with #F7F7F8 ink and a soft shadow, "Why It Moves" and "Forecast" inactive at #96969E. 20px below, a 16px-gap vertical stack of opaque cards, each #151517 with a 1px #29292D hairline and 12px radius. First, a full-width strip with a #8FB0FF 25%-opacity border: a 3.5px sparkle glyph, "AI ENGINE READ" in 10px uppercase mono #8FB0FF, "· CACHED FOR TODAY" in 9px #96969E, and two lines of 13px body copy in #F7F7F8 reading like a portfolio manager's note on RELIANCE. Then a two-column row: left card "Fusion verdict" showing "Constructive" at 20px in #10B981, a right-aligned "68 / 100", a 6px progress track, and a 6-row factor list; right card "AI Dossier" with a 3px green left edge, three small engine tiles with meter bars, and a factor scoreboard. Then one wide 3-column technicals panel: Oscillators, Moving averages, Support & resistance with ₹-prefixed levels in #10B981 and #F5808C. Then a three-column row: Relative Strength with a 260×44 sparkline, Sentiment with three centred tiles, Volume Intelligence with 20 volume bars. Finish with a wide "Chart vision" card carrying an amber "ELITE" chip. All numerics in tabular mono.
```
</details>

---

## `/stock/[symbol]?tab=why` — Tab body — Why It Moves

**File** `/Users/rishi/QuantX/frontend/app/stock/[symbol]/page.tsx` · **17 LOC** · **Access** Public endpoints. News Intelligence is the only card in this tab that requires an authenticated request (no auth:false on api.screener.newsIntelligence).

**Shell** — Same AI-tabs section and pill rail as the Engine Read tab; TabsContent value="why" with pt-5.

**Purpose.** Grounded move attribution. A day-cached AI strip, the user-triggered "Why is X moving?" accordion, and the multi-source news intelligence card (aggregate mood was folded INTO News Intelligence on 2026-07-21, so NewsMoodCard no longer renders here).

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Content stack** | <div class="space-y-4"> — three blocks, all full width, no grid. |
| 2 | **1 · TabAiRead** | title="AI move read"; narrative from api.screener.whyMoving(symbol, true).narrative. ErrorBoundary label "AI move read". Hides completely when empty. |
| 3 | **2 · WhyMovingCard** | Collapsed accordion — a full-width click target reading "Why is RELIANCE moving?" with an "Ask AI" affordance. ErrorBoundary label "Why moving". |
| 4 | **3 · NewsIntelligenceCard** | The tallest block: mood headline, materiality-weighted score, provider chips, event chips, and up to 6 deduped stories. ErrorBoundary label "News Intelligence". |

**Components** — `TabAiRead` · `WhyMovingCard` · `NewsIntelligenceCard` · `ErrorBoundary`

**States & data.** TabAiRead fires whyMoving(symbol, true) on mount (day-cached server-side). WhyMovingCard fires nothing until clicked — then whyMoving(symbol, true) again, so the first click is effectively instant off the same server cache. NewsIntelligenceCard uses SWR key `newsintel:${symbol}:` (dedupe 120 000 ms) and shows an explicit slow-path notice on a cold read.

**Interactions.** Clicking the WhyMoving header row runs the ask; the label flips "Ask AI" → "Refresh" and a spinner replaces it while in flight. "What does this mean?" inside News Intelligence fetches the narrative and replaces the button with prose. Story titles open in a new tab (target=_blank rel=noopener noreferrer).

**Responsive.** Single-column at every breakpoint — nothing in this tab uses a grid, so it is identical from 360px to 1280px. Story meta rows wrap (flex-wrap) rather than truncate.

**Key copy.** "AI move read" · "Why is RELIANCE moving?" · "Ask AI" / "Refresh" · "No clear drivers in the data right now." · "Pulling and scoring multi-source headlines for RELIANCE — the first read can take up to a minute. It's cached after that."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark, single-column tab body at 1280px max width on #0D0D0E, with 16px gaps. Card surface #151517, 1px #29292D hairline, 12px radius. Block one: an AI strip with a #8FB0FF 25% border — sparkle glyph, "AI MOVE READ" 10px uppercase mono #8FB0FF, "· CACHED FOR TODAY" 9px #96969E, then 13px #F7F7F8 prose explaining that RELIANCE is up 1.11% on above-average delivery and a broker upgrade. Block two: a collapsed row card, 16px horizontal / 10px vertical padding — left a 14px blue sparkle plus "Why is RELIANCE moving?" in 12px semibold #F7F7F8, right "Ask AI" in 11px #8FB0FF. Block three: a taller "News intelligence" card with a 44px header row (newspaper glyph, 16px semibold title) above a #29292D hairline. Body: "Bullish" at 18px semibold #10B981 with "7 unique stories · 19 headlines deduped" at 12px #96969E on the left, and "+0.38" at 20px semibold #10B981 above "MATERIALITY-WEIGHTED" 10px uppercase #96969E on the right. Under that a 10px row "Sources:" with rounded #1E1E21 chips — google news, gdelt, yahoo — then "· 3 sentiment models". Then blue 10%-fill chips "Earnings ×2", "Analyst". Then six story rows, each a 6px coloured dot, a 13px #F7F7F8 headline with a tiny external-link glyph, and a 10px meta line: "Results · HIGH (red 15% fill) · Breaking · Economic Times · +2 more outlets · 3/3 agree". Timestamps read 15:42 IST.
```
</details>

---

## `/stock/[symbol]?tab=forecast` — Tab body — Forecast

**File** `/Users/rishi/QuantX/frontend/app/stock/[symbol]/page.tsx` · **19 LOC** · **Access** Public — probability and earnings-preview endpoints are auth:false.

**Shell** — Same AI-tabs section and pill rail; TabsContent value="forecast" with pt-5.

**Purpose.** Honest forward-looking framing: empirical base rates from the stock's own history plus an event preview. Deliberately NO fabricated price target — the comment in source says "base rates / scenarios, not a fabricated price target."

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Content stack** | <div class="space-y-4">. |
| 2 | **1 · TabAiRead** | title="AI forecast read"; narrative from api.screener.forecastRead(symbol, true).narrative. ErrorBoundary label "AI forecast read". |
| 3 | **2 · Two-up row** | grid grid-cols-1 gap-4 lg:grid-cols-2 → ProbabilityCard (left) \| EarningsPreviewCard (right). ErrorBoundary labels "Setup probabilities" and "Earnings preview". |
| 4 | **Sparsest tab** | Only two cards, and ProbabilityCard returns null when history is thin (needs ≥5 occurrences per setup), so on an illiquid symbol this tab can render as a single collapsed "Earnings preview" row — that emptiness is intentional and honest. |

**Components** — `TabAiRead` · `ProbabilityCard` · `EarningsPreviewCard` · `ErrorBoundary`

**States & data.** TabAiRead calls forecastRead(symbol, true) on mount. ProbabilityCard fetches once in a useEffect, filters setups to prob_pct != null && occurrences >= 5, and hard-returns null if none survive. EarningsPreviewCard is fully idle until clicked (it hits yfinance + the option chain), then optionally a second "Explain" click for the narrative.

**Interactions.** "Ask AI" on the earnings row loads deterministic drivers; a secondary "Explain" link fills the grounded narrative. Nothing else is clickable — the probability rows are read-only.

**Responsive.** Two-up at lg and above, stacked below. Both cards are short (≈140-220px), so at desktop widths this tab leaves visible page whitespace beneath.

**Key copy.** "AI forecast read" · "Setup Probabilities" · ">=2% within 10d" · "Active now" · "37 past occurrences" · "Historical base rates from this stock's own past — not a prediction." · "Earnings preview" · "No confirmed earnings date in the next 60 days."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark, sparse forecast tab on #0D0D0E at 1280px max width. Top: an AI strip card, #151517 with a #8FB0FF 25% border and 12px radius — sparkle glyph, "AI FORECAST READ" 10px uppercase mono #8FB0FF, "· CACHED FOR TODAY" 9px #96969E, then 13px #F7F7F8 prose framing base rates and structure for RELIANCE without naming a price target. 16px below, a two-column row with a 16px gap. Left card "Setup Probabilities": 44px header with a percent glyph in #8FB0FF, 12px semibold title, and right-aligned 10px #96969E meta ">=2% WITHIN 10D", above a #29292D hairline. Then three rows separated by 1px #29292D dividers, each 16px/10px padded: left a 12px capitalised setup name — "breakout", "oversold bounce", "uptrend continuation" — with a tiny blue 10%-fill pill "ACTIVE NOW" on the first, and a 10px #96969E sub-line "37 past occurrences"; right a big 18px semibold tabular figure — 64% in #10B981, 51% in #F0A94F, 38% in #F5808C. Footer strip: 9px #96969E "Historical base rates from this stock's own past — not a prediction." Right card "Earnings preview": a single collapsed 16px/10px row — calendar glyph in #8FB0FF, 12px semibold "Earnings preview", right-aligned 11px #8FB0FF "Ask AI" — with 11px #96969E copy beneath reading "No confirmed earnings date in the next 60 days." Everything opaque, no blur.
```
</details>

---
