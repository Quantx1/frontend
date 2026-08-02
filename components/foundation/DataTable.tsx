'use client'

/**
 * Foundation DataTable — typed, sortable, accessible table built on shadcn Table.
 *
 * Designed for signal lists / position lists / scanner results / trade journals.
 * Uses shadcn Table, TableHeader, TableBody, TableRow, TableHead, TableCell
 * for consistent styling. All existing callers work unchanged.
 */
import * as React from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'
import { ErrorState } from './ErrorState'
import { EmptyState } from './EmptyState'

export interface Column<Row> {
  key: string
  header: React.ReactNode
  cell?: (row: Row, rowIndex: number) => React.ReactNode
  sortValue?: (row: Row) => string | number | null | undefined
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  width?: string
  sticky?: boolean
  hideOnMobile?: boolean
}

export type SortDirection = 'asc' | 'desc'

interface Props<Row> {
  data: Row[]
  columns: Column<Row>[]
  rowKey?: (row: Row, index: number) => string | number
  onRowClick?: (row: Row) => void
  loading?: boolean
  loadingRows?: number
  empty?: React.ReactNode
  error?: string
  sort?: { key: string; direction: SortDirection } | null
  onSortChange?: (sort: { key: string; direction: SortDirection } | null) => void
  dense?: boolean
  stickyHeader?: boolean
  className?: string
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
          ? null
          : { key: col.key, direction: 'asc' }
    if (onSortChange) {
      onSortChange(next)
    } else {
      setLocalSort(next)
    }
  }

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

  const cellOf = (col: Column<Row>, row: Row, i: number): React.ReactNode =>
    col.cell ? col.cell(row, i) : String((row as any)[col.key] ?? '')

  const renderBody = () => {
    if (error) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={columns.length} className="py-12">
              <ErrorState size="sm" title="Couldn't load" description={error} />
            </TableCell>
          </TableRow>
        </TableBody>
      )
    }
    if (loading) {
      return (
        <TableBody>
          {Array.from({ length: loadingRows }).map((_, i) => (
            <TableRow key={`skel-${i}`}>
              {columns.map((col, ci) => (
                <TableCell
                  key={col.key}
                  className={cn(
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
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      )
    }
    if (sortedData.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={columns.length} className="p-0">
              {empty ?? (
                <EmptyState size="sm" title="No rows" description="Nothing to show here yet." />
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      )
    }
    const interactive = !!onRowClick
    return (
      <TableBody>
        {sortedData.map((row, i) => (
          <TableRow
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
              interactive && 'cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/40',
            )}
          >
            {columns.map((col) => (
              <TableCell
                key={col.key}
                className={cn(
                  'text-sm text-muted-foreground',
                  dense ? 'py-2' : 'py-3',
                  alignClass(col.align),
                  col.hideOnMobile && 'hidden sm:table-cell',
                  col.sticky && 'sticky left-0 bg-card z-[1]',
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.cell ? col.cell(row, i) : String((row as any)[col.key] ?? '')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    )
  }

  const renderCards = () => {
    if (error) {
      return <ErrorState size="sm" title="Couldn't load" description={error} />
    }
    if (loading) {
      return (
        <div className="flex flex-col gap-2">
          {Array.from({ length: loadingRows }).map((_, i) => (
            <div key={`mskel-${i}`} className="rounded-md border bg-card p-3">
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
      return (
        empty ?? (
          <EmptyState size="sm" title="No rows" description="Nothing to show here yet." />
        )
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
              'rounded-md border bg-card p-3',
              interactive &&
                'cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/40',
            )}
          >
            {cols.map((col, ci) =>
              ci === 0 ? (
                <div key={col.key} className="mb-1 text-sm font-medium text-foreground">
                  {cellOf(col, row, i)}
                </div>
              ) : (
                <div key={col.key} className="flex items-center justify-between gap-3 border-t py-1">
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                    {col.header}
                  </span>
                  <span className="min-w-0 text-right text-[13px] text-muted-foreground">
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
      {/* sm+ : full table */}
      <div className="hidden sm:block rounded-md border bg-card overflow-hidden">
        <Table aria-label={ariaLabel}>
          <TableHeader
            className={cn(stickyHeader && 'sticky top-0 z-[2] bg-muted/50')}
          >
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => {
                const isSorted = sort?.key === col.key
                const ariaSort: 'ascending' | 'descending' | 'none' = isSorted
                  ? sort?.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
                return (
                  <TableHead
                    key={col.key}
                    aria-sort={col.sortable ? ariaSort : undefined}
                    className={cn(
                      'font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-muted-foreground',
                      dense ? 'h-9' : 'h-11',
                      alignClass(col.align),
                      col.hideOnMobile && 'hidden sm:table-cell',
                      col.sticky && 'sticky left-0 z-[3] bg-muted/50',
                    )}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSortClick(col)}
                        className={cn(
                          'inline-flex items-center gap-1 transition-colors hover:text-foreground',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded',
                          col.align === 'right' && 'flex-row-reverse',
                          isSorted && 'text-foreground',
                        )}
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sort?.direction === 'asc' ? (
                            <ArrowUp className="size-3" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3" aria-hidden="true" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          {renderBody()}
        </Table>
      </div>
      {/* below sm : stacked cards */}
      <div className="sm:hidden">{renderCards()}</div>
    </div>
  )
}
