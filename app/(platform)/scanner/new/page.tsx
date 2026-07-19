'use client'

/**
 * /scanner/new — the AI screen generator.
 *
 * Describe the screen in plain English → QuantX compiles it into REAL
 * scanner blocks (rules-first, LLM for nuance) → tweak the blocks
 * (remove / add from the catalog / set match-≥N) → preview live matches →
 * name it and save. Saved screens join the gallery under "My screens" with
 * their own page at /scanner/my/[id], running hourly with inbox alerts.
 */

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft, Plus, ScanLine, Sparkles, X } from '@/lib/icons'

import {
  Badge,
  Button,
  Card,
  CardBody,
  DisclaimerFooter,
  EmptyState,
  Input,
  PageHeader,
  Popover,
  Skeleton,
  toast,
} from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'
import { MONO } from '@/lib/tokens'
import { RichScreenResults } from '@/components/scanner/RichScreenResults'

type Block = { id: number; name: string }
type Match = NonNullable<Awaited<ReturnType<typeof api.screener.powerConfluence>>>['matches'][number]

const EXAMPLES = [
  'Oversold quality names bouncing in an uptrend',
  'Breakouts on heavy volume near 52-week highs',
  'Momentum leaders with fresh MACD crossovers',
  'Institutional buying with long buildup in F&O',
]

const WARMUP_RETRY_MS = 8_000
const WARMUP_MAX_TRIES = 12

export default function NewScreenPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [compiling, setCompiling] = useState(false)
  const [source, setSource] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<Block[] | null>(null)
  const [minHits, setMinHits] = useState(1)
  const [rows, setRows] = useState<Match[] | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [warming, setWarming] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const tries = useRef(0)

  // Full catalog for "+ Add block".
  const { data: catalog } = useSWR('scanner_catalog', () => api.screener.powerCatalog(), {
    revalidateOnFocus: false,
    dedupingInterval: 600_000,
  })
  const grouped = useMemo(() => {
    const g: Record<string, NonNullable<typeof catalog>['scanners']> = {}
    for (const s of catalog?.scanners ?? []) (g[s.category] ??= [] as any).push(s)
    return g
  }, [catalog])

  const compile = async () => {
    if (!prompt.trim()) return
    setCompiling(true)
    setRows(null)
    try {
      const r = await api.screener.nlCompile(prompt.trim())
      setSource(r.source)
      if (!r.recognized || r.blocks.length === 0) {
        setBlocks([])
      } else {
        setBlocks(r.blocks)
        setMinHits(1)
        if (!name) setName(prompt.trim().slice(0, 60))
      }
    } catch (e) {
      toast.error('Could not compile', { description: handleApiError(e) })
    } finally {
      setCompiling(false)
    }
  }

  const preview = async () => {
    if (!blocks || blocks.length === 0) return
    setPreviewing(true)
    setRows(null)
    tries.current = 0
    const attempt = async () => {
      try {
        const r = await api.screener.powerConfluence({
          scanners: blocks.map((b) => b.id),
          min_hits: Math.min(minHits, blocks.length),
          limit: 50,
        })
        setRows(r.matches ?? [])
        setWarming(false)
        setPreviewing(false)
      } catch (e) {
        const msg = handleApiError(e)
        if (/not ready/i.test(msg) && tries.current < WARMUP_MAX_TRIES) {
          tries.current += 1
          setWarming(true)
          setTimeout(() => void attempt(), WARMUP_RETRY_MS)
        } else {
          setWarming(false)
          setPreviewing(false)
          toast.error('Preview failed', { description: msg })
        }
      }
    }
    void attempt()
  }

  const save = async () => {
    if (!blocks || blocks.length === 0 || !name.trim()) return
    setSaving(true)
    try {
      const r = await api.screener.createSavedScan({
        name: name.trim(),
        scanner_ids: blocks.map((b) => b.id),
        min_hits: Math.min(minHits, blocks.length),
        schedule: 'hourly',
      })
      toast.success('Screen created', {
        description: `${name.trim()} runs hourly — alerts land in your inbox.`,
      })
      router.push(`/scanner/my/${r.id}`)
    } catch (e) {
      toast.error('Could not save', { description: handleApiError(e) })
      setSaving(false)
    }
  }

  const removeBlock = (id: number) => setBlocks((b) => (b ? b.filter((x) => x.id !== id) : b))
  const addBlock = (id: number, blockName: string) =>
    setBlocks((b) => (b && !b.some((x) => x.id === id) ? [...b, { id, name: blockName }] : b))

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
        eyebrow="Screener · Create"
        title="Create a screen with AI"
        description="Describe the setup you want. QuantX compiles it into real scanner blocks you can tweak, preview and save — it then runs on a schedule and alerts you."
      />

      <div className="space-y-5 px-4 py-5 md:px-6">
        {/* 1 — describe */}
        <Card>
          <CardBody className="space-y-3 p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-d-text-muted">
              1 · Describe it
            </p>
            <div className="flex gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void compile()
                  }
                }}
                rows={2}
                placeholder="e.g. Oversold large caps bouncing on above-average volume"
                aria-label="Describe your screen"
                className="min-h-[64px] flex-1 resize-none rounded-lg border border-line bg-main px-3 py-2.5 text-[13.5px] text-d-text-primary placeholder:text-d-text-muted/60 focus:border-wrap-line focus:outline-none"
              />
              <Button onClick={() => void compile()} disabled={compiling || !prompt.trim()} className="self-end">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                {compiling ? 'Compiling…' : 'Generate'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="rounded-pill border border-line px-3 py-1 text-[11.5px] text-d-text-secondary transition-colors hover:bg-wrap-hover"
                >
                  {ex}
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* 2 — tweak the blocks */}
        {blocks !== null && (
          <Card>
            <CardBody className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium uppercase tracking-wider text-d-text-muted">
                  2 · The rules — tweak freely
                </p>
                {source && <Badge tone="muted">resolved via {source}</Badge>}
              </div>

              {blocks.length === 0 ? (
                <p className="text-[12.5px] text-d-text-muted">
                  Couldn&apos;t map that to known setups — try terms like RSI, breakout, volume,
                  momentum, 52-week high, oversold, FII buying. Or add blocks by hand below.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  {blocks.map((b) => (
                    <span
                      key={b.id}
                      className={`inline-flex items-center gap-1.5 rounded-pill border border-line bg-main px-3 py-1.5 text-[12px] ${MONO} text-d-text-primary`}
                    >
                      {b.name}
                      <button
                        onClick={() => removeBlock(b.id)}
                        aria-label={`Remove ${b.name}`}
                        className="text-d-text-muted transition-colors hover:text-down"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
                <Popover
                  side="bottom"
                  align="start"
                  trigger={
                    <Button variant="secondary" size="sm">
                      <Plus className="mr-1 h-3 w-3" />
                      Add block
                    </Button>
                  }
                  className="max-h-80 w-80 overflow-y-auto p-2"
                >
                  {Object.entries(grouped).map(([cat, scanners]) => (
                    <div key={cat} className="mb-2">
                      <p className="px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-d-text-muted">
                        {cat}
                      </p>
                      {scanners.map((s) => {
                        const added = blocks?.some((b) => b.id === s.id)
                        return (
                          <button
                            key={s.id}
                            disabled={added}
                            onClick={() => addBlock(s.id, s.name)}
                            className="block w-full rounded-md px-2 py-1.5 text-left text-[12px] text-d-text-primary transition-colors hover:bg-wrap-hover disabled:opacity-40"
                          >
                            {s.name}
                            <span className="ml-1.5 text-[10px] text-d-text-muted">{s.direction}</span>
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </Popover>

                {blocks.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-d-text-muted">Match ≥</span>
                    {[1, 2, 3].filter((n) => n <= blocks.length).map((n) => (
                      <button
                        key={n}
                        onClick={() => setMinHits(n)}
                        aria-pressed={minHits === n}
                        className={`h-7 w-7 rounded-pill border text-[12px] ${MONO} transition-colors ${
                          minHits === n
                            ? 'border-transparent bg-primary text-on-signature'
                            : 'border-line text-d-text-secondary hover:bg-wrap-hover'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <span className="text-[11px] text-d-text-muted">of {blocks.length} blocks</span>
                  </div>
                )}

                <Button
                  onClick={() => void preview()}
                  disabled={previewing || !blocks || blocks.length === 0}
                  className="ml-auto"
                >
                  <ScanLine className="mr-1 h-3.5 w-3.5" />
                  {previewing ? 'Running…' : 'Preview matches'}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* 3 — preview + save */}
        {(previewing || rows !== null) && (
          <Card>
            <CardBody className="p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5">
                <span className="flex items-center gap-2 text-[13px] font-medium text-d-text-primary">
                  <ScanLine className="h-3.5 w-3.5 text-primary" />
                  Preview
                  {rows && <Badge tone="muted">{rows.length}</Badge>}
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name this screen"
                    aria-label="Screen name"
                    className="h-8 w-56"
                  />
                  <Button onClick={() => void save()} disabled={saving || !name.trim() || !rows}>
                    {saving ? 'Saving…' : 'Save screen'}
                  </Button>
                </div>
              </div>
              {rows === null ? (
                <div className="space-y-3 p-4">
                  {warming && (
                    <p className="text-[12px] text-d-text-muted">
                      Warming the data engine — computing indicators across the NSE universe…
                    </p>
                  )}
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} w="100%" h="34px" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <EmptyState
                  icon={<ScanLine className="h-8 w-8" />}
                  title="No matches right now"
                  description="The rules work — markets are just quiet for this setup today. Save it and we'll alert you when names fire."
                />
              ) : (
                <RichScreenResults rows={rows} />
              )}
            </CardBody>
          </Card>
        )}

        <DisclaimerFooter />
      </div>
    </div>
  )
}
