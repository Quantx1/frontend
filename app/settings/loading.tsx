import { Skeleton } from '@/components/foundation'

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <Skeleton w="120px" h="28px" />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} w="100px" h="36px" rounded="md" />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton w="120px" h="14px" />
            <Skeleton h="44px" rounded="md" />
          </div>
        ))}
      </div>
    </div>
  )
}
