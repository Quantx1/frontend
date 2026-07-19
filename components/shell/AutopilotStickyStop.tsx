'use client'

/**
 * AutopilotStickyStop (MEDIUM #4 · 2026-05-31).
 *
 * Always-visible mobile floating button to PAUSE AutoPilot from any
 * page when AutoPilot is enabled. Per the brutal audit:
 *
 *   "80% of Indian retail is mobile. Multi-step desktop dialog =
 *    users panic-sell via Kite instead. Need a sticky one-tap pause."
 *
 * Only renders on mobile (md:hidden) and only when AutoPilot is
 * currently enabled — invisible otherwise.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { PauseCircle } from '@/lib/icons'

import { Button, toast } from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'


export function AutopilotStickyStop() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { data, mutate } = useSWR(
    'autopilot_status_mobile',
    () => api.autoTrader.status(),
    { revalidateOnFocus: true, dedupingInterval: 60_000 },
  )

  if (!data?.enabled) return null

  async function pause() {
    try {
      setSubmitting(true)
      await api.autoTrader.toggle(false)
      toast.success('AutoPilot paused', {
        description: 'No new trades will be placed. Open positions remain.',
      })
      setOpen(false)
      await mutate()
      router.push('/autopilot')
    } catch (e) {
      toast.error('Pause failed', { description: handleApiError(e) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Pause AutoPilot"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-down bg-down/20 text-down shadow-xl backdrop-blur-md transition-all hover:bg-down/30 active:scale-95 md:hidden"
      >
        <PauseCircle className="h-7 w-7" />
        <span className="absolute -bottom-5 right-0 whitespace-nowrap rounded-md bg-down px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
          STOP
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-line bg-main p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-down/15 text-down">
                <PauseCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-d-text-primary">
                  Pause AutoPilot?
                </h3>
                <p className="text-xs text-d-text-muted">
                  Stops new trades — open positions are unaffected.
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-d-text-secondary">
              AutoPilot will stop placing new orders. Existing positions
              remain at the broker with their stop-loss intact. You can
              re-enable from <code className="rounded bg-wrap px-1">/autopilot</code> anytime.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={pause}
                disabled={submitting}
                className="bg-down text-white hover:bg-down/90"
              >
                {submitting ? 'Pausing…' : 'Pause AutoPilot now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
