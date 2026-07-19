'use client'

/* PR-V — LLM cost dashboard panel.
 *
 * Reads /api/admin/llm-cost which rolls up llm_usage_events rows into:
 *   - total spend in USD + call count (window selectable: 1h / 24h / 7d / 30d)
 *   - by-feature breakdown (copilot, assistant, scanner, debate, finrobot)
 *   - top-10 spenders (anonymised by user_id)
 *   - by-model breakdown so we can see which open model is
 *     burning the budget.
 *
 * Cost values are in real USD (micros precomputed server-side from the
 * llm_pricing.py table). Numbers refresh on window-toggle + on a
 * manual refresh button.
 */

import { useCallback, useEffect, useState } from 'react'
import { CircleDollarSign, Loader2, RefreshCw } from '@/lib/icons'

import { api, handleApiError } from '@/lib/api'

type CostData = Awaited<ReturnType<typeof api.admin.getLlmCost>>

const WINDOWS: { label: string; hours: number }[] = [
  { label: '1h', hours: 1 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
]

export default function LlmCostPanel() {
  const [data, setData] = useState<CostData | null>(null)
  const [hours, setHours] = useState<number>(24)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const r = await api.admin.getLlmCost(hours)
      setData(r)
    } catch (e) {
      setErr(handleApiError(e))
    } finally {
      setLoading(false)
    }
  }, [hours])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="glass-card hover:border-primary transition-colors p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <CircleDollarSign className="w-5 h-5 text-primary" />
          LLM cost
        </h2>
        <div className="flex items-center gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w.hours}
              type="button"
              onClick={() => setHours(w.hours)}
              className={`px-2 py-1 text-[11px] rounded-md transition-colors ${
                hours === w.hours
                  ? 'bg-primary text-black font-semibold'
                  : 'border border-d-border text-d-text-secondary hover:text-white'
              }`}
            >
              {w.label}
            </button>
          ))}
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="ml-2 p-1.5 border border-d-border rounded-md text-d-text-secondary hover:text-white disabled:opacity-50"
            aria-label="Refresh LLM cost"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {err && (
        <p className="rounded-md border border-down/40 bg-down/10 px-3 py-2 text-xs text-down mb-3">
          {err}
        </p>
      )}

      {data && (
        <>
          {/* ── Totals strip ── */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Metric label="Total spend (USD)" value={`$${data.total.usd.toFixed(4)}`} primary />
            <Metric label="Calls" value={data.total.calls.toLocaleString('en-IN')} />
          </div>

          {/* ── By feature ── */}
          <Section title="By feature">
            {data.by_feature.length === 0 ? (
              <Empty />
            ) : (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-d-text-muted text-left">
                    <th className="font-medium pb-2">Feature</th>
                    <th className="font-medium pb-2 text-right">Calls</th>
                    <th className="font-medium pb-2 text-right">In tok</th>
                    <th className="font-medium pb-2 text-right">Out tok</th>
                    <th className="font-medium pb-2 text-right">USD</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_feature.map((f) => (
                    <tr key={f.feature} className="border-t border-d-border">
                      <td className="py-1.5 text-white">{f.feature}</td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-d-text-secondary">
                        {f.calls}
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-d-text-muted">
                        {f.input_tokens.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-d-text-muted">
                        {f.output_tokens.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-primary">
                        ${f.usd.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* ── Top spenders + Models in a 2-col layout ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Section title="Top spenders">
              {data.by_user.length === 0 ? (
                <Empty />
              ) : (
                <ul className="space-y-1.5">
                  {data.by_user.map((u) => (
                    <li
                      key={u.user_id}
                      className="flex items-center justify-between text-[12px]"
                    >
                      <span className="font-mono text-d-text-secondary truncate max-w-[200px]">
                        {u.user_id === 'anonymous' ? 'anonymous' : u.user_id.slice(0, 8)}
                      </span>
                      <span className="text-d-text-muted">{u.calls} calls</span>
                      <span className="font-mono tabular-nums text-primary">
                        ${u.usd.toFixed(4)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="By model">
              {data.by_model.length === 0 ? (
                <Empty />
              ) : (
                <ul className="space-y-1.5">
                  {data.by_model.map((m) => (
                    <li
                      key={`${m.provider}-${m.model}`}
                      className="flex items-center justify-between text-[12px]"
                    >
                      <span className="text-d-text-secondary truncate max-w-[200px]">
                        {m.provider} · <span className="font-mono">{m.model}</span>
                      </span>
                      <span className="text-d-text-muted">{m.calls}</span>
                      <span className="font-mono tabular-nums text-primary">
                        ${m.usd.toFixed(4)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  primary,
}: {
  label: string
  value: string
  primary?: boolean
}) {
  return (
    <div className="rounded-md border border-d-border bg-main p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-d-text-muted">
        {label}
      </p>
      <p
        className={`mt-0.5 font-mono text-lg font-semibold tabular-nums ${
          primary ? 'text-primary' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted mb-2">
        {title}
      </p>
      {children}
    </div>
  )
}

function Empty() {
  return (
    <p className="text-[11px] text-d-text-muted italic">
      No data in this window.
    </p>
  )
}
