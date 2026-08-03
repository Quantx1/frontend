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

**36 frontend + 8 backend commits, all pushed.** Working trees clean. Gates green:
`tsc` clean · lint **4** warnings / 0 errors (was 6) · `validate-classes` 296 files 0
violations · `validate-theme` ALL PASS · 13 format checks · **1,200 Python tests**
· `verify-copilot-protocol` 15–16/16 chunks valid against the AI SDK's own
`uiMessageChunkSchema`.

**Phase 0 CLOSED · Phase 2 COMPLETE (2.4 engine only) · Phase 3 SHIPPED ·
§4.4 `/markets` SHIPPED.** Open: 2.6 monitors, Phase 1 (typography), the rest
of Phase 4 (the 55→9 route cut), Phases 5–6.

**Three surfaces now render deterministically, from one component.** `/markets`
(192ms), `/portfolio` (579ms) and `/signals` (217ms) all use `RenderedSurface`
with a different template key and nothing else. **Zero chat credits between
them.** §4.5 counts "20 KPI tiles across five routes"; nine are gone.

The empty states are the part the tiles could not do. Five "—" cells read as a
broken page; "No signals are active today — that's the engines finding nothing
worth flagging, not an outage" says what happened. Same distinction the book
surface draws between an empty book and a failed positions query, which the old
tiles rendered identically as "₹0 · 0 positions".

**81 new tests across Phase 2, and 21 mutations confirming they bite.** Every
guard in this phase was mutation-tested — the two that matter most are "the
render route cannot reach the credit limiter" and "the sentiment word is never
translated into a buy/sell call", and both fail loudly when reverted.

**`frontend` → `feat/terminal-redesign-and-ai-sdk`**

| Commit | What |
|---|---|
| `f6c268f` | Design system v5 "Instrument" + 19 shadcn primitives |
| `9820f0f` | Safety: kill-switch copy + partial-failure rendering, honest backtest hero |
| `2e4d321` | `lib/format` — 91 inline sites swept, 5 crore helpers unified, 13 tests |
| `55eac98` | AI SDK v1 client layer (types, transport, selectors) |
| `f56d88c` | Copilot dock migrated to `useChat`, browser-verified |
| `99875bc` `6750a9c` `d05c096` | The 55-route audit, the UI ecosystem research, this plan |
| `a0c81f1` `e331c93` | `StickToBottom` on both chat surfaces — the main-chat effect fired on a **14ms** typewriter counter |
| `83403a6` | EntityCard + the v6 type scale, and the `cn()` fix (tailwind-merge was silently dropping every custom font-size role) |
| `0828810` | 21 inert overlay animations revived + `validate-classes` guard (mutation-tested) |
| `38b5d23` | Bounded the Supabase session lookup — a stalled refresh froze **every** authed call |
| `5b04bf6` | Deleted 2,183 lines of unreachable code |
| `83987e9` | AlertPreferencesGrid light-mode invisibility ⚠️ **not visually verified** |
| `c3dff00` | Radius codemod — 1,283 sites, pixel distribution proved identical |
| `47ccf6f` | The "not SEBI-registered" statement now reaches all ~50 authed routes, was on 1 |
| `9248186` | Dropped 5 always-on ping rings; kept the one that means something |
| `6ce05ab` | 38 ad-hoc pulsing placeholders routed through `<Skeleton>` (66 → 28) |
| `145cbbf` `a8f4ade` `3769426` | Two dead `useMemo`s · the sub-11px type ratchet · Phase 0 closed |
| `b4e635a` | Typed the restored render state on the conversation reader (2.1) |
| `9170788` | The `entity` artifact rendered — and the verdict vocabulary fixed (2.2) |
| `e44953a` | Render transport: same `useChat`, zero chat credits (2.3) |
| `638256d` | `llmCaps` / `capFor` / `isLockedFeature` — lock a zero, don't 402 on it (2.5) |
| `8c5a904` | **Phase 3** — one card, one disclosure, one honest thinking line |
| `59831fb` | A raw tool name reached the UI — the firewall closed properly |
| `43e5591` | `votesNoun` — an index counts constituents, a stock counts indicators |
| `793d384` | **§4.4** — `/markets` answers, then stops. 802 lines cut, 192ms |
| `97b6163` | **§4.5** — `/portfolio`: one sentence for four KPI tiles |
| `7167b15` | **§4.5** — `/signals`: one sentence for five KPI tiles |
| `441cee3` `+1` | Plan updated: Phase 2 record, the riskiest step closed, 2.4 status |

**`backend` → `feat/ai-sdk-protocol-and-autonomy`**

| Commit | What |
|---|---|
| `ae3f44b` | `trading_mode` enforcement + 9 mutation-verified tests |
| `592a242` | AI SDK v1 UI-message stream behind a `protocol` flag + 13 golden tests |
| `fce4b1a` | `complete_schema.sql` Part B was **11 migrations stale** — regenerated |
| `5dbe7ba` | **2.1** — persist what a turn DREW, not just what it said |
| `8f84071` | **2.2** — the `entity` artifact + `get_verdict`, and the word it must not say |
| `4d4c703` | **2.3** — the template renderer. Navigation without the meter |
| `6db3a2a` | **2.5** — admins are exempt from the block, not from the counter |
| `6e9c617` | **2.4** — charge-preview engine; refuses to guess a rate it cannot source |

### Phase 2 — what shipped, and what it proved

| Sub-phase | Shipped | Proof |
|---|---|---|
| **2.1** persistence | `copilot_messages` + artifacts/steps/citations/followups · `render_state.py` (pure) · writer + reader each with one bounded pre-migration fallback | 13 tests, 4 mutations · protocol replay 16/16 valid |
| **2.2** entity artifact | `get_verdict` (wraps the day-cached technical panel) · `build_artifacts` branch · `technical_panel` gains `series`/`change` | 14 tests, 4 mutations · live replay 15/15 · browser-verified 6.5:1 contrast |
| **2.3** template renderer | `POST /ai/copilot/render` · 4 templates · same meta→token→done dialect, so `ui_stream` and the client are unchanged | 27 tests, 5 mutations · **0 LLM calls across 4 live renders**, counted on the provider log |
| **2.5** metering | Admins consume but are never blocked · `llm_caps` + usage on `/api/user/tier` · 402 carries `resets_at` | 10 tests, 3 mutations · live: 4 renders → counter 0, 1 chat → counter 1 |
| **2.4** charges | `POST /api/trades/preview-charges` · GST base, side-specific STT, flat DP, buy-side stamp duty · statutory and brokerage as separate tables | 17 tests, 5 mutations · rates unsourced ⇒ rows decline rather than estimate |

**Three things Phase 2 corrected that the plan had not anticipated:**

1. **The verdict word was a compliance problem.** `EntityCard` shipped with
   `Buy | Accumulate | Neutral | Reduce | Sell`, copied from a competitor
   screenshot. Those are recommendations, and we are not a SEBI-registered
   Research Analyst. The backend had already settled this —
   `technical_panel.py` specifies "bullish / bearish / neutral language only,
   never buy/sell" — so the card now speaks the backend's words and
   `build_artifacts` passes the label through untranslated.
2. **`get_current_regime` fabricated a regime.** With `regime_history` empty it
   returned `{"regime": "bull", "prob_bull": 1.0, "source": "fallback"}` — a
   100%-confidence bull call, invented, indistinguishable downstream from a
   real one, narrated by the responder and cited as a consulted entity. Now
   `available: False`.
3. **`complete_schema.sql` Part B was 11 migrations stale**, dating to
   2026-06-22. Existing deployments were fine (they apply the per-PR directory
   against the `schema_migrations` tracker); the gap only bit a fresh one-file
   install, which is the documented path in `DEPLOYMENT.md:129`.

**⚠️ Not applied:** `2026_08_03_pr_copilot_message_render_state.sql` is written
and consolidated but has NOT been run against Supabase. Both the writer and the
reader fall back to the base column set, so the code is correct in either
state — a pre-migration deployment keeps its threads and loses only the cards.

### Still open

- ~~`AlertPreferencesGrid` light-mode fix is unverified~~ **VERIFIED.** The reason it
  never rendered is that **`/alerts` redirects to `/copilot`** — a routing fact, not a
  failure. Measured instead by rendering the component's exact markup in the live light
  theme: card background is pure `rgb(255,255,255)`, the old `text-white` scores **1.00**
  contrast (invisible, as suspected) and the new `text-d-text-primary` scores **16.86**
  (AA needs 4.5). Residual nit: the toggle's off-state track (`bg-surface-2`) sits at
  **1.08** against the card, so it reads only via its `border-line` edge — acceptable,
  but it is carrying the whole affordance.
- ~~`/alerts` redirects to `/copilot`~~ **RETRACTED — this was not a bug.** `/alerts`
  serves HTTP 200 with an empty redirect location, and `middleware.ts` passes it through
  untouched. The bounce came from the test browser's own degraded Supabase session:
  `/alerts` → client auth check fails → `/login?redirect=…` → `login/page.tsx:50`
  `router.push('/copilot')`. A stale browser session, not a routing defect. Recorded
  because it was committed as a finding for one commit before being checked.
- **16 `pr/*` branches unpushed** — bulk branch creation was blocked. Convenience only;
  every commit is on the remote via the working branch.
- **Phase 0 is CLOSED.** `animate-pulse` went 66 → 7, and the 7 that remain are correct:
  two streaming text cursors, one `status === 'streaming'` gate, four wrappers that pulse
  around content rather than standing in for it. `animate-spin` was reviewed and closed
  rather than swept — 102 of 107 are gated on a real loading condition; the other 5 are
  hand-rolled border rings that do not map onto `<Spinner>`'s size scale, so converting
  them would change pixels to fix nothing.
- **Three ratchets now hold the line** (`scripts/validate-classes.mjs`): `animate-pulse` 7,
  `animate-spin` 107, sub-11px type 565. None may grow; each prints the new count and asks
  you to lower the baseline when it drops.

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

### Phase 2 — backend · **2.1, 2.2, 2.3, 2.5 SHIPPED**

~~`copilot_messages` migration~~ · ~~`entity` artifact type~~ · ~~**the template
renderer**~~ · ~~**the metering redesign**~~ · **2.4 engine shipped**,
rates withheld · **still open:** monitors (2.6 — table + NL compiler +
evaluator + scheduler + `create_alert`).

**2.4 is finished except for five numbers.** The composition is done and
mutation-tested — GST rides on the services and never on STT or stamp duty,
stamp duty is buy-side only, the DP charge is flat rather than a rate, a sell
subtracts charges where a buy adds them. What is missing is the rates
themselves: two sources gave two different NSE equity transaction charges
(0.0030699% vs 0.00322%) and neither was an exchange circular. Since the bar
for these rows is ±₹1 against a real contract note, an unverified rate is
treated as a missing one — `RATES_VERIFIED` is False, the endpoint returns
Order value and declines to itemise, and the ticket omits Charges/Net exactly
as §4.6 specifies. Filling the table from primary circulars and flipping one
boolean is the whole remaining task.

**The Phase 4c gate is mechanically satisfied.** `/ai/copilot/render` cannot
reach the credit limiter — asserted by parsing the AST, not grepping the source,
because the code is surrounded by comments naming the very identifiers that must
not appear. Live, on the running backend: 4 renders left the counter at 0, one
chat moved it to 1. The remaining piece is the literal walk — a **seeded
non-admin free account** through J1+J2+J3 in a browser — which needs Phase 3/4
surfaces that do not exist yet.

**What the free tier should now BE is a pricing decision, not an engineering
one.** The constraint that forced the question is gone: navigation no longer
spends from the chat budget.

### Phase 3 — the thread · ✅ **SHIPPED**

One card, one disclosure, one honest thinking line. `ProgressRail` and
`ReferencesRail` deleted (362 lines) — a settled turn carried three sibling
surfaces describing the same work in three visual languages, above the prose.

**Where the spec did not survive contact, and why.** §4.2 says `EntityCard`
absorbs `sparkline`/`gauge`/`stat`/`bars`. Taken mechanically that fails:
`EntityCard`'s anatomy is a SYMBOL's — logo, price, session move, indicator
votes — and a regime gauge has none of those, so rendering one through it means
inventing every field that makes the card worth reading. The collapse is
therefore by what a payload carries: `entity` → EntityCard, `strategy` → the
existing renderer, everything else → `DataStub`. §4.4's NIFTY card arrives by
the backend emitting a real `entity` artifact for the index — a better fix than
a frontend coercion.

**Two things this phase caught in its own work:**

1. **A raw tool name reached the browser.** A live turn rendered a chip reading
   `get_verdict`. The transform lived at the CALL SITES and one of three
   wirings — mine, an hour old — passed `tools` straight through. The old
   frontend map also matched almost nothing: it stripped everything after the
   first `_`, which turns every `get_*` tool into `get`, so all of them fell
   through to title-casing the raw name. `TurnDisclosure` now labels them
   itself and an unknown tool reads "Market data", never a prettified raw name.
2. **The ratchet caught me twice, and was right both times.** A spinner for a
   running step (fixed by unifying on the product's one "active" dot), and two
   new pulses (paid for by deleting two streaming carets — one of which was
   `bg-white`, invisible in light mode). The ratchets also counted class names
   inside COMMENTS; that false positive is now fixed, third occurrence.

### Phase 4 — the atomic cut · 15–20d, one branch
55 routes → 9. **Gate: a non-admin free account completes J1+J2+J3 without a 402.**

### Phase 5 — panel & terminal · 25d
### Phase 6 — light default · 3d

### ✅ The riskiest step — closed

**Phase 2.5, the metering redesign.** The three failures it named, and what
each turned out to be:

**"`_enforce_copilot_cap` returns early for `is_admin`, so the team building
this never sees the wall."** Confirmed exactly as described — the `return` was
the first line of the function, before the limiter was even constructed, so
every admin's counter read zero forever. Admins now consume and are simply
never blocked; passing the cap logs `would_have_blocked` and names the request
a free user would have lost.

**"Three of five mode chips map to buckets that are 0 for the tier being shown
the chip."** Confirmed, and the mechanism was worse than a mismatch: three of
the zero-capped features — `scanner_thesis`, `chart_vision`, `fno_advisor` —
have **no `FEATURE_MATRIX` entry at all**, so `features` never mentioned them
and nothing in the tier response could distinguish "available" from
"guaranteed 402 on first tap". `/api/user/tier` now ships `llm_caps`, and
`useTier().isLockedFeature()` renders a lock instead of letting the tap
through. A wall reached by tapping something the interface said you could do
teaches the user the product is broken; a lock teaches them it is paid.

**"Not revertable by dropping a branch."** Still true, and it is why the
guarantee is structural rather than conditional. There is no `skip_cap` flag
to un-skip: `/ai/copilot/render` has no cap call in it, and a test parses the
route's AST to assert it cannot even name `_enforce_copilot_cap`,
`AssistantCreditLimiter` or `consume_if_available`. A behavioural test would
have passed on an admin account with the cap call still in place — which is
the same blind spot in a different disguise.

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
