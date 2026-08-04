# QUANT X — COMPONENT CATALOGUE (AS-BUILT)

> The design-system primitive spec: every variant, size, slot and state with the
> exact classes and resolved pixel values it produces. Rebuild these first — every
> screen in `03-SCREEN-INVENTORY.md` is assembled from them.

## Token resolution

SCOPE: components/foundation/*.tsx (32 files) + components/ui/*.tsx (26 files) — the design-system primitive catalogue, not routes. Entries below are PRIMITIVE FAMILIES; `route` = the import path, `loc` = lines in the primary file.

TOKEN RESOLUTION (all classes below resolve through these):
- Tailwind spacing is standard 4px-per-step (1=4, 1.5=6, 2=8, 2.5=10, 3=12, 3.5=14, 4=16, 5=20, 6=24, 7=28, 8=32, 9=36, 10=40, 11=44, 12=48).
- radius: rounded-mark 2px · rounded-xs 6px · rounded-sm 8px · rounded-md 12px · rounded-lg 16px · rounded-full 9999px. NOTE the as-built drift: Dialog/Sheet/StatCard/Alert use rounded-sm (8px) not the documented lg (16px); DropdownMenu/Command/Toggle/Textarea use rounded-xs (6px).
- Surfaces dark→light: bg-main #0D0D0E→#EDF1F4 · bg-wrap #151517→#FFFFFF · bg-wrap-hover / bg-surface-2 / bg-hover #1E1E21→#F4F7F9 · surface-3 (overlay) #26262A→#FFFFFF · surface-inset #0A0A0B→#E7ECF1 · border-line #29292D→#DDE5ED · border-wrap-line #3B3B40→#C8D4DE.
- Ink: text-d-text-primary #F7F7F8→#1D1D1D · secondary #D3D3D7→#4D585F · muted #96969E→#5F6B75.
- Accent: bg-primary/border-primary FILL #406AE4 (hover #3055C2, white ink). `text-primary` is REMAPPED in tailwind.config textColor to --rgb-primary-text = #8FB0FF dark / #3459C9 light. text-primary-foreground = #FFFFFF. text-[var(--color-ai)] == same ink. cyan #5290F4→#2563EB.
- P&L only: text-up/bg-up #10B981→#0A6B50 · text-down/bg-down #F5808C→#B81C22 · warning #F0A94F→#9A4D00.
- shadow-elev-1/2/3 = --elev-1/2/3 (neutral, never coloured). shadow-soft/glass are aliases of elev-1; shadow-glass-lg = elev-2.
- Legacy `.glass-*` class names are re-defined in globals.css and are NO LONGER glass: `.glass-surface`/`.glass-card`/`.lg-surface` = bg-wrap + 1px solid line + elev-1. `.glass-control` = bg-surface-2 + 1px line, hover = color-mix(light 6%, surface-2) + wrap-line border. `.glass-control-accent` = solid #406AE4 fill, white ink, elev-1, hover #3055C2. `.glass-control-danger` = color-mix(down 12%, wrap) fill + down/32% border, hover down 18%/46%. Only `.glass-float`/`.glass-pill` remain translucent: color-mix(surface-3 86%) + backdrop-filter blur(20px) saturate(1.5) + elev-3.
- `.panel-inset`/`.tile-tint` = bg-surface-2 + 12px radius. `.lift` = translateY(-3px) on hover over 260ms cubic-bezier(.16,1,.3,1).

MOTION: durations instant 90ms / fast 160ms / base 240ms / slow 380ms; ease-out cubic-bezier(.22,1,.36,1), ease-in cubic-bezier(.64,0,.78,0). Overlay keyframes are dependency-free (tailwindcss-animate removed): overlay-in 160ms / overlay-out 140ms (opacity), pop-in 180ms / pop-out 140ms (scale .97→1), tip-in 125ms / tip-out 100ms, dialog-in 200ms / dialog-out 160ms (translate(-50%,-50%) scale .97), sheet-in-* 250ms / sheet-out-* 200ms cubic-bezier(.32,.72,0,1), accordion-down 200ms / accordion-up 160ms on --radix-accordion-content-height. All pop/tip use origin-[--radix-*-content-transform-origin] so they scale from their trigger.

GLOBAL FOCUS: `*:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px }` in globals.css sits UNDER every component's own focus-visible ring, so most controls show both an accent outline and their local ring unless they explicitly clear it (CommandInput does).

FONTS: --font-sans "Geist", --font-display = var(--font-geist-sans), --font-mono "Geist Mono". `MONO` (lib/tokens.ts) = `[font-family:var(--font-mono),ui-monospace,monospace] tabular-nums`.

ICONS: everything imports from `@/lib/icons` — an auto-generated Iconify shim (Solar linear as primary, Lucide fallback, fa6-brands for social), 168 icons bundled inline as SVG bodies, lucide-compatible names/props. No runtime icon fetch.

AS-BUILT DRIFT worth preserving or knowingly fixing in a redesign: (a) StatTile's label is text-[9px] and StatCard/Verdict/ChangeBadge use 10px — all below the stated 11px `micro` floor. (b) StockAvatar's palette references `bg-dot-blue`, `bg-dot-purple`, `bg-dot-indigo` which are NOT defined in tailwind.config.ts, so 3 of its 6 colour slots render with no background. (c) Input/Select/NumericInput focus rings are `ring-white/40` + `border-white/30` — a raw white, not a token, and invisible on the light theme. (d) Two Sheet implementations ship side-by-side (foundation/Sheet.tsx and ui/sheet.tsx) with different scrims (black/60 vs black/80), widths (max-w-sm vs w-3/4 sm:max-w-sm) and title sizes (16px/400 vs 18px/600). (e) foundation/DataTable and ui/table.tsx are two unrelated table systems. (f) `EyebrowMono` renders font-sans, not mono, despite its name.

Sonner is mounted once in app/providers.tsx: `<Toaster theme="system" position="top-right">` with toast style background var(--color-wrap), 1px solid var(--color-line), borderRadius 8px, color var(--color-light).

---

## Contents

- **Button** — `@/components/foundation/Button`
- **Card / Panel / CardHeader / CardBody / CardFooter** — `@/components/foundation/Card`
- **Input / Textarea / Label** — `@/components/foundation/Input · @/components/ui/textarea · @/components/ui/label`
- **NumericInput** — `@/components/foundation/NumericInput`
- **Select** — `@/components/foundation/Select`
- **Checkbox / Switch / Toggle / ToggleGroup** — `@/components/ui/checkbox · switch · toggle · toggle-group`
- **Badge / Verdict** — `@/components/foundation/Badge · @/components/foundation/Verdict`
- **ChangeBadge** — `@/components/foundation/ChangeBadge`
- **Dialog / ConfirmDialog** — `@/components/foundation/Dialog · @/components/foundation/ConfirmDialog`
- **Sheet (two implementations)** — `@/components/foundation/Sheet · @/components/ui/sheet`
- **Popover / Tooltip** — `@/components/foundation/Popover · @/components/foundation/Tooltip`
- **DropdownMenu** — `@/components/ui/dropdown-menu`
- **Tabs / Segmented / PillTabs** — `@/components/foundation/Tabs · @/components/foundation/Segmented · @/components/ui/PillTabs`
- **DataTable / Table** — `@/components/foundation/DataTable · @/components/ui/table`
- **StatCard / StatTile** — `@/components/foundation/StatCard · @/components/foundation/StatTile`
- **UsageMeter / WinRateGauge / Progress** — `@/components/foundation/UsageMeter · @/components/foundation/WinRateGauge · @/components/ui/progress`
- **Sparkline / Spark / Chart** — `@/components/foundation/Sparkline · @/components/foundation/Spark · @/components/ui/chart`
- **Skeleton / Spinner / PageLoader** — `@/components/foundation/Skeleton · @/components/foundation/Spinner`
- **EmptyState / ErrorState / Alert / Toast** — `@/components/foundation/EmptyState · ErrorState · @/components/ui/alert · @/components/foundation/Toast`
- **PageHeader / EyebrowMono / DisclaimerFooter** — `@/components/foundation/PageHeader · EyebrowMono · DisclaimerFooter`
- **Motion & decorative primitives** — `@/components/foundation/Reveal · @/components/ui/blur-fade · number-ticker · typing-animation · dot-pattern · terminal`
- **Avatar / StockAvatar / BrandLogo** — `@/components/ui/avatar · StockAvatar · BrandLogo`
- **Command (⌘K palette primitives)** — `@/components/ui/command`
- **Accordion / Collapsible / ScrollArea / Separator / Resizable** — `@/components/ui/accordion · collapsible · scroll-area · separator · resizable`

---

## Button

**Import** `@/components/foundation/Button` · **File** `components/foundation/Button.tsx` · **174 LOC**

The single click target primitive. Five variants and three sizes, plus a built-in idle→loading→success→idle state machine so generative actions (backtest, deploy, generate strategy) report their own progress instead of the caller rendering a spinner elsewhere.

| Variant / slot | Spec |
|---|---|
| **Base shell** | `inline-flex select-none items-center justify-center rounded-sm font-semibold` → 8px radius, weight 600. Transition is `transition-[transform,background-color,border-color,color] duration-instant ease-out` = 90ms cubic-bezier(.22,1,.36,1). |
| **variant=primary** | class `.glass-control-accent`: background #406AE4, 1px solid #406AE4, color #fff, box-shadow --elev-1. Hover swaps both fill and border to #3055C2. |
| **variant=secondary** | `.glass-control text-d-text-primary`: background #1E1E21 (light #F4F7F9), 1px solid #29292D (light #DDE5ED), ink #F7F7F8/#1D1D1D. Hover = color-mix(light 6%, surface-2), border → #3B3B40/#C8D4DE. |
| **variant=ghost** | `border border-transparent bg-transparent text-d-text-secondary hover:bg-surface-2 hover:text-d-text-primary` — the only borderless variant; it earns an edge only on hover. |
| **variant=danger** | `.glass-control-danger text-down`: fill color-mix(#F5808C 12%, #151517), border color-mix(#F5808C 32%, transparent), ink #F5808C. Hover 18% fill / 46% border. |
| **variant=ai** | `.glass-control text-[var(--color-ai)]` — neutral L2 control with #8FB0FF (light #3459C9) ink. |
| **size=sm** | `h-7 gap-1.5 px-3 text-xs` → 28px tall, 6px gap, 12px side padding, 12px/16px label. Icon glyph 13px. |
| **size=md (default)** | `h-8 gap-2 px-3.5 text-[13px]` → 32px tall, 8px gap, 14px side padding, 13px label. Icon glyph 14px. |
| **size=lg** | `h-10 gap-2 px-5 text-sm` → 40px tall, 8px gap, 20px side padding, 14px/20px label. Icon glyph 16px. |
| **Leading icon slot** | `<span class="grid shrink-0 place-items-center">` rendered only while state==='idle'; hidden during loading/success. |
| **Loading spinner** | `inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent opacity-70`, inline width/height = 13/14/16px by size. Replaces the icon slot. |
| **Success glyph** | `<Check size={13\|14\|16} className="shrink-0">` held for 1200ms by useButtonState, then auto-returns to idle. |
| **Label** | `<span class="truncate">` — swaps to `loadingLabel ?? children` while busy. |
| **Width pinning** | offsetWidth is measured while idle in a useEffect and re-applied as inline `minWidth` for loading/success, so a generating button never reflows its toolbar. |

**Exports** — `Button — components/foundation/Button.tsx` · `useButtonState (hook, successMs=1200) — components/foundation/Button.tsx` · `Check icon — lib/icons.ts` · `cn — lib/utils.ts`

**States & data.** No data. state prop: 'idle' | 'loading' | 'success'. Loading also sets `disabled` and `aria-busy="true"`. Disabled: `disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100`. useButtonState wraps an async action — on throw it resets to idle and rethrows so the caller owns the error toast.

**Interactions & states.** Hover: variant-specific fill/border shift over 90ms. Press: `active:scale-[0.98]`. Focus: `focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-main` (ring = #406AE4 at 60%, 1px offset against the page canvas) plus the global 2px accent outline. Clicks are swallowed while busy.

**Responsive.** No breakpoint behaviour of its own — sizes are fixed. Foundation README mandates ≥44px tap targets on mobile, which only size=lg (40px) approaches; sm/md are desktop-density.

**Built-in copy.** • ConfirmDialog busy label: "Working…"
• ErrorState retry: "Retry"

<details><summary>Stitch prompt for this primitive</summary>

```text
Design a button component set for a dark-first fintech web dashboard (Indian NSE trading platform). Radius 8px on every button, label weight 600, transitions 90ms ease-out, press state scales to 0.98. Produce three sizes: small 28px tall / 12px horizontal padding / 12px label / 6px icon gap; medium 32px tall / 14px padding / 13px label / 8px gap; large 40px tall / 20px padding / 14px label / 8px gap. Produce five variants at each size. Primary: solid #406AE4 fill, 1px #406AE4 border, white label, subtle neutral drop shadow; hover fill and border both #3055C2. Secondary: #1E1E21 fill, 1px #29292D border, #F7F7F8 label; hover fill lightens ~6%, border #3B3B40. Ghost: transparent, transparent border, #D3D3D7 label; on hover fill #1E1E21 and label #F7F7F8. Danger: translucent red-pink fill (#F5808C at 12% over #151517), border #F5808C at 32%, label #F5808C. AI: same as secondary but label #8FB0FF. Show each variant in idle, hover, focused (2px #406AE4 outline offset 2px), disabled at 50% opacity, loading (2px ring spinner in the current label colour, right edge transparent, label reads "Generating…"), and success (check glyph, label "Backtest queued"). Sample labels: "Run backtest", "Deploy to NIFTY 50", "Add RELIANCE", "Close all positions". Also render a light-theme row: page #EDF1F4, card #FFFFFF, borders #DDE5ED, ink #1D1D1D, danger #B81C22.
```
</details>

---

## Card / Panel / CardHeader / CardBody / CardFooter

**Import** `@/components/foundation/Card` · **File** `components/foundation/Card.tsx` · **168 LOC**

The L1 surface every anchored block sits on, plus its header/body/footer slots and the L2 `Panel` that replaces card-in-card nesting. Depth is an explicit elevation choice, never a blur.

| Variant / slot | Spec |
|---|---|
| **Card root** | `relative rounded-md border border-line bg-wrap` → 12px radius, 1px #29292D hairline (light #DDE5ED), fill #151517 (light #FFFFFF). Server component — no 'use client'. |
| **elevation=flush (default)** | `shadow-none`. The default for grid dashboards, where a page of shadows reads as noise. |
| **elevation=raised** | `shadow-elev-1` = 0 1px 2px rgba(0,0,0,.30), 0 4px 12px -6px rgba(0,0,0,.40) on dark; 0 1px 2px rgba(29,29,29,.04), 0 4px 12px -6px rgba(29,29,29,.10) on light. |
| **elevation=floating** | `shadow-elev-2` = 0 2px 6px rgba(0,0,0,.36), 0 12px 28px -12px rgba(0,0,0,.52) dark. |
| **interactive** | `cursor-pointer transition-[border-color,box-shadow,transform] duration-fast ease-out hover:-translate-y-px hover:border-wrap-line hover:shadow-elev-2 active:translate-y-0 active:duration-instant focus-within:border-wrap-line` — 160ms lift of exactly 1px, border to #3B3B40. |
| **density → padding vars** | Passed as CSS custom properties on the root (NOT React context, to keep Card a server component): compact --card-px 16px/--card-py 12px · default 20px/16px · feature 24px/20px. Slots read `px-[var(--card-px,20px)] py-[var(--card-py,16px)]`. |
| **CardHeader** | `flex min-h-[44px] items-center justify-between gap-3 border-b border-line` + density padding. Title div is 16px/22px, weight 600, letter-spacing -0.01em, colour #F7F7F8. |
| **CardHeader action slot** | `flex shrink-0 items-center gap-2` on the right — stays optically aligned to the title instead of stretching the row. |
| **CardBody** | Density padding only, no border, no background. |
| **CardFooter** | `border-t border-line text-xs text-d-text-muted` + density padding → 12px/16px muted caption strip. |
| **Panel (L2 nested surface)** | `rounded-sm bg-surface-2 p-4` → 8px radius, #1E1E21 (light #F4F7F9), 16px padding, NO border and NO shadow. The nesting rule: a Card may not contain a Card. |
| **Legacy variant prop** | Deprecated `variant` maps back: 'glass'→elevation floating, 'clickable'→interactive true, 'static'→flush. |

**Exports** — `Card, CardHeader, CardBody, CardFooter, Panel — components/foundation/Card.tsx` · `cn — lib/utils.ts` · `globals.css .glass-surface / .lg-surface / .panel-inset`

**States & data.** No data. States are hover/active/focus-within on `interactive` only. Cards are used as the loading shell for skeleton grids across app/**/loading.tsx (which is why Card must stay a server component).

**Interactions & states.** interactive cards lift 1px on hover, drop back on active over 90ms, and highlight their border when any child takes focus. Non-interactive cards are inert.

**Responsive.** No internal breakpoints — cards inherit the page grid. Density is the density knob, not a breakpoint.

**Built-in copy.** None — Card carries no copy of its own.

<details><summary>Stitch prompt for this primitive</summary>

```text
Design a card surface family for a dark-first Indian stock-trading dashboard. Base card: 12px corner radius, fill #151517, 1px #29292D border, no shadow by default. Show three elevation steps side by side — flush (no shadow), raised (soft neutral shadow: 1px/2px plus 4px/12px at -6px spread), and floating (2px/6px plus 12px/28px at -12px). Never tint a shadow. Show an interactive variant that lifts exactly 1px on hover over 160ms with its border shifting to #3B3B40 and picking up the floating shadow. Card anatomy top to bottom: a header row at least 44px tall with a 1px #29292D bottom rule, title at 16px/22px weight 600 letter-spacing -0.01em in #F7F7F8, and a right-aligned action slot with 8px gaps holding a small ghost icon button; a body; a footer with a 1px top rule and 12px #96969E caption text. Provide three padding densities: 16×12, 20×16, 24×20. Also show the nested panel: 8px radius, fill #1E1E21, 16px padding, no border and no shadow — used instead of a card inside a card. Populate with realistic content: header "Open positions", body a 3-row list (RELIANCE ₹2,847.30 +1.24%, TCS ₹4,102.55 −0.38%, HDFCBANK ₹1,689.10 +0.62%), footer "Updated 15:31 IST". Render a matching light theme: page #EDF1F4, card #FFFFFF, border #DDE5ED, nested panel #F4F7F9, ink #1D1D1D.
```
</details>

---

## Input / Textarea / Label

**Import** `@/components/foundation/Input · @/components/ui/textarea · @/components/ui/label` · **File** `components/foundation/Input.tsx` · **47 LOC**

The plain text field with its own label and inline error slot, plus the shadcn textarea and Radix label. Input is the foundation-blessed one; Textarea and Label are unmodified shadcn registry items on the shadcn colour bridge rather than the d-text tokens.

| Variant / slot | Spec |
|---|---|
| **Input wrapper** | `flex flex-col gap-1` → 4px between label, field and error. |
| **Input label** | `text-xs font-normal text-d-text-secondary` → 12px/16px, weight 400, #D3D3D7 (light #4D585F). htmlFor is wired to a React.useId()-derived `input-:r0:` id when no id is passed. |
| **Input field** | `h-9 w-full rounded-sm border bg-wrap-hover px-3 text-sm text-d-text-primary` → 36px tall, 8px radius, fill #1E1E21 (light #F4F7F9), 12px side padding, 14px/20px ink #F7F7F8. |
| **Input placeholder** | `placeholder:text-d-text-muted` → #96969E (light #5F6B75). |
| **Input focus** | `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:border-white/30` — 1px white-40% ring plus a white-30% border. AS-BUILT: raw white, not a token; effectively invisible on the light theme. |
| **Input error** | Border swaps `border-line` → `border-down` (#F5808C / light #B81C22); `aria-invalid` set; a `<p id="{id}-error" class="text-xs text-down">` renders below and is referenced by aria-describedby. |
| **Input disabled** | `disabled:opacity-50` only — no cursor change. |
| **Textarea (ui/textarea.tsx)** | `flex min-h-[80px] w-full rounded-xs border border-input bg-background px-3 py-2 text-base md:text-sm` → 80px min height, 6px radius, border #29292D, fill = page canvas #0D0D0E (NOT the field fill Input uses), 12px/8px padding, 16px text that drops to 14px at ≥768px (iOS zoom guard). |
| **Textarea focus/disabled** | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (ring #406AE4, offset against --background) + `disabled:cursor-not-allowed disabled:opacity-50`. Different focus recipe from Input. |
| **Label (ui/label.tsx)** | Radix Label with `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70` → 14px, weight 500, line-height 1. Not the same as Input's own 12px label. |

**Exports** — `Input (forwardRef) — components/foundation/Input.tsx` · `Textarea (forwardRef) — components/ui/textarea.tsx` · `Label — components/ui/label.tsx (@radix-ui/react-label)` · `cn — lib/utils.ts`

**States & data.** No data. States: default, focus, error (border + red message + aria-invalid + aria-describedby), disabled. Placeholder is the only empty state.

**Interactions & states.** Type to edit. Focus ring on keyboard focus only (focus-visible). No clear button, no adornment slots, no character counter.

**Responsive.** Input is fixed 36px at all widths. Textarea alone is responsive: `text-base md:text-sm` — 16px below 768px so mobile Safari does not zoom on focus, 14px above.

**Built-in copy.** None built in — label, placeholder and error copy are all caller-supplied.

<details><summary>Stitch prompt for this primitive</summary>

```text
Design text form fields for a dark-first Indian trading platform. Single-line input: 36px tall, 8px corner radius, fill #1E1E21, 1px #29292D border, 12px horizontal padding, 14px/20px value text in #F7F7F8, placeholder #96969E. Above it a 12px/16px weight-400 label in #D3D3D7 with a 4px gap; below it, when invalid, a 12px error message in #F5808C and the border switches to #F5808C. Focus state shows a 1px white-40% ring with a white-30% border plus a 2px #406AE4 outline offset 2px. Disabled state is 50% opacity. Multi-line textarea: 80px minimum height, 6px radius, 1px #29292D border, fill #0D0D0E, 12px horizontal and 8px vertical padding, 16px text on mobile stepping to 14px at 768px and up, focus shown as a 2px #406AE4 ring offset 2px. Also show a standalone form label at 14px weight 500 line-height 1. Render realistic NSE examples: label "Symbol" with value "RELIANCE"; label "Target price" with placeholder "₹2,950.00"; an invalid field labelled "Quantity" with value "0" and error "Quantity must be at least 1"; a textarea labelled "Strategy brief" containing "Buy BANKNIFTY when RSI(14) crosses above 60 and the 20-EMA is above the 50-EMA; exit at 2% or 15:15 IST." Provide a light-theme copy: field fill #F4F7F9, border #DDE5ED, ink #1D1D1D, error #B81C22.
```
</details>

---

## NumericInput

**Import** `@/components/foundation/NumericInput` · **File** `components/foundation/NumericInput.tsx` · **254 LOC**

The controlled numeric field for trading forms — quantity, stop-loss %, target ₹, leverage ×. Carries a domain formatter that puts the right affix on the field, stacked steppers, min/max clamping, and a scroll-wheel guard (the #1 trading-form bug).

| Variant / slot | Spec |
|---|---|
| **Label** | `mb-1 block text-xs font-normal text-d-text-secondary` → 12px, 4px below, #D3D3D7. |
| **Field shell** | `flex w-full items-center rounded-sm border bg-wrap-hover transition-colors focus-within:ring-1 focus-within:ring-white/40 focus-within:border-white/30` → 8px radius, #1E1E21 fill, ring lives on the wrapper so the steppers are inside the focus box. |
| **Prefix** | `pl-3 text-sm text-d-text-muted` — rendered for formatter='currency-inr' as ₹. 12px left padding, 14px muted glyph. |
| **Input** | `flex-1 bg-transparent px-3 text-d-text-primary outline-none placeholder:text-d-text-muted disabled:cursor-not-allowed` + size class: sm `h-8 text-sm` (32px) or md `h-10 text-sm` (40px). type="text" with inputMode 'numeric' (integer) or 'decimal' (all others), autoComplete off. |
| **Suffix** | `pr-3 text-sm text-d-text-muted` — '%' for percent, '×' for multiplier. |
| **Stepper column** | `flex h-full flex-col border-l border-line` — 1px divider from the field. |
| **Increase button** | `flex h-1/2 w-7 items-center justify-center text-d-text-muted hover:text-d-text-primary disabled:opacity-30` → 28px wide, half the field height (16px at sm, 20px at md), Plus glyph `h-3 w-3` = 12px. aria-label="Increase value". Disabled at max. |
| **Decrease button** | Same, plus `border-t border-line`, Minus glyph 12px, aria-label="Decrease value". Disabled at min. |
| **Error** | `mt-1 text-[11px] text-down` with id `{id}-err`, wired via aria-describedby; field border switches to `border-down`. |
| **Helper** | `mt-1 text-[11px] text-d-text-muted` with id `{id}-help` — mutually exclusive with error. |
| **Formatter table** | integer {decimals 0, numeric} · decimal {2, decimal} · percent {suffix %, 2, decimal} · currency-inr {prefix ₹, 2, decimal} · multiplier {suffix ×, 1, decimal}. |

**Exports** — `NumericInput — components/foundation/NumericInput.tsx` · `Plus, Minus icons — lib/icons.ts` · `cn — lib/utils.ts`

**States & data.** No remote data. Local `raw` string state lets the user type intermediates like "1." while the numeric `value` stays clean; an effect re-syncs raw when the external value diverges (form reset). value===null is the explicit "not set" empty state. On blur the value is clamped to min/max and the display snapped. Disabled dims the shell to 50% and blocks the steppers.

**Interactions & states.** Click ± to step by `step` (rounded to 1e-8 to kill float drift). `onWheel` blurs the input so a scroll over the field can never change an order quantity. Keyboard ←/→ still work through the native field. Focus-within ring wraps field + steppers together.

**Responsive.** No breakpoints. `inputMode` is the mobile affordance — numeric vs decimal keypad. Steppers stay 28px wide at both sizes.

**Built-in copy.** • aria-labels: "Increase value" / "Decrease value"
• Doc examples use helper copy "As % of entry price"

<details><summary>Stitch prompt for this primitive</summary>

```text
Design a numeric form field for an Indian trading platform, dark theme first. Container: 8px radius, fill #1E1E21, 1px #29292D border, laid out as a horizontal row. Two heights: 32px compact and 40px default. Inside from left to right: an optional currency prefix ₹ in 14px #96969E with 12px left padding; the value itself in 14px #F7F7F8 tabular figures with 12px padding; an optional suffix % or × in 14px #96969E with 12px right padding; then a 1px #29292D vertical divider and a 28px-wide stacked stepper column — a plus button in the top half and a minus button in the bottom half separated by a 1px #29292D rule, each glyph 12px in #96969E turning #F7F7F8 on hover and dropping to 30% opacity when the bound is reached. Above the field a 12px #D3D3D7 label with a 4px gap; below it either an 11px #96969E helper line or an 11px #F5808C error line, with the container border turning #F5808C in the error case. Focus wraps the whole container (field plus steppers) in a 1px white-40% ring. Show four instances with real NSE data: "Quantity" = 250 (integer, no affix); "Stop loss" = 1.50% with helper "As % of entry price"; "Target" = ₹2,950.00; "Leverage" = 5.0× . Include one error case: "Quantity" = 0 with "Minimum quantity is 1". Provide a light variant: fill #F4F7F9, border #DDE5ED, ink #1D1D1D, error #B81C22.
```
</details>

---

## Select

**Import** `@/components/foundation/Select` · **File** `components/foundation/Select.tsx` · **191 LOC**

The Radix-backed dropdown picker for form values (timeframe, segment, horizon). Matches Input's label/error/helper slots so form rows line up. For action lists use DropdownMenu; for free text a Combobox does not yet exist.

| Variant / slot | Spec |
|---|---|
| **Label** | `mb-1 block text-xs font-normal text-d-text-secondary` → 12px, #D3D3D7, htmlFor wired to `select-:r0:`. |
| **Trigger** | `flex w-full items-center justify-between gap-2 rounded-sm border bg-wrap-hover px-3 text-sm text-d-text-primary transition-colors` → 8px radius, #1E1E21 fill, 12px padding, 14px ink. size sm = `h-8` (32px), md = `h-10` (40px). |
| **Trigger placeholder state** | `data-[placeholder]:text-d-text-muted` → #96969E. Default placeholder string is "Select…". |
| **Trigger icon** | `<ChevronDown className="h-4 w-4 opacity-60">` → 16px glyph at 60% opacity, right-aligned by justify-between. |
| **Trigger states** | focus-visible ring-1 white/40 + border white/30; `disabled:cursor-not-allowed disabled:opacity-50`; error → `border-down`, aria-invalid, aria-describedby. |
| **Content panel** | position="popper" sideOffset 6px. `z-50 max-h-[--radix-select-content-available-height] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-sm border border-line bg-wrap text-d-text-primary` → 8px radius, #151517 fill (not the L3 overlay), width matched to the trigger. |
| **Content motion** | `origin-[--radix-select-content-transform-origin] data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out` → scales 0.97→1 from the trigger over 180ms in / 140ms out, cubic-bezier(.23,1,.32,1). |
| **Viewport** | `p-1` → 4px inset around the item list. |
| **Item** | `relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none text-d-text-secondary` → 8px radius, 8px padding both axes, 14px #D3D3D7 label. |
| **Item states** | `data-[highlighted]:bg-wrap-hover data-[highlighted]:text-d-text-primary` (fill #1E1E21, ink #F7F7F8) · `data-[state=checked]:text-d-text-primary` · `data-[disabled]:pointer-events-none data-[disabled]:opacity-50`. |
| **Check indicator** | `absolute left-0 inline-flex w-6 items-center justify-center` holding `<Check className="h-3.5 w-3.5 text-primary">` → 24px gutter, 14px glyph in #8FB0FF (light #3459C9). The item text block is offset by `pl-5` (20px). |
| **Item description** | Optional `<p class="text-[11px] text-d-text-muted">` under the label inside the same item. |
| **Error / helper** | `mt-1 text-[11px] text-down` or `mt-1 text-[11px] text-d-text-muted`, ids `{id}-err` / `{id}-help`. |

**Exports** — `Select, SelectOption — components/foundation/Select.tsx` · `@radix-ui/react-select (Root/Trigger/Value/Icon/Portal/Content/Viewport/Item/ItemIndicator/ItemText)` · `Check, ChevronDown — lib/icons.ts`

**States & data.** Options are passed in as `SelectOption[] { value, label, description?, disabled? }` — no async loading, no empty-list state (an empty options array renders an empty 4px-padded panel). Controlled via value/onValueChange or uncontrolled via defaultValue.

**Interactions & states.** Radix keyboard model: ↑/↓ to move, Enter to pick, type-ahead by first letters, Esc to close, focus returns to the trigger on close. Highlight follows both pointer and keyboard.

**Responsive.** No breakpoints. The panel matches the trigger width via --radix-select-trigger-width and caps its height at --radix-select-content-available-height so it never overflows a short viewport. Trigger heights (32/40px) are below the 44px touch guidance the README states.

**Built-in copy.** • Default placeholder: "Select…"
• Doc examples: "5 min" / "15 min" / "Daily", "Pick one…"

<details><summary>Stitch prompt for this primitive</summary>

```text
Design a dropdown select for a dark-first Indian trading dashboard. Closed trigger: full width, 40px tall (also show a 32px compact size), 8px radius, fill #1E1E21, 1px #29292D border, 12px horizontal padding, selected value in 14px #F7F7F8, and a right-aligned 16px chevron-down at 60% opacity. Placeholder state shows "Select…" in #96969E. Above it a 12px #D3D3D7 label; below it an optional 11px #96969E helper or 11px #F5808C error, with the border turning #F5808C when invalid. Open panel: anchored 6px below the trigger, same width as the trigger, 8px radius, fill #151517, 1px #29292D border, 4px inner padding, scaling up from 97% out of the trigger over 180ms. Each option row: 8px radius, 8px padding, 14px label in #D3D3D7, with a 24px left gutter reserved for a 14px check mark in #8FB0FF on the selected row; the highlighted row fills #1E1E21 and its label turns #F7F7F8; disabled rows sit at 50% opacity. Some rows carry an 11px #96969E description under the label. Populate with a trading timeframe picker: "5 min", "15 min", "1 hour", "Daily — end-of-day close, NSE" (selected), "Weekly". Show a second instance labelled "Segment" with options "Equity cash", "F&O — index", "F&O — stock (Pro only)" disabled. Light theme: trigger #F4F7F9, panel #FFFFFF, border #DDE5ED, ink #1D1D1D, check #3459C9.
```
</details>

---

## Checkbox / Switch / Toggle / ToggleGroup

**Import** `@/components/ui/checkbox · switch · toggle · toggle-group` · **File** `components/ui/switch.tsx` · **29 LOC**

The boolean and on/off controls. All four are unmodified shadcn registry items running on the shadcn colour bridge (bg-primary, bg-accent, bg-input, bg-muted) rather than the d-text/surface tokens, so they read the accent directly.

| Variant / slot | Spec |
|---|---|
| **Checkbox box** | `grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary` → 16×16px, 8px radius, 1px #406AE4 border on an unfilled ground. |
| **Checkbox checked** | `data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground` → fill #406AE4, glyph #FFFFFF. Indicator holds `<CheckLine className="h-4 w-4">` — a 16px glyph inside a 16px box, so it fills edge to edge. |
| **Checkbox states** | `ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50` → 2px #406AE4 ring, 2px offset against the page canvas. |
| **Switch track** | `peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors` → 24×44px pill with a 2px transparent inset border. |
| **Switch track colours** | `data-[state=checked]:bg-primary` #406AE4 · `data-[state=unchecked]:bg-input` #29292D (light #DDE5ED). |
| **Switch thumb** | `pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0` → 20px circle filled with the page canvas #0D0D0E (light #EDF1F4), travelling 20px. |
| **Toggle base** | `inline-flex items-center justify-center rounded-xs text-sm font-medium transition-colors gap-2 [&_svg]:size-4 [&_svg]:shrink-0` → 6px radius, 14px weight-500 label, 8px gap, 16px icons. |
| **Toggle sizes** | default `h-10 px-3 min-w-10` (40px tall / 12px pad / 40px min) · sm `h-9 px-2.5 min-w-9` (36 / 10 / 36) · lg `h-11 px-5 min-w-11` (44 / 20 / 44). |
| **Toggle variants** | default `bg-transparent` · outline `border border-input bg-transparent hover:bg-accent hover:text-accent-foreground` (1px #29292D, hover to solid #406AE4 + white). |
| **Toggle states** | hover `bg-muted` #1E1E21 + `text-muted-foreground` #96969E · pressed `data-[state=on]:bg-accent data-[state=on]:text-accent-foreground` = solid #406AE4 with white ink · `disabled:pointer-events-none disabled:opacity-50` · focus 2px #406AE4 ring offset 2px. |
| **ToggleGroup** | `flex items-center justify-center gap-1` → 4px gaps. Variant/size are pushed to items through a React context, so items inherit unless overridden. |

**Exports** — `Checkbox — components/ui/checkbox.tsx (@radix-ui/react-checkbox)` · `Switch — components/ui/switch.tsx (@radix-ui/react-switch)` · `Toggle, toggleVariants — components/ui/toggle.tsx (@radix-ui/react-toggle, cva)` · `ToggleGroup, ToggleGroupItem — components/ui/toggle-group.tsx` · `CheckLine — lib/icons.ts`

**States & data.** No data. Checkbox supports Radix's indeterminate state but no indeterminate glyph is wired — only CheckLine renders. Switch has no loading/pending state. Toggle has on/off/disabled only.

**Interactions & states.** Space toggles all four. Checkbox and Switch show a 2px accent focus ring with a 2px offset. Switch thumb slides 20px with a transform transition. ToggleGroup passes arrow-key roving focus through Radix.

**Responsive.** No breakpoints. Switch (24×44px) and Toggle lg (44px) hit the 44px touch target; Checkbox at 16px and Toggle sm at 36px do not.

**Built-in copy.** None — all labels are caller-supplied.

<details><summary>Stitch prompt for this primitive</summary>

```text
Design the boolean controls for a dark fintech dashboard. Checkbox: 16×16px, 8px corner radius, 1px #406AE4 border, transparent when off; when on the box fills #406AE4 with a white check glyph; focus draws a 2px #406AE4 ring offset 2px; disabled is 50% opacity. Switch: 44×24px pill with a 2px transparent inset border; off track #29292D, on track #406AE4; a 20px circular thumb filled #0D0D0E with a soft shadow that slides 20px between states over a short transform transition. Toggle button: 6px radius, 14px weight-500 label with an optional 16px leading icon and 8px gap; sizes 36px, 40px and 44px tall with 10px, 12px and 20px horizontal padding; two variants — borderless transparent and outlined with a 1px #29292D edge; hover fills #1E1E21 with #96969E ink; the pressed/on state fills solid #406AE4 with white ink. Toggle group: a horizontal row of toggles with 4px gaps, all sharing one variant and size. Populate with trading examples: checkboxes for "Only F&O eligible", "Exclude circuit-hit stocks" (checked), "Include SME" (disabled); switches for "Paper trading mode" (on) and "Auto square-off at 15:15 IST" (off); a toggle group of chart intervals "1D", "1W", "1M", "1Y" with "1M" pressed. Show a light theme too: off track #DDE5ED, thumb #EDF1F4, hover fill #F4F7F9, ink #1D1D1D.
```
</details>

---

## Badge / Verdict

**Import** `@/components/foundation/Badge · @/components/foundation/Verdict` · **File** `components/foundation/Badge.tsx` · **38 LOC**

The tinted status pill. Nine tones cover brand, P&L direction, caution, neutral, AI and the BUY/HOLD/SELL verdict trio. Verdict is a 12-line wrapper that fixes the verdict styling in one place.

| Variant / slot | Spec |
|---|---|
| **Base pill** | `inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border` → 10px horizontal / 2px vertical padding, 12px/16px label at weight 500, fully round, 1px border. Renders as a `<span>`. |
| **tone=primary** | `bg-primary/10 text-primary border-primary/20` → #406AE4 at 10% fill, 20% border, ink resolves through the remapped text scale to #8FB0FF (light #3459C9). |
| **tone=up** | `bg-up/10 text-up border-up/20` → #10B981 at 10%/20%, ink #10B981 (light #0A6B50). P&L semantics only. |
| **tone=down** | `bg-down/10 text-down border-down/20` → #F5808C at 10%/20%, ink #F5808C (light #B81C22). |
| **tone=warning** | `bg-warning/10 text-warning border-warning/20` → #F0A94F at 10%/20% (light #9A4D00). True caution only. |
| **tone=muted (default)** | `bg-wrap-hover text-d-text-muted border-line` → #1E1E21 fill, #96969E ink, #29292D border. |
| **tone=ai** | `border-transparent bg-[color-mix(in_srgb,var(--color-ai)_15%,transparent)] text-[var(--color-ai)]` → borderless, #8FB0FF at 15%, #8FB0FF ink (light #3459C9). |
| **tone=buy / hold / sell** | buy = up recipe · sell = down recipe · hold = `border-line bg-wrap-hover text-d-text-secondary` (#1E1E21 fill, #D3D3D7 ink). |
| **Verdict wrapper** | `<Badge tone={buy\|sell\|hold} className="px-1.5 py-0.5 text-[10px] font-normal">` — overrides to 6px/2px padding, 10px label, weight 400. Maps 'BUY'→buy, 'SELL'→sell, anything else→hold. |

**Exports** — `Badge, Tone type — components/foundation/Badge.tsx` · `Verdict — components/foundation/Verdict.tsx` · `cn — lib/utils.ts`

**States & data.** Purely presentational — no states, no data, no interaction. Tone is the only axis; there is no size prop (Verdict achieves its smaller size by className override).

**Interactions & states.** None. Badge is a span with no hover, focus or click behaviour.

**Responsive.** None — badges are intrinsically sized and wrap with their text.

**Built-in copy.** • Verdict labels are exactly "BUY", "HOLD", "SELL" (uppercase, passed by the caller).

<details><summary>Stitch prompt for this primitive</summary>

```text
Design a status badge family for a dark-first Indian stock-trading platform. Every badge is a fully rounded pill with 10px horizontal and 2px vertical padding, a 12px/16px weight-500 label, and a 1px border; each tone is a 10%-opacity tint of its own colour with a 20%-opacity border of the same colour and solid coloured ink. Render nine tones: brand — fill #406AE4/10%, border #406AE4/20%, text #8FB0FF; up — #10B981 tint with #10B981 text; down — #F5808C tint with #F5808C text; warning — #F0A94F tint with #F0A94F text; muted — solid #1E1E21 fill, #29292D border, #96969E text; AI — #8FB0FF at 15% with no border and #8FB0FF text; buy (same as up); hold (same as muted but text #D3D3D7); sell (same as down). Then show a compact verdict variant used in dense tables: 6px/2px padding, 10px weight-400 label, reading "BUY", "HOLD" and "SELL". Use realistic labels: "NIFTY 50", "+2.4% today", "−1.1%", "Circuit limit", "Pre-open", "AI pick", "Pro", "Live", "Paper". Place a row of them inside a #151517 card at 12px radius to show contrast in context. Then repeat the full set on a light theme: page #EDF1F4, card #FFFFFF, up #0A6B50, down #B81C22, warning #9A4D00, brand ink #3459C9, muted fill #F4F7F9 with #DDE5ED border and #5F6B75 text. Green and red are reserved for profit and loss only — never for generic UI chrome.
```
</details>

---

## ChangeBadge

**Import** `@/components/foundation/ChangeBadge` · **File** `components/foundation/ChangeBadge.tsx` · **96 LOC**

The signed +/− delta indicator used in every price cell, row and card. Derives tone, arrow and sign from the value itself and formats in Indian numbering. Inline (no background) by default so it fits dense tables; `filled` gives a pill.

| Variant / slot | Spec |
|---|---|
| **Base** | `inline-flex items-center font-mono font-normal tabular-nums` — Geist Mono, weight 400, tabular figures so columns align. |
| **size=xs** | `text-[10px] gap-0.5 px-1 py-0` → 10px label, 2px gap, 4px horizontal padding, no vertical padding. Arrow `h-2.5 w-2.5` = 10px. |
| **size=sm (default)** | `text-[11px] gap-1 px-1.5 py-0.5` → 11px label, 4px gap, 6px/2px padding. Arrow `h-3 w-3` = 12px. |
| **size=md** | `text-xs gap-1 px-2 py-0.5` → 12px label, 4px gap, 8px/2px padding. Arrow `h-3.5 w-3.5` = 14px. |
| **Tone: up** | value > 0 → `text-up` #10B981 (light #0A6B50) with an ArrowUp glyph. |
| **Tone: down** | value < 0 → `text-down` #F5808C (light #B81C22) with an ArrowDown glyph. |
| **Tone: neutral** | value === 0 (or toneOverride='neutral') → `text-d-text-muted` #96969E and NO arrow at all. |
| **filled** | Adds `rounded-full` plus `bg-up/10` · `bg-down/10` · `bg-wrap-hover` by tone — a fully round tinted pill. |
| **kind=percent (default)** | `+1.24%` / `-0.38%` — sign, absolute value to exactly 2 decimals, percent sign. |
| **kind=currency-inr** | `+₹1,24,500` — sign, ₹, then `numMax(abs, 2)` = Intl en-IN with up to 2 fraction digits and trailing zeros dropped (Indian lakh/crore grouping). |
| **kind=plain** | `+12,345` — sign then `num(abs)` = Intl en-IN default grouping. |
| **A11y** | aria-label is spoken as `"up +1.24%"` / `"down -0.38%"` so a screen reader says the direction as a word, not "plus-sign one dot two four percent". |

**Exports** — `ChangeBadge, ChangeKind — components/foundation/ChangeBadge.tsx` · `ArrowUp, ArrowDown — lib/icons.ts` · `num, numMax — lib/format.ts (Intl en-IN)`

**States & data.** Value-driven only — no loading or error state. `toneOverride` forces up/down/neutral regardless of sign (used where the colour semantics are inverted, e.g. a falling expense). Zero renders arrow-less and muted rather than green.

**Interactions & states.** None — it is a static span. Frequently rendered inside DataTable cells and StatCard, which own the interaction.

**Responsive.** None; size is chosen at the call site — xs for sparkline captions, sm for table cells and StatCard deltas, md for card headers.

**Built-in copy.** • Format shapes: "+1.24%", "-0.38%", "+₹1,24,500", "−" never used here (that is lib/format's DASH for null).

<details><summary>Stitch prompt for this primitive</summary>

```text
Design a price-change indicator for an Indian stock dashboard, dark theme first. It is an inline monospaced element with tabular figures: a directional arrow followed by a signed value. Three sizes — extra small at 10px text with a 10px arrow, 2px gap and 4px horizontal padding; small at 11px text with a 12px arrow, 4px gap, 6px/2px padding; medium at 12px text with a 14px arrow, 4px gap, 8px/2px padding. Three tones: positive uses #10B981 with an up arrow, negative uses #F5808C with a down arrow, and exactly zero uses #96969E with no arrow at all. Show both a transparent inline form (the default, for dense table cells) and a filled form that adds a fully rounded pill background at 10% of the tone colour. Render three value formats with realistic NSE data: percent — "+1.24%", "−0.38%", "0.00%"; rupees in Indian lakh/crore grouping — "+₹1,24,500", "−₹8,750.25"; and plain counts — "+12,345". Lay them out in context: a 6-row price table on a #151517 card at 12px radius where the symbol column reads RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, BANKNIFTY and the right-aligned change column uses the small inline form, plus a KPI card showing "Day P&L ₹42,318" with a medium filled badge reading "+2.41%". Repeat on a light theme where positive is #0A6B50, negative is #B81C22, neutral is #5F6B75, and cards are #FFFFFF on an #EDF1F4 page.
```
</details>

---

## Dialog / ConfirmDialog

**Import** `@/components/foundation/Dialog · @/components/foundation/ConfirmDialog` · **File** `components/foundation/Dialog.tsx` · **52 LOC**

The centred modal, and the deliberate confirmation modal built on it. ConfirmDialog exists to replace native window.confirm() for destructive trading actions (close all positions, go live with real money) — Cancel takes initial focus so a stray Enter always backs out.

| Variant / slot | Spec |
|---|---|
| **Overlay** | `fixed inset-0 z-40 bg-black/60` with `data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out` → 60% black scrim fading in over 160ms / out over 140ms. |
| **Content shell** | `fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-sm border border-line bg-wrap p-5 shadow-soft` → centred, max 448px wide, 8px radius, 1px #29292D border, #151517 fill, 20px padding, --elev-1 shadow. |
| **Content motion** | `data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out` → translate(-50%,-50%) scale .97→1 over 200ms in / 160ms out, cubic-bezier(.23,1,.32,1). Stays centred (does not scale from a trigger). |
| **Title** | `mb-2 text-base font-normal text-d-text-primary` → 16px/24px weight 400, 8px below. AS-BUILT: a modal title at regular weight. |
| **Description** | Always rendered as `<RD.Description className="sr-only">` falling back to the title string — Radix requires one for a11y, so it is visually hidden rather than omitted. |
| **ConfirmDialog surface** | Passes `className="glass-surface"`, which in the current globals.css resolves to bg-wrap + 1px line + elev-1 — i.e. no visual change from the base Dialog, plus the base classes still apply. |
| **ConfirmDialog body** | `text-sm leading-relaxed text-d-text-secondary` → 14px, 1.625 line-height, #D3D3D7. |
| **ConfirmDialog action row** | `mt-5 flex justify-end gap-2` → 20px above, right-aligned, 8px between buttons. |
| **Cancel button** | `<Button variant="ghost" size="sm">` (28px tall) holding a ref that is focused on a 0ms timeout after open, overriding Radix's default content focus. |
| **Confirm button** | `<Button variant={destructive ? 'danger' : 'primary'} size="sm">` — 28px tall, label swaps to "Working…" while the async onConfirm is in flight. |

**Exports** — `Dialog — components/foundation/Dialog.tsx (@radix-ui/react-dialog)` · `ConfirmDialog — components/foundation/ConfirmDialog.tsx` · `Button — components/foundation/Button.tsx`

**States & data.** Fully controlled — `open` + `onClose`. ConfirmDialog carries local `busy` state: both buttons disable, the confirm label becomes "Working…", and the dialog closes itself after onConfirm resolves. No error surface — a failing confirm just re-enables.

**Interactions & states.** Radix focus trap, Esc and outside-click dismiss, focus returns to the trigger, body scroll locked. ConfirmDialog deliberately moves initial focus to Cancel, so Enter is always the safe answer and confirming needs a click or an explicit Tab+Enter.

**Responsive.** `w-full max-w-md` → full viewport width minus nothing below 448px (no side gutter is applied), capped at 448px above. Content does not scroll internally; a tall body will overflow the viewport. CommandPalette overrides to `max-w-[600px] overflow-hidden p-0`.

**Built-in copy.** • Default confirmLabel: "Confirm"
• Default cancelLabel: "Cancel"
• Busy state: "Working…"
• sr-only fallback description: "Dialog content"

<details><summary>Stitch prompt for this primitive</summary>

```text
Design a centred confirmation modal for a dark-first Indian trading platform. Backdrop: full-bleed black at 60% opacity, fading in over 160ms. Modal card: horizontally and vertically centred, full width up to a 448px maximum, 8px corner radius, fill #151517, 1px #29292D border, 20px padding, and a soft neutral shadow; it scales from 97% to 100% over 200ms as it appears. Inside from top to bottom: a title at 16px/24px weight 400 in #F7F7F8 with 8px below it; a body paragraph at 14px with relaxed line height in #D3D3D7; then 20px of space and a right-aligned button row with 8px between the two buttons. The left button is a 28px-tall borderless ghost button reading "Cancel" and it carries the initial focus ring, so pressing Enter always backs out. The right button is 28px tall and is either the solid #406AE4 primary or, for destructive actions, the danger style — a translucent #F5808C fill at 12% over the card with a #F5808C border and #F5808C label. Show three states: idle, focused-on-Cancel with a 2px #406AE4 outline, and busy where both buttons are 50% opacity and the confirm label reads "Working…". Use real trading copy: title "Close all open positions?", body "This squares off 7 positions across RELIANCE, TCS and BANKNIFTY at market price. Realised P&L today is +₹42,318. This cannot be undone.", confirm label "Close all positions". Also render a light variant: card #FFFFFF, border #DDE5ED, ink #1D1D1D, danger #B81C22.
```
</details>

---

## Sheet (two implementations)

**Import** `@/components/foundation/Sheet · @/components/ui/sheet` · **File** `components/foundation/Sheet.tsx` · **134 LOC**

The edge-slide overlay for mobile filter drawers, detail panes and action sheets. Two implementations ship side by side: the foundation Sheet (opinionated, title/description/close built in) and the raw shadcn ui/sheet composition set.

| Variant / slot | Spec |
|---|---|
| **Foundation overlay** | `fixed inset-0 z-40 bg-black/60` with overlay-in 160ms / overlay-out 140ms. |
| **Foundation content base** | `fixed z-50 flex flex-col gap-3 border-line glass-surface p-6 outline-none` → 12px child gaps, 24px padding, `.glass-surface` = #151517 fill + 1px #29292D + --elev-1 (the class no longer blurs). |
| **side=right (default) / left** | `inset-y-0 right-0 h-full w-full max-w-sm border-l` (or left-0 / border-r) → full height, full width capped at 384px, one hairline edge. |
| **side=bottom** | `inset-x-0 bottom-0 max-h-[85vh] rounded-t-sm border-t` → full width, capped at 85% viewport height, 8px top corners only. |
| **side=top** | `inset-x-0 top-0 border-b` — full width, height by content. |
| **Slide motion** | `animate-sheet-in-{side}` 250ms / `animate-sheet-out-{side}` 200ms on cubic-bezier(.32,.72,0,1) — an iOS-drawer curve, translating 100% from its own edge. |
| **Header row** | `flex items-start justify-between gap-3` — rendered when a title exists or the close button is shown. |
| **Title / description** | Title `text-base font-normal text-d-text-primary` (16px weight 400); description `mt-1 text-sm text-d-text-secondary` (14px #D3D3D7). If no description is passed an sr-only one is emitted so screen readers do not warn. |
| **Close button** | `inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-d-text-secondary hover:bg-wrap-hover hover:text-d-text-primary focus-visible:ring-1 focus-visible:ring-white/40` with `<X className="h-4 w-4">` → 36px square, 8px radius, 16px glyph, aria-label "Close". |
| **Body** | `flex-1 overflow-y-auto` — the content region scrolls, the header does not. |
| **shadcn ui/sheet differences** | Overlay `bg-black/80 z-50` (darker); content `bg-background p-6 shadow-lg` (fills with the PAGE canvas #0D0D0E, not the card); width `w-3/4 sm:max-w-sm`; close is `absolute right-4 top-4` at 70%→100% opacity; SheetTitle `text-lg font-semibold` (18px/600); SheetDescription `text-sm text-muted-foreground`; SheetHeader `flex flex-col space-y-2 text-center sm:text-left`; SheetFooter `flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2`. |

**Exports** — `Sheet — components/foundation/Sheet.tsx (@radix-ui/react-dialog + cva)` · `Sheet/SheetContent/SheetHeader/SheetFooter/SheetTitle/SheetDescription/SheetOverlay/SheetClose — components/ui/sheet.tsx` · `X — lib/icons.ts`

**States & data.** Controlled open/onClose (foundation) or Radix-controlled (shadcn). No loading or empty state of its own — callers put Selects, NumericInputs and Buttons inside.

**Interactions & states.** Focus trapped while open and returned on close; Esc and outside-click dismiss; body scroll locked. The close button is suppressible with `hideCloseButton` (only when another close path exists).

**Responsive.** Foundation left/right sheets are `w-full max-w-sm` — full-bleed under 384px, 384px above. Bottom sheet caps at 85vh, which is the native mobile pattern. shadcn sheets are `w-3/4` on mobile, capping at 384px from the sm breakpoint (640px). Sheets slide from the edge at every width by design.

**Built-in copy.** • Close button aria-label: "Close"
• sr-only description fallback: "Side sheet"

<details><summary>Stitch prompt for this primitive</summary>

```text
Design an edge-slide overlay panel for a dark-first Indian trading app. Backdrop: black at 60% opacity fading in over 160ms. Panel: fill #151517, 1px #29292D hairline on the edge facing the content, a soft neutral shadow, 24px padding, and 12px vertical gaps between children; it slides fully in from its own edge over 250ms on a firm iOS-drawer curve. Show four placements: right and left as full-height columns that are full width up to a 384px maximum with a single vertical hairline; bottom as a full-width panel capped at 85% of the viewport height with only its top two corners rounded to 8px; and top as a full-width banner. Header row: a 16px weight-400 title in #F7F7F8 with an optional 14px #D3D3D7 description 4px beneath, and on the right a 36px square close button at 8px radius holding a 16px × glyph in #D3D3D7 that fills #1E1E21 on hover. Below the header, a scrolling body that fills the remaining height. Populate the right sheet as a screener filter drawer titled "Filter signals" with description "12 of 187 NSE symbols match", containing a segmented direction control (All / Bullish / Bearish), a select labelled "Timeframe" set to "Daily", a numeric field "Min confidence" at 65%, and a sticky pair of buttons "Reset" (ghost) and "Apply filters" (solid #406AE4). Populate the bottom sheet as a mobile action list for RELIANCE: "Add to watchlist", "Set price alert", "Open chart", "Place order". Include a light theme: panel #FFFFFF, border #DDE5ED, ink #1D1D1D.
```
</details>

---

## Popover / Tooltip

**Import** `@/components/foundation/Popover · @/components/foundation/Tooltip` · **File** `components/foundation/Popover.tsx` · **77 LOC**

The two anchored overlays with a hard rule between them: Tooltip is a short non-interactive hint (hover/focus/touch), Popover is for anything the user clicks — filter pickers, mini-detail previews, small forms.

| Variant / slot | Spec |
|---|---|
| **Popover panel** | `z-50 rounded-sm border border-line bg-wrap text-d-text-primary` → 8px radius, 1px #29292D, #151517 fill, #F7F7F8 ink. No padding of its own — the caller supplies it (docs use `p-3 w-64`). |
| **Popover placement** | side default 'bottom', align default 'start', sideOffset default 6px. All four sides and three alignments supported through Radix. |
| **Popover motion** | `origin-[--radix-popover-content-transform-origin] data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out` → scale .97→1 out of the trigger, 180ms in / 140ms out on cubic-bezier(.23,1,.32,1). |
| **Popover trigger** | `<PopoverPrimitive.Trigger asChild>` wrapping a single child — usually a ghost Button. Radix wires aria-haspopup and aria-expanded automatically. |
| **Tooltip panel** | `z-50 max-w-xs rounded-sm border border-line bg-wrap-hover px-2.5 py-1.5 text-xs text-d-text-primary` → 320px max width, 8px radius, #1E1E21 fill (one step lighter than Popover), 10px/6px padding, 12px/16px ink. |
| **Tooltip placement** | side default 'top', sideOffset default 6px. |
| **Tooltip motion** | `origin-[--radix-tooltip-content-transform-origin]` with `data-[state=delayed-open]:animate-tip-in` and `data-[state=instant-open]:animate-tip-in`, closing on `animate-tip-out` → 125ms in / 100ms out, the fastest overlay in the system. |
| **Tooltip timing** | `<TooltipPrimitive.Provider delayDuration={200} disableHoverableContent>` — a 200ms hover delay, and the tooltip itself is not hoverable (it cannot be a target). |
| **Tooltip disabled** | `disabled` returns the bare children with no Provider/Root at all, so the tooltip can be switched off without unmounting the trigger. |
| **Rich content** | Both take ReactNode. The documented tooltip pattern embeds a kbd chip: `<kbd className="rounded border border-line px-1 text-[10px]">⌘K</kbd>`. |

**Exports** — `Popover — components/foundation/Popover.tsx (@radix-ui/react-popover)` · `Tooltip — components/foundation/Tooltip.tsx (@radix-ui/react-tooltip)`

**States & data.** No data. Popover supports controlled `open`/`onOpenChange` or uncontrolled. Tooltip is always uncontrolled. Neither has a loading or empty state.

**Interactions & states.** Popover: click to open, click-outside and Esc to close, focus trapped inside while open, focus returned to the trigger. Tooltip: hover after 200ms, keyboard focus, and touch all trigger it; Esc and outside-click dismiss; `prefers-reduced-motion` is respected globally via MotionConfig; aria-describedby is linked automatically.

**Responsive.** Radix collision handling flips and shifts both overlays inside the viewport. Tooltip caps at 320px wide so long hints wrap rather than run off-screen. No breakpoint-specific behaviour.

**Built-in copy.** • Doc example tooltip body: "Confidence is the weighted ensemble score"
• Doc example popover heading: "Filter signals" with an "Apply" button

<details><summary>Stitch prompt for this primitive</summary>

```text
Design two anchored overlays for a dark fintech dashboard, clearly differentiated. First, a tooltip: a small floating chip positioned 6px above its trigger, 8px corner radius, fill #1E1E21, 1px #29292D border, 10px horizontal and 6px vertical padding, 12px/16px text in #F7F7F8, capped at 320px wide so long hints wrap to two or three lines. It appears after a 200ms hover delay and scales from 97% out of its trigger in about 125ms. Show one short tooltip and one rich tooltip containing a label plus a small keyboard chip — a 6px-radius outlined box with a 1px #29292D border, 4px padding and 10px text reading ⌘K. Second, a popover: a larger click-opened panel positioned 6px below and left-aligned to its trigger, 8px corner radius, fill #151517 (one step darker than the tooltip so the two never read as the same object), 1px #29292D border, with the panel's own 12px inner padding and a 256px width. It also scales from 97% out of the trigger, slightly slower at 180ms. Fill the popover with an interactive filter form: a heading "Filter signals" at 14px weight 600, a numeric field "Min confidence" set to 65%, a select "Horizon" set to "Swing (3–10 days)", and a full-width solid #406AE4 "Apply" button. Use tooltip copy like "Confidence is the weighted ensemble score across 4 models" and "Last tick 15:29:47 IST". Both anchored to small ghost icon-buttons in a card. Provide a light theme: tooltip #F4F7F9, popover #FFFFFF, border #DDE5ED, ink #1D1D1D.
```
</details>

---

## DropdownMenu

**Import** `@/components/ui/dropdown-menu` · **File** `components/ui/dropdown-menu.tsx` · **200 LOC**

The action-list menu (kebab menus, account menus, row actions). Full shadcn composition set including checkbox items, radio items, sub-menus, labels, separators and shortcut hints. Runs on the shadcn colour bridge, so `bg-popover` resolves to #1E1E21 dark / #FFFFFF light.

| Variant / slot | Spec |
|---|---|
| **Content** | `z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-xs border bg-popover p-1 text-popover-foreground shadow-md` → 6px radius, 128px min width, 4px inner padding, fill #1E1E21 (light #FFFFFF), 1px #29292D border. sideOffset defaults to 4px. |
| **Content motion** | `origin-[--radix-dropdown-menu-content-transform-origin]` — the transform origin is set but NO animate-pop-in class is applied here, so the dropdown appears without the scale animation the Popover/Select get. |
| **Item** | `relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors [&_svg]:size-4 [&_svg]:shrink-0` → 8px radius, 8px/6px padding, 14px label, 8px gap, 16px icons. |
| **Item states** | `focus:bg-accent focus:text-accent-foreground` → highlighted row fills SOLID #406AE4 with white ink (not a tint). `data-[disabled]:pointer-events-none data-[disabled]:opacity-50`. `inset` adds `pl-8` = 32px. |
| **CheckboxItem** | `relative flex ... rounded-sm py-1.5 pl-8 pr-2 text-sm` with an indicator `<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">` holding `<CheckLine className="h-4 w-4">` → 32px left gutter, indicator anchored at 8px, 14px slot, 16px glyph. |
| **RadioItem** | Same geometry, indicator is `<Circle className="h-2 w-2 fill-current">` → an 8px filled dot. |
| **Label** | `px-2 py-1.5 text-sm font-semibold` → 14px weight 600 section header; `inset` → pl-8. |
| **Separator** | `-mx-1 my-1 h-px bg-muted` → 1px rule at #1E1E21, pulled 4px into the content padding so it spans edge to edge, 4px margin above and below. |
| **Shortcut** | `ml-auto text-xs tracking-widest opacity-60` → right-aligned 12px hint with 0.1em tracking at 60% opacity. |
| **SubTrigger** | `flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm focus:bg-accent data-[state=open]:bg-accent` plus a trailing `<ChevronRight className="ml-auto">`. |
| **SubContent** | Same as Content but `shadow-lg` and no max-height clamp. |

**Exports** — `DropdownMenu + Trigger/Content/Item/CheckboxItem/RadioItem/Label/Separator/Shortcut/Group/Portal/Sub/SubContent/SubTrigger/RadioGroup — components/ui/dropdown-menu.tsx (@radix-ui/react-dropdown-menu)` · `CheckLine, ChevronRight, Circle — lib/icons.ts`

**States & data.** No data. Item states: default, focused/highlighted (solid accent), disabled (50%). Checkbox and radio items carry their own checked state. No loading or empty state — an empty menu renders a 4px-padded 128px box.

**Interactions & states.** Radix keyboard model: ↑/↓ move, Enter/Space activate, type-ahead by label, → opens a sub-menu, ← / Esc closes, focus returns to the trigger. Highlight follows pointer and keyboard identically.

**Responsive.** Content max-height clamps to --radix-dropdown-menu-content-available-height and scrolls vertically; horizontal overflow is hidden. Radix flips/shifts on collision. No breakpoint rules.

**Built-in copy.** None built in.

<details><summary>Stitch prompt for this primitive</summary>

```text
Design an action dropdown menu for a dark-first trading dashboard. Panel: 6px corner radius, minimum 128px wide, fill #1E1E21, 1px #29292D border, medium neutral shadow, 4px inner padding, positioned 4px below its trigger. Rows: 8px radius, 8px horizontal and 6px vertical padding, 14px label in #F7F7F8, an optional 16px leading icon with an 8px gap, and an optional right-aligned 12px shortcut hint at 60% opacity with wide letter-spacing. The highlighted row fills SOLID #406AE4 with white label and white icon — not a tint. Disabled rows sit at 50% opacity. Show a 14px weight-600 section label row, a full-bleed 1px #1E1E21 separator that extends past the panel padding with 4px margins, checkable rows with a 16px check mark in a 32px left gutter, radio rows with an 8px filled dot in the same gutter, and a submenu row with a trailing chevron that opens a second panel with a heavier shadow. Populate with a realistic stock row menu: section label "RELIANCE", then "Open chart" with shortcut ⌘O, "Add to watchlist" with shortcut W, "Set price alert", separator, a checked row "Show volume", an unchecked row "Show 20-EMA", separator, a radio group of "1D / 1W / 1M" with 1D selected, a submenu "Export" leading to "CSV" and "Broker order file", separator, and a disabled row "Place order — connect a broker first". Provide a light variant: panel #FFFFFF, border #DDE5ED, separator #F4F7F9, ink #1D1D1D, highlight still #406AE4 with white ink.
```
</details>

---

## Tabs / Segmented / PillTabs

**Import** `@/components/foundation/Tabs · @/components/foundation/Segmented · @/components/ui/PillTabs` · **File** `components/foundation/Segmented.tsx` · **115 LOC**

Three horizontal selectors with a documented division of labour: Radix `Tabs` for page/section navigation (a tinted pill rail), `Segmented` for value filters with a sliding accent pill, and `PillTabs` as the older bare chip row. Segmented is explicitly NOT to be used for signal horizon tabs — those stay Radix Tabs.

| Variant / slot | Spec |
|---|---|
| **TabsList** | `inline-flex items-center gap-1 rounded-full border border-line bg-main p-1` → fully round rail, 4px gaps, 4px inner padding, filled with the PAGE canvas #0D0D0E and hairlined #29292D — a recessed track. |
| **TabsTrigger** | `px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap text-d-text-muted hover:text-d-text-primary transition-colors focus-visible:ring-1 focus-visible:ring-ring` → 14px/6px padding, 14px weight-500 label, #96969E resting ink. |
| **TabsTrigger active** | `data-[state=active]:bg-wrap data-[state=active]:text-d-text-primary data-[state=active]:shadow-sm` → a raised #151517 pill with #F7F7F8 ink and a small shadow — the active tab rises out of the recessed rail. |
| **Segmented container** | `inline-flex items-center gap-0.5 rounded-full border border-line bg-wrap p-0.5` with `role="tablist"` → 2px gaps, 2px padding, #151517 fill (lighter than the Tabs rail). |
| **Segmented option** | `relative rounded-full font-medium transition-colors active:scale-[0.98]` with size sm `px-2.5 py-1 text-[11px]` (10px/4px, 11px) or md `px-3 py-1.5 text-xs` (12px/6px, 12px). role="tab" + aria-selected. |
| **Segmented active pill** | A `motion.span` with `absolute inset-0 rounded-full bg-primary` — solid #406AE4 — carrying `layoutId={'segmented-pill-' + useId()}` so it SLIDES between options on a spring (stiffness 400, damping 34). Active label is `text-primary-foreground` = #FFFFFF, sitting at `z-[1]`. |
| **Segmented inactive tones** | tone 'up' → `text-up` #10B981 · tone 'down' → `text-down` #F5808C · default → `text-d-text-secondary hover:text-d-text-primary`. |
| **Segmented count** | Optional trailing `<span class="tabular-nums">` at opacity 0.7 when active / 0.6 when inactive, inside a `z-[1] inline-flex gap-1.5 whitespace-nowrap` label wrapper. |
| **Segmented reduced motion** | `useReducedMotion()` sets layoutId to undefined, so the pill jumps instantly instead of sliding. |
| **PillTabs** | `flex items-center gap-2` (8px) with buttons `rounded-full font-medium transition-all duration-200`; sm `px-3 py-1.5 text-xs` (12/6, 12px), md `px-4 py-2 text-sm` (16/8, 14px). Active `bg-hover text-d-text-primary` (#1E1E21 fill); inactive `text-d-text-muted hover:text-d-text-primary hover:bg-surface-2`. No rail, no border, default export. |

**Exports** — `Tabs/TabsList/TabsTrigger/TabsContent — components/foundation/Tabs.tsx (@radix-ui/react-tabs)` · `Segmented, SegmentedOption — components/foundation/Segmented.tsx (framer-motion layoutId)` · `PillTabs — components/ui/PillTabs.tsx (default export)`

**States & data.** Segmented options carry an optional numeric `count` — the only data any of the three renders. No loading or empty state; an empty options array renders an empty 2px-padded pill.

**Interactions & states.** Tabs get the full Radix roving-focus keyboard model (arrow keys, Home/End, automatic activation). Segmented and PillTabs are plain buttons — click only, no arrow-key roving, though Segmented does emit role=tablist/tab and aria-selected. Segmented adds a 0.98 press scale and the spring-slid pill.

**Responsive.** All three are `whitespace-nowrap` and will overflow rather than wrap at narrow widths — no horizontal scroll container is built in, so callers wrap them. No breakpoint rules.

**Built-in copy.** • Segmented doc example options: "All" (count 42), "Bullish" (tone up), "Bearish" (tone down).

<details><summary>Stitch prompt for this primitive</summary>

```text
Design three horizontal selector controls for a dark-first Indian trading dashboard. First, a navigation tab rail: a fully rounded track filled with the page canvas #0D0D0E and hairlined 1px #29292D, 4px inner padding, tabs separated by 4px; each tab is a rounded pill with 14px horizontal and 6px vertical padding and a 14px weight-500 label in #96969E; the selected tab becomes a raised pill filled #151517 with #F7F7F8 label and a small shadow, so it rises out of the recessed track. Populate with "Overview", "Signals", "Backtest", "Positions", "Journal" with Signals selected. Second, a filter segmented control: a fully rounded container filled #151517 with a 1px #29292D border and only 2px padding and 2px gaps; the selected segment is a SOLID #406AE4 pill with white label that slides horizontally between segments; unselected labels are #D3D3D7, except direction segments which tint #10B981 for bullish and #F5808C for bearish. Each segment can carry a trailing tabular count at ~65% opacity. Two sizes: 11px label with 10px/4px padding, and 12px label with 12px/6px padding. Populate with "All 42", "Bullish 27", "Bearish 15". Third, a bare chip row with no track: 8px gaps, fully rounded buttons, 12px or 14px labels, unselected #96969E, selected filled #1E1E21 with #F7F7F8 label. Populate with "1D", "1W", "1M", "1Y", "MAX". Provide light-theme copies: track #EDF1F4, raised pill #FFFFFF, borders #DDE5ED, ink #1D1D1D, bullish #0A6B50, bearish #B81C22.
```
</details>

---

## DataTable / Table

**Import** `@/components/foundation/DataTable · @/components/ui/table` · **File** `components/foundation/DataTable.tsx` · **416 LOC**

The dense data surface for signal lists, position lists, scanner results and trade journals. Generic over the row type, sortable, sticky-headed, with loading/empty/error baked in — and, below 640px, it stops being a table and becomes a stack of cards. The separate shadcn `ui/table.tsx` is an unrelated raw composition set.

| Variant / slot | Spec |
|---|---|
| **Outer container** | `w-full` with `aria-busy` while loading. Contains two mutually exclusive renderers: `hidden sm:block` table and `sm:hidden` card list. |
| **Desktop frame** | `hidden overflow-auto rounded-sm border border-line bg-wrap sm:block` → 8px radius, 1px #29292D, #151517 fill, horizontal scroll as a last resort. |
| **Sticky header** | `<thead class="sticky top-0 z-[2] bg-wrap-hover">` (when stickyHeader, the default) → sticks at offset 0, fill #1E1E21. |
| **Header cell** | `border-b border-line bg-wrap-hover px-4 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-d-text-muted` + `py-2` dense / `py-3` normal → 16px side padding, 8 or 12px vertical, 11px Geist Mono caps at 0.08em tracking in #96969E. scope="col". |
| **Sortable header button** | `inline-flex items-center gap-1 hover:text-d-text-primary focus-visible:ring-2 focus-visible:ring-primary/40 rounded`; right-aligned columns flip to `flex-row-reverse`; the sorted column turns #F7F7F8. Glyphs are 12px: ArrowUp / ArrowDown when sorted, ChevronsUpDown at 40% opacity when not. aria-sort = ascending/descending/none. |
| **Body row** | `border-t border-line transition-colors`; interactive rows add `cursor-pointer hover:bg-wrap-hover focus-visible:bg-wrap-hover focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/40`, role="button", tabIndex 0. |
| **Body cell** | `px-4 text-sm text-d-text-secondary` + `py-2`/`py-3`, plus per-column `text-left\|right\|center`, `hidden sm:table-cell` for hideOnMobile, and `sticky left-0 bg-wrap z-[1]` for the sticky first column. Fixed widths come from the column's `width` as an inline style. |
| **Loading body** | `loadingRows` (default 5) rows of `<Skeleton>` — first column at 60% width, the rest at 40%, height 14px dense / 16px normal, rounded sm. |
| **Empty body** | A single full-width cell with `p-0` holding the caller's `empty` node, or the default `<EmptyState size="sm" title="No rows" description="Nothing to show here yet." />`. |
| **Error body** | A single cell with `py-12` (48px) holding `<ErrorState size="sm" title="Couldn't load" description={error} />`. |
| **Mobile card list** | `<ul class="flex flex-col gap-2">` of `<li class="rounded-sm border border-line bg-wrap p-3">` → 8px gaps, 8px radius, 12px padding. Interactive cards get the same hover/focus/role=button treatment. |
| **Mobile card content** | First column becomes the title: `mb-1 text-sm font-medium text-d-text-primary`. Every other visible column becomes a label/value row: `flex items-center justify-between gap-3 border-t border-line py-1` with the label in `font-mono text-[10px] uppercase tracking-[0.08em] text-d-text-muted` and the value in `text-right text-[13px] text-d-text-secondary`. hideOnMobile columns are dropped entirely. |
| **Mobile loading** | Cards of `rounded-sm border border-line bg-wrap p-3` each holding a 50%×16px skeleton, then `mt-2` a 1.5-gap stack of 80%×12px and 60%×12px skeletons. |
| **shadcn ui/table** | Separate, unstyled-by-token set: wrapper `relative w-full overflow-auto`; table `w-full caption-bottom text-sm`; TableHead `h-12 px-4 text-left align-middle font-medium text-muted-foreground` (48px tall); TableCell `p-4 align-middle` (16px); TableRow `border-b hover:bg-muted/50 data-[state=selected]:bg-muted`; TableFooter `border-t bg-muted/50 font-medium`; TableCaption `mt-4 text-sm text-muted-foreground`. |

**Exports** — `DataTable, Column<Row>, SortDirection — components/foundation/DataTable.tsx` · `Skeleton, EmptyState, ErrorState — components/foundation/` · `ArrowUp, ArrowDown, ChevronsUpDown — lib/icons.ts` · `Table/TableHeader/TableBody/TableFooter/TableHead/TableRow/TableCell/TableCaption — components/ui/table.tsx`

**States & data.** Four exclusive body states in priority order: error → loading → empty → rows. Sort is uncontrolled (client-side, three-click cycle asc → desc → cleared, nulls always sorted last) unless `onSortChange` is passed, which delegates entirely. rowKey defaults to `row.id` and falls back to the array index. `ariaLabel` is a required prop. No virtualisation below ~500 rows; the JSDoc says wrap in react-window past 5000.

**Interactions & states.** Click or Enter/Space on a row fires onRowClick (rows carry role=button and a focus ring). Click a sortable header to cycle the sort; the arrow glyph reflects direction and aria-sort is published. Horizontal scroll inside the frame when columns overflow.

**Responsive.** The hard breakpoint is sm (640px). Above it: the real table with a sticky header at top 0, an optional sticky first column pinned left with its own #151517 fill, and hideOnMobile columns visible. Below it: the table is fully replaced by a stacked card list where the first column is the card title and every remaining visible column becomes a label/value row — hideOnMobile columns disappear.

**Built-in copy.** • Default empty: title "No rows", description "Nothing to show here yet."
• Default error: title "Couldn't load" with the error message as the description.
• README example empty: "No signals yet" / "Today's scan finishes at 09:15 IST. Check back then."

<details><summary>Stitch prompt for this primitive</summary>

```text
Design a dense sortable data table for an Indian stock-trading platform, dark theme first. Frame: 8px corner radius, fill #151517, 1px #29292D border, horizontal scroll when needed. Header row: sticky to the top, fill #1E1E21, 1px #29292D bottom rule, labels in 11px Geist Mono uppercase with 0.08em letter-spacing in #96969E, 16px horizontal padding and 8px (dense) or 12px vertical padding; sortable headers show a 12px double-chevron at 40% opacity that becomes a solid up or down arrow when active while the label turns #F7F7F8; right-aligned numeric headers put their arrow on the left. Body rows: 1px #29292D top rule, 14px values in #D3D3D7 with monospaced tabular figures for all numbers, and a hover fill of #1E1E21 with a pointer cursor. The first column is pinned to the left edge with its own #151517 fill so the symbol stays visible while scrolling. Columns: Symbol, Direction (a small pill), LTP, Change, Confidence, Entry, Target. Populate with real NSE rows — RELIANCE BUY ₹2,847.30 +1.24% 78% ₹2,840 ₹2,960; TCS SELL ₹4,102.55 −0.38% 64% ₹4,110 ₹3,985; HDFCBANK BUY ₹1,689.10 +0.62% 71%; INFY BUY ₹1,842.75 +2.08% 83%; ICICIBANK BUY ₹1,254.40 +0.44% 59%. Also render three alternate states: five shimmering skeleton rows, an empty state reading "No signals yet — today's scan finishes at 09:15 IST", and an error state "Couldn't load". Finally show the mobile layout at 375px where each row becomes a card at 8px radius with 12px padding — the symbol as a 14px weight-500 title, then label/value rows separated by 1px rules with 10px mono uppercase labels on the left and 13px values right-aligned. Provide a light theme: frame #FFFFFF, header #F4F7F9, rules #DDE5ED, ink #1D1D1D.
```
</details>

---

## StatCard / StatTile

**Import** `@/components/foundation/StatCard · @/components/foundation/StatTile` · **File** `components/foundation/StatCard.tsx` · **121 LOC**

The two KPI cells. StatCard is the big dashboard metric — label, large mono value, optional delta and sparkline, with loading and error folded in. StatTile is the compact metric that replaced three inline reimplementations (Stat / MiniCell / Metric) across the strategy and scanner surfaces, and animates a count-up on scroll-in.

| Variant / slot | Spec |
|---|---|
| **StatCard shell** | `flex flex-col gap-2 rounded-sm p-4` → 8px radius, 16px padding, 8px gaps. Default skin `border border-line bg-wrap`; `glass` swaps to `lg-surface lift` (same fill + elev-1, plus a −3px hover lift over 260ms and a border that shifts toward the accent). |
| **StatCard label row** | `flex items-center gap-1.5` (6px) holding `<p class="font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-d-text-muted">` → 11px Geist Mono caps at 0.1em tracking in #96969E. |
| **StatCard tooltip affordance** | Optional ⓘ button: `text-d-text-muted hover:text-d-text-primary focus-visible:ring-2 focus-visible:ring-primary/40 rounded` with `<Info className="h-3 w-3">` (12px), wrapped in a foundation Tooltip, aria-label `"{label} explanation"`. |
| **StatCard value row** | `flex items-end justify-between gap-3` — value block on the left (min-w-0 flex-1), sparkline on the right. |
| **StatCard value** | `truncate font-mono text-2xl font-normal text-d-text-primary tabular-nums` → 24px/32px Geist Mono at weight 400 in #F7F7F8. |
| **StatCard delta** | `<ChangeBadge value size="sm" className="mt-1">` → 11px signed mono badge 4px under the value; kind defaults to 'percent'. |
| **StatCard sparkline** | `<Sparkline data={spark} width={72} height={28} filled />` → a fixed 72×28px filled trend at the right edge, tone auto-derived. |
| **StatCard loading** | `<Skeleton w="60%" h="28px" rounded="md" />` replaces the value (rounded='md' maps to 6px). `aria-busy` on the shell. Delta and sparkline are suppressed. |
| **StatCard error** | `<p class="flex items-center gap-1.5 text-sm text-down" role="alert">` with `<AlertCircle className="h-3.5 w-3.5 shrink-0">` (14px) and a truncated message — replaces the value entirely. |
| **StatTile shell** | `rounded-sm border border-line bg-wrap p-2` → 8px radius, 8px padding. Much tighter than StatCard. |
| **StatTile label** | `font-mono text-[9px] font-normal uppercase tracking-[0.1em] text-d-text-muted` → 9px mono caps. AS-BUILT: below the stated 11px floor. |
| **StatTile value** | `mt-0.5 text-xs font-semibold` + MONO + tone class → 12px weight 600 in Geist Mono tabular; tone up `text-up` #10B981, down `text-down` #F5808C, neutral `text-d-text-primary` #F7F7F8. Optional prefix/suffix strings sit flush against the number. |
| **StatTile hint** | `mt-0.5 text-[10px] text-d-text-muted` → 10px muted line under the value. |
| **StatTile count-up** | Numeric values render the FINAL figure by default (SSR / reduced-motion safe), then rewind to 0 and animate up over 0.6s on ease [0.2,0.8,0.2,1] the first time the tile scrolls into view. Formatting is Intl en-IN with a fixed decimal count. String values never animate. |

**Exports** — `StatCard — components/foundation/StatCard.tsx` · `StatTile, StatTileTone — components/foundation/StatTile.tsx (framer-motion animate + useInView)` · `ChangeBadge, Sparkline, Skeleton, Tooltip — components/foundation/` · `Info, AlertCircle — lib/icons.ts` · `MONO — lib/tokens.ts`

**States & data.** StatCard has three exclusive body states: loading (skeleton) → error (red inline alert) → value. StatTile has no loading or error state at all — it renders whatever it is given, and a string value is the escape hatch for dashes and ranges.

**Interactions & states.** StatCard's optional ⓘ opens a Tooltip on hover/focus. `glass` StatCards lift on hover. StatTile is inert apart from its scroll-triggered count-up.

**Responsive.** Neither has breakpoints — they are grid cells and inherit the parent grid. StatCard's sparkline is a fixed 72×28px and does not scale down.

**Built-in copy.** • StatCard doc examples: label "Equity" value "₹4,32,180"; "Win rate" tooltip "Wins ÷ total closed trades over the selected period"; error "Couldn't fetch live P&L".
• StatTile doc examples: "Win rate" 62%, "Stop loss" 4%.

<details><summary>Stitch prompt for this primitive</summary>

```text
Design two KPI metric cells for a dark-first Indian trading dashboard. The large stat card: 8px corner radius, fill #151517, 1px #29292D border, 16px padding, 8px vertical rhythm. Top line is an 11px monospaced uppercase label with 0.1em letter-spacing in #96969E, optionally followed by a 12px info glyph at 6px gap. Below it a baseline-aligned row: on the left a 24px/32px monospaced tabular value in #F7F7F8 with a signed 11px change badge 4px beneath it (green #10B981 with an up arrow, red-pink #F5808C with a down arrow); on the right a fixed 72×28px filled area sparkline tinted to match the direction. Show three states: normal, loading (a 6px-radius shimmer bar at 60% width and 28px height in place of the value), and error (a 14px alert glyph plus a truncated 14px #F5808C message replacing the value). The compact stat tile: 8px radius, fill #151517, 1px #29292D border, only 8px padding; a 9px monospaced uppercase label in #96969E, a 12px weight-600 monospaced value 2px beneath tinted green, red-pink or #F7F7F8 by tone, and an optional 10px #96969E hint line. Numeric tile values count up from zero over 0.6 seconds when scrolled into view. Populate with real figures: cards for "EQUITY" ₹4,32,180 +1.42% with a rising sparkline, "DAY P&L" ₹42,318 +2.41%, "WIN RATE" 62.4%, and "MAX DRAWDOWN" −8.7% with a falling sparkline; a row of six compact tiles reading WIN RATE 62%, TRADES 148, AVG HOLD 4.2d, SHARPE 1.31, STOP LOSS 4%, TARGET 9%. Provide a light theme: card #FFFFFF, border #DDE5ED, ink #1D1D1D, up #0A6B50, down #B81C22.
```
</details>

---

## UsageMeter / WinRateGauge / Progress

**Import** `@/components/foundation/UsageMeter · @/components/foundation/WinRateGauge · @/components/ui/progress` · **File** `components/foundation/WinRateGauge.tsx` · **142 LOC**

The three quantity indicators. UsageMeter is the 'X / Y' tier-cap badge with an Upgrade escape hatch, WinRateGauge is a 28–40px semicircle win-rate ring with honest-empty behaviour, and Progress is the plain shadcn bar.

| Variant / slot | Spec |
|---|---|
| **UsageMeter shell** | `inline-flex items-center gap-1.5 rounded-sm border font-mono text-[11px] tabular-nums` with `px-2 py-0.5` compact (default) or `px-2.5 py-1` → 8px radius, 6px gaps, 11px Geist Mono. role="status", aria-label "{used} of {cap} {label} used". |
| **UsageMeter tone thresholds** | pct = used/cap. <0.8 muted: `bg-wrap-hover border-line text-d-text-muted` · ≥0.8 warning: `bg-warning/10 border-warning/30 text-warning` (#F0A94F) · ≥1 down: `bg-down/10 border-down/30 text-down` (#F5808C). |
| **UsageMeter content** | `{used} / {cap}` in the tone colour at weight 400, then the label in `text-d-text-muted`. |
| **UsageMeter upgrade link** | Shown automatically at pct ≥ 0.8 (or forced via showUpgrade): `<Link href="/pricing" class="ml-1 inline-flex items-center gap-0.5 text-d-text-primary hover:underline">Upgrade<ArrowRight class="h-3 w-3" /></Link>` → 4px left margin, 12px arrow. |
| **WinRateGauge geometry** | Default size 40px. stroke = max(3, round(size × 0.12)) = 5px at 40. r = (size − stroke)/2 = 17.5. cx = 20, cy = 20, svg height = r + stroke = 22.5px. A 180° arc where score 0 is hard left and 100 is hard right. |
| **WinRateGauge track** | Full 0→100 arc, `stroke="var(--color-wrap-hover)"` = #1E1E21 (light #F4F7F9), strokeLinecap round, no fill. |
| **WinRateGauge value arc** | 0→score arc stroked with `var(--color-up)` #10B981, `var(--color-down)` #F5808C or `var(--color-muted)` #96969E by tone. Thresholds from lib/winrate.ts: ≥0.55 up, ≥0.45 neutral, below that down. |
| **WinRateGauge label** | `mt-0.5 text-[10px] font-semibold` + MONO + tone class → 10px mono, e.g. "62%". Suppressible via showLabel. |
| **WinRateGauge honest-empty** | A null/NaN win rate renders ONLY the track in `var(--color-line)` #29292D plus a muted em-dash "—" — never a misleading 0% ring. aria-label "Win rate: no data". |
| **WinRateGauge motion** | The value arc sweeps 0 → target over 0.7s on ease [0.2,0.8,0.2,1] the first time it enters the viewport; SSR and reduced motion show the final arc immediately. |
| **Progress** | `relative h-4 w-full overflow-hidden rounded-full bg-secondary` (16px tall, #1E1E21) with an indicator `h-full w-full flex-1 bg-primary transition-all` translated by `-{100 − value}%` → a solid #406AE4 fill. |

**Exports** — `UsageMeter, UsageMeterProps — components/foundation/UsageMeter.tsx` · `WinRateGauge — components/foundation/WinRateGauge.tsx (framer-motion animate + useInView)` · `winRateTone/winRateToneVar/winRateToneClass/formatWinRate, WIN_RATE_GOOD 0.55, WIN_RATE_WEAK 0.45 — lib/winrate.ts` · `Progress — components/ui/progress.tsx (@radix-ui/react-progress)` · `ArrowRight — lib/icons.ts` · `next/link`

**States & data.** UsageMeter clamps used and cap at ≥0 and treats cap 0 as 100% used. WinRateGauge's only real state is the null/no-data dash. Progress has no indeterminate mode wired — a missing value renders as 0.

**Interactions & states.** UsageMeter's Upgrade link navigates to /pricing and underlines on hover; the badge itself is inert. WinRateGauge and Progress are non-interactive.

**Responsive.** All three are intrinsically sized; UsageMeter is inline and wraps with its text, WinRateGauge takes a fixed px size (docs say keep to 28–40px), Progress fills its container width.

**Built-in copy.** • UsageMeter link text: "Upgrade" with a trailing arrow; default href /pricing
• UsageMeter aria: "3 of 5 symbols used"
• WinRateGauge empty label: "—", aria "Win rate: no data"

<details><summary>Stitch prompt for this primitive</summary>

```text
Design three quantity indicators for a dark-first Indian trading platform with tiered plans. First, a usage badge: an inline pill at 8px radius with a 1px border, 8px horizontal and 2px vertical padding, and 11px monospaced tabular text. It reads a fraction, then a label, then an optional "Upgrade →" link in #F7F7F8 that underlines on hover. Three tones by fill level: under 80% it is a quiet #1E1E21 fill with a #29292D border and #96969E figures; at 80% or more it becomes an amber #F0A94F tint at 10% with a 30% border and amber figures; at or over 100% it becomes a #F5808C tint at 10% with a 30% border and red-pink figures. Render "3 / 5 symbols", "8 / 10 signals today · Upgrade →", "25 / 25 Copilot credits · Upgrade →". Second, a compact win-rate gauge about 40px wide: a 180-degree semicircle arc, 5px stroke with rounded caps, drawn on a #1E1E21 track, with the value arc sweeping from the left in #10B981 when the rate is 55% or higher, #96969E between 45% and 55%, and #F5808C below 45%. Beneath it a 10px monospaced weight-600 percentage. The arc sweeps up from zero over 0.7 seconds when scrolled into view. Also show the no-data case: track only in #29292D with a muted em-dash — never a 0% ring. Render gauges at 71%, 52%, 38% and no-data. Third, a plain progress bar: 16px tall, fully rounded, #1E1E21 track with a solid #406AE4 fill, shown at 35% and 82% with the caption "Backtest 82% complete — 4,120 of 5,000 bars". Provide light equivalents: track #F4F7F9, borders #DDE5ED, up #0A6B50, down #B81C22, warning #9A4D00.
```
</details>

---

## Sparkline / Spark / Chart

**Import** `@/components/foundation/Sparkline · @/components/foundation/Spark · @/components/ui/chart` · **File** `components/ui/chart.tsx` · **369 LOC**

The data-viz layer: two dependency-free inline SVG sparklines (Sparkline for token-classed trend hints, Spark for a gradient-area version driven by a CSS variable) and the shadcn Recharts wrapper that supplies a themed container, tooltip and legend for full charts.

| Variant / slot | Spec |
|---|---|
| **Sparkline defaults** | width 80px, height 24px, strokeWidth 1.5, `shrink-0`, role="img", aria-label `Trend {up\|down}`. Points are mapped across the full width with a half-stroke inset top and bottom to avoid clipping. |
| **Sparkline tone** | tone 'auto' compares last vs first value → up when last ≥ first. Strokes: `stroke-up` #10B981 · `stroke-down` #F5808C · `stroke-d-text-muted` #96969E. strokeLinecap and strokeLinejoin round. |
| **Sparkline filled** | Adds an area path closed to the bottom edge, filled `fill-up/10` · `fill-down/10` · `fill-wrap-hover` — a 10% tint under the curve. |
| **Sparkline empty** | Fewer than 2 points renders a single dashed horizontal placeholder at y = height/2: `stroke-line` #29292D, strokeWidth 1, strokeDasharray "3 3", aria-label "No trend data". |
| **Spark** | Defaults 120×36px. Draws a vertical linearGradient from the passed `color` (default `var(--color-primary)` #406AE4) at 25% opacity down to 0, fills the closed area with it, then strokes the line at strokeWidth 1.6 with round caps. Baseline is inset 2px from the bottom. |
| **ChartContainer** | `flex aspect-video justify-center text-xs` → a fixed 16:9 box at 12px base type, wrapping a Recharts ResponsiveContainer. Emits `data-chart="chart-{id}"`. |
| **ChartStyle injection** | For each config key with a colour, injects `--color-{key}` scoped to `[data-chart=…]` for the light selector (no prefix) and `.dark`, so series colours re-theme without prop drilling. |
| **Recharts element overrides** | Axis tick text → `fill-muted-foreground` #96969E · cartesian grid lines that ship as #ccc → `stroke-border/50` (#29292D at 50%) · tooltip cursor line → `stroke-border`, rectangle cursor → `fill-muted` · radial background sectors → `fill-muted` · all `.recharts-surface`/`-layer`/`-sector` outlines removed. |
| **ChartTooltipContent** | `grid min-w-[8rem] items-start gap-1.5 rounded-sm border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl` → 128px min width, 8px radius, 50%-opacity border, filled with the PAGE canvas #0D0D0E, 10px/6px padding, 12px type. |
| **Tooltip row** | Series name in `text-muted-foreground`, value in `font-mono font-medium tabular-nums text-foreground` via toLocaleString. Indicator swatch: dot `h-2.5 w-2.5` (10px), line `w-1` (4px), or dashed `w-0 border-[1.5px] border-dashed` — all at `rounded-[2px]` (the data-viz 'mark' radius) coloured by the series. |
| **ChartLegendContent** | `flex items-center justify-center gap-4` with `pt-3` (bottom align) or `pb-3` (top align); swatches are `h-2 w-2 rounded-[2px]` (8px) coloured inline, icons 12px. |

**Exports** — `Sparkline — components/foundation/Sparkline.tsx (hand-rolled SVG)` · `Spark — components/foundation/Spark.tsx (gradient area SVG)` · `ChartContainer/ChartStyle/ChartTooltip/ChartTooltipContent/ChartLegend/ChartLegendContent, ChartConfig — components/ui/chart.tsx (recharts 2.15)` · `useChart context — components/ui/chart.tsx`

**States & data.** Sparkline handles its own empty state (dashed placeholder). Spark has none and will divide by zero geometry on a single-point array. ChartContainer throws "useChart must be used within a <ChartContainer />" if the tooltip or legend is rendered outside it. No loading or error states — callers wrap charts in Skeleton.

**Interactions & states.** Sparkline and Spark are inert images. Recharts supplies the hover cursor, tooltip follow and legend toggling; the wrapper only restyles them.

**Responsive.** Sparkline and Spark take explicit px dimensions and do not scale. ChartContainer is `aspect-video` with a ResponsiveContainer inside, so full charts scale with their column while holding 16:9.

**Built-in copy.** • Sparkline aria: "Trend up" / "Trend down" / "No trend data"

<details><summary>Stitch prompt for this primitive</summary>

```text
Design the data-visualisation layer for a dark-first Indian stock dashboard. First, an inline sparkline at 80×24px: a 1.5px rounded-cap polyline across the full width, coloured #10B981 when the last value is at or above the first and #F5808C when it is below, with an optional 10%-opacity area fill of the same colour under the curve. Show a no-data variant: a single dashed 1px #29292D horizontal rule through the middle. Also show a larger 120×36px gradient sparkline whose area fades from #406AE4 at 25% opacity down to transparent under a 1.6px line. Second, a full chart panel inside a #151517 card at 12px radius with a 1px #29292D border and 20px padding: a 16:9 area chart of NIFTY 50 across one month, axis tick labels at 12px in #96969E, horizontal grid lines in #29292D at 50% opacity, and no axis outlines. Its hover tooltip is a floating box at 8px radius filled #0D0D0E with a 1px #29292D border at 50% opacity, 10px/6px padding, minimum 128px wide, 12px type: a bold date line "18 Aug 2026, 15:29 IST", then rows pairing a 10px square swatch at 2px radius and a #96969E series name against a right-aligned monospaced tabular value — "NIFTY 50  24,318.55", "BANKNIFTY  52,104.20". Below the chart a centred legend with 16px gaps, 8px square swatches at 2px radius and 12px labels. Series colours come from one accent family: #8FB0FF and #5290F4 on dark. Provide a light theme: card #FFFFFF, page #EDF1F4, grid #1D1D1D at 6%, tooltip #FFFFFF, series #406AE4, up #0A6B50, down #B81C22.
```
</details>

---

## Skeleton / Spinner / PageLoader

**Import** `@/components/foundation/Skeleton · @/components/foundation/Spinner` · **File** `components/foundation/Spinner.tsx` · **68 LOC**

The two loading primitives. Skeleton is the shape-aware shimmer placeholder used in table rows, stat cards and route-level loading.tsx files; Spinner/PageLoader is the one spinner, with PageLoader guaranteeing vertical centring so loaders never collapse to the top of a page.

| Variant / slot | Spec |
|---|---|
| **Skeleton base** | `animate-pulse bg-line/80` → the standard Tailwind pulse on #29292D at 80% opacity (light #DDE5ED at 80%) — deliberately bumped from a fainter tone so it still reads as loading on white cards. |
| **Skeleton radius map** | rounded='sm' → `rounded-sm` 8px · 'md' (DEFAULT) → `rounded-xs` 6px · 'lg' → `rounded-sm` 8px · 'full' → `rounded-full`. Note md and lg both collapse onto 6/8px. |
| **Skeleton sizing rule** | Inline width/height are applied ONLY when the `w`/`h` props are passed. A regex `/(^\|\s)(h-\|min-h-\|aspect-\|flex-1)/` on className detects class-based sizing; when neither is present it falls back to `h-4` (16px). This exists because an unconditional inline height silently overrode every `h-*` class and made loading states look empty. |
| **Spinner glyph** | `<Loader2 className="animate-spin text-primary">` → continuous rotation in #8FB0FF (light #3459C9), aria-hidden. |
| **Spinner sizes** | sm `h-4 w-4` 16px · md (default) `h-6 w-6` 24px · lg `h-8 w-8` 32px. |
| **PageLoader band** | `flex w-full flex-col items-center justify-center gap-3` with an inline `minHeight` defaulting to `60vh` (pass '100%' inside a fixed-height card) → 12px gaps, guaranteed vertical centring. |
| **PageLoader content** | A lg Spinner (32px), an optional `<p class="text-sm text-d-text-secondary">` label at 14px #D3D3D7, and a permanent `<span class="sr-only">Loading</span>`. |
| **PageLoader a11y** | role="status" aria-live="polite" on the band. |
| **Button-local spinner** | Button ships its own inline ring rather than using Spinner: `inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent opacity-70` at 13/14/16px — it inherits the button's ink instead of the accent. |

**Exports** — `Skeleton — components/foundation/Skeleton.tsx (server component)` · `Spinner, PageLoader — components/foundation/Spinner.tsx` · `Loader2 — lib/icons.ts`

**States & data.** These are the loading state. Skeleton is consumed by DataTable (5 rows by default, 60%/40% widths, 14/16px heights), StatCard (60% × 28px), and route loading.tsx shells.

**Interactions & states.** None — both are inert. PageLoader announces politely to screen readers.

**Responsive.** Skeleton follows whatever width class or prop it is given. PageLoader's 60vh band means a route-level loader always centres in the viewport regardless of breakpoint.

**Built-in copy.** • PageLoader sr-only text: "Loading"
• Doc example label: "Loading your portfolio…"

<details><summary>Stitch prompt for this primitive</summary>

```text
Design the loading states for a dark-first Indian trading dashboard. First, skeleton placeholders: solid bars in #29292D at 80% opacity that pulse gently in and out, available at 6px radius (the default), 8px radius, and fully rounded for avatars. Show them composing three real loading shells. Shell one, a stat-card grid: four cards at 8px radius filled #151517 with 1px #29292D borders and 16px padding, each holding a small 11px label placeholder and a 60%-wide 28px-tall value bar. Shell two, a table: a header row then five body rows where the first cell is a 60%-wide bar and the remaining cells are 40%-wide bars, all 16px tall, on 1px #29292D row rules. Shell three, a mobile card list at 375px: cards at 8px radius with 12px padding, each holding a 50%-wide 16px bar then two thinner 12px bars at 80% and 60% width. Second, spinners: a circular loader in #8FB0FF rotating continuously, at 16px, 24px and 32px. Third, a full-page loader: a band at least 60% of the viewport height that vertically and horizontally centres a 32px spinner with a 14px #D3D3D7 caption 12px beneath it reading "Loading your portfolio…". Also show a button in its loading state — a solid #406AE4 button whose leading glyph is a 14px two-pixel ring spinner in white with one quadrant transparent, label "Running backtest…", at 70% opacity, keeping the exact width of its idle label so the toolbar never reflows. Provide a light theme: skeletons #DDE5ED at 80%, cards #FFFFFF, page #EDF1F4, spinner #3459C9, caption #4D585F.
```
</details>

---

## EmptyState / ErrorState / Alert / Toast

**Import** `@/components/foundation/EmptyState · ErrorState · @/components/ui/alert · @/components/foundation/Toast` · **File** `components/foundation/EmptyState.tsx` · **129 LOC**

The absence-and-notice family. EmptyState treats an empty view as a fork in the road (name the thing, name the reason, give one obvious next move) and is deliberately a recessed well rather than another card; ErrorState is a thin opinionated wrapper over it; Alert is the raw shadcn inline banner; toast is a bare re-export of Sonner so no call site imports the lib directly.

| Variant / slot | Spec |
|---|---|
| **EmptyState shell** | `flex flex-col items-center justify-center rounded-md bg-surface-2 text-center` → 12px radius, #1E1E21 fill (light #F4F7F9), NO border and NO shadow: an empty state reads as a hole in the page, not a competing card. role="status" aria-live="polite". |
| **EmptyState sizes** | sm `gap-2.5 p-6` → 10px gaps, 24px padding (inline empty cells inside a card). md `gap-3 p-10` → 12px gaps, 40px padding (a full section). |
| **EmptyState icon chip** | `grid place-items-center rounded-full border border-line bg-wrap` at `h-9 w-9` (36px, sm) or `h-11 w-11` (44px, md) — a circular #151517 chip with a #29292D hairline, tinted by tone. |
| **EmptyState tones** | info → `text-d-text-muted` #96969E · success → `text-up` #10B981 · warning → `text-warning` #F0A94F · error → `text-down` #F5808C. Tone colours ONLY the icon. |
| **EmptyState title** | Renders as h3 by default (h2/h4 selectable), `font-semibold tracking-[-0.01em] text-d-text-primary`; sm `text-sm leading-5` (14/20), md `text-[16px] leading-[22px]`. |
| **EmptyState description** | `mt-1.5 text-d-text-secondary`; sm `text-xs leading-[18px]` (12/18), md `text-sm leading-[21px]` (14/21). The text block is capped at `max-w-[42ch]`. |
| **EmptyState actions** | `mt-1 flex flex-wrap items-center justify-center gap-2` → primary `action` first, optional quieter `secondaryAction` beside it, 8px gap. |
| **ErrorState** | EmptyState with tone="error", icon `<AlertCircle className="h-7 w-7">` (28px), and the retry rendered as `<Button variant="secondary">`. |
| **Alert shell** | `relative w-full rounded-sm border p-4` (8px radius, 16px padding) with icon positioning baked in: `[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4`, `[&>svg~*]:pl-7` (28px text inset) and `[&>svg+div]:translate-y-[-3px]`. |
| **Alert variants** | default `bg-background text-foreground` (page canvas fill) · destructive `border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive` → #F5808C border and ink (light #B81C22). |
| **Alert title / description** | AlertTitle is an `<h5 class="mb-1 font-medium leading-none tracking-tight">`; AlertDescription is `text-sm [&_p]:leading-relaxed`. |
| **Toast** | `export const toast = sonnerToast` — a pure re-export. The Toaster is mounted once in app/providers.tsx: `theme="system" position="top-right"` with style background var(--color-wrap) #151517, border 1px solid var(--color-line) #29292D, borderRadius 8px, colour var(--color-light) #F7F7F8. |

**Exports** — `EmptyState — components/foundation/EmptyState.tsx` · `ErrorState — components/foundation/ErrorState.tsx` · `Alert, AlertTitle, AlertDescription — components/ui/alert.tsx (cva)` · `toast (sonner re-export), ExternalToast — components/foundation/Toast.tsx` · `Button — components/foundation/Button.tsx` · `AlertCircle — lib/icons.ts`

**States & data.** EmptyState IS the empty state; ErrorState IS the error state. Toast supports success/error/info/loading/promise and id reuse (a loading toast can be resolved in place). No component here fetches anything.

**Interactions & states.** The action and secondaryAction slots are real Buttons. ErrorState's retry calls back into the caller's mutate/reload. Sonner toasts auto-dismiss and stack at top-right; promise toasts swap their own label.

**Responsive.** EmptyState centres and caps its copy at 42ch, so it stays readable at any width; the two sizes are the density knob rather than a breakpoint. Alert and toasts are full-width and top-right respectively at all sizes.

**Built-in copy.** • ErrorState defaults: title "Something went wrong", description "We couldn't load this right now. Please try again.", button "Retry"
• DataTable defaults: "No rows" / "Nothing to show here yet." and "Couldn't load"
• EmptyState copy rule from the source: never "No data found" — the documented good example is title "No signals today", description "The scan runs at 09:15 IST and only publishes setups that clear the backtest gate. Some sessions produce none.", action "Browse yesterday's book"
• Another documented example: "Build your first strategy" / "Describe what you want in plain English — Copilot writes the rules, backtests them, and shows you the equity curve before anything trades." / "Describe a strategy"
• Toast doc examples: "Signal saved", "Broker disconnected" + "Re-link Zerodha", "Deploying…" → "Strategy is live", "Placing order…" → "Order filled" / "Order rejected"

<details><summary>Stitch prompt for this primitive</summary>

```text
Design the absence-and-notice states for a dark-first Indian trading platform. Empty state: a RECESSED well, not a card — 12px corner radius, fill #1E1E21, no border and no shadow, contents centre-aligned. Two sizes: compact with 24px padding and 10px gaps, full with 40px padding and 12px gaps. Top to bottom: a circular icon chip (36px compact / 44px full) filled #151517 with a 1px #29292D ring holding a ~20px glyph tinted #96969E for info, #10B981 for success, #F0A94F for warning or #F5808C for error; then a title at 16px/22px weight 600 letter-spacing -0.01em in #F7F7F8; then a description at 14px/21px in #D3D3D7 capped at roughly 42 characters per line; then a row of buttons with 8px gaps — one solid #406AE4 primary and one quieter secondary. Write copy that names the thing, the reason and the next move: title "No signals today", description "The scan runs at 09:15 IST and only publishes setups that clear the backtest gate. Some sessions produce none.", primary "Browse yesterday's book", secondary "Adjust filters". Show an error variant: red-pink 28px alert glyph, title "Something went wrong", description "We couldn't load this right now. Please try again.", secondary button "Retry". Also design an inline alert banner: full width, 8px radius, 1px border, 16px padding, a 16px glyph pinned at 16px from the top and left with the text inset 28px, a weight-500 tight-tracking title and a 14px relaxed description; show a neutral variant and a destructive one bordered and inked #F5808C. Finally a toast stack in the top-right corner: cards at 8px radius filled #151517 with a 1px #29292D border and #F7F7F8 text, reading "Order filled — 250 RELIANCE @ ₹2,847.30", "Broker disconnected — Re-link Zerodha", and "Deploying…". Provide a light theme: well #F4F7F9, chip #FFFFFF, page #EDF1F4, ink #1D1D1D, error #B81C22.
```
</details>

---

## PageHeader / EyebrowMono / DisclaimerFooter

**Import** `@/components/foundation/PageHeader · EyebrowMono · DisclaimerFooter` · **File** `components/foundation/PageHeader.tsx` · **69 LOC**

The page-frame trio: the 'every page starts the same way' header, the standalone section eyebrow, and the SEBI disclaimer line that must sit at the bottom of every trading surface.

| Variant / slot | Spec |
|---|---|
| **PageHeader shell** | `<header class="flex flex-col gap-4 border-b border-line px-4 py-5 md:flex-row md:items-end md:justify-between md:px-6">` → 16px gaps, 1px #29292D bottom rule, 16px side / 20px vertical padding rising to 24px side at ≥768px. |
| **PageHeader eyebrow** | `mb-1.5 font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-d-text-muted` → 11px Geist Mono caps at 0.1em tracking in #96969E, 6px above the title. |
| **PageHeader title** | `<h1 class="truncate text-display-sm font-normal text-d-text-primary">` → text-display-sm = 40px / line-height 1.1 / letter-spacing -0.02em, at weight 400, in #F7F7F8. Truncates on overflow. |
| **PageHeader description** | `mt-1 text-sm text-d-text-secondary` → 14px/20px #D3D3D7, 4px under the title. Accepts a ReactNode so counts and timestamps can be styled inline. |
| **PageHeader actions** | `flex flex-wrap items-center gap-2` → 8px gaps, bottom-aligned with the title block at ≥768px (`md:items-end`), stacked below it under that. |
| **EyebrowMono** | `<p class="font-sans font-semibold uppercase tracking-[0.12em] text-xs text-d-text-muted">` → 12px, weight 600, 0.12em tracking, #96969E. AS-BUILT: despite the name it is font-SANS (Geist), not mono — the name was kept so ~call sites did not break. |
| **DisclaimerFooter standard** | `<p class="pb-2 pt-1 text-center text-[10px] text-d-text-muted">` → 10px centred #96969E, 4px above / 8px below. |
| **DisclaimerFooter derivatives** | Same shell, stronger F&O wording — used on /fno and the folded F&O Lab. |
| **DisclaimerFooter compact** | `<p class="pt-2 text-center text-[10px] leading-relaxed text-d-text-muted">` → the point-of-action caption that sits directly under a backtest RESULT card. |

**Exports** — `PageHeader — components/foundation/PageHeader.tsx` · `EyebrowMono — components/foundation/EyebrowMono.tsx` · `DisclaimerFooter — components/foundation/DisclaimerFooter.tsx`

**States & data.** No data, no loading, no error. The description slot is where pages put their freshness line ("Generated at 09:15 IST · 12 candidates").

**Interactions & states.** None of its own — the actions slot holds real Buttons which own their interactions.

**Responsive.** PageHeader is the only one with breakpoints: below 768px it is a vertical stack with 16px gaps and 16px side padding; at 768px and above it becomes a row with the title block left, actions right, both bottom-aligned, and side padding grows to 24px.

**Built-in copy.** • DisclaimerFooter standard: "For educational purposes. Not investment advice. Markets carry risk."
• DisclaimerFooter derivatives: "For educational purposes only. Derivatives carry a high risk of loss and are not suitable for every investor. Not investment advice. Markets carry risk."
• DisclaimerFooter compact: "Backtested on past data. Hypothetical results — not a guarantee of future returns. Not investment advice."
• PageHeader doc example: eyebrow "Today", title "Active swing signals", description "Generated at 09:15 IST · 12 candidates"

<details><summary>Stitch prompt for this primitive</summary>

```text
Design a page header and compliance footer for a dark-first Indian trading platform. Header: a full-width block with a 1px #29292D bottom rule, 16px side padding and 20px vertical padding on mobile, growing to 24px side padding on desktop. On desktop it is a single row with the title block on the left and an action group on the right, both aligned to their bottom edges; below 768px it becomes a vertical stack with 16px gaps and the actions wrapping underneath. Title block top to bottom: an 11px monospaced uppercase eyebrow with 0.1em letter-spacing in #96969E; a 40px page title at line-height 1.1, letter-spacing -0.02em, weight 400, in #F7F7F8, truncating with an ellipsis when long; and a 14px description in #D3D3D7 4px beneath. Action group: buttons with 8px gaps — one 32px ghost icon button and one solid #406AE4 button. Populate with real content: eyebrow "TODAY", title "Active swing signals", description "Generated at 09:15 IST · 12 candidates · NSE cash", actions a refresh icon button plus "New strategy". Also render a standalone section eyebrow used inside page bodies: 12px, weight 600, uppercase, 0.12em letter-spacing, in #96969E, sans-serif — sample text "MARKET BREADTH". Finally, the compliance footer that sits at the bottom of every trading surface: a centred 10px line in #96969E with 4px above and 8px below, reading "For educational purposes. Not investment advice. Markets carry risk." Show its two other forms: the derivatives variant reading "For educational purposes only. Derivatives carry a high risk of loss and are not suitable for every investor. Not investment advice. Markets carry risk." and a compact caption directly under a result card reading "Backtested on past data. Hypothetical results — not a guarantee of future returns. Not investment advice." Provide a light theme: page #EDF1F4, rule #DDE5ED, title #1D1D1D, muted #5F6B75.
```
</details>

---

## Motion & decorative primitives

**Import** `@/components/foundation/Reveal · @/components/ui/blur-fade · number-ticker · typing-animation · dot-pattern · terminal` · **File** `components/ui/typing-animation.tsx` · **232 LOC**

The entrance, count-up and decorative set. Reveal and BlurFade are the two entrance wrappers; NumberTicker animates figures in Indian numbering; TypingAnimation, Terminal and DotPattern are the marketing/AI-surface decorations. All framer-motion, all governed by the app's global <MotionConfig reducedMotion="user">.

| Variant / slot | Spec |
|---|---|
| **Reveal** | `motion.div` from `{opacity: 0, y: 10}` to `{opacity: 1, y: 0}` over 0.45s on ease [0.16,1,0.3,1], with a `delay` prop for staggering. No in-view gate — it fires on mount. |
| **BlurFade** | Variants hidden `{opacity 0, filter blur(6px), y ±6px}` → visible `{opacity 1, blur(0px), y 0}` over 0.4s easeOut with delay 0.04 + delay. `direction` picks the axis and sign (up/down/left/right); `inView` gates on useInView with margin '-50px', once. The filter is only transitioned when the hidden and visible filters actually differ. |
| **NumberTicker** | `<span class="inline-block tabular-nums text-d-text-primary">` driven by useSpring (damping 60, stiffness 100) on a motion value; starts at `startValue` (default 0) and animates to `value` once the span enters view, after `delay` seconds. Every frame writes `Intl.NumberFormat('en-IN', …).format(...)` directly to textContent — so lakh/crore grouping is correct mid-animation. `direction="down"` reverses the endpoints. |
| **TypingAnimation (ui)** | `leading-relaxed tracking-[-0.01em]`, `inline-block` when rendered as a span. Types at `typeSpeed` (default 100ms/char), deletes at half that, pauses `pauseDelay` 1000ms between words, cycles a `words[]` array, optionally `loop`. Grapheme-safe (Array.from) so emoji and combining marks are not split. Polymorphic `as` across article/div/h1–h6/li/p/section/span. |
| **Typing cursor** | `inline-block` span with `animate-blink-cursor` = `blink-cursor 1.05s steps(1) infinite`; character is `\|` (line, default), `▌` (block) or `_` (underscore). Hidden once a non-looping animation completes. Under prefers-reduced-motion globals.css sets `animation: none; opacity: 1`. |
| **Terminal shell** | `z-0 h-full max-h-[400px] w-full rounded-sm border border-line bg-wrap font-mono text-d-text-secondary` → 8px radius, 400px max height, #151517 fill, Geist Mono in #D3D3D7. |
| **Terminal chrome bar** | `flex flex-col gap-y-2 border-b border-line p-4` containing a `flex flex-row gap-x-2` of three `h-2 w-2 rounded-full bg-d-text-muted/40` dots → 8px circles at 40% #96969E, 8px apart, above a 1px rule. |
| **Terminal body** | `<pre class="p-4"><code class="grid gap-y-1 overflow-auto">` → 16px padding, 4px between lines. |
| **Terminal sequencing** | A SequenceContext hands each child an index; only the child whose index equals activeIndex animates, and it advances the index on completion — so lines type and fade in strictly one after another. AnimatedSpan enters from `{opacity 0, y: -5}` over 0.3s; the terminal's own TypingAnimation types at 60ms/char. |
| **DotPattern** | `pointer-events-none absolute inset-0 h-full w-full text-white/[0.06]` SVG that measures its container on mount and resize and lays out circles on a grid: width/height spacing 16px, cx/cy offset 1, radius 1. Dots inherit currentColor. |
| **DotPattern glow** | With `glow`, each circle fills from a radial gradient (currentColor 100% → 0% opacity) and animates opacity [0.4, 1, 0.4] and scale [1, 1.5, 1] on an infinite reversing easeInOut loop with a random 0–5s delay and 2–5s duration per dot. |

**Exports** — `Reveal — components/foundation/Reveal.tsx` · `BlurFade — components/ui/blur-fade.tsx` · `NumberTicker — components/ui/number-ticker.tsx (Magic UI, restyled to en-IN + text-d-text-primary)` · `TypingAnimation — components/ui/typing-animation.tsx` · `Terminal, AnimatedSpan, TypingAnimation — components/ui/terminal.tsx` · `DotPattern — components/ui/dot-pattern.tsx`

**States & data.** NumberTicker is the only one that takes a value; everything else is presentational. Reduced motion is honoured globally through <MotionConfig reducedMotion="user"> in app/providers.tsx (springs settle instantly) and via the CSS rule that stops the blink cursor.

**Interactions & states.** All are non-interactive. BlurFade, NumberTicker, TypingAnimation and Terminal all gate on useInView with `once: true`, so each plays exactly one time when scrolled into view.

**Responsive.** DotPattern re-measures its container on window resize and regenerates its grid. Terminal caps at 400px tall and scrolls its code region. The rest are layout-neutral wrappers.

**Built-in copy.** None built in — all strings are caller-supplied.

<details><summary>Stitch prompt for this primitive</summary>

```text
Design the motion and decorative layer for a dark-first Indian trading platform's AI surfaces. First, entrance treatments: show a card in three frames — hidden (fully transparent, 10px lower), mid, and settled — describing a 450ms fade-and-rise on a strong ease-out curve; and a second variant that additionally starts at 6px of blur and resolves to sharp over 400ms. Second, an animated figure: a large monospaced tabular number that counts up on a spring and formats in Indian lakh/crore grouping — show ₹4,32,180 mid-count at ₹2,18,904, with a caption "Portfolio value". Third, a typing headline: 24px text with tight letter-spacing and relaxed line height, mid-word, followed by a blinking vertical bar cursor that toggles on a 1.05-second step loop; show it cycling three phrases — "Find breakouts in NIFTY 50", "Backtest a BANKNIFTY straddle", "Explain why INFY fell today". Fourth, a terminal panel: 8px corner radius, fill #151517, 1px #29292D border, monospaced #D3D3D7 text, capped at 400px tall. Its top bar has 16px padding, a 1px #29292D bottom rule, and three 8px circles in #96969E at 40% opacity spaced 8px apart. Its body has 16px padding and 4px between lines, which appear strictly one at a time — each line drops in from 5px above as it types. Sample lines: "$ quantx backtest --strategy ema-cross --symbol BANKNIFTY", "→ Loading 5,000 bars (2019-01-01 → 2026-08-01)…", "→ 148 trades · win rate 62.4% · Sharpe 1.31", "✓ Equity curve written to ./out/banknifty.json". Fifth, a decorative dot field: a grid of 1px-radius dots spaced 16px apart in white at 6% opacity, filling a hero panel behind content, with an optional glowing variant where random dots pulse between 40% and 100% opacity and scale up 1.5× on staggered 2–5 second loops. Provide light-theme values: terminal #FFFFFF on #EDF1F4, border #DDE5ED, text #4D585F, dots #1D1D1D at 6%.
```
</details>

---

## Avatar / StockAvatar / BrandLogo

**Import** `@/components/ui/avatar · StockAvatar · BrandLogo` · **File** `components/ui/BrandLogo.tsx` · **99 LOC**

The three identity marks: the Radix user avatar, a deterministic coloured letter avatar for stock symbols, and the real brand-logo loader with a monogram fallback for brokers and NSE companies.

| Variant / slot | Spec |
|---|---|
| **Avatar root** | `relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full` → 40px circle that clips its image. |
| **AvatarImage** | `aspect-square h-full w-full` — square-cropped fill. |
| **AvatarFallback** | `flex h-full w-full items-center justify-center rounded-full bg-muted` → #1E1E21 (light #F4F7F9) circle behind whatever initials the caller passes. |
| **StockAvatar sizes** | sm `w-8 h-8 text-xs` (32px / 12px) · md `w-10 h-10 text-sm` (40px / 14px) · lg `w-12 h-12 text-base` (48px / 16px). Always `rounded-full flex items-center justify-center font-bold`. |
| **StockAvatar colour** | Deterministic: `symbol.charCodeAt(0) % 6` indexes ['bg-primary/20 text-primary', 'bg-up/20 text-up', 'bg-dot-blue/20 text-dot-blue', 'bg-dot-purple/20 text-dot-purple', 'bg-warning/20 text-warning', 'bg-dot-indigo/20 text-dot-indigo']. AS-BUILT BUG: `dot-blue`, `dot-purple` and `dot-indigo` are not defined in tailwind.config.ts, so 3 of the 6 slots produce no background and no text colour. |
| **StockAvatar glyph** | A single uppercase first letter of the symbol — 'R' for RELIANCE, 'T' for TCS. |
| **Monogram** | `inline-flex shrink-0 items-center justify-center border border-line bg-wrap-hover font-semibold text-d-text-secondary` with inline width/height = `size` and fontSize = `max(9, round(size × 0.4))` → 11px at the default 28px. Shape defaults to `rounded-xs` (6px). Initials are the first two alphanumerics, uppercased, falling back to '?'. |
| **BrandLogo** | `<img class="shrink-0 bg-white object-contain" loading="lazy">` with inline width/height = size (default 28px), shape default `rounded-xs` 6px. The white background is deliberate so transparent-PNG broker logos stay legible on the dark canvas. |
| **BrandLogo fallback** | Local `failed` state set by onError, or a missing src, swaps the img for the caller's `fallback` node or a Monogram of the alt text — so a broken logo URL never renders a broken-image glyph. |
| **SymbolLogo** | Uppercases the symbol, strips a trailing `.NS`, resolves a domain from the `SYMBOL_DOMAIN` map in lib/logo.ts and falls back to a ticker-logo URL; renders a BrandLogo at `rounded-full` with a round Monogram fallback. Requests the image at 2× the render size. |

**Exports** — `Avatar, AvatarImage, AvatarFallback — components/ui/avatar.tsx (@radix-ui/react-avatar)` · `StockAvatar (default export) — components/ui/StockAvatar.tsx` · `BrandLogo, Monogram, SymbolLogo — components/ui/BrandLogo.tsx` · `logoUrl, tickerLogoUrl, SYMBOL_DOMAIN — lib/logo.ts`

**States & data.** BrandLogo/SymbolLogo have a real loading path (lazy img) and a real failure path (onError → Monogram). Radix Avatar handles its own image-load state and renders the fallback until the image resolves. StockAvatar is pure computation with no image at all.

**Interactions & states.** All three are inert marks — any click behaviour belongs to the row or button wrapping them.

**Responsive.** All are fixed-px and `shrink-0`, so they never compress inside a flex row. Logos are requested at 2× the render size for retina.

**Built-in copy.** • Monogram fallback character when the text has no alphanumerics: "?"

<details><summary>Stitch prompt for this primitive</summary>

```text
Design the identity marks for an Indian stock-trading platform, dark theme first. First, a user avatar: a 40px circle that clips a square photo, with a fallback state showing centred initials on a #1E1E21 circle. Second, a symbol avatar: a filled circle showing the first letter of a ticker in bold, available at 32px with 12px type, 40px with 14px type and 48px with 16px type; the fill is a 20%-opacity tint and the letter is the solid version of the same colour, chosen deterministically from the ticker — show #406AE4/#8FB0FF for RELIANCE, #10B981 for TCS, and #F0A94F for HDFCBANK. Third, a company or broker logo: a 28px square at 6px corner radius showing the real logo on a white plate with contain-fit, plus its fallback — a monogram of the first two letters, weight 600, in #D3D3D7 on a #1E1E21 square with a 1px #29292D border, at roughly 40% of the box size (11px at 28px). Also show the round variant used for NSE symbols: the same logo and monogram at a fully round shape. Lay these out in a realistic watchlist inside a #151517 card at 12px radius: rows for RELIANCE ₹2,847.30 +1.24%, TCS ₹4,102.55 −0.38%, HDFCBANK ₹1,689.10 +0.62%, INFY ₹1,842.75 +2.08% — each row leading with a 28px round symbol logo, the ticker in 14px weight 500, the company name in 12px #96969E beneath, and the price plus change right-aligned in monospaced tabular figures. Beside it a broker connection card showing 28px square logos for Zerodha, Upstox and Angel One with 14px labels. Provide a light theme: card #FFFFFF, monogram plate #F4F7F9, border #DDE5ED, ink #1D1D1D.
```
</details>

---

## Command (⌘K palette primitives)

**Import** `@/components/ui/command` · **File** `components/ui/command.tsx` · **152 LOC**

The cmdk-backed command palette parts. `CommandDialog` was deliberately deleted from the registry copy because it pulled in shadcn's Dialog and would have given the app a second dialog implementation — the palette composes these parts inside foundation/Dialog instead. CommandInput is also stripped to a bare field because the registry version double-rendered a magnifier and a border against the product's own header chrome.

| Variant / slot | Spec |
|---|---|
| **Command root** | `flex h-full w-full flex-col overflow-hidden rounded-xs bg-popover text-popover-foreground` → 6px radius, #1E1E21 fill (light #FFFFFF). As composed it is overridden to `bg-transparent` so the Dialog's own surface shows through. |
| **CommandInput** | `flex h-12 w-full bg-transparent text-sm text-d-text-primary outline-none placeholder:text-d-text-muted disabled:cursor-not-allowed disabled:opacity-50` plus an explicit `focus:outline-none focus-visible:outline-none focus-visible:ring-0` — 48px tall, 14px ink, and the global 2px accent outline is deliberately cancelled because the field autofocuses the moment the palette opens and the caret already says where focus is. |
| **CommandList** | `max-h-[300px] overflow-y-auto overflow-x-hidden` by default; the shipped palette overrides to `max-h-[400px] px-1.5 py-1.5` (6px inset). |
| **CommandEmpty** | `py-6 text-center text-sm` → 24px vertical, centred 14px. The palette overrides to `px-3 py-10 text-center`. |
| **CommandGroup heading** | `[&_[cmdk-group-heading]]:px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-d-text-muted` → 10px weight-600 caps at 0.08em tracking in #96969E, 10px side padding, 8px above / 4px below. |
| **CommandItem** | `relative flex cursor-default select-none items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm outline-none transition-colors duration-instant ease-out text-d-text-secondary` → 8px radius, 10px/8px padding, 10px gap, 14px #D3D3D7, 90ms colour transition. |
| **CommandItem selected** | `data-[selected=true]:bg-surface-2 data-[selected=true]:text-d-text-primary` → a quiet #1E1E21 fill with #F7F7F8 ink — NOT the solid accent that DropdownMenu items use. |
| **CommandSeparator / Shortcut** | Separator `-mx-1 h-px bg-border` (1px #29292D pulled edge to edge). Shortcut `ml-auto text-xs tracking-widest text-muted-foreground`. |
| **Palette dialog shell (as composed)** | `<Dialog className="max-w-[600px] overflow-hidden p-0">` → 600px max width, zero padding so the palette owns its own insets. |
| **Palette header (as composed)** | `flex items-center gap-2.5 border-b border-line px-4` holding a 16px Search glyph in #96969E, the 48px input at `border-0 px-0 text-sm`, an optional 12px busy ring (`h-3 w-3 border-2 border-d-text-muted border-r-transparent animate-spin`), and an ESC chip `rounded-xs border border-line px-1.5 py-0.5 text-[10px]` in Geist Mono. |
| **Palette rows (as composed)** | Icons at 15px; primary label `min-w-0 flex-1 truncate text-[13px]`; symbol rows use the MONO class; route hints `shrink-0 truncate text-[11px] text-d-text-muted`; the AI row leads with a 15px Sparkles in `text-primary` and trails a `↵` kbd chip. |
| **Palette intent reordering** | Filtering is `shouldFilter={false}` — symbols arrive pre-ranked and routes are scored by prefix/word-start. A query that `looksLikeQuestion` promotes the Ask Quant X row to the TOP and pre-selects it; a lookup query pushes it to the bottom as a fallback. |

**Exports** — `Command/CommandInput/CommandList/CommandEmpty/CommandGroup/CommandItem/CommandSeparator/CommandShortcut — components/ui/command.tsx (cmdk)` · `CommandPalette (consumer) — components/shell/CommandPalette.tsx` · `Dialog — components/foundation/Dialog.tsx` · `Search, Sparkles, TrendingUp, ArrowRight, ShieldAlert + ~20 route icons — lib/icons.ts` · `MONO — lib/tokens.ts`

**States & data.** The palette fetches instrument search results through SWR (`api`), showing a 12px spinner in the header while in flight and a ShieldAlert row under the "Symbols" heading on failure. Groups render conditionally: "Ask Quant X" (question intent), "Ask about this page" (contextual prompts), "Recent", "Symbols", plus scored routes. Tier-gated routes carry a `tier: 'pro' | 'elite'` marker.

**Interactions & states.** Cmd/Ctrl+K opens it from anywhere. cmdk owns roving focus, aria-activedescendant and listbox/option semantics; ↑/↓ move, Enter activates, Esc closes. The selected row highlights with a quiet L2 fill rather than the accent.

**Responsive.** The dialog is `w-full max-w-[600px]`, so it is full-bleed on phones and 600px on desktop. The list caps at 400px and scrolls; rows truncate rather than wrap.

**Built-in copy.** • Input placeholder: "Ask anything, or jump to a stock or page…"
• Empty state: "Nothing matched “{query}”" then "Press ↵ to ask Quant X instead."
• AI row: "Ask Quant X: “{query}”" with a ↵ chip
• Group headings: "Ask Quant X", "Ask about this page", "Recent", "Symbols"
• Header chip: "ESC"
• Route hints: "Ask anything" (Copilot), "The daily read" (Markets), "Browse the universe" (Stocks), "All horizons" (Signals), "Describe a setup" (Screener), "Build & backtest" (AI Algos)

<details><summary>Stitch prompt for this primitive</summary>

```text
Design a ⌘K command palette for an Indian AI trading platform, dark theme first. It is a centred modal over a 60% black scrim: 600px maximum width, 8px corner radius, fill #151517, 1px #29292D border, no outer padding. Header row: 16px horizontal padding, a 1px #29292D bottom rule, a 16px magnifier glyph in #96969E, then a 48px-tall borderless search field at 14px in #F7F7F8 with placeholder "Ask anything, or jump to a stock or page…", then optionally a small 12px spinning ring, and finally a monospaced "ESC" chip at 6px radius with a 1px #29292D border, 6px/2px padding and 10px text. Body: a scrolling list capped at 400px with 6px insets. Group headings are 10px weight-600 uppercase with 0.08em letter-spacing in #96969E, 10px side padding, 8px above and 4px below. Rows are 8px radius with 10px horizontal and 8px vertical padding and a 10px gap: a 15px leading icon, a 13px truncating label in #D3D3D7, and an optional 11px #96969E hint pushed right. The selected row fills a quiet #1E1E21 with the label turning #F7F7F8 — never a solid accent. Show four groups in order: "Ask Quant X" with a #8FB0FF sparkle icon and the row "Ask Quant X: “why is reliance falling”" trailing a ↵ chip, pre-selected; "Recent" listing Markets — The daily read, Signals — All horizons, Screener — Describe a setup; "Symbols" listing monospaced RELIANCE, TCS, HDFCBANK, INFY with a trending glyph; and a routes group listing Copilot, Stocks, AI Algos — Build & backtest. Also show the empty state: "Nothing matched “xyzq”" in 14px weight 600 with "Press ↵ to ask Quant X instead." in 12px #D3D3D7 beneath. Provide a light theme: modal #FFFFFF, page scrim unchanged, borders #DDE5ED, ink #1D1D1D, selected row #F4F7F9.
```
</details>

---

## Accordion / Collapsible / ScrollArea / Separator / Resizable

**Import** `@/components/ui/accordion · collapsible · scroll-area · separator · resizable` · **File** `components/ui/resizable.tsx` · **71 LOC**

The structural primitives: disclosure, scroll chrome, rules, and the draggable pane splitter used in the strategy workspace where a trader rebalances the conversation / logic / chart split.

| Variant / slot | Spec |
|---|---|
| **AccordionItem** | `border-b` → a single 1px #29292D bottom rule per item, no card, no radius. |
| **AccordionTrigger** | `flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline` → 16px vertical padding, weight 500, underline on hover. Wrapped in an `<AccordionPrimitive.Header className="flex">`. |
| **Accordion chevron** | `<ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200">` with `[&[data-state=open]>svg]:rotate-180` → a 16px glyph flipping over 200ms. |
| **AccordionContent** | `overflow-hidden text-sm` animating `data-[state=open]:animate-accordion-down` (200ms ease-out) / `data-[state=closed]:animate-accordion-up` (160ms ease-in) against `--radix-accordion-content-height` — a real height transition, not a max-height guess. Inner div `pb-4 pt-0` (16px bottom). |
| **Collapsible** | A bare re-export of Radix Root/Trigger/Content with ZERO styling — callers style it entirely. |
| **ScrollArea root** | `relative overflow-hidden` with a Viewport at `h-full w-full rounded-[inherit]` so the scrolled content picks up the parent's corner radius. |
| **ScrollBar** | `flex touch-none select-none transition-colors`; vertical `h-full w-2.5 border-l border-l-transparent p-[1px]`, horizontal `h-2.5 flex-col border-t border-t-transparent p-[1px]` → a 10px gutter with a 1px inset. |
| **ScrollBar thumb** | `relative flex-1 rounded-full bg-border` → a fully round #29292D (light #DDE5ED) thumb. |
| **Separator** | `shrink-0 bg-border` with horizontal `h-[1px] w-full` or vertical `h-full w-[1px]` → a 1px #29292D rule; `decorative` defaults true so it is aria-hidden. |
| **ResizablePanelGroup** | `flex h-full w-full data-[orientation=vertical]:flex-col`. Retargeted to react-resizable-panels v4, where PanelGroup became `Group` (direction → orientation) and PanelResizeHandle became `Separator`. |
| **ResizableHandle** | `relative flex w-px items-center justify-center bg-line outline-none transition-colors duration-instant ease-out hover:bg-wrap-line focus-visible:ring-2 focus-visible:ring-ring/60` → a 1px #29292D hairline that becomes #3B3B40 on hover over 90ms. |
| **Handle hit area** | `after:absolute after:inset-y-0 after:left-1/2 after:w-[9px] after:-translate-x-1/2` → an invisible 9px-wide grab zone centred on the 1px line, so the divider stays visually quiet while remaining reachable. Vertical orientation swaps to `h-px w-full` with a 9px-tall after. |
| **Handle grip** | With `withHandle`: `z-10 flex h-5 w-3 items-center justify-center rounded-xs border border-line bg-surface-2` (20×12px, 6px radius, #1E1E21 fill) holding `<GripVertical className="h-3 w-3 text-d-text-muted">` — a 12px glyph. |

**Exports** — `Accordion/AccordionItem/AccordionTrigger/AccordionContent — components/ui/accordion.tsx (@radix-ui/react-accordion)` · `Collapsible/CollapsibleTrigger/CollapsibleContent — components/ui/collapsible.tsx` · `ScrollArea, ScrollBar — components/ui/scroll-area.tsx (@radix-ui/react-scroll-area)` · `Separator — components/ui/separator.tsx (@radix-ui/react-separator)` · `ResizablePanelGroup, ResizablePanel, ResizableHandle — components/ui/resizable.tsx (react-resizable-panels v4.12.2)` · `ChevronDown, GripVertical — lib/icons.ts`

**States & data.** No data. Accordion supports single or multiple open items via Radix. Resizable persists nothing by itself — panel sizes are the caller's to store.

**Interactions & states.** Accordion: click or Enter/Space on the trigger, arrow keys move between triggers, content height animates. ScrollArea shows its thumb on hover with a colour transition and disables touch-action on the bar. ResizableHandle: pointer drag to resize, keyboard-resizable through the library, focus ring at 2px #406AE4 60%, and the hairline lightens to #3B3B40 while hovered or dragged.

**Responsive.** ResizablePanelGroup flips to a column when orientation is vertical, and the handle flips its geometry and hit area accordingly. ScrollArea and Separator are orientation-driven, not breakpoint-driven.

**Built-in copy.** None built in.

<details><summary>Stitch prompt for this primitive</summary>

```text
Design the structural primitives for a dark-first Indian trading dashboard. First, an accordion: borderless items separated only by a 1px #29292D bottom rule, each trigger a full-width row with 16px vertical padding, a weight-500 label on the left that underlines on hover, and a 16px chevron on the right that rotates 180 degrees over 200ms when open; the panel expands with a true height animation over 200ms and its content sits at 14px with 16px of bottom padding. Populate with FAQ rows: "How are signals generated?", "What does the confidence score mean?", "Which brokers are supported?" with the second one open and showing two lines of #D3D3D7 body copy. Second, a custom scrollbar: a 10px-wide gutter with a 1px inset and a fully rounded #29292D thumb, shown on the right edge of a tall scrolling list. Third, rules: a 1px #29292D horizontal divider spanning a card, and a 1px vertical divider between two inline stat blocks. Fourth, a draggable pane splitter: two panels side by side separated by a 1px #29292D vertical hairline that lightens to #3B3B40 on hover over 90ms, with an invisible 9px-wide grab zone centred on it, and — on the primary split — a visible grip: a 20×12px pill at 6px radius filled #1E1E21 with a 1px #29292D border, holding a 12px vertical grip glyph in #96969E. Show it in context as a strategy workspace: a left panel with an AI conversation, a centre panel with strategy rules in monospace, and a right panel with a NIFTY 50 candlestick chart; then show the same splitter rotated for a horizontal split. Provide a light theme: rules and thumb #DDE5ED, grip plate #F4F7F9, hover edge #C8D4DE, ink #1D1D1D.
```
</details>

---
