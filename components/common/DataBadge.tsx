'use client'
import { Radio, Clock } from '@/lib/icons'
import { Tooltip } from '@/components/foundation'

export function DataBadge({ mode, className = '' }: { mode: 'live' | 'eod'; className?: string }) {
  if (mode === 'live') {
    return (
      <Tooltip content="Live data from your connected broker feed.">
        <span className={`inline-flex items-center gap-1 rounded-full border border-up/30 bg-up/10 px-2 py-0.5 text-[10px] font-medium text-up ${className}`}>
          <Radio className="h-3 w-3" /> Live · your broker
        </span>
      </Tooltip>
    )
  }
  return (
    <Tooltip content="End-of-day research data — delayed, not live. Connect a broker for live data.">
      <span className={`inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-d-text-muted ${className}`}>
        <Clock className="h-3 w-3" /> EOD research
      </span>
    </Tooltip>
  )
}
