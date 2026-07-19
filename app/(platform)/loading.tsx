import { Skeleton } from '@/components/foundation'

export default function PlatformLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-4">
      <Skeleton w="180px" h="28px" />
      <Skeleton w="280px" h="14px" />
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} h="80px" rounded="lg" />
        ))}
      </div>
      <Skeleton h="320px" rounded="lg" className="mt-6" />
    </div>
  )
}
