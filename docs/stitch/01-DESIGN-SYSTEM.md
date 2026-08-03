# QUANT X — DESIGN SYSTEM (AS-BUILT)

> **Purpose of this document.** This is the *as-built* specification of the Quant X
> frontend — what actually renders today, extracted from source, not what any plan
> says should render. It exists so the app can be redesigned in **Google Stitch**
> without losing a single token, layout rule, or screen.
>
> **How to use it with Stitch.** Paste §1–§9 of this file as your *system context*
> at the start of a Stitch session. Then paste one screen prompt from
> `03-STITCH-PROMPTS.md` per generation. The screen prompts assume this file has
> already been given.
>
> **Source of truth:** `frontend/tailwind.config.ts`, `frontend/app/globals.css`,
> `frontend/app/layout.tsx`, `frontend/components/foundation/`, `frontend/components/shell/`.

---

## 0. WHAT THE PRODUCT IS

Quant X is an **AI-native trading intelligence platform for the Indian equity and
derivatives markets (NSE/BSE)**. It is not a broker and not a charting terminal. It
is a machine that forms opinions about Indian stocks and shows its work.

Four things the UI must carry:

| # | Job | Where it lives |
|---|---|---|
| 1 | **Ask and be answered** — a conversational AI copilot is the home surface, not a bolt-on widget | `/copilot` |
| 2 | **Be told what to look at** — engine-generated signals with a public track record | `/signals`, `/markets` |
| 3 | **Investigate a name** — a deep per-stock AI dossier (17 analysis cards) | `/stock/[symbol]` |
| 4 | **Act and account for it** — paper + live portfolio, trades, risk, an automated bot | `/portfolio`, `/trades`, `/autopilot`, `/risk` |

**Register:** a calm professional instrument. Near-black trading terminal in dark
mode, cool daylight white in light mode. Dense where density is earned (tables,
option chains), calm everywhere else. Colour is rationed — see §3.

**Locale:** India. Currency is `₹` with **Indian numbering** (lakh / crore, `1,23,456`
grouping). Times are **IST**. Market hours 09:15–15:30 IST. Symbols are NSE tickers
(`RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, `NIFTY 50`, `BANKNIFTY`).

**Compliance:** every authenticated surface renders a statutory footer stating the
company is *not* a SEBI-registered Research Analyst, plus a SCORES grievance route.
This is legally required and must survive any redesign.

---

## 1. TECH SUBSTRATE

| Layer | Choice |
|---|---|
| Framework | Next.js 14.1, **App Router** |
| React | 18.2 |
| Styling | Tailwind CSS 3.4 + a CSS-variable token layer in `globals.css` |
| Primitives | Radix UI (14 packages), shadcn-derived, wrapped in a local `foundation/` layer |
| Motion | framer-motion 10 + hand-written CSS keyframes |
| Charts | recharts 2.15 (analytics), lightweight-charts 4.2 (price/candles), hand-rolled SVG (sparklines) |
| Tables | @tanstack/react-table 8 + @tanstack/react-virtual 3 |
| Icons | lucide-react 0.314 (primary) + @iconify/react (lucide, solar, ri, fa6-brands sets) |
| Toasts | sonner |
| State/data | swr 2 + zustand 4 |
| Theming | next-themes, `defaultTheme="system"`, `enableSystem` |
| Fonts | **Geist Sans** (all text + display) · **Geist Mono** (numerics only), via `geist/font` |
| AI | Vercel AI SDK (`ai` 7, `@ai-sdk/react`) streaming into the copilot thread |
| Auth | Supabase |

**Theme mechanism.** `next-themes` sets `html.light` / `html.dark`. Every semantic
class resolves to a CSS variable, so the *entire* app re-skins from variable values
alone. **No component contains a hex literal** — a pre-commit hook
(`scripts/check_frontend_hex_literals.sh`) rejects any new file under `app/` or
`components/` that uses an arbitrary hex Tailwind class.

**Alpha-channel rule.** Colours are declared as `rgb(var(--rgb-x) / <alpha-value>)`
channel triplets, *not* as `var()` strings — otherwise Tailwind opacity modifiers
(`bg-up/10`) silently generate nothing.

---

## 2. SURFACE RAMP — 5 opaque tiers

Depth comes from a **surface step + a hairline**, not from translucency. This is the
single most important visual rule in the system.

| Tier | Role | Dark | Light |
|---|---|---|---|
| **L-1** | Inset well — table stripes, code blocks, recessed inputs | `#0A0A0B` | `#E7ECF1` |
| **L0** | Page canvas | `#0D0D0E` | `#EDF1F4` |
| **L1** | **The card.** Also sidebar, topbar, drawer | `#151517` | `#FFFFFF` |
| **L2** | Elevated / row hover / nested panel | `#1E1E21` | `#F4F7F9` |
| **L3** | Hairline border | `#29292D` | `#DDE5ED` |
| **L4** | Accent / hover border | `#3B3B40` | `#C8D4DE` |
| **L3-overlay** | Popovers, command palette, dialogs | `#26262A` | `#FFFFFF` |

**The resting card recipe** (`.lg-surface` / `.glass-surface` / `.glass-card`):
```
background: L1 · border: 1px solid L3 · box-shadow: elev-1
```

**Nesting rule — no card inside a card.** Content nested inside a card uses
`.tile-tint` / `.panel-inset`: `background: L2`, `border-radius: 12px`, **no border,
no shadow**. Nesting is expressed by the surface step alone.

**Translucency is reserved.** Exactly one recipe still blurs — `.glass-float` /
`.glass-pill`, used *only* for surfaces that float above content **and are
dismissible**: command palette, sheets, dropdowns, sticky bars.
```
background: color-mix(in srgb, L3-overlay 86%, transparent)
backdrop-filter: blur(20px) saturate(1.5)
border: 1px solid L3 · box-shadow: elev-3
```
Everything anchored in the page is **opaque**. There is no app-wide mesh gradient,
no frosted glass on cards, no neon.

---

## 3. COLOUR — one accent, rationed semantics

### 3.1 The single brand accent — glossy fintech blue

| Token | Dark | Light | Use |
|---|---|---|---|
| **Accent FILL** | `#406AE4` | `#406AE4` | primary buttons, active states, selected chips. **White ink sits on it** (4.77:1) |
| Accent fill hover | `#3055C2` | `#3055C2` | pressed/hover (white 6.55:1) |
| **Accent INK** | `#8FB0FF` | `#3459C9` | accent-coloured *text*, links, icon accents (9.1:1 dark / 6.14:1 light) |
| AI / Copilot accent | `#8FB0FF` | `#3459C9` | identical to accent ink — AI is not a separate colour |
| Cyan (live / energy) | `#5290F4` | `#2563EB` | live indicators, streaming states |

> **The fill/ink split is mandatory.** The accent is a *fill* colour. Used as text
> it must switch to the ink value or every `bg-primary/10 text-primary` chip drops
> below contrast. In Tailwind, `bg-primary`/`border-primary` = fill, `text-primary`
> = ink, `text-primary-foreground` = white.

### 3.2 Financial semantics — **P&L ONLY, never chrome**

| Token | Dark | Light | Contrast |
|---|---|---|---|
| **up** (profit, gain, bullish) | `#10B981` | `#0A6B50` | 6.9:1 / 6.50:1 |
| **down** (loss, bearish) | `#F5808C` | `#B81C22` | 8.1:1 / 6.51:1 |
| **warning** (true caution only) | `#F0A94F` | `#9A4D00` | 9.7:1 / 6.1:1 |

Green and red are **financial semantics**. They never appear as UI chrome — no green
"success" buttons, no red "delete" fills. A completed agent step is rendered **muted
grey**, deliberately, because a finished step is not a profit.

### 3.3 Ink

| Role | Dark | Light |
|---|---|---|
| Primary text | `#F7F7F8` (17.6:1) | `#1D1D1D` (16.9:1) |
| Secondary text | `#D3D3D7` (13.0:1) | `#4D585F` (7.3:1) |
| Tertiary / muted | `#96969E` (6.6:1) | `#5F6B75` (5.5:1) |

Every foreground/background pair is WCAG-validated by `scripts/validate-theme.mjs`.

### 3.4 The one gradient family

```
--gradient-signature / --gradient-cta:
  linear-gradient(110deg, #3B82F6 0%, #406AE4 100%)
--gradient-text (dark):  linear-gradient(110deg, #AFC6FF 0%, #7FA3FF 100%)
--gradient-text (light): linear-gradient(110deg, #3055C2 0%, #406AE4 100%)
```
Anything on a signature/CTA fill wears **`#FFFFFF`** ink in both themes. There is no
second gradient family. No rainbow, no neon, no glass tint.

### 3.5 Chart colour

| Token | Dark | Light |
|---|---|---|
| Series primary | `#8FB0FF` | `#406AE4` |
| Series secondary | `#96969E` | `#5F6B75` |
| Tooltip background | `#1E1E21` | `#FFFFFF` |
| Grid lines | `rgba(255,255,255,0.06)` | `rgba(29,29,29,0.06)` |

Candles/volume bars use up/down semantics. A shadow **never** carries colour.

### 3.6 Per-screen colour budget

Beyond the neutral ramp, a single screen should carry **the accent + at most the two
P&L semantics**. Warning is a fourth only when something is genuinely at risk.

---

## 4. TYPOGRAPHY — 11 roles, floor 11px

One family, **Geist Sans**, for everything including display headings. **Geist Mono**
for numerics only — functional alignment, not decoration.

### 4.1 Prose roles (7)

| Role | Size / line-height | Tracking | Weight | Use |
|---|---|---|---|---|
| `display` | 34 / 40 | −0.02em | 600 | page hero, the one biggest thing |
| `title` | 24 / 32 | −0.015em | 600 | section titles, modal titles |
| `heading` | 17 / 24 | −0.01em | 600 | **card headers** |
| `body` | 15 / 24 | — | 400 | prose, AI replies, descriptions |
| `label` | 13 / 18 | — | 500 | form labels, button text, list rows |
| `meta` | 12 / 16 | — | 400 | timestamps, secondary annotations |
| `micro` | 11 / 14 | +0.06em | 500 | **eyebrows, table column headers, provenance** — uppercase |

### 4.2 Numeric roles (4) — always `font-mono tabular-nums`

| Role | Size / line-height | Use |
|---|---|---|
| `num-hero` | 40 / 44 | the one headline number on a screen (portfolio value, P&L) |
| `num-lg` | 22 / 28 | KPI tiles, stat cards |
| `num` | 14 / 20 | table cells, inline prices |
| `num-sm` | 13 / 18 | dense tables, secondary figures |

**The floor is 11px, and 11px is `micro` only.** 8 / 8.5 / 9 / 9.5 / 10 / 10.5px are
banned.

Body letter-spacing is globally `-0.1px`; `.numeric` uses `-0.01em`, `.num-display`
`-0.02em` with `tnum` on. Display headings use `text-wrap: balance`.

---

## 5. RADIUS — 5 steps, no exceptions

| Token | Value | Used for |
|---|---|---|
| `xs` | **6px** | chips, badges, tags, table-cell backgrounds |
| `sm` | **8px** | inputs, buttons, list rows |
| `md` | **12px** | **THE default card**, panels, dropdowns, menus |
| `lg` | **16px** | hero cards, modals, sheets |
| `full` | **9999px** | pills, avatars, icon buttons |
| `mark` | 2px | **data-viz only** — candle bodies, volume bars. Never chrome. |

Usage budget: `md` = card/panel/dropdown · `sm` = input/button/list row · `full` =
badge/pill/avatar/icon button · `lg` = modal/sheet/**one** hero card per screen.

---

## 6. SPACING & LAYOUT

### 6.1 Scale
`0 · 4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64 · 80 · 96 · 128` px.
Nothing outside this scale.

### 6.2 Page geometry (authenticated shell)

```
┌──────────┬─────────────────────────────────────────────┬────────┐
│ SIDEBAR  │  MAIN PANE                                  │ RIGHT  │
│ fixed    │  scrolls                                    │ RAIL   │
│ 240px    │  content capped max-width 1440px            │ fixed  │
│ (68px    │  gutters: 16px mobile / 24px ≥md            │ 72px   │
│ collapsed│                                             │ icons  │
│ bg = L1  │  bg = L0                                    │ bg = L0│
└──────────┴─────────────────────────────────────────────┴────────┘
                                                    ↑ desktop (≥lg)
```

- **No global top bar on desktop.** Per-page breadcrumbs live inside the page.
- Below `lg`: sidebar and right rail disappear; a **mobile-only Topbar** appears and
  opens a **MobileDrawer**; content goes full width with 16px gutters.
- Sidebar collapse state persists to `localStorage` (`quantx.sidebar.collapsed.v2`).
- Margin transition on collapse: `200ms`.
- A **skip-to-content** link is the first focusable element (WCAG 2.4.1).
- `ComplianceFooter` renders inside the 1440px cap on **every** authed surface.

### 6.3 Card padding
- Standard trading surface: **20px**
- Feature card: **24px**
- Card header type: `heading` (17/600)

### 6.4 Density tiers
| Tier | Row height | Where |
|---|---|---|
| **A — Calm** | generous, 24px rhythm | copilot thread, home, onboarding, settings |
| **B — Standard** | 16px rhythm | signals, strategies, portfolio, markets |
| **C — Instrument** | dense, `DataTable dense` | screener results, option chains, trade log, admin |

One tier per surface. Do not mix.

---

## 7. ELEVATION — 3 neutral levels

Shadows never carry colour. Dark leans on **borders first**, light leans on **shadow
first** — so each theme gets its own opacity recipe.

| Level | Dark | Light |
|---|---|---|
| `elev-1` (resting card) | `0 1px 2px rgba(0,0,0,.30), 0 4px 12px -6px rgba(0,0,0,.40)` | `0 1px 2px rgba(29,29,29,.04), 0 4px 12px -6px rgba(29,29,29,.10)` |
| `elev-2` (hover / raised) | `0 2px 6px rgba(0,0,0,.36), 0 12px 28px -12px rgba(0,0,0,.52)` | `0 2px 4px rgba(29,29,29,.06), 0 12px 28px -12px rgba(29,29,29,.16)` |
| `elev-3` (floating overlay) | `0 8px 24px -8px rgba(0,0,0,.50), 0 32px 64px -24px rgba(0,0,0,.64)` | `0 8px 24px -8px rgba(29,29,29,.14), 0 32px 64px -24px rgba(29,29,29,.20)` |

---

## 8. MOTION — 4 durations, 2 easings

| Duration | Value | Use |
|---|---|---|
| `instant` | **90ms** | hover, focus, press — must feel free |
| `fast` | **160ms** | chips, tabs, tooltips, toggles |
| `base` | **240ms** | cards, panels, dropdowns, content |
| `slow` | **380ms** | sheets, modals, layout, chart draw |

```
--ease-out: cubic-bezier(0.22, 1, 0.36, 1)   /* everything that ENTERS */
--ease-in:  cubic-bezier(0.64, 0, 0.78, 0)   /* everything that LEAVES */
```

### 8.1 The named motions that exist

| Name | Spec |
|---|---|
| Overlay scrim | `overlay-in` 160ms / `overlay-out` 140ms, opacity only |
| Popover / dropdown | `pop-in` 180ms / `pop-out` 140ms, scale 0.97→1 from trigger origin |
| Tooltip | `tip-in` 125ms / `tip-out` 100ms |
| Dialog | `dialog-in` 200ms / `dialog-out` 160ms, centred, scale 0.97→1 |
| Sheet | 250ms in / 200ms out, `cubic-bezier(0.32,0.72,0,1)`, per edge |
| Accordion | `accordion-down` 200ms / `accordion-up` 160ms, real height transition |
| **AI thinking shimmer** (`.ai-shimmer`) | bright highlight sweeps muted text via `background-clip:text`, 2.1s linear infinite |
| Streaming caret | `blink-cursor` 1.05s steps(1) infinite |
| Composer focus ring | rotating conic hairline, 4s linear, only on `:focus-within` |
| **Price tick flash** | `280ms` opacity flash, up/down tinted, GPU-only |
| Ticker marquee | `translateX(0 → -50%)`, default 40s linear, pauses on hover |
| Count-up | 0.5s, translateY(8px) + blur(4px) → 0 |
| Press | `spring-press:active` scale(0.96), `cubic-bezier(0.34,1.56,0.64,1)` |
| Lift | `translateY(-3px)` on hover, 260ms |

`prefers-reduced-motion: reduce` collapses **all** animation/transition to 0.01ms;
`.ai-shimmer` falls back to flat secondary ink.

---

## 9. FOUNDATION COMPONENT CONTRACT

Every page imports from `@/components/foundation` only. Buttons, cards, modals,
toasts, popovers, selects and loaders are never reinvented in page code.

| Tier | Component | API |
|---|---|---|
| **Base** | `Button` | `variant: primary \| secondary \| ghost \| danger` × `size: sm \| md \| lg` |
| | `Input` | `label`, `error`, forwardRef |
| | `Card` / `CardHeader` / `CardBody` / `CardFooter` | `variant: static \| clickable` |
| | `Skeleton` | `w`, `h`, `rounded: sm \| md \| lg \| full` |
| | `Badge` | `tone: primary \| up \| down \| warning \| muted` |
| | `Dialog` | controlled, Radix, sr-only Description auto-rendered |
| | `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` | Radix |
| **Feedback** | `toast` | sonner — `.success/.error/.info/.promise/.loading` |
| | `Tooltip` | `content`, `side`, `delayMs` — **non-interactive hints only** |
| **Overlay** | `Popover` | **interactive content** |
| | `DropdownMenu` + `DropdownItem` (+ `destructive`) | **action lists** |
| | `Sheet` | `side: top \| right \| bottom \| left`, `title`, `description` |
| **Form** | `Select` | Radix picker, `options`, `label`, `error`, `helper`, `size` |
| | `NumericInput` | `formatter: integer \| decimal \| percent \| currency-inr \| multiplier`, steppers, wheel-blur |
| **Layout** | `PageHeader` | `eyebrow` · `title` · `description` · `actions`; stacks < md |
| | `EmptyState` | `icon`, `title`, `description`, `action`, `tone`, `size`, aria-live |
| | `ErrorState` | error surface twin of EmptyState |
| **Data** | `ChangeBadge` | `value`, `kind: percent \| currency-inr \| plain`, `filled`, `size: xs\|sm\|md` — auto sign, auto colour, auto arrow, **Indian numbering** |
| | `Sparkline` / `Spark` | `data: number[]`, `tone: auto \| up \| down \| neutral`, `filled` — hand-rolled SVG |
| | `StatCard` / `StatTile` | `label`, `value`, `delta`, `spark`, `tooltip` + loading/error baked in |
| | `DataTable` | generic, `columns: Column<Row>[]`, `onRowClick`, `loading`/`empty`/`error` slots, controlled sort, sticky first column, `hideOnMobile` per column |
| | `Segmented` | the Mock \| Live style toggle |
| | `Verdict` · `WinRateGauge` · `UsageMeter` | domain verdict + gauge + quota meter |
| **Misc** | `EyebrowMono` · `Reveal` · `Spinner` · `ConfirmDialog` · `DisclaimerFooter` | |

### 9.1 Control recipes

| Recipe | Spec |
|---|---|
| Neutral control (`.glass-control`) | `bg: L2` · `border: 1px L3` · hover `bg: +6% ink over L2`, `border → L4` |
| Accent control (`.glass-control-accent`) | `bg: #406AE4` · `border: same` · `color: #fff` · `shadow: elev-1` · hover `#3055C2`. **No gradient, no glow** — the primary button is the most legible thing on screen, not the most decorated |
| Danger control (`.glass-control-danger`) | `bg: 12% down over L1` · `border: 32% down` · hover 18% / 46%. Destructive reads **serious, not alarming** — the alarm belongs to the confirm step |

### 9.2 States every component handles

| State | Mechanism |
|---|---|
| Loading | `Skeleton` · `StatCard.loading` · `DataTable.loading` (N skeleton rows) |
| Empty | `EmptyState`, or `DataTable.empty` slot |
| Error | `EmptyState tone="error"` · `StatCard.error` · `DataTable.error` |
| Focus | `focus-visible:ring-2 ring-primary/40`; global `*:focus-visible` = 2px `#406AE4` outline, 2px offset |
| Hover | token-driven `hover:bg-wrap-hover` on every clickable surface |
| Mobile | ≥44px tap targets, DataTable horizontal scroll + sticky first column, Sheet `side="bottom"` |

### 9.3 Trading conventions

| Need | Component |
|---|---|
| Price change | `<ChangeBadge value={pct} kind="percent" />` |
| ₹ delta | `<ChangeBadge value={d} kind="currency-inr" />` — lakh/crore |
| Numeric field | `<NumericInput formatter="percent" />` — wheel won't change value |
| Mobile filters | `<Sheet side="right" title="Filters">` |
| Confirm | `<Dialog>` (centred modal, never a Sheet) |
| Kebab menu | `<DropdownMenu>` + `<DropdownItem destructive>` |
| KPI | `<StatCard label value delta spark />` |
| List page | `PageHeader` + `DataTable` + `EmptyState` in the `empty` slot |

---

## 10. GLOBAL BEHAVIOURS

| Behaviour | Spec |
|---|---|
| **Command palette** | `⌘K` / `Ctrl+K` toggles; `Esc` closes it and the mobile drawer |
| **Theme** | system-default tri-state via next-themes; animated toggle uses View Transitions |
| **Scrollbar** | 5px, transparent track, pill thumb at 12% ink (22% on hover) |
| **Selection** | `color-mix(in srgb, #406AE4 28%, transparent)` |
| **Body texture** | a `noise-overlay` on `<body>`; a single static accent pool anchored top-left at 6% opacity via `.app-canvas::before`. No animated mesh gradient. |
| **Safe areas** | `viewportFit: 'cover'`; `.safe-top/-bottom/-left/-right` utilities; `100dvh` helpers |
| **iOS zoom guard** | inputs ≥16px below 768px |
| **Print** | dedicated print stylesheet for the Portfolio Doctor PDF export |
| **Offline / halt** | `OfflineBanner` and `SystemHaltBanner` are global banner surfaces |
| **theme-color** | `#0D0D0E` |

---

## 11. DON'TS (enforced)

1. **No hex literals in components.** Pre-commit hook blocks `bg-[#XXXXXX]`.
2. **No sixth radius.** Five UI steps + `mark` for data-viz.
3. **No green/red as chrome.** They mean P&L and nothing else.
4. **No card inside a card.** Use `.panel-inset` (L2, no border, no shadow).
5. **No blur on anchored surfaces.** Blur means "floating and dismissible".
6. **No type below 11px**, and 11px is `micro` only.
7. **No second gradient family.** One glossy blue, white ink on it.
8. **No colour in a shadow.**
9. **No inline `<button>`** — use `Button` or `DropdownItem`.
10. **No inline "no data" message** — use `EmptyState`.
11. **Tooltip = hint · Popover = interactive · DropdownMenu = actions.** Never mixed.
12. **Every `DataTable` gets an `ariaLabel`.**

---

## 12. STITCH SYSTEM PROMPT (paste this block first)

```
Design a professional AI-powered stock trading intelligence app for the Indian
market (NSE/BSE), called Quant X.

VISUAL SYSTEM — follow exactly:
• Two themes. DARK (default): page #0D0D0E, cards #151517, elevated #1E1E21,
  borders #29292D, inset #0A0A0B. LIGHT: page #EDF1F4, cards #FFFFFF, elevated
  #F4F7F9, borders #DDE5ED, inset #E7ECF1.
• Text DARK: primary #F7F7F8, secondary #D3D3D7, muted #96969E.
  Text LIGHT: primary #1D1D1D, secondary #4D585F, muted #5F6B75.
• ONE accent: glossy fintech blue #406AE4 as a FILL with white text on it
  (hover #3055C2). As coloured TEXT use #8FB0FF on dark, #3459C9 on light.
  One gradient only: linear-gradient(110deg, #3B82F6, #406AE4), white text on it.
• Green and red are ONLY for profit and loss, never for buttons or chrome.
  Profit #10B981 dark / #0A6B50 light. Loss #F5808C dark / #B81C22 light.
  Caution amber #F0A94F dark / #9A4D00 light.
• Depth comes from a surface step plus a 1px hairline border — cards are OPAQUE.
  Only floating dismissible surfaces (command palette, sheets, dropdowns) use
  a 20px backdrop blur. No glassmorphism on cards. No mesh gradients. No neon.
• Typography: Geist Sans for everything, Geist Mono with tabular figures for all
  numbers. Roles: display 34/40 w600 · title 24/32 w600 · heading 17/24 w600
  (card headers) · body 15/24 · label 13/18 w500 · meta 12/16 · micro 11/14
  uppercase +0.06em w500 (eyebrows, table column headers). Numbers: hero 40/44,
  large 22/28, standard 14/20, small 13/18. Never go below 11px.
• Corner radius, exactly five: 6px chips/badges · 8px inputs/buttons/list rows ·
  12px cards/panels/dropdowns · 16px modals/sheets/hero card · fully rounded
  pills/avatars/icon buttons.
• Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px. Card padding 20–24px.
• Shadows are neutral grey, never coloured. Three levels: resting card, hover,
  floating overlay.
• Layout (desktop): fixed 240px left sidebar on the card surface, main content
  area capped at 1440px with 24px gutters, fixed 72px right icon rail. No top
  bar on desktop. Below 1024px: hamburger top bar + slide-in drawer, full-width
  content, 16px gutters.

CONTENT RULES:
• All money is ₹ with Indian numbering (₹1,23,456 / ₹4.2 L / ₹1.8 Cr).
• All times are IST. Market hours 09:15–15:30 IST.
• Use real NSE tickers: RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, SBIN,
  BHARTIARTL, and indices NIFTY 50, BANKNIFTY, NIFTY IT.
• Tone is a calm professional instrument, not a consumer fintech toy.
```

---

*Companion documents:*
- `02-SCREEN-INVENTORY.md` — every screen, its anatomy, states and interactions
- `03-STITCH-PROMPTS.md` — one paste-ready Stitch prompt per screen
