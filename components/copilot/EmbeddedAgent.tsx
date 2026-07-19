'use client'

/* ============================================================================
   QUANT X — embedded-agent engine (PR-V1 promoted; PR-V2 real-data wiring).
   Owns the streaming choreography (typing → tool-trace → token-by-token
   narration → staggered artifacts).

   Two modes:
   - STATIC (preview): pass `narration` + `trace` → timer-driven reveal.
   - LIVE (real pages): pass `run` → an async fn that hits a real endpoint and
     returns { narration, trace }. The typing indicator shows for the REAL
     request latency, then the actual reply reveals word-by-word. Errors surface
     honestly with a Retry (no fabricated output).

   Chat unification (2026-07-11): these cards are INSIGHT, not chat. The old
   per-card composer + prompt pills (which only handed off to /copilot?q=)
   are gone — the single "Ask Copilot" footer opens the global dock on this
   page with full context. One brain, three surfaces.
   ============================================================================ */

import { useState, useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, RotateCw, Loader2, CheckCircle2, ChevronDown, AlertCircle,
} from '@/lib/icons'
import { MONO } from '@/lib/tokens'
import { EyebrowMono } from '@/components/foundation'
import { dispatchCopilotOpen } from './CopilotProvider'
import type { Tok } from './types'

export type AgentResult = { narration: Tok[]; trace?: ReactNode }

function StreamText({ tokens, n }: { tokens: Tok[]; n: number }) {
  let rem = n
  return <>{tokens.map(([t, emph], i) => { const s = t.slice(0, Math.max(0, rem)); rem -= t.length; return s ? <span key={i} className={emph ? 'font-medium text-d-text-primary' : ''}>{s}</span> : null })}</>
}

export function EmbeddedAgent({
  name, scope, query, trace, narration, run, askPrompt, renderArtifacts,
}: {
  name: string
  scope: string
  query: string
  trace?: ReactNode
  narration?: Tok[]
  /** LIVE mode: hit a real endpoint, resolve to the reply tokens + a trace node. */
  run?: () => Promise<AgentResult>
  /** Optional prefill for the "Ask Copilot" footer — opens the global dock
   *  on this page with the question staged (never auto-sent). */
  askPrompt?: string
  renderArtifacts: (step: number) => ReactNode
}) {
  const [data, setData] = useState<AgentResult | null>(() => (run ? null : { narration: narration ?? [], trace }))
  const [step, setStep] = useState(0) // 0 typing · 1 trace · 2 narration · 3 artifact-1 · 4 artifact-2 · 5 done
  const [n, setN] = useState(0)
  const [err, setErr] = useState(false)
  const [runSeq, setRunSeq] = useState(0)

  // LIVE: kick off the real request on mount + each replay.
  useEffect(() => {
    if (!run) return
    let active = true
    setData(null); setErr(false); setN(0); setStep(0)
    run()
      .then((r) => { if (active) { setData(r); setStep(1) } })
      .catch(() => { if (active) setErr(true) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runSeq])

  const TOTAL = data ? data.narration.reduce((a, [t]) => a + t.length, 0) : 0

  useEffect(() => {
    if (!data || err) return
    if (step >= 5 || step === 2) return
    const d = [650, 850, 0, 480, 620]
    const t = setTimeout(() => setStep((s) => s + 1), d[step])
    return () => clearTimeout(t)
  }, [step, data, err])

  useEffect(() => {
    if (!data || err) return
    if (step < 2) { setN(0); return }
    if (step > 2) { setN(TOTAL); return }
    if (n >= TOTAL) { const t = setTimeout(() => setStep(3), 380); return () => clearTimeout(t) }
    const t = setTimeout(() => setN((v) => Math.min(TOTAL, v + 2)), 18)
    return () => clearTimeout(t)
  }, [step, n, data, err, TOTAL])

  const replay = () => { if (run) { setRunSeq((s) => s + 1) } else { setN(0); setStep(0) } }
  const loading = !data && !err
  const streaming = !err && (loading || step < 5)

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-wrap">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-sm border border-line bg-wrap-hover text-d-text-secondary"><Sparkles size={16} /></div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 text-[13px] font-normal text-d-text-primary">{name}
              {streaming && <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" /></span>}
            </div>
            <div className="text-[10.5px] text-d-text-muted">{err ? 'Agent offline' : streaming ? 'Agent at work…' : scope}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={replay} className="flex items-center gap-1 rounded-pill border border-white/20 bg-transparent px-2 py-1 text-[10.5px] text-d-text-muted transition-colors hover:bg-white/[0.06] hover:text-d-text-primary"><RotateCw size={11} /> {err ? 'Retry' : 'Replay'}</button>
          <EyebrowMono className="text-[9px]">GenUI</EyebrowMono>
        </div>
      </div>

      <div className="space-y-3.5 px-4 py-4">
        <div className="flex justify-end">
          <div className="max-w-[78%] rounded-sm border border-line bg-wrap-hover px-3.5 py-2 text-[12.5px] leading-relaxed text-d-text-primary">{query}</div>
        </div>

        <div className="flex gap-2.5">
          <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-sm border border-line bg-wrap-hover text-d-text-secondary"><Sparkles size={12} /></div>
          <div className="min-w-0 flex-1 space-y-3">
            {err && (
              <div className="flex items-center gap-2 rounded-sm border border-down/30 bg-[color-mix(in_srgb,var(--color-down)_8%,transparent)] px-3 py-2 text-[12px] text-d-text-secondary">
                <AlertCircle size={14} className="text-down" /> The {name} agent dropped the connection. <button onClick={replay} className="font-medium text-d-text-primary underline">Retry</button>
              </div>
            )}
            {!err && step === 0 && (
              <div className="flex items-center gap-1 py-1.5">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
            )}
            {!err && step >= 1 && (
              <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="flex w-full items-center gap-2 rounded-sm border border-line bg-wrap-hover px-2.5 py-1.5 text-left font-mono text-[11px] text-d-text-muted">
                {step < 2 ? <Loader2 size={12} className="animate-spin text-d-text-muted" /> : <CheckCircle2 size={12} className="text-up" />}
                <span className="flex-1 truncate">{data?.trace}</span>
                <ChevronDown size={13} />
              </motion.button>
            )}
            {!err && step >= 2 && data && (
              <p className="text-[12.5px] leading-relaxed text-d-text-secondary">
                <StreamText tokens={data.narration} n={step === 2 ? n : TOTAL} />
                {step === 2 && <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[3px] animate-pulse bg-white" />}
              </p>
            )}
            {!err && renderArtifacts(step)}
          </div>
        </div>
      </div>

      {/* ONE way to talk to the brain from here: open the global dock (with
          this page's context) — no per-card mini-chat. */}
      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={() => dispatchCopilotOpen(askPrompt)}
          aria-label="Ask Copilot about this"
          className="flex w-full items-center justify-center gap-2 rounded-pill border border-line bg-wrap-hover px-3 py-2 text-[12px] text-d-text-secondary transition-colors hover:border-white/30 hover:text-d-text-primary"
        >
          <Sparkles size={13} /> Ask Copilot about this
          <span className={`${MONO} text-[10px] text-d-text-muted`}>⌘/</span>
        </button>
      </div>
    </div>
  )
}
