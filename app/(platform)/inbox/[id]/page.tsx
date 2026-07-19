import Link from 'next/link'
import { ChevronLeft } from '@/lib/icons'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EyebrowMono,
  Skeleton,
} from '@/components/foundation'

/**
 * /inbox/[id] — inbox item detail.
 *
 * Each notification expands here with: source event, full payload,
 * deep links to the originating signal / portfolio holding / agent
 * run, and a "mark read" / "snooze" action bar.
 */
export default function InboxItemPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <Link
        href="/inbox"
        className="inline-flex items-center gap-1 text-xs text-d-text-muted transition-colors hover:text-d-text-primary"
      >
        <ChevronLeft className="h-3 w-3" />
        Inbox
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <EyebrowMono>Notification · {params.id}</EyebrowMono>
          <h1 className="text-lg font-semibold text-d-text-primary">
            <Skeleton w="60%" h="22px" className="inline-block" />
          </h1>
          <p className="text-xs text-d-text-muted">
            Plan 3 wires this to /api/notifications/{params.id}.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm">
            Snooze 1h
          </Button>
          <Button variant="secondary" size="sm">
            Mark read
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <span>Event payload</span>
          <Badge tone="primary">Signal</Badge>
        </CardHeader>
        <CardBody className="space-y-3">
          <Skeleton h="14px" />
          <Skeleton h="14px" w="80%" />
          <Skeleton h="14px" w="65%" />
          <div className="mt-2 rounded-md border border-line bg-main p-3 font-mono text-[11px] text-d-text-muted">
            {'{ payload preview when wired }'}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Related</CardHeader>
        <CardBody className="space-y-2 text-sm text-d-text-secondary">
          <p>
            Signal that triggered this notification →{' '}
            <Link
              href="/signals"
              className="text-primary hover:text-primary-hover"
            >
              View signal
            </Link>
          </p>
          <p>
            Position affected →{' '}
            <Link
              href="/portfolio"
              className="text-primary hover:text-primary-hover"
            >
              Open portfolio
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
