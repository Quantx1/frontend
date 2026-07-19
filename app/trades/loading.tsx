import { Skeleton } from '@/components/foundation'

export default function TradesLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-6 py-8">
      <Skeleton w="140px" h="28px" />
      <Skeleton w="240px" h="14px" />
      <div className="mt-6 flex gap-2">
        <Skeleton w="80px" h="32px" rounded="md" />
        <Skeleton w="80px" h="32px" rounded="md" />
        <Skeleton w="80px" h="32px" rounded="md" />
      </div>
      <div className="mt-4 space-y-2">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} h="52px" rounded="md" />
        ))}
      </div>
    </div>
  )
}
