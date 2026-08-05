# Global app chrome

> Part of the Quant X as-built screen inventory — see [`../03-SCREEN-INVENTORY.md`](../03-SCREEN-INVENTORY.md)
> for the full index and [`../01-DESIGN-SYSTEM.md`](../01-DESIGN-SYSTEM.md) for every token used below.

**19 surfaces.**

## Family notes

SHARED CHROME CONTRACT (as-built, verified in source)

• Mount chain: app/layout.tsx (html.light/html.dark via next-themes, GeistSans + GeistMono vars, body `font-sans bg-main antialiased noise-overlay`, colour `var(--color-light)`, wrapped in a single `div.min-h-screen` → `<Providers>`) → app/(platform)/layout.tsx renders `<SystemHaltBanner/> <AppShell>{children}</AppShell> <AutopilotStickyStop/>`. NINE routes ALSO import AppShell directly inside their own page file (app/markets, app/portfolio, app/stocks, app/watchlist, app/trades, app/trades/[id], app/signals/[id], app/settings, app/alerts, plus components/signals/SignalsHub.tsx and CategorySignalsPage.tsx) because they live outside the (platform) group.
• FONT SPLIT (important, and it contradicts a naive reading of the token doc): the ROOT document is Geist Sans / Geist Mono (app/layout.tsx). The AppShell root div overrides body text with `style={{fontFamily:'var(--font-app-sans)'}}` = **Plus Jakarta Sans** (components/shell/appFont.ts, weights 400/500/600/700/800). All numerics still use the MONO token = `var(--font-mono)` = **Geist Mono** + `tabular-nums`. `--font-app-mono` (JetBrains Mono) is loaded but nothing consumes it.
• ICON SET: `@/lib/icons` is an AUTO-GENERATED lucide-compatible shim over **Iconify Solar Linear** (24×24 viewBox, 1.5px stroke, `currentColor`), 168 bundled icons, no runtime fetch. Exact chrome mappings: Menu=solar:hamburger-menu-linear, Search=solar:magnifer-linear, Plus=solar:add-square-linear, Sparkles/Wand2=solar:magic-stick-3-linear, Bot=solar:cpu-bolt-linear, LineChart/BarChart3=solar:chart-2-linear, ScanLine=solar:object-scan-linear, Layers=solar:layers-minimalistic-linear, Briefcase=solar:case-linear, FlaskConical=solar:test-tube-linear, ScrollText=solar:document-text-linear, ShieldAlert=solar:shield-warning-linear, Eye=solar:eye-linear, Bell=solar:bell-linear, Activity=solar:pulse-linear, Settings=solar:settings-linear, HelpCircle=solar:question-circle-linear, LogOut=solar:logout-2-linear, User=solar:user-linear, PanelLeftClose=solar:sidebar-minimalistic-linear, MessageSquare=solar:chat-square-2-linear, Trash2=solar:trash-bin-trash-linear, X=solar:close-circle-linear, PauseCircle=solar:pause-circle-linear, AlertTriangle=solar:danger-triangle-linear, Zap=solar:bolt-linear, Inbox=solar:inbox-linear, Gift=solar:gift-linear, Award=solar:cup-star-linear, CreditCard=solar:card-linear, TrendingUp=solar:graph-up-linear, ArrowRight=solar:arrow-right-linear, Moon=solar:moon-linear, Sun=solar:sun-2-linear, Monitor=solar:monitor-linear. ONE exception: Brain=**lucide:brain-circuit**.
• TAILWIND REMAP THAT CHANGES EVERY RENDER: `text-primary` and `text-accent` do NOT resolve to the #406AE4 fill — they resolve to `--primary-text` INK (#8FB0FF dark / #3459C9 light). `bg-primary`/`border-primary` keep the true #406AE4 fill and `text-primary-foreground` stays white. So the ubiquitous active-nav recipe `bg-primary/10 text-primary` = 10%-alpha #406AE4 wash + #8FB0FF ink on dark. `text-highlight`/`bg-highlight` = warning (#F0A94F dark / #9A4D00 light). `text-signature` = brand ink.
• RADIUS SCALE (tailwind.config.ts): mark 2px · xs 6px · sm 8px · md 12px · lg 16px · full 9999px. NOTE the shell leans heavily on `rounded-full` for nav rows, rail buttons and the Upgrade pill — nav rows are FULL PILLS, not 8px rows.
• SURFACE CLASSES (globals.css, names are historical, behaviour is NOT glass): `.glass-chrome` = flat `background: var(--color-wrap)` with NO border/shadow (sidebar, topbar, drawer). `.glass-float`/`.glass-pill` = the only true translucency left: `color-mix(surface-3 86%)` + `backdrop-filter: blur(20px) saturate(1.5)` + 1px line + elev-3. `.app-canvas` = `--color-main` + a ::before fixed radial pool `radial-gradient(58% 44% at 18% 0%, primary@6% dark / 3% light, transparent 62%)` at z-index -1. `.noise-overlay::after` = fixed 256px fractal-noise tile, opacity 0.018, mix-blend overlay, z-index 9999. `.cta-gloss` = `inset 4px 4px 8px rgba(255,255,255,.3), inset -4px -4px 8px rgba(255,255,255,.3), 0 8px 16px rgba(58,119,229,.5)`. `.bg-gradient-cta` = `linear-gradient(110deg,#3B82F6 0%,#406AE4 100%)`.
• MOTION: --dur-instant 90ms / fast 160ms / base 240ms / slow 380ms; ease-out cubic-bezier(.22,1,.36,1). Named animations: overlay-in 160ms, dialog-in 200ms, sheet-in-right 250ms cubic-bezier(.32,.72,0,1), pop-in 180ms — all on cubic-bezier(.23,1,.32,1) unless noted. Sidebar width + main-margin transition is a plain `duration-200`, gated behind a `mounted` flag so a saved collapsed rail never animate-snaps on load.
• KEYBOARD: ⌘/Ctrl+K toggles the CommandPalette (registered on `window` in AppShell). ⌘/Ctrl+/ opens the Copilot dock (registered in components/copilot/CopilotProvider.tsx line 249). Escape closes both the palette and the mobile drawer (AppShell). (The ContextPanel that also listened for Escape was deleted by `40c2ede`.) Skip-link "Skip to main content" is the first focusable node, `sr-only` until focused then absolute at top-2/left-2, z-50, rounded-xs, bg-primary, white ink.
• PERSISTENCE: sidebar collapse in `localStorage['quantx.sidebar.collapsed.v2']` ('1'/'0'); theme in `localStorage['quantx.theme']` via next-themes (defaultTheme="system", attribute="class", disableTransitionOnChange); palette recents in `localStorage['quantx.palette.recents.v1']` capped at 6.
• EVERY authed surface stacks, top to bottom: [SystemHaltBanner sticky, only when halted] → [OfflineBanner fixed z-60, only when offline] → AppShell(Sidebar | Topbar+main | RightRail) → inside main: ConnectBrokerBanner (only when no broker) → page children in the 1440px column → ComplianceFooter → [AutopilotStickyStop FAB, mobile only, only when AutoPilot enabled].
• THE ENGINES (Alpha/Mood/Regime/Counterpoint) are deliberately NOT in the nav — internal-only, marketing-page names only.
• The 5 social links that once sat in the Sidebar footer and MobileDrawer footer were deleted (all pointed at href:'#'). Do not re-add them.
• /dashboard, /home, /activity and /fo-strategies are retired. The authed home is /copilot; /fo-strategies redirects to /strategies?filter=options.

**CORRECTED after the 2026-08-05 markets revert (`40c2ede`).** VERIFICATION OF THE REVERT — CONFIRMED CLEAN. At HEAD (5a4bee0, 2026-08-05 00:21, one commit after the revert 40c2ede) neither components/shell/ContextPanel.tsx nor components/markets/MarketPanel.tsx exists. `git ls-files components/shell components/markets` returns 11 shell files and 14 markets files, none of them ContextPanel or MarketPanel. The four cards the earlier pass saw deleted are back on disk and tracked: BigDealsCard.tsx, BreadthCard.tsx, DailyBriefingCard.tsx, MarketExplainerCard.tsx (all mtime 2026-08-04 11:39). RenderedThread.tsx is gone too.

DANGLING REFERENCES — NONE IN CODE, so no second entry is emitted. `grep -rn "ContextPanel\|MarketPanel" app components lib` exits 1 with zero matches. Widening the search to every .ts/.tsx/.js/.mjs/.json in the repo (excluding node_modules, .next, .git) and additionally searching for `useMarketPanelFaces` and `RenderedThread` also returns zero matches. There is no dangling import and nothing build-breaking left over from the revert.

WHAT THE PREVIOUS PASS GOT WRONG ABOUT THE RAIL SPECIFICALLY. (1) The rail was never wired to ContextPanel at all — /Users/rishi/QuantX/frontend/components/shell/RightRail.tsx has not been modified since 2026-08-03 17:02, i.e. before commit 793d384 started the experiment. The "72px icon rail → expandable contextual panel" model was never true of this file; app/markets/page.tsx owned that panel directly. (2) The rail today opens exactly three things, none of which is a contextual panel: its own 224px account dropdown; the global Copilot dock (a separate fixed surface at lg:right-[72px], sm:max-w-[400px], owned by components/copilot/CopilotProvider.tsx); and the ⌘K CommandPalette (owned by components/shell/AppShell.tsx).

DEFECTS FOUND IN THE RAIL AS-BUILT, all verified against the working tree. (a) "Help & plans" links to /pricing, which does not exist — there is no app/pricing directory and next.config rewrites cover only /api/* and /ws/*; this is a hard 404, and 17 other call sites across settings, watchlist, signals, referrals, alerts, paper-trading, onboarding and the copilot quota modal share the same dead href. (b) No active-route state: the file never imports usePathname, so no rail icon ever indicates the current page. (c) The bell has no unread badge or count despite /inbox being a real notifications surface. (d) In the account menu, "Profile" and "Settings" resolve to the identical href /settings. (e) "Sign out" hover uses bg-down/10 + text-down (#F5808C dark / #B81C22 light) — the P&L down token applied to a non-P&L destructive action. (f) Off-scale type in the dropdown: 12.5px name, 13px rows, 10.5px email — the last is below the stated 11px floor. (g) The file header comment claims a "~56px pitch"; the real pitch is 48px (40px control + 8px gap). (h) transition-colors and transition-transform both run at Tailwind's default 150ms, outside the 90/160/240/380 motion scale. (i) The account menu is not focus-trapped and does not restore focus to its trigger on close. (j) All hover labels are native `title` attributes, not a design-system tooltip. (k) Below lg the rail vanishes entirely and Watchlist, Activity, Search, Help & plans, the account menu and the theme toggle have no equivalent in MobileDrawer — only Notifications and Settings survive. (l) The left sidebar is #151517 (glass-chrome → --color-wrap) while the right rail is #0D0D0E (bg-main), so the two chrome rails do not match; confirm this is intentional before regenerating.

TOKEN RESOLUTION USED (from app/globals.css and tailwind.config.ts, dark / light): bg-main #0D0D0E / #EDF1F4 · bg-wrap #151517 / #FFFFFF · bg-wrap-hover #1E1E21 / #F4F7F9 · border-line #29292D / #DDE5ED · d-text-primary rgb(247 247 248) #F7F7F8 / rgb(29 29 29) #1D1D1D · d-text-secondary rgb(211 211 215) #D3D3D7 / rgb(77 88 95) #4D585F · d-text-muted rgb(150 150 158) #96969E / rgb(95 107 117) #5F6B75 · bg-primary/ring-accent rgb(64 106 228) #406AE4 (identical in both themes) · primary-foreground #FFFFFF · --gradient-cta linear-gradient(110deg,#3B82F6 0%,#406AE4 100%) · down #F5808C / #B81C22 · radius scale mark 2 / xs 6 / sm 8 / md 12 / lg 16 / full 9999.

---

## `components/shell/AppShell.tsx` — App Shell — 3-zone authenticated frame

**File** `components/shell/AppShell.tsx` · **127 LOC** · **Access** authed. Rendered by app/(platform)/layout.tsx for the whole platform group, and imported directly by 9 out-of-group pages (markets, portfolio, stocks, watchlist, trades, trades/[id], signals/[id], settings, alerts) plus SignalsHub/CategorySignalsPage. No tier gate on the shell itself.

**Shell** — root only (it IS the shell)

**Purpose.** The persistent frame every signed-in surface renders inside. It reserves a fixed left navigation rail, a fixed right utility rail, and a scrolling centre pane capped at 1440px, then mounts the four global overlays (command palette, mobile drawer, broker banner, compliance footer). The user never 'visits' it — it is the thing that makes every other screen navigable and legally compliant.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Root canvas** | <div> carrying `${appSans.variable} ${appMono.variable} app-canvas relative min-h-screen min-h-[100dvh]` with inline `fontFamily: var(--font-app-sans)` (Plus Jakarta Sans). `.app-canvas` paints --color-main (#0D0D0E dark / #EDF1F4 light) plus a fixed ::before radial pool: radial-gradient(58% 44% at 18% 0%, primary@6% dark / 3% light → transparent 62%) at z-index -1. |
| 2 | **Skip link** | First focusable element. `sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-xs focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground`. Copy: "Skip to main content". Targets #main-content. |
| 3 | **Zone 1 — left Sidebar (fixed)** | <Sidebar> fixed left-0 top-0 z-30, hidden below lg, w-60 (240px) expanded / w-[68px] collapsed, `border-r border-line glass-chrome`. Receives pathname, collapsed, onToggle, animate(mounted), onSearch. |
| 4 | **Zone 3 — right RightRail (fixed)** | <RightRail> fixed right-0 top-0 z-40, w-[72px], hidden below lg, `border-l border-line bg-main py-3`. Receives onSearch only. |
| 5 | **Zone 2 — main pane wrapper** | `relative z-10 flex min-h-screen min-h-[100dvh] flex-col lg:mr-[72px]` + `lg:ml-60` (or `lg:ml-[68px]` when collapsed) + `transition-[margin] duration-200` applied ONLY after mount. |
| 6 | **Mobile Topbar** | <Topbar onMenuOpen> — h-14 (56px), lg:hidden, sits at the top of the main pane, not fixed. |
| 7 | **<main id="main-content">** | `min-h-0 flex-1`. Contains, in order: ConnectBrokerBanner → 1440px content column → ComplianceFooter column. |
| 8 | **ConnectBrokerBanner** | Full-bleed strip inside main, above the gutter: `border-b border-line bg-wrap px-4 py-2 text-[12.5px] text-d-text-secondary`, Zap glyph 16px in text-signature, a `rounded-xs bg-primary` Connect button (px-3 py-1), and an X dismiss. Renders only when the broker is not connected and not dismissed this session. |
| 9 | **Content column** | `mx-auto w-full max-w-[1440px] px-4 md:px-6` — the ONLY gutter in the app. 16px gutters below md, 24px at md and up. |
| 10 | **ComplianceFooter column** | Second `mx-auto w-full max-w-[1440px]` wrapper (NO px-* of its own; the footer supplies px-4 md:px-6) holding <ComplianceFooter/>. |
| 11 | **CommandPalette (portal)** | <CommandPalette open onClose> — Radix Dialog portal, z-40 overlay / z-50 content. |
| 12 | **MobileDrawer (portal-less fixed)** | <MobileDrawer open onClose pathname> — fixed inset-0 z-40, lg:hidden. |

**Components** — `components/shell/Sidebar.tsx` · `components/shell/RightRail.tsx` · `components/shell/Topbar.tsx` · `components/shell/CommandPalette.tsx` · `components/shell/MobileDrawer.tsx` · `components/shell/ComplianceFooter.tsx` · `components/shell/appFont.ts (Plus_Jakarta_Sans + JetBrains_Mono)` · `components/broker/ConnectBrokerBanner.tsx` · `lib/utils cn()`

**States & data.** Four pieces of local state: paletteOpen, drawerOpen, collapsed, mounted. `mounted` is set in a useEffect that also reads localStorage['quantx.sidebar.collapsed.v2'] === '1'; it gates BOTH the sidebar width transition and the main-margin transition so a persisted collapsed rail does not animate on first paint. A second effect closes the mobile drawer on every pathname change. No data fetching of its own — ConnectBrokerBanner owns useBrokerStatus, Sidebar owns the SWR conversations key, RightRail owns useAuth.

**Interactions.** ⌘K / Ctrl+K toggles the palette (preventDefault). Escape closes palette AND drawer. Sidebar collapse toggle writes localStorage then flips width 240↔68px and the main margin in lockstep over 200ms. Hamburger in the mobile Topbar opens the drawer. Route change auto-closes the drawer. Skip-link jumps focus to #main-content.

**Responsive.** Below lg (1024px): both rails are `hidden`, the main pane loses its ml/mr, the mobile Topbar appears, and the MobileDrawer becomes the only nav. At lg and up: no top bar at all — the shell is header-less by design, per-page breadcrumbs live inside the page. Gutters step 16px → 24px at md (768px). min-h-[100dvh] is layered after min-h-screen for iOS URL-bar correctness; app/layout.tsx sets viewportFit:'cover' and themeColor '#0D0D0E'.

**Key copy.** • Skip link: "Skip to main content"
• Sidebar brand aria-label: "Quant X — Trading OS, go to home"
• Broker banner: "Connect your broker to unlock live data and live trading. Until then you're on the virtual ₹10L portfolio." · CTA "Connect"
• aria-labels: sidebar "Main navigation", right rail "Utilities", drawer "Mobile navigation"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dark-first web application shell for an Indian stock-market AI platform called Quant X. Page canvas #0D0D0E with a single soft radial glow of #406AE4 at 6% opacity anchored top-left, fading out by 62%. Add an almost invisible film grain over everything (1.8% opacity).

Three zones. LEFT: a fixed 240px navigation rail on #151517 with a 1px #29292D right hairline, no shadow. RIGHT: a fixed 72px icon-only utility rail on #0D0D0E with a 1px #29292D left hairline. CENTRE: the scrolling content pane between them, its inner content capped at 1440px with 24px side gutters.

No top bar on desktop. Inside the centre pane, top to bottom: a thin 12.5px notice strip on #151517 reading "Connect your broker to unlock live data and live trading. Until then you're on the virtual ₹10L portfolio." with a small #406AE4 pill button labelled Connect and an X; then the page body; then a legal footer block in 11px #96969E.

Fill the body with a realistic NSE dashboard: NIFTY 50 24,318.85 +0.62%, BANKNIFTY 51,240.10 −0.18%, holdings RELIANCE ₹2,980.50, TCS ₹3,855.00, HDFCBANK ₹1,642.75, and a ₹12,48,600 portfolio value.

Typography: Plus Jakarta Sans for prose (body 15/24, label 13/18, meta 12/16, micro 11/14 uppercase +0.06em), Geist Mono tabular for every number. Radii: 12px cards, 8px inputs, 9999px pills. Produce a light variant too: canvas #EDF1F4, cards #FFFFFF, hairlines #DDE5ED, ink #1D1D1D.
```
</details>

---

## `components/shell/Sidebar.tsx` — Left Sidebar — brand, actions, nav, chat history, upgrade

**File** `components/shell/Sidebar.tsx` · **258 LOC** · **Access** authed. No tier gate on the rail; the Upgrade pill renders for everyone regardless of tier. The single tier-marked nav item is F&O (Elite badge) — the badge is decorative here, the actual gate lives on the route.

**Shell** — Zone 1 of AppShell

**Purpose.** The persistent desktop navigation rail. It is where the user starts a new Copilot chat, searches, moves between the 12 product surfaces, returns to a past conversation, and upgrades. It collapses to a 68px icon rail and remembers that choice across sessions.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Aside container** | `fixed left-0 top-0 z-30 hidden h-full flex-col overflow-hidden border-r border-line glass-chrome lg:flex`, id="app-sidebar", aria-label="Main navigation". Width w-60 (240px) or w-[68px]; `transition-[width] duration-200` only after mount. |
| 2 | **Brand block** | h-14 (56px), `border-b border-line`, px-4 expanded / justify-center px-0 collapsed. Link to /copilot. <QuantXMark className="h-8 w-8"> (32px SVG tile) with `drop-shadow-[0_2px_8px_rgba(58,119,229,0.35)]`. Two-line wordmark: "Quant X" at 15px/700 tracking-tight in d-text-primary, and "Trading OS" at 9.5px/500 uppercase tracking-[0.16em] in d-text-muted. Wordmark hidden when collapsed. |
| 3 | **New Chat button** | px-2 pt-3 wrapper. Link → /copilot. `rounded-sm border border-line bg-surface-2` (#1E1E21 dark / #F4F7F9 light), 13px/500 d-text-secondary, px-3 py-2.5, centered, gap-1.5, Plus glyph 16px. Hover: border→wrap-line, text→d-text-primary, transition duration-instant (90ms). Collapsed: h-10 square, Plus glyph 22px, no label. |
| 4 | **Search row** | px-2 pt-1.5. Button, title "Search — ⌘K", aria-keyshortcuts="Meta+K Control+K". `rounded-sm px-2.5 py-2 text-[13px] text-d-text-muted`, hover bg-surface-2 + d-text-primary, focus ring-2 ring-accent/40. Layout: Search glyph 16px, flex-1 left-aligned label "Search", then a `kbd` chip — `rounded border border-line px-1 py-px text-[10px] leading-4` in Geist Mono tabular reading ⌘K. Collapsed: h-10 centered, 19px glyph only. |
| 5 | **NavList** | <NavList pathname collapsed> — see its own entry. flex-1, own scroll. |
| 6 | **History skeleton (first load)** | Only when !collapsed && convLoading && zero conversations. `shrink-0 space-y-2 border-t border-line px-4 py-3`; a real "History" heading at 12px/600 d-text-secondary so the bars are not mistaken for failed nav, then 2 × Skeleton h=14px (bg-line/80, animate-pulse, rounded-xs), plus an sr-only "Loading recent chats…". |
| 7 | **History list** | <nav aria-label="History"> `min-h-0 max-h-[34%] flex-shrink overflow-y-auto border-t border-line px-2 py-2`. Heading "History" 12px/600 d-text-secondary at px-2. Then date groups in fixed order — Today · Yesterday · Previous 7 days · Earlier — each label 11px/500 d-text-muted at px-2 pb-1 pt-1.5; empty groups are dropped. |
| 8 | **History row** | Link → /copilot?c={id}. `flex items-center gap-2 rounded-full py-1.5 pl-2 pr-7 text-[12px]`. Active (id matches ?c=): `bg-primary/10 text-primary` with the MessageSquare glyph also in text-primary; otherwise d-text-secondary with a d-text-muted glyph, hover bg-wrap-hover. MessageSquare 14px. Title truncates; null title renders "(untitled)". |
| 9 | **History delete affordance** | Absolutely positioned right-1, vertically centred, `grid h-6 w-6 place-items-center rounded-full text-d-text-muted opacity-0`, becomes opaque on row hover (group-hover/item) or keyboard focus. Trash2 14px, hover:text-down. aria-label "Delete chat: {title}". Optimistic SWR removal, then archive server-side; if the open thread was deleted, router.push('/copilot'). |
| 10 | **Footer — Upgrade pill** | mt-auto block. `border-t border-line p-2` then a Link → /pricing with `cta-gloss rounded-full bg-gradient-cta text-primary-foreground px-3 py-2.5 text-[13px] font-semibold`, Sparkles glyph 16px, hover:opacity-90. Gradient linear-gradient(110deg,#3B82F6,#406AE4); gloss = symmetric white 30% inner bevels on both diagonals + 0 8px 16px rgba(58,119,229,.5) drop glow. Collapsed: h-10 icon-only, 18px glyph. |
| 11 | **Footer — collapse toggle** | Second `border-t border-line p-2` block. Full-width button, `rounded-full`, aria-label "Collapse menu"/"Open menu", aria-pressed, aria-controls="app-sidebar". Expanded: PanelLeftClose 18px + "Collapse" at 12.5px/500. Collapsed: Menu glyph 22px centred, py-2.5. |

**Components** — `components/shell/NavList.tsx` · `components/brand/QuantXMark.tsx` · `components/foundation Skeleton` · `lib/icons (Menu, MessageSquare, PanelLeftClose, Plus, Search, Sparkles, Trash2)` · `lib/tokens MONO` · `lib/api api.ai.copilotListConversations / copilotDeleteConversation` · `swr useSWR + useSWRConfig`

**States & data.** SWR key 'copilot:conversations' → api.ai.copilotListConversations(), revalidateOnFocus:false, keepPreviousData:true. Loading (and empty) shows the labelled History skeleton; a non-empty list replaces it; if the list is empty after load the entire History nav is omitted (no empty state copy). The open thread id is read from window.location.search ?c= inside an effect keyed on pathname — deliberately NOT useSearchParams, which would force a CSR bailout on every platform page. Delete is optimistic: SWR mutate with revalidate:false, then api.ai.copilotDeleteConversation, then a plain revalidate. Errors on delete are swallowed and resolved by the revalidate.

**Interactions.** Click brand → /copilot. New Chat → /copilot. Search button → opens CommandPalette (same as ⌘K). Nav rows → route push, longest-prefix active match. History row → /copilot?c=id and sets local openId immediately. Trash icon appears on row hover/focus and deletes. Upgrade → /pricing. Collapse toggle flips 240↔68px, persists to localStorage, and simultaneously shifts the main pane margin. Every interactive element carries a title attribute so the collapsed rail is still legible.

**Responsive.** Entirely `hidden lg:flex` — it does not exist below 1024px, where MobileDrawer takes over with the same NavList at taller row height. History and both wordmarks are suppressed in the collapsed state; only the brand tile, four icon buttons and the two footer buttons survive at 68px.

**Key copy.** • "Quant X" / "Trading OS"
• "New Chat"
• "Search" + ⌘K key cap · tooltip "Search — ⌘K"
• "History" · date groups "Today", "Yesterday", "Previous 7 days", "Earlier"
• "(untitled)" for a null chat title
• sr-only "Loading recent chats…"
• "Upgrade"
• "Collapse" · aria "Collapse menu" / "Open menu"
• "Delete chat: {title}"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a 240px fixed sidebar for a dark fintech trading app. Panel fill #151517, 1px #29292D right hairline, no shadow, full viewport height.

Top to bottom: (1) A 56px brand row with a 1px bottom hairline — a 32px rounded-square app icon in a blue gradient (#5B8DEF→#3457C9) showing a white atom with three orbit ellipses, glowing softly blue; beside it two stacked lines, "Quant X" 15px bold #F7F7F8 and "TRADING OS" 9.5px uppercase letter-spaced 0.16em #96969E. (2) A "New Chat" button, 8px radius, fill #1E1E21, 1px #29292D border, 13px #D3D3D7, centred plus icon. (3) A "Search" row, 13px #96969E with a magnifier and a small monospace key-cap chip reading ⌘K, 6px radius, 1px #29292D. (4) Grouped navigation: ungrouped rows Markets, Stocks, AutoPilot; then uppercase 12px monospace group labels SIGNALS, AI TOOLS, PORTFOLIO with rows Signals / Screener, Chart Patterns, AI Algos, F&O / Portfolio, Paper, Trades, Risk. Rows are 52px tall FULL PILLS, 14px text #D3D3D7, 16px outline icons, 12px icon-to-label gap; the active row is a #406AE4 10%-opacity pill with #8FB0FF text and icon; F&O carries a tiny amber "Elite" pill (#F0A94F on 10% amber). (5) A History section above a hairline, 12px heading, date sub-labels Today / Yesterday / Previous 7 days, and 12px chat rows like "RELIANCE breakout levels" and "Nifty 50 regime check" with a hover-revealed trash icon. (6) Pinned footer: a glossy full-pill "Upgrade" CTA on a 110° #3B82F6→#406AE4 gradient with white inner bevels and a blue drop glow, then a "Collapse" row with a panel icon.
```
</details>

---

## `components/shell/NavList.tsx + nav.ts` — Navigation list — grouped IA (shared desktop + mobile)

**File** `components/shell/NavList.tsx` · **115 LOC** · **Access** authed. Every user gets the FULL nav — the old 4-item 'managed/beginner' nav was retired 2026-07-02; managed users now opt into a Simple view per page instead. Only F&O carries a tier marker (Elite).

**Shell** — Rendered inside Sidebar (Zone 1) and inside MobileDrawer

**Purpose.** The single source of truth for the product's information architecture, active-state logic and row styling. It renders identically in the desktop Sidebar (52px rows) and the MobileDrawer (44px rows), so the two navs can never drift apart.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Nav container** | <nav aria-label="Primary navigation"> `min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-3` — it is the flexible middle of the rail and owns its own scrollbar. |
| 2 | **Section: TOP (no label)** | 3 items, rendered directly under the Search row with no group heading: Markets (/markets, solar chart-2), Stocks (/stocks, solar magnifer), AutoPilot (/autopilot, solar cpu-bolt). AutoPilot is deliberately un-tier-locked — paper AutoPilot is free; going live is gated at the toggle, not here. |
| 3 | **Section: SIGNALS** | Label "Signals". 1 item: Signals → /signals (solar chart-2). The four per-horizon URLs (/signals/swing, /signals/momentum, /signals/alpha-picks, /signals/momentum-picks, /signals/index-momentum-30) still 200-render as deep links into the matching tab, and longest-prefix matching keeps this row highlighted across all of them. |
| 4 | **Section: AI TOOLS** | Label "AI Tools". 4 items: Screener → /scanner (solar object-scan), Chart Patterns → /patterns (lucide brain-circuit — the only non-Solar glyph in the nav), AI Algos → /strategies (solar magic-stick-3), F&O → /fno (solar layers-minimalistic) with tier:'elite'. |
| 5 | **Section: PORTFOLIO** | Label "Portfolio". 4 items: Portfolio → /portfolio (solar case), Paper → /paper-trading (solar test-tube), Trades → /trades (solar document-text), Risk → /risk (solar shield-warning). |
| 6 | **Group heading** | MONO token (`var(--font-mono)` Geist Mono + tabular-nums) at `px-4 pb-1 pt-4 text-[12px] font-semibold uppercase leading-4 tracking-[0.06em]`. Colour is STATEFUL: d-text-muted normally, but tints to text-accent (#8FB0FF dark / #3459C9 light) when the active route belongs to that group. Suppressed entirely when collapsed. |
| 7 | **Row — default** | `relative flex items-center rounded-full text-[14px] leading-5 gap-3 px-4 h-[52px]` (compact/desktop) or `h-11` = 44px (tall/mobile). Text d-text-secondary; hover `bg-wrap-hover` (#1E1E21 / #F4F7F9) + d-text-primary. Icon 16px, shrink-0. Focus: `ring-2 ring-accent/40`. |
| 8 | **Row — active** | `bg-primary/10 text-primary` — a 10%-alpha #406AE4 pill with #8FB0FF ink on dark / #3459C9 on light, and the glyph takes the same ink. aria-current="page". |
| 9 | **Row — collapsed** | `justify-center px-0 py-3`, 18px glyph, no label, no tier badge; the label moves to the title attribute. |
| 10 | **Tier badge — Elite** | `rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning` reading "Elite" (#F0A94F dark / #9A4D00 light). |
| 11 | **Tier badge — Pro** | `rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent` reading "Pro". Defined and styled but currently UNUSED — no NAV item carries tier:'pro'. |

**Components** — `components/shell/nav.ts (NAV: 12 items, NAV_SECTIONS: 4)` · `lib/icons (LineChart, BarChart3, Bot, ScanLine, Brain, Wand2, Layers, Briefcase, FlaskConical, ScrollText, ShieldAlert, Search)` · `lib/tokens MONO` · `next/link`

**States & data.** Purely derived, zero data fetching. `activeHref` is computed each render by reducing over NAV and keeping the LONGEST href where `pathname === href || pathname.startsWith(href + '/')` — so /signals/swing highlights the Signals row rather than any shorter prefix, and /strategies/deployed keeps AI Algos lit. Groups with zero items return null (never an empty heading). No loading, empty or error state exists — the nav is static.

**Interactions.** Click → Next.js Link push; MobileDrawer passes onItemClick to close itself on navigate. Keyboard: standard tab order with a 2px accent-tinted focus ring at 40% alpha. Hover changes background and ink only, never size. The group heading tint is the secondary 'you are here' cue for a collapsed-context scan.

**Responsive.** Two heights only: `compact` = 52px rows (desktop sidebar default) and `tall` = 44px rows (MobileDrawer, passed explicitly). `collapsed` is a third mode used only by the 68px sidebar: centred 18px icons, no labels, no group headings, no tier badges.

**Key copy.** • Group labels rendered uppercase: "SIGNALS", "AI TOOLS", "PORTFOLIO" (source strings are 'Signals', 'AI Tools', 'Portfolio')
• Rows verbatim: Markets · Stocks · AutoPilot · Signals · Screener · Chart Patterns · AI Algos · F&O · Portfolio · Paper · Trades · Risk
• Badges: "Elite", "Pro"
• aria-label: "Primary navigation"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design the navigation section of a dark trading-app sidebar, 240px wide on #151517.

Structure: three ungrouped rows first (Markets, Stocks, AutoPilot), then three labelled groups. Group labels are 12px uppercase MONOSPACE, weight 600, letter-spacing 0.06em, 16px left padding, 16px top padding, colour #96969E — except the group containing the current page, whose label turns #8FB0FF. Groups: SIGNALS → Signals. AI TOOLS → Screener, Chart Patterns, AI Algos, F&O. PORTFOLIO → Portfolio, Paper, Trades, Risk.

Each row is a full-radius pill 52px tall with 16px horizontal padding and a 12px gap between a 16px outline icon and a 14px/20px label in #D3D3D7. Use rounded outline icons in a single consistent family: a bar chart for Markets and Signals, a magnifier for Stocks, a CPU/bolt chip for AutoPilot, a scan frame for Screener, a brain circuit for Chart Patterns, a magic wand for AI Algos, stacked layers for F&O, a briefcase for Portfolio, a test tube for Paper, a document for Trades, a shield for Risk.

States: hover fills #1E1E21 and lifts the label to #F7F7F8. Active is a #406AE4 pill at 10% opacity with both label and icon in #8FB0FF. F&O carries a tiny right-aligned pill reading "Elite", 10px semibold #F0A94F on 10% amber. Focus draws a 2px #406AE4 ring at 40% opacity.

Show the active state on "Signals" with the SIGNALS group label tinted blue. Also render a mobile variant at 44px row height and a 68px icon-only rail variant with centred 18px icons and no labels.
```
</details>

---

## `components/shell/Topbar.tsx` — Mobile Topbar

**File** `components/shell/Topbar.tsx` · **36 LOC** · **Access** authed

**Shell** — First child of the AppShell main pane (in normal flow, not fixed)

**Purpose.** The only header in the product, and it exists solely below 1024px. It gives touch users the hamburger that opens the nav drawer and a tappable brand that returns home. On desktop it does not render at all — the shell is intentionally header-less.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Header bar** | `relative z-10 flex h-14 items-center gap-2 border-b border-line glass-chrome px-3 lg:hidden`. Height exactly 56px, fill --color-wrap (#151517 / #FFFFFF), 1px #29292D bottom hairline, 12px side padding, 8px gap. |
| 2 | **Hamburger button** | `inline-flex h-9 w-9 items-center justify-center rounded-xs` (36px, 6px radius), text d-text-secondary, hover bg-wrap-hover + d-text-primary, focus `ring-2 ring-primary/40`. Menu glyph (solar:hamburger-menu-linear) at 22px. aria-label "Open menu". |
| 3 | **Brand lockup** | Link → /copilot, `flex items-center gap-2 rounded`, focus ring-2 ring-primary/40, aria-label "Quant X — Trading OS, go to home". |
| 4 | **Brand tile** | `grid h-7 w-7 place-items-center rounded-sm bg-primary text-primary-foreground` — a 28px, 8px-radius SOLID #406AE4 square (NOT the QuantXMark orbital SVG used on desktop) containing a single letter "Q" at 15px, font-black, leading-none, in white. |
| 5 | **Brand wordmark** | "Quant X" at `text-[15px] font-bold tracking-tight text-d-text-primary`. No "Trading OS" second line here. |

**Components** — `lib/icons Menu` · `next/link`

**States & data.** Stateless and data-free. Single prop onMenuOpen. No loading, empty or error surface.

**Interactions.** Tap hamburger → MobileDrawer opens (AppShell state). Tap brand → /copilot. Both have visible focus rings at 40% primary. No sticky behaviour — it scrolls away with the page since it is `relative`, not `fixed` or `sticky`.

**Responsive.** `lg:hidden` — present below 1024px only. Nothing about it changes between mobile and tablet.

**Key copy.** • aria-label "Open menu"
• Brand tile letter "Q"
• "Quant X"
• aria-label "Quant X — Trading OS, go to home"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a compact mobile app header for a dark Indian stock-trading app, 56px tall, full width, fill #151517, with a single 1px #29292D hairline along the bottom and 12px side padding.

Left: a 36px square tap target with 6px corner radius containing a 22px rounded hamburger icon in #D3D3D7; on press it fills #1E1E21 and the icon brightens to #F7F7F8. Immediately to its right, 8px away, the brand lockup: a 28px solid #406AE4 square with 8px corner radius containing a single white letter "Q" at 15px in the heaviest weight, then the wordmark "Quant X" at 15px bold with tight letter spacing in #F7F7F8.

Nothing else — no search field, no avatar, no notification bell. This header exists only below 1024px; above that the app is header-less.

Below the header show the top of a portfolio screen so the header reads in context: a heading "Portfolio", a large monospace figure ₹12,48,600 with a green +₹18,420 (+1.50%) delta in #10B981, and two holding rows — RELIANCE ₹2,980.50 +1.24% and HDFCBANK ₹1,642.75 −0.31% — with the losing figure in #F5808C.

Provide a light-theme version as well: header fill #FFFFFF, hairline #DDE5ED, icon #4D585F, wordmark #1D1D1D, and swap the P&L colours to #0A6B50 up and #B81C22 down. Type is Plus Jakarta Sans for prose and Geist Mono tabular for all numbers.
```
</details>

---

## `components/shell/MobileDrawer.tsx` — Mobile navigation drawer

**File** `components/shell/MobileDrawer.tsx` · **96 LOC** · **Access** authed

**Shell** — Fixed overlay mounted by AppShell

**Purpose.** The full nav for touch. A left slide-over holding the same grouped NavList as the desktop sidebar at a larger tap height, plus New Chat, Notifications and Settings. It is the only way to change surface below 1024px.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Overlay root** | `fixed inset-0 z-40 lg:hidden`, role="dialog", aria-modal="true", aria-label="Mobile navigation". Conditionally mounted — returns null when closed (no exit animation). |
| 2 | **Scrim** | `absolute inset-0 bg-black/70 backdrop-blur-sm`, click-to-close, aria-hidden. |
| 3 | **Panel** | `absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col border-r border-line glass-chrome` — 288px wide, capped at 80% of viewport width, fill --color-wrap, 1px right hairline. |
| 4 | **Panel header** | `flex h-14 shrink-0 items-center justify-between border-b border-line px-4`. Left: brand link → /copilot with a 28px `rounded-lg bg-primary` tile (16px radius here, vs 8px in the Topbar) holding a white font-black "Q" at 15px, plus "Quant X" at text-sm/700 tracking-tight. Right: close button, 36px `rounded-full`, X glyph 16px, d-text-secondary, hover bg-wrap-hover, aria-label "Close menu". |
| 5 | **New Chat** | `px-3 pt-3` wrapper. Link → /copilot, `rounded-full border border-line bg-surface-2 px-3 py-2.5 text-[13px] font-medium text-d-text-secondary`, centred, gap-1.5, Plus 16px. NOTE this is a FULL pill on mobile whereas the desktop sidebar uses an 8px radius for the same action. |
| 6 | **NavList (tall)** | <NavList pathname itemHeight="tall" onItemClick={onClose}> — same 12 items and 3 group headings, rows at h-11 (44px) instead of 52px, still full pills, still bg-primary/10 + text-primary when active. Scrolls independently. |
| 7 | **Footer utility row** | `mt-auto` block: `flex items-center gap-1 border-t border-line px-3 py-2` holding two equal `flex-1` links, each `h-10 rounded-full` centred with an 18px glyph + 12px/500 label — Bell "Notifications" → /inbox, Settings "Settings" → /settings. Both close the drawer on tap. |

**Components** — `components/shell/NavList.tsx` · `lib/icons (Bell, Plus, Settings, X)` · `next/link`

**States & data.** No data. One ref (closeBtnRef) and one effect: when `open` flips true, focus jumps to the close button so keyboard/screen-reader users land on an escapable target. AppShell's Escape handler closes it, and AppShell also force-closes it on every pathname change. There is no focus trap and no scroll lock — those are not implemented here.

**Interactions.** Tap scrim → close. Tap X → close. Tap any nav row → navigate AND close (via onItemClick). Tap New Chat / brand / Notifications / Settings → navigate and close. Escape → close (handled by AppShell's window listener).

**Responsive.** `lg:hidden`, so it never appears at 1024px and above. Panel width is min(288px, 80vw) — on a 360px phone it occupies 288px; on a 320px device it caps at 256px. Theme toggle is deliberately absent here; it lives in Settings → Appearance and on the desktop right rail.

**Key copy.** • "Quant X"
• "New Chat"
• "Notifications" · "Settings"
• aria-labels: "Mobile navigation", "Close menu"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a mobile navigation drawer for a dark Indian stock-trading app. It slides in from the left over a 70%-black scrim with a light backdrop blur. Panel is 288px wide (never more than 80% of the screen), fill #151517, with a 1px #29292D right hairline, full height.

Header row 56px with a bottom hairline: on the left a 28px #406AE4 tile at 16px corner radius holding a white bold "Q", followed by "Quant X" at 14px bold; on the right a 36px circular close button with an outline X in #D3D3D7.

Under it a full-pill "New Chat" button spanning the width minus 12px padding: fill #1E1E21, 1px #29292D border, 13px #D3D3D7 label, centred plus icon.

Then the grouped navigation at 44px pill row height: ungrouped Markets, Stocks, AutoPilot; then 12px uppercase monospace group labels SIGNALS, AI TOOLS, PORTFOLIO in #96969E with rows Signals / Screener, Chart Patterns, AI Algos, F&O / Portfolio, Paper, Trades, Risk. 16px outline icons, 14px labels in #D3D3D7. Show "Markets" active as a #406AE4 10% pill with #8FB0FF text and icon. F&O has a small amber "Elite" pill.

Pinned to the bottom above a hairline: two equal-width 40px pill buttons side by side, "Notifications" with a bell and "Settings" with a gear, 12px labels, 18px icons.

Behind the drawer, hint at a Markets screen showing NIFTY 50 24,318.85 +0.62% and BANKNIFTY 51,240.10 −0.18%. Also produce the light theme: panel #FFFFFF, hairline #DDE5ED, labels #4D585F.
```
</details>

---

## `components/shell/RightRail.tsx` — Right utility rail — Copilot, watchlist, alerts, account, theme

**File** `components/shell/RightRail.tsx` · **182 LOC** · **Access** authed. The account avatar block (RailProfile) renders NOTHING until useAuth() returns a user — so on first paint or for an unauthenticated render the rail is one button shorter.

**Shell** — Zone 3 of AppShell

**Purpose.** A 72px icon column pinned to the right edge holding everything that is not navigation: the Copilot launcher, watchlist, notifications, search, activity, settings, help, the account menu and the theme flip. It keeps utilities out of the nav rail and out of a top bar that does not exist.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Aside container** | `fixed right-0 top-0 z-40 hidden h-full w-[72px] flex-col items-center border-l border-line bg-main py-3 lg:flex`, aria-label="Utilities". Note it sits on --color-main (the page canvas, #0D0D0E) not on --color-wrap, so it reads as an extension of the canvas with a hairline, unlike the sidebar. |
| 2 | **Copilot launcher (top, primary)** | 40px circle: `cta-gloss grid h-10 w-10 place-items-center rounded-full bg-gradient-cta text-primary-foreground transition-transform hover:scale-[1.04]`. Contains <CopilotBot className="h-5 w-5"> — a framer-motion wrapper around the solar cpu-bolt glyph that idles with a 2.4s ±1.6px vertical bob (repeatDelay 1.4s) and switches to a rotate wiggle when active; prefers-reduced-motion renders the static glyph. Dispatches the 'copilot:open' CustomEvent rather than navigating. aria-label "Open Copilot (⌘/)". |
| 3 | **Divider** | `my-1 h-px w-6 bg-line` — a 24×1px hairline separating the Copilot launcher from the rest of the top group. |
| 4 | **Top group (4 buttons, gap-2)** | Watchlist → /watchlist (solar eye) · Notifications → /inbox (solar bell) · Search (⌘K) → opens CommandPalette (solar magnifer) · Activity → /copilot (solar pulse). All 40px circles, 20px glyphs, d-text-muted, hover `bg-wrap-hover` + d-text-primary, focus ring-2 ring-accent/40. Effective pitch ≈48px (40px button + 8px gap). |
| 5 | **Bottom group (mt-auto, gap-2)** | Settings → /settings (solar settings) · Help & plans → /pricing (solar question-circle) · account avatar · theme toggle. |
| 6 | **Account avatar button** | Same 40px circular shell; inside it a `grid h-[26px] w-[26px] place-items-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground` chip carrying the user's first initial (from profile.full_name, else email, else 'A'). aria-haspopup="menu", aria-expanded, title = display name. Open state adds bg-wrap-hover. |
| 7 | **Account menu (opens LEFT and UP)** | `absolute bottom-0 right-full z-50 mr-2 w-56 overflow-hidden rounded-lg border border-line bg-wrap` — 224px wide, 16px radius, anchored to the button's bottom edge and pushed 8px left of the rail because the rail is on the screen edge. |
| 8 | **Account menu header** | `flex items-center gap-2.5 border-b border-line px-3 py-2.5` — a 32px `rounded-full bg-primary` initial chip at 13px/700 white, then name at 12.5px/500 d-text-primary and email at 10.5px d-text-muted, both truncating. |
| 9 | **Account menu items** | Three rows, each `flex items-center gap-3 px-3 py-2.5 text-[13px] text-d-text-secondary` with a 16px glyph and a top hairline on rows 2 and 3: "Profile" (User) → /settings, "Settings" (Settings) → /settings, and "Sign out" (LogOut) as a button whose hover is `bg-down/10 text-down` — the only red affordance in the rail. |
| 10 | **Theme toggle** | <AnimatedThemeToggle> rendered with the shared railBtn class, 20px glyph. Shows Sun when the resolved theme is dark and Moon when light (Moon during SSR/pre-mount). Tap runs a View-Transitions circle clip reveal from the button over 460ms (0ms under prefers-reduced-motion) and writes an explicit light/dark intent through ThemeModeContext, exiting Auto. |

**Components** — `components/copilot/CopilotBot.tsx` · `components/copilot/CopilotProvider dispatchCopilotOpen` · `components/theme/AnimatedThemeToggle.tsx` · `components/magicui/animated-theme-toggler.tsx` · `contexts/AuthContext useAuth` · `lib/icons (Activity, Bell, Eye, HelpCircle, LogOut, Search, Settings, User)`

**States & data.** useAuth() supplies user, profile and signOut; RailProfile early-returns null without a user, so the bottom group renders 3 items instead of 4 until auth resolves. Menu open state is local, closed by an outside mousedown listener and by Escape (both registered only while open). Theme state comes from next-themes resolvedTheme plus ThemeModeContext; AnimatedThemeToggle guards SSR by rendering the Moon until mounted. No SWR, no loading skeleton, no empty state.

**Interactions.** Copilot button dispatches window CustomEvent 'copilot:open' — the dock opens over the current page rather than navigating, and the same panel is bound to ⌘/ in CopilotProvider. Search button opens the ⌘K palette. Avatar toggles the dropdown; outside click or Escape closes it; Sign out awaits signOut() then returns to /. Theme button triggers the clip-path reveal. Every rail control has both aria-label and title, so hovering yields a native tooltip — there is no custom tooltip component here.

**Responsive.** `hidden lg:flex` — the rail is desktop-only. Below 1024px its functions are split: Notifications and Settings move into the MobileDrawer footer, theme moves to Settings → Appearance, Copilot is reachable from the dock's own affordances, and search is only ⌘K.

**Key copy.** • "Open Copilot (⌘/)" · title "Copilot (⌘/)"
• Labels/tooltips: "Watchlist", "Notifications", "Search (⌘K)", "Activity", "Settings", "Help & plans", "Account menu"
• Menu: "Profile", "Settings", "Sign out"
• Theme: "Switch to light mode" / "Switch to dark mode"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a 72px-wide vertical utility rail pinned to the right edge of a dark trading dashboard. Fill #0D0D0E (same as the page), with a single 1px #29292D hairline on its left edge, 12px vertical padding, all items horizontally centred.

Top item: a 40px circular button filled with a 110° gradient from #3B82F6 to #406AE4, carrying symmetric white inner bevels (4px, 30% white on both diagonals) and a blue drop glow, containing a white 20px robot/chip glyph. Beneath it a 24×1px #29292D divider.

Then four 40px circular icon buttons stacked with 8px gaps, all 20px outline glyphs in #96969E: an eye (Watchlist), a bell (Notifications), a magnifier (Search), a pulse line (Activity). Hover fills #1E1E21 and brightens the glyph to #F7F7F8.

Pinned to the bottom, four more: a gear (Settings), a question mark in a circle (Help), a circular avatar chip 26px filled #406AE4 with a white bold letter "R", and a sun glyph (theme).

Also draw the account dropdown in its open state: a 224px panel with 16px corner radius, fill #151517, 1px #29292D border, positioned to the LEFT of the rail and aligned to the bottom of the avatar. Its header shows a 32px #406AE4 circle "R", the name "Rishi Karthikeyan" at 12.5px and "rishi@example.com" at 10.5px #96969E. Below, three 13px rows separated by hairlines: Profile, Settings, and Sign out — Sign out turning #F5808C on a 10% red wash when hovered. Provide the light variant: rail #EDF1F4, hairline #DDE5ED, glyphs #5F6B75, panel #FFFFFF.
```
</details>

---

## `components/shell/CommandPalette.tsx (⌘K)` — Command Palette — intent-aware ⌘K command bar

**File** `components/shell/CommandPalette.tsx` · **445 LOC** · **Access** authed. One tier gate: the "Upgrade plan" action is filtered OUT when useTier() returns a non-free tier, so the Actions group has 6 rows on free and 5 on Pro/Elite. The F&O route row carries an "elite" tier chip.

**Shell** — Radix Dialog portal mounted by AppShell (overlay z-40, content z-50)

**Purpose.** The keyboard-first way to reach anything: every route (including ones with no sidebar item), any NSE symbol, five quick actions, and the AI itself. Its one real product idea is that it reads intent — a lookup ranks the AI row last, a question promotes it to the top and pre-selects it, so Enter sends the sentence straight to Copilot.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Overlay** | Radix Overlay `fixed inset-0 z-40 bg-black/60` with animate-overlay-in 160ms / overlay-out 140ms on cubic-bezier(.23,1,.32,1). |
| 2 | **Dialog surface** | Centred via `left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`, `rounded-sm border border-line bg-wrap shadow-soft` with the palette's own overrides `max-w-[600px] overflow-hidden p-0`. So: 600px wide, 8px radius, #151517 fill on dark / #FFFFFF on light, 1px #29292D hairline. Enter animation dialog-in 200ms (scale from 0.97, origin centre). |
| 3 | **Search header** | `flex items-center gap-2.5 border-b border-line px-4`. Search glyph 16px in d-text-muted; then the cmdk input — `h-12 border-0 px-0 text-sm placeholder:text-d-text-muted focus:ring-0`, autoFocus, no focus outline by design; then (conditionally) a 12px spinner `animate-spin rounded-full border-2 border-d-text-muted border-r-transparent` while symbols load; then a mono `rounded-xs border border-line px-1.5 py-0.5 text-[10px]` key cap reading "esc". |
| 4 | **Result list** | <CommandList> `max-h-[400px] px-1.5 py-1.5`, scrolls. cmdk owns roving focus, aria-activedescendant and listbox/option semantics; `shouldFilter={false}` because ranking is done in-app. |
| 5 | **Group headings** | Injected by the shadcn Command wrapper: `[cmdk-group-heading]` at `px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-d-text-muted`. |
| 6 | **Result row** | `relative flex cursor-default select-none items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm text-d-text-secondary` with 90ms colour transitions; selected row is `bg-surface-2 text-d-text-primary` (#1E1E21 / #F4F7F9). Icons are 15px and shrink-0; the label is a truncating flex-1 at 13px; trailing hints are 11px d-text-muted. |
| 7 | **Empty state** | <CommandEmpty> `px-3 py-10 text-center`: heading "Nothing matched “{query}”" at text-sm/600 d-text-primary, then a 12px d-text-secondary line "Press ↵ to ask Quant X instead." with ↵ inside a mono bordered key cap. |
| 8 | **ORDER 1 — Ask Quant X (question mode)** | Only when looksLikeQuestion(q): heading "Ask Quant X", one row with a 15px Sparkles glyph in text-primary, label "Ask Quant X: “{query}”" (the quoted part in d-text-secondary), and a trailing ↵ key cap. cmdk `value` is forced to '__ask__' so this row is pre-selected and Enter fires it. |
| 9 | **ORDER 2 — Ask about this page** | Only when the query is EMPTY, and only on four route families. /stock/{SYM}: three prompts — "Analyse {SYM}: trend, key levels, entry, stop and target", "Why is {SYM} moving today?", "Is {SYM} a buy right now — the bull vs bear case". /portfolio: "Analyse my portfolio for concentration and drawdown risk", "Which holding is my biggest risk?". /markets: "What's driving the market today?", "Find the strongest swing setups on the tape". /strategies: "Build a momentum strategy for Nifty 50 and backtest it". Each row uses the Sparkles glyph in text-primary. |
| 10 | **ORDER 3 — Recent** | Only when the query is empty and localStorage has entries. Heading "Recent", max 6 rows, ArrowRight glyph in d-text-muted, label plus optional 11px hint. Written by pushRecent on symbol and route selection, keyed 'quantx.palette.recents.v1', deduped by href. |
| 11 | **ORDER 4 — Symbols (error)** | When the instrument SWR errors: heading "Symbols" with one disabled row (opacity forced back to 100), ShieldAlert glyph in text-warning, copy "Symbol search is unavailable right now — pages and actions still work." — deliberately distinct from a zero-result lookup. |
| 12 | **ORDER 5 — Symbols (results)** | Heading "Symbols", up to 6 instruments from api.screener.searchInstruments(term, 6), locally re-ranked so RELIANCE beats RELINFRA. Row: TrendingUp glyph 15px d-text-muted, ticker at 13px in MONO (Geist Mono tabular), company name right-aligned at 11px d-text-muted capped at max-w-[45%]. Selecting navigates to stockHref(symbol) and pushes a recent. |
| 13 | **ORDER 6 — Go to** | Heading "Go to". 28 routes, prefix/word-start/contains/subsequence scored and sorted. Row: family icon (longest-prefix match over 20 icon prefixes, fallback TrendingUp), 13px label, optional tier chip `rounded-xs bg-highlight/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-highlight` (amber, only on F&O = 'elite'), then an 11px hint. Hints as written: Copilot "Ask anything", Markets "The daily read", Stocks "Browse the universe", Signals "All horizons", Screener "Describe a setup", AI Algos "Build & backtest", AutoPilot "Automated execution", Proof "Track record · accuracy · regime". |
| 14 | **ORDER 7 — Actions** | Heading "Actions", Sparkles glyph in d-text-muted. Rows: "New chat" (Copilot), "New screen" (Describe a setup), "New strategy" (Plain English → backtest), "Connect broker" (Zerodha · Upstox · Angel One), "Switch to dark theme"/"Switch to light theme" (Appearance), and "Upgrade plan" (Pro · Elite) — the last only for free/unknown tier. |
| 15 | **ORDER 8 — Ask Quant X (lookup mode)** | When the input does NOT read as a question, the identical AI row renders LAST with no group heading, so a failed lookup still has somewhere to go. |
| 16 | **Footer key legend** | `flex items-center gap-4 border-t border-line px-4 py-2 text-[10px] text-d-text-muted` — "↑↓ navigate", "↵ open", and right-aligned (ml-auto) "⌘K toggle", each glyph inside a mono `rounded border border-line px-1` cap. |

**Components** — `components/ui/command.tsx (shadcn wrapper over cmdk: Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem)` · `components/foundation Dialog (Radix)` · `lib/api api.screener.searchInstruments` · `contexts/ThemeModeContext useThemeMode` · `lib/hooks/useTier` · `lib/stock-href stockHref` · `lib/tokens MONO` · `lib/icons — 22 glyphs: ArrowRight, Award, BarChart3, Bell, Bot, Brain, Briefcase, CreditCard, Eye, FlaskConical, Gift, Inbox, Layers, LineChart, ScanLine, ScrollText, Search, Settings, ShieldAlert, Sparkles, TrendingUp, Wand2`

**States & data.** Symbol search is conditional and debounced: the query must be ≥2 chars AND contain no space (so a sentence for the agent never hits the instrument endpoint), then debounced 140ms, then SWR key ['palette:instruments', term] with keepPreviousData and shouldRetryOnError:false. Loading shows the 12px header spinner. Error shows the dedicated 'Symbol search is unavailable' row. On open the component resets the query, re-reads recents, and resolves the current theme by inspecting document.documentElement.classList for 'light' when mode is 'auto' — so the theme action always names the theme the user can actually see. Routes and actions are pure client-side scoring, no network.

**Interactions.** ⌘K/Ctrl+K toggles; Escape closes (AppShell) and Radix onOpenChange also closes. ↑↓ move selection with `loop` enabled; Enter runs the selected row. looksLikeQuestion() promotes and pre-selects the AI row when the input ends in '?', starts with one of 21 intent verbs (analyse/analyze/why/what/how/when/should/is/are/find/show/compare/explain/build/screen/scan/create/optimise/backtest/summarise/tell), or is 3+ words. Selecting the AI row pushes /copilot?q={encoded}. Selecting a symbol pushes the stock route and records a recent. The theme action goes through ThemeModeContext (never a raw classList toggle) so next-themes and the Settings control stay in sync.

**Responsive.** Fixed 600px max width, centred, `w-full` below that — on a 390px phone it becomes a near-full-width centred card with 8px radius. The result list is hard-capped at 400px tall and scrolls; the header, footer legend and the trailing esc cap never scroll away.

**Key copy.** • Placeholder: "Ask anything, or jump to a stock or page…"
• Empty: "Nothing matched “{q}”" / "Press ↵ to ask Quant X instead."
• AI row: "Ask Quant X: “{q}”"
• Group headings: "Ask Quant X", "Ask about this page", "Recent", "Symbols", "Go to", "Actions"
• Symbol error: "Symbol search is unavailable right now — pages and actions still work."
• Footer: "↑↓ navigate" · "↵ open" · "⌘K toggle" · header cap "esc"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a command palette overlay for a dark Indian stock-trading app. A 600px-wide centred card, 8px corner radius, fill #151517, 1px #29292D border, deep shadow, over a 60%-black scrim.

Header: a 48px-tall row with a bottom hairline — 16px magnifier in #96969E, then a borderless 14px input showing the typed text "reliance", then a small monospace key-cap "esc" in a 6px-radius #29292D outline.

Body: a 400px scrolling list, 6px side padding. Group headings are 10px uppercase, weight 600, letter-spacing 0.08em, #96969E. Rows are 8px-radius, 10px/8px padding, 15px outline icon, 13px label in #D3D3D7, with an optional right-side 11px hint in #96969E; the selected row fills #1E1E21 and brightens the label to #F7F7F8.

Groups in order: SYMBOLS — RELIANCE / Reliance Industries, RELINFRA / Reliance Infrastructure, RELAXO / Relaxo Footwears (tickers in monospace, up-arrow glyphs). GO TO — Copilot "Ask anything", Markets "The daily read", Signals "All horizons", Screener "Describe a setup", F&O with a tiny amber "ELITE" chip in #F0A94F on 12% amber. ACTIONS — New chat, New screen, Connect broker "Zerodha · Upstox · Angel One", Switch to light theme. Last row, no heading: a blue sparkle glyph in #8FB0FF and "Ask Quant X: “reliance”" with a ↵ key-cap.

Footer: a 10px legend strip above a hairline reading "↑↓ navigate", "↵ open", and right-aligned "⌘K toggle", each symbol in a small bordered monospace cap. Provide a light variant: card #FFFFFF, border #DDE5ED, selected row #F4F7F9, ink #1D1D1D, accent #3459C9.
```
</details>

---

## `components/shell/ComplianceFooter.tsx` — Compliance Footer — statutory block on every authed surface

**File** `components/shell/ComplianceFooter.tsx` · **97 LOC** · **Access** authed (every route wrapped by AppShell). No tier gate.

**Shell** — Rendered by AppShell inside <main>, in its own max-w-[1440px] column below the page content

**Purpose.** The legally load-bearing block. It states in the interface that Quant X is not a SEBI-registered Research Analyst or Investment Adviser, that outputs are informational only, and it routes grievances to SEBI SCORES. It renders on EVERY authenticated route because 'reachable from one route' is not reachable.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Footer container** | `space-y-2.5 border-t border-line px-4 py-8 text-micro leading-relaxed text-d-text-muted md:px-6` — a 1px top hairline, 32px vertical padding, 16px→24px side padding matching the shell gutter, 10px paragraph rhythm. `text-micro` = 11px/14, letter-spacing 0.06em, weight 500 — the smallest size the type system permits, and the only place it appears as body copy. |
| 2 | **Paragraph 1 — entity** | "© 2021–2026 Quant X Technologies Private Limited [entity to be confirmed]. All rights reserved. CIN: [pending]." |
| 3 | **Paragraph 2 — the disclaimer** | The longest block. "Quant X is" + an inline d-text-secondary emphasis span "not a SEBI-registered Research Analyst or Investment Adviser" + "and holds no stock-exchange algo empanelment. All tools, signals, backtests and AI outputs are informational and educational only — not investment advice, not a recommendation to buy or sell, and not a guarantee of returns. You trade on your own broker account at your own risk. Investments in the securities market are subject to market risks; read all related documents carefully." |
| 4 | **Paragraph 3 — registrations** | "SEBI registration: [pending] · GSTIN: [pending] · Registered & Corporate Office: [address to be confirmed]." |
| 5 | **Paragraph 4 — grievance** | "For any query / feedback / grievance, email [grievance email to be confirmed]. Unresolved complaints can be escalated on SEBI SCORES." |
| 6 | **Link rows** | `flex flex-wrap items-start gap-x-6 gap-y-2 pt-2` holding two `flex flex-wrap items-center gap-x-3 gap-y-1` clusters. |
| 7 | **Important Links cluster** | Bold d-text-secondary label "Important Links:" then 4 external anchors (target=_blank rel=noopener noreferrer) in text-primary with hover:opacity-80 — SEBI (sebi.gov.in), SCORES (scores.sebi.gov.in), NSE (nseindia.com), BSE (bseindia.com). |
| 8 | **Important Information cluster** | Bold d-text-secondary label "Important Information:" then 4 internal next/link items in text-primary — Terms of Usage (/legal/terms), Privacy Policy (/legal/privacy), Disclaimer (/legal/disclaimer), Risk Disclosure (/legal/risk). |

**Components** — `next/link` · `no icons, no data`

**States & data.** Server component, fully static, no state and no data fetching. The bracketed placeholders — CIN, SEBI registration, GSTIN, address and grievance email — are DELIBERATE and documented as such in the file: a fabricated registration number is materially worse than a visible gap. Do not replace them with plausible-looking values in a redesign.

**Interactions.** Links only. External links open in a new tab with noopener noreferrer; legal links are client-side route pushes. Nothing collapses, expands or dismisses.

**Responsive.** Side padding steps 16px → 24px at md, matching the shell gutter so it aligns with page content. Both link clusters wrap independently (gap-x-6 between clusters, gap-x-3 within), so on a phone the labels and links stack into multiple rows.

**Key copy.** Reproduce verbatim, including the bracketed placeholders:
• "© 2021–2026 Quant X Technologies Private Limited [entity to be confirmed]. All rights reserved. CIN: [pending]."
• "Quant X is not a SEBI-registered Research Analyst or Investment Adviser and holds no stock-exchange algo empanelment. All tools, signals, backtests and AI outputs are informational and educational only — not investment advice, not a recommendation to buy or sell, and not a guarantee of returns. You trade on your own broker account at your own risk. Investments in the securities market are subject to market risks; read all related documents carefully."
• "SEBI registration: [pending] · GSTIN: [pending] · Registered & Corporate Office: [address to be confirmed]."
• "For any query / feedback / grievance, email [grievance email to be confirmed]. Unresolved complaints can be escalated on SEBI SCORES."
• "Important Links:" SEBI · SCORES · NSE · BSE
• "Important Information:" Terms of Usage · Privacy Policy · Disclaimer · Risk Disclosure

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a dense statutory footer for an Indian stock-market software product, sitting at the bottom of a dark app page. Full width up to a 1440px column, a single 1px #29292D hairline on top, 32px vertical padding, 24px side padding, and 10px spacing between paragraphs.

All body text is 11px with 14px line height, letter-spacing 0.06em, weight 500, colour #96969E — deliberately the smallest text in the product. Four stacked paragraphs of Indian regulatory boilerplate: a copyright line naming a Private Limited entity with a CIN, then the key disclaimer paragraph in which the clause "not a SEBI-registered Research Analyst or Investment Adviser" is lifted to a brighter #D3D3D7 while the rest stays muted, then a registrations line with SEBI registration, GSTIN and registered office, then a grievance line pointing unresolved complaints to SEBI SCORES.

Below the paragraphs, a wrapping row with two link clusters separated by 24px. Cluster one is labelled "Important Links:" in semibold #D3D3D7 followed by SEBI, SCORES, NSE and BSE. Cluster two is labelled "Important Information:" followed by Terms of Usage, Privacy Policy, Disclaimer and Risk Disclosure. Every link is #8FB0FF and dims to 80% opacity on hover; links inside a cluster are 12px apart and wrap gracefully on a 390px phone.

No icons, no logo, no social buttons, no newsletter field — this block is legal text and links only. Provide a light-theme version: hairline #DDE5ED, body #5F6B75, emphasis #4D585F, links #3459C9.
```
</details>

---

## `components/shell/AutopilotStickyStop.tsx` — AutoPilot sticky stop — mobile panic FAB + confirm sheet

**File** `components/shell/AutopilotStickyStop.tsx` · **117 LOC** · **Access** authed AND conditional: renders nothing unless the SWR autopilot status returns enabled === true. Also mobile-only (md:hidden), so on desktop it never appears regardless of state.

**Shell** — Sibling of AppShell, mounted by app/(platform)/layout.tsx

**Purpose.** A one-tap kill switch for the automated trading bot, floating on every mobile page while AutoPilot is live. It exists because 80% of Indian retail is on mobile and a multi-step desktop dialog pushes panicking users to close positions in Kite instead of in the product.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Floating action button** | `fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-down bg-down/20 text-down shadow-xl backdrop-blur-md md:hidden` — a 56px circle 80px up from the bottom and 16px from the right, with a 2px semantic-down border (#F5808C dark / #B81C22 light), a 20% down-tinted translucent fill and a real backdrop blur. Hover deepens to bg-down/30; press scales to 0.95. |
| 2 | **FAB glyph** | PauseCircle (solar:pause-circle-linear) at 28px. |
| 3 | **STOP tag** | `absolute -bottom-5 right-0 whitespace-nowrap rounded-xs bg-down px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white` reading "STOP" — a solid red chip hanging 20px below the circle. Note the 9px size sits below the design system's 11px floor; it is as-built. |
| 4 | **Confirm scrim** | `fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center` — bottom-anchored on phones (a sheet), centred at md. |
| 5 | **Confirm card** | `w-full max-w-md rounded-lg border border-line bg-main p-5 shadow-2xl` — 16px radius, --color-main fill, 20px padding, stopPropagation so taps inside do not dismiss. |
| 6 | **Card header** | A 40px `rounded-full bg-down/15 text-down` circle with a 24px PauseCircle, then a stacked title "Pause AutoPilot?" at text-base/600 d-text-primary and a 12px d-text-muted sub "Stops new trades — open positions are unaffected." |
| 7 | **Card body** | 14px d-text-secondary paragraph: "AutoPilot will stop placing new orders. Existing positions remain at the broker with their stop-loss intact. You can re-enable from /autopilot anytime." — with /autopilot inside a `rounded bg-wrap px-1` <code> chip. |
| 8 | **Card actions** | `mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end` — foundation Button variant="ghost" labelled "Cancel", and a destructive Button `bg-down text-white hover:bg-down/90` labelled "Pause AutoPilot now", switching to "Pausing…" while submitting. Both disable during submit; the scrim also refuses to close while submitting. |

**Components** — `components/foundation Button, toast (sonner)` · `lib/api api.autoTrader.status / api.autoTrader.toggle, handleApiError` · `lib/icons PauseCircle` · `swr useSWR`

**States & data.** SWR key 'autopilot_status_mobile' → api.autoTrader.status(), revalidateOnFocus:true, dedupingInterval 60s. `if (!data?.enabled) return null` — so there is no loading skeleton and no disabled state; the control is either fully present or entirely absent. Pause path: toggle(false) → sonner success toast "AutoPilot paused" with description "No new trades will be placed. Open positions remain." → close → mutate() → router.push('/autopilot'). Failure path: toast.error("Pause failed") with handleApiError(e) as the description. Sonner is configured globally in app/providers.tsx at position top-right, theme="system", 8px radius, bg var(--color-wrap), 1px var(--color-line) border.

**Interactions.** Tap FAB → confirm opens. Tap scrim → close (blocked while submitting). Tap Cancel → close. Tap "Pause AutoPilot now" → disables both buttons, shows "Pausing…", fires the toggle, then toasts and navigates to /autopilot. There is no Escape handler and no focus trap on this dialog — it is hand-rolled, not the foundation Dialog.

**Responsive.** `md:hidden` on the FAB — desktop users never see it. The confirm overlay is `items-end` on phones (the card rises from the bottom edge with 16px inset) and `md:items-center`, and its buttons stack vertically below sm and go horizontal right-aligned at sm and up. The bottom-20 offset (80px) clears typical mobile bottom chrome.

**Key copy.** • FAB aria-label "Pause AutoPilot" · chip "STOP"
• "Pause AutoPilot?"
• "Stops new trades — open positions are unaffected."
• "AutoPilot will stop placing new orders. Existing positions remain at the broker with their stop-loss intact. You can re-enable from /autopilot anytime."
• Buttons "Cancel" · "Pause AutoPilot now" · "Pausing…"
• Toasts: "AutoPilot paused" / "No new trades will be placed. Open positions remain." · "Pause failed"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a mobile emergency-stop control for an automated trading bot in a dark Indian stock-trading app.

First, the floating button: a 56px circle fixed 80px above the bottom edge and 16px from the right, with a 2px #F5808C border, a translucent red fill at 20% opacity, a real background blur behind it and a strong drop shadow. Inside, a 28px outline pause-circle glyph in #F5808C. Hanging 20px below the circle, aligned to its right edge, a small solid #F5808C chip with 6px radius holding the word "STOP" in 9px uppercase white with wide letter spacing. Show it floating over a portfolio screen listing RELIANCE 40 qty ₹1,19,220, TCS 15 qty ₹57,825 and HDFCBANK 60 qty ₹98,565, with a running P&L of +₹18,420.

Second, the confirmation sheet it opens: a 70%-black scrim with the card anchored to the bottom of the screen with 16px inset. Card is full width up to 448px, 16px corner radius, fill #0D0D0E, 1px #29292D border, 20px padding, heavy shadow. Header row: a 40px circle filled red at 15% opacity holding a 24px pause glyph, then "Pause AutoPilot?" at 16px semibold #F7F7F8 with a 12px #96969E line "Stops new trades — open positions are unaffected." Body paragraph at 14px #D3D3D7 explaining that existing positions stay at the broker with stop-losses intact, with "/autopilot" rendered as an inline code chip on #151517. Two stacked full-width buttons: a ghost "Cancel" and a solid #F5808C "Pause AutoPilot now" with white text. Show the desktop variant where the card is centred and the buttons sit side by side, right-aligned.
```
</details>

---

## `app/layout.tsx` — Root document + provider stack

**File** `app/layout.tsx` · **106 LOC** · **Access** public (wraps everything; AuthProvider and ClientAuthGate live inside Providers)

**Shell** — root — nothing wraps it

**Purpose.** The HTML document itself: fonts, theme class, viewport, metadata and the provider tree every surface depends on. It decides that dark is the derived default, that the page has a film grain, and that a toast surface, an offline banner and a global Copilot dock exist on every route.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **<html>** | lang="en", className = `${GeistSans.variable} ${GeistMono.variable}`, suppressHydrationWarning (next-themes writes the light/dark class before paint). next-themes owns html.light / html.dark; :root derives DARK tokens and html.light overrides to LIGHT — there is no hardcoded 'dark' class. |
| 2 | **<body>** | `font-sans bg-main antialiased noise-overlay` with inline `color: var(--color-light)`. `.noise-overlay::after` paints a fixed 256×256 fractal-noise SVG tile at opacity 0.018 with mix-blend-mode overlay at z-index 9999 over the entire viewport. |
| 3 | **Body wrapper** | A single `<div class="min-h-screen">` containing <Providers>{children}</Providers>. |
| 4 | **Viewport config** | width=device-width, initialScale 1, maximumScale 5, userScalable true, viewportFit 'cover' (content extends into the iOS notch/home-indicator, with safe-area utilities keeping real content clear), themeColor '#0D0D0E'. |
| 5 | **Metadata** | metadataBase from NEXT_PUBLIC_SITE_URL (fallback https://quantx.app). Title "AI Swing Trading Platform for NSE/BSE \| Quant X". Description "AI market intelligence for Indian stocks. Engine-based signals, transparent track record, paper-trade free." Keywords: swing trading, trading signals, NSE, BSE, stock market, risk management, India. OG title "Quant X \| AI Swing Trading Intelligence", siteName "Quant X", image /opengraph-image at 1200×630 with alt "Quant X — AI swing trading intelligence for Indian markets". Twitter card summary_large_image. |
| 6 | **Provider 1 — ThemeProvider** | next-themes: attribute="class", defaultTheme="system", enableSystem, storageKey="quantx.theme", disableTransitionOnChange. |
| 7 | **Provider 2 — ThemeModeProvider** | Layers a 3-way intent (light / dark / auto) on top; 'auto' follows BOTH prefers-color-scheme AND local time of day, updating live. |
| 8 | **Provider 3 — MotionConfig** | framer-motion reducedMotion="user" — every animation in the tree honours prefers-reduced-motion. |
| 9 | **Provider 4 — SWRConfig** | revalidateOnFocus false, dedupingInterval 5000, errorRetryCount 3, errorRetryInterval 5000, shouldRetryOnError true — the global default every shell fetch inherits unless overridden. |
| 10 | **Provider 5/6 — AuthProvider → UiModeProvider** | Then, in order: <ClientAuthGate/>, <OfflineBanner/>, <GlobalCopilot/>, then {children}. |
| 11 | **ThemedToaster** | sonner <Toaster theme="system" position="top-right"> with toast style background var(--color-wrap), 1px solid var(--color-line), borderRadius 8px, color var(--color-light). Sonner's richColors is deliberately NOT used — duotone comes from app tokens. |
| 12 | **Card spotlight effect** | useCardSpotlight() attaches ONE passive pointermove listener on document; it finds the hovered `.glass-card` via closest() and writes --mouse-x / --mouse-y percentages on it inside a rAF, instead of iterating every card each frame. |

**Components** — `app/providers.tsx` · `geist/font/sans + geist/font/mono` · `next-themes ThemeProvider` · `framer-motion MotionConfig` · `sonner Toaster` · `swr SWRConfig` · `contexts/AuthContext, contexts/UiModeContext, contexts/ThemeModeContext` · `components/auth/ClientAuthGate` · `components/copilot/GlobalCopilot` · `components/system/OfflineBanner`

**States & data.** No data of its own. The theme boot script injected by next-themes runs before paint, which is why suppressHydrationWarning is required. Global loading falls to app/loading.tsx; global errors to app/error.tsx and, if the layout itself throws, app/global-error.tsx.

**Interactions.** Provides ⌘/ (Copilot dock, via CopilotProvider inside GlobalCopilot), the global toast surface, and the pointer spotlight on any element carrying `.glass-card`. Theme changes are driven from the right rail, Settings → Appearance, or the palette's theme action.

**Responsive.** viewportFit 'cover' plus safe-area CSS utilities. maximumScale 5 with userScalable true — pinch-zoom is deliberately allowed. The noise overlay and page fill are viewport-fixed, so they never scroll.

**Key copy.** • <title> "AI Swing Trading Platform for NSE/BSE | Quant X"
• meta description "AI market intelligence for Indian stocks. Engine-based signals, transparent track record, paper-trade free."
• OG/Twitter title "Quant X | AI Swing Trading Intelligence"
• OG/Twitter description "Engine-based AI signals for Indian markets. Public track record, paper-trade free."
• OG image alt "Quant X — AI swing trading intelligence for Indian markets"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Define the global document canvas and toast layer for a dark-first Indian stock-market web app called Quant X.

Base page: fill #0D0D0E with body ink #F7F7F8, antialiased. Over the whole viewport lay an almost invisible monochrome film grain — a repeating 256px fractal-noise tile at 1.8% opacity in overlay blend mode, fixed so it never scrolls. Do not tint it; it must read as texture, not colour.

Typography: Geist Sans for prose and Geist Mono with tabular figures for every number. Prose roles: display 34/40 at −0.02em weight 600, title 24/32 at −0.015em weight 600, heading 17/24 weight 600, body 15/24, label 13/18 weight 500, meta 12/16, micro 11/14 uppercase +0.06em weight 500. Numeric roles: hero 40/44, large 22/28, base 14/20, small 13/18.

Show a representative page on this canvas: a title "Markets", a hero number ₹24,318.85 with a +0.62% chip, and a row of stat cards for NIFTY 50, BANKNIFTY, INDIA VIX 13.42 and Advance/Decline 31–19.

Toast layer: notifications appear top-right as 8px-radius cards filled #151517 with a 1px #29292D border and #F7F7F8 text — for example "AutoPilot paused — No new trades will be placed. Open positions remain." Keep toast colour neutral; never use saturated success/error fills.

Also produce the exact light counterpart driven by the same structure: canvas #EDF1F4, cards #FFFFFF, hairlines #DDE5ED, ink #1D1D1D, muted #5F6B75, with the accent staying #406AE4 as a fill and shifting to #3459C9 as text.
```
</details>

---

## `app/loading.tsx` — Root loading skeleton

**File** `app/loading.tsx` · **13 LOC** · **Access** public / any

**Shell** — standalone full-bleed (no AppShell)

**Purpose.** The Suspense fallback for the root segment — a bare page-shaped skeleton shown while a top-level route streams in. It renders outside the AppShell, so it is a full-viewport standalone surface with no nav.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page** | `min-h-screen bg-main` — full viewport on the page canvas. |
| 2 | **Column** | `mx-auto max-w-7xl px-6 py-12 space-y-4` — note the 1280px cap and 24px gutter, which do NOT match the AppShell's 1440px / 16-24px column. 48px vertical padding, 16px rhythm. |
| 3 | **Title bar** | Skeleton w=200px h=32px — stands in for a page title. |
| 4 | **Subtitle bar** | Skeleton w=320px h=14px. |
| 5 | **Content block** | Skeleton h=320px rounded="lg" className="mt-8" — 32px gap above. IMPORTANT: Skeleton's ROUNDED map sends 'lg' to the `rounded-sm` class = 8px, and its default 'md' to `rounded-xs` = 6px. So this block is 8px, not 16px. |
| 6 | **Skeleton treatment** | All bars are `animate-pulse bg-line/80` — the L3 hairline colour at 80% alpha (#29292D dark / #DDE5ED light), which is what makes them legible on white cards in light mode. |

**Components** — `components/foundation Skeleton`

**States & data.** Pure static fallback. There is a SECOND, richer skeleton for the platform group at app/(platform)/loading.tsx: `mx-auto max-w-7xl px-6 py-8 space-y-4` with a 180×28 title bar, a 280×14 subtitle, then a `grid grid-cols-2 gap-4 md:grid-cols-4` of four 80px-tall rounded blocks, then a 320px block with mt-6. That is the one authed users actually see, and it correctly mirrors a KPI-row + chart page.

**Interactions.** None — no interactive elements at all.

**Responsive.** Root version: single column, no breakpoint changes, 24px gutters at every width. Platform version: the stat grid is 2 columns below md and 4 columns at md and up.

**Key copy.** None — zero text by design. There is no 'Loading…' string.

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a loading skeleton screen for a dark Indian trading dashboard. Full viewport on #0D0D0E, content centred in a 1280px column with 24px side gutters and 48px top padding.

Stack, with 16px gaps: a 200×32px bar standing in for the page title, a 320×14px bar for the subtitle, then a 32px gap, then a full-width 320px-tall block. All placeholders use the same treatment — fill #29292D at 80% opacity, 8px corner radius on the large block and 6px on the bars, with a slow gentle pulse animation (fade between roughly 100% and 50% opacity over about 2 seconds, no shimmer sweep, no gradient).

Also design the authenticated variant, which is what most users see: same 1280px column but 32px top padding, a 180×28 title bar, a 280×14 subtitle bar, then a four-across grid of 80px-tall blocks with 16px gaps that collapses to two across below 768px, then a 320px-tall block below it. This shape is deliberately the silhouette of a KPI row plus a chart, so the page does not jump when NIFTY 50, BANKNIFTY, INDIA VIX and Advance/Decline tiles and the equity curve arrive.

No text anywhere — no "Loading", no spinner, no logo, no progress bar. Provide the light theme too: canvas #EDF1F4, placeholders #DDE5ED at 80%.
```
</details>

---

## `app/error.tsx` — Root error boundary

**File** `app/error.tsx` · **105 LOC** · **Access** public / any

**Shell** — standalone full-bleed (no AppShell)

**Purpose.** What a user sees when a top-level route throws. It reports the error, then shows an animated 'broken chart' illustration and a single Try again action — a recoverable failure stated plainly, with no stack trace.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page** | `flex min-h-screen items-center justify-center p-6 bg-wrap` — full viewport, centred, on --color-wrap (#151517 dark / #FFFFFF light), NOT the usual page canvas. |
| 2 | **Motion container** | framer-motion div, initial {opacity 0, y 20} → animate {opacity 1, y 0}, duration 0.5s easeOut, `max-w-md text-center` (448px). |
| 3 | **Rotating dashed ring** | 96px (w-24 h-24) relative box. An absolutely positioned SVG on `animate-[spin_8s_linear_infinite]`: circle cx=48 cy=48 r=44, stroke var(--color-down), strokeWidth 2, strokeDasharray "8 6", opacity 0.6. |
| 4 | **Inner glow** | `absolute inset-3 rounded-full bg-down/10 blur-md`. |
| 5 | **Pulsing exclamation** | Centred motion.span animating scale [1, 1.15, 1] over 2s, repeat Infinity, easeInOut. `text-down text-4xl font-bold select-none` — a single "!" at 36px. |
| 6 | **Broken chart glyph** | 120×32 SVG at opacity-60, three paths all stroked var(--color-down) at 2px, round caps/joins: an upward run "M4 28 L30 20 L50 22 L70 12 L82 8"; a dashed break "M82 8 L88 10" (dasharray 2 3, opacity .4); then a crash "M88 10 L100 24 L116 28" at opacity .5. |
| 7 | **Heading** | "Something went wrong" — `mb-2 text-xl font-bold text-d-text-primary` (20px). |
| 8 | **Body** | "An unexpected error occurred. Please try again." — `mb-6 text-sm text-d-text-muted` (14px). |
| 9 | **Action** | A single button: `rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover` — 12px radius, solid #406AE4, white ink, hover #3055C2. Label "Try again", calls reset(). |

**Components** — `framer-motion motion` · `lib/reportError reportError`

**States & data.** A useEffect fires reportError({ error, boundary: 'route', digest: error.digest }) on mount. The digest is NOT surfaced in the UI here (unlike global-error, which prints it). There is a narrower sibling at app/(platform)/error.tsx that renders INSIDE the shell: `min-h-[60vh]` centred, max-w-sm, an 80px ring (r=36, strokeWidth 1.5, dasharray "6 5", opacity .5), a 30px "!", heading "Something went wrong" at text-lg/700, body "An unexpected error occurred.", and a `glass-control-accent rounded-full px-5 py-2` Try again button (solid #406AE4 with a 1px matching border and elev-1, pressing to 0.98 scale).

**Interactions.** One control. Click "Try again" → Next.js reset(). No reload button, no support link, no error detail disclosure at this level. All motion is subject to the global MotionConfig reducedMotion="user", so the fade-in and pulse collapse for reduced-motion users; the CSS 8s spin is a plain Tailwind animation and is not gated.

**Responsive.** Single centred column at every width, capped at 448px with 24px padding — nothing changes across breakpoints. The platform variant fills 60vh instead of the viewport so the surrounding shell chrome stays usable.

**Key copy.** • "Something went wrong"
• "An unexpected error occurred. Please try again." (platform variant drops the second sentence)
• "Try again"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a full-page error state for a dark Indian stock-trading app. Centre everything on a #151517 background, content capped at 448px, 24px padding, entering with a subtle 20px upward fade over 500ms.

The illustration is the point. Build a 96px square: a slowly rotating dashed circle outline (radius 44 in a 96 box, 2px stroke, dash pattern 8 on / 6 off, #F5808C at 60% opacity, one full rotation every 8 seconds, linear), a soft blurred red glow filling the inside at 10% opacity, and a single bold exclamation mark centred at 36px in #F5808C, gently pulsing between 100% and 115% scale every 2 seconds.

Below it, a 120×32px "broken chart" glyph at 60% opacity, all in #F5808C with 2px round-capped strokes: a line climbing from bottom-left through a few peaks, then a short dashed gap at the top, then a hard crash down to the bottom-right at reduced opacity. It should read as an equity curve that snapped.

Text: "Something went wrong" at 20px bold #F7F7F8, then "An unexpected error occurred. Please try again." at 14px #96969E with 24px below.

One action only: a solid #406AE4 button with 12px corner radius, 24px horizontal and 10px vertical padding, 14px medium white label "Try again", darkening to #3055C2 on hover. No stack trace, no error code, no support link, no secondary button.

Provide the light theme: background #FFFFFF, red #B81C22, heading #1D1D1D, body #5F6B75.
```
</details>

---

## `app/not-found.tsx` — 404 — Page not found

**File** `app/not-found.tsx` · **37 LOC** · **Access** public / any

**Shell** — standalone full-bleed (no AppShell)

**Purpose.** The dead-end recovery screen. It states the URL is wrong and offers exactly two exits: the marketing home and the authed home.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page** | `flex min-h-screen items-center justify-center bg-main p-6` — full viewport on the page canvas (#0D0D0E / #EDF1F4), 24px padding. |
| 2 | **Column** | `max-w-lg text-center` — 512px. |
| 3 | **404 numeral** | `mb-4 font-mono text-7xl font-black tracking-tighter text-primary sm:text-8xl` — Geist Mono, 72px growing to 96px at sm, weight 900, tight tracking, in the brand INK (#8FB0FF dark / #3459C9 light — not the #406AE4 fill). |
| 4 | **Heading** | "Page not found" — `mb-3 text-2xl font-bold tracking-tight text-d-text-primary sm:text-3xl` (24px → 30px). |
| 5 | **Body** | `mx-auto mb-10 max-w-sm text-sm leading-relaxed text-d-text-muted` (14px, 384px measure, 40px below): "The page you're looking for doesn't exist or has been moved. Check the URL or head back to familiar territory." |
| 6 | **Action row** | `flex items-center justify-center gap-3` — two buttons side by side, 12px apart, at EVERY width (they do not stack). |
| 7 | **Primary action** | Link → `/`: `inline-flex items-center gap-2 rounded-xs bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover` — 6px radius, solid #406AE4, white ink, ArrowLeft glyph 16px, label "Go home". |
| 8 | **Secondary action** | Link → `/copilot`: `inline-flex items-center gap-2 rounded-xs border border-line bg-wrap px-6 py-2.5 text-sm font-medium text-d-text-secondary hover:border-wrap-line hover:bg-wrap-hover hover:text-d-text-primary` — 6px radius, L1 fill with a hairline, LayoutDashboard glyph (solar:widget-linear) 16px, label "Dashboard". |

**Components** — `next/link` · `lib/icons ArrowLeft, LayoutDashboard`

**States & data.** Static server component. No data, no state, no reporting call. Note the secondary button is labelled "Dashboard" but points at /copilot — /dashboard itself was retired and its Command Center cockpit now lives as the authed home band on /copilot.

**Interactions.** Two links. Hover on the primary darkens the fill to #3055C2; hover on the secondary lifts the border to L4 (#3B3B40 / #C8D4DE), fills to L2 and brightens the ink.

**Responsive.** The numeral steps 72px → 96px and the heading 24px → 30px at sm (640px). Everything else is fixed; the two buttons stay in a row even on a 320px screen.

**Key copy.** • "404"
• "Page not found"
• "The page you're looking for doesn't exist or has been moved. Check the URL or head back to familiar territory."
• "Go home" · "Dashboard"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a 404 page for a dark Indian stock-market app. Full viewport on #0D0D0E, everything centred, content capped at 512px with 24px padding.

Top: the numerals "404" set in a MONOSPACE face at 96px, weight 900, very tight letter spacing, coloured #8FB0FF — the brand's text-ink blue, noticeably lighter than the #406AE4 button fill. Below it, 16px down, "Page not found" at 30px bold with tight tracking in #F7F7F8. Below that, a 384px-wide paragraph at 14px with relaxed line height in #96969E: "The page you're looking for doesn't exist or has been moved. Check the URL or head back to familiar territory." Leave 40px before the actions.

Two buttons side by side, 12px apart, both with only a 6px corner radius, 24px horizontal and 10px vertical padding, 14px medium labels. The first is solid #406AE4 with white text and a left-pointing arrow icon, labelled "Go home", darkening to #3055C2 on hover. The second is a quiet button: fill #151517, 1px #29292D border, text #D3D3D7, a small dashboard/widget grid icon, labelled "Dashboard"; on hover the border lifts to #3B3B40, the fill to #1E1E21 and the text to #F7F7F8.

No illustration, no search field, no suggested links, no footer. On a phone the numerals shrink to 72px and the heading to 24px but the two buttons stay in one row.

Provide the light theme: canvas #EDF1F4, numerals #3459C9, heading #1D1D1D, body #5F6B75, secondary button #FFFFFF with a #DDE5ED border.
```
</details>

---

## `app/global-error.tsx` — Global error — last line of defence

**File** `app/global-error.tsx` · **140 LOC** · **Access** public / any

**Shell** — standalone — it replaces the document

**Purpose.** Fires when an error escapes the root layout itself (Providers, AuthProvider, font loading). Next.js replaces the entire shell, so this screen renders its own html/body and cannot rely on Tailwind or the token system — every style is inlined with literal hex values.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **<body> (inline styles only)** | margin 0, minHeight 100vh, flex centred, padding 24px, fontFamily 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' (NOTE: Inter, not Geist or Plus Jakarta — the font vars are gone at this point), background #0D0D0E, color #F7F7F8. These are the literal dark tokens hardcoded; there is no light variant of this screen. |
| 2 | **Column** | maxWidth 420, textAlign center. |
| 3 | **Error badge** | 56×56 circle (borderRadius 999) with background rgba(245,128,140,0.1) and a 1px rgba(245,128,140,0.35) border, centred, 20px below. Inside a single "!" at 28px, weight 700, lineHeight 1, colour #F5808C. |
| 4 | **Heading** | <h1> margin 0, fontSize 20, fontWeight 600: "Quant X hit a critical error". |
| 5 | **Body** | margin '12px 0 24px', fontSize 13, lineHeight 1.6, colour #96969E: "We logged it and will take a look. You can retry below, or reload the page." — followed, ONLY when error.digest exists, by a monospace 11px span reading "ref: {digest}". |
| 6 | **Action row** | flex, gap 10, centred, flexWrap wrap. |
| 7 | **Primary button** | padding '10px 20px', fontSize 13, fontWeight 600, colour #FFFFFF, background #406AE4, no border, borderRadius 999 (full pill), cursor pointer. Label "Try again" → reset(). |
| 8 | **Secondary button** | padding '10px 20px', fontSize 13, fontWeight 500, colour #F7F7F8, background transparent, border '1px solid #29292D', borderRadius 999. Label "Reload app" → window.location.reload(). |

**Components** — `lib/reportError reportError (the only import besides useEffect)`

**States & data.** useEffect fires reportError({ error, boundary: 'global', digest: error.digest }) on mount. The digest IS shown here — the only surface in the app that prints it — so a user can quote a reference. No theme awareness whatsoever: it renders dark unconditionally.

**Interactions.** Two buttons: "Try again" calls Next's reset(); "Reload app" calls window.location.reload() guarded by a typeof window check. They wrap onto two rows on very narrow screens.

**Responsive.** Only flexWrap on the button row and the 24px body padding — there are no media queries, because no stylesheet is guaranteed to have loaded.

**Key copy.** • "Quant X hit a critical error"
• "We logged it and will take a look. You can retry below, or reload the page."
• "ref: {digest}" (conditional, monospace 11px)
• "Try again" · "Reload app"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a bare-bones catastrophic error screen for a dark web app called Quant X — the state shown when the entire application shell has failed, so it must look intentional using nothing but system fonts and flat colour.

Full viewport, background #0D0D0E, text #F7F7F8, everything centred, 24px padding, content capped at 420px. Typeface is a plain system sans (Inter / -apple-system / Segoe UI), not a branded face.

Top: a 56px circle with a fully round radius, filled #F5808C at 10% opacity with a 1px #F5808C border at 35% opacity, containing a single "!" at 28px weight 700 in #F5808C. Leave 20px below it.

Heading: "Quant X hit a critical error" at 20px weight 600, no margin above. Body at 13px with 1.6 line height in #96969E: "We logged it and will take a look. You can retry below, or reload the page." followed inline by a small monospace reference at 11px reading "ref: 8f2c41ae". Leave 24px below.

Two pill buttons in a centred row 10px apart, both fully rounded with 10px vertical and 20px horizontal padding at 13px: the first solid #406AE4 with white semibold text reading "Try again"; the second transparent with a 1px #29292D border and #F7F7F8 text reading "Reload app". Let them wrap onto two rows on a narrow phone.

No logo, no illustration, no navigation, no footer, and no light-theme variant — this screen is always dark, because the theme system is exactly what failed.
```
</details>

---

## `/preview-design` — Design system preview (dev-only)

**File** `app/preview-design/page.tsx` · **196 LOC** · **Access** public in dev, HARD-GATED in production — the component's first statement is `if (process.env.NODE_ENV === 'production') notFound()`, so on a production build this route renders the 404 page.

**Shell** — standalone full-bleed (no AppShell, no nav, no footer)

**Purpose.** The internal specimen sheet. It renders every foundation primitive and the Copilot turn shape on one scrolling page so visual regressions are catchable by eye and by Playwright (every section carries a data-testid). It 404s in production.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Page root** | <main data-testid="preview-root"> `min-h-screen bg-main text-d-text-primary p-8 space-y-10` — 32px padding, 40px between sections, no max-width cap and no centring. |
| 2 | **1 · Entity card** | data-testid="sec-entity-card". Eyebrow "Entity card" as `font-sans font-semibold uppercase tracking-[0.12em] text-xs text-d-text-muted`. A max-w-[560px] <EntityCard> with symbol RELIANCE, name "Reliance Industries", price 2847.3, change 32.1, changePct 1.14, verdict "bullish", votes {bull 5, neutral 2, bear 1}, a 12-point series [2731…2847], and provenance "Indicator votes on settled closes to 2026-08-01." The verdict is sentiment, never a call — the file comments that this is because Quant X is not a SEBI-registered Research Analyst. |
| 3 | **2 · Turn shape** | data-testid="sec-turn". Eyebrow "Turn shape". max-w-[560px] stack: <ThinkingLine/>, then <TurnCard> with two artifacts — a table titled "Screener hits" with columns ['Change','Volume'] and 14 rows, and a gauge titled "Market regime" value 62 valueLabel "Bull · 62% confidence" — then <TurnDisclosure> with three steps (classifier "Understanding your question" ok 120ms; tool_caller "Fetching live data" ok 2280ms; tool_caller "Option chain" ERROR 4010ms with "Upstream timed out — used the EOD chain instead."), two references (symbol RELIANCE via "Price data"; regime "Bull regime" via "Market regime") and tools ['Price data','Market regime']. |
| 4 | **3 · Typography** | data-testid="sec-type". Eyebrow "Typography". `text-display-lg heading-display` h1 "Engineered restraint"; `text-display-sm heading-display text-gradient` h2 "Refined expressive"; body line "Body copy in Plus Jakarta Sans weight 400." (the copy string names Plus Jakarta, and the inline comments still describe the retired emerald→cyan gradient — as-built the gradient token is the blue family). |
| 5 | **4 · Buttons** | data-testid="sec-buttons", flex gap-3: Button variant primary "Primary", secondary "Outline pill", ghost "Ghost". |
| 6 | **5 · Cards** | data-testid="sec-cards", `grid grid-cols-2 gap-4` — exactly 2 columns at every width, no responsive collapse. Card one: "Card content" in d-text-primary. Card two: "Another card" in d-text-secondary. |
| 7 | **6 · Badges** | data-testid="sec-badges", flex gap-2: Badge tone="up" "+2.40%", tone="down" "-1.10%", tone="muted" "NEUTRAL". |
| 8 | **7 · Input** | data-testid="sec-input", max-w-sm: Input placeholder "Search symbol". |
| 9 | **8 · Tabs** | data-testid="sec-tabs". <EyebrowMono>Tabs</EyebrowMono>, then a Tabs defaultValue="overview" with triggers Overview / Signals / Risk and pt-4 content panels reading "Overview panel", "Signals panel", "Risk panel". |
| 10 | **9 · Data table** | data-testid="sec-table". EyebrowMono "Data table". DataTable ariaLabel="Demo symbols" with 3 columns — Symbol (sortable), Price (right-aligned), Change % (right-aligned) — and 3 rows: RELIANCE 2980.5 / +1.24, TCS 3855.0 / −0.62, INFY 1622.3 / +0.41. |
| 11 | **10 · Overlays** | data-testid="sec-overlays". EyebrowMono "Overlays" + <OverlaysDemo>: five secondary/ghost sm buttons — "Open dialog" (Dialog title "Confirm action", body "Dialog body in the xAI surface. Stays centered, scales in."), "Open sheet" (Sheet side=right title "Side sheet", body "Slides in from the right edge."), "Open popover" (w-56 p-3 with "Popover content" / "Scales from the trigger origin."), "Hover for tooltip" (content "Non-interactive hint"), and "Fire toast" → toast.success('Saved'). |
| 12 | **11 · PageHeader** | data-testid="sec-pageheader". PageHeader eyebrow "Today", title "Active swing signals", description "Generated at 09:15 IST · 12 candidates", actions = secondary sm Button "New strategy". |
| 13 | **12 · EmptyState** | data-testid="sec-empty", max-w-md. Inbox icon at h-6 w-6, title "No signals yet", description "Today's scan finishes at 09:15 IST. Check back then.", action = secondary sm Button "Refresh". |
| 14 | **13 · UsageMeter** | data-testid="sec-meter", flex-wrap gap-4: UsageMeter used=3 cap=5 label "symbols" and used=5 cap=5 label "signals today" (the second is the at-cap state). |
| 15 | **14 · Misc** | data-testid="sec-misc", flex gap-6: two filled Sparklines at width 96 height 28 — a rising series [10,12,9,14,13,17] and a falling one [17,13,14,9,12,8] — plus two Skeletons at 160×14 and 120×14. |

**Components** — `components/foundation: Button, Card, Badge, Input, EyebrowMono, Tabs/TabsList/TabsTrigger/TabsContent, DataTable + Column, EmptyState, PageHeader, UsageMeter, Sparkline, Skeleton, Dialog, Sheet, Popover, Tooltip, toast` · `components/copilot/EntityCard.tsx` · `components/copilot/ThinkingLine.tsx` · `components/copilot/TurnCard.tsx` · `components/copilot/TurnDisclosure.tsx` · `app/preview-design/OverlaysDemo.tsx (69 loc, client)` · `lib/icons Inbox`

**States & data.** Server component with a single production guard; OverlaysDemo is the only client island (two useState booleans for the dialog and sheet). All data is hardcoded literals in the file — there is no fetching, no loading state, no error state, and the only 'empty state' present is the EmptyState specimen itself.

**Interactions.** Sortable Symbol column in the DataTable. Tabs switch panels. The five overlay triggers open a centred Dialog, a right Sheet, a Popover anchored to its trigger, a hover Tooltip, and a success toast reading "Saved". Everything else is display-only.

**Responsive.** Almost none, deliberately — the card grid is a hard `grid-cols-2` with no breakpoint, sections are width-constrained by max-w-[560px] / max-w-sm / max-w-md rather than by media queries, and the page has no max-width cap or centring. It is a specimen sheet, not a product surface.

**Key copy.** • Section eyebrows: "Entity card", "Turn shape", "Typography", "Tabs", "Data table", "Overlays"
• "Engineered restraint" · "Refined expressive" · "Body copy in Plus Jakarta Sans weight 400."
• Buttons: "Primary", "Outline pill", "Ghost", "New strategy", "Refresh"
• Badges: "+2.40%", "-1.10%", "NEUTRAL"
• "Search symbol"
• PageHeader: "Today" / "Active swing signals" / "Generated at 09:15 IST · 12 candidates"
• EmptyState: "No signals yet" / "Today's scan finishes at 09:15 IST. Check back then."
• Turn steps: "Understanding your question", "Fetching live data", "Option chain", "Upstream timed out — used the EOD chain instead."
• Gauge: "Bull · 62% confidence" · provenance "Indicator votes on settled closes to 2026-08-01."
• Overlays: "Confirm action", "Dialog body in the xAI surface. Stays centered, scales in.", "Side sheet", "Slides in from the right edge.", "Popover content", "Scales from the trigger origin.", "Non-interactive hint", toast "Saved"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a component specimen sheet for a dark Indian stock-trading design system. Single scrolling page on #0D0D0E, 32px padding, no centring and no max width, with 40px between sections. Each section starts with a 12px uppercase eyebrow letter-spaced 0.12em in #96969E.

Sections in order: (1) a 560px entity card for RELIANCE / Reliance Industries showing ₹2,847.30, +32.10 (+1.14%) in #10B981, a "bullish" sentiment chip, a 5/2/1 bull-neutral-bear vote strip, a 12-point sparkline and a provenance line "Indicator votes on settled closes to 2026-08-01." (2) An AI answer block: a shimmering "thinking" line, a card containing a 14-row "Screener hits" table and a "Market regime" gauge reading "Bull · 62% confidence", and a collapsible run log with three steps — Understanding your question 120ms ok, Fetching live data 2.28s ok, Option chain 4.01s FAILED with "Upstream timed out — used the EOD chain instead." (3) Typography: "Engineered restraint" as a 34px display heading and "Refined expressive" in a blue gradient. (4) Three buttons: solid #406AE4 primary, outlined pill secondary, ghost. (5) Two cards in a fixed two-column grid, 12px radius, fill #151517, 1px #29292D. (6) Three badges: +2.40% green, -1.10% red, NEUTRAL grey, 6px radius. (7) An input placeholder "Search symbol", 8px radius. (8) A pill tab rail Overview / Signals / Risk. (9) A dense table with Symbol, Price, Change % showing RELIANCE 2980.50 +1.24, TCS 3855.00 −0.62, INFY 1622.30 +0.41, numbers right-aligned in monospace. (10) Overlay triggers, a page header "Active swing signals / Generated at 09:15 IST · 12 candidates", an empty state "No signals yet", two usage meters 3/5 and 5/5, and two 96×28 sparklines.
```
</details>

---

## `components/system/OfflineBanner.tsx + components/shared/SystemHaltBanner.tsx + components/broker/ConnectBrokerBanner.tsx` — Global status banners — offline, trading halt, broker prompt

**File** `components/system/OfflineBanner.tsx` · **40 LOC** · **Access** OfflineBanner and SystemHaltBanner are auth-agnostic (SystemHaltBanner explicitly uses a public endpoint so it would work unauthed). ConnectBrokerBanner is authed and is gated on broker connection state.

**Shell** — OfflineBanner: fixed over everything (mounted in root Providers). SystemHaltBanner: sticky above AppShell (platform layout). ConnectBrokerBanner: in normal flow inside AppShell's <main>.

**Purpose.** Three ambient strips that interrupt the shell when the world changes: the network dropped, the platform kill-switch fired, or the user has no broker connected. Each renders nothing on the happy path, so their combined resting cost is zero layout.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **OfflineBanner — bar** | `fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 border-b border-line bg-wrap px-4 py-2 text-[12.5px] text-d-text-primary shadow-sm`. z-60 puts it above the right rail (z-40) and the sidebar (z-30) — it is the highest chrome in the app. role="status", aria-live="polite", data-testid="offline-banner". |
| 2 | **OfflineBanner — dot** | `h-1.5 w-1.5 shrink-0 rounded-full bg-down` — a 6px semantic-down dot instead of an icon, deliberately, because lib/icons is code-generated and adding a glyph would mean regenerating it. |
| 3 | **OfflineBanner — copy** | "You're offline — showing the last loaded data. We'll reconnect automatically." |
| 4 | **SystemHaltBanner — bar** | `sticky top-0 z-50 bg-down text-white px-4 py-2 flex items-center justify-center gap-2 shadow-md`, role="alert". A SOLID red bar (#F5808C dark / #B81C22 light) with white ink — the only full-bleed saturated fill in the product. |
| 5 | **SystemHaltBanner — content** | AlertTriangle glyph (solar:danger-triangle-linear) at 16px, then a centred 12px/500 paragraph: "Trading is paused platform-wide while the team investigates. Paper trading and read-only surfaces remain available." |
| 6 | **ConnectBrokerBanner — bar** | `flex items-center gap-3 border-b border-line bg-wrap px-4 py-2 text-[12.5px] text-d-text-secondary` — sits at the very top of <main>, above the 1440px gutter column, so it is full-bleed within the main pane. |
| 7 | **ConnectBrokerBanner — content** | Zap glyph 16px in `text-signature` (brand ink), then a flex-1 line: "Connect your broker to unlock " + an inline d-text-primary span "live data" + " and live trading. Until then you're on the virtual ₹10L portfolio." |
| 8 | **ConnectBrokerBanner — actions** | A Link → /settings#broker styled `rounded-xs bg-primary px-3 py-1 font-medium text-primary-foreground hover:bg-primary-hover` labelled "Connect", then a bare X button (16px, d-text-muted → d-text-primary) with aria-label "Dismiss". |

**Components** — `hooks/useOnlineStatus` · `lib/api api.publicTrust.systemStatus` · `lib/hooks/useBrokerStatus` · `lib/icons AlertTriangle, Zap, X` · `next/link`

**States & data.** OfflineBanner: driven by useOnlineStatus() (navigator.onLine + listeners); returns null while online, so it costs one listener pair and no layout. SystemHaltBanner: polls api.publicTrust.systemStatus() immediately then every 30_000ms, sets halted from `trading_halted`; failures are SILENT by design — a broken status endpoint must never itself paint an alarm bar. It is loaded via next/dynamic with ssr:false so it cannot block first paint. ConnectBrokerBanner: useBrokerStatus(); returns null while isLoading, while connected, or once dismissed — dismissal is component-local state, so it returns on the next full page load.

**Interactions.** OfflineBanner and SystemHaltBanner have zero controls — they are announcements (aria-live polite and role=alert respectively). ConnectBrokerBanner has two: "Connect" navigates to /settings#broker, and X dismisses for the session.

**Responsive.** All three are full-width at every breakpoint with 16px side padding and no breakpoint behaviour. The offline bar overlays the top of the viewport rather than pushing content, so it can cover the mobile Topbar; the halt bar is sticky and pushes the shell down; the broker bar is in flow.

**Key copy.** • Offline: "You're offline — showing the last loaded data. We'll reconnect automatically."
• Halt: "Trading is paused platform-wide while the team investigates. Paper trading and read-only surfaces remain available."
• Broker: "Connect your broker to unlock live data and live trading. Until then you're on the virtual ₹10L portfolio." · "Connect" · aria-label "Dismiss"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design three full-width status banners for a dark Indian stock-trading web app. All are 100% wide with 16px horizontal and 8px vertical padding and 12.5px text.

Banner one — offline. Fill #151517, 1px #29292D bottom hairline, soft shadow, content centred horizontally. A 6px solid red dot (#F5808C) — a dot, not an icon — then "You're offline — showing the last loaded data. We'll reconnect automatically." in #F7F7F8. This one floats fixed at the very top of the screen above all other chrome.

Banner two — platform trading halt. A solid saturated red bar (#F5808C) with pure white text, centred, with a 16px outline warning-triangle glyph, reading in two sentences at 12px medium: "Trading is paused platform-wide while the team investigates. Paper trading and read-only surfaces remain available." This is the only full-bleed saturated fill in the entire product, so it must feel like a genuine interruption.

Banner three — connect your broker. Fill #151517 with a bottom hairline, left-aligned. A 16px lightning-bolt glyph in #8FB0FF, then the sentence "Connect your broker to unlock live data and live trading. Until then you're on the virtual ₹10L portfolio." in #D3D3D7, with the words "live data" lifted to #F7F7F8. Pushed to the right edge: a small solid #406AE4 button with 6px radius, 12px horizontal padding and white text reading "Connect", then a plain X dismiss icon in #96969E.

Show all three stacked above a Markets page displaying NIFTY 50 24,318.85 and BANKNIFTY 51,240.10. Provide light versions: #FFFFFF fills, #DDE5ED hairlines, halt red #B81C22, ink #1D1D1D.
```
</details>

---

## `components/brand/QuantXMark.tsx + components/ui/BrandLogo.tsx + app/icon.svg` — Brand mark & logo system

**File** `components/brand/QuantXMark.tsx` · **75 LOC** · **Access** public + authed

**Shell** — used inside every shell surface; not a screen of its own

**Purpose.** The identity assets: the 'Orbital' app mark used in the sidebar, auth screens and favicon, and the logo-fetching components that render broker and NSE-company logos with a guaranteed monogram fallback.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **QuantXMark — canvas** | Pure SVG, viewBox 0 0 40 40, role="img", aria-label defaulting to "Quant X". Sized by className (h-8 w-8 in the sidebar = 32px) or a numeric `size` prop. |
| 2 | **QuantXMark — tile** | rect x=1 y=1 w=38 h=38 rx=11.5 filled with linearGradient #qx-fill from (4,2) to (36,38): #5B8DEF → #3457C9. So the mark's blue is its OWN gradient, distinct from the #3B82F6→#406AE4 CTA gradient. |
| 3 | **QuantXMark — specular sheen** | A path arcing across the top third filled with a vertical white gradient from 50% to 0% opacity, itself at opacity 0.85 — the 'glass' highlight. |
| 4 | **QuantXMark — orbits** | Three identical ellipses cx=20 cy=20 rx=13.5 ry=5.6, rotated 30°, 90° and 150° about the centre, stroked #FFFFFF at 1.9px, group opacity 0.9. A quantum-atom electron shell. |
| 5 | **QuantXMark — nucleus** | circle cx=20 cy=20 r=3.3 solid #FFFFFF. |
| 6 | **QuantXMark — electrons** | Three r=1.9 white circles at (31.69, 26.75), (8.31, 26.75) and (20, 6.5), rendered through filter #qx-glow — a feGaussianBlur stdDeviation 0.9 merged back over the source, so each electron carries a soft halo. |
| 7 | **QuantXMark — rim** | rect x=1.5 y=1.5 w=37 h=37 rx=11 stroked #FFFFFF at 22% opacity — a crisp inner rim that keeps the tile readable on light backgrounds. |
| 8 | **Sidebar treatment** | Rendered at 32px with `drop-shadow-[0_2px_8px_rgba(58,119,229,0.35)]` — a blue bloom under the tile. |
| 9 | **Favicon (app/icon.svg)** | A simplified copy of the same mark: same gradient stops #5B8DEF→#3457C9, same rx 11.5 tile, the three orbit ellipses at 2.1px stroke and 0.92 opacity — no sheen, no glow filter, no rim, since those disappear at 16px. |
| 10 | **Fallback marks in chrome** | The mobile Topbar and MobileDrawer do NOT use QuantXMark. They render a flat 28px `bg-primary` (#406AE4) tile — rounded-sm (8px) in the Topbar, rounded-lg (16px) in the drawer — with a single white font-black "Q" at 15px. |
| 11 | **Monogram** | `inline-flex items-center justify-center border border-line bg-wrap-hover font-semibold text-d-text-secondary`, size-driven inline width/height and fontSize = max(9, round(size*0.4)), default 28px and `rounded-xs`. Takes the first 2 alphanumeric characters uppercased, or '?'. |
| 12 | **BrandLogo** | Renders an <img> at 2× the display size (loading="lazy", `shrink-0 bg-white object-contain`, default rounded-xs) from lib/logo logoUrl(domain) or an explicit srcUrl; any onError flips to the Monogram fallback, so a broken image is impossible. |
| 13 | **SymbolLogo** | Uppercases the symbol, strips a trailing .NS, resolves SYMBOL_DOMAIN[key] then falls back to tickerLogoUrl, and renders BrandLogo with shape `rounded-full` and a circular Monogram fallback. |

**Components** — `components/brand/QuantXMark.tsx` · `components/ui/BrandLogo.tsx (Monogram, BrandLogo, SymbolLogo)` · `lib/logo (logoUrl, tickerLogoUrl, SYMBOL_DOMAIN)` · `app/icon.svg` · `app/opengraph-image.tsx`

**States & data.** QuantXMark is a pure static SVG — no state, themes for free because it is self-coloured. BrandLogo holds one `failed` boolean; the fallback path is taken when the resolved URL is empty OR the image errors. There is no loading placeholder — the img simply lazy-loads.

**Interactions.** None directly; the mark sits inside the sidebar brand Link (→ /copilot) which carries a focus ring at accent/40 and the aria-label "Quant X — Trading OS, go to home".

**Responsive.** Sized entirely by the caller. In chrome it appears at 32px (sidebar), 28px (Topbar/Drawer tiles, and the BrandLogo/Monogram default), 26px (rail avatar chip) and 16px (favicon).

**Key copy.** • Default SVG title/aria-label "Quant X"
• Wordmark "Quant X" with the eyebrow "Trading OS"
• Single-letter fallback "Q"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design the app icon and logo system for an Indian AI trading platform called Quant X.

The primary mark is a 40×40 rounded-square glass tile with an 11.5 corner radius, filled with a diagonal gradient from #5B8DEF at the top-left to #3457C9 at the bottom-right. Across the top third lay a specular sheen: a soft white highlight fading from 50% to 0% opacity, giving the tile a glassy dome. Inside, draw a quantum atom in pure white: three identical ellipses, each 27 wide by 11.2 tall, centred and rotated 30°, 90° and 150°, stroked at 1.9px with 90% opacity; a solid 6.6px white nucleus at the centre; and three 3.8px white electrons sitting on the rings — one at the top, two at the lower left and lower right — each with a soft gaussian glow. Finish with a 1px white inner rim at 22% opacity so the tile stays crisp on light backgrounds. When placed in a dark sidebar at 32px, add a blue drop shadow of 8px blur at 35% opacity.

Produce three derivatives: a 16px favicon that drops the sheen, glow and rim and thickens the orbit strokes to 2.1px; a flat fallback tile — a solid #406AE4 square with a white heavy letter "Q", shown at 8px radius and again at 16px radius; and a full lockup pairing the 32px mark with a two-line wordmark, "Quant X" at 15px bold in #F7F7F8 above "TRADING OS" at 9.5px uppercase letter-spaced 0.16em in #96969E.

Also show a company-logo fallback monogram: a 28px 6px-radius square, fill #1E1E21, 1px #29292D border, with two uppercase initials at 11px semibold in #D3D3D7 — for example RE for RELIANCE, TC for TCS, HD for HDFCBANK.
```
</details>

---

## `components/theme/ThemeToggle.tsx + AnimatedThemeToggle.tsx` — Theme controls — 3-way segmented + rail quick flip

**File** `components/theme/ThemeToggle.tsx` · **90 LOC** · **Access** authed (both surfaces are behind the shell). No tier gate.

**Shell** — Segmented control: inside the Settings page (AppShell). Quick flip: bottom of the RightRail.

**Purpose.** Two faces of the same theme system: a full Light / Dark / Auto radiogroup that lives in Settings → Appearance, and a single-button quick flip on the right rail that plays a View-Transitions clip reveal. Both write through ThemeModeContext so next-themes never holds stale state.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Segmented container** | `inline-flex flex-wrap items-center gap-1 rounded-sm border border-d-border bg-wrap p-1`, role="radiogroup", aria-label="Appearance" — an 8px-radius tray on the L1 surface with a hairline and 4px inner padding. |
| 2 | **Option — Light** | Sun glyph (solar:sun-2-linear) 14px + label "Light". title/hint "Refined cool near-white, daylight reading". |
| 3 | **Option — Dark** | Moon glyph (solar:moon-linear) 14px + label "Dark". Hint "Near-black canvas, after-hours". |
| 4 | **Option — Auto** | Monitor glyph (solar:monitor-linear) 14px + label "Auto". Hint "Match your device + time of day (default)". |
| 5 | **Option chrome** | Each is a role="radio" button: `inline-flex items-center gap-2 px-3 py-2 rounded-xs text-[12px] font-medium transition-all min-h-[40px] spring-press` — 6px radius, 12px label, and a 40px minimum height for mobile AA tap targets. |
| 6 | **Selected state** | `bg-primary/10 text-primary border border-primary/30 shadow-[inset_0_0_0_1px_rgba(11,163,127,0.10)]` — a 10% blue wash, brand ink, a 30% blue border, plus an inset 1px ring whose rgba is a LEFTOVER GREEN (11,163,127) from a retired palette; it is as-built and effectively invisible at 10% alpha. |
| 7 | **Unselected state** | `text-d-text-secondary hover:bg-white/[0.03] border border-transparent` — a transparent border of equal width so selecting never shifts layout. |
| 8 | **Pre-mount state** | Until ThemeModeContext reports mounted, `active` is undefined and NO pill reads as selected — the boot script has already applied the right class to <html>, this is only about which pill looks active. |
| 9 | **AnimatedThemeToggle (rail)** | A single icon button. Shows Sun when the resolved theme is dark and Moon when light; renders Moon during SSR so server and first client paint agree. aria-label and title flip between "Switch to light mode" and "Switch to dark mode". In the rail it takes the shared 40px circular railBtn class with a 20px glyph. |
| 10 | **Reveal animation** | Delegates to components/magicui/animated-theme-toggler with variant "circle" and duration 460ms (0 under prefers-reduced-motion). It snapshots the root, then WAAPI-animates a clip-path on ::view-transition-new(root) so the new theme wipes in as an expanding circle FROM THE BUTTON. Clip coordinates are percentages of the snapshot box (absolute px break on fractional display scales). It removes both `light` and `dark` from <html> before adding the resolved one and sets style.colorScheme — a bare toggle('dark') would leave html.light winning, because Quant X derives dark from :root and overrides to light under html.light. |
| 11 | **ThemeToggleCompact** | An alternate dense variant: `inline-flex h-8 w-8 items-center justify-center rounded-xs border border-d-border text-d-text-muted hover:border-primary/30 hover:text-primary` with a 16px glyph — a 32px square button for top bars. |

**Components** — `contexts/ThemeModeContext (useThemeMode: mode, setMode, mounted)` · `next-themes useTheme (resolvedTheme)` · `components/magicui/animated-theme-toggler.tsx (7 clip variants: circle, square, triangle, diamond, hexagon, rectangle, star)` · `lib/icons Monitor, Moon, Sun`

**States & data.** next-themes owns persistence at storageKey 'quantx.theme' with defaultTheme 'system' and enableSystem, and injects a pre-paint boot script. ThemeModeContext layers a third intent, 'auto', which follows BOTH prefers-color-scheme AND the local clock — light through the day, dark after hours — updating live when the OS flips or the clock crosses dawn/dusk. A manual tap on either control sets an explicit light/dark intent and EXITS auto, exactly like macOS. AnimatedThemeToggle subscribes to a prefers-reduced-motion media query and collapses the 460ms reveal to an instant swap. No loading, empty or error states.

**Interactions.** Segmented control: click any of the three pills; arrow-key behaviour is the browser default for role=radio buttons (they are buttons, not native radios). Rail button: single click flips light↔dark with the circular clip reveal expanding from the cursor position. The command palette exposes the same action as a row labelled "Switch to dark theme" / "Switch to light theme" with the hint "Appearance", routed through the same context.

**Responsive.** The segmented tray is `flex-wrap`, so its three pills stack onto two rows on a narrow settings column; each pill keeps a 40px minimum height at every width for touch. The rail button only exists at lg and up — on mobile the only theme control is the Settings segmented group.

**Key copy.** • aria-label "Appearance"
• "Light" — "Refined cool near-white, daylight reading"
• "Dark" — "Near-black canvas, after-hours"
• "Auto" — "Match your device + time of day (default)"
• "Switch to light mode" / "Switch to dark mode"

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design two theme controls for a dark Indian trading app that supports light, dark and automatic modes.

First, a three-option segmented control for a settings page. Outer tray: 8px corner radius, fill #151517, 1px #29292D border, 4px inner padding, options 4px apart. Each option is a 6px-radius button at least 40px tall with 12px horizontal and 8px vertical padding, a 14px outline icon and a 12px medium label, 8px apart: a sun for "Light", a moon for "Dark", a monitor for "Auto". Unselected options are #D3D3D7 on a transparent border. The selected option — show "Auto" selected — fills #406AE4 at 10% opacity, takes #8FB0FF text and icon, and gains a #406AE4 border at 30% opacity; the unselected borders are transparent but present, so selecting never shifts the layout. Let the three options wrap onto two rows in a narrow column.

Second, a single icon button for a utility rail: a 40px circle, transparent by default, containing a 20px outline sun glyph in #96969E; on hover it fills #1E1E21 and the glyph brightens to #F7F7F8. It shows a sun while the app is dark and a moon while it is light.

Illustrate the transition this button triggers: the new theme wipes in as a circle expanding from the button itself over roughly 460ms, so mid-animation the screen is split — a dark #0D0D0E dashboard showing NIFTY 50 24,318.85 +0.62% outside the circle, and the same dashboard in light #EDF1F4 with #FFFFFF cards, #DDE5ED hairlines and #1D1D1D ink inside it. Keep the accent #406AE4 identical in both halves and swap the P&L greens from #10B981 to #0A6B50.
```
</details>

---

## `(global chrome — no route of its own; rendered by AppShell on every route whose page/layout mounts AppShell: /markets, /stocks, /watchlist, /settings, /portfolio, /trades, /trades/[id], /signals/[id], /alerts, /copilot and the whole app/(platform) group)` — Right Utility Rail — 72px fixed icon rail

**File** `components/shell/RightRail.tsx` · **182 LOC** · **Access** Authed chrome only. AppShell (and therefore the rail) mounts on authed surfaces; the rail element itself is never entitlement-gated. Inside it, RailProfile calls useAuth() and `if (!user) return null` — so before the auth context resolves (or if the session is missing) the account avatar simply is not rendered and the bottom group silently collapses from 4 items to 3. Every other icon renders unconditionally regardless of tier or broker-connection state. There is NO tier lock, NO pro/elite badge and NO quota chip anywhere on the rail.

**Shell** — It IS shell. AppShell.tsx (127 LOC) composes three zones: Zone 1 left Sidebar (fixed, 240px expanded / 68px collapsed, `.glass-chrome` = opaque #151517 dark / #FFFFFF light, 1px right border #29292D, z-30); Zone 2 main pane (`lg:mr-[72px]` + `lg:ml-60` or `lg:ml-[68px]`, inner cap max-w-[1440px], px-4 md:px-6, 200ms margin transition once mounted); Zone 3 this RightRail (z-40). Note the asymmetry as-built: the LEFT sidebar is card-surface #151517 while the RIGHT rail is page-canvas `bg-main` #0D0D0E — the two rails are deliberately different fills. There is no desktop top bar; Topbar only appears below lg.

**Purpose.** The 72px right-edge utility rail: a single vertical stack of 40px circular icon-only controls that carries the Copilot launcher, four cross-cutting destinations (Watchlist, Notifications, Search, Activity) and the account/system group (Settings, Help & plans, Account, Theme). It is the escape hatch for everything not in the left navigation. After the 2026-08-05 markets revert (40c2ede) it no longer expands into any contextual/tabbed panel — components/shell/ContextPanel.tsx and components/markets/MarketPanel.tsx were deleted and nothing replaced them. The only surfaces the rail can still open are (a) the account dropdown it owns, (b) the global Copilot dock, and (c) the ⌘K CommandPalette, both of which are separate fixed surfaces owned by other files.

### Anatomy (render order)

| # | Region | What renders |
|---|---|---|
| 1 | **Rail container** | `<aside aria-label="Utilities">` — fixed right-0 top-0, z-40, h-full, w-[72px], flex-col, items-center, py-3 (12px), border-l 1px #29292D (light #DDE5ED), bg-main #0D0D0E (light #EDF1F4). `hidden lg:flex` — completely absent below the 1024px lg breakpoint. Content is centred, so a 40px control leaves 16px of gutter on each side. No scroll; no overflow handling. |
| 2 | **Top group container** | `flex flex-col items-center gap-2` — 8px gaps. With 40px controls the true pitch is 48px, NOT the '~56px pitch' the file's own header comment (lines 19-24) claims. Comment/code drift. |
| 3 | **1 · Copilot launcher (item 1, top)** | `<button>`, 40×40 (h-10 w-10), rounded-full 9999px, background `bg-gradient-cta` = linear-gradient(110deg,#3B82F6 0%,#406AE4 100%), ink `text-primary-foreground` #FFFFFF, plus `.cta-gloss` box-shadow: inset 4px 4px 8px rgba(255,255,255,0.3), inset -4px -4px 8px rgba(255,255,255,0.3), 0 8px 16px rgba(58,119,229,0.5). Glyph = <CopilotBot className="h-5 w-5"/> → solar:cpu-bolt-linear, 20×20, 1.5 stroke, framer-motion idle bob (y: 0 → -1.6 → 0, 2.4s easeInOut, 1.4s repeatDelay); renders a static Bot under prefers-reduced-motion. aria-label "Open Copilot (⌘/)", title "Copilot (⌘/)". Hover = `hover:scale-[1.04]` with `transition-transform` (Tailwind default 150ms, off the 90/160/240/380 motion scale — drift). The gradient does NOT change on hover. Focus-visible = 2px ring rgba(64,106,228,0.4), no offset. Action: dispatchCopilotOpen() → window CustomEvent 'copilot:open' → CopilotProvider setOpen(true). |
| 4 | **2 · Divider** | `<div className="my-1 h-px w-6 bg-line" aria-hidden>` — a single 24px × 1px hairline #29292D with 4px vertical margins, sitting only between the Copilot launcher and Watchlist. It is the ONLY divider in the rail; the bottom group has none. |
| 5 | **3 · Watchlist** | RailLink → next/link href="/watchlist". Icon Eye = solar:eye-linear, 20×20. aria-label + title both "Watchlist". Route exists (app/watchlist/page.tsx). |
| 6 | **4 · Notifications** | RailLink → href="/inbox". Icon Bell = solar:bell-linear, 20×20. aria-label + title "Notifications". Route exists (app/(platform)/inbox/page.tsx). NO unread badge, NO dot, NO count — the bell is visually identical whether the inbox has 0 or 40 unread notifications. |
| 7 | **5 · Search (⌘K)** | RailButton (a real <button>, not a link). Icon Search = solar:magnifer-linear, 20×20. aria-label + title "Search (⌘K)". onClick = the `onSearch` prop → AppShell setPaletteOpen(true) → <CommandPalette open onClose/>. The same surface is toggled by ⌘K/Ctrl+K from AppShell's window keydown listener. |
| 8 | **6 · Activity** | RailLink → href="/copilot". Icon Activity = solar:pulse-linear, 20×20. aria-label + title "Activity". Inline comment: '/activity retired; its 7-day log is folded into the Simple band on the /copilot home.' Consequence as-built: the label says Activity but it lands on the copilot home — the same destination the Sidebar brand mark and 'New Chat' already point at, so the rail has a redundant destination whose label does not match the page it opens. |
| 9 | **Bottom group container** | `mt-auto flex flex-col items-center gap-2` — pushed to the base of the rail, same 8px gaps / 48px pitch, same 40px circular targets. |
| 10 | **7 · Settings** | RailLink → href="/settings". Icon Settings = solar:settings-linear, 20×20. aria-label + title "Settings". Route exists (app/settings/page.tsx). |
| 11 | **8 · Help & plans** | RailLink → href="/pricing". Icon HelpCircle = solar:question-circle-linear, 20×20. aria-label + title "Help & plans". DEFECT: there is no app/pricing route anywhere in the tree and next.config rewrites only cover /api/* and /ws/* — this icon is a permanent 404. (17 other call sites link /pricing too, so it is a product-wide dead route, not a rail-only bug.) |
| 12 | **9 · Account (RailProfile)** | Trigger: 40×40 rounded-full button, aria-haspopup="menu", aria-expanded, aria-label "Account menu", title = the resolved display name (profile.full_name → email local-part → 'Account'). Inside it a 26×26 rounded-full chip filled #406AE4 with the uppercase first initial at 12px font-bold #FFFFFF. When open the trigger keeps `bg-wrap-hover` #1E1E21 + `text-d-text-primary` #F7F7F8 — this is the ONLY persistent 'active' state anywhere in the rail. |
| 13 | **9a · Account dropdown** | Rendered only while open. `absolute bottom-0 right-full mr-2 z-50 w-56` → 224px wide, opens to the LEFT of the rail (8px gap) and is bottom-aligned with the trigger so it grows upward. overflow-hidden, rounded-lg 16px, 1px #29292D border, bg-wrap #151517 (light #FFFFFF). NO blur, NO shadow. Contents top→bottom: (a) header row, flex gap 10px, px-3 py-2.5, 1px bottom hairline — 32×32 #406AE4 circle with the 13px bold white initial, then truncated name at 12.5px medium #F7F7F8 over truncated email at 10.5px #96969E; (b) 'Profile' row → /settings, User icon 16px, 13px #D3D3D7; (c) 'Settings' row → /settings, Settings icon 16px, top hairline; (d) 'Sign out' <button role="menuitem">, LogOut icon 16px, top hairline, hover `bg-down/10 text-down` → rgba(245,128,140,0.1) fill + #F5808C ink (light #B81C22). Three defects here: Profile and Settings are the SAME href; the destructive hover borrows the P&L down token, which the design system reserves for P&L only; and 12.5px/10.5px are off the type scale, with 10.5px below the stated 11px floor. |
| 14 | **10 · Theme toggle (RailThemeToggle)** | AnimatedThemeToggle with the shared railBtn className and a 20×20 icon. Renders solar:sun-2-linear when resolvedTheme==='dark', solar:moon-linear otherwise (Moon is also the pre-mount SSR default so server and first client paint agree). aria-label/title flip between "Switch to light mode" and "Switch to dark mode", and the underlying MagicUI button appends a visually-hidden "Toggle theme". Click runs document.startViewTransition with a circle clip-path reveal expanding from the button's own centre over 460ms (collapsed to 0ms under prefers-reduced-motion), writes light/dark onto <html>, and calls ThemeModeContext setMode — an explicit tap exits Auto. The three-way Light/Dark/Auto control lives in Settings → Appearance, not here. |
| 15 | **Shared icon-button style (railBtn)** | 'grid h-10 w-10 place-items-center rounded-full text-d-text-muted transition-colors hover:bg-wrap-hover hover:text-d-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'. Resting ink #96969E (light #5F6B75); hover fill #1E1E21 (light #F4F7F9) + ink #F7F7F8 (light #1D1D1D); focus ring 2px rgba(64,106,228,0.4) with no offset, painted flush to the 40px circle. transition-colors uses Tailwind's default 150ms — again off the 90/160/240/380 token scale. There is NO :active/pressed treatment on any rail item. |

**Components** — `components/shell/RightRail.tsx (the rail; local RailLink, RailButton, RailProfile, RailThemeToggle)` · `components/shell/AppShell.tsx (sole mount point; supplies the onSearch prop and the lg:mr-[72px] gutter)` · `components/copilot/CopilotBot.tsx (animated solar:cpu-bolt-linear glyph in the launcher)` · `components/copilot/CopilotProvider.tsx (dispatchCopilotOpen + the dock the launcher opens; also feature-detects the rail via document.querySelector('aside[aria-label="Utilities"]'))` · `components/theme/AnimatedThemeToggle.tsx → components/magicui/animated-theme-toggler.tsx (View-Transition light/dark flip)` · `contexts/AuthContext (useAuth: user, profile, signOut)` · `contexts/ThemeModeContext (setMode — a tap exits Auto)` · `lib/icons.tsx (Activity, Bell, Eye, HelpCircle, LogOut, Search, Settings, User, Moon, Sun, Bot — all Solar linear, 24px viewBox, 1.5 stroke)` · `lib/utils cn` · `components/shell/CommandPalette.tsx (opened by the Search icon; owned by AppShell)`

**States & data.** The rail fetches NOTHING. Zero SWR hooks, zero fetch, zero polling, zero websocket. It has no loading skeleton, no empty state and no error state. Its only reactive inputs are: (1) useAuth() — user/profile decide whether the avatar renders at all and supply the display name, email and initial; (2) next-themes resolvedTheme plus a prefers-reduced-motion media query inside AnimatedThemeToggle, which decide Sun vs Moon and 460ms vs 0ms; (3) a local `open` boolean for the account menu. Because there is no usePathname anywhere in the file, NO rail icon ever shows an active/current-route indicator — standing on /watchlist or /settings looks identical to standing anywhere else. Notification count is likewise never read, so the bell is permanently un-badged. Everything else is static markup. The rail is client-rendered ('use client') but SSR-safe: AnimatedThemeToggle renders Moon until mounted and RailProfile renders null until a user exists, so there is a brief first-paint state where the bottom group has three items and the theme icon may flip Moon→Sun on hydration.

**Interactions.** CLICK — the Copilot launcher fires dispatchCopilotOpen(); CopilotProvider's 'copilot:open' listener sets open=true and focuses the dock input. The dock is a separate fixed surface: right-0 top-0 z-50, full height, w-full with sm:max-w-[400px], and `lg:right-[72px]` when it detects the rail, so it docks flush against the rail's inner edge rather than covering it; bg-wrap #151517, 1px left hairline #29292D, shadow 0 24px 80px -20px rgba(0,0,0,0.7), 200ms transform transition. Search opens CommandPalette. Watchlist / Notifications / Activity / Settings / Help are plain next/link navigations. The Account trigger toggles its 224px menu; the menu closes on outside mousedown (document listener), on Escape (document listener), and on selecting any item; 'Sign out' awaits signOut() then the auth flow returns to /. The theme toggle runs the 460ms circle View-Transition reveal from the button's own centre. KEYBOARD — ⌘/Ctrl+/ toggles the Copilot dock and Escape closes it (listeners live in CopilotProvider, not the rail); ⌘/Ctrl+K toggles the palette and Escape closes it plus the mobile drawer (listeners in AppShell). The rail's own tab order is plain DOM order: launcher → watchlist → inbox → search → activity → settings → help → account → theme; the account menu is NOT focus-trapped and focus is NOT restored to its trigger on close. TOOLTIPS — every control uses the native HTML `title` attribute only; there is no design-system tooltip component, so hover labels are OS chrome with the browser's ~1s delay. WHAT DOES NOT HAPPEN — nothing in the rail expands into a contextual or tabbed panel. There is no 'Details' affordance, no slide-over, no per-page context face. ContextPanel.tsx and MarketPanel.tsx were deleted by 40c2ede, and the rail was never wired to them in the first place (RightRail.tsx is unchanged since 2026-08-03 17:02, before the experiment began).

**Responsive.** Binary. At >=1024px (lg) the rail is `lg:flex` and AppShell reserves it with `lg:mr-[72px]`. Below 1024px it is `hidden` and contributes nothing — no collapsed variant, no bottom tab bar, no icon row. Its functions are redistributed below lg as follows: Notifications and Settings become full-width 40px-tall labelled rows in the MobileDrawer footer (copy: 'Notifications', 'Settings', 12px medium); the drawer header links to /copilot and offers a 'New Chat' pill; Copilot moves to a floating FAB at `fixed bottom-5 right-4 z-40`, 48×48, rounded-full, glass-control-accent, shadow 0 10px 30px -8px rgba(0,0,0,0.6), active:scale-[0.98] (it is `lg:hidden` only when the rail is detected, so it also shows on desktop routes that render without AppShell, e.g. /stock/*). Search below lg is reachable only via ⌘K on a keyboard or whatever the page provides — the drawer has no search entry. Watchlist, Activity, Help & plans, the account menu and the theme toggle have NO mobile equivalent in the drawer at all; theme is documented as living in Settings → Appearance. The rail width is fixed at 72px at every size it renders and never grows, shrinks or collapses.

**Key copy.** "Open Copilot (⌘/)" (aria-label) · "Copilot (⌘/)" (title) · "Watchlist" · "Notifications" · "Search (⌘K)" · "Activity" · "Settings" · "Help & plans" · "Account menu" (aria-label) · "Profile" · "Settings" · "Sign out" · "Switch to light mode" / "Switch to dark mode" · "Toggle theme" (sr-only) · the rail's own aria-label: "Utilities".

<details><summary><b>Stitch prompt for this screen</b></summary>

```text
Design a fixed 72px-wide vertical utility rail pinned to the right edge of a dark NSE trading dashboard, full viewport height. Rail fill #0D0D0E, 1px left border #29292D, 12px top and bottom padding, all contents horizontally centred (16px gutter each side of a 40px control). Top group, 8px gaps: a 40px circular button filled with linear-gradient(110deg,#3B82F6,#406AE4) holding a white 20px robot/CPU glyph, with glossy inset highlights rgba(255,255,255,0.30) and a 0 8px 16px rgba(58,119,229,0.5) blue drop shadow; below it a 24x1px #29292D divider; then four 40px circular icon buttons, transparent fill, 20px 1.5-stroke line icons in #96969E — eye (Watchlist), bell (Notifications), magnifier (Search), pulse (Activity). Hover state: fill #1E1E21, icon #F7F7F8. Focus: 2px ring rgba(64,106,228,0.4), no offset. Bottom group pinned to the base, same 8px pitch: gear (Settings), question-circle (Help & plans), a 26px #406AE4 circle with a bold white 12px "R" (account), and a moon/sun theme toggle. Show the account menu open: a 224px card floating to the LEFT of the rail with an 8px gap, 16px radius, fill #151517, 1px #29292D border, no blur, no shadow, bottom-aligned so it grows upward. Header row: 32px blue avatar, "Rishi Karthikeyan" at 12.5px #F7F7F8 over "rishi@quantx.app" at 10.5px #96969E; then hairline-separated rows "Profile", "Settings", "Sign out" at 13px #D3D3D7. Behind the rail show a market desk: "NIFTY 50 24,836.30 +0.42%" in #10B981, "BANKNIFTY 53,102.75 -0.18%" in #F5808C, RELIANCE Rs2,912.40, TCS Rs4,180.05, HDFCBANK Rs1,684.90, INFY Rs1,742.15, turnover Rs1.24 lakh crore, "Updated 15:31 IST". Prose in Plus Jakarta Sans, all numerics in Geist Mono tabular. No active-route indicator on any rail icon, and no unread badge on the bell.
```
</details>

---
