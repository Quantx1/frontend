'use client'

/**
 * VisionUpload — Builder control for the Vision-to-Strategy bridge.
 *
 * Upload a chart screenshot → the server returns a structured read and a
 * PURE-synthesized plain-English strategy prompt. On success we hand the
 * prompt up to the parent (which writes it into the Builder textarea) so the
 * user reviews/edits it and clicks the EXISTING "Compile to DSL" button. We
 * never auto-compile here — the human review step is preserved.
 *
 * Long-only: bearish / no-edge / unreadable reads come back with prompt=null
 * and an honest note (we never fabricate a losing long).
 */

import { useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, Loader2, ScanLine } from '@/lib/icons'

import { api, handleApiError } from '@/lib/api'
import { AnalysisView } from '@/components/stock/ChartVisionCard'
import type { Timeframe, VisionStrategyDraftResult } from '@/types/strategies'


interface Props {
  onPromptReady: (prompt: string) => void
}

// Value matches the DSL Timeframe union; label is human-friendly.
const TIMEFRAMES: Array<{ value: Timeframe; label: string }> = [
  { value: '1d', label: 'Daily' },
  { value: '1h', label: '1 hour' },
  { value: '30m', label: '30 min' },
  { value: '15m', label: '15 min' },
  { value: '5m', label: '5 min' },
  { value: '1m', label: '1 min' },
]


export default function VisionUpload({ onPromptReady }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [symbol, setSymbol] = useState('')
  const [timeframe, setTimeframe] = useState<Timeframe>('1d')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VisionStrategyDraftResult | null>(null)

  const canRead = !!file && symbol.trim().length > 0 && !loading

  const readAsBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('Could not read the file.'))
      reader.onload = () => {
        const dataUrl = String(reader.result || '')
        const comma = dataUrl.indexOf(',')
        resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl)
      }
      reader.readAsDataURL(f)
    })

  const onRead = async () => {
    if (!file || !symbol.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const base64 = await readAsBase64(file)
      const mime = file.type || 'image/png'
      const r = await api.strategies.studioVisionDraft(base64, {
        mime,
        symbol: symbol.trim(),
        timeframe,
        compile: false,
      })
      setResult(r)
      if (r.prompt) onPromptReady(r.prompt)
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-wrap p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-[11px] text-d-text-muted">Symbol</span>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="RELIANCE"
            aria-label="Symbol for the uploaded chart"
            className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-d-text-primary outline-none placeholder:text-d-text-muted focus:border-d-text-muted"
          />
        </label>

        <label className="sm:w-36">
          <span className="mb-1 block text-[11px] text-d-text-muted">Timeframe</span>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            aria-label="Chart timeframe"
            className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-d-text-primary outline-none focus:border-d-text-muted"
          >
            {TIMEFRAMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[13px] text-d-text-secondary transition-colors hover:text-d-text-primary"
        >
          <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
          Choose chart image
        </button>
        {file && (
          <span className="max-w-[14rem] truncate text-[11px] text-d-text-muted" title={file.name}>
            {file.name}
          </span>
        )}
        <button
          type="button"
          onClick={onRead}
          disabled={!canRead}
          className="bg-gradient-cta ml-auto inline-flex h-9 items-center gap-1.5 rounded-pill px-4 text-[13px] font-semibold text-on-signature transition-transform active:scale-[0.97] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Reading…
            </>
          ) : (
            <>
              Read chart
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-down/40 bg-down/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-down" aria-hidden="true" />
          <p className="text-xs text-down">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-3">
          {result.analysis.available && <AnalysisView a={result.analysis} />}

          {result.prompt ? (
            <p className="text-[11px] text-d-text-muted">
              We filled in a starting prompt above from this read — review and edit it,
              then hit Compile to DSL.
            </p>
          ) : (
            result.note && (
              <div className="flex items-start gap-2 rounded-lg border border-line bg-wrap px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-d-text-muted" aria-hidden="true" />
                <p className="text-xs text-d-text-secondary">{result.note}</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
