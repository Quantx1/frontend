'use client'

/**
 * EngineRender — the decorative motif that bleeds off the right of the
 * engine-as-landing hero (competitor archetype B). NOT a photo: a
 * lightweight, theme-aware SVG candlestick + signal-path render in our
 * mono + duotone (up/down) + signature-gradient style. Purely decorative
 * (aria-hidden); carries no data, so it never goes stale.
 *
 * Mirrors the reference glowing-chart render slot but re-skinned to v2:
 * a soft signature radial glow, a faint dot grid, green/red candles, a
 * mint→violet signal line with a filled area, and floating BUY / SELL
 * markers — the same "computed market" cue, drawn in our palette.
 */

import { useId } from 'react'

// A stable, deterministic candle series (no Math.random → no hydration drift).
const CANDLES: { up: boolean; o: number; c: number; h: number; l: number }[] = [
  { up: true, o: 70, c: 58, h: 54, l: 74 },
  { up: false, o: 58, c: 64, h: 55, l: 67 },
  { up: true, o: 64, c: 50, h: 46, l: 66 },
  { up: true, o: 50, c: 42, h: 38, l: 52 },
  { up: false, o: 42, c: 49, h: 39, l: 52 },
  { up: true, o: 49, c: 36, h: 31, l: 51 },
  { up: true, o: 36, c: 28, h: 24, l: 38 },
  { up: false, o: 28, c: 34, h: 25, l: 37 },
  { up: true, o: 34, c: 22, h: 18, l: 36 },
  { up: true, o: 22, c: 15, h: 11, l: 24 },
]

// Smooth signal path tracing the up-trend (descending Y = rising price).
const SIGNAL_PATH = 'M 14 122 C 70 118 96 96 150 92 S 236 70 296 50 S 392 30 470 18'

export function EngineRender({ className = '' }: { className?: string }) {
  const id = useId().replace(/[:]/g, '')
  const colW = 44
  const x0 = 24

  return (
    <svg
      aria-hidden
      viewBox="0 0 500 200"
      className={className}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`${id}-sig`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00E6A7" />
          <stop offset="52%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00E6A7" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#00E6A7" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="62%" cy="40%" r="58%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.16" />
          <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
        <pattern id={`${id}-dots`} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.9" className="fill-d-text-muted/30" />
        </pattern>
      </defs>

      {/* soft signature depth pool */}
      <rect x="0" y="0" width="500" height="200" fill={`url(#${id}-glow)`} />
      {/* faint computed-grid */}
      <rect x="0" y="0" width="500" height="200" fill={`url(#${id}-dots)`} opacity="0.5" />

      {/* candles — duotone up/down only */}
      {CANDLES.map((k, i) => {
        const cx = x0 + i * colW
        const top = Math.min(k.o, k.c)
        const h = Math.max(2, Math.abs(k.c - k.o))
        const cls = k.up ? 'fill-up stroke-up' : 'fill-down stroke-down'
        return (
          <g key={i} className={cls}>
            <line x1={cx} y1={k.h} x2={cx} y2={k.l} strokeWidth="1.25" />
            <rect x={cx - 5} y={top} width="10" height={h} rx="1.5" />
          </g>
        )
      })}

      {/* signal area + line (signature gradient) */}
      <path d={`${SIGNAL_PATH} L 470 200 L 14 200 Z`} fill={`url(#${id}-fill)`} />
      <path d={SIGNAL_PATH} stroke={`url(#${id}-sig)`} strokeWidth="2.25" strokeLinecap="round" />

      {/* BUY marker (entry, lower-left) */}
      <g>
        <circle cx="150" cy="92" r="6.5" className="fill-up" />
        <circle cx="150" cy="92" r="6.5" className="fill-up/30 stroke-up" strokeWidth="1" opacity="0.5">
          <animate attributeName="r" from="6.5" to="13" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.5" to="0" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <text x="162" y="96" className="fill-up font-mono" fontSize="11" fontWeight="600">BUY</text>
      </g>

      {/* SELL marker (target, upper-right) */}
      <g>
        <circle cx="470" cy="18" r="6.5" className="fill-down" />
        <text x="438" y="22" className="fill-down font-mono" fontSize="11" fontWeight="600" textAnchor="end">SELL</text>
      </g>
    </svg>
  )
}
