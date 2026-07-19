/**
 * Foundation Toast — thin, opinionated wrapper around Sonner.
 *
 * Sonner is already mounted at app/providers.tsx (theme-aware). This module
 * re-exports it as a single Foundation API so consumers never import
 * ``from 'sonner'`` directly. That gives us one place to:
 *
 *  - lock semantic variants to design tokens (success → up, error → down…)
 *  - prevent toast spam (deduplication, sane defaults)
 *  - swap the underlying lib later without touching call sites
 *
 * @example
 *   import { toast } from '@/components/foundation'
 *
 *   toast.success('Signal saved')
 *   toast.error('Broker disconnected', { description: 'Re-link Zerodha' })
 *   toast.promise(api.signals.deploy(id), {
 *     loading: 'Deploying…',
 *     success: 'Strategy is live',
 *     error: (e) => `Failed: ${e.message}`,
 *   })
 *
 * @example  Loading + later resolution
 *   const id = toast.loading('Placing order…')
 *   try {
 *     await placeOrder()
 *     toast.success('Order filled', { id })
 *   } catch (e) {
 *     toast.error('Order rejected', { id, description: e.message })
 *   }
 */
import { toast as sonnerToast } from 'sonner'

// Re-export with the exact same shape — no rewrap so all Sonner features
// (promise, loading id reuse, custom JSX) just work.
export const toast = sonnerToast

export type { ExternalToast } from 'sonner'
