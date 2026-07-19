'use client'

/**
 * /scanner/my/[id] — one of the user's OWN saved screens, in full.
 *
 * Same detail treatment as the prebuilt pages: rule blocks, live results as
 * rich GenUI, Ask-Copilot — plus manage controls (run now, pause/resume,
 * delete). These are the screens the AI generator creates.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft, Bell, ScanLine, Sparkles, Trash2 } from '@/lib/icons'

import {
  Badge,
  Button,
  Card,
  CardBody,
  Dialog,
  DisclaimerFooter,
  EmptyState,
  PageHeader,
  Skeleton,
  toast,
} from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'
import { MONO } from '@/lib/tokens'
import { RichScreenResults } from '@/components/scanner/RichScreenResults'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'

type Match = NonNullable<Awaited<ReturnType<typeof api.screener.powerConfluence>>>['matches'][number]

const WARMUP_RETRY_MS = 8_000
const WARMUP_MAX_TRIES = 12

export default function MyScreenPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = String(params?.id ?? '')

  const { data, mutate } = useSWR(id ? `saved_scans` : null, () => api.screener.listSavedScans(), {
    revalidateOnFocus: false,
  })
  const scan = useMemo(() => data?.scans?.find((s) => s.id === id), [data, id])

  const [rows, setRows] = useState<Match[] | null>(null)
  const [warming, setWarming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const tries = useRef(0)

  const run = useCallback(async () => {
    if (!scan) return
    try {
      const r = await api.screener.powerConfluence({
        scanners: scan.scanner_ids,
        min_hits: Math.min(scan.min_hits || 1, scan.scanner_ids.length),
        limit: 50,
      })
      setRows(r.matches ?? [])
      setWarming(false)
      setError(null)
    } catch (e) {
      const msg = handleApiError(e)
      if (/not ready/i.test(msg) && tries.current < WARMUP_MAX_TRIES) {
        tries.current += 1
        setWarming(true)
        setTimeout(() => void run(), WARMUP_RETRY_MS)
      } else {
        setWarming(false)
        setError(msg)
      }
    }
  }, [scan])

  useEffect(() => {
    if (!scan) return
    tries.current = 0
    setRows(null)
    setError(null)
    void run()
  }, [scan, run])

  const del = async () => {
    setBusy(true)
    try {
      await api.screener.deleteSavedScan(id)
      toast.success('Screen deleted')
      router.push('/scanner')
    } catch (e) {
      toast.error('Could not delete', { description: handleApiError(e) })
      setBusy(false)
    }
  }

  const toggleEnabled = async () => {
    if (!scan) return
    setBusy(true)
    try {
      await api.screener.updateSavedScan(id, { enabled: !scan.enabled })
      await mutate()
      toast.success(scan.enabled ? 'Alerts paused' : 'Alerts resumed')
    } catch (e) {
      toast.error('Could not update', { description: handleApiError(e) })
    } finally {
      setBusy(false)
    }
  }

  const askCopilot = () => {
    if (!scan) return
    const names = (rows ?? []).slice(0, 8).map((r) => r.symbol).join(', ')
    dispatchCopilotOpen(
      `Analyse my "${scan.name}" screen — matches today: ${names || 'none'}. Which look strongest and why?`,
    )
  }

  if (data && !scan) {
    return (
      <div className="w-full p-6">
        <EmptyState
          icon={<ScanLine className="h-8 w-8" />}
          title="Screen not found"
          description="This saved screen doesn't exist any more."
          action={
            <Link
              href="/scanner"
              className="inline-flex h-9 items-center rounded-pill border border-line px-4 text-[13px] text-d-text-primary transition-colors hover:bg-wrap-hover"
            >
              Back to Screener
            </Link>
          }
        />
      </div>
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
        eyebrow="Screener · My screens"
        title={scan?.name ?? '…'}
        description={
          scan
            ? `Runs ${scan.schedule.replace('_', ' ')} · alerts ${scan.enabled ? 'on' : 'paused'}${
                scan.last_run_at ? ` · last run ${new Date(scan.last_run_at).toLocaleString('en-IN')}` : ''
              }`
            : undefined
        }
        actions={
          scan ? (
            <>
              <Button variant="secondary" onClick={toggleEnabled} disabled={busy}>
                <Bell className="mr-1 h-3.5 w-3.5" />
                {scan.enabled ? 'Pause alerts' : 'Resume alerts'}
              </Button>
              <Button variant="ai" onClick={askCopilot}>
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Ask Copilot
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(true)} disabled={busy}>
                <Trash2 className="h-3.5 w-3.5 text-down" />
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="space-y-5 px-4 py-5 md:px-6">
        {/* The rules */}
        <Card>
          <CardBody className="space-y-2 p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-d-text-muted">
              The rules
            </p>
            {scan ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {scan.scanner_ids.map((sid) => (
                  <ScannerBlockChip key={sid} id={sid} />
                ))}
                {scan.scanner_ids.length > 1 && (
                  <span className="text-[11px] text-d-text-muted">
                    · match ≥{Math.min(scan.min_hits || 1, scan.scanner_ids.length)}
                  </span>
                )}
              </div>
            ) : (
              <Skeleton w="60%" h="28px" />
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
                {[0, 1, 2, 3, 4].map((i) => (
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
                description={`Markets are quiet for this setup today. It keeps running ${scan?.schedule === 'hourly' ? 'every hour' : scan?.schedule.replace('_', ' ')} — alerts land in your inbox.`}
              />
            ) : (
              <RichScreenResults rows={rows} />
            )}
          </CardBody>
        </Card>

        <DisclaimerFooter />
      </div>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this screen?">
        <p className="text-[13px] leading-relaxed text-d-text-secondary">
          {scan?.name} and its alert schedule will be removed. This can&apos;t be undone.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Keep it
          </Button>
          <Button variant="danger" onClick={() => void del()} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete screen'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

/** One rule block — resolves its display name from the shared catalog. */
function ScannerBlockChip({ id }: { id: number }) {
  const { data: catalog } = useSWR('scanner_catalog', () => api.screener.powerCatalog(), {
    revalidateOnFocus: false,
    dedupingInterval: 600_000,
  })
  const name = catalog?.scanners?.find((s) => s.id === id)?.name ?? `Scanner ${id}`
  return (
    <span
      className={`inline-flex items-center rounded-pill border border-line bg-main px-3 py-1.5 text-[12px] ${MONO} text-d-text-primary`}
    >
      {name}
    </span>
  )
}
