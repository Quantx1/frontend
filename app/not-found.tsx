import Link from 'next/link'
import { ArrowLeft, LayoutDashboard } from '@/lib/icons'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-main p-6">
      <div className="max-w-lg text-center">
        <h1 className="mb-4 font-mono text-7xl font-black tracking-tighter text-primary sm:text-8xl">
          404
        </h1>
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-d-text-primary sm:text-3xl">
          Page not found
        </h2>
        <p className="mx-auto mb-10 max-w-sm text-sm leading-relaxed text-d-text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Check the URL or head back to familiar territory.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
          >
            <ArrowLeft className="h-4 w-4" />
            Go home
          </Link>
          <Link
            href="/copilot"
            className="inline-flex items-center gap-2 rounded-md border border-line bg-wrap px-6 py-2.5 text-sm font-medium text-d-text-secondary transition hover:border-wrap-line hover:bg-wrap-hover hover:text-d-text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
