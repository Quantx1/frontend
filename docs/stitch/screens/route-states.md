# Route-level loading / error / 404 / share-card surfaces

> Part of the Quant X as-built screen inventory — see [`../03-SCREEN-INVENTORY.md`](../03-SCREEN-INVENTORY.md)
> for the full index and [`../01-DESIGN-SYSTEM.md`](../01-DESIGN-SYSTEM.md) for every token used below.

**14 surfaces.**

## Family notes

AS-BUILT FACTS THAT APPLY TO EVERY SCREEN BELOW.

1. SKELETON PRIMITIVE (/Users/rishi/QuantX/frontend/components/foundation/Skeleton.tsx, 47 LOC) — every loading.tsx is built from ONE component. Props: `w`, `h` (raw CSS strings applied as INLINE style, only when passed), `rounded` ('sm'|'md'|'lg'|'full', default 'md'), `className`. Base classes: `animate-pulse bg-line/80` + a `h-4` (16px) fallback only when neither `h` nor a size-bearing className is present. Fill = `bg-line/80` → DARK rgba(41,41,45,0.8) (#29292D @80%) over the #0D0D0E canvas ≈ #232326; LIGHT rgba(221,229,237,0.8) (#DDE5ED @80%) over #EDF1F4. Animation = Tailwind default `pulse`: opacity 1 → 0.5 → 1, 2s, cubic-bezier(0.4,0,0.6,1), infinite.

2. CRITICAL RADIUS TRAP — the ROUNDED map is NOT the design-system scale. `sm→rounded-sm(8px)`, `md→rounded-xs(6px)`, `lg→rounded-sm(8px)`, `full→9999px`. So `rounded="lg"` renders 8px, NOT 16px, and the default `rounded="md"` renders 6px, NOT 12px. Only TWO radii exist across all nine skeleton screens: 6px and 8px. Do not "correct" this in Stitch.

3. CRITICAL SPACING TRAP — Tailwind v3.4 emits `.space-y-N > :not([hidden]) ~ :not([hidden]) { margin-top: … }` at specificity (0,3,0), which BEATS `.mt-6`/`.mt-4`/`.mt-8` at (0,1,0). Every `mt-6` / `mt-4` / `mt-8` written on a direct child of a `space-y-*` container in these loading files is DEFEATED. Rendered vertical rhythm is therefore uniform: 16px in every `space-y-4` page, 24px in the `space-y-6` settings page. The authors' intent was 24px section breaks; the browser paints 16px. Reproduce the 16px.

4. SHELL REALITY — /portfolio, /stocks, /trades, /watchlist, /signals, /settings have NO layout.tsx; their AppShell is rendered INSIDE page.tsx. Consequence: their loading.tsx AND their error.tsx render BARE on the root `<body class="font-sans bg-main antialiased noise-overlay">` with NO sidebar, NO topbar, NO right rail, NO compliance footer. Only `app/(platform)/loading|error.tsx` (wrapped by AppShell) and `app/admin/loading|error.tsx` (wrapped by AdminLayout) render inside chrome. This is the single biggest visual difference between the nine skeletons.

5. ROOT BODY — `bg-main` #0D0D0E dark / #EDF1F4 light, `color: var(--color-light)` #F7F7F8, font Geist Sans, plus `.noise-overlay::after`: position fixed, inset 0, z-index 9999, opacity 0.018, 256×256 tiled SVG fractalNoise (baseFrequency 0.85, 4 octaves), mix-blend-mode overlay, pointer-events none. This grain sits over EVERY screen in this document.

6. APPSHELL GEOMETRY (components/shell/AppShell.tsx, 127 LOC) — root `.app-canvas relative min-h-screen min-h-[100dvh]`; fixed left Sidebar 240px expanded (`lg:ml-60`) / 68px collapsed (`lg:ml-[68px]`), persisted at localStorage key `quantx.sidebar.collapsed.v2`; fixed right rail 72px (`lg:mr-[72px]`, desktop only); Topbar; `<main id="main-content">` with content capped at `max-w-[1440px] px-4 md:px-6`; ConnectBrokerBanner above content and ComplianceFooter below; margin transition 200ms. Skip-link "Skip to main content" is the first focusable element (sr-only until focus, then absolute left-2 top-2 z-50, 6px radius, #406AE4 fill, white ink).

7. ADMINLAYOUT GEOMETRY (app/admin/layout.tsx, 205 LOC) — fixed left `<aside>` w-64 (256px), z-40, `border-r border-d-border` #29292D, `bg-d-bg` #0D0D0E, translate-x transition, `lg:translate-x-0`. Logo block px-6 py-5 with 32×32 8px-radius #F0A94F square holding a black Shield icon, "Quant X" 20px bold white + "Admin" 12px uppercase tracking-wider #F0A94F. Nav (p-4, space-y-1) of 7 items — Dashboard /admin, Users, Payments, Signals, ML Models, Training, System Health — each `px-4 py-3 rounded-md` (12px), active = `bg-warning/10 text-warning` plus a 4×24px `rounded-r-full` #F0A94F rail pinned to the left edge; idle = #96969E with `hover:bg-white/[0.04] hover:text-white`. Footer block (absolute bottom, p-4, border-t) = 40px round #F0A94F avatar with black bold initial, name 14px white, email 12px muted, then a "Dashboard" link + icon-only sign-out button (both px-3 py-2, 8px radius, border #29292D, `bg-white/[0.02]`; sign-out hovers to `bg-down/10 text-down border-down/20`). Main = `relative z-10 lg:pl-64` with an inner `p-6 lg:p-8`. Mobile: fixed top-4 left-4 z-50 Menu/X toggle on `bg-d-bg-card`; open state paints a `fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden` scrim.

8. ERROR-BOUNDARY DEDUPLICATION (md5-verified) — `5ce97828…` covers app/(platform)/error.tsx, app/signals/error.tsx, app/stocks/error.tsx (byte-identical). `a536b7b4…` covers app/portfolio, app/settings, app/trades, app/watchlist (identical except the button className orders `active:scale-[0.98] transition` instead of `transition active:scale-[0.98]` — zero rendered difference). All seven are emitted as ONE canonical entry. app/admin/error.tsx (`16ea269c…`) and app/error.tsx (`27ae6eb9…`) genuinely differ and are separate entries. app/global-error.tsx (140 LOC) exists but was outside the stated scope and is NOT documented here.

9. TOKENS USED BY THESE SURFACES — `--color-down` #F5808C dark / #B81C22 light; `--color-primary` #406AE4 (both themes); `--color-primary-hover` #3055C2; `--primary-foreground` #FFFFFF; `--color-light` #F7F7F8 / #1D1D1D; `--color-desc` #D3D3D7 / #4D585F; `--color-muted` #96969E / #5F6B75; `--color-line` #29292D / #DDE5ED; `--color-wrap` #151517 / #FFFFFF; `--color-wrap-hover` #1E1E21 / #F4F7F9; `--color-wrap-line` #3B3B40 / #C8D4DE. `--elev-1` = `0 1px 2px rgba(0,0,0,.30), 0 4px 12px -6px rgba(0,0,0,.40)`. `.glass-control-accent` = background #406AE4, 1px border #406AE4, color #fff, box-shadow var(--elev-1), transitions background-color+border-color at 90ms cubic-bezier(.22,1,.36,1); hover swaps both to #3055C2.

10. GLOBAL REDUCED MOTION — globals.css line 687 forces `*, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }`. Every pulse, spin and framer-motion loop below freezes on its first frame for users who ask for it.

11. ICONS — `@/lib/icons` wraps Iconify Solar: `ArrowLeft` = `solar:arrow-left-linear`, `LayoutDashboard` = `solar:widget-linear`.

12. STACK — Next 14.1.0 App Router, React 18.2.0, Tailwind 3.4.1, framer-motion 10.18.0, Geist Sans + Geist Mono via `geist/font`. Theme is tri-state via next-themes (`defaultTheme="system"`, class strategy on `<html>`), so every screen below must be authored light AND dark.

---

## `/portfolio (Next.js route-level loading UI)` — Portfolio loading skeleton

**File** `/Users/rishi/QuantX/frontend/app/portfolio/loading.tsx` · **21 LOC** · **Access** Rendered before any auth check runs — the page's own AppShell and auth gating live inside page.tsx, so this skeleton paints for authed and unauthed visitors alike.

**Shell** — NONE. /portfolio has no layout.tsx, so this renders directly on the root body (bg-main #0D0D0E dark / #EDF1F4 light, Geist Sans, noise-overlay grain at 1.8% opacity, z-index 9999). No sidebar, no topbar, no right rail, no compliance footer.

**Purpose.** Bespoke route-shaped skeleton streamed in place of the Portfolio page while its data resolves. Its composition traces the real Portfolio layout: title, subtitle, a 4-up KPI band, a large equity-curve chart block, then a holdings list.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page container** | div.mx-auto.max-w-7xl.space-y-4.px-6.py-8 — centered, max-width 1280px, 24px left/right padding, 32px top/bottom padding, uniform 16px vertical gap between all five direct children. |
| 2 | **Title bar** | Skeleton w="160px" h="28px", radius 6px. Stands in for the H1 'Portfolio'. |
| 3 | **Subtitle bar** | Skeleton w="240px" h="14px", radius 6px. Stands in for the descriptive sub-line. |
| 4 | **KPI band** | div.mt-6 (defeated → 16px).grid.grid-cols-2.gap-4.md:grid-cols-4 — four Skeletons at h="80px", rounded="lg" → 8px radius, width auto-filled by the grid. 16px gutters. 2 columns below 768px, 4 columns at ≥768px. |
| 5 | **Chart block** | Skeleton h="280px", rounded="lg" → 8px radius, full container width. className="mt-6" is overridden by space-y-4, so it sits 16px below the KPI grid. |
| 6 | **Holdings list** | div.mt-4 (defeated → 16px).space-y-2 containing five Skeletons at h="44px", default rounded="md" → 6px radius, full width, 8px between rows. |

**Components** — `Skeleton (components/foundation/Skeleton.tsx) — the only component on the screen; 12 instances`

**States & data.** Single, dataless state. No text nodes, no icons, no color beyond the skeleton fill. Fill rgba(41,41,45,0.8) dark / rgba(221,229,237,0.8) light. Every bar pulses in unison (opacity 1→0.5→1, 2s, cubic-bezier(0.4,0,0.6,1), infinite) — there is no stagger. Total rendered height above the fold ≈ 32 + 28 + 16 + 14 + 16 + 80 + 16 + 280 + 16 + (5×44 + 4×8) = ~750px.

**Interactions.** None. Zero focusable elements, no pointer targets, no aria-busy or role=status is set. Next.js swaps this out for the resolved page.

**Responsive.** Only one breakpoint fires: the KPI grid goes grid-cols-2 → md:grid-cols-4 at 768px. Horizontal padding stays 24px at every width; the 1280px cap only engages above ~1328px viewport.

**Key copy.** No user-visible copy whatsoever.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark loading skeleton screen for an Indian NSE trading dashboard's Portfolio page. Page background #0D0D0E with a barely-visible 1.8% film grain overlay. Content is centered in a 1280px-max column with 24px side padding and 32px top padding. No sidebar, no header bar — the skeleton floats alone on the canvas. Stack, top to bottom, with exactly 16px between every group: (1) a 160×28px placeholder bar, 6px corner radius; (2) a 240×14px bar, 6px radius; (3) a four-column grid of equal-width blocks each 80px tall with 8px radius and 16px gutters — these stand in for the RELIANCE/TCS-heavy portfolio's Total Value ₹18.42 lakh, Day P&L, Invested and Unrealised cards; (4) one full-width block 280px tall with 8px radius, the equity-curve chart placeholder; (5) five stacked full-width bars, each 44px tall with 6px radius and only 8px between them — the HDFCBANK / INFY / TCS holdings rows. Every placeholder is a flat fill of #29292D at 80% opacity (no gradient, no shimmer sweep) and all of them pulse together from 100% to 50% opacity over 2 seconds, easing cubic-bezier(0.4,0,0.6,1), looping forever. Absolutely no text, icons or borders. At viewports under 768px the four KPI blocks reflow to a two-column grid. Also produce the light-mode variant: page #EDF1F4, placeholders #DDE5ED at 80%.
```
</details>

---

## `/settings (Next.js route-level loading UI)` — Settings loading skeleton

**File** `/Users/rishi/QuantX/frontend/app/settings/loading.tsx` · **22 LOC** · **Access** Pre-auth — renders before Settings' own AppShell and session check mount.

**Shell** — NONE. /settings has no layout.tsx; renders bare on root body (bg-main #0D0D0E / #EDF1F4, noise-overlay).

**Purpose.** Route-shaped skeleton for the Settings page. Uniquely narrow (768px, not 1280px) and uniquely form-shaped: a tab strip over five label+control field groups.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page container** | div.mx-auto.max-w-3xl.space-y-6.px-6.py-8 — centered, max-width 768px (the narrowest container of all nine skeletons), 24px side padding, 32px vertical padding, 24px between the three direct children. Note: this is the ONLY loading file with no mt-* overrides, so the authored 24px rhythm actually renders. |
| 2 | **Page title** | Skeleton w="120px" h="28px", radius 6px. |
| 3 | **Tab strip** | div.flex.gap-2 — four Skeletons at w="100px" h="36px", rounded="md" → 6px radius, laid left-to-right with 8px gaps. Total strip width 100×4 + 8×3 = 424px, left-aligned, does not wrap. |
| 4 | **Field stack** | div.space-y-3 — five field groups, 12px apart. |
| 5 | **Field group (×5)** | div.space-y-2 — a label Skeleton w="120px" h="14px" (6px radius) above a full-width control Skeleton h="44px" (6px radius), 8px apart. Each group is 14 + 8 + 44 = 66px tall. |

**Components** — `Skeleton — 15 instances (1 title + 4 tabs + 5 labels + 5 controls)`

**States & data.** Single dataless state. Fill rgba(41,41,45,0.8) dark / rgba(221,229,237,0.8) light, synchronous 2s pulse. Total column height = 32 + 28 + 24 + 36 + 24 + (5×66 + 4×12) = ~522px, so on a desktop viewport this skeleton occupies only the top third of the screen with a large empty canvas beneath.

**Interactions.** None. No focusable nodes.

**Responsive.** No breakpoint classes at all — the layout is identical from 320px to 4K. Below ~816px the 768px cap stops applying and the column simply shrinks to viewport minus 48px padding. The 424px tab strip stays on one line down to ~472px viewport, then overflows (no wrap, no scroll container).

**Key copy.** No user-visible copy.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark loading skeleton for a trading platform's Settings page. Background #0D0D0E with 1.8% film grain. Content sits in a narrow centered column capped at 768px with 24px side padding and 32px top padding — noticeably narrower than the app's other pages. Top to bottom with 24px between sections: (1) a 120×28px placeholder bar with 6px radius where the 'Settings' heading goes; (2) a horizontal row of four placeholder pills, each exactly 100px wide and 36px tall with 6px radius, separated by 8px — these stand in for the Profile / Broker / Risk / Notifications tabs; (3) a stack of five form-field groups spaced 12px apart, each group being a 120×14px label bar with 6px radius sitting 8px above a full-width 44px-tall input bar with 6px radius. The five inputs represent fields like Full name, Zerodha client ID, Max capital per trade ₹50,000, Daily loss cap, and Alert channel. Every placeholder is flat #29292D at 80% opacity — no gradient, no shimmer sweep, no borders, no text, no icons — and all of them pulse in perfect unison from 100% to 50% opacity over 2 seconds with cubic-bezier(0.4,0,0.6,1), looping forever. The layout is fully fixed: it must look identical on mobile and desktop with no reflow. Also deliver the light variant: page #EDF1F4, placeholders #DDE5ED at 80%.
```
</details>

---

## `/stocks (Next.js route-level loading UI)` — Stocks loading skeleton

**File** `/Users/rishi/QuantX/frontend/app/stocks/loading.tsx` · **16 LOC** · **Access** Pre-auth — paints before the page's AppShell and screener queries mount.

**Shell** — NONE. Bare on root body (bg-main #0D0D0E / #EDF1F4, noise-overlay).

**Purpose.** Route-shaped skeleton for the NSE stock screener/browser. Composition is title → long subtitle → a search bar → the longest row list of any skeleton (8 rows at 56px).

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page container** | div.mx-auto.max-w-7xl.space-y-4.px-6.py-8 — 1280px cap, 24px side padding, 32px vertical padding, uniform 16px gap between the four direct children. |
| 2 | **Title bar** | Skeleton w="120px" h="28px", radius 6px. |
| 3 | **Subtitle bar** | Skeleton w="320px" h="14px", radius 6px — the widest subtitle across the nine skeletons (portfolio/trades/watchlist use 240px, signals 280px). |
| 4 | **Search field** | Skeleton h="44px", rounded="md" → 6px radius, full container width, className="mt-6" defeated → sits 16px below the subtitle. |
| 5 | **Results list** | div.mt-4 (defeated → 16px).space-y-2 with EIGHT Skeletons at h="56px", 6px radius, full width, 8px apart. Taller rows (56px vs trades' 52px and portfolio's 44px) because real stock rows carry symbol + name + LTP + change + sparkline. |

**Components** — `Skeleton — 11 instances`

**States & data.** Single dataless state. Fill rgba(41,41,45,0.8) dark / rgba(221,229,237,0.8) light, synchronous 2s pulse. Total height = 32 + 28 + 16 + 14 + 16 + 44 + 16 + (8×56 + 7×8) = ~670px.

**Interactions.** None. The 44px search placeholder is NOT an input — it is a div and cannot receive focus or text.

**Responsive.** No breakpoint classes. Identical structure at every width; the 1280px cap engages above ~1328px viewport. Rows are always full-bleed within the padded column.

**Key copy.** No user-visible copy.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark loading skeleton for an NSE stock-screener page. Background #0D0D0E with 1.8% film grain, content centered in a 1280px-max column with 24px side padding and 32px top padding. No app chrome — no sidebar, no header. Top to bottom with exactly 16px between groups: (1) a 120×28px placeholder bar, 6px radius, for the 'Stocks' heading; (2) a 320×14px bar, 6px radius, for the sub-line 'Browse and screen 1,847 NSE-listed equities'; (3) a full-width bar 44px tall with 6px radius standing in for the symbol search input; (4) a list of EIGHT full-width bars, each 56px tall with 6px radius, separated by only 8px — these are the result rows for RELIANCE ₹2,914.30 +1.12%, TCS ₹3,842.65 −0.34%, HDFCBANK ₹1,678.90, INFY ₹1,556.20, ICICIBANK, SBIN, BHARTIARTL and LT, each of which normally carries a symbol, company name, last-traded price, percent change and a small sparkline. Every placeholder is a flat fill of #29292D at 80% opacity — no gradients, no shimmer sweep, no borders, no text, no icons — and all eleven bars pulse together from 100% to 50% opacity over 2 seconds using cubic-bezier(0.4,0,0.6,1), looping forever. The layout has no breakpoints and must render identically on phone and desktop. Also produce the light variant: page #EDF1F4, placeholders #DDE5ED at 80%.
```
</details>

---

## `/trades (Next.js route-level loading UI)` — Trades loading skeleton

**File** `/Users/rishi/QuantX/frontend/app/trades/loading.tsx` · **20 LOC** · **Access** Pre-auth — paints before the page's AppShell and trade-history fetch mount.

**Shell** — NONE. Bare on root body (bg-main #0D0D0E / #EDF1F4, noise-overlay).

**Purpose.** Route-shaped skeleton for the trade blotter. Distinguished by a three-chip filter row (80×32) sitting above a seven-row list at 52px.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page container** | div.mx-auto.max-w-7xl.space-y-4.px-6.py-8 — 1280px cap, 24px side padding, 32px vertical padding, uniform 16px gap between four direct children. |
| 2 | **Title bar** | Skeleton w="140px" h="28px", radius 6px. |
| 3 | **Subtitle bar** | Skeleton w="240px" h="14px", radius 6px. |
| 4 | **Filter chip row** | div.mt-6 (defeated → 16px).flex.gap-2 containing THREE individually-written Skeletons (not a .map) at w="80px" h="32px", rounded="md" → 6px radius, 8px apart. Total row width 80×3 + 8×2 = 256px, left-aligned. |
| 5 | **Blotter rows** | div.mt-4 (defeated → 16px).space-y-2 with SEVEN Skeletons at h="52px", 6px radius, full width, 8px apart. |

**Components** — `Skeleton — 12 instances (3 of them hand-written rather than mapped)`

**States & data.** Single dataless state. Fill rgba(41,41,45,0.8) dark / rgba(221,229,237,0.8) light, synchronous 2s pulse. Total height = 32 + 28 + 16 + 14 + 16 + 32 + 16 + (7×52 + 6×8) = ~566px.

**Interactions.** None. The three chips are non-interactive divs.

**Responsive.** No breakpoint classes. Identical at all widths; the 256px chip row never wraps and fits down to ~304px viewport.

**Key copy.** No user-visible copy.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark loading skeleton for a trade-blotter page in an Indian equities platform. Background #0D0D0E with 1.8% film grain, content centered in a 1280px-max column, 24px side padding, 32px top padding, no sidebar or header. Top to bottom with exactly 16px between groups: (1) a 140×28px placeholder bar with 6px radius for the 'Trades' heading; (2) a 240×14px bar with 6px radius for the sub-line; (3) a left-aligned row of exactly three small placeholder chips, each 80px wide and 32px tall with 6px radius, separated by 8px — these are the All / Open / Closed filter chips; (4) a list of SEVEN full-width bars, each 52px tall with 6px radius, separated by only 8px, standing in for executed trades such as 'TCS LONG · 40 qty · entry ₹3,802.10 · exit ₹3,918.45 · +3.06% · 14 Feb 2026 15:12 IST' and 'BANKNIFTY 48200 CE · closed · −1.84%'. Every placeholder is a flat fill of #29292D at 80% opacity — no gradient, no shimmer sweep, no borders, no text, no icons — and all twelve bars pulse together from 100% to 50% opacity over 2 seconds with cubic-bezier(0.4,0,0.6,1), looping forever. Note the deliberate size ladder: the blotter rows are 52px, shorter than a screener row and taller than a holdings row. No breakpoints — render identically on phone and desktop. Also produce the light variant: page #EDF1F4, placeholders #DDE5ED at 80%.
```
</details>

---

## `/watchlist (Next.js route-level loading UI)` — Watchlist loading skeleton

**File** `/Users/rishi/QuantX/frontend/app/watchlist/loading.tsx` · **15 LOC** · **Access** Pre-auth — paints before the page's AppShell and watchlist fetch mount.

**Shell** — NONE. Bare on root body (bg-main #0D0D0E / #EDF1F4, noise-overlay).

**Purpose.** The simplest of the row-list skeletons — title, subtitle, and six chunky 68px cards. No filter row, no search bar, no KPI band.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page container** | div.mx-auto.max-w-7xl.space-y-4.px-6.py-8 — 1280px cap, 24px side padding, 32px vertical padding, 16px gap between three direct children. |
| 2 | **Title bar** | Skeleton w="140px" h="28px", radius 6px. |
| 3 | **Subtitle bar** | Skeleton w="240px" h="14px", radius 6px. |
| 4 | **Watchlist cards** | div.mt-6 (defeated → 16px).space-y-2 with SIX Skeletons at h="68px", rounded="lg" → 8px radius (the only row-list skeleton to use 8px rather than 6px), full width, 8px apart. 68px is the tallest per-row height in the skeleton set apart from signals' 96px. |

**Components** — `Skeleton — 8 instances`

**States & data.** Single dataless state. Fill rgba(41,41,45,0.8) dark / rgba(221,229,237,0.8) light, synchronous 2s pulse. Total height = 32 + 28 + 16 + 14 + 16 + (6×68 + 5×8) = ~554px. This is the shortest file in the whole scope at 15 LOC.

**Interactions.** None.

**Responsive.** No breakpoint classes. Identical at all widths.

**Key copy.** No user-visible copy.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark loading skeleton for a stock watchlist page. Background #0D0D0E with 1.8% film grain, content centered in a 1280px-max column with 24px side padding and 32px top padding, and no surrounding app chrome. Only three things stack, with exactly 16px between them: (1) a 140×28px placeholder bar with 6px corner radius for the 'Watchlist' heading; (2) a 240×14px bar with 6px radius for the sub-line '12 symbols tracked'; (3) a vertical list of SIX full-width placeholder cards, each 68px tall with 8px corner radius — note the softer 8px here versus the 6px used on the two header bars — separated by only 8px. Each 68px card stands in for a watched NSE symbol row carrying ticker, company name, last price and day change, for example 'RELIANCE · Reliance Industries · ₹2,914.30 · +1.12%', 'INFY · Infosys · ₹1,556.20 · −0.47%', 'NIFTY 50 · 24,182.55 · +0.63%' and 'BANKNIFTY · 51,904.20 · +0.88%'. Every placeholder is a flat fill of #29292D at 80% opacity — no gradient, no shimmer sweep, no border, no text, no icon — and all eight shapes pulse together from 100% to 50% opacity over 2 seconds using cubic-bezier(0.4,0,0.6,1), looping forever. There are no breakpoints; the composition is identical from 320px to desktop. Also produce the light variant: page #EDF1F4, placeholders #DDE5ED at 80%.
```
</details>

---

## `/signals (Next.js route-level loading UI)` — Signals loading skeleton

**File** `/Users/rishi/QuantX/frontend/app/signals/loading.tsx` · **15 LOC** · **Access** Pre-auth — paints before the signals page mounts.

**Shell** — NONE. /signals has no layout.tsx; renders bare on root body (bg-main #0D0D0E / #EDF1F4, noise-overlay). Note app/signals/page.tsx does not even mount AppShell itself.

**Purpose.** Route-shaped skeleton for the AI signal feed. Uses the tallest cards in the set (96px) and the only 12px row gap, because a real signal card carries symbol, direction, confidence, entry/SL/target and an engine attribution line.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page container** | div.mx-auto.max-w-7xl.space-y-4.px-6.py-8 — 1280px cap, 24px side padding, 32px vertical padding, 16px gap between three direct children. |
| 2 | **Title bar** | Skeleton w="140px" h="28px", radius 6px. |
| 3 | **Subtitle bar** | Skeleton w="280px" h="14px", radius 6px. |
| 4 | **Signal cards** | div.mt-6 (defeated → 16px).space-y-3 — SIX Skeletons at h="96px", rounded="lg" → 8px radius, full width, 12px apart. The 12px gap (space-y-3) is unique to this screen; every other list skeleton uses 8px. |

**Components** — `Skeleton — 8 instances`

**States & data.** Single dataless state. Fill rgba(41,41,45,0.8) dark / rgba(221,229,237,0.8) light, synchronous 2s pulse. Total height = 32 + 28 + 16 + 14 + 16 + (6×96 + 5×12) = ~742px — the tallest of the bare skeletons.

**Interactions.** None.

**Responsive.** No breakpoint classes. Identical at all widths.

**Key copy.** No user-visible copy.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark loading skeleton for an AI trading-signal feed. Background #0D0D0E with a 1.8% film-grain overlay; content centered in a 1280px-max column with 24px side padding and 32px top padding, no sidebar and no header. Three groups stack with exactly 16px between them: (1) a 140×28px placeholder bar with 6px radius for the 'Signals' heading; (2) a 280×14px bar with 6px radius for the sub-line 'Live engine output · updated 15:29 IST'; (3) a vertical list of SIX full-width placeholder cards, each 96px tall with 8px corner radius, separated by 12px — deliberately roomier than any other list in the product because a real card carries symbol, LONG/SHORT direction, a confidence score, entry ₹2,914, stop-loss ₹2,845, target ₹3,060 and an engine attribution line, for signals on RELIANCE, TCS, HDFCBANK, INFY, BANKNIFTY and NIFTY 50. Every placeholder is a flat fill of #29292D at 80% opacity — absolutely no gradient, no shimmer sweep, no border, no text, no icon, no colour — and all eight shapes pulse in unison from 100% to 50% opacity over 2 seconds using cubic-bezier(0.4,0,0.6,1), looping forever. There are no responsive breakpoints; the composition is identical at every viewport width. Also produce the light variant: page #EDF1F4, placeholders #DDE5ED at 80%.
```
</details>

---

## `/copilot, /scanner, /autopilot, /risk, /strategies, /patterns, /fno, /inbox, /paper-trading, /referrals (the entire (platform) route group)` — Platform group loading skeleton (inside AppShell)

**File** `/Users/rishi/QuantX/frontend/app/(platform)/loading.tsx` · **16 LOC** · **Access** Authed context. The (platform) layout is a client component that redirects to /onboarding/broker-connect when onboarding is incomplete, so this skeleton is only seen by signed-in, onboarded users.

**Shell** — AppShell (via app/(platform)/layout.tsx). Fixed left sidebar 240px expanded / 68px collapsed, fixed right utility rail 72px on desktop, Topbar, ConnectBrokerBanner above the content, ComplianceFooter below, CommandPalette + MobileDrawer mounted, plus SystemHaltBanner above and AutopilotStickyStop below the shell. Content gutter max-w-[1440px] px-4 md:px-6, then this file's own max-w-7xl px-6 nests inside it — producing a doubled gutter of 16/24px + 24px.

**Purpose.** The only skeleton that renders INSIDE full app chrome. Covers every route in the (platform) group. Composition: title, subtitle, a 4-up KPI band, one very large 320px content block.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page container** | div.mx-auto.max-w-7xl.px-6.py-8.space-y-4 (class order differs from the sibling files but resolves identically) — 1280px cap, 24px side padding, 32px vertical padding, 16px gap between four direct children. |
| 2 | **Title bar** | Skeleton w="180px" h="28px", radius 6px — wider than the sibling routes' 120–140px. |
| 3 | **Subtitle bar** | Skeleton w="280px" h="14px", radius 6px. |
| 4 | **KPI band** | div.mt-6 (defeated → 16px).grid.grid-cols-2.gap-4.md:grid-cols-4 — four Skeletons h="80px", rounded="lg" → 8px radius, 16px gutters, 2-up under 768px and 4-up at ≥768px. |
| 5 | **Hero content block** | Skeleton h="320px", rounded="lg" → 8px radius, full width, className="mt-6" defeated → 16px below the grid. The largest single skeleton shape in the product alongside app/loading.tsx. |

**Components** — `Skeleton — 6 instances` · `(surrounding, already-mounted) AppShell, Sidebar, Topbar, RightRail, ConnectBrokerBanner, ComplianceFooter, CommandPalette, MobileDrawer, SystemHaltBanner, AutopilotStickyStop`

**States & data.** Single dataless state for the skeleton itself, but the surrounding chrome is fully live — real nav labels, real active-route highlight, real user avatar. Skeleton fill rgba(41,41,45,0.8) dark / rgba(221,229,237,0.8) light, synchronous 2s pulse. Skeleton column height = 32 + 28 + 16 + 14 + 16 + 80 + 16 + 320 = ~522px.

**Interactions.** The skeleton itself is inert, but the shell around it stays fully interactive during load: sidebar navigation, sidebar collapse toggle (persisted at localStorage 'quantx.sidebar.collapsed.v2', 200ms margin transition), Topbar search opening CommandPalette, and the skip-to-content link.

**Responsive.** Below 1024px the sidebar and right rail unmount, the Topbar hamburger opens MobileDrawer, and the content column loses its lg:ml-60/lg:mr-[72px] offsets. Below 768px the KPI grid drops to 2 columns. The shell's own gutter shifts px-4 → md:px-6 at 768px.

**Key copy.** No copy in the skeleton. Surrounding chrome copy (nav labels, compliance footer) is not part of this file.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark loading state for a trading dashboard shown inside full app chrome. Left edge: a fixed 240px-wide sidebar on #151517 with a 1px #29292D right hairline and live nav items. Right edge: a fixed 72px utility rail. Between them a top bar, then the content column capped at 1440px with 24px gutters, and inside that a further 1280px-max column with 24px padding and 32px top padding. The content column is entirely placeholder: (1) a 180×28px bar with 6px corner radius; (2) a 280×14px bar with 6px radius; (3) a four-across grid of equal blocks, each 80px tall with 8px radius and 16px gutters, standing in for NIFTY 50 24,182.55 +0.63%, BANKNIFTY 51,904.20, Open positions 7, and Today's P&L +₹42,860; (4) one enormous full-width block 320px tall with 8px radius for the main chart or agent panel. Exactly 16px separates each of the four groups. Placeholders are a flat fill of #29292D at 80% opacity, no gradient and no shimmer sweep, all pulsing together from 100% to 50% opacity over 2 seconds with cubic-bezier(0.4,0,0.6,1), forever. The chrome must render at full fidelity and full contrast — only the content column is skeletonised. Below 1024px drop both rails; below 768px the four KPI blocks become two columns. Light variant: page #EDF1F4, sidebar #FFFFFF, hairline #DDE5ED, placeholders #DDE5ED at 80%.
```
</details>

---

## `/admin, /admin/users, /admin/payments, /admin/signals, /admin/ml, /admin/training, /admin/system (route-level loading UI)` — Admin loading skeleton (inside AdminLayout)

**File** `/Users/rishi/QuantX/frontend/app/admin/loading.tsx` · **19 LOC** · **Access** Admin-gated. AdminLayout runs a Supabase admin check first; while that resolves the layout shows its own .loader-rings spinner, and if the check fails it renders an 'Access Denied' screen instead. This skeleton is only reachable once isAdmin === true.

**Shell** — AdminLayout — fixed 256px left aside on #0D0D0E with a 1px #29292D right border, amber-accented (#F0A94F) brand block and nav, avatar/sign-out footer; main is lg:pl-64 with an inner p-6 lg:p-8. This file's own px-6 py-8 nests inside that, giving 48px of effective side padding on desktop (32px from lg:p-8 + 24px, minus no collapse) and 48px of top padding.

**Purpose.** Route-shaped skeleton for the admin console. Uniquely uses a taller 100px KPI band and a two-up 280px panel grid — the only skeleton with TWO grids.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page container** | div.mx-auto.max-w-7xl.space-y-4.px-6.py-8 — 1280px cap, 24px side padding, 32px vertical padding, 16px gap between four direct children. |
| 2 | **Title bar** | Skeleton w="180px" h="28px", radius 6px. |
| 3 | **Subtitle bar** | Skeleton w="280px" h="14px", radius 6px. |
| 4 | **Metrics band** | div.mt-6 (defeated → 16px).grid.grid-cols-2.gap-4.md:grid-cols-4 — four Skeletons at h="100px" (taller than the platform group's 80px), rounded="lg" → 8px radius, 16px gutters, 2-up below 768px, 4-up at ≥768px. |
| 5 | **Panel grid** | div.mt-6 (defeated → 16px).grid.grid-cols-1.gap-4.lg:grid-cols-2 — TWO Skeletons at h="280px", rounded="lg" → 8px radius, 16px gutter. Single column below 1024px, side-by-side at ≥1024px. This second grid is unique to the admin skeleton. |

**Components** — `Skeleton — 8 instances` · `(surrounding) AdminLayout aside, nav, avatar block, mobile toggle + scrim`

**States & data.** Single dataless state. Fill rgba(41,41,45,0.8) dark / rgba(221,229,237,0.8) light, synchronous 2s pulse. Skeleton column height at desktop = 32 + 28 + 16 + 14 + 16 + 100 + 16 + 280 = ~502px; at <1024px the panel grid stacks and the column grows to ~798px.

**Interactions.** Skeleton inert. AdminLayout chrome remains interactive: nav links with amber active rail, mobile hamburger opening the sidebar over a black/50 backdrop-blur scrim, and the sign-out button.

**Responsive.** Two breakpoints fire inside the skeleton: metrics grid 2 → 4 columns at 768px, and panel grid 1 → 2 columns at 1024px. The surrounding AdminLayout also flips at 1024px (sidebar becomes an off-canvas drawer, main loses lg:pl-64, inner padding drops p-8 → p-6).

**Key copy.** No copy in the skeleton file.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark loading state for an internal admin console, shown inside admin chrome. Left edge: a fixed 256px sidebar on #0D0D0E with a 1px #29292D right border, a 32×32px amber #F0A94F rounded-8px tile holding a black shield glyph, the wordmark 'Quant X' in 20px bold white with a 12px uppercase amber 'ADMIN' beneath it, and a nav of seven rows at 12px radius where the active row is amber text on a 10%-amber fill with a 4×24px amber rail on its left edge. Main content is offset 256px and padded 32px, with an inner column capped at 1280px and padded a further 24px. That column is pure placeholder: (1) a 180×28px bar, 6px radius; (2) a 280×14px bar, 6px radius; (3) a four-across grid of blocks 100px tall with 8px radius and 16px gutters — Total users 1,284, MRR ₹18.4 lakh, Active signals 46, Model drift alerts 2; (4) a two-across grid of two blocks 280px tall with 8px radius and a 16px gutter, for the signup chart and the system-health panel. Exactly 16px between all four groups. Placeholders are flat #29292D at 80% opacity, no gradient or shimmer, pulsing together 100%→50% over 2 seconds, cubic-bezier(0.4,0,0.6,1), forever. At 1024px the two 280px panels stack; at 768px the four metric blocks become two columns. Light variant: page #EDF1F4, placeholders #DDE5ED at 80%.
```
</details>

---

## `/ and any route without a nearer loading.tsx (root loading UI)` — Root loading skeleton

**File** `/Users/rishi/QuantX/frontend/app/loading.tsx` · **13 LOC** · **Access** Any. Serves marketing, auth and app routes alike whenever no nearer loading.tsx exists.

**Shell** — NONE, and it explicitly re-declares the canvas itself: an outer div.min-h-screen.bg-main so the page is guaranteed to be a full-height #0D0D0E (dark) / #EDF1F4 (light) surface even before the root body paints. noise-overlay grain still sits on top at z-index 9999.

**Purpose.** The app-wide fallback. The only skeleton that paints its own full-viewport background and the only one with 48px vertical padding — it is designed to sit on an otherwise empty screen with no chrome at all.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Viewport wrapper** | div.min-h-screen.bg-main — 100vh minimum, page canvas fill. Unique to this file; the other eight skeletons inherit the body background instead. |
| 2 | **Content column** | div.mx-auto.max-w-7xl.px-6.py-12.space-y-4 — 1280px cap, 24px side padding, and 48px top/bottom padding (every other skeleton uses 32px). 16px gap between the three children. |
| 3 | **Title bar** | Skeleton w="200px" h="32px", radius 6px — the largest title placeholder in the set (others are 28px tall and 120–180px wide). |
| 4 | **Subtitle bar** | Skeleton w="320px" h="14px", radius 6px. |
| 5 | **Content block** | Skeleton h="320px", rounded="lg" → 8px radius, full width. className="mt-8" is defeated by space-y-4 → renders 16px below the subtitle, not 32px. |

**Components** — `Skeleton — 3 instances. This is the sparsest screen in the product: three shapes total.`

**States & data.** Single dataless state. Fill rgba(41,41,45,0.8) dark / rgba(221,229,237,0.8) light, synchronous 2s pulse. Content height = 48 + 32 + 16 + 14 + 16 + 320 = ~446px, top-aligned inside a full-height canvas, so most of the viewport is empty page colour.

**Interactions.** None.

**Responsive.** No breakpoint classes. Identical at all widths; only the 1280px cap and the centering change with viewport.

**Key copy.** No user-visible copy.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design the sparest possible dark loading screen for a fintech app — an app-wide fallback with no navigation, no header and no branding. The whole viewport is filled with #0D0D0E and carries a 1.8%-opacity film-grain overlay. A single centered column, capped at 1280px wide, sits with 24px side padding and a generous 48px of top padding — noticeably more breathing room than the app's per-route loading screens. Inside it, exactly three placeholder shapes stack with 16px between each: (1) a 200×32px bar with 6px corner radius, the largest heading placeholder in the product; (2) a 320×14px bar with 6px radius beneath it; (3) one full-width block 320px tall with 8px corner radius, the main content or chart region. Nothing else appears — the lower two thirds of the screen is bare page colour. Every placeholder is a flat fill of #29292D at 80% opacity with no gradient, no shimmer sweep, no border, no text and no icon, and all three pulse in unison from 100% to 50% opacity over 2 seconds using cubic-bezier(0.4,0,0.6,1), looping forever. There are no breakpoints: the composition is identical from a 360px phone to a 2560px display, only re-centering. Also deliver the light-mode variant: full-viewport #EDF1F4 with placeholders in #DDE5ED at 80% opacity.
```
</details>

---

## `Rendered in place of the page at 7 route segments (see notableCopy). Component path: app/<segment>/error.tsx` — Route error boundary (canonical)

**File** `/Users/rishi/QuantX/frontend/app/(platform)/error.tsx` · **42 LOC** · **Access** Any — the boundary is auth-agnostic. Mounted at both authed (platform, portfolio, trades, watchlist, settings) and public-ish (signals, stocks) segments.

**Shell** — Depends on mount point. At app/(platform)/error.tsx it renders INSIDE AppShell (sidebar + topbar + right rail + compliance footer all still present). At the six other mount points there is no layout.tsx, so it renders BARE on the root body (#0D0D0E / #EDF1F4 + noise-overlay) with no chrome at all.

**Purpose.** The standard segment-level error UI. Catches a thrown render/data error inside a route segment, reports it, and offers a single recovery action that re-runs the segment. Deliberately compact (60vh, 384px column) so it reads as a panel failure rather than a whole-app crash.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Centering frame** | div.flex.min-h-\[60vh\].items-center.justify-center.p-6 — 60% of viewport height minimum, content centered on both axes, 24px padding. |
| 2 | **Content column** | div.max-w-sm.text-center — 384px max width, all content center-aligned. |
| 3 | **Error mark (80×80)** | div.mx-auto.mb-6.relative.w-20.h-20 — 80×80px, 24px bottom margin. Three stacked layers. |
| 4 | **Mark layer 1 — rotating dashed ring** | <svg class="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite]" viewBox="0 0 80 80" fill="none"> containing <circle cx=40 cy=40 r=36 stroke="var(--color-down)" strokeWidth=1.5 strokeDasharray="6 5" opacity=0.5/>. Stroke resolves to #F5808C on dark and #B81C22 on light. Rotates a full turn every 8s, linear, infinite. |
| 5 | **Mark layer 2 — inner glow** | div.absolute.inset-2.rounded-full.bg-down\/10.blur-sm — a 64×64 circle of #F5808C at 10% alpha with a 4px Gaussian blur, inset 8px from the mark bounds. |
| 6 | **Mark layer 3 — exclamation** | div.absolute.inset-0.flex.items-center.justify-center > span.text-down.text-3xl.font-bold rendering the single character '!' at 30px/36px, weight 700, in #F5808C (dark) / #B81C22 (light). Static — no pulse at this mount point. |
| 7 | **Headline** | h2.mb-2.text-lg.font-bold.text-d-text-primary — 'Something went wrong' at 18px/28px, weight 700, #F7F7F8 dark / #1D1D1D light, 8px bottom margin. |
| 8 | **Body** | p.mb-6.text-sm.text-d-text-muted — 'An unexpected error occurred.' at 14px/20px in #96969E dark / #5F6B75 light, 24px bottom margin. |
| 9 | **Recovery button** | button.glass-control-accent.rounded-full.px-5.py-2.text-sm.font-medium.transition.active:scale-\[0.98\] — pill (9999px radius), 20px horizontal / 8px vertical padding, label 'Try again' at 14px/20px weight 500. .glass-control-accent resolves to background #406AE4, 1px solid #406AE4 border, #FFFFFF ink, box-shadow 0 1px 2px rgba(0,0,0,.30) + 0 4px 12px -6px rgba(0,0,0,.40); hover swaps background and border to #3055C2 over 90ms cubic-bezier(.22,1,.36,1). Press scales to 98%. |

**Components** — `reportError (@/lib/reportError) — side-effect only, no UI` · `Next.js error boundary contract: receives { error: Error & { digest?: string }, reset: () => void }`

**States & data.** One visual state. On mount and on every change of `error`, a useEffect fires reportError({ error, boundary: 'route', digest: error.digest }). Neither error.message nor error.digest is ever shown to the user — the copy is fixed regardless of what failed. 'use client' component.

**Interactions.** Exactly one interactive element: the 'Try again' button calls Next's reset(), which re-renders the errored segment. Press feedback is a 2% scale-down. The dashed ring rotates continuously at 8s/turn; both the spin and the button transition are neutralised by the global prefers-reduced-motion rule.

**Responsive.** No breakpoint classes. The 384px column and the 80px mark are fixed at every viewport; only min-h-[60vh] scales. Inside AppShell the available width is the shell's content column, so the centered 384px block sits slightly right of true page centre on desktop.

**Key copy.** Copy is exactly: 'Something went wrong' / 'An unexpected error occurred.' / 'Try again'. MOUNT POINTS — md5 5ce97828dc2be846fe5c1d200dd0e5e6 (byte-identical): /Users/rishi/QuantX/frontend/app/(platform)/error.tsx, /Users/rishi/QuantX/frontend/app/signals/error.tsx, /Users/rishi/QuantX/frontend/app/stocks/error.tsx. md5 a536b7b4e8c77cfb6fbd5938200a1743 (identical rendering; the button className merely orders 'active:scale-[0.98] transition' instead of 'transition active:scale-[0.98]'): /Users/rishi/QuantX/frontend/app/portfolio/error.tsx, /Users/rishi/QuantX/frontend/app/settings/error.tsx, /Users/rishi/QuantX/frontend/app/trades/error.tsx, /Users/rishi/QuantX/frontend/app/watchlist/error.tsx. All seven are 42 LOC.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a compact dark error panel for a trading app, vertically and horizontally centered in a region at least 60% of the viewport tall, on a #0D0D0E page with 1.8% film grain and 24px padding. The content column is only 384px wide and fully center-aligned. At the top, an 80×80px error mark built from three layers: a slowly rotating dashed ring drawn as a circle of radius 36 centered in an 80×80 box, stroked 1.5px in #F5808C with a 6-on 5-off dash pattern at 50% opacity, completing one linear revolution every 8 seconds; behind it a 64×64 soft circular glow of #F5808C at 10% opacity with a 4px blur; and centered over both, a single exclamation mark '!' at 30px, weight 700, in #F5808C. Leave 24px below the mark. Then the headline 'Something went wrong' at 18px/28px, weight 700, in #F7F7F8, with 8px below it. Then the line 'An unexpected error occurred.' at 14px/20px in #96969E, with 24px below it. Finally a single pill button labelled 'Try again' at 14px weight 500 in white, filled #406AE4 with a matching 1px #406AE4 border, fully rounded, 20px horizontal and 8px vertical padding, carrying a soft shadow of 0 1px 2px rgba(0,0,0,0.30) plus 0 4px 12px -6px rgba(0,0,0,0.40); on hover the fill and border both become #3055C2 over 90ms, and on press it scales to 98%. Never show the raw error message. Light variant: page #EDF1F4, mark and '!' in #B81C22, headline #1D1D1D, body #5F6B75, button unchanged.
```
</details>

---

## `/ (root error boundary — catches errors in app/page.tsx and any segment lacking its own boundary)` — Root error boundary

**File** `/Users/rishi/QuantX/frontend/app/error.tsx` · **105 LOC** · **Access** Any. This is the top-level (non-global) boundary.

**Shell** — NONE — it replaces the whole page inside the root layout. It paints its own background with bg-wrap, i.e. #151517 on dark and #FFFFFF on light. Note this is the CARD surface, not the page canvas: the root crash screen is deliberately one step lighter than every other screen in this document.

**Purpose.** The full-page crash screen. Substantially richer than the segment boundary: full viewport, framer-motion entrance, a 96px animated error mark, and a bespoke 'broken chart line' illustration that visually ties the failure to the trading domain.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Viewport frame** | div.flex.min-h-screen.items-center.justify-center.p-6.bg-wrap — full viewport height, both-axis centering, 24px padding, background #151517 dark / #FFFFFF light. |
| 2 | **Entrance wrapper** | motion.div with initial {opacity:0, y:20} → animate {opacity:1, y:0}, transition {duration:0.5, ease:'easeOut'}; className 'max-w-md text-center' — 448px column, center-aligned. Rises 20px into place over 500ms on mount. |
| 3 | **Illustration block** | div.mx-auto.mb-8.flex.flex-col.items-center — 32px bottom margin, two stacked illustrations. |
| 4 | **Mark — rotating dashed ring (96×96)** | div.relative.w-24.h-24.mb-4 holding <svg viewBox="0 0 96 96" class="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite]"> with <circle cx=48 cy=48 r=44 stroke="var(--color-down)" strokeWidth=2 strokeDasharray="8 6" opacity=0.6/>. Larger, thicker and more opaque than the segment boundary's ring (96 vs 80, 2px vs 1.5px, 8/6 vs 6/5 dashes, 0.6 vs 0.5). |
| 5 | **Mark — inner glow** | div.absolute.inset-3.rounded-full.bg-down\/10.blur-md — 72×72 circle of #F5808C at 10% with a 12px blur (vs the segment boundary's 4px). |
| 6 | **Mark — pulsing exclamation** | motion.span with animate {scale:[1,1.15,1]}, transition {duration:2, repeat:Infinity, ease:'easeInOut'}; className 'text-down text-4xl font-bold select-none' rendering '!' at 36px/40px weight 700 in #F5808C. Breathes to 115% and back on a 2s loop — the segment boundary's mark is static. |
| 7 | **Broken chart illustration** | <svg width=120 height=32 viewBox="0 0 120 32" class="opacity-60"> with three paths, all stroked var(--color-down) at 2px, round caps and joins. (a) Rally: 'M4 28 L30 20 L50 22 L70 12 L82 8' at full opacity. (b) Break: 'M82 8 L88 10' with strokeDasharray '2 3' at opacity 0.4. (c) Crash: 'M88 10 L100 24 L116 28' at opacity 0.5. Reads as an uptrend that snaps and collapses. |
| 8 | **Headline** | h2.mb-2.text-xl.font-bold.text-d-text-primary — 'Something went wrong' at 20px/28px weight 700 in #F7F7F8 dark / #1D1D1D light (one step larger than the segment boundary's 18px). |
| 9 | **Body** | p.mb-6.text-sm.text-d-text-muted — 'An unexpected error occurred. Please try again.' at 14px/20px in #96969E dark / #5F6B75 light. Note the extra sentence versus the segment boundary. |
| 10 | **Recovery button** | button.rounded-md.bg-primary.px-6.py-2.5.text-sm.font-medium.text-primary-foreground.transition.hover:bg-primary-hover — 12px radius (NOT a pill), 24px horizontal / 10px vertical padding, #406AE4 fill, #FFFFFF ink, hover #3055C2. No border, no shadow, no active-scale — a plainer control than the segment boundary's. |

**Components** — `framer-motion (motion.div, motion.span)` · `reportError (@/lib/reportError)` · `Next.js error boundary contract { error, reset }`

**States & data.** One visual state plus an entrance animation. useEffect fires reportError({ error, boundary: 'route', digest: error.digest }) on mount and whenever `error` changes. The raw message and digest are never surfaced. 'use client'.

**Interactions.** Single 'Try again' button calling reset(); hover darkens the fill to #3055C2. Two perpetual animations run: the 8s linear ring rotation and the 2s ease-in-out scale breath on the '!'. Both plus the 500ms entrance are flattened by the global prefers-reduced-motion rule.

**Responsive.** No breakpoint classes. The 448px column, 96px mark and 120×32 chart illustration are fixed at every width; only min-h-screen and the centering adapt.

**Key copy.** 'Something went wrong' / 'An unexpected error occurred. Please try again.' / 'Try again'. The trailing 'Please try again.' distinguishes this copy from every segment boundary.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a full-screen crash page for an Indian equities trading app. The entire viewport is #151517 — deliberately one step lighter than the app's #0D0D0E canvas — with 24px padding and everything centered in a 448px column. The whole block fades in from 0% opacity while rising 20px, over 500ms with an ease-out curve. At the top, a 96×96px error mark: a circle of radius 44 in a 96×96 box, stroked 2px in #F5808C with an 8-on 6-off dash pattern at 60% opacity, rotating one full linear turn every 8 seconds; behind it a 72×72 blurred circular glow of #F5808C at 10% opacity with 12px blur; and centered over both a bold '!' at 36px in #F5808C that breathes between 100% and 115% scale on a 2-second ease-in-out loop. 16px below the mark, a small 120×32px line-chart illustration at 60% opacity, all strokes 2px #F5808C with round caps: a rally climbing from bottom-left to upper-right, then a short dashed gap at 40% opacity, then a hard collapse back down to the bottom-right at 50% opacity — an NIFTY 50 uptrend that breaks. Leave 32px below the illustration. Then 'Something went wrong' at 20px/28px weight 700 in #F7F7F8, 8px gap, then 'An unexpected error occurred. Please try again.' at 14px/20px in #96969E, 24px gap, then a solid #406AE4 button with 12px corner radius, 24px×10px padding, white 14px medium label 'Try again', hovering to #3055C2. No border and no shadow on the button. Light variant: page #FFFFFF, error red #B81C22, headline #1D1D1D, body #5F6B75.
```
</details>

---

## `/admin and all /admin/* segments (component path: app/admin/error.tsx)` — Admin error boundary

**File** `/Users/rishi/QuantX/frontend/app/admin/error.tsx` · **42 LOC** · **Access** Admin only — AdminLayout's Supabase admin check has already passed for this to be reachable.

**Shell** — AdminLayout — fixed 256px amber-accented left sidebar (#0D0D0E, 1px #29292D right border, Shield brand tile, seven nav rows, avatar/sign-out footer), main offset lg:pl-64 with an inner p-6 lg:p-8. The 60vh centered block therefore sits inside the offset content area, not the true page centre.

**Purpose.** The admin console's segment error UI. Structurally the canonical boundary, but with three deliberate deviations: the exclamation pulses, the headline uses pure white, and the recovery button is a plain 12px-radius fill rather than an accent pill.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Centering frame** | div.flex.min-h-\[60vh\].items-center.justify-center.p-6 — identical to the canonical boundary. |
| 2 | **Content column** | div.max-w-sm.text-center — 384px, center-aligned. |
| 3 | **Error mark (80×80)** | div.mx-auto.mb-6.relative.w-20.h-20 with the same three layers as the canonical boundary: an 80×80 svg rotating 8s linear infinite carrying circle cx=40 cy=40 r=36 stroke var(--color-down) strokeWidth 1.5 strokeDasharray '6 5' opacity 0.5; an inset-2 rounded-full bg-down/10 blur-sm glow; and a centered '!' at text-3xl (30px/36px) weight 700 in #F5808C. |
| 4 | **DEVIATION 1 — pulsing '!'** | The exclamation span carries an extra `animate-pulse` class: opacity 1 → 0.5 → 1 over 2s, cubic-bezier(0.4,0,0.6,1), infinite. The canonical boundary's '!' is static. |
| 5 | **DEVIATION 2 — pure-white headline** | h2.mb-2.text-lg.font-bold.text-white — 'Something went wrong' at 18px/28px weight 700 in literal #FFFFFF, not the theme token #F7F7F8. Because `text-white` is a fixed value, this heading stays white in LIGHT mode too, where it becomes invisible against the light canvas. Documented as-built. |
| 6 | **Body** | p.mb-6.text-sm.text-d-text-muted — 'An unexpected error occurred.' at 14px/20px in #96969E dark / #5F6B75 light. |
| 7 | **DEVIATION 3 — plain button** | button.rounded-md.bg-primary.px-5.py-2.text-sm.font-medium.text-d-text-primary.transition.hover:bg-primary-hover — 12px radius (not the canonical pill), 20px×8px padding, #406AE4 fill, label 'Try again', ink is text-d-text-primary (#F7F7F8) rather than pure white, no border, no elev-1 shadow, no active:scale. |

**Components** — `reportError (@/lib/reportError)` · `Next.js error boundary contract { error, reset }` · `(surrounding) AdminLayout sidebar + nav + footer`

**States & data.** One visual state. useEffect fires reportError({ error, boundary: 'route', digest: error.digest }). Error text is never displayed. 'use client'. md5 16ea269c4c145b606a6ac899dd8bc17d — genuinely distinct from both the canonical segment boundary and the root boundary.

**Interactions.** One 'Try again' button calling reset(); hover fills #3055C2 over the default Tailwind transition. Two loops run: the 8s ring rotation and the 2s opacity pulse on the '!'. Both frozen under prefers-reduced-motion.

**Responsive.** No breakpoint classes in the boundary itself. AdminLayout flips at 1024px (sidebar becomes an off-canvas drawer over a black/50 backdrop-blur scrim, main loses its 256px offset, inner padding p-8 → p-6), which shifts where the 384px block lands.

**Key copy.** 'Something went wrong' / 'An unexpected error occurred.' / 'Try again' — same strings as the canonical boundary; only the styling differs.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark error panel for an internal admin console, centered in a region at least 60% of the viewport tall inside admin chrome — a fixed 256px left sidebar on #0D0D0E with a 1px #29292D right hairline and an amber #F0A94F brand tile, with the content area offset to its right. The panel column is 384px wide, center-aligned, on a #0D0D0E background with 24px padding. At the top an 80×80px error mark: a circle of radius 36 in an 80×80 box stroked 1.5px in #F5808C with a 6-on 5-off dash pattern at 50% opacity, rotating one linear turn every 8 seconds; behind it a 64×64 blurred circular glow of #F5808C at 10% opacity with 4px blur; centered over both a bold '!' at 30px in #F5808C that pulses from 100% to 50% opacity over 2 seconds on a cubic-bezier(0.4,0,0.6,1) loop. 24px below, the headline 'Something went wrong' at 18px/28px weight 700 in pure #FFFFFF. 8px below, 'An unexpected error occurred.' at 14px/20px in #96969E. 24px below, a recovery button labelled 'Try again' at 14px weight 500: a flat #406AE4 fill with 12px corner radius — square-ish, not a pill — 20px horizontal and 8px vertical padding, ink #F7F7F8, no border and no shadow, hovering to #3055C2. Keep the panel visually quieter and flatter than the app's consumer error screens: no elevation, no pill, no press-scale. Never expose the raw error message or digest.
```
</details>

---

## `Any unmatched URL (Next.js global 404) — /not-found, /portfolio/typo, etc.` — 404 — Page not found

**File** `/Users/rishi/QuantX/frontend/app/not-found.tsx` · **37 LOC** · **Access** Any — served to signed-in and signed-out visitors identically. Note the secondary CTA points at /copilot, an authed route, so a logged-out visitor taking it will be bounced to auth.

**Shell** — NONE. Full-viewport standalone screen on bg-main (#0D0D0E dark / #EDF1F4 light) with the root noise-overlay grain on top. This is the only screen in this document rendered by a server component (no 'use client').

**Purpose.** The global not-found screen. Leads with an oversized monospace '404' in brand blue, then a headline, an explanatory paragraph, and two routes back into the product — home and the Copilot dashboard.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Viewport frame** | div.flex.min-h-screen.items-center.justify-center.bg-main.p-6 — full viewport height, centered on both axes, 24px padding, page canvas fill. |
| 2 | **Content column** | div.max-w-lg.text-center — 512px max width, center-aligned. The widest error-family column in the product (vs 448px root error, 384px segment error). |
| 3 | **404 numeral** | h1.mb-4.font-mono.text-7xl.font-black.tracking-tighter.text-primary.sm:text-8xl — the string '404' in Geist Mono at 72px/1 rising to 96px/1 at ≥640px, weight 900, letter-spacing -0.05em, colour #406AE4 in BOTH themes (--color-primary is theme-invariant). 16px bottom margin. |
| 4 | **Headline** | h2.mb-3.text-2xl.font-bold.tracking-tight.text-d-text-primary.sm:text-3xl — 'Page not found' at 24px/32px rising to 30px/36px at ≥640px, weight 700, letter-spacing -0.025em, #F7F7F8 dark / #1D1D1D light. 12px bottom margin. |
| 5 | **Explanatory paragraph** | p.mx-auto.mb-10.max-w-sm.text-sm.leading-relaxed.text-d-text-muted — capped at 384px and re-centered inside the 512px column, 14px text at line-height 1.625, colour #96969E dark / #5F6B75 light, 40px bottom margin. Copy: 'The page you're looking for doesn't exist or has been moved. Check the URL or head back to familiar territory.' |
| 6 | **CTA row** | div.flex.items-center.justify-center.gap-3 — two links side by side, 12px apart, centered. No wrapping is configured. |
| 7 | **Primary CTA** | Link href="/" — inline-flex.items-center.gap-2.rounded-xs.bg-primary.px-6.py-2.5.text-sm.font-medium.text-primary-foreground.transition.hover:bg-primary-hover. 6px corner radius (rounded-xs — notably tighter than the error screens' 12px), 24px×10px padding, #406AE4 fill, #FFFFFF ink, hover #3055C2. Contains a 16×16 ArrowLeft icon (Iconify solar:arrow-left-linear) then the label 'Go home', 8px apart. |
| 8 | **Secondary CTA** | Link href="/copilot" — inline-flex.items-center.gap-2.rounded-xs.border.border-line.bg-wrap.px-6.py-2.5.text-sm.font-medium.text-d-text-secondary with hover:border-wrap-line hover:bg-wrap-hover hover:text-d-text-primary. 6px radius, 1px #29292D border on a #151517 fill with #D3D3D7 ink (dark); on hover the border goes #3B3B40, the fill #1E1E21 and the ink #F7F7F8. Light theme: 1px #DDE5ED on #FFFFFF with #4D585F ink, hovering to #C8D4DE / #F4F7F9 / #1D1D1D. Contains a 16×16 LayoutDashboard icon (Iconify solar:widget-linear) then the label 'Dashboard'. |

**Components** — `next/link (×2)` · `ArrowLeft, LayoutDashboard from @/lib/icons (Iconify Solar linear set)`

**States & data.** Fully static server-rendered screen. No data, no client JS, no error reporting. The only dynamic dimension is the theme class on <html>.

**Interactions.** Two links. Hover on the primary darkens the fill to #3055C2; hover on the secondary lifts border, surface and ink one step each. Both use the default Tailwind `transition` timing. No focus-visible ring is declared beyond the global focus style.

**Responsive.** Two typographic breakpoints at 640px (sm): the numeral 72px → 96px and the headline 24px → 30px. The CTA row never wraps and needs roughly 340px, so it stays intact down to ~388px viewport. Padding stays 24px at all widths.

**Key copy.** '404' · 'Page not found' · 'The page you're looking for doesn't exist or has been moved. Check the URL or head back to familiar territory.' · 'Go home' · 'Dashboard'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a full-screen 404 page for an Indian NSE trading platform. Entire viewport #0D0D0E with a 1.8% film-grain overlay, 24px padding, everything centered both ways in a 512px column with center-aligned text. At the top, the numerals '404' set in a monospace face (Geist Mono) at 96px, weight 900, letter-spacing -0.05em, in brand blue #406AE4 — this is the dominant element and it keeps the same blue in light mode. 16px below, the headline 'Page not found' at 30px/36px weight 700, letter-spacing -0.025em, in #F7F7F8. 12px below, a narrower 384px paragraph re-centered inside the column reading 'The page you're looking for doesn't exist or has been moved. Check the URL or head back to familiar territory.' at 14px with a relaxed 1.625 line-height in #96969E. Leave 40px, then a single centered row of two buttons 12px apart, both with a tight 6px corner radius and 24px horizontal / 10px vertical padding and a 14px medium label. The first is a solid #406AE4 fill with white ink, a 16×16 left-arrow icon 8px before the words 'Go home', hovering to #3055C2. The second is an outlined control: 1px #29292D border on a #151517 fill with #D3D3D7 ink and a 16×16 grid/widget icon before the word 'Dashboard'; on hover its border becomes #3B3B40, its fill #1E1E21 and its ink #F7F7F8. At viewports under 640px shrink the numerals to 72px and the headline to 24px. Light variant: page #EDF1F4, headline #1D1D1D, body #5F6B75, outlined button 1px #DDE5ED on #FFFFFF with #4D585F ink.
```
</details>

---

## `/opengraph-image — edge-rendered 1200×630 PNG, referenced by openGraph.images and twitter.images in app/layout.tsx` — OpenGraph share card (live data)

**File** `/Users/rishi/QuantX/frontend/app/opengraph-image.tsx` · **356 LOC** · **Access** Public, unauthenticated. Runs on the edge runtime with `export const revalidate = 600` (10-minute cache) so a burst of crawls in one window serves one render.

**Shell** — None — a fixed 1200×630 canvas. `export const size = { width: 1200, height: 630 }`, `contentType = 'image/png'`, `alt = 'Quant X — AI swing trading intelligence for Indian markets'`.

**Purpose.** The brand share card every Twitter/X, WhatsApp, Slack and LinkedIn crawler renders when quantx.app is shared. Generated programmatically (never a static PNG) so it can never drift from brand colour, and hydrated with live market-regime and signal-of-the-day data so a card shared during a bull run actually says so.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Canvas** | 1200×630, display flex column, padding 80px on all sides, position relative, color #FFFFFF, fontFamily sans-serif. Background: linear-gradient(135deg, #0D0D0E 0%, #151517 60%, #0D0D0E 100%). |
| 2 | **Cyan accent blob** | position absolute, right -120px, top -80px, 500×500px, border-radius 50%, background radial-gradient(circle, rgba(82,144,244,0.18) 0%, transparent 60%). Bleeds off the top-right corner. |
| 3 | **Blue accent blob** | position absolute, left -100px, bottom -100px, 420×420px, border-radius 50%, background radial-gradient(circle, rgba(64,106,228,0.14) 0%, transparent 60%). Bleeds off the bottom-left corner. |
| 4 | **Live regime pill (conditional)** | Rendered only when the regime fetch succeeded. position absolute, top 60px, right 60px, flex row, gap 8px, padding 8px 18px, border-radius 999px, border 1px solid `${regimeColor}55` (33% alpha), background `${regimeColor}14` (8% alpha), color regimeColor, fontSize 20px, fontWeight 600, textTransform capitalize, letterSpacing -0.01em. Leading 10×10px 50%-radius dot filled regimeColor. Text: `{regime.name} regime · {Math.round(conf*100)}%`. REGIME_COLORS = bull #10B981, sideways #F0A94F, bear #F5808C; the fallback ink when no regime resolves is #8FB0FF. |
| 5 | **Brand chip (top-left)** | flex row, align center, gap 14px, position relative. A 44×44px tile at 12px border-radius filled linear-gradient(135deg, #5290F4 0%, #406AE4 100%) containing the letter 'Q' at 22px weight 700 in #FFFFFF; beside it the wordmark 'Quant X' at 24px weight 600, letterSpacing -0.01em, white. |
| 6 | **Headline block** | flex column, marginTop auto (pins the whole block to the bottom of the 80px-padded canvas), gap 24px, position relative. |
| 7 | **Headline line 1** | 'Institutional AI' — fontSize 78px, lineHeight 1.05, fontWeight 600, letterSpacing -0.02em, colour #FFFFFF. |
| 8 | **Headline line 2** | 'for Indian traders.' — same metrics, colour #8FB0FF (brand ink). |
| 9 | **Subhead** | 'Eight proprietary engines · public track record · paper-trade free' — fontSize 24px, colour rgba(255,255,255,0.65), maxWidth 900px, lineHeight 1.4, marginTop 8px. |
| 10 | **Bottom strip A — live signal chip (when signal data exists)** | Outer flex row, gap 20px, marginTop 24px. Inner chip: flex row, align center, gap 14px, padding 14px 22px, border-radius 14px, border 1px solid rgba(143,176,255,0.30), background rgba(143,176,255,0.08). Contents in order: (1) eyebrow at 14px, rgba(255,255,255,0.55), uppercase, letterSpacing 0.06em, reading 'Top signal today' for kind='active' or 'Best closed · last 7d' for kind='closed_winner'; (2) a 1×24px divider in rgba(255,255,255,0.20); (3) the symbol at 24px weight 600 in #FFFFFF, letterSpacing -0.01em; (4) the value at 20px weight 600, letterSpacing 0.04em, coloured #10B981 when direction === 'LONG' else #F5808C, rendering `${direction} · conf ${confidence}` for an active signal or `${pct>=0?'+':''}${pct.toFixed(2)}% closed` for a closed winner. |
| 11 | **Bottom strip B — static stat strip (fallback)** | flex row, align center, gap 48px, marginTop 24px. Three Stat blocks separated by two 1×40px dividers in rgba(255,255,255,0.12). Stat = flex column, gap 4px: a value line at 28px weight 600 in the accent colour above a label line at 14px, rgba(255,255,255,0.55), letterSpacing 0.04em, uppercase. The three are: value 'NSE' / label 'NSE-native' / accent #8FB0FF; value '3 tiers' / label 'Free / Pro / Elite' / accent #FFFFFF; value 'Public' / label 'Track record' / accent #8FB0FF. |

**Components** — `ImageResponse from 'next/og'` · `Local Stat({ value, label, accent }) helper (lines 347-356)` · `fetchLiveData() — parallel edge fetches`

**States & data.** FOUR renderable permutations driven by fetchLiveData(). Sources: `${NEXT_PUBLIC_API_URL}/api/public/regime/history?days=7` (reads data.current.regime plus data.current[`prob_${name}`] into { name, conf }) and `${NEXT_PUBLIC_API_URL}/api/public/signal-of-the-day` (branches on data.kind === 'active' → { symbol, direction, confidence } or 'closed_winner' → { symbol, direction, return_pct }). Both use { headers: {Accept: application/json}, next: { revalidate: 600 } }, are wrapped in Promise.all with per-request .catch(() => null), and the whole block sits in a try/catch that swallows failures silently. If NEXT_PUBLIC_API_URL is unset the function short-circuits to { regime: null, signal: null }. Permutations: (1) regime + signal — pill top-right AND the signal chip at the bottom; (2) regime only — pill plus the three-Stat fallback strip; (3) signal only — no pill, signal chip at the bottom; (4) neither — the pure static card with no pill and the three-Stat strip. This is a single-file surface with no dark/light variance: the card is always dark.

**Interactions.** None — it is a PNG. The only 'interaction' is the 600-second revalidation window and the crawler's own re-fetch cadence.

**Responsive.** Fixed 1200×630 with no media queries. Consumers crop it: Twitter/X summary_large_image renders roughly 2:1, so keep the regime pill inside the top-right 60px inset and the headline block inside the bottom-safe area. layout.tsx additionally declares twitter.card = 'summary_large_image' because Twitter ignores OG images without it.

**Key copy.** 'Quant X' · 'Institutional AI' · 'for Indian traders.' · 'Eight proprietary engines · public track record · paper-trade free' · 'Top signal today' · 'Best closed · last 7d' · 'NSE' / 'NSE-native' · '3 tiers' / 'Free / Pro / Elite' · 'Public' / 'Track record' · alt text 'Quant X — AI swing trading intelligence for Indian markets'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a 1200×630px social share card for Quant X, an AI swing-trading platform for Indian markets. Background is a 135-degree gradient from #0D0D0E at 0% through #151517 at 60% back to #0D0D0E at 100%, with 80px padding on all sides. Two soft radial glows bleed off the corners: a 500×500 circle at rgba(82,144,244,0.18) fading to transparent at 60%, positioned 120px past the right edge and 80px above the top; and a 420×420 circle at rgba(64,106,228,0.14) fading to transparent at 60%, positioned 100px past the left edge and 100px below the bottom. Top-left: a 44×44px tile with 12px radius filled with a 135-degree gradient from #5290F4 to #406AE4 holding a white 'Q' at 22px weight 700, then 14px of space and the wordmark 'Quant X' at 24px weight 600. Top-right, inset 60px from both edges: a fully rounded pill with an 8px/18px padding, a 1px border of #10B981 at 33% alpha over a #10B981 8%-alpha fill, a 10px solid #10B981 dot, then the text 'Bull regime · 74%' at 20px weight 600 in #10B981. Pinned to the bottom of the padded area: two headline lines at 78px, weight 600, line-height 1.05, letter-spacing -0.02em — 'Institutional AI' in white and 'for Indian traders.' in #8FB0FF — with 24px between them, then 'Eight proprietary engines · public track record · paper-trade free' at 24px in rgba(255,255,255,0.65). Below that, a chip with 14px radius, a 1px rgba(143,176,255,0.30) border on a rgba(143,176,255,0.08) fill and 14px/22px padding, containing 'TOP SIGNAL TODAY' at 14px uppercase in rgba(255,255,255,0.55), a 1×24px rgba(255,255,255,0.20) divider, 'RELIANCE' at 24px weight 600 white, and 'LONG · conf 82' at 20px weight 600 in #10B981. Also produce the fallback variant that replaces the chip with three stats spaced 48px apart and split by 1×40px rgba(255,255,255,0.12) dividers: 'NSE' over 'NSE-NATIVE' in #8FB0FF, '3 tiers' over 'FREE / PRO / ELITE' in white, and 'Public' over 'TRACK RECORD' in #8FB0FF, values at 28px weight 600 and labels at 14px uppercase in rgba(255,255,255,0.55).
```
</details>

---
