import { Skeleton } from '@/components/foundation'

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-6 py-8">
      <Skeleton w="180px" h="28px" />
      <Skeleton w="280px" h="14px" />
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} h="100px" rounded="lg" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton h="280px" rounded="lg" />
        <Skeleton h="280px" rounded="lg" />
      </div>
    </div>
  )
}
