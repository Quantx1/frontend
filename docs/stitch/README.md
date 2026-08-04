# QUANT X — FRONTEND DESIGN HANDOFF PACK

**For redesigning the app in Google Stitch.**

This pack is the complete *as-built* specification of the Quant X frontend: every
design token, every layout rule, every screen, every overlay, and every primitive —
extracted from source, not from any plan document. It exists so you can regenerate the
entire UI in Stitch without losing anything the product currently does.

---

## Read in this order

| # | File | What it is | When to use it |
|---|---|---|---|
| **01** | [`01-DESIGN-SYSTEM.md`](01-DESIGN-SYSTEM.md) | Colour, surfaces, type, radius, spacing, elevation, motion, primitives, the don'ts | **Read first.** §12 is the Stitch system prompt |
| **02** | [`02-INFORMATION-ARCHITECTURE.md`](02-INFORMATION-ARCHITECTURE.md) | The four layout shells, sidebar IA, every route, access gates, redirect map, the five journeys | Read second — it's the skeleton |
| **03** | [`03-SCREEN-INVENTORY.md`](03-SCREEN-INVENTORY.md) | Index of every surface → per-family detail files in [`screens/`](screens/) | Look up a screen's exact anatomy |
| **04** | [`04-STITCH-PROMPTS.md`](04-STITCH-PROMPTS.md) | One paste-ready Stitch prompt per screen | The working file during generation |
| **05** | [`05-COMPONENT-CATALOGUE.md`](05-COMPONENT-CATALOGUE.md) | Every primitive's variants, sizes, slots and states with resolved pixel values | Build the component library first |
| **06** | [`06-DEFECTS-AND-NOTES.md`](06-DEFECTS-AND-NOTES.md) | Inconsistencies and dead ends found during extraction | Decide what to fix vs. keep |

---

## The Stitch workflow

**Step 1 — establish the system.**
Open a Stitch session. Paste the system prompt from
[`01-DESIGN-SYSTEM.md` §12](01-DESIGN-SYSTEM.md). Do this once per session. It sets the
palette, both themes, the type scale, the five radii and the layout grid.

**Step 2 — build the primitives.**
Work through [`05-COMPONENT-CATALOGUE.md`](05-COMPONENT-CATALOGUE.md) before any screen.
Buttons, cards, badges, tables, stat tiles and the empty/loading/error states are what
every screen is assembled from — getting them right once removes drift from all 100+
screens downstream.

**Step 3 — generate screens.**
Paste one prompt at a time from [`04-STITCH-PROMPTS.md`](04-STITCH-PROMPTS.md). Generate
tabs, locked states and empty states as **separate frames** — they are listed as their
own prompts for exactly this reason.

**Step 4 — when Stitch drifts.**
Re-paste the §12 system prompt before the next screen. Drift shows up first as
off-palette accents, then as extra corner radii.

**Suggested order** (highest leverage first):
1. App shell + sidebar + command palette → [`screens/shell-chrome.md`](screens/shell-chrome.md)
2. Copilot home → [`screens/home-copilot.md`](screens/home-copilot.md)
3. Signals hub + signal detail → [`screens/signals.md`](screens/signals.md)
4. Stock dossier → [`screens/markets-stocks.md`](screens/markets-stocks.md)
5. Portfolio / trades → [`screens/portfolio-trades.md`](screens/portfolio-trades.md)
6. Everything else

---

## Five rules that carry most of the visual identity

If Stitch only gets five things right, make them these.

1. **One accent.** Glossy fintech blue `#406AE4` as a *fill* with white text on it;
   `#8FB0FF` (dark) / `#3459C9` (light) when the accent is *text*. Nothing else is blue.
2. **Green and red mean money, never chrome.** `#10B981` up, `#F5808C` down (dark).
   No green success buttons, no red delete fills.
3. **Cards are opaque.** Depth is a surface step plus a 1px hairline. Blur is reserved
   for floating dismissible surfaces only.
4. **Five radii, no more.** 6 / 8 / 12 / 16 / full. Twelve is the card.
5. **Every number is Geist Mono with tabular figures.** This is what makes price
   columns align and the product read as an instrument.

---

## Scope note

`landing/` is a separate app (public marketing) and is **not** covered here. This pack
documents `frontend/` — the product. Admin console screens are included but sit outside
the consumer IA and can be redesigned last or not at all.

*Generated from source at `frontend/` on 2026-08-03.*
