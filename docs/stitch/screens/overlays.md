# Overlay surfaces (modals & sheets that behave like screens)

> Part of the Quant X as-built screen inventory — see [`../03-SCREEN-INVENTORY.md`](../03-SCREEN-INVENTORY.md)
> for the full index and [`../01-DESIGN-SYSTEM.md`](../01-DESIGN-SYSTEM.md) for every token used below.

**9 surfaces.**

## Family notes

SCOPE = full-screen overlay surfaces only. 9 entries: QuickTrade ticket + its confirm step, CalculatorModal ×3 modes (planner/position/risk — the prompt named two; `risk` is fully implemented and renders but has ZERO call sites, documented and flagged), AlertEditModal, TradeTicketButton flow, CopilotQuotaModal, BrokerLock.

TOKEN RESOLUTION (verified in app/globals.css + tailwind.config.ts, dark / light):
main #0D0D0E / #EDF1F4 · wrap #151517 / #FFFFFF · wrap-hover=surface-2 #1E1E21 / #F4F7F9 · line #29292D / #DDE5ED · wrap-line #3B3B40 / #C8D4DE · surface-3 #26262A / #FFFFFF · ink #F7F7F8 / #1D1D1D · desc #D3D3D7 / #4D585F · muted #96969E / #5F6B75 · up #10B981 / #0A6B50 · down #F5808C / #B81C22 · warning #F0A94F / #9A4D00. `--primary`/`--accent` FILL = #406AE4 both themes, hover #3055C2, ink #FFFFFF. CRITICAL: tailwind remaps `textColor.primary` and `textColor.accent` to `--rgb-primary-text` = #8FB0FF dark / #3459C9 light — so `text-primary` is NEVER #406AE4, but `bg-primary`/`border-primary` ARE. `background-surface`=wrap, `background-elevated`=wrap-hover, `d-border`=line, `border`=line.
Radius: xs 6 · sm 8 · md 12 · lg 16 · full 9999 · mark 2. Shadows: elev-1 `0 1px 2px rgba(0,0,0,.30), 0 4px 12px -6px rgba(0,0,0,.40)`; elev-3 `0 8px 24px -8px rgba(0,0,0,.50), 0 32px 64px -24px rgba(0,0,0,.64)` (light theme uses rgba(29,29,29,…) at .04/.06/.14).
Class recipes: `.glass-surface`/`.lg-surface`/`.glass-card` = OPAQUE #151517 + 1px #29292D + elev-1. `.glass-control` = #1E1E21 + 1px #29292D, hover mixes 6% #F7F7F8. `.glass-control-accent` = #406AE4 fill + same-color 1px border + #FFF ink + elev-1, hover #3055C2. `.panel-inset` = #1E1E21 fill, 12px radius, no border/shadow. `.glass-float` (blur 20px saturate 1.5, surface-3 @86%, elev-3) is used by NONE of these overlays. `.numeric`/`.num-display` = Geist Mono tabular, -0.01em/-0.02em.

AS-BUILT DEVIATIONS FROM THE STATED SYSTEM (report, do not silently fix):
1. Three different overlay engines coexist: QuickTrade = framer-motion; ConfirmDialog = Radix Dialog (animate-dialog-in 200ms cubic-bezier(.23,1,.32,1) — NOT the system .22,1,.36,1); CalculatorModal / AlertEditModal / CopilotQuotaModal = plain `if (!isOpen) return null`, zero animation.
2. Backdrops differ: QuickTrade + CalculatorModal `bg-black/60 backdrop-blur-sm` (4px); AlertEditModal + CopilotQuotaModal `bg-black/70` no blur; Radix overlay `bg-black/60` no blur.
3. Dismissal is inconsistent: AlertEditModal + CopilotQuotaModal close on backdrop click; QuickTrade closes on backdrop click; CalculatorModal has NO backdrop onClick and NO Escape handler — the X button is the only exit.
4. z-index: every overlay in scope is z-50; only the Radix ConfirmDialog overlay is z-40 with its content at z-50.
5. QuickTrade registers a full zod schema and destructures `formState.errors` but NEVER RENDERS any error — invalid submits fail silently. Same file: `isSearching` state has no spinner UI, and `calculateQuantity()` hard-codes capital = ₹1,00,000 (comment: "Mock: Get from user profile").
6. Type-floor violations: TradePlannerCard uses 9px and 11.5px; OptionChainPreview header 9px. Stated floor is 11px.
7. AlertEditModal card fill is `bg-main` (#0D0D0E, the L0 page canvas) instead of the L1 card #151517 — the only modal in scope that does this.
8. CopilotQuotaModal's usage bar is hard-coded `width: 100%` with `bg-down/70` regardless of actual credits_used/credits_limit.
9. CalculatorModal `risk` mode: `bg-accent/15` + `text-accent` resolve to the SAME #406AE4/#8FB0FF as primary (accent === primary in this system), so the risk header is visually identical to the position header.
10. TradePlannerCard's grid uses `gap-px bg-line` (1px hairline gaps painted by the parent) rather than borders — a distinctive as-built pattern to reproduce.
11. QuickTrade uses NO responsive breakpoints (`grid-cols-2`/`grid-cols-3` hold at 375px and squeeze); CalculatorModal is the only overlay with a real breakpoint (`md:` = 768px).

MOUNT MAP: TradeTicketButton → /portfolio (label "New order", size md), /stock/[symbol] (symbol+price, primary sm), /watchlist table actions cell (label "", ghost sm, 88px column), /watchlist WatchCard footer (label "Trade", secondary sm), SignalsOverview on /signals (label "Trade", size md). QuickTrade standalone → /signals/[id] only. CalculatorModal → /signals/[id] (planner) and /paper-trading (planner + position). AlertEditModal → /watchlist WatchCard only. CopilotQuotaModal → mounted once in GlobalCopilot (root Providers), hidden for signed-out users, on "/" and on /login|signup|forgot-password|verify-email|auth|onboarding|admin|privacy|terms|preview-design. BrokerLock → inside QuickTrade, BrokerPositionsPanel, /autopilot, OiHeatmap, DerivativesAnalysis.

---

## `/signals/[id] → overlay (no URL change; state `showTrade`, mode from `tradeMode` = 'paper' | 'live')` — QuickTrade — order ticket (collect step)

**File** `/Users/rishi/QuantX/frontend/components/dashboard/QuickTrade.tsx` · **531 LOC** · **Access** Authenticated. If `paperMode` is false and `useBrokerStatus()` resolves to not-connected, the entire form is replaced by a BrokerLock gate (feature="Live trading"). Paper mode skips the gate entirely.

**Shell** — None — portal-less fixed overlay rendered as a sibling of the page. Two stacked `fixed inset-0` layers both at z-50: backdrop (`bg-black/60 backdrop-blur-sm`, 4px blur) and a flex-centred container with 16px padding.

**Purpose.** Full-screen framer-motion dialog that collects a complete order ticket (symbol, direction, order type, price, quantity, SL, target, product) with an inline risk-based quantity calculator and a live P&L/R:R preview. It NEVER places the order itself — it hands the validated payload to the caller, which must run a separate confirm step.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Backdrop** | `fixed inset-0 bg-black/60 backdrop-blur-sm z-50`, click closes. framer-motion opacity 0→1 in, 1→0 out (framer defaults, no explicit duration). |
| 2 | **Modal shell** | `w-full max-w-2xl` = 672px cap, `max-h-[90vh]`, `overflow-hidden`. Fill #151517 (light #FFFFFF), 1px #29292D (light #DDE5ED), radius 16px (rounded-lg), Tailwind `shadow-2xl` = 0 25px 50px -12px rgba(0,0,0,.25). Enter: opacity 0→1, scale .95→1, y +20→0. Exit reverses. |
| 3 | **Header** | `flex items-center justify-between p-6` (24px) with 1px #29292D bottom hairline. Left cluster gap 12px: 8px-padded icon tile, radius 8px, fill #406AE4 @10%, 1px #406AE4 @20%, Zap glyph 20px in #8FB0FF. Title 20px/28px weight700 #F7F7F8 — "Quick Trade" (live) or "Paper Trade". Sub 14px/20px #D3D3D7 — "Place order in seconds" or "Virtual ₹10L book · live market price · no broker needed". Right: 8px-padded close, radius 8px, hover fill #1E1E21, X 20px #96969E. |
| 4 | **Scroll body** | `p-6 overflow-y-auto max-h-[calc(90vh-140px)]`. Form stack uses 24px vertical rhythm (`space-y-6`). |
| 5 | **1 — Stock search** | Label 14px w500 #D3D3D7 "Search Stock", 8px below. Input `w-full pl-12 pr-4 py-3` (48/16/12px), fill #1E1E21, 1px #29292D, radius 12px, placeholder "Search by symbol or name..." in #96969E; focus border #406AE4 + 2px ring #406AE4 @20%. Search glyph 20px #96969E absolute at left 16px. Results panel: `mt-2 max-h-40` (160px scroll), fill #1E1E21, 1px #29292D, radius 12px, 1px #29292D row dividers; each row `p-3`, hover fill #151517 — symbol 16px bold #F7F7F8, name 12px #96969E, right-aligned price 14px mono #F7F7F8 as "₹2847.60". |
| 6 | **2 — Direction + Order Type** | `grid grid-cols-2 gap-4` (16px, NOT responsive). Direction: nested `grid grid-cols-2 gap-2`; each button `p-3` radius 12px w500 with a 16px glyph centred above the label. BUY active = fill #10B981 @20%, 1px solid #10B981, ink #10B981, TrendingUp. SELL active = fill #F5808C @20%, 1px #F5808C, ink #F5808C, TrendingDown. Inactive = fill #1E1E21, 1px #29292D, ink #D3D3D7, hover border #FFFFFF @20%. Order Type: native `<select>` `px-4 py-3`, fill #1E1E21, 1px #29292D, radius 12px — options "Market", "Limit" (default MARKET). |
| 7 | **3 — Price + Quantity** | `grid grid-cols-2 gap-4`. Price: number, step 0.05, placeholder "₹ 0.00", Geist Mono, `px-4 py-3` radius 12px on #1E1E21. Quantity label is a `flex justify-between` row: "Quantity" plus an "Auto-calc" text button 12px #8FB0FF with a 12px Calculator glyph (hover #406AE4 @85%). Auto-calc math: capital HARD-CODED ₹1,00,000 → riskAmount = capital × riskPct/100 → qty = floor(riskAmount / \|price − stopLoss\|); requires a selected stock and a stop loss. Quantity input: number, placeholder "0", mono. |
| 8 | **4 — Risk slider** | Label 14px #D3D3D7 "Risk per Trade: 2%" (interpolated). Native unstyled `input type=range` `w-full`, min 0.5, max 5, step 0.5, default 2 — no custom track/thumb CSS at all. |
| 9 | **5 — Stop Loss + Target** | `grid grid-cols-2 gap-4`. Left label: inline Shield glyph 16px #F5808C + "Stop Loss". Right label: inline Target glyph 16px #10B981 + "Target". Both inputs number, step 0.05, placeholder "₹ 0.00", mono, `px-4 py-3` radius 12px on #1E1E21. |
| 10 | **6 — P&L preview (conditional)** | Renders only when quantity, price, target AND stopLoss are all truthy. Panel `p-4` fill #1E1E21, 1px #29292D, radius 12px. `grid grid-cols-3 gap-4 text-center`: caption 12px #96969E 4px above value. Col1 "Potential Profit" → 18px bold mono #10B981 "+₹6,180.00". Col2 "Potential Loss" → 18px bold mono #F5808C "-₹3,090.00". Col3 "Risk:Reward" → 18px bold #F7F7F8 (NO mono class) "1:2.00". |
| 11 | **7 — Product Type** | Label "Product Type". `grid grid-cols-3 gap-2`, buttons `p-3` radius 12px w500 for CNC · MIS · NRML (default MIS). Selected = .glass-control-accent (#406AE4 fill, 1px #406AE4, #FFF ink, elev-1). Unselected = .glass-control (#1E1E21 fill, 1px #29292D, ink #D3D3D7). |
| 12 | **8 — Footer actions** | `flex gap-3 pt-4`. "Cancel" = .glass-control, `flex-1 px-6 py-3`, radius 9999px, ink #F7F7F8, w500, active scale .98. "Place Order" = .glass-control-accent, `flex-1 px-6 py-3`, radius 9999px, Zap 20px + label; framer whileHover scale 1.02 / whileTap .98; disabled → opacity .5 + not-allowed. Submitting swaps to a spinning Loader2 20px + "Placing Order...". |
| 13 | **Broker gate (alternate body)** | When live mode and no broker: the entire form is replaced inside the same `p-6` body by BrokerLock — feature "Live trading", description "Placing real orders needs a connected broker. You can still paper-trade without one." Header and shell stay identical. |

**Components** — `BrokerLock (components/broker/BrokerLock.tsx)` · `framer-motion AnimatePresence + motion.div + motion.button` · `react-hook-form useForm + zodResolver` · `lucide via @/lib/icons: X, Search, TrendingUp, TrendingDown, Shield, Target, Calculator, Zap, Loader2` · `api.screener.searchInstruments / api.screener.getStockPrice` · `useBrokerStatus (SWR on /api/broker/connections, 30s dedupe)`

**States & data.** Zod schema: symbol string min1 ("Symbol is required"), direction enum BUY|SELL, quantity number min1 ("Quantity must be at least 1"), orderType enum MARKET|LIMIT, price number optional, stopLoss number optional, target number optional, product enum CNC|MIS|NRML. Defaults: orderType MARKET, product MIS, quantity 1, riskPercentage 2. AS-BUILT BUG WORTH REPRODUCING FAITHFULLY: `formState.errors` is destructured but never rendered — there is NO inline validation UI anywhere in this file; an invalid submit simply does nothing. Search: debounced 400ms, fires only at length ≥ 2 and when the query differs from the selected symbol, requests 8 instruments; the instruments path always returns price 0, so results commonly show "₹0.00" until the fallback getStockPrice path is used. `isSearching` is tracked but has no visible loading indicator. Submit disabled when `isSubmitting || !selectedStock`. On successful onSubmit the modal calls onClose(); on a thrown error it only `console.error`s — NO toast, NO inline error, and the modal stays open. Broker states: brokerLoading (form still renders), connected (form), disconnected+live (BrokerLock).

**Interactions.** Backdrop click → close. Close X → close. Typing in search (≥2 chars) → 400ms debounced fetch → result list → clicking a result sets selectedStock, fills the search box, and setValue('symbol'/'price'). BUY/SELL are setValue toggles, not radios. Auto-calc writes into the quantity field. Slider updates only the label + auto-calc input. P&L block appears/disappears live as the four fields fill. Submit → handleSubmit → caller's onSubmit → close. On /signals/[id] the paper path posts api.paper.placeOrder and routes to /paper-trading; the live path stashes a pending ticket and opens the mandatory confirm dialog (separate entry).

**Responsive.** No breakpoints in this component. Card is `max-w-2xl` (672px) minus the container's 16px padding, so at 375px the shell is 343px wide while `grid-cols-2` and `grid-cols-3` stay locked — the paired Price/Quantity and SL/Target fields, and the three product pills, all compress rather than stack. Body scrolls at `calc(90vh - 140px)`; the shell itself is capped at 90vh.

**Key copy.** "Quick Trade" / "Paper Trade" · "Place order in seconds" · "Virtual ₹10L book · live market price · no broker needed" · "Search Stock" · "Search by symbol or name..." · "Direction" · "Order Type" · "Market" / "Limit" · "Price" · "Quantity" · "Auto-calc" · "Risk per Trade: 2%" · "Stop Loss" · "Target" · "Potential Profit" / "Potential Loss" / "Risk:Reward" · "Product Type" · "CNC" "MIS" "NRML" · "Cancel" · "Place Order" · "Placing Order..." · "Live trading needs a connected broker" · "Placing real orders needs a connected broker. You can still paper-trade without one."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark centred trading order-ticket modal, 672px wide, capped 90vh, on a #0D0D0E page dimmed by a black 60% scrim with 4px backdrop blur. Card: fill #151517, 1px #29292D border, 16px radius, shadow 0 25px 50px -12px rgba(0,0,0,.25). Header 24px padding, 1px #29292D bottom rule: a 36px square tile with 8px radius, #406AE4 at 10% fill and #406AE4 at 20% border holding a 20px lightning glyph in #8FB0FF; beside it "Quick Trade" 20px bold #F7F7F8 and "Place order in seconds" 14px #D3D3D7; far right a 36px close X in #96969E. Body 24px padding, 24px gaps. Search field: 48px left padding for a magnifier, fill #1E1E21, 1px #29292D, 12px radius, showing "RELIANCE"; below it a 160px-tall result list on #1E1E21 with 1px #29292D dividers — RELIANCE / Reliance Industries Ltd ₹2847.60, TCS ₹4102.35, HDFCBANK ₹1678.90, INFY ₹1842.15 in 14px Geist Mono. Two 16px-gap columns: a BUY/SELL pair (BUY selected — #10B981 at 20% fill, 1px #10B981, #10B981 ink, up-arrow above the word) and a Market/Limit select. Price ₹2847.60 and Quantity 35 in mono, an "Auto-calc" link in #8FB0FF, a range slider labelled "Risk per Trade: 2%", then Stop Loss ₹2790.00 (red shield) and Target ₹2965.00 (green target). A #1E1E21 12px-radius panel with three centred stats: Potential Profit +₹4,109.00 in #10B981, Potential Loss -₹2,016.00 in #F5808C, Risk:Reward 1:2.04 in #F7F7F8, 18px bold. Three pills CNC / MIS / NRML with MIS filled #406AE4, white ink. Footer: full-pill "Cancel" on #1E1E21 and full-pill "Place Order" on #406AE4 with a lightning glyph.
```
</details>

---

## `/signals/[id] → confirm overlay (Radix portal, no URL change; opens when `pendingLiveTrade` is set after the QuickTrade ticket is submitted in live mode)` — Confirm live order — mandatory second step (signal detail)

**File** `/Users/rishi/QuantX/frontend/app/signals/[id]/page.tsx (ConfirmDialog instance, ~L583-616) + /Users/rishi/QuantX/frontend/components/foundation/ConfirmDialog.tsx + /Users/rishi/QuantX/frontend/components/foundation/Dialog.tsx` · **85 LOC** · **Access** Authenticated + Elite + connected broker (the ticket behind it is gated by BrokerLock; the page footnote reads "Live trade requires Elite + connected broker. Paper-trade is free.").

**Shell** — Radix Dialog Portal. Overlay `fixed inset-0 z-40 bg-black/60` (NO blur) with animate-overlay-in 160ms cubic-bezier(.23,1,.32,1). Content `fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2`, animate-dialog-in 200ms cubic-bezier(.23,1,.32,1) scaling 0.97→1 about the centre.

**Purpose.** The deliberate second action between "I filled the ticket" and "money moved". QuickTrade never fires the order; it stashes {quantity, stopLoss, target} and closes, and this Radix dialog is the only thing that can call api.trades.execute. Cancel takes initial focus so a stray Enter always backs out.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Panel** | `w-full max-w-md` = 448px cap, `rounded-sm` = 8px radius, `p-5` = 20px padding, 1px #29292D border, `.glass-surface` fill #151517 with elev-1 (0 1px 2px rgba(0,0,0,.30), 0 4px 12px -6px rgba(0,0,0,.40)). Light theme: #FFFFFF on 1px #DDE5ED. |
| 2 | **Title** | Radix Dialog.Title, `mb-2 text-base font-normal` = 16px/24px weight 400 in #F7F7F8 — "Confirm live order". Note the LOW weight: this is not a bold heading. |
| 3 | **Body** | 14px/relaxed #D3D3D7. Line 1 is `font-semibold text-d-text-primary` #F7F7F8: "BUY 35 RELIANCE" (SELL when the signal direction is SHORT), then " · SL 2790" and " · Target 2965" appended inline only when those values exist. `<br/>` then a 12px #96969E caution line. |
| 4 | **Actions** | `mt-5 flex justify-end gap-2` (20px above, 8px between, right-aligned). Cancel = foundation Button variant ghost size sm: 28px tall, 12px horizontal padding, 12px text, 8px radius, transparent border and background, ink #D3D3D7, hover fill #1E1E21 + ink #F7F7F8; it receives focus via a 0ms timeout on open. Confirm = variant primary size sm: 28px tall, fill #406AE4, 1px #406AE4, #FFFFFF ink, elev-1, 8px radius, label "Place order"; press scales to .98, focus-visible ring 2px. |
| 5 | **A11y** | Radix injects an `sr-only` Description duplicating the title. Escape and outside-click both route through onOpenChange → onClose. Focus is trapped by Radix and deliberately moved off the destructive button. |

**Components** — `ConfirmDialog (components/foundation/ConfirmDialog.tsx)` · `Dialog (Radix @radix-ui/react-dialog wrapper)` · `Button (foundation, ghost + primary, size sm)` · `api.trades.execute` · `next/navigation router.push`

**States & data.** Open state is derived: `open={!!pendingLiveTrade}`. Busy state: on confirm, `busy` flips true, BOTH buttons disable, and the confirm label swaps to "Working…" (with the ellipsis character, not three dots). No success UI — on resolve the dialog closes and the router pushes /trades when result.status === 'pending' (order placed, awaiting fill) or /portfolio otherwise. NO error UI: the onConfirm promise is not wrapped in try/catch inside the page, so a rejected api.trades.execute leaves the dialog open with busy reset by the `finally` and nothing rendered to explain the failure. Payload: { signal_id, quantity, custom_sl, custom_target }.

**Interactions.** Opening the ticket → filling it → Place Order closes QuickTrade and immediately opens this dialog (they are never on screen together). Cancel / Escape / outside click → onClose clears pendingLiveTrade and abandons the ticket entirely (the user must re-open QuickTrade). Enter on open activates Cancel, never Confirm. Confirm requires a deliberate click or explicit Tab + Enter.

**Responsive.** 448px cap; below ~480px it is width-constrained only by the Radix content's `w-full`. Content is a short text block plus two small buttons, so it never scrolls. No breakpoints.

**Key copy.** Title "Confirm live order". Body "BUY 35 RELIANCE · SL 2790 · Target 2965" then "Real order routed to your connected broker. This cannot be undone from here." Buttons "Cancel" and "Place order", busy label "Working…".

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a small dark confirmation dialog centred over a #0D0D0E trading page dimmed by a flat black 60% scrim with no blur. Panel: 448px wide, 8px corner radius, 20px padding, fill #151517, 1px #29292D border, soft shadow 0 1px 2px rgba(0,0,0,.30) plus 0 4px 12px -6px rgba(0,0,0,.40). Top line is a title in 16px REGULAR weight (not bold) #F7F7F8 reading "Confirm live order", with 8px below it. Body text 14px, relaxed line height: first line in semibold #F7F7F8 "BUY 35 RELIANCE · SL 2790 · Target 2965", then a line break and a smaller 12px muted #96969E caution line "Real order routed to your connected broker. This cannot be undone from here." Leave 20px of space, then a right-aligned button row with 8px between two 28px-tall buttons, both 8px radius, 12px labels: "Cancel" is a ghost button with no border and no fill, ink #D3D3D7, and it carries a visible 2px focus ring in #406AE4 at 60% because it takes focus first; "Place order" is a solid #406AE4 fill with white ink and a 1px #406AE4 border. Show a second variant of the same panel where the confirm button reads "Working…" and both buttons are dimmed to 50% opacity. Overall mood: quiet, serious, information-dense fintech — no icons, no colour beyond the single blue action, nothing decorative. Light-theme counterpart: #FFFFFF panel, 1px #DDE5ED border, #1D1D1D ink, #5F6B75 caution text.
```
</details>

---

## `/paper-trading and /signals/[id] → overlay (state `plannerOpen` / `showCalc`; type="planner")` — CalculatorModal — Trade Planner mode

**File** `/Users/rishi/QuantX/frontend/components/CalculatorModal.tsx` · **469 LOC** · **Access** Authenticated. No broker required — this is pure client-side math. On /signals/[id] it is conditionally rendered so it remounts with THAT signal's computed entry/stop/target on each open.

**Shell** — Plain `if (!isOpen) return null` — no portal, no framer, no Radix. `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4`. NO entry or exit animation whatsoever.

**Purpose.** Deterministic pre-trade plan: five numeric inputs feed a pure-math TradePlannerCard that returns fixed-fractional position size, a 1R/2R/3R ladder, an honest consecutive-loss drawdown line, and a hand-off to the Copilot. Zero LLM tokens are spent in the panel itself.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Backdrop** | Black 60% + 4px blur, 16px container padding. CRITICAL AS-BUILT: the backdrop has NO onClick and there is NO Escape listener — the header X is the only way out. |
| 2 | **Card** | `.glass-surface w-full max-w-2xl rounded-lg shadow-2xl` → 672px cap, radius 16px, fill #151517, 1px #29292D, elev-1 plus Tailwind shadow-2xl. NO max-height and NO internal scroll container — a tall plan can overflow the viewport. |
| 3 | **Header** | `flex items-center justify-between border-b border-border/60 p-6` (24px padding; the rule is #29292D at 60%). Left gap 12px: a 48×48 tile, radius 12px, fill #406AE4 @15%, holding a 24px Calculator glyph in #8FB0FF. Title 20px bold #F7F7F8 "Trade Planner"; sub 14px #96969E "Plan entry, size, targets and drawdown before you trade". Right: a 40×40 button, radius 8px, 1px #29292D @60%, X 20px #96969E, hover border #F5808C @60% and ink #F5808C. |
| 4 | **Form grid** | `p-6` body, `grid gap-4 md:grid-cols-2` — single column below 768px, two columns at/above. Labels 14px w500 #96969E, 8px above each field. Fields: `py-3 px-4`, radius 8px (rounded-sm), fill #0D0D0E @60%, 1px #29292D @60%, focus border #406AE4 @60%, no ring. Capital and Risk fields carry a 20px leading glyph at left 12px with `pl-10` (40px). |
| 5 | **Fields (5)** | 1 Entry Price (₹) placeholder "2500" · 2 "Stop Loss (₹) — above entry = short" placeholder "2400" · 3 Total Capital (₹) with a DollarSign glyph, placeholder "100000" · 4 Risk Per Trade (%) with a Percent glyph, step 0.5, placeholder "2" (seeded to '2' by default) · 5 full-width `md:col-span-2` "Target Price (₹) — optional" placeholder "2800". All are `type=number` with no min/max and no inline validation. |
| 6 | **TradePlannerCard — invalid state** | `mt-6` (24px). When planTrade returns null: `rounded-sm border border-line bg-wrap px-4 py-3` with a 14px ClipboardList in #8FB0FF + "Trade Plan" 12px semibold, and an 11px #96969E line "Enter a valid entry, stop, capital and risk % to build the plan (stop must differ from entry)." |
| 7 | **TradePlannerCard — header** | `rounded-sm border border-line bg-wrap overflow-hidden` (8px radius, #151517 on 1px #29292D). Bar `px-4 py-2.5` with 1px #29292D bottom: left ClipboardList 14px #8FB0FF + "Trade Plan" 12px semibold #F7F7F8; right the direction word 10px semibold uppercase +0.06em tracking, #10B981 for long / #F5808C for short. |
| 8 | **TradePlannerCard — 2×2 stat grid** | `grid grid-cols-2 gap-px bg-line` — the 1px gaps ARE the hairlines, painted by the #29292D parent behind #151517 cells. Each cell `px-3 py-2 text-center`: 9px uppercase +0.06em muted label, 14px Geist Mono semibold value, 9px muted sub 2px below. Cells: "Quantity" 70 / "shares" · "Position" ₹1,99,332.00 / "12.46% of capital" · "Risk if stop hits" ₹4,004.00 / "₹57.20/share" in #F5808C · "R to target" 2.05R / "at your target" in #10B981 (or "—" / "no target set"). |
| 9 | **TradePlannerCard — tail blocks** | Optional zero-qty note `px-4 py-2 border-t border-line` 11px muted: "Risk budget is too small for even 1 share at this stop distance — raise capital/risk % or tighten the stop." Then R-ladder `px-4 py-2.5 border-t`: 9px uppercase eyebrow "R-ladder (from entry vs stop)" then a `flex flex-wrap gap-x-4 gap-y-1` row at 11.5px — "1R ₹2,904.80  2R ₹2,962.00  3R ₹3,019.20" with the prices bold and mono. Then drawdown `px-4 py-2.5 border-t space-y-0.5`: 11px lines "−₹12,012.00 if the next 3 trades all hit stop" and "−₹20,020.00 if the next 5 trades all hit stop", amounts mono semibold #F5808C. Then footer `px-4 py-2.5 border-t`: an 11px #8FB0FF link with a 14px Sparkles glyph — "Ask AI about this plan". |

**Components** — `TradePlannerCard (components/TradePlannerCard.tsx, 138 LOC)` · `planTrade (lib/tradePlan.ts — pure, deterministic)` · `inr / fmtInr (lib/format — returns an em dash instead of ₹NaN)` · `dispatchCopilotOpen (components/copilot/CopilotProvider)` · `icons: X, Calculator, DollarSign, Percent, ClipboardList, Sparkles`

**States & data.** All five inputs are strings in useState, seeded once from initialEntry/initialStop/initialTarget/initialCapital/initialRiskPct via a `seed()` coercer that maps undefined/null/''/non-finite to '' so a field renders blank rather than "NaN" or "0". Because they are initial-state-only, callers MUST remount (conditional render or changing key) for fresh pre-fills — /signals/[id] and the /paper-trading position sizer do; the /paper-trading planner is mounted unconditionally and therefore keeps its state across opens. planTrade returns null (→ the invalid card) when any of entry/stop/capital/riskPct is non-finite or ≤ 0, or when stop === entry. Direction is inferred: stop < entry = long, stop > entry = short. qty = floor(capital × riskPct/100 ÷ |entry − stop|), so riskAmount ≤ the budget. rMultipleToTarget is null unless target is finite and > 0. Drawdown rows are fixed at N = 3 and N = 5.

**Interactions.** Every keystroke recomputes the whole plan synchronously — there is no submit button and no debounce. "Ask AI about this plan" composes a one-paragraph summary (direction, entry, stop, qty, position value and % of capital, risk amount and per-share, the full R-ladder, the target's R multiple, the 3-trade drawdown, then "Is the sizing and risk-reward sensible?") and dispatches it to the global Copilot dock — which opens ON TOP of this still-open modal. The header X is the only dismissal.

**Responsive.** The only overlay in scope with a real breakpoint. Below 768px the five fields stack to one column and the target field is already full-width; at ≥768px it is a 2-column grid with target spanning both. The plan card's 2×2 stat grid and the R-ladder flex-wrap row never change columns. Card is 672px capped minus 16px of container padding; with no max-height, tall plans push the card past the viewport on short screens.

**Key copy.** "Trade Planner" · "Plan entry, size, targets and drawdown before you trade" · "Entry Price (₹)" · "Stop Loss (₹) — above entry = short" · "Total Capital (₹)" · "Risk Per Trade (%)" · "Target Price (₹) — optional" · "Trade Plan" · "Quantity" / "shares" · "Position" / "% of capital" · "Risk if stop hits" / "/share" · "R to target" / "at your target" / "no target set" · "R-ladder (from entry vs stop)" · "if the next 3 trades all hit stop" · "Risk budget is too small for even 1 share at this stop distance — raise capital/risk % or tighten the stop." · "Ask AI about this plan" · "Enter a valid entry, stop, capital and risk % to build the plan (stop must differ from entry)."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark 672px-wide trade-planning modal on a #0D0D0E page behind a black 60% scrim with 4px blur. Card fill #151517, 1px #29292D, 16px radius. Header 24px padding with a 60%-opacity #29292D bottom rule: a 48px tile with 12px radius in #406AE4 at 15% holding a 24px calculator glyph in #8FB0FF, then "Trade Planner" 20px bold #F7F7F8 over "Plan entry, size, targets and drawdown before you trade" 14px #96969E; a 40px square outlined close button sits far right. Body 24px padding, a two-column 16px-gap form of number fields with 8px radius, near-black #0D0D0E fill and 60%-opacity #29292D borders, labels 14px #96969E: Entry Price (₹) 2847.60, "Stop Loss (₹) — above entry = short" 2790.40, Total Capital (₹) 1600000 with a rupee glyph inset, Risk Per Trade (%) 2 with a percent glyph, then a full-width "Target Price (₹) — optional" 2965.00. Below, an 8px-radius plan card on #151517 with a 1px #29292D edge: a header row "Trade Plan" 12px semibold with a clipboard glyph and the word LONG in 10px uppercase #10B981; then a 2×2 grid whose cell separators are 1px #29292D hairlines — Quantity 279 / shares · Position ₹7,94,480.40 / 49.65% of capital · Risk if stop hits ₹15,976.80 / ₹57.20 per share in #F5808C · R to target 3.05R / at your target in #10B981, values 14px Geist Mono. Then a hairline-separated row "R-LADDER (FROM ENTRY VS STOP)" 9px uppercase with 1R ₹2904.80  2R ₹2962.00  3R ₹3019.20, then two 11px lines "−₹47,930.40 if the next 3 trades all hit stop" in #F5808C, and finally an 11px #8FB0FF link "Ask AI about this plan" with a sparkle glyph.
```
</details>

---

## `/paper-trading → overlay (state `sizerOpen`; type="position", conditionally rendered so it remounts fresh each open)` — CalculatorModal — Position Sizing mode

**File** `/Users/rishi/QuantX/frontend/components/CalculatorModal.tsx` · **469 LOC** · **Access** Authenticated. No broker required. Reached from the /paper-trading header toolbar via a small `.glass-control` button reading "Position size" with a 12px Calculator glyph.

**Shell** — Identical to planner mode: `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4`, no animation, no backdrop-click close, no Escape.

**Purpose.** Four inputs (capital, risk %, entry, stop) → a recommended share count, rupee position size, rupee risk and stop-loss distance in percent, plus a maximum-loss warning strip. Same shell as the planner mode; different body and a different, self-contained results block.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Card + header** | Same 672px / 16px-radius #151517 card on 1px #29292D with elev-1 + shadow-2xl. Same 24px header with the 60%-opacity #29292D rule, the 48px #406AE4-at-15% tile with a 24px Calculator glyph in #8FB0FF, and the 40px outlined close. Copy differs: title 20px bold "Position Sizing Calculator", sub 14px #96969E "Calculate optimal position size for Indian stocks". |
| 2 | **Form grid** | `grid gap-4 md:grid-cols-2` — four fields, all `py-3` radius 8px on #0D0D0E @60% with 1px #29292D @60%, focus border #406AE4 @60%. Total Capital (₹) has a DollarSign glyph at left 12px with 40px left padding, placeholder "100000". Risk Per Trade (%) has a Percent glyph, step 0.5, placeholder "2", default value '2'. Entry Price (₹) `px-4` placeholder "2500". Stop Loss (₹) `px-4` placeholder "2400". |
| 3 | **Results block (conditional)** | Renders only when capital, risk, entry and stop are all truthy AND entry > stop. `mt-6 rounded-md p-6` = 24px above, 12px radius, 24px padding; 1px #406AE4 @30% border; fill is a 135°-ish `bg-gradient-to-br` from #406AE4 @10% to transparent. Heading 18px semibold #F7F7F8 "Recommended Position", 16px below. |
| 4 | **Result tiles** | `grid gap-4 md:grid-cols-2` of four tiles, each `rounded-sm bg-background-surface/60 p-4` = 8px radius, #151517 at 60%, 16px padding. Label 14px #96969E; value 4px below at 24px bold. "Quantity to Buy" → #8FB0FF, with a 12px #96969E sub "shares". "Position Size" → #F7F7F8, "₹1,99,332.00". "Risk Amount" → #F5808C, "₹4,004.00". "Stop Loss %" → #F5808C, "2.01%". |
| 5 | **Max-loss strip** | `mt-4 flex items-start gap-2 rounded-sm bg-warning/10 p-3` — 16px above, 8px radius, 12px padding, fill #F0A94F @10%, NO border. A 20px AlertTriangle in #F0A94F, then 14px #96969E copy: "Maximum loss if stop loss hits: " followed by a bold #F5808C rupee figure. |

**Components** — `icons: X, Calculator, DollarSign, Percent, AlertTriangle` · `(no TradePlannerCard — this mode's results are inline)`

**States & data.** Uses the same `capital`, `riskPercent`, `entryPrice`, `stopLoss` string state as the planner. calculatePositionSize returns null unless all four parse truthy AND entry > stop — so a short setup (stop above entry) silently produces NO results block, unlike planner mode which handles shorts. Math: riskAmount = capital × risk / 100 (rendered to 2dp); stopLossPercent = ((entry − stop) / entry) × 100; quantity = floor(riskAmount / (entry − stop)) as an integer; positionSize = quantity × entry to 2dp; maxLoss = riskAmount. Values are raw `toFixed(2)` strings — NO Indian digit grouping is applied in this mode (contrast the planner, which routes through lib/format's `inr`). There is no loading, error, empty or success state — the block is present or absent.

**Interactions.** Live recompute on every keystroke; no submit. No field-level validation messages — an invalid combination just hides the results. Header X is the only dismissal (no backdrop click, no Escape). /paper-trading mounts this conditionally (`{sizerOpen && <CalculatorModal …/>}`) so each open starts from blank capital/entry/stop with risk pre-seeded to 2.

**Responsive.** Below 768px both the input grid and the four result tiles collapse to one column, making the modal tall; there is no internal scroll container or max-height, so on a 375×667 viewport the results overflow the card below the fold. At ≥768px it is a 2×2 form over a 2×2 result grid.

**Key copy.** "Position Sizing Calculator" · "Calculate optimal position size for Indian stocks" · "Total Capital (₹)" · "Risk Per Trade (%)" · "Entry Price (₹)" · "Stop Loss (₹)" · "Recommended Position" · "Quantity to Buy" / "shares" · "Position Size" · "Risk Amount" · "Stop Loss %" · "Maximum loss if stop loss hits:"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark position-sizing calculator modal, 672px wide, centred over a #0D0D0E page behind a black 60% scrim with 4px blur. Card: #151517 fill, 1px #29292D border, 16px radius, deep soft shadow. Header with 24px padding and a faint #29292D bottom rule: a 48px square tile at 12px radius filled #406AE4 at 15% holding a 24px calculator glyph in #8FB0FF, then "Position Sizing Calculator" 20px bold #F7F7F8 above "Calculate optimal position size for Indian stocks" 14px #96969E; a 40px square close button with a faint outline at far right. Body 24px padding: a two-column 16px-gap grid of four number inputs at 8px radius, fill #0D0D0E at 60%, 1px #29292D at 60% — Total Capital (₹) 1600000 with an inset rupee glyph, Risk Per Trade (%) 2 with an inset percent glyph, Entry Price (₹) 2847.60, Stop Loss (₹) 2790.40; labels 14px #96969E. Below, a results panel at 12px radius with a 1px #406AE4-at-30% border and a diagonal gradient from #406AE4 at 10% to transparent, 24px padding, headed "Recommended Position" 18px semibold #F7F7F8. Inside it, a 2×2 grid of tiles at 8px radius on #151517 at 60%, 16px padding: "Quantity to Buy" 559 in 24px bold #8FB0FF with "shares" beneath in 12px #96969E; "Position Size" ₹15,91,808.40 in #F7F7F8; "Risk Amount" ₹31,976.80 in #F5808C; "Stop Loss %" 2.01% in #F5808C. Finish with a full-width strip at 8px radius filled #F0A94F at 10%, no border, 12px padding, holding a 20px amber warning triangle and 14px #96969E text "Maximum loss if stop loss hits: ₹31,976.80" with the amount bold in #F5808C.
```
</details>

---

## `(unreachable) type="risk" — implemented in full, zero call sites in the repo` — CalculatorModal — Risk Management mode (dead branch)

**File** `/Users/rishi/QuantX/frontend/components/CalculatorModal.tsx` · **469 LOC** · **Access** Would be authenticated, no broker required. Currently unreachable.

**Shell** — Same non-animated `fixed inset-0 z-50 … bg-black/60 backdrop-blur-sm p-4` shell as the other two modes.

**Purpose.** A third, fully-built branch of CalculatorModal that analyses an existing position: position size as a percent of capital, potential profit to target, and a HIGH RISK / MODERATE / LOW RISK verdict band. Documented for completeness — grep confirms nothing in the app passes type="risk", so it never renders today.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Header (variant)** | The only mode with a different header tile: a 48×48 radius-12px tile filled `bg-accent/15` holding a 24px Shield glyph in `text-accent`. AS-BUILT: accent and primary both resolve to #406AE4 (fill) / #8FB0FF (ink), so this is visually IDENTICAL to the primary tile — only the glyph changes. Title 20px bold "Risk Management Calculator"; sub 14px #96969E "Analyze risk and potential returns". |
| 2 | **Form** | `grid gap-4 md:grid-cols-2`, four plain `px-4 py-3` fields (no inset glyphs), radius 8px on #0D0D0E @60% with 1px #29292D @60%, focus border uses `accent/60` (again #406AE4): Total Capital (₹) placeholder "500000" · Position Value (₹) placeholder "50000" · Current Price (₹) placeholder "2500" · Target Price (₹) placeholder "2800". |
| 3 | **Results** | `mt-6 rounded-md p-6` with 1px #406AE4 @30% and a bottom-right gradient from #406AE4 @10%. Heading 18px semibold "Risk Analysis". THREE tiles (`md:grid-cols-3`, not two) at 8px radius on #151517 @60%, 16px padding: "Position %" 24px bold #F7F7F8 with a 12px sub "of total capital"; "Potential Profit" 24px bold #10B981 prefixed "+" with a 12px rupee sub; "Risk:Reward" 24px bold in #8FB0FF suffixed ":1". |
| 4 | **Verdict band** | `mt-4 rounded-sm p-4` whose fill/border switch on the recommendation: HIGH RISK → #F5808C @10% fill + 1px #F5808C @30%; MODERATE → #F0A94F @10% + 1px #F0A94F @30%; LOW RISK → #10B981 @10% + 1px #10B981 @30%. Row: a 20px Shield glyph in the matching hue + the verdict word in semibold, then an 8px-below 14px #96969E sentence. |

**Components** — `icons: X, Shield, AlertTriangle (imported), Calculator`

**States & data.** Separate state block from the position mode: totalCapital, positionValue, targetPrice, currentPrice. calculateRisk returns null unless all four parse truthy. positionPercent = posValue/cap × 100; potentialProfit = (target − current)/current × 100; profitAmount = posValue × profit/100; riskReward = target > current ? (target − current) / (current − current×0.95) : 0 — i.e. it ASSUMES a hard-coded 5% stop rather than taking one from the user. Verdict thresholds: > 10% = 'HIGH RISK', > 5% = 'MODERATE', else 'LOW RISK'.

**Interactions.** Live recompute per keystroke; header X only dismissal. No submit, no validation messages.

**Responsive.** Below 768px the form stacks to one column and the three result tiles stack vertically; at ≥768px it is a 2-column form over a 3-column tile row.

**Key copy.** "Risk Management Calculator" · "Analyze risk and potential returns" · "Position Value (₹)" · "Current Price (₹)" · "Target Price (₹)" · "Risk Analysis" · "Position %" / "of total capital" · "Potential Profit" · "Risk:Reward" · "HIGH RISK" / "MODERATE" / "LOW RISK" · "Position exceeds recommended 10% of capital. Consider reducing position size." · "Position is within acceptable range. Monitor closely and maintain stop loss." · "Position size is conservative and well-managed. Good risk control."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark risk-analysis modal, 672px wide, centred over a #0D0D0E page behind a black 60% scrim with 4px blur. Card #151517, 1px #29292D, 16px radius. Header 24px padding with a faint #29292D rule: a 48px tile at 12px radius filled #406AE4 at 15% holding a 24px shield glyph in #8FB0FF, then "Risk Management Calculator" 20px bold #F7F7F8 over "Analyze risk and potential returns" 14px #96969E, with a 40px outlined close button at right. Body 24px padding: a two-column 16px-gap grid of four plain number inputs at 8px radius on #0D0D0E-at-60% with 1px #29292D-at-60% borders and 14px #96969E labels — Total Capital (₹) 1600000, Position Value (₹) 240000, Current Price (₹) 1678.90 (HDFCBANK), Target Price (₹) 1815.00. Beneath, a results panel at 12px radius with a 1px #406AE4-at-30% edge and a diagonal gradient from #406AE4 at 10% to transparent, 24px padding, titled "Risk Analysis" in 18px semibold. Inside, THREE side-by-side tiles at 8px radius on #151517-at-60%, 16px padding: "Position %" 15.00% in 24px bold #F7F7F8 with "of total capital" beneath in 12px #96969E; "Potential Profit" +8.10% in 24px bold #10B981 with ₹19,440.00 beneath; "Risk:Reward" 1.62:1 in 24px bold #8FB0FF. Finish with a full-width verdict band at 8px radius filled #F5808C at 10% with a 1px #F5808C-at-30% border, holding a 20px red shield, the word "HIGH RISK" in semibold #F5808C, and below it 14px #96969E copy "Position exceeds recommended 10% of capital. Consider reducing position size."
```
</details>

---

## `/watchlist → overlay (state `editingAlerts` on a WatchCard; opened from the card's "alerts on"/"alerts off" footer button with a pencil glyph)` — AlertEditModal — watchlist alert thresholds

**File** `/Users/rishi/QuantX/frontend/app/watchlist/_components/AlertEditModal.tsx` · **459 LOC** · **Access** Authenticated with an existing watchlist entry. The ±% mode and the entire preset block require a live price (`item.last_price`); the ATR presets additionally require a successful technicals fetch.

**Shell** — Plain conditional render, no portal, no animation. `fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4` — a heavier 70% scrim with NO blur. Backdrop click closes; the card stops propagation.

**Purpose.** Sets the above/below price alert thresholds for one watchlist symbol, in either absolute rupees or a percentage from the live price, with six one-click presets (four percentage, two volatility-aware ATR) and an optional per-symbol pin that syncs cross-device. Saving re-arms the backend debounce so the next crossing fires fresh.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Card** | `w-full max-w-sm` = 384px cap — the narrowest overlay in the app. `rounded-lg` 16px radius, `p-5` 20px padding, `space-y-4` 16px stack, 1px #29292D border, and fill `bg-main` = #0D0D0E — note this is the L0 PAGE canvas, not the L1 card colour (light theme: #EDF1F4). |
| 2 | **Header** | `flex items-start justify-between gap-3`. Eyebrow 10px uppercase, wide tracking, #96969E — "Alert thresholds". Title 15px semibold #F7F7F8 2px below: the symbol, then a 12px normal-weight mono #96969E price 8px to its right, e.g. "RELIANCE  ₹2847.60". Right: a 4px-padded close, small radius, hover fill #FFFFFF @10%, X 16px #96969E, aria-label "Close". |
| 3 | **Mode toggle** | A pill-in-pill segmented control: `flex gap-1 rounded-full border border-d-border p-0.5 w-fit text-[10px]`. Two 10px pills `px-2.5 py-1 rounded-full`: "₹ absolute" and "±% from current". Selected pill = .glass-control-accent (#406AE4 fill, #FFF ink); unselected = bare text #96969E hovering to #F7F7F8. The % pill is disabled (40% opacity, not-allowed) whenever there is no live price. Switching modes CLEARS both fields and the active preset. |
| 4 | **Quick presets (live price only)** | 10px uppercase eyebrow "Quick presets", then a `flex flex-wrap gap-1.5` of 10px pills at `px-2.5 py-1 rounded-full`: "±5%", "±10%", "+5% breakout", "−5% drop" (note the true minus sign U+2212). When ATR(14) loads, two more append: "±1× ATR" and "±2× ATR", rendered as .glass-control with #8FB0FF ink (the only tinted preset pills) and a native title tooltip "ATR(14) = ₹57.20 · ±1× ATR". The active preset is .glass-control-accent. Below, a 10px mono muted line "ATR(14) = ₹57.20 (2.01% of price)". |
| 5 | **Pin checkbox** | `mt-2 flex items-center gap-1.5 text-[10px] text-d-text-muted` with a native checkbox using `accent-primary` (#406AE4 tick): "Pin this preset to RELIANCE (syncs across devices)". Off by default; reads back from local preset memory on open. |
| 6 | **Above field** | 10px uppercase muted label — "Notify when price goes above" in ₹ mode, "Notify on % gain above current" in % mode. Row `flex items-center gap-2`: a 12px #96969E prefix ("₹" or "+"), then a mono input `flex-1 px-3 py-1.5 text-[13px]` at 12px radius on #0D0D0E with 1px #29292D and focus border #406AE4 @50%; type=number, inputMode=decimal, step 0.01 (₹) or 0.1 (%). Placeholder "leave blank to disable" / "e.g. 5 = +5% above". % mode appends a 12px "%" suffix. Helper 10px mono 4px below: % mode shows "= ₹2,989.98"; ₹ mode shows "4.99% above current ₹2847.60", or "Already 1.20% past threshold, fires on next tick" when the level is already crossed — and the helper turns #F0A94F when the distance is under 1%. |
| 7 | **Below field** | Mirror of the above field. Label "Notify when price drops below" / "Notify on % drop below current"; prefix "₹" or "−"; placeholder "leave blank to disable" / "e.g. 5 = −5% below"; helper "4.99% below current ₹2847.60" with the same warning tint. |
| 8 | **Validation + toggle** | 11px #F5808C messages, shown inline with no icon: "Percent values must be positive. Use the toggle above to switch modes." and "Above must be greater than below." Then a 12px #D3D3D7 checkbox row with an #406AE4 accent: "Alerts enabled". |
| 9 | **Error + footnote** | API error box: small radius, 1px #F5808C @30%, fill #F5808C @8%, 8px padding, 11px #F5808C text (handleApiError output). Footnote 10px #96969E: "Saving with a new threshold re-arms the alert — the next crossing fires fresh, even if you previously hit this level." |
| 10 | **Actions** | `flex items-center gap-2`, two equal-width pills at `py-2` radius 9999px, 12px labels. "Clear all" = .glass-control, ink #96969E, disabled 50% while saving. "Save" = .glass-control-accent, w500, `active:scale-[0.98]`, disabled 40% + not-allowed; leading glyph is a 14px Check, swapping to a 14px spinning Loader2 while saving. |

**Components** — `api.watchlist.updateAlerts / api.screener.getTechnicals` · `lib/watchlistPresetMemory (loadAlertPreset, saveAlertPreset, hasSymbolPreset, clearSymbolPreset, syncSymbolPinToServer) — all lazily dynamic-imported` · `handleApiError` · `icons: Check, Loader2, X`

**States & data.** State: mode 'abs'|'pct', above/below strings, enabled bool, saving, error, atr (number|null), activePreset (PresetId|null), pinPerSymbol. In % mode the inputs are deltas and the absolute levels are derived — aboveNum = live × (1 + pct/100), belowNum = live × (1 − pct/100) — and only absolutes are POSTed. Validity: each threshold must be null or finite and > 0; percent inputs must be positive in BOTH fields; above must exceed below when both are set. canSave = all valid && !saving. ATR(14) is fetched lazily on open from the public technicals endpoint; failure is silent and simply leaves the ATR presets hidden. Preset memory: the last preset used in the tab is auto-applied on the next open, but ONLY when both stored thresholds are blank, guarded by an initialAppliedRef so user typing is never overwritten; ATR presets defer until `atr` arrives. Save: POSTs {alert_price_above, alert_price_below, alert_enabled} and force-disables alerts when both thresholds are blank. "Clear all" POSTs nulls + false. NO success UI — onSaved() closes the modal and the parent refetches.

**Interactions.** Backdrop click closes (no unsaved-changes guard). Typing in either field clears the active preset highlight. Clicking a preset sets mode, both fields, and forces `enabled` true, and persists to global memory (plus per-symbol + server sync when pinned). Toggling the pin either writes the current preset per-symbol and syncs it to the server, or clears both. There is no Escape handler and no focus trap.

**Responsive.** Fixed 384px cap at every width, so on a 375px phone it is 343px wide after the 16px container padding — the layout is designed mobile-first and does not change. The only reflow is the preset row's `flex-wrap`, which drops the ATR pills to a second line when six pills are present.

**Key copy.** "Alert thresholds" · "₹ absolute" / "±% from current" · "Quick presets" · "±5%" "±10%" "+5% breakout" "−5% drop" "±1× ATR" "±2× ATR" · "ATR(14) = ₹57.20 (2.01% of price)" · "Pin this preset to RELIANCE (syncs across devices)" · "Notify when price goes above" / "Notify on % gain above current" · "leave blank to disable" · "e.g. 5 = +5% above" · "Already 1.20% past threshold, fires on next tick" · "Percent values must be positive. Use the toggle above to switch modes." · "Above must be greater than below." · "Alerts enabled" · "Saving with a new threshold re-arms the alert — the next crossing fires fresh, even if you previously hit this level." · "Clear all" · "Save"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a compact dark alert-settings modal, 384px wide, centred over a watchlist behind a flat black 70% scrim with NO blur. Card: fill #0D0D0E, 1px #29292D border, 16px radius, 20px padding, 16px vertical rhythm. Top: a 10px uppercase wide-tracked #96969E eyebrow "ALERT THRESHOLDS"; beneath it "RELIANCE" 15px semibold #F7F7F8 followed by "₹2847.60" in 12px Geist Mono #96969E; a small 16px close X sits top-right. Next a tiny pill-shaped segmented control with a 1px #29292D ring and 2px inner padding holding two 10px pills — "₹ absolute" and "±% from current" — with the second one filled #406AE4 with white ink. Then a 10px uppercase label "QUICK PRESETS" and a wrapping row of six 10px pills at full radius: ±5% (filled #406AE4, white ink), ±10%, +5% breakout, −5% drop on #1E1E21 with 1px #29292D, and ±1× ATR / ±2× ATR on #1E1E21 with #8FB0FF ink; below them a 10px mono muted line "ATR(14) = ₹57.20 (2.01% of price)" and a tiny blue-tick checkbox "Pin this preset to RELIANCE (syncs across devices)". Two input groups follow, each a 10px uppercase muted label over a row of a small "+" or "−" sign, a 12px-radius mono input at 13px on #0D0D0E with a 1px #29292D border showing 5, and a trailing "%" — with 10px muted helper text "= ₹2,989.98" and "= ₹2,705.22". Then a 12px checkbox row "Alerts enabled" and a 10px muted footnote about re-arming. Bottom: two equal full-radius buttons — "Clear all" on #1E1E21 with #96969E ink, and "Save" filled #406AE4 with white ink and a 14px check glyph.
```
</details>

---

## `Mounted on /portfolio, /stock/[symbol], /watchlist (table cell + WatchCard footer) and /signals (SignalsOverview) — overlay, no URL change` — TradeTicketButton — main order-entry flow (trigger → ticket → confirm → toast)

**File** `/Users/rishi/QuantX/frontend/components/trade/TradeTicketButton.tsx` · **133 LOC** · **Access** Authenticated; broker connection enforced downstream inside QuickTrade (BrokerLock replaces the form when no broker is connected). Works with or without a preset symbol — the no-symbol variant relies on QuickTrade's built-in instrument search.

**Shell** — Three layers in one component: an inline foundation Button in the host page's toolbar/row; QuickTrade's framer overlay (z-50, black 60% + 4px blur); and the Radix ConfirmDialog (overlay z-40 black 60% no blur, content z-50). QuickTrade and ConfirmDialog are never visible simultaneously — submitting the ticket closes it and opens the confirm.

**Purpose.** The app's reusable real-money order path, encapsulated in one client component: a small trigger button opens QuickTrade to collect the ticket, the submitted payload is STASHED rather than sent, a ConfirmDialog takes the deliberate second action, and only then does api.broker.order fire — with the result surfaced as a Sonner toast. The order never fires on a single click.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Trigger button** | foundation Button, `inline-flex items-center justify-center rounded-sm font-semibold` with an `active:scale-[0.98]` press at 90ms ease-out(.22,1,.36,1) and a 2px focus-visible ring with a 1px offset on #0D0D0E. Leading glyph is a 16px Activity (pulse) with 4px right margin. Sizes: sm = 28px tall / 12px padding / 12px text / 6px gap; md = 32px tall / 14px padding / 13px text / 8px gap. Variants: primary = #406AE4 fill + 1px #406AE4 + white ink + elev-1 (hover #3055C2); secondary = #1E1E21 + 1px #29292D + #F7F7F8 ink; ghost = transparent, no border, #D3D3D7 ink, hover fill #1E1E21. |
| 2 | **Mount variants (exact)** | /portfolio header: label "New order", size md, primary, NO symbol. /stock/[symbol]: symbol + currentPrice, default label "Trade", size sm, primary. /watchlist DataTable actions column (88px wide, right-aligned): label "" (EMPTY — icon-only), size sm, ghost, wrapped in a stopPropagation span so it does not trigger the row click. /watchlist WatchCard footer: label "Trade", size sm, secondary. /signals SignalsOverview header: label "Trade", size md, primary, no symbol. |
| 3 | **Step 1 — ticket** | Renders QuickTrade with isOpen, initialSymbol, initialEntryPrice and defaultDirection. Full anatomy is the QuickTrade entry: 672px card, #151517 on 1px #29292D, 16px radius, 24px header with a blue Zap tile, the search + BUY/SELL + Market/Limit + price/qty + risk slider + SL/target + P&L strip + CNC/MIS/NRML + Cancel/Place Order pills. |
| 4 | **Step 2 — confirm** | ConfirmDialog: 448px, 8px radius, 20px padding, #151517 on 1px #29292D with elev-1, dialog-in 200ms scaling 0.97→1. Title 16px REGULAR weight "Confirm order". Body 14px #D3D3D7 showing the summary line, a `<br/>`, then 12px #96969E "Real order routed to your connected broker. Market/Limit only." Right-aligned 28px ghost "Cancel" (auto-focused) and primary "Place order", gap 8px, 20px above. |
| 5 | **Step 3 — toast** | Sonner toast mounted app-wide in app/providers.tsx. Success: title `Order placed` (or the lower-cased broker status, e.g. `Order complete`) with description "BUY 35 RELIANCE · #250803000149". Failure: title "Order failed" with the handleApiError string as description. `pending` is cleared in a finally, so the dialog closes either way. |

**Components** — `QuickTrade (components/dashboard/QuickTrade.tsx)` · `ConfirmDialog + Dialog + Button (components/foundation)` · `toast (Sonner re-export from components/foundation/Toast.tsx)` · `api.broker.order / handleApiError` · `numMax (lib/format)` · `BrokerLock (indirectly, inside QuickTrade)` · `icons: Activity`

**States & data.** Two booleans of state: `open` (ticket) and `pending` (the stashed ticket object). The stashed shape is {symbol, direction: 'BUY'|'SELL', quantity, orderType: 'MARKET'|'LIMIT', price?, product: 'CNC'|'MIS'|'NRML'}. The summary string is `${direction} ${quantity} ${symbol} · ${orderType}` plus ` ₹${numMax(price,2)}` ONLY when orderType is LIMIT and a price exists, plus ` · ${product}`. The order routes the SUBMITTED form symbol (data.symbol), not the prop, so the no-symbol variant works via QuickTrade's search. The POST always sends exchange: 'NSE'. SL/SL-M order types are blocked at the form because the ad-hoc /api/broker/order endpoint only accepts Market/Limit. No-broker users hit BrokerLock inside step 1 and never reach step 2.

**Interactions.** Click trigger → QuickTrade opens. Fill and submit → QuickTrade calls onSubmit, which only calls setPending, then QuickTrade closes itself (its own onSubmit-then-onClose path) and the ConfirmDialog opens off the truthy `pending`. Cancel/Escape/outside-click on the confirm discards the ticket entirely — there is no way back to the filled ticket. Confirm → api.broker.order → toast → pending cleared → dialog closes. The confirm button shows "Working…" and both buttons disable while in flight.

**Responsive.** The trigger is inline and inherits its host row: in the /watchlist table it lives in a fixed 88px right-aligned actions cell as an icon-only ghost button. QuickTrade is 672px-capped with no breakpoints (its paired 2-column grids squeeze on phones); the ConfirmDialog is 448px-capped. Sonner toasts stack in the viewport corner.

**Key copy.** Triggers: "Trade" · "New order" · (empty label, icon-only). Confirm title "Confirm order"; summary "BUY 35 RELIANCE · LIMIT ₹2847.6 · MIS"; caution "Real order routed to your connected broker. Market/Limit only."; buttons "Cancel" / "Place order" / "Working…". Toasts: "Order placed" with "BUY 35 RELIANCE · #250803000149", and "Order failed".

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a three-frame dark order-entry flow for an Indian NSE trading app on a #0D0D0E canvas. Frame 1: a portfolio toolbar row with a 32px-tall solid button, 8px radius, filled #406AE4 with white 13px semibold ink and a 16px pulse glyph, labelled "New order", plus a quieter 28px ghost "Trade" button in #D3D3D7 beside it. Frame 2: the order ticket — a 672px card, #151517 fill, 1px #29292D border, 16px radius, over a black 60% scrim with 4px blur; header shows a blue lightning tile and "Quick Trade" 20px bold #F7F7F8 above "Place order in seconds" 14px #D3D3D7; the body shows a filled ticket for TCS — symbol field "TCS", a BUY toggle selected in #10B981-at-20% with a green border, a Limit select, price ₹4102.35 and quantity 24 in Geist Mono, stop ₹4020.00, target ₹4265.00, a three-stat strip reading Potential Profit +₹3,903.60 in #10B981, Potential Loss -₹1,976.40 in #F5808C, Risk:Reward 1:1.98, three pills CNC/MIS/NRML with MIS filled #406AE4, and full-radius "Cancel" and "Place Order" buttons. Frame 3: the confirmation — a 448px panel, 8px radius, 20px padding, #151517 on 1px #29292D, headed "Confirm order" in 16px regular #F7F7F8, body semibold "BUY 24 TCS · LIMIT ₹4102.35 · MIS" then a 12px #96969E line "Real order routed to your connected broker. Market/Limit only.", with right-aligned 28px "Cancel" ghost and "Place order" in #406AE4. In the corner of frame 3 show a small dark toast, 8px radius on #1E1E21 with a 1px #29292D edge: "Order placed" in 13px #F7F7F8 over "BUY 24 TCS · #250803000149" in 12px #96969E, timestamped 03 Aug 2026, 10:42 IST.
```
</details>

---

## `Global — mounted once by GlobalCopilot in root Providers; opens on the `copilot:quota_exhausted` window event after any /api/assistant/chat 429` — CopilotQuotaModal — credits-exhausted upsell

**File** `/Users/rishi/QuantX/frontend/components/CopilotQuotaModal.tsx` · **143 LOC** · **Access** Signed-in only. GlobalCopilot returns null for signed-out users, on "/", and on /login, /signup, /forgot-password, /verify-email, /auth, /onboarding, /admin, /privacy, /terms and /preview-design. Loaded via next/dynamic with ssr: false. Copy branches on tier: free | pro | elite (unknown tiers fall back to free).

**Shell** — Plain conditional render (`if (!open || !usage) return null`) — no portal, no animation. `fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4`, 70% scrim with NO blur, backdrop click closes.

**Purpose.** One shared upgrade modal for every Copilot entry point (the assistant page, the floating platform chat, the stock-dossier copilot) so a 429 'credits exhausted' always surfaces the same tier-aware upsell instead of a raw error.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Card** | `w-full max-w-md` = 448px cap, `.glass-surface` (fill #151517, 1px #29292D, elev-1), `rounded-lg` 16px radius, `p-5` 20px padding, `space-y-4` 16px stack. Light theme: #FFFFFF on 1px #DDE5ED. |
| 2 | **Head row** | `flex items-start gap-3` (12px). A 36×36 circle, fill #406AE4 @10%, 1px #406AE4 @30%, holding a 16px Sparkles glyph in #8FB0FF, shrink-0. Beside it: title 16px semibold #F7F7F8, and body 12px #96969E 4px below. |
| 3 | **Usage panel** | `rounded-xs border border-d-border bg-d-bg-card p-3` — 6px radius (the xs step), 1px #29292D, fill #151517 (visually flush with the card — the panel reads as a bordered inset, not a raised tile), 12px padding. Row 1: `flex justify-between text-[11px] text-d-text-muted` — "Today's usage" left, and "20/20" right in Geist Mono tabular (`font-mono num-display`) in #F7F7F8. Bar 8px below: 6px tall, full radius, track #1E1E21, fill `bg-down/70` = #F5808C at 70% — HARD-CODED to width 100% regardless of actual usage. Caption 8px below at 10px #96969E: "Resets at 00:00 (FREE tier)". |
| 4 | **Actions** | `flex items-center gap-2 pt-1`, two equal-width `py-2` controls at 6px radius (rounded-xs) with 13px labels. "Maybe later" — 1px #29292D, no fill, ink #D3D3D7, hover fill #1E1E21. CTA — a next/link styled `bg-primary text-primary-foreground` = solid #406AE4 with #FFFFFF ink, w500, centred, hover #3055C2, href /pricing. |

**Components** — `next/link` · `dispatchCopilotQuotaExhausted (exported helper firing the CustomEvent)` · `reportUpgradeIntent (lib/reportUpgradeIntent, lazily imported)` · `icons: Sparkles` · `AssistantUsage type: {tier, credits_limit, credits_used, credits_remaining, reset_at}`

**States & data.** Opens purely from a window CustomEvent named `copilot:quota_exhausted` whose detail is the AssistantUsage object; the modal stores it and sets open. Reset time is `new Date(usage.reset_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})`, falling back to the literal string "00:00 UTC" if parsing throws. Three copy sets keyed by lowercased tier. AS-BUILT: the progress bar is always 100% #F5808C — it does not reflect credits_used/credits_limit. There is no loading state, no error state, and no dismissal persistence — the modal re-opens on the next 429.

**Interactions.** Backdrop click or "Maybe later" closes. Clicking the CTA fires reportUpgradeIntent(target, 'copilot_quota_modal') — target 'pro' for free users, 'elite' for pro users, and NOTHING for elite (whose CTA is a neutral "View pricing") — then closes and navigates to /pricing. No Escape handler, no focus trap.

**Responsive.** 448px cap, single column at every width; at 375px it is 343px wide after the 16px container padding. The two footer buttons stay side-by-side at all sizes.

**Key copy.** FREE — title "You've used today's Copilot credits"; body "Free tier is capped at 20 messages per day. Pro unlocks 150 messages/day plus Scanner Lab and unlimited swing signals."; CTA "Upgrade to Pro — ₹999/mo". PRO — "You've hit today's Pro Copilot limit"; "Pro is capped at 150 messages per day. Elite removes the cap and adds AutoPilot, F&O strategies, and Bull/Bear debate."; "Upgrade to Elite — ₹1,999/mo". ELITE — "High Copilot usage today"; "You're at 480 of 500 messages. Credits reset at 00:00. If you need higher limits, contact support."; "View pricing". Shared: "Today's usage", "Resets at 00:00 (FREE tier)", "Maybe later".

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark upgrade-prompt modal, 448px wide, centred over a #0D0D0E AI-chat screen behind a flat black 70% scrim with no blur. Card: fill #151517, 1px #29292D border, 16px radius, 20px padding, 16px vertical rhythm, soft shadow 0 1px 2px rgba(0,0,0,.30) plus 0 4px 12px -6px rgba(0,0,0,.40). Top row with 12px gap: a 36px circle filled #406AE4 at 10% with a 1px #406AE4-at-30% ring holding a 16px sparkle glyph in #8FB0FF; to its right "You've used today's Copilot credits" 16px semibold #F7F7F8, and under it 12px #96969E body copy "Free tier is capped at 20 messages per day. Pro unlocks 150 messages/day plus Scanner Lab and unlimited swing signals." Below, an inset panel at 6px radius with a 1px #29292D border on the same #151517 fill, 12px padding: a row with "Today's usage" 11px #96969E on the left and "20/20" in 11px Geist Mono tabular #F7F7F8 on the right; beneath it a 6px-tall full-radius progress track in #1E1E21 completely filled with #F5808C at 70% opacity; then a 10px #96969E caption "Resets at 00:00 (FREE tier)". Footer: two equal-width buttons at 6px radius and 13px labels — "Maybe later" with a 1px #29292D outline, no fill, #D3D3D7 ink; and "Upgrade to Pro — ₹999/mo" solid #406AE4 with white medium-weight ink. Keep it calm and product-like, no gradients, no glow, no illustration. Provide a light-theme twin: #FFFFFF card, #DDE5ED borders, #1D1D1D ink, #5F6B75 secondary, #B81C22 usage bar.
```
</details>

---

## `Inline gate rendered in place of gated content — inside QuickTrade's body, BrokerPositionsPanel, /autopilot risk-rail card, OiHeatmap and DerivativesAnalysis on /fno and /stock/[symbol]` — BrokerLock — no-broker gate (plain + frosted-preview modes)

**File** `/Users/rishi/QuantX/frontend/components/broker/BrokerLock.tsx` · **103 LOC** · **Access** Authenticated but with no broker whose status is 'connected' (per useBrokerStatus, SWR on /api/broker/connections with a 30s dedupe and revalidateOnFocus off). Consumers typically render null while the status is still loading.

**Shell** — NOT a modal — it takes over its parent's box. It has no fixed positioning, no z-index and no backdrop of its own; when it appears inside QuickTrade it simply replaces the form within that modal's 24px-padded body.

**Purpose.** The 'connect your broker to unlock' surface shown INSTEAD of any feature that needs a live broker feed, rather than rendering empty or erroring data. Per-user broker OAuth is the licence-clean source for live NSE data (SEBI / NSE data-licensing), so the card routes the user to connect their own broker instead of showing uncleared data. In frosted mode it blurs a purely decorative preview behind the lock — shapes only, never fabricated prices.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Plain mode (default)** | `.lg-surface flex flex-col items-center rounded-md p-6 text-center` → 12px radius, 24px padding, centred column, fill #151517, 1px #29292D, elev-1. Light theme: #FFFFFF on 1px #DDE5ED. |
| 2 | **Frosted mode (with children)** | `relative overflow-hidden rounded-md border border-line` (12px radius, 1px #29292D). Behind: an aria-hidden, pointer-events-none, non-selectable `absolute inset-0` layer at 70% opacity with `blur(6px) saturate(0.5)` containing the decorative children rendered TWICE so the blurred 'data behind glass' fills the whole card. In front: an `absolute inset-0` centred column with 16px horizontal padding, fill #0D0D0E @30% and `backdrop-blur-[1.5px]`. |
| 3 | **Lock chip** | 44×44 circle, 12px below itself, 1px #29292D border, fill #151517, holding a 20px Lock glyph in #D3D3D7. |
| 4 | **Headline** | 15px semibold #F7F7F8 — the feature name interpolated into "{feature} needs a connected broker". |
| 5 | **Description** | 4px below, `max-w-sm` (384px) 12.5px with relaxed leading in #96969E. Default when no description is passed: "This uses your live broker feed. Connect a broker to unlock it — your data stays your own." |
| 6 | **CTA** | 16px below: a next/link pill-less button at `rounded-xs` 6px radius, fill #406AE4, `px-3.5 py-1.5` (14px / 6px), 12.5px w500 in #FFFFFF, hover opacity 90%, with a leading 14px Plug glyph — "Connect your broker" → /settings?tab=broker. |
| 7 | **OptionChainPreview (decorative child)** | Exported from the same file and used ONLY behind the frosted glass. `p-3`; header `grid grid-cols-[1fr_auto_1fr] gap-2 border-b border-line pb-1.5` at 9px uppercase wide-tracked #96969E — "Call OI" right-aligned, "Strike" centred with 24px horizontal padding, "Put OI". Then 8 rows in the same 3-column grid with 6px vertical spacing: a right-justified 8px-tall full-radius bar in #10B981 @40% whose widths run 35/60/85/100/75/50/30/55 percent, a 48px centred mono 11px #96969E cell showing literally "•••••" (never a real strike), and a mirrored 8px #F5808C @40% bar using the reversed width list. |

**Components** — `next/link` · `icons: Lock, Plug` · `OptionChainPreview (same file)` · `useBrokerStatus is consumed by the parents, not by BrokerLock itself`

**States & data.** Props: feature (string, required), description (optional string), className (optional), children (optional decorative preview that switches it to frosted mode). No internal state, no data fetching, no loading or error branch — it is a pure presentational gate. Live call sites and their exact copy: QuickTrade → feature "Live trading", description "Placing real orders needs a connected broker. You can still paper-trade without one." · BrokerPositionsPanel → "Live positions" / "Connect your broker to see your live positions and orders." · /autopilot → "AutoPilot" / "Autonomous execution fires live orders through your broker. Connect one to hand it the book." with mt-4 · OiHeatmap → "Live option chain" / "Strike-wise OI, PCR, max pain and support/resistance stream from your own broker. Connect Zerodha, Upstox or Angel to unlock the live chain." with min-h-[320px] and an OptionChainPreview child · DerivativesAnalysis → "Live derivatives data" / "PCR, max pain, OI support/resistance and the RELIANCE option chain stream from your own broker. Connect Zerodha, Upstox or Angel to unlock it." with min-h-[300px] and an OptionChainPreview child.

**Interactions.** Exactly one interactive element: the CTA link to /settings?tab=broker, which fades to 90% opacity on hover. The blurred preview layer is aria-hidden, pointer-events-none and select-none, so it is invisible to assistive tech and inert to the mouse. Nothing is dismissible.

**Responsive.** Fills whatever box its parent gives it and centres its column; the description is capped at 384px so long copy wraps to 2-3 lines on wide cards. Frosted call sites pin a minimum height (320px on the OI heatmap, 300px on derivatives) so the blurred preview always has room. Inside QuickTrade it inherits the 672px modal body width.

**Key copy.** "Live trading needs a connected broker" · "Live positions needs a connected broker" · "AutoPilot needs a connected broker" · "Live option chain needs a connected broker" · "Live derivatives data needs a connected broker" · default description "This uses your live broker feed. Connect a broker to unlock it — your data stays your own." · "Connect your broker" · preview headers "Call OI" / "Strike" / "Put OI" with "•••••" placeholders.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design two dark 'connect your broker' gate cards for an Indian NSE trading app on a #0D0D0E canvas. Card A, plain: 12px radius, 24px padding, fill #151517, 1px #29292D border, soft shadow, contents centred in a column — a 44px circle with a 1px #29292D ring on #151517 holding a 20px padlock in #D3D3D7; 12px below, "Live positions needs a connected broker" in 15px semibold #F7F7F8; 4px under that, 12.5px #96969E copy capped at 384px reading "Connect your broker to see your live positions and orders."; 16px below, a small solid button at 6px radius filled #406AE4 with white 12.5px medium ink, 14px horizontal padding, a 14px plug glyph and the label "Connect your broker". Card B, frosted: same 12px radius and 1px #29292D edge but 320px tall, showing a decorative option-chain grid behind heavy frosted glass — three columns headed "CALL OI", "STRIKE", "PUT OI" in 9px uppercase wide-tracked #96969E over a hairline, then eight rows of horizontal bars, 8px tall and fully rounded, green #10B981 at 40% growing rightward from the left column and red #F5808C at 40% in the right column, with the centre strike cells showing only "•••••" dots in 11px mono — the whole grid at 70% opacity, blurred 6px and desaturated by half, with a #0D0D0E-at-30% veil and 1.5px backdrop blur over it. Centred on that veil, repeat the same padlock circle, the headline "Live option chain needs a connected broker", the copy "Strike-wise OI, PCR, max pain and support/resistance stream from your own broker. Connect Zerodha, Upstox or Angel to unlock the live chain." and the blue "Connect your broker" button. No real prices anywhere in the preview.
```
</details>

---
