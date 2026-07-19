'use client'

/**
 * useBrokerStatus — single SWR source of truth for "does this user have a live
 * broker connected?". Mirrors useTier(). Used to gate broker-required features
 * (live depth, P&L, intraday signals, order placement) behind <BrokerLock>.
 */
import useSWR from 'swr'
import { api } from '@/lib/api'

export function useBrokerStatus() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/broker/connections',
    () => api.broker.getConnections(),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )
  const brokers = data?.brokers ?? []
  const connected = brokers.find((b) => b.status === 'connected') ?? null
  return {
    isConnected: !!connected,
    brokerName: connected?.broker_name ?? null,
    accountId: connected?.account_id ?? null,
    brokers,
    isLoading,
    error,
    refresh: mutate,
  }
}
