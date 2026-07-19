'use client'

/**
 * /ipo — the IPO center (Phase 4).
 *
 * Open + upcoming Indian IPOs from NSE's primary-market feed: price band,
 * dates, status, and (for open issues) the live subscription multiple. Public,
 * honest-empty when NSE is unreachable. No GMP (grey-market premium) — that's
 * unofficial data we don't source; the disclaimer says so plainly.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Download, FileText, Flame, ScanLine, Sparkles } from '@/lib/icons'

import {
  Badge,
  Button,
  Card,
  CardBody,
  DisclaimerFooter,
  EmptyState,
  PageHeader,
  Skeleton,
} from '@/components/foundation'
import { api, type IpoIssue } from '@/lib/api'
import { MONO } from '@/lib/tokens'
import { DataBadge } from '@/components/common/DataBadge'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { downloadCsv, printReport } from '@/lib/export'

const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export default function IpoPage() {
  const { data, isLoading } = useSWR('ipo:calendar', () => api.ipo.calendar(), {
    revalidateOnFocus: false,
    refreshInterval: 5 * 60_000,
  })

  const open = data?.open ?? []
  const upcoming = data?.upcoming ?? []
  const empty = !isLoading && open.length === 0 && upcoming.length === 0

  const askCopilot = () => {
    const names = [...open, ...upcoming].slice(0, 6).map((x) => x.symbol || x.company).join(', ')
    dispatchCopilotOpen(`What's happening with the current IPOs${names ? ` (${names})` : ''}? Which look worth watching?`)
  }

  const EXPORT_COLS = ['Company', 'Symbol', 'Price band', 'Open', 'Close', 'Status', 'Subscribed (x)']
  const allIssues = [...open, ...upcoming]
  const exportRows = () =>
    allIssues.map((x) => [
      x.company, x.symbol, x.price_band, x.open_date, x.close_date, x.status,
      x.subscription_x != null ? x.subscription_x : '',
    ])
  const onCsv = () => downloadCsv('quantx_ipo_calendar', EXPORT_COLS, exportRows())
  const onPdf = () =>
    printReport({
      title: 'IPO Calendar', subtitle: `${open.length} open · ${upcoming.length} upcoming`,
      columns: EXPORT_COLS, rows: exportRows(),
      note: 'GMP (grey-market premium) is unofficial and not published. Subscription = latest NSE snapshot.',
    })

  return (
    <div className="w-full pb-8">
      <PageHeader
        eyebrow="Primary market"
        title="IPO center"
        description="Open and upcoming Indian IPOs — price band, dates, and live subscription. Sourced from NSE."
        actions={
          <>
            <DataBadge mode="eod" />
            {allIssues.length > 0 && (
              <>
                <Button variant="secondary" onClick={onCsv} title="Export to Excel/CSV">
                  <Download className="mr-1 h-3.5 w-3.5" /> Excel
                </Button>
                <Button variant="secondary" onClick={onPdf} title="Download as PDF">
                  <FileText className="mr-1 h-3.5 w-3.5" /> PDF
                </Button>
              </>
            )}
            <Button variant="ai" onClick={askCopilot}>
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Ask Copilot
            </Button>
          </>
        }
      />

      <div className="space-y-6 px-4 py-5 md:px-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton w="30%" h="20px" />
            {[0, 1, 2].map((i) => <Skeleton key={i} w="100%" h="44px" />)}
          </div>
        ) : empty ? (
          <EmptyState
            icon={<Flame className="h-8 w-8" />}
            title="No IPOs on the calendar"
            description={
              data?.available === false
                ? 'The NSE primary-market feed is unavailable right now — check back shortly.'
                : 'There are no open or upcoming mainboard IPOs at the moment.'
            }
          />
        ) : (
          <>
            <IpoSection title="Open now" issues={open} open />
            <IpoSection title="Upcoming" issues={upcoming} />
          </>
        )}

        <p className={`px-1 text-[10.5px] ${MONO} text-d-text-muted`}>
          GMP (grey-market premium) is unofficial and unregulated — we don&apos;t publish it. Subscription
          figures are the latest NSE snapshot, not real-time.
        </p>
        <DisclaimerFooter />
      </div>
    </div>
  )
}

function IpoSection({ title, issues, open = false }: { title: string; issues: IpoIssue[]; open?: boolean }) {
  const rows = useMemo(() => issues, [issues])
  if (rows.length === 0) return null
  return (
    <Card>
      <CardBody className="p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="flex items-center gap-2 text-[13px] font-medium text-d-text-primary">
            <Flame className={`h-3.5 w-3.5 ${open ? 'text-up' : 'text-primary'}`} />
            {title}
          </span>
          <Badge tone="muted">{rows.length}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-d-text-muted">
                <th className="px-4 py-2 text-left font-medium">Company</th>
                <th className={`px-3 py-2 text-right font-medium ${MONO}`}>Price band</th>
                <th className={`px-3 py-2 text-right font-medium ${MONO}`}>Open</th>
                <th className={`px-3 py-2 text-right font-medium ${MONO}`}>Close</th>
                {open && <th className={`px-3 py-2 text-right font-medium ${MONO}`}>Subscribed</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={(x.symbol || x.company || '') + (x.open_date || '')} className="border-b border-line/50 last:border-0 hover:bg-wrap-hover">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-d-text-primary">{x.company || x.symbol}</div>
                    {x.symbol && <div className={`text-[10.5px] ${MONO} text-d-text-muted`}>{x.symbol}</div>}
                  </td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${MONO} text-d-text-secondary`}>{x.price_band || '—'}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${MONO} text-d-text-secondary`}>{fmtDate(x.open_date)}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${MONO} text-d-text-secondary`}>{fmtDate(x.close_date)}</td>
                  {open && (
                    <td className={`px-3 py-2.5 text-right tabular-nums ${MONO} ${(x.subscription_x ?? 0) >= 1 ? 'text-up' : 'text-d-text-primary'}`}>
                      {x.subscription_x != null ? `${x.subscription_x.toFixed(2)}x` : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}
