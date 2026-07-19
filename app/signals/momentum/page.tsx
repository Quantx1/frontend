import { SignalsHub } from '@/components/signals/SignalsHub'

/** 200-render deep-link into the /signals hub, pre-filtered to the Momentum tab (no redirect). */
export default function MomentumSignalsPage() {
  return <SignalsHub initialHorizon="momentum" />
}
