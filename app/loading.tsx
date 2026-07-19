import { Skeleton } from '@/components/foundation'

export default function Loading() {
  return (
    <div className="min-h-screen bg-main">
      <div className="mx-auto max-w-7xl px-6 py-12 space-y-4">
        <Skeleton w="200px" h="32px" />
        <Skeleton w="320px" h="14px" />
        <Skeleton h="320px" rounded="lg" className="mt-8" />
      </div>
    </div>
  )
}
