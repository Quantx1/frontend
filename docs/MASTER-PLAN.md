# QUANT X — MASTER PLAN

*The single plan, assembled from this session's work: 4 agent workflows (48 agents,
~5.7M tokens), 55 routes audited page by page, and 8 commits already shipped.*

Detail lives in four companion documents. This one is the map.

| Document | What it holds |
|---|---|
| `REDESIGN.md` | The build document — rulings, diagnosis, 55-route triage, page-by-page redesign, build sequence |
| `REDESIGN-IA.md` | Information architecture — nav, mode chips, panel faces, redirect map |
| `REDESIGN-VISUAL.md` | Type scale, density tiers, card anatomy, motion rules, light-default |
| `UI-SOURCING.md` | What to adopt, copy, build ourselves, avoid — with compatibility proofs |

---

## 1. WHERE WE ARE

Eight commits on two branches. Working trees clean, tsc clean, lint at the 6-warning
baseline, 22 Python tests passing. Nothing pushed.

**`frontend` → `feat/terminal-redesign-and-ai-sdk`**

| Commit | What |
|---|---|
| `f6c268f` | Design system v5 "Instrument" + 19 shadcn primitives |
| `9820f0f` | Safety: kill-switch copy + partial-failure rendering, honest backtest hero |
| `2e4d321` | `lib/format` — 91 inline sites swept, 5 crore helpers unified, 13 tests |
| `55eac98` | AI SDK v1 client layer (types, transport, selectors) |
| `f56d88c` | Copilot dock migrated to `useChat`, browser-verified |
| `99875bc` | The 55-route audit |
| `6750a9c` | The UI ecosystem research |

**`backend` → `feat/ai-sdk-protocol-and-autonomy`**

| Commit | What |
|---|---|
| `ae3f44b` | `trading_mode` enforcement on the AutoPilot rebalance path + 9 mutation-verified tests |
| `592a242` | AI SDK v1 UI-message stream behind a `protocol` flag + 13 golden tests |

---

## 2. WHAT WE GOT WRONG, AND CORRECTED

Recorded because each correction changed the plan.

| Claim | Reality |
|---|---|
| "The AutoPilot fix closed a live safety hole" | The path fixed was **retired 2026-07-23**; its scheduler job is commented `# do not re-enable`. The live path (`scheduler.py:3149`) already enforced `trading_mode`. The fix hardens a dormant engine — real, but not the live fix claimed. |
| "None of this work is in version control" | False. `frontend/`, `backend/`, `landing/`, `ml/` each have their own repo with a GitHub remote. The check ran from the QuantX root, where git walks up to `/Users/rishi`, which excludes `QuantX/`. |
| "Wiring `PATCH /dsl` turns refinement into a diff" | `registry.py:197-203` **overwrites the whole `dsl` column** — it is a replace, not a patch. A true diff is backend work. |
| "The fold strip shows out-of-sample evidence" | The "walk-forward" is **time-segmentation of a single in-sample run**, not anchored/rolling walk-forward. The label must match. |
| "AI Elements is the win" | Compatible, but its `tool`/`reasoning`/`sources` are typed against native `ToolUIPart`/`ReasoningUIPart`/`SourceUrlUIPart` — our backend emits **zero** of those. Adopting it also re-installs the four-provenance-strip defect and drags back 11 deleted duplicates. |
| "The formatter module kills 27 duplicate formatters" | No call sites had been migrated at the time. The real surface was ~60 named + 97 inline. |

---

## 3. THE PRODUCT MODEL

> **Quant X is one conversation with an Indian-market analyst that has already done the
> work.** You ask in plain English; it answers in two paragraphs and one card carrying a
> verdict — and everything that produced that verdict is one click behind a collapsed
> line, or one click into a right-hand panel. Never on screen unasked.
>
> Four destinations, because four questions matter: **New Chat · Markets · Book ·
> Library** — *what do I ask, what is the market doing, what do I hold, what can I start
> from.*
>
> The models do not shrink by one line of Python. They stop being the wallpaper.

**55 routes → 9 consumer URLs. Zero 404s.**

---

## 4. THE DIAGNOSIS, IN NUMBERS

| Surface | Rendered before the user asks anything |
|---|---|
| `/markets` | 18–25 panels · 250+ values · **19 requests**, one LLM-billed |
| `/stock/[symbol]` | 38 surfaces · 15–19 unprompted requests · **zero AI output above 810px** |
| `/copilot` (the front door) | 12 cards + a 108-cell tape · **~320 live numbers**, polling every 20–30s |
| `/scanner` | 38 tiles · 29 gauges · 8 headings · **0 answers** |

Plus: **four provenance strips** on every reply, three saying "here is what I touched" in
three visual languages · **five near-identical 4-up KPI strips** across
portfolio/trades/paper/risk/fno · **three surfaces editing the same four risk numbers**
via three endpoints under three field names · **four kill/pause controls** on one endpoint.

Broken, not merely dense: `/signals/index-momentum-30` can never render (`categoryOf()`
never returns `'momentum30'`) · `/inbox/[id]` ships *"Plan 3 wires this to
/api/notifications/{id}"* to users · **2,206 LOC with zero importers**.

---

## 5. WHAT "AGENTIC" HONESTLY MEANS HERE

Verified against the backend. **Frame as a supervised assistant with a small,
human-confirmed action set — never as an autonomous agent that watches markets for you.**

**Real today**
- `AutoPilotSupervisor` — 4 IST windows (06:30 · 5-min intraday · 15:35 · 23:30),
  registered at boot, persisting a `WindowReport` per fire. **Zero frontend readers.**
- Proposal → approval: `trades.status='pending'` + `POST /trades/{id}/approve`, already
  rendered on `/trades`.
- 18 copilot tools, **all read-only**. Up to 3 per round, ≤2 retry rounds.
- 5 action kinds the agent may propose: `watchlist_add`, `watchlist_remove`, `run_screen`,
  `place_order`, `create_strategy_draft`.

**Not real — do not draw UI for it without building it first**
- No **reject** endpoint. No user-visible **expiry** (`trades` has no `expires_at`).
- No agent-authored **alerts or monitors**. No `create_alert` action. `saved_scans` stores
  `scanner_ids INTEGER[]` — prebuilt IDs, not a natural-language condition.
- No **user-creatable schedules**. All ~56 jobs are hardcoded.

**The vibe-trading loop — three of five links real**

| Link | Status |
|---|---|
| Describe → generate | **REAL.** NL→DSL, 86 indicators, strict schema rejects inventions. Chart-image → draft also real. |
| See it run | **REAL** but mislabelled — time-segmentation of one in-sample run, not walk-forward. |
| Refine in English | **FALSE TODAY.** No edit path at all. `PATCH /dsl` has zero callers *and* is a replace. Free tier gets 1 `strategy_gen`/day. |
| Does it compile | **REAL.** 7-check gate, human-readable failures. |
| Ship | **REAL,** but the Builder's "Deploy Live" button can never succeed. |

**Three rules the design panel converged on**

1. **The Ledger Rule** — a row may only display columns its writer can prove.
2. **REPORTED vs ANALYSED** — two permanent visual registers. A REPORTED turn contains
   zero LLM-composed sentences; every string is a literal DB column.
3. **Navigation is never metered** — classify every surface by whether it calls
   `_enforce_copilot_cap`.

---

## 6. THE PLAN

### Now — the shortlist (~2 days, no dependencies)

| # | Work | Effort |
|---|---|---|
| 1 | `use-stick-to-bottom`; delete both force-scroll paths (`copilot/page.tsx:406` fires on a **14ms** typewriter counter; `CopilotProvider.tsx:277`) | ½d |
| 2 | Ship the **entity card** from in-repo parts — `REDESIGN-VISUAL.md` §4.1 | 1d |
| 3 | Delete the duplicate `scanner/SectorHeatmap.tsx`; add CI greps for silently-dead Tailwind classes; pin `recharts` | ½d |

### Phase 0 — free wins, no coordination, no flag · 8–10d

Delete 2,206 LOC of zero-importer code · shell compliance footer · radius codemod
(~1,200 mechanical sites) · motion kill list · ESLint bans · fix
`AlertPreferencesGrid` white-on-white (lines 76, 110) · fix the 21 dead animation classes
in `ui/sheet.tsx` and `ui/dropdown-menu.tsx`.

### Phase 1 — typography · 4–5d
11 type roles, 11px floor.

### Phase 2 — backend, fully parallel to 0–1 · 20–27d
`copilot_messages` migration · `entity` artifact type · **the template renderer**
(deterministic prose + card from REST, zero tokens — the keystone) · order-preview
endpoint · **the metering redesign** · monitors (table + NL compiler + evaluator +
scheduler + `create_alert`).

### Phase 3 — the thread · 10–12d
Gated on 2.1 + 2.2.

### Phase 4 — the atomic cut · 15–20d, one branch
55 routes → 9. **Gate: a non-admin free account completes J1+J2+J3 without a 402.**

### Phase 5 — panel & terminal · 25d
### Phase 6 — light default · 3d

### 🔴 The riskiest step
**Phase 2.5, the metering redesign** — and the rule that nothing in Phase 4c ships before
it merges. Free tier is 5 chat msgs/day; three of five mode chips map to buckets that are
**0** for the tier being shown the chip. `_enforce_copilot_cap` returns early for
`is_admin`, so **the team building this never sees the wall.** And it is not revertable by
dropping a branch — by 4c the deterministic surfaces it replaced are deleted and 301'd.

---

## 7. WHAT WE WILL NOT BUILD

**Absent from the backend — building UI for it would be fake AI:** parameter
optimisation · Monte Carlo · sensitivity analysis · backtest progress streaming ·
Sortino · expectancy · monthly-returns grid · drawdown time series.

**Rejected on principle:** return-claim heroes in any form (including our own annualised
projection, already removed) · fully-autonomous execution as a user-selectable mode ·
hidden internal retry loops the user cannot distinguish from a clean first pass ·
ranking a large pre-computed backtest corpus (a multiple-comparisons machine) ·
`Deployed Users 2011`-style social proof (we have no honest number, and it nudges herding).

**From the UI survey:** AI Elements · any registry install · any treemap/blotter/KPI
library. No registry shortens the path, because ~30 of 90–115 engineer-days are backend.

---

## 8. HOW WE VERIFY

`npx tsc --noEmit` clean · `npm run lint` ≤ 6 warnings, 0 errors · `node
scripts/validate-theme.mjs` ALL PASS · `npx tsx lib/format.test.ts` 13 checks ·
`pytest tests/ai/test_ui_stream.py tests/trading/test_autopilot_autonomy.py` 22 passing ·
`npx tsx scripts/verify-copilot-protocol.mts` 16/16 chunks valid against the SDK's own
schema · Playwright at 390 / 1024 / 1440, dark + light, `prefers-reduced-motion`.
