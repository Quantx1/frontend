'use client'

/**
 * BrokerPositionsPanel — LIVE broker positions + open orders, polled.
 *
 * Reads three read-only broker endpoints (positions / orders / margin) on a
 * 15s SWR refresh so an order placed elsewhere shows up here without a reload.
 * Gated behind <BrokerLock> when no broker is connected; honest-empty otherwise.
 *
 * Read-only — no order placement here.
 */

import useSWR from 'swr'

import { Briefcase, Inbox, Receipt, Wallet } from '@/lib/icons'
import {
  Badge,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  type Column,
  type Tone,
} from '@/components/foundation'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import { useBrokerStatus } from '@/lib/hooks/useBrokerStatus'
import BrokerLock from '@/components/broker/BrokerLock'
import { api } from '@/lib/api'
import { MONO } from '@/lib/tokens'

// ── shapes (match the backend /positions + /orders + /margin endpoints) ──────
interface BrokerPosition {
  symbol: string
  exchange?: string
  quantity: number
  average_price: number
  current_price: number
  pnl: number
  pnl_percent: number
  product?: string
}

interface BrokerOrder {
  order_id: string
  symbol: string
  transaction_type: string
  quantity: number
  filled_quantity: number
  order_type: string
  price: number
  average_price: number
  status: string
  product: string
}

// ── formatting ───────────────────────────────────────────────────────────────
const inr = (n: number | null | undefined): string =>
  n == null || !Number.isFinite(n)
    ? '—'
    : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

/** Map a broker order status to a Badge tone. */
function statusTone(status: string): Tone {
  const s = (status || '').toUpperCase()
  if (s === 'COMPLETE' || s === 'COMPLETED' || s === 'FILLED' || s === 'EXECUTED') return 'up'
  if (s === 'REJECTED' || s === 'CANCELLED' || s === 'CANCELED') return 'down'
  return 'warning'
}

const SWR_OPTS = {
  refreshInterval: 15_000,
  revalidateOnFocus: true,
  keepPreviousData: true,
}

export function BrokerPositionsPanel({ className = '' }: { className?: string }) {
  const { isConnected, isLoading: statusLoading } = useBrokerStatus()

  const positionsResp = useSWR(
    isConnected ? 'broker:positions' : null,
    () => api.broker.getPositions(),
    SWR_OPTS,
  )
  const ordersResp = useSWR(
    isConnected ? 'broker:orders' : null,
    () => api.broker.getOrders(),
    SWR_OPTS,
  )
  const marginResp = useSWR(
    isConnected ? 'broker:margin' : null,
    () => api.broker.getMargin(),
    SWR_OPTS,
  )

  // Gate — show the connect prompt while we know the user has no broker.
  if (!isConnected) {
    if (statusLoading) return null
    return (
      <BrokerLock
        feature="Live positions"
        description="Connect your broker to see your live positions and orders."
        className={className}
      />
    )
  }

  const positions = (positionsResp.data?.positions ?? []) as BrokerPosition[]
  const orders = (ordersResp.data?.orders ?? []) as BrokerOrder[]
  const margin = marginResp.data

  const posLoading = positionsResp.isLoading && !positionsResp.data
  const ordersLoading = ordersResp.isLoading && !ordersResp.data

  const positionColumns: Column<BrokerPosition>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      sticky: true,
      sortable: true,
      sortValue: (r) => r.symbol,
      cell: (r) => (
        <span className="flex items-center gap-2.5">
          <SymbolLogo symbol={r.symbol} size={26} />
          <span className="font-medium text-d-text-primary">{r.symbol}</span>
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.quantity,
      cell: (r) => <span className={MONO}>{r.quantity.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'average_price',
      header: 'Avg',
      align: 'right',
      hideOnMobile: true,
      cell: (r) => <span className={MONO}>{inr(r.average_price)}</span>,
    },
    {
      key: 'current_price',
      header: 'LTP',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.current_price,
      cell: (r) => <span className={MONO}>{inr(r.current_price)}</span>,
    },
    {
      key: 'pnl',
      header: 'P&L',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.pnl,
      cell: (r) => (
        <span className={`${MONO} ${r.pnl >= 0 ? 'text-up' : 'text-down'}`}>
          {r.pnl >= 0 ? '+' : ''}
          {inr(r.pnl)}
        </span>
      ),
    },
    {
      key: 'pnl_percent',
      header: 'P&L %',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.pnl_percent,
      hideOnMobile: true,
      cell: (r) => (
        <span className={`${MONO} ${r.pnl_percent >= 0 ? 'text-up' : 'text-down'}`}>
          {r.pnl_percent >= 0 ? '+' : ''}
          {Number(r.pnl_percent ?? 0).toFixed(2)}%
        </span>
      ),
    },
  ]

  const orderColumns: Column<BrokerOrder>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      sticky: true,
      sortable: true,
      sortValue: (r) => r.symbol,
      cell: (r) => (
        <span className="flex items-center gap-2.5">
          <SymbolLogo symbol={r.symbol} size={26} />
          <span className="font-medium text-d-text-primary">{r.symbol}</span>
        </span>
      ),
    },
    {
      key: 'transaction_type',
      header: 'Side',
      sortable: true,
      sortValue: (r) => r.transaction_type,
      cell: (r) => {
        const side = (r.transaction_type || '').toUpperCase()
        return <Badge tone={side === 'SELL' ? 'sell' : 'buy'}>{side || '—'}</Badge>
      },
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'right',
      cell: (r) => (
        <span className={MONO}>
          {Number(r.filled_quantity ?? 0).toLocaleString('en-IN')}/
          {Number(r.quantity ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'order_type',
      header: 'Type',
      hideOnMobile: true,
      cell: (r) => <span className="text-d-text-secondary">{r.order_type || '—'}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      hideOnMobile: true,
      cell: (r) => (
        <span className={MONO}>{inr(r.average_price || r.price)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.status,
      cell: (r) => <Badge tone={statusTone(r.status)}>{(r.status || '—').toUpperCase()}</Badge>,
    },
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Margin line */}
      {margin && Number.isFinite(margin.available_margin) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-sm border border-line bg-wrap px-4 py-2.5 text-[12.5px]">
          <span className="flex items-center gap-1.5 text-d-text-secondary">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            Available margin
            <span className={`${MONO} text-d-text-primary`}>{inr(margin.available_margin)}</span>
          </span>
          {Number.isFinite(margin.used_margin) && margin.used_margin > 0 && (
            <span className="flex items-center gap-1.5 text-d-text-secondary">
              Used
              <span className={`${MONO} text-d-text-primary`}>{inr(margin.used_margin)}</span>
            </span>
          )}
        </div>
      )}

      {/* Positions */}
      <Card className="overflow-hidden">
        <CardHeader className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          Live positions
        </CardHeader>
        <div className="p-4">
          <DataTable
            ariaLabel="Live broker positions"
            data={positions}
            columns={positionColumns}
            loading={posLoading}
            loadingRows={4}
            empty={
              <EmptyState
                icon={<Inbox className="h-6 w-6" />}
                title="No open positions"
                description="Positions opened with your broker show up here live."
                size="sm"
              />
            }
          />
        </div>
      </Card>

      {/* Orders */}
      <Card className="overflow-hidden">
        <CardHeader className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          Orders
        </CardHeader>
        <div className="p-4">
          <DataTable
            ariaLabel="Broker order book"
            data={orders}
            columns={orderColumns}
            loading={ordersLoading}
            loadingRows={3}
            empty={
              <EmptyState
                icon={<Receipt className="h-6 w-6" />}
                title="No orders today"
                description="Orders placed with your broker — filled or pending — appear here."
                size="sm"
              />
            }
          />
        </div>
      </Card>
    </div>
  )
}

export default BrokerPositionsPanel
