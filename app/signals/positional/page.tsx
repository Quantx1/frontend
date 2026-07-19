import { SignalsHub } from '@/components/signals/SignalsHub'

/** 200-render deep-link into the /signals hub, pre-filtered to the Positional tab (no redirect). */
export default function PositionalSignalsPage() {
  return <SignalsHub initialHorizon="positional" />
}
