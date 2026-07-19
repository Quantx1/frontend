'use client'

/**
 * AchievementsStrip — compact horizontal strip of earned badges +
 * active streak, for the /paper-trading hero bar.
 */

import { Flame, Trophy, Award } from '@/lib/icons'
import { MONO } from '@/lib/tokens'

interface Badge {
  key: string
  label: string
  tier: 'bronze' | 'silver' | 'gold'
}

interface Props {
  streakDays: number
  tradeCount: number
  totalReturnPct: number
  badges: Badge[]
}

// Medal-tier palette — intentional real-world medal colors (treated like
// brand colors, kept as literals). Only these decorative tiers use hex.
const TIER_COLORS: Record<Badge['tier'], string> = {
  bronze: '#C68642',
  silver: '#C0C0C0',
  gold: '#FFD166',
}

type Tone = 'primary' | 'up' | 'down' | 'muted' | 'warning'
const TONE_TEXT: Record<Tone, string> = {
  primary: 'text-d-text-primary',
  up: 'text-up',
  down: 'text-down',
  muted: 'text-d-text-muted',
  warning: 'text-warning',
}

export default function AchievementsStrip({
  streakDays,
  tradeCount,
  totalReturnPct,
  badges,
}: Props) {
  return (
    <div className="rounded-sm border border-line bg-wrap p-4 flex flex-wrap items-center gap-4">
      <Stat icon={Flame} label="Streak" value={`${streakDays}d`} tone={streakDays >= 3 ? 'warning' : 'muted'} />
      <Divider />
      <Stat icon={Trophy} label="Trades" value={String(tradeCount)} tone="primary" />
      <Divider />
      <Stat
        icon={Award}
        label="Total"
        value={`${totalReturnPct >= 0 ? '+' : ''}${totalReturnPct.toFixed(2)}%`}
        tone={totalReturnPct >= 0 ? 'up' : 'down'}
      />
      <Divider />
      <div className="flex items-center gap-1.5 flex-wrap">
        {badges.length === 0 ? (
          <span className="text-[11px] text-d-text-muted">No badges yet — place your first paper trade to start.</span>
        ) : (
          badges.map((b) => {
            const c = TIER_COLORS[b.tier]
            return (
              <span
                key={b.key}
                className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 border"
                style={{ backgroundColor: `${c}18`, color: c, borderColor: `${c}40` }}
                title={`${b.label} (${b.tier})`}
              >
                {b.label}
              </span>
            )
          })
        )}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: Tone }) {
  const cls = TONE_TEXT[tone]
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`w-3.5 h-3.5 ${cls}`} />
      <span className="text-[11px] text-d-text-muted">{label}</span>
      <span className={`${MONO} text-[13px] font-medium ${cls}`}>{value}</span>
    </div>
  )
}

function Divider() {
  return <span className="w-px h-4 bg-line" />
}
