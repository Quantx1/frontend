import { api } from '@/lib/api'

export type Live = Awaited<ReturnType<typeof api.watchlist.live>>
export type Item = Live['items'][number]
