import { SignalsHub } from '@/components/signals/SignalsHub'

/**
 * /signals — the single signals hub (Overview + horizon tabs). The Overview tab
 * is the cross-horizon master blotter; the horizon tabs embed CategorySignalsPage.
 * The 4 per-horizon routes deep-link into the matching tab (200-render, no redirect).
 */
export default function SignalsPage() {
  return <SignalsHub />
}
