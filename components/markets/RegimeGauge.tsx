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
  const W = size === 'lg' ? 264 : 224
  const cx = W / 2
  const r = W / 2 - 26
  const cy = r + 16
  const H = cy + 30

  if (score == null) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: H }}>
        <div className="h-[104px] w-[190px] animate-pulse rounded-t-full bg-wrap-hover/60" />
        <div className="mt-3 h-4 w-24 animate-pulse rounded bg-wrap-hover/50" />
      </div>
    )
  }

  const s = Math.max(0, Math.min(100, score))
  const band = bandFor(s)
  const needle = pt(cx, cy, r - 6, s)

  return (
    <div className="flex flex-col items-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Market gauge: ${Math.round(s)} of 100, ${band.label}`}>
        {/* neutral track */}
        <path d={arcPath(cx, cy, r, 0, 100)} fill="none" stroke="var(--color-wrap-hover)" strokeWidth="13" strokeLinecap="round" />
        {/* coloured segments with tiny gaps for a segmented read */}
        {SEGMENTS.map(([a, b, c]) => (
          <path key={a} d={arcPath(cx, cy, r, a + (a === 0 ? 0 : 1.2), b - (b === 100 ? 0 : 1.2))} fill="none" stroke={c} strokeWidth="11" strokeLinecap={a === 0 || b === 100 ? 'round' : 'butt'} />
        ))}
        {/* needle */}
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="var(--color-d-text-primary)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5.5" fill="var(--color-wrap)" stroke="var(--color-d-text-primary)" strokeWidth="2" />
        {/* score */}
        <text x={cx} y={cy - 14} textAnchor="middle" fill="var(--color-d-text-primary)" className={MONO} style={{ fontSize: size === 'lg' ? 30 : 26, fontWeight: 700 }}>{Math.round(s)}</text>
      </svg>
      <div className="-mt-1 text-center">
        <div className={`text-[14px] font-semibold ${band.toneClass}`}>{band.label}</div>
        {caption && <div className="mt-0.5 text-[11px] text-d-text-muted">{caption}</div>}
      </div>
    </div>
  )
}

/** Map the Regime engine's current state → a 0–100 gauge score.
 *  bull → 60–100 by confidence, bear → 0–40 (inverted by confidence),
 *  sideways → centred ~50 nudged by the dominant probability. */
export function regimeToScore(cur: { regime?: string; prob_bull?: number; prob_bear?: number; prob_sideways?: number } | null | undefined): number | null {
  if (!cur?.regime) return null
  const pb = cur.prob_bull ?? 0
  const pbr = cur.prob_bear ?? 0
  const reg = cur.regime.toLowerCase()
  if (reg === 'bull') return Math.round(60 + Math.min(1, pb) * 40)
  if (reg === 'bear') return Math.round(40 - Math.min(1, pbr) * 40)
  // sideways: 40–60, leaning by net bull/bear pressure
  return Math.round(50 + (pb - pbr) * 10)
}
