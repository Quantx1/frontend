# Quant X — Design Language v5: **Instrument**

_Authored 2026-08-02. Supersedes the visual layer of "FintechX v4" (`backend/docs/FINTECHX-SYSTEM.md`).
Keeps v4's semantic colour tokens and WCAG matrix; replaces its surface, geometry, typography,
motion and component treatment._

---

## 0. What this product actually is

Quant X is a **professional trading instrument with an AI brain**, for Indian retail equity traders.

The user is not browsing. They are deciding — with money at stake, under time pressure, during
market hours. Every screen answers one of four questions:

1. **What is happening?** (Markets, Signals)
2. **Is this specific thing worth my money?** (Stock, Signal detail)
3. **What am I exposed to?** (Portfolio, Trades, Risk, AutoPilot)
4. **Can the AI do this for me?** (Copilot, Screener, AI Algos)

The design must therefore optimise for **reading numbers fast, trusting the machine, and acting
without hesitation.** Delight is secondary to legibility and confidence.

### The product is already AI-native — that is not the problem

Audit finding: the AI substrate here is genuinely 2026-grade and must be **preserved and elevated**,
not rebuilt:

| Capability | Where | Verdict |
|---|---|---|
| Streamed agent step telemetry (stage, label, tool, status, duration) | `lib/api.ts:544` `CopilotStep` | Real. Keep the contract. |
| 8 generative-UI artifact types (sparkline, linechart, bars, stat, gauge, payoff, table, strategy) each with a deep-link CTA | `lib/api.ts:458` `CopilotArtifact` | Genuine generative UI. Keep. |
| Entity references the agent touched | `lib/api.ts:554` `CopilotReference` | Keep. |
| Intent-sized routing — quick answers stay inline, big tasks expand to a thread | `app/(platform)/copilot/page.tsx` | Excellent product thinking. Keep. |
| Client-side symbol detection → instrument-aware suggestions | `copilot/page.tsx:146` | Keep. |
| Follow-up chips, lens modes (Ask/Analyze/Screen/Doctor/Trade) | `lib/copilot-modes.ts` | Keep. |

**So this is not an "add AI to a dashboard" job. It is a "the interface is drowning a good engine" job.**

---

## 1. Diagnosis — why it currently reads as generated, not designed

Every claim below is evidence-backed from the repo.

### 1.1 Five design eras are layered on top of each other

Comments and class names from five distinct visual systems coexist in shipped source:

| Era | Files carrying its markers |
|---|---|
| Violet Minimal (v3) | 4 |
| xAI / charcoal | 16 |
| DhanHQ / teal | 10 / 6 |
| FintechX v4 | 11 |
| Apple Liquid Glass | 4 + 67 usage sites |

`components/foundation/EmptyState.tsx:89` still says _"xAI: a framed charcoal panel"_ while rendering
a FintechX token surface inside a liquid-glass app. Components carry the styling of one era and the
comments of another. **This sediment is the single biggest reason the app feels assembled.**

### 1.2 Blanket glassmorphism

`glass-control` appears in **67 files**. `components/foundation/Button.tsx:12-26` maps *every* button
variant — primary, secondary, ghost, danger, ai — onto a `backdrop-filter: blur(18px) saturate(2)`
surface. `components/foundation/Card.tsx:21-23` makes *every* card a `.glass-surface`
(`blur(22px) saturate(1.9)` + a 44px shadow).

Consequences:
- On a 12-card page that is 12+ compositing layers of backdrop blur — a real scroll cost.
- Depth becomes meaningless: if everything floats, nothing is elevated.
- Legibility drops, especially in light mode.
- It is exactly the "collection of cards with random gradients" failure mode.

### 1.3 An animated mesh gradient behind the whole app

`app/globals.css:891-921` — `.app-canvas::before` paints four radial blobs (primary 42%, ai 34%,
cyan 30%, primary 28%), `blur(34px) saturate(1.25)`, animated on a **34-second infinite drift**.
This is what tints every screenshot lavender-blue and produces the halo on `/copilot`. It reads
"gamer RGB", not "calm and expensive".

### 1.4 Sixteen distinct border radii

Measured across `app/` + `components/`:

```
rounded-full 388 · rounded-md 172 · rounded-lg 143 · rounded-sm 133 · rounded-xl 122
rounded-[20px] 105 · rounded-pill 49 · rounded-2xl 34 · rounded-[24px] 10
rounded-[6px] 7 · rounded-[14px] 5 · rounded-[12px] 4 · rounded-[8px] 1
rounded-[3px] 1 · rounded-[1px] 1 · rounded-[13px] 1
```

Plus CSS-defined radii that disagree with all of the above: `.trading-surface` 8px, `.feature-card`
10px, `.glass-card` 8px, `.tile-tint` 20px, `.tile-tint-lg` 30px, `--radius` 12px.

### 1.5 Three competing token sources, mutually out of sync

`lib/tokens.ts` declares itself _"single source of truth"_ and _"intentionally kept in sync"_ with
`globals.css`. It is not:

| Token | `lib/tokens.ts` | `globals.css` (shipped) | `validate-theme.mjs` (asserted) |
|---|---|---|---|
| light `main` | `#EDF1F4` | `#E9EEFB` | `#EDF1F4` |
| light `wrap-hover` | `#F4F7F9` | `#E6ECFB` | `#F4F7F9` |
| light `line` | `#DDE5ED` | `#D5DEF4` | `#DDE5ED` |

`scripts/validate-theme.mjs` prints **ALL PASS** — but it is validating the documented palette, not
the one the app ships. The light theme drifted to lavender and the guard never noticed. Restoring
the cool-grey values is simultaneously a design fix and a correctness fix.

`lib/tokens.ts` also defines a radius scale (4/6/8/12/16) that no component uses, and references a
`DESIGN.md` at repo root that does not exist. (This file replaces that dangling reference.)

### 1.6 Duplicated token blocks

`html.light` (`globals.css:146-240`) and `.light-landing` (`globals.css:254-348`) are byte-identical
95-line duplicates, maintained by a comment that says _"keep the two in lockstep"_. They will drift.

### 1.7 Weak typographic hierarchy

- `Card.tsx:40` — card headers are `text-sm font-normal`. A card title at 14px regular.
- `EmptyState.tsx:107` — empty-state headlines are `text-sm font-normal`.
- Page title "Markets" renders larger than the actual insight beneath it
  ("Firm open — S&P 500 +0.7% · firm Asia · FIIs net buyers"). **The chrome outweighs the content.**

### 1.8 Information hierarchy failures on the primary surfaces

- **Markets**: nested card-in-card-in-card. The "Pre-market briefing" card contains four sub-cards,
  each with the same border, radius and weight. No bento rhythm — every module has equal visual mass.
- **"The read"**: a ~200-word unstructured paragraph with every number buried in prose. This is the
  product's best AI output rendered as the worst possible format.
- **Signals (mobile)**: five equal stat tiles in a 2-column grid → an orphaned fifth tile.
- **Copilot home**: the authenticated home opens with marketing copy and ~170px of empty space above
  the composer; the actual cockpit sits below the fold.

### 1.9 Command palette is a hardcoded nav list

`components/shell/CommandPalette.tsx:18-42` — 16 static route entries, filtered by `label.includes`.
The placeholder promises _"Search nav, symbols, strategies…"_ but **only nav labels are searchable**.
No actions, no symbols, no AI entry, no recents, no shortcut hints. For a keyboard-first trading
tool this is the largest single missed opportunity in the product.

### 1.10 Assorted debt

- `Sidebar.tsx:43-49` — five social links, **every one `href: '#'`**, occupying the footer.
- `Button` has no `loading`, `success` or icon affordance — so no `Generate → Generating… → Generated ✓`.
- Duplicate components: `scanner/SectorHeatmap` vs `markets/SectorHeatmap`;
  `scanner/WinRateGauge` vs `foundation/WinRateGauge`.
- Dead CSS with live equivalents: `.btn-primary` / `.btn-secondary` (2 files each) alongside `Button`.
- The regime gauge draws a red→amber→green rainbow arc — the cheapest-reading chart idiom there is.
- Persistent unresolved skeletons in the sidebar's Portfolio group.

---

## 2. Design thesis

> ### The interface is a lens, not a lightshow.
>
> Quant X already knows things. The UI's only job is to transmit them with the least possible loss —
> and to make acting on them feel weightless.

Four commitments follow:

**1. Depth comes from hierarchy, not blur.**
Translucency is reserved for surfaces that genuinely float above content and are dismissible:
command palette, sheets, dropdowns, sticky bars. Everything anchored in the page is opaque.

**2. Numbers are the typography.**
This is a financial instrument. Tabular mono numerics get the largest, most confident treatment on
every screen. Labels shrink and recede. The number is the hero, always.

**3. Dark is the default register; light is fully designed, not inverted.**
A trading terminal lives in dark. Dark mode becomes the primary experience (and the default for new
users), with light mode rebuilt as a genuine cool-grey daylight register — not a lavender wash.

**4. The AI shows its work.**
The agent timeline is not a loading state. It is the product's signature moment — the thing that
converts "an AI said so" into "I watched it reason". It gets first-class visual design.

### Explicit non-goals

- No confetti, no neon, no sci-fi HUD, no decorative particles.
- No animation that does not communicate state, action or result.
- No gradient that is not carrying meaning.
- **The design must still look excellent with every decorative effect deleted.** That is the test.

---

## 3. Token architecture

One source of truth. `globals.css` defines CSS variables; `tailwind.config.ts` maps semantic
utilities onto them; `lib/tokens.ts` mirrors them for programmatic use and is **generated-adjacent**
(kept honest by `validate-theme.mjs`, which will be updated to read the shipped values).

### 3.1 Surfaces — 5 tiers, opaque

Depth is a **step in the surface ramp plus a hairline**, never a blur.

| Tier | Token | Dark | Light | Used for |
|---|---|---|---|---|
| L0 canvas | `--surface-canvas` | `#0D0D0E` | `#EDF1F4` | page background |
| L1 surface | `--surface-1` | `#151517` | `#FFFFFF` | cards, sidebar |
| L2 raised | `--surface-2` | `#1E1E21` | `#F4F7F9` | hover, nested panels, chips |
| L3 overlay | `--surface-3` | `#26262A` | `#FFFFFF` | popovers, palette, dialogs |
| L-1 inset | `--surface-inset` | `#0A0A0B` | `#E7ECF1` | wells, table stripes, code |

Light values return to the **validated** `#EDF1F4 / #F4F7F9 / #DDE5ED` set (§1.5), killing the lavender drift.

Borders: `--border-hairline` (default), `--border-strong` (emphasis/hover), `--border-focus` (accent).

### 3.2 Elevation — 3 levels, neutral

Colour never appears in a shadow. Dark leans on borders; light leans on shadow.

```
--elev-0: none                                            /* flush, hairline only        */
--elev-1: 0 1px 2px rgb(0 0 0 / .04), 0 4px 12px -6px rgb(0 0 0 / .10)   /* resting card  */
--elev-2: 0 2px 4px rgb(0 0 0 / .06), 0 12px 28px -12px rgb(0 0 0 / .16) /* hover / popover */
--elev-3: 0 8px 24px -8px rgb(0 0 0 / .20), 0 32px 64px -24px rgb(0 0 0 / .28) /* modal   */
```

Dark multiplies opacities ×2.2 (shadows must work against near-black).

### 3.3 Radius — 5 steps, no exceptions

| Token | Value | Applies to |
|---|---|---|
| `rounded-xs` | 6px | chips, badges, tags, table cells |
| `rounded-sm` | 8px | inputs, small buttons, list rows |
| `rounded-md` | 12px | **the default card**, panels, dropdowns |
| `rounded-lg` | 16px | hero/feature cards, modals, sheets |
| `rounded-full` | 9999px | pills, avatars, icon buttons only |

The 11 arbitrary `rounded-[Npx]` values are eliminated. `rounded-pill` aliases to `rounded-full`.

### 3.4 Type scale

Two families. **Geist Sans** for all prose and UI; **Geist Mono** (tabular) for every number,
ticker, timestamp and key.

| Role | Size / line / weight / tracking | Notes |
|---|---|---|
| `display` | 32/36 · 600 · −0.02em | page hero number or headline insight |
| `title` | 22/28 · 600 · −0.015em | page title |
| `heading` | 16/22 · 600 · −0.01em | card title — **was 14/400** |
| `body` | 14/21 · 400 | prose, descriptions |
| `label` | 13/18 · 500 | form labels, nav |
| `meta` | 12/16 · 400 | timestamps, captions, secondary |
| `micro` | 11/14 · 500 · 0.04em uppercase | eyebrows, column headers |
| `num-hero` | 34/36 · 550 mono · −0.02em | the one number that matters on a screen |
| `num-lg` | 22/26 · 500 mono | primary metrics |
| `num` | 14/20 · 450 mono | table cells, inline values |

Rule: **a card may contain exactly one `num-hero` or `display`.** If it wants two, it is two cards.

### 3.5 Spacing

4px base. Permitted: `2 4 6 8 12 16 20 24 32 40 48 64`. Card padding is `16` (compact) or `20`
(default) or `24` (feature) — never anything else. Grid gutter `16` mobile / `20` desktop.

### 3.6 Motion

Motion communicates **state → action → result**. Four durations, two easings.

```
--dur-instant: 90ms    /* hover, focus, press — must feel free            */
--dur-fast:   160ms    /* chips, tabs, tooltips, toggles                  */
--dur-base:   240ms    /* cards, panels, dropdowns, page content          */
--dur-slow:   380ms    /* sheets, modals, layout changes, chart draw      */

--ease-out:  cubic-bezier(0.22, 1, 0.36, 1)      /* everything entering   */
--ease-in:   cubic-bezier(0.64, 0, 0.78, 0)      /* everything leaving    */
```

Stagger for generated lists: **40ms**, capped at 8 items (beyond that it reads as lag, not craft).

**Motion hierarchy** — animate only at the level the moment deserves:

| Level | Budget | Applies to |
|---|---|---|
| 1 Essential | opacity/colour only, ≤160ms | hover, focus, press, nav active |
| 2 Interactive | + 4–8px translate or 0.98 scale, ≤240ms | cards, tabs, panels, dropdowns |
| 3 Generative | staggered reveal, streaming, chart draw, count-up | AI output only |
| 4 Moment | ≤1/session | onboarding complete, first AutoPilot run |

`prefers-reduced-motion` collapses levels 2–4 to opacity-only crossfades. Already partially wired at
`globals.css:752`; extended to a `<MotionConfig reducedMotion="user">` guarantee.

### 3.7 Semantic colour — unchanged, and deliberately so

The v4 semantic set is WCAG-validated and correct. It survives intact:

- **One accent**: `#406AE4` as fill (white ink), `#8FB0FF` / `#3459C9` as ink.
- **`up`/`down` are P&L semantics only.** Never chrome, never a nav state, never a button.
- **`warning`** is true caution, rare.
- **AI ink == brand ink.** No separate "AI purple". The AI is the product, not a feature with a colour.

Adds one token pair for agent state, since the agent timeline needs a non-financial "in progress":

```
--state-active:  accent ink        /* step running     */
--state-done:    text-muted        /* step complete — recedes, does not celebrate */
--state-failed:  down              /* step errored     */
--state-pending: border-strong     /* step not started */
```

Note `--state-done` is **muted, not green**. A completed step is not a profit. Reserving green for
P&L is the discipline that keeps the terminal readable.

---

## 4. Component contracts

### 4.1 `Button` — rebuilt

Drops blanket glass. Gains the state morph the product needs.

```
variant : primary | secondary | ghost | danger | ai
size    : sm (28px) | md (32px) | lg (40px)
state   : idle | loading | success        ← new
icon    : leading ReactNode               ← new
```

- `primary` — solid accent fill, white ink, `--elev-1`. No blur, no gradient.
- `secondary` — `--surface-2` fill + hairline.
- `ghost` — transparent, hairline on hover only.
- `danger` — `down`-tinted fill.
- `ai` — hairline + accent ink + a 12px sparkle glyph.
- Radius `rounded-sm` (8px) for standard, `rounded-full` only for icon-only and pills.
- Press: `scale(0.98)` at `--dur-instant`.
- `loading` swaps the label for a 2px ring spinner **at the same width** (no layout shift).
- `success` morphs to a check for 1200ms, then returns to idle.

### 4.2 `Card` — rebuilt

```
elevation   : flush | raised | floating     (maps to --elev-0/1/2)
interactive : boolean                       (hover lift + cursor)
density     : compact | default | feature   (16 / 20 / 24 padding)
```

Opaque `--surface-1` + hairline + `rounded-md`. `CardHeader` title becomes `heading`
(16/600) — the single highest-leverage typography fix in the app.

**Nesting rule:** a card may not contain another card. Nested content uses `--surface-2`
**panels** with no border and no shadow (`Panel` primitive). This kills the Markets card-in-card-in-card.

### 4.3 `AgentTimeline` — new, replaces the visual layer of `ProgressRail`

Consumes the existing `CopilotStep[]` contract unchanged. Renders a real activity timeline:

```
◐  Reading the live market        · running   accent ink, breathing dot, shimmer label
✓  Choosing the right tools  310ms · ok        muted ink, settled check
✕  Fetching option chain          · error      down ink, reason on hover
○  Composing the analysis         · pending    hairline ring
```

- A 1px connector rail links steps; it **draws downward** as steps land (`scaleY`, 240ms).
- Completed steps collapse their label to a single line and recede to muted.
- On completion the whole timeline collapses to one summary row —
  `✓ 6 steps · 2.4s · 3 sources` — expandable on click.
- Durations in mono, right-aligned, `meta` size.

**Honesty constraint:** the backend emits `ok | error | running` only. `pending` renders solely for
steps the backend has actually announced but not started. **No fabricated approval gates** — a
human-in-the-loop state will be added when the backend can emit it, not mocked before.

### 4.4 `Artifact` family — restyled, contract untouched

All 8 `CopilotArtifact` types get one consistent chrome: `--surface-2` panel, hairline,
`rounded-sm`, `micro` eyebrow title, mono values, optional CTA row pinned bottom-right.
Charts draw in over `--dur-slow`; tables populate rows on a 40ms stagger.

### 4.5 `CommandPalette` — rebuilt into the product's operating system

| Source | Behaviour |
|---|---|
| Navigation | all 55 routes, longest-prefix aware, tier-badged |
| Symbols | live NSE search → jumps to `/stock/[symbol]` |
| Actions | run screen, new strategy, connect broker, toggle theme, stop AutoPilot |
| AI | free text that isn't a match becomes `Ask Copilot: "…"` — always the last row |
| Recents | last 5 visited entities, promoted to the top on empty query |

Grouped, arrow-navigable, `⏎` to run, `⌘K` to toggle, per-row shortcut hints, and an empty state
that suggests rather than apologises.

### 4.6 States

- **Skeleton** — mirrors the real layout's geometry (not grey blobs), morphs via crossfade at
  `--dur-base`, never a spinner for content.
- **EmptyState** — headline at `heading` (16/600), one sentence of why it matters, one primary
  action. Copy rule: never "No data found". Say what is missing, why, and what to do.
- **ErrorState** — what happened / whether the user must act / a recovery button. Errors do not shake.

---

## 5. Information architecture

Navigation stays close to today's grouping (it is sound and every route is reachable), with four changes:

1. **Dead social links removed** from the sidebar footer (`href: '#'` × 5).
2. **Command palette promoted** to the primary way to move — a visible `⌘K` affordance in the sidebar,
   not a hidden keystroke.
3. **Right rail labelled** — icon-only utilities get tooltips and a consistent 20px optical size.
4. **AI is ambient, not a destination.** The Copilot stays a page *and* becomes reachable in-context
   from any surface, seeded with that surface's context.

---

## 6. Surface-level redesign priorities

Ranked by leverage:

| # | Surface | Change |
|---|---|---|
| 1 | Foundation tokens + primitives | affects all 55 routes at once |
| 2 | Shell + command palette | how everything is reached |
| 3 | Copilot / agent timeline | the product's signature moment |
| 4 | Markets | first screen; bento hierarchy + structured briefing |
| 5 | Signals + Stock | the core decision loop |
| 6 | Portfolio / Trades / Risk | tables and exposure |
| 7 | Scanner / Strategies / F&O | generation states |

### The Markets briefing, restructured

"The read" stops being a paragraph. The same AI output renders as:

```
Firm open — S&P 500 +0.7% · firm Asia · FIIs net buyers      ← display, the hero
─────────────────────────────────────────────────────────
Why            three ranked drivers, each with its number inline
What to watch  two levels, mono, with the trigger condition
Risk           the one thing that invalidates the read
─────────────────────────────────────────────────────────
[ Ask about this ]  [ Screen for it ]  [ See affected holdings ]   ← actionable
```

AI output must end in an **action**, not a full stop.

---

## 7. Quality bar

The redesign is done when:

- [ ] `npx tsc --noEmit` clean; `npm run lint` at or below the 6-warning baseline; `next build` passes.
- [ ] `node scripts/validate-theme.mjs` passes **against the values actually shipped**.
- [ ] No `backdrop-filter` on any non-floating surface.
- [ ] Radius values reduced from 16 to 5.
- [ ] `lib/tokens.ts`, `globals.css` and `tailwind.config.ts` agree.
- [ ] Every loading state is a layout-shaped skeleton; no bare spinners for content.
- [ ] Every empty state names an action.
- [ ] Dark and light both walked end-to-end at 390 / 1024 / 1440.
- [ ] `prefers-reduced-motion` walked end-to-end.
- [ ] **The screenshot test**: with all gradients, blurs and animation disabled, the app still looks
      deliberate. If it collapses, the design was decoration.

---

## 8. shadcn/ui adoption (2026-08-02)

shadcn/ui is the foundational component system. `components.json` had existed
since before this work, but `components/ui/` contained **zero** registry
components — the config described an adoption that never happened.

### The rule: one component per concept

The decision that matters here is what *not* to do. `components/foundation/`
was already built on the same Radix primitives shadcn wraps — `Dialog`,
`Popover`, `Select`, `Tabs` and `Tooltip` all sit directly on `@radix-ui/*`.
Re-basing them onto the shadcn equivalents would mean
`foundation → shadcn → Radix`: an extra wrapper layer, a migration across ~180
call sites, and two components for every concept — for no behavioural gain.

So concepts are owned, not duplicated:

| Concept owner | Components |
|---|---|
| `foundation/` (already Radix-based, widely adopted) | Button (49 files), Card (43), Badge (47), Skeleton (53), Tabs (12), Tooltip (11), Dialog (9), Input (9), Select (6), Popover (4), ConfirmDialog, DataTable, EmptyState, ErrorState, Toast |
| `ui/` (shadcn — genuinely new capability) | Command, Resizable, Table, Chart, Collapsible, Accordion, Alert, Avatar, Progress, Switch, Checkbox, Toggle, ToggleGroup, ScrollArea, DropdownMenu, Sheet, Separator, Label, Textarea |

The registry duplicates (`ui/button`, `ui/card`, `ui/badge`, `ui/input`,
`ui/skeleton`, `ui/dialog`, `ui/popover`, `ui/tooltip`, `ui/tabs`, `ui/select`,
`ui/alert-dialog`) were **deleted after install**. Two of the kept components
depended on them and were rewired rather than left dangling:

- `ui/command` imported `ui/dialog` for `CommandDialog` → `CommandDialog`
  removed; the Command primitives compose inside `foundation/Dialog`.
- `ui/alert-dialog` imported `ui/button` → deleted outright;
  `foundation/ConfirmDialog` already owns that concept.

### Deviations from the registry, and why

1. **Icons.** Registry components import `lucide-react`. This app uses an
   Iconify shim (`@/lib/icons`, 178 files, 0 lucide imports). All eight
   affected components were rewired; four icons were added to
   `scripts/gen-icons.mjs` and regenerated (168 total). `Check` maps to a
   *circled* glyph, so a bare `CheckLine` was added for shadcn's indicator
   boxes, which draw their own ring.
2. **`ui/resizable`.** The registry targets react-resizable-panels v2/v3
   (`PanelGroup`, `PanelResizeHandle`). This project has **v4.12.2**, which
   renamed them to `Group` / `Separator` and `direction` → `orientation`.
   Retargeted against the installed `.d.ts`; the registry version does not
   compile here.
3. **`ui/command` styling.** Selection defaulted to `bg-accent` /
   `text-accent-foreground`. In this token set `accent` is the saturated brand
   FILL, so every hovered row lit up solid blue — a cursor should be quiet.
   Now one step up the surface ramp (`bg-surface-2`).
4. **`CommandInput`.** Made structural. The registry hardcodes its own
   magnifier and border, which double-rendered against the palette's composed
   header.

### The Tailwind bridge — required, and silent when missing

shadcn components are written against `bg-background`, `text-foreground` and
`border-input`. None of the three generated in this config: `background` was a
nested object with no `DEFAULT`, and `foreground`/`input` were absent. The
classes emit **nothing** — a Dialog with no surface, an Input with no edge.
It fails invisibly, so the three are now wired explicitly in
`tailwind.config.ts` to the CSS variables `globals.css` already defines.

⚠️ The shadcn CLI rewrites `tailwind.config.ts` and the `--font-*` aliases in
`globals.css` on `add`. It stripped every token comment and turned
`darkMode: 'class'` into `['class','class']`; it also replaced the `next/font`
variables with hardcoded family names, which bypasses the font loader. **Back
both files up before running `shadcn add`, then diff and merge.**

### Command palette — intent-aware ordering

The palette reads intent and reorders itself. A lookup (`reliance`) keeps
Ask Quant X at the bottom as a fallback; a question (`why is reliance falling
today`) promotes it to the **top** and pre-selects it, because no ticker match
can satisfy a question. One input, two behaviours — see `looksLikeQuestion`.
