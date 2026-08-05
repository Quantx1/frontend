# Settings — every section

> Part of the Quant X as-built screen inventory — see [`../03-SCREEN-INVENTORY.md`](../03-SCREEN-INVENTORY.md)
> for the full index and [`../01-DESIGN-SYSTEM.md`](../01-DESIGN-SYSTEM.md) for every token used below.

**24 surfaces.**

## Family notes

SCOPE COVERAGE: 24 entries — the settings shell (header + 220px tab rail + message banner), its three non-content states (loading.tsx skeleton, error.tsx boundary, auth spinner + signed-out EmptyState), all eight real tab sections, the two rail rows that are not tabs (whatsapp, security), the five broker credential/consent modals, the two destructive ConfirmDialog variants, and the five standalone components (BrokerConnectTile, ModePanel, AlertPreferencesGrid, WatchlistPinsPanel — TierPanel / KillSwitchPanel / DataPanel ARE the tier / kill_switch / data sections, so they are documented under those routes rather than duplicated).

VALID_TABS, verbatim from app/settings/page.tsx:61-62:
  type TabKey = 'profile' | 'trading' | 'broker' | 'notifications' | 'appearance' | 'tier' | 'kill_switch' | 'data'
  const VALID_TABS: TabKey[] = ['profile', 'trading', 'broker', 'notifications', 'appearance', 'tier', 'kill_switch', 'data']

THE REDIRECT DEAD ENDS. middleware.ts RETIRED_ROUTE_REDIRECTS (lines 29-31) 301s three URLs into the settings page:
  '/login/mfa':          '/settings?tab=security'
  '/settings/security':  '/settings?tab=security'
  '/settings/whatsapp':  '/settings?tab=channels'
Neither 'security' nor 'channels' appears in VALID_TABS. The mount effect reads window.location.hash first, falls back to the ?tab= query, and applies the value only when VALID_TABS.includes(candidate) — so both parameters are discarded and activeTab stays at its 'profile' default. All three redirects therefore land the user silently on Profile, with no toast, no error and no rail highlight on the row they clicked. There is no app/settings/security or app/settings/whatsapp directory (only page.tsx, loading.tsx, error.tsx and _components/), so the 301 targets are the only implementation of those rows. Note the second inconsistency: the rail's own ids are 'whatsapp' and 'security', but the WhatsApp redirect targets 'channels' — adding 'whatsapp' to VALID_TABS alone would still not resolve that hop.

TOKEN MAP USED THROUGHOUT (dark / light):
  bg-main #0D0D0E / #EDF1F4 · bg-wrap #151517 / #FFFFFF · bg-hover, bg-surface-2, wrap-hover #1E1E21 / #F4F7F9 · border-line #29292D / #DDE5ED · border-wrap-line #3B3B40 / #C8D4DE.
  Ink: d-text-primary #F7F7F8 / #1D1D1D · d-text-secondary #D3D3D7 / #4D585F · d-text-muted #96969E / #5F6B75.
  Accent fill #406AE4 (hover #3055C2, white ink); accent ink `text-primary` #8FB0FF / #3459C9.
  up #10B981 / #0A6B50 · down #F5808C / #B81C22 · warning and highlight both #F0A94F / #9A4D00.
  Radius: rounded-mark 2 · xs 6 · sm 8 · md 12 · lg 16 · full 9999. NOTE the settings page uses rounded-sm (8px) for most cards and inputs, and rounded-lg (16px) for the rail and content panel — KillSwitchPanel is the only section that uses rounded-md (12px) cards.
  Recipes: .glass-control = #1E1E21 + 1px #29292D · .glass-control-accent = #406AE4 fill + 1px #406AE4 + white ink + elev-1 · .glass-control-danger = color-mix(down 12%, wrap) with a 32% down border · .trading-surface = bg-wrap + 1px line + 12px radius + elev-1 + 20px padding.
  MONO = [font-family:var(--font-mono)] tabular-nums (Geist Mono).

CROSS-CUTTING AS-BUILT OBSERVATIONS worth carrying into any regeneration:
1. Two toggle sizes coexist: 48×24 with a 20px knob (master switches: F&O, Trailing SL, Enable Notifications) and 40×20 with a 16px knob (sub-rows: email/push). AlertPreferencesGrid uses a third, 36×20 with a 16px knob.
2. The five broker modals are hand-rolled overlays (fixed inset-0, z-50, rgba(0,0,0,0.70), max-w-md, rounded-sm, 20px padding) with NO Escape handler and NO focus trap; only the two ConfirmDialogs use the Radix Dialog (overlay z-40, content z-50, 448px, animated).
3. Broker errors render twice — once in the page-level banner and once in the broker section's inline strip; modal-submit errors render only in the page banner, behind the still-open modal.
4. notificationForm hardcodes five of six fields on every mount (email_signals/email_trades true, all push false) rather than hydrating them, and handleSaveNotifications persists only notifications_enabled and a derived push_enabled — the two email toggles are decorative.
5. The Notifications 'Telegram bot' row carries an external-link arrow but its onClick is selectTab('notifications'), i.e. it re-selects the current section.
6. WatchlistPinsPanel's undo banner says 'Reverts in {n}s if you don't undo' but the countdown only discards the snapshot; nothing auto-reverts.
7. Appearance body copy calls the third theme option 'System' while ThemeToggle labels it 'Auto'.
8. BrokerConnectTile's outline button style is gated on isConnected only, so an 'expired' broker shows the 'Reconnect' label on the solid blue primary fill.
9. Disconnect success copy interpolates the raw slug: 'angelone disconnected.', 'kotakneo disconnected.'
10. loading.tsx renders max-w-3xl (768px) with a horizontal 4-tab strip and no AppShell, while the real page is max-w-6xl (1152px) with a 220px left rail inside AppShell — the skeleton→content swap visibly reflows. error.tsx is likewise unwrapped.
11. Kill-switch activation is confirmed in two places with different titles and confirm labels ('Close everything' vs 'Flatten & halt'); deactivation is never confirmed in either place.
12. Both DataPanel's 'Delete account…' button and KillSwitchPanel's 4h/12h/24h/48h chips are inert placeholders that ship in the UI.

---

## `/settings` — Settings shell — page header + left section rail

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **1654 LOC** · **Access** Requires a signed-in user. authLoading renders a spinner; !user renders the sign-in EmptyState (both documented separately).

**Shell** — AppShell (3-zone): fixed left sidebar 240px expanded / 68px collapsed on bg-wrap; main pane with lg:ml-60 (or lg:ml-[68px]) and lg:mr-[72px]; fixed 72px right icon rail on bg-main; mobile-only Topbar below lg opens MobileDrawer; content capped at max-w-[1440px] with px-4 md:px-6; ComplianceFooter under every page. Prose font inside the shell is Plus Jakarta Sans via inline style fontFamily: var(--font-app-sans).

**Purpose.** The container every settings section renders inside: AppShell → 1152px centred column → PageHeader → optional global message banner → a two-column grid of a 220px left tab rail and a min-500px content panel. The rail is the only navigation; eight entries switch the inline panel, two route away.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Outer column** | div.mx-auto.max-w-6xl — hard 1152px cap, centred inside the AppShell's 1440px gutter. |
| 2 | **PageHeader** | header, flex-col gap-16px, border-bottom 1px #29292D (light #DDE5ED), padding 20px 16px (md: 20px 24px), md:flex-row md:items-end md:justify-between. h1 = text-display-sm 40px / line-height 1.1 / letter-spacing -0.02em, font-weight 400, colour #F7F7F8 (light #1D1D1D), class `truncate`. The title is a span: Settings lucide icon 20×20 in #8FB0FF (light #3459C9) + gap 8px + the word 'Settings'. Description below at 14px/20px in #D3D3D7 (light #4D585F): 'Account, broker links, risk profile, alerts. Tune it once, trade with it daily.' |
| 3 | **Body padding** | div.p-4 md:p-6 — 16px mobile, 24px from md up. |
| 4 | **Global message banner (conditional)** | Above the grid, margin-bottom 24px, padding 16px, border-radius 8px, flex align-center gap 12px. Success: background rgba(16,185,129,0.10) + 1px rgba(16,185,129,0.20), CheckCircle 20×20 #10B981, text #10B981. Error: background rgba(245,128,140,0.10) + 1px rgba(245,128,140,0.20), AlertCircle 20×20 #F5808C, text #F5808C. Light theme swaps to #0A6B50 / #B81C22. |
| 5 | **Two-column grid** | grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 (24px). Below lg the rail stacks above the panel. |
| 6 | **Left rail (aside)** | h-fit, border-radius 16px, 1px #29292D, background #151517 (light #FFFFFF), padding 8px. EyebrowMono label 'Settings' at 12px/16px, font-weight 600, uppercase, letter-spacing 0.12em, colour #96969E, padding 12px left/right, 4px top, 8px bottom. |
| 7 | **Rail nav** | nav.flex.lg:flex-col.gap-0.5 (2px). Horizontally scrollable (overflow-x-auto) below lg, static from lg. Ten buttons in render order: Profile (User), Broker (Wallet), Risk profile (TrendingUp), Appearance (Palette), Notifications (Bell), WhatsApp digest (MessageCircle, href /settings/whatsapp), Security + 2FA (Lock, href /settings/security), Tier + billing (Shield), Kill switch (AlertCircle), Data (Save). |
| 8 | **Rail button** | flex align-center gap 8px, padding 8px 12px, font-size 12px, border-radius 8px, white-space nowrap. Icon 14×14 shrink-0. Active: .glass-control = background #1E1E21 + 1px #29292D, label #F7F7F8, icon #8FB0FF. Inactive: label #D3D3D7, 1px transparent border, hover label #F7F7F8 + background #1E1E21. External rows append ArrowUpRight 12×12 in #96969E. |
| 9 | **Content panel** | border-radius 16px, 1px #29292D, background #151517, padding 24px (md: 32px), min-height 500px. Exactly one section renders inside at a time. |
| 10 | **Section heading pattern (all sections)** | EyebrowMono (12px/16px, 600, uppercase, 0.12em, #96969E) margin-bottom 8px → h2 font-display 20px/28px weight 600 #F7F7F8 margin-bottom 4px → p 14px/20px #96969E. |

**Components** — `AppShell` · `PageHeader` · `EyebrowMono` · `Button` · `EmptyState` · `ConfirmDialog` · `BrokerConnectTile` · `TierPanel` · `KillSwitchPanel` · `DataPanel` · `WatchlistPinsPanel` · `ModePanel` · `AlertPreferencesGrid` · `ThemeToggle` · `toast (sonner)`

**States & data.** activeTab: TabKey, default 'profile'. On mount and on every hashchange, fromUrl() reads window.location.hash first, falls back to ?tab=, and only applies the value if it is in VALID_TABS. selectTab() also writes history.replaceState('#<id>') so sections deep-link. message: {type:'success'|'error', text} drives the banner and is cleared at the start of every save. saving, brokerBusy, dataBusy, killPauseHours (default 24), tierInfo (null until TierPanel fetches), quizRec (best-effort from getOnboardingStatus cache, silent on failure), brokerConnections[] loaded from api.broker.getConnections() when `user` becomes truthy.

**Interactions.** Rail click: entries with href call router.push(); the rest call selectTab() which sets state and rewrites the hash without a navigation. hashchange listener re-reads the URL so back/forward moves between sections. The banner is not auto-dismissed — it persists until the next save clears it. ⌘K opens the AppShell CommandPalette; Esc closes palette and mobile drawer.

**Responsive.** Below lg the grid collapses to a single column and the rail becomes a horizontally scrolling strip of ten pills above the panel. Body padding 16px → 24px at md; panel padding 24px → 32px at md. PageHeader stacks title over actions below md.

**Key copy.** Header description: 'Account, broker links, risk profile, alerts. Tune it once, trade with it daily.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark settings page for an Indian NSE AI trading terminal. Page canvas #0D0D0E. Centre a 1152px column. Top: a header with a 1px bottom rule #29292D, 20px vertical / 24px horizontal padding; a 20px blue #8FB0FF gear icon then the word 'Settings' at 40px, weight 400, letter-spacing -0.02em, colour #F7F7F8; beneath it at 14px #D3D3D7: 'Account, broker links, risk profile, alerts. Tune it once, trade with it daily.' Below, 24px page padding and a green success bar: 16px padding, 8px radius, background rgba(16,185,129,0.10), 1px rgba(16,185,129,0.20), a 20px check icon and the text 'Profile saved.' in #10B981. Under it a two-column grid, 24px gap: left a 220px card, 16px radius, background #151517, 1px #29292D, 8px padding, with a 12px uppercase tracked label 'Settings' in #96969E and ten 12px nav rows, each 8px/12px padding, 8px radius, 14px icon: Profile, Broker, Risk profile, Appearance, Notifications, WhatsApp digest, Security + 2FA, Tier + billing, Kill switch, Data. 'Broker' is selected — fill #1E1E21, 1px #29292D, label #F7F7F8, icon #8FB0FF. 'WhatsApp digest' and 'Security + 2FA' carry a 12px external-arrow glyph in #96969E. Right: an empty 16px-radius panel, #151517, 1px #29292D, 32px padding, minimum 500px tall. Font: Plus Jakarta Sans.
```
</details>

---

## `/settings (route-level loading.tsx)` — Settings — route loading skeleton

**File** `/Users/rishi/QuantX/frontend/app/settings/loading.tsx` · **22 LOC** · **Access** Pre-auth — runs before the client component resolves the user.

**Shell** — None. Renders directly into the layout slot with no AppShell chrome.

**Purpose.** Next.js route-segment loading UI shown while the settings segment streams. Renders bare — it is NOT wrapped in AppShell and its geometry does not match the real page (768px vs 1152px, a horizontal tab strip vs the 220px left rail), so the skeleton→content transition visibly reflows.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Container** | div.mx-auto.max-w-3xl (768px) space-y-6 (24px), padding 32px top/bottom, 24px left/right. |
| 2 | **Title bar** | One Skeleton, width 120px, height 28px, border-radius 6px. |
| 3 | **Tab strip** | flex gap-2 (8px) of four Skeletons, each width 100px, height 36px, border-radius 6px. |
| 4 | **Field stack** | space-y-3 (12px) containing five groups; each group is space-y-2 (8px) with a 120×14px label Skeleton over a full-width 44px-tall Skeleton, both 6px radius. |
| 5 | **Skeleton primitive** | animate-pulse, background rgb(41,41,45 / 0.8) — i.e. #29292D at 80% (light #DDE5ED at 80%). rounded='md' maps to the class rounded-xs = 6px. |

**Components** — `Skeleton`

**States & data.** No data. Static markup, pure CSS pulse animation.

**Interactions.** None. Non-interactive placeholder.

**Responsive.** Fixed 768px max width with 24px gutters at every breakpoint; the four tab blocks sit on one row and can overflow on very narrow viewports since there is no wrap or scroll container.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a loading skeleton screen on a #0D0D0E canvas. Centre a 768px column with 32px top and bottom padding and 24px side padding. Every placeholder block is a soft pulsing grey — fill #29292D at 80% opacity — with 6px corner radius, no border, no text. Top: one small block 120px wide by 28px tall, standing in for a page title. Below it, 24px of space, then a horizontal row of four blocks each 100px wide by 36px tall with 8px gaps, standing in for tabs. Below that, 24px of space, then five stacked field groups spaced 12px apart. Each field group is a 120px by 14px label block, an 8px gap, then a full-width block 44px tall. Nothing else on screen — no sidebar, no header chrome, no icons, no copy. The whole composition should read as a quiet breathing placeholder, all blocks pulsing at the same slow rhythm, on a near-black page. Do not add a spinner, do not add shimmer streaks, do not add any borders or shadows to the blocks.
```
</details>

---

## `/settings (route-level error.tsx)` — Settings — route error boundary

**File** `/Users/rishi/QuantX/frontend/app/settings/error.tsx` · **42 LOC** · **Access** Any.

**Shell** — None.

**Purpose.** Client error boundary for the settings segment. Reports to reportError() with boundary:'route' and the digest, then offers a single reset() retry. Like loading.tsx it renders without AppShell.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Container** | flex, min-height 60vh, centred both axes, padding 24px. Inner block max-width 384px (max-w-sm), text-align center. |
| 2 | **Animated mark** | 80×80px relative box, margin-bottom 24px, auto-centred. Layer 1: inline SVG viewBox 0 0 80 80, circle cx/cy 40 r 36, stroke var(--color-down) = #F5808C (light #B81C22), stroke-width 1.5, stroke-dasharray '6 5', opacity 0.5, animating `spin 8s linear infinite`. Layer 2: absolute inset 8px, border-radius 9999px, background rgba(245,128,140,0.10), blur-sm. Layer 3: centred exclamation mark '!' at 30px (text-3xl), font-weight 700, colour #F5808C. |
| 3 | **Headline** | h2, 18px (text-lg), font-weight 700, colour #F7F7F8, margin-bottom 8px: 'Something went wrong'. |
| 4 | **Body** | p, 14px, colour #96969E, margin-bottom 24px: 'An unexpected error occurred.' |
| 5 | **Action** | Single button, .glass-control-accent = background #406AE4, 1px #406AE4, white ink, elev-1 shadow; border-radius 9999px, padding 8px 20px, 14px, font-weight 500; active:scale(0.98). Label 'Try again' → reset(). |

**Components** — `reportError`

**States & data.** Receives `error: Error & { digest?: string }` and `reset: () => void`. useEffect fires reportError({error, boundary:'route', digest}) once per error identity. The error message itself is never shown to the user.

**Interactions.** 'Try again' calls reset(), which re-renders the segment. No secondary escape route is offered — no link back to the app.

**Responsive.** Single centred column at all widths; 384px content cap, 24px padding, 60vh minimum height.

**Key copy.** 'Something went wrong' / 'An unexpected error occurred.' / 'Try again'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a minimal full-page error state on a near-black #0D0D0E canvas, content centred vertically in at least 60% of the viewport height with 24px padding. The content column is 384px wide, centre-aligned. At the top, an 80 by 80 pixel circular mark: a thin 1.5px dashed ring in salmon-red #F5808C at 50% opacity with a 6px dash and 5px gap, slowly rotating; inside it a soft blurred red glow at 10% opacity filling the middle; and dead-centre a bold exclamation mark '!' at 30px in #F5808C. Leave 24px below the mark. Then a headline at 18px, weight 700, colour #F7F7F8: 'Something went wrong'. Then at 14px in muted grey #96969E: 'An unexpected error occurred.' Leave 24px, then a single pill button, fully rounded, filled solid blue #406AE4 with white 14px medium label 'Try again', 8px vertical and 20px horizontal padding, with a subtle drop shadow. No sidebar, no header, no error codes, no stack trace, no secondary link. The whole page should feel calm and sparse, not alarming — one mark, two lines, one button.
```
</details>

---

## `/settings (no session)` — Settings — signed-out gate + auth spinner

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **26 LOC** · **Access** authLoading = true → spinner. authLoading = false and !user → EmptyState. There is no redirect; middleware handles gating when Supabase is configured, so the page is browsable unauthenticated.

**Shell** — AppShell (both states).

**Purpose.** Two pre-content states rendered inside AppShell before any section can appear: a full-height spinner while AuthContext resolves, and a recessed EmptyState with a single sign-in action when there is no user.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Auth spinner** | div.flex, min-height 70vh, full width, centred both axes. Loader2 icon 32×32 (w-8 h-8) in #8FB0FF (light #3459C9), animate-spin. Nothing else renders — no header, no rail. |
| 2 | **Signed-out container** | div.p-4 md:p-6 — 16px, 24px from md. |
| 3 | **EmptyState well** | role=status aria-live=polite. flex column, centred, border-radius 12px, background #1E1E21 (light #F4F7F9), NO border, NO shadow (the .panel-inset nesting rule), gap 12px, padding 40px. |
| 4 | **Icon well** | 44×44px (h-11 w-11) grid centred, border-radius 9999px, 1px #29292D, background #151517, icon tone 'info' = #96969E. Settings lucide glyph at 24×24 (h-6 w-6). |
| 5 | **Title** | h3, 16px / 22px, font-weight 600, letter-spacing -0.01em, colour #F7F7F8, inside a max-width 42ch block: 'Sign in to open Settings'. |
| 6 | **Description** | p, margin-top 6px, 14px / 21px, colour #D3D3D7: 'Your profile, risk profile, broker links, and alerts. All in one place.' |
| 7 | **Action** | margin-top 4px, flex centred. An <a href="/login"> wrapping a default Button: variant primary = .glass-control-accent (#406AE4 fill, white ink, 1px #406AE4, elev-1), size md = height 32px, padding 0 14px, 13px, font-weight 600, border-radius 8px, active:scale(0.98), focus ring 2px. Label 'Sign in'. |

**Components** — `AppShell` · `EmptyState` · `Button`

**States & data.** Driven entirely by useAuth(): { user, profile, loading: authLoading }. No network calls fire in either state — the broker connections effect is gated on `user`.

**Interactions.** Spinner: none. EmptyState: the single 'Sign in' anchor performs a full navigation to /login. No secondaryAction is passed, so there is exactly one exit.

**Responsive.** Spinner is width-100% and 70vh-min at all sizes. EmptyState pads 16px → 24px at md; the text block is capped at 42 characters so it re-wraps rather than stretching on wide viewports.

**Key copy.** Title 'Sign in to open Settings'; description 'Your profile, risk profile, broker links, and alerts. All in one place.'; button 'Sign in'.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design two states for a signed-out settings page inside a dark trading app shell — a fixed 240px left sidebar on #151517 and a 72px right icon rail, page canvas #0D0D0E. State one: the main pane is empty except for a single 32px blue #8FB0FF circular loading spinner, centred horizontally and vertically in a region at least 70% of the viewport height. Nothing else — no title, no skeleton. State two: with 24px of page padding, a single recessed panel filling the width — 12px corner radius, flat fill #1E1E21, no border and no shadow at all, 40px of interior padding, everything centre-aligned. Inside, top to bottom with 12px gaps: a 44px circle with a 1px #29292D outline and #151517 fill containing a 24px grey #96969E gear icon; a headline at 16px weight 600 in #F7F7F8 reading 'Sign in to open Settings'; a supporting line at 14px in #D3D3D7, wrapped to roughly 42 characters per line, reading 'Your profile, risk profile, broker links, and alerts. All in one place.'; and finally one solid blue #406AE4 button, 32px tall, 8px radius, white 13px semibold label 'Sign in'. Only one button — no ghost or secondary action beside it.
```
</details>

---

## `/settings?tab=profile` — Profile section

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **56 LOC** · **Access** Signed in. This is the fallback section whenever the URL tab/hash is missing or invalid.

**Shell** — Settings shell (220px rail + content panel).

**Purpose.** Identity and trading capital. Four fields in a 2-up grid — three editable, email locked to the auth record — plus a single save.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Section container** | div.space-y-6 (24px between blocks). |
| 2 | **Heading** | EyebrowMono 'Account' (12px, 600, uppercase, 0.12em, #96969E) margin-bottom 8px → h2 font-display 20px/28px weight 600 #F7F7F8 'Profile' → p 14px #96969E 'Who you are and the capital you trade with.' |
| 3 | **Field grid** | grid grid-cols-1 md:grid-cols-2 gap-6 (24px). Reading order: Full Name, Email, Phone, Trading Capital (₹). |
| 4 | **Field: Full Name** | label block 14px weight 500 #D3D3D7 margin-bottom 8px 'Full Name'. input type=text, full width, padding 12px 16px, background #0D0D0E, 1px #29292D, border-radius 8px, text #F7F7F8, placeholder #96969E 'Your full name', focus:border rgba(64,106,228,0.40), no outline. |
| 5 | **Field: Email** | Same box, type=email, value = user.email, disabled, text colour #96969E, cursor not-allowed. No placeholder. |
| 6 | **Field: Phone** | type=tel, placeholder '+91 98765 43210'. |
| 7 | **Field: Trading Capital (₹)** | Label renders the literal rupee glyph: 'Trading Capital (₹)'. input type=number, min 10000, plus the MONO class = font-family var(--font-mono) (Geist Mono) with tabular-nums. Default state value 100000. |
| 8 | **Save** | Foundation Button, variant primary (.glass-control-accent #406AE4 fill, white ink, elev-1), size md (height 32px, padding 0 14px, 13px/600, radius 8px, gap 8px). Leading glyph is Save 16×16, swapped for a spinning Loader2 16×16 while saving. Label 'Save Changes'. disabled={saving} → 50% opacity, no press scale. |

**Components** — `EyebrowMono` · `Button`

**States & data.** profileForm = { full_name, phone, capital }. Hydrated from AuthContext `profile` in an effect: full_name || '', phone || '', capital || 100000. Email is read from `user.email` and never posted. Save calls api.user.updateProfile(profileForm) then refreshProfile(); success sets the banner to 'Profile saved.', failure sets handleApiError(err).

**Interactions.** All three editable inputs are controlled and write on every keystroke; capital coerces through Number(). No client-side validation beyond the number input's min=10000 attribute — the field can still be submitted below it. Save disables the button and swaps the icon for a spinner; the result surfaces in the page-level banner above the grid, not inline.

**Responsive.** Single column below md, two columns from md up. Inputs are always full-width of their cell. The panel's own padding steps 24px → 32px at md.

**Key copy.** 'Who you are and the capital you trade with.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design the Profile pane of a dark settings page for an Indian NSE trading platform. It sits inside a 16px-radius panel, fill #151517, 1px #29292D border, 32px padding. Top: a 12px uppercase letter-spaced label 'ACCOUNT' in #96969E, then a 20px weight-600 heading 'Profile' in #F7F7F8, then a 14px line in #96969E: 'Who you are and the capital you trade with.' Leave 24px. Then a two-column form grid with 24px gaps. Each field has a 14px medium label in #D3D3D7 above an input that is full width, 12px vertical and 16px horizontal padding, 8px corner radius, fill #0D0D0E, 1px border #29292D, text #F7F7F8. Field 1 'Full Name' showing 'Rishi Karthikeyan'. Field 2 'Email' — disabled, greyed text #96969E, showing 'rishikarthikeyan.07@gmail.com'. Field 3 'Phone' showing '+91 98765 43210'. Field 4 'Trading Capital (₹)' — the value renders in a tabular monospace face: '250000'. Leave 24px, then a single solid blue #406AE4 pill-less button with 8px radius, 32px tall, white 13px semibold label 'Save Changes' preceded by a 16px floppy-disk save icon. No other buttons, no card-in-card, no coloured accents besides the blue button.
```
</details>

---

## `/settings?tab=broker` — Broker section — seven-tile connect grid

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **75 LOC** · **Access** Signed in. Connection rows are fetched per user; unauthenticated the effect never runs and every tile shows 'Not connected'.

**Shell** — Settings shell.

**Purpose.** The broker linking hub. Seven brokers split into two labelled groups — three one-click OAuth, four token/credential — each rendered as a BrokerConnectTile, with an inline error strip and an encryption/consent footnote.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Heading** | EyebrowMono 'Broker' → h2 20px/28px 600 'Broker connection' → p 14px #96969E: 'Pick a broker. One-click OAuth links your account. Live trading unlocks once connected, on Elite tier.' |
| 2 | **Inline error strip (conditional)** | Rendered only when message.type === 'error' AND the broker tab is active — so the same error appears twice, once in the page banner and once here. padding 12px, background rgba(245,128,140,0.10), 1px rgba(245,128,140,0.20), radius 8px, flex items-start gap 8px, AlertCircle 16×16 #F5808C with margin-top 2px, text 14px #F5808C. |
| 3 | **Group 1 label** | p, 11px, font-weight 500, uppercase, tracking-wider, colour #96969E: 'Instant · one-click login'. Group wrapper is space-y-3 (12px). |
| 4 | **Group 1 grid** | grid grid-cols-1 md:grid-cols-3 gap-4 (16px). Order from OAUTH_BROKERS: zerodha, upstox, fyers — exactly three, so one full row at md. |
| 5 | **Group 2 label** | Same 11px uppercase style: 'Connect with a token'. |
| 6 | **Group 2 grid** | grid grid-cols-1 md:grid-cols-3 gap-4. Order from TOKEN_BROKERS: angelone, dhan, kotakneo, aliceblue — four tiles in a 3-column grid, so it renders 3 + 1 with the fourth alone on the second row. |
| 7 | **Group spacing** | The two groups sit in a space-y-5 (20px) wrapper. |
| 8 | **Tile help text** | Only Upstox and Fyers receive the `help` prop: 'You'll log in securely on Upstox. We never see your password.' and the identical Fyers wording. Zerodha does not — its reassurance lives in its consent modal. |
| 9 | **Security footnote card** | border-radius 8px, 1px #29292D, background #151517, padding 16px, flex items-start gap 12px. Shield icon 16×16 #96969E with 2px top offset. Two 12px #96969E paragraphs at leading-relaxed, spaced 4px: (1) 'Your credentials are encrypted with AES-256 (Fernet) before they hit storage. Disconnect anytime and stored tokens are wiped.' (2) 'Zerodha, Upstox, and Fyers connect via the official OAuth login — you authorise on the broker's own site and we never see your password. Angel One (SmartAPI), Dhan, Kotak Neo, and Alice Blue connect with API credentials.' |

**Components** — `EyebrowMono` · `BrokerConnectTile` · `OAUTH_BROKERS` · `TOKEN_BROKERS`

**States & data.** brokerConnections: Array<{broker_name, status, account_id, last_synced_at}> from api.broker.getConnections(), loaded when `user` appears and re-loaded after every connect/disconnect. Each tile looks up its own row by broker_name and falls back to status 'not_connected'. brokerBusy holds at most one BrokerName; the matching tile shows a spinner and both its buttons disable.

**Interactions.** Connect routing is per-broker: angelone / dhan / kotakneo / aliceblue open their own credentials modal; zerodha opens a consent modal; upstox and fyers skip any modal — they call api.broker.initiateOAuth(broker), stash resp.state and the broker name in sessionStorage under 'broker_oauth_state' / 'broker_oauth_broker', then assign window.location.href = resp.auth_url. A missing auth_url throws 'No auth URL returned from broker'. Disconnect calls api.broker.disconnect(broker), reloads the list, and banners '<broker> disconnected.' using the raw slug, so the message reads 'angelone disconnected.'

**Responsive.** Single-column tiles below md; three per row from md. Both group grids share the same 16px gutter. The footnote card is always full width.

**Key copy.** Group labels 'Instant · one-click login' and 'Connect with a token'; the AES-256 (Fernet) encryption promise.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a broker-connection pane for an Indian NSE trading app, dark theme, inside a 16px-radius #151517 panel with a 1px #29292D border and 32px padding. Header: 12px uppercase tracked 'BROKER' in #96969E, a 20px weight-600 'Broker connection' in #F7F7F8, then 14px #96969E: 'Pick a broker. One-click OAuth links your account. Live trading unlocks once connected, on Elite tier.' Then a small 11px uppercase letter-spaced label in #96969E: 'Instant · one-click login', and a three-column grid of broker cards with 16px gaps — Zerodha, Upstox, Fyers. Each card: 12px radius, fill #151517, 1px #29292D, 20px padding; top row has a 40px white rounded square holding the broker logo and, on the right, a status pill. Zerodha shows a green 'Connected' pill (#10B981 text on 10% green, fully rounded, 10px) plus an account line 'Account ZD4417 · Last sync 09:18, 5 Aug'; Upstox and Fyers show a grey outlined 'Not connected' pill. Under the name (14px semibold) sits a green 10px '1-click' chip with a lightning bolt, a Beta chip for Fyers, and a 11.5px grey tagline: 'Kite Connect · OAuth', 'Upstox API v2 · OAuth', 'OAuth · API v3'. Card footer: a solid blue #406AE4 'Connect' button, 6px radius, 12px white label with a lightning icon. Below, a second 11px label 'Connect with a token' and a second three-column grid: Angel One, Dhan, Kotak Neo, then Alice Blue wrapping alone onto a second row. Close with a 16px-padded #151517 note card, 8px radius, a grey shield icon, and two 12px #96969E paragraphs about AES-256 (Fernet) encryption and which brokers use OAuth.
```
</details>

---

## `/settings?tab=broker (Angel One modal)` — Broker credentials — Angel One (SmartAPI)

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **83 LOC** · **Access** Signed in.

**Shell** — Full-screen overlay above the Settings shell.

**Purpose.** Four-field credential capture for Angel One. SmartAPI has no OAuth redirect, so the API key, client ID, PIN and TOTP secret are collected directly and posted to api.broker.connect(). The only one of the five forms with a 2-up field grid.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Overlay** | position fixed, inset 0, z-index 50, flex centred, background rgba(0,0,0,0.70), padding 16px. Click on the backdrop closes the modal unless brokerBusy is set. No blur is applied — this is a flat scrim. |
| 2 | **Panel** | width 100%, max-width 448px (max-w-md), space-y-4 (16px), border-radius 8px, 1px #29292D, background #151517, padding 20px. stopPropagation on click. |
| 3 | **Title** | h3, 16px, font-weight 600, colour #F7F7F8: 'Connect Angel One'. No Beta pill — Angel One is the only credential broker without one. |
| 4 | **Instructions** | margin-top 4px, space-y-0.5 (2px), 11px #96969E, leading-relaxed. Three numbered lines: '1) Go to smartapi.angelbroking.com and create an app → get your API key.' with the domain as a #8FB0FF underlined external link to https://smartapi.angelbroking.com; '2) Your Client ID is your Angel login ID.'; '3) In the SmartAPI app, enable TOTP and copy the TOTP secret (base32). Paste all three below.' |
| 5 | **Field grid** | grid grid-cols-1 sm:grid-cols-2 gap-3 (12px) — the only one of the five modals that goes 2-up. |
| 6 | **FieldInput anatomy** | label block 11px weight 500 #D3D3D7 margin-bottom 4px; relative wrapper; input full width, padding 8px 12px, background #0D0D0E, 1px #29292D, radius 8px, 13px text #F7F7F8, placeholder #96969E, autoComplete off, spellCheck false, focus:border rgba(64,106,228,0.50). |
| 7 | **Field 1 — API key** | Plain text. Placeholder 'SmartAPI key'. |
| 8 | **Field 2 — Client ID** | Plain text with CSS text-transform uppercase AND a value transform that uppercases on every keystroke. Placeholder 'e.g. D12345'. |
| 9 | **Field 3 — PIN / Password** | type toggles password ⇄ text. Placeholder 'Login password or MPIN'. Adornment: a button absolutely positioned right 12px, vertically centred, #96969E → #F7F7F8 on hover, rendering Eye or EyeOff at 14×14. |
| 10 | **Field 4 — TOTP secret** | mono = font-mono + tracking-wider. Placeholder 'TOTP secret key'. Value transform strips all whitespace and uppercases. Always visible (no reveal toggle). |
| 11 | **Footer** | flex items-center gap-2, padding-top 8px. Two equal flex-1 buttons, each padding 8px vertical, 13px, border-radius 9999px. Cancel: .glass-control (#1E1E21 fill, 1px #29292D), text #D3D3D7, disabled while busy. Submit: .glass-control-accent (#406AE4, white ink), font-weight 500, active:scale(0.98), disabled:opacity-40. Label 'Connect Angel One'; while busy 'Connecting…' with a 14×14 spinning Loader2 at gap 6px. |

**Components** — `FieldInput (local helper)` · `Eye / EyeOff / Loader2 icons`

**States & data.** angelForm = { api_key, client_id, password, totp_secret } — all four start empty. showAngelPassword toggles field 3. Submit is disabled unless brokerBusy is falsy AND all four fields are non-empty. handleAngelSubmit posts { broker_name:'angelone', api_key, client_id, password, totp_secret }, then closes the modal, resets the form to four empty strings, reloads connections, and banners 'Angel One connected.'

**Interactions.** Backdrop click closes only when not busy; there is no Escape handler and no focus trap (this is a hand-rolled overlay, not the Radix Dialog used by ConfirmDialog). Errors do not render inside the modal — they set the page-level message and the modal stays open, so the user must dismiss it to read the failure.

**Responsive.** Panel is fluid to 448px with a 16px viewport gutter. The field grid is single-column below sm and 2-up from sm, so the four fields go 4-tall on mobile and 2×2 on desktop.

**Key copy.** Step 3: 'In the SmartAPI app, enable TOTP and copy the TOTP secret (base32). Paste all three below.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a modal dialog over a dark trading settings page. The backdrop is flat black at 70% opacity with no blur, 16px of viewport padding, and the dialog is centred. The dialog is 448px wide, 8px corner radius, fill #151517, 1px #29292D border, 20px padding, contents spaced 16px apart. Title at 16px weight 600 in #F7F7F8: 'Connect Angel One'. Under it, three tiny 11px numbered lines in #96969E: '1) Go to smartapi.angelbroking.com and create an app → get your API key.' with the domain underlined in blue #8FB0FF, '2) Your Client ID is your Angel login ID.', '3) In the SmartAPI app, enable TOTP and copy the TOTP secret (base32). Paste all three below.' Then a two-column field grid, 12px gaps, four fields. Each field is an 11px medium #D3D3D7 label above an input with 8px vertical and 12px horizontal padding, 8px radius, fill #0D0D0E, 1px #29292D, 13px text. Field 'API key' shows a masked-looking token 'sm4Rtk3Y'. Field 'Client ID' shows uppercase 'D12345'. Field 'PIN / Password' shows dots with a small 14px grey eye icon pinned 12px from the right edge, vertically centred. Field 'TOTP secret' renders in wide-tracked monospace: 'JBSWY3DPEHPK3PXP'. Footer: two equal-width fully rounded buttons side by side with an 8px gap — left 'Cancel' on #1E1E21 with a 1px #29292D outline and #D3D3D7 text, right 'Connect Angel One' in solid #406AE4 with white 13px medium text.
```
</details>

---

## `/settings?tab=broker (Dhan modal)` — Broker credentials — Dhan (DhanHQ)

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **74 LOC** · **Access** Signed in.

**Shell** — Full-screen overlay above the Settings shell.

**Purpose.** Two-field token capture for Dhan. DhanHQ is token-based with no OAuth redirect: a Client ID plus a self-generated access token valid roughly 30 days.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Overlay** | fixed inset-0, z-index 50, flex centred, background rgba(0,0,0,0.70), padding 16px; backdrop click closes unless busy. |
| 2 | **Panel** | max-width 448px, space-y-4, radius 8px, 1px #29292D, background #151517, padding 20px. |
| 3 | **Title row** | flex items-center gap-2: h3 16px/600 #F7F7F8 'Connect Dhan' followed by a Beta chip — border-radius 9999px, 1px #29292D, padding 2px 6px, 9px, font-weight 500, uppercase, tracking-wide, colour #96969E, text 'Beta'. |
| 4 | **Instructions** | Two 11px #96969E lines, 2px apart: '1) Open web.dhan.co → Profile → DhanHQ Trading API.' (web.dhan.co is a #8FB0FF underlined link to https://web.dhan.co); '2) Copy your Client ID and generate an Access Token (valid ~30 days). Paste both below.' |
| 5 | **Field grid** | grid grid-cols-1 gap-3 — stacked, never 2-up. |
| 6 | **Field 1 — Client ID** | Plain text, placeholder 'Dhan Client ID'. No transform. |
| 7 | **Field 2 — Access Token** | mono (font-mono + tracking-wider), type toggles password ⇄ text via a right-aligned Eye/EyeOff button at 14×14, placeholder 'DhanHQ access token'. |
| 8 | **Footer** | Two flex-1 pill buttons, gap 8px, padding-top 8px, 13px, radius 9999px. 'Cancel' on .glass-control; submit on .glass-control-accent labelled 'Connect Dhan', disabled at 40% opacity until both fields are non-empty, busy label 'Connecting…' with a 14px spinner. |

**Components** — `FieldInput (local helper)` · `Eye / EyeOff / Loader2 icons`

**States & data.** dhanForm = { client_id, access_token }, showDhanToken boolean. handleDhanSubmit posts { broker_name:'dhan', client_id, access_token }, closes, clears the form, reloads connections, banners 'Dhan connected.'

**Interactions.** Identical modal mechanics to Angel One: backdrop-click-to-close gated on brokerBusy, no Escape key, no focus trap, failures surface only in the page-level banner behind the modal.

**Responsive.** Fluid to 448px with a 16px gutter; fields are single-column at every width, so the dialog is short — roughly title + 2 lines + 2 fields + footer.

**Key copy.** 'Copy your Client ID and generate an Access Token (valid ~30 days). Paste both below.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a compact modal dialog on a dark Indian trading-app settings page. Flat black backdrop at 70% opacity, no blur. The dialog is 448px wide, 8px radius, fill #151517, 1px #29292D border, 20px padding, 16px between blocks. Title row: 'Connect Dhan' at 16px weight 600 in #F7F7F8, and immediately to its right a small fully rounded 'BETA' chip — 9px uppercase letter-spaced text in #96969E inside a 1px #29292D outline with 2px by 6px padding. Below, two 11px lines in #96969E: '1) Open web.dhan.co → Profile → DhanHQ Trading API.' with 'web.dhan.co' underlined in blue #8FB0FF, and '2) Copy your Client ID and generate an Access Token (valid ~30 days). Paste both below.' Then two stacked fields with 12px between them. Each: an 11px medium #D3D3D7 label above a full-width input with 8px/12px padding, 8px radius, fill #0D0D0E, 1px #29292D, 13px text. First field 'Client ID' showing '1100428317'. Second field 'Access Token' showing masked dots in a wide-tracked monospace face, with a 14px grey eye icon pinned 12px from the right edge and vertically centred. Footer: two equal-width fully rounded buttons with an 8px gap — 'Cancel' on #1E1E21 with a 1px #29292D outline and #D3D3D7 label, and 'Connect Dhan' in solid #406AE4 with a white 13px medium label. Keep the dialog short and quiet; no illustrations, no extra chrome.
```
</details>

---

## `/settings?tab=broker (Kotak Neo modal)` — Broker credentials — Kotak Neo (Neo API)

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **92 LOC** · **Access** Signed in.

**Shell** — Full-screen overlay above the Settings shell.

**Purpose.** Three-field token capture for Kotak Neo. Neo API needs a UCC client ID plus both an access token and a session id (sid), each with its own independent reveal toggle.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Overlay** | fixed inset-0, z-index 50, rgba(0,0,0,0.70), flex centred, padding 16px. |
| 2 | **Panel** | max-width 448px, space-y-4, radius 8px, 1px #29292D, background #151517, padding 20px. Tallest of the five modals — three fields plus three instruction lines. |
| 3 | **Title row** | h3 16px/600 'Connect Kotak Neo' + the same 9px uppercase 'Beta' chip (rounded-full, 1px #29292D, padding 2px 6px, #96969E). |
| 4 | **Instructions** | Three 11px #96969E lines: '1) Log in to the Kotak Neo API portal (napi.kotaksecurities.com) and create an app.' with the domain as a #8FB0FF underlined link to https://napi.kotaksecurities.com; '2) Generate your access token + session id (sid).'; '3) Paste your Client ID (UCC), Access Token and Session Token below.' |
| 5 | **Field 1 — Client ID (UCC)** | Label literally reads 'Client ID (UCC)'. Plain text, placeholder 'Kotak Neo UCC'. |
| 6 | **Field 2 — Access Token** | mono, password by default, Eye/EyeOff 14×14 adornment right 12px, placeholder 'Neo API access token'. Controlled by showKotakToken. |
| 7 | **Field 3 — Session Token (sid)** | Label 'Session Token (sid)'. mono, password by default, its own separate Eye/EyeOff adornment, placeholder 'Neo API session id (sid)'. Controlled by showKotakSession — the two reveal toggles are independent. |
| 8 | **Field grid** | grid grid-cols-1 gap-3 — all three stacked. |
| 9 | **Footer** | 'Cancel' (.glass-control pill) and 'Connect Kotak Neo' (.glass-control-accent pill), each flex-1, 13px, padding 8px vertical, radius 9999px. Submit disabled until all three fields are non-empty; busy shows 'Connecting…' with a 14px spinner. |

**Components** — `FieldInput (local helper)` · `Eye / EyeOff / Loader2 icons`

**States & data.** kotakForm = { client_id, access_token, session_token }; showKotakToken and showKotakSession are separate booleans. handleKotakSubmit posts { broker_name:'kotakneo', client_id, access_token, session_token } then closes, clears, reloads and banners 'Kotak Neo connected.'

**Interactions.** Same overlay mechanics as the other credential modals — backdrop click closes when not busy, no Escape handler, no focus trap. Each eye toggle flips only its own field.

**Responsive.** Fluid to 448px with a 16px gutter; three stacked fields at every width.

**Key copy.** 'Generate your access token + session id (sid).'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a modal dialog on a dark Indian NSE trading settings page. Backdrop is flat black at 70% opacity, no blur, 16px viewport padding, dialog centred. Dialog: 448px wide, 8px radius, fill #151517, 1px #29292D, 20px padding, 16px between blocks. Title row: 'Connect Kotak Neo' at 16px weight 600 in #F7F7F8 with a small fully rounded 'BETA' chip beside it — 9px uppercase in #96969E inside a 1px #29292D outline. Then three 11px numbered lines in #96969E: '1) Log in to the Kotak Neo API portal (napi.kotaksecurities.com) and create an app.' with the domain underlined in blue #8FB0FF, '2) Generate your access token + session id (sid).', '3) Paste your Client ID (UCC), Access Token and Session Token below.' Then three stacked fields, 12px apart. Each is an 11px medium #D3D3D7 label above a full-width input, 8px vertical and 12px horizontal padding, 8px radius, fill #0D0D0E, 1px #29292D, 13px text. Field one 'Client ID (UCC)' showing 'AB1234'. Field two 'Access Token' showing masked dots in wide-tracked monospace with a 14px grey eye icon at the right edge. Field three 'Session Token (sid)' also masked monospace with its own separate eye icon. Footer: two equal fully rounded buttons, 8px gap — 'Cancel' on #1E1E21 with a 1px #29292D outline and #D3D3D7 text, and 'Connect Kotak Neo' in solid #406AE4 with white 13px medium text. Everything quiet and dense; no illustrations.
```
</details>

---

## `/settings?tab=broker (Alice Blue modal)` — Broker credentials — Alice Blue (ANT API)

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **76 LOC** · **Access** Signed in.

**Shell** — Full-screen overlay above the Settings shell.

**Purpose.** Two-field token capture for Alice Blue. The ANT API is token-based; the form asks for a User ID (posted as client_id) and an access token. Its instruction block is the only one that ends with a bare link line.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Overlay** | fixed inset-0, z-index 50, rgba(0,0,0,0.70), flex centred, padding 16px; backdrop click closes unless busy. |
| 2 | **Panel** | max-width 448px, space-y-4, radius 8px, 1px #29292D, background #151517, padding 20px. |
| 3 | **Title row** | h3 16px/600 'Connect Alice Blue' + 9px uppercase 'Beta' chip (rounded-full, 1px #29292D, padding 2px 6px, #96969E). |
| 4 | **Instructions** | Four 11px #96969E lines, 2px apart: '1) Log in to Alice Blue → Apps → API.'; '2) Get your API key and generate a session/access token.'; '3) Paste your User ID and Access Token below.'; then a fourth unnumbered line containing only the link 'aliceblueonline.com' in #8FB0FF underlined, pointing at https://aliceblueonline.com. |
| 5 | **Field 1 — User ID** | Label 'User ID' (the value is posted as client_id). Plain text, placeholder 'Alice Blue User ID'. |
| 6 | **Field 2 — Access Token** | mono, password by default with an Eye/EyeOff 14×14 adornment right 12px, placeholder 'Alice Blue access token'. |
| 7 | **Field grid** | grid grid-cols-1 gap-3. |
| 8 | **Footer** | 'Cancel' (.glass-control pill, #D3D3D7) and 'Connect Alice Blue' (.glass-control-accent pill, white ink, weight 500), flex-1 each, 13px, radius 9999px, gap 8px, padding-top 8px. Submit disabled until both fields fill; busy shows 'Connecting…' with a 14px spinner. |

**Components** — `FieldInput (local helper)` · `Eye / EyeOff / Loader2 icons`

**States & data.** aliceForm = { client_id, access_token }, showAliceToken boolean. handleAliceSubmit posts { broker_name:'aliceblue', client_id, access_token }, closes, clears, reloads connections and banners 'Alice Blue connected.'

**Interactions.** Backdrop-click close gated on brokerBusy; no Escape, no focus trap. The label/state mismatch is deliberate — the field is presented as 'User ID' but stored and transmitted as client_id.

**Responsive.** Fluid to 448px with a 16px gutter; two stacked fields at all widths.

**Key copy.** 'Get your API key and generate a session/access token.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a small modal dialog over a dark Indian trading settings page. Flat black backdrop at 70% opacity, no blur, dialog centred with 16px viewport padding. Dialog: 448px wide, 8px corner radius, fill #151517, 1px #29292D border, 20px padding, blocks spaced 16px. Title row: 'Connect Alice Blue' at 16px weight 600 in #F7F7F8 with a fully rounded 'BETA' chip beside it — 9px uppercase letter-spaced #96969E inside a 1px #29292D outline, 2px by 6px padding. Beneath, four tiny 11px lines in #96969E spaced 2px apart: '1) Log in to Alice Blue → Apps → API.', '2) Get your API key and generate a session/access token.', '3) Paste your User ID and Access Token below.', and finally a standalone underlined blue #8FB0FF link 'aliceblueonline.com'. Then two stacked fields with 12px between them: an 11px medium #D3D3D7 label above a full-width input with 8px vertical and 12px horizontal padding, 8px radius, fill #0D0D0E, 1px #29292D, 13px text. Field one 'User ID' showing '895412'. Field two 'Access Token' showing masked dots in a wide-tracked monospace face with a 14px grey eye icon pinned 12px from the right edge and vertically centred. Footer: two equal-width fully rounded buttons with an 8px gap — 'Cancel' on #1E1E21 with a 1px #29292D outline and #D3D3D7 label, and 'Connect Alice Blue' in solid #406AE4 with a white 13px medium label.
```
</details>

---

## `/settings?tab=broker (Zerodha modal)` — Broker OAuth consent — Zerodha (Kite Connect)

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **56 LOC** · **Access** Signed in.

**Shell** — Full-screen overlay above the Settings shell.

**Purpose.** The only zero-field broker modal. Zerodha uses the licensed Kite Connect OAuth flow, so this is pure consent: an explanation, a shield-marked reassurance panel, and a redirect button. No password or TOTP is ever captured.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Overlay** | fixed inset-0, z-index 50, rgba(0,0,0,0.70), flex centred, padding 16px; backdrop click closes unless busy. |
| 2 | **Panel** | max-width 448px, space-y-4, radius 8px, 1px #29292D, background #151517, padding 20px. |
| 3 | **Title + body** | h3 16px/600 #F7F7F8 'Connect Zerodha' — no Beta chip. Below it, margin-top 2px, 12px #96969E: 'You'll be taken to Zerodha's secure Kite login to authorise access. Quant X never handles your Zerodha password or TOTP.' |
| 4 | **Reassurance panel** | flex items-start gap-2, border-radius 8px, 1px #29292D, background #0D0D0E (bg-main — a step DARKER than the modal), padding 12px. Shield icon 16×16 in #8FB0FF with 2px top offset. Text 11px #96969E leading-relaxed: 'Authorisation uses the official Kite Connect OAuth flow. Revoke access anytime from Zerodha, or by disconnecting here.' |
| 5 | **Footer** | flex gap-2, padding-top 8px. 'Cancel' flex-1, .glass-control pill, 13px #D3D3D7. 'Connect with Zerodha' flex-1, .glass-control-accent pill (#406AE4, white), 13px weight 500, active:scale(0.98), disabled:opacity-40. Busy label is 'Redirecting…' — not 'Connecting…' — with a 14×14 spinning Loader2 at gap 6px. |
| 6 | **Footnote** | p, 11px #96969E, text-align center, below the buttons: 'You'll log in securely on Zerodha. We never see your password.' |

**Components** — `Shield / Loader2 icons`

**States & data.** No form state at all. handleZerodhaOAuth sets brokerBusy='zerodha', calls api.broker.initiateOAuth('zerodha','settings'), throws 'No auth URL returned from Zerodha' when auth_url is missing, writes resp.state to sessionStorage['broker_oauth_state'] and 'zerodha' to sessionStorage['broker_oauth_broker'], then assigns window.location.href = resp.auth_url. On failure it banners the error and clears brokerBusy; the modal stays open.

**Interactions.** Confirming leaves the app entirely — a full-page redirect to Zerodha's own domain, returning via /broker/callback which verifies the stashed state. Backdrop click closes only when not busy. Cancel simply closes.

**Responsive.** Fluid to 448px with a 16px gutter. Content is short enough that the dialog never scrolls.

**Key copy.** 'You'll be taken to Zerodha's secure Kite login to authorise access. Quant X never handles your Zerodha password or TOTP.' and the centred footnote 'You'll log in securely on Zerodha. We never see your password.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a consent modal — no form fields — over a dark Indian trading settings page. Flat black backdrop at 70% opacity, no blur, 16px viewport padding, dialog centred. Dialog: 448px wide, 8px radius, fill #151517, 1px #29292D border, 20px padding, 16px between blocks. Title 'Connect Zerodha' at 16px weight 600 in #F7F7F8, with no badge beside it. Directly beneath at 12px in #96969E: 'You'll be taken to Zerodha's secure Kite login to authorise access. Quant X never handles your Zerodha password or TOTP.' Below that, an inset note panel that is DARKER than the dialog — fill #0D0D0E, 8px radius, 1px #29292D, 12px padding — laid out as a 16px blue #8FB0FF shield icon on the left and, beside it, 11px #96969E text: 'Authorisation uses the official Kite Connect OAuth flow. Revoke access anytime from Zerodha, or by disconnecting here.' Then two equal-width fully rounded buttons side by side with an 8px gap: 'Cancel' on #1E1E21 with a 1px #29292D outline and #D3D3D7 label, and 'Connect with Zerodha' in solid #406AE4 with a white 13px medium label. Finally, centred under the buttons, an 11px #96969E line: 'You'll log in securely on Zerodha. We never see your password.' No input boxes anywhere, no eye icons, no logos inside the dialog.
```
</details>

---

## `/settings?tab=broker (tile component)` — BrokerConnectTile — single broker card

**File** `/Users/rishi/QuantX/frontend/components/broker/BrokerConnectTile.tsx` · **366 LOC** · **Access** Status comes from the per-user connection row; unauthenticated it degrades to 'not_connected'.

**Shell** — Rendered inside the Settings broker grid.

**Purpose.** The repeated unit of the broker grid. Renders one broker's logo, name, capability badges, tagline, live status pill, connected account metadata, and the connect/disconnect pair. Also exports BrokerName, BrokerStatus, OAUTH_BROKERS and TOKEN_BROKERS, which fix the render order across Settings and onboarding.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Card** | .trading-surface = background #151517 (light #FFFFFF), 1px #29292D (light #DDE5ED), border-radius 12px, box-shadow elev-1, padding 20px. flex column, gap 16px. Hover: border → rgba(150,150,158,0.25) via hover:border-d-text-muted/25, and .trading-surface's own hover raises to elev-2. aria-label '<Name> broker connection'. |
| 2 | **Logo well** | grid, 40×40 (h-10 w-10), shrink-0, place-items-center, overflow hidden, border-radius 8px, background #FFFFFF (always white, both themes), padding 6px, ring-1 ring-line. Contains BrandLogo domain={BROKER_DOMAIN[broker]} size=28 with an inline SVG monogram fallback. |
| 3 | **Monogram fallbacks** | 32×32 viewBox, rect rx=4 filled per broker, centred white DM Sans 700 18px letter: Zerodha #e85b2d 'Z', Upstox #682F91 'U', Angel One #1E88E5 'A', Fyers #0F172A 'F', Dhan #334155 'D', Kotak Neo #1E3A5F 'K', Alice Blue #1565C0 'A'. |
| 4 | **Status pill (top-right)** | All pills: inline-flex, gap 4px, 10px, font-weight 500, border-radius 9999px, padding 2px 8px. connected → #10B981 text on rgba(16,185,129,0.10) with 1px rgba(16,185,129,0.20) and CheckCircle2 12×12, label 'Connected'. expired → #F0A94F on 10% warning with 20% border, AlertCircle 12×12, 'Expired'. error → #F5808C on 10% down with 20% border, AlertCircle, 'Error'. anything else → #96969E text, 1px #29292D, no icon, 'Not connected'. |
| 5 | **Identity block** | margin-top 12px. Row: name at 14px weight 600 #F7F7F8, gap 6px. OAuth brokers (zerodha, upstox, fyers) get a '1-click' chip — inline-flex gap 2px, rounded-full, 1px rgba(16,185,129,0.25), background rgba(16,185,129,0.10), padding 2px 6px, 9px weight 500 uppercase tracking-wide, colour #10B981, with a Zap glyph at 10×10. Beta brokers (fyers, dhan, kotakneo, aliceblue) get a neutral 'Beta' chip — rounded-full, 1px #29292D, padding 2px 6px, 9px uppercase, #96969E. |
| 6 | **Tagline** | margin-top 2px, 11.5px, leading-snug, #96969E. Exact strings: Zerodha 'Kite Connect · OAuth'; Upstox 'Upstox API v2 · OAuth'; Angel One 'SmartAPI · API key + TOTP'; Fyers 'OAuth · API v3'; Dhan 'Access token'; Kotak Neo 'Session token'; Alice Blue 'API session'. |
| 7 | **Help line (optional)** | margin-top -4px, 10px, leading-snug, #96969E. Only Upstox and Fyers pass one. |
| 8 | **Connected metadata** | Rendered only when status === 'connected'. flex wrap, column gap 16px, row gap 4px, 11px #96969E, border-top 1px #29292D, padding-top 12px. 'Account' label in #D3D3D7 followed by the account id in .numeric #F7F7F8, or an em-dash when null. When lastSyncedAt exists: 'Last sync' + new Date(...).toLocaleString('en-IN', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' }) — e.g. '09:18 am, 5 Aug'. |
| 9 | **Action row** | flex items-center justify-between gap-12px, padding-top 4px. Left: when connected or expired, a Disconnect button — 12px, #F5808C at 80%, 1px rgba(245,128,140,0.30), border-radius 6px, padding 6px 12px, Unlink 14×14, hover background rgba(245,128,140,0.10); otherwise an empty <span /> placeholder keeps the primary button right-aligned. Right: the primary — 12px weight 500, border-radius 6px, padding 6px 16px, leading Zap 14×14 (swapped for a spinning Loader2 when busy). Not connected → solid #406AE4 with white ink, hover #3055C2, label 'Connect'. Connected → 1px #29292D with #D3D3D7 ink and hover background #1E1E21, label 'Reconnect'. Expired → label 'Reconnect' but still on the solid blue fill, since the outline style is gated on isConnected only. |

**Components** — `BrandLogo` · `StatusPill (local)` · `Zerodha/Upstox/Angel/Fyers/Dhan/Kotak/Alice monogram SVGs` · `BROKER_DOMAIN`

**States & data.** Props: broker, status, accountId, lastSyncedAt, busy, help, onConnect, onDisconnect. BROKER_DOMAIN maps to zerodha.com, upstox.com, angelone.in, fyers.in, dhan.co, kotaksecurities.com, aliceblueonline.com for live favicon fetch, with the monogram SVG as fallback.

**Interactions.** busy disables both buttons at 40% opacity and swaps the primary glyph for a spinner. Disconnect and Connect are both always live for a connected broker — reconnecting re-runs the same OAuth or modal path.

**Responsive.** The card itself is fluid; the broker grid gives it one column below md and one third of the row from md. The connected metadata row wraps Account and Last sync onto separate lines at narrow widths.

**Key copy.** Taglines are the primary differentiator: 'SmartAPI · API key + TOTP' vs 'Kite Connect · OAuth' vs 'Session token'.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a single broker connection card for a dark Indian NSE trading app. Card: 12px corner radius, fill #151517, 1px #29292D border, subtle drop shadow, 20px padding, contents stacked with 16px gaps, roughly 340px wide. Top row: on the left a 40px rounded-square well with an 8px radius, pure white fill, 6px inner padding and a thin hairline ring, containing the Zerodha logo; on the right a status pill — fully rounded, 10px medium text #10B981 on a 10% green fill with a 20% green outline, 2px by 8px padding, a 12px check icon, label 'Connected'. Below, 12px down: the broker name 'Zerodha' at 14px weight 600 in #F7F7F8, followed by a green '1-CLICK' chip (9px uppercase #10B981 on 10% green with a tiny lightning bolt) and, for beta brokers, a neutral 'BETA' chip in #96969E on a 1px #29292D outline. Under the name, an 11.5px #96969E tagline: 'Kite Connect · OAuth'. Then a 1px #29292D divider with 12px of space above the metadata line, which reads at 11px: 'Account' in #D3D3D7 then 'ZD4417' in white tabular monospace, then 'Last sync' in #D3D3D7 then '09:18 am, 5 Aug' in white monospace. Bottom row: on the left a small outlined 'Disconnect' button, 6px radius, 12px salmon-red #F5808C text with a 1px 30% red outline and a chain-break icon; on the right a solid #406AE4 button, 6px radius, 6px by 16px padding, white 12px medium label 'Reconnect' with a leading lightning icon.
```
</details>

---

## `/settings?tab=trading` — Risk profile / Trading Preferences section

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **221 LOC** · **Access** Signed in. The Execution Status card renders only when AuthContext has a `profile`.

**Shell** — Settings shell.

**Purpose.** The rules AutoPilot trades inside: an execution-status readout with an inline kill switch, a three-way risk profile, a three-way execution mode, position sizing, three loss limits, F&O opt-in and trailing stop-loss. The longest form section on the page.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Heading** | EyebrowMono 'Risk profile' → h2 20px/28px 600 'Trading Preferences' → p 14px #96969E: 'Set the rules. Position size, risk per trade, loss limits. AutoPilot trades inside them.' |
| 2 | **Execution Status card** | padding 16px, radius 8px, 1px #29292D, background #0D0D0E. h3 14px weight 500 #D3D3D7 margin-bottom 8px 'Execution Status'. Four rows, space-y-1, 14px #96969E with values in #F7F7F8: 'Mode:' → 'Live Eligible' or 'Paper Only'; 'Paper trading until:' → a Date.toDateString() string (e.g. 'Mon Aug 17 2026') or 'N/A'; 'Live whitelist:' → 'Yes' / 'No'; and a flex justify-between row 'Kill switch:' with an inline pill button. |
| 3 | **Paper-window maths** | start = profile.paper_trading_started_at ?? profile.created_at; paperEnds = start + 14 days (14*24*60*60*1000 ms). liveEligible requires live_trading_whitelisted AND now >= paperEnds. |
| 4 | **Inline kill-switch pill** | padding 6px 12px, border-radius 9999px, 12px, font-weight 700, transition 200ms. Inactive: .glass-control with #96969E ink, label 'Activate Kill Switch' → opens the page-level ConfirmDialog. Active: .glass-control-danger with #F5808C ink, label 'ACTIVE - Deactivate' → immediately PATCHes kill_switch_active:false with no confirmation, banners 'Kill switch deactivated.' or 'Failed to deactivate kill switch.' |
| 5 | **Risk Profile group** | label 14px/500 #D3D3D7 margin-bottom 12px 'Risk Profile'. grid grid-cols-1 gap-3 sm:grid-cols-3. Three buttons, padding 16px, radius 8px, 200ms. Selected: .glass-control-accent (solid #406AE4, white ink, elev-1). Unselected: .glass-control (#1E1E21, 1px #29292D) with #96969E ink. Labels render capitalised from the raw values conservative / moderate / aggressive. |
| 6 | **Trading Mode group** | label 'Trading Mode' margin-bottom 12px. grid grid-cols-1 gap-3 sm:grid-cols-3. Three left-aligned .glass-control cards, padding 16px, radius 8px. Selected adds ring-1 ring-primary/50 and turns the title #8FB0FF; unselected titles are #F7F7F8. Copy: 'Signals Only' / 'You get the call. You place the trade.'; 'Semi-Auto' / 'AutoPilot proposes. You approve each one.'; 'Full Auto' / 'AutoPilot executes inside your limits.' Descriptions are 12px #96969E, margin-top 4px. |
| 7 | **Position settings** | grid grid-cols-1 md:grid-cols-2 gap-6. 'Max Positions' — number, min 1, max 20, MONO, default 5. 'Risk Per Trade (%)' — number, min 0.5, max 10, step 0.5, MONO, default 2. Both inputs padding 12px 16px, background #0D0D0E, 1px #29292D, radius 8px. |
| 8 | **Loss Limits (%)** | Group label margin-bottom 12px. grid grid-cols-3 gap-4 — always three across, never collapsing. Each cell: a 12px #96969E micro-label margin-bottom 4px (Daily / Weekly / Monthly) over a number input with the tighter padding 8px 12px, MONO. Defaults 5 / 10 / 20. |
| 9 | **F&O Trading card** | padding 16px, background #0D0D0E, 1px #29292D, radius 8px. Header flex justify-between margin-bottom 16px: h3 weight 500 #F7F7F8 'F&O Trading' + p 14px #96969E 'Turn on futures and options. Higher leverage, higher stakes.' Right: a 48×24 (w-12 h-6) rounded-full track — on #406AE4, off #3B3B40 — with a 20×20 white knob translating 24px on / 2px off, 200ms colour + transform. When on, reveals a labelled native select ('Preferred Option Type', 14px #96969E) with padding 8px 12px, background #0D0D0E, 1px #29292D, radius 8px and options 'Put Options' (value put_options, default), 'Futures', 'Both'. |
| 10 | **Trailing Stop Loss row** | flex justify-between, padding 16px, background #0D0D0E, 1px #29292D, radius 8px. h3 'Trailing Stop Loss' + p 14px #96969E 'Lock in gains. The SL follows price as the trade runs your way.' Same 48×24 toggle; defaults on. |
| 11 | **Save** | Button primary md, Save icon 16×16 or spinning Loader2, label 'Save Settings'. |

**Components** — `EyebrowMono` · `Button` · `ConfirmDialog (page-level)`

**States & data.** tradingForm = { risk_profile 'moderate', trading_mode 'signal_only', max_positions 5, risk_per_trade 2, fo_enabled false, preferred_option_type 'put_options', daily_loss_limit 5, weekly_loss_limit 10, monthly_loss_limit 20, trailing_sl_enabled true } — hydrated from `profile` with those exact fallbacks, trailing_sl_enabled using ?? so an explicit false survives. handleSaveTrading posts the whole tradingForm object to api.user.updateProfile, refreshes, banners 'Trading settings saved.'

**Interactions.** Every control mutates local state instantly; nothing persists until 'Save Settings'. The kill-switch pill is the exception — it writes immediately (deactivate) or opens the destructive ConfirmDialog (activate), independent of the save button. Number inputs coerce via Number(); min/max are attributes only, so out-of-range values still post.

**Responsive.** Risk Profile and Trading Mode go 1-up below sm and 3-up from sm. Position settings go 1-up below md, 2-up from md. Loss Limits stay 3-across at every width, so the three number inputs get very narrow on small phones.

**Key copy.** Mode descriptions: 'You get the call. You place the trade.' / 'AutoPilot proposes. You approve each one.' / 'AutoPilot executes inside your limits.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dense trading-preferences form for a dark Indian NSE platform, inside a 16px-radius #151517 panel with a 1px #29292D border and 32px padding. Header: 12px uppercase 'RISK PROFILE' in #96969E, a 20px weight-600 'Trading Preferences' in #F7F7F8, then 14px #96969E: 'Set the rules. Position size, risk per trade, loss limits. AutoPilot trades inside them.' Then a status card — 16px padding, 8px radius, fill #0D0D0E, 1px #29292D — headed 'Execution Status' at 14px #D3D3D7, with four 14px rows in #96969E and white values: 'Mode: Paper Only', 'Paper trading until: Mon Aug 17 2026', 'Live whitelist: No', and 'Kill switch:' with a fully rounded 12px bold pill on the right reading 'Activate Kill Switch' in #96969E on #1E1E21. Next, a label 'Risk Profile' and three equal buttons with 12px gaps, 16px padding, 8px radius: 'Conservative' and 'Aggressive' on #1E1E21 with #96969E text, and 'Moderate' selected in solid #406AE4 with white text. Then 'Trading Mode' as three left-aligned cards on #1E1E21: 'Signals Only' with 'You get the call. You place the trade.'; 'Semi-Auto' with 'AutoPilot proposes. You approve each one.'; 'Full Auto' with 'AutoPilot executes inside your limits.' — the selected one ringed in 50% #406AE4 with a blue #8FB0FF title. Then two number fields, 'Max Positions' showing 5 and 'Risk Per Trade (%)' showing 2 in tabular monospace. Then 'Loss Limits (%)' as three narrow monospace inputs labelled Daily 5, Weekly 10, Monthly 20. Finish with two dark #0D0D0E rows carrying 48 by 24 pill toggles — 'F&O Trading' off on a #3B3B40 track, 'Trailing Stop Loss' on in #406AE4 with a 20px white knob — and a solid blue 'Save Settings' button.
```
</details>

---

## `/settings?tab=appearance` — Appearance section

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **42 LOC** · **Access** Signed in. ModePanel writes to the account's ui_preferences; the theme is device-local and would work signed-out.

**Shell** — Settings shell.

**Purpose.** Two independent preference layers stacked: the per-account Experience mode (ModePanel, stored in ui_preferences) and the per-device Theme (ThemeToggle, stored in localStorage), followed by a note explaining exactly where the theme preference lives.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Header** | Rendered as a <header> inside a <section class="space-y-6">. EyebrowMono 'Appearance' margin-bottom 8px. Then a flex row gap 12px margin-bottom 4px: Palette icon 16×16 in #8FB0FF + h2 font-display 20px/28px weight 600 #F7F7F8 'Appearance' — this is the only section whose h2 carries an icon. |
| 2 | **Header body** | p at 13px #96969E: 'Set how Quant X looks. System is the default. It tracks your OS preference and flips live when your OS does. Light is a cool near-white palette for daylight reading. Dark is a near-black canvas for after-hours sessions.' Note the copy says 'System' while the control below labels that option 'Auto'. |
| 3 | **Experience block** | EyebrowMono 'Experience' margin-bottom 12px, then ModePanel (two radio cards). |
| 4 | **Theme block** | EyebrowMono 'Theme' margin-bottom 12px, then ThemeToggle. |
| 5 | **ThemeToggle** | role=radiogroup aria-label 'Appearance'. inline-flex flex-wrap gap-1 (4px), border-radius 8px, 1px #29292D, background #151517, padding 4px. Three pills, each min-height 40px, padding 8px 12px, border-radius 6px, 12px weight 500, gap 8px, with a 14×14 icon: Sun 'Light' (title 'Refined cool near-white, daylight reading'), Moon 'Dark' (title 'Near-black canvas, after-hours'), Monitor 'Auto' (title 'Match your device + time of day (default)'). Selected: background rgba(64,106,228,0.10), text #8FB0FF, 1px rgba(64,106,228,0.30), plus an inset box-shadow rgba(11,163,127,0.10). Unselected: #D3D3D7 with a transparent border and a faint white hover. Before mount no pill reads active. |
| 6 | **Storage note card** | border-radius 8px, 1px #29292D, background #0D0D0E, padding 16px, 12px #D3D3D7, leading-relaxed. Bold #F7F7F8 line 'Where your preference lives' margin-bottom 8px, then: 'It lives in your browser under quantx.theme. Clear site data or switch browsers and you reset to the default (System). The choice is per-device, not per-account. Your phone can run dark while your desktop stays light.' — 'quantx.theme' is inline <code> at font-mono 11px. |

**Components** — `EyebrowMono` · `ModePanel` · `ThemeToggle` · `Palette icon`

**States & data.** ThemeToggle reads useThemeMode() → { mode, setMode, mounted }, layered on next-themes with storageKey 'quantx.theme'; 'auto' tracks both prefers-color-scheme and local time of day, flipping live. ModePanel reads useUiMode() → { mode, setMode } from UiModeContext, persisted per-account.

**Interactions.** Theme pills apply instantly with no save step and no confirmation. Choosing an Experience mode awaits setMode(), fires a sonner toast, then router.push('/copilot') — so this is the only settings control that navigates the user off the page.

**Responsive.** The theme pill group wraps (flex-wrap) rather than scrolling on narrow screens; each pill keeps its 40px minimum tap height. ModePanel goes 1-up below sm, 2-up from sm.

**Key copy.** 'It lives in your browser under quantx.theme… The choice is per-device, not per-account. Your phone can run dark while your desktop stays light.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design an appearance-settings pane for a dark trading app, inside a 16px-radius #151517 panel, 1px #29292D border, 32px padding. Header: 12px uppercase 'APPEARANCE' in #96969E; then a row with a 16px blue #8FB0FF palette icon and a 20px weight-600 heading 'Appearance' in #F7F7F8; then a 13px #96969E paragraph: 'Set how Quant X looks. System is the default. It tracks your OS preference and flips live when your OS does. Light is a cool near-white palette for daylight reading. Dark is a near-black canvas for after-hours sessions.' Next a 12px uppercase 'EXPERIENCE' label and two side-by-side selection cards on #1E1E21 with 8px radius and 16px padding — 'Managed' with a robot icon and 'Pro' with a line-chart icon, the Pro card ringed in 50% blue #406AE4 with a 20px solid blue circle in its top-right corner holding a white check. Then a 12px uppercase 'THEME' label and a small segmented control: an 8px-radius container on #151517 with a 1px #29292D border and 4px padding, holding three pills each at least 40px tall with 6px radius, 12px medium labels and 14px icons — a sun 'Light', a moon 'Dark', and a monitor 'Auto'. 'Auto' is selected: 10% blue fill, #8FB0FF text, a 30% blue outline. Finish with a note card — 8px radius, fill #0D0D0E, 1px #29292D, 16px padding — with a bold white line 'Where your preference lives' above 12px #D3D3D7 body text that includes the monospace token 'quantx.theme' and explains the choice is per-device, not per-account.
```
</details>

---

## `/settings?tab=appearance (ModePanel)` — ModePanel — Managed vs Pro experience switch

**File** `/Users/rishi/QuantX/frontend/app/settings/_components/ModePanel.tsx` · **80 LOC** · **Access** Signed in — the choice is persisted to the account.

**Shell** — Embedded in the Appearance section.

**Purpose.** A two-option radiogroup that switches the whole product between a plain-language Simple view (Managed) and the full trading terminal (Pro). Stored per-account in ui_preferences, so it follows the user across devices — unlike the theme beside it.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Group** | div, grid gap-3 (12px), sm:grid-cols-2, role='radiogroup', aria-label='Experience mode'. |
| 2 | **Option card** | button role='radio' aria-checked. position relative, border-radius 8px, padding 16px, text-align left, .glass-control = background #1E1E21 (light #F4F7F9) + 1px #29292D. Active: ring-1 ring-primary/50 = a 1px rgba(64,106,228,0.50) ring. Inactive: hover background → #1E1E21 (bg-wrap-hover). |
| 3 | **Active marker** | Only on the selected card: absolute, top 12px right 12px, 20×20 (h-5 w-5), border-radius 9999px, background #406AE4, containing a white Check glyph at 12×12. |
| 4 | **Icon** | 20×20 (h-5 w-5) in #8FB0FF at the top-left of the card body. Managed uses Bot; Pro uses LineChart. |
| 5 | **Label** | margin-top 8px, 14px, font-weight 600, colour #F7F7F8. 'Managed' / 'Pro'. |
| 6 | **Description** | margin-top 4px, 12px, leading-relaxed, #96969E. Managed: 'The AI trades on your own broker account within your limits. Turns on a plain-language Simple view — money, risk, activity — right on your pages. No charts or jargon.' Pro: 'The full terminal: signals, strategy builder, scanners, backtesting, bot execution and risk analytics.' |

**Components** — `useUiMode / UiModeContext` · `Bot / LineChart / Check icons` · `sonner toast`

**States & data.** const { mode, setMode } = useUiMode(). Options array is fixed at two entries in the order managed, pro. Pro is the product default.

**Interactions.** choose(next) returns early when next === mode. Otherwise it awaits setMode(next), fires a sonner success toast — 'Simple view on — plain-language cards are ready.' for managed, 'Full view on — the complete terminal is back.' for pro — and then router.push('/copilot'), leaving Settings entirely. There is no confirmation and no undo on this surface.

**Responsive.** Single column below sm, two equal columns from sm up. Cards are equal height within a row, so the shorter Pro description leaves whitespace.

**Key copy.** Toasts: 'Simple view on — plain-language cards are ready.' and 'Full view on — the complete terminal is back.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a two-card experience-mode selector for a dark Indian trading app. Two equal cards side by side with a 12px gap, each 8px corner radius, fill #1E1E21, 1px #29292D border, 16px padding, left-aligned text. Left card: a 20px blue #8FB0FF robot icon at the top, then 8px down a 14px weight-600 title 'Managed' in #F7F7F8, then 4px down a 12px #96969E paragraph with relaxed line height: 'The AI trades on your own broker account within your limits. Turns on a plain-language Simple view — money, risk, activity — right on your pages. No charts or jargon.' Right card: a 20px blue #8FB0FF line-chart icon, the title 'Pro', and the body 'The full terminal: signals, strategy builder, scanners, backtesting, bot execution and risk analytics.' The right card is the selected one — give it a 1px ring in 50%-opacity #406AE4 and place a 20px solid #406AE4 circle in its top-right corner, inset 12px from both edges, containing a 12px white check mark. The left card has no ring and no badge. Keep both cards the same height. No shadows beyond a whisper, no gradients, no imagery — just the icon, title, and body copy on a flat raised grey surface against a #151517 panel.
```
</details>

---

## `/settings?tab=notifications` — Notifications section

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **169 LOC** · **Access** Signed in.

**Shell** — Settings shell.

**Purpose.** Alert routing. Opens with the dynamic event × channel grid, then a master switch that gates four legacy email/push toggles, then cross-links to the dedicated WhatsApp and Telegram flows, then the watchlist pin manager, then a save.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Heading** | EyebrowMono 'Notifications' → h2 20px/28px 600 'Notification Preferences' → p 14px #96969E: 'Decide what reaches you, and where. Signals, fills, and market moves.' |
| 2 | **Event grid** | <AlertPreferencesGrid /> — the per-event × per-channel table, documented separately. It is dual-mounted here and on /alerts, with SWR deduping the fetch. |
| 3 | **Studio link** | flex justify-end. Anchor to /alerts, inline-flex gap 6px, 12px, colour #8FB0FF, hover underline, label 'Manage in Alerts Studio' + ArrowUpRight 14×14. |
| 4 | **Master toggle card** | flex justify-between, padding 16px, background #0D0D0E, 1px #29292D, radius 8px. h3 weight 500 #F7F7F8 'Enable Notifications' + p 14px #96969E 'The master switch for signals, fills, and updates.' Toggle is the large size: 48×24 track (on #406AE4, off #3B3B40) with a 20×20 white knob, translate 24px / 2px, 200ms. |
| 5 | **Gated block** | Everything below only renders while notifications_enabled is true. |
| 6 | **Email Notifications card** | padding 16px, background #0D0D0E, 1px #29292D, radius 8px, space-y-3. h3 weight 500 'Email Notifications'. Two justify-between rows with 14px #D3D3D7 labels 'New Signals' and 'Trade Executions', each with a SMALL toggle: 40×20 track (w-10 h-5) with a 16×16 white knob, translate 20px / 2px. |
| 7 | **Push: Signal Alerts card** | Its own card, same shell. h3 'Push: Signal Alerts' + p 12px #96969E 'A new gated signal hits your phone the moment it fires.' Small 40×20 toggle. |
| 8 | **Push: Trade Updates card** | Separate card again. h3 'Push: Trade Updates' + p 12px #96969E 'Every fill, the second it executes.' Small 40×20 toggle. |
| 9 | **Additional channels** | space-y-2. EyebrowMono 'Additional channels'. Two full-width rows: flex justify-between gap 12px, padding 16px, radius 8px, .glass-control, text-align left. Row 1: MessageCircle 16×16 #8FB0FF + 'WhatsApp daily digest' (13px weight 500 #F7F7F8) / 'Pro and up. Morning brief, evening wrap.' (11px #96969E), trailing ArrowUpRight 16×16 #96969E → router.push('/settings/whatsapp'). Row 2: Bell 16×16 #8FB0FF + 'Telegram bot' / 'Free tier included. Instant alerts plus a daily digest.', same trailing arrow — but its onClick is selectTab('notifications'), i.e. it re-selects the section you are already on. The external-link affordance is decorative; the row goes nowhere. |
| 10 | **Watchlist pins** | <WatchlistPinsPanel /> — the per-symbol alert preset manager, documented separately. |
| 11 | **Save** | Button primary md with Save 16×16 / spinner, label 'Save Preferences'. |

**Components** — `EyebrowMono` · `AlertPreferencesGrid` · `WatchlistPinsPanel` · `Button` · `MessageCircle / Bell / ArrowUpRight icons`

**States & data.** notificationForm = { notifications_enabled, email_signals, email_trades, push_enabled, push_signals, push_trades }. Only notifications_enabled hydrates from `profile` (?? true); the other five are hardcoded on every mount — email_signals/email_trades true, all push false — so their rendered positions do not reflect stored state. handleSaveNotifications posts only two fields: notifications_enabled, and push_enabled derived as (push_signals || push_trades). The two email toggles are never persisted. Banners 'Notification settings saved.'

**Interactions.** Turning the master switch off unmounts the four sub-cards entirely rather than disabling them. The event grid saves per toggle via PATCH and is independent of the Save button. The Telegram row is a no-op. The Alerts Studio link and the WhatsApp row both navigate away.

**Responsive.** Every card is full width and stacks at all breakpoints; the Studio link stays right-aligned. Panel padding steps 24px → 32px at md.

**Key copy.** 'A new gated signal hits your phone the moment it fires.' / 'Every fill, the second it executes.' / 'Free tier included. Instant alerts plus a daily digest.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a notifications-settings pane for a dark Indian NSE trading app, inside a 16px-radius #151517 panel, 1px #29292D, 32px padding. Header: 12px uppercase 'NOTIFICATIONS' in #96969E, a 20px weight-600 'Notification Preferences' in #F7F7F8, and 14px #96969E: 'Decide what reaches you, and where. Signals, fills, and market moves.' Below, an event-by-channel preference table in its own 8px-radius card. Right-align a small 12px blue #8FB0FF link 'Manage in Alerts Studio' with a 14px up-right arrow. Then a row card — 16px padding, 8px radius, fill #0D0D0E, 1px #29292D — with 'Enable Notifications' at 15px medium white, 'The master switch for signals, fills, and updates.' at 14px #96969E, and on the right a large 48 by 24 pill toggle switched ON in #406AE4 with a 20px white knob at the right end. Then a card titled 'Email Notifications' containing two rows, 'New Signals' and 'Trade Executions', each with a smaller 40 by 20 blue toggle. Then two separate cards: 'Push: Signal Alerts' with 'A new gated signal hits your phone the moment it fires.' and 'Push: Trade Updates' with 'Every fill, the second it executes.' — both small toggles OFF on a #3B3B40 track. Finish with a 12px uppercase 'ADDITIONAL CHANNELS' label above two full-width rows on #1E1E21 with 8px radius and 16px padding: a blue chat icon with 'WhatsApp daily digest' / 'Pro and up. Morning brief, evening wrap.', and a blue bell with 'Telegram bot' / 'Free tier included. Instant alerts plus a daily digest.', each ending in a grey up-right arrow. Close with a solid blue 'Save Preferences' button.
```
</details>

---

## `/settings?tab=notifications (grid)` — AlertPreferencesGrid — event × channel matrix

**File** `/Users/rishi/QuantX/frontend/components/settings/AlertPreferencesGrid.tsx` · **156 LOC** · **Access** Signed in — preferences are per user.

**Shell** — Embedded in the Notifications section; also mounted on /alerts, SWR-deduped under the key 'alerts_preferences'.

**Purpose.** A fully data-driven table: rows are whatever event types the backend returns, columns are the four fixed channels. Every cell is an individually PATCHed toggle with optimistic SWR update, so new backend events appear without a code change.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Card** | border-radius 8px, 1px #29292D (border-d-border), background #151517 (bg-d-bg-card), padding 16px. |
| 2 | **Header** | margin-bottom 12px. h3 weight 500 #F7F7F8 'Event-level preferences'. p margin-top 4px, 12px #96969E: 'Choose channels per event. Defaults pre-selected for high-urgency events (e.g. unprotected position, drawdown alerts).' followed, when channels are returned, by ' Connected channels: <comma-joined connected channel names>.' or ' Connected channels: none.' |
| 3 | **Inline error** | margin-bottom 12px, border-radius 6px, 1px rgba(245,128,140,0.30), background rgba(245,128,140,0.05), padding 8px 12px, 12px #F5808C. Shows the last failed toggle's message; cleared on the next attempt. |
| 4 | **Scroll container** | div.overflow-x-auto wrapping the table — the table itself never forces the page to scroll horizontally. |
| 5 | **Table head** | table w-full at 11px. thead tr: border-bottom 1px #29292D, 10px, uppercase, tracking-wider, #96969E. First cell 'Event' left-aligned, padding 8px vertical / 8px right. Then four centred cells, capitalised from the CHANNELS constant: Push, Telegram, Whatsapp, Email. |
| 6 | **Table body** | tbody with divide-y divide-d-border/40 = 1px rgba(41,41,45,0.40) between rows. Each row's first cell holds the event label at font-weight 500 #F7F7F8 over the event description at 10px #96969E. |
| 7 | **Toggle cell** | padding 8px 8px, centred. Button mx-auto, height 20px, width 36px (h-5 w-9), border-radius 9999px, 200ms colour. On: background #406AE4. Off: background #1E1E21 (bg-surface-2) with a 1px #29292D border. Knob: 16×16 (h-4 w-4) white circle, translate-x-4 (16px) on / translate-x-0.5 (2px) off. While the PATCH is in flight the whole button drops to 50% opacity and the knob is replaced by a 12×12 spinning Loader2 — white when on, #96969E when off. aria-label '<event label> on <channel>'. |
| 8 | **Footer** | p margin-top 12px, 10px #96969E: '<N> event types · 4 channels. Auto-syncs new event types as the backend adds them.' |
| 9 | **Loading state** | Replaces the whole card: border-radius 8px, 1px #29292D, background #151517, padding 16px, 14px #96969E, text 'Loading event-level preferences…' |
| 10 | **Error state** | Replaces the whole card: border-radius 8px, 1px rgba(245,128,140,0.30), background rgba(245,128,140,0.05), padding 16px, 14px #F5808C: 'Failed to load preferences: <message>'. |

**Components** — `useSWR` · `api.alerts.preferences / api.alerts.toggle` · `Loader2`

**States & data.** SWR key 'alerts_preferences', revalidateOnFocus false. Response: { preferences: Record<eventKey, Record<channel, boolean>>, events: Array<{key,label,description}>, channels: Array<{channel, connected, detail?}> }. CHANNELS is the fixed tuple ['push','telegram','whatsapp','email']. pending is a Set of '<event>_<channel>' keys. Known backend events documented in the file header include max_pain_shift, oi_spike, position_unprotected, adjustment_recommended, vix_regime_change, pcr_extreme, portfolio_drawdown and cron_failed.

**Interactions.** Clicking a cell calls api.alerts.toggle(event, channel, !current) and writes the full server response back into SWR with mutate(res, false) — no revalidation round-trip. Failures leave the previous value and surface in the inline error strip. Each cell disables only itself while pending, so several toggles can be in flight at once.

**Responsive.** The table is wrapped in overflow-x-auto and keeps five columns at every width, so on narrow screens the event descriptions compress and the grid scrolls sideways inside its own card rather than breaking the page.

**Key copy.** 'Choose channels per event. Defaults pre-selected for high-urgency events (e.g. unprotected position, drawdown alerts).'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a compact preferences matrix for a dark Indian NSE trading app. One card: 8px radius, fill #151517, 1px #29292D, 16px padding. Header at 15px medium white 'Event-level preferences', with a 12px #96969E line beneath: 'Choose channels per event. Defaults pre-selected for high-urgency events (e.g. unprotected position, drawdown alerts). Connected channels: telegram, email.' Below, a five-column table at 11px. The header row sits on a 1px #29292D rule with 10px uppercase letter-spaced #96969E labels: 'Event' left-aligned, then centred 'Push', 'Telegram', 'Whatsapp', 'Email'. Then eight body rows separated by faint 1px #29292D lines at 40% opacity. The first cell of each row holds a white medium label over a 10px #96969E description: 'Max pain shift' / 'BANKNIFTY max-pain moved more than 200 points'; 'OI spike' / 'Unusual open-interest build-up on RELIANCE futures'; 'Position unprotected' / 'An open TCS position has no stop-loss'; 'Adjustment recommended' / 'A NIFTY 50 spread has drifted past its delta band'; 'VIX regime change' / 'India VIX crossed 18'; 'PCR extreme' / 'Put-call ratio hit 1.4'; 'Portfolio drawdown' / 'Book down more than ₹2.5 lakh from peak'; 'Cron failed' / 'A scheduled scan did not complete'. Each of the four channel cells holds a small 36 by 20 pill toggle, fully rounded, with a 16px white knob — ON toggles filled #406AE4 with the knob right, OFF toggles filled #1E1E21 with a 1px #29292D outline and the knob left. Under the table, a 10px #96969E line: '8 event types · 4 channels. Auto-syncs new event types as the backend adds them.'
```
</details>

---

## `/settings?tab=notifications (pins)` — WatchlistPinsPanel — per-symbol alert preset pins

**File** `/Users/rishi/QuantX/frontend/app/settings/_components/WatchlistPinsPanel.tsx` · **376 LOC** · **Access** Signed in — pins live in ui_preferences.watchlist_preset_pins.

**Shell** — Embedded at the bottom of the Notifications section.

**Purpose.** Review and edit the cross-device per-symbol alert presets that override the global default. Adds a bulk applicator with a filterable symbol picker, a 10-second undo affordance, per-row removal and a clear-all.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Card** | padding 16px, background #0D0D0E, 1px #29292D, border-radius 8px, space-y-3 (12px). |
| 2 | **Loading state** | Before pins resolve, the whole card is replaced by the same 16px/8px/#0D0D0E shell containing only a 16×16 spinning Loader2 in #8FB0FF. |
| 3 | **Header** | flex justify-between gap-3. Left: h3 weight 500 #F7F7F8 'Watchlist alert pins' + p 12px #96969E 'Per-symbol presets that override your global default. Synced across devices.' Right: flex gap-3 with 'Bulk apply' (11px #8FB0FF, hover #3055C2) and — only when at least one pin exists — 'Clear all' (11px #96969E, hover #F5808C). Both disable at 50% opacity while busy. |
| 4 | **Undo banner** | Shown while a snapshot exists and the countdown is above zero. border-radius 8px, 1px rgba(64,106,228,0.40), background rgba(64,106,228,0.06), padding 8px 12px, flex justify-between gap-2, 12px. Copy: 'Bulk apply saved.' in #F7F7F8 followed by 'Reverts in {n}s if you don't undo.' in #96969E, with an 11px #8FB0FF weight-500 'Undo' button. The countdown decrements once per second; at zero the snapshot is simply discarded — nothing actually reverts, so the copy overstates what happens. |
| 5 | **Bulk editor** | border-radius 8px, 1px #29292D, background #151517, padding 12px, space-y-3. Header row: 'Pick symbols + preset' (12px weight 500 #F7F7F8) and a 'Cancel' link (11px #96969E). |
| 6 | **Bulk — loading / empty** | While the watchlist is null, a 16×16 #8FB0FF spinner. When it resolves empty: 12px #96969E 'Your watchlist is empty. Add symbols first, then come back.' |
| 7 | **Bulk — filter** | Rendered only when the watchlist holds more than 8 symbols. Full-width input, background #0D0D0E, 1px #29292D, radius 8px, padding 6px 10px, 12px, font-mono, placeholder 'Filter symbols (e.g. NIFTY)'. Every keystroke is force-uppercased. |
| 8 | **Bulk — select row** | flex gap-2 at 11px: 'Select all' (or 'Select all (filtered)' while a filter is active) · a middot · 'None', then right-aligned '{n} selected' plus ' · {m} match' when filtering. Select-all targets the filtered subset only. |
| 9 | **Bulk — symbol list** | max-height 192px (max-h-48), overflow-y auto, border-radius 8px, 1px #29292D, divide-y #29292D. Each row is a label: flex gap-2, padding 6px 10px, 12px, cursor pointer, hover background #1E1E21. Contents: a native checkbox with accent-color #406AE4, the symbol in font-mono #F7F7F8, and — when that symbol already has a pin — a right-aligned 10px #96969E note 'currently: <preset label>'. When the filter matches nothing: 'No symbols match “<query>”.' at 11px #96969E. |
| 10 | **Bulk — preset chips** | flex gap-2 flex-wrap. An 11px #96969E 'Preset:' label then six chips, padding 4px 10px, radius 8px, 10px. Selected chip uses .glass-control-accent (#406AE4 solid, white ink); the rest use .glass-control with #D3D3D7 ink. Chip labels in order: '±5%' (pct5), '±10%' (pct10), '+5% breakout' (pct5_breakout), '−5% drop' (pct5_drop), '±1× ATR' (atr1), '±2× ATR' (atr2). Default selection is atr2. |
| 11 | **Bulk — apply** | Full-width button, inline-flex centred gap 6px, padding 8px vertical, 12px weight 500, .glass-control-accent, border-radius 9999px, active:scale(0.98), disabled:opacity-40 + cursor-not-allowed when nothing is selected. Leading Check 14×14, or a spinning Loader2 while busy. Label composes live: 'Pin ±2× ATR to 3 symbols' (singular 'symbol' at 1). |
| 12 | **Empty pins** | 12px #96969E: 'No pins yet. Open any watchlist alert and check “Pin this preset to {SYMBOL}” to start.' — the literal braces are rendered. |
| 13 | **Pin list** | ul, divide-y #29292D, border-radius 8px, 1px #29292D. Entries are sorted by symbol via localeCompare. Each li: flex justify-between gap-2, padding 8px 12px. Left: symbol at 13px font-mono #F7F7F8 over the preset label at 11px #96969E. Right: 'Remove' button, padding 4px 8px, 11px #96969E, hover #F5808C, disabled 50%, aria-label 'Remove pin for <SYMBOL>'. |
| 14 | **Error line** | p at 11px #F5808C at the very bottom of the card. |

**Components** — `api.user.getUIPreferences / updateUIPreferences` · `api.watchlist.getAll` · `lib/watchlistPresetMemory` · `Check / Loader2 icons`

**States & data.** pins: Record<symbol, presetId> | null (null = loading). watchlist: string[] | null, loaded lazily on first Bulk apply, uppercased, filtered for truthiness and sorted. selected: Set<string>. bulkPreset defaults 'atr2'. undoSnapshot + undoCountdown (starts at 10). Every mutation re-reads getUIPreferences, merges watchlist_preset_pins into the existing object, PATCHes the whole thing, and mirrors the change into sessionStorage via watchlistPresetMemory so an immediate watchlist visit picks it up without a reload.

**Interactions.** Bulk apply overwrites existing pins for the selected symbols and snapshots the prior map for undo. Undo re-reads preferences, restores the snapshot, clears keys that were newly added and re-saves the previously overwritten values. Remove deletes one key and clears that symbol's sessionStorage entry. Clear all empties the map and clears every mirrored key. All four paths share the `busy` flag, which disables every control in the card.

**Responsive.** Full width at all breakpoints. The symbol list is the only internally scrolling region (192px cap); the preset chips wrap.

**Key copy.** 'Per-symbol presets that override your global default. Synced across devices.' and the composed CTA 'Pin ±2× ATR to 3 symbols'.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a watchlist alert-pin manager card for a dark Indian NSE trading app. Outer card: 16px padding, 8px radius, fill #0D0D0E, 1px #29292D. Header row: 'Watchlist alert pins' at 15px medium #F7F7F8 with '(Per-symbol presets that override your global default. Synced across devices.)' beneath at 12px #96969E; on the right two small text buttons, 'Bulk apply' in blue #8FB0FF and 'Clear all' in #96969E, both 11px. Below, an undo strip: 8px radius, 1px 40%-opacity #406AE4, a 6% blue wash, 8px by 12px padding, 12px text reading 'Bulk apply saved.' in white then 'Reverts in 7s if you don't undo.' in #96969E, with a blue 11px 'Undo' on the right. Then the bulk editor — an inner panel on #151517 with 8px radius, 1px #29292D, 12px padding — containing a monospace filter input on #0D0D0E placeholdered 'Filter symbols (e.g. NIFTY)', a row reading 'Select all · None' on the left and '3 selected' on the right at 11px, and a 192px-tall scrolling list with 1px dividers where each row has a blue checkbox and a monospace symbol: RELIANCE, TCS, HDFCBANK, INFY, NIFTY 50, BANKNIFTY — HDFCBANK showing a right-aligned 10px note 'currently: ±1× ATR'. Under the list, a chip row labelled 'Preset:' with six 10px chips — '±5%', '±10%', '+5% breakout', '−5% drop', '±1× ATR', '±2× ATR' — the last filled solid #406AE4 with white text and the rest on #1E1E21. Then a full-width fully rounded blue button with a check icon: 'Pin ±2× ATR to 3 symbols'. Finally a bordered list of existing pins, each row showing a 13px monospace symbol over an 11px grey preset label with a grey 'Remove' link on the right.
```
</details>

---

## `/settings?tab=tier` — Tier + billing section

**File** `/Users/rishi/QuantX/frontend/app/settings/_components/TierPanel.tsx` · **307 LOC** · **Access** Signed in. tierInfo is fetched by the panel itself; quizRec is passed down from the page's cached onboarding-status lookup.

**Shell** — Settings shell; the whole section is this one component.

**Purpose.** Current plan, its bullets and price, the Copilot daily cap, a billing-history placeholder, and — when the onboarding quiz recommends a higher tier — a dismissible A/B-tested recommendation banner with expandable 'what changes for you' bullets.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Loading state** | Until tierInfo resolves, the entire section is a flex centred box with min-height 200px containing a 20×20 (w-5 h-5) spinning Loader2 in #8FB0FF. |
| 2 | **Heading** | EyebrowMono 'Tier + billing' → h2 font-display 20px/28px 600 'Tier + billing' → p 14px #96969E 'Your current plan, usage, and upgrade options.' |
| 3 | **Quiz recommendation banner** | Conditional. position relative, border-radius 8px, 1px rgba(240,169,79,0.35), background rgba(240,169,79,0.06), padding 12px 16px with 40px right padding to clear the dismiss control. Inner flex wraps and justifies between. |
| 4 | **Banner — mark + copy** | 32×32 circle, background rgba(240,169,79,0.14), 1px rgba(240,169,79,0.40), containing Sparkles 14×14 in #F0A94F (light #9A4D00). Title 12px weight 600 #F7F7F8: 'Quiz recommended: ' with the tier name in #F0A94F, optionally followed by ' · <risk> risk profile' at 11px, capitalised, #96969E. Reason line: margin-top 2px, 11px #D3D3D7, leading-relaxed — a risk-profile-aware sentence, falling back to the tier pitch ('Unlimited swing + intraday signals, Scanner Lab, 50 Copilot messages/day.' for Pro; 'AutoPilot live auto-trader, F&O strategies, Counterpoint debate.' for Elite). |
| 5 | **Banner — expander** | margin-top 4px, inline-flex gap 4px, 11px #F0A94F, hover #F7F7F8, aria-expanded. Label toggles 'What changes for you' ⇄ 'Hide' with a ChevronDown 12×12 that rotates 180°. Expanding fires reportUpgradeIntent(tier, 'quiz_rec_what_changes', variant) once per open. |
| 6 | **Banner — delta bullets** | When expanded: ul margin-top 8px, margin-left 44px (ml-11), space-y-1.5. Each li is flex gap-2, 11px #D3D3D7, leading-relaxed, with a CheckCircle 12×12 in #F0A94F offset 2px. Three bullets for the feature_led arm, two or three for outcome_led. |
| 7 | **Banner — retake + dismiss** | 'Retake quiz →' anchor at 11px #96969E, whitespace-nowrap, → /onboarding/risk-quiz. Dismiss: absolute top 8px right 8px, padding 4px, a '×' at 12px, #96969E → #F7F7F8 with a #1E1E21 hover fill, aria-label 'Dismiss recommendation'. Dismissal is remembered per session and shared with /pricing. |
| 8 | **Current plan card** | border-radius 8px, 1px #29292D, border-left 2px #406AE4, background #151517, padding 20px, flex column → md:row, gap 20px. |
| 9 | **Plan — left column** | flex-1. A baseline row with EyebrowMono 'Current plan' and, for admins, an 'Admin' chip (10px, padding 2px 6px, rounded-full, background rgba(64,106,228,0.15), colour #8FB0FF, weight 600). Tier name in MONO at 28px weight 600 #F7F7F8. Price in MONO at 13px #96969E. Then ul margin-top 12px space-y-1: each bullet is flex gap-1.5 at 12px #F7F7F8 with a CheckCircle 12×12 in #8FB0FF offset 2px. |
| 10 | **Plan — tier content** | free — name 'Free', price '₹0', bullets '1 Alpha Pick / day', 'Copilot 5 messages / day', 'Paper trading + League', 'Watchlist (5 symbols) + Telegram digest', CTA 'Upgrade to Pro'. pro — 'Pro', '₹999/mo', bullets 'Unlimited swing + intraday signals', 'Momentum Picks + Scanner Lab', 'Copilot 150 messages / day', 'WhatsApp digest + Alerts Studio', 'AI weekly portfolio review', CTA 'Upgrade to Elite'. elite — 'Elite', '₹1,999/mo', bullets 'AutoPilot (live auto-trader)', 'F&O strategies', 'Counterpoint debate on signals', 'Copilot unlimited', CTA 'Manage billing'. Every href is /pricing. |
| 11 | **Plan — right column** | flex column gap 8px, shrink-0, min-width 180px. The tier CTA renders only when the tier is not elite: inline-flex centred, padding 8px 16px, 12px weight 500, .glass-control-accent, border-radius 9999px, active:scale(0.98) — clicking fires reportUpgradeIntent(free→'pro' \| otherwise 'elite', 'settings_tier_panel'). Below it, always, 'Compare plans': same geometry on .glass-control with #F7F7F8 ink. |
| 12 | **Copilot usage card** | border-radius 8px, 1px #29292D, background #151517, padding 20px. EyebrowMono 'Copilot usage today' margin-bottom 8px. A baseline row: the cap in MONO at 24px weight 600 #F7F7F8 beside 11px #96969E 'messages / day cap'. Footnote margin-top 8px, 11px #96969E: 'Resets every 00:00 UTC. Exceeding the cap returns an upgrade prompt — no account penalty.' |
| 13 | **Billing history card** | Same card shell. EyebrowMono 'Billing history' margin-bottom 8px, then 12px #96969E: 'Invoice download + Razorpay subscription details — wiring lands with the Razorpay webhook PR.' No controls — placeholder only. |

**Components** — `EyebrowMono` · `MONO token` · `lib/tierUpsell (quizRecCopy, quizRecReason, quizRecDelta, tierRank)` · `lib/abVariant` · `lib/quizRecDismiss` · `lib/reportUpgradeIntent` · `Sparkles / CheckCircle / ChevronDown / Loader2`

**States & data.** tierInfo = { tier: 'free'|'pro'|'elite', is_admin, copilot_daily_cap } fetched once via api.user.getTier() and lifted into the page so it survives tab switches; failure banners 'Failed to load tier info'. showQuizRec requires tierInfo non-null, a quizRec whose recommended_tier is not 'free', tierRank(recommended) > tierRank(current), and not dismissed. recVariant is an A/B split on slug 'quiz_rec_delta_copy' across ['feature_led','outcome_led'], keyed on the Supabase user id, and reports EXPERIMENT_EXPOSED tagged with current_tier on mount.

**Interactions.** The recommendation banner has three actions: expand (telemetry + bullets), dismiss (session-persisted, shared with /pricing), and 'Retake quiz →'. Both plan CTAs are plain anchors to /pricing; the upgrade one fires UPGRADE_INITIATED first so the funnel can credit Settings over direct /pricing traffic. Nothing in this panel mutates the account.

**Responsive.** The plan card stacks its bullet column above the button column below md and sits side by side from md, with the action column pinned to a 180px minimum. The recommendation banner's inner row wraps, dropping 'Retake quiz →' below the copy on narrow screens.

**Key copy.** 'Resets every 00:00 UTC. Exceeding the cap returns an upgrade prompt — no account penalty.' and 'Invoice download + Razorpay subscription details — wiring lands with the Razorpay webhook PR.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a tier-and-billing pane for a dark Indian NSE trading app, inside a 16px-radius #151517 panel, 1px #29292D, 32px padding. Header: 12px uppercase 'TIER + BILLING' in #96969E, a 20px weight-600 'Tier + billing' in #F7F7F8, and 14px #96969E 'Your current plan, usage, and upgrade options.' Then an amber recommendation banner: 8px radius, 1px 35%-opacity #F0A94F, a 6% amber wash, 12px by 16px padding. Inside, a 32px amber-tinted circle with a 14px sparkle icon, then 12px semibold white text 'Quiz recommended: Pro' with 'Pro' in #F0A94F and a lighter '· moderate risk profile' beside it; beneath, an 11px #D3D3D7 line 'Balanced profile — unlimited swing signals + Scanner Lab give you enough setups per week without overwhelming the watchlist.'; then a small amber link 'What changes for you' with a chevron. On the right, an 11px grey 'Retake quiz →', and a small grey × in the top-right corner. Below, the current-plan card: 8px radius, fill #151517, 1px #29292D, a 2px solid #406AE4 left edge, 20px padding, laid out as two columns. Left: a 12px uppercase 'CURRENT PLAN' label, the word 'Free' at 28px semibold in tabular monospace, '₹0' at 13px monospace grey, then four 12px bullets with small blue check icons: '1 Alpha Pick / day', 'Copilot 5 messages / day', 'Paper trading + League', 'Watchlist (5 symbols) + Telegram digest'. Right column, 180px wide: a solid blue #406AE4 fully rounded 'Upgrade to Pro' button above a #1E1E21 outlined 'Compare plans' button. Then a usage card showing '5' at 24px monospace beside 'messages / day cap', with an 11px note about resetting at 00:00 UTC. End with a 'Billing history' card containing only a 12px grey placeholder line.
```
</details>

---

## `/settings?tab=kill_switch` — Kill switch section

**File** `/Users/rishi/QuantX/frontend/app/settings/_components/KillSwitchPanel.tsx` · **237 LOC** · **Access** Signed in. Reads kill_switch_active off the AuthContext profile.

**Shell** — Settings shell; the whole section is this one component.

**Purpose.** The highest-stakes control in the product. Fires POST /api/trades/kill-switch, which closes every open position at market, cancels pending orders, turns AutoPilot off and blocks new orders. Renders the partial-failure payload verbatim, per symbol, and keeps it on screen rather than in a toast.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Container** | flex column, gap 24px. |
| 2 | **Heading** | EyebrowMono 'Kill switch' margin-bottom 8px → h2 font-display 20px/28px weight 600 #F7F7F8 'Kill switch' → p 14px #96969E: 'Blocks new orders, turns AutoPilot off, cancels pending orders, and closes every open position at market. This is a flatten, not a pause — it cannot be undone from here.' The clause 'closes every open position' is a <strong> in #D3D3D7. |
| 3 | **Status card** | border-radius 12px (rounded-md), 1px border plus a 2px left edge, background #151517, padding 20px. Armed: border #29292D with a left edge in #10B981. Active: border rgba(245,128,140,0.30), left edge #F5808C, background rgba(245,128,140,0.05). |
| 4 | **Status content** | flex items-start justify-between gap-4. Left: EyebrowMono 'Status' then, margin-top 4px, a 22px weight-600 value — 'Armed' in #10B981, or 'ACTIVE — trading halted' in #F5808C. |
| 5 | **Status action — armed** | .glass-control-danger, inline-flex gap 6px, border-radius 9999px, padding 8px 16px, 12px weight 600, colour #F5808C, active:scale(0.98), disabled 50%. Leading AlertCircle 14×14 (spinner while firing). Label 'Flatten & halt' → opens the ConfirmDialog. |
| 6 | **Status action — active** | .glass-control, inline-flex gap 6px, rounded-full, padding 8px 16px, 12px weight 500, colour #F7F7F8. Label 'Clear kill switch' → PATCHes kill_switch_active:false with no confirmation and banners 'Kill switch cleared — trading re-armed.' |
| 7 | **Outcome card** | Rendered after a fire. role=status aria-live=polite, border-radius 12px, padding 20px. Success: 1px #29292D on #151517 with a CheckCircle 16×16 in #10B981. Partial: 1px rgba(240,169,79,0.40) on rgba(240,169,79,0.06) with an AlertTriangle 16×16 in #F0A94F. Icons sit at mt-px, shrink-0, gap 10px. |
| 8 | **Outcome body** | The server's own message string at 14px #F7F7F8. Below it, when positions_closed is a number: margin-top 4px, 12px #96969E, '<N> position(s) closed.' with correct singular/plural. |
| 9 | **Failure chips** | When positions_failed is non-empty: margin-top 12px, an EyebrowMono at 10px in #F0A94F reading 'Still open — close manually', then margin-top 6px a flex-wrap gap-1.5 of symbol chips — border-radius 6px, 1px rgba(240,169,79,0.40), background rgba(240,169,79,0.10), padding 2px 8px, font-mono 11px, colour #F0A94F. Below, margin-top 8px, 12px #D3D3D7: 'New orders are already blocked, so nothing can re-open. Close these from Portfolio or directly with your broker.' |
| 10 | **Auto-resume timer card** | border-radius 12px, 1px #29292D, background #151517, padding 20px. EyebrowMono 'Auto-resume timer' margin-bottom 12px. p margin-bottom 12px, 12px #96969E: 'Optional: auto-clear the kill switch after N hours so you don't forget to re-arm. Leaving it off keeps the switch active until you manually clear it.' Then flex gap-2 of four chips — border-radius 8px, padding 6px 12px, 11px — labelled '4h', '12h', '24h', '48h'. Selected uses .glass-control-accent; the rest .glass-control with #96969E ink. Default 24h. Trailing 11px #96969E note with 8px left margin: '(timer wiring lands with scheduler PR)' — the chips are inert. |
| 11 | **Confirm dialog** | Radix-backed ConfirmDialog. Overlay fixed inset-0 z-40 rgba(0,0,0,0.60) with a 160ms fade. Content fixed, centred via left/top 50% and -50% translate, z-index 50, width 100% max-width 448px, border-radius 8px, 1px #29292D, background #151517, padding 20px, animating in over 200ms from scale 0.97. Title 16px weight 400. Body 14px leading-relaxed #D3D3D7. Footer justified right, gap 8px: a ghost 'Cancel' (which takes initial focus, so Enter always backs out) and a danger-variant confirm. |

**Components** — `EyebrowMono` · `ConfirmDialog` · `api.trades.killSwitch` · `AlertCircle / AlertTriangle / CheckCircle / Loader2`

**States & data.** Props: profile, pauseHours, setPauseHours, onRefreshProfile, setMessage. Local: firing, confirmOpen, result: KillSwitchResult | null. active = !!profile?.kill_switch_active. fire() calls api.trades.killSwitch(), stores the whole result, refreshes the profile, and banners res.message with type success/error from res.success. A thrown request banners 'Could not reach the kill switch. Positions may still be open — check Portfolio or your broker.' The result payload carries { success, message, positions_closed, positions_failed[] } where positions_failed is a list of symbols.

**Interactions.** Firing requires the modal: 'Flatten & halt' opens ConfirmDialog with title 'Flatten the book and halt trading?', confirmLabel 'Flatten & halt', destructive styling, and body 'Every open position will be CLOSED at market, pending orders cancelled, AutoPilot turned off and new orders blocked. Positions closed this way cannot be reopened from here.' Cancel holds focus so a stray Enter cannot fire it. The outcome card persists until the next fire or a clear. The hour chips only set local state.

**Responsive.** All three cards are full width and stack. The status row keeps its label and button side by side with gap 16px; the failure chips wrap freely.

**Key copy.** 'This is a flatten, not a pause — it cannot be undone from here.' and 'Still open — close manually'.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a high-stakes kill-switch pane for a dark Indian NSE trading app, inside a 16px-radius #151517 panel, 1px #29292D, 32px padding, blocks spaced 24px. Header: 12px uppercase 'KILL SWITCH' in #96969E, a 20px weight-600 'Kill switch' in #F7F7F8, then 14px #96969E: 'Blocks new orders, turns AutoPilot off, cancels pending orders, and closes every open position at market. This is a flatten, not a pause — it cannot be undone from here.' — with 'closes every open position' in brighter #D3D3D7. Then a status card: 12px radius, fill #151517, 1px #29292D, and a 2px solid green #10B981 left edge, 20px padding. On the left a 12px uppercase 'STATUS' label above the word 'Armed' at 22px semibold in #10B981; on the right a fully rounded button with a soft red tint — a 12% wash of #F5808C over #151517, a 32% red outline, 8px by 16px padding, 12px semibold #F5808C text and a 14px alert icon — reading 'Flatten & halt'. Below, a partial-outcome card: 12px radius, 1px 40%-opacity amber #F0A94F, a 6% amber wash, 20px padding, a 16px amber warning triangle, then at 14px white 'Closed 3 of 5 positions. 2 could not be closed.', a 12px grey '3 positions closed.', then a 10px uppercase amber label 'Still open — close manually' above two monospace chips with 6px radius, 10% amber fill and 40% amber outline reading 'RELIANCE' and 'BANKNIFTY25AUG52000CE', and a closing 12px #D3D3D7 line about closing them from Portfolio or the broker. Finish with an 'Auto-resume timer' card holding four small chips '4h', '12h', '24h', '48h' — '24h' filled solid #406AE4 — and a trailing 11px grey note '(timer wiring lands with scheduler PR)'.
```
</details>

---

## `/settings?tab=data` — Data + account section

**File** `/Users/rishi/QuantX/frontend/app/settings/_components/DataPanel.tsx` · **86 LOC** · **Access** Signed in — every export call is user-scoped.

**Shell** — Settings shell; the whole section is this one component.

**Purpose.** Two cards: a client-side GDPR-style JSON export assembled from three parallel API calls, and a delete-account card whose button is deliberately not wired yet.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Container** | div.space-y-6 (24px). |
| 2 | **Heading** | EyebrowMono 'Data' → h2 font-display 20px/28px weight 600 #F7F7F8 'Data + account' → p 14px #96969E: 'Export everything we have on you, or delete your account outright.' |
| 3 | **Export card** | border-radius 8px, 1px #29292D, background #151517, padding 20px, space-y-2 (8px). h3 13px weight 500 #F7F7F8: 'Download my data (GDPR-style)'. p 12px #96969E: 'JSON export of your profile, trades, signals, and preferences. Does not include password hashes or broker tokens — those are encrypted at rest and never leave our infrastructure.' |
| 4 | **Export button** | margin-top 8px, inline-flex gap 6px, padding 8px 16px, 12px, .glass-control (#1E1E21 + 1px #29292D), colour #F7F7F8, border-radius 9999px, disabled 50%. Leading glyph is Save 14×14, swapped for a spinning Loader2 14×14 while busy. Label 'Download JSON'. |
| 5 | **Delete card** | border-radius 8px, 1px #29292D with a 2px left edge in #F5808C, background #151517, padding 20px, space-y-2. h3 13px weight 500 in #F5808C: 'Delete account'. p 12px #96969E: 'Permanently deletes your profile, trades, signals, watchlists, and broker connections. Irreversible. Any active subscription is cancelled; you keep access through the end of your paid period.' |
| 6 | **Delete button** | margin-top 8px, inline-flex gap 6px, padding 8px 16px, 12px weight 500, .glass-control-danger (a 12% #F5808C wash over #151517 with a 32% red border), colour #F5808C, border-radius 9999px. Label 'Delete account…' — note the ellipsis, which normally promises a follow-up dialog. |

**Components** — `EyebrowMono` · `api.user.getProfile / api.trades.getAll / api.signals.getToday` · `Save / Loader2 icons`

**States & data.** Props: busy, setBusy, setMessage — the busy flag is lifted to the page as dataBusy. downloadJson() fires the three requests in parallel with Promise.all, each individually .catch(() => null) so a partial payload still exports, then wraps them as { exported_at: ISO string, profile, trades, signals }, serialises with two-space indentation, creates an application/json Blob, triggers a synthetic anchor click and revokes the object URL. Filename: `swingai-export-<Date.now()>.json`.

**Interactions.** 'Download JSON' disables itself, swaps to a spinner, and on completion banners 'Data exported.' or, on a throw, 'Export failed. Try again.' The download never leaves the browser. 'Delete account…' opens nothing — its only effect is to set an error banner reading 'Delete-account flow is pending admin-signoff wiring.'

**Responsive.** Both cards are full width and stack at every breakpoint; only the panel's own padding changes (24px → 32px at md).

**Key copy.** 'Does not include password hashes or broker tokens — those are encrypted at rest and never leave our infrastructure.' and the dead-end 'Delete-account flow is pending admin-signoff wiring.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a data-and-account settings pane for a dark Indian NSE trading app, inside a 16px-radius #151517 panel, 1px #29292D, 32px padding, with 24px between blocks. Header: a 12px uppercase 'DATA' label in #96969E, a 20px weight-600 heading 'Data + account' in #F7F7F8, then 14px #96969E: 'Export everything we have on you, or delete your account outright.' First card: 8px radius, fill #151517, 1px #29292D, 20px padding. A 13px medium white title 'Download my data (GDPR-style)', then a 12px #96969E paragraph: 'JSON export of your profile, trades, signals, and preferences. Does not include password hashes or broker tokens — those are encrypted at rest and never leave our infrastructure.' Then a fully rounded neutral button on #1E1E21 with a 1px #29292D outline, 8px by 16px padding, a 14px floppy-disk icon and a 12px #F7F7F8 label 'Download JSON'. Second card: same 8px radius and #151517 fill and 1px #29292D border, but with a 2px solid salmon-red #F5808C left edge. Title at 13px medium in #F5808C: 'Delete account'. Body at 12px #96969E: 'Permanently deletes your profile, trades, signals, watchlists, and broker connections. Irreversible. Any active subscription is cancelled; you keep access through the end of your paid period.' Then a fully rounded danger button — a soft 12% red wash over the card fill with a 32%-opacity red outline — carrying a 12px medium #F5808C label 'Delete account…'. Keep the two cards visually equal in weight; the only signal that the second is destructive is the red left edge, red title, and red button tint. No icons in the delete card, no warning banner.
```
</details>

---

## `/settings?tab=security (nav row → dead end)` — Security + 2FA — external nav row

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **3 LOC** · **Access** Signed in.

**Shell** — Settings shell rail.

**Purpose.** The eighth entry in the section rail. It is not a tab — it router.push()es to /settings/security, which middleware 301s to /settings?tab=security. 'security' is not in VALID_TABS, so the parameter is discarded and the user silently lands on Profile.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Rail row** | Seventh row in the ten-item nav, between 'WhatsApp digest' and 'Tier + billing'. flex items-center gap-2, padding 8px 12px, 12px, border-radius 8px, whitespace-nowrap. Icon: Lock at 14×14. Label 'Security + 2FA'. Because `external` is true, isActive can never be true, so this row renders in the inactive style permanently — #D3D3D7 label, transparent border, hover to #F7F7F8 on a #1E1E21 fill. |
| 2 | **External affordance** | Trailing ArrowUpRight at 12×12 in #96969E, shrink-0 — the same glyph used for genuine outbound links, which here promises a destination that does not resolve. |
| 3 | **Resulting screen** | After the 301 and the discarded query parameter, the content panel shows the Profile section: EyebrowMono 'Account', h2 'Profile', the four-field 2-up grid, and 'Save Changes'. No error, no toast, no explanation of the redirect. |

**Components** — `Lock icon` · `ArrowUpRight icon` · `next/navigation router`

**States & data.** tabs[] entry { id: 'security', label: 'Security + 2FA', icon: Lock, href: '/settings/security' }. RETIRED_ROUTE_REDIRECTS in middleware.ts maps '/settings/security' → '/settings?tab=security' (and '/login/mfa' to the same target). VALID_TABS does not contain 'security', so the fromUrl() guard rejects it and activeTab stays 'profile'.

**Interactions.** Click → router.push('/settings/security') → 301 to /settings?tab=security → full page load of the settings route → fromUrl() reads no hash, reads tab='security', finds it absent from VALID_TABS, applies nothing → Profile renders. The rail highlight lands on Profile, not on the row that was clicked.

**Responsive.** Identical to every other rail row: a full-width row in the vertical rail from lg, a pill in the horizontally scrolling strip below lg.

**Key copy.** 'Security + 2FA'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design the left navigation rail of a dark settings page for an Indian NSE trading app, focusing on one row. The rail is a 220px card, 16px radius, fill #151517, 1px #29292D border, 8px padding, with a 12px uppercase tracked label 'SETTINGS' in #96969E at the top. Below it, ten stacked rows, each 8px vertical and 12px horizontal padding, 8px corner radius, 12px label, 14px leading icon, 2px between rows: Profile, Broker, Risk profile, Appearance, Notifications, WhatsApp digest, Security + 2FA, Tier + billing, Kill switch, Data. Highlight the anatomy of the 'Security + 2FA' row: a 14px padlock icon, the label in #D3D3D7, a fully transparent border, and — pinned to the right edge of the row — a 12px up-and-right diagonal arrow in #96969E marking it as a link out of the page. Show it in its hover state: fill #1E1E21 with the label brightened to #F7F7F8. Meanwhile the 'Profile' row at the top of the rail is the one rendered as selected — fill #1E1E21, a 1px #29292D outline, a #8FB0FF blue icon and a #F7F7F8 label. To the right, show the resulting content panel: a 16px-radius #151517 panel with a 12px uppercase 'ACCOUNT' label, a 20px 'Profile' heading, and a two-column form with 'Full Name', 'Email', 'Phone' and 'Trading Capital (₹)' fields — the Profile pane, not a security pane.
```
</details>

---

## `/settings?tab=whatsapp (nav row → dead end)` — WhatsApp digest — external nav row

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **3 LOC** · **Access** Signed in.

**Shell** — Settings shell rail.

**Purpose.** The sixth entry in the section rail. It router.push()es to /settings/whatsapp, which middleware 301s to /settings?tab=channels. 'channels' is not a tab at all — it is not in VALID_TABS and no branch renders it — so the user lands on Profile.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Rail row** | Sixth row, between 'Notifications' and 'Security + 2FA'. flex items-center gap-2, padding 8px 12px, 12px, border-radius 8px. Icon: MessageCircle at 14×14. Label 'WhatsApp digest'. Permanently inactive-styled (#D3D3D7 label, transparent border) because external rows are excluded from the isActive test. |
| 2 | **External affordance** | Trailing ArrowUpRight 12×12 in #96969E. |
| 3 | **Second entry point** | The Notifications section renders a second, larger route into the same dead end: a full-width .glass-control row, padding 16px, radius 8px, with MessageCircle 16×16 in #8FB0FF, a 13px weight-500 #F7F7F8 title 'WhatsApp daily digest', an 11px #96969E subtitle 'Pro and up. Morning brief, evening wrap.', and a trailing ArrowUpRight 16×16. |
| 4 | **Resulting screen** | After the 301 and the discarded 'channels' parameter the content panel shows the Profile section — 'Account' eyebrow, 'Profile' heading, the four-field grid, 'Save Changes'. Nothing tells the user the WhatsApp surface was not reached. |

**Components** — `MessageCircle icon` · `ArrowUpRight icon` · `next/navigation router`

**States & data.** tabs[] entry { id: 'whatsapp', label: 'WhatsApp digest', icon: MessageCircle, href: '/settings/whatsapp' }. middleware.ts RETIRED_ROUTE_REDIRECTS maps '/settings/whatsapp' → '/settings?tab=channels'. There is no app/settings/whatsapp directory — the only files under app/settings are page.tsx, loading.tsx, error.tsx and _components/.

**Interactions.** Click (from either the rail row or the Notifications channel row) → /settings/whatsapp → 301 → /settings?tab=channels → fromUrl() finds 'channels' absent from VALID_TABS → Profile. The redirect target is also inconsistent with the rail's own id ('whatsapp'), so even adding 'whatsapp' to VALID_TABS would not fix this particular hop.

**Responsive.** Rail row behaves like every other: vertical from lg, horizontally scrolling pill below lg. The Notifications channel row is always full width.

**Key copy.** Rail 'WhatsApp digest'; Notifications row 'WhatsApp daily digest' / 'Pro and up. Morning brief, evening wrap.'

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design two entry points to a WhatsApp digest surface in a dark Indian NSE trading app's settings, plus the screen the user actually lands on. First, the 220px left navigation rail: 16px radius, fill #151517, 1px #29292D, 8px padding, a 12px uppercase 'SETTINGS' label in #96969E, then ten rows at 12px with 14px icons and 8px radius — Profile, Broker, Risk profile, Appearance, Notifications, WhatsApp digest, Security + 2FA, Tier + billing, Kill switch, Data. The 'WhatsApp digest' row uses a 14px speech-bubble icon, a #D3D3D7 label and a 12px grey up-right arrow pinned to its right edge. Second, inside the Notifications pane, a full-width row card on #1E1E21 with a 1px #29292D outline, 8px radius and 16px padding: a 16px blue #8FB0FF chat icon, then a 13px medium #F7F7F8 title 'WhatsApp daily digest' above an 11px #96969E line 'Pro and up. Morning brief, evening wrap.', with a 16px grey up-right arrow at the far right. Third, show the destination the user is actually shown after the redirect: the Profile pane — a 16px-radius #151517 panel with a 12px uppercase 'ACCOUNT' label, a 20px weight-600 'Profile' heading, a 14px grey line 'Who you are and the capital you trade with.', and a two-column form with 'Full Name' showing 'Rishi Karthikeyan', a disabled 'Email' field, 'Phone' showing '+91 98765 43210', and a monospace 'Trading Capital (₹)' showing '250000'. No WhatsApp content anywhere in the destination panel.
```
</details>

---

## `/settings (destructive confirms)` — Kill-switch confirmation dialogs — two variants

**File** `/Users/rishi/QuantX/frontend/app/settings/page.tsx` · **27 LOC** · **Access** Signed in.

**Shell** — Radix portal above the Settings shell.

**Purpose.** Two separately-authored ConfirmDialog instances gate the same endpoint from two places: the inline pill on the Risk profile section and the 'Flatten & halt' button on the Kill switch section. They use different titles, different confirm labels and different body copy for the identical action.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Overlay** | fixed inset-0, z-index 40, background rgba(0,0,0,0.60), animating in over 160ms and out over 140ms with cubic-bezier(0.23,1,0.32,1). |
| 2 | **Content** | fixed left 50% top 50% with a -50%/-50% translate, z-index 50, width 100% max-width 448px, border-radius 8px, 1px #29292D, background #151517, padding 20px, shadow-soft, focus:outline-none. Enters over 200ms scaling from 0.97 at the centre origin; exits over 160ms. The ConfirmDialog also adds .glass-surface. |
| 3 | **Title** | Radix Title, margin-bottom 8px, 16px (text-base), font-weight 400, colour #F7F7F8. A visually-hidden Description mirrors the title for screen readers. |
| 4 | **Body** | 14px, leading-relaxed, colour #D3D3D7. |
| 5 | **Footer** | margin-top 20px, flex justify-end gap-2. Cancel: Button variant ghost size sm — height 28px, padding 0 12px, 12px, weight 600, radius 8px, transparent border and fill, #D3D3D7 ink, hover fill #1E1E21. Confirm: Button variant danger size sm — .glass-control-danger with #F5808C ink, same geometry. While confirming, the label becomes 'Working…' and both buttons disable. |
| 6 | **Variant A — Risk profile section** | Opened by the 'Activate Kill Switch' pill inside the Execution Status card. Title 'Activate kill switch?'. confirmLabel 'Close everything'. Body: 'This closes ALL open positions through your broker and freezes trading until you switch it back on. Positions already closed cannot be undone.' onConfirm calls api.trades.killSwitch(), refreshes the profile, and banners res.message (falling back to 'Kill switch fired.') with the type taken from res.success; a throw banners 'Could not reach the kill switch. Positions may still be open — check Portfolio or your broker.' It does not render the per-symbol failure list — only the Kill switch section does that. |
| 7 | **Variant B — Kill switch section** | Opened by 'Flatten & halt'. Title 'Flatten the book and halt trading?'. confirmLabel 'Flatten & halt'. Body: 'Every open position will be CLOSED at market, pending orders cancelled, AutoPilot turned off and new orders blocked. Positions closed this way cannot be reopened from here.' onConfirm runs the panel's fire(), which additionally stores the result and renders the persistent outcome card with failed-symbol chips. |
| 8 | **Deactivation asymmetry** | Neither variant guards the reverse action. Both 'ACTIVE - Deactivate' (Risk profile) and 'Clear kill switch' (Kill switch) re-arm trading immediately on a single click with no dialog. |

**Components** — `ConfirmDialog` · `Dialog (Radix)` · `Button (ghost + danger, size sm)`

**States & data.** Variant A is driven by killConfirmOpen on the page; Variant B by confirmOpen inside KillSwitchPanel. ConfirmDialog holds its own `busy` flag: confirm() ignores re-entry while busy, awaits onConfirm(), then calls onClose().

**Interactions.** On open, a 0ms timeout moves focus from the Radix content to the Cancel button, so Enter always backs out and confirming requires a deliberate click or an explicit Tab then Enter. Escape and an overlay click both close via onOpenChange. The dialog closes itself after onConfirm resolves; the result is reported through the page-level banner (and, for variant B, the persistent outcome card).

**Responsive.** Fluid to 448px and always centred; the footer keeps both buttons on one right-aligned row at every width.

**Key copy.** Two different names for one action: 'Close everything' versus 'Flatten & halt'; and two different descriptions of the same endpoint.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a destructive confirmation dialog for a dark Indian NSE trading app. Backdrop: flat black at 60% opacity covering the page, no blur. Dialog centred, 448px wide, 8px corner radius, fill #151517, 1px #29292D border, 20px padding, soft drop shadow. Title at 16px weight 400 in #F7F7F8: 'Flatten the book and halt trading?' — note the regular, not bold, weight. Below it at 14px with relaxed line height in #D3D3D7: 'Every open position will be CLOSED at market, pending orders cancelled, AutoPilot turned off and new orders blocked. Positions closed this way cannot be reopened from here.' Leave 20px, then a right-aligned footer with two small buttons 8px apart, each 28px tall with 12px horizontal padding, 8px radius and a 12px semibold label. The left button is 'Cancel' — completely transparent fill, no border, #D3D3D7 text — and it carries the focus ring, a 2px blue #406AE4 halo, because it takes initial focus so a stray Enter key backs out. The right button is the destructive confirm: a soft 12% wash of salmon-red #F5808C over the dialog fill with a 32%-opacity red outline and #F5808C text, reading 'Flatten & halt'. There is no icon, no illustration, no red banner and no colour on the title — the seriousness is carried entirely by the copy and the single tinted button. Show a second variant of the same dialog titled 'Activate kill switch?' with the confirm button reading 'Close everything'.
```
</details>

---
