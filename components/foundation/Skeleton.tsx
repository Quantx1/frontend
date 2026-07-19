import { cn } from '@/lib/utils'

type Rounded = 'sm' | 'md' | 'lg' | 'full'

interface Props {
  w?: string
  h?: string
  className?: string
  rounded?: Rounded
}

const ROUNDED: Record<Rounded, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

export const Skeleton = ({
  w = '100%',
  h = '16px',
  rounded = 'md',
  className,
}: Props) => (
  <div
    className={cn('bg-wrap-hover animate-pulse', ROUNDED[rounded], className)}
    style={{ width: w, height: h }}
  />
)
