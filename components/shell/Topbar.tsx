'use client'

import Link from 'next/link'
import { Menu } from '@/lib/icons'
import { QuantXMark } from '@/components/brand/QuantXMark'

interface Props {
  onMenuOpen: () => void
}

// Mobile-only bar: hamburger (opens the drawer) + brand. On desktop the shell
// is header-less — the sidebar carries nav, utilities and the collapse toggle.
export const Topbar = ({ onMenuOpen }: Props) => (
  <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line glass-chrome px-3 lg:hidden">
    <button
      type="button"
      onClick={onMenuOpen}
      aria-label="Open menu"
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-d-text-secondary transition-colors hover:bg-wrap-hover hover:text-d-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <Menu className="h-[22px] w-[22px]" aria-hidden="true" />
    </button>
    <Link
      href="/copilot"
      className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label="Quant X — Trading OS, go to home"
    >
      <QuantXMark className="h-7 w-7 shrink-0 drop-shadow-[0_2px_10px_rgba(58,119,229,0.45)]" />
      <span className="text-[15px] font-bold tracking-tight text-d-text-primary">Quant X</span>
    </Link>
  </header>
)
