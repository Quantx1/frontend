# QUANT X — AS-BUILT DEFECTS & INCONSISTENCIES

> Found while extracting the inventory. These are **not** design decisions to
> reproduce — they are things the redesign should deliberately fix or consciously
> keep. Verified against source.

---

Findings:

## 1. Missing route files

**No `page.tsx` is missing** — all 54 are covered (the two uncovered files, `app/signals/momentum/page.tsx` and `app/signals/swing/page.tsx`, are 6-line `redirect()` stubs with no UI and are correctly folded into their targets). One correction: `redirect()` in an App Router server page emits **307**, not the 308 the inventory claims (`permanentRedirect()` would be 308).

**11 non-page route files are missing entirely:**
- `/Users/rishi/QuantX/frontend/app/portfolio/loading.tsx` + `error.tsx`
- `/Users/rishi/QuantX/frontend/app/settings/loading.tsx` + `error.tsx`
- `/Users/rishi/QuantX/frontend/app/stocks/loading.tsx` + `error.tsx`
- `/Users/rishi/QuantX/frontend/app/trades/loading.tsx` + `error.tsx`
- `/Users/rishi/QuantX/frontend/app/watchlist/loading.tsx` + `error.tsx`
- `/Users/rishi/QuantX/frontend/app/opengraph-image.tsx` (356 LOC, edge-rendered 1200×630 share card with live regime/signal data — a fully designed brand surface, not documented anywhere)

The 5 `loading.tsx` files are each **route-shaped skeletons with different compositions** (4-tile stat grid + 280px chart for portfolio; tab row + label/field pairs for settings; search bar + 8 rows for stocks; 6 tall cards for watchlist; 3 filter chips + 7 rows for trades). The inventory documents only 3 generic skeletons, so these bespoke shapes are unrecorded.

**Inconsistency in what *is* documented:** `app/(platform)/error.tsx`, `app/signals/error.tsx`, and `app/stocks/error.tsx` are byte-identical (md5 `5ce97828…`), and `portfolio/settings/trades/watchlist/error.tsx` differ only in Tailwind class order. Yet the inventory gives "Signals route error boundary — 8 zones / 309 words" and "Platform route error boundary — 6 zones / 216 words" for the same file. One canonical entry + a note listing all 7 mount points is correct.

## 2. Dynamic variants and middleware-created entry points

`middleware.ts` creates **three classes of broken user-visible entry points** the inventory doesn't record:

- **Redirects into 404s.** `/models`, `/track-record`, `/regime`, `/engines`, `/engines/*`, `/ai-intelligence` all 301 to `/proof…`, but **no `app/proof/` directory exists**. Same for `/models/<slug>` and `/track-record/<id>` prefix rules. `publicPaths` also whitelists `/pricing`, `/privacy`, `/terms` — none of which have pages. Every one lands on `app/not-found.tsx`.
- **Redirects landing on the wrong tab.** `/settings/security` → `/settings?tab=security`, `/settings/whatsapp` → `/settings?tab=channels`, `/login/mfa` → `/settings?tab=security`. Neither `security` nor `channels` is in `VALID_TABS`, so all three silently land on Profile. The source comment at `app/settings/page.tsx:70-77` confirms this is known and unfixed.
- **Redirects to a retired feature.** `/home` and `/activity` 301 to `/copilot` for the "Simple view band" — but `app/(platform)/copilot/page.tsx:1072` says "The Simple/Full toggle was retired", and `components/managed/SimpleView.tsx` (222 LOC, variants `home`/`portfolio`/`autopilot`) has **zero importers**. Dead code; the redirect promises a surface that no longer renders. Same for `/quantai-alpha-pick` and `/momentum` → `/strategies?filter=momentum`: `app/(platform)/strategies/page.tsx` never reads `filter`.

**Dynamic variants needing separate docs:**
- `/scanner/[screen]` and `/scanner/fundamental/[preset]` each have an unrecorded **"Screen not found" EmptyState** branch (`app/(platform)/scanner/[screen]/page.tsx:49-64`) for unknown slugs — 29 valid technical keys across 6 styles, 8 fundamental presets (`lib/prebuilt-screeners.ts`). Body layout is one template, so per-slug docs aren't needed, but the not-found state is a real screen.
- `/stock/[symbol]` documents 20 zones but has **3 tab bodies** (`Engine Read` / `Why It Moves` / `Forecast`, lines 544-640) each pulling different card sets from `components/stock/*` (17 cards, up to 446 LOC each). Only the default tab appears to be captured.

## 3. Uncaptured full-screen overlay surfaces

Six overlays are effectively screens and are absent from the inventory:

| File | LOC | Where it opens |
|---|---|---|
| `components/dashboard/QuickTrade.tsx` | 531 | `/signals/[id]` — primary order ticket, plus a separate mandatory confirm step |
| `components/CalculatorModal.tsx` | 469 | `/signals/[id]`, `/paper-trading` — two modes (`planner`, `position`) |
| `app/watchlist/_components/AlertEditModal.tsx` | 459 | `/watchlist` via `WatchCard` |
| `components/trade/TradeTicketButton.tsx` | 133 | `/portfolio`, `/stock/[symbol]`, `/watchlist`, `SignalsOverview` — the app's main order-entry sheet, on 4+ surfaces |
| `components/CopilotQuotaModal.tsx` | 143 | globally, mounted in `GlobalCopilot`; the quota-exhausted upsell |
| `components/broker/BrokerLock.tsx` | 103 | `/autopilot`, `BrokerPositionsPanel`, inside `QuickTrade` — the no-broker gate overlay |

Also uncaptured: the **Pro paywall states**, which are per-surface rather than a shared component — `app/alerts/page.tsx` (explicit paywall instead of a 403), `app/signals/[id]`, `app/stock/[symbol]`, `app/watchlist`, `components/charts/LightweightChart.tsx`, `app/settings/_components/TierPanel.tsx` (307 LOC). Stitch needs these as a named locked-state pattern.

## 4. Under-documented relative to implementation

No entry has fewer than 5 zones, so the literal test finds nothing. By zones-per-LOC, four entries are materially compressed:

- **`/settings` — 22 zones for 1654 LOC + 4 extracted panels.** Ten sections (`profile`, `broker`, `trading`, `appearance`, `notifications`, `whatsapp`, `security`, `tier`, `kill_switch`, `data`) plus five distinct broker credential forms (Angel/Dhan/Kotak/Alice + Zerodha OAuth), each a different field set. `_components/WatchlistPinsPanel.tsx` (376), `TierPanel.tsx` (307), `KillSwitchPanel.tsx` (237), `DataPanel.tsx` (86), `ModePanel.tsx` (80) are all separate surfaces folded into one entry. Should be ~10 entries.
- **`/fno` — 11 zones for 6 deep-linkable tabs.** `FNO_HUB_TABS = ['overview','analysis','stocks','oi','payoff','lab']`. Only `overview` and `?tab=lab` are documented. Missing: Analysis (`DerivativesAnalysis.tsx`, 597 LOC), Stock Scanners (`FnoStockScanners.tsx`, 148 + `FnoTab.tsx`, 376), OI Tracker (`OiHeatmap.tsx`, 157), Payoff Calc (`PayoffCalculator.tsx`, 287).
- **`/fno?tab=lab` — 20 zones for `FoStrategiesWorkspace.tsx` at 2558 LOC**, the largest file in the repo (recommendations, open positions with live MTM, close, adjust, closed book, chain+builder, AI-suggest, backtest — 8 distinct sub-surfaces).
- **`/trades/[id]` — 7 zones, 60 LOC page**, but the real surface is `components/journal/TradeReviewCard.tsx`; the page is a thin wrapper. Documented zone count reflects the wrapper, not the card.

## 5. Shell coverage gap (affects redesign scope)

Only 10 pages mount `AppShell` directly and one route group (`app/(platform)/layout.tsx`) mounts it for its 12 children. **Everything else renders shell-less** — no sidebar, right rail, or compliance footer. Most notably `/stock/[symbol]` (703 LOC) renders a bare `<div className="min-h-screen bg-main">` with its own breadcrumb back to `/markets` (line 314-330), and `/preview-design` is in `PUBLIC_PREFIXES` so it is reachable unauthenticated in production. The inventory documents `AppShell` as "the authenticated frame" without recording which authed surfaces opt out of it.