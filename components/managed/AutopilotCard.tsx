'use client'

import { useState } from 'react'
import Link from 'next/link'
import { mutate } from 'swr'
import { Bot, FlaskConical, Loader2, Pause, Play } from '@/lib/icons'
import { Card, CardBody, CardHeader } from '@/components/foundation'
import { api } from '@/lib/api'
import type { ManagedOverview } from '@/lib/api'

/**
 * What the AI is doing with the account — tier- and mode-aware, honest.
 *
 * Pricing v2 (2026-06-12):
 *  - Free            → Paper AutoPilot (virtual money) start/stop right here;
 *                      upsell to Pro for live (AutoPilot Lite, ≤₹2L).
 *  - Pro/Elite paper → virtual state + explicit go-live path on /autopilot.
 *  - Pro/Elite live  → live state + recent plain-English activity.
 *
 * Copy rule (locked): AutoPilot trades on the USER'S OWN broker account
 * with their consent toggle — never "we manage your money". Paper→live is
 * always an explicit step; upgrades never flip anyone to real money.
 */
export default function AutopilotCard({ autopilot }: { autopilot: ManagedOverview['autopilot'] }) {
  const [busy, setBusy] = useState(false)

  const togglePaper = async (enabled: boolean) => {
    if (busy) return
    setBusy(true)
    try {
      await api.managed.paperAutopilot(enabled)
      await mutate('managed:overview')
    } catch {
      /* overview refetch shows true state either way */
    } finally {
      setBusy(false)
    }
  }

  const paper = autopilot.mode === 'paper'

  return (
    <Card>
      <CardHeader>Your AI on autopilot</CardHeader>
      <CardBody>
        {!autopilot.enabled ? (
          /* ── Off: start paper here (any tier); live setup for Pro/Elite ── */
          <div className="space-y-2">
            <p className="text-sm text-d-text-secondary">
              {autopilot.available
                ? 'AutoPilot trades on your own broker account — picking, sizing and exiting positions within your limits, with your kill switch always in control.'
                : 'Let the AI trade a virtual portfolio for you — same engine, fake money, zero risk. When you’re ready, Pro takes it live on your own broker account (up to ₹2,00,000).'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => togglePaper(true)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full glass-control-accent px-3 py-1.5 text-xs font-semibold disabled:opacity-60 active:scale-[0.98]"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
                Start Paper AutoPilot
              </button>
              {autopilot.available ? (
                <Link
                  href="/autopilot"
                  className="inline-flex items-center gap-1.5 rounded-full glass-control px-3 py-1.5 text-xs font-semibold text-d-text-primary transition-colors"
                >
                  <Play className="h-3.5 w-3.5" />
                  Go live
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 rounded-full glass-control px-3 py-1.5 text-xs font-semibold text-d-text-primary transition-colors"
                >
                  <Bot className="h-3.5 w-3.5" />
                  Go live with Pro
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* ── On: live or paper running state ── */
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              {autopilot.paused ? (
                <>
                  <Pause className="h-4 w-4 text-warning" />
                  <span className="font-medium text-warning">Paused by your kill switch</span>
                </>
              ) : paper ? (
                <>
                  <FlaskConical className="h-4 w-4 text-primary" />
                  <span className="font-medium text-d-text-primary">
                    Practicing with virtual money
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                  </span>
                  <span className="font-medium text-d-text-primary">Active on your broker account</span>
                </>
              )}
            </div>
            {autopilot.last_run_at && (
              <p className="text-xs text-d-text-muted">
                Last run {new Date(autopilot.last_run_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
            {autopilot.activity.length > 0 ? (
              <ul className="space-y-1.5 border-t border-wrap-hover pt-2">
                {autopilot.activity.slice(0, 4).map((line, i) => (
                  <li key={i} className="text-xs text-d-text-secondary">{line}</li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-wrap-hover pt-2 text-xs text-d-text-muted">
                No trades in the last 7 days — the AI only acts when its
                conditions are met.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
              {/* WP-SIMPLEVIEW — the full 7-day log is folded into the Simple
                  band on the SAME page, so this is an in-page jump (no /activity
                  route, no navigation loop). */}
              <a href="#simple-activity" className="text-primary hover:underline">
                See all activity →
              </a>
              {paper && (
                autopilot.available ? (
                  <Link href="/autopilot" className="text-d-text-secondary hover:text-d-text-primary hover:underline">
                    Ready for real money? Go live
                  </Link>
                ) : (
                  <Link href="/pricing" className="text-d-text-secondary hover:text-d-text-primary hover:underline">
                    Go live with Pro (up to ₹2L)
                  </Link>
                )
              )}
              {paper && (
                <button
                  onClick={() => togglePaper(false)}
                  disabled={busy}
                  className="text-d-text-muted hover:text-d-text-primary hover:underline disabled:opacity-60"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
