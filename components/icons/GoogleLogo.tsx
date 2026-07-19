/**
 * GoogleLogo — official multicolor "G" mark.
 *
 * Use on auth buttons instead of lucide-react's `Chrome` icon (which is
 * the browser logo, not the Google brand mark). Sized to match lucide
 * defaults so it's a drop-in replacement.
 */
export function GoogleLogo({
  size = 20,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.5 4.2-5.5 7.2-10.3 7.2-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.4 2.8l5.1-5.1C34.1 7.5 29.3 5.6 24 5.6 13.7 5.6 5.3 14 5.3 24.3S13.7 43 24 43c10.6 0 18.7-7.7 18.7-19 0-1.3-.1-2.3-.3-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M7.3 14.5l5.9 4.3C14.8 14.7 19 11.5 24 11.5c2.8 0 5.4 1.1 7.4 2.8l5.1-5.1C34.1 7.5 29.3 5.6 24 5.6 16.3 5.6 9.7 9.9 7.3 14.5z"
      />
      <path
        fill="#4CAF50"
        d="M24 43c5.2 0 9.9-1.9 13.5-5l-6.3-5.2c-2 1.5-4.5 2.4-7.2 2.4-4.8 0-8.8-3-10.3-7.1l-6 4.6C10 38.7 16.4 43 24 43z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.7 2.1-2.1 3.9-3.8 5.2l6.3 5.2c-.4.4 6.8-5 6.8-13.8 0-1.3-.1-2.3-.3-3.7z"
      />
    </svg>
  )
}
