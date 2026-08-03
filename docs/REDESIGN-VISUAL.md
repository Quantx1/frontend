# QUANT X — VISUAL SPEC v6 "CALM INSTRUMENT"
### Turning the v5 *Instrument* system into the FinStocks register

**Verified against:** `frontend/docs/DESIGN.md` (536 ln), `frontend/app/globals.css` (1,404 ln), `frontend/tailwind.config.ts` (315 ln), `components/foundation/{Card,Button,Badge,Verdict,EyebrowMono,StatTile,Sparkline,DataTable,Segmented}.tsx`, `components/copilot/ChatArtifacts.tsx`.

---

## 0. The one-line diagnosis

The v5 token system is **already correct**. What ships is not v5.

| v5 says | What the codebase actually contains | Evidence |
|---|---|---|
| 5 radius steps | 10 class names → 6 pixel values, 1,207 uses | `tailwind.config.ts:280-292` |
| A calm type scale of 10 roles | **25 distinct arbitrary px sizes, 1,846 occurrences** | grep `text-[Npx]` across `app/` + `components/` |
| Depth from hierarchy, not blur | `.glass-*` in **88 files**; `backdrop-blur` in 12 | globals.css:884-1005 |
| Motion communicates state | `animate-spin` ×131, `animate-pulse` ×68, `animate-ping` ×8, `repeat:Infinity` ×6, `animate-marquee` ×4 | grep |
| Numbers are the typography | **658 occurrences at ≤10.5px**; `StatTile`'s value is `text-xs` = 12px | `StatTile.tsx:70-72` |

v6 is therefore **not a re-theme. It is an enforcement pass plus four new rules** (density tiers, the one-card rule, the light default, the single disclosure).

---

## 1. WHAT ALREADY WORKS — KEEP VERBATIM

These are the parts of v5 that the reference language would have arrived at independently. Do not touch them.

### 1.1 The surface ramp — keep, it is exactly right
`globals.css:30-41` (dark) / `196-207` (light). Five opaque tiers, depth from a step in the ramp plus a hairline, never a blur.

```
L0 canvas   --color-main         #0D0D0E / #EDF1F4
L1 card     --color-wrap         #151517 / #FFFFFF
L2 raised   --color-wrap-hover   #1E1E21 / #F4F7F9
L3 overlay  --color-surface-3    #26262A / #FFFFFF
L-1 inset   --color-surface-inset #0A0A0B / #E7ECF1
hairline    --color-line         #29292D / #DDE5ED
```
This is the FinStocks near-white register already, in light. Nothing needs to be invented.

### 1.2 The semantic colour contract — keep, and enforce harder
`globals.css:79-101` / `216-234`. One accent (`#406AE4` fill; ink `#8FB0FF` dark / `#3459C9` light). `up`/`down` are P&L semantics only. **`--color-ai` is aliased to the brand ink** (`globals.css:83`, `220`) — there is no separate "AI purple". That single decision is why the product can look like a 2026 AI SaaS app instead of a chatbot toy. Every contrast pair is AA-validated (ink 16.9:1, desc 7.3:1, muted 5.5:1, up 6.50:1, down 6.51:1, accent-ink 6.14:1 on white).

### 1.3 The agent-state tokens — keep, they are the compression spec's foundation
`globals.css:67-70`. `--state-done` is **muted, not green**. A completed step is not a profit. This is precisely the discipline the collapsed-disclosure pattern needs.

### 1.4 `Card` + `Panel` — keep the contract, it already encodes the nesting rule
`Card.tsx:63-113`. `elevation: flush|raised|floating` → `shadow-none | elev-1 | elev-2` (`:41-45`). Padding is `16/20/24` passed as CSS vars so `Card` stays a **server component** (`:47-61`) — a genuinely good decision. `Panel` (`:105-113`) is `bg-surface-2` + **no border, no shadow** — the anti-card-in-card primitive. Keep both; the fix is that 88 files bypass them.

### 1.5 `CardHeader` at 16/600 — keep
`Card.tsx:140`. `text-[16px] font-semibold leading-[22px] tracking-[-0.01em]`. Correct. Promote to 17px in §2.2 and leave everything else.

### 1.6 `Button` state machine — keep, it is the "Thinking" affordance we already own
`Button.tsx:70-190`. `idle → loading → success → idle` with the **width pinned to the idle label** so a generating button never reflows the toolbar. Plus `useButtonState`. This is the only honest progress affordance in the product. Keep it and make it the *only* spinner permitted (§7).

### 1.7 `Sparkline` — keep, unchanged
`Sparkline.tsx`. Dependency-free SVG, `tone: auto|up|down|neutral`, `filled`. This is the exact sparkline the FinStocks entity card needs. **No Recharts in a chat reply.**

### 1.8 `DataTable` with `dense` — keep, this is Tier C already built
`DataTable.tsx:185-186, 246-247, 367-368`. `dense ? py-2 : py-3`, `px-4`, cells `text-sm`, headers `font-mono text-[11px] uppercase tracking-[0.08em]`, sticky header, sticky first column, `hideOnMobile`, built-in loading/empty/error. The blotter, option chain and order book are legitimately dense and this primitive serves them correctly. It is the **only** table implementation that survives.

### 1.9 `Segmented` — keep, it is the Mock|Live toggle
`Segmented.tsx`. Sliding `layoutId` pill, reduced-motion aware. This is FinStocks' Mock|Live chip and its `[Holdings·Orders·Trades·Paper]` mode row, already built.

### 1.10 Motion + easing tokens — keep the numbers
`globals.css:58-63`. `--dur-instant 90 / --dur-fast 160 / --dur-base 240 / --dur-slow 380`, `--ease-out cubic-bezier(0.22,1,0.36,1)`, `--ease-in cubic-bezier(0.64,0,0.78,0)`. Overlay keyframes in `tailwind.config.ts:196-244` (pop-in 180ms, dialog-in 200ms, sheet-in-right 250ms, accordion-down 200ms / up 160ms) are all correctly scaled. Keep every one.

### 1.11 `.ai-shimmer` — keep, this is the thinking texture
`globals.css:527-542`. A bright highlight sweeping muted text via `background-clip:text`, with a reduced-motion branch at `:544`. This is Claude's thinking treatment and it is *already* the non-boxy alternative to a rail. Reuse it for exactly one line.

### 1.12 `.price-flash-up/-down` — keep
`globals.css:679-685`. A 280ms GPU-only opacity flash on a real tick. This is the one piece of ambient motion tied to a real state change.

### 1.13 `.glass-float` / `.glass-pill` — keep as the ONLY blur
`globals.css:902-912`. Translucency reserved for surfaces that float above content **and are dismissible** — palette, sheets, dropdowns, sticky bars. Correct as written. The bug is that `.glass-control` and `.glass-surface` share the name prefix and are used in 88 files.

### 1.14 The retired mesh gradient — keep it retired
`globals.css:826-874`. The 4-blob 34s drift is gone; one static accent pool at 6% (dark) / 3% (light) remains. Do not re-add. The `/copilot` home's *own* `bg-radial-glow` + 360px blurred dual bloom (`copilot/page.tsx:1055-1065`) is a local re-introduction of exactly what was deleted — cut it.

---

## 2. WHAT MUST CHANGE

### 2.1 Radius — the config lies about its own names

`tailwind.config.ts:280-292` maps ten names onto six values, with **two names per value**:

| px | class names | uses |
|---|---|---|
| 2 | `mark`, `[2px]` | 4 |
| 6 | `xs`, **`md`** | 190 |
| 8 | `sm`, **`lg`** | 292 |
| 12 | `xl` | 133 |
| 16 | `2xl`, `3xl`, `4xl`, `5xl` | 147 |
| 9999 | `full`, `pill` | 441 |

Worse: `globals.css:53` defines `--radius-md: 12px` while `tailwind.config.ts:283` defines `rounded-md: 6px`. **A card written `rounded-md` is 6px; the same card written `border-radius: var(--radius-md)` is 12px.** `.trading-surface` and `.feature-card` (`globals.css:441-450`) use the CSS var and land at 12px; `Card.tsx:81` uses `rounded-xl` and also lands at 12px — two routes to one value, three names.

Also: `globals.css:910` references `var(--radius-full, 9999px)`, a token that is **never defined** (only `--radius-xs/sm/md/lg` at `:51-54`). It works by fallback only.

**Fix — align names to values, then codemod:**

```ts
// tailwind.config.ts — borderRadius, final
borderRadius: {
  'mark': '2px',   // data-viz marks ONLY (candles, volume bars) — never chrome
  'xs':   '6px',   // chips, badges, tags, table cells
  'sm':   '8px',   // inputs, buttons, list rows, Panel, artifact cards
  'md':  '12px',   // THE card. Panels, dropdowns, the entity card.
  'lg':  '16px',   // modals, sheets, the one hero surface per screen
  'full': '9999px',
}
```
```
Codemod (≈1,200 sites, purely mechanical, preserves every rendered pixel):
  rounded-md  → rounded-xs      (189)
  rounded-lg  → rounded-sm      (157)
  rounded-xl  → rounded-md      (133)
  rounded-2xl → rounded-lg      (147)
  rounded-3xl|4xl|5xl → rounded-lg
  rounded-pill → rounded-full   (49)
  rounded-[2px] → rounded-mark  (2)
```
Add `--radius-full: 9999px` to `globals.css:54`.

**Then apply the usage budget.** After the codemod, only four radii may appear in product UI:

| Element | Radius |
|---|---|
| Card, entity card, right-panel body, dropdown | `rounded-md` (12) |
| Panel/inset, input, button, list row, chip-with-square-ends | `rounded-sm` (8) |
| Badge, pill, avatar, icon button, mode chip, Mock\|Live toggle | `rounded-full` |
| Modal, sheet, the single hero card per screen | `rounded-lg` (16) |

`rounded-xs` (6px) survives for table cell backgrounds only.

### 2.2 Typography — from 25 sizes to 11 roles

**Current sprawl (measured):**
```
10px ×447   11px ×436   12px ×267   13px ×143   9px ×134
11.5 ×58    12.5 ×47    10.5 ×47    15 ×32      14 ×30
9.5 ×25     22 ×16      18 ×12      16 ×12      13.5 ×11
20 ×6       28 ×5       26 ×5       8.5 ×3      34 ×3
17 ×3       8 ×2        32 ×2       30 ×2       44 ×1
```
**658 occurrences at ≤10.5px.** That single number is the user's "congested, not designed properly" verdict, quantified. The reference languages set body at 14–16px.

**The v6 scale — 7 prose roles + 4 numeric roles. Nothing else exists.**

```css
/* globals.css :root — ADD */
--fs-display:  34px;  --lh-display:  40px;  /* 600, -0.02em */
--fs-title:    24px;  --lh-title:    32px;  /* 600, -0.015em */
--fs-heading:  17px;  --lh-heading:  24px;  /* 600, -0.01em */
--fs-body:     15px;  --lh-body:     24px;  /* 400 */
--fs-label:    13px;  --lh-label:    18px;  /* 500 */
--fs-meta:     12px;  --lh-meta:     16px;  /* 400 */
--fs-micro:    11px;  --lh-micro:    14px;  /* 500, +0.06em, uppercase */

--fs-num-hero: 40px;  --lh-num-hero: 44px;  /* mono 500, -0.02em */
--fs-num-lg:   22px;  --lh-num-lg:   28px;  /* mono 500 */
--fs-num:      14px;  --lh-num:      20px;  /* mono 450 */
--fs-num-sm:   13px;  --lh-num-sm:   18px;  /* mono 450 — TIER C ONLY */
```

```ts
// tailwind.config.ts — fontSize, ADD these named roles; keep xs/sm/base for compat
fontSize: {
  'display': ['34px', { lineHeight: '40px', letterSpacing: '-0.02em',  fontWeight: '600' }],
  'title':   ['24px', { lineHeight: '32px', letterSpacing: '-0.015em', fontWeight: '600' }],
  'heading': ['17px', { lineHeight: '24px', letterSpacing: '-0.01em',  fontWeight: '600' }],
  'body':    ['15px', { lineHeight: '24px' }],
  'label':   ['13px', { lineHeight: '18px', fontWeight: '500' }],
  'meta':    ['12px', { lineHeight: '16px' }],
  'micro':   ['11px', { lineHeight: '14px', letterSpacing: '0.06em', fontWeight: '500' }],
  'num-hero':['40px', { lineHeight: '44px', letterSpacing: '-0.02em' }],
  'num-lg':  ['22px', { lineHeight: '28px' }],
  'num':     ['14px', { lineHeight: '20px' }],
  'num-sm':  ['13px', { lineHeight: '18px' }],
}
```

**Hard rules:**

1. **The floor is 11px, and 11px is `micro` only** — eyebrows, table column headers, provenance footnotes. Nothing else may be 11px. **8 / 8.5 / 9 / 9.5 / 10 / 10.5px are banned outright.** That is a 658-site sweep; `text-[9px]` → `text-micro`, `text-[10px]` → `text-meta` or `text-micro` by role.
2. **Body copy is 15px.** AI prose in a thread, panel descriptions, empty-state copy. The current `text-sm` (14px) prose is acceptable at Tier B; 15px is required in the thread.
3. **Kill the half-pixel sizes.** 9.5 / 10.5 / 11.5 / 12.5 / 13.5px = 188 occurrences, all rounding artefacts of a scale nobody defined.
4. **One `display` or `num-hero` per screen. One `title` per screen.** A card may contain at most one `num-lg`. If it wants two, it is two cards (v5 §3.4 said this; it is unenforced everywhere).
5. **Mono is for numerics only.** `font-mono`/`MONO` appears in 110 files. The composer textareas are `font-mono` at 15px and 14px (`copilot/page.tsx:778`, `:725`) — that is a terminal, not a 2026 AI product. **Composers, prose, labels, buttons and headings are `font-sans`.** Mono is reserved for: price, %, ₹, timestamps, tickers, durations, table numeric cells, code.
6. **`EyebrowMono` is misnamed and slightly too big.** `EyebrowMono.tsx:16-20` is `font-sans font-semibold uppercase tracking-[0.12em] text-xs` (12px) — the name says mono, the code says sans (correct), the size should be `micro` (11px) and tracking `0.06em`. Retighten; keep the export name.
7. **`StatTile` is the micro-typography engine and must be rebuilt.** `StatTile.tsx:70-72`: label at `text-[9px]` mono, value at `text-xs` (12px) — a "stat tile" whose *value* is smaller than body copy, wrapped in its own `border border-line bg-wrap`. New contract: label `micro` (11), value `num-lg` (22), no border, `bg-transparent`, `p-0`. It becomes a layout unit, not a card.

### 2.3 Spacing — restrict the scale, then set the rhythm

`tailwind.config.ts:159-175` permits `0 1 2 3 4 5 6 7 8 10 12 16 20 24 32` (→ 0/4/8/12/16/20/24/**28**/32/40/48/64/80/96/128). **Delete `7` (28px)** — it is the one off-grid step and the only value with no assigned role.

Permitted: `0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 96`

```css
/* globals.css :root — ADD */
--pad-compact:  16px;   /* Tier B/C card interior */
--pad-default:  20px;   /* Tier A card interior */
--pad-feature:  24px;   /* the ONE hero card per screen */

--gap-dense:     8px;   /* inside a table cell group */
--gap-default:  16px;   /* between rows in a panel */
--gap-calm:     24px;   /* between cards in a calm column */
--gap-section:  48px;   /* between page sections */
--gap-turn:     40px;   /* between chat turns */

--thread-max:  720px;   /* the conversation column */
--panel-w:     420px;   /* the right entity panel (was 400) */
--page-gutter-sm: 24px;
--page-gutter-lg: 32px;
```

**Rhythm rules:**
- Inside a card: `8` label→value, `12` between rows, `16` between groups. Never `4` between distinct facts.
- Between cards: `24` (Tier A) / `16` (Tier B) / `0` (Tier C — hairlines separate).
- Between sections: `48`. The current `/markets` page stacks 10 bands with no section rhythm at all.
- Thread turn gap: `40`. This is the "enormous whitespace" of the reference and it is not decoration — it is what makes a reply read as one object.
- Thread column: `max-width: 720px`, centred. The composer is the same width. Kill the `max-h-[46vh]` internal scroller in `copilot/page.tsx:237` — a scroll region nested inside a text input has no counterpart in any reference.

### 2.4 Card rules

```
R1  A Card may not contain a Card. Nested content is <Panel> (bg-surface-2, no
    border, no shadow). Already the contract at Card.tsx:99-113 — enforce it.

R2  Hairline budget: at most TWO borders on any containment path.
    Card(1) → Panel(0) → chip(1).  ✓
    Bubble(1) → ArtifactCard(1) → stat pill(1) = 3.  ✗
    (Live violation: CopilotProvider Bubble 614-626 → ArtifactCard 300-316 → pill 308.)

R3  Cards in a list are `elevation="flush"` (shadow-none). Shadow on a grid of
    cards reads as noise. Only ONE card per screen may be `raised` (--elev-1):
    the entity card / the answer. `floating` (--elev-2) is hover state and
    popovers only. `--elev-3` is modals and sheets only.

R4  A card contains at most: one num-hero OR one num-lg; one accent-coloured
    element; one chart; eight numbers total (Tier A) / twelve (Tier B).

R5  Every card that renders a model-derived number carries exactly ONE
    provenance line, as the last row, at `micro` muted:
        "EOD · derived · as of 3 Aug, 15:30 IST"
    Not nine micro-labels scattered through the body (current /markets state).

R6  A card ends in an ACTION or in nothing. Never in a dangling statistic.
```

**Strip `box-shadow` from the legacy card aliases.** `globals.css:884-887` gives `.lg-surface / .glass-surface / .glass-card` an unconditional `box-shadow: var(--elev-1)`. Those classes are in 88 files, so most "cards" in the app carry a shadow the `Card` primitive deliberately withholds. Make it opt-in:

```css
/* globals.css:884 — REPLACE */
.lg-surface, .glass-surface, .glass-card {
  background: var(--color-wrap);
  border: 1px solid var(--color-line);
  /* box-shadow removed — opt in with .shadow-elev-1 */
}
```

**Retire `.lift`** (`globals.css:663-665`, `translateY(-3px)` on hover). Card hover is `Card.tsx:86`'s `hover:-translate-y-px` — 1px, not 3px. One hover treatment.

### 2.5 Border & elevation usage

| Theme | Depth comes from | Border | Shadow |
|---|---|---|---|
| **Dark** | surface ramp step + hairline | `--color-line #29292D`, always present on L1 | `--elev-1` only on the one raised card |
| **Light** | **fill step** (`#EDF1F4` canvas → `#FFFFFF` card) + shadow | `--color-line #DDE5ED`, **optional** on the entity card — the fill already separates | `--elev-1` on every anchored card is acceptable and preferred |

This is the inversion the reference relies on: on light, a white card on a cool-grey canvas needs no border at all. `globals.css:247-249` already ships light-tuned elevations (`0 1px 2px /.04, 0 4px 12px -6px /.10`). Use them.

**Ban:** coloured borders as chrome. `.glow-signature` (`globals.css:757`), `.glow-ai` (`:933`), `.lg-ring` (`:926-932`, a gradient hairline ring) and `.spin-border` (`:1310-1340`, an infinitely rotating conic border) are marketing-only. Zero in-product usage.

### 2.6 Colour restraint — a per-screen budget

```
ACCENT (#406AE4 fill / #3459C9 ink)
  ├─ ONE accent element per viewport: the primary action.
  ├─ The active nav item and the focus ring do not count against the budget.
  └─ BANNED: accent on every bold run in AI prose (MarkdownMessage.tsx:53-57 —
     the agent bolds numbers heavily, so a reply is speckled with blue
     fragments). Bold = `font-semibold text-d-text-primary`, no hue.

UP / DOWN (#0A6B50 / #B81C22 light; #10B981 / #F5808C dark)
  ├─ Signed money and signed percentages. The verdict word. The stacked
  │  signal bar. Nothing else.
  └─ BANNED as chrome: a 3px coloured left rule to encode consensus
     (WatchCard.tsx:63-100); `tone="down"` on a LIVE status badge
     (strategies/deployed:273 — healthy live strategies read as alarms);
     a coloured Badge for a relative timestamp (inbox/page.tsx:233).

WARNING (#9A4D00 / #F0A94F)
  └─ Max ONE per screen. Risk gates, the manual-order note, the cap banner.
     Never a tier badge, never a "beta" chip.

EMOJI
  └─ Zero. ChatArtifacts.tsx:36-46 prefixes every artifact title with
     📈📊📋🎛️🧮🧠💹; HomeNewsCta.tsx:78,164 badges every news card 🇮🇳/🌐.
     This is the single strongest "generated by a chatbot" tell in the
     codebase. Replace with: a 40px logo tile (entity), a 14px Iconify
     glyph at `text-d-text-muted` (everything else), or nothing.

MULTI-HUE TAXONOMIES
  └─ Banned. /autopilot runs SIX simultaneously (REGIME_COLORS ×3,
     VIX_BAND_COPY ×6 including a color-mix black blend, REGIME_TEXT,
     VIX_BAND_TEXT, P&L, and the red Emergency card). A state taxonomy
     encodes with POSITION and LABEL; colour carries at most three values
     (up / neutral / down).
```

---

## 3. DENSITY TIERS

Three tiers. Every surface declares one. Mixing them inside one container is the defect.

### TIER A — CALM
**Where:** the thread (`/copilot`), entity cards, the answer body, onboarding, auth, settings sections, empty states.

| Property | Value |
|---|---|
| Container width | `720px` max, centred |
| Card padding | `20px` (`--pad-default`), `24px` for the one hero card |
| Card radius | `12px` (`rounded-md`) |
| Gap between cards | `24px` |
| Gap between turns | `40px` |
| Body type | `body` 15/24 |
| Secondary type | `label` 13/18 |
| Smallest type | `micro` 11/14 — provenance and eyebrows only |
| Hero number | `num-hero` 40/44 or `num-lg` 22/28 |
| Row height | `56px` |
| Max numbers visible per card | **8** |
| Max line length | `68ch` |
| Elevation | `flush`, except one `raised` |

### TIER B — STANDARD
**Where:** right-panel faces (Overview / Technicals / Financials / News / Order ticket), the Tasks board, watchlist rows, list rows inside a panel, the settings left column.

| Property | Value |
|---|---|
| Container width | `420px` (panel) / fluid |
| Card / panel padding | `16px` (`--pad-compact`) |
| Radius | `12px` outer, `8px` inner (`Panel`) |
| Gap between rows | `12px` |
| Gap between groups | `20px` |
| Body type | `label` 13/18 |
| Values | `num` 14/20 mono |
| Labels | `meta` 12/16 |
| Eyebrows / column heads | `micro` 11/14 |
| Row height | `44px` |
| Max numbers per face above fold | **12** |
| Elevation | `flush`; the panel itself carries the edge |

> Panel width goes **400 → 420px**. At 400px the current dock renders two artifacts side-by-side via the *viewport* breakpoint `sm:grid-cols-2` (`ChatArtifacts.tsx:320`) — ≈186px per card holding a 132px Recharts plot whose Y-axis alone reserves 44px. **Replace every viewport breakpoint inside the panel with a container query** (`@container (min-width: 520px)`), and set the panel's default artifact grid to one column.

### TIER C — INSTRUMENT (legitimately dense)
**Where:** the trades blotter, holdings table, broker order book, the F&O option chain (OI/LTP + Greeks), the market-depth ladder, the screener results table, the universe list in the panel's Peers tab.

These are correct as dense surfaces. A blotter exists to be scanned and compared row-against-row; whitespace actively harms it. The failure today is not that they are dense — it is that Tier C typography leaked into Tier A.

| Property | Value |
|---|---|
| Implementation | **`foundation/DataTable` with `dense`, no exceptions.** Four hand-rolled tables must be deleted: `/trades` 12-col CSS grid + duplicate mobile branch, `FoStrategiesWorkspace` 9-col chain grid + 11-col Greeks grid, `PaperLeagueLeaderboard` raw `<table>` |
| Cell padding | `px-4 py-2` → **36px row** (`DataTable.tsx:186`) |
| Non-dense row | `px-4 py-3` → **44px row** |
| Numeric cells | `num-sm` 13/18 mono tabular |
| Text cells | `label` 13/18 sans |
| Column headers | `micro` 11/14 uppercase `tracking-[0.08em]` muted (`DataTable.tsx:367` — already correct) |
| Row separator | `border-b border-line`, 1px |
| Zebra | `--color-surface-inset` at 40% alpha, even rows only, **light theme only** |
| Radius | `0` on cells; `12px` on the container |
| Card wrapper | Table goes **edge-to-edge** — no `CardBody` padding. The header row sits on the card's own hairline |
| Sticky | header + first column (`DataTable` already) |
| Max rows before truncation | **50**, then one "Show all N ›" row. Five different truncation conventions exist today (12/15/25/30/50 + `top 8` + `last 10`) — collapse to one |
| Overflow | horizontal scroll on the container, never on the page body |

**Tier assignment for contested surfaces:**

| Surface | Tier | Why |
|---|---|---|
| Holdings (< 20 rows) | **A** as entity rows, not a table | Logo, price, verdict word, sparkline. A 20-row grid does not need a grid. |
| Trade history | **C** | Comparing 100 fills across 6 columns is exactly what a table is for. |
| Option chain / Greeks | **C** | 11 columns of strike-aligned data. Legitimately a terminal. |
| Screener results | **C** in the panel, **A** in the thread | Thread shows top 5 + prose; "Expand ›" opens the C table in the panel. |
| Signals blotter | **C**, panel only | Never a route. |
| Market internals | **B** | 4 tiles behind a panel tab, not 25 permanent panels. |
| Watchlist | **B** | Panel tab: symbol · price · change · verdict + `[Details]`. |

---

## 4. THE ONE-CARD RULE

> **A chat reply is: prose → ONE card → follow-ups.**
> Never two cards. Never a card above the prose. Never a chart in the reply body.

Today the assistant stack is **six blocks in a fixed order** with artifacts *before* the prose (`copilot/page.tsx:954-997`), and the artifact grid can render N cards. Eight artifact types exist; five of them (linechart, payoff, table, gauge, stat) are individually heavier than the reference's entire reply.

**Collapse 8 artifact types → 3 renderers:**

| New renderer | Absorbs | Where it renders |
|---|---|---|
| **`<EntityCard>`** | `sparkline`, `gauge`, `stat`, `bars` | In the thread. One per reply. |
| **`<RulesCard>`** | `strategy` (already correct — label/value rows only) | In the thread. |
| **`<DataStub>`** | `table`, `linechart`, `payoff` | In the thread: one line of prose + a chip. The data itself renders in the **right panel**. |

### 4.1 `<EntityCard>` — exact anatomy

```
┌─ Card  rounded-md · border-line · bg-wrap · shadow-elev-1 · p-[20px] ─┐
│                                                                      │
│  ┌────┐   RELIANCE                              ₹ 2,847.30           │  ← row 1
│  │ 40 │   Reliance Industries · NSE            +32.10  +1.14%        │
│  └────┘                                                              │
│  ──────────────────────────────────────────────────────────────────  │  ← hairline
│  OVERALL SIGNAL · 8 INDICATORS                                       │  ← row 2
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░▒▒▒▒▒▒                                │  ← row 3
│  Buy                                                                 │  ← row 4
│  ╱╲__╱‾╲___╱‾‾╲__╱‾╲__                                               │  ← row 5
│  ──────────────────────────────────────────────────────────────────  │
│  [ Details ]                                          [ Buy ]        │  ← row 6
│  EOD · derived · as of 3 Aug, 15:30 IST                              │  ← row 7
└──────────────────────────────────────────────────────────────────────┘
```

| # | Element | Tokens |
|---|---|---|
| **shell** | Card | `rounded-md border border-line bg-wrap shadow-elev-1 p-5` — `elevation="raised"`, `density="default"`. **Light: the border is optional; the white-on-#EDF1F4 fill step already separates.** |
| **1a** | Logo tile | `40×40`, `rounded-sm bg-surface-2`, contains `<SymbolLogo>`/`<StockAvatar>` at 24px. **Not an emoji.** Fallback = 2-letter monogram at `label` in `text-d-text-muted`. |
| **1b** | Symbol | `heading` 17/24/600 `text-d-text-primary` |
| **1c** | Subtitle | `meta` 12/16 `text-d-text-muted` — `"{Company} · {Exchange}"`. One line, truncate. |
| **1d** | Price | `num-lg` 22/28 mono tabular `text-d-text-primary`. **Never coloured** — the price is not a direction. |
| **1e** | Delta | `<ChangeBadge>` at `meta` 12 mono, `text-up`/`text-down`. Absolute + % on one line, 8px gap. |
| **div** | Hairline | `border-t border-line`, `my-4` |
| **2** | Signal eyebrow | `micro` 11/14 uppercase `tracking-[0.06em]` `text-d-text-muted` — `"Overall signal · {n} indicators"`. `{n}` comes from the FusionVerdict factor count; if unknown, **omit the clause** — never a fabricated count. |
| **3** | Stacked bar | `h-[6px] rounded-full overflow-hidden`, track `bg-[--color-surface-inset]`, three flex segments sized by vote share: bull `bg-up`, neutral `bg-[--color-muted]/40`, bear `bg-down`. `gap-[2px]`. No labels, no legend, no tooltip. Draws in `scaleX` 380ms `--ease-out` **once**. |
| **4** | Verdict word | `title` 24/32/600, `text-up` / `text-d-text-primary` / `text-down`. **This is the card's single colour licence.** Vocabulary is fixed and short: `Buy · Accumulate · Neutral · Reduce · Sell`. Never a score, never a percentage, never "0.72". |
| **5** | Sparkline | `foundation/Sparkline`, `width="100%" height={40} filled strokeWidth={1.75} tone={verdict}`. No axes, no grid, no tooltip, no Recharts. |
| **div** | Hairline | `border-t border-line`, `my-4` |
| **6** | Actions | Exactly two. `<Button variant="secondary" size="md">Details</Button>` (opens the right panel) + `<Button variant="primary" size="md">Buy</Button>` (opens the order ticket **in that panel**). `h-8`, `rounded-sm`, `justify-between`. A third button is a follow-up chip instead. |
| **7** | Provenance | `micro` 11/14 `text-d-text-muted`, `mt-3`. Exactly one line. This replaces the per-card disclaimer paragraphs (6 distinct strings on `/stock/[symbol]` alone). |

**Budget:** 8 numbers max (price, abs delta, % delta, 3 bar segments, indicator count, and one optional). No engine names, no model badges, no percentile-vs-universe, no "3/3 agree", no "N engines live", no offline-engine footnote. Those live behind `[Details]`.

**Reference implementation sketch:**

```tsx
<Card elevation="raised" density="default" className="rounded-md">
  <div className="flex items-start gap-3">
    <div className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface-2">
      <SymbolLogo symbol={s} size={24} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-heading text-d-text-primary">{s}</p>
      <p className="truncate text-meta text-d-text-muted">{name} · NSE</p>
    </div>
    <div className="shrink-0 text-right">
      <p className="text-num-lg font-mono tabular-nums text-d-text-primary">₹{fmt(ltp)}</p>
      <ChangeBadge value={pct} abs={abs} className="text-meta" />
    </div>
  </div>

  <div className="my-4 border-t border-line" />

  <p className="text-micro uppercase text-d-text-muted">
    Overall signal{n ? ` · ${n} indicators` : ''}
  </p>
  <div className="mt-2 flex h-[6px] gap-[2px] overflow-hidden rounded-full
                  bg-[var(--color-surface-inset)]">
    <span className="bg-up"                style={{ flexBasis: `${bull}%` }} />
    <span className="bg-[var(--color-muted)]/40" style={{ flexBasis: `${flat}%` }} />
    <span className="bg-down"              style={{ flexBasis: `${bear}%` }} />
  </div>
  <p className={cn('mt-3 text-title', VERDICT_INK[verdict])}>{VERDICT_WORD[verdict]}</p>

  <Sparkline data={closes} height={40} filled strokeWidth={1.75}
             tone={verdict === 'bull' ? 'up' : verdict === 'bear' ? 'down' : 'neutral'}
             className="mt-3 w-full" />

  <div className="my-4 border-t border-line" />
  <div className="flex items-center justify-between gap-3">
    <Button variant="secondary" size="md" onClick={openPanel}>Details</Button>
    <Button variant="primary"   size="md" onClick={openTicket}>Buy</Button>
  </div>
  <p className="mt-3 text-micro text-d-text-muted">{provenance}</p>
</Card>
```

### 4.2 `<DataStub>` — how tables and charts leave the thread

```
14 names cleared the Volume Surge gate; 9 sit in the same sector.
                                              ← prose, `body` 15/24
┌ Panel · bg-surface-2 · rounded-sm · px-4 py-3 · no border ─────────┐
│  Screener results · 14 names            [ Open in panel  › ]       │
└────────────────────────────────────────────────────────────────────┘
```
`label` 13 left, a `secondary` `size="sm"` button right. The 50-row table renders in the right panel at Tier C. **A `table` artifact never renders inline**, and `MarkdownMessage`'s GFM table path (`MarkdownMessage.tsx:118-163`) is removed — tabular output routes through the artifact path only, so there is one grid renderer instead of two.

Same treatment for `linechart` (→ the panel's Overview chart) and `payoff` (→ the panel's Payoff face).

---

## 5. LIGHT VS DARK

### Recommendation: **ship LIGHT as the default. Keep dark first-class, not a filter.**

This reverses `DESIGN.md §2` commitment 3 ("Dark is the default register"). State the reversal explicitly in the doc — do not let it drift.

**Reasoning:**

1. **All four references are light, and the user's verdict is about the conversational surface.** FinStocks, TradoMate and uTrade are near-white; Intellectia is the dark one and is explicitly the *second* reference. Quantman — the dark, dashboard-heavy counter-example — is the one the user says we currently resemble.
2. **Light is a forcing function against density.** Dark hides clutter: a 9px muted label on `#0D0D0E` recedes into the canvas, so 658 sub-11px readouts are survivable. On `#EDF1F4` with `#1D1D1D` ink at 16.9:1, every one of them is *visible*, and the design collapses unless it is actually calm. Light makes the discipline self-enforcing.
3. **The light palette is already built and validated.** `globals.css:196-299` is a real cool-grey daylight register, not an inversion: `#EDF1F4` canvas → `#FFFFFF` cards → `#DDE5ED` hairlines, with light-specific elevations at `:247-249` and light-specific accent ink `#3459C9` at 6.14:1. `html.light` and `.light-landing` are now a **single rule** (`:193-194`), so the byte-identical-duplicate risk from DESIGN.md §1.6 is already resolved. Zero palette work is required to flip.
4. **Light already wins on depth.** A `#FFFFFF` card on an `#EDF1F4` canvas separates on **fill alone**. Dark needs the hairline to do that work, which is why dark tempts you into bordering everything — and bordering everything is how you get card-in-card-in-card.
5. **Dark still wins for Tier C during market hours.** A 200-row option chain at 06:15 IST is genuinely better dark. So dark is not deprecated — it is the *instrument* register.

### What changes if light becomes the default

| # | Change | Detail |
|---|---|---|
| 1 | **FOUC is the first risk.** `:root` is dark (`globals.css:28`); light is `html.light`. A light default means the class must be on `<html>` **before first paint**, or every cold load flashes near-black. Set `next-themes` `defaultTheme="light"` **and** verify the inline theme script writes the class in `<head>`, not in a client effect. | blocking |
| 2 | **Depth model flips per theme.** Light: fill step + `--elev-1`, hairline optional on the entity card. Dark: hairline mandatory, shadow only on the one raised card. Encode this in `Card`, not per call site. | `Card.tsx:41-45` |
| 3 | **Every hardcoded `text-white` becomes invisible.** Confirmed live: `AlertPreferencesGrid.tsx:76,110` renders event names in `text-white` on a `bg-d-bg-card` that is `#FFFFFF` in light — and the grid is dual-mounted on `/alerts` and `/settings#notifications`, so the defect ships twice. Add an ESLint rule banning `text-white`, `text-black`, `bg-white`, `bg-black` and raw hex in `className` outside `components/landing/` and the `.mock-*` / `.dark-media` families. | blocking |
| 4 | **Chart tokens flip automatically, chart *libraries* may not.** `--chart-primary` `#8FB0FF → #406AE4`, `--chart-grid` → `rgba(29,29,29,.06)`, `--chart-tooltip-bg` → `#FFFFFF` (`globals.css:237-241`). Recharts reads these via inline style. **`LightweightChart` must be audited** — TradingView Lightweight Charts takes a JS options object, and a hardcoded dark `layout.background` will render a black rectangle on a white page. | audit |
| 5 | **`.dark-media` / `.mock-*` now misrepresent the product.** `globals.css:1010-1080` pins ~30 tokens to the dark palette for marketing renders of the product UI. If light is the default, every landing-page screenshot shows a UI the user will never see. Regenerate the mockups light, or keep them dark and label them "dark mode". | content |
| 6 | **`AuthLayout` stops flashing.** It force-applies `light-landing` regardless of theme, so a dark user currently gets a bright flash at every sign-in. With light default, that flash disappears for free. | fix-by-default |
| 7 | **Ambient washes halve automatically.** `.bg-radial-glow`, `.bg-signature-wash`, `.bg-radial-glow-ai` and `.app-canvas::before` all ship light branches at roughly half opacity (`globals.css:738-756`, `849-855`). Nothing to do — but the copilot home's *local* 460px glow + 360px dual bloom (`copilot/page.tsx:1055-1065`) must be deleted; on white it reads as a smudge. | delete |
| 8 | **Tier C needs a light-specific density treatment.** `#DDE5ED` at 1px is very faint on white across a 50-row table. Add zebra: even rows `bg-[var(--color-surface-inset)]` (`#E7ECF1`) at 40% alpha, **light only**. Dark tables stay unstriped — the hairline is enough against `#151517`. | add |
| 9 | **Down-red gets heavier.** Light `--color-down` is `#B81C22` (6.51:1) vs dark `#F5808C` (8.1:1). A page of losses reads harsher in light. This is correct — but it makes the "no red as chrome" rule (§2.6) non-negotiable. | discipline |
| 10 | **Dark stays equal-effort, and remains the pin for the terminal.** The `Terminal >_` escape hatch (the 20-control chart toolbar, the option chain, the depth ladder) opens **pinned dark regardless of theme**, using `.dark-media`. That is the one place a theme override is a feature, not a bug. | new rule |

**Theme control placement:** the appearance choice is currently two paragraph-sized radio cards in a Settings tab that `router.push('/copilot')` on select — a settings control that ejects you from settings. It becomes a plain `Segmented` `[Light · Dark · System]` row in the Settings *Account* section, with no navigation side effect.

---

## 6. COMPRESS THE MACHINERY

**Target: FOUR provenance strips per reply → ONE line.**

Today every assistant turn wraps in: artifacts grid, `ReferencesRail`, `ProgressRail`, and a `CONSULTED` chip row (`copilot/page.tsx:954-988`) — three of which say "here is what I touched" in three different visual languages. FinStocks shows zero. Intellectia shows one collapsed `Intellectia is working… ⌄`.

### 6.1 Streaming state — TWO WORDS AND A DOT

```
●  Thinking 4s ›
```

| Property | Value |
|---|---|
| Height | `28px`, single line |
| Position | In the thread column, left-aligned, **where the answer will appear** — not above it, not in a rail |
| Dot | `6px` circle, `rounded-full`, `bg-[var(--state-active)]`. Opacity `0.4 → 1 → 0.4`, `1600ms`, `ease-in-out`, infinite. **This is the only infinite animation permitted in the product.** |
| Label | `meta` 12/16, `text-d-text-muted`, `font-sans` |
| Counter | Real elapsed seconds, `font-mono tabular-nums`, ticking at 1s. This is genuine telemetry, not theatre. |
| Chevron | `›` at `text-d-text-muted`, 11px. Click expands mid-flight. |
| Step labels | **Only** if the backend has emitted a step. The label may swap to the real step label for ≤2s, then return to `Thinking Ns`. If no telemetry, the label stays generic — permanently. |
| Shimmer | Optional: apply `.ai-shimmer` (`globals.css:527`) to the label. It already has a `prefers-reduced-motion` branch at `:544`. |

**Deleted outright:**
- `ThinkingPulse` (`ProgressRail.tsx:96-125`) — a conic-gradient orbiting orb plus **6 canned phrases rotating on a 1500ms `setInterval`** with no connection to backend state. The file's own comment (`:93-95`) concedes they render before the backend has announced any step, while `:27-29` states a "no fabricated states" principle 70 lines below. **A timer-driven progress ticker in a product that asks people to risk money is the single most damaging element in the cluster.**
- The live `<ol>` timeline as a *default* state (`ProgressRail.tsx:240-263`) — per-step icons, a connector rail drawing downward, shimmering labels, per-step millisecond durations, and a trailing "Composing the analysis" row. It survives only inside the expanded disclosure.
- Stage-glyph substring matching (`ProgressRail.tsx:54-62`, matching `'understand'/'plan'/'market'/'analy'/'compos'` against the human label, falling back to a generic sparkle). Iconography inferred from a string carries no reliable meaning. Replace with three glyphs driven by `status` alone: `● running · ✓ ok · ✕ error`.

### 6.2 Settled state — ONE COLLAPSED LINE

```
✓ Worked it out · 6 steps · 2.4s · 3 sources ⌄
```

| Property | Value |
|---|---|
| Position | **Under the prose, above the follow-up chips.** Not above the answer. |
| Height | `28px` |
| Type | `meta` 12/16 `text-d-text-muted` |
| Glyph | `✓` 12px at `--state-done` (**muted, not green** — `globals.css:68`) |
| Numbers | `font-mono tabular-nums` |
| Failures | append `· 1 failed` in `text-down`; the count is the only red |
| Chevron | `⌄` 11px, rotates `180deg` over `160ms` (`--dur-fast`) |
| Hit area | full row, `44px` touch target on mobile |

`ProgressRail.tsx:208-224` already implements exactly this collapse-on-done behaviour. **It is the correct model for the whole cluster.** The only change is that it becomes the state during streaming too, instead of arriving after the user has already sat through the wall.

### 6.3 Expanded state — ONE PANEL, THREE ZONES

```
✓ Worked it out · 6 steps · 2.4s · 3 sources ⌃
┌ Panel · bg-surface-2 · rounded-sm · p-4 · NO border · NO shadow ────┐
│  ✓  Understood the question                              120ms      │
│  ✓  Chose the right tools                                310ms      │
│  ✓  Read the live market                                 840ms      │
│  ✕  Fetched the option chain                                        │
│     Upstream timed out after 3s — used the EOD chain instead        │
│  ✓  Composed the analysis                                1.1s       │
│  ─────────────────────────────────────────────────────────────────  │
│  ( Stock News )  ( Segment Data )  ( Valuation )  ( Analyst Ratings )│
│  ─────────────────────────────────────────────────────────────────  │
│  RELIANCE · NIFTY 50 · Q1 FY26 filing                               │
└─────────────────────────────────────────────────────────────────────┘
```

| Zone | Spec |
|---|---|
| **Container** | `Panel` (`Card.tsx:105-113`) — `bg-surface-2 rounded-sm p-4`, **no border, no shadow**. It is nested content, so the surface step is the only separation. `max-h-[320px]` with internal scroll. |
| **Open/close** | Existing `accordion-down` 200ms / `accordion-up` 160ms (`tailwind.config.ts:188-189`, keyframes `:214-221`), driven by `--radix-accordion-content-height` — a real height transition, not a max-height guess. Use `components/ui/collapsible`. |
| **Step row** | `24px` tall, `gap-3`. Glyph 12px column, label `label` 13/18 `text-d-text-secondary`, duration right-aligned `micro` 11 mono `text-d-text-muted`. |
| **Running step** | glyph = the `6px` `--state-active` dot; label takes `.ai-shimmer`. |
| **Failed step** | `✕` at `--state-failed`; **the reason renders as a `meta` line beneath the label — not a hover tooltip.** A failure the user cannot read is a failure the user cannot trust. |
| **Tool chips** | Absorbs the `CONSULTED` row (`copilot/page.tsx:979-988`). `rounded-full bg-wrap border border-line px-2.5 h-6`, `micro` 11, `text-d-text-secondary`, `gap-2` wrapped. Max 6, then `+N`. **No entrance animation per chip.** |
| **References** | Absorbs `ReferencesRail` (`ReferencesRail.tsx:43-95`) entirely. One `meta` line of ` · `-joined entity names. Not chips, not a rail, not a second row of pills. |

### 6.4 The invariant

> **Exactly ONE disclosure per assistant turn.** `ReferencesRail` is deleted as a sibling component. The `CONSULTED` chip row is deleted. The live timeline is not a default state. If a fifth kind of provenance is ever needed, it goes *inside* this panel or it does not ship.

### 6.5 Where else this pattern applies (same component, verbatim)

| Surface | Collapsed line |
|---|---|
| `/markets` — the 25 analytics panels | `How we read the tape · Breadth · Flows · Delivery · Valuation ⌄` |
| `/stock/[symbol]` — the engine dossier, factor scoreboard, 4 S/R systems | `8 indicators · 3 engines · 2.1s ⌄` |
| `/signals/[id]` — the 8-agent `Pressure-test` (stance + confidence + argument + 6 evidence bullets + size multiplier + kill trigger, ×8) | `Pressure-tested · 8 agents · bull 5 / bear 3 ⌄` |
| `/strategies/mine/[id]` — the universe backtest | `4 of 5 windows profitable · holdout +2.3% ⌄` (`BacktestAIRead.tsx:114-125` **already does this correctly** — collapsed by default, LLM call only on explicit click. It is the template; it is buried at the bottom of the longest page in the cluster.) |
| `/autopilot` — HMM posteriors, VIX band, equity scaler, VaR, Kelly scale, target weights, 10-tick log | `Held cash today — no name cleared consensus ⌄` |

---

## 7. MOTION

### 7.1 The seven things that MAY animate

| # | What | Spec | Level |
|---|---|---|---|
| 1 | **Token streaming** | Text appears as received. **No typewriter simulation on already-received text** — that is a fake delay dressed as work. | 3 |
| 2 | **The thinking dot** | `opacity 0.4→1→0.4`, `1600ms`, `ease-in-out`, infinite. **The only permitted infinite animation in the product.** | 3 |
| 3 | **Disclosure open/close** | `accordion-down 200ms var(--ease-out)` / `accordion-up 160ms var(--ease-in)` — already in `tailwind.config.ts:188-189` | 2 |
| 4 | **Hover / focus / press** | colour + `scale(0.98)` at `--dur-instant` (90ms). `Button.tsx:112-114` already correct. Card hover: `-translate-y-px` at `--dur-fast`. | 1 |
| 5 | **Overlays** | `pop-in 180ms`, `dialog-in 200ms`, `sheet-in-right 250ms`, `tip-in 125ms` — `tailwind.config.ts:196-211`, all correct | 2 |
| 6 | **Entity-card entrance** | ONE fade + `4px` rise, `240ms` `--ease-out`. **No stagger. No blur. No spring.** | 2 |
| 7 | **Price tick flash** | `.price-flash-up/-down`, 280ms opacity flash (`globals.css:679-685`) — tied to a real state change | 1 |

Plus, permitted **once per session**: the stacked signal bar's `scaleX` draw-in (380ms, `--dur-slow`) the first time an entity card mounts in a turn.

### 7.2 The kill list — everything else, with counts

| Delete | Where | Count |
|---|---|---|
| 6-phrase thinking ticker on a 1500ms timer | `ProgressRail.tsx:96-125` | 1 |
| Placeholder cycling 6 prompts every 3800ms | `copilot/page.tsx:436-440` | 1 |
| Bobbing robot mascot, `repeat: Infinity`, on **every page** | `CopilotBot.tsx:24-30` + the dock header glyph | 2 |
| Price marquee (`.animate-marquee`, `globals.css:669`) — ~108 cells, ~320 live numbers, polling 20–30s | 4 sites | 4 |
| `BlurFade` stagger on every artifact (`delay: i*0.05`) + per-chip spring entrances on references | 20 files use `BlurFade`/`<Reveal>` | 20 |
| `<Reveal>`-wrapped page blocks with 0.03–0.12s stagger (`/signals` alone has 11) | `SignalsOverview.tsx` et al. | 11+ |
| Blotter rows staggered at `idx × 0.04s` — row 100 arrives **4 seconds** after load | `trades/page.tsx:494` | 1 |
| `StatTile` `CountUp` on anything that is not the single hero number | `StatTile.tsx` `CountUp` | all |
| `animate-pulse` as a loading state → layout-shaped `<Skeleton>` crossfading at `--dur-base` | grep | **68** |
| `animate-spin` as a content loader → permitted **only** inside `Button state="loading"` and `/auth/callback` | grep | **131** |
| `animate-ping` | grep | **8** |
| `.spin-border` (`globals.css:1310-1340`), `.text-silver--anim` (`:1290`), `.illus-*` (`:1345-1390`), `.animate-sky-drift`, `.lift` (`:663`), `.count-up` (`:651`), `.spring-press` (`:655`) | globals.css | **marketing only — 0 in-product** |
| `.noise-overlay` (`globals.css:803`) — a fixed `z-index:9999` film-grain layer over the whole app | globals.css:803 | 1 |
| Copilot home decorative glow stack (460px `bg-radial-glow` + 360px blurred dual bloom) | `copilot/page.tsx:1055-1065` | 1 |

### 7.3 The stillness budget

> **When nothing is streaming, nothing moves.**
> At most ONE element may be animating in the viewport at any instant. Two simultaneous animations is a bug, not a flourish.

The reference language's calm is not a colour choice — it is the absence of motion. Today an idle `/copilot` home runs: a cycling placeholder, a bobbing mascot, a scrolling price tape, an animated conic composer ring (`globals.css:565-579`), and a static-but-glowing radial bloom. Five simultaneous motions on a screen where the user has not yet typed a character.

### 7.4 Reduced motion

`globals.css` ships **five** `prefers-reduced-motion` blocks (`:544`, `:687`, `:1233`, `:1265`, `:1393`), including a global `animation-duration: 0.01ms !important` sweep at `:687`. That covers CSS. It does **not** cover framer-motion, which drives `Segmented`'s `layoutId`, `StatTile`'s `animate()`, `Reveal`, `BlurFade` and `CopilotBot`.

**Add at the root provider:**
```tsx
<MotionConfig reducedMotion="user">{children}</MotionConfig>
```
Then walk the thread, the disclosure, the entity card and one Tier C table end-to-end with reduced motion on. `prefers-reduced-motion` must collapse motion levels 2–4 to opacity-only crossfades — including the thinking dot, which becomes a static filled circle.

---

## 8. ENFORCEMENT — what makes this stick

The v5 system failed not because it was wrong but because nothing checked it. Six mechanical guards:

1. **`scripts/validate-theme.mjs`** already exists and asserts the palette. Extend it to assert the **radius map** (name→value 1:1) and the **type scale** (that `--fs-*` in `globals.css` matches `fontSize` in `tailwind.config.ts`). DESIGN.md §1.5 documents that this validator once printed ALL PASS while validating a palette the app did not ship — do not let it happen to the scale.
2. **ESLint rule: banned className patterns.**
   `text-\[(8|8\.5|9|9\.5|10|10\.5)px\]` · `text-white|text-black|bg-white|bg-black` · `rounded-\[\d+px\]` · `#[0-9a-fA-F]{3,8}` in `className` · `animate-pulse` outside `Skeleton.tsx` · `repeat:\s*Infinity` · `backdrop-blur` outside `.glass-float`/`.glass-pill` call sites. Allowlist `components/landing/**` and the `.mock-*`/`.dark-media` families.
3. **A `<DensityProvider tier="A|B|C">`** at each route root. Card padding, gap, row height and the type floor read from it. Then a surface cannot silently mix tiers.
4. **A single `<EntityPanel>`/`<PanelTab>` primitive.** Today 12 files hand-roll `rounded-2xl border border-line bg-wrap`, 3 use foundation `<Card>`, 2 use `.lg-surface` — with divergent loading states (`<Skeleton>` vs bare `animate-pulse` divs at `h-[150px]`, `h-[140px]`, `h-72`, `h-[200px]`). One primitive deletes most of the drift.
5. **Fix `PageHeader`'s type.** Its `title` prop is `string` and its `<h1>` applies `truncate` (`PageHeader.tsx:39,58`), so **four** route files force-cast a JSX fragment through `as unknown as string` (`/autopilot:300`, `/settings:518`, `/strategies/[slug]:130`, `/strategies/mine/[id]:232`) — putting badges and icons inside a truncating single-line h1. Give it a `badges?: ReactNode` slot instead of letting four pages lie to the type system.
6. **The screenshot test, from DESIGN.md §7, applied per-surface:** disable every gradient, blur and animation. If the surface still looks deliberate, ship it. If it collapses, the design was decoration. Run it on: the thread, the entity card, the collapsed disclosure, the right panel, and one Tier C table — **in light**.

---

## 9. SUMMARY OF CONCRETE DELTAS

| Axis | From | To |
|---|---|---|
| Font sizes in use | **25 arbitrary px values, 1,846 sites**; 658 at ≤10.5px | **11 named roles**; floor 11px, body 15px |
| Radius names → values | 10 names → 6 values, with `rounded-md` = 6px in Tailwind but 12px in CSS | **6 names, 1:1**, 4 in product use |
| Card shadows | `.lg-surface/.glass-surface/.glass-card` force `--elev-1` across 88 files | `flush` default; **one** `raised` per screen |
| Nested hairlines | 3 levels (Bubble → ArtifactCard → pill) | **max 2**, `Card → Panel` |
| Artifact types | 8 renderers, 5 heavier than the whole reference reply, emoji-titled | **3**: `EntityCard`, `RulesCard`, `DataStub` — no emoji |
| Cards per reply | up to N artifacts + 4 provenance strips, artifacts **before** prose | **prose → 1 card → follow-ups** |
| Provenance strips per reply | **4** (artifacts, References, Progress, CONSULTED) | **1** collapsed disclosure |
| Thinking state | animated orb + 6 phrases on a **1500ms timer** + growing rail + per-step ms | **`● Thinking 4s ›`** |
| Infinite animations | mascot ×2, marquee ×4, `animate-pulse` ×68, `animate-spin` ×131, `animate-ping` ×8 | **one** — the 6px thinking dot |
| Table implementations | 4 (DataTable + 3 hand-rolled) | **1** — `DataTable`, `dense` for Tier C |
| Density tiers | undeclared; Tier C typography leaked into Tier A everywhere | **3 declared tiers**, 56 / 44 / 36px rows |
| Default theme | dark (`:root`) | **light** — palette already built and AA-validated at `globals.css:196-299`; dark stays equal-effort and pins the Terminal |
| Disclaimers per screen | up to 3 paragraphs + a DataBadge + ~15 micro provenance labels | **1** persistent line under the composer + **1** `micro` footnote per card |