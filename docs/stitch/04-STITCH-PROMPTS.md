# QUANT X — GOOGLE STITCH PROMPTS

> One paste-ready prompt per screen.

**How to use.**
1. Start a Stitch session and paste the **system prompt** from `01-DESIGN-SYSTEM.md` §12.
   Do this once per session — it establishes the palette, type scale, radii and layout grid.
2. Then paste **one** screen prompt from this file per generation.
3. For a screen's variants (tabs, locked states, empty states), the variants are listed as
   their own prompts — generate them as separate frames so the set stays consistent.
4. If Stitch drifts off-palette, re-paste the system prompt before the next screen.

---

## Contents

- [Global app chrome](#shell-chrome-global-app-chrome)
- [Auth, onboarding & callbacks](#auth-onboarding-auth--onboarding---callbacks)
- [The Copilot home (AI thread)](#home-copilot-the-copilot-home--ai-thread)
- [Markets, stock universe & watchlist](#markets-stocks-markets--stock-universe---watchlist)
- [Signals hub & signal detail](#signals-signals-hub---signal-detail)
- [Screener & chart patterns](#scanner-patterns-screener---chart-patterns)
- [AI Algos (strategies)](#strategies-ai-algos--strategies)
- [Portfolio, trades & paper trading](#portfolio-trades-portfolio--trades---paper-trading)
- [AutoPilot, track record & risk](#autopilot-risk-fno-autopilot--track-record---risk)
- [Inbox, alerts & referrals](#inbox-alerts-settings-inbox--alerts---referrals)
- [Admin console](#admin-admin-console)

---

<a id="shell-chrome-global-app-chrome"></a>

# Global app chrome

### 1. `components/shell/AppShell.tsx` — App Shell — 3-zone authenticated frame

```text
Design a dark-first web application shell for an Indian stock-market AI platform called Quant X. Page canvas #0D0D0E with a single soft radial glow of #406AE4 at 6% opacity anchored top-left, fading out by 62%. Add an almost invisible film grain over everything (1.8% opacity).

Three zones. LEFT: a fixed 240px navigation rail on #151517 with a 1px #29292D right hairline, no shadow. RIGHT: a fixed 72px icon-only utility rail on #0D0D0E with a 1px #29292D left hairline. CENTRE: the scrolling content pane between them, its inner content capped at 1440px with 24px side gutters.

No top bar on desktop. Inside the centre pane, top to bottom: a thin 12.5px notice strip on #151517 reading "Connect your broker to unlock live data and live trading. Until then you're on the virtual ₹10L portfolio." with a small #406AE4 pill button labelled Connect and an X; then the page body; then a legal footer block in 11px #96969E.

Fill the body with a realistic NSE dashboard: NIFTY 50 24,318.85 +0.62%, BANKNIFTY 51,240.10 −0.18%, holdings RELIANCE ₹2,980.50, TCS ₹3,855.00, HDFCBANK ₹1,642.75, and a ₹12,48,600 portfolio value.

Typography: Plus Jakarta Sans for prose (body 15/24, label 13/18, meta 12/16, micro 11/14 uppercase +0.06em), Geist Mono tabular for every number. Radii: 12px cards, 8px inputs, 9999px pills. Produce a light variant too: canvas #EDF1F4, cards #FFFFFF, hairlines #DDE5ED, ink #1D1D1D.
```

### 2. `components/shell/Sidebar.tsx` — Left Sidebar — brand, actions, nav, chat history, upgrade

```text
Design a 240px fixed sidebar for a dark fintech trading app. Panel fill #151517, 1px #29292D right hairline, no shadow, full viewport height.

Top to bottom: (1) A 56px brand row with a 1px bottom hairline — a 32px rounded-square app icon in a blue gradient (#5B8DEF→#3457C9) showing a white atom with three orbit ellipses, glowing softly blue; beside it two stacked lines, "Quant X" 15px bold #F7F7F8 and "TRADING OS" 9.5px uppercase letter-spaced 0.16em #96969E. (2) A "New Chat" button, 8px radius, fill #1E1E21, 1px #29292D border, 13px #D3D3D7, centred plus icon. (3) A "Search" row, 13px #96969E with a magnifier and a small monospace key-cap chip reading ⌘K, 6px radius, 1px #29292D. (4) Grouped navigation: ungrouped rows Markets, Stocks, AutoPilot; then uppercase 12px monospace group labels SIGNALS, AI TOOLS, PORTFOLIO with rows Signals / Screener, Chart Patterns, AI Algos, F&O / Portfolio, Paper, Trades, Risk. Rows are 52px tall FULL PILLS, 14px text #D3D3D7, 16px outline icons, 12px icon-to-label gap; the active row is a #406AE4 10%-opacity pill with #8FB0FF text and icon; F&O carries a tiny amber "Elite" pill (#F0A94F on 10% amber). (5) A History section above a hairline, 12px heading, date sub-labels Today / Yesterday / Previous 7 days, and 12px chat rows like "RELIANCE breakout levels" and "Nifty 50 regime check" with a hover-revealed trash icon. (6) Pinned footer: a glossy full-pill "Upgrade" CTA on a 110° #3B82F6→#406AE4 gradient with white inner bevels and a blue drop glow, then a "Collapse" row with a panel icon.
```

### 3. `components/shell/NavList.tsx + nav.ts` — Navigation list — grouped IA (shared desktop + mobile)

```text
Design the navigation section of a dark trading-app sidebar, 240px wide on #151517.

Structure: three ungrouped rows first (Markets, Stocks, AutoPilot), then three labelled groups. Group labels are 12px uppercase MONOSPACE, weight 600, letter-spacing 0.06em, 16px left padding, 16px top padding, colour #96969E — except the group containing the current page, whose label turns #8FB0FF. Groups: SIGNALS → Signals. AI TOOLS → Screener, Chart Patterns, AI Algos, F&O. PORTFOLIO → Portfolio, Paper, Trades, Risk.

Each row is a full-radius pill 52px tall with 16px horizontal padding and a 12px gap between a 16px outline icon and a 14px/20px label in #D3D3D7. Use rounded outline icons in a single consistent family: a bar chart for Markets and Signals, a magnifier for Stocks, a CPU/bolt chip for AutoPilot, a scan frame for Screener, a brain circuit for Chart Patterns, a magic wand for AI Algos, stacked layers for F&O, a briefcase for Portfolio, a test tube for Paper, a document for Trades, a shield for Risk.

States: hover fills #1E1E21 and lifts the label to #F7F7F8. Active is a #406AE4 pill at 10% opacity with both label and icon in #8FB0FF. F&O carries a tiny right-aligned pill reading "Elite", 10px semibold #F0A94F on 10% amber. Focus draws a 2px #406AE4 ring at 40% opacity.

Show the active state on "Signals" with the SIGNALS group label tinted blue. Also render a mobile variant at 44px row height and a 68px icon-only rail variant with centred 18px icons and no labels.
```

### 4. `components/shell/Topbar.tsx` — Mobile Topbar

```text
Design a compact mobile app header for a dark Indian stock-trading app, 56px tall, full width, fill #151517, with a single 1px #29292D hairline along the bottom and 12px side padding.

Left: a 36px square tap target with 6px corner radius containing a 22px rounded hamburger icon in #D3D3D7; on press it fills #1E1E21 and the icon brightens to #F7F7F8. Immediately to its right, 8px away, the brand lockup: a 28px solid #406AE4 square with 8px corner radius containing a single white letter "Q" at 15px in the heaviest weight, then the wordmark "Quant X" at 15px bold with tight letter spacing in #F7F7F8.

Nothing else — no search field, no avatar, no notification bell. This header exists only below 1024px; above that the app is header-less.

Below the header show the top of a portfolio screen so the header reads in context: a heading "Portfolio", a large monospace figure ₹12,48,600 with a green +₹18,420 (+1.50%) delta in #10B981, and two holding rows — RELIANCE ₹2,980.50 +1.24% and HDFCBANK ₹1,642.75 −0.31% — with the losing figure in #F5808C.

Provide a light-theme version as well: header fill #FFFFFF, hairline #DDE5ED, icon #4D585F, wordmark #1D1D1D, and swap the P&L colours to #0A6B50 up and #B81C22 down. Type is Plus Jakarta Sans for prose and Geist Mono tabular for all numbers.
```

### 5. `components/shell/MobileDrawer.tsx` — Mobile navigation drawer

```text
Design a mobile navigation drawer for a dark Indian stock-trading app. It slides in from the left over a 70%-black scrim with a light backdrop blur. Panel is 288px wide (never more than 80% of the screen), fill #151517, with a 1px #29292D right hairline, full height.

Header row 56px with a bottom hairline: on the left a 28px #406AE4 tile at 16px corner radius holding a white bold "Q", followed by "Quant X" at 14px bold; on the right a 36px circular close button with an outline X in #D3D3D7.

Under it a full-pill "New Chat" button spanning the width minus 12px padding: fill #1E1E21, 1px #29292D border, 13px #D3D3D7 label, centred plus icon.

Then the grouped navigation at 44px pill row height: ungrouped Markets, Stocks, AutoPilot; then 12px uppercase monospace group labels SIGNALS, AI TOOLS, PORTFOLIO in #96969E with rows Signals / Screener, Chart Patterns, AI Algos, F&O / Portfolio, Paper, Trades, Risk. 16px outline icons, 14px labels in #D3D3D7. Show "Markets" active as a #406AE4 10% pill with #8FB0FF text and icon. F&O has a small amber "Elite" pill.

Pinned to the bottom above a hairline: two equal-width 40px pill buttons side by side, "Notifications" with a bell and "Settings" with a gear, 12px labels, 18px icons.

Behind the drawer, hint at a Markets screen showing NIFTY 50 24,318.85 +0.62% and BANKNIFTY 51,240.10 −0.18%. Also produce the light theme: panel #FFFFFF, hairline #DDE5ED, labels #4D585F.
```

### 6. `components/shell/RightRail.tsx` — Right utility rail — Copilot, watchlist, alerts, account, theme

```text
Design a 72px-wide vertical utility rail pinned to the right edge of a dark trading dashboard. Fill #0D0D0E (same as the page), with a single 1px #29292D hairline on its left edge, 12px vertical padding, all items horizontally centred.

Top item: a 40px circular button filled with a 110° gradient from #3B82F6 to #406AE4, carrying symmetric white inner bevels (4px, 30% white on both diagonals) and a blue drop glow, containing a white 20px robot/chip glyph. Beneath it a 24×1px #29292D divider.

Then four 40px circular icon buttons stacked with 8px gaps, all 20px outline glyphs in #96969E: an eye (Watchlist), a bell (Notifications), a magnifier (Search), a pulse line (Activity). Hover fills #1E1E21 and brightens the glyph to #F7F7F8.

Pinned to the bottom, four more: a gear (Settings), a question mark in a circle (Help), a circular avatar chip 26px filled #406AE4 with a white bold letter "R", and a sun glyph (theme).

Also draw the account dropdown in its open state: a 224px panel with 16px corner radius, fill #151517, 1px #29292D border, positioned to the LEFT of the rail and aligned to the bottom of the avatar. Its header shows a 32px #406AE4 circle "R", the name "Rishi Karthikeyan" at 12.5px and "rishi@example.com" at 10.5px #96969E. Below, three 13px rows separated by hairlines: Profile, Settings, and Sign out — Sign out turning #F5808C on a 10% red wash when hovered. Provide the light variant: rail #EDF1F4, hairline #DDE5ED, glyphs #5F6B75, panel #FFFFFF.
```

### 7. `components/shell/CommandPalette.tsx (⌘K)` — Command Palette — intent-aware ⌘K command bar

```text
Design a command palette overlay for a dark Indian stock-trading app. A 600px-wide centred card, 8px corner radius, fill #151517, 1px #29292D border, deep shadow, over a 60%-black scrim.

Header: a 48px-tall row with a bottom hairline — 16px magnifier in #96969E, then a borderless 14px input showing the typed text "reliance", then a small monospace key-cap "esc" in a 6px-radius #29292D outline.

Body: a 400px scrolling list, 6px side padding. Group headings are 10px uppercase, weight 600, letter-spacing 0.08em, #96969E. Rows are 8px-radius, 10px/8px padding, 15px outline icon, 13px label in #D3D3D7, with an optional right-side 11px hint in #96969E; the selected row fills #1E1E21 and brightens the label to #F7F7F8.

Groups in order: SYMBOLS — RELIANCE / Reliance Industries, RELINFRA / Reliance Infrastructure, RELAXO / Relaxo Footwears (tickers in monospace, up-arrow glyphs). GO TO — Copilot "Ask anything", Markets "The daily read", Signals "All horizons", Screener "Describe a setup", F&O with a tiny amber "ELITE" chip in #F0A94F on 12% amber. ACTIONS — New chat, New screen, Connect broker "Zerodha · Upstox · Angel One", Switch to light theme. Last row, no heading: a blue sparkle glyph in #8FB0FF and "Ask Quant X: “reliance”" with a ↵ key-cap.

Footer: a 10px legend strip above a hairline reading "↑↓ navigate", "↵ open", and right-aligned "⌘K toggle", each symbol in a small bordered monospace cap. Provide a light variant: card #FFFFFF, border #DDE5ED, selected row #F4F7F9, ink #1D1D1D, accent #3459C9.
```

### 8. ~~`components/shell/ContextPanel.tsx`~~ — REMOVED, do not design

> This component was deleted. It existed only to serve a rewritten `/markets` that has since been
> reverted, and nothing imports it any more. **There is no slide-over panel anywhere in Quant X.**
> Do not generate a design for it, and do not reintroduce the pattern when redesigning `/markets` —
> that page is a full-width bento of cards. Its prompt lives in
> [`screens/markets-stocks.md`](screens/markets-stocks.md).
>
> The number 8 is kept so the section numbering in this file stays stable.

### 9. `components/shell/ComplianceFooter.tsx` — Compliance Footer — statutory block on every authed surface

```text
Design a dense statutory footer for an Indian stock-market software product, sitting at the bottom of a dark app page. Full width up to a 1440px column, a single 1px #29292D hairline on top, 32px vertical padding, 24px side padding, and 10px spacing between paragraphs.

All body text is 11px with 14px line height, letter-spacing 0.06em, weight 500, colour #96969E — deliberately the smallest text in the product. Four stacked paragraphs of Indian regulatory boilerplate: a copyright line naming a Private Limited entity with a CIN, then the key disclaimer paragraph in which the clause "not a SEBI-registered Research Analyst or Investment Adviser" is lifted to a brighter #D3D3D7 while the rest stays muted, then a registrations line with SEBI registration, GSTIN and registered office, then a grievance line pointing unresolved complaints to SEBI SCORES.

Below the paragraphs, a wrapping row with two link clusters separated by 24px. Cluster one is labelled "Important Links:" in semibold #D3D3D7 followed by SEBI, SCORES, NSE and BSE. Cluster two is labelled "Important Information:" followed by Terms of Usage, Privacy Policy, Disclaimer and Risk Disclosure. Every link is #8FB0FF and dims to 80% opacity on hover; links inside a cluster are 12px apart and wrap gracefully on a 390px phone.

No icons, no logo, no social buttons, no newsletter field — this block is legal text and links only. Provide a light-theme version: hairline #DDE5ED, body #5F6B75, emphasis #4D585F, links #3459C9.
```

### 10. `components/shell/AutopilotStickyStop.tsx` — AutoPilot sticky stop — mobile panic FAB + confirm sheet

```text
Design a mobile emergency-stop control for an automated trading bot in a dark Indian stock-trading app.

First, the floating button: a 56px circle fixed 80px above the bottom edge and 16px from the right, with a 2px #F5808C border, a translucent red fill at 20% opacity, a real background blur behind it and a strong drop shadow. Inside, a 28px outline pause-circle glyph in #F5808C. Hanging 20px below the circle, aligned to its right edge, a small solid #F5808C chip with 6px radius holding the word "STOP" in 9px uppercase white with wide letter spacing. Show it floating over a portfolio screen listing RELIANCE 40 qty ₹1,19,220, TCS 15 qty ₹57,825 and HDFCBANK 60 qty ₹98,565, with a running P&L of +₹18,420.

Second, the confirmation sheet it opens: a 70%-black scrim with the card anchored to the bottom of the screen with 16px inset. Card is full width up to 448px, 16px corner radius, fill #0D0D0E, 1px #29292D border, 20px padding, heavy shadow. Header row: a 40px circle filled red at 15% opacity holding a 24px pause glyph, then "Pause AutoPilot?" at 16px semibold #F7F7F8 with a 12px #96969E line "Stops new trades — open positions are unaffected." Body paragraph at 14px #D3D3D7 explaining that existing positions stay at the broker with stop-losses intact, with "/autopilot" rendered as an inline code chip on #151517. Two stacked full-width buttons: a ghost "Cancel" and a solid #F5808C "Pause AutoPilot now" with white text. Show the desktop variant where the card is centred and the buttons sit side by side, right-aligned.
```

### 11. `app/layout.tsx` — Root document + provider stack

```text
Define the global document canvas and toast layer for a dark-first Indian stock-market web app called Quant X.

Base page: fill #0D0D0E with body ink #F7F7F8, antialiased. Over the whole viewport lay an almost invisible monochrome film grain — a repeating 256px fractal-noise tile at 1.8% opacity in overlay blend mode, fixed so it never scrolls. Do not tint it; it must read as texture, not colour.

Typography: Geist Sans for prose and Geist Mono with tabular figures for every number. Prose roles: display 34/40 at −0.02em weight 600, title 24/32 at −0.015em weight 600, heading 17/24 weight 600, body 15/24, label 13/18 weight 500, meta 12/16, micro 11/14 uppercase +0.06em weight 500. Numeric roles: hero 40/44, large 22/28, base 14/20, small 13/18.

Show a representative page on this canvas: a title "Markets", a hero number ₹24,318.85 with a +0.62% chip, and a row of stat cards for NIFTY 50, BANKNIFTY, INDIA VIX 13.42 and Advance/Decline 31–19.

Toast layer: notifications appear top-right as 8px-radius cards filled #151517 with a 1px #29292D border and #F7F7F8 text — for example "AutoPilot paused — No new trades will be placed. Open positions remain." Keep toast colour neutral; never use saturated success/error fills.

Also produce the exact light counterpart driven by the same structure: canvas #EDF1F4, cards #FFFFFF, hairlines #DDE5ED, ink #1D1D1D, muted #5F6B75, with the accent staying #406AE4 as a fill and shifting to #3459C9 as text.
```

### 12. `app/loading.tsx` — Root loading skeleton

```text
Design a loading skeleton screen for a dark Indian trading dashboard. Full viewport on #0D0D0E, content centred in a 1280px column with 24px side gutters and 48px top padding.

Stack, with 16px gaps: a 200×32px bar standing in for the page title, a 320×14px bar for the subtitle, then a 32px gap, then a full-width 320px-tall block. All placeholders use the same treatment — fill #29292D at 80% opacity, 8px corner radius on the large block and 6px on the bars, with a slow gentle pulse animation (fade between roughly 100% and 50% opacity over about 2 seconds, no shimmer sweep, no gradient).

Also design the authenticated variant, which is what most users see: same 1280px column but 32px top padding, a 180×28 title bar, a 280×14 subtitle bar, then a four-across grid of 80px-tall blocks with 16px gaps that collapses to two across below 768px, then a 320px-tall block below it. This shape is deliberately the silhouette of a KPI row plus a chart, so the page does not jump when NIFTY 50, BANKNIFTY, INDIA VIX and Advance/Decline tiles and the equity curve arrive.

No text anywhere — no "Loading", no spinner, no logo, no progress bar. Provide the light theme too: canvas #EDF1F4, placeholders #DDE5ED at 80%.
```

### 13. `app/error.tsx` — Root error boundary

```text
Design a full-page error state for a dark Indian stock-trading app. Centre everything on a #151517 background, content capped at 448px, 24px padding, entering with a subtle 20px upward fade over 500ms.

The illustration is the point. Build a 96px square: a slowly rotating dashed circle outline (radius 44 in a 96 box, 2px stroke, dash pattern 8 on / 6 off, #F5808C at 60% opacity, one full rotation every 8 seconds, linear), a soft blurred red glow filling the inside at 10% opacity, and a single bold exclamation mark centred at 36px in #F5808C, gently pulsing between 100% and 115% scale every 2 seconds.

Below it, a 120×32px "broken chart" glyph at 60% opacity, all in #F5808C with 2px round-capped strokes: a line climbing from bottom-left through a few peaks, then a short dashed gap at the top, then a hard crash down to the bottom-right at reduced opacity. It should read as an equity curve that snapped.

Text: "Something went wrong" at 20px bold #F7F7F8, then "An unexpected error occurred. Please try again." at 14px #96969E with 24px below.

One action only: a solid #406AE4 button with 12px corner radius, 24px horizontal and 10px vertical padding, 14px medium white label "Try again", darkening to #3055C2 on hover. No stack trace, no error code, no support link, no secondary button.

Provide the light theme: background #FFFFFF, red #B81C22, heading #1D1D1D, body #5F6B75.
```

### 14. `app/not-found.tsx` — 404 — Page not found

```text
Design a 404 page for a dark Indian stock-market app. Full viewport on #0D0D0E, everything centred, content capped at 512px with 24px padding.

Top: the numerals "404" set in a MONOSPACE face at 96px, weight 900, very tight letter spacing, coloured #8FB0FF — the brand's text-ink blue, noticeably lighter than the #406AE4 button fill. Below it, 16px down, "Page not found" at 30px bold with tight tracking in #F7F7F8. Below that, a 384px-wide paragraph at 14px with relaxed line height in #96969E: "The page you're looking for doesn't exist or has been moved. Check the URL or head back to familiar territory." Leave 40px before the actions.

Two buttons side by side, 12px apart, both with only a 6px corner radius, 24px horizontal and 10px vertical padding, 14px medium labels. The first is solid #406AE4 with white text and a left-pointing arrow icon, labelled "Go home", darkening to #3055C2 on hover. The second is a quiet button: fill #151517, 1px #29292D border, text #D3D3D7, a small dashboard/widget grid icon, labelled "Dashboard"; on hover the border lifts to #3B3B40, the fill to #1E1E21 and the text to #F7F7F8.

No illustration, no search field, no suggested links, no footer. On a phone the numerals shrink to 72px and the heading to 24px but the two buttons stay in one row.

Provide the light theme: canvas #EDF1F4, numerals #3459C9, heading #1D1D1D, body #5F6B75, secondary button #FFFFFF with a #DDE5ED border.
```

### 15. `app/global-error.tsx` — Global error — last line of defence

```text
Design a bare-bones catastrophic error screen for a dark web app called Quant X — the state shown when the entire application shell has failed, so it must look intentional using nothing but system fonts and flat colour.

Full viewport, background #0D0D0E, text #F7F7F8, everything centred, 24px padding, content capped at 420px. Typeface is a plain system sans (Inter / -apple-system / Segoe UI), not a branded face.

Top: a 56px circle with a fully round radius, filled #F5808C at 10% opacity with a 1px #F5808C border at 35% opacity, containing a single "!" at 28px weight 700 in #F5808C. Leave 20px below it.

Heading: "Quant X hit a critical error" at 20px weight 600, no margin above. Body at 13px with 1.6 line height in #96969E: "We logged it and will take a look. You can retry below, or reload the page." followed inline by a small monospace reference at 11px reading "ref: 8f2c41ae". Leave 24px below.

Two pill buttons in a centred row 10px apart, both fully rounded with 10px vertical and 20px horizontal padding at 13px: the first solid #406AE4 with white semibold text reading "Try again"; the second transparent with a 1px #29292D border and #F7F7F8 text reading "Reload app". Let them wrap onto two rows on a narrow phone.

No logo, no illustration, no navigation, no footer, and no light-theme variant — this screen is always dark, because the theme system is exactly what failed.
```

### 16. `/preview-design` — Design system preview (dev-only)

```text
Design a component specimen sheet for a dark Indian stock-trading design system. Single scrolling page on #0D0D0E, 32px padding, no centring and no max width, with 40px between sections. Each section starts with a 12px uppercase eyebrow letter-spaced 0.12em in #96969E.

Sections in order: (1) a 560px entity card for RELIANCE / Reliance Industries showing ₹2,847.30, +32.10 (+1.14%) in #10B981, a "bullish" sentiment chip, a 5/2/1 bull-neutral-bear vote strip, a 12-point sparkline and a provenance line "Indicator votes on settled closes to 2026-08-01." (2) An AI answer block: a shimmering "thinking" line, a card containing a 14-row "Screener hits" table and a "Market regime" gauge reading "Bull · 62% confidence", and a collapsible run log with three steps — Understanding your question 120ms ok, Fetching live data 2.28s ok, Option chain 4.01s FAILED with "Upstream timed out — used the EOD chain instead." (3) Typography: "Engineered restraint" as a 34px display heading and "Refined expressive" in a blue gradient. (4) Three buttons: solid #406AE4 primary, outlined pill secondary, ghost. (5) Two cards in a fixed two-column grid, 12px radius, fill #151517, 1px #29292D. (6) Three badges: +2.40% green, -1.10% red, NEUTRAL grey, 6px radius. (7) An input placeholder "Search symbol", 8px radius. (8) A pill tab rail Overview / Signals / Risk. (9) A dense table with Symbol, Price, Change % showing RELIANCE 2980.50 +1.24, TCS 3855.00 −0.62, INFY 1622.30 +0.41, numbers right-aligned in monospace. (10) Overlay triggers, a page header "Active swing signals / Generated at 09:15 IST · 12 candidates", an empty state "No signals yet", two usage meters 3/5 and 5/5, and two 96×28 sparklines.
```

### 17. `components/system/OfflineBanner.tsx + components/shared/SystemHaltBanner.tsx + components/broker/ConnectBrokerBanner.tsx` — Global status banners — offline, trading halt, broker prompt

```text
Design three full-width status banners for a dark Indian stock-trading web app. All are 100% wide with 16px horizontal and 8px vertical padding and 12.5px text.

Banner one — offline. Fill #151517, 1px #29292D bottom hairline, soft shadow, content centred horizontally. A 6px solid red dot (#F5808C) — a dot, not an icon — then "You're offline — showing the last loaded data. We'll reconnect automatically." in #F7F7F8. This one floats fixed at the very top of the screen above all other chrome.

Banner two — platform trading halt. A solid saturated red bar (#F5808C) with pure white text, centred, with a 16px outline warning-triangle glyph, reading in two sentences at 12px medium: "Trading is paused platform-wide while the team investigates. Paper trading and read-only surfaces remain available." This is the only full-bleed saturated fill in the entire product, so it must feel like a genuine interruption.

Banner three — connect your broker. Fill #151517 with a bottom hairline, left-aligned. A 16px lightning-bolt glyph in #8FB0FF, then the sentence "Connect your broker to unlock live data and live trading. Until then you're on the virtual ₹10L portfolio." in #D3D3D7, with the words "live data" lifted to #F7F7F8. Pushed to the right edge: a small solid #406AE4 button with 6px radius, 12px horizontal padding and white text reading "Connect", then a plain X dismiss icon in #96969E.

Show all three stacked above a Markets page displaying NIFTY 50 24,318.85 and BANKNIFTY 51,240.10. Provide light versions: #FFFFFF fills, #DDE5ED hairlines, halt red #B81C22, ink #1D1D1D.
```

### 18. `components/brand/QuantXMark.tsx + components/ui/BrandLogo.tsx + app/icon.svg` — Brand mark & logo system

```text
Design the app icon and logo system for an Indian AI trading platform called Quant X.

The primary mark is a 40×40 rounded-square glass tile with an 11.5 corner radius, filled with a diagonal gradient from #5B8DEF at the top-left to #3457C9 at the bottom-right. Across the top third lay a specular sheen: a soft white highlight fading from 50% to 0% opacity, giving the tile a glassy dome. Inside, draw a quantum atom in pure white: three identical ellipses, each 27 wide by 11.2 tall, centred and rotated 30°, 90° and 150°, stroked at 1.9px with 90% opacity; a solid 6.6px white nucleus at the centre; and three 3.8px white electrons sitting on the rings — one at the top, two at the lower left and lower right — each with a soft gaussian glow. Finish with a 1px white inner rim at 22% opacity so the tile stays crisp on light backgrounds. When placed in a dark sidebar at 32px, add a blue drop shadow of 8px blur at 35% opacity.

Produce three derivatives: a 16px favicon that drops the sheen, glow and rim and thickens the orbit strokes to 2.1px; a flat fallback tile — a solid #406AE4 square with a white heavy letter "Q", shown at 8px radius and again at 16px radius; and a full lockup pairing the 32px mark with a two-line wordmark, "Quant X" at 15px bold in #F7F7F8 above "TRADING OS" at 9.5px uppercase letter-spaced 0.16em in #96969E.

Also show a company-logo fallback monogram: a 28px 6px-radius square, fill #1E1E21, 1px #29292D border, with two uppercase initials at 11px semibold in #D3D3D7 — for example RE for RELIANCE, TC for TCS, HD for HDFCBANK.
```

### 19. `components/theme/ThemeToggle.tsx + AnimatedThemeToggle.tsx` — Theme controls — 3-way segmented + rail quick flip

```text
Design two theme controls for a dark Indian trading app that supports light, dark and automatic modes.

First, a three-option segmented control for a settings page. Outer tray: 8px corner radius, fill #151517, 1px #29292D border, 4px inner padding, options 4px apart. Each option is a 6px-radius button at least 40px tall with 12px horizontal and 8px vertical padding, a 14px outline icon and a 12px medium label, 8px apart: a sun for "Light", a moon for "Dark", a monitor for "Auto". Unselected options are #D3D3D7 on a transparent border. The selected option — show "Auto" selected — fills #406AE4 at 10% opacity, takes #8FB0FF text and icon, and gains a #406AE4 border at 30% opacity; the unselected borders are transparent but present, so selecting never shifts the layout. Let the three options wrap onto two rows in a narrow column.

Second, a single icon button for a utility rail: a 40px circle, transparent by default, containing a 20px outline sun glyph in #96969E; on hover it fills #1E1E21 and the glyph brightens to #F7F7F8. It shows a sun while the app is dark and a moon while it is light.

Illustrate the transition this button triggers: the new theme wipes in as a circle expanding from the button itself over roughly 460ms, so mid-animation the screen is split — a dark #0D0D0E dashboard showing NIFTY 50 24,318.85 +0.62% outside the circle, and the same dashboard in light #EDF1F4 with #FFFFFF cards, #DDE5ED hairlines and #1D1D1D ink inside it. Keep the accent #406AE4 identical in both halves and swap the P&L greens from #10B981 to #0A6B50.
```

<a id="auth-onboarding-auth--onboarding---callbacks"></a>

# Auth, onboarding & callbacks

### 20. `/login` — Sign In

```text
Design a light-theme web sign-in page for an Indian AI stock-trading platform called Quant X. Full-height two-column split. Background is a vertical sky gradient from #bfe0f8 at top to #e8f4fd at bottom. Left column takes 45% width and is hidden on screens under 1024px; it has 40px padding and three stacked blocks. Top: a 40px rounded-square blue app icon (gradient #5B8DEF to #3457C9, white orbital-atom glyph) beside 'Quant X' in 18px semibold #1D1D1D with a 9px uppercase wide-tracked '#5F6B75' caption 'Trading Intelligence'. Middle: a 36px semibold headline 'AI-Powered Trading Intelligence' in #1D1D1D, a 16px #4D585F paragraph 'Advanced stock screening and swing trading signals for the Indian market.', a 340px-wide 16px-radius #EDF1F4 tile holding a security-shield illustration, then a row of three stats spaced 32px apart in monospace tabular figures — '5 / AI engines', '1,800+ / NSE stocks', '₹10L / Paper, free' with 10px uppercase #5F6B75 labels. Bottom: 12px copyright. Right column centres a 448px white card, 16px radius, 1px #DDE5ED border, soft shadow, 32px padding: heading 'Welcome back' 24px bold, 14px #4D585F sub 'Sign in to your trading workspace', a full-width pill outlined button 'Continue with Google' with the multicolour Google G, an 'or' divider, two icon-prefixed inputs (Email Address, Password with eye toggle) with 12px radius and #EDF1F4 fills, a remember-me checkbox with a #3459C9 'Forgot password?' link, and a solid #406AE4 pill CTA 'Sign In' with a right arrow in white.
```

### 21. `/signup` — Sign Up — Step 1 (Account details)

```text
Design a light-theme web sign-up page for Quant X, an Indian AI stock-trading platform. Full-height two-pane split on a vertical sky gradient from #bfe0f8 to #e8f4fd. Left pane 45% wide, hidden below 1024px, 40px padding: a 40px blue rounded-square app icon with a white orbital-atom glyph beside 'Quant X' and a 9px uppercase caption 'Trading Intelligence'; then a 36px semibold #1D1D1D headline 'The AI trading desk for India' and a 16px #4D585F paragraph 'Five engines. One gated signal. Every call explained. Built for serious NSE traders.'; a 340px security-shield illustration on a 16px-radius #EDF1F4 tile; three monospace stats '5 AI engines', '1,800+ NSE stocks', '₹10L Paper, free'; a 12px copyright. Right pane centres a 448px white card with 16px radius, 1px #DDE5ED border and a soft shadow, 32px padding. Card contents in order: 24px bold 'Create your account'; 14px #4D585F 'Paper-trade the full stack, free. No card.'; a full-width 6px-radius outlined 'Continue with Google' button with the multicolour Google G; an 'or' hairline divider; four 12px-radius inputs with #EDF1F4 fills and 16px leading icons — Full Name, Email Address, Password (eye toggle), Confirm Password (eye toggle); directly under Password a five-segment 4px strength meter with a 12px caption reading 'Strong' in green; a checkbox line 'I agree to the Terms of Service and Privacy Policy' with #3459C9 links; and a full-width 6px-radius CTA filled with a 110-degree gradient from #3B82F6 to #406AE4, white bold label 'Continue' plus a right arrow. Footer line: 'Already have an account? Sign in'.
```

### 22. `/signup (step 2)` — Sign Up — Step 2 (Pick your plan)

```text
Design a dark-theme plan-selection step for a trading-app signup wizard. Page background #0D0D0E, content centred in an 896px column. At the top, a horizontal 3-step progress rail: three 36px circles connected by 48x2px bars; steps 1 and 2 are filled with a 110-degree gradient from #3B82F6 to #406AE4 with white numerals (step 1 shows a white check), step 3 is a hollow circle with a #29292D border and #96969E numeral; the bar between 1 and 2 is #406AE4, the next is #29292D. Below sits a 16px-radius card with #151517 fill, 1px #29292D border and a soft shadow, 32px padding. Centred heading 'Pick your plan' at 24px bold #F7F7F8 and a 14px #D3D3D7 line 'Start free. Upgrade the day you need more.'. Then three equal pricing cards in a row, 12px radius, 20px padding, 2px borders, 16px gaps. Card one 'Free' with a sparkle icon, ₹0/month, 'Trade the desk, on us' and four checkmarked features. Card two 'Pro' is selected — its border is #406AE4 with a faint blue tint fill and a gradient pill badge 'Most Popular' straddling the top edge — with a lightning icon, ₹999/month, 'Built for active traders' and six checkmarked features. Card three 'Elite' with a shield icon, ₹1999/month, 'The full trading desk' and six features. Prices are 24px bold with a 12px '/month' suffix; features are 12px #D3D3D7 with 14px blue checks. Footer row: a 6px-radius outlined 'Back' button with a left arrow, and a wide gradient 'Continue' button with a right arrow in white bold. Stack the three plans vertically below 768px.
```

### 23. `/signup (step 3)` — Sign Up — Step 3 (Confirm & create account)

```text
Design a dark-theme final confirmation step for a trading-app signup wizard. Background #0D0D0E, content centred in an 896px column, 16px page padding. Top: a 3-step progress rail of 36px circles joined by 48x2px bars — circles one and two are filled with a 110-degree gradient from #3B82F6 to #406AE4 and show white checkmarks, circle three is gradient-filled with a white '3', and both connector bars are #406AE4. Below, a centred card with 16px radius, #151517 fill, 1px #29292D border, soft shadow and 32px padding. Inside, centred and in order: a 64px circle with a 10%-opacity blue fill containing a 32px #8FB0FF check; a 24px bold #F7F7F8 headline reading 'You're in.'; a 14px #D3D3D7 line 'Create your account and put the five engines to work.'; then a narrow 384px summary box with 12px radius, #1E1E21 fill and a #29292D border, 20px padding, holding two justified rows — 'Selected Plan:' in 14px #D3D3D7 against 'Pro' in semibold #F7F7F8, and 'Price:' against '₹999/month' in semibold #F7F7F8. At the bottom, a two-button row 32px below: a compact 6px-radius outlined button 'Back' with a left arrow, and a wide 6px-radius button filled with the blue gradient reading 'Create Account' in white bold with a trailing checkmark. Show a variant where the wide button's label is replaced by a white spinner at 50% opacity.
```

### 24. `/forgot-password` — Forgot Password

```text
Design a light-theme password-reset page for Quant X, an Indian AI trading platform. Full-height two-pane split on a vertical sky gradient from #bfe0f8 to #e8f4fd. The 45% left pane (hidden below 1024px) shows a 40px blue rounded-square app icon with a white orbital-atom glyph next to 'Quant X' and a 9px uppercase 'Trading Intelligence' caption; a 36px semibold #1D1D1D headline 'Reset Your Password'; a 16px #4D585F paragraph 'Don't worry, it happens to the best of us. We'll help you get back in.'; a 340px security-shield illustration on a 16px-radius #EDF1F4 tile; three monospace stats reading '5 AI engines', '1,800+ NSE stocks', '₹10L Paper, free'; and a 12px copyright pinned to the bottom. The right pane centres a 448px white card with 16px radius, a 1px #DDE5ED border, soft shadow and 32px padding. Inside, top to bottom: a small 14px #4D585F back link with a left arrow reading 'Back to Login'; a 24px bold heading 'Reset Password'; a 14px #4D585F paragraph 'Enter your email address and we'll send you a link to reset your password.'; a labelled 'Email Address' input with 12px radius, a white fill, a 1px #DDE5ED border and a 16px grey envelope icon inset on the left, placeholder 'you@example.com'; and a full-width 12px-radius solid #406AE4 button with white 14px semibold label 'Send Reset Link'. Also produce the submitted variant where the form is replaced by a green-tinted panel: 12px radius, faint #0A6B50 fill and border, a 56px circle holding a 28px green check, the line 'Check your inbox!' in green, and a 14px grey line 'If an account exists for priya@example.com, you will receive a password reset link shortly.'
```

### 25. `/verify-email` — Verify Email

```text
Design a light-theme 'check your email' confirmation screen for Quant X, an Indian AI trading platform. Full-height two-pane split on a vertical sky gradient from #bfe0f8 to #e8f4fd. The 45% left pane (hidden below 1024px) has a 40px blue rounded-square app icon with a white orbital-atom glyph beside 'Quant X' and a 9px uppercase caption 'Trading Intelligence'; a 36px semibold #1D1D1D headline 'Almost There!'; a 16px #4D585F line 'Just one more step to unlock your AI-powered trading intelligence.'; a 340px security-shield illustration on a 16px-radius #EDF1F4 tile; three monospace stats '5 AI engines', '1,800+ NSE stocks', '₹10L Paper, free'; and a 12px copyright at the bottom. The right pane centres a 448px white card, 16px radius, 1px #DDE5ED border, soft shadow, 32px padding, with everything inside centre-aligned. Card contents top to bottom: a 64px square tile with 16px radius, a very faint blue fill and a 1px #DDE5ED border, holding a 32px #3459C9 envelope icon; a 24px bold #1D1D1D heading 'Verify your email'; a 384px-wide 14px #4D585F paragraph reading 'We sent a verification link to priya.sharma@gmail.com. Click it to activate your account and start trading.' with the address itself in medium-weight #1D1D1D; a solid #406AE4 button with 12px radius, 32px horizontal padding, white 14px semibold label 'Back to Sign In' and a trailing right arrow; and finally a 12px #5F6B75 line 'Didn't receive the email? Check your spam folder or resend verification' where the last two words are a #3459C9 medium-weight inline link. Include a variant where that link reads 'Verification sent!' with a small green check and appears dimmed.
```

### 26. `/auth/callback` — OAuth Callback (Supabase)

```text
Design a minimal dark-theme full-screen OAuth interstitial for a trading app. The entire viewport is a flat #0D0D0E canvas with no header, no card, no logo, and no border of any kind — the screen must feel like a momentary pause, not a page. Perfectly centred both vertically and horizontally, stack two elements. First, a 48px circular loading ring drawn as a 4px-thick stroke in #406AE4 with the top quarter of the ring fully transparent, spinning continuously clockwise at about one rotation per second. Second, 16px below the ring, a single line of body text in #D3D3D7 at roughly 16px regular weight reading exactly 'Completing sign-in...' with three plain periods. Do not add a progress bar, a percentage, a brand mark, a cancel link, a support link, or any secondary copy — this screen deliberately contains nothing else. Provide a matching light-theme variant where the canvas becomes #EDF1F4, the ring stays #406AE4, and the text becomes #4D585F. Keep the composition identical at mobile and desktop widths: the pair of elements simply stays centred, with no layout change, no scrolling and no responsive reflow. The visual weight should be very light — a large field of empty background with a small blue ring and one short grey sentence at the optical centre.
```

### 27. `/broker/callback` — Broker OAuth Callback

```text
Design a dark-theme full-screen broker-connection status screen for an Indian trading app, showing three states of the same card. Canvas is flat #0D0D0E with 16px padding; a single card is centred: 448px max width, 12px radius, #151517 fill, 1px #29292D border, soft shadow, 32px padding, all content centre-aligned. State one, connecting: a 40px blue #406AE4 spinner ring above an 18px semibold #F7F7F8 heading 'Connecting broker…' and a 12px #96969E line 'Exchanging tokens with your broker'. State two, connected: a 56px green #10B981 circled checkmark with a soft expanding ping halo behind it at 10% opacity, a 20px semibold #F7F7F8 heading 'Connected', and a 12px #96969E line 'Redirecting…'. State three, failed: a 48px #F5808C circled X, an 18px semibold #F7F7F8 heading 'Connection failed', a 12px #96969E message reading 'This connection link expired. Please start the broker connection again.', and 24px below it a compact solid #406AE4 button with 6px radius, 20px horizontal padding and a 13px medium white label 'Back to settings'. Keep the icon-heading-message rhythm identical across all three so the card feels like one object changing state, with 16px under the icon and 4px between heading and message. Do not add a logo, progress bar, broker name badge, or step counter. Provide the light variant: #EDF1F4 canvas, #FFFFFF card, #DDE5ED border, #1D1D1D headings, #5F6B75 body, #0A6B50 success, #B81C22 failure.
```

### 28. `/onboarding/broker-connect` — Onboarding Step 1 — Connect a broker

```text
Design a dark-theme onboarding step for an Indian AI trading app where the user links a stockbroker. Canvas #0D0D0E, a single 672px centred column with 24px side gutters, vertically centred, 24px between blocks. Header centred: an 11px uppercase wide-tracked #8FB0FF eyebrow 'Step 1 of 3'; a 24px semibold #F7F7F8 title 'Let the agents run live'; a 14px #96969E paragraph explaining that connecting a broker lets AutoPilot act on real positions, is read-only at first, and that free users can skip onto a ₹10L paper account. Below, one card with 12px radius, #151517 fill and a 1px #29292D border. Its header row is 44px tall with a bottom hairline, a 16px blue shield-check icon and a 16px semibold title 'Link a broker for live execution'. The card body is a stack of seven full-width rows with 8px gaps, each 6px radius, #1E1E21 fill and a 1px #29292D border, 12px padding, with the broker name at 14px medium #F7F7F8 above an 11px #96969E descriptor, and a 16px grey right-chevron on the far right. Above row one put an 11px uppercase #96969E label 'Instant · one-click login' and list Zerodha ('Kite Connect · OAuth · India's largest discount broker'), Upstox ('API v2 · OAuth · Tier-1 NSE access') and Fyers ('OAuth · API v3', with a small pill-shaped outlined 'Beta' tag); under each add a 10px #96969E reassurance line about logging in securely. Then an 11px uppercase label 'Connect with a token' above Angel One, Dhan, Kotak Neo and Alice Blue. Show one expanded state: under Angel One, an inset 6px-radius panel with #0D0D0E fill holding three numbered 11px grey help lines with blue underlined links, then a two-column grid of four 8px-radius inputs labelled API key, Client ID, PIN / Password and TOTP secret, and a full-width solid #406AE4 button 'Connect Angel One'. Footer: 12px grey text 'Connect later anytime in Settings → Broker' on the left and a borderless grey button 'Skip — explore with a virtual ₹10L portfolio' on the right.
```

### 29. `/onboarding/risk-quiz` — Onboarding Step 2 — Risk calibration quiz

```text
Design a dark-theme one-question-at-a-time onboarding quiz for an Indian AI trading platform. Canvas #0D0D0E, content in a 672px centred column with 24px gutters and 64px top padding. Header: a row with a small 10px uppercase wide-tracked #8FB0FF eyebrow 'Calibrate the AI · 60 seconds' preceded by a 12px sparkle icon on the left, and an 11px #96969E text link 'Skip for now' on the right. Under it a 32px semibold #F7F7F8 headline 'Teach AutoPilot how you trade.' and a 13px #96969E paragraph '5 quick questions set how the risk engine sizes positions for you, plus your tier, signal filters, and hands-free defaults.' Then a 4px-tall full-width progress track in #151517 with a #406AE4 fill at 60%, and beneath it a 10px monospace #96969E caption 'Question 3 of 5'. Below the header, a question card with 12px radius, #151517 fill, a 1px #29292D border and 24px padding: a 17px semibold #F7F7F8 question 'How long do you typically hold a winning trade?' followed by four stacked full-width answer buttons with 8px gaps, each 6px radius with 16px horizontal and 12px vertical padding. Three are unselected — #1E1E21 fill, 1px #29292D border, 13px #D3D3D7 label, and a 20px hollow circle with a 2px #29292D ring. One is selected — solid #406AE4 fill, white 13px label, and a 20px filled circle with a white checkmark. Answer labels: 'Intraday — square off same day', '3–10 days (swing)', '1–3 months', '1+ year — build a portfolio'. Footer row: a dim 12px 'Back' with a left arrow, and on the right a solid #406AE4 pill button with white 13px semibold 'Calibrate AutoPilot' and a leading sparkle. Close with a centred 10px #96969E line 'You can always change your risk profile in Settings.'
```

### 30. `/onboarding/risk-quiz (result)` — Onboarding Step 2 — Risk profile result

```text
Design a dark-theme results screen that reveals a trader's calibrated risk profile in an Indian AI trading app. Canvas #0D0D0E, 672px centred column, 24px gutters, 64px top padding, 16px between blocks. Hero block first: a 16px-radius panel with a 4px-thick left edge in a warm amber, a barely-there amber tint fill at about 3% opacity and a 33%-opacity amber hairline border, 32px padding. Inside it a 10px uppercase wide-tracked #96969E eyebrow 'Your risk-engine profile'; a 44px semibold amber (#F0A94F) word 'Moderate'; a 12px monospace #96969E line 'Score 8/15'; and a 13px #D3D3D7 relaxed paragraph 'Balanced — full signal access with regime-aware sizing (score 8/15). Pro tier matches — unlimited signals + AutoPilot Lite (live auto-trading up to ₹2L) + Portfolio Doctor.' Next, a 12px-radius #151517 card with a 1px #29292D border and 20px padding, laid out as a justified row: on the left a 10px uppercase #96969E label 'Recommended tier' above a 20px semibold #8FB0FF row with a target icon reading 'Pro'; on the right a small outlined pill button 'See plans' with a #1E1E21 fill. Then a second identical card containing a 10px uppercase label 'How the engines are sized for you' and three 12px #D3D3D7 bullet lines where the leading phrase is white and every number is monospace #8FB0FF: 'Signal filter: min confidence 70%', 'AutoPilot sizing: max 7% per position · daily loss cap 2%', 'Concurrent positions: up to 12', closing with a 10px grey line 'You can tune any of these from Settings.' Footer: a dim 12px link 'Adjust defaults' on the left and a solid #406AE4 pill 'Continue' with a right arrow on the right. Use no charts or gauges.
```

### 31. `/onboarding/risk-quiz (mode choice)` — Onboarding Step 2b — Managed vs Pro mode

```text
Design a dark-theme two-option mode chooser for an Indian AI trading app, the moment where a new user decides whether the AI trades for them or they trade themselves. Canvas #0D0D0E, content in a 672px centred column with 24px gutters and 64px top padding. Centred header: a 34px semibold #F7F7F8 headline 'Hand the AI the wheel, or grip it yourself?' and a 13px #96969E line 'Same engines underneath. Switch modes any time in Settings.' Below, two equal side-by-side cards with a 16px gap, each 16px radius, #1E1E21 fill, 1px #29292D border and 24px padding, left-aligned content, and each behaving as one large clickable target. Left card: a 28px #8FB0FF robot icon, an 18px semibold #F7F7F8 title 'Manage it for me', a 12px #D3D3D7 paragraph 'AutoPilot runs the book on your own broker account: ML-ranked picks, risk-gated sizing, and exits, all inside your limits with a kill switch always in your hands.', then three 12px #96969E bullet lines each prefixed by a 12px blue check — 'Plain-language Simple view: money, risk, activity', 'No charts or jargon', 'You stay in control: pause any time' — and finally a 13px semibold #8FB0FF row with a right arrow reading 'Choose'. In this card's top-right corner place a small 4px-radius badge with a 15%-opacity blue fill and 10px uppercase #8FB0FF text reading 'Suggested'. Right card is identical in structure with a line-chart icon, the title 'I'll trade myself', the paragraph 'The full terminal: ML signals, strategy builder, scanners, walk-forward backtesting and bot execution. Every tool, full control.', bullets 'ML signals with entry / stop / target', 'Build + walk-forward backtest strategies', 'AI agents on every page', and the same 'Choose' row, with no badge. Stack the two cards vertically below 768px.
```

### 32. `/onboarding/complete` — Onboarding Step 3 — You're set up

```text
Design a dark-theme onboarding completion screen for an Indian AI trading app. Canvas #0D0D0E, a 672px centred column with 24px gutters, everything vertically centred and centre-aligned, 24px between blocks. Top: a 56px circle with a 10%-opacity blue fill and a 30%-opacity #406AE4 ring, holding a 28px #8FB0FF circled checkmark. Under it an 11px uppercase wide-tracked #8FB0FF eyebrow 'Step 3 of 3'; a 24px semibold #F7F7F8 headline 'You're set up.'; a 14px #96969E line 'Quant X is calibrated to your risk profile and ready to publish signals. Try one of these to start.'; then a 13px medium #10B981 line with a small green check reading 'zerodha connected — live data is on.' (also show an alternate grey variant reading 'No broker yet — you're on the virtual ₹10L portfolio. Connect anytime in Settings.'). Below, a two-by-two grid of four clickable cards with 12px gaps, each 12px radius, #151517 fill, a 1px #29292D border, no shadow at rest and 20px horizontal by 16px vertical padding, with left-aligned text inside even though the page is centred. Card one: 14px medium #F7F7F8 'Open Command Center' over an 11px #96969E line 'Live regime, today's top signals, your watchlist.' Card two: a 14px blue sparkle icon beside 'Ask Copilot' over the quoted line '"Show me my top swing setup today."' Card three: 'Place a paper trade' over '₹10L paper account seeded; equity-curve from day 1.' Card four: 'Browse strategies' over 'Deploy a template or build one in plain English.' Show the hover state of one card lifted 1px with a lighter #3B3B40 border and a soft shadow. Finish with a centred 44px-tall solid #406AE4 pill button, white 16px medium label 'Go to Command Center'. Stack the four cards in one column below 640px.
```

<a id="home-copilot-the-copilot-home--ai-thread"></a>

# The Copilot home (AI thread)

### 33. `/` — Root landing (server redirect to /copilot)

```text
Do not design a screen for this route. This is a zero-pixel server redirect: visiting the site root immediately forwards the browser to /copilot, which is the product's real home. If a redirect artefact is required for completeness, produce a single full-bleed frame on the app canvas — #0D0D0E in dark, #EDF1F4 in light — that is otherwise empty: no logo, no spinner, no copy, no nav chrome. The only inherited elements are document-level: the browser tab title 'AI Swing Trading Platform for NSE/BSE | Quant X', a theme-colour of #0D0D0E, and the Geist typeface stack. Any time you are tempted to design a marketing landing page, hero, pricing table or sign-up flow for this URL, do not — those surfaces live in a completely separate application and are not part of this product. Spend the design effort on /copilot instead, which is where every visitor lands within one hop, and which carries the hero composer, the personalised market cockpit and the full chat thread. Treat this route purely as routing metadata in the sitemap: '/' → 301 → '/copilot', alongside the four other retired aliases that behave identically (/dashboard, /tools, /home, /activity).
```

### 34. `/copilot` — Copilot — AI Home (hero composer + market cockpit)

```text
Design a dark-first web dashboard home for 'Quant X', an AI trading desk for Indian NSE markets. Canvas #0D0D0E, cards #151517, nested #1E1E21, hairlines #29292D; ink #F7F7F8 / #D3D3D7 / #96969E. One accent: solid blue #406AE4 with white text, and blue ink #8FB0FF for AI moments. P&L only: green #10B981, red #F5808C. Geist for prose, Geist Mono tabular for every number. Radii 6/8/12/16px plus full pills. Shell: fixed 240px left nav, fixed 72px right icon rail, centre pane capped 1440px with 24px gutters. Top: a soft blue radial bloom behind one centred 19px line — 'The AI trading desk for India. Five engines. One gated signal. Every call explained.' Under it a 768px chat box, 16px radius, #151517 on a #29292D hairline, glowing blue when focused: an 18px sparkle in #8FB0FF, a mono 15px input placeholdered 'Analyse RELIANCE: entry, stop, target and the key risks', a hairline split, then five pills — Ask (filled #406AE4), Analyze, Screen, Doctor, Trade — and a 40px round blue send button. Below: eyebrow 'GOOD MORNING, RISHI', a 34px heading 'Your AI trading desk' with the last three words in metallic silver, and a right pill '● Market live · closes in 3h 42m'. Then a full-bleed ticker: NIFTY 50 24,812.35 +0.42% · BANK NIFTY 53,204.10 −0.18% · SENSEX 81,340.22 · RELIANCE ₹2,948.60 +1.14% · TCS ₹4,102.75 −0.32% · INFY ₹1,842.30. Then 'Market news' with All / India / Global pills and eight 16:9 image cards. Finish with a 5/7 split: a 'QUANT X PRO' upsell with a glossy gradient 'Explore Pro' pill beside three link rows.
```

### 35. `/copilot (view: thread)` — Copilot — Main Chat thread (full-height conversation)

```text
Design a full-height AI chat thread for an Indian stock-trading product, dark-first. Canvas #0D0D0E, cards #151517, nested #1E1E21, hairlines #29292D; ink #F7F7F8 / #D3D3D7 / #96969E; accent fill #406AE4, accent ink #8FB0FF; green #10B981 and red #F5808C for market direction only. Geist for prose, Geist Mono tabular for numbers. Radii 8/12/16px. One 768px centred column filling the viewport height. Top bar: a tracked 12px caps label 'MAIN CHAT' with a small outlined 'New chat' button. Messages, 20px apart. User: a right-aligned caps label 'YOU' over a #1E1E21 bubble, 8px radius, 13.5px, max 82% width — 'Analyse RELIANCE: entry, stop, target and the key risks'. Assistant: a caps label 'QUANT X' and NO bubble — bare 13.5px prose on the canvas. Above the prose, exactly ONE evidence card, 12px radius: a 40px logo tile, 'RELIANCE' at 17px, 'Reliance Industries · NSE' at 12px muted, and right-aligned '₹2,948.60' at 22px mono in plain white (never coloured) with '+33.20' and a green '+1.14%' pill. Below a hairline: 'OVERALL SIGNAL · 12 INDICATORS' at 11px caps, a 6px green/grey/red segmented bar, then the word 'Bullish' at 24px in green, then a thin filled sparkline. Below a second hairline: 'Details' and 'Buy' buttons, and two tiny grey lines of provenance and 'Research and education only. Not investment advice.' Under the prose a single 12px grey line: '✓ Worked it out · 6 steps · 2.4s · 3 sources ›'. Then three outlined chips: 'Explain simply', 'Show the risks', 'What would change this?'. Bottom: a pill composer with a mono placeholder and a round blue send button.
```

### 36. `(global overlay on every authed route incl. /copilot)` — Copilot dock — persistent right-side chat panel

```text
Design a persistent AI assistant side panel for a dark trading app. The panel is 400px wide, full viewport height, docked to the right edge but offset 72px to clear an icon rail; surface #151517 with a 1px #29292D left border and a deep drop shadow. Ink #F7F7F8 / #D3D3D7 / #96969E, accent fill #406AE4, green #10B981, red #F5808C. Geist type, Geist Mono for numbers, radii 8/12px and full pills. Header row: a 24px blue-gradient tile with a small robot glyph, 'Copilot' at 13px semibold, a rounded grey chip 'RELIANCE · this page', and three 28px ghost icon buttons — plus, expand-arrow, close. Beneath, a horizontally scrollable row of five 12px pills: Ask (filled #406AE4), Analyze, Screen, Doctor, Trade. Body: right-aligned user bubbles in INVERTED colour (near-white fill, dark text, 12px radius with a squared bottom-right corner), and left-aligned assistant bubbles on #0D0D0E with a hairline and a squared bottom-left corner. Show one assistant turn containing a compact stock card for RELIANCE at ₹2,948.60 +1.14%, two short paragraphs, and a single grey line '✓ Worked it out · 4 steps · 1.8s ›'. Below it a bordered action card: 'Add RELIANCE to watchlist' with a small blue 'Confirm' button, and a red-tinted variant reading 'Buy 25 RELIANCE at market' with 'Place order'. Footer: a 12px-radius input row on #0D0D0E with the placeholder 'Ask anything about markets…' and a 28px round blue send button, then two grey 10px lines: '@ticker to add context · ⌘/ to toggle · Trade actions always ask before firing' and 'For educational purposes. Not investment advice. Markets carry risk.' Also show the closed state: a 48px round blue floating button, bottom-right.
```

### 37. `/copilot (and every (platform) route) — loading` — Platform route loading skeleton

```text
Design a neutral loading skeleton for a dark trading dashboard. Page canvas #0D0D0E (light theme #EDF1F4). All placeholder bars are a single flat grey — #29292D at 80% opacity on dark, #DDE5ED at 80% on light — with a soft breathing pulse; no shimmer sweep, no gradient, no colour, no logo, no spinner, no text of any kind. Layout: a centred column capped at 1280px with 24px side padding and 32px top padding. From the top, with 16px gaps: a 180x28px bar (standing in for a page title), then a 280x14px bar (the subtitle). Then a 24px gap and a four-column grid with 16px gutters holding four identical 80px-tall bars with 8px corners (the KPI row). Then another 24px gap and one full-width 320px-tall bar with 8px corners (the main content panel). Corners: the two text bars use 6px radius, the blocks use 8px. Below 768px the four-up KPI grid collapses to two columns of two. Around this skeleton, keep the app chrome fully painted and stable — a 240px left navigation rail, a 72px right icon rail, and a compliance footer — so only the content pane appears to be loading. The whole composition should read as calm and structural, never decorative.
```

### 38. `/copilot (and every (platform) route) — error` — Platform route error boundary

```text
Design a compact, calm error state for a dark trading dashboard, centred in the content pane (minimum 60% of viewport height, 24px padding) with the app's left navigation rail, right icon rail and compliance footer still fully visible around it. Canvas #0D0D0E in dark, #EDF1F4 in light. The block is at most 384px wide and centre-aligned. At the top, an 80x80 mark: a thin dashed circle outline in muted red #F5808C (dark) / #B81C22 (light) at 1.5px stroke with a 6-on-5-off dash pattern, slowly rotating one full turn every eight seconds; behind it a soft blurred red glow at about 10% opacity; and centred inside it a single bold exclamation mark at roughly 30px in that same red. Below, 24px down, an 18px bold heading in near-white #F7F7F8: 'Something went wrong'. Under it a 14px line in grey #96969E: 'An unexpected error occurred.' Then 24px lower, one solid pill button — fully rounded, 20px horizontal and 8px vertical padding, filled #406AE4 with white 14px medium text — labelled 'Try again'. Nothing else: no stack trace, no error code, no support link, no illustration, no secondary button. The red must read as a quiet status marker, not an alarm; the rest of the composition stays entirely neutral so the single recovery action is unmistakably the next step.
```

<a id="markets-stocks-markets--stock-universe---watchlist"></a>

# Markets, stock universe & watchlist

### 39. `/markets` — Markets — regime-aware desk

```text
Design a dark-first, FULL-WIDTH web dashboard screen for an Indian (NSE) AI trading desk called Quant X. Page canvas #0D0D0E, cards #151517, raised/hover #1E1E21, hairline borders #29292D. Ink: primary #F7F7F8, secondary #D3D3D7, muted #96969E. One brand accent: fill #406AE4 with white text; accent ink #8FB0FF. P&L colours only on numbers: up #10B981, down #F5808C, caution #F0A94F. Font: Geist sans for prose, Geist Mono tabular for every number. Radii: 6px chips, 8px inputs, 12px cards, 16px hero cards, 9999px pills. Layout: fixed 240px left navigation rail on #151517, fixed 72px right icon rail, and a full-bleed content area with 24px padding and 16px gaps — this IS a bento dashboard, not a reading column. Top to bottom: (1) a header row — uppercase 12px tracked eyebrow "REGIME-AWARE DESK", a 32px semibold title "Markets" with a small accent line-chart icon, a 12.5px muted subtitle "Your AI market desk — the full read before the bell and the wrap after the close." — and, right-aligned, an outlined pill with a green dot reading "Market Live". (2) THE HERO: a 16px-radius AI briefing card filling the width — a 40px accent-tinted tile with a sun glyph, "Pre-market briefing" at 13px semibold beside a small accent "✦ AI" pill, the date beneath, a circular refresh button top-right; below it a 26px semibold headline "Firm open — S&P 500 +1.57% · firm Asia · FIIs net buyers" with a green trend arrow; then a three-column tinted sub-grid: "GLOBAL SETUP" (spanning two columns, chips of index name + mono value + signed %), "THE TAPE", "INDIA CONTEXT", plus FII/DII figures at 16px mono in green/red and "WEEKLY EXPIRY"/"MONTHLY EXPIRY" tiles, closing with a "THE READ" block. (3) a slim index ticker strip of NIFTY/BANKNIFTY/SENSEX cells. (4) a full-width "Market Pulse" card: a "since yesterday" chip row then a four-tile internals grid — Breadth score 68/100 with a progress bar, Above DMA (20D/50D/200D bars), 52-week highs/lows, Volatility (India VIX + HV20). (5) a two-card row split 8/4: "AI Radar" (two panels — "Setups on the tape" counts, and "Firing now" chips with severity dots) beside a "Market breadth" card with an advance/decline bar and a cumulative A/D sparkline. (6) a row split 4/8: a "Regime gauge" card holding a 288px half-circle 0–100 gauge reading 71 with "OUT OF 100" beneath, the band word "Bull" in green and the caption "Regime Bull · 78% confidence"; beside it "Sector heatmap — every NSE sector, ranked by avg change" as a dense treemap where the top sector spans 2×2, each tile tinted green/red by magnitude with the sector name over a mono signed percentage. (7) a full-width "What's happening in the market" card: bulleted deterministic drivers plus a small accent pill button that generates an AI narrative on demand. (8) a "Market movers" heading over three columns — Top gainers, Top losers, Most active. (9) a three-column row: "Sector Rotation" (scrolling list with Leading/Improving/Weakening/Lagging pills), "Top headlines" (thumbnail + 2-line headline + source · time, some flagged "BIG"), and "Big deals — bulk / block · by ₹ value". (10) a wide "Institutional Order-Flow" card with a Beginner⟷Pro toggle, two large FII vs DII stat blocks and a diverging bar. Finish with a centred 10px disclaimer. Show a second frame of the SAME page for a non-entitled user, where the index ticker strip is replaced by a 16px-radius broker-connect card (accent Zap tile, heading "Live NSE prices & flows — from your broker", accent pill "Connect broker") with a row of foreign global-cue chips beneath it, and where the Market movers section and the Institutional Order-Flow card are absent entirely.
```

### 40. `/stocks` — Stocks — full NSE universe discovery

```text
Design a dark web dashboard screen: a dense NSE stock browser for an Indian AI trading platform. Canvas #0D0D0E, cards and table body #151517, table header and hover #1E1E21, hairlines #29292D. Ink #F7F7F8 primary, #D3D3D7 secondary, #96969E muted. Single accent fill #406AE4, accent ink #8FB0FF for AI elements. Gains #10B981, losses #F5808C, caution #F0A94F. Geist sans for text, Geist Mono tabular for all prices and volumes. Radii: 6px chips, 8px inputs/cards, 12px panels, pills fully round. Fixed 240px left nav rail, 72px right icon rail. Top: a hairline page header with an 11px uppercase tracked mono eyebrow "AI STOCK DISCOVERY", a 40px title "Stocks", a 14px grey description, and two right-side pills — "EOD research" and "Today's signals". Below: a tinted green-6% banner reading "REGIME DETECTION  Bull · VIX 13.42" with the line "Risk-on. Size up. Momentum gets paid here." and three legend dots Bull 68% / Sideways 24% / Bear 8%. Then a card "Today's AI Picks" with two six-across tile rows labelled ALPHA PICKS and MOMENTUM PICKS — tiles read "#1  LONG / RELIANCE / entry ₹2,845.60 · 78%". Then a small search row "Check any stock's Mood — e.g. RELIANCE" with a blue Go button. Then two side-by-side 5-row lists "TOP GAINERS · NIFTY 50" and "TOP LOSERS · NIFTY 50". Then a hairline toolbar: a 340px search field "Search the NSE board for an AI read: symbol or company" and three dropdowns (Broad market · Nifty 50 / All sectors / Change %). Then a dense sortable table with mono uppercase 11px headers Symbol, LTP, Change, Volume, AI Picks — rows show a 26px brand logo, TCS with grey sector and market-cap chips, ₹4,102.75, +1.84%, 42.6 L, and a blue-outlined "Alpha #4" chip. Footer: "Page 1 of 4 · 87 stocks" and Previous / Next pills.
```

### 41. `/stock/[symbol]` — Stock terminal — single-symbol entity page

```text
Design a dark, full-bleed single-stock terminal page for an Indian NSE trading platform — no side navigation, content centred at 1280px with 16–24px gutters. Canvas #0D0D0E, cards #151517, nested tiles #1E1E21, hairlines #29292D. Ink #F7F7F8 / #D3D3D7 / #96969E. One accent fill #406AE4; AI elements use ink #8FB0FF. Gains #10B981, losses #F5808C, caution #F0A94F. Geist sans for prose, Geist Mono tabular for every number. Radii 6/8/12/16px, pills fully round. Top: a mono 11px uppercase breadcrumb "MARKETS › RELIANCE". Then a hairline-bottom header: 40px brand logo, "RELIANCE" at 36px semibold, "Reliance Industries", "NSE · ENERGY"; beneath, ₹2,845.60 in 30px mono (uncoloured), +33.40 in green, a +1.19% badge, a grey "EOD research" pill and a green "● STREAMING" pill, plus a blue-outlined "ALPHA PICKS · #4 · LONG" chip. Under that a four-across stat row with 9px uppercase labels: Open ₹2,812.00, Prev Close ₹2,812.20, Day Range ₹2,801.10 – ₹2,861.40, 52W Range ₹2,220 – ₹3,024, Volume 42.6 L (1.4× avg), Mkt Cap ₹19.24 L Cr, P/E 28.4, RSI 14 58.2 — then a thin "52W POSITION · 73% of range · -6.2% vs high" gradient meter. Right-aligned buttons: Trade, Add to Watchlist, Ask Copilot, refresh icon. Below: a 520px-tall candlestick chart with a volume histogram, EMA 21/50/200 lines, a crosshair OHLC legend "O 2,812.00 H 2,861.40 L 2,801.10 C 2,845.60 +1.19% Vol 42.6 L", and a mono pill toolbar 1W 1M 3M 6M YTD 1Y 2Y 5Y ALL | D W M | Candles Line Area | EMA 21 50 200 | Log | Pattern. Next a blue-bordered hero card "AI Trade Desk — Deep reasoning · cached for today" with grey evidence chips and five labelled paragraphs SETUP, EVIDENCE, SCENARIOS, RISK, WATCH. Then a rounded pill tab rail "Engine Read · Why It Moves · Forecast" over a two-column card grid: a "Fusion verdict" card (Constructive, 72/100, factor list) and an "AI Dossier" card (three engine tiles with meters), a full-width "Technicals & Levels" panel in three columns, and a three-card row Relative Strength / Sentiment / Volume Intelligence. Close with a "DATA MODULES" grid: Fundamentals metric tiles and a Volume profile with POC/VAH/VAL/VWAP.
```

### 42. `/watchlist` — Watchlist — active monitoring surface

```text
Design a dark web dashboard screen: a stock watchlist for an Indian NSE AI trading platform. Canvas #0D0D0E, cards #151517, nested tiles and table header #1E1E21, hairlines #29292D. Ink #F7F7F8 / #D3D3D7 / #96969E. Accent fill #406AE4 with white text; AI ink #8FB0FF. Gains #10B981, losses #F5808C, caution #F0A94F. Geist sans for text, Geist Mono tabular for numbers. Radii: 8px inputs, 12px tiles, 16px cards, fully round pills. Fixed 240px left nav rail and a 72px right icon rail. Page header: mono 11px uppercase eyebrow "AI IS WATCHING · WATCHLIST", a 40px title "Watchlist", a small amber-toned meter pill "4 / 5 symbols (free) Upgrade →", and right-side controls — a grey "EOD research" pill, a refresh icon, and a blue-ink "Ask AI" button. Below, a 16px-radius container holding four 12px tiles: Tracked 4, Bullish 2, Bearish 1, Warnings 1 — labels 11px grey, values 22px mono. Then a full-width rounded-full input row with a search glyph, placeholder "Add symbol, e.g. TCS, RELIANCE, HDFCBANK" and a blue Add button. Then an amber-tinted banner "The engines are watching the first 5 of your 9 symbols. Upgrade to Pro…". Then a "Daily Digest" card with an "Explain" link and per-symbol bullet lists. Then a hairline row: four round chips all 4 · bullish 2 · bearish 1 · warnings 1 (active chip solid blue) and a right-side Table | Cards segmented toggle. Main region: a dense table with mono uppercase headers Symbol, LTP, Change, Consensus, Regime, Mood, Signal — rows read RELIANCE (amber "Warn" pill) ₹2,845.60 +1.19% [bullish badge] bull +0.34 LONG 78%, plus TCS, HDFCBANK, INFY; each row ends with a small trade icon and a trash icon. Show an alternate three-across card layout where each card has a 3px green left edge, a 30px logo, price, a consensus pill, engine badges, a "Latest signal LONG @ ₹2,845.60 conf 78% View →" row and a footer "Open dossier → · alerts on · Trade".
```

<a id="signals-signals-hub---signal-detail"></a>

# Signals hub & signal detail

### 43. `/signals` — Signals Hub — Overview (master blotter)

```text
Design a dark-first WEB DASHBOARD screen for an Indian (NSE) AI trading platform called Quant X. Page canvas #0D0D0E, cards #151517, hover/nested panels #1E1E21, hairline borders #29292D. Ink: primary #F7F7F8, secondary #D3D3D7, muted #969 69E→use #96969E. One accent, a glossy fintech blue: fills #406AE4 with white ink; accent TEXT is #8FB0FF. Profit green #10B981 and loss pink #F5808C are used ONLY for P&L numbers, never for chrome. Fonts: Geist Sans for prose, Geist Mono tabular for every number. Radii: 6px chips, 8px inputs/buttons/table, 12px cards, 16px hero panels, 9999px pills.

Layout: 240px fixed left nav rail, 72px right icon rail, content between them capped at 1440px with 24px gutters. At the very top of the content, a sticky full-bleed tab strip on a hairline: a pill rail (9999px, 1px #29292D, #0D0D0E fill, 4px padding) with three tabs — Overview (active, #151517 pill), Alpha Picks, Momentum Picks.

Stack vertically, 24px gaps: (1) header — 11px uppercase letterspaced eyebrow 'ML SIGNAL STACK · ALL HORIZONS', 22px bold H1 'Signals analysis' with a small pulse icon and a grey pill 'EOD research', then two grey caption lines; on the right two small buttons, 'Trade' (blue fill) and 'Ask AI' (outline, #8FB0FF ink). (2) A single 15px/24 paragraph answer, max 68 characters wide, e.g. '11 signals are open across both books. Confidence averages 78%, the book leans 8-to-3 long, and RELIANCE leads on risk-adjusted edge at 1:2.6.' (3) An 'Automate these signals' 16px-radius card with a green 'Bot off' chip and three inner tiles: Trading bot, Alpha Picks, Momentum Picks. (4) Three 12px-radius cards side by side titled 'By horizon', 'By direction', 'By confidence', each holding labelled 8px-tall proportion bars (Alpha Picks 7, Momentum Picks 4; Long 8 in #10B981, Short 3 in #F5808C; 90%+ 2, 75–89% 5, 60–74% 3, Below 60% 1). (5) A filter row: two 160px/144px dropdowns 'All horizons' and 'Both sides', a 176px input 'Search symbol…', and a right-aligned '11 of 11 open'. (6) A dense sortable table, 8px radius, sticky header in mono 11px uppercase muted: Symbol · Horizon · Side · Entry · Stop · Target · Exp. move · Confidence · R:R. Six rows with round company logos: RELIANCE Alpha Picks LONG ₹2,847 ₹2,742 ₹3,020 +6.1% 82% 1:2.6; TCS Alpha Picks LONG ₹4,112 ₹3,995 ₹4,340 +5.5% 79% 1:2.1; HDFCBANK Momentum Picks LONG ₹1,684 ₹1,628 ₹1,795 +6.6% 88% 1:2.4; INFY Momentum Picks LONG ₹1,542 ₹1,498 ₹1,640 +6.4% 74% 1:2.0. Confidence renders as a 56px accent mini-bar plus a mono percentage. (7) A caption row 'Open signals only · entry, stop and target on every row · tap a row for the full breakdown.' with a right link 'Public track record →', then a centred 10px legal line 'For educational purposes. Not investment advice. Markets carry risk.' Timestamps read like '2h ago · Active' in IST.
```

### 44. `/signals/alpha-picks (also reachable as /signals?horizon=swing; /signals/swing 308-redirects here)` — Alpha Picks book (engine-as-landing)

```text
Design a dark WEB DASHBOARD product page — an 'engine landing page' for one AI signal book on an Indian NSE trading platform. Canvas #0D0D0E, cards #151517, nested panels #1E1E21, hairlines #29292D. Ink #F7F7F8 primary, #D3D3D7 secondary, #96969E muted. One accent: fills #406AE4 with white ink, accent text #8FB0FF. Green #10B981 and pink #F5808C only for gains/losses. Geist Sans prose, Geist Mono tabular numbers. Radii 6/8/12/16/9999px.

Top: a sticky pill tab rail — Overview, Alpha Picks (active), Momentum Picks. Content max 1280px.

Hero, two columns 1fr / 0.78fr. Left: a small outlined pill with a trend glyph reading '3-10 SESSIONS' in 11px mono uppercase; a 56px display heading 'Alpha Picks Signals' where 'Signals' uses a blue gradient (#AFC6FF→#7FA3FF); a 15px grey line 'ML signal stack catches one clean leg of the trend.'; three 40px pill buttons — outlined 'How it works', outlined 'Add to watchlist', and a glossy blue gradient (#3B82F6→#406AE4) 'Ask AI about these →' with a soft white inner bevel and blue drop glow; a 14px grey paragraph explaining a 3-to-10-session swing hold; a blue 'Learn more →' link. Right: a 16px-radius 'MODEL BOOK' panel over a faint blue radial glow, header 'MODEL BOOK' in 10px blue mono and '7 open' on the right, then hairline-separated mono key/value rows: MODEL 'Cross-sectional ranker · walk-forward validated'; HORIZON '10 trading bars'; BACKTEST HIT RATE '57.4%' in green; BACKTEST EXCESS '+1.28% / 10 bars'; PAPER WINDOW 'collecting · 14 signal days'; RISK ENGINE 'ATR-scaled stop & target · R:R 2.0'; LIFECYCLE 'fills → stop/target → expiry, marked daily'.

Below: a 22px heading 'Key reads' with a right link 'Win rate & full track record →', and six 16px-radius tiles (mono uppercase label, 20px value): Setups today 7 · Universe 'NSE main board' · Engines 'Alpha · Mood · Regime' · Backtest hit rate 57.4% · Paper window 'Collecting · 14d' · Horizon '10 trading bars'.

Then a 22px heading "Today's trade" with a two-tab pill (Opening 7 / Closed 23) and a chip row 'Min confidence: All, ≥60%, ≥70%, ≥80%'. Show a three-across grid of 12px-radius signal cards: each with a round logo, ticker (RELIANCE, TCS, HDFCBANK), 'NSE', '2h ago · Active', a green BUY pill, a small 132×40 filled area sparkline, a 56px confidence bar with '82%', and three small tiles Entry ₹2847.50 / Stop ₹2742.00 (−3.7%, pink) / Target ₹3020.00 (+6.1%, green), a thin 'Signal decay · 5d left' progress line, and a footer 'R:R 1:2.60' with a green '+6.10%'.

Finish with 'How our AI finds them' (blue Alpha / Mood / Regime chips over four green-ticked bullets) and a 'Frequently asked questions' accordion with a rotating + glyph, first item open.
```

### 45. `/signals/momentum-picks (also /signals?horizon=momentum; /signals/momentum 308-redirects here)` — Momentum Picks book (ranked, engine-as-landing)

```text
Design a dark WEB DASHBOARD page for one AI-ranked stock 'book' on an Indian NSE platform. Canvas #0D0D0E, cards #151517, nested #1E1E21, hairlines #29292D; ink #F7F7F8 / #D3D3D7 / #96969E; single blue accent — fill #406AE4 with white ink, accent text #8FB0FF; green #10B981 and pink #F5808C reserved for P&L. Geist Sans prose, Geist Mono tabular numerals. Radii 6/8/12/16/9999px. Sticky pill tab rail at top: Overview, Alpha Picks, Momentum Picks (active).

Hero split 1fr / 0.78fr, max width 1280px. Left: a small outlined pill with a flame glyph, 11px mono uppercase 'WEEKLY REBALANCE · LONG-ONLY'; a 56px display heading 'Momentum Picks Signals' with 'Signals' in a blue gradient; a grey 15px line 'The whole NSE board, ML-ranked by forward return.'; three 40px pill buttons — outlined 'How it works', outlined 'Add to watchlist', and a glossy blue-gradient 'Ask AI about these →'; a 14px grey paragraph about ranking the NSE cross-section by expected forward return with a weekly long-only rebalance; a blue 'Learn more →'. Right: a 16px-radius panel headed 'MODEL BOOK' / '9 open' over a faint blue radial glow, with mono hairline rows — MODEL 'Cross-sectional ranker · walk-forward validated', HORIZON '20 trading bars', BACKTEST HIT RATE '54.8%' in green, BACKTEST EXCESS '+2.06% / 20 bars', PAPER WINDOW 'on track · live 53.1%', RISK ENGINE 'ATR-scaled stop & target · R:R 2.0', LIFECYCLE 'fills → stop/target → expiry, marked daily'.

Next, 'Key reads' (22px) with a right link 'Win rate & full track record →' and six 16px-radius tiles: Setups today 9 · Universe 'NSE main board' · Engines 'Alpha · Regime' · Backtest hit rate 54.8% · Paper window 'Collecting · 21d' · Horizon '20 trading bars'.

Then "Today's trade" with Opening 9 / Closed 41 pill tabs and chips 'Min confidence: All, ≥60%, ≥70%, ≥80%'. Show three columns of cards; ABOVE each card place a full-width outlined 9999px meta bar reading 'Rank #1  ·  Pct 99.2%  ·  Exp +4.35%' with the last value in green. Each card (12px radius) shows a round logo, ticker (HDFCBANK, INFY, TATAMOTORS), 'NSE', '4h ago · Active', a green BUY pill, a 132×40 filled sparkline, a 56px confidence bar with '88%', three small tiles Entry ₹1684.20 / Stop ₹1628.00 (−3.3%) / Target ₹1795.00 (+6.6%), and a footer 'R:R 1:2.40' plus a green '+6.60%'.

Close with 'How our AI finds them' — two blue chips 'Alpha' and 'Regime' over four green-ticked bullets — and a 'Frequently asked questions' accordion (first row open, + glyph rotating to ×).
```

### 46. `/signals/index-momentum-30` — Index Momentum 30 book (Nifty-200 cross-sectional)

```text
Design a dark WEB DASHBOARD page describing one systematic index-momentum stock book for an Indian NSE platform, in a state where NO holdings are currently listed. Canvas #0D0D0E, cards #151517, nested wells #1E1E21, hairlines #29292D. Ink #F7F7F8 / #D3D3D7 / #96969E. Single blue accent: fill #406AE4 (white ink), accent text #8FB0FF. Green #10B981 / pink #F5808C only for P&L. Geist Sans + Geist Mono tabular. Radii 6/8/12/16/9999px. Content max 1280px.

Top: a sticky 9999px pill rail with three tabs — Overview, Alpha Picks, Momentum Picks — and DELIBERATELY none highlighted (all in muted grey).

Hero, two columns 1fr / 0.78fr. Left: an outlined pill with a bar-chart glyph, 11px mono uppercase 'MONTHLY REBALANCE · LONG-ONLY'; a 56px display heading 'Index Momentum 30 Signals' with 'Signals' in a blue gradient (#AFC6FF→#7FA3FF); a 15px grey line 'The Nifty-200, ranked against itself. Own the top 30.'; three 40px pills — outlined 'How it works', outlined 'Add to watchlist', glossy blue-gradient 'Ask AI about these →'; a 14px grey paragraph explaining that 6- and 12-month returns are divided by each stock's own volatility and scored against the whole Nifty-200; a blue 'Learn more →'. Right: a 16px-radius panel over a faint blue radial glow, headed 'MODEL BOOK' with '0 open', containing only four hairline mono rows — MODEL 'Cross-sectional ranker · walk-forward validated', HORIZON 'multi-session', RISK ENGINE 'ATR-scaled stop & target · R:R 2.0', LIFECYCLE 'fills → stop/target → expiry, marked daily'.

Below: 'Key reads' (22px) with a right link 'Win rate & full track record →' and exactly THREE 16px-radius tiles — Setups today '0', Universe 'NSE main board', Engines 'Alpha · Regime'.

Then "Today's trade" with Opening / Closed pill tabs (no counts) and a chip row 'Min confidence: All, ≥60%, ≥70%, ≥80%'. Under it, a full-width recessed 16px-radius well in #1E1E21 with 40px vertical padding holding a centred empty state: a circular outlined inbox icon, a 16px semibold heading 'No open index momentum 30 signals', a 14px grey line "Fresh setups publish here as the scans run. Ask Copilot what's likely to fire next.", and three outlined 9999px suggestion chips with tiny blue sparkles — 'What index momentum 30 setups are likely today?', 'Show me names with clean risk-reward', 'How is the Nifty regime leaning right now?'.

Finish with 'How our AI finds them' — two blue chips 'Alpha' and 'Regime' over four green-ticked bullets, one quoting '29.7% CAGR vs 22.0% for an equal-weight benchmark' — and a six-row 'Frequently asked questions' accordion, first row open, with a + glyph rotating 45°.
```

### 47. `/signals/[id]` — Signal detail — thesis, pressure-test and execution

```text
Design a dark WEB DASHBOARD detail page for a single AI trading signal on an Indian NSE platform. Canvas #0D0D0E, cards #151517, nested panels #1E1E21, hairlines #29292D. Ink #F7F7F8 primary, #D3D3D7 secondary, #96969E muted. One blue accent — fills #406AE4 with white ink, accent text #8FB0FF; amber #F0A94F for caution; green #10B981 and pink #F5808C for P&L only. Geist Sans prose, Geist Mono tabular numerals. Radii 6px chips, 8px inputs, 12px cards, 16px hero panels, 9999px pills. 240px left nav, 72px right icon rail, content capped 1440px, 24px padding.

Top: a small grey '← Back to signals' link. Header row: 28px semibold 'RELIANCE', beside it 11px uppercase grey 'NSE · EQ', then a 6px-radius amber-tinted chip 'Active' and a green-tinted chip with an up-right arrow 'LONG'. Far right: 'Confidence' label, a 96×8px rounded bar filled ~82% in blue, and a mono '82'. Under it an amber-tinted 6px-radius banner with an info glyph: 'Bear regime active — AI reduced signal size to 50%.'

Body is a 12-column grid, 20px gutter. LEFT (8 cols), stacked 20px apart: (1) a 520px-tall candlestick chart in an 8px-radius bordered frame, with a mono header 'RELIANCE ₹2,847.50 +34.20 (+1.22%) Daily · EOD' and a wrapping toolbar of small pills — 1W 1M 3M 6M YTD 1Y 2Y 5Y ALL | D W M | Candles Line Area | EMA 21 50 200 | Log. (2) An 11px uppercase grey label 'AI thesis' over a 12px-radius card holding three hairline-separated collapsible rows: 'What AI sees' (open, body text with prices and percentages highlighted in blue mono), 'Why now' (open), 'What invalidates' (collapsed, chevron rotated). (3) 'Pressure-test · Counterpoint · Bull vs Bear' over a card with a 3px green left edge reading 'TRADER VERDICT', a green 'ENTER' pill, 'conf 78', and a two-sentence summary — followed by seven collapsed rows each with a coloured 3px left edge: Fundamentals Analyst, Technical Analyst, Sentiment Analyst, Debate Manager, Bull Researcher (green), Bear Researcher (pink), Risk Manager (amber). (4) A 'News intelligence' card with a green 'Bullish' mood, '+0.42 materiality-weighted', source chips and four headline rows with impact pills.

RIGHT (4 cols), three 12px-radius cards: 'LEVELS' with mono rows Entry ₹2847.50, Stop loss ₹2742.00 (−3.71%) in pink, Target 1 ₹3021.00 (+6.09%) in green, a divider, 'Risk : Reward 1 : 2.40', then a blue-filled pill 'Paper-trade' beside a neutral pill 'Live trade', a full-width neutral pill 'Plan trade · Position size', and a 10px grey caption 'Live trade requires Elite + connected broker. Paper-trade is free.' Next 'SIGNAL META' with rows Generated '2h ago', Strategy, Regime at signal. Then 'PUSH ALERTS' with three 36×20px green switches: When triggered, When target hit, When stop loss hit.
```

### 48. `/signals (segment loading UI, also covers /signals/* children)` — Signals route loading skeleton

```text
Design a dark loading-skeleton state for a web dashboard page on an Indian trading platform. Background is the flat page canvas #0D0D0E with no sidebar, no header and no footer — the frame is deliberately bare. Content sits in a left-aligned column centred horizontally at a maximum width of 1280px, with 24px left/right padding and 32px top/bottom padding.

Stack, top to bottom: a 140×28px rounded rectangle (6px radius) standing in for a page title; 16px below it a 280×14px rounded rectangle (6px radius) standing in for a subtitle; then a 24px gap; then six identical full-width bars, each 96px tall with an 8px corner radius, separated by 12px vertical gaps.

Every placeholder uses the same treatment: a solid fill of #29292D at 80% opacity (the design system's hairline colour), no border, no gradient, no diagonal shimmer sweep. Apply a single soft opacity pulse — roughly 100% → 50% → 100% over two seconds, easing in and out, looping — uniformly across all eight shapes with no stagger. There is no text, no iconography, no spinner and no progress bar anywhere on the screen.

The composition should read as the ghost of a signals list page: one heading line, one caption line, then a stack of six equal-height content rows. Keep it strictly geometric and monochrome — this state must never introduce the blue accent (#406AE4), the profit green (#10B981) or any brand colour, because coloured skeletons imply data that has not arrived. Also produce a reduced-motion variant where the pulse is removed entirely and the shapes sit at a constant, slightly lighter grey.
```

### 49. `/signals (segment error boundary, also covers /signals/* children)` — Signals route error boundary

```text
Design a dark, centred full-page error state for a web dashboard on an Indian trading platform — no navigation, no sidebar, no header, no footer, just the flat page canvas #0D0D0E filling the viewport. Centre a narrow 384px column both vertically and horizontally inside an area at least 60% of the viewport height, with 24px padding, and centre-align all of its text.

At the top of the column, an 80×80px circular mark built from three stacked layers: a thin dashed ring drawn as a circle of radius 36 with a 1.5px stroke in the system's loss pink #F5808C, a dash pattern of roughly 6px dashes and 5px gaps, held at 50% opacity and rotating slowly and continuously — one full turn every eight seconds, perfectly linear, no easing; behind it a soft blurred circular glow of the same pink at about 10% opacity, inset 8px from the ring; and dead centre a bold exclamation mark '!' at 30px in that same pink.

24px below the mark, an 18px bold heading in near-white #F7F7F8 reading 'Something went wrong'. Under it, a 14px line in muted grey #96969E reading 'An unexpected error occurred.' — deliberately generic, with no stack trace, error code or technical detail shown.

24px below that, one and only one action: a fully rounded pill button (9999px radius) with a solid #406AE4 fill, a matching 1px border, white 14px medium label, a soft neutral drop shadow, and a hover fill of #3055C2 plus a subtle 0.98 press-scale. Its label is 'Try again'. Do not add a secondary link, a support email, an illustration, or a card container behind the content — the composition is intentionally sparse.

Also produce a light-theme variant on canvas #EDF1F4 with ink #1D1D1D, muted #5F6B75 and the ring/glyph in the light loss red #B81C22, plus a reduced-motion variant where the dashed ring is static.
```

<a id="scanner-patterns-screener---chart-patterns"></a>

# Screener & chart patterns

### 50. `/scanner` — Screener gallery (screen library)

```text
Design a dark-mode web dashboard screen for an Indian (NSE) AI trading platform — a "screener library" gallery. Page canvas #0D0D0E; all cards #151517 with 1px #29292D hairline borders; text #F7F7F8 primary, #D3D3D7 secondary, #96969E muted. One accent: #406AE4 fill with white ink; accent text is #8FB0FF. Green #10B981 and red #F5808C ONLY for profit/loss numbers. Font: Geist sans, Geist Mono for all numerals with tabular figures.

Layout: 240px fixed left nav, 72px right icon rail, centered content capped at 1440px with 24px gutters. Top page header separated by a hairline: mono 11px uppercase letter-spaced eyebrow "SCREENER"; 40px/44px headline at -0.02em "Find the setup. Skip the noise."; a 14px muted sub-line about screens Indian traders run most. Right of the header: a small pill "EOD research" with clock icon, a blue-tinted pill "PRO", and a solid #406AE4 pill button "Create with AI" with a sparkle icon, radius 9999px, height 36px.

Below: a full-width 12px-radius banner card with a blue 40px tile + plus icon reading "Create a screen with AI". Then sections "My screens", "Intraday", "Swing", "Momentum", "Breakout", "Reversal", "Positional & Smart-money", "Fundamental" — each a 15px semibold heading plus 12.5px muted tagline over a 3-column grid (10px gap) of 8px-radius tiles, 104px tall. Each tile: 13.5px semibold screener name (Volume Surge, Breakout from Consolidation, VCP, 52-Week High, FII + DII Buying), a two-line 11.5px muted blurb, a mono 10.5px stat line "10d hold · +2.4% avg · 143 signals", and on the right a 64px semicircular green gauge reading "64%" over a tiny uppercase caption "WIN RATE". Finish with a centered 10px disclaimer: "For educational purposes. Not investment advice. Markets carry risk."
```

### 51. `/scanner/[screen]` — Prebuilt screen detail (record + live matches)

```text
Design a dark web-dashboard detail page for one stock screener on an Indian NSE trading platform. Canvas #0D0D0E, cards #151517 with 1px #29292D borders and 12px radius, primary text #F7F7F8, secondary #D3D3D7, muted #96969E. Accent #406AE4 (fill, white ink) and #8FB0FF (accent text). Gains #10B981, losses #F5808C — numbers only, never chrome. Geist sans; Geist Mono tabular for every figure.

Top: a small uppercase back link "ALL SCREENERS" with a left arrow. Page header with mono 11px uppercase eyebrow "SCREENER · SWING", a 40px headline "RSI Oversold Bounce", a 14px muted line "Oversold inside an uptrend — bounce candidates.", and two right-aligned 32px-tall 8px-radius buttons: outlined "Save as screen" with a bell, and "Ask Copilot" with a sparkle in #8FB0FF.

First card, one horizontal row with 32px gaps: an 88px green semicircular gauge reading "64%" over caption "WIN RATE · 10D", then five stat blocks — tiny uppercase 9.5px labels over 17px mono values: Avg return +2.41% (green), Median +1.86%, Max drawdown -4.8% (red), Signals 143, Window 90d out-of-sample. Below them a full-width 10.5px muted caveat about out-of-sample results not being a guarantee.

Second card: a header strip "Today's matches" with a blue scan icon and a grey count pill "14". Inside: four 16px-radius stat tiles (Matches 14 · Avg change +1.82% green · Breadth 11▲ 3▼ · Top sector Financials), a horizontal green bar chart titled "MATCHES BY SECTOR" with sector labels on the left and value labels at the bar ends, and a four-column table — Symbol, LTP, Change, RSI — with rows RELIANCE ₹2,946 +1.84% 34, TCS ₹4,182 +0.96% 31, HDFCBANK ₹1,679 -0.42% 29, INFY ₹1,842 +2.31% 36. Footer: centered 10px "For educational purposes. Not investment advice. Markets carry risk."
```

### 52. `/scanner/fundamental/[preset]` — Fundamental screen detail

```text
Design a dark web-dashboard page showing one fundamental stock screen for the Indian NSE market. Canvas #0D0D0E; one card at #151517 with a 1px #29292D border and 12px corner radius. Text #F7F7F8 primary, #D3D3D7 secondary, #96969E muted. Accent #406AE4; accent/AI text #8FB0FF. Green #10B981 and red #F5808C strictly for financial values. Geist sans for prose, Geist Mono tabular for every number and every column header.

Top-left a tiny uppercase back link "ALL SCREENERS". Page header with a mono 11px uppercase eyebrow "SCREENER · FUNDAMENTAL", a 40px headline "High ROCE Quality", and a 14px muted line "Efficient capital allocators — ROCE above 20%." Right side: three 32px-tall 8px-radius buttons — outlined "Excel" with a download icon, outlined "PDF" with a document icon, and "Ask Copilot" with a sparkle in #8FB0FF.

Below, one card whose header strip shows a blue coin icon, the label "Matches", and a grey count pill "32" on the right. Inside, an eight-column dense table at 12.5px with a hairline header row in muted grey: Symbol left-aligned, then right-aligned mono sortable headers PE, ROCE, ROE, Profit Gr, Div Yld, M-cap, Quality — the active one (Quality) shows a small down arrow. Rows separated by faint hairlines, hovering tints the row: TCS 28.4 · 61% · 47% · 12% · 1.4% · ₹15,42,180 Cr · 5/5; RELIANCE 24.1 · 19% · 9% · 8% · 0.5% · ₹19,88,450 Cr · 4/5; HDFCBANK 18.6 · 16% · 17% · 21% · 1.2% · ₹12,74,300 Cr · 4/5; INFY 26.9 · 44% · 32% · -3% · 2.6% · ₹7,63,910 Cr · 4/5. ROCE values above 15 and Quality of 4+ render green; negative growth renders red. Under the card, a mono 10.5px muted note explaining the 0-5 Quality Score is a composite of ROCE, ROE, growth and promoter holding — not a Piotroski F-score. End with a centered 10px disclaimer.
```

### 53. `/scanner/my/[id]` — My saved screen (AI-generated screen detail + management)

```text
Design a dark web-dashboard page for a user's own saved stock screener on an Indian NSE platform. Canvas #0D0D0E; cards #151517, 1px #29292D borders, 12px radius. Text #F7F7F8 / #D3D3D7 / #96969E. Accent #406AE4, AI text #8FB0FF, gains #10B981, losses #F5808C. Geist sans, Geist Mono tabular for numbers and rule chips.

Tiny uppercase back link "ALL SCREENERS" above a page header: mono 11px eyebrow "SCREENER · MY SCREENS", 40px headline "Oversold quality bounce", and a 14px muted status line "Runs hourly · alerts on · last run 03/08/2026, 4:15 pm IST". Right side: an outlined 32px-tall button "Pause alerts" with a bell, an "Ask Copilot" button with a sparkle in #8FB0FF, and a borderless icon button with a red trash glyph.

First card, small padding: a 10px uppercase muted label "THE RULES", then a wrapped row of pill-shaped mono chips at 12px with 1px #29292D borders on a darker #0D0D0E fill — "RSI Oversold", "Above 200 EMA", "Volume Surge" — followed by a small muted fragment "· match ≥2".

Second card: header strip with a blue scan icon, "Today's matches", and a grey pill "9". Inside: four 16px-radius stat tiles (Matches 9 · Avg change +1.24% in green · Breadth 7▲ 2▼ · Top sector Financials), a horizontal green bar chart headed "MATCHES BY SECTOR", and a four-column table Symbol / LTP / Change / RSI listing HDFCBANK ₹1,679 +0.84% 32, SBIN ₹842 +2.10% 29, INFY ₹1,842 -0.36% 35, TATAMOTORS ₹1,104 +1.62% 33.

Also show a centered 8px-radius confirmation modal, max width 448px: "Delete this screen?", a 13px body line about the alert schedule being removed permanently, and two buttons — ghost "Keep it" and a red-tinted "Delete screen".
```

### 54. `/scanner/new` — AI screen generator (3-step builder)

```text
Design a dark web-dashboard "build a screener with AI" wizard for an Indian NSE trading platform — three stacked cards, no stepper bar. Canvas #0D0D0E; cards #151517 with 1px #29292D borders and 12px radius; text #F7F7F8 / #D3D3D7 / #96969E; accent #406AE4 with white ink; gains #10B981, losses #F5808C. Geist sans; Geist Mono for rule chips and all numbers.

Header: uppercase back link "ALL SCREENERS", mono 11px eyebrow "SCREENER · CREATE", 40px headline "Create a screen with AI", 14px muted sub-line about compiling plain English into real scanner blocks.

Card 1 — a 10px uppercase muted label "1 · DESCRIBE IT", a two-row 8px-radius textarea on a darker #0D0D0E fill with placeholder "e.g. Oversold large caps bouncing on above-average volume", and to its right a solid #406AE4 button "Generate" with a sparkle. Beneath, four small pill suggestion chips: "Oversold quality names bouncing in an uptrend", "Breakouts on heavy volume near 52-week highs", "Momentum leaders with fresh MACD crossovers", "Institutional buying with long buildup in F&O".

Card 2 — label "2 · THE RULES — TWEAK FREELY" with a small grey pill "resolved via rules" at the right. A wrapped row of mono pill chips each with a tiny × : "RSI Oversold", "Above 200 EMA", "Volume Surge", "Bull Momentum". Below a hairline: an outlined "+ Add block" button, then "Match ≥" with three 28px circular toggles 1 / 2 / 3 (2 filled blue) and the text "of 4 blocks", and a right-aligned solid "Preview matches" button.

Card 3 — header strip "Preview" with a grey count pill "11", a 224px name input placeholder "Name this screen", and a solid "Save screen" button. Inside: four 16px-radius stat tiles (Matches 11 · Avg change +1.47% green · Breadth 9▲ 2▼ · Top sector Financials) and a table Symbol / LTP / Change / RSI with RELIANCE ₹2,946 +1.84% 34, HDFCBANK ₹1,679 +0.62% 31, SBIN ₹842 -0.28% 36.
```

### 55. `/patterns` — AI chart-pattern scanner

```text
Design a dark web-dashboard screen: an AI chart-pattern scanner for the Indian NSE market, with a right-hand detail drawer. Canvas #0D0D0E; panels #151517 with 1px #29292D borders; text #F7F7F8 / #D3D3D7 / #96969E; accent #406AE4 with white ink; green #10B981 and red #F5808C for financial values only. Geist sans; Geist Mono, tabular, for every number and every table column header.

Header: mono 11px uppercase eyebrow "CHART PATTERNS", 40px headline "AI chart-pattern scanner", 14px muted sub-line about a rule engine plus ML breakout scorer plus regime gate, and a small "EOD research" pill at the right.

Below, a 6px-radius filter strip with three labelled groups of small 11px toggle buttons — UNIVERSE (Nifty 50, Nifty 100, Nifty 500, NSE All (~2,136)), TIMEFRAME (Daily, 1H, 15M), DIRECTION (All, Bullish, Bearish) — active buttons filled #406AE4. At the right: a grey pill "regime · bullish", mono text "12 matches · 148/500 scanned", and a refresh icon. A second strip of round sector chips: "All (412)", "Financials (86)", "IT (54)", "Auto (38)". Under it a 4px progress track at 30% filled blue with "Scanning… · 42s" and "148/500 (30%)".

Main: an 8px-radius bordered table with a sticky mono uppercase header row — Symbol, Pattern, Score, ML, LTP, Entry, Stop, Target, R:R, Vol×, and a trailing brain icon button. Rows: RELIANCE ▲ / double bottom (green pill) / 0.78 / 72% / ₹2,945.60 / ₹2,952.00 / ₹2,868.00 red / ₹3,104.00 green / 2.4:1 / 1.8×; TCS ▲ ascending triangle 0.71 · 65%; HDFCBANK ▼ head and shoulders 0.62 · 48%.

On the right, a 448px full-height drawer over a 60% black scrim: symbol title with a brain icon, three score chips (Composite 78%, Quality 71%, ML 72%), a "SUGGESTED LEVELS" panel with Entry/Stop/Target and "Risk : Reward 2.4:1", a "WHY IT MATCHED" bullet list with green dots and mono values, an "AI THESIS" paragraph, a 2×2 "PATTERN CONTEXT" grid, and a full-width blue "Open chart" button.
```

<a id="strategies-ai-algos--strategies"></a>

# AI Algos (strategies)

### 56. `/strategies` — AI Algos — Library tab (default)

```text
Design a dark-first web dashboard screen for an Indian (NSE) AI trading platform, inside a left 240px sidebar + right 72px icon rail app shell, content capped at 1440px with 24px gutters. Page canvas #0D0D0E, cards #151517, hairline borders #29292D, primary ink #F7F7F8, secondary #D3D3D7, muted #96969E. One accent: fill #406AE4 (white ink), accent text #8FB0FF. Top: a header band with a 1px bottom hairline — mono uppercase 11px eyebrow tracked 0.1em "BUILD · BACKTEST · GATE", then a 40px/600 title "AI Algos", then 14px secondary subtitle "Describe a strategy in plain English. The AI compiles it, walk-forward backtests it, and gates it before it trades live." Right-aligned pill button with a sparkle glyph: "Ask Copilot". Below, a fully-rounded pill tab rail on #0D0D0E with a 1px border, five tabs — Library (active, #151517 pill), My strategies, Deployed, Builder, Discovered. Then three merchandising sections stacked 32px apart: each has a 16px/600 heading, 12px muted tagline, and a right-aligned mono 11px count "6 templates". Under each, a 3-column card grid, 16px gaps, 12px radius cards: card title row with a full-radius tier chip ("free" grey / "pro" amber #F0A94F), a 2-line 12px muted description, then a 3-cell divided footer strip with 10px uppercase labels Win rate / Sharpe / Min capital over mono tabular numbers 62.4% / 1.38 / ₹50k. Sample names: "NIFTY 50 EMA Crossover", "BANKNIFTY Weekly Straddle", "RELIANCE Mean Reversion". Cards lift 1px on hover. Footer: centered 10px muted disclaimer "For educational purposes. Not investment advice. Markets carry risk."
```

### 57. `/strategies` — AI Algos — My strategies tab

```text
Design a dark web dashboard panel listing a trader's own saved algorithmic strategies, inside a 240px-sidebar app shell, content max 1440px. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent fill #406AE4, P&L green #10B981, red #F5808C, amber #F0A94F. Reuse the page header (mono 11px eyebrow "BUILD · BACKTEST · GATE", 40px title "AI Algos") and the fully-rounded 5-tab pill rail with "My strategies" active. First card: "Compare strategies" with a compare glyph, 12px muted line "Pick 2–6 to compare head-to-head on out-of-sample metrics.", a row of selectable name pills (two filled solid #406AE4 with white ink), a small "Compare 2" button, and a 12px comparison table with rows OOS Sharpe / Consistency / Holdout return / Worst drawdown / OOS trades / Live-gate, winning cells in green, a small trophy beside the winning column head. Below, a vertical stack of 12px-radius elevated row cards, each 16px apart: strategy name in medium weight followed by three small full-radius chips — status ("live" green tint, "paper" blue tint, "paused" amber tint), timeframe "1d", universe "NIFTY50" — then a mono 12px muted line "Last backtest · Sharpe 1.42 · Win 58% · Return +12.30%". Right side of each row: small buttons "Pause" and ghost "Archive". Sample names: "NIFTY 50 EMA Pullback", "HDFCBANK RSI Reversion", "TCS Trend Rider". Centered 10px muted disclaimer at the bottom.
```

### 58. `/strategies` — AI Algos — Builder tab, compose state (NL → DSL)

```text
Design a dark AI composer panel for an Indian stock-trading web app, inside a 240px-sidebar shell, content max 1440px. Canvas #0D0D0E, panels #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent fill #406AE4 with white ink, AI accent text #8FB0FF. Keep the page header (mono 11px eyebrow "BUILD · BACKTEST · GATE", 40px title "AI Algos") and the rounded 5-tab pill rail with "Builder" active. Hero: a 16px-radius panel with a 1px translucent blue-violet border and a wand glyph label above it in 12px semibold uppercase tracked caps: "DESCRIBE IT · AI COMPILES YOUR ENTRY AND EXIT LOGIC". Inside, a borderless 5-row textarea with muted placeholder "e.g. Buy Nifty 50 stocks when 20EMA crosses above 50EMA and RSI is between 50 and 70…", and a footer row: left 11px muted helper "The Studio agent turns your words into a DSL. Walk-forward backtest it, clear the gate, then deploy.", right a 36px-tall fully-rounded solid #406AE4 button "Compile to DSL →". Below: tracked-caps label "HAND THE AI A STARTING POINT" and three stacked full-width 8px-radius neutral chips containing example sentences about EMA crossovers, RSI mean-reversion on RELIANCE, and trend pullbacks. Below that: "OR READ A CHART SCREENSHOT" and a 16px-radius card with a "Symbol" text field prefilled RELIANCE, a 144px "Timeframe" dropdown set to Daily, a neutral pill "Choose chart image" with a scan glyph, and a right-aligned solid blue pill "Read chart →". Centered 10px muted compliance line at the bottom.
```

### 59. `/strategies` — AI Algos — Builder tab, compiled state (DSL preview → backtest → results)

```text
Design a dark strategy-validation screen for an Indian trading web app, 1440px content width inside a 240px-sidebar shell. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent #406AE4 (white ink), green #10B981, red #F5808C, amber #F0A94F. Card radius 12px, buttons/inputs 8px, chips fully rounded. First card: strategy title "NIFTY 50 EMA Pullback" at 17px/600 with small grey chips "Equity", "1d", "NIFTY50" and an amber chip "Bull only"; below, two rule lines — a green fully-rounded "→ Buy" pill beside 15px text "when the 20-day EMA crosses above the 50-day EMA and RSI (14) is between 50 and 70 · RELIANCE." and a red "→ Sell" pill beside "when the 20-day EMA crosses below the 50-day EMA."; then a hairline-topped stat strip with 10px uppercase labels Stop loss 3% (red), Target 6% (green), Position 5% of capital, History 180 days; then a muted 11px disclosure link "Advanced — view the raw rule definition". Second card headed "Set up the walk-forward backtest": three fields in a row — Symbol RELIANCE, Lookback (days) 180, Initial capital (₹) 5,00,000. Beneath a hairline: a small fully-rounded two-segment toggle Paper|Live with Paper filled solid blue, and on the right a green "Gate pass" chip with a shield glyph. Then a wrapping button row: "Run backtest", "Equity — no option payoff" (disabled outline), "Margin est.", solid blue "Deploy to paper", and a far-right ghost "Start over".
```

### 60. `/strategies` — AI Algos — Discovered tab, run list + new-run modal

```text
Design a dark ML-experiment console panel for an Indian stock-trading web app, inside a 240px-sidebar shell, content max 1440px. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent #406AE4, green #10B981, amber #F0A94F, red #F5808C. Keep the page header ("AI Algos", 40px) and the rounded 5-tab pill rail with "Discovered" active. Section header: a brain glyph plus 16px/600 "Strategy Discovery" over a 12px muted paragraph about sampling and ranking strategies; right side a ghost refresh icon and a solid blue "+ New discovery run" button. Below, a stack of 12px-radius run rows, 8px apart. Each row: a small fully-rounded status chip — amber "running" with a spinner, green "completed", grey "pending" — then the run type in medium weight ("Equity · Swing (5–20 day hold)", "F&O · Weekly contracts"), then a mono 12px muted line "12/20 viable · best score 1.34 · 42.7s"; far right a ghost link "View candidates →". Overlay a centred 448px-wide modal on a 70% black scrim: 8px radius, page-dark fill, hairline border. Header "New discovery run" with a sparkle glyph and an X. Body: tracked-caps label "STRATEGY TYPE" over six stacked 6px-radius option rows (first one filled solid blue with a check); "UNIVERSE TIER" chips nifty50 / nifty100 / nifty500; "SEARCH MODE" as two option cards Random and Genetic (GA) with 10px descriptions; two numeric fields Sample size 20 and Seed 42; a "WALK-FORWARD FOLDS" four-button segment Off / 2-fold / 3-fold / 5-fold; and a muted 11px estimate box "Random sample: 20 candidates × 6 symbols. Typical wall time: 18–48s." Footer: ghost Cancel, solid blue "Start run".
```

### 61. `/strategies` — AI Algos — Discovered tab, run detail (ranked candidates)

```text
Design a dark ranked-results list for an AI strategy-discovery engine in an Indian stock-trading web app. 240px sidebar shell, content max 1440px. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent #406AE4, green #10B981, red #F5808C, amber #F0A94F. Header block: a 12px muted back link "← Back to runs", a 16px/600 heading "Equity · Swing (5–20 day hold)", and a mono 11px muted line "run 3f9ac2b1 · status completed"; a ghost refresh icon on the right. Below, a vertical stack of 12px-radius candidate cards 8px apart. Each card: a top row of fully-rounded chips — a green "score 0.78" chip, optionally a blue "promoted" chip with a check and an amber "regime-concentrated" chip with a warning triangle — followed by a truncated mono 12px grey rule signature like "ema20>ema50 AND rsi14 in [50,70] | sl 3% | tp 6% | 1d". Right side of the top row: a solid blue small button "Promote · Paper", a neutral outlined "Promote · Live", and a ghost trash icon. Under a hairline, a six-column centred metric strip with 9px uppercase labels over mono numbers: Sharpe 1.42, Calmar 2.10, Max DD 8.4%, Win % 58%, PF 1.86, Trades 46. Under a second hairline, an 11px row reading "Regime scores:" followed by tinted chips "bull 0.42 · 18t" (green, up arrow), "sideways 0.11 · 9t" (grey dot), "bear -0.20 · 4t" (red, down arrow). Show three cards with varying score colours.
```

### 62. `/strategies/[slug]` — Strategy template detail

```text
Design a dark spec-sheet detail page for a pre-built trading strategy template in an Indian (NSE) web app. Place a centred 1024px reading column inside a 240px-sidebar shell. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent #406AE4, green #10B981, red #F5808C, amber #F0A94F. Card radius 12px, small tiles 6px, chips fully rounded, buttons 8px. Header band with a 1px bottom hairline: a 40px/600 title "BANKNIFTY Weekly Straddle" followed inline by a small amber "Pro" chip and a blue "Featured" chip; beneath it a 14px grey subtitle "Sells the weekly ATM straddle on expiry-minus-two and manages it with a 30% stop." Right-aligned solid blue button with a copy glyph: "Clone to my strategies →". Body: a 12px muted breadcrumb "‹ All strategies"; then a 4-across strip of 6px-radius bordered tiles with 10px uppercase labels over mono values — Win rate 62.4%, CAGR 24.8%, Sharpe 1.38, Max DD -11.2% (in red) — and a 10px muted caption "Indicative figures from the template author — not Quant X gate-verified." Then a 12px-radius card with four borderless label/value pairs: Segment OPTIONS, Category Volatility, Min capital ₹2,00,000, Engines used Regime · Mood. Finally a 12px-radius rule card: 17px/600 name, grey chips "Options", "1d", "BANKNIFTY", an amber "Sideways only" chip; a green fully-rounded "→ Buy" pill beside 15px text "when the market regime is sideways and India VIX drops below 14."; a red "→ Sell" pill beside "when profit reaches 30% of premium collected."; a hairline stat strip Stop loss 30%, Position 5% of capital, History 365 days; and a muted 11px "Advanced — view the raw rule definition" link.
```

### 63. `/strategies/mine/[id]` — My strategy detail — DSL, backtest runner, results, AI read

```text
Design a dark strategy-detail and backtest-results page for an Indian (NSE) trading web app. Centre a 1024px column inside a 240px-sidebar shell. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent #406AE4, green #10B981, red #F5808C, amber #F0A94F. Cards 12px radius, metric tiles 6px, chips fully rounded. Header band: 40px/600 title "NIFTY 50 EMA Pullback" with a blue "paper" chip beside it, 14px grey subtitle, and right-aligned buttons — a red-filled "Promote to live" with a broadcast glyph, a neutral "Pause", a ghost "Archive". Below: a rule card (17px name, grey chips Equity / 1d / NIFTY50, green "→ Buy when the 20-day EMA crosses above the 50-day EMA" and red "→ Sell when RSI (14) rises above 70", a hairline strip Stop loss 3% / Target 6% / Position 5% of capital / History 180 days). Then a card "Run a backtest" whose header carries a two-button 6px segment "Single symbol | Universe", and three fields: Symbol RELIANCE, Lookback (days) 180, Initial capital (₹) 5,00,000, with a right-aligned solid blue "Run backtest" button. Then a raised results card: left "OUT-OF-SAMPLE · RELIANCE" over a mono 34px "3/4" and 13px "windows profitable on data the rules never saw"; right "IN-SAMPLE RETURN" over green mono 20px "+18.42%" and 11px "after costs · not a forecast"; beneath, a row of four equal tinted fold tiles (three green with ✓, one red with ✕) each showing "+6.2%" and "14 trades", the last ringed and labelled Holdout; then four tiles OOS Sharpe 1.12 / Consistency 75% / Worst OOS DD -9.4% / Holdout +4.1%. Then a six-tile KPI strip and a 260px-tall green area chart labelled "Equity curve" with ₹500k Y-axis ticks. Finally a dense "Trade log" table with mono columns Entry, Exit, Hold, Net P&L (green/red), and small TP/SL badges.
```

### 64. `/strategies/mine/[id]` — Promote-to-live confirmation modal

```text
Design a dark, high-friction confirmation modal for switching an algorithmic trading strategy from paper to real money in an Indian (NSE) app. Centre a 512px-wide panel on a 60% black scrim: 8px radius, #151517 fill, 1px #29292D border, 20px padding, soft shadow. Ink #F7F7F8 / #D3D3D7 / #96969E; danger red #F5808C, green #10B981, accent blue #406AE4. Title at 16px: "Promote to live — real money will move". Below, a 6px-radius red-tinted warning block (red border at 30% and a 5% red fill) with a 20px warning triangle and two lines: bold "This is not paper trading." then 12px grey body explaining real broker orders fire on every entry match and that stop-loss and target go in as GTT orders at Zerodha or are monitored every 5 minutes elsewhere. Then a 2-column grid of six small 6px-radius bordered tiles, each with a mono 9px uppercase label over a mono 12px value: Strategy "BANKNIFTY Weekly Straddle", Underlying BANKNIFTY, Total legs 4, Max risk "Bounded (debit/credit spread)", Day-loss breaker "3% (platform default)", Position size "5% of capital". Under it a compact mono leg table with a tinted header row — Side, Type, Strike anchor, Expiry (right), Lots (right) — and four rows: green bold SELL / CE / ATM / weekly / 1; red bold BUY / CE / OTM+2 / weekly / 1; and two matching PE rows. Then a labelled text field "Type the strategy name to confirm" in monospace, and a checkbox row in 12px grey acknowledging that real orders will fire and losses up to the circuit breaker are the user's. Footer above a hairline: ghost "Cancel" and a red-filled "Go live" button with a broadcast glyph, shown disabled.
```

### 65. `/strategies/deployed` — Deployed strategies — live P&L dashboard

```text
Design a dark live-operations dashboard for deployed algorithmic trading strategies in an Indian (NSE) web app. Full-bleed inside a 240px-sidebar shell, content capped at 1440px with 24px gutters. Canvas #0D0D0E, cards #151517, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E, accent #406AE4, P&L green #10B981, red #F5808C. Cards 12px radius, stat tiles 8px, inner tables 6px, chips fully rounded. Header: mono 11px uppercase eyebrow "STRATEGIES", 40px/600 title "Deployed strategies", 14px grey subtitle "Live P&L on every paper/live strategy. Updates every 30s.", right-aligned ghost refresh icon and a neutral "+ Browse catalog" button. Below, five equal stat tiles with mono 11px uppercase labels over mono 24px numbers: Total P&L +₹1,24,560 (green), Realized +₹96,140 (green), Unrealized +₹28,420 (green), Open positions 7, Active strategies 3. Then a two-column grid of strategy cards. Each card header: an uppercase red "LIVE" chip (or blue "PAPER") beside a bold name like "NIFTY 50 EMA Pullback", with a ghost "Pause" button and a chevron on the right. Body: a three-cell hairline-divided P&L strip with mono 9px uppercase labels and mono values — Total P&L +₹62,340 / "+62.3% of ₹1L", Realized +₹48,900 / "14 exits", Unrealized +₹13,440 / "3 open". Then a four-up meta row — Universe NIFTY 50, Win rate 58.3% with a green sub "+4.1pp vs backtest", Stop loss 3%, Target 6%. Then a compact 6px-radius table with a tinted mono header Symbol / Qty / Entry / LTP / P&L and rows RELIANCE 40 ₹2,845.3 ₹2,912.0 +₹2,668 (+2.3%), TCS 18 ₹3,910 ₹3,864 −₹828 (−1.2%), HDFCBANK 55 ₹1,642 ₹1,701 +₹3,245 (+3.6%). Finally a "RECENT ACTIVITY" list of five 12px rows with small glyphs: "Target hit RELIANCE @ ₹2,912" with a right-aligned muted timestamp "03 Aug, 02:45 pm". Centered 10px muted disclaimer at the bottom.
```

<a id="portfolio-trades-portfolio--trades---paper-trading"></a>

# Portfolio, trades & paper trading

### 66. `/portfolio` — Portfolio (book + live broker)

```text
Design a dark-mode web dashboard screen called "Portfolio" for an Indian (NSE) AI trading platform. Page canvas #0D0D0E; cards #151517 with 1px #29292D hairlines; hovered/nested surfaces #1E1E21. Text: primary #F7F7F8, secondary #D3D3D7, muted #96969E. One accent: solid fill #406AE4 with white label text; accent as TEXT is #8FB0FF. Profit green #10B981, loss red #F5808C — used only on money, never on chrome. Radii: 6px chips, 8px inputs/buttons, 12px default cards, 16px hero cards, 9999px pills. Geist sans for prose, Geist Mono tabular for every number.

Layout: 240px dark left nav rail, 72px right icon rail, content column max 1440px with 24px gutters and 20px vertical rhythm. Top row: eyebrow 'AI ON YOUR BOOK' (11px, 600, letterspaced), H1 'Portfolio' 22px bold with a small briefcase glyph in accent ink, sub-line '6 open positions · ₹18,42,310' 12px muted; right side two buttons — filled 'New order' and a quiet outlined 'Ask AI' with a sparkle in #8FB0FF.

Below, one paragraph of plain-language AI commentary (15/24, secondary, max 68 characters wide) followed by a single compact result card and a row of small pill-shaped follow-up questions.

Then a 16px-radius 'Performance' card: header with a rounded pill tab rail 1W / 1M / 3M / 1Y (1M active), and a 256px area chart in green with a fading gradient fill and dashed grid; y-axis ticks read ₹8k, ₹12k, ₹16k.

Then a 'Positions' card with a dense table: sticky Symbol column with round company logos (RELIANCE, TCS, HDFCBANK, INFY), then Qty, Avg, LTP, Value, P&L. Headers are 11px mono uppercase letterspaced muted with sort arrows. Sample rows: RELIANCE 25 · ₹2,845.60 · ₹2,912.40 · ₹72,810 · +₹1,670 (+2.35%); TCS 12 · ₹4,120.00 · ₹4,051.85 · ₹48,622 · −₹818 (−1.65%).

Finish with a letterspaced label 'BROKER · LIVE POSITIONS & ORDERS' and a locked card: circular lock glyph, heading 'Live positions needs a connected broker', one muted sentence, and a small filled 'Connect your broker' button. Bottom: a tiny centred grey compliance line.
```

### 67. `/trades` — Trade History (journal + closed trades)

```text
Design a dark-mode web dashboard screen titled "Trade History" for an Indian (NSE) AI trading platform. Canvas #0D0D0E, panels #151517 with 1px #29292D borders, nested/hover fills #1E1E21. Text #F7F7F8 / #D3D3D7 / #96969E. Accent-as-text #8FB0FF, filled accent #406AE4. Profit #10B981, loss #F5808C, caution #F0A94F. Radii: 8px panels and buttons, 6px chips, 9999px pills. Numbers in a mono tabular face; prose in a geometric sans.

Top bar: small letterspaced uppercase 'HISTORY', H1 'Trade History' at 22px with a receipt glyph, muted 12px sub-line 'Complete record of your executed trades'; right side three compact 28px buttons — 'Export CSV', 'Ask AI' (sparkle, #8FB0FF), 'Dashboard' (ghost, back arrow).

Row of two journal panels: left 'Weekly Review' with 'week of 27 Jul 2026', a metrics strip reading 'You +2.31% · NIFTY +0.84%' and right-aligned '+1.47% vs NIFTY', then short bolded markdown notes. Right 'Your Trading Patterns' with a 'Discover' link and a 2×2 hairline-gutter stat grid: Trades 46 · Win rate 58% · Avg win +8,420 (green) · Avg loss −3,910 (red), then 'Best session: Morning (68% win, 22 trades)' and an amber coach-flag line.

Below, four KPI tiles (2-up mobile, 4-up desktop): 'TOTAL TRADES 46', 'TOTAL P&L +₹1,42,860' green, 'WIN RATE 58.3%' in #8FB0FF, 'WINS / LOSSES 27 / 19'. Labels are 11px mono uppercase letterspaced; values 24px mono.

Then three rounded-full filter pills — All (active, #1E1E21 fill), Wins, Losses.

Then a 12-column trade table with 11px uppercase headers Symbol · Direction · Entry · Exit · P&L · Date. Rows carry a circular ticker avatar plus a company logo. Sample: RELIANCE, LONG badge (green tint), ₹2,845.60 → ₹2,912.40, +₹4,120 with +2.35% and a short green proportional bar, '12 Jan 26 → 19 Jan 26'. Second row TCS, SHORT badge (red tint), ₹4,120.00 → ₹4,188.50, −₹822 / −1.65% with a right-anchored red bar. Include one expanded row showing a small 'Trade Review' sub-card with three bulleted AI observations. End with a tiny centred grey disclaimer line.
```

### 68. `/trades/[id]` — Trade Review (single-trade journal entry)

```text
Design a dark-mode detail page for a single closed stock trade on an Indian (NSE) AI trading platform. Page background #0D0D0E; content is a single centred reading column max 1024px wide with 24px side padding and 32px top padding — no sidebars inside the column, generous 24px vertical gaps. Panels #151517 with 1px #29292D hairlines. Text #F7F7F8 primary, #D3D3D7 secondary, #96969E muted. Accent ink #8FB0FF used only for small links, bullets and icon glyphs. Radii 8px for the review panel, 12px for the standard card.

Top of column: a tiny 12px muted back-link with a left chevron reading 'Trades'. Beneath it a compact header stack — a 12px uppercase letterspaced label 'TRADE #4821', a 20px regular display-face heading 'Trade review', and a 12px muted line 'Entry, exit, risk and the AI read on this trade.'

Next, an 8px-radius panel titled 'Trade Review' in a 40px header bar: a small clipboard-check glyph in #8FB0FF beside the 12px semibold title, and on the right a 10px accent text-button with a sparkle reading 'Get AI review'. Below the header bar, a short greyed narrative paragraph, then a bulleted list at 11.5px in secondary grey, each bullet dot in #8FB0FF. Use realistic Indian-market content: 'HDFCBANK long, 40 shares · entry ₹1,684.20 on 14 Jan 26, exit ₹1,742.90 on 22 Jan 26', 'Held 6 sessions — 2 longer than the signal's stated horizon', 'Realised +2.1R against a planned 2.0R', 'Entered 0.8% above the signal level, costing roughly ₹270'.

Below that, a 12px-radius card with a bordered header row reading 'Lessons' at 16px semibold, and a 14px muted body paragraph explaining that per-trade notes are coming and pointing to the 'Trades page' as an accent-coloured inline link.

Close the page with a tiny centred 10px grey compliance sentence. Keep the whole page calm, text-forward and free of charts.
```

### 69. `/paper-trading` — Paper Trading (virtual ₹10,00,000 book)

```text
Design a dark-mode web dashboard screen titled "Paper trading" for an Indian (NSE) AI trading platform, where the user trades a virtual ₹10,00,000 book. Canvas #0D0D0E; cards #151517 with 1px #29292D hairlines; nested wells #1E1E21. Text #F7F7F8 / #D3D3D7 / #96969E. Accent fill #406AE4, accent ink and chart line #8FB0FF. Gain #10B981, loss #F5808C, caution amber #F0A94F. Radii: 8px small panels and chips, 16px hero cards, 9999px pills. Mono tabular figures for all numbers.

Header block closed by a hairline: uppercase letterspaced label 'F11 · AI SIGNALS, VIRTUAL CAPITAL', 26px regular display heading 'Paper trading', 12px grey line 'Trade the AI signal stack on a virtual ₹10,00,000 book. Every fill recorded. No capital at risk.' Right side: four 11px chip buttons — 'Position size', 'Trade planner', 'Refresh', and a red-tinted 'Reset account'.

Next a 16px-radius strip: a flame + 'Streak 12d' in amber, a trophy + 'Trades 34', an award + 'Total +6.42%' in green, separated by short vertical hairlines, then three small tier-coloured badge pills (bronze #C68642, silver grey, gold amber).

Then a 16px-radius 'MODEL VALIDATION WINDOW' card with the sub-line 'Live signals vs. backtest expectations — the real-money gate.' and 'as of 01 Aug 2026'; inside, two columns 'Momentum' and 'Swing', each with a tiny pill ('On track' green / 'Collecting' grey), 'Day 34 · 21 matured', a 4px progress bar in #8FB0FF, and two grey metric lines 'Hit rate 59% vs 61% expected' and 'Excess +0.7% vs +0.9%/5d expected'.

Main row (8/12 + 4/12): left card headed 'EQUITY CURVE · LAST 90 DAYS' with '₹10,64,820' at 26px mono and '+6.48%' green, above a 280px area chart — a #8FB0FF line with a fading fill, plus a thin dashed grey 'Nifty 50' benchmark and a legend. Right column: four small tiles — 'VS NIFTY 50 +3.12%' green with 'You 6.5% · Nifty 3.4%', 'CLOSED TRADES 34', 'DAYS TRADING 41', 'DRAWDOWN -4.21%' amber with 'vs 90-day peak'.

Then an amber-left-edged callout 'You've paper-traded for 30+ days' with a filled 'Connect broker' pill and a quiet 'Upgrade to Elite' pill. Finish with a 'Paper League — weekly · anonymized / Top 20' table (columns #, Handle, Return, Equity; medal icons for the top three; rows like 'Swing7f3a91 · +8.41% · ₹10,84,120'), and a tiny grey slippage disclaimer.
```

<a id="autopilot-risk-fno-autopilot--track-record---risk"></a>

# AutoPilot, track record & risk

### 70. `/autopilot` — AutoPilot Cockpit

```text
Design a dark-first web dashboard screen called “AutoPilot” for an Indian NSE algo-trading product. Page canvas #0D0D0E, cards #151517 with 1px #29292D hairlines, recessed tiles #1E1E21, ink #F7F7F8 primary / #D3D3D7 secondary / #96969E muted. One accent: solid #406AE4 pill buttons with white text (hover #3055C2); accent text is #8FB0FF. P&L only: green #10B981, red #F5808C, amber #F0A94F. Radii: 6px chips, 8px inputs, 12px cards, 16px hero blocks, full pills. Type: Geist — 24/32 semibold page title, 17/24 semibold section headings, 15/24 body, 13/18 labels, 11/14 +0.06em uppercase eyebrows; all numbers in Geist Mono tabular. Top: a bordered header with a robot icon, title “AutoPilot”, a green “Free · Practice” badge, a two-line description, a ghost “Track record” pill, and a green “Active” status pill. Below, in a 24px stack: a blue-tinted practice-mode banner with a 72px illustration and a “Start the bot (practice)” pill; a five-cell KPI strip (Broker Zerodha/Live, Open positions 6, Today trades 3, Today P&L +0.84%, Last rebalance 02 Aug 15:45); two panels — “Market Regime” bull with probabilities, and “VIX Risk Overlay” Elevated · VIX 18-22 with a 65%-filled 96×8 bar; a “Safety Rails” card with three segmented risk pills and three labelled range sliders plus an on/off switch; a “Rebalance log · last 10 ticks” list; a trade list showing RELIANCE LONG +2.14% ₹1,140 and TCS closed −0.62%; and a red-tinted “Emergency controls” card with “Pause AutoPilot” and “Kill switch: close ALL positions”. On mobile, add a red circular STOP button floating bottom-right.
```

### 71. `/autopilot/track-record` — AutoPilot Track Record

```text
Design a dark analytics web page titled “AutoPilot Track Record” for an Indian stock-trading product. Canvas #0D0D0E; cards #151517 with 1px #29292D borders and 12px radius; muted labels #96969E, primary ink #F7F7F8. One accent #406AE4 (solid pills, white ink); gains #10B981, losses #F5808C, caution #F0A94F. Type: Geist 24/32 semibold title, 13/18 labels, 11/14 uppercase +0.06em micro labels; every number in Geist Mono tabular. Header: bordered strip with the title, subtitle “Realised P&L · win-rate · drawdown · Sharpe — read from live trades, never from backtest.”, and a blue outline badge “Brand-safe outcomes only”. Under it a 6px-radius filter bar: micro label “Window” with three small pills 30d / 60d / 90d (30d active, solid blue), micro label “Source” with pills paper / live, then right-aligned a green badge “Daily snapshot” and a circular refresh icon button. Main content: a 4-column grid (2 columns on mobile) of eight metric cards, each a 12px-radius card with an uppercase micro label, a 22–24px mono value, and a small grey caption. Use: Win Rate 62% “31 wins / 19 losses” (green), Avg Return / Trade +1.24% “Median 0.86%” (green), Total P&L +₹1,84,320 “50 trades” (green), Realised Sharpe 1.42 “Annualised”, Max Drawdown -8.4% “Peak-to-trough” (amber-neutral), Best Trade +9.80%, Worst Trade -4.10% (red), Profit Factor 1.86. Below, a wide card with four mono stats: First trade 2026-05-24, Last trade 2026-08-01, Trades 50, Source PAPER. Finish with a small grey methodology paragraph and an amber-tinted SEBI registration disclaimer box.
```

### 72. `/risk` — Risk & Analytics Centre

```text
Design a calm dark web page titled “Risk & Analytics” for an Indian trading platform, laid out as a centred 1024px column with 24px side gutters on a #0D0D0E canvas. Cards are #151517 with 1px #29292D hairlines and 12px radius; text #F7F7F8 primary, #D3D3D7 secondary, #96969E muted. Single accent #406AE4; green #10B981 for safe, amber #F0A94F for caution, red #F5808C for breach. Type: Geist — a mono uppercase 11px eyebrow “RISK ENGINE”, a 24px display-weight heading “Risk & Analytics”, 12px muted intro copy, 13px labels, and Geist Mono tabular for every rupee figure. Row one: two equal cards. Left, “Risk gates today” — a green shield icon with “All gates clear”, then a divider, then a row “Today’s P&L” against a mono “−₹4,820 / limit 3%”, a 6px full-width progress meter filled about 40% in green, and a small grey line “Checks: day loss vs your moderate profile limit · single name >20% · sector >40% · exposure >100% of capital.” Right, “Concentration watch” — a list of up to eight holdings, each with the symbol on the left and a mono “18.4% · ₹1,84,500” on the right above a 4px progress bar; RELIANCE 22.6% and its bar are amber (over the 20% line), TCS 14.2%, HDFCBANK 11.8%, INFY 8.3% stay blue. Below, a pill-shaped “Performance” banner and a four-up stat row: Win rate 62%, Trades 148, Total P&L +₹2,41,600 in green, Unrealized −₹18,240 in red. End with two small blue text links carrying arrows.
```

### 73. `/fno` — F&O Desk (unified derivatives hub)

```text
Design a dense dark web dashboard called “F&O Desk” for an Indian derivatives (futures & options) platform. Canvas #0D0D0E; cards #151517 with 1px #29292D hairlines; recessed tiles #1E1E21; ink #F7F7F8 / #D3D3D7 / #96969E. One accent #406AE4 for pills and selected states (white ink), accent text #8FB0FF; green #10B981 = put OI / support / gains, red #F5808C = call OI / resistance / losses, amber #F0A94F for the Elite badge and OI spikes. Radii: 6px chips, 12px cards, 16px hero, full pills. Geist type: mono 11px uppercase eyebrow “AI DERIVATIVES DESK · F&O”, 24px semibold title “F&O Desk” with an amber “Elite” badge, 15px description, 11px uppercase micro column headers; all numbers Geist Mono tabular. Header right: a blue “Ask AI” button with a sparkle. Below, one card containing a pill tab rail: Overview · Analysis · Stock Scanners · OI Tracker · Payoff Calc · Strategy Lab, Overview selected. Overview content: an index pill row NIFTY / BANKNIFTY / FINNIFTY / MIDCPNIFTY with a “VIX · 12.84” chip and a “normal” regime chip; then four snapshot cards — NIFTY ₹24,180.55, 3 DTE, PCR 0.92 “normal”, Max Pain 24,000 ▼0.7%, IV ATM 11.4%, IV Rank 38, Top strikes S: 24000, 23900 / R: 24300, 24500; BANKNIFTY ₹51,420.10; FINNIFTY; MIDCPNIFTY. Then an “Options Flow” card with a green “bullish lean” banner and four mini stats (Put writing 12.4L, Call writing 8.1L, Net PCR 1.18, Max pain 24,000). Finish with a strike-wise OI heatmap: mirrored horizontal bars, green put OI growing left, red call OI growing right, the mono strike centred, the ATM row tinted blue.
```

### 74. `/fno?tab=lab` — Strategy Lab (F&O workspace)

```text
Design a dark, information-dense options-trading workspace called “Options strategies” for an Indian NSE platform. Canvas #0D0D0E, cards #151517 with 1px #29292D hairlines and 12px radius, nested tiles #1E1E21, ink #F7F7F8 / #D3D3D7 / #96969E. Accent #406AE4 for primary pills and the selected tab (white ink); green #10B981 for BUY, credit and profit; red #F5808C for SELL, debit and loss; amber #F0A94F for caution. Type: Geist — mono 11px uppercase eyebrow “AI OPTIONS DESK”, 24px semibold title, 13px labels, 9–11px mono uppercase table headers; all figures Geist Mono tabular. Header actions: a blue “Ask the AI” button and a ghost refresh. Under it a four-up KPI row: Open positions 3, Unrealized P&L +₹18,420 (green), Realized P&L (last 10 closed) −₹4,180 (red), Max risk exposed ₹1,20,000. Then a thin context strip “Regime bull · VIX 12.84 (rising) · VIX 5d mean 12.10 · as of 02 Aug, 15:45”. Then a pill tab rail: Recommendations 6 · Open 3 · Closed 10 · Chain. Show the Recommendations tab: a two-column grid of cards, each with a blue NIFTY badge, “Iron Condor”, a green “CREDIT” badge, a one-line view, three centred mini-KPIs (Max profit +₹4,875 / Max loss −₹8,125 / P(profit) 68%), a mono leg list “SELL CE 24300 @ ₹42.50”, “BUY CE 24500 @ ₹18.20”, and a footer with “Expiry 2026-08-06 · Net premium +₹4,875” beside ghost “Backtest” and blue “Deploy” buttons. Bottom: a floating sticky builder card titled “Builder · Iron Condor” with selected legs and a blue “Deploy 4-leg to paper” button.
```

<a id="inbox-alerts-settings-inbox--alerts---referrals"></a>

# Inbox, alerts & referrals

### 75. `/inbox` — Inbox (notifications feed)

```text
Design a dark-first web dashboard screen: the notifications inbox of an Indian NSE AI trading platform. Page canvas #0D0D0E, cards #151517, hairline borders #29292D. Left fixed 240px nav sidebar and right fixed 72px icon rail already exist — design only the centre pane, one 896px column centred. Fonts: Geist for prose, Geist Mono tabular for numbers. Top: a header band with a bottom hairline, 24px padding, H1 'Inbox' 40px/44 weight 400 in #F7F7F8, sub-line 15px #D3D3D7 'Signals, alerts, and AI summaries — all in one place.', and on the right a 32px-tall secondary button 'Mark all read' plus a ghost circular refresh icon button. Below, a pill tab rail: fully rounded 9999px, 1px #29292D border, inner background #0D0D0E, 4px padding, four tabs 'All' (with a 10px count chip '7' on a #406AE4 15% tint, text #8FB0FF), 'Signals', 'Positions', 'AI insights'; the active tab is a #151517 pill with soft shadow. Then a 12px-gapped stack of notification cards: 12px radius, 1px #29292D border, #151517 fill; unread cards use a #406AE4 30% border and an 8px blue dot. Each card has a header row (44px min height, bottom hairline) with a small bell glyph, a 17px semibold title, and a right pill badge showing relative time. Sample rows: 'RELIANCE swing signal published' / '4 targets, entry ₹2,948.60 · 12m ago' blue badge; 'TCS target 1 hit — booked ₹18,420' green badge '1h ago'; 'HDFCBANK stop-loss hit' red badge '3h ago'; 'BANKNIFTY max-pain shifted 1.4%' amber badge; 'NIFTY 50 regime flipped to sideways at 09:20 IST' grey badge. Card body text 12px #96969E. End with a centred 10px grey disclaimer 'For educational purposes. Not investment advice. Markets carry risk.' Also draw the empty state: a recessed #1E1E21 12px-radius well, 44px circular bell-off icon, 17px title 'No notifications yet', 15px grey body, and one solid #406AE4 white-ink button 'Ask Copilot what to do'.
```

### 76. `/alerts` — Alerts Studio (event × channel routing)

```text
Design a dark web dashboard screen for an Indian NSE trading platform: an 'Alerts Studio' settings page. Canvas #0D0D0E, panels #151517, nested rows #0D0D0E, hairlines #29292D, primary ink #F7F7F8, secondary #D3D3D7, muted #96969E. Accent fill #406AE4 with white ink; accent text #8FB0FF; green #10B981; red #F5808C; amber #F0A94F. Geist sans, Geist Mono tabular for numerals. Assume a 240px left nav and 72px right icon rail exist; design the centre pane. Header band with bottom hairline: 11px mono uppercase eyebrow 'NOTIFICATIONS · PRO', H1 'Alerts Studio' 40px/44 weight 400, sub 15px 'Route every event to the right channel. Test a channel, tune per-event, or set them all at once.' Then a 4-up stat tile row (8px radius, 1px border, 8px padding): 'EVENT TYPES 18', 'CHANNELS LIVE 2/4' in green, 'DELIVERY Real-time', 'SCOPE Per event'. Next a 'Channels' panel (8px radius) containing a 2×2 grid of channel rows: each row a 36px rounded icon square, name, and a pill badge — Push 'Connected' green 'Web Push (browser)'; Telegram 'Connected' green '@rishi_nse'; WhatsApp 'Not connected' grey 'Verify your number in Settings'; Email 'Connected' 'rishi@example.com'. Connected rows get a small outlined 'Send test' button; disconnected rows a blue 'Connect →' link. Then a 'Bulk controls' panel with 'Enable all' and 'Mute all' buttons on the right. Then the centrepiece: a dense 5-column table titled 'Event-level preferences', columns EVENT / PUSH / TELEGRAM / WHATSAPP / EMAIL in 10px uppercase tracked grey, and 18 rows with an 11px bold label over a 10px grey description, each with four 36×20 pill toggles (on = #406AE4, off = #1E1E21 with a hairline). Rows: 'New signal — A fresh Forecast or Intraday signal is published', 'Target hit', 'Stop-loss hit', 'Regime change', 'F&O · Max Pain shifted — BANKNIFTY Max Pain moved >1%', 'F&O · Position unprotected', 'Portfolio drawdown alert — account drawdown crossed −5%'. Footer line '18 event types · 4 channels.' Finish with a 'Per-symbol price alerts' panel and an 'Open watchlist' button.
```

### 77. `/referrals` — Referrals (invite loop)

```text
Design a dark web dashboard screen: the referrals page of an Indian NSE AI trading platform. Canvas #0D0D0E, panels #151517, hairlines #29292D, primary ink #F7F7F8, muted #96969E. Accent fill #406AE4, accent text #8FB0FF, green #10B981, red #F5808C, amber #F0A94F. Geist sans; Geist Mono tabular for codes, counts and dates. One centred 1024px column, 32px vertical padding, 20px gaps. Assume a 240px left nav rail exists. Header: 22px semibold 'Referrals' with a small blue gift glyph, and a 12px grey sub-line 'Put the trading copilot and ML signal engines in a friend's hands. When they upgrade to paid for the first time, you both get +1 month of Pro, free.' Hero card: 8px radius, #151517 fill, but a blue #406AE4 30% border — the only accent-bordered surface. Inside: a 10px uppercase grey label 'YOUR REFERRAL CODE', then the code 'RISHI-4K7Q' in mono 32px semibold blue with wide letter-spacing, a tiny 'copy' link under it, and a small outlined 'Rotate code' pill top-right. Below, a link field: 6px radius, darker #0D0D0E fill, a share glyph, read-only URL 'https://quantx.in/r/RISHI-4K7Q' at 12px, and a solid blue 'Copy link' pill on the right. Then three equal share buttons: WhatsApp in its brand green #25D366 (8% tint fill, 33% border), Telegram in #229ED9, and Email in the neutral surface with blue ink. Next a single seamless 5-cell stat bar (one 8px-radius bordered strip, vertical hairline dividers, 5 columns): INVITED 14, PENDING 6, SIGNED UP 5 in blue, REWARDED 3 in green, MONTHS CREDITED '3 mo' in amber — labels 10px uppercase grey, values mono 20px semibold. Then an amber-tinted credit banner: 'You have 3 months of Pro credit ready.' with a 'Renew →' link. Finally a 'Recent referrals' panel with a header row showing '14 total' and list rows separated by hairlines: each row shows an email like 'arjun.mehta@gmail.com' at 12px with a mono 10px grey line '02 Aug 2026 · signed up 03 Aug · rewarded 05 Aug', and a right-aligned 9px uppercase status pill — 'REWARDED' green, 'SIGNED UP' blue, 'PENDING' grey, 'EXPIRED' red. Close with a centred 10px grey legal line.
```

### 78. `/settings` — Settings (10-section account console)

```text
Design a dark web dashboard settings console for an Indian NSE AI trading platform. Canvas #0D0D0E, panels #151517, nested rows #0D0D0E, hairlines #29292D, ink #F7F7F8 / #D3D3D7 / #96969E. Accent fill #406AE4 with white ink, accent text #8FB0FF, green #10B981, red #F5808C, amber #F0A94F. Geist sans; Geist Mono tabular for money and IDs. Radii: 6px chips, 8px inputs and inner cards, 12px broker tiles, 16px the two outer containers. Assume a 240px left app nav exists; design a 1152px centred content column. Header band with bottom hairline: a blue gear glyph plus H1 'Settings' at 40px/44 weight 400, and 15px grey 'Account, broker links, risk profile, alerts. Tune it once, trade with it daily.' Below, a two-column layout with 24px gap: a fixed 220px section rail (16px radius, 1px border, 8px padding) headed by a 12px uppercase tracked 'SETTINGS' label and ten 12px icon+label rows — Profile, Broker, Risk profile, Appearance, Notifications, WhatsApp digest (with a trailing external-link arrow), Security + 2FA (same arrow), Tier + billing, Kill switch, Data; the active row 'Broker' is a filled #1E1E21 pill with a blue icon. The right pane is a 16px-radius bordered panel with 32px padding, minimum 500px tall, showing the Broker section: a 12px uppercase 'BROKER' eyebrow, a 20px semibold 'Broker connection', a 15px grey sub-line, then a small uppercase grey group label 'INSTANT · ONE-CLICK LOGIN' over a 3-up grid of broker tiles and a second group 'CONNECT WITH A TOKEN' over a 3-up grid of four tiles. Each tile: 12px radius, 1px border, 20px padding, soft shadow, a 40px white rounded logo square top-left and a status pill top-right — Zerodha 'Connected' green with '1-click' green Zap chip, meta row 'Account ZR4821 · Last sync 15:34, 3 Aug'; Upstox 'Not connected'; Fyers 'Not connected' with a grey 'Beta' chip; Angel One 'Expired' amber; Dhan, Kotak Neo, Alice Blue all 'Not connected' + Beta. Tile footer: a red-outlined 'Disconnect' button on the left when connected and a solid #406AE4 'Connect' button with a Zap icon on the right. Close with a grey encryption note card carrying a shield glyph.
```

<a id="admin-admin-console"></a>

# Admin console

### 79. `/admin/*` — Admin shell

```text
Design a dark web-dashboard shell for the admin console of an Indian (NSE) AI trading platform. Page canvas #0D0D0E. Fixed left sidebar exactly 256px wide, also #0D0D0E, separated by a single 1px #29292D hairline — no shadow, no blur. Top of the sidebar: 24px horizontal / 20px vertical padding, bottom hairline; a 32×32 tile with 8px radius filled solid amber #F0A94F holding a black shield glyph; beside it "Quant X" at 20px semibold #F7F7F8 and under it "ADMIN" at 12px, 600 weight, uppercase, wide letter-spacing, in #F0A94F. Below, a 16px-padded nav of 7 rows with 4px gaps: Dashboard, Users, Payments, Signals, ML Models, Training, System Health, each a 12px-radius row with 16/12px padding, a 20px outline icon, and a 15px label. Idle rows use #96969E; hover fills rgba(255,255,255,0.04) and turns text #F7F7F8. The active row (Users) fills amber at 10% opacity, sets text #F0A94F, and pins a 4×24px amber bar with a rounded right edge flush to the left edge. Pin to the sidebar bottom, above a hairline: a 40px amber circle avatar with a black bold "R", the name "Rishi Karthikeyan" at 14px medium white over "rishi@quantx.in" at 12px #96969E, then a two-button row — a flex-1 8px-radius outlined button reading "Dashboard" with a bar-chart icon, and a square icon-only sign-out button. Right of the sidebar, an empty content pane with 32px padding and no width cap. Use Geist Sans throughout, Geist Mono for numbers. Provide a light variant: canvas #EDF1F4, hairlines #DDE5ED, ink #1D1D1D, amber #9A4D00.
```

### 80. `/admin` — Admin Dashboard

```text
Design a dark admin overview dashboard for an Indian (NSE) AI trading platform, sitting to the right of a 256px sidebar. Canvas #0D0D0E; every card is a flat square-cornered panel filled #151517 with a 1px #29292D hairline and a soft neutral shadow — no rounded corners on cards, no glass. Header: "Admin Dashboard" at 30px bold #F7F7F8, sub-line "System overview and key metrics" in #96969E with a pulsing 6px green #10B981 dot and the word "Live"; right-aligned amber "Refresh" pill (12px radius, #F0A94F text on a 10% amber fill with a 20% amber border). Section 1, "System Status": four columns, each an 8px-radius tinted icon chip plus a label and a full-pill status badge — Database "Connected" green with "42ms" in mono beneath, Redis "Slow" amber with "180ms", Scheduler "Running" green, WebSocket showing "1,284 connected"; footnote "Last signal run: 03 Aug 2026, 09:15 IST". Section 2: four KPI cards in a row — Total Users 48,712 / "All registered users" (blue #406AE4 icon chip), Active Subscribers 6,940 / "Paid subscriptions" (green), Today's Signals 37 / "Generated today" (periwinkle #8FB0FF), Active Positions 212 / "Open trades" (amber). Values 24px bold, labels 14px #96969E. Section 3: two equal cards — "Revenue (30 days)" listing Total Revenue ₹48,62,500 in green mono 24px, Completed Payments 1,204, Failed Payments 37, Refunds 6 (₹74,000), and a rule above Net Revenue ₹47,88,500; and "Signal Performance (30 days)" listing Total Signals 1,118, Target Hit 693, Stop Loss Hit 305, Avg Signals/Day 37.3, and a rule above Accuracy 62.0% in green. Section 4: "Quick Actions" with four tinted 8px-radius pills — View All Users, Payment History, Signal Analytics, System Health. Geist Sans, Geist Mono for all figures.
```

### 81. `/admin/users` — Users

```text
Design a dark admin user-management table for an Indian (NSE) trading platform, right of a 256px sidebar on a #0D0D0E canvas. All panels are square-cornered #151517 with 1px #29292D hairlines. Header row: "Users" 30px bold #F7F7F8 with sub-line "Manage user accounts and subscriptions" in #96969E; right, a subtle white-on-translucent "Export CSV" button with a download icon, 8px radius. Under it a filter panel with 16px padding holding one row: a flex-grow search input (8px radius, rgba(255,255,255,0.04) fill, 1px #29292D border, leading magnifier icon, placeholder "Search by email, name, or phone..."), a select showing "All Subscriptions", a solid amber #F0A94F submit button with BLACK text reading "Search", and a square refresh icon button. Then a 7-column table with an rgba(255,255,255,0.02) header row whose labels are 12px uppercase, wide-tracked #96969E: User, Subscription, Trading, P&L, Status, Last Active, Actions. Show six rows with Indian data, e.g. "Ananya Iyer / ananya.iyer@gmail.com / +91 98450 22119", subscription pill "Elite" in green-tinted, trading "148 trades (91 wins)" over "Win rate: 61.5%", P&L "+₹2,84,650" in green Geist Mono, status pill "Active" with a check icon; include one "Suspended" amber row and one "Banned" red row with a negative P&L of "-₹42,300". Right-most cell is a vertical-dots button; render one row with its 192px dropdown open showing "View Details", "Suspend" in amber, and "Ban User" in red #F5808C. Footer bar inside the panel: "Showing 20 of 48,712 users" left, chevron-left / "Page 1 of 2436" / chevron-right right. Geist Sans; Geist Mono for money.
```

### 82. `/admin/users/[id]` — User detail

```text
Design a dark admin user-detail screen for an Indian (NSE) trading platform, right of a 256px sidebar on #0D0D0E. Cards here are #151517 with 16px radius and a 1px #29292D hairline (rounder than the rest of the console). Header: a square back-arrow button, then "Priya Raghavan" at 24px bold #F7F7F8 over "priya.raghavan@gmail.com" in #96969E, and a refresh icon button far right. Beneath, an amber 12px-radius banner with a user-x icon reading "This user is SUSPENDED" in #F0A94F on a 10% amber fill. Then three equal cards: "Basic Info" listing mail/phone/calendar/card icon rows — priya.raghavan@gmail.com, +91 99401 55832, "Joined 14/02/2025", "Elite Annual"; "Trading Stats" as label/value rows — Capital ₹12,50,000 in Geist Mono, Total Trades 214, Win Rate 58.9%, Total P&L +₹3,72,480 in green #10B981; "Trading Settings" — Mode "Semi auto", Risk Profile "Moderate", Risk/Trade 1.5%, F&O Enabled "Yes" in green, Broker "Zerodha". Next a full-width "Admin Actions" card with four tinted 8px-radius pills: Reset Subscription (periwinkle #8FB0FF), Suspend User (amber), Ban User (red #F5808C). Below, a four-tab bar over a hairline — Overview, Trades, Payments, Activity — with the active tab underlined by a 2px RED #F5808C bar and red label. Show the Overview panel: heading "Active Positions" and a six-column table (Symbol, Direction, Qty, Avg Price, Current, P&L) with rows RELIANCE / LONG green / 55 / ₹2,942.10 / ₹2,988.40 / +₹2,546 and HDFCBANK / SHORT red / 120 / ₹1,684.00 / ₹1,701.25 / -₹2,070. Geist Sans, Geist Mono for all figures.
```

### 83. `/admin/payments` — Payments

```text
Design a dark admin payments/revenue screen for an Indian (NSE) trading platform, right of a 256px sidebar on #0D0D0E. All panels square-cornered #151517 with 1px #29292D hairlines. Header: "Payments" 30px bold #F7F7F8 over "Payment transactions and revenue analytics" in #96969E. Row of four KPI cards, each 24px padding with a left text block and a right 12px-radius tinted icon tile: Total Revenue "₹48,62,500" in green #10B981 Geist Mono with caption "Last 30 days" and a rupee/dollar icon; Completed "1,204" in white with caption "Successful payments" and a periwinkle #8FB0FF check icon; Failed "37" in red #F5808C with "Failed attempts"; Refunds "₹74,000" in amber #F0A94F with "6 refunds" and a rotate icon. Under it, four flat 8px-radius toggle chips — 7 Days, 30 Days, 90 Days, 1 Year — with "30 Days" active as solid amber #F0A94F with BLACK text and the rest translucent white with #96969E labels. Then a filter panel holding a select reading "All Status" and a translucent "Refresh" button. Finally a 7-column ledger table with an rgba(255,255,255,0.02) header of 12px uppercase #96969E labels: User, Plan, Amount, Status, Order ID, Date, Actions. Six rows of realistic data, e.g. "Vikram Shetty / vikram.shetty@outlook.com", plan "Elite" over "annual", amount "₹24,999" in Geist Mono, a green full-pill "Completed" badge with a check, order id in a small monospace chip "order_PqR8xVn2Lk...", date "02/08/2026", and a plain em dash in Actions. Include one red "Failed" row and one amber "Refunded" row. Footer inside the panel: "Showing 20 of 1,247 payments" left; chevron / "Page 1" / chevron right.
```

### 84. `/admin/signals` — Signal Analytics

```text
Design a dark admin signal-analytics screen for an Indian (NSE) AI trading platform, right of a 256px sidebar on #0D0D0E. Panels are square-cornered #151517 with 1px #29292D hairlines. Header: "Signal Analytics" 30px bold #F7F7F8 over "AI signal performance and accuracy tracking" in #96969E with a pulsing 6px green dot and "Live"; a square refresh icon button far right. Below, four 8px-radius chips — 7 Days, 30 Days, 90 Days, 1 Year — with "30 Days" active as solid amber #F0A94F with BLACK text. Then a row of FIVE stat cards, each with a 20px icon plus a 14px #96969E label and a 30px bold number: Total Signals 1,118 (blue target icon, white), Target Hit 693 (green up-arrow, value #10B981), SL Hit 305 (red down-arrow, value #F5808C), Accuracy 62.0% (periwinkle bar-chart icon, value green Geist Mono), Avg/Day 37.3 (amber activity icon, white). Next, an "Accuracy Overview" card: on the left a 128px donut ring, 8px stroke, track at 6% white, progress arc in green #10B981 with round caps filled to 62%, and "62%" centred in 24px bold Geist Mono; on the right two labelled progress bars 8px tall and fully rounded — "Winners 693" in green filled 62%, "Losers 305" in red filled 27%. Finally a "Recent Signals" panel with an 8-column table (Symbol, Direction, Entry, SL, Target, Confidence, Status, Date): RELIANCE / LONG green with up-arrow / ₹2,942.10 / ₹2,880.00 in red / ₹3,065.00 in green / a 64px confidence bar at 78% green with "78%" / green pill "Target Hit" / 01/08/2026; plus TCS SHORT, INFY LONG with a blue "Active" pill, and HDFCBANK with a red "SL Hit" pill. Geist Sans, Geist Mono for prices.
```

### 85. `/admin/ml` — ML Dashboard

```text
Design a dark ML-operations dashboard for an Indian (NSE) AI trading platform, right of a 256px sidebar on #0D0D0E, with 32px gaps between sections. Header: a 32px brain glyph in periwinkle #8FB0FF beside "ML Dashboard" 30px bold #F7F7F8, sub-line "Model performance, regime detection, and strategy metrics" in #96969E, and an amber-tinted "Refresh" pill right. Hero banner with 16px radius, filled green #10B981 at 10% with a 20% green border: left, a 56px rounded tile holding a green up-arrow, then "Current Market Regime" 14px #96969E over "Bullish" 24px bold green over "Active for 12 days (since 22 Jul 2026)"; centre, three stacked percentages in Geist Mono — 71% bull (green), 22% sideways (amber), 7% bear (red) — each over a lowercase label; right, "Confidence" over "71%" at 30px bold green. Inside the same banner, above a hairline, "Strategy Weights (Regime-adjusted)" and six small 8px-radius translucent tiles reading e.g. "momentum breakout 1.20x" green, "mean reversion 0.45x" red. Next, "ML Models (6)" with a blue CPU icon, then three square-cornered #151517 cards per row: title "tft_swing", a pill badge "forecaster", a green "Active" check right, then rows Accuracy 73% green, Features 158, Trained 2026-07-28, Path in a monospace chip, and a 6px green progress bar at 73%. Then a "Strategy Performance (30 days)" table (Strategy, Signals, Win Rate, Avg Return, Weight). Then an "Engine drift monitor" card with 7d/30d/90d segmented chips, a red banner "1 engine drifting — Alpha — consider retraining.", and an 8-column table whose Engine cells stack a friendly name ("Forecast") over a grey monospace internal id ("tft_swing"), with uppercase status markers drifting/healthy/watch and a small "Retrain" button per row. Finish with a "Retrain Controls" card: amber "Retrain All Models" button plus grey per-model chips. Geist Sans, Geist Mono for all numbers.
```

### 86. `/admin/training` — Training pipeline

```text
Design a dark ML training-pipeline console for an Indian (NSE) AI trading platform, right of a 256px sidebar on #0D0D0E, 24px section gaps. Header: "Training pipeline" 24px bold #F7F7F8 over a 14px #96969E line reading "Unified runner discovers trainers under ml/training/trainers/. Each trainer trains, evaluates, and registers a new model_versions row." with the paths in blue #8FB0FF monospace. First card (12px radius, #151517, 1px #29292D border, 20px padding): heading "Run config" at 14px semibold with a small grey "Refresh" text button right; a row of three checkboxes with blue #406AE4 accents — "Dry run (no B2 upload, no DB write)" checked, "Skip GPU trainers", "Promote on success"; then two 6px-radius buttons: solid blue #406AE4 with BLACK text reading "Run all (7)" with a play glyph, and an outlined blue "Run selected (2)". Second card "Discovered trainers": a 6-column table (checkbox, Name, Compute, Depends on, Last trained, Prod version) with 10px uppercase grey headers and rows like "tft_swing / GPU (amber server icon) / — / 28/07/2026, 02:14 / v14 with a small green 'prod' tag", "lgbm_signal_gate / CPU (grey chip) / qlib_alpha158 / 27/07/2026 / v31", "finbert_india / GPU / — / never / —". Third card "Recent runs" with "last 50" right-aligned: a divided list of run rows, each with a status glyph, the run id first 8 chars in monospace, "· scheduler" in grey, and a second line with a clock, "03/08/2026, 02:00:11", "· 486.3s", an amber "· dry-run" and a blue "· promote", plus an uppercase status word right — show one green "ok", one amber "partial", one red "failed", and one blue spinning "running" row expanded to reveal indented per-trainer lines like "tft_swing ok 142.7s v15 prod {\"ic\":0.041}". Geist Sans, Geist Mono for ids and numbers.
```

### 87. `/admin/system` — System Health

```text
Design a long dark system-health / incident console for an Indian (NSE) AI trading platform, right of a 256px sidebar on #0D0D0E, 24px section gaps. Header: "System Health" 30px bold #F7F7F8 over "Real-time system monitoring and status" in #96969E with a pulsing green dot and "Live"; right, a checkbox labelled "Auto-refresh (30s)" and a translucent "Refresh" button; a small line beneath reads "Last updated: 14:32:07". Then a 16px-radius verdict banner filled amber #F0A94F at 10% with a 20% amber border, an alert glyph, "System Status: DEGRADED" at 20px bold and "Last checked: 03/08/2026, 14:32:05". Four square-cornered #151517 service cards: Database (blue icon, green check, "connected"), Redis (red icon, amber alert, "slow"), Scheduler (periwinkle clock, green check, "running", plus "Last run: 09:15:00"), WebSocket (green wifi icon with a big green "1,284" where the status glyph would be, caption "Active connections"). A "System Metrics" card with five centred cells, each a 48px 12px-radius tinted tile above a 24px bold number and a 14px grey label: Total Users 48,712 · Active Subscribers 6,940 · Today's Signals 37 · Today's Trades 214 · Active Positions 212. An "Environment" card with two inset blocks showing API URL and "production" in monospace. A "Quick Actions" card with three tinted pills. Then five operational panels stacked: (1) a 12px-radius panel with a 3px GREEN left border, shield glyph, "Global kill switch", a green pill "Inactive — normal ops" with a dot, a dark reason input placeholdered "Why are you activating? (required)" and a red-tinted "Activate kill switch" button; (2) "Manual operations" with an amber "Trigger signal scan now" button; (3) "LLM cost" with 1h/24h/7d/30d chips (24h active, solid blue with black text), two inset tiles "$4.8127" and "12,904", and a by-feature table (copilot, scanner, debate); (4) "Scheduler job runs" with tinted job tiles and a 6-column history table; (5) "Admin audit log" with two filter selects and a 5-column table (When, Actor, Action, Target, IP), one row expanded to reveal a pretty-printed JSON payload block. Geist Sans, Geist Mono for figures.
```

### 88. `/admin/model-performance` — Model Performance

```text
Design a dark, narrow admin analytics page (max 1280px, centred) for per-model production performance on an Indian (NSE) AI trading platform. Canvas #0D0D0E. Header sits above a 1px #29292D rule: "Model Performance" 24px semibold #F7F7F8 over a 14px #D3D3D7 line "Live IC vs backtest IC per PROD model · drift detection · admin-only"; far right, a small borderless icon-only refresh button. Below, a 12px-gap stack of model cards, each 12px radius, #151517 fill, 1px #29292D border, 16px padding. Card header: model name "qlib_alpha158" at 18px semibold, a small blue pill badge "v31" (blue #8FB0FF text on a 10% #406AE4 fill, fully rounded), a 10px grey monospace "trained 2026-07-28", and right-aligned a 6px-radius chip "drift: 82% of backtest" outlined and tinted green #10B981. Beneath, four stat columns each with a 10px uppercase wide-tracked #96969E label over a 14px Geist Mono value: Backtest Sharpe 1.94, Live Sharpe (30d) 1.59, Rolling windows 4, Last computed 2026-08-02. Then a very compact 11px monospace table with a faint header band and 7 right-aligned columns — Window, Sharpe, Win rate, Avg P&L %, Signals, Dir. accuracy, Max DD — showing rows 7d / 1.42 / 58% / 0.84% green / 96 / 61% / -4.2% red, 30d / 1.59 / 61% / 1.12% green / 412 / 63% / -7.8% red, 90d, 180d. Repeat the card for "regime_hmm" with an amber-blue "drift: 61% of backtest" chip and "tft_swing" with a red "drift: 38% of backtest" chip and a negative Avg P&L row. At the bottom show a small 6px-radius red-outlined block titled "Errors" listing one line. Also show the loading variant: four full-width 140px pulsing grey placeholder blocks. Geist Sans; Geist Mono for every figure.
```

### 89. `/admin (route-level states)` — Admin loading skeleton & error boundary

```text
Design two dark route-level states for an admin console on an Indian (NSE) AI trading platform, both shown inside a content pane to the right of a 256px sidebar, canvas #0D0D0E. STATE ONE — loading skeleton: a centred 1280px column with 24px horizontal and 32px vertical padding; at the top a 180×28px pulsing grey placeholder bar and beneath it a 280×14px bar, both 6px radius in a muted grey #29292D at about 80% opacity with a slow pulse; 24px lower, a row of four equal placeholder blocks 100px tall with 8px radius and 16px gaps standing in for KPI cards; 24px lower, two equal placeholder blocks 280px tall with 8px radius side by side. No text, no spinner, no shimmer sweep — a simple opacity pulse only. STATE TWO — error boundary: a centred column no wider than 384px, vertically centred in at least 60% of the viewport height. At the top an 80px circular mark: a dashed ring (6px dash, 5px gap) in soft red #F5808C at 1.5px stroke and 50% opacity slowly rotating, a blurred red glow filling the inside, and a large bold red exclamation mark "!" pulsing at the centre. Under it, "Something went wrong" at 18px bold #F7F7F8, then "An unexpected error occurred." at 14px #96969E, then a solid blue #406AE4 button with 12px radius and white 14px medium text reading "Try again", which darkens to #3055C2 on hover. No error code, no stack trace, no secondary link. Provide a light-theme variant with canvas #EDF1F4, placeholder grey #DDE5ED, ink #1D1D1D and red #B81C22. Geist Sans.
```
