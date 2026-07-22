import { SignalsHub } from '@/components/signals/SignalsHub'

// Alpha Picks — the 10-bar alpha-ranked book (internal key: swing).
export default function AlphaPicksPage() {
  return <SignalsHub initialHorizon="swing" />
}
