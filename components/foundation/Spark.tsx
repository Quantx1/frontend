// Spark (PR-V1, promoted from the /os preview) — gradient-area sparkline.
// Theme-aware via the --color-* token passed as `color`.
export function Spark({
  data,
  color = 'var(--color-primary)',
  w = 120,
  h = 36,
}: {
  data: number[]
  color?: string
  w?: number
  h?: number
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - ((d - min) / span) * (h - 4) - 2])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const id = `sp${Math.round(pts[0][1])}${w}${Math.round(max)}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
