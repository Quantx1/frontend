# THE UI SOURCING PLAN — Quant X

**Stack (verified from `/Users/rishi/QuantX/frontend/package.json`, this session):** React 18.2.0 (exact pin, no caret) · react-dom 18.2.0 · next 14.1.0 · tailwindcss ^3.4.1 (3.4.19 resolved) · recharts ^2.15.4 · lightweight-charts ^4.2.0 · framer-motion ^10.18.0 · ai 7.0.48 · @ai-sdk/react 4.0.51 · zustand ^4.5.0 · zod ^3.25.76 · @tanstack/react-table ^8.21.3 · @tanstack/react-virtual ^3.14.9 · `components.json` = style `default`, base `neutral`, cssVariables true, rsc true, **zero third-party registries configured**.

**Empirical compat oracle (built this session — reuse it before trusting any claim).** Compiling a probe through *this repo's own* `tailwind.config.ts`:

| Emits CSS | Emits **nothing**, silently, no error |
|---|---|
| `size-*`, `rounded-xs`, `rounded-mark`, `shadow-elev-1`, `shadow-sm`, `ring-2`, `bg-gradient-to-b`, `animate-pop-in`, `text-green-600` | `shadow-xs`, `field-sizing-content`, `not-last:`, `bg-linear-to-*`, `ring-3`, `outline-hidden`, `animate-in`, `fade-in-0`, `slide-in-from-*`, `zoom-in-*` |

Confirmed absent from `node_modules`: **`tailwindcss-animate`**, `use-stick-to-bottom`, `motion`.

---

## 0. The finding that reframes the whole exercise

Three research passes surveyed ~60 sources against nine surfaces. Verified against the actual repo, **six of the nine surfaces are already built, and one does not exist in this repository at all.**

| # | Surface | Reality |
|---|---|---|
| 1 | Chat/thread | Built (`app/(platform)/copilot/`, `components/copilot/`, `lib/copilot/{ui-message,selectors,transport}.ts`). **One real gap: scroll anchoring.** |
| 2 | Entity card | Not built, but fully specced to the JSX in `docs/REDESIGN-VISUAL.md` §4.1; every part ships today (`foundation/Card`, `Sparkline` (131 LOC, dep-free SVG), `ChangeBadge`, `Verdict`, `ui/StockAvatar`, `lib/format.ts`). **Assembly, not sourcing.** |
| 3 | Context panel | `react-resizable-panels` 4.12.2 installed; `components/ui/resizable.tsx` already retargeted to v4's Group/Separator API (`docs/DESIGN.md` §8 deviation 2). `foundation/Tabs` + `Sheet` complete it. |
| 4 | Order ticket | **Genuine void.** `foundation/NumericInput`, `Segmented`, `ConfirmDialog` exist. |
| 5 | Sector treemap | **Already built** — `components/markets/SectorHeatmap.tsx`, 76 lines, zero deps, tints via `color-mix` on the up/down tokens so it is theme-correct in both registers. (Duplicate at `components/scanner/SectorHeatmap.tsx` — delete, per `DESIGN.md` §1.10.) News timeline: not built. |
| 6 | Blotter | **Already built** — `components/foundation/DataTable.tsx`, 416 LOC, dense + sticky header + sticky first column + hideOnMobile + loading/empty/error. `REDESIGN-VISUAL.md` §1.8: *"the ONLY table implementation that survives."* §3 Tier C caps at 50 rows → *"Show all N ›"*, i.e. below the virtualisation threshold. |
| 7 | Rule builder (nested AND/OR) | **Genuine void.** |
| 8 | KPI / empty / skeleton | **Already built** — `StatTile`, `StatCard`, `Skeleton`, `EmptyState`, `ErrorState`, `UsageMeter`, `WinRateGauge`, all in `components/foundation/`. |
| 9 | Landing/marketing | **Not in this repo.** `MONOREPO-SPLIT.md` line 21: the 5 marketing routes and 133 files were carved out to `github.com/Quantx1/landing`; `/` now redirects to `/copilot`. No `components/landing` directory exists. |

Two structural constraints kill most "just `npx shadcn add` it" advice:

1. **The eleven deleted duplicates.** `docs/DESIGN.md` §8 records that `ui/button, ui/card, ui/badge, ui/input, ui/skeleton, ui/dialog, ui/popover, ui/tooltip, ui/tabs, ui/select, ui/alert-dialog` were deleted after shadcn install because `components/foundation/` owns those concepts on the same Radix primitives (Button used in 49 files, Badge 47, Skeleton 53). Verified: all ten absent from `components/ui/`. Every chat kit's `registryDependencies` drags them straight back — `ai-elements/prompt-input` → `[button, command, dropdown-menu, hover-card, input-group, select]`; `ai-elements/message` → `[button, button-group, tooltip]`; `prompt-kit/prompt-input` → `[tooltip]`. **The CLI resolves these transitively.** DESIGN.md §8 also warns the CLI rewrites `tailwind.config.ts` and the `--font-*` aliases in `globals.css` on every `add` (it previously stripped all token comments and corrupted `darkMode: 'class'` into `['class','class']`).
2. **The disclosure components render the opposite of the spec.** `lib/copilot/ui-message.ts` types the stream as `UIMessage<never, CopilotDataParts>` with custom `data-progress / data-artifacts / data-references / data-followups / data-meta` parts; `lib/api.ts:603` `CopilotStep = {stage,label,tool,status,duration_ms,error}`. The backend emits **zero** native `ToolUIPart` / `ReasoningUIPart` / `SourceUrlUIPart`, which is exactly what AI Elements' `tool.tsx`, `reasoning.tsx`, `sources.tsx` are typed against. And `REDESIGN.md` §1.2 names the current four-provenance-strip UI as the product's core defect — §4.3 / `REDESIGN-VISUAL.md` §6.2 mandate collapsing all of it to one line (`✓ Worked it out · 6 steps · 2.4s · 3 sources ⌄`) with ReferencesRail and the CONSULTED row deleted. **Adopting those components re-installs the failure the redesign exists to remove.**

**Also corrected — a phantom blocker that appears in two of the source reports.** They claim `ai@7.0.48` + `@ai-sdk/react@4.0.51` is "a mismatched major" whose `useChat` yields `content` strings not `parts`. **False.** `node_modules/@ai-sdk/react/package.json` declares `"dependencies": {"ai": "7.0.48"}` — an exact pin — and `useChat<UI_MESSAGE extends UIMessage>` is generic over the parts-based `UIMessage` from `ai`. It is the correct, current pairing (vercel/chatbot independently pins `ai 7.0.15` + `@ai-sdk/react 4.0.16`). **Nothing needs reconciling. Do not let this delay work.**

---

## 1. ADOPT NOW

Only items verified compatible with React 18.2.0 + Tailwind 3.4.19 + Next 14.1.0 *and* which are not already solved in-repo.

| Item | What it replaces / gives us | Install | Licence | Surface |
|---|---|---|---|---|
| **use-stick-to-bottom@1.1.6**<br>https://www.npmjs.com/package/use-stick-to-bottom | Deletes the two force-scroll bugs: `app/(platform)/copilot/page.tsx:406` fires `endRef.scrollIntoView` on `[turns, pending, streamN]` — and `streamN` is the typewriter counter ticking **every 14ms** — while `components/copilot/CopilotProvider.tsx:277` separately `scrollTo(scrollHeight)` on every message. Both scroll regardless of where the user is. Gives `<StickToBottom>` + `useStickToBottomContext() → {isAtBottom, scrollToBottom}`. The one adoption that **removes** code. | `npm i use-stick-to-bottom` | MIT (npm verified) | 1 |
| **prompt-kit `chat-container`** (copy the file)<br>https://www.prompt-kit.com/c/chat-container.json | The thin wrapper over the above, with the scroll-button wiring. **`registryDependencies: []`** — the only chat item in the entire survey that resurrects zero deleted duplicates. Read it, then decide whether you want the wrapper or just the hook. | `curl -s https://www.prompt-kit.com/c/chat-container.json \| jq -r '.files[0].content' > components/copilot/ChatContainer.tsx` | MIT (GitHub API spdx: MIT) | 1 |
| **prompt-kit `response-stream`** (copy the file)<br>https://www.prompt-kit.com/c/response-stream.json | Token-reveal for streaming text. `registryDependencies: []`, `dependencies: []`, fully self-contained. Zero v4 utilities, zero `animate-in`, zero React-19 APIs. Supports the reveal `REDESIGN-VISUAL.md` §7.1 permits (stream, but no typewriter on already-received text — §5.6 deletes the current one). | same `curl` pattern, `-> components/copilot/ResponseStream.tsx` | MIT | 1 |
| **`tailwindcss-animate`** *(conditional — only if you copy anything emitting `animate-in`)* | Restores ~45 disclosure animations that currently no-op silently. Not needed for the three items above; needed the moment you lift an AI Elements or DiceUI file. | `npm i -D tailwindcss-animate` + add to `plugins` in `tailwind.config.ts` | MIT | 1, 7 |
| **`d3-shape@3`** *(optional, ~5.5 kB gzip)*<br>https://github.com/d3/d3-shape | `line()` / `area()` curve generators if the news-timeline or a second sparkline variant needs them. Sits alongside installed `d3-scale ^4.0.2` + `d3-array ^3.2.4`. Zero peerDependencies. **Skip unless you actually need curves** — `foundation/Sparkline.tsx` already does the path maths inline. | `npm i d3-shape @types/d3-shape` | ISC | 2, 5 |

**That is the complete list.** One required npm package, two copied files, one conditional dev dependency.

**Do not run `npx shadcn add` for any of it.** Copy files by hand and repoint imports at `@/components/foundation`. If you ever do run the CLI, back up `tailwind.config.ts` and `app/globals.css` first (DESIGN.md §8).

---

## 2. REGISTRIES TO ADD

`components.json` currently declares **no** registries. My recommendation is **add none for installation** — add them read-only so the shadcn MCP can `view` sources without the CLI ever writing files.

If you want them wired for inspection, this is the exact block to paste at the top level of `components.json` (sibling of `"aliases"`):

```jsonc
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": { "config": "tailwind.config.ts", "css": "app/globals.css",
                "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui" },

  // READ-ONLY. Use `npx shadcn view <@ns/item>` or the shadcn MCP.
  // NEVER `npx shadcn add` — registryDependencies transitively recreate the
  // eleven ui/* duplicates deleted per docs/DESIGN.md §8, and the CLI rewrites
  // tailwind.config.ts + globals.css font vars on every add.
  "registries": {
    "@prompt-kit":  "https://www.prompt-kit.com/c/{name}.json",
    "@ai-elements": "https://registry.ai-sdk.dev/{name}.json",
    "@kibo":        "https://www.kibo-ui.com/r/{name}.json"
  }
}
```

**What is worth pulling from each — and nothing else:**

| Registry | Pull | Do **not** pull |
|---|---|---|
| `@prompt-kit` (MIT, 2953★, last push 2026-03-12 — ~5 months, marketing-site commits only; **copy from it, don't track it**) | `chat-container`, `response-stream` (both `registryDependencies: []`) | `prompt-input` (contains `shadow-xs`; needs `tooltip` → deleted duplicate); `file-upload` — **correction to the survey, which claimed prompt-kit emits no `animate-in`:** its source contains verbatim `animate-in fade-in-0 slide-in-from-bottom zoom-in-90 duration-150`, all four proven non-generating. Its drop-zone overlay is inert on this stack. |
| `@ai-elements` (Apache-2.0 — verified by reading the LICENSE verbatim, *"Copyright 2023 Vercel, Inc."*; GitHub's NOASSERTION is wrong. 2282★, pushed 2026-08-01) | `conversation`, `suggestion`, `artifact` — **read only**, for composition. All `ai` imports are `import type`; all 7 types (`UIMessage`, `ToolUIPart`, `DynamicToolUIPart`, `ChatStatus`, `FileUIPart`, `SourceDocumentUIPart`, `LanguageModelUsage`) resolve in installed `ai@7.0.48`. All 19 `registryDependencies` resolve HTTP 200 on the v3 `default` style path. | `tool`, `reasoning`, `sources` — typed against native parts this backend never emits, *and* they render the multi-strip provenance §1.2 identifies as the defect. `prompt-input` — `field-sizing` (silent), 6 registryDeps incl. 4 deleted duplicates. `message`/`reasoning` — pull **streamdown** (453 KB min / 138 KB gzip, 16 transitive deps incl. **mermaid**) into a product whose spec bans inline tables and inline charts. `queue` — `shadow-xs`. `shimmer` — the only file importing `motion/react`. |
| `@kibo` (MIT, 3887★, pushed 2026-05-04) | `file-tree` equivalent / `status` (`dependencies: []`, `registryDependencies: [badge]` — badge is deleted, so repoint). Low value. | **`ticker` — reject it, despite three reports calling it "the single best find" and "a lucky hit."** I read all 196 lines. (a) Root is `<button className="inline-flex … whitespace-nowrap">` — an inline chip, so nesting the spec's `[Details]` and `[Buy]` buttons inside is invalid HTML. (b) It hardcodes `text-green-600 dark:text-green-500` / `text-red-600 dark:text-red-500`; the probe confirms those **do** emit, so it silently bypasses `--color-up`/`--color-down` (AA-validated 6.50:1 / 6.51:1, `REDESIGN-VISUAL.md` §1.2) with no build error. (c) `TickerIcon` is a `size-7 rounded-full` Avatar; §4.1 row 1a demands a 40×40 `rounded-sm bg-surface-2` tile holding SymbolLogo at 24px. (d) Its one novel feature — the `Intl.NumberFormat` context — is already beaten by `lib/format.ts`, which has a purpose-built en-IN lakh/crore layer with unit tests in `lib/format.test.ts`. `table` pulls **jotai** into a zustand app. |

**Explicitly not added:** `@diceui` — its Tailwind-v3 status was left UNVERIFIED in the survey and fails on inspection: `mention.json` (the item that motivated adopting it) contains `shadow-xs`, `outline-hidden`, **and** the full `animate-in/animate-out/fade-in/slide-in/zoom-in` set; `stepper` uses `not-last:`; `tags-input` uses `outline-hidden`. Also its npm packages are staler than the repo implies (`@diceui/tags-input@0.7.2` published 2025-03-17, ~17 months). `@reui` — see AVOID. `@originui`, `@shadcn-chat` — registry endpoints do not function.

---

## 3. COPY THE PATTERN, NOT THE CODE

| Source | URL | Licence | Take exactly this |
|---|---|---|---|
| **Vercel AI Elements** | https://github.com/vercel/ai-elements · https://ai-sdk.dev/elements | Apache-2.0 (LICENSE read verbatim) | The **composition** of `conversation` (`StickToBottom` + content + scroll-button + empty state) and the `example-demo-claude` / `example-demo-chatgpt` blocks. Read it for shell shape. Install nothing. |
| **vercel/chatbot** | https://github.com/vercel/chatbot | Apache-2.0 (LICENSE read verbatim; GitHub reports NOASSERTION) | **Server-side only.** Its `package.json` is react 19.2.7 / next 16.2.10 / tailwindcss ^4.3.2 — three simultaneous major gaps, do not `npx` it. But it pins `ai 7.0.15` + `@ai-sdk/react 4.0.16`, the same line we run, so its route handlers, `streamText` setup, tool plumbing and resumable-stream wiring transfer directly. Ignore every piece of JSX. |
| **MrChartist/india-s-best-option-hub** | https://github.com/MrChartist/india-s-best-option-hub | MIT (package.json + GitHub API) | The **maths and NSE domain logic**, not the chrome: `src/lib/{oiUtils,gexData,marketApi,positionStore}.ts`, `PayoffMultiDTE.tsx`, `IVRankWidget.tsx`, `ExpectedMoveWidget.tsx`, `StrategyBuilder.tsx`. Stack is react ^18.3.1 / tailwindcss ^3.4.17 / recharts ^2.15.4 — a near-exact match, so component code ports almost as-is. **Caveats:** Vite + react-router (needs App Router port + `'use client'`), and lightweight-charts ^5.2.0 vs our 4.2.0. 163★, pushed 2026-06-14. |
| **Tremor source repo** (never the npm package) | https://github.com/tremorlabs/tremor | Apache-2.0 | `Tracker.tsx` (104 lines, `@radix-ui/react-hover-card` — matches our Radix base) as the **signal-bar** on the entity card. Repo pins react ^18.3.1 + recharts ^2.15.2, covering our 2.15.4; both files scan clean of Tailwind-v4 utilities (`size-*` is a false positive — the probe proves it emits). Ignore `SparkChart.tsx` — `foundation/Sparkline.tsx` already exists and is dependency-free. Repo last push 2025-10-10. |
| **Origin UI `timeline.tsx`** | https://github.com/cosscom/coss/blob/main/apps/origin/registry/default/ui/timeline.tsx | **MIT only via a path carve-out.** Repo root LICENSE is AGPL-3.0; `apps/origin/LICENSE.md` is MIT. **Take files from `apps/origin/**` only.** | The compound shape (`Timeline/Item/Header/Separator/Indicator/Date/Title/Content` with controlled+uncontrolled active step) for the news timeline. 209 lines, React-18-safe. Two edits: `radix-ui` unified import → `@radix-ui/react-slot`; `not-last:` → `[&:not(:last-child)]:` (probe-confirmed silent). |
| **IBM Carbon motion tokens** | https://github.com/carbon-design-system/carbon/tree/main/packages/motion | Apache-2.0, zero peers | The idea that hierarchy lives in the **curve**, not just duration: `standard/productive (0.2,0,0.38,0.9)` vs `standard/expressive (0.4,0.14,0.3,1)`. Note our `--dur-base` 240ms is exactly Carbon's `moderate-02` and `--dur-slow` 380ms is within 5% of `slow-01` — we converged independently. Levels 1–2 (hover, focus, tabs) → productive; levels 3–4 (agent reveal, chart draw) → expressive. |
| **Atlassian DESIGN.md** | https://atlassian.design/DESIGN.md | Apache-2.0 tokens; public docs | Three specs, no package (`@atlaskit/tokens` is a runtime theming engine — don't install). (1) Three-tier chart tokens: `chart-categorical-1..8` \| `chart-<hue>-bold/bolder/boldest` \| `chart-success/danger/…` — this is what actually enforces "up/down are P&L semantics only," which nothing in our token layer currently does. (2) Focus ring: 2px, 2px offset, **ring radius = component radius + 2px** — composes with our 5-step radius scale. (3) Compact density permitted only on genuinely dense surfaces, never as a default. |
| **GitHub Primer Primitives** | https://github.com/primer/primitives | MIT, zero peers, published 2026-07-30 | Ship as a **fourth theme**, not a rewrite. It is the only system with production, contrast-tested CVD themes as plain CSS variables: deuteranopia/protanopia swaps the semantic axis to blue/orange — dark `--fgColor-success #58a6ff` / `--fgColor-danger #f0883e`, which land at 7.22:1 and 7.20:1 on our `--surface-1 #151517`, i.e. salience-matched to within 0.02. **Critical caveat, measured:** our current `#10B981` vs `#F5808C` sit at **1.01:1 luminance contrast to each other**, and Primer's CVD pair at **1.00:1** — neither is separable in greyscale or under achromatopsia. Hue swap alone is not a fix. Direction must always carry a second channel (signed number, triangle glyph, hollow-vs-filled). Precedent that this is a settings toggle, not a replacement: Binance ships three selectable palettes; FxPro ships four CVD modes. NSE/BSE retail convention is green-up/red-down like the US, so the default stays. |
| **knadh/oat** (Zerodha CTO) | https://github.com/knadh/oat | MIT, 5443★, pushed 2026-07-29 | Design reference only — no React, no Tailwind, would collide with our tokens. Read it for type scale, spacing rhythm, control density, and how little chrome an Indian trading UI actually needs. Closest public expression of the Kite taste. |
| **d3-scale-chromatic** | https://github.com/d3/d3-scale-chromatic | ISC, zero peers | The rule, not necessarily the package: a diverging treemap ramp must **not** be `interpolateRdYlGn` — its ends collapse under deuteranopia, the most common CVD. Use `interpolatePuOr`, `interpolateBrBG`, or derive the ramp from the chosen up/down pair so treemap and blotter agree. Our `SectorHeatmap` already does the latter via `color-mix`. |

---

## 4. BUILD OURSELVES

| Surface | Why hand-building is correct |
|---|---|
| **2 — Entity card** | Not a sourcing problem. `REDESIGN-VISUAL.md` §4.1 already gives a 7-row anatomy table plus a reference implementation sketch, and every part exists: `foundation/Card` (+Panel), `Sparkline` (§1.7: *"keep, unchanged. No Recharts in a chat reply"*), `ChangeBadge`, `Verdict`, `Button`, `ui/StockAvatar`, `lib/format.ts`. An afternoon of assembly. Every packaged candidate (kibo `ticker`, shadcn.io `product-card-stock`) hardcodes palette colours that bypass our AA-validated tokens with no build error. |
| **4 — Order ticket** | **Nothing exists.** Verified via the shadcn MCP: `@shadcn` returns nothing for order/ticket/buy/sell/stepper. `youfoundron/react-trading-ui` is **archived since 2017-06-15** and still tops search. `@lab49/react-order-book` is order-book only, ~3 years old. And no library could encode our constraints anyway: §R7 requires collection and confirmation be separate with **Cancel focused** in `ConfirmDialog`; §4.6 forbids client-computed charges until `POST /api/broker/order/preview` exists. Build from `foundation/NumericInput` + `Segmented` + `ConfirmDialog`. |
| **5 — News timeline** | Nothing in-repo; the only good source (Origin UI) carries an AGPL-root licence caveat and a silent `not-last:` variant. Copy that file's *shape*, write our own. |
| **7 — Rule builder (nested AND/OR)** | The one place a library genuinely exists and still loses. `react-querybuilder@8.21.2` (MIT, peer `react >=18`, pushed 2026-08-03, excellent) **hard-depends on `@reduxjs/toolkit ^2.12.0` + `react-redux ^9.3.0`, ~2.2 MB unpacked** — a second state library shipped for one screen in a zustand app. There is no official shadcn adapter (I enumerated the whole `@react-querybuilder` npm scope: dnd, core, material, antd, mantine, chakra, bootstrap, fluent, bulma, native, datetime — no shadcn), and both community wrappers are stale (`jide/…` 2024-08, **no licence file**; `syed1006/…` 2024-11). Build on `foundation/Select` + `Button` + `Input`. Its **JSONLogic exporter** is the one idea worth stealing — if the agent should emit a rule tree the backend executes, copy the serialisation format, not the package. |
| **5 — Treemap: keep what we have** | `d3-hierarchy` would replace 76 working, token-aware lines with absolutely-positioned tiles needing new labelling, truncation and min-size logic. `REDESIGN.md` §4.4 places the heatmap in Panel B › Sectors at **420px**, where a squarified layout's advantage evaporates and labels stop fitting. Net negative. (`@visx/hierarchy` also internally pins `d3-hierarchy ^1.1.4` — v1 — so pairing it with v3 ships two copies.) |
| **6 — Blotter: keep what we have** | `foundation/DataTable.tsx` is mandated by §5.4 (*"DataTable with `dense`, no exceptions"*) and already killed four hand-rolled tables. Its docblock says "no virtualisation" — correct, because §3 Tier C caps at 50 rows. `@tanstack/react-virtual@3.14.9` is already installed if that changes. If it ever does: `estimateSize: () => 28`, render `<thead>` **outside** the virtualiser's scroll element (TanStack/virtual#640 is precisely this bug), and use padding rows over absolute positioning (discussion #872 — absolute rows break sticky columns). |
| **8 — KPI/empty/skeleton: keep what we have** | All in `foundation/`. §5.1 already specifies StatTile's rebuild (no border, no bg, `p-0`). |
| **9 — Landing** | Different repository. Any marketing-block work belongs in `github.com/Quantx1/landing` and should be scoped there against *that* repo's stack. |

---

## 5. AVOID

**React 19 only**
- **shadcn's own June-2026 chat components** (`message-scroller`, `bubble`, `marker`) — https://ui.shadcn.com/docs/changelog/2026-06-chat-components. **The single most important negative finding**, because `message-scroller` is exactly what you'd reach for. `npm view @shadcn/react peerDependencies` → `{"@types/react": ">=19", "react": ">=19"}`, and `@shadcn/message-scroller` lists `@shadcn/react` as a dependency. Hard block on our exact-pinned 18.2.0. (`@shadcn/message` alone reports no such dep and may be portable — the scroller, the valuable part, is not.) Revisit only after a React 19 upgrade.
- **Untitled UI React** — https://www.untitledui.com/react/docs/introduction. Own docs state React v19.2 + Tailwind v4.3 + React Aria v1.19. No partial-adoption path.
- **abderrahimghazali/shadcn-fintech** — next 16.2.3 / react 19.2.4 / tailwind ^4 / recharts 3.8. Fails all three filters.
- **tablecn** — https://github.com/sadmann7/tablecn. react ^19.2.7 / next ^16.2.9 / tailwindcss ^4.3.1. Read its nuqs URL-state filter patterns; don't install.

**Tailwind v4 only**
- **Coss UI** (Origin UI's successor) — https://coss.com/ui. `number-field.json` imports `@base-ui/react` (Base UI, not our Radix base) **and** uses `shadow-xs`. This is a Base UI + Tailwind v4 registry.
- **`@assistant-ui/styles`** — the *styles package only*; the library itself is fine. `src/styles/index.css` opens with `@reference "tailwindcss"`, `@custom-variant`, `@theme`, `@import "tailwindcss/theme.css" layer(theme)`, precompiled against tailwindcss 4.1.18. Cannot be restyled from a v3 config.
- **Tremor Raw** — https://tremor.so. Install docs, verbatim: *"Tremor Raw is designed for React v18.2.0+ and requires Tailwind CSS v4.0+."*
- **Shadcnblocks premium templates** — vendor docs state Next 16 / Astro 6 + React 19 + Tailwind 4, *"the Tailwind 4 upgrade has already rolled out across every block"* — v3 output no longer offered.
- **Silent-failure classes generally.** Grep every copied file for `shadow-xs`, `field-sizing`, `outline-hidden`, `not-last:`, `bg-linear-to-*`, `ring-3`, `animate-in`, `fade-in-*`, `slide-in-from-*`, `zoom-in-*`. All produce **no CSS and no error**. Note `rounded-xs` is *not* in that list — `tailwind.config.ts` defines `borderRadius.xs = 6px` deliberately per `REDESIGN-VISUAL.md` §2.1 (one report calls this "luck"; it is a decision).

**Broken / doesn't install**
- **ReUI `data-grid-table-virtual`** — https://reui.io/components/data-grid. Sold across two reports as a "near-zero-dependency drop-in." It is not. Following the 307 the survey missed: 959 lines, `registryDependencies: ["@reui/data-grid", "@reui/data-grid-table", "spinner"]`. `https://reui.io/r/spinner.json` returns **HTTP 401**. `@reui/data-grid` drags `@base-ui/react` + four `@dnd-kit` packages, contains `shadow-xs` and `outline-hidden`, and imports `@/app/(create)/components/icon-placeholder` — a path into ReUI's own marketing app. **That top pick collapses**, and it targeted a surface we already own.
- **ReUI `number-field` / `tree`** — same broken `icon-placeholder` import.
- **KokonutUI `ai-prompt`** — https://kokonutui.com/r/ai-prompt.json. Correct verdict, wrong stated mechanism: the registry *does* ship `anthropic.tsx`/`anthropic-dark.tsx`, but targets them to `components/kokonutui/` while the component imports `@/components/icons/`. Path mismatch breaks the build. Also imports `motion/react`.
- **`motion` as the fix for `motion/react` imports** — `npm view motion dependencies` → `{ tslib, "framer-motion": "^12.43.0" }`. It doesn't "sit alongside" framer-motion 10; it installs a **second framer-motion major**. Rewrite the handful of imports instead.

**Licence**
- **@shopify/polaris-tokens** — https://github.com/Shopify/polaris. **Legal blocker.** npm reports `SEE LICENSE IN LICENSE.md` so a naive audit reads it permissive. The file is MIT text plus: *"The rights granted above may only be exercised to develop and distribute applications that integrate or interoperate with Shopify software or services…"* An NSE/BSE trading product has no licence. Also 17 months stale.
- **ApexCharts / react-apexcharts** — https://github.com/apexcharts/apexcharts.js. Dual-licence; Community free only under **$2M USD annual revenue**; the treemap/heatmap/gauge you'd want are the gated part. The MIT React wrapper is the trap.
- **Lobe Chat** — https://github.com/lobehub/lobe-chat. LICENSE is *"LobeHub Community License … All rights reserved"* — source-available, not OSI. Every listicle calling it MIT is wrong.
- **DariusLukasukas/stocks** — https://github.com/DariusLukasukas/stocks. **AGPL-3.0.** Painfully perfect stack match (next ^14.1.4 / react ^18 / tailwind ^3.3 / recharts ^2.12.4), which is exactly why it needs flagging. Ideas only, no code.
- **aryanvichare/stocks** — https://github.com/aryanvichare/stocks. **No LICENSE file** (GitHub licence API 404s; root tree has none) despite multiple blogs calling it "fully open-source under MIT." No licence = all rights reserved.
- **Anything in `cosscom/coss` outside `apps/origin/**` and `apps/ui/**`** — root LICENSE is AGPL-3.0.

**Unmaintained**
- **@tremor/react** (npm package) — 217 KB gzip for a sparkline; last publish 2025-01-13; runtime-locked. Copy from the Apache-2.0 source repo instead.
- **jakobhoeg/shadcn-chat** — pushed 2025-08-12; `https://www.shadcn-chat.dev/r/registry.json` returns **HTTP 000** (DNS/connection failure); predates the `message.parts` model entirely.
- **react-financial-charts** — npm v2.0.1 published 2023-05-13; repo pushed 2024-03-09. Three years dead, still in every 2026 listicle.
- **LangUI** (2024-07-10, static snippets, no React logic), **@llm-ui/react** (2025-02-11; peer `react ^18.0.0` **only**, so it would block a future React 19 upgrade), **react-sparklines** (2022-07-13), **@react-sandbox/sparkline** (2023-08-24), **@chatscope/chat-ui-kit-react** (own SCSS design system, not Tailwind-restyleable), **@park-ui/panda-preset** (2024-11-22, requires Panda CSS alongside Tailwind), **@klinecharts/pro** (2023-03-23, built on **solid-js**), **@geist-ui/core** (2022, unrelated to Vercel — `@vercel/geist` and `@vercel/geist-ui` do not exist on npm).
- **openalgo-heatmap** — https://github.com/marketcalls/openalgo-heatmap. MIT, zero deps, peer `react >=18`, genuinely NSE-Nifty-500-shaped — but **4★, created and last pushed 2026-06-09, 3 total commits**. If ever needed, vendor the file; never take the dependency. Moot anyway: our SectorHeatmap already ships.

**Architecture / hype**
- **assistant-ui, CopilotKit, Tambo AI** — all React-18-compatible at the package level (assistant-ui's `react-ai-sdk@1.4.3` even depends on `ai ^7.0.37` + `@ai-sdk/react ^4.0.40`, matching us exactly — the best-aligned library in the survey). **Irrelevant**, because each replaces the `useChat` + `DefaultChatTransport` + typed custom-data-part pipeline already built here. `lib/copilot/ui-message.ts` documents itself as "the client half" of `backend/ai/agents/ui_stream.py` so "a shape change on either side is a TypeScript error rather than a blank panel." Adopting `AssistantRuntimeProvider` or `CopilotRuntime` discards that contract. assistant-ui also nests duplicate zustand ^5 (we run ^4.5), zod ^4 (we run 3.25.76) and unified `radix-ui` (we use individual packages).
- **streamdown** — Apache-2.0, peer `react ^18||^19`, genuinely good at mid-stream markdown. **453 KB min / 138 KB gzip, 16 transitive deps including mermaid**, for a product whose §4.2 removes the GFM table path entirely and whose §4 states *"Never a chart in the reply body."* We already ship react-markdown ^9.1.0 + remark-gfm ^4.0.1 + rehype-sanitize ^6.0.0 + shiki ^1.29.2. If you copy an AI Elements file, strip the streamdown import.
- **`npx shadcn add chart` / any `@shadcn` chart-* block** — the registry item pins **`recharts@3.8.0`**; we run 2.15.4 with `components/ui/chart.tsx` already vendored. recharts 3 peer-supports React 18 so **npm will not warn** — it installs and breaks at runtime (`layout` removed from `<Bar/>`, `activeIndex` removed, `margin` requires all four sides, `<Customized/>` loses internal props). **Escape hatch, verified:** `https://ui.shadcn.com/r/styles/default/chart.json` still returns `dependencies: ["recharts@2.15.4","lucide-react"]` — our exact version. Also **pin `"recharts": "2.15.4"` without the caret**.
- **@glideapps/glide-data-grid** — canvas rendering means no DOM: Tailwind classes, CSS-variable theming, text selection and native a11y all stop applying. Peer-capped at React 18 (no 19); v6.0.3 published 2024-02-03.
- **AG Grid / AG Charts** — MIT wrappers are the trap. Candlestick/OHLC is AG Charts **Enterprise $499/dev**; AG Grid Enterprise **$999/dev**. Own theming system fights our tokens.
- **Highcharts Stock** — from ~$833/dev, plus a separate SaaS+ licence per developer for hosted apps. The MIT `highcharts-react-official` wrapper does not make Highcharts free.
- **@radix-ui/themes as a library** (the `--scaling` *idea* is worth stealing) — ships component CSS at specificity (0,1,0); Tailwind v3 emits `@tailwind` output after imported CSS regardless of order, so Preflight's button reset strips Radix Themes button backgrounds (radix-ui/themes#109). Every workaround is a load-bearing hack.
- **FINOS Perspective** — not a quality rejection (Apache-2.0, 11k★, pushed 2026-07-28). A WASM web component with documented Next.js webpack/WASM pain, and visually a spreadsheet. Revisit only past ~100k streaming rows.
- **react-ts-tradingview-widgets** — embeds TradingView's hosted iframes: unstylable, TradingView-branded, ToS-bound.
- **OpenCharts (dylanpersonguy)** — description claims "Next.js + Express + PostgreSQL + Redis"; `package.json` is Vite 6 + react-router 7 + React ^19 with none of those four. Its "custom Canvas 2D engine" plugins closely mirror TradingView's own Apache-2.0 `plugin-examples`. Take those from TradingView directly.
- **Paid full-stack SaaS boilerplates** (Makerkit, ShipFast, Achromatic, next-forge) — all Next 16 + React 19 + Tailwind v4, and all sell auth/billing/multi-tenancy we already have via Supabase. **None ships a single one of our nine surfaces.**

---

## 6. THE SHORTLIST — three things, this week, in this order

**1 — `npm i use-stick-to-bottom`, rip out both force-scroll paths.** (~half a day.)
Delete the `scrollIntoView` in `app/(platform)/copilot/page.tsx:406` (its `streamN` dep ticks every 14ms) and the `scrollTo(scrollHeight)` in `components/copilot/CopilotProvider.tsx:277`. Wrap the thread in `<StickToBottom>`, drive the scroll-to-bottom button off `useStickToBottomContext().isAtBottom`. This is the only item in the entire survey that removes more code than it adds, and the bug survives §5.6's typewriter deletion, so it is not blocked on that. MIT, zero runtime deps, peer explicitly includes `^18.0.0`.

**2 — Ship the entity card from in-repo parts.** (~1 day.)
`REDESIGN-VISUAL.md` §4.1 is a 7-row anatomy table with a reference sketch. `foundation/Card` + `ui/StockAvatar` (in a 40×40 `rounded-sm bg-surface-2` tile) + `lib/format.ts` (en-IN) + `Sparkline` + `ChangeBadge` + `Verdict` + two `Button`s. Optionally lift Tremor's `Tracker.tsx` (104 lines, Apache-2.0, Radix hover-card) for the signal bar. **Do not install kibo `ticker`** — reasons in §2. This is the highest-visibility surface with the shortest path and unblocks Panel B and the chat artifact renderer.

**3 — Delete the duplicate `components/scanner/SectorHeatmap.tsx` and lock the guardrails.** (~half a day.)
Already flagged in `DESIGN.md` §1.10. Then, in the same pass, make the traps unrepeatable: pin `"recharts": "2.15.4"` (drop the caret); add an ESLint/CI grep failing on `shadow-xs|field-sizing|outline-hidden|not-last:|bg-linear-to-|ring-3|animate-in|fade-in-|slide-in-from-|zoom-in-` in `components/**`; add a lint rule banning raw `text-green-*`/`text-red-*` in favour of `--color-up`/`--color-down`; and check the read-only `registries` block from §2 into `components.json` with the "never `add`" comment. Cheap, and it converts three of the survey's silent-failure findings into build errors.

**Explicitly not on the shortlist:** anything from AI Elements, any registry install, any treemap/blotter/KPI library. `REDESIGN.md` §7 puts ~30 of 90–115 engineer-days on backend work (2.1 message persistence, 2.2 the entity artifact type, 2.3 the template renderer, 2.5 the metering redesign), with Phase 3 explicitly *"Gated on 2.1 + 2.2."* **No registry shortens that path.**

---

## 7. COST SUMMARY — paid options

| Option | Price (verified) | Verdict |
|---|---|---|
| **Tailwind Plus** — https://tailwindcss.com/plus | Personal **£219**, Teams **£699** (25 seats), one-time + local taxes, 30-day refund | **Skip for this repo.** Surface 9 lives in `Quantx1/landing`. Site states everything is now built for Tailwind v4.3; whether v3 downloads remain available to licence holders is **UNVERIFIED**. Catalyst is Headless UI, not Radix. Best designs in the survey — reconsider *for the landing repo only*, and only after confirming v3 availability. |
| **Tailark** — https://tailark.com/pricing | Free tier $0 · Essentials **$249** · Complete **$299** · Team **$499** (10 seats), one-time | **Skip.** Multiple 2026 listicles still call it "MIT and free" — stale. `https://tailark.com/r/hero-section-1.json` returns `{"error":"Sign in with a plan that includes blocks…"}`. Registry is auth-gated so per-block v3 compat is **UNVERIFIED**. Marketing blocks only. |
| **Shadcnblocks** — https://www.shadcnblocks.com/pricing | ~**$49–$199**; templates ~$79 (**approximate — UNVERIFIED against live checkout**) | **Skip.** Vendor docs state Next 16 / Astro 6 + React 19 + Tailwind 4 across every block; v3 output no longer offered. Marketing only. |
| **Magic UI Pro** — https://pro.magicui.design | **$199** one-time, perpetual, lifetime updates | **Skip.** Free registry is MIT and fine for the landing repo; the animated majority imports `motion/react` (absent) and is the opposite of a calm near-white brief. Pro's React/Tailwind versions are stated nowhere public — **UNVERIFIED**. |
| **AG Charts Enterprise** — https://www.ag-grid.com/charts/ | **$499/dev** perpetual (candlestick/OHLC is Enterprise-only) | **Skip.** The one feature we'd want is the paid one, and its theming is its own system. |
| **AG Grid Enterprise** | **$999/dev** | **Skip.** TanStack Table + Virtual already installed and headless. |
| **Highcharts Stock** — https://www.highcharts.com/products/stock/ | from **~$833/dev**, per-developer, **plus** a separate SaaS+ licence per dev for hosted apps | **Skip.** Real recurring cost; runtime-locked options-object API. |
| **SaaS boilerplates** (Makerkit $349–649, ShipFast $199–299, Achromatic $180, next-forge from $69) | as listed (vendor pages; individual checkouts **UNVERIFIED**) | **Skip.** Wrong stack *and* wrong problem — none ships any of our nine surfaces. |
| **shadcn.io Pro blocks** | Pro tier gated; exact price not shown on block pages — **UNVERIFIED** | **Skip.** Their own page states *"Shadcn.io is not affiliated with official shadcn/ui."* Paying a third party for a stock card we can build in an afternoon, on our most-restyled component. |

**Total recommended spend: £0 / $0.** Every adopt-now item is MIT or ISC.

---

## STILL UNVERIFIED — flagged explicitly

- **`@cult-ui` and `@motion-primitives`** — both are built-in shadcn CLI namespaces (so the registries are real and correctly wired) and both are MIT (GitHub API: `nolly-studio/cult-ui`, `ibelick/motion-primitives`). **Contents and v3/React-18 status unknown.** Both endpoints returned HTTP 429 with an identical Astro rate-limit page from the same edge (lhr1), reproduced independently on a different network. Not guessing. Retry later.
- **Aceternity UI licence** — components are free to copy and widely used, but no explicit SPDX file was located; they also sell a paid Pro tier. Moot for us (landing-only), but do not assume MIT if the landing repo reaches for it.
- **Kibo UI's post-acquisition free/paid boundary** — the project moved from `haydenbleasel/kibo` to `shadcnblocks/kibo` in Oct 2025. Whether any components have since moved behind the paid Shadcnblocks tier is unconfirmed.
- **`lightweight-charts` v4 → v5** — not scheduled here, but note v4 is a dead branch (last release 4.2.3, 2025-01-23) and *every* usable version of the only maintained React binding (`ukorvl/lightweight-charts-react-components`) requires `lightweight-charts >=5 <6`. If you ever adopt it, **pin `>=2.4.0`** — versions 2.0.0–2.3.0 pin `react ^19.2.5` and would break the build; 2.4.0 relaxed to `>=18.2 <20`. Next 14 App Router/SSR support for that wrapper is **UNVERIFIED**; assume `'use client'`.
- **Tailwind Plus v3 availability for licence holders** — could not confirm from public pages. Decisive for whether it is worth £219–£699 for the landing repo.