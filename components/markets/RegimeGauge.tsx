'use client'

/**
 * RegimeGauge — a Fear & Greed-style radial gauge (the multi-widget dashboard
 * archetype), mapped to OUR data. It plots a 0–100 score on a half-circle arc with a
 * needle and a labelled band (Extreme Bear → Bear → Neutral → Bull →
 * Extreme Bull). The score is derived from the Regime engine's confidence
 * (bull = high, bear = low, sideways = mid) OR a Mood sentiment score.
 *
 * Theme-aware: arc + ticks + needle read from CSS tokens (var(--color-up|
 * down|warning|wrap-hover|d-text-*)), so it works in light + dark + system.
 * No hardcoded dark. Duotone: green at the bull end, red at the bear end.
 * Honest-empty: renders a skeleton until a real score arrives.
 */

import { MONO } from '@/lib/tokens'

const BANDS = [
  { upTo: 20, label: 'Extreme Bear', tone: 'var(--color-down)', toneClass: 'text-down' },
  { upTo: 40, label: 'Bear', tone: 'var(--color-down)', toneClass: 'text-down' },
  { upTo: 60, label: 'Neutral', tone: 'var(--color-warning)', toneClass: 'text-warning' },
  { upTo: 80, label: 'Bull', tone: 'var(--color-up)', toneClass: 'text-up' },
  { upTo: 101, label: 'Extreme Bull', tone: 'var(--color-up)', toneClass: 'text-up' },
]

function bandFor(score: number) {
  return BANDS.find((b) => score < b.upTo) ?? BANDS[2]
}

// Polar → cartesian on a 180° arc (left = score 0, right = score 100).
function pt(cx: number, cy: number, r: number, score: number) {
  const angle = Math.PI * (1 - score / 100) // 100→0rad (right), 0→PI rad (left)
  return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) }
}

function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const a = pt(cx, cy, r, from)
  const b = pt(cx, cy, r, to)
  const large = to - from > 50 ? 1 : 0
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
}

const SEGMENTS: [number, number, string][] = [
  [0, 20, 'var(--color-down)'],
  [20, 40, 'color-mix(in srgb, var(--color-down) 65%, var(--color-warning))'],
  [40, 60, 'var(--color-warning)'],
  [60, 80, 'color-mix(in srgb, var(--color-up) 65%, var(--color-warning))'],
  [80, 100, 'var(--color-up)'],
]

export function RegimeGauge({
  score,
  caption,
  size = 'md',
}: {
  score: number | null
  caption?: string
  size?: 'md' | 'lg'
}) {
  const W = size === 'lg' ? 288 : 232
  const STROKE = size === 'lg' ? 16 : 13
  const cx = W / 2
  const r = W / 2 - STROKE / 2 - 9          // room for the stroke + the marker ring
  const cy = r + STROKE / 2 + 9
  const H = cy + 16

  if (score == null) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: H + 44 }}>
        <div className="animate-pulse rounded-t-full bg-wrap-hover/60" style={{ height: r * 0.9, width: W - 24 }} />
        <div className="mt-3 h-4 w-28 animate-pulse rounded bg-wrap-hover/50" />
      </div>
    )
  }

  const s = Math.max(0, Math.min(100, score))
  const band = bandFor(s)
  const marker = pt(cx, cy, r, s)                 // knob sits ON the arc — never crosses the number
  const numSize = size === 'lg' ? 46 : 38

  return (
    <div className="flex flex-col items-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Market gauge: ${Math.round(s)} of 100, ${band.label}`}>
        {/* neutral track */}
        <path d={arcPath(cx, cy, r, 0, 100)} fill="none" stroke="var(--color-wrap-hover)" strokeWidth={STROKE} strokeLinecap="round" />
        {/* coloured segments with tiny gaps for a segmented read */}
        {SEGMENTS.map(([a, b, c]) => (
          <path key={a} d={arcPath(cx, cy, r, a + (a === 0 ? 0 : 1.2), b - (b === 100 ? 0 : 1.2))} fill="none" stroke={c} strokeWidth={STROKE - 3} strokeLinecap={a === 0 || b === 100 ? 'round' : 'butt'} />
        ))}
        {/* position knob on the arc — punch a surface-coloured hole, then a band-tinted dot */}
        <circle cx={marker.x} cy={marker.y} r={STROKE / 2 + 4} fill="var(--color-wrap)" />
        <circle cx={marker.x} cy={marker.y} r={STROKE / 2 + 0.5} fill={band.tone} stroke="var(--color-wrap)" strokeWidth="2.5" />
        {/* score, centred in the bowl (no needle to collide with) */}
        <text x={cx} y={cy - 5} textAnchor="middle" fill="var(--color-light)" className={MONO} style={{ fontSize: numSize, fontWeight: 700, letterSpacing: '-0.03em' }}>{Math.round(s)}</text>
        <text x={cx} y={cy + 11} textAnchor="middle" fill="var(--color-muted)" style={{ fontSize: 9.5, letterSpacing: '0.16em', fontWeight: 600 }}>OUT OF 100</text>
      </svg>
      <div className="mt-1.5 text-center">
        <div className={`text-[15px] font-semibold ${band.toneClass}`}>{band.label}</div>
        {caption && <div className="mt-0.5 text-[11px] text-d-text-muted">{caption}</div>}
      </div>
    </div>
  )
}

/**
 * Composite market meter (0–100). The regime ANCHORS the needle; live daily
 * inputs TILT it, so it moves every session instead of pinning to a static
 * per-regime constant. (The ensemble's probabilities are a symmetric
 * agreement measure, so `prob_bull − prob_bear` is ~0 inside "sideways" —
 * the old formula froze the needle at exactly 50 for weeks.)
 *
 *   50% regime component  (bull 60–100 · sideways ~50 · bear 0–40)
 *   30% breadth score     (Market Pulse composite, 0–100)
 *   20% 21-day momentum   (NIFTY % return, 50 + 6×ret, clamped)
 *
 * The blend is then clamped to the official regime's band (bull ≥58,
 * bear ≤42, sideways 35–65) so the needle never contradicts the model —
 * it breathes WITHIN the regime.
 */
export function regimeToScore(
  cur: { regime?: string; prob_bull?: number; prob_bear?: number; prob_sideways?: number } | null | undefined,
  extras?: { breadthScore?: number | null; momentumPct?: number | null },
): number | null {
  if (!cur?.regime) return null
  const pb = cur.prob_bull ?? 0
  const pbr = cur.prob_bear ?? 0
  const reg = cur.regime.toLowerCase()

  const regimeComponent =
    reg === 'bull' ? 60 + Math.min(1, pb) * 40
    : reg === 'bear' ? 40 - Math.min(1, pbr) * 40
    : 50 + (pb - pbr) * 10

  const parts: Array<[number, number]> = [[regimeComponent, 0.5]]
  const breadth = extras?.breadthScore
  if (breadth != null && Number.isFinite(breadth)) parts.push([Math.max(0, Math.min(100, breadth)), 0.3])
  const mom = extras?.momentumPct
  if (mom != null && Number.isFinite(mom)) parts.push([Math.max(0, Math.min(100, 50 + mom * 6)), 0.2])

  const blended = parts.reduce((a, [v, w]) => a + v * w, 0) / parts.reduce((a, [, w]) => a + w, 0)
  const [lo, hi] = reg === 'bull' ? [58, 100] : reg === 'bear' ? [0, 42] : [35, 65]
  return Math.round(Math.max(lo, Math.min(hi, blended)))
}
