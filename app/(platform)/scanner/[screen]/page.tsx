'use client'

/**
 * /scanner/[screen] — one prebuilt screener, in full (Tradomate's
 * screen-detail pattern).
 *
 * Header (name · style · blurb) → performance card (win-rate gauge + real
 * out-of-sample stats) → live results as rich generated UI (stat tiles +
 * chart + sortable table, rows → /stock/[symbol]). Save-as-screen wires it
 * into Saved Scans; Ask Copilot hands the results to the one global agent.
 * The engine cold-start (503 "not ready") is handled with a warm-up
 * auto-retry instead of an error wall.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft, Bell, ScanLine, Sparkles } from '@/lib/icons'

import {
  Badge,
  Button,
  Card,
  CardBody,
  DisclaimerFooter,
  EmptyState,
  PageHeader,
  Skeleton,
  toast,
} from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'
import { MONO } from '@/lib/tokens'
import { findScreener } from '@/lib/prebuilt-screeners'
import { WinRateGauge } from '@/components/scanner/WinRateGauge'
import { bestHold } from '@/components/scanner/PrebuiltScreeners'
import { RichScreenResults } from '@/components/scanner/RichScreenResults'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'

type Match = NonNullable<Awaited<ReturnType<typeof api.screener.powerConfluence>>>['matches'][number]

const WARMUP_RETRY_MS = 8_000
const WARMUP_MAX_TRIES = 12

export default function ScreenDetailPage() {
  const params = useParams<{ screen: string }>()
  const found = useMemo(() => findScreener(String(params?.screen ?? '')), [params?.screen])

  if (!found) {
    return (
      <div className="w-full p-6">
        <EmptyState
          icon={<ScanLine className="h-8 w-8" />}
          title="Screen not found"
          description="This screener doesn't exist (or was renamed)."
          action={
            <Link
              href="/scanner"
              className="glass-control inline-flex h-9 items-center rounded-pill px-4 text-[13px] text-d-text-primary transition-colors"
            >
              Back to Screener
            </Link>
          }
        />
      </div>
    )
  }
  return <ScreenDetail screenKey={found.screener.key} />
}

function ScreenDetail({ screenKey }: { screenKey: string }) {
  const { screener, style } = findScreener(screenKey)!
  const [rows, setRows] = useState<Match[] | null>(null)
  const [warming, setWarming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const tries = useRef(0)

  // Real out-of-sample stats for THIS screen.
  const { data: statsData } = useSWR('scanner_stats_all', () => api.screener.scannerStats(), {
    revalidateOnFocus: false,
    dedupingInterval: 600_000,
  })
  const stat = useMemo(
    () => statsData?.stats?.find((s) => s.scanner_id === screener.scanners[0]),
    [statsData, screener.scanners],
  )
  const hold = stat && stat.total_hits >= 10 ? bestHold(stat) : null

  const run = useCallback(async () => {
    try {
      const r = await api.screener.powerConfluence({
        scanners: screener.scanners,
        min_hits: 1,
        limit: 50,
      })
      setRows(r.matches ?? [])
      setWarming(false)
      setError(null)
    } catch (e) {
      const msg = handleApiError(e)
      if (/not ready/i.test(msg) && tries.current < WARMUP_MAX_TRIES) {
        // Engine computing the universe — poll instead of failing.
        tries.current += 1
        setWarming(true)
        setTimeout(() => void run(), WARMUP_RETRY_MS)
      } else {
        setWarming(false)
        setError(msg)
      }
    }
  }, [screener.scanners])

  useEffect(() => {
    tries.current = 0
    setRows(null)
    setError(null)
    void run()
  }, [run])

  const saveAsScreen = async () => {
    setSaving(true)
    try {
      await api.screener.createSavedScan({
        name: screener.name,
        scanner_ids: screener.scanners,
        min_hits: 1,
        schedule: 'hourly',
      })
      toast.success('Saved', {
        description: `${screener.name} will run hourly — alerts land in your inbox.`,
      })
    } catch (e) {
      toast.error('Could not save', { description: handleApiError(e) })
    } finally {
      setSaving(false)
    }
  }

  const askCopilot = () => {
    const names = (rows ?? []).slice(0, 8).map((r) => r.symbol).join(', ')
    dispatchCopilotOpen(
      `Analyse today's "${screener.name}" screen (${screener.blurb}) — matches: ${names || 'none right now'}. Which look strongest and why?`,
    )
  }

  return (
    <div className="w-full pb-8">
      <div className="px-4 pt-4 md:px-6">
        <Link
          href="/scanner"
          className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-d-text-muted transition-colors hover:text-d-text-secondary"
        >
          <ArrowLeft className="h-3 w-3" />
          All screeners
        </Link>
      </div>
      <PageHeader
        eyebrow={`Screener · ${style.label}`}
        title={screener.name}
        description={screener.blurb}
        actions={
          <>
            <Button variant="secondary" onClick={saveAsScreen} disabled={saving}>
              <Bell className="mr-1 h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Save as screen'}
            </Button>
            <Button variant="ai" onClick={askCopilot}>
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Ask Copilot
            </Button>
          </>
        }
      />

      <div className="space-y-5 px-4 py-5 md:px-6">
        {/* How this screen has performed — real 90-day OOS record */}
        <Card>
          <CardBody className="flex flex-wrap items-center gap-x-8 gap-y-4 p-4">
            {hold ? (
              <>
                <WinRateGauge winRate={hold.wr} size={88} caption={`win rate · ${hold.days}d`} />
                <PerfStat label="Avg return" value={`${hold.ret >= 0 ? '+' : ''}${hold.ret.toFixed(2)}%`} tone={hold.ret >= 0 ? 'up' : 'down'} />
                <PerfStat label="Median" value={`${(hold.days === 10 ? stat!.median_return_10d_pct : stat!.median_return_5d_pct) >= 0 ? '+' : ''}${(hold.days === 10 ? stat!.median_return_10d_pct : stat!.median_return_5d_pct).toFixed(2)}%`} />
                <PerfStat label="Max drawdown" value={`${(stat!.avg_drawdown_pct ?? 0).toFixed(1)}%`} tone="down" />
                <PerfStat label="Signals" value={String(stat!.total_hits)} />
                <PerfStat label="Window" value={`${stat!.lookback_days}d out-of-sample`} />
                <p className="basis-full text-[10.5px] leading-relaxed text-d-text-muted">
                  Historical record of every signal this screen fired, measured out-of-sample — not a
                  guarantee. Raw screens are discovery tools; the gated strategies carry the real edge.
                </p>
              </>
            ) : (
              <p className="text-[12px] text-d-text-muted">
                No performance history yet for this screen — stats appear once it has fired at least 10
                tracked signals.
              </p>
            )}
          </CardBody>
        </Card>

        {/* Live results */}
        <Card>
          <CardBody className="p-0">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="flex items-center gap-2 text-[13px] font-medium text-d-text-primary">
                <ScanLine className="h-3.5 w-3.5 text-primary" />
                Today&apos;s matches
              </span>
              {rows && <Badge tone="muted">{rows.length}</Badge>}
            </div>

            {rows === null ? (
              <div className="space-y-3 p-4">
                {warming && (
                  <p className="text-[12px] text-d-text-muted">
                    Warming the data engine — computing indicators across the NSE universe…
                  </p>
                )}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} w="100%" h="34px" />
                ))}
              </div>
            ) : error ? (
              <EmptyState
                icon={<ScanLine className="h-8 w-8" />}
                title="Couldn't run this screen"
                description={error}
                action={<Button onClick={() => { tries.current = 0; setError(null); setRows(null); void run() }}>Retry</Button>}
              />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<ScanLine className="h-8 w-8" />}
                title="Nothing matched right now"
                description="Markets are quiet for this setup today. Save it as a screen and we'll alert you when names fire."
              />
            ) : (
              <RichScreenResults rows={rows} />
            )}
          </CardBody>
        </Card>

        <DisclaimerFooter />
      </div>
    </div>
  )
}

function PerfStat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div>
      <p className="text-[9.5px] font-medium uppercase tracking-wider text-d-text-muted">{label}</p>
      <p
        className={`mt-0.5 text-[17px] font-semibold tabular-nums ${MONO} ${
          tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-d-text-primary'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
