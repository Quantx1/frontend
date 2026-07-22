/**
 * QuantXMark — the Quant X app-icon logo ("Orbital"). A glass-gradient blue
 * rounded-square tile with a quantum atom: three electron orbits around a
 * glowing nucleus, three electrons on the rings. "Quant" = quantum + the AI
 * energy. Pure SVG: crisp at any size, themes for free, tiny. Reused in the
 * sidebar brand, the home footer, the auth mark and the favicon. Size via
 * `className` (e.g. `h-8 w-8`) or the `size` prop.
 */
export function QuantXMark({
  size,
  className,
  title = 'Quant X',
}: {
  size?: number
  className?: string
  title?: string
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="qx-fill" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5B8DEF" />
          <stop offset="1" stopColor="#3457C9" />
        </linearGradient>
        <linearGradient id="qx-sheen" x1="20" y1="1" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id="qx-glow" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="0.9" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* glass tile */}
      <rect x="1" y="1" width="38" height="38" rx="11.5" fill="url(#qx-fill)" />
      {/* top specular sheen */}
      <path
        d="M12.5 1H27.5C33.29 1 38 5.71 38 11.5V13C38 8.31 30 6.5 20 6.5C10 6.5 2 8.31 2 13V11.5C2 5.71 6.71 1 12.5 1Z"
        fill="url(#qx-sheen)"
        opacity="0.85"
      />

      {/* electron orbits */}
      <g stroke="#FFFFFF" strokeWidth="1.9" fill="none" opacity="0.9">
        <ellipse cx="20" cy="20" rx="13.5" ry="5.6" transform="rotate(30 20 20)" />
        <ellipse cx="20" cy="20" rx="13.5" ry="5.6" transform="rotate(90 20 20)" />
        <ellipse cx="20" cy="20" rx="13.5" ry="5.6" transform="rotate(150 20 20)" />
      </g>
      {/* nucleus */}
      <circle cx="20" cy="20" r="3.3" fill="#FFFFFF" />
      {/* electrons on the rings (glowing) */}
      <g filter="url(#qx-glow)" fill="#FFFFFF">
        <circle cx="31.69" cy="26.75" r="1.9" />
        <circle cx="8.31" cy="26.75" r="1.9" />
        <circle cx="20" cy="6.5" r="1.9" />
      </g>

      {/* crisp rim */}
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" stroke="#FFFFFF" strokeOpacity="0.22" />
    </svg>
  )
}
