'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'sonner'
import { SWRConfig } from 'swr'
import { AuthProvider } from '../contexts/AuthContext'
import { UiModeProvider } from '../contexts/UiModeContext'
import { ClientAuthGate } from '@/components/auth/ClientAuthGate'
import { GlobalCopilot } from '@/components/copilot/GlobalCopilot'

/**
 * Pointer-driven spotlight for .glass-card. Uses event delegation: one
 * pointermove listener finds the *hovered* card via Element.closest()
 * instead of iterating every card on the page every frame. With 70+
 * cards on a busy dashboard the old approach ran a full DOM query +
 * getBoundingClientRect loop on every animation frame the mouse moved.
 */
function useCardSpotlight() {
  useEffect(() => {
    let rafId = 0
    let pendingX = 0
    let pendingY = 0
    let pendingCard: HTMLElement | null = null

    function flush() {
      rafId = 0
      const card = pendingCard
      if (!card) return
      const rect = card.getBoundingClientRect()
      const x = ((pendingX - rect.left) / rect.width) * 100
      const y = ((pendingY - rect.top) / rect.height) * 100
      card.style.setProperty('--mouse-x', `${x}%`)
      card.style.setProperty('--mouse-y', `${y}%`)
    }

    function handleMove(e: PointerEvent) {
      const target = e.target as Element | null
      const card = target?.closest<HTMLElement>('.glass-card') ?? null
      if (!card) return
      pendingX = e.clientX
      pendingY = e.clientY
      pendingCard = card
      if (rafId === 0) rafId = requestAnimationFrame(flush)
    }

    document.addEventListener('pointermove', handleMove, { passive: true })
    return () => {
      document.removeEventListener('pointermove', handleMove)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])
}

/** Single near-mono toast surface — hairline-bordered. Duotone is driven
 * by our tokens, not Sonner's richColors. Token-driven so it re-skins in
 * both themes; Sonner follows the OS class via theme="system". */
function ThemedToaster() {
  return (
    <Toaster
      theme="system"
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--color-wrap)',
          border: '1px solid var(--color-line)',
          borderRadius: '8px',
          color: 'var(--color-light)',
        },
      }}
    />
  )
}


export function Providers({ children }: { children: React.ReactNode }) {
  useCardSpotlight()

  // 2026-06-20 — "Refined Expressive" v2: tri-theme (light + dark + system).
  // defaultTheme="system" + enableSystem follows prefers-color-scheme and
  // updates live when the OS flips; attribute="class" sets html.light /
  // html.dark so :root (dark) and html.light re-derive every token.
  // MotionConfig honors prefers-reduced-motion for every framer-motion
  // animation in the tree (emil-design-eng a11y).
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="quantx.theme"
      disableTransitionOnChange
    >
      <MotionConfig reducedMotion="user">
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            dedupingInterval: 5000,
            errorRetryCount: 3,
            errorRetryInterval: 5000,
            shouldRetryOnError: true,
          }}
        >
          <AuthProvider>
            <UiModeProvider>
              <ClientAuthGate />
              {/* Chat unification (2026-07-11): ONE Copilot dock for the whole
                  app — auth- and route-gated inside GlobalCopilot. */}
              <GlobalCopilot />
              {children}
            </UiModeProvider>
          </AuthProvider>
        </SWRConfig>
        <ThemedToaster />
      </MotionConfig>
    </ThemeProvider>
  )
}
