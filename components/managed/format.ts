/** Shared formatting for the managed (beginner) surfaces. */

export function fmtINR(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function fmtSignedINR(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  const s = fmtINR(Math.abs(v))
  return v < 0 ? `−${s}` : `+${s}`
}

export function pnlClass(v: number | null | undefined): string {
  if (v === null || v === undefined || v === 0) return 'text-d-text-primary'
  return v > 0 ? 'text-success' : 'text-danger'
}
