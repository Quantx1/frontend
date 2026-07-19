import { Skeleton } from '@/components/foundation'

export default function WatchlistLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-6 py-8">
      <Skeleton w="140px" h="28px" />
      <Skeleton w="240px" h="14px" />
      <div className="mt-6 space-y-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} h="68px" rounded="lg" />
        ))}
      </div>
    </div>
  )
}
