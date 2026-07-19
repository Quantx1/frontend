// frontend/app/preview-design/page.tsx
import { notFound } from 'next/navigation'
import {
  Button,
  Card,
  Badge,
  Input,
  EyebrowMono,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DataTable,
  type Column,
  EmptyState,
  PageHeader,
  UsageMeter,
  Sparkline,
  Skeleton,
} from '@/components/foundation'
import { Inbox } from '@/lib/icons'
import { OverlaysDemo } from './OverlaysDemo'

type DemoRow = { id: string; symbol: string; price: number; change: number }
const DEMO_ROWS: DemoRow[] = [
  { id: '1', symbol: 'RELIANCE', price: 2980.5, change: 1.24 },
  { id: '2', symbol: 'TCS', price: 3855.0, change: -0.62 },
  { id: '3', symbol: 'INFY', price: 1622.3, change: 0.41 },
]
const DEMO_COLUMNS: Column<DemoRow>[] = [
  { key: 'symbol', header: 'Symbol', sortable: true },
  { key: 'price', header: 'Price', align: 'right' },
  { key: 'change', header: 'Change %', align: 'right' },
]

export default function PreviewDesign() {
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <main data-testid="preview-root" className="min-h-screen bg-main text-d-text-primary p-8 space-y-10">
      <section data-testid="sec-type" className="space-y-3">
        {/* Eyebrow — Plus Jakarta Sans uppercase + tracked (NOT mono). */}
        <p className="font-sans font-semibold uppercase tracking-[0.12em] text-xs text-d-text-muted">Typography</p>
        {/* Display heading — Plus Jakarta Sans (--font-display → --font-sans). */}
        <h1 data-testid="display-heading" className="text-display-lg heading-display">Engineered restraint</h1>
        {/* Signature gradient — the ONE family (emerald → cyan). */}
        <h2 data-testid="gradient-heading" className="text-display-sm heading-display text-gradient">
          Refined expressive
        </h2>
        <p className="text-d-text-secondary">Body copy in Plus Jakarta Sans weight 400.</p>
      </section>

      <section data-testid="sec-buttons" className="flex gap-3">
        <Button data-testid="btn-primary" variant="primary">Primary</Button>
        <Button data-testid="btn-secondary" variant="secondary">Outline pill</Button>
        <Button variant="ghost">Ghost</Button>
      </section>

      <section data-testid="sec-cards" className="grid grid-cols-2 gap-4">
        <Card data-testid="card-default"><p className="text-d-text-primary">Card content</p></Card>
        <Card><p className="text-d-text-secondary">Another card</p></Card>
      </section>

      <section data-testid="sec-badges" className="flex gap-2">
        <Badge tone="up" data-testid="badge-up">+2.40%</Badge>
        <Badge tone="down" data-testid="badge-down">-1.10%</Badge>
        <Badge tone="muted">NEUTRAL</Badge>
      </section>

      <section data-testid="sec-input" className="max-w-sm">
        <Input data-testid="search-input" placeholder="Search symbol" />
      </section>

      <section data-testid="sec-tabs" className="space-y-3">
        <EyebrowMono>Tabs</EyebrowMono>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4 text-d-text-secondary">
            Overview panel
          </TabsContent>
          <TabsContent value="signals" className="pt-4 text-d-text-secondary">
            Signals panel
          </TabsContent>
          <TabsContent value="risk" className="pt-4 text-d-text-secondary">
            Risk panel
          </TabsContent>
        </Tabs>
      </section>

      <section data-testid="sec-table" className="space-y-3">
        <EyebrowMono>Data table</EyebrowMono>
        <DataTable
          ariaLabel="Demo symbols"
          data={DEMO_ROWS}
          columns={DEMO_COLUMNS}
        />
      </section>

      <section data-testid="sec-overlays" className="space-y-3">
        <EyebrowMono>Overlays</EyebrowMono>
        <OverlaysDemo />
      </section>

      <section data-testid="sec-pageheader">
        <PageHeader
          eyebrow="Today"
          title="Active swing signals"
          description="Generated at 09:15 IST · 12 candidates"
          actions={<Button variant="secondary" size="sm">New strategy</Button>}
        />
      </section>

      <section data-testid="sec-empty" className="max-w-md">
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="No signals yet"
          description="Today's scan finishes at 09:15 IST. Check back then."
          action={<Button variant="secondary" size="sm">Refresh</Button>}
        />
      </section>

      <section data-testid="sec-meter" className="flex flex-wrap items-center gap-4">
        <UsageMeter used={3} cap={5} label="symbols" />
        <UsageMeter used={5} cap={5} label="signals today" />
      </section>

      <section data-testid="sec-misc" className="flex items-center gap-6">
        <Sparkline data={[10, 12, 9, 14, 13, 17]} width={96} height={28} filled />
        <Sparkline data={[17, 13, 14, 9, 12, 8]} width={96} height={28} filled />
        <div className="flex flex-col gap-2">
          <Skeleton w="160px" h="14px" />
          <Skeleton w="120px" h="14px" />
        </div>
      </section>
    </main>
  )
}
