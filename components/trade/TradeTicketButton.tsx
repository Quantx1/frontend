'use client'

/**
 * TradeTicketButton — the reusable manual order-ticket flow.
 *
 * Encapsulates the full real-money path in one client component:
 *   Button → QuickTrade (collect) → ConfirmDialog (deliberate confirm) →
 *   api.broker.order (real order to the connected broker).
 *
 * No-broker users are handled inside QuickTrade (BrokerLock). The confirm
 * step is mandatory: the order never fires on a single click. QuickTrade
 * offers Market/Limit only, which is all the ad-hoc /api/broker/order
 * endpoint accepts (SL/SL-M are blocked at the form).
 *
 * Works with or without a preset symbol — it routes the SUBMITTED form
 * symbol (`data.symbol`), so the label="New order" / no-symbol variant lets
 * the user pick via QuickTrade's built-in search.
 */

import { useState } from 'react'
import { Activity } from '@/lib/icons'
import { Button, ConfirmDialog, toast } from '@/components/foundation'
import type { ButtonVariant, ButtonSize } from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'
import QuickTrade from '@/components/dashboard/QuickTrade'

interface Props {
  symbol?: string
  currentPrice?: number
  defaultDirection?: 'BUY' | 'SELL'
  label?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

type Pending = {
  symbol: string
  direction: 'BUY' | 'SELL'
  quantity: number
  orderType: 'MARKET' | 'LIMIT'
  price?: number
  product: 'CNC' | 'MIS' | 'NRML'
}

export function TradeTicketButton({
  symbol,
  currentPrice,
  defaultDirection = 'BUY',
  label = 'Trade',
  variant = 'primary',
  size = 'sm',
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)

  const placeOrder = async () => {
    if (!pending) return
    const p = pending
    try {
      const r = await api.broker.order({
        symbol: p.symbol,
        transaction_type: p.direction,
        quantity: p.quantity,
        order_type: p.orderType,
        price: p.price,
        product: p.product,
        exchange: 'NSE',
      })
      toast.success(`Order ${r.status?.toLowerCase?.() || 'placed'}`, {
        description: `${p.direction} ${p.quantity} ${p.symbol}${r.order_id ? ' · #' + r.order_id : ''}`,
      })
    } catch (e) {
      toast.error('Order failed', { description: handleApiError(e) })
    } finally {
      setPending(null)
    }
  }

  const summary = pending
    ? `${pending.direction} ${pending.quantity} ${pending.symbol} · ${pending.orderType}${
        pending.orderType === 'LIMIT' && pending.price
          ? ` ₹${pending.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
          : ''
      } · ${pending.product}`
    : ''

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        <Activity className="mr-1 h-4 w-4" /> {label}
      </Button>

      <QuickTrade
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={async (data) => {
          // Don't fire here — stash and let ConfirmDialog confirm (real money).
          setPending({
            symbol: data.symbol,
            direction: data.direction,
            quantity: data.quantity,
            orderType: data.orderType,
            price: data.price,
            product: data.product,
          })
        }}
        initialSymbol={symbol}
        initialEntryPrice={currentPrice}
        defaultDirection={defaultDirection}
      />

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={placeOrder}
        title="Confirm order"
        body={
          <span>
            {summary}
            <br />
            <span className="text-d-text-muted text-[12px]">
              Real order routed to your connected broker. Market/Limit only.
            </span>
          </span>
        }
        confirmLabel="Place order"
      />
    </>
  )
}
