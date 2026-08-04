# Screener & chart patterns

> Part of the Quant X as-built screen inventory — see [`../03-SCREEN-INVENTORY.md`](../03-SCREEN-INVENTORY.md)
> for the full index and [`../01-DESIGN-SYSTEM.md`](../01-DESIGN-SYSTEM.md) for every token used below.

**6 surfaces.**

## Family notes

SHARED SHELL — every route here renders inside app/(platform)/layout.tsx → AppShell: fixed LEFT sidebar (240px expanded / 68px collapsed, bg-wrap L1), fixed RIGHT icon rail 72px (bg-main L0), main pane with `lg:ml-60`/`lg:ml-[68px]` + `lg:mr-[72px]`, inner content `mx-auto w-full max-w-[1440px] px-4 md:px-6`. No desktop top bar; below `lg` a mobile Topbar opens MobileDrawer. Cmd/Ctrl+K opens CommandPalette. ComplianceFooter (statutory block: "© 2021–2026 Quant X Technologies Private Limited [entity to be confirmed]… Quant X is **not a SEBI-registered Research Analyst or Investment Adviser**… SEBI registration: [pending] · GSTIN: [pending]", plus SEBI/SCORES/NSE/BSE + Terms/Privacy/Disclaimer/Risk links) renders under every page automatically. layout.tsx also force-redirects to /onboarding/broker-connect if onboarding is incomplete — so ALL six screens are authed-only in practice.

SHARED PAGE SKELETON — five of the six screens follow the identical vertical rhythm: (1) optional back-link row `px-4 pt-4 md:px-6` reading "All screeners" with a 12px ArrowLeft, 11px medium uppercase tracking-wider, ink #96969E → #D3D3D7 on hover; (2) `<PageHeader>` = `border-b` hairline + `px-4 py-5 md:px-6`, flex-col below md / flex-row items-end justify-between at md+, with mono 11px uppercase tracking-[0.1em] eyebrow, an h1 at `text-display-sm` (40px/1.1, -0.02em, font-weight 400 — NOT 600), a 14px secondary description, and a right-hand wrap of action buttons; (3) body wrapper `space-y-5 px-4 py-5 md:px-6` (the gallery uses space-y-8, /patterns uses space-y-6); (4) `<DisclaimerFooter>` — centered 10px #96969E "For educational purposes. Not investment advice. Markets carry risk."; (5) `pb-8` on the outer div.

SHARED CARD/CONTROL VOCAB — Card = `rounded-md` (12px) + 1px #29292D border + bg-wrap (#151517), shadow-none by default, padding vars 20/16px. Section header strip inside a card = `flex items-center justify-between border-b border-line px-4 py-2.5` with a 14px primary-tinted lucide icon + 13px medium label on the left and a muted count Badge on the right. `.glass-control` = bg surface-2 + #29292D border (secondary buttons, filter chips); `.glass-control-accent` = solid #406AE4 fill, white ink, elev-1 (primary buttons, ACTIVE filter chips); `.glass-control-danger` = 12% down-tint. Radius names map: rounded-xs 6px · sm 8px · md 12px · lg 16px · full 9999px. Buttons: h-8/13px (md), h-7/12px (sm), rounded-sm 8px, font-semibold, active:scale-[0.98]. Badge = rounded-full px-2.5 py-0.5 12px medium; tone muted = bg-wrap-hover/#96969E, primary = bg-primary/10 + #8FB0FF ink, up/down = 10% tint of #10B981/#F5808C.

SHARED DATA BEHAVIOUR — the confluence engine cold-starts. Four screens implement identical warm-up polling: on a 503 whose message matches /not ready/i, retry every 8000ms up to 12 times while rendering the line "Warming the data engine — computing indicators across the NSE universe…" (12px #96969E) above the skeleton rows, instead of an error wall. Shared SWR keys: `scanner_stats_all` → GET /api/screener/scanner-stats (dedupe 600 000ms), `scanner_catalog` → GET /api/screener/v2/scanner-catalog (dedupe 600 000ms), `saved_scans` → GET /api/screener/saved-scans. All screen runs POST/GET /api/screener/power-confluence with `{scanners, min_hits, limit: 50}`.

SHARED COMPONENTS — RichScreenResults (results GenUI: 4 stat tiles + one recharts horizontal bar chart + 4-column sortable table) is reused verbatim by /scanner/[screen], /scanner/my/[id] and /scanner/new. WinRateGauge (self-contained SVG semicircle) is used at size 64 in the gallery cards and size 88 on the screen-detail performance card. `dispatchCopilotOpen(prompt)` fires the ONE global Copilot dock with a pre-filled, page-context prompt — there is no embedded chat on any of these screens.

NO TIER GATES — /scanner renders a tier Badge ("FREE" / "PRO" / "ELITE", or "Admin" when `is_admin`) but no screener content is gated; every prebuilt, fundamental and pattern screen runs for all tiers. The scanner API calls all pass `auth: false`; only saved-scans CRUD requires a session. FnoTab.tsx also lives in components/scanner/ but is imported only by /fno — it is NOT part of this route group.

GALLERY INVENTORY (memorise for redesign): 29 prebuilt technical screeners across 6 style sections + 8 fundamental presets + N user screens. Every card is a whole-card `<Link>`, `grid-cols-[1fr_auto]`, rounded-sm (8px), border #29292D, bg-wrap, p-4, with a hover state of border→#96969E at 40% and bg→wrap-hover, and an ArrowRight that fades 0→100% opacity on group hover.

---

## `/scanner` — Screener gallery (screen library)

**File** `app/(platform)/scanner/page.tsx` · **124 LOC** · **Access** authed (layout redirects to /onboarding/broker-connect when onboarding is incomplete). Tier is fetched and displayed as a Badge — 'FREE' | 'PRO' | 'ELITE', or 'Admin' when is_admin — but NO content on this page is tier-gated. Falls back to 'free' if the tier call fails.

**Shell** — (platform) AppShell — fixed 240/68px left sidebar, 72px right icon rail, content capped max-w-[1440px] with px-4 md:px-6 gutters; ComplianceFooter appended by the shell

**Purpose.** The entry point to the whole screening product: a curated library of named NSE setups grouped by trading style, each carrying its real out-of-sample win rate so the trader can judge a screen before opening it. The user comes here to pick a screen to run today, resume one of their own AI-generated screens, or start building a new one. It concludes: "here is the setup worth looking at, and here is how it has actually performed."

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page wrapper** | `<div className="w-full pb-8">` inside the shell's 1440px cap. Whole page wrapped in `<Suspense>` with a PageSkeleton fallback (p-4 md:p-6: a 40%×32px bar, then 100%×40px and 100%×200px bars, spaced 12px). |
| 2 | **PageHeader** | border-b hairline #29292D, px-4 py-5 md:px-6, stacks below md / row-with-items-end at md+. Eyebrow: mono 11px uppercase tracking-[0.1em] #96969E — "Screener". H1: text-display-sm 40px/1.1 -0.02em font-weight 400, truncate — "Find the setup. Skip the noise.". Description: 14px #D3D3D7 — "The screens Indian traders run most — grouped by style, with each screen's real historical record. Open one for live matches, or ask the Copilot for anything custom." |
| 3 | **Header actions (3 items, right, wrap)** | 1) DataBadge mode="eod": rounded-full 1px #29292D border, px-2 py-0.5, 10px medium #96969E, 12px Clock icon, label "EOD research", tooltip "End-of-day research data — delayed, not live. Connect a broker for live data.". 2) Tier Badge tone=primary: rounded-full pill, bg #406AE4 at 10%, ink #8FB0FF, 12px medium. 3) "Create with AI" Link styled .glass-control-accent: h-9, rounded-full, px-4, 13px font-semibold, white ink on #406AE4, 16px Sparkles icon, active:scale-[0.97]. |
| 4 | **Body container** | `space-y-8 px-4 py-5 md:px-6` — 32px between the four stacked sections. Each section wrapped in `<Reveal>` (framer-motion fade-up: opacity 0→1, y 10→0, 450ms, cubic-bezier(.16,1,.3,1)) with staggered delays 0.03 / 0.05 / 0.06 / 0.07s. |
| 5 | **Create-with-AI banner (Reveal 0.03s)** | Full-width `<Link href="/scanner/new">`, flex items-center gap-4, rounded-md 12px, 1px #29292D border, bg-wrap #151517, p-4. Left: 40×40 rounded-sm 8px tile, bg #406AE4 at 10%, 20px Plus glyph in accent. Middle: title 14px font-semibold #F7F7F8 "Create a screen with AI"; sub 12.5px #96969E "Describe any setup in plain English — QuantX builds editable rule blocks, previews the matches, and saves it to run for you.". Right: 16px ArrowRight #96969E that translates +2px on group hover. Hover: border→wrap-line, bg→wrap-hover. |
| 6 | **My screens section (Reveal 0.05s) — conditional** | Renders ONLY when the user has ≥1 saved scan; returns null entirely when the list is empty and not loading (no empty state on this page). H2 15px font-semibold "My screens"; sub 12.5px #96969E "Screens you created — running on a schedule, alerting your inbox." |
| 7 | **My screens grid** | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5` (10px). Each tile: whole-card Link to /scanner/my/[id], `grid-cols-[1fr_auto]` items-center gap-3, min-h-[92px], rounded-sm 8px, 1px #29292D, bg-wrap, p-4. Left: name 13.5px font-semibold truncate + hover-revealed 14px ArrowRight. Meta line, Geist Mono 10.5px #96969E: "3 blocks · match ≥2 · 11 last run" (singular "block" at 1; the last-run clause only when last_hit_count is a number). Right pill: rounded-full px-2 py-1 10px — enabled = bg #10B981/10 + #10B981 ink + 12px Bell, paused = bg #29292D + #96969E ink + 12px BellOff; label is the schedule with underscores→spaces: "hourly" \| "open close" \| "every 15min" \| "manual"; title attr "Alerts on"/"Alerts paused". |
| 8 | **Prebuilt screeners — 6 style sections (Reveal 0.06s)** | `space-y-8` between sections. Section head: H2 15px font-semibold + 12.5px #96969E tagline. Exact sections in order: "Intraday" / "Same-day moves — volume, momentum and range breaks." (5 cards) · "Swing" / "Multi-day setups — the retail sweet spot." (5) · "Momentum" / "Ride relative strength and fresh trends." (5) · "Breakout" / "Bases, coils and new highs." (5) · "Reversal" / "Turns off oversold and support." (4) · "Positional & Smart-money" / "Longer holds and institutional footprints." (5). TOTAL 29 tiles. |
| 9 | **Prebuilt screener tile** | `grid-cols-[1fr_auto]` items-center gap-3, min-h-[104px], rounded-sm 8px, 1px #29292D, bg-wrap, p-4, hover border→#96969E/40 + bg-wrap-hover. Left column space-y-1: name 13.5px font-semibold truncate + fade-in ArrowRight; blurb 11.5px #96969E `line-clamp-2`; when stats exist (total_hits ≥ 10) a mono 10.5px #96969E stat line "10d hold · +2.4% avg · 143 signals" (days from bestHold, avg return 1dp with explicit +, total_hits). RIGHT RAIL IS A FIXED 64px COLUMN so gauges never misalign. |
| 10 | **WinRateGauge (in every prebuilt tile)** | Self-contained SVG, width 64px, height = radius+pad+16. Semicircular arc, strokeWidth 5, round caps: background arc in #29292D, value arc in #10B981 when win rate ≥50% else #96969E. Centered number at fontSize size*0.24 (≈15.4px), weight 650, tabular-nums, fill #F7F7F8 — e.g. "64%". Caption below baseline: 7.5px, letter-spacing 0.08em, uppercase #96969E — "WIN RATE". aria-label "Historical win rate 64 percent". When a screen has no history the 64px rail instead renders a 48px-tall centered 9px uppercase muted label "no history". |
| 11 | **Fundamental section (Reveal 0.07s)** | H2 15px font-semibold with a 16px Coins icon in #406AE4 — "Fundamental"; sub 12.5px #96969E "Screen by the numbers that matter to investors — valuation, quality, growth and dividends." Grid 1/2/3 cols gap-2.5, 8 tiles, min-h-[92px], same tile chrome as above but NO gauge rail: name 13.5px semibold + hover ArrowRight, blurb 12px #96969E. |
| 12 | **Fundamental preset tiles (8, verbatim)** | Low PE Value / "Profitable names at a low price-to-earnings multiple." · High ROCE Quality / "Efficient capital allocators — ROCE above 20%." · Quality Compounder / "High ROCE and ROE with growing profit." · High Growth / "Sales and profit both growing above 15%." · Dividend Payer / "Dividend yield above 2% with positive profit growth." · Promoter-Backed / "Promoter holding above 55% — high conviction." · Top Quality Score / "Ranked by our 0-5 Quality Score." · Low Debt / "Conservative balance sheets — D/E below 0.3." |
| 13 | **DisclaimerFooter** | Centered 10px #96969E, pt-1 pb-2 — "For educational purposes. Not investment advice. Markets carry risk." |
| 14 | **ComplianceFooter (from AppShell)** | border-t hairline, px-4 md:px-6 py-8, 11px micro type, #96969E: copyright + CIN [pending], the "not a SEBI-registered Research Analyst or Investment Adviser" paragraph with that clause in #D3D3D7, SEBI/GSTIN placeholders, and two link rows (SEBI · SCORES · NSE · BSE / Terms of Usage · Privacy Policy · Disclaimer · Risk Disclosure). |

**Components** — `components/foundation/PageHeader.tsx` · `components/foundation/Badge.tsx` · `components/foundation/Skeleton.tsx` · `components/foundation/Reveal.tsx` · `components/foundation/DisclaimerFooter.tsx` · `components/common/DataBadge.tsx` · `components/scanner/PrebuiltScreeners.tsx` · `components/scanner/MyScreens.tsx` · `components/scanner/FundamentalScreeners.tsx` · `components/scanner/WinRateGauge.tsx` · `lib/prebuilt-screeners.ts (PREBUILT_STYLES, FUNDAMENTAL_PRESETS)` · `components/shell/AppShell.tsx` · `components/shell/ComplianceFooter.tsx`

**States & data.** Suspense boundary with PageSkeleton (40%×32px title bar, then 100%×40px + 100%×200px bars). Tier: `api.user.getTier()` → GET /api/user/tier in a useEffect, sets tier + is_admin; on failure silently sets 'free'; the Badge is omitted until tier resolves. Prebuilt stats: SWR key 'scanner_stats_all' → api.screener.scannerStats() (GET /api/screener/scanner-stats), revalidateOnFocus false, dedupingInterval 600 000ms; keyed into a Map by scanner_id; a tile shows a gauge ONLY when stats exist AND total_hits ≥ 10, otherwise the "no history" placeholder — there is no loading skeleton for the gauge, it simply appears. My screens: SWR key 'saved_scans' → GET /api/screener/saved-scans; while isLoading the section header renders with an empty grid; when the resolved list is empty the whole section unmounts. The fundamental section is fully static (constants from lib/prebuilt-screeners.ts) — no fetch, no loading state. No polling, no live prices anywhere on this page — the DataBadge explicitly declares EOD.

**Interactions.** Pure navigation surface — no tabs, no filters, no modals, no sort. Every tile is a whole-card link: prebuilt → /scanner/[key], saved → /scanner/my/[id], fundamental → /scanner/fundamental/[preset]. Two routes to the generator (header pill + full-width banner) both → /scanner/new. Hover on any tile: border lightens to #96969E/40, background steps to wrap-hover, and the trailing ArrowRight fades from opacity 0 to 1 (banner arrow also slides +2px). Header CTA presses to 0.97 scale. Cmd/Ctrl+K opens the global CommandPalette; the global Copilot dock is reachable via the right rail — there is no inline chat here.

**Responsive.** PageHeader: title block and action row stack vertically below md (gap 16px), become a single justify-between row with items-end at md+. All three tile grids: 1 column below sm, 2 columns sm→lg, 3 columns at lg+, constant 10px gap. Gutters px-4 below md, px-6 at md+. Below lg the left sidebar and 72px right rail disappear and the mobile Topbar (hamburger → MobileDrawer) appears; content becomes full-bleed within the 16px gutters. Card min-heights (104px / 92px) hold across breakpoints so rows stay even. Nothing scrolls horizontally.

**Key copy.** - Eyebrow: "Screener"
- H1: "Find the setup. Skip the noise."
- Description: "The screens Indian traders run most — grouped by style, with each screen's real historical record. Open one for live matches, or ask the Copilot for anything custom."
- Header CTA: "Create with AI"
- Banner: "Create a screen with AI" / "Describe any setup in plain English — QuantX builds editable rule blocks, previews the matches, and saves it to run for you."
- "My screens" / "Screens you created — running on a schedule, alerting your inbox."
- Style taglines: "Same-day moves — volume, momentum and range breaks." · "Multi-day setups — the retail sweet spot." · "Ride relative strength and fresh trends." · "Bases, coils and new highs." · "Turns off oversold and support." · "Longer holds and institutional footprints."
- Screener names (29): Volume Surge, Momentum Burst, Pivot Breakout, Squeeze Release, Top Gainers; Breakout from Consolidation, Pullback to EMA21, RSI Oversold Bounce, Bull Crossover (20/50 EMA), Power Setup; RS Leader, Trend Template, Bull Momentum, Fresh Trend Start, MACD Crossover; Breakout w/ Volume, Pre-Breakout Coil, VCP, 52-Week High, IPO Base Breakout; RSI Oversold (<30), Bullish Engulfing, PSAR Reversal, BB Squeeze Release; MA Stack Bullish, High Delivery %, FII + DII Buying, Long Buildup, Bulk Deals
- Fundamental section: "Fundamental" / "Screen by the numbers that matter to investors — valuation, quality, growth and dividends."
- Gauge caption: "WIN RATE"; no-stats placeholder: "no history"
- Data badge: "EOD research"
- Footer: "For educational purposes. Not investment advice. Markets carry risk."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark-mode web dashboard screen for an Indian (NSE) AI trading platform — a "screener library" gallery. Page canvas #0D0D0E; all cards #151517 with 1px #29292D hairline borders; text #F7F7F8 primary, #D3D3D7 secondary, #96969E muted. One accent: #406AE4 fill with white ink; accent text is #8FB0FF. Green #10B981 and red #F5808C ONLY for profit/loss numbers. Font: Geist sans, Geist Mono for all numerals with tabular figures.

Layout: 240px fixed left nav, 72px right icon rail, centered content capped at 1440px with 24px gutters. Top page header separated by a hairline: mono 11px uppercase letter-spaced eyebrow "SCREENER"; 40px/44px headline at -0.02em "Find the setup. Skip the noise."; a 14px muted sub-line about screens Indian traders run most. Right of the header: a small pill "EOD research" with clock icon, a blue-tinted pill "PRO", and a solid #406AE4 pill button "Create with AI" with a sparkle icon, radius 9999px, height 36px.

Below: a full-width 12px-radius banner card with a blue 40px tile + plus icon reading "Create a screen with AI". Then sections "My screens", "Intraday", "Swing", "Momentum", "Breakout", "Reversal", "Positional & Smart-money", "Fundamental" — each a 15px semibold heading plus 12.5px muted tagline over a 3-column grid (10px gap) of 8px-radius tiles, 104px tall. Each tile: 13.5px semibold screener name (Volume Surge, Breakout from Consolidation, VCP, 52-Week High, FII + DII Buying), a two-line 11.5px muted blurb, a mono 10.5px stat line "10d hold · +2.4% avg · 143 signals", and on the right a 64px semicircular green gauge reading "64%" over a tiny uppercase caption "WIN RATE". Finish with a centered 10px disclaimer: "For educational purposes. Not investment advice. Markets carry risk."
```
</details>

---

## `/scanner/[screen]` — Prebuilt screen detail (record + live matches)

**File** `app/(platform)/scanner/[screen]/page.tsx` · **262 LOC** · **Access** authed. No tier gate — the run itself is an unauthenticated engine call; only "Save as screen" needs a session. The performance card self-gates on data (needs ≥10 tracked signals), not on tier.

**Shell** — (platform) AppShell — same 240/68 + 72px rails, 1440px cap, ComplianceFooter appended

**Purpose.** The full record and today's live output for one curated NSE screen (e.g. "RSI Oversold Bounce"). The user comes to see whether the screen has a real historical edge and which names fired today, then either drills into a symbol, saves the screen for hourly alerts, or hands the match list to the Copilot. It concludes: "this setup wins X% over N days, and today these are its candidates."

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Back-link row** | `px-4 pt-4 md:px-6`, inline-flex gap-1: 12px ArrowLeft + "All screeners" at 11px font-medium uppercase tracking-wider #96969E, hover → #D3D3D7. Links to /scanner. |
| 2 | **PageHeader** | Eyebrow mono 11px uppercase tracking-[0.1em]: "Screener · Swing" (literal "Screener · " + the style label). Title = the screener name at text-display-sm 40px/1.1 weight 400 (e.g. "RSI Oversold Bounce"). Description = the screener blurb at 14px #D3D3D7 (e.g. "Oversold inside an uptrend — bounce candidates."). |
| 3 | **Header actions (2 buttons)** | 1) Button variant=secondary (.glass-control, h-8, rounded-sm 8px, 13px semibold, surface-2 fill + #29292D border): 14px Bell icon + "Save as screen", swapping to "Saving…" while the POST is in flight and disabled. 2) Button variant=ai (.glass-control fill, ink #8FB0FF): 14px Sparkles + "Ask Copilot". |
| 4 | **Body container** | `space-y-5 px-4 py-5 md:px-6` — 20px between the performance card, the results card and the disclaimer. |
| 5 | **Performance card (has-history state)** | Card rounded-md 12px / #29292D / bg-wrap; CardBody `p-4 flex flex-wrap items-center gap-x-8 gap-y-4`. Item 1 is an 88px WinRateGauge (same SVG; number ≈21px weight 650, caption "WIN RATE · 10D" at 7.5px uppercase 0.08em) — green arc at ≥50%, muted below. Items 2-6 are PerfStat blocks: label 9.5px font-medium uppercase tracking-wider #96969E over a 17px font-semibold mono tabular value. |
| 6 | **PerfStat values (exact 5, in order)** | "Avg return" → signed 2dp percent, ink #10B981 when ≥0 else #F5808C (e.g. "+2.41%"). "Median" → signed 2dp percent from median_return_10d_pct or _5d_pct matching the chosen hold, neutral ink #F7F7F8. "Max drawdown" → 1dp percent always in down ink #F5808C (e.g. "-4.8%"). "Signals" → integer total_hits (e.g. "143"). "Window" → "90d out-of-sample" (lookback_days + literal 'd out-of-sample'). |
| 7 | **Performance caveat** | `basis-full` full-width line at 10.5px leading-relaxed #96969E: "Historical record of every signal this screen fired, measured out-of-sample — not a guarantee. Raw screens are discovery tools; the gated strategies carry the real edge." |
| 8 | **Performance card (no-history state)** | Single 12px #96969E line replacing everything above: "No performance history yet for this screen — stats appear once it has fired at least 10 tracked signals." Triggered when stats are missing or total_hits < 10. |
| 9 | **Results card header** | CardBody p-0; strip `flex items-center justify-between border-b border-line px-4 py-2.5`: left = 14px ScanLine icon in #406AE4 + "Today's matches" at 13px font-medium #F7F7F8; right = Badge tone=muted showing the row count (only once rows resolve). |
| 10 | **Results — loading state** | `space-y-3 p-4`: optional warm-up line at 12px #96969E "Warming the data engine — computing indicators across the NSE universe…" then SIX full-width 34px-tall pulsing skeleton bars (bg #29292D/80, radius 6px). |
| 11 | **Results — error state** | EmptyState (recessed L2 well, rounded-md, p-10, centered): 44px circular icon well containing a 32px ScanLine, h3 16px/22px semibold "Couldn't run this screen", 14px secondary description = the raw API error, and a primary Button "Retry" that resets the retry counter and re-runs. |
| 12 | **Results — empty state** | EmptyState, no action button: "Nothing matched right now" / "Markets are quiet for this setup today. Save it as a screen and we'll alert you when names fire." |
| 13 | **RichScreenResults — stat tiles** | `p-4 space-y-4`; tile row `grid-cols-2 sm:grid-cols-4 gap-2`. Each tile rounded-lg 16px, 1px #29292D, bg-wrap, p-4: label 9px uppercase tracking-wider #96969E over an 18px font-semibold mono tabular value (13px when `small`). The four are: "Matches" (count), "Avg change" (signed 2dp %, up/down ink), "Breadth" ("12▲ 5▼"), "Top sector" (small type, truncated). |
| 14 | **RichScreenResults — chart** | One recharts horizontal BarChart in a rounded-lg 16px bordered panel with a 10px uppercase tracking-wider muted caption. If >1 distinct sector: caption "Matches by sector", top-8 sectors sorted desc, height = max(120, n×26)px, YAxis category width 96px with 11px muted ticks and no axis/tick lines, XAxis hidden, bars barSize 14 with radius [0,4,4,0] all filled #10B981, direct value LabelList to the right at 11px muted, tooltip "Matches: N names" on an 8px-radius wrap-coloured surface. Otherwise (single/absent sectors): caption "Top movers · change %", top 8 by absolute change re-sorted descending, diverging bars radius 2, fill #10B981 when ≥0 else #F5808C, YAxis width 92px, NO per-bar labels, tooltip "Change: +2.4%". If neither condition holds, no chart renders at all. |
| 15 | **RichScreenResults — data table** | `overflow-x-auto rounded-sm border border-line`; 13px table. Exactly FOUR columns: Symbol (left) · LTP · Change · RSI (all right-aligned). Header row: 10px uppercase tracking-wide #96969E, each label a sort button that appends a 12px ArrowUp/ArrowDown when active and turns #D3D3D7. Rows `divide-y divide-line`, hover:bg-hover. Symbol cell px-4 py-2.5: symbol in font-semibold #F7F7F8 wrapped in a Link to /stock/[symbol], with the sector appended at 11px #96969E. LTP: mono tabular #D3D3D7, rupee + Indian-grouped rounded integer ("₹2,946"). Change: mono, up/down ink, 12px inline arrow glyph + absolute value to 2dp + "%". RSI: mono #D3D3D7 rounded integer. |
| 16 | **Not-found route state** | When the slug matches no screener the entire page is replaced by `<div className="w-full p-6">` + EmptyState: 32px ScanLine, "Screen not found", "This screener doesn't exist (or was renamed).", and a .glass-control h-9 rounded-full px-4 13px pill link "Back to Screener". |
| 17 | **DisclaimerFooter** | Centered 10px #96969E "For educational purposes. Not investment advice. Markets carry risk." followed by the shell ComplianceFooter. |

**Components** — `components/foundation/PageHeader.tsx` · `components/foundation/Card.tsx (Card, CardBody)` · `components/foundation/Button.tsx (secondary, ai, primary)` · `components/foundation/Badge.tsx` · `components/foundation/EmptyState.tsx` · `components/foundation/Skeleton.tsx` · `components/foundation/Toast.tsx (sonner toast)` · `components/foundation/DisclaimerFooter.tsx` · `components/scanner/WinRateGauge.tsx` · `components/scanner/RichScreenResults.tsx` · `components/scanner/PrebuiltScreeners.tsx (bestHold helper)` · `components/copilot/CopilotProvider.tsx (dispatchCopilotOpen)` · `lib/prebuilt-screeners.ts (findScreener)` · `recharts (ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, LabelList, Tooltip)`

**States & data.** Slug resolved synchronously against the PREBUILT_STYLES constant via findScreener() — an unknown slug renders the not-found EmptyState with no network call. Stats: SWR 'scanner_stats_all' → GET /api/screener/scanner-stats, dedupe 600 000ms; the matching stat is found by `scanner_id === screener.scanners[0]`; bestHold() picks whichever of the 5d/10d win rates is higher and returns {days, wr, ret}. Matches: imperative `api.screener.powerConfluence({scanners, min_hits: 1, limit: 50})` fired in a useEffect on mount and on slug change, resetting rows to null first. WARM-UP: a 503 matching /not ready/i sets warming=true and re-invokes after 8000ms, up to 12 attempts (96s ceiling), rendering the warm-up copy above the skeletons; any other error, or exhaustion, drops to the error EmptyState with a Retry that zeroes the counter. Save: POST /api/screener/saved-scans {name, scanner_ids, min_hits: 1, schedule: 'hourly'} → sonner success toast titled "Saved" with description "{Screen name} will run hourly — alerts land in your inbox."; failure → error toast "Could not save" + API message. No polling once loaded; prices are EOD.

**Interactions.** "Save as screen" POSTs and toasts (button disables and relabels "Saving…"). "Ask Copilot" builds a context prompt from the first 8 matched symbols — `Analyse today's "RSI Oversold Bounce" screen (Oversold inside an uptrend — bounce candidates.) — matches: RELIANCE, TCS, HDFCBANK… Which look strongest and why?` (or "none right now") — and dispatches it to the global Copilot dock; no inline chat opens on the page. Results table headers toggle sort: clicking a new column sorts descending (ascending for Symbol), clicking the active column flips direction. Symbol cells navigate to /stock/[symbol]. Chart bars show a hover tooltip with a 40%-opacity cursor fill; bars are not clickable. Retry button re-runs the engine. Back-link returns to the gallery.

**Responsive.** PageHeader stacks below md; the two action buttons wrap under the title. The performance card is `flex-wrap` — the 88px gauge plus five stat blocks reflow from one row to two or three on narrow viewports, with the caveat line always claiming its own full-width row (basis-full). The stat-tile row is 2 columns below sm and 4 columns at sm+. Charts use ResponsiveContainer width 100% with a height derived from row count, so they shrink horizontally rather than scroll. The results table is wrapped in `overflow-x-auto` — with only four columns it rarely scrolls, but the container is there. Gutters px-4 → md:px-6; the shell drops both rails below lg.

**Key copy.** - Back link: "All screeners"
- Eyebrow pattern: "Screener · {Style label}" e.g. "Screener · Swing"
- Actions: "Save as screen" / "Saving…" · "Ask Copilot"
- Perf labels: "Avg return", "Median", "Max drawdown", "Signals", "Window" (value "90d out-of-sample"); gauge caption "win rate · 10d"
- Caveat: "Historical record of every signal this screen fired, measured out-of-sample — not a guarantee. Raw screens are discovery tools; the gated strategies carry the real edge."
- No-history: "No performance history yet for this screen — stats appear once it has fired at least 10 tracked signals."
- Results header: "Today's matches"
- Warm-up: "Warming the data engine — computing indicators across the NSE universe…"
- Error: "Couldn't run this screen" + "Retry"
- Empty: "Nothing matched right now" / "Markets are quiet for this setup today. Save it as a screen and we'll alert you when names fire."
- Tiles: "Matches", "Avg change", "Breadth", "Top sector"; chart captions "Matches by sector" / "Top movers · change %"
- Table headers: "Symbol", "LTP", "Change", "RSI"
- Not found: "Screen not found" / "This screener doesn't exist (or was renamed)." / "Back to Screener"
- Save toast: "Saved" / "{name} will run hourly — alerts land in your inbox."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark web-dashboard detail page for one stock screener on an Indian NSE trading platform. Canvas #0D0D0E, cards #151517 with 1px #29292D borders and 12px radius, primary text #F7F7F8, secondary #D3D3D7, muted #96969E. Accent #406AE4 (fill, white ink) and #8FB0FF (accent text). Gains #10B981, losses #F5808C — numbers only, never chrome. Geist sans; Geist Mono tabular for every figure.

Top: a small uppercase back link "ALL SCREENERS" with a left arrow. Page header with mono 11px uppercase eyebrow "SCREENER · SWING", a 40px headline "RSI Oversold Bounce", a 14px muted line "Oversold inside an uptrend — bounce candidates.", and two right-aligned 32px-tall 8px-radius buttons: outlined "Save as screen" with a bell, and "Ask Copilot" with a sparkle in #8FB0FF.

First card, one horizontal row with 32px gaps: an 88px green semicircular gauge reading "64%" over caption "WIN RATE · 10D", then five stat blocks — tiny uppercase 9.5px labels over 17px mono values: Avg return +2.41% (green), Median +1.86%, Max drawdown -4.8% (red), Signals 143, Window 90d out-of-sample. Below them a full-width 10.5px muted caveat about out-of-sample results not being a guarantee.

Second card: a header strip "Today's matches" with a blue scan icon and a grey count pill "14". Inside: four 16px-radius stat tiles (Matches 14 · Avg change +1.82% green · Breadth 11▲ 3▼ · Top sector Financials), a horizontal green bar chart titled "MATCHES BY SECTOR" with sector labels on the left and value labels at the bar ends, and a four-column table — Symbol, LTP, Change, RSI — with rows RELIANCE ₹2,946 +1.84% 34, TCS ₹4,182 +0.96% 31, HDFCBANK ₹1,679 -0.42% 29, INFY ₹1,842 +2.31% 36. Footer: centered 10px "For educational purposes. Not investment advice. Markets carry risk."
```
</details>

---

## `/scanner/fundamental/[preset]` — Fundamental screen detail

**File** `app/(platform)/scanner/fundamental/[preset]/page.tsx` · **224 LOC** · **Access** authed. No tier gate; the fundamental endpoint is called with auth:false. Export buttons appear only when the result set is non-empty.

**Shell** — (platform) AppShell — 1440px cap, standard gutters, ComplianceFooter appended

**Purpose.** Runs one fundamentals preset (PE / ROE / ROCE / growth / dividend / promoter) against the fundamentals snapshot and lists the passing NSE names in a sortable ratio table. The investor comes here to compare valuation and quality metrics side by side, export the list to Excel or PDF, or send it to the Copilot. It concludes: "these companies clear this fundamental bar, ranked by quality."

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Back-link row** | px-4 pt-4 md:px-6 — 12px ArrowLeft + "All screeners", 11px medium uppercase tracking-wider #96969E → #D3D3D7 on hover, links to /scanner. |
| 2 | **PageHeader** | Eyebrow mono 11px uppercase tracking-[0.1em] — the literal "Screener · Fundamental". Title = preset name at 40px display-sm weight 400 (falls back to "Fundamental screen" for an unknown slug). Description = the preset blurb at 14px #D3D3D7, e.g. "Efficient capital allocators — ROCE above 20%." |
| 3 | **Header actions (up to 3)** | When rows.length > 0: Button secondary with 14px Download icon + "Excel" (title attr "Export to Excel/CSV") and Button secondary with 14px FileText + "PDF" (title "Download as PDF"). Always: Button variant=ai with Sparkles + "Ask Copilot" in #8FB0FF ink. |
| 4 | **Body container** | space-y-5 px-4 py-5 md:px-6 — results card, methodology note, disclaimer. |
| 5 | **Results card header** | Card p-0; strip flex justify-between border-b border-line px-4 py-2.5: 14px Coins icon in #406AE4 + "Matches" at 13px font-medium; right Badge tone=muted with the API `count` (rendered as soon as data arrives). |
| 6 | **Loading state** | space-y-3 p-4 with FIVE full-width 34px pulsing skeleton bars (radius 6px, bg #29292D/80). No warm-up copy on this route — the fundamentals store is not the confluence engine. |
| 7 | **Error state** | EmptyState with 32px ScanLine in a 44px circular well: "Couldn't run this screen" / "The fundamentals data engine is unavailable right now." No retry action button. |
| 8 | **Empty state (honest-empty)** | EmptyState: "Nothing matched" with a description that prefers the backend's `note` — rendered as "{note} — this screen will fill in once that data is ingested." — and otherwise reads "No stocks currently pass this fundamental filter." |
| 9 | **Fundamental table — header** | `overflow-x-auto` wrapper, 12.5px table, header row `border-b border-line` in #96969E. Column 1 "Symbol" left-aligned, font-medium, NOT sortable. Columns 2-8 are right-aligned mono font-medium sort buttons that append " ↑" or " ↓" when active and brighten to #F7F7F8 on hover: PE · ROCE · ROE · Profit Gr · Div Yld · M-cap · Quality. Eight columns total. |
| 10 | **Fundamental table — rows** | `border-b border-line/50`, last row borderless, hover:bg-wrap-hover. Symbol cell px-4 py-2: a Link to /stock/[symbol] in font-medium #F7F7F8 that turns #8FB0FF (AI ink) on hover. Value cells px-3 py-2, right-aligned, mono tabular, default ink #D3D3D7. Null values render an em-dash "—". |
| 11 | **Cell formats and conditional tones** | PE 1dp ("24.8"). ROCE 0dp + "%" ("27%") in #10B981 when ≥15, else #F7F7F8. ROE 0dp + "%". Profit Gr 0dp + "%", #10B981 when ≥0 else #F5808C. Div Yld 1dp + "%" ("1.4%"). M-cap via inrCrore: "₹1,45,678 Cr" with Indian grouping, switching to "₹18.34 L Cr" above 1,00,000 crore. Quality "4/5", in #10B981 when ≥4 else #F7F7F8. |
| 12 | **Default sort** | quality_score, descending (asc=false). Clicking the active header flips direction; clicking a new header sorts it descending first. Nulls sort as -Infinity. |
| 13 | **Methodology note** | Below the card, px-1, mono 10.5px #96969E: "Quality Score (0-5) is a transparent composite of ROCE, ROE, profit & sales growth, and promoter holding — not a Piotroski F-score (which needs statement-level data we don't ingest)." |
| 14 | **Export payload** | CSV/PDF share a 10-column schema wider than the on-screen table: Symbol, PE, ROE %, ROCE %, Profit Gr %, Sales Gr %, Div Yld %, Promoter %, M-cap (Cr), Quality ("4/5"). CSV filename `quantx_{preset}`; PDF is a printed report titled with the preset name and subtitled "{n} matches". |
| 15 | **DisclaimerFooter + ComplianceFooter** | Centered 10px "For educational purposes. Not investment advice. Markets carry risk.", then the shell's statutory block. |

**Components** — `components/foundation/PageHeader.tsx` · `components/foundation/Card.tsx (Card, CardBody)` · `components/foundation/Button.tsx (secondary, ai)` · `components/foundation/Badge.tsx` · `components/foundation/EmptyState.tsx` · `components/foundation/Skeleton.tsx` · `components/foundation/DisclaimerFooter.tsx` · `components/copilot/CopilotProvider.tsx (dispatchCopilotOpen)` · `lib/prebuilt-screeners.ts (findFundamentalPreset, FUNDAMENTAL_PRESETS)` · `lib/export.ts (downloadCsv, printReport)` · `lib/format.ts (inrCrore)` · `Local FundamentalTable (defined in-file)`

**States & data.** Single SWR call keyed ['fundamental', preset] → api.screener.fundamentalScreen(preset, 50) → GET /api/screener/fundamental?preset=…&limit=50, revalidateOnFocus false. Response shape {success, preset, name, count, note?, results[]} where each row carries symbol, pe, roe, roce, dividend_yield, sales_growth, profit_growth, promoter_pct, market_cap_cr, debt_to_equity, quality_score — every ratio nullable. The preset metadata (name + blurb) comes from the local FUNDAMENTAL_PRESETS constant, so the header renders instantly before the fetch resolves; an unrecognised slug still queries the API but titles the page "Fundamental screen" with no description. isLoading → 5 skeleton bars; error → the unavailable EmptyState; zero rows → the honest-empty state that surfaces the backend's `note` verbatim. No polling, no warm-up retry, no live prices — this is a snapshot store.

**Interactions.** Seven sortable column headers with a text-arrow indicator (" ↑" / " ↓") — client-side sort, default quality descending. Symbol cells navigate to /stock/[symbol] and tint #8FB0FF on hover; the rest of the row is not clickable, it only tints its background. "Excel" triggers a client-side CSV download of all 10 export columns; "PDF" opens a print-report window with the same columns, titled by preset and subtitled "{n} matches". "Ask Copilot" dispatches `Analyse my "High ROCE Quality" fundamental screen — top matches: RELIANCE, TCS, … Which look strongest and why?` (or "none") to the global dock. Back-link returns to the gallery.

**Responsive.** PageHeader stacks below md and the three action buttons wrap. The eight-column ratio table is the widest element on the route: it lives in an `overflow-x-auto` container and scrolls horizontally inside the card on narrow viewports — no columns are dropped and no card fallback exists, so the Symbol column scrolls out of view (it is NOT sticky here, unlike the foundation DataTable). Card, note and footers all reflow at full width. Gutters px-4 below md, px-6 above; both shell rails vanish below lg in favour of the Topbar + MobileDrawer.

**Key copy.** - Back link: "All screeners"
- Eyebrow: "Screener · Fundamental"
- Fallback title: "Fundamental screen"
- Actions: "Excel" (tooltip "Export to Excel/CSV"), "PDF" (tooltip "Download as PDF"), "Ask Copilot"
- Card header: "Matches"
- Error: "Couldn't run this screen" / "The fundamentals data engine is unavailable right now."
- Empty: "Nothing matched" / "{note} — this screen will fill in once that data is ingested." or "No stocks currently pass this fundamental filter."
- Column headers: Symbol · PE · ROCE · ROE · Profit Gr · Div Yld · M-cap · Quality
- Methodology: "Quality Score (0-5) is a transparent composite of ROCE, ROE, profit & sales growth, and promoter holding — not a Piotroski F-score (which needs statement-level data we don't ingest)."
- Export headers: Symbol, PE, ROE %, ROCE %, Profit Gr %, Sales Gr %, Div Yld %, Promoter %, M-cap (Cr), Quality

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark web-dashboard page showing one fundamental stock screen for the Indian NSE market. Canvas #0D0D0E; one card at #151517 with a 1px #29292D border and 12px corner radius. Text #F7F7F8 primary, #D3D3D7 secondary, #96969E muted. Accent #406AE4; accent/AI text #8FB0FF. Green #10B981 and red #F5808C strictly for financial values. Geist sans for prose, Geist Mono tabular for every number and every column header.

Top-left a tiny uppercase back link "ALL SCREENERS". Page header with a mono 11px uppercase eyebrow "SCREENER · FUNDAMENTAL", a 40px headline "High ROCE Quality", and a 14px muted line "Efficient capital allocators — ROCE above 20%." Right side: three 32px-tall 8px-radius buttons — outlined "Excel" with a download icon, outlined "PDF" with a document icon, and "Ask Copilot" with a sparkle in #8FB0FF.

Below, one card whose header strip shows a blue coin icon, the label "Matches", and a grey count pill "32" on the right. Inside, an eight-column dense table at 12.5px with a hairline header row in muted grey: Symbol left-aligned, then right-aligned mono sortable headers PE, ROCE, ROE, Profit Gr, Div Yld, M-cap, Quality — the active one (Quality) shows a small down arrow. Rows separated by faint hairlines, hovering tints the row: TCS 28.4 · 61% · 47% · 12% · 1.4% · ₹15,42,180 Cr · 5/5; RELIANCE 24.1 · 19% · 9% · 8% · 0.5% · ₹19,88,450 Cr · 4/5; HDFCBANK 18.6 · 16% · 17% · 21% · 1.2% · ₹12,74,300 Cr · 4/5; INFY 26.9 · 44% · 32% · -3% · 2.6% · ₹7,63,910 Cr · 4/5. ROCE values above 15 and Quality of 4+ render green; negative growth renders red. Under the card, a mono 10.5px muted note explaining the 0-5 Quality Score is a composite of ROCE, ROE, growth and promoter holding — not a Piotroski F-score. End with a centered 10px disclaimer.
```
</details>

---

## `/scanner/my/[id]` — My saved screen (AI-generated screen detail + management)

**File** `app/(platform)/scanner/my/[id]/page.tsx` · **280 LOC** · **Access** authed and OWNER-ONLY — the saved-scans endpoints require a session and the page resolves the record by finding `id` inside the user's own list. No tier gate. If the list resolves and the id is absent, the whole page is replaced by a not-found EmptyState.

**Shell** — (platform) AppShell — 1440px cap, standard gutters, ComplianceFooter appended

**Purpose.** The detail page for a screen the user created with the AI generator: shows the compiled rule blocks, today's live matches in the same rich GenUI as the prebuilt pages, and the management controls (pause/resume alerts, delete). The user comes to check what fired, confirm the rules are what they meant, and control the alert schedule. It concludes: "your screen is running on this schedule and matched these names."

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Back-link row** | px-4 pt-4 md:px-6 — 12px ArrowLeft + "All screeners" at 11px medium uppercase tracking-wider #96969E. |
| 2 | **PageHeader** | Eyebrow mono 11px uppercase tracking-[0.1em] — literal "Screener · My screens". Title = the saved scan's name at 40px display-sm weight 400, rendering a single ellipsis character "…" while the list is still loading. Description (14px #D3D3D7) is composed: "Runs hourly · alerts on" or "Runs every 15min · alerts paused", with a trailing " · last run 3/8/2026, 4:15:22 pm" using en-IN locale formatting when last_run_at exists. Schedule underscores are replaced with spaces. |
| 3 | **Header actions (3, only once the scan resolves)** | 1) Button secondary with 14px Bell — label flips between "Pause alerts" (when enabled) and "Resume alerts" (when paused); disabled while busy. 2) Button variant=ai with Sparkles + "Ask Copilot" in #8FB0FF. 3) Button variant=ghost containing only a 14px Trash2 glyph tinted #F5808C — borderless until hover. |
| 4 | **Body container** | space-y-5 px-4 py-5 md:px-6 — rules card, results card, disclaimer. |
| 5 | **Rules card** | Card rounded-md 12px; CardBody `space-y-2 p-4`. Eyebrow: 10px font-medium uppercase tracking-wider #96969E — "The rules". Content: a flex-wrap gap-1.5 row of rule-block chips. While the scan is loading, a single 60%×28px skeleton stands in. |
| 6 | **Rule-block chip** | `inline-flex rounded-full` pill, 1px #29292D border, bg-main #0D0D0E (an inset tone, darker than the card), px-3 py-1.5, Geist Mono 12px, ink #F7F7F8. The label is resolved from the shared scanner catalog by id, falling back to the literal "Scanner 57" until (or unless) the catalog loads. When the screen has more than one block, a trailing 11px #96969E fragment reads "· match ≥2" (clamped to the block count). |
| 7 | **Results card header** | Identical strip to the prebuilt detail: border-b, px-4 py-2.5, 14px ScanLine in #406AE4 + "Today's matches" 13px medium, muted count Badge on the right. |
| 8 | **Results — loading** | space-y-3 p-4 with FIVE 34px skeleton bars, preceded by the warm-up line "Warming the data engine — computing indicators across the NSE universe…" at 12px #96969E when the engine is cold. |
| 9 | **Results — error** | EmptyState "Couldn't run this screen" with the raw API message as description and a primary "Retry" button that resets the attempt counter. |
| 10 | **Results — empty** | EmptyState "Nothing matched right now" with a schedule-templated description: "Markets are quiet for this setup today. It keeps running every hour — alerts land in your inbox." (the 'hourly' schedule is spelled "every hour"; other schedules print with underscores replaced by spaces). |
| 11 | **Results — populated** | RichScreenResults: the 4 stat tiles (Matches / Avg change / Breadth / Top sector) in a 2→4 column grid of 16px-radius bordered tiles, then either the green "Matches by sector" horizontal bar chart or the diverging "Top movers · change %" chart, then the 4-column sortable table Symbol · LTP · Change · RSI with rows linking to /stock/[symbol]. |
| 12 | **Delete confirmation Dialog** | Radix Dialog centered over a scrim: panel `w-full max-w-md rounded-sm` (8px) with a #29292D border, bg-wrap, p-5, soft shadow. Title 16px normal — "Delete this screen?". Body 13px leading-relaxed #D3D3D7 — "{screen name} and its alert schedule will be removed. This can't be undone." Footer row justify-end gap-2: Button ghost "Keep it" and Button danger (12% down-tint fill, #F5808C ink) "Delete screen" / "Deleting…" while busy. |
| 13 | **Not-found state** | When the saved-scans list resolves without the id, the page body is entirely replaced by `w-full p-6` + EmptyState: 32px ScanLine, "Screen not found", "This saved screen doesn't exist any more.", and a .glass-control h-9 rounded-full px-4 13px pill link "Back to Screener". |
| 14 | **DisclaimerFooter + ComplianceFooter** | Centered 10px educational disclaimer, then the shell's statutory block. |

**Components** — `components/foundation/PageHeader.tsx` · `components/foundation/Card.tsx (Card, CardBody)` · `components/foundation/Button.tsx (secondary, ai, ghost, danger)` · `components/foundation/Badge.tsx` · `components/foundation/Dialog.tsx` · `components/foundation/EmptyState.tsx` · `components/foundation/Skeleton.tsx` · `components/foundation/Toast.tsx (sonner)` · `components/foundation/DisclaimerFooter.tsx` · `components/scanner/RichScreenResults.tsx` · `components/copilot/CopilotProvider.tsx (dispatchCopilotOpen)` · `Local ScannerBlockChip (defined in-file)`

**States & data.** SWR key 'saved_scans' → GET /api/screener/saved-scans (revalidateOnFocus false); the record is located client-side by id, so this page shares its cache with the gallery's My-screens section and re-uses it after a mutate. Rule-chip names come from SWR 'scanner_catalog' → GET /api/screener/v2/scanner-catalog (dedupe 600 000ms), rendering "Scanner {id}" until resolved. Matches: api.screener.powerConfluence({scanners: scan.scanner_ids, min_hits: min(scan.min_hits||1, blocks), limit: 50}) fired once the scan record is available; the same 8000ms × 12-attempt warm-up retry on /not ready/i errors. Pause/resume: PATCH /api/screener/saved-scans/{id} {enabled: !enabled} then `mutate()` and a success toast ("Alerts paused" / "Alerts resumed"); failure toasts "Could not update". Delete: DELETE /api/screener/saved-scans/{id} → toast "Screen deleted" → router.push('/scanner'); failure toasts "Could not delete" and re-enables the controls. All three management actions share a single `busy` flag that disables the secondary, ghost and danger buttons together.

**Interactions.** Pause/Resume toggles the alert schedule in place and re-labels the button. The ghost trash button opens the confirm Dialog (Escape or scrim click cancels; "Keep it" dismisses; "Delete screen" performs the destructive call and navigates away). "Ask Copilot" dispatches `Analyse my "{screen name}" screen — matches today: RELIANCE, TCS, INFY… Which look strongest and why?` (or "none") to the global dock. Results table sorts by clicking any of the four headers (new column → descending, same column → flip; Symbol starts ascending). Symbol cells navigate to /stock/[symbol]. Rule chips are display-only on this page — editing rules happens in the generator. Retry re-runs the engine.

**Responsive.** PageHeader stacks below md; the three action buttons wrap onto their own row, keeping the ghost trash button at the end. Rule chips flex-wrap onto as many lines as needed. Stat tiles 2 columns below sm, 4 at sm+. Charts scale via ResponsiveContainer. The 4-column results table sits in `overflow-x-auto`. The Dialog is `max-w-md` and centers on all viewports (it does NOT become a bottom sheet on mobile). Gutters px-4 → md:px-6; shell rails hidden below lg.

**Key copy.** - Eyebrow: "Screener · My screens"
- Description pattern: "Runs hourly · alerts on · last run 3/8/2026, 4:15:22 pm" / "…· alerts paused"
- Actions: "Pause alerts" / "Resume alerts" · "Ask Copilot"
- Rules card eyebrow: "The rules"; multi-block suffix "· match ≥2"; chip fallback "Scanner 57"
- Results header: "Today's matches"
- Warm-up: "Warming the data engine — computing indicators across the NSE universe…"
- Empty: "Nothing matched right now" / "Markets are quiet for this setup today. It keeps running every hour — alerts land in your inbox."
- Error: "Couldn't run this screen" + "Retry"
- Dialog: "Delete this screen?" / "{name} and its alert schedule will be removed. This can't be undone." / "Keep it" / "Delete screen" / "Deleting…"
- Toasts: "Alerts paused", "Alerts resumed", "Screen deleted", "Could not update", "Could not delete"
- Not found: "Screen not found" / "This saved screen doesn't exist any more." / "Back to Screener"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark web-dashboard page for a user's own saved stock screener on an Indian NSE platform. Canvas #0D0D0E; cards #151517, 1px #29292D borders, 12px radius. Text #F7F7F8 / #D3D3D7 / #96969E. Accent #406AE4, AI text #8FB0FF, gains #10B981, losses #F5808C. Geist sans, Geist Mono tabular for numbers and rule chips.

Tiny uppercase back link "ALL SCREENERS" above a page header: mono 11px eyebrow "SCREENER · MY SCREENS", 40px headline "Oversold quality bounce", and a 14px muted status line "Runs hourly · alerts on · last run 03/08/2026, 4:15 pm IST". Right side: an outlined 32px-tall button "Pause alerts" with a bell, an "Ask Copilot" button with a sparkle in #8FB0FF, and a borderless icon button with a red trash glyph.

First card, small padding: a 10px uppercase muted label "THE RULES", then a wrapped row of pill-shaped mono chips at 12px with 1px #29292D borders on a darker #0D0D0E fill — "RSI Oversold", "Above 200 EMA", "Volume Surge" — followed by a small muted fragment "· match ≥2".

Second card: header strip with a blue scan icon, "Today's matches", and a grey pill "9". Inside: four 16px-radius stat tiles (Matches 9 · Avg change +1.24% in green · Breadth 7▲ 2▼ · Top sector Financials), a horizontal green bar chart headed "MATCHES BY SECTOR", and a four-column table Symbol / LTP / Change / RSI listing HDFCBANK ₹1,679 +0.84% 32, SBIN ₹842 +2.10% 29, INFY ₹1,842 -0.36% 35, TATAMOTORS ₹1,104 +1.62% 33.

Also show a centered 8px-radius confirmation modal, max width 448px: "Delete this screen?", a 13px body line about the alert schedule being removed permanently, and two buttons — ghost "Keep it" and a red-tinted "Delete screen".
```
</details>

---

## `/scanner/new` — AI screen generator (3-step builder)

**File** `app/(platform)/scanner/new/page.tsx` · **364 LOC** · **Access** authed. The compile and preview calls are unauthenticated; saving requires a session (POST /api/screener/saved-scans). No tier gate on the generator itself.

**Shell** — (platform) AppShell — 1440px cap, standard gutters, ComplianceFooter appended

**Purpose.** A progressive-disclosure wizard that turns a plain-English description of a setup into real, editable scanner blocks, previews the live matches, and saves the result as a scheduled screen. The user comes with an idea in words and leaves with a named screen running hourly with inbox alerts. It concludes: "here are the exact rules your sentence compiled to, here is what they match today, and it is now saved."

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Back-link row** | px-4 pt-4 md:px-6 — 12px ArrowLeft + "All screeners", 11px medium uppercase tracking-wider #96969E. |
| 2 | **PageHeader (no actions)** | Eyebrow mono 11px uppercase tracking-[0.1em] — "Screener · Create". Title 40px display-sm weight 400 — "Create a screen with AI". Description 14px #D3D3D7 — "Describe the setup you want. QuantX compiles it into real scanner blocks you can tweak, preview and save — it then runs on a schedule and alerts you." No action buttons in the header on this route. |
| 3 | **Body container** | space-y-5 px-4 py-5 md:px-6. Steps 2 and 3 are conditionally mounted — the page starts as a single card and grows downward as the user progresses (no stepper, no progress bar, no tabs). |
| 4 | **Step 1 card — Describe it** | Card rounded-md; CardBody `space-y-3 p-4`. Step eyebrow 10px font-medium uppercase tracking-wider #96969E — "1 · Describe it". Row `flex gap-2`: a textarea `rows=2 min-h-[64px] flex-1 resize-none rounded-sm` (8px) with a #29292D border on bg-main #0D0D0E, px-3 py-2.5, 13.5px ink #F7F7F8, placeholder at 60% muted "e.g. Oversold large caps bouncing on above-average volume", aria-label "Describe your screen", focus border → wrap-line, no focus ring. Beside it, bottom-aligned (`self-end`), a primary Button (.glass-control-accent, solid #406AE4, white ink, h-8, 8px radius) with a 14px Sparkles icon reading "Generate", swapping to "Compiling…" and disabling while in flight or when the textarea is empty. |
| 5 | **Example prompt chips (4)** | flex-wrap gap-1.5 row of .glass-control pills: rounded-full, px-3 py-1, 11.5px, ink #D3D3D7. Verbatim: "Oversold quality names bouncing in an uptrend" · "Breakouts on heavy volume near 52-week highs" · "Momentum leaders with fresh MACD crossovers" · "Institutional buying with long buildup in F&O". Clicking one fills the textarea (it does not auto-submit). |
| 6 | **Step 2 card — The rules (mounts after the first compile)** | CardBody space-y-3 p-4. Header row justify-between: step eyebrow 10px uppercase tracking-wider "2 · The rules — tweak freely" and, when the compiler reports a source, a Badge tone=muted reading "resolved via rules" / "resolved via llm" (the raw `source` string is interpolated). |
| 7 | **Step 2 — unrecognised state** | When the compiler returns zero blocks: a single 12.5px #96969E paragraph — "Couldn't map that to known setups — try terms like RSI, breakout, volume, momentum, 52-week high, oversold, FII buying. Or add blocks by hand below." The Add-block control below stays available. |
| 8 | **Step 2 — block chips** | flex-wrap gap-1.5 row. Each chip: `inline-flex items-center gap-1.5 rounded-full` pill, 1px #29292D, bg-main #0D0D0E, px-3 py-1.5, Geist Mono 12px, ink #F7F7F8, followed by a 12px X button (aria-label "Remove {block name}") that is #96969E and turns #F5808C on hover. Removing is instant, no confirm. |
| 9 | **Step 2 — control row** | `flex flex-wrap items-center gap-3 border-t border-line pt-3` holding three controls: the Add-block popover trigger, the match-≥N selector, and the right-aligned Preview button. |
| 10 | **Add block popover** | Trigger: Button secondary size=sm (h-7, 12px, .glass-control) with a 12px Plus + "Add block". Panel: rounded-sm 8px, #29292D border, bg-wrap, `max-h-80 w-80 overflow-y-auto p-2` (320px wide, 320px max height, internally scrolling), anchored bottom/start. Contents grouped by catalog category: a 9px font-medium uppercase tracking-wider #96969E category label per group, then full-width left-aligned item buttons at rounded-xs 6px, px-2 py-1.5, 12px #F7F7F8, hover bg-wrap-hover, each showing the scanner name plus its direction ("bullish"/"bearish") appended at 10px #96969E. Already-added items are disabled at 40% opacity. |
| 11 | **Match-≥N selector (only when >1 block)** | An 11px #96969E label "Match ≥", then circular toggle buttons for 1 / 2 / 3 (capped at the block count): `h-7 w-7 rounded-full` mono 12px, active = .glass-control-accent (solid #406AE4, white ink), inactive = .glass-control with #D3D3D7 ink, aria-pressed reflecting state. Trailing 11px #96969E label "of 4 blocks". |
| 12 | **Preview button** | `ml-auto` primary Button with a 14px ScanLine icon — "Preview matches", swapping to "Running…" and disabling while the scan is in flight or when there are no blocks. |
| 13 | **Step 3 card — Preview + save (mounts once previewing starts)** | CardBody p-0. Header strip `flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5`: left = 14px ScanLine in #406AE4 + "Preview" 13px medium + a muted count Badge once rows exist. Right = an Input at `h-8 w-56` (224px, 8px radius, #29292D border on wrap-hover fill, 14px ink) with placeholder "Name this screen" and aria-label "Screen name", plus a primary Button "Save screen" / "Saving…" that stays disabled until both a name and a result set exist. |
| 14 | **Step 3 — loading / empty / results** | Loading: space-y-3 p-4 with FOUR 34px skeleton bars, preceded by the warm-up line "Warming the data engine — computing indicators across the NSE universe…" when the engine is cold. Empty: EmptyState "No matches right now" / "The rules work — markets are just quiet for this setup today. Save it and we'll alert you when names fire." Populated: the full RichScreenResults block (4 stat tiles → sector or top-movers bar chart → 4-column sortable Symbol/LTP/Change/RSI table). |
| 15 | **DisclaimerFooter + ComplianceFooter** | Centered 10px educational disclaimer, then the shell's statutory block. |

**Components** — `components/foundation/PageHeader.tsx` · `components/foundation/Card.tsx (Card, CardBody)` · `components/foundation/Button.tsx (primary, secondary sm)` · `components/foundation/Input.tsx` · `components/foundation/Popover.tsx` · `components/foundation/Badge.tsx` · `components/foundation/EmptyState.tsx` · `components/foundation/Skeleton.tsx` · `components/foundation/Toast.tsx (sonner)` · `components/foundation/DisclaimerFooter.tsx` · `components/scanner/RichScreenResults.tsx` · `Native <textarea> (not a foundation primitive)`

**States & data.** Compile: api.screener.nlCompile(prompt) → GET /api/screener/v2/nl-compile?q=… returning {recognized, source, blocks:[{id,name}]}. On success blocks are stored, min_hits resets to 1, and the screen name is pre-filled with the first 60 characters of the prompt if empty; an unrecognised result stores an empty block array (which still mounts step 2 so the user can add blocks by hand). Failure toasts "Could not compile" with the API message. Catalog for the Add-block popover: SWR 'scanner_catalog' → GET /api/screener/v2/scanner-catalog (dedupe 600 000ms), grouped client-side by the `category` field. Preview: api.screener.powerConfluence({scanners: block ids, min_hits: min(minHits, blocks.length), limit: 50}) with the same 8000ms × 12-attempt warm-up retry on /not ready/i; terminal failure clears the previewing flag and toasts "Preview failed". Save: POST /api/screener/saved-scans {name, scanner_ids, min_hits, schedule:'hourly'} → success toast "Screen created" / "{name} runs hourly — alerts land in your inbox." then router.push(`/scanner/my/{id}`); failure toasts "Could not save". Compiling clears any prior preview rows.

**Interactions.** Textarea submits on Enter (Shift+Enter inserts a newline). Example chips populate the textarea on click. Block chips are removable via their X. The Add-block popover is a click-anchored dropdown grouped by category with disabled already-added rows. The Match ≥ control is a 3-way circular toggle group (aria-pressed) shown only when more than one block exists. Preview runs the engine and mounts step 3 in place. The name Input and Save button live in the preview card's header; Save is gated on a non-empty name AND a resolved result set, then navigates to the new screen's own page. Results table sorts by any of its four headers. Symbol cells navigate to /stock/[symbol]. Every failure path is a sonner toast, never an inline error banner.

**Responsive.** PageHeader stacks below md. In step 1 the textarea and Generate button stay side-by-side at all widths (`flex gap-2`, button bottom-aligned) — the textarea simply narrows. Example chips wrap freely. The step-2 control row is `flex-wrap`, so on narrow viewports the Add-block button, the match-≥N toggles and the Preview button drop onto separate lines (Preview keeps its `ml-auto` right alignment on whichever line it lands). The step-3 header is also flex-wrap, so the 224px name Input plus Save button move below the "Preview" label on small screens. The popover is a fixed 320×320px scrolling panel at every breakpoint (it does not become a sheet). Stat tiles 2→4 columns; results table in overflow-x-auto. Gutters px-4 → md:px-6.

**Key copy.** - Eyebrow: "Screener · Create"; Title: "Create a screen with AI"
- Description: "Describe the setup you want. QuantX compiles it into real scanner blocks you can tweak, preview and save — it then runs on a schedule and alerts you."
- Step labels: "1 · Describe it" · "2 · The rules — tweak freely"
- Placeholder: "e.g. Oversold large caps bouncing on above-average volume"
- Buttons: "Generate" / "Compiling…" · "Add block" · "Preview matches" / "Running…" · "Save screen" / "Saving…"
- Example chips: "Oversold quality names bouncing in an uptrend", "Breakouts on heavy volume near 52-week highs", "Momentum leaders with fresh MACD crossovers", "Institutional buying with long buildup in F&O"
- Source badge: "resolved via rules"
- Unrecognised: "Couldn't map that to known setups — try terms like RSI, breakout, volume, momentum, 52-week high, oversold, FII buying. Or add blocks by hand below."
- Match control: "Match ≥" … "of 4 blocks"
- Preview header: "Preview"; name field placeholder "Name this screen"
- Warm-up: "Warming the data engine — computing indicators across the NSE universe…"
- Empty: "No matches right now" / "The rules work — markets are just quiet for this setup today. Save it and we'll alert you when names fire."
- Toasts: "Could not compile", "Preview failed", "Screen created" / "{name} runs hourly — alerts land in your inbox.", "Could not save"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark web-dashboard "build a screener with AI" wizard for an Indian NSE trading platform — three stacked cards, no stepper bar. Canvas #0D0D0E; cards #151517 with 1px #29292D borders and 12px radius; text #F7F7F8 / #D3D3D7 / #96969E; accent #406AE4 with white ink; gains #10B981, losses #F5808C. Geist sans; Geist Mono for rule chips and all numbers.

Header: uppercase back link "ALL SCREENERS", mono 11px eyebrow "SCREENER · CREATE", 40px headline "Create a screen with AI", 14px muted sub-line about compiling plain English into real scanner blocks.

Card 1 — a 10px uppercase muted label "1 · DESCRIBE IT", a two-row 8px-radius textarea on a darker #0D0D0E fill with placeholder "e.g. Oversold large caps bouncing on above-average volume", and to its right a solid #406AE4 button "Generate" with a sparkle. Beneath, four small pill suggestion chips: "Oversold quality names bouncing in an uptrend", "Breakouts on heavy volume near 52-week highs", "Momentum leaders with fresh MACD crossovers", "Institutional buying with long buildup in F&O".

Card 2 — label "2 · THE RULES — TWEAK FREELY" with a small grey pill "resolved via rules" at the right. A wrapped row of mono pill chips each with a tiny × : "RSI Oversold", "Above 200 EMA", "Volume Surge", "Bull Momentum". Below a hairline: an outlined "+ Add block" button, then "Match ≥" with three 28px circular toggles 1 / 2 / 3 (2 filled blue) and the text "of 4 blocks", and a right-aligned solid "Preview matches" button.

Card 3 — header strip "Preview" with a grey count pill "11", a 224px name input placeholder "Name this screen", and a solid "Save screen" button. Inside: four 16px-radius stat tiles (Matches 11 · Avg change +1.47% green · Breadth 9▲ 2▼ · Top sector Financials) and a table Symbol / LTP / Change / RSI with RELIANCE ₹2,946 +1.84% 34, HDFCBANK ₹1,679 +0.62% 31, SBIN ₹842 -0.28% 36.
```
</details>

---

## `/patterns` — AI chart-pattern scanner

**File** `app/(platform)/patterns/page.tsx` · **46 LOC** · **Access** authed (platform layout). No tier gate — every scan and explain endpoint is called with auth:false, and the file's header comment explicitly notes this replaced a legacy Pro-gated flow. The LLM-narrated "AI thesis" is requested with useLlm=true and simply omitted from the drawer if the backend returns none.

**Shell** — (platform) AppShell — 1440px cap, px-4 md:px-6 gutters, ComplianceFooter appended. The page is a thin 46-line wrapper; virtually all anatomy lives in components/scanner/PatternsV2Tab.tsx (744 lines).

**Purpose.** A separate AI feature from the Screener: it stacks a chart-pattern rule engine, an ML breakout scorer, a market-regime gate and a volume confirm over the NSE universe, then explains each match. The trader comes to find pattern setups with entry/stop/target levels already computed, filter them by universe, timeframe, direction and sector, and open a per-symbol deep-dive explaining exactly why it matched. It concludes: "these symbols currently print a validated pattern, scored, with suggested levels and an evidence list."

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page wrapper + Suspense** | `<div className="w-full pb-8">` inside a Suspense whose fallback is a PageSkeleton (p-4 md:p-6: 40%×32px, then 100%×40px and 100%×240px bars). |
| 2 | **PageHeader** | Eyebrow mono 11px uppercase tracking-[0.1em] — "Chart Patterns". Title 40px display-sm weight 400 — "AI chart-pattern scanner". Description 14px #D3D3D7 — "Our pattern algorithm, an ML breakout scorer, a regime gate and volume confirm — stacked, then explained. Scores are model outputs, not trade recommendations." Actions: a single DataBadge mode="eod" pill ("EOD research", 12px Clock, rounded-full #29292D border, 10px muted). |
| 3 | **Body container** | `space-y-6 px-4 py-5 md:px-6` wrapping PatternsV2Tab then DisclaimerFooter. PatternsV2Tab itself is `space-y-4`. |
| 4 | **Filter strip** | `flex flex-wrap items-center gap-3 rounded-xs` (6px) with a 1px #29292D border on bg-wrap at 60% opacity, px-3 py-2. Three labelled toggle groups, each label at 10px font-semibold uppercase tracking-wider #96969E: UNIVERSE with four buttons — "Nifty 50" (default), "Nifty 100", "Nifty 500", "NSE All (~2,136)"; TIMEFRAME with three — "Daily" (default), "1H", "15M"; DIRECTION with three — "All" (default), "Bullish", "Bearish". Every toggle is `rounded-xs px-2 py-1 text-[11px]`; the active one is .glass-control-accent (solid #406AE4, white ink), inactive is .glass-control with #D3D3D7 ink. |
| 5 | **Filter strip — right cluster** | `ml-auto` group at 11px #96969E: an optional Badge tone=muted reading "regime · bullish", a mono status string reading "12 matches · 148/500 scanned" for streaming universes or "12 matches · 50 symbols" for the blocking path, then a single ghost icon button — a 14px Pause while a stream is running (aria-label "Stop scan"), otherwise a 14px RefreshCw (aria-label "Refresh") that spins while loading. |
| 6 | **Sector chip row (renders once the sector list loads)** | `flex flex-wrap items-center gap-1.5 rounded-xs` bordered strip on bg-wrap at 40%, px-3 py-2. Label "SECTOR" at 10px semibold uppercase. First pill "All (412)" (the tagged_count) which clears the selection; then one multi-select pill per sector with a non-zero count, e.g. "Financials (86)" where the count is mono 10px at 70% opacity. Pills are `rounded-full px-2.5 py-0.5 text-[11px]`; selected = .glass-control-accent, unselected = .glass-control. Selection is additive (toggle in/out) and only affects the streaming path. |
| 7 | **Streaming progress bar (only for Nifty 500 / NSE All)** | Two-part block. Status row at 10px #96969E: left reads "Scanning…" while live, "Complete" when done, "Cancelled" when aborted, with an appended " · 42s" elapsed once the stream reports it; right is mono "148/500 (30%)". Below, a full-width 4px-tall (h-1) rounded-full track at #29292D/30 with a #406AE4 fill whose width is the scanned percentage, transitioning over 300ms and pulsing while streaming. |
| 8 | **Results DataTable — chrome** | Foundation DataTable, ariaLabel "Chart pattern v2 matches", rendered as a `rounded-sm` (8px) bordered container on bg-wrap with `overflow-auto`. Sticky header at bg-wrap-hover, z-2, headers in Geist Mono 11px font-normal uppercase tracking-[0.08em] #96969E with a bottom hairline; sortable headers are buttons carrying a 12px ChevronsUpDown at 40% opacity when idle and ArrowUp/ArrowDown when active (right-aligned headers reverse the icon order). Rows `border-t border-line`, px-4 py-3, 14px #D3D3D7, cursor-pointer with hover/focus bg-wrap-hover and an inset #406AE4/40 focus ring; Enter and Space activate a row. |
| 9 | **Results DataTable — 11 columns** | 1 Symbol (sticky left, sortable) — 14px medium #F7F7F8 plus a 12px TrendingUp in #10B981 or TrendingDown in #F5808C. 2 Pattern — a Badge toned up/down/muted showing the pattern type with underscores replaced by spaces ("double bottom", "ascending triangle"). 3 Score (right, sortable) — mono, #10B981 at ≥0.70, #F7F7F8 at ≥0.50, #96969E below, printed to 2dp ("0.78"). 4 ML (right, sortable) — mono #D3D3D7 as a whole percent ("72%") or "—" when negative. 5 LTP (right, sortable) — "₹2,945.60" to 2dp. 6 Entry (right, hidden below sm). 7 Stop (right, hidden below sm) in #F5808C. 8 Target (right, hidden below sm) in #10B981. 9 R:R (right, sortable, hidden below sm) as "2.4:1". 10 Vol× (right, sortable, hidden below sm) as "1.8×", tinted #10B981 at ≥1.5. 11 an unlabelled right-aligned action column holding a ghost sm Button with a 14px Brain icon that opens the drawer (click is stop-propagated). |
| 10 | **Table states** | Loading renders 6 skeleton rows (first cell 60% wide, the rest 40%, 16px tall) — only while there are zero matches, so a streaming scan keeps appending rows instead of flashing back to skeletons. Empty renders an EmptyState with a 24px Sparkles: "No patterns matching the gates right now" / "Try a different universe, sector, or direction filter. The scanner requires rule quality ≥0.50, ML ≥0.35, regime-aligned, and volume confirm." Error replaces the table entirely with an EmptyState tone=error, 24px AlertTriangle, "Pattern scanner failed", the API message, and a primary "Retry" button. |
| 11 | **Methodology footnote** | 10px #96969E paragraph under the table: "Rule engine + an ML breakout scorer + regime gate + volume confirm." plus, on streaming universes only, " Streaming via Server-Sent Events — partial results appear as found." and always " Scores are raw model outputs — not trade recommendations." |
| 12 | **Explain drawer — shell** | Custom right-hand overlay (not the foundation Sheet): `fixed inset-0 z-50 flex justify-end` over a black 60% scrim; panel is full-height, `w-full max-w-md` (448px), overflow-y-auto, 1px left border #29292D, bg-main #0D0D0E, shadow-xl. Header row border-b px-4 py-3: 16px Brain in #406AE4 + the symbol at 16px semibold, and below it mono 11px #96969E "double bottom · 2026-08-01"; a 16px X close button on the right. Scrim click and the X both dismiss. |
| 13 | **Explain drawer — score chips** | `grid-cols-3 gap-2` of rounded-xs (6px) bordered tiles on bg-wrap, p-2, centered: 9px uppercase tracking-wider muted label over a mono 14px tabular percent. Labels: "Composite", "Quality", "ML score" ("—" when the model score is negative). Ink is #10B981 at ≥70%, #406AE4 at ≥50%, else #D3D3D7. |
| 14 | **Explain drawer — suggested levels** | Section label 10px semibold uppercase tracking-wider "Suggested levels". A rounded-xs bordered panel on bg-wrap, p-3, 12px: a 3-column grid of label/value stats — "Entry" ₹…, "Stop · {stop_basis}" in #F5808C, "Target · {target1_basis}" in #10B981 — then a border-t row at 11px muted with "Risk : Reward" on the left and a mono "2.4:1" on the right. An 80px skeleton stands in while loading. |
| 15 | **Explain drawer — why it matched** | Section label "Why it matched". A rounded-xs bordered list on bg-wrap, p-3, 12px, space-y-1.5: each row is a 6px round dot (#10B981 when the condition fired, #96969E when not) beside the indicator name in #F7F7F8, a mono 11px #D3D3D7 value that appends the operator and threshold when present ("1.82 >= 1.50"), and an optional 10px muted note beneath. Loading shows four 36px skeletons. |
| 16 | **Explain drawer — AI thesis + context** | When the backend returns a thesis: label "AI thesis" over a rounded-xs bordered paragraph on bg-wrap, p-3, 12px leading-relaxed #D3D3D7, followed by a 10px muted caption "Factual narration — not a trade recommendation." Then label "Pattern context" over a `grid-cols-2` rounded-xs bordered panel with four stats: "Height" ("6.4%"), "Duration" ("38 bars"), "Touches" (integer), "Regime" (or "unknown"). Any explain error renders as a rounded-xs box with a #F5808C/30 border, #F5808C/10 fill and #F5808C 12px text. |
| 17 | **Explain drawer — footer CTA** | A full-width primary Button (solid #406AE4, white ink) reading "Open chart" with a trailing 14px ChevronRight, wrapped in a Link to the stock page; clicking also closes the drawer. |
| 18 | **DisclaimerFooter + ComplianceFooter** | Centered 10px "For educational purposes. Not investment advice. Markets carry risk.", then the shell's statutory block. |

**Components** — `app/(platform)/patterns/page.tsx (thin wrapper)` · `components/scanner/PatternsV2Tab.tsx (filters, stream hook, table, drawer)` · `components/foundation/PageHeader.tsx` · `components/foundation/DataTable.tsx (+ Column type)` · `components/foundation/Badge.tsx` · `components/foundation/Button.tsx (ghost sm, primary)` · `components/foundation/EmptyState.tsx` · `components/foundation/Skeleton.tsx` · `components/foundation/DisclaimerFooter.tsx` · `components/foundation/ErrorState.tsx (via DataTable error slot)` · `components/common/DataBadge.tsx` · `lib/stock-href.ts (stockHref)`

**States & data.** TWO fetch paths chosen by universe. Blocking path (Nifty 50 / Nifty 100): SWR keyed ['patterns_v2_scan', universe, timeframe, direction, sectors] → GET /api/screener/patterns/v2/scan?universe=…&timeframe=…&direction=…&limit=50, keepPreviousData true, dedupe 120 000ms, revalidateOnFocus false; returns {regime, symbols_scanned, matches[], count}. Streaming path (Nifty 500 / NSE All): a custom useStreamingScan hook opens an EventSource on /api/screener/patterns/v2/scan/stream with universe, timeframe, sectors (comma-joined), direction and limit=100, and handles four named events — `start` (total + regime), `progress` (processed count), `match` (appends, de-duplicating on `symbol:pattern_type` keeping the higher composite_score, then re-sorting descending), and `done` (elapsed_s, status complete). Any filter change aborts the prior EventSource and restarts; the disconnect `error` event only surfaces as an error when the status is still 'streaming'. Sector chips: SWR 'patterns_v2_sectors' → GET /api/screener/patterns/v2/sectors (dedupe 300 000ms) returning universe_size, tagged_count and per-sector counts. Drawer: on open, api.screener.patternsV2Explain(symbol, true) → /api/screener/patterns/v2/explain/{symbol}, with a cancelled-flag guard so a fast re-open never renders stale data; each section renders only once its slice of the payload exists. Match rows carry symbol, pattern_type, direction, quality_score, ml_score, composite_score, entry_price, stop_loss, take_profit, risk_reward, detected_at, last_price, volume_ratio, regime_at_detection, pattern_height_pct, duration_bars, candle_confirmed_touches.

**Interactions.** Three single-select toggle groups (universe / timeframe / direction) and one multi-select sector chip row — every change cancels the in-flight scan and refetches. A Pause button aborts a live stream mid-scan; otherwise a Refresh button re-runs (spinning while loading). Sortable columns: Symbol, Score, ML, LTP, R:R, Vol× — three-state sort (asc → desc → cleared) with aria-sort on the header. Clicking anywhere on a row, or the Brain icon button in the last column, opens the right-hand explain drawer; rows are keyboard-activatable with Enter/Space and carry a focus ring. The drawer closes on scrim click, on the X, or by following "Open chart" to the stock page. No modals, no tabs, no drag, no chart interactions on this route.

**Responsive.** The filter strip and sector row are both `flex-wrap`, so the labelled toggle groups stack onto multiple lines on narrow viewports while the right-hand status cluster keeps its `ml-auto` position on whatever line it lands. DataTable is dual-rendered: at sm and above it is a real table inside an `overflow-auto` bordered container with a sticky header and a sticky left Symbol column; below sm the entire table is replaced by a stacked card list — one 8px-radius bordered card per match with the Symbol cell as the card title and every remaining visible column as a label/value row separated by hairlines. Five columns (Entry, Stop, Target, R:R, Vol×) are marked hideOnMobile and are dropped from both the table and the cards below sm, leaving Symbol / Pattern / Score / ML / LTP / action. The explain drawer is `w-full max-w-md`, so it covers the full viewport width on phones and caps at 448px on desktop. Progress bar and footnote are fluid.

**Key copy.** - Eyebrow: "Chart Patterns"; Title: "AI chart-pattern scanner"
- Description: "Our pattern algorithm, an ML breakout scorer, a regime gate and volume confirm — stacked, then explained. Scores are model outputs, not trade recommendations."
- Filter labels: "Universe", "Timeframe", "Direction", "Sector"
- Universe options: "Nifty 50", "Nifty 100", "Nifty 500", "NSE All (~2,136)"; Timeframes: "Daily", "1H", "15M"; Directions: "All", "Bullish", "Bearish"; sector reset pill "All (412)"
- Status: "12 matches · 148/500 scanned" / "12 matches · 50 symbols"; regime badge "regime · bullish"
- Progress: "Scanning…" / "Complete" / "Cancelled", "148/500 (30%)"
- Column headers: Symbol · Pattern · Score · ML · LTP · Entry · Stop · Target · R:R · Vol×
- Empty: "No patterns matching the gates right now" / "Try a different universe, sector, or direction filter. The scanner requires rule quality ≥0.50, ML ≥0.35, regime-aligned, and volume confirm."
- Error: "Pattern scanner failed" + "Retry"
- Footnote: "Rule engine + an ML breakout scorer + regime gate + volume confirm. Streaming via Server-Sent Events — partial results appear as found. Scores are raw model outputs — not trade recommendations."
- Drawer sections: "Suggested levels", "Why it matched", "AI thesis", "Pattern context"; stats "Entry", "Stop · {basis}", "Target · {basis}", "Risk : Reward", "Height", "Duration", "Touches", "Regime"; chips "Composite", "Quality", "ML score"
- Drawer caption: "Factual narration — not a trade recommendation."; CTA "Open chart"
- Data badge: "EOD research"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark web-dashboard screen: an AI chart-pattern scanner for the Indian NSE market, with a right-hand detail drawer. Canvas #0D0D0E; panels #151517 with 1px #29292D borders; text #F7F7F8 / #D3D3D7 / #96969E; accent #406AE4 with white ink; green #10B981 and red #F5808C for financial values only. Geist sans; Geist Mono, tabular, for every number and every table column header.

Header: mono 11px uppercase eyebrow "CHART PATTERNS", 40px headline "AI chart-pattern scanner", 14px muted sub-line about a rule engine plus ML breakout scorer plus regime gate, and a small "EOD research" pill at the right.

Below, a 6px-radius filter strip with three labelled groups of small 11px toggle buttons — UNIVERSE (Nifty 50, Nifty 100, Nifty 500, NSE All (~2,136)), TIMEFRAME (Daily, 1H, 15M), DIRECTION (All, Bullish, Bearish) — active buttons filled #406AE4. At the right: a grey pill "regime · bullish", mono text "12 matches · 148/500 scanned", and a refresh icon. A second strip of round sector chips: "All (412)", "Financials (86)", "IT (54)", "Auto (38)". Under it a 4px progress track at 30% filled blue with "Scanning… · 42s" and "148/500 (30%)".

Main: an 8px-radius bordered table with a sticky mono uppercase header row — Symbol, Pattern, Score, ML, LTP, Entry, Stop, Target, R:R, Vol×, and a trailing brain icon button. Rows: RELIANCE ▲ / double bottom (green pill) / 0.78 / 72% / ₹2,945.60 / ₹2,952.00 / ₹2,868.00 red / ₹3,104.00 green / 2.4:1 / 1.8×; TCS ▲ ascending triangle 0.71 · 65%; HDFCBANK ▼ head and shoulders 0.62 · 48%.

On the right, a 448px full-height drawer over a 60% black scrim: symbol title with a brain icon, three score chips (Composite 78%, Quality 71%, ML 72%), a "SUGGESTED LEVELS" panel with Entry/Stop/Target and "Risk : Reward 2.4:1", a "WHY IT MATCHED" bullet list with green dots and mono values, an "AI THESIS" paragraph, a 2×2 "PATTERN CONTEXT" grid, and a full-width blue "Open chart" button.
```
</details>

---
