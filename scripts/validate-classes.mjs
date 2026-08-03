#!/usr/bin/env node
/**
 * validate-classes — fail the build on Tailwind classes that compile to NOTHING.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * Tailwind does not error on an unknown utility. It emits no rule and no
 * warning, so the class sits in the DOM doing nothing and the bug is invisible
 * until someone notices the UI is subtly wrong. We shipped two instances:
 *
 *   · `ui/sheet.tsx` + `ui/dropdown-menu.tsx` carried 21 `animate-in` /
 *     `fade-in-0` / `slide-in-from-*` / `zoom-in-*` classes from the shadcn
 *     CLI. They require `tailwindcss-animate`, which this repo deliberately
 *     does NOT install — tailwind.config.ts:192 replaced it with dep-free
 *     keyframes. Every overlay animation was silently inert.
 *
 *   · `AlertPreferencesGrid.tsx` renders `text-white` on a near-white surface.
 *     That one DOES compile, which is why it needs its own rule below.
 *
 * The class list here is not guesswork: each entry was verified by compiling a
 * probe through this repo's own tailwind.config.ts and checking whether a rule
 * was produced. Re-run that probe before adding to it.
 *
 * Usage:  node scripts/validate-classes.mjs
 * Exit 1 on any violation.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SCAN = ['components', 'app', 'lib']
// Operator tooling is exempt from the product design rules (REDESIGN.md §3).
const SKIP = ['node_modules', '.next', 'app/admin']

/** Utilities that emit NOTHING on this stack. Each verified by probe. */
const DEAD = [
  // tailwindcss-animate — not installed (tailwind.config.ts:192)
  [/\banimate-in\b/, 'animate-in', 'use animate-overlay-in / animate-pop-in / animate-sheet-in-*'],
  [/\banimate-out\b/, 'animate-out', 'use animate-overlay-out / animate-pop-out / animate-sheet-out-*'],
  [/\bfade-in-0\b/, 'fade-in-0', 'covered by animate-overlay-in'],
  [/\bfade-out-0\b/, 'fade-out-0', 'covered by animate-overlay-out'],
  [/\bslide-in-from-(?:top|bottom|left|right)\b/, 'slide-in-from-*', 'use animate-sheet-in-<side>'],
  [/\bslide-out-to-(?:top|bottom|left|right)\b/, 'slide-out-to-*', 'use animate-sheet-out-<side>'],
  // digits required — `solar:magnifer-zoom-in-linear` is an ICON NAME, not a class
  [/\bzoom-in-\d/, 'zoom-in-<n>', 'covered by animate-pop-in'],
  [/\bzoom-out-\d/, 'zoom-out-<n>', 'covered by animate-pop-out'],
  // Tailwind v4-only utilities. This repo is v3.4.
  [/\bshadow-xs\b/, 'shadow-xs', 'v4 only — use shadow-sm or shadow-elev-1'],
  [/\boutline-hidden\b/, 'outline-hidden', 'v4 only — use outline-none'],
  [/\bfield-sizing-/, 'field-sizing-*', 'v4 only — size the textarea explicitly'],
  [/\bbg-linear-to-/, 'bg-linear-to-*', 'v4 only — use bg-gradient-to-'],
  [/\bring-3\b/, 'ring-3', 'v4 only — use ring-2'],
  [/\bnot-last:/, 'not-last:', 'v4 only — use [&:not(:last-child)]:'],
]

/**
 * Raw palette colours that bypass the AA-validated semantic tokens.
 * `--color-up` / `--color-down` are contrast-checked; `text-green-600` is not,
 * and it silently opts a surface out of both themes.
 */
const RAW_COLOUR = /\b(?:text|bg|border)-(?:green|red|emerald|rose)-\d{2,3}\b/


/**
 * ── The ratchet ────────────────────────────────────────────────────────────
 * Some debt cannot be cleared in one pass without making things worse.
 *
 * `animate-pulse` outside Skeleton.tsx and `animate-spin` are the motion kill
 * list (REDESIGN-VISUAL.md §5.6). The easy half is done — 38 self-closing
 * placeholder divs now route through <Skeleton>, and 5 always-on ping rings are
 * gone. What is left needs a per-site decision: a pulse WRAPPING content is not
 * the same as one standing in for it, and a spinner inside a button genuinely
 * awaiting a response must stay. Converting those in bulk would trade real
 * loading feedback for silence.
 *
 * So instead of a ban that would fail the build today, or a rule that lets the
 * debt grow quietly, these counts may only ever go DOWN. Lower a baseline when
 * you clear sites; the guard fails if you raise one.
 */
const RATCHET = [
  { label: 'animate-pulse outside Skeleton.tsx', max: 7,
    test: (src, rel) => rel !== 'components/foundation/Skeleton.tsx' && /\banimate-pulse\b/.test(src),
    count: (src, rel) => rel === 'components/foundation/Skeleton.tsx' ? 0 : (src.match(/\banimate-pulse\b/g) || []).length },
  // animate-spin is REVIEWED AND CLOSED, not debt. 102 of the 107 are gated on
  // a real loading condition (Loader2 inside a button awaiting a response,
  // RefreshCw during a refetch) and are correct as they are. The other 5 are
  // hand-rolled `<div>` border rings — a consistency nit, not a bug, and they
  // do not map onto <Spinner>'s h-4/h-6/h-8 scale (they are h-5, h-8, h-12).
  // Converting them would trade a working gated loading state for a visual
  // change that fixes nothing. The baseline exists to stop UNGATED spinners
  // creeping in, not to demand this number reach zero.
  { label: 'animate-spin', max: 106,
    count: (src) => (src.match(/\banimate-spin\b/g) || []).length },
  // Sub-11px type. REDESIGN-VISUAL.md §2.2 sets the floor at 11px, and 11px is
  // `micro` only. The audit measured 658 of these and called that single number
  // "the user's 'congested, not designed properly' verdict, quantified".
  // The sweep onto the v6 roles is Phase 1; until then the count may not grow.
  { label: 'type below the 11px floor', max: 560,
    count: (src) => (src.match(/text-\[(?:8|8\.5|9|9\.5|10|10\.5)px\]/g) || []).length },
]

const files = []
;(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    const rel = relative(ROOT, p)
    if (SKIP.some((s) => rel.startsWith(s))) continue
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.tsx?$/.test(p)) files.push(p)
  }
})(join(ROOT, SCAN[0]))
for (const d of SCAN.slice(1)) {
  try {
    ;(function walk(dir) {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e)
        const rel = relative(ROOT, p)
        if (SKIP.some((s) => rel.startsWith(s))) continue
        if (statSync(p).isDirectory()) walk(p)
        else if (/\.tsx?$/.test(p)) files.push(p)
      }
    })(join(ROOT, d))
  } catch {
    /* optional dir */
  }
}

let violations = 0
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const rel = relative(ROOT, file)
  src.split('\n').forEach((line, i) => {
    for (const [re, needle, hint] of DEAD) {
      if (re.test(line)) {
        console.error(`  ✗ ${rel}:${i + 1}  "${needle}" compiles to NOTHING — ${hint}`)
        violations++
      }
    }
    const raw = line.match(RAW_COLOUR)
    if (raw) {
      console.error(
        `  ✗ ${rel}:${i + 1}  "${raw[0]}" bypasses --color-up/--color-down (AA-validated)`,
      )
      violations++
    }
  })
}

// ── ratchet check ──────────────────────────────────────────────────────────
//
// Ratchets count CLASS USAGES, so comments are stripped first. Without this a
// docblock explaining why a component must not use `animate-spin` counts as an
// `animate-spin` — which happened twice: once to an Iconify name containing
// `-in-`, and once to this file's own rules quoted in `TurnDisclosure`. A
// guard that fires on the sentence describing it teaches people to stop
// writing the sentence.
//
// Deliberately naive: block comments and `//` lines. It over-strips a `//`
// inside a string literal, which for these class-name patterns is harmless —
// and under-counting a ratchet is caught the moment someone tries to raise it,
// where over-counting is only ever noticed as a mystery failure.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

let ratchetFailed = false
for (const r of RATCHET) {
  let n = 0
  for (const file of files) n += r.count(stripComments(readFileSync(file, 'utf8')), relative(ROOT, file))
  if (n > r.max) {
    console.error(`  ✗ ${r.label}: ${n} — baseline is ${r.max}. This count may only go DOWN.`)
    ratchetFailed = true
  } else if (n < r.max) {
    console.log(`  ↓ ${r.label}: ${n} (baseline ${r.max}) — lower the baseline in scripts/validate-classes.mjs`)
  }
}

if (violations || ratchetFailed) {
  if (violations) console.error(`\n${violations} dead/unsafe class${violations === 1 ? '' : 'es'}. These render silently wrong.\n`)
  process.exit(1)
}
console.log(`validate-classes: ${files.length} files scanned, 0 violations`)
