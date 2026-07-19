'use client'

/**
 * /scanner/fundamental/[preset] — one fundamental screen, in full (Phase 3).
 *
 * Screens the fundamentals snapshot (PE / ROE / ROCE / growth / dividend /
 * promoter), NOT the technical confluence engine — so this is a dedicated
 * page rather than the /scanner/[key] technical detail. Rows link to the
 * stock page; Ask-Copilot hands the matches to the global dock. Honest-empty
 * (with the backend `note`) when a preset's columns aren't populated yet.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft, Coins, Download, FileText, ScanLine, Sparkles } from '@/lib/icons'

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
import { api } from '@/lib/api'
import { MONO } from '@/lib/tokens'
import { findFundamentalPreset } from '@/lib/prebuilt-screeners'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { downloadCsv, printReport } from '@/lib/export'

type Row = NonNullable<Awaited<ReturnType<typeof api.screener.fundamentalScreen>>>['results'][number]

const fmtNum = (v: number | null, dp = 1, suffix = '') =>
  v == null || Number.isNaN(v) ? '—' : `${v.toFixed(dp)}${suffix}`
const fmtMcap = (v: number | null) =>
  v == null ? '—' : v >= 1e5 ? `₹${(v / 1e5).toFixed(2)}L Cr` : v >= 1e3 ? `₹${(v / 1e3).toFixed(1)}K Cr` : `₹${v.toFixed(0)} Cr`

export default function FundamentalScreenPage() {
  const params = useParams<{ preset: string }>()
  const preset = String(params?.preset ?? '')
  const meta = findFundamentalPreset(preset)

  const { data, isLoading, error } = useSWR(
    preset ? ['fundamental', preset] : null,
    () => api.screener.fundamentalScreen(preset, 50),
    { revalidateOnFocus: false },
  )

  const rows = data?.results ?? []

  const askCopilot = () => {
    const names = rows.slice(0, 8).map((r) => r.symbol).join(', ')
    dispatchCopilotOpen(
      `Analyse my "${meta?.name ?? preset}" fundamental screen — top matches: ${names || 'none'}. Which look strongest and why?`,
    )
  }

  const EXPORT_COLS = ['Symbol', 'PE', 'ROE %', 'ROCE %', 'Profit Gr %', 'Sales Gr %', 'Div Yld %', 'Promoter %', 'M-cap (Cr)', 'Quality']
  const exportRows = () =>
    rows.map((r) => [
      r.symbol, r.pe, r.roe, r.roce, r.profit_growth, r.sales_growth,
      r.dividend_yield, r.promoter_pct, r.market_cap_cr, `${r.quality_score}/5`,
    ])
  const onCsv = () => downloadCsv(`quantx_${preset}`, EXPORT_COLS, exportRows())
  const onPdf = () =>
    printReport({ title: meta?.name ?? 'Fundamental screen', subtitle: `${rows.length} matches`, columns: EXPORT_COLS, rows: exportRows() })

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
        eyebrow="Screener · Fundamental"
        title={meta?.name ?? 'Fundamental screen'}
        description={meta?.blurb}
        actions={
          <>
            {rows.length > 0 && (
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

      <div className="space-y-5 px-4 py-5 md:px-6">
        <Card>
          <CardBody className="p-0">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="flex items-center gap-2 text-[13px] font-medium text-d-text-primary">
                <Coins className="h-3.5 w-3.5 text-primary" />
                Matches
              </span>
              {data && <Badge tone="muted">{data.count}</Badge>}
            </div>

            {isLoading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} w="100%" h="34px" />
                ))}
              </div>
            ) : error ? (
              <EmptyState
                icon={<ScanLine className="h-8 w-8" />}
                title="Couldn't run this screen"
                description="The fundamentals data engine is unavailable right now."
              />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<ScanLine className="h-8 w-8" />}
                title="Nothing matched"
                description={
                  data?.note
                    ? `${data.note} — this screen will fill in once that data is ingested.`
                    : 'No stocks currently pass this fundamental filter.'
                }
              />
            ) : (
              <FundamentalTable rows={rows} />
            )}
          </CardBody>
        </Card>

        <p className={`px-1 text-[10.5px] ${MONO} text-d-text-muted`}>
          Quality Score (0-5) is a transparent composite of ROCE, ROE, profit &amp; sales growth,
          and promoter holding — not a Piotroski F-score (which needs statement-level data we don&apos;t ingest).
        </p>
        <DisclaimerFooter />
      </div>
    </div>
  )
}

function FundamentalTable({ rows }: { rows: Row[] }) {
  const [sortKey, setSortKey] = useState<keyof Row>('quality_score')
  const [asc, setAsc] = useState(false)

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = (a[sortKey] ?? -Infinity) as number
      const bv = (b[sortKey] ?? -Infinity) as number
      return asc ? av - bv : bv - av
    })
    return copy
  }, [rows, sortKey, asc])

  const toggle = (k: keyof Row) => {
    if (k === sortKey) setAsc((v) => !v)
    else {
      setSortKey(k)
      setAsc(false)
    }
  }

  const cols: Array<{ k: keyof Row; label: string; render: (r: Row) => string; tone?: (r: Row) => string }> = [
    { k: 'pe', label: 'PE', render: (r) => fmtNum(r.pe, 1) },
    { k: 'roce', label: 'ROCE', render: (r) => fmtNum(r.roce, 0, '%'), tone: (r) => ((r.roce ?? 0) >= 15 ? 'text-up' : 'text-d-text-primary') },
    { k: 'roe', label: 'ROE', render: (r) => fmtNum(r.roe, 0, '%') },
    { k: 'profit_growth', label: 'Profit Gr', render: (r) => fmtNum(r.profit_growth, 0, '%'), tone: (r) => ((r.profit_growth ?? 0) >= 0 ? 'text-up' : 'text-down') },
    { k: 'dividend_yield', label: 'Div Yld', render: (r) => fmtNum(r.dividend_yield, 1, '%') },
    { k: 'market_cap_cr', label: 'M-cap', render: (r) => fmtMcap(r.market_cap_cr) },
    { k: 'quality_score', label: 'Quality', render: (r) => `${r.quality_score}/5`, tone: (r) => (r.quality_score >= 4 ? 'text-up' : 'text-d-text-primary') },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-line text-d-text-muted">
            <th className="px-4 py-2 text-left font-medium">Symbol</th>
            {cols.map((c) => (
              <th key={String(c.k)} className={`px-3 py-2 text-right font-medium ${MONO}`}>
                <button onClick={() => toggle(c.k)} className="transition-colors hover:text-d-text-primary">
                  {c.label}
                  {sortKey === c.k ? (asc ? ' ↑' : ' ↓') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.symbol} className="border-b border-line/50 last:border-0 hover:bg-wrap-hover">
              <td className="px-4 py-2">
                <Link href={`/stock/${r.symbol}`} className="font-medium text-d-text-primary hover:text-ai">
                  {r.symbol}
                </Link>
              </td>
              {cols.map((c) => (
                <td key={String(c.k)} className={`px-3 py-2 text-right tabular-nums ${MONO} ${c.tone ? c.tone(r) : 'text-d-text-secondary'}`}>
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
