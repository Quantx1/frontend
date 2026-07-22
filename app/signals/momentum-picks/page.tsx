import { SignalsHub } from '@/components/signals/SignalsHub'

// Momentum Picks — the 20-bar strength book (internal key: momentum).
export default function MomentumPicksPage() {
  return <SignalsHub initialHorizon="momentum" />
}
