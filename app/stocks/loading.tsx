import { Skeleton } from '@/components/foundation'

export default function StocksLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-6 py-8">
      <Skeleton w="120px" h="28px" />
      <Skeleton w="320px" h="14px" />
      <Skeleton h="44px" rounded="md" className="mt-6" />
      <div className="mt-4 space-y-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} h="56px" rounded="md" />
        ))}
      </div>
    </div>
  )
}
