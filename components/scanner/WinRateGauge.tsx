'use client'

/**
 * WinRateGauge — a compact semicircular gauge for a screener's historical
 * hit rate (Tradomate's signature "validated setup" chip). Duotone: green
 * arc when the edge is real (≥50%), muted otherwise. Fully self-contained
 * geometry — the arc, number and caption all live INSIDE the SVG box so it
 * can never clip or misalign against the card it sits in.
 */

interface Props {
  /** 0..1 */
  winRate: number
  /** Overall width in px; height is derived. */
  size?: number
  /** Small caption under the number (default "win rate"). */
  caption?: string
}

export function WinRateGauge({ winRate, size = 64, caption = 'win rate' }: Props) {
  const wr = Math.max(0, Math.min(1, winRate))
  const strokeW = 5
  const pad = strokeW / 2 + 1
  const w = size
  const r = size / 2 - pad
  const cx = w / 2
  const cy = r + pad // arc apex sits at y=pad; baseline at y=cy
  const h = cy + 16 // room for the caption row under the baseline

  const arc = (from: number, to: number) => {
    const a0 = Math.PI * (1 - from)
    const a1 = Math.PI * (1 - to)
    const x0 = cx + r * Math.cos(a0)
    const y0 = cy - r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy - r * Math.sin(a1)
    // A fraction of a SEMIcircle spans ≤180°, so the large-arc flag is
    // always 0 — setting it for >50% made the arc take the 266° long way
    // around and spray clipped fragments (the misaligned-gauge bug).
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`
  }

  const good = wr >= 0.5
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`Historical win rate ${Math.round(wr * 100)} percent`}
      className="block"
    >
      <path d={arc(0, 1)} fill="none" strokeWidth={strokeW} strokeLinecap="round" className="stroke-line" />
      {wr > 0.005 && (
        <path
          d={arc(0, wr)}
          fill="none"
          strokeWidth={strokeW}
          strokeLinecap="round"
          className={good ? 'stroke-up' : 'stroke-d-text-muted'}
        />
      )}
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        className="fill-d-text-primary"
        style={{ fontSize: size * 0.24, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}
      >
        {Math.round(wr * 100)}%
      </text>
      <text
        x={cx}
        y={cy + 11}
        textAnchor="middle"
        className="fill-d-text-muted"
        style={{ fontSize: 7.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}
      >
        {caption.toUpperCase()}
      </text>
    </svg>
  )
}
