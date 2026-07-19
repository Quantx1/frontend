import { SignalsHub } from '@/components/signals/SignalsHub'

/** 200-render deep-link into the /signals hub, pre-filtered to the Swing tab (no redirect). */
export default function SwingSignalsPage() {
  return <SignalsHub initialHorizon="swing" />
}
