import { SignalsHub } from '@/components/signals/SignalsHub'

// Index Momentum 30 — the cross-sectional Nifty-200 book (internal: momentum30).
export default function IndexMomentum30Page() {
  return <SignalsHub initialHorizon="momentum30" />
}
