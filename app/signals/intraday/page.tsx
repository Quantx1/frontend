import { SignalsHub } from '@/components/signals/SignalsHub'

/** 200-render deep-link into the /signals hub, pre-filtered to the Intraday tab (no redirect). */
export default function IntradaySignalsPage() {
  return <SignalsHub initialHorizon="intraday" />
}
