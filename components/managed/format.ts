/**
 * Managed-surface formatting.
 *
 * These are now thin aliases over `lib/format`, the single source of truth for
 * money, percent and time across the app. Kept as a module because the managed
 * surfaces import these names widely — but the RULES live in one place, so
 * `₹1,23,456` cannot drift from `₹1.23L Cr` again.
 *
 * `pnlClass` stays here on purpose: it is a rendering decision (which token to
 * colour with), and lib/format returns semantics, never class names.
 */
import { direction, inr, inrSigned } from '@/lib/format'

export function fmtINR(v: number | null | undefined): string {
  return inr(v, 0)
}

export function fmtSignedINR(v: number | null | undefined): string {
  return inrSigned(v, 0)
}

export function pnlClass(v: number | null | undefined): string {
  const d = direction(v)
  if (d === 'flat') return 'text-d-text-primary'
  return d === 'up' ? 'text-success' : 'text-danger'
}
