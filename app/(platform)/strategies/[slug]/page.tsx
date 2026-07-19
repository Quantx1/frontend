'use client'

/**
 * /strategies/[slug] — DSL template detail page.
 *
 * Fetches the template from /api/strategies/catalog/{slug} (PR-S) and
 * renders the DSL preview, template metadata, and a "Clone to my
 * strategies" action that POSTs /from-template/{slug} → user_strategies
 * row → redirects to /strategies/mine/{id} where the user can backtest +
 * deploy.
 *
 * The legacy hardcoded STRATEGIES list (`lib/strategies.ts`) was retired
 * with this rewrite — the catalog is now seeded server-side.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Copy, ArrowRight } from '@/lib/icons'

import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  Skeleton,
  toast,
} from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'
import { formatPercent, asPercent } from '@/lib/utils'
import type { CatalogTemplate } from '@/types/strategies'
import { DSLPreview } from '@/components/strategies/DSLPreview'

const TIER_LABEL: Record<CatalogTemplate['tier_required'], string> = {
  free: 'Free',
  pro: 'Pro',
  elite: 'Elite',
}

export default function StrategyTemplatePage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params?.slug

  const [tpl, setTpl] = useState<CatalogTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cloning, setCloning] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.strategies.getCatalogTemplate(slug)
        if (cancelled) return
        setTpl(r.template)
      } catch (e) {
        if (cancelled) return
        setError(handleApiError(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  // Coming-soon templates carry a 'coming-soon' tag + a 'blocked:<reason>' tag
  // and are seeded with dsl=NULL; cloning them 409s. Detect + render a clear
  // disabled state with the ETA (appended to the description) instead.
  const comingSoon = !!tpl?.tags?.includes('coming-soon')

  const onClone = async () => {
    if (!tpl || comingSoon) return
    setCloning(true)
    try {
      const r = await api.strategies.cloneFromTemplate(tpl.slug)
      toast.success('Template cloned to your strategies as a draft')
      router.push(`/strategies/mine/${r.strategy.id}`)
    } catch (e) {
      toast.error('Could not clone template', { description: handleApiError(e) })
      setCloning(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <Skeleton w="40%" h="32px" />
        <Skeleton w="70%" h="16px" />
        <Skeleton w="100%" h="240px" />
      </div>
    )
  }

  if (error || !tpl) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <EmptyState
          tone="error"
          icon={<ChevronLeft className="h-6 w-6" />}
          title="Template not found"
          description={error || `No template with slug "${slug}".`}
          action={
            <Button onClick={() => router.push('/strategies')}>
              Back to library
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <span className="truncate">{tpl.name}</span>
            <Badge tone={tpl.tier_required === 'free' ? 'muted' : 'warning'}>
              {TIER_LABEL[tpl.tier_required]}
            </Badge>
            {tpl.is_featured && <Badge tone="primary">Featured</Badge>}
            {tpl.is_exclusive && <Badge tone="warning">Exclusive</Badge>}
            {comingSoon && <Badge tone="muted">Coming soon</Badge>}
          </span> as unknown as string
        }
        description={tpl.description || `${tpl.segment} · ${tpl.category}`}
        actions={
          comingSoon ? (
            <Button disabled title="This template isn't available to clone yet">
              <Copy className="mr-1 h-3.5 w-3.5" />
              Coming soon
            </Button>
          ) : (
            <Button onClick={onClone} disabled={cloning}>
              <Copy className="mr-1 h-3.5 w-3.5" />
              {cloning ? 'Cloning…' : 'Clone to my strategies'}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <Link
          href="/strategies"
          className="inline-flex items-center gap-1 text-xs text-d-text-muted transition-colors hover:text-d-text-primary"
        >
          <ChevronLeft className="h-3 w-3" />
          All strategies
        </Link>

        {/* ── Backtest KPI strip (only if the catalog row has numbers) ── */}
        {(tpl.backtest_win_rate != null ||
          tpl.backtest_cagr != null ||
          tpl.backtest_sharpe != null ||
          tpl.backtest_max_drawdown != null) && (
          <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Metric label="Win rate" value={formatPercent(tpl.backtest_win_rate, 1)} />
            <Metric label="CAGR" value={formatPercent(tpl.backtest_cagr, 1)} />
            <Metric
              label="Sharpe"
              value={
                tpl.backtest_sharpe != null ? tpl.backtest_sharpe.toFixed(2) : '—'
              }
            />
            <Metric
              label="Max DD"
              value={(() => {
                const mdPct = asPercent(tpl.backtest_max_drawdown)
                if (mdPct == null) return '—'
                return `-${Math.abs(mdPct).toFixed(1)}%`
              })()}
              tone="down"
            />
          </div>
          <p className="mt-1.5 text-[10px] text-d-text-muted">
            Indicative figures from the template author — not Quant X
            gate-verified. The backtest gate runs before any deploy.
          </p>
          </>
        )}

        {/* ── Template metadata ── */}
        <Card>
          <CardBody className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Meta label="Segment" value={tpl.segment} />
            <Meta label="Category" value={tpl.category} />
            <Meta
              label="Min capital"
              value={
                tpl.min_capital
                  ? `₹${(tpl.min_capital / 1000).toFixed(0)}k`
                  : '—'
              }
            />
            <Meta
              label="Engines used"
              value={
                tpl.engines_used && tpl.engines_used.length > 0
                  ? tpl.engines_used.join(' · ')
                  : 'None (indicator-only)'
              }
            />
          </CardBody>
        </Card>

        {/* ── DSL ── */}
        {tpl.dsl ? (
          <DSLPreview dsl={tpl.dsl} />
        ) : comingSoon ? (
          <Card>
            <CardBody className="space-y-1 py-8 text-center">
              <p className="text-sm font-medium text-d-text-primary">Coming soon</p>
              <p className="text-xs text-d-text-muted">
                {tpl.description?.includes('ETA:')
                  ? tpl.description.slice(tpl.description.indexOf('ETA:'))
                  : 'This template is being prepared and isn’t available to clone yet.'}
              </p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="py-8 text-center text-sm text-d-text-muted">
              No DSL attached — this is a metadata-only template.
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'down'
}) {
  const color = tone === 'down' ? 'text-down' : 'text-d-text-primary'
  return (
    <div className="rounded-md border border-line bg-wrap p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-d-text-muted">
        {label}
      </p>
      <p className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-d-text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-d-text-primary">{value}</p>
    </div>
  )
}
