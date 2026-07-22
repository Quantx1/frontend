/**
 * Trading / algo illustrations — DhanHQ's flat-vector style, rebuilt as
 * theme-aware animated SVG (our tokens + DhanHQ accents; no raster assets).
 * Crisp at any DPI, recolours with the theme, animates via the .illus-*
 * primitives in globals.css (reduced-motion safe).
 *
 * Style rules (matches dhanhq.co): #10121D-ish panel on a #1C1E29 hairline,
 * faint grid, candles in P&L colours, an indigo→blue trend, a glowing signal
 * node, a small status badge. Keep 480×272.
 */

const FRAME = 'var(--color-card, #10121D)'
const STROKE = 'var(--color-line, #1C1E29)'
const GRID = 'var(--color-line, #1C1E29)'
const UP = 'var(--color-up)'
const DOWN = 'var(--color-down)'
// Our blue-primary FintechX palette (no DhanHQ accents). Names kept generic.
const INDIGO = 'var(--color-primary, #406AE4)'
const INDIGO_LT = 'var(--color-ai, #8FB0FF)'
const BLUE = 'var(--color-primary, #406AE4)'
const PINK = 'var(--color-cyan, #5290F4)'
const TEXT = 'var(--color-desc, #DADADA)'

type Props = { className?: string; title?: string }

function Grid() {
  return (
    <g stroke={GRID} strokeWidth="1">
      {[68, 118, 168, 218].map((y) => (
        <line key={y} x1="24" y1={y} x2="456" y2={y} />
      ))}
    </g>
  )
}

/** AI trade signal — rising candles, a drawing trend line, a pulsing node. */
export function SignalScene({ className, title = 'AI trade signal' }: Props) {
  const candles = [
    { x: 60, o: 200, c: 150 }, { x: 96, o: 150, c: 172 }, { x: 132, o: 172, c: 130 },
    { x: 168, o: 130, c: 148 }, { x: 204, o: 148, c: 104 }, { x: 240, o: 104, c: 120 },
    { x: 276, o: 120, c: 84 }, { x: 312, o: 84, c: 96 }, { x: 348, o: 96, c: 60 },
    { x: 384, o: 60, c: 74 },
  ]
  return (
    <svg viewBox="0 0 480 272" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="sig-trend" x1="0" y1="0" x2="480" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor={INDIGO_LT} /><stop offset="1" stopColor={BLUE} />
        </linearGradient>
        <linearGradient id="sig-area" x1="0" y1="50" x2="0" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#406AE4" stopOpacity="0.34" /><stop offset="1" stopColor="#406AE4" stopOpacity="0" />
        </linearGradient>
        <filter id="sig-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect x="1" y="1" width="478" height="270" rx="12" fill={FRAME} stroke={STROKE} />
      <Grid />
      {candles.map((k, i) => {
        const up = k.c < k.o
        const col = up ? UP : DOWN
        const top = Math.min(k.o, k.c)
        const h = Math.max(6, Math.abs(k.o - k.c))
        return (
          <g key={i} className="illus-rise" style={{ animationDelay: `${i * 90}ms` }}>
            <line x1={k.x} y1={top - 12} x2={k.x} y2={top + h + 12} stroke={col} strokeWidth="1.5" opacity="0.6" />
            <rect x={k.x - 6} y={top} width="12" height={h} rx="2" fill={col} />
          </g>
        )
      })}
      <path d="M60 190 L132 150 L204 120 L276 96 L348 70 L420 58 L420 240 L60 240 Z" fill="url(#sig-area)" />
      <path
        d="M60 190 L132 150 L204 120 L276 96 L348 70 L420 58"
        fill="none" stroke="url(#sig-trend)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        pathLength={100} className="illus-draw" style={{ ['--len' as string]: 100 }}
      />
      <circle cx="348" cy="70" r="12" fill={INDIGO_LT} className="illus-pulse" />
      <circle cx="348" cy="70" r="6" fill={INDIGO_LT} filter="url(#sig-glow)" />
      <g transform="translate(298 28)">
        <rect width="156" height="26" rx="13" fill={INDIGO} opacity="0.16" />
        <circle cx="16" cy="13" r="4" fill={UP} className="illus-float" />
        <text x="30" y="17" fill={TEXT} fontSize="11" fontWeight="600" fontFamily="var(--font-sans)">BUY signal · 92%</text>
      </g>
    </svg>
  )
}

/** Backtest — an equity curve drawing over a win/loss histogram + scrub line. */
export function BacktestScene({ className, title = 'Strategy backtest' }: Props) {
  const bars = [70, 44, 96, 58, 120, 82, 138, 64, 150, 108, 166, 90]
  return (
    <svg viewBox="0 0 480 272" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="bt-eq" x1="0" y1="0" x2="480" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor={BLUE} /><stop offset="1" stopColor={INDIGO_LT} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="478" height="270" rx="12" fill={FRAME} stroke={STROKE} />
      <Grid />
      {/* histogram */}
      {bars.map((h, i) => {
        const up = i % 3 !== 1
        return (
          <rect
            key={i} x={40 + i * 34} y={240 - h} width="18" height={h} rx="3"
            fill={up ? UP : DOWN} opacity={up ? 0.85 : 0.7}
            className="illus-rise" style={{ animationDelay: `${i * 70}ms` }}
          />
        )
      })}
      {/* equity curve */}
      <path
        d="M40 200 C 120 180, 150 140, 210 130 S 320 110, 360 78 S 430 54, 452 44"
        fill="none" stroke="url(#bt-eq)" strokeWidth="3" strokeLinecap="round"
        pathLength={100} className="illus-draw" style={{ ['--len' as string]: 100, animationDelay: '400ms' }}
      />
      {/* scrub line */}
      <line x1="40" y1="30" x2="40" y2="248" stroke={INDIGO_LT} strokeWidth="1.5" opacity="0.5" strokeDasharray="3 4" className="illus-sweep" />
      <g transform="translate(300 26)">
        <rect width="152" height="26" rx="13" fill={UP} opacity="0.16" />
        <text x="16" y="17" fill={TEXT} fontSize="11" fontWeight="600" fontFamily="var(--font-sans)">Sharpe 1.9 · +18.4%</text>
      </g>
    </svg>
  )
}

/** AutoPilot — an engine core with a rotating orbit ring + feeding candles. */
export function AutopilotScene({ className, title = 'AutoPilot engine' }: Props) {
  return (
    <svg viewBox="0 0 480 272" className={className} role="img" aria-label={title}>
      <defs>
        <radialGradient id="ap-core" cx="0.5" cy="0.5" r="0.5">
          <stop stopColor={INDIGO_LT} /><stop offset="1" stopColor={INDIGO} />
        </radialGradient>
        <filter id="ap-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect x="1" y="1" width="478" height="270" rx="12" fill={FRAME} stroke={STROKE} />
      <Grid />
      {/* orbit ring (rotating) */}
      <g>
        <circle cx="240" cy="136" r="76" fill="none" stroke={INDIGO} strokeWidth="1.5" strokeDasharray="4 8" opacity="0.55" />
        <g>
          <circle cx="316" cy="136" r="4" fill={BLUE} />
          <circle cx="164" cy="136" r="4" fill={PINK} />
          <animateTransform attributeName="transform" type="rotate" from="0 240 136" to="360 240 136" dur="9s" repeatCount="indefinite" />
        </g>
      </g>
      {/* engine core */}
      <circle cx="240" cy="136" r="30" fill="url(#ap-core)" filter="url(#ap-glow)" />
      <circle cx="240" cy="136" r="44" fill="none" stroke={INDIGO_LT} strokeWidth="1.5" opacity="0.6" className="illus-pulse" />
      <path d="M231 128 L231 144 M240 122 L240 150 M249 132 L249 140" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      {/* feeding candles */}
      {[{ x: 60, y: 90, up: true }, { x: 60, y: 150, up: false }, { x: 60, y: 200, up: true }].map((k, i) => (
        <rect key={i} x={k.x} y={k.y} width="10" height="26" rx="2" fill={k.up ? UP : DOWN} className="illus-float" style={{ animationDelay: `${i * 500}ms` }} />
      ))}
      <line x1="76" y1="103" x2="205" y2="130" stroke={GRID} strokeWidth="1" opacity="0.6" />
      <line x1="76" y1="163" x2="205" y2="140" stroke={GRID} strokeWidth="1" opacity="0.6" />
      <g transform="translate(300 26)">
        <rect width="152" height="26" rx="13" fill={INDIGO} opacity="0.16" />
        <circle cx="16" cy="13" r="4" fill={UP} className="illus-float" />
        <text x="30" y="17" fill={TEXT} fontSize="11" fontWeight="600" fontFamily="var(--font-sans)">AutoPilot · running</text>
      </g>
    </svg>
  )
}
