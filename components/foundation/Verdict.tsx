// Verdict (PR-V1) — BUY / HOLD / SELL pill. Thin wrapper over Badge's
// buy/hold/sell tones so there is one source of truth for verdict styling.
import { Badge } from './Badge'

export function Verdict({ v }: { v: string }) {
  const tone = v === 'BUY' ? 'buy' : v === 'SELL' ? 'sell' : 'hold'
  return (
    <Badge tone={tone} className="px-1.5 py-0.5 text-[10px] font-normal">
      {v}
    </Badge>
  )
}
