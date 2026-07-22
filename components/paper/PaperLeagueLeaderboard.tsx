'use client'

/**
 * PaperLeagueLeaderboard — anonymized weekly ranking (N6).
 *
 * Backend returns hashed handles (``Swing<6-hex>``) so no user identity
 * leaks. If the logged-in user's handle is in the list we highlight
 * their row with gold accent.
 */

import { Medal, Crown } from '@/lib/icons'
import { MONO } from '@/lib/tokens'

interface Row {
  rank: number
  handle: string
  return_pct: number
  final_equity: number
  snapshots: number
}

interface Props {
  rows: Row[]
  currentUserHandle?: string
}

export default function PaperLeagueLeaderboard({ rows, currentUserHandle }: Props) {
  if (!rows.length) {
    return (
      <div className="rounded-[20px] border border-line bg-wrap text-[12px] text-d-text-muted text-center py-6">
        League opens at the end of the first week. Keep paper-trading.
      </div>
    )
  }

  return (
    <div className="rounded-[20px] border border-line bg-wrap overflow-hidden">
      <div className="px-5 py-3 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-medium text-d-text-primary">Paper League</span>
          <span className="font-mono text-[10px] text-d-text-muted uppercase tracking-[0.1em]">
            weekly · anonymized
          </span>
        </div>
        <span className="text-[10px] text-d-text-muted">Top 20</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="text-d-text-muted border-b border-line">
            <tr>
              <th className="text-left px-5 py-2.5 font-normal w-12">#</th>
              <th className="text-left px-2 py-2.5 font-normal">Handle</th>
              <th className="text-right px-2 py-2.5 font-normal">Return</th>
              <th className="text-right px-5 py-2.5 font-normal">Equity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isMe = currentUserHandle && r.handle === currentUserHandle
              return (
                <tr
                  key={r.handle}
                  className={`border-b border-line last:border-0 ${
                    isMe ? 'bg-warning/[0.08] shadow-[inset_2px_0_0_var(--color-warning)]' : 'hover:bg-hover'
                  } transition-colors`}
                >
                  <td className="px-5 py-2.5">
                    <RankCell rank={r.rank} />
                  </td>
                  <td className="px-2 py-2.5 font-mono text-[12px] text-d-text-primary">
                    {r.handle}{isMe && <span className="ml-2 text-[10px] font-bold text-highlight">YOU</span>}
                  </td>
                  <td className={`px-2 py-2.5 text-right ${MONO} font-medium ${r.return_pct >= 0 ? 'text-up' : 'text-down'}`}>
                    {r.return_pct >= 0 ? '+' : ''}{r.return_pct.toFixed(2)}%
                  </td>
                  <td className={`px-5 py-2.5 text-right ${MONO} text-d-text-primary`}>
                    ₹{r.final_equity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Medal-tier palette — intentional real-world medal colors (gold/silver/bronze).
function RankCell({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
  if (rank === 2) return <Medal className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
  if (rank === 3) return <Medal className="w-4 h-4" style={{ color: '#C68642' }} />
  return <span className={`${MONO} text-[12px] text-d-text-muted`}>#{rank}</span>
}
