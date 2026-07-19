'use client'

/**
 * Foundation DataTable — typed, sortable, accessible table primitive.
 *
 * Designed for the signal lists / position lists / scanner results /
 * trade journals — the dense data surfaces every trading app needs.
 * Built on plain <table> for screen-reader semantics; no virtualisation
 * by default (rows <500 render fine; for >5000 wrap in react-window).
 *
 * Features:
 *  - Generic over row type — full TS inference for cell renderers
 *  - Column definitions: header, cell renderer, sortable flag, align,
 *    width hint, sticky behavior
 *  - Sort: client-side by default; pass ``onSortChange`` to delegate
 *  - States: loading (row skeletons) / empty / error — all built in
 *  - Row click navigation with keyboard support (Enter / Space)
 *  - Sticky header with optional sticky first column for mobile scroll
 *  - Responsive: horizontal scroll on small viewports + sticky first
 *    column keeps the symbol visible
 *  - A11y: aria-sort on headers, aria-busy on container, native button
 *    semantics for sortable headers, focus rings on rows
 *
 * @example  Signal list
 *   <DataTable
 *     data={signals}
 *     columns={[
 *       { key: 'symbol',     header: 'Symbol',     sortable: true, sticky: true },
 *       { key: 'direction',  header: 'Direction',  cell: (r) => <Badge>{r.direction}</Badge> },
 *       { key: 'confidence', header: 'Conf',       align: 'right', sortable: true,
 *         cell: (r) => `${r.confidence.toFixed(0)}%` },
 *       { key: 'change_pct', header: 'Change',     align: 'right', sortable: true,
 *         cell: (r) => <ChangeBadge value={r.change_pct} /> },
 *     ]}
 *     onRowClick={(r) => router.push(`/signals/${r.id}`)}
 *     loading={isLoading}
 *     empty={<EmptyState icon={…} title="No signals yet" … />}
 *   />
 */
import * as React from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'

export interface Column<Row> {
  /** Unique key. Used for React keys, sort state, and column identity. */
  key: string
  /** Header label or JSX. */
  header: React.ReactNode
  /** Cell renderer. Receives the row + row index. If omitted, ``row[key]`` is rendered as text. */
  cell?: (row: Row, rowIndex: number) => React.ReactNode
  /** Sort getter — return any primitive comparable value. If omitted, ``row[key]`` is used. */
  sortValue?: (row: Row) => string | number | null | undefined
  /** Show sort affordance in header. */
  sortable?: boolean
  /** Alignment in cell + header. */
  align?: 'left' | 'right' | 'center'
  /** Fixed CSS width (e.g. ``'80px'`` or ``'10%'``). */
  width?: string
  /** Sticks the column to the left edge — useful for symbol column on mobile. */
  sticky?: boolean
  /** Hide this column at sm breakpoint and below. */
  hideOnMobile?: boolean
}

export type SortDirection = 'asc' | 'desc'

interface Props<Row> {
  data: Row[]
  columns: Column<Row>[]
  /** Stable row key. Defaults to ``row.id`` if present, else array index (warning logged). */
  rowKey?: (row: Row, index: number) => string | number
  /** Click handler — row gets keyboard activation + focus ring. */
  onRowClick?: (row: Row) => void
  /** Loading state — renders 5 skeleton rows. */
  loading?: boolean
  /** Number of skeleton rows when loading. Default 5. */
  loadingRows?: number
  /** What to render when data is empty (and not loading). Pass an ``EmptyState``. */
  empty?: React.ReactNode
  /** Error message — replaces the table body. */
  error?: string
  /** Controlled sort — omit for uncontrolled (client-side) sort. */
  sort?: { key: string; direction: SortDirection } | null
  onSortChange?: (sort: { key: string; direction: SortDirection } | null) => void
  /** Dense mode: shorter row height. */
  dense?: boolean
  /** Render a sticky header. Default true. */
  stickyHeader?: boolean
  className?: string
  /** Accessible name for the table (e.g. "Today's signals"). */
  ariaLabel: string
}

export function DataTable<Row extends Record<string, any>>({
  data,
  columns,
  rowKey,
  onRowClick,
  loading,
  loadingRows = 5,
  empty,
  error,
  sort: sortProp,
  onSortChange,
  dense,
  stickyHeader = true,
  className,
  ariaLabel,
}: Props<Row>) {
  // Uncontrolled sort state when no ``sort`` prop is provided.
  const [localSort, setLocalSort] = React.useState<{
    key: string
    direction: SortDirection
  } | null>(null)
  const sort = sortProp !== undefined ? sortProp : localSort

  const handleSortClick = (col: Column<Row>) => {
    if (!col.sortable) return
    const next: { key: string; direction: SortDirection } | null =
      sort?.key === col.key && sort.direction === 'asc'
        ? { key: col.key, direction: 'desc' }
        : sort?.key === col.key && sort.direction === 'desc'
          ? null // third click clears
          : { key: col.key, direction: 'asc' }
    if (onSortChange) {
      onSortChange(next)
    } else {
      setLocalSort(next)
    }
  }

  // Client-side sort when no onSortChange (uncontrolled).
  const sortedData = React.useMemo(() => {
    if (!sort || onSortChange) return data
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return data
    const getter = col.sortValue ?? ((r: Row) => (r as any)[col.key])
    const sorted = [...data].sort((a, b) => {
      const av = getter(a)
      const bv = getter(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return sort.direction === 'asc' ? -1 : 1
      if (av > bv) return sort.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [data, sort, columns, onSortChange])

  const defaultRowKey = React.useCallback(
    (row: Row, i: number) => (row.id != null ? row.id : i),
    [],
  )
  const getKey = rowKey ?? defaultRowKey

  const alignClass = (a?: Column<Row>['align']) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'

  // Bodies — error and empty render outside the table to skip the row scaffold.
  const renderBody = () => {
    if (error) {
      return (
        <tbody>
          <tr>
            <td colSpan={columns.length} className="py-12">
              <p className="text-center text-sm text-down">{error}</p>
            </td>
          </tr>
        </tbody>
      )
    }
    if (loading) {
      return (
        <tbody>
          {Array.from({ length: loadingRows }).map((_, i) => (
            <tr key={`skel-${i}`} className="border-t border-line">
              {columns.map((col, ci) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4',
                    dense ? 'py-2' : 'py-3',
                    col.hideOnMobile && 'hidden sm:table-cell',
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  <Skeleton
                    w={ci === 0 ? '60%' : '40%'}
                    h={dense ? '14px' : '16px'}
                    rounded="sm"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      )
    }
    if (sortedData.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={columns.length} className="p-0">
              {empty ?? (
                <p className="py-12 text-center text-sm text-d-text-muted">No rows</p>
              )}
            </td>
          </tr>
        </tbody>
      )
    }
    return (
      <tbody>
        {sortedData.map((row, i) => {
          const interactive = !!onRowClick
          return (
            <tr
              key={getKey(row, i)}
              tabIndex={interactive ? 0 : undefined}
              role={interactive ? 'button' : undefined}
              onClick={interactive ? () => onRowClick(row) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick(row)
                      }
                    }
                  : undefined
              }
              className={cn(
                'border-t border-line transition-colors',
                interactive &&
                  'cursor-pointer hover:bg-wrap-hover focus-visible:bg-wrap-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/40',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 text-sm text-d-text-secondary',
                    dense ? 'py-2' : 'py-3',
                    alignClass(col.align),
                    col.hideOnMobile && 'hidden sm:table-cell',
                    col.sticky && 'sticky left-0 bg-wrap z-[1]',
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.cell ? col.cell(row, i) : String((row as any)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    )
  }

  const cellOf = (col: Column<Row>, row: Row, i: number): React.ReactNode =>
    col.cell ? col.cell(row, i) : String((row as any)[col.key] ?? '')

  // Below `sm` a wide table is unreadable, so each row becomes a stacked card:
  // the first column is the title, the rest are label/value pairs. Honors
  // hideOnMobile (those columns are dropped) + onRowClick (card is the button).
  const renderCards = () => {
    if (error) {
      return (
        <p className="rounded-sm border border-line bg-wrap p-4 text-center text-sm text-down">{error}</p>
      )
    }
    if (loading) {
      return (
        <div className="flex flex-col gap-2">
          {Array.from({ length: loadingRows }).map((_, i) => (
            <div key={`mskel-${i}`} className="rounded-sm border border-line bg-wrap p-3">
              <Skeleton w="50%" h="16px" rounded="sm" />
              <div className="mt-2 flex flex-col gap-1.5">
                <Skeleton w="80%" h="12px" rounded="sm" />
                <Skeleton w="60%" h="12px" rounded="sm" />
              </div>
            </div>
          ))}
        </div>
      )
    }
    if (sortedData.length === 0) {
      return empty ?? (
        <p className="rounded-sm border border-line bg-wrap py-12 text-center text-sm text-d-text-muted">No rows</p>
      )
    }
    const cols = columns.filter((c) => !c.hideOnMobile)
    const interactive = !!onRowClick
    return (
      <ul className="flex flex-col gap-2" aria-label={ariaLabel}>
        {sortedData.map((row, i) => (
          <li
            key={getKey(row, i)}
            tabIndex={interactive ? 0 : undefined}
            role={interactive ? 'button' : undefined}
            onClick={interactive ? () => onRowClick(row) : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick(row)
                    }
                  }
                : undefined
            }
            className={cn(
              'rounded-sm border border-line bg-wrap p-3',
              interactive &&
                'cursor-pointer transition-colors hover:bg-wrap-hover focus-visible:bg-wrap-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/40',
            )}
          >
            {cols.map((col, ci) =>
              ci === 0 ? (
                <div key={col.key} className="mb-1 text-sm font-medium text-d-text-primary">
                  {cellOf(col, row, i)}
                </div>
              ) : (
                <div key={col.key} className="flex items-center justify-between gap-3 border-t border-line py-1">
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-d-text-muted">
                    {col.header}
                  </span>
                  <span className="min-w-0 text-right text-[13px] text-d-text-secondary">
                    {cellOf(col, row, i)}
                  </span>
                </div>
              ),
            )}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className={cn('w-full', className)} aria-busy={loading || undefined}>
      {/* sm+ : full table (horizontal scroll only as a last resort) */}
      <div className="hidden overflow-auto rounded-sm border border-line bg-wrap sm:block">
        <table className="w-full border-collapse" aria-label={ariaLabel}>
        <thead
          className={cn(
            stickyHeader && 'sticky top-0 z-[2] bg-wrap-hover',
          )}
        >
          <tr>
            {columns.map((col) => {
              const isSorted = sort?.key === col.key
              const ariaSort: 'ascending' | 'descending' | 'none' = isSorted
                ? sort?.direction === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none'
              return (
                <th
                  key={col.key}
                  aria-sort={col.sortable ? ariaSort : undefined}
                  className={cn(
                    'border-b border-line bg-wrap-hover px-4 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-d-text-muted',
                    dense ? 'py-2' : 'py-3',
                    alignClass(col.align),
                    col.hideOnMobile && 'hidden sm:table-cell',
                    col.sticky && 'sticky left-0 z-[3]',
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  scope="col"
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSortClick(col)}
                      className={cn(
                        'inline-flex items-center gap-1 transition-colors hover:text-d-text-primary',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded',
                        col.align === 'right' && 'flex-row-reverse',
                        isSorted && 'text-d-text-primary',
                      )}
                    >
                      <span>{col.header}</span>
                      {isSorted ? (
                        sort?.direction === 'asc' ? (
                          <ArrowUp className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3 w-3" aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown
                          className="h-3 w-3 opacity-40"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        {renderBody()}
        </table>
      </div>
      {/* below sm : stacked cards */}
      <div className="sm:hidden">{renderCards()}</div>
    </div>
  )
}
