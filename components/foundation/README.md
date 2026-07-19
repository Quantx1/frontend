# Foundation components

Primitives that every v2 page builds on. New pages MUST import from
`@/components/foundation` only — don't reinvent buttons, cards, modals,
toasts, popovers, selects, or loaders elsewhere.

```ts
import {
  // Base
  Button, Input, Card, Skeleton, Badge, Dialog, Tabs,
  // Feedback
  toast, Tooltip,
  // Overlays
  Popover, DropdownMenu, DropdownItem, Sheet,
  // Forms
  Select, NumericInput,
  // Layout + data display
  PageHeader, EmptyState, ChangeBadge, Sparkline, StatCard,
  // Tables
  DataTable, type Column,
} from '@/components/foundation'
```

## Component catalogue

| Tier | Component | API surface |
|---|---|---|
| **Base** | `Button` | `variant: primary \| secondary \| ghost \| danger`, `size: sm \| md \| lg`, all native button props |
| | `Input` | optional `label`, `error`, all native input props, `forwardRef` |
| | `Card`, `CardHeader`, `CardBody`, `CardFooter` | composition; `variant: static \| clickable` |
| | `Skeleton` | `w`, `h`, `rounded: sm \| md \| lg \| full` for shape-aware loading |
| | `Badge` | `tone: primary \| up \| down \| warning \| muted` |
| | `Dialog` | controlled (`open`, `onClose`), Radix-backed, optional `title`; sr-only Description auto-rendered |
| | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Radix-backed, v2-styled |
| **Feedback** | `toast` | re-export of Sonner — `toast.success/.error/.info/.promise/.loading` |
| | `Tooltip` | `content` (ReactNode), `side`, `delayMs`, `disabled`. Non-interactive hint. |
| **Overlay** | `Popover` | `trigger`, `side`, `align`, controlled `open`/`onOpenChange`. Interactive content. |
| | `DropdownMenu` + `DropdownItem` + `DropdownSeparator` + `DropdownLabel` | action menu w/ type-ahead. `destructive` item variant. |
| | `Sheet` | edge-slide overlay. `side: top \| right \| bottom \| left`. `title`, `description`, `hideCloseButton`. |
| **Form** | `Select` | Radix-backed dropdown picker. `options: SelectOption[]`, `label`, `error`, `helper`, `size`. |
| | `NumericInput` | controlled numeric. `formatter: integer \| decimal \| percent \| currency-inr \| multiplier`. Steppers + onWheel-blur. |
| **Layout** | `PageHeader` | `eyebrow`, `title`, `description`, `actions`. Responsive stack < md. |
| | `EmptyState` | `icon`, `title`, `description`, `action`, `tone`, `size`. aria-live. |
| **Data** | `ChangeBadge` | `value: number`, `kind: percent \| currency-inr \| plain`, `filled`, `size: xs \| sm \| md`, `toneOverride`. Indian numbering. |
| | `Sparkline` | `data: number[]`, `width`, `height`, `tone: auto \| up \| down \| neutral`, `filled`. SVG, no chart lib. |
| | `StatCard` | `label`, `value`, `delta`, `spark`, `tooltip`. Loading + error states baked in. |
| | `DataTable` | generic over row type. `data`, `columns: Column<Row>[]`, `onRowClick`, `loading`, `empty`, `error`, controlled sort. |

## Design tokens

`lib/tokens.ts` is the TS source of truth (color, spacing, type, motion,
z-index, radius). Foundation components reference Tailwind classes that
already resolve to the matching CSS variables in `app/globals.css`. Both
themes are first-class — every semantic colour has `dark` and `light`
variants.

**Do not** inline hex literals in component code. **Do not** use
`bg-[#XXXXXX]` arbitrary-value Tailwind classes. Add a token if a value
is missing.

The pre-commit hook (`scripts/check_frontend_hex_literals.sh`) will
reject any new file under `frontend/app/` or `frontend/components/`
that uses a raw hex Tailwind class.

## State coverage — what every component handles for you

| State | Where it's handled |
|---|---|
| **Loading** | Skeleton (standalone) · StatCard.loading · DataTable.loading (renders N skeleton rows) |
| **Empty** | EmptyState (standalone) · DataTable.empty slot |
| **Error** | EmptyState tone='error' · StatCard.error · DataTable.error |
| **Disabled** | Button · Input · Select · NumericInput (all support `disabled`) |
| **Focus** | Every interactive element has `focus-visible:ring-2 focus-visible:ring-primary/40` |
| **Hover** | Every clickable surface has token-driven hover (`hover:bg-wrap-hover`) |
| **Mobile** | DataTable horizontal-scrolls + sticky first column. Sheet side='bottom'. ≥44px tap targets on Buttons. |
| **A11y** | Radix-backed components ship ARIA + keyboard nav. Custom components have aria-* + focus rings + keyboard handlers. |

## Trading-app conventions

| Pattern | Use |
|---|---|
| Show a price change | `<ChangeBadge value={pct} kind="percent" />` — auto sign, auto color, auto arrow |
| Show ₹ delta | `<ChangeBadge value={rupeeDelta} kind="currency-inr" />` — Indian numbering (lakh/crore) |
| Numeric form field | `<NumericInput formatter="percent" min={0.1} step={0.1} />` — scroll wheel won't change value |
| Mobile filter drawer | `<Sheet side="right" title="Filters">…</Sheet>` |
| Action confirm | `<Dialog title="Delete?">…</Dialog>` (centered modal, not Sheet) |
| Action menu / kebab | `<DropdownMenu>` + `<DropdownItem destructive>` for irreversible |
| KPI cell | `<StatCard label value delta spark loading error />` |
| List page | `<PageHeader>` + `<DataTable ariaLabel>` + `<EmptyState>` in `empty` slot |
| Async feedback | `toast.promise(api.x(), { loading, success, error })` |
| Info hint | `<Tooltip content="...">` — wrap any trigger; touch + hover + focus all activate |

## Composition example — full signals page shape

```tsx
import { useSignals } from '@/hooks/useSignals'
import {
  PageHeader, DataTable, ChangeBadge, EmptyState,
  Button, Badge, toast, type Column,
} from '@/components/foundation'
import { Inbox, Plus, RefreshCw } from 'lucide-react'

interface Signal {
  id: string
  symbol: string
  direction: 'BUY' | 'SELL'
  confidence: number
  entry: number
  change_pct: number
}

const columns: Column<Signal>[] = [
  { key: 'symbol', header: 'Symbol', sortable: true, sticky: true,
    cell: (r) => <span className="font-medium text-d-text-primary">{r.symbol}</span> },
  { key: 'direction', header: 'Dir',
    cell: (r) => <Badge tone={r.direction === 'BUY' ? 'up' : 'down'}>{r.direction}</Badge> },
  { key: 'confidence', header: 'Confidence', align: 'right', sortable: true,
    cell: (r) => `${r.confidence.toFixed(0)}%` },
  { key: 'entry', header: 'Entry', align: 'right', hideOnMobile: true,
    cell: (r) => `₹${r.entry.toFixed(2)}` },
  { key: 'change', header: 'Change', align: 'right', sortable: true,
    sortValue: (r) => r.change_pct,
    cell: (r) => <ChangeBadge value={r.change_pct} /> },
]

export default function SignalsPage() {
  const { signals, isLoading, error, refetch } = useSignals()
  return (
    <>
      <PageHeader
        eyebrow="Today"
        title="Signals"
        description={`Updated 09:15 IST · ${signals.length} active`}
        actions={
          <>
            <Button variant="ghost" onClick={refetch} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => toast.success('Coming soon')}>
              <Plus className="mr-1 h-4 w-4" /> New strategy
            </Button>
          </>
        }
      />
      <div className="p-4 md:p-6">
        <DataTable
          ariaLabel="Today's signals"
          data={signals}
          columns={columns}
          loading={isLoading}
          error={error?.message}
          onRowClick={(r) => router.push(`/signals/${r.id}`)}
          empty={
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="No signals yet"
              description="Today's scan finishes at 09:15 IST. Check back then."
            />
          }
        />
      </div>
    </>
  )
}
```

~50 LOC of page code, zero hex literals, zero inline state handling,
zero a11y rework. This is the pattern every list page should follow.

## Best practices

1. **Never inline a button.** If you write `<button className="…">`, use `Button` or `DropdownItem`.
2. **Never inline a "no data" message.** Use `EmptyState`.
3. **Loading states are 1 prop, not a 30-line conditional.** Pass `loading` to StatCard / DataTable.
4. **One toast lib only.** `toast` from foundation; never `import { toast } from 'sonner'` outside this directory.
5. **Add columns to `Column<Row>`, not inline divs.** If the layout doesn't fit DataTable, build a domain component (`SignalCard`, `PositionRow`) that composes Foundation primitives.
6. **Mobile first when in doubt.** Default ≥44px tap targets, `hideOnMobile` for non-essential table columns, prefer Sheet over Dialog for mobile-anchored overlays.
7. **Pass `ariaLabel` to every DataTable.** It's required for a reason.
8. **Tooltips are for non-interactive hints; Popovers are for interactive content; DropdownMenus are for action lists.** Don't mix.

## Adding a new primitive

1. Drop it under `frontend/components/foundation/<Name>.tsx`.
2. Use only design tokens (no hex). The hex-literal hook will block you otherwise.
3. Add `loading`, `empty`, and `error` props if it ever shows data.
4. Add ARIA + keyboard handling for any interactive surface.
5. JSDoc with at least 2 usage examples.
6. Export from `components/foundation/index.ts`.
7. Update this README's catalogue table.
