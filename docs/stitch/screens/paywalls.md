# Paywall & locked states

> Part of the Quant X as-built screen inventory — see [`../03-SCREEN-INVENTORY.md`](../03-SCREEN-INVENTORY.md)
> for the full index and [`../01-DESIGN-SYSTEM.md`](../01-DESIGN-SYSTEM.md) for every token used below.

**12 surfaces.**

## Family notes

CANONICAL LOCKED-STATE RECIPE (Quant X, as-built)

There is NO shared Paywall component. Locks are per-surface and fall into six named treatments. Pick by asking two questions: (1) is the gate ENTITLEMENT (tier) or DATA-LICENCE (broker)? (2) how much of the surface is gone?

1. REPLACE-THE-PAGE (tier, whole route) — /alerts. PageHeader stays (eyebrow + 40px display H1 + 15px sub), then a `mt-6` EmptyState: radius 12px, fill #1E1E21 (surface-2), NO border, NO shadow, 40px padding, centred. 44x44 circle (fill #151517, 1px #29292D) with a 24px padlock in #96969E; 16/22 semibold title in #F7F7F8; 14/21 body in #D3D3D7 capped at 42ch with inline #8FB0FF links; one Button variant="ai" (fill #1E1E21, 1px #29292D, ink #8FB0FF, h-32px, radius 8px) reading "Upgrade to Pro". The gated body component is NEVER mounted — no gated fetch fires, no fabricated data exists.

2. REPLACE-THE-SECTION (tier, one slot) — /signals/[id] Pressure-test. The section eyebrow is unchanged; the content is swapped for a `.trading-surface` card that IS a link to /pricing: fill #151517, 1px #29292D, radius 12px, elev-1, 20px padding, flex row space-between gap-16px. 13px medium title "{Feature} — Elite", 11px #96969E one-line value prop, and a shrink-0 11px #8FB0FF "Upgrade →". Hover raises the border to #3B3B40 and the shadow to elev-2. Nothing moves.

3. BLUR-OVER + CTA (broker/data-licence) — BrokerLock in children mode. Outer `relative overflow-hidden rounded-md border border-line`. Behind: children rendered TWICE at opacity .70, blur 6px, saturate .50, aria-hidden + pointer-events-none. Front: `absolute inset-0` scrim of page canvas at 30% (#0D0D0E4D) plus backdrop-blur 1.5px, centred. NON-NEGOTIABLE HONESTY RULE: the blurred payload must be DECORATIVE ONLY — OptionChainPreview draws OI bars at fixed ratios [.35 .6 .85 1 .75 .5 .3 .55] and prints "•••••" in the strike column. Never blur real or invented prices.

4. PLAIN LOCK CARD (broker, no honest tease) — BrokerLock without children. `.lg-surface` (fill #151517, 1px #29292D, elev-1) + rounded-md p-6 centred. Same body as #3. Used inside an order modal, in place of a positions table, and beneath a disabled AutoPilot arm button.

Shared lock-card body for #3 and #4: 44x44 circle (1px #29292D, fill #151517) with a 20px padlock in #D3D3D7, mb-12px; 15px semibold headline literally `{feature} needs a connected broker`; 12.5px #96969E body capped max-w-sm; a 6px-radius #406AE4 button, white 12.5px medium, 14px plug glyph, "Connect your broker" → /settings?tab=broker.

5. SOFT CAP (tier, nothing blocked) — /watchlist. Three escalating tells, all optional: (a) the UsageMeter chip in the header description — radius 8px, mono 11px tabular, tone ramps #96969E → #F0A94F at 80% → #F5808C at 100%, and the "Upgrade →" link only appears at ≥80%; (b) a truncation banner at radius 16px with border-highlight/40 + bg-highlight/10 stating the exact overflow ("the first 5 of your 9 symbols"); (c) the primary control disabled with its label swapped to "At cap" and a native title tooltip. Backed server-side by a 402 that produces a toast with an "Upgrade" action.

6. INLINE STRIP / CHIP (tier, partial content) — AIDossierPanel footer band: 1px top hairline, bg-highlight/5, 20/12px padding, 12px padlock in #F0A94F, 11px #D3D3D7 sentence naming exactly which sub-elements are withheld ("the meters, scores, and probabilities"), and an 11px #8FB0FF "See plans". Sibling variant with no meter: a disabled button whose label becomes "Pro required" plus a 9px mono footnote "streams unlock on Pro".

Plus two out-of-band members: the QUOTA MODAL (CopilotQuotaModal — fixed inset-0 z-50 over black/70, 448px panel, radius 16px, a usage bar pinned at 100% in bg-down/70, "Maybe later" vs a solid #406AE4 CTA carrying the price: "Upgrade to Pro — ₹999/mo" / "Upgrade to Elite — ₹1,999/mo") and the CHROME UPSELLS (dismissible ConnectBrokerBanner strip + the always-on gradient sidebar pill).

COLOUR CONVENTION FOR LOCKS. Tier/entitlement locks use HIGHLIGHT #F0A94F (dark) / #9A4D00 (light) for the lock tint, badge, and check bullets, and PRIMARY INK #8FB0FF / #3459C9 for the link itself. Broker/data locks use NEUTRAL grey ink (#D3D3D7 padlock, #96969E body) with a solid PRIMARY FILL #406AE4 button — because connecting a broker is a task, not a purchase. P&L green #10B981 and pink #F5808C are never used for lock chrome, only for the decorative OI bars in the blur payload and for real numbers.

RADIUS BY TREATMENT. Blur-over frame and plain lock card: 12px (radius-md). Replace-the-section card: 12px. EmptyState well: 12px. Quiz banner, current-plan card, usage chip: 8px (radius-sm). Truncation banner and the quota modal panel: 16px (radius-lg). Lock CTA buttons and the quota-modal footer buttons: 6px (radius-xs). Pills, filter chips, TierPanel CTAs, sidebar upgrade: 9999px.

BLUR BUDGET. Per the design system, blur is reserved for floating dismissible surfaces (.glass-float: color-mix(surface-3 86%) + blur(20px) saturate(1.5) + elev-3). BrokerLock's glass mode is the ONE sanctioned exception in the lock family, and even there the numbers are small and deliberate: 6px on the decorative payload, 1.5px on the scrim. Every other lock surface is fully opaque.

WHAT THE SCOPE ASSUMED THAT IS NOT TRUE IN THE CODE. app/stock/[symbol]/page.tsx has NO tier-locked branch — its gating is `brokerConnected &&` around OrderBookCard (the grid simply reflows, VolumeProfilePanel takes lg:col-span-2), a live/eod DataBadge, a Streaming-vs-At-close pill, and one error-string-conditional link inside ChartVisionCard ("Upgrade to Elite for chart vision on any symbol →", shown only when the API error text contains "restricted"). components/charts/LightweightChart.tsx has NO lock branch at all — its only full-bleed overlay is a status scrim at background+'CC' with 13px mono copy for loading / empty / error; the word "paywall" appears solely in a header comment about why TradingView's tv.js embed was dropped. Regenerating either surface with a padlock would be a fabrication.

TOKENS USED THROUGHOUT (verified in app/globals.css). Dark: main #0D0D0E, wrap #151517, wrap-hover/surface-2 #1E1E21, surface-3 #26262A, line #29292D, wrap-line #3B3B40, light/ink #F7F7F8, secondary #D3D3D7, muted #96969E, primary #406AE4, primary-hover #3055C2, primary-text/ai #8FB0FF, up #10B981, down #F5808C, warning/highlight #F0A94F. Light: main #EDF1F4, wrap #FFFFFF, surface-2 #F4F7F9, surface-3 #FFFFFF, line #DDE5ED, wrap-line #C8D4DE, ink #1D1D1D, secondary #4D585F, muted #5F6B75, primary-text/ai #3459C9, up #0A6B50, down #B81C22, warning/highlight #9A4D00. elev-1 = 0 1px 2px rgba(0,0,0,.30), 0 4px 12px -6px rgba(0,0,0,.40); elev-2 = 0 2px 6px rgba(0,0,0,.36), 0 12px 28px -12px rgba(0,0,0,.52); elev-3 = 0 8px 24px -8px rgba(0,0,0,.50), 0 32px 64px -24px rgba(0,0,0,.64).

FILES READ IN FULL: /Users/rishi/QuantX/frontend/app/alerts/page.tsx (387), app/signals/[id]/page.tsx (759), app/stock/[symbol]/page.tsx (703), app/watchlist/page.tsx (526), components/charts/LightweightChart.tsx (719), app/settings/_components/TierPanel.tsx (307), components/broker/BrokerLock.tsx (103), components/CopilotQuotaModal.tsx (143), components/foundation/UsageMeter.tsx (99), components/foundation/EmptyState.tsx, components/foundation/PageHeader.tsx, components/foundation/Button.tsx, components/foundation/EyebrowMono.tsx, components/broker/ConnectBrokerBanner.tsx, components/shell/AppShell.tsx, lib/tierUpsell.ts. Grep-confirmed additional lock/upgrade call sites: components/dashboard/QuickTrade.tsx:261, components/broker/BrokerPositionsPanel.tsx:97, components/fno/OiHeatmap.tsx:75, components/fno/DerivativesAnalysis.tsx:273, app/(platform)/autopilot/page.tsx:740, components/stock/AIDossierPanel.tsx:127, components/stock/ChartVisionCard.tsx:131, components/signals/AutomationPanel.tsx:140-152, app/(platform)/paper-trading/page.tsx:266, components/shell/Sidebar.tsx:220, components/shell/CommandPalette.tsx:248, components/managed/AutopilotCard.tsx:73 ("Go live with Pro"), app/(platform)/strategies/[slug]/page.tsx:124 (tier_required rendered as a Badge, tone muted for free / warning otherwise — a label, not a lock).

---

## `/alerts (Free / non-Pro tier)` — Alerts Studio — full-page Pro paywall (replace-the-page)

**File** `/Users/rishi/QuantX/frontend/app/alerts/page.tsx` · **387 LOC** · **Access** Authenticated, tier=free (tierData.features.alert_studio falsy AND is_admin false). Admins and Pro+ bypass entirely.

**Shell** — AppShell — fixed 240px left sidebar (#151517, 68px when collapsed), fixed 72px right icon rail, main pane lg:ml-60 lg:mr-[72px], inner content mx-auto max-w-[1440px] px-4 md:px-6. ConnectBrokerBanner may sit above. ComplianceFooter always below.

**Purpose.** Free users hitting the Pro-gated `alert_studio` feature get an explicit value-prop paywall INSTEAD of the preferences grid's raw 403/402. The Pro body (`<AlertsStudio/>`) is never mounted, so no gated fetch fires.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Gate 0 — loading** | authLoading \|\| (user && tierLoading): AppShell wraps `div.flex.items-center.justify-center.min-h-[50vh]` containing a single Loader2 at h-6 w-6 (24px), class `text-primary animate-spin`. No skeleton, no copy. |
| 2 | **Gate 1 — unauthenticated** | Wrapper `p-4 md:p-6`. NO PageHeader. Single EmptyState: icon Bell h-6 w-6, title "Sign in to open Alerts Studio", description "Route every signal, fill, and market move to push, Telegram, WhatsApp or email — per event.", action = `<a href="/login"><Button>Sign in</Button></a>` (primary variant → .glass-control-accent, fill #406AE4, white ink). |
| 3 | **Gate 2 — paywall header** | PageHeader: flex-col gap-4, border-b 1px #29292D, px-4 py-5 md:px-6, md:flex-row md:items-end md:justify-between. Eyebrow `font-mono text-[11px] uppercase tracking-[0.1em] text-d-text-muted (#96969E)` = "Notifications". H1 `text-display-sm` = 2.5rem/1.1, letterSpacing -0.02em, font-normal, display family, color #F7F7F8 = "Alerts Studio". Description mt-1 text-sm (#D3D3D7) = "Per-event routing across every channel." No actions slot. |
| 4 | **Gate 2 — paywall body** | `div.mt-6` then EmptyState (size md): role=status aria-live=polite, `rounded-md` 12px, `bg-surface-2` = #1E1E21 dark / #F4F7F9 light, NO border, NO shadow, flex-col items-center gap-3 p-10. |
| 5 | **Paywall icon** | 44×44 (h-11 w-11) grid place-items-center, rounded-full, 1px border #29292D, fill #151517, tone `info` → icon ink #96969E. Icon = Lock at h-6 w-6 (24px). |
| 6 | **Paywall title** | h3, `text-[16px] leading-[22px] font-semibold tracking-[-0.01em] text-d-text-primary` (#F7F7F8): "Alerts Studio is a Pro feature". |
| 7 | **Paywall description** | Container max-w-[42ch]; p `mt-1.5 text-sm leading-[21px] text-d-text-secondary` (#D3D3D7). Rich JSX: "Upgrade to Pro to route each event — signals, fills, drawdown, F&O triggers — to push, Telegram, WhatsApp or email, with per-channel test sends and bulk controls. Per-symbol price alerts stay free on your " + inline `<Link href="/watchlist" className="text-primary hover:underline">watchlist</Link>` (#8FB0FF dark / #3459C9 light) + "." |
| 8 | **Paywall CTA** | `div.mt-1.flex.gap-2` → `<a href="/pricing"><Button variant="ai"><Sparkles h-4 w-4/>Upgrade to Pro</Button></a>`. variant ai = `.glass-control` (fill #1E1E21, 1px #29292D) + ink `var(--color-ai)` #8FB0FF. size md = h-8 (32px), px-3.5, gap-2, text-[13px], rounded-sm 8px, font-semibold, active:scale-[0.98], focus ring 2px. |
| 9 | **Unlocked body (contrast, Pro only)** | PageHeader eyebrow "Notifications · Pro" + description "Route every event to the right channel. Test a channel, tune per-event, or set them all at once."; then `p-4 md:p-6 space-y-6`: 4-up StatTile grid (`grid-cols-2 sm:grid-cols-4 gap-3`) — "Event types", "Channels live" (e.g. 2/4, tone up), "Delivery"=Real-time, "Scope"=Per event; Channels card (CARD = `rounded-sm border border-line bg-wrap p-4`) with `grid sm:grid-cols-2 gap-3` of 4 rows (Push/Telegram/WhatsApp/Email, 36px h-9 w-9 icon tile, Badge Connected\|Not connected, Send test button or `Connect →` link); Bulk controls card (Enable all / Mute all); AlertPreferencesGrid; per-symbol price alerts card linking to /watchlist. |

**Components** — `AppShell` · `PageHeader (foundation)` · `EmptyState (foundation, size md, tone info)` · `Button (foundation, variant=ai / primary)` · `Link (next/link)` · `Lock + Bell + Sparkles icons from @/lib/icons` · `Loader2` · `AlertPreferencesGrid (Pro body only)` · `StatTile / Badge / toast (Pro body only)`

**States & data.** SWR key `user_tier` → api.user.getTier() with revalidateOnFocus:false. hasStudio = Boolean(tierData?.features?.alert_studio || tierData?.is_admin). Three mutually-exclusive early returns in order: spinner → sign-in EmptyState → paywall EmptyState. Only if hasStudio does <AlertsStudio/> mount (which owns the shared SWR key `alerts_preferences`, deduped with AlertPreferencesGrid). No skeleton/blur tease of the grid at all — the locked page has ZERO fabricated data.

**Interactions.** "Upgrade to Pro" → hard nav /pricing (plain <a>, not Link). "watchlist" inline link → /watchlist (client Link). "Sign in" → /login. Button press: scale 0.98, duration-instant, ease-out cubic-bezier(.22,1,.36,1). No dismiss, no blur-reveal, no modal.

**Responsive.** PageHeader stacks vertically below md (768px) and becomes flex-row items-end justify-between at md+. Body wrapper p-4 → md:p-6. EmptyState is always centered with max-w-[42ch] copy so it never exceeds ~42 characters per line; icon and CTA stay centered at every width. Sidebar margins collapse below lg (1024px) where the mobile Topbar + MobileDrawer take over.

**Key copy.** "Alerts Studio is a Pro feature" · "Upgrade to Pro to route each event — signals, fills, drawdown, F&O triggers — to push, Telegram, WhatsApp or email, with per-channel test sends and bulk controls. Per-symbol price alerts stay free on your watchlist." · "Upgrade to Pro" · "Sign in to open Alerts Studio" · "Route every signal, fill, and market move to push, Telegram, WhatsApp or email — per event."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark-mode desktop paywall page for an Indian NSE AI trading terminal. Page canvas #0D0D0E. Fixed 240px left sidebar filled #151517 with a 1px right hairline #29292D; fixed 72px right icon rail on #0D0D0E; the content column between them is capped at 1440px with 24px side gutters. Top of content: a header band with a 1px bottom hairline #29292D and 24px horizontal / 20px vertical padding. Eyebrow in monospace 11px uppercase, letter-spacing 0.1em, colour #96969E, reading NOTIFICATIONS. Under it an H1 in a display grotesque at 40px, line-height 44px, weight 400, letter-spacing -0.02em, colour #F7F7F8, reading Alerts Studio. Sub-line at 15px/24 in #D3D3D7: Per-event routing across every channel. Leave 24px, then a recessed empty-state well: fill #1E1E21, corner radius 12px, absolutely no border and no shadow, 40px padding, everything centred. Inside, a 44×44 circle filled #151517 with a 1px #29292D ring holding a 24px grey padlock glyph in #96969E. Below it a 16px/22 semibold headline in #F7F7F8: Alerts Studio is a Pro feature. Below that a 14px/21 paragraph in #D3D3D7 capped at 42 characters per line: Upgrade to Pro to route each event — signals, fills, drawdown, F&O triggers — to push, Telegram, WhatsApp or email, with per-channel test sends and bulk controls. Per-symbol price alerts stay free on your watchlist, with the word watchlist coloured #8FB0FF as an inline link. Finally a 32px-tall button, radius 8px, fill #1E1E21, 1px border #29292D, 13px semibold label in #8FB0FF with a 16px sparkle glyph: Upgrade to Pro. Critically: show no blurred data and no fake alert grid behind the well — the feature is replaced, not obscured.
```
</details>

---

## `/signals/[id] — "Pressure-test" section, non-Elite branch` — Inline replace-with-card lock (Counterpoint debate, Elite gate)

**File** `/Users/rishi/QuantX/frontend/app/signals/[id]/page.tsx` · **759 LOC** · **Access** Authenticated, tier ∈ {free, pro} and is_admin=false (isEliteUser = tier === 'elite' || isAdmin). Elite/admin get <DebateTranscript> with a live "Run debate" action instead.

**Shell** — AppShell → `div.w-full.p-4 md:p-6`. Page is a 12-col grid: `mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5`, left rail `lg:col-span-8 space-y-5`, right rail `lg:col-span-4 space-y-5`.

**Purpose.** One section of an otherwise-unlocked page is swapped for a single clickable upsell card. This is the lightest lock treatment: same slot, same rhythm, no blur, no modal — a card that IS a link to /pricing.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Section eyebrow** | h3 `text-[11px] uppercase tracking-wider text-d-text-muted mb-2 flex items-baseline gap-2` = "Pressure-test" followed by a 10px `normal-case tracking-normal text-d-text-muted/70` span = "Counterpoint · Bull vs Bear". This eyebrow is IDENTICAL in the locked and unlocked branch. |
| 2 | **Lock card (the whole thing is an <a>)** | `<Link href="/pricing" className="trading-surface flex items-center justify-between gap-4 hover:border-d-border-hover transition-colors">`. `.trading-surface` = background #151517, 1px border #29292D, border-radius 12px (--radius-md), box-shadow elev-1 `0 1px 2px rgba(0,0,0,.30), 0 4px 12px -6px rgba(0,0,0,.40)`, padding 20px, transitions border-color + box-shadow at --dur-fast. Hover: border → #3B3B40 and shadow → elev-2. |
| 3 | **Card left column** | p `text-[13px] font-medium text-d-text-primary` (#F7F7F8) = "Counterpoint debate — Elite". Below, p `mt-0.5 text-[11px] text-d-text-muted` (#96969E) = "7 specialist agents pressure-test this signal Bull vs Bear before you commit." |
| 4 | **Card right affordance** | span `shrink-0 text-[11px] text-primary hover:underline` (#8FB0FF dark / #3459C9 light) = "Upgrade →". Plain text arrow, no icon component. |
| 5 | **Sibling tier copy on same page (right rail)** | Execute panel footnote p `text-[10px] text-d-text-muted` = "Live trade requires Elite + connected broker. Paper-trade is free." — an inline text-only tier disclosure directly under the Paper-trade / Live trade button pair. |
| 6 | **Sibling soft-fail on same page (alerts card)** | Push-alerts card (lg-surface rounded-md p-4). If api.alerts.toggle fails (Pro gate on the alerts matrix), `alertsError` renders p `text-[10px] text-down pt-1` (#F5808C) = "Could not save — open Alerts Studio for full controls." Toggles still render and still flip locally — a degraded, not a locked, control. Footnote: "Global setting — applies to every signal. Full Alerts Studio covers Telegram/WhatsApp/email channels." with "Full Alerts Studio" as a text-primary link to /alerts. |
| 7 | **Unlocked-branch contrast** | isEliteUser === true renders `<DebateTranscript data={debate} loading={debateLoading} onRun={runDebate}/>` in exactly the same slot — an on-demand empty state with a "Run debate" button that calls api.ai.debate(id, {}); failure fires toast.error("Could not run debate"). |

**Components** — `Link (next/link) wrapping a .trading-surface card` · `DebateTranscript (unlocked branch)` · `AppShell, Reveal, ConfirmDialog, DisclaimerFooter` · `LightweightChart (height 520)` · `QuickTrade modal, CalculatorModal` · `NewsIntelligenceCard, ExplanationMarkdown`

**States & data.** tier + isAdmin from api.user.getTier() inside the same effect that loads api.signals.getById(id); failure of the tier call is swallowed (catch {}) so tier stays 'free' — i.e. the LOCK IS THE FAILURE DEFAULT. debate state is null until the Elite user explicitly clicks Run; nothing pre-fetches. Page-level error state renders a separate `lg-surface rounded-md p-4 text-center` card: "Signal unavailable" + reason + a `.glass-control-accent` rounded-full pill "Back to signals".

**Interactions.** Entire card is one click target → /pricing. Hover raises the border from #29292D to #3B3B40 and the shadow from elev-1 to elev-2 (no lift/translate). "Upgrade →" underlines on hover. No dismiss, no tooltip, no blur reveal.

**Responsive.** Below lg (1024px) the 12-col grid collapses to 1 column and this card sits full-width in normal flow between the AI thesis block and NewsIntelligenceCard. The card's internal flex row keeps title-left / "Upgrade →"-right at every width (gap-4, shrink-0 on the CTA), so it never wraps.

**Key copy.** "Counterpoint debate — Elite" · "7 specialist agents pressure-test this signal Bull vs Bear before you commit." · "Upgrade →" · "Live trade requires Elite + connected broker. Paper-trade is free." · "Could not save — open Alerts Studio for full controls."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design one inline upgrade card that sits inside a dark trading-signal detail page for Indian NSE stocks. Context above it: a section eyebrow in 11px uppercase, letter-spacing 0.06em, colour #96969E reading PRESSURE-TEST, followed on the same baseline by a 10px sentence-case grey label reading Counterpoint · Bull vs Bear. 8px below, the card itself: full width of an 8-of-12 column, background #151517, 1px border #29292D, corner radius 12px, 20px padding, a soft shadow of 0 1px 2px rgba(0,0,0,0.30) plus 0 4px 12px -6px rgba(0,0,0,0.40). Lay the card out as a single horizontal row, contents vertically centred, 16px gap, left block flexible and right block fixed. Left block: a 13px medium line in #F7F7F8 reading Counterpoint debate — Elite, and 2px under it an 11px line in #96969E reading 7 specialist agents pressure-test this signal Bull vs Bear before you commit. Right block: an 11px link in #8FB0FF reading Upgrade → with a literal arrow character. Show a hover variant where the border becomes #3B3B40 and the shadow deepens; nothing moves or scales. Surrounding page context for realism: this card sits under a RELIANCE LONG signal header showing ₹2,847.60 entry, ₹2,760.00 stop in #F5808C, ₹3,010.00 target 1 in #10B981, a 1 : 2.35 risk-reward row, and a confidence bar at 78 on a 96px track. Absolutely no blurred fake debate transcript behind the card — the section is replaced by this card, not veiled.
```
</details>

---

## `components/broker/BrokerLock.tsx (children/glass mode) — rendered inside /markets F&O, /stock F&O panels` — Frosted-glass blur-over lock + CTA (BrokerLock glass mode)

**File** `/Users/rishi/QuantX/frontend/components/broker/BrokerLock.tsx` · **103 LOC** · **Access** Authenticated, NO broker connected (useBrokerStatus().isConnected === false) AND the live endpoint returned error/no-data. This is a DATA-LICENCE lock (SEBI/NSE per-user broker OAuth), not a tier paywall.

**Shell** — Rendered in-slot wherever a live-feed panel would go. Call sites pass className min-h-[320px] (OiHeatmap) or min-h-[300px] (DerivativesAnalysis).

**Purpose.** The 'there's data here, unlock it' tease. A DECORATIVE, price-free preview is blurred behind a frosted lock overlay so the user perceives depth of content without any fabricated numbers being shown.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Outer frame** | `relative overflow-hidden rounded-md border border-line` + caller className. Radius 12px, 1px #29292D. No fill of its own — the blurred layer supplies it. |
| 2 | **Blur layer (behind)** | `aria-hidden pointer-events-none absolute inset-0 select-none opacity-70 blur-[6px] saturate-[0.5]`. Children are rendered TWICE consecutively so the blurred tease fills the full card height. |
| 3 | **Frosted overlay (front)** | `absolute inset-0 flex flex-col items-center justify-center bg-main/30 backdrop-blur-[1.5px] px-4 text-center`. Scrim = page canvas #0D0D0E at 30% opacity plus a 1.5px backdrop blur on top of the already-6px-blurred preview. |
| 4 | **Lock icon** | 44×44 (h-11 w-11) flex-center circle, 1px border #29292D, fill #151517, mb-3, containing Lock at h-5 w-5 (20px) in #D3D3D7 (text-d-text-secondary). |
| 5 | **Headline** | h3 `text-[15px] font-semibold text-d-text-primary` = `{feature} needs a connected broker` — e.g. "Live option chain needs a connected broker", "Live derivatives data needs a connected broker". |
| 6 | **Body copy** | p `mt-1 max-w-sm text-[12.5px] leading-relaxed text-d-text-muted`. Default fallback: "This uses your live broker feed. Connect a broker to unlock it — your data stays your own." OiHeatmap override: "Strike-wise OI, PCR, max pain and support/resistance stream from your own broker. Connect Zerodha, Upstox or Angel to unlock the live chain." DerivativesAnalysis override (templated): "PCR, max pain, OI support/resistance and the NIFTY option chain stream from your own broker. Connect Zerodha, Upstox or Angel to unlock it." |
| 7 | **CTA** | `<Link href="/settings?tab=broker">` `mt-4 inline-flex items-center gap-1.5 rounded-xs bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:opacity-90`. Radius 6px (--radius-xs), fill #406AE4, white ink. Leading Plug icon h-3.5 w-3.5 (14px). Label "Connect your broker". |
| 8 | **OptionChainPreview (the decorative blur payload)** | `p-3`. Header row `grid grid-cols-[1fr_auto_1fr] gap-2 border-b border-line pb-1.5 text-[9px] uppercase tracking-wider text-d-text-muted`: "Call OI" (right-aligned) · "Strike" (px-6, centered) · "Put OI". Body `mt-1.5 space-y-1.5`, 8 rows from widths [0.35, 0.6, 0.85, 1, 0.75, 0.5, 0.3, 0.55]: left bar `h-2 rounded-full bg-up/40` at width×100% justified right, centre `w-12 text-center font-mono text-[11px] text-d-text-muted` literal "•••••", right bar `h-2 rounded-full bg-down/40` at the MIRRORED width (rows[len-1-i]×100%). NEVER real prices — the strike column is dots by design. |

**Components** — `BrokerLock (default export)` · `OptionChainPreview (named export, decorative only)` · `Lock + Plug icons` · `Link (next/link)`

**States & data.** Call-site condition is identical in both F&O users: `(error || (!isLoading && !data)) && !isConnected` → glass lock. If a broker IS connected but the fetch errored, the surface falls through to an EmptyState tone="error" ("OI heatmap unavailable" + handleApiError + Retry Button) instead. If loading, a Skeleton w=100% h=400px. So the lock only ever wins over a genuinely unauthorised feed.

**Interactions.** Only one target: "Connect your broker" → /settings?tab=broker. The blurred layer is pointer-events-none and aria-hidden so it is invisible to screen readers and unclickable. No dismiss, no 'preview anyway', no partial reveal.

**Responsive.** Fills its grid cell; min-height 320px (OI heatmap) / 300px (derivatives). Body copy capped max-w-sm (384px) and centered, so on narrow columns the paragraph wraps to 3–4 lines and the CTA stays centered. The 3-col preview grid `[1fr_auto_1fr]` keeps the ••••• strike column fixed at 48px while both OI bars flex.

**Key copy.** "Live option chain needs a connected broker" · "Strike-wise OI, PCR, max pain and support/resistance stream from your own broker. Connect Zerodha, Upstox or Angel to unlock the live chain." · "Connect your broker" · "This uses your live broker feed. Connect a broker to unlock it — your data stays your own."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark frosted-glass locked panel for an Indian NSE options terminal, 640×340px, corner radius 12px, 1px border #29292D, overflow hidden. Behind the glass, render a decorative NIFTY 50 option-chain teaser at 70% opacity with a 6px gaussian blur and 50% desaturation: a header strip in 9px uppercase letter-spaced grey #96969E reading Call OI · Strike · Put OI over a 1px #29292D rule, then eight rows on a three-column grid. Each row has a right-justified green horizontal bar in #10B981 at 40% opacity, a fixed 48px centre column showing the literal characters ••••• in 11px monospace grey, and a left-justified pink bar in #F5808C at 40% opacity. Bar widths descend and mirror: 35%, 60%, 85%, 100%, 75%, 50%, 30%, 55%. Never show real strikes or premiums. Over that, a full-bleed scrim of #0D0D0E at 30% opacity with an additional 1.5px backdrop blur, contents centred with 16px side padding. Centre stack: a 44×44 circle filled #151517 with 1px #29292D ring holding a 20px padlock in #D3D3D7; 12px gap; a 15px semibold headline in #F7F7F8 reading Live option chain needs a connected broker; 4px gap; a 12.5px relaxed-leading paragraph in #96969E, max width 384px, reading Strike-wise OI, PCR, max pain and support/resistance stream from your own broker. Connect Zerodha, Upstox or Angel to unlock the live chain; 16px gap; a solid button, radius 6px, fill #406AE4, white 12.5px medium label with a 14px plug glyph, reading Connect your broker.
```
</details>

---

## `components/broker/BrokerLock.tsx (plain mode) — /autopilot, QuickTrade modal, BrokerPositionsPanel` — Plain lock card (BrokerLock default mode)

**File** `/Users/rishi/QuantX/frontend/components/broker/BrokerLock.tsx` · **103 LOC** · **Access** Authenticated, broker NOT connected. Used where there is no honest decorative preview to blur (order tickets, positions tables, autopilot arming).

**Shell** — In-slot: inside the QuickTrade modal body, inside a positions panel, or appended under the AutoPilot arm/kill button row (className="mt-4").

**Purpose.** Same message and CTA as the glass mode, but as a normal opaque L1 card — used when a blurred tease would be dishonest or pointless (an order form, a positions table).

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Card** | `lg-surface flex flex-col items-center rounded-md p-6 text-center` + caller className. `.lg-surface` = background #151517 (--color-wrap), 1px border #29292D (--color-line), box-shadow elev-1. Radius 12px, padding 24px, everything centered. |
| 2 | **Icon / headline / body / CTA** | Identical body to the glass mode: 44×44 circle (border #29292D, fill #151517) with a 20px Lock in #D3D3D7, mb-3; 15px semibold headline `{feature} needs a connected broker`; 12.5px #96969E paragraph max-w-sm; 6px-radius #406AE4 button with 14px Plug glyph, white 12.5px medium label "Connect your broker" → /settings?tab=broker. |
| 3 | **Call site — QuickTrade modal (components/dashboard/QuickTrade.tsx:261)** | Condition `!paperMode && !brokerLoading && !isConnected` — the lock REPLACES the entire order form inside the modal's `p-6 overflow-y-auto max-h-[calc(90vh-140px)]` body. feature="Live trading", description="Placing real orders needs a connected broker. You can still paper-trade without one." |
| 4 | **Call site — BrokerPositionsPanel (components/broker/BrokerPositionsPanel.tsx:97)** | Early return before any table renders. While `statusLoading` the component returns null (no flash of lock). feature="Live positions", description="Connect your broker to see your live positions and orders." |
| 5 | **Call site — AutoPilot (app/(platform)/autopilot/page.tsx:740)** | Rendered BELOW the still-visible arm button and kill switch when `!status.broker_connected` (className="mt-4"), so the disabled control and the explanation are both on screen. The arm button's own label swaps to "Connect broker first". feature="AutoPilot", description="Autonomous execution fires live orders through your broker. Connect one to hand it the book." |

**Components** — `BrokerLock (no children)` · `Lock + Plug icons` · `Link (next/link)`

**States & data.** Driven purely by useBrokerStatus(). Deliberately renders null while the status is still loading so users never see the lock flash and then disappear. Paper mode bypasses it entirely (QuickTrade paperMode=true renders the full form — the virtual ₹10L book needs no broker).

**Interactions.** Single target: "Connect your broker" → /settings?tab=broker. In the QuickTrade case the modal's own X close button remains available above the lock.

**Responsive.** Card is fluid width, centered contents, max-w-sm (384px) body copy. In the modal it sits inside a max-w-2xl-ish dialog; in the positions panel it takes the panel's full width.

**Key copy.** "Live trading needs a connected broker" / "Placing real orders needs a connected broker. You can still paper-trade without one." · "Live positions needs a connected broker" / "Connect your broker to see your live positions and orders." · "AutoPilot needs a connected broker" / "Autonomous execution fires live orders through your broker. Connect one to hand it the book." · "Connect broker first" (arm-button label)

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark opaque lock card that replaces an order form inside a modal for an Indian NSE trading app. Card: background #151517, 1px border #29292D, corner radius 12px, 24px padding, shadow 0 1px 2px rgba(0,0,0,0.30) plus 0 4px 12px -6px rgba(0,0,0,0.40), all contents centred in a vertical stack. Top: a 44×44 circle filled #151517 with a 1px #29292D ring containing a 20px padlock glyph in #D3D3D7. 12px gap. Headline at 15px semibold in #F7F7F8 reading Live trading needs a connected broker. 4px gap. Paragraph at 12.5px with relaxed leading in #96969E, constrained to 384px wide, reading Placing real orders needs a connected broker. You can still paper-trade without one. 16px gap. A solid call-to-action button with 6px corner radius, fill #406AE4, 14px horizontal / 6px vertical padding, a 14px plug glyph then a 12.5px medium white label reading Connect your broker. Show the card sitting inside a modal whose header reads Place order · HDFCBANK at ₹1,672.40 with a 20px close X in #96969E on the right, over a page canvas of #0D0D0E. Also render two sibling variants of the same card, differing only in copy: one headed Live positions needs a connected broker with the body Connect your broker to see your live positions and orders, and one headed AutoPilot needs a connected broker with the body Autonomous execution fires live orders through your broker. Connect one to hand it the book, shown directly under a disabled pill button labelled Connect broker first.
```
</details>

---

## `/watchlist (Free tier at or over cap)` — Soft cap lock — usage meter + truncation banner + disabled control + 402 toast

**File** `/Users/rishi/QuantX/frontend/app/watchlist/page.tsx` · **526 LOC** · **Access** Authenticated, tier=free → api.watchlist.live() returns { cap: 5, count, capped }. Pro/Elite return cap:null so every element below disappears and the description becomes plain text.

**Shell** — AppShell → `div.w-full.pb-8`; PageHeader; body `space-y-5 px-4 py-5 md:px-6`.

**Purpose.** The NON-blocking lock: the page fully renders, but the quota is visible in three escalating places (chip → banner → disabled button) and the overflow is honestly disclosed ("the engines are watching the first 5 of your 9").

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **PageHeader** | eyebrow "AI is watching · Watchlist" (mono 11px uppercase tracking-[0.1em] #96969E), h1 "Watchlist" at text-display-sm 40px/1.1, actions = DataBadge (live\|eod) + ghost Refresh Button with RefreshCw h-4 w-4 + `variant="ai"` Button "Ask AI" with Sparkles. |
| 2 | **Usage meter (in the PageHeader description slot)** | `<UsageMeter used={data.count} cap={data.cap} label={`symbols (${data.tier})`} />`. Renders a single inline chip: `inline-flex items-center gap-1.5 rounded-sm border font-mono text-[11px] tabular-nums px-2 py-0.5`, role=status, aria-label "4 of 5 symbols (free) used". Tone ramp by used/cap: <0.8 muted (fill #1E1E21 via bg-wrap-hover, border #29292D, count ink #96969E); ≥0.8 warning (bg-warning/10, border-warning/30, ink #F0A94F); ≥1.0 down (bg-down/10, border-down/30, ink #F5808C). Content: "4 / 5" + " symbols (free)" in #96969E + (when ≥80%) an "Upgrade" link in #F7F7F8 with hover:underline and a 12px ArrowRight. |
| 3 | **Cap-truncation banner** | Only when `data.capped && data.cap !== null`. `section role="status" flex items-center justify-between gap-3 rounded-lg border border-highlight/40 bg-highlight/10 px-4 py-3`. Radius 16px (--radius-lg). Highlight = #F0A94F dark / #9A4D00 light. Copy p `text-xs text-highlight`: "The engines are watching the first 5 of your 9 symbols. Upgrade to Pro to put every name under watch + unlock regime alerts." Right: Link → /pricing, `inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-highlight hover:underline` = "Upgrade" + ArrowUpRight h-3 w-3. |
| 4 | **Disabled add control** | Add form = `flex items-center gap-2 rounded-full border border-line bg-wrap px-3 py-2` with a 16px Search glyph, a transparent-background input placeholder "Add symbol, e.g. TCS, RELIANCE, HDFCBANK", and a size=sm submit Button. `disabled={adding \|\| !addSymbol.trim() \|\| atCap}` → disabled:opacity-50 disabled:cursor-not-allowed. Label swaps "Add" → "At cap" (hidden below sm) and gains title="Free tier limit of 5 reached. Upgrade to Pro for unlimited." atCap = data.cap !== null && data.count >= data.cap. |
| 5 | **402 toast (server-authoritative)** | If the add still fires and the API returns ApiError status 402: `toast.error('Watchlist limit reached', { description: 'Free tier is capped at 5 symbols. Upgrade to Pro for unlimited.', action: { label: 'Upgrade', onClick: () => window.location.href = '/pricing' } })`. Any other error falls back to toast.error(`Could not add ${sym}`). |
| 6 | **Rest of page (unaffected by the cap)** | KPI strip: `grid grid-cols-2 lg:grid-cols-4 gap-2 rounded-lg border border-line bg-wrap p-2`, each cell `.tile-tint p-4` (fill #1E1E21, radius 12px, NO border) with an 11px #D3D3D7 label and a 22px mono semibold value — Tracked / Bullish / Bearish / Warnings. Then WatchlistDigestCard, a filter chip row (all/bullish/bearish/warnings, active chip = `.glass-control-accent`) plus a Table/Cards toggle in a `rounded-full border border-line bg-wrap p-0.5` segmented control, then the DataTable or the WatchCard grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3`). |

**Components** — `UsageMeter (foundation)` · `PageHeader, Button, Badge, ChangeBadge, DataTable, EmptyState, Reveal, Skeleton, toast (foundation)` · `DataBadge` · `TradeTicketButton` · `WatchCard, WatchlistDigestCard` · `AppShell`

**States & data.** SWR key `watchlist:live` → api.watchlist.live(), refreshInterval 60_000, dedupingInterval 15_000, keepPreviousData true, revalidateOnFocus false. Cap fields: data.cap (5 | null), data.count, data.capped, data.tier. Table columns: Symbol (sticky, sortable, with a "Warn" pill when engines.regime_warning) · LTP (right, mono ₹) · Change (ChangeBadge percent) · Consensus (Badge, tone map bullish→up / bearish→down / mixed→warning / neutral→muted) · Regime (hideOnMobile) · Mood (hideOnMobile, ±0.00 mono, tone at ±0.05) · Signal (hideOnMobile, LONG/SHORT + confidence %) · actions column fixed width 88px.

**Interactions.** Chip "Upgrade" → /pricing (client Link). Banner "Upgrade" → /pricing. Add submit blocked client-side at cap with a native title tooltip; if the server still 402s, a toast with an "Upgrade" action button does a hard window.location redirect. Row click → stockHref(symbol). Filter chips and the Table/Cards toggle are aria-pressed segmented controls.

**Responsive.** PageHeader stacks below md. KPI strip is 2-up below lg, 4-up at lg+. Banner is a flex row that keeps the Upgrade link shrink-0 + whitespace-nowrap so long copy wraps to two lines rather than pushing the CTA off. Add button's text label is `hidden sm:inline` — below 640px it is icon-only, so the "At cap" wording disappears and only the disabled state remains. Table hides Regime / Mood / Signal columns on mobile.

**Key copy.** "The engines are watching the first 5 of your 9 symbols. Upgrade to Pro to put every name under watch + unlock regime alerts." · "At cap" · "Free tier limit of 5 reached. Upgrade to Pro for unlimited." · "Watchlist limit reached" / "Free tier is capped at 5 symbols. Upgrade to Pro for unlimited." · "Add symbol, e.g. TCS, RELIANCE, HDFCBANK"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design the quota-limited state of a dark watchlist page for an Indian NSE trading app on a #0D0D0E canvas, content capped at 1440px with 24px gutters. Header band with a 1px #29292D bottom rule: mono 11px uppercase eyebrow in #96969E reading AI IS WATCHING · WATCHLIST, a 40px display H1 in #F7F7F8 reading Watchlist, and directly beneath it an inline usage chip — 8px radius, fill rgba(240,169,79,0.10), 1px border rgba(240,169,79,0.30), 4px vertical / 8px horizontal padding, 11px tabular monospace reading 5 / 5 in #F0A94F then symbols (free) in #96969E then an Upgrade link in #F7F7F8 with a 12px right arrow. Header right: a small grey EOD data badge, a ghost refresh icon button, and a 32px-tall button with fill #1E1E21, 1px #29292D border, 8px radius and 13px semibold #8FB0FF label reading Ask AI. Body, 20px below: a KPI strip — a #151517 container with 1px #29292D border, 16px radius, 8px padding, holding four inset tiles filled #1E1E21 at 12px radius with 16px padding, each an 11px #D3D3D7 label over a 22px monospace semibold #F7F7F8 number: Tracked 9, Bullish 4, Bearish 2, Warnings 1. Below it a pill-shaped add bar, fully rounded, fill #151517, 1px #29292D, with a 16px search glyph and placeholder Add symbol, e.g. TCS, RELIANCE, HDFCBANK, ending in a disabled 28px button at 50% opacity labelled At cap. Below that a warning banner: 16px radius, fill rgba(240,169,79,0.10), 1px rgba(240,169,79,0.40), 12px/16px padding, 12px #F0A94F copy reading The engines are watching the first 5 of your 9 symbols. Upgrade to Pro to put every name under watch + unlock regime alerts, with a bold 11px Upgrade link and arrow pinned right. Underneath, a dense table with mono uppercase headers Symbol, LTP, Change, Consensus showing RELIANCE ₹2,847.60 +1.24%, TCS ₹4,102.30 −0.38%, HDFCBANK ₹1,672.40 +0.62%, INFY ₹1,558.90 +2.11%, gains in #10B981 and losses in #F5808C.
```
</details>

---

## `/settings?tab=tier (component: app/settings/_components/TierPanel.tsx)` — TierPanel — plan, quiz recommendation, usage cap and upgrade surface

**File** `/Users/rishi/QuantX/frontend/app/settings/_components/TierPanel.tsx` · **307 LOC** · **Access** Authenticated, any tier. is_admin renders an extra Admin chip. Elite hides the primary upgrade CTA entirely (only "Compare plans" remains).

**Shell** — Rendered inside the Settings page's tab body. Root is `div.space-y-6` (24px vertical rhythm) — no page header of its own beyond the local h2 block.

**Purpose.** The canonical plan/upgrade surface: current plan with entitlements, an optional risk-quiz-driven upgrade recommendation with an expandable delta, the Copilot daily cap, and a billing-history placeholder.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Loading** | `flex items-center justify-center min-h-[200px]` with Loader2 `w-5 h-5 text-primary animate-spin` (20px). Returned only while tierInfo is null. |
| 2 | **Section head** | EyebrowMono `font-sans font-semibold uppercase tracking-[0.12em] text-xs text-d-text-muted` mb-2 = "Tier + billing". Then h2 `font-display text-xl font-semibold text-d-text-primary mb-1` (20px) = "Tier + billing" (yes, duplicated). Then p `text-sm text-d-text-muted` = "Your current plan, usage, and upgrade options." |
| 3 | **Quiz recommendation banner (conditional)** | Shown when quizRec exists, recommended_tier !== 'free', tierRank(recommended) > tierRank(current), and not dismissed. `relative rounded-sm border border-highlight/35 bg-highlight/[0.06] px-4 py-3 pr-10` — radius 8px, highlight #F0A94F dark / #9A4D00 light, fill at 6% alpha, border at 35%. Inner `flex flex-wrap items-center justify-between gap-3`. Left: a 32px (w-8 h-8) rounded-full `bg-highlight/[0.14] border border-highlight/40` with Sparkles `w-3.5 h-3.5` in #F0A94F. Text: p 12px semibold #F7F7F8 = "Quiz recommended: " + tier name in text-highlight, plus an 11px muted capitalize span " · moderate risk profile". Under it p `text-[11px] text-d-text-secondary mt-0.5 leading-relaxed` = the risk-aware reason, e.g. "Balanced profile — unlimited swing signals + Scanner Lab give you enough setups per week without overwhelming the watchlist." Then a disclosure button `mt-1 inline-flex items-center gap-1 text-[11px] text-highlight hover:text-d-text-primary` with aria-expanded, label "What changes for you" ⇄ "Hide", plus ChevronDown w-3 h-3 that rotates 180° when expanded. |
| 4 | **Quiz banner — expanded delta + dismiss** | Expanded: `ul.mt-2.ml-11.space-y-1.5`, each li `flex items-start gap-2 text-[11px] text-d-text-secondary leading-relaxed` with CheckCircle `w-3 h-3 text-highlight mt-0.5 shrink-0`. Exactly 3 bullets for free→pro feature_led: "Unlimited swing + intraday signals (vs 1/day on Free)", "Scanner Lab unlocked — 50+ live screeners + Pattern Scanner", "Copilot 50 messages/day + WhatsApp digest"; outcome_led arm swaps to "Stop missing setups — every qualifying breakout reaches you, not just one a day" etc. Top-right of the banner: a `absolute top-2 right-2 p-1 rounded text-d-text-muted hover:text-d-text-primary hover:bg-hover` dismiss button rendering a 12px "×", aria-label "Dismiss recommendation". Far right of the header row: `a href="/onboarding/risk-quiz"` 11px muted = "Retake quiz →". |
| 5 | **Current-plan card** | `rounded-sm border border-line border-l-2 border-l-primary bg-wrap p-5 flex flex-col md:flex-row gap-5` — radius 8px, fill #151517, 1px #29292D, and a 2px LEFT accent stripe in #406AE4. Left column flex-1: baseline row with EyebrowMono "Current plan" plus (is_admin) a chip `text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold` reading "Admin". Plan name in MONO tabular at `text-[28px] font-semibold` #F7F7F8 ("Free" / "Pro" / "Elite"); price in MONO `text-[13px]` #96969E ("₹0" / "₹999/mo" / "₹1,999/mo"). Then `ul.mt-3.space-y-1` of 12px #F7F7F8 items each with CheckCircle `w-3 h-3 text-primary mt-0.5`. |
| 6 | **Plan bullets (exact, per tier)** | free: "1 Alpha Pick / day" · "Copilot 5 messages / day" · "Paper trading + League" · "Watchlist (5 symbols) + Telegram digest". pro: "Unlimited swing + intraday signals" · "Momentum Picks + Scanner Lab" · "Copilot 150 messages / day" · "WhatsApp digest + Alerts Studio" · "AI weekly portfolio review". elite: "AutoPilot (live auto-trader)" · "F&O strategies" · "Counterpoint debate on signals" · "Copilot unlimited". |
| 7 | **Plan card CTAs** | Right column `flex flex-col gap-2 shrink-0 min-w-[180px]`. Primary (hidden when tier==='elite'): `a` with `.glass-control-accent` (fill #406AE4, 1px #406AE4, white ink, elev-1) `inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] font-medium rounded-full active:scale-[0.98]` labelled "Upgrade to Pro" (free) or "Upgrade to Elite" (pro); onClick fires reportUpgradeIntent(target, 'settings_tier_panel'). Secondary: `a` with `.glass-control` (fill #1E1E21, 1px #29292D) same geometry, ink #F7F7F8, label "Compare plans". Both href /pricing. |
| 8 | **Copilot usage card** | `rounded-sm border border-line bg-wrap p-5`. EyebrowMono mb-2 "Copilot usage today". Baseline row: MONO `text-[24px] font-semibold` #F7F7F8 = copilot_daily_cap (e.g. 5 / 150), then an 11px #96969E span "messages / day cap". Footnote p `text-[11px] text-d-text-muted mt-2` = "Resets every 00:00 UTC. Exceeding the cap returns an upgrade prompt — no account penalty." |
| 9 | **Billing history card** | Same shell. EyebrowMono "Billing history" then p `text-[12px] text-d-text-muted` = "Invoice download + Razorpay subscription details — wiring lands with the Razorpay webhook PR." No table, no rows — an honest placeholder. |

**Components** — `EyebrowMono (foundation)` · `Loader2 / Sparkles / CheckCircle / ChevronDown icons` · `MONO token from @/lib/tokens (`[font-family:var(--font-mono)] tabular-nums`)` · `lib/tierUpsell (quizRecCopy, quizRecReason, quizRecDelta, tierRank)` · `lib/abVariant + reportExposure` · `lib/reportUpgradeIntent` · `lib/quizRecDismiss`

**States & data.** Props: tierInfo {tier, is_admin, copilot_daily_cap} | null (parent inits null), onLoad, setMessage, quizRec {recommended_tier, risk_profile} | null. Effect fetches api.user.getTier() when tierInfo is null; failure sets a message 'Failed to load tier info'. ALL hooks (recDismissed, recExpanded, recVariant + its effect) run BEFORE the `if (!tierInfo)` spinner return — a documented past crash was 'Rendered more hooks than during the previous render'. A/B: getVariant('quiz_rec_delta_copy', ['feature_led','outcome_led'], uid) with EXPERIMENT_EXPOSED tagged by current_tier. Dismissal is per-session and shared with /pricing via lib/quizRecDismiss.

**Interactions.** "What changes for you" toggles the 3-bullet list and, on EXPAND only, fires reportUpgradeIntent(tier, 'quiz_rec_what_changes', variant); chevron rotates 180°. "×" dismisses the banner for the session (also mutes it on /pricing). "Retake quiz →" → /onboarding/risk-quiz. Upgrade CTA → /pricing and reports 'settings_tier_panel' as the funnel source. "Compare plans" → /pricing.

**Responsive.** Plan card is `flex-col` below md (768px) — the plan/bullets stack above the two CTA pills, which go full width of the column; at md+ it is a row with the CTA column pinned at min-width 180px. The quiz banner uses flex-wrap so the "Retake quiz →" link drops below the message block on narrow columns; the expanded bullet list keeps its ml-11 (44px) indent aligning under the text, not the icon.

**Key copy.** "Tier + billing" · "Your current plan, usage, and upgrade options." · "Quiz recommended: Pro · moderate risk profile" · "What changes for you" / "Hide" · "Retake quiz →" · "Upgrade to Pro" / "Upgrade to Elite" / "Manage billing" · "Compare plans" · "Copilot usage today" · "Resets every 00:00 UTC. Exceeding the cap returns an upgrade prompt — no account penalty." · "Invoice download + Razorpay subscription details — wiring lands with the Razorpay webhook PR."

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark settings panel for plan and billing in an Indian trading app, single column, 24px vertical gaps, on canvas #0D0D0E. Block 1: an uppercase 12px semibold eyebrow with 0.12em tracking in #96969E reading TIER + BILLING, a 20px semibold display heading in #F7F7F8 reading Tier + billing, and a 14px #96969E line reading Your current plan, usage, and upgrade options. Block 2, a recommendation banner: 8px radius, fill rgba(240,169,79,0.06), 1px border rgba(240,169,79,0.35), 12px/16px padding with 40px right padding, and a 12px grey × dismiss glyph at top-right. Inside, a 32px circle filled rgba(240,169,79,0.14) with a 1px rgba(240,169,79,0.40) ring holding a 14px sparkle in #F0A94F; beside it a 12px semibold line reading Quiz recommended: Pro with Pro coloured #F0A94F, followed by an 11px grey · moderate risk profile; under it an 11px #D3D3D7 sentence reading Balanced profile — unlimited swing signals + Scanner Lab give you enough setups per week without overwhelming the watchlist; under that an 11px #F0A94F disclosure link What changes for you with a chevron. Pinned right, an 11px grey link Retake quiz →. Block 3, the current-plan card: 8px radius, fill #151517, 1px border #29292D, plus a 2px left edge stripe in #406AE4, 20px padding, laid out as a row. Left: a 12px uppercase CURRENT PLAN eyebrow, a 28px monospace semibold #F7F7F8 word Free, a 13px monospace #96969E ₹0, then four 12px #F7F7F8 bullets each with a 12px #406AE4 check: 1 Alpha Pick / day, Copilot 5 messages / day, Paper trading + League, Watchlist (5 symbols) + Telegram digest. Right, a 180px-wide stack of two fully rounded 12px-label buttons: a solid #406AE4 white-ink one reading Upgrade to Pro, and a #1E1E21 one with a 1px #29292D border reading Compare plans. Block 4: a matching card with eyebrow COPILOT USAGE TODAY, a 24px monospace 5 beside an 11px grey messages / day cap, and an 11px grey footnote Resets every 00:00 UTC. Block 5: a matching card with eyebrow BILLING HISTORY and one 12px grey placeholder line.
```
</details>

---

## `Global overlay (mounted once at platform layout) — components/CopilotQuotaModal.tsx` — Quota-exhausted upgrade modal (429 credits)

**File** `/Users/rishi/QuantX/frontend/components/CopilotQuotaModal.tsx` · **143 LOC** · **Access** Any authenticated tier; copy branches on usage.tier ∈ {free, pro, elite}. Elite gets an informational variant with no upgrade telemetry.

**Shell** — Fixed full-viewport overlay above the AppShell. Not routed — event-driven.

**Purpose.** The mid-action lock: the user was already using Copilot when the backend returned 429 'credits exhausted'. A modal (not a page swap) states the cap, shows a maxed usage bar, and offers the tier-appropriate upgrade.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Scrim** | `fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4`. z-index 50. Clicking the scrim closes. |
| 2 | **Panel** | `w-full max-w-md glass-surface rounded-lg p-5 space-y-4` — max width 448px, radius 16px (--radius-lg), `.glass-surface` = fill #151517, 1px border #29292D, shadow elev-1. onClick stopPropagation so inner clicks don't dismiss. |
| 3 | **Head row** | `flex items-start gap-3`. 36px (w-9 h-9) rounded-full `bg-primary/10 border border-primary/30` with Sparkles `w-4 h-4 text-primary`. Then h2 `text-[16px] font-semibold text-d-text-primary` and p `text-[12px] text-d-text-muted mt-1`. |
| 4 | **Copy matrix** | free → title "You've used today's Copilot credits", body "Free tier is capped at 5 messages per day. Pro unlocks 150 messages/day plus Scanner Lab and unlimited swing signals.", cta "Upgrade to Pro — ₹999/mo". pro → title "You've hit today's Pro Copilot limit", body "Pro is capped at 150 messages per day. Elite removes the cap and adds AutoPilot, F&O strategies, and Bull/Bear debate.", cta "Upgrade to Elite — ₹1,999/mo". elite → title "High Copilot usage today", body "You're at 480 of 500 messages. Credits reset at 05:30. If you need higher limits, contact support.", cta "View pricing". |
| 5 | **Usage panel** | `rounded-xs border border-d-border bg-d-bg-card p-3` — radius 6px. Row: 11px #96969E "Today's usage" ↔ `font-mono num-display text-d-text-primary` "5/5". Bar: `mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden` (6px tall track #1E1E21) with an inner fill `h-full bg-down/70` pinned to `width: '100%'` — always full, because the modal only appears at exhaustion. Footnote p `text-[10px] text-d-text-muted mt-2` = "Resets at 05:30 (FREE tier)" (time via toLocaleTimeString 2-digit hour/minute, fallback string '00:00 UTC'). |
| 6 | **Footer actions** | `flex items-center gap-2 pt-1`, two flex-1 controls at `py-2 text-[13px] rounded-xs` (6px radius). Left: button "Maybe later", `text-d-text-secondary border border-d-border hover:bg-hover`. Right: Link, `font-medium bg-primary text-primary-foreground hover:bg-primary-hover text-center` — fill #406AE4, hover #3055C2, white ink — carrying the tier CTA label and href /pricing. |

**Components** — `CopilotQuotaModal + dispatchCopilotQuotaExhausted(usage)` · `Sparkles icon` · `Link (next/link)` · `lib/reportUpgradeIntent`

**States & data.** Listens for window CustomEvent 'copilot:quota_exhausted' carrying AssistantUsage {tier, credits_used, credits_limit, reset_at}. Renders null unless open && usage. Call sites (assistant page, platform-layout floating chat, stock dossier copilot) refetch usage on a 429 and dispatch. On CTA click, if tier !== 'elite', fires reportUpgradeIntent(free→'pro' | pro→'elite', 'copilot_quota_modal') then closes.

**Interactions.** Scrim click closes; panel click does not. "Maybe later" closes without telemetry. CTA navigates to /pricing and reports the quota modal as the funnel source. No ESC handler of its own, no focus trap in the as-built code.

**Responsive.** Panel is `w-full max-w-md` inside a `p-4` scrim, so on phones it is viewport-width minus 32px; the two footer buttons stay side-by-side at flex-1 each at every width.

**Key copy.** "You've used today's Copilot credits" · "Free tier is capped at 5 messages per day. Pro unlocks 150 messages/day plus Scanner Lab and unlimited swing signals." · "Upgrade to Pro — ₹999/mo" · "Upgrade to Elite — ₹1,999/mo" · "Maybe later" · "Today's usage" · "Resets at 05:30 (FREE tier)"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark modal dialog for an Indian AI trading copilot that has run out of daily credits. Full-viewport scrim of black at 70% opacity with 16px padding, dialog centred. Dialog: 448px max width, 16px corner radius, fill #151517, 1px border #29292D, soft shadow, 20px padding, 16px vertical gaps between its three sections. Section one, a top row with 12px gap: a 36px circle filled rgba(64,106,228,0.10) with a 1px rgba(64,106,228,0.30) ring containing a 16px sparkle glyph in #406AE4; beside it a 16px semibold heading in #F7F7F8 reading You've used today's Copilot credits, and under it a 12px #96969E paragraph reading Free tier is capped at 5 messages per day. Pro unlocks 150 messages/day plus Scanner Lab and unlimited swing signals. Section two, an inset usage block: 6px radius, fill #151517 on a slightly darker inset, 1px #29292D border, 12px padding; a row with 11px #96969E text Today's usage on the left and a monospace #F7F7F8 5/5 on the right; below it a 6px-tall fully rounded track in #1E1E21 completely filled with #F5808C at 70% opacity across the full width; below that a 10px #96969E line reading Resets at 05:30 (FREE tier). Section three, two equal-width buttons with 6px radius and 13px labels, 8px apart: on the left a transparent button with a 1px #29292D border and #D3D3D7 label reading Maybe later; on the right a solid #406AE4 button with white medium label reading Upgrade to Pro — ₹999/mo. Show the modal floating over a blurred hint of a dark NIFTY 50 dashboard at #0D0D0E.
```
</details>

---

## `components/stock/AIDossierPanel.tsx — Free-tier footer strip (rendered on /stock/[symbol] Engine Read tab)` — Inline footer upgrade strip (partial-content lock)

**File** `/Users/rishi/QuantX/frontend/components/stock/AIDossierPanel.tsx` · **Access** Authenticated, tier=free (isFree). Pro+ never see the strip; the meters/scores/probabilities render instead.

**Shell** — A full-width bar attached to the bottom edge of an already-rendered dossier card.

**Purpose.** The partial lock: the card still shows real engine output; the strip explains exactly which SUB-ELEMENTS (meters, scores, probabilities) are withheld and links to plans. No blur, no card replacement.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Strip** | `flex items-center justify-between gap-3 border-t border-d-border bg-highlight/5 px-5 py-3` — a 1px top hairline, a 5%-alpha highlight wash (#F0A94F dark / #9A4D00 light), 20px horizontal / 12px vertical padding. It is the last child of the card so it reads as a footer band, not a card of its own. |
| 2 | **Message** | p `flex items-center gap-2 text-[11px] text-d-text-secondary` with a leading Lock `h-3 w-3 text-highlight` (12px). Copy: "Upgrade to " + `<span className="font-semibold text-highlight">Pro</span>` + " to see the meters, scores, and probabilities." |
| 3 | **CTA** | `<Link href="/pricing" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">` = "See plans" + ExternalLink `h-3 w-3`. |
| 4 | **Sibling band in the same card** | Directly above, an honest offline footnote when engines are down: p `border-t border-d-border px-5 py-2 font-mono text-[9px] uppercase tracking-wider text-d-text-muted` = "Offline: {engines} — awaiting a fresh signal run / live feed". Below the free strip, an Elite hook band `flex items-center justify-between gap-3 border-t border-d-border px-5 py-3` with a ModelBadge + "available for the latest signal" and a link into /signals/{id}. |

**Components** — `Lock + ExternalLink icons` · `Link (next/link)` · `ModelBadge (sibling band)`

**States & data.** isFree from the panel's own tier read; the dossier payload `d` still renders every non-gated engine row above the strip. `d.scores` block renders only when scores.length > 0 (so a Pro user with no scores sees neither the block nor the strip).

**Interactions.** "See plans" → /pricing, underlines on hover. Whole strip is NOT clickable — only the link is. Non-dismissible.

**Responsive.** flex row with gap-3; the message p is allowed to wrap and the CTA has no shrink-0, so on very narrow cards the link wraps under the message rather than truncating.

**Key copy.** "Upgrade to Pro to see the meters, scores, and probabilities." · "See plans" · "Offline: {engines} — awaiting a fresh signal run / live feed"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a slim inline upgrade footer band attached to the bottom edge of a dark AI-analysis card in an Indian NSE stock terminal. The card above it is #151517 with 1px #29292D borders and 12px radius, and already shows real engine rows for RELIANCE — e.g. Trend engine BULLISH, Momentum engine 68, Regime NEUTRAL — so the band must read as withheld detail, not a blocked feature. The band: full card width, a 1px top hairline in #29292D, background rgba(240,169,79,0.05), 20px horizontal and 12px vertical padding, contents in a single row, vertically centred, space-between, 12px gap. Left: a 12px padlock glyph in #F0A94F followed by an 11px line in #D3D3D7 reading Upgrade to Pro to see the meters, scores, and probabilities, where the word Pro is semibold and coloured #F0A94F. Right: an 11px link in #8FB0FF reading See plans with a 12px external-link glyph, underlined on hover. Directly above this band show a second, quieter band separated by its own 1px #29292D rule: 9px uppercase monospace with wide tracking in #96969E reading Offline: news_engine · options_engine — awaiting a fresh signal run / live feed. Keep everything opaque — no blur, no scrim, no lock card. The point is that the surrounding analysis stays fully legible and only these three named sub-elements are gated.
```
</details>

---

## `components/foundation/UsageMeter.tsx (used in /watchlist header; designed for signals/day, Copilot credits, Doctor runs)` — Inline usage chip (quota as a badge)

**File** `/Users/rishi/QuantX/frontend/components/foundation/UsageMeter.tsx` · **99 LOC** · **Access** Any capped tier. When the caller's cap is null (Pro/Elite) the chip is not rendered at all.

**Shell** — Inline element — sits inside a PageHeader description slot, a card header, or beside a label.

**Purpose.** The smallest lock treatment in the system: a single-line badge that shows consumption against a tier cap and only surfaces the Upgrade link once the user crosses 80%.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Chip** | `span role="status"` `inline-flex items-center gap-1.5 rounded-sm border font-mono text-[11px] tabular-nums`; compact (default) `px-2 py-0.5`, non-compact `px-2.5 py-1`. Radius 8px. aria-label "{used} of {cap} {label} used". |
| 2 | **Tone ramp (pct = used/cap)** | pct < 0.8 → muted: fill `bg-wrap-hover` #1E1E21, border `border-line` #29292D, count ink `text-d-text-muted` #96969E. pct ≥ 0.8 → warning: fill `bg-warning/10`, border `border-warning/30`, count ink #F0A94F (dark) / #9A4D00 (light). pct ≥ 1.0 → down: fill `bg-down/10`, border `border-down/30`, count ink #F5808C (dark) / #B81C22 (light). Note the cap edge case: cap 0 forces pct = 1 (down). |
| 3 | **Content** | Count span "{used} / {cap}" in the tone ink, then a label span in `text-d-text-muted` (e.g. "symbols (free)"), then — only when upgradeVisible — a Link `ml-1 inline-flex items-center gap-0.5 text-d-text-primary hover:underline` reading "Upgrade" plus ArrowRight `h-3 w-3`, href defaulting to /pricing. |
| 4 | **Visibility rule** | `upgradeVisible = showUpgrade !== undefined ? showUpgrade : pct >= 0.8` — the CTA is auto-suppressed below 80% so a healthy quota reads as pure information, not an upsell. |
| 5 | **Related inline variant (no meter)** | components/signals/AutomationPanel.tsx uses a text-only equivalent: the stream Button label becomes "Pro required" when !tierAllows (and is disabled), with a footnote in `font-mono text-[9px] uppercase tracking-wider text-d-text-muted` reading "Total allocated 40% · tier free · streams unlock on Pro". |

**Components** — `UsageMeter (foundation)` · `ArrowRight icon` · `Link (next/link)` · `cn util`

**States & data.** Props: used, cap, label, upgradeHref='/pricing', showUpgrade?, compact=true, className. Both used and cap are clamped to ≥0 before the ratio is computed.

**Interactions.** Only the "Upgrade" link is interactive (underline on hover) → /pricing. The chip itself is a status region announced to screen readers.

**Responsive.** A single inline-flex line that never wraps internally; it flows inside whatever text container hosts it. On narrow headers the whole chip wraps as one unit onto its own line.

**Key copy.** "4 / 5 symbols (free) Upgrade →" · "Pro required" (AutomationPanel button) · "streams unlock on Pro"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design three states of one tiny inline usage badge for a dark Indian trading app on a #0D0D0E canvas, each a single line, 8px corner radius, 1px border, 4px vertical and 8px horizontal padding, 11px tabular monospace, contents in a row with 6px gaps. State one, healthy: fill #1E1E21, border #29292D, showing 2 / 5 in #96969E followed by symbols (free) in #96969E, with no call to action at all. State two, near cap at 80 percent: fill rgba(240,169,79,0.10), border rgba(240,169,79,0.30), showing 4 / 5 in #F0A94F followed by symbols (free) in #96969E, then an Upgrade link in #F7F7F8 with a 12px right-arrow glyph. State three, at cap: fill rgba(245,128,140,0.10), border rgba(245,128,140,0.30), showing 5 / 5 in #F5808C followed by symbols (free) in #96969E, then the same Upgrade link. Also show a second family of the same badge with different labels for realism: 1 / 1 alpha picks today, 5 / 5 Copilot messages, 3 / 10 Doctor runs this month. Place one badge in context under a 40px display heading reading Watchlist with a mono uppercase eyebrow AI IS WATCHING · WATCHLIST above it, so the scale relationship is clear. Finally show a text-only sibling variant: a disabled 28px pill button at 50% opacity labelled Pro required, with a 9px uppercase wide-tracked grey footnote under it reading Total allocated 40% · tier free · streams unlock on Pro.
```
</details>

---

## `/stock/[symbol] (e.g. /stock/RELIANCE)` — Stock terminal — as-built gating (broker-conditional modules, NO tier paywall)

**File** `/Users/rishi/QuantX/frontend/app/stock/[symbol]/page.tsx` · **703 LOC** · **Access** Renders for every auth state. IMPORTANT AS-BUILT FINDING: this page has NO tier-locked branch and no paywall. The only gates are (a) broker-connected conditional modules and (b) an error-string-triggered upgrade link inside ChartVisionCard.

**Shell** — NOT wrapped in AppShell — its own root is `div.min-h-screen.bg-main` with an inner `mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6` (1280px cap, narrower than the 1440px AppShell cap).

**Purpose.** Documented here because the scope named it as a locked branch: it isn't one. Stitch should regenerate this page WITHOUT a lock card. The gating that does exist is data-availability, not entitlement.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Gate A — broker-conditional module** | In the Data Modules grid (`grid grid-cols-1 lg:grid-cols-2 gap-4`), FundamentalsCard always spans `lg:col-span-2`. VolumeProfilePanel gets `lg:col-span-2` when NO broker is connected and a normal single column when one is. OrderBookCard renders ONLY when brokerConnected — there is no lock card in its place; the grid simply reflows. Section eyebrow: EyebrowMono "Data Modules" mb-3. |
| 2 | **Gate B — header data-provenance chips** | `<DataBadge mode={brokerConnected ? 'live' : 'eod'} />` sits inline in the price row. Beside it, wsConnected renders a pill `inline-flex items-center gap-1 rounded-full bg-up/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-up` with a 6px `h-1.5 w-1.5 rounded-full bg-up` dot reading "Streaming"; otherwise a plain `font-mono text-[10px] uppercase tracking-[0.08em] text-d-text-muted` reading "At close". |
| 3 | **Gate C — ChartVisionCard restricted-error upgrade link** | components/stock/ChartVisionCard.tsx: on error, a box `rounded-md border border-down/40 bg-down/10 px-3 py-2 flex items-start gap-2` with AlertTriangle `w-3.5 h-3.5 text-down`; the message renders at `text-[12px] text-down`, and IF the error string contains 'restricted' an extra `inline-block mt-1 text-[11px] text-primary hover:underline` Link → /pricing reads "Upgrade to Elite for chart vision on any symbol →". This is the only tier upsell reachable from this page's body. |
| 4 | **Page skeleton (loading)** | `mx-auto max-w-7xl space-y-4 p-4 md:p-6` with Skeletons at w40%/h36px, w60%/h24px, w100%/h520px, then a 2-col grid of two 200px skeletons. |
| 5 | **Header band** | `mb-5 flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-start lg:justify-between`. Breadcrumb above: mono 11px uppercase tracking-[0.08em] #96969E — "Markets" button + 12px ChevronRight + symbol in #D3D3D7. Identity row: SymbolLogo size 40, h1 `heading-display text-3xl md:text-4xl font-semibold tracking-tight`, company name at text-sm secondary, and mono 10px "NSE · Refineries". Price row: `font-mono text-3xl font-semibold tabular-nums` ₹ price, absolute change in text-up/text-down at `text-base`, ChangeBadge percent size sm, DataBadge, streaming pill, and an optional AI-pick button `rounded-full border border-ai/40 bg-ai/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ai` with a 12px Sparkles reading e.g. "Alpha Picks · #3 · LONG". |
| 6 | **Quick stats + 52W strip** | `dl.mt-4.grid.grid-cols-2.sm:grid-cols-3.lg:grid-cols-4.gap-x-6.gap-y-2.5` — Open, Prev Close, Day Range, 52W Range, Volume (+ sub "1.8× avg"), Mkt Cap, P/E, RSI 14 (tone up<30 / down>70). Each: dt mono 9px uppercase tracking-[0.1em] #96969E over dd mono 12px semibold tabular. 52W strip: `mt-3 max-w-md`, labels mono 9px, track `h-1.5 rounded-full bg-surface-2` with a gradient fill `linear-gradient(90deg, var(--color-down), var(--color-highlight), var(--color-up))` at opacity 0.55 and a 3px × 12px marker in #F7F7F8. |
| 7 | **Actions + main sections** | TradeTicketButton, watchlist toggle Button (variant secondary when in list, ghost otherwise; BookmarkCheck in text-up), `variant="ai"` "Ask Copilot", and a ghost Refresh (px-2, spins while loading). Then a 520px-high LightweightChart re-keyed on theme, AITradeDeskCard, a Tabs group (Engine Read · Why It Moves · Forecast, TabsList `w-full overflow-x-auto`, TabsContent pt-5, inner space-y-4 with 2-col and 3-col sub-grids), then Data Modules, then DisclaimerFooter. |

**Components** — `LightweightChart (dynamic, ssr:false, height 520, custom 520px loading shell)` · `AITradeDeskCard, AIDossierPanel, FusionVerdictCard, TechnicalsPanelCard, RelativeStrengthCard, SentimentCard, VolumeIntelCard, ChartVisionCard, TabAiRead, WhyMovingCard, NewsIntelligenceCard, ProbabilityCard, EarningsPreviewCard, FundamentalsCard, VolumeProfilePanel, OrderBookCard` · `Tabs/TabsList/TabsTrigger/TabsContent, Button, ChangeBadge, EyebrowMono, Reveal, Skeleton, DisclaimerFooter (foundation)` · `DataBadge, SymbolLogo, TradeTicketButton, ErrorBoundary`

**States & data.** api.screener.getStockPrice + getTechnicals in parallel on mount and every 30s while the tab is visible; usePriceUpdates WebSocket applies ltp/change/change_percentage ticks on top. SWR `fundamentals:${symbol}` (dedupe 300s) feeds BOTH the header Mkt Cap/P-E and FundamentalsCard so the numbers cannot disagree; market_cap fallback is divided by 1e7 to reach crore. SWR `signals:today` (refresh 60s) drives the AI-pick badge. useBrokerStatus drives Gates A and B. Every panel is wrapped in an ErrorBoundary with a label, so a failing engine degrades to its boundary, never a lock.

**Interactions.** Watchlist toggle is optimistic with rollback on failure plus a toast. "Ask Copilot" dispatches dispatchCopilotOpen(`Give me a full read on RELIANCE: setup, key levels, and risks.`). AI-pick badge routes to /signals/{id}. Refresh re-runs both fetches and spins its icon. Chart remounts via `key={chartTheme}` when the resolved theme flips.

**Responsive.** Header is column below lg then row with items-start justify-between. Quick-stat dl goes 2 → 3 (sm) → 4 (lg) columns. Tab sub-grids are 1-col below lg then 2-col or 3-col. TabsList scrolls horizontally (`w-full overflow-x-auto`) on phones. Chart is fixed 520px tall at every width. Content cap is 1280px (max-w-7xl), not the shell's 1440px.

**Key copy.** "Streaming" / "At close" · "AI engines read RELIANCE" · "Engine Read · Why It Moves · Forecast" · "Data Modules" · "Add to Watchlist" / "In Watchlist" · "Ask Copilot" · "Upgrade to Elite for chart vision on any symbol →" (ChartVisionCard error branch only)

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design the header and data-modules region of a dark single-stock terminal for the NSE, page canvas #0D0D0E, content centred at 1280px with 24px gutters. Breadcrumb: 11px uppercase monospace, 0.08em tracking, #96969E reading MARKETS, a 12px chevron, then RELIANCE in #D3D3D7. Header band with a 1px #29292D bottom rule and 20px bottom padding: a 40px circular company mark, a 36px semibold display H1 in #F7F7F8 reading RELIANCE, a 14px #D3D3D7 name Reliance Industries Ltd, and a 10px uppercase monospace #96969E line NSE · REFINERIES. Price row on one baseline: 30px monospace semibold tabular ₹2,847.60 in #F7F7F8, then +34.85 in #10B981, then a percent badge +1.24%, then a small grey EOD chip, then a fully rounded pill with fill rgba(16,185,129,0.10), a 6px #10B981 dot and 9px uppercase #10B981 text reading STREAMING, then a fully rounded chip with 1px rgba(143,176,255,0.40) border, fill rgba(143,176,255,0.10), 10px uppercase #8FB0FF text and a sparkle reading ALPHA PICKS · #3 · LONG. Below, an eight-cell stat grid at four columns, each a 9px uppercase 0.1em-tracked #96969E label over a 12px monospace semibold #F7F7F8 value: Open ₹2,812.00, Prev Close ₹2,812.75, Day Range ₹2,804.10 – ₹2,861.40, 52W Range ₹2,220 – ₹3,024, Volume 84.2L with sub-line 1.8× avg, Mkt Cap ₹19,26,400 Cr, P/E 24.8, RSI 14 61.4. Under it a 384px-wide 52-week strip: 9px labels 52W POSITION and 78% of range · −5.8% vs high, over a 6px fully rounded #1E1E21 track filled 78% with a left-to-right gradient from #F5808C through #F0A94F to #10B981 at 55% opacity, plus a 3px by 12px white marker at the fill edge. Right-aligned actions: a Trade button, a ghost Add to Watchlist with a bookmark glyph, an Ask Copilot button with fill #1E1E21, 1px #29292D and #8FB0FF label, and a ghost refresh icon. Do not draw any padlock or upgrade card on this page.
```
</details>

---

## `components/charts/LightweightChart.tsx (embedded at /stock/[symbol] and /signals/[id], height 520)` — Chart status scrim — the only overlay (NOT a paywall)

**File** `/Users/rishi/QuantX/frontend/components/charts/LightweightChart.tsx` · **719 LOC** · **Access** Auth-agnostic. AS-BUILT FINDING: there is no tier or broker lock branch in this file. The word 'paywall' appears only in the header comment explaining why TradingView's tv.js embed was replaced. Stitch must NOT draw a lock over the chart.

**Shell** — Self-contained bordered box: `border: 1px solid palette.border; borderRadius: 6; height: 520; width: 100%; display:flex; flexDirection:column`, background = palette.background.

**Purpose.** Documented so the locked-state pass does not invent a chart paywall. The only full-bleed overlay this component renders is a status scrim for loading / empty / error.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Status scrim (the overlay in question)** | Rendered whenever status !== 'ready', inside the chart container: `position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background: palette.background + 'CC'; color: palette.text; fontFamily: var(--font-geist-mono); fontSize: 13; zIndex: 5; textAlign: center; padding: 24`. Copy: "Loading RELIANCE…" / "No price history available for RELIANCE." / "Chart unavailable — {errorMsg}". Dark scrim = #151517CC; light = #FFFFFFCC. |
| 2 | **Row 1 — identity + OHLC legend** | `padding: 8px 12px 4px`, mono 12px, flexWrap, gap 8. Left: symbol in `strongText` (#F7F7F8 dark / #1D1D1D light) at 14px bold; last close "₹2,847.60"; change "+34.85 (+1.24%)" in up/down; then `opacity .5, fontSize 10` "Daily · EOD" (or Weekly/Monthly). Right: a ref-painted legend div at 11px, nowrap, ellipsis, built with DOM nodes only (labels at opacity .55): "O 2812.00  H 2861.40  L 2804.10  C 2847.60 +1.24%  Vol 84.2L" — the C value takes up/down colour. |
| 3 | **Row 2 — toolbar** | `padding: 4px 12px 8px; borderBottom: 1px solid palette.border; flexWrap; gap 6`. Pill style: `padding 2px 8px; fontSize 11; mono; borderRadius 4; lineHeight 18px`; active = fill #406AE4 with #FFFFFF ink and matching border; inactive = transparent with 1px palette.border and palette.text ink. Groups separated by a 1px × 16px divider with 4px side margins: ranges 1W · 1M · 3M · 6M · YTD · 1Y · 2Y · 5Y · ALL \| intervals D · W · M \| types Candles · Line · Area \| an 'EMA' label at opacity .6 then toggles 21 · 50 · 200 styled as fill color+'33', ink = the EMA colour, border color+'80' when on, else transparent with palette.text+'60' ink \| a Log pill \| when a pattern exists, a Pattern pill tinted with crosshair+'33' / crosshair+'80' showing a leading '✓ ' when active. |
| 4 | **Palette (exact, dark)** | background #151517 · text #96969E · grid #FFFFFF0F · border #29292D · primary #406AE4 · crosshair #8FB0FF · up #10B981 · down #F5808C · volumeUp #10B98140 · volumeDown #F5808C40 · ema21 #8FB0FF · ema50 #F0A94F · ema200 #5290F4 · strongText #F7F7F8. |
| 5 | **Palette (exact, light)** | background #FFFFFF · text #5F6B75 · grid #1D1D1D0F · border #D5DEF4 · primary #406AE4 · crosshair #406AE4 · up #0A6B50 · down #B81C22 · volumeUp #0A6B5040 · volumeDown #B81C2240 · ema21 #406AE4 · ema50 #9A4D00 · ema200 #2563EB · strongText #1D1D1D. |
| 6 | **Chart geometry** | Right price scale margins top 0.05 / bottom 0.2; a separate 'volume' scale with margins top 0.85 / bottom 0 (volume occupies the bottom 15%). Time scale rightOffset 4, timeVisible, border palette.border. Crosshair: Normal mode, both lines 1px dashed in the crosshair colour. Pattern overlay price lines: Entry solid in crosshair colour titled "Entry 2847.60"; Stop dashed in down colour titled "Stop 2760.00"; Target dashed in up colour titled "Target 3010.00 · 2.4R"; optional Target 2 dotted in up colour. A marker on the detection bar: arrowUp/belowBar in up colour for bullish, arrowDown/aboveBar in down colour for bearish, text = pattern type with underscores replaced by spaces. |
| 7 | **Host-supplied loading shell (stock page)** | While the dynamic import resolves, /stock/[symbol] renders its own placeholder: `flex h-[520px] w-full items-center justify-center rounded-lg border border-line bg-wrap text-d-text-muted` with an 8px spinner (`border-2 border-primary/30 border-t-primary`) over `font-mono text-[11px] uppercase tracking-wider` copy "Loading chart…". |

**Components** — `lightweight-charts createChart + Candlestick/Line/Area/Histogram series` · `api.screener.getStockHistory (range days + 300 warm-up bars)` · `api.screener.patternsV2Explain` · `qtyCompact formatter`

**States & data.** status ∈ 'loading' | 'ready' | 'empty' | 'error'. Ranges map to days {1W:7, 1M:30, 3M:90, 6M:180, 1Y:365, 2Y:730, 5Y:1825, ALL:7300}, YTD computed from Jan 1; fetch = min(7300, rangeDays + 300) so EMA 200 is warm at the left edge, then the viewport is clamped to the requested window. autoInterval: ALL→M, 5Y→W, else D. Weekly/monthly bars are aggregated client-side (ISO week / YYYY-MM) with OHLC merge and summed volume.

**Interactions.** Every toolbar pill is a state toggle with instant re-render of series data. Crosshair move repaints the OHLC legend by direct DOM writes (no React re-render). Pattern pill hides/shows the price lines and marker; its title attribute carries "double_bottom · entry 2847.60 · stop 2760.00 · target 3010.00".

**Responsive.** autoSize:true — the chart canvas tracks its container. Both toolbar rows use flexWrap with 6–8px gaps, so on narrow columns the range/interval/type/EMA groups wrap onto multiple lines and the box grows internally while the outer height stays at the caller's 520px. The right-hand OHLC legend is nowrap with text-overflow ellipsis so it truncates rather than wraps.

**Key copy.** "Loading RELIANCE…" · "No price history available for RELIANCE." · "Chart unavailable — {message}" · "Daily · EOD" · "Log" · "✓ Pattern" · "Loading chart…" (host placeholder)

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark financial charting module for Indian NSE equities, 520px tall, full width, 6px corner radius, 1px border #29292D, background #151517, monospace throughout. Top row with 8px top / 12px side / 4px bottom padding: on the left, RELIANCE at 14px bold #F7F7F8, then ₹2,847.60 in #F7F7F8, then +34.85 (+1.24%) in #10B981, then at 50% opacity and 10px the text Daily · EOD. On the right, an 11px single-line OHLC legend that truncates with an ellipsis, with labels at 55% opacity: O 2812.00  H 2861.40  L 2804.10  C 2847.60 +1.24% with the C value in #10B981, then Vol 84.2L. Second row with 4px top / 12px side / 8px bottom padding and a 1px #29292D bottom rule, wrapping with 6px gaps: nine range pills 1W 1M 3M 6M YTD 1Y 2Y 5Y ALL, then a 1px by 16px #29292D divider, then D W M, another divider, then Candles Line Area, another divider, then a 60%-opacity EMA label followed by pills 21, 50, 200. Inactive pills are transparent with a 1px #29292D border, 11px #96969E text, 2px by 8px padding and 4px radius; the active range pill 1Y and the active type pill Candles are filled #406AE4 with white text. The EMA pills are tinted by their own colours: 21 in #8FB0FF, 50 in #F0A94F, 200 in #5290F4, each with a 20%-alpha fill and 50%-alpha border. Then a Log pill and a pill reading ✓ Pattern tinted #8FB0FF. Main area: green #10B981 and pink #F5808C candles on a grid of white at 6% opacity, three thin EMA lines in #8FB0FF, #F0A94F and #5290F4, a volume histogram occupying the bottom 15% in the same green and pink at 25% alpha, a dashed #8FB0FF crosshair, and three horizontal price lines with right-edge axis labels: a solid #8FB0FF Entry 2847.60, a dashed #F5808C Stop 2760.00, and a dashed #10B981 Target 3010.00 · 2.4R, plus a small green up-arrow marker below a candle labelled double bottom. Show one alternate state where a #151517 scrim at 80% opacity covers the plot area with centred 13px #96969E text reading No price history available for RELIANCE — this scrim is a data state, never a paywall.
```
</details>

---

## `Global — components/broker/ConnectBrokerBanner.tsx (AppShell) + components/shell/Sidebar.tsx upgrade pill` — Persistent chrome upsells — dismissible broker strip + gradient sidebar CTA

**File** `/Users/rishi/QuantX/frontend/components/broker/ConnectBrokerBanner.tsx` · **25 LOC** · **Access** Banner: authenticated with no broker connected and not dismissed this session. Sidebar pill: always rendered for authenticated users regardless of tier.

**Shell** — Banner is the first child of `<main>` inside AppShell, above the 1440px content gutter — it spans the full main pane. Sidebar pill is pinned in the sidebar footer above the collapse toggle.

**Purpose.** The always-on, low-pressure layer of the lock system: one dismissible strip telling users what a broker unlocks, and one permanent gradient CTA to /pricing in the nav chrome.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **ConnectBrokerBanner** | `flex items-center gap-3 border-b border-line bg-wrap px-4 py-2 text-[12.5px] text-d-text-secondary` — fill #151517, 1px bottom hairline #29292D, 8px vertical padding. Leading Zap `h-4 w-4 shrink-0 text-signature`. Copy: "Connect your broker to unlock " + `<span className="text-d-text-primary">live data</span>` + " and live trading. Until then you're on the virtual ₹10L portfolio." Right: Link → /settings#broker, `shrink-0 rounded-xs bg-primary px-3 py-1 font-medium text-primary-foreground hover:bg-primary-hover` (6px radius, #406AE4 fill, hover #3055C2, white ink) reading "Connect". Then a dismiss button with X `h-4 w-4`, aria-label "Dismiss", `text-d-text-muted hover:text-d-text-primary`. Returns null while broker status is loading, when connected, or once dismissed (component-local state — returns on reload). |
| 2 | **Sidebar upgrade pill** | Wrapper `border-t border-line p-2`. Link → /pricing with `cta-gloss bg-gradient-cta flex items-center gap-2 rounded-full font-semibold text-primary-foreground hover:opacity-90`. Gradient: the Tailwind token `linear-gradient(180deg, #5290F4 0%, #406AE4 55%, #3055C2 100%)` (the CSS var --gradient-cta is `linear-gradient(110deg, #3B82F6 0%, #406AE4 100%)`). `.cta-gloss` box-shadow = `inset 4px 4px 8px rgba(255,255,255,.3), inset -4px -4px 8px rgba(255,255,255,.3), 0 8px 16px rgba(58,119,229,.5)`. Expanded: `px-3 py-2.5 text-[13px]` with Sparkles h-4 w-4 + label "Upgrade". Collapsed: `h-10 justify-center`, icon-only at 18px, title="Upgrade". |
| 3 | **Command palette entry** | components/shell/CommandPalette.tsx:248 — for non-Elite users the palette appends an action `{ label: 'Upgrade plan', hint: 'Pro · Elite' }` that routes to /pricing. Same upsell, keyboard surface (⌘K). |
| 4 | **Right rail entry** | components/shell/RightRail.tsx:56 — an icon RailLink to /pricing labelled "Help & plans" with a HelpCircle glyph. |
| 5 | **Related in-page nudge (paper trading)** | app/(platform)/paper-trading/page.tsx: after 30+ days of paper trading, a two-CTA row — a `.glass-control-accent` rounded-full pill "Connect broker" with Zap w-3.5 h-3.5 → /settings?tab=broker, and a `.glass-control` rounded-full pill "Upgrade to Elite" with ArrowUpRight w-3 h-3 → /pricing — under the heading "You've paper-traded for 30+ days" and body "Ready to switch to live? Connect your broker and let the AI run the same signal stack on real capital, with risk-gated sizing and a kill-switch." |

**Components** — `ConnectBrokerBanner` · `Sidebar upgrade pill (.cta-gloss + .bg-gradient-cta)` · `CommandPalette action` · `RightRail link` · `useBrokerStatus hook` · `Zap / X / Sparkles icons`

**States & data.** Banner driven entirely by useBrokerStatus(); dismissal is component state (not persisted). Sidebar collapse state persists under localStorage key `quantx.sidebar.collapsed.v2`.

**Interactions.** Banner: "Connect" → /settings#broker; X sets local dismissed=true and unmounts the strip for the session. Sidebar pill: hover drops opacity to 90%; collapsed state shows a native title tooltip. ⌘K opens the palette where "Upgrade plan" is one row.

**Responsive.** Banner is a single flex row; the message span is `min-w-0 flex-1` so it truncates/wraps while the Connect button and X stay shrink-0 — it never breaks onto two rows on desktop and wraps gracefully on phones. Sidebar pill switches between a 40px icon-only circle-pill (collapsed, 68px rail) and a full-width labelled pill (expanded, 240px rail); the sidebar itself is hidden below lg where the MobileDrawer takes over.

**Key copy.** "Connect your broker to unlock live data and live trading. Until then you're on the virtual ₹10L portfolio." · "Connect" · "Upgrade" · "Upgrade plan / Pro · Elite" · "Help & plans" · "You've paper-traded for 30+ days"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design two persistent upsell elements for a dark Indian trading app. First, a full-width notification strip that sits directly under the app header: background #151517, a 1px bottom hairline #29292D, 16px horizontal and 8px vertical padding, contents in one row with 12px gaps. A 16px lightning glyph in #8FB0FF, then a 12.5px line in #D3D3D7 reading Connect your broker to unlock live data and live trading. Until then you're on the virtual ₹10L portfolio, where the words live data are #F7F7F8. Pinned right, a solid button with 6px radius, fill #406AE4, 12px horizontal / 4px vertical padding and a white medium label reading Connect, then a 16px grey dismiss X in #96969E. Second, a sidebar upgrade pill pinned at the bottom of a 240px navigation rail that is filled #151517 with a 1px right hairline #29292D. Above the pill, a 1px #29292D divider and 8px padding. The pill itself is fully rounded, filled with a vertical gradient from #5290F4 at the top through #406AE4 at 55% to #3055C2 at the bottom, with a glossy inner bevel of white at 30% opacity on both the top-left and bottom-right diagonals and a blue outer glow of rgba(58,119,229,0.5) offset 8px down with 16px blur. Label: a 16px white sparkle glyph plus 13px semibold white text reading Upgrade, with 12px horizontal and 10px vertical padding. Also show the collapsed variant on a 68px rail: the same gradient pill as a 40px-tall centred capsule containing only an 18px white sparkle. Surrounding nav items above should be quiet 13px #D3D3D7 rows such as Home, Signals, Watchlist, Portfolio, Markets so the gradient pill is clearly the only saturated element in the rail.
```
</details>

---
