import { Skeleton } from '@/components/foundation'

export default function PortfolioLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-6 py-8">
      <Skeleton w="160px" h="28px" />
      <Skeleton w="240px" h="14px" />
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} h="80px" rounded="lg" />
        ))}
      </div>
      <Skeleton h="280px" rounded="lg" className="mt-6" />
      <div className="mt-4 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} h="44px" rounded="md" />
        ))}
      </div>
    </div>
  )
}
