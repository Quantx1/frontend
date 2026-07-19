'use client'

import { useState } from 'react'
import { ChevronDown } from '@/lib/icons'
import { Card, CardBody, CardHeader } from '@/components/foundation'
import type { ManagedOverview } from '@/lib/api'

const LABEL_CLASS: Record<string, string> = {
  Healthy: 'text-success',
  Watch: 'text-warning',
  'At risk': 'text-danger',
}

const RING_CLASS: Record<string, string> = {
  Healthy: 'stroke-success',
  Watch: 'stroke-warning',
  'At risk': 'stroke-danger',
}

/**
 * Portfolio health — a transparent 0–100 score. Every deduction the backend
 * applied is itemised under "Why this score", so the number is explainable,
 * never a black box.
 */
export default function HealthScoreCard({ health }: { health: ManagedOverview['health'] }) {
  const [open, setOpen] = useState(false)
  const r = 34
  const c = 2 * Math.PI * r
  const filled = (health.score / 100) * c

  return (
    <Card>
      <CardHeader>Portfolio health</CardHeader>
      <CardBody>
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0" role="img" aria-label={`Health score ${health.score} of 100`}>
            <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
              <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" className="stroke-wrap-hover" />
              <circle
                cx="40" cy="40" r={r} fill="none" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${filled} ${c - filled}`}
                className={RING_CLASS[health.label] ?? 'stroke-primary'}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-d-text-primary">
              {health.score}
            </span>
          </div>
          <div className="min-w-0">
            <p className={`text-lg font-semibold ${LABEL_CLASS[health.label] ?? 'text-d-text-primary'}`}>
              {health.label}
            </p>
            <p className="text-xs text-d-text-muted">
              {health.components.length === 0
                ? 'No active risk flags on your account.'
                : `${health.components.length} item${health.components.length > 1 ? 's' : ''} lowered the score.`}
            </p>
          </div>
        </div>

        {health.components.length > 0 && (
          <div className="mt-4 border-t border-wrap-hover pt-3">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-d-text-secondary transition-colors hover:text-d-text-primary"
              aria-expanded={open}
            >
              Why this score
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <ul className="mt-2 space-y-1.5">
                {health.components.map((c) => (
                  <li key={c.key} className="flex items-start gap-2 text-xs">
                    <span className="shrink-0 font-mono text-danger">{c.impact}</span>
                    <span className="text-d-text-muted">{c.detail || c.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
