'use client'

import Link from 'next/link'
import { Menu } from '@/lib/icons'

interface Props {
  onMenuOpen: () => void
}

// Mobile-only bar: hamburger (opens the drawer) + brand. On desktop the shell
// is header-less — the sidebar carries nav, utilities and the collapse toggle.
export const Topbar = ({ onMenuOpen }: Props) => (
  <header className="relative z-10 flex h-14 items-center gap-2 border-b border-line glass-chrome px-3 lg:hidden">
    <button
      type="button"
      onClick={onMenuOpen}
      aria-label="Open menu"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-d-text-secondary transition-colors hover:bg-wrap-hover hover:text-d-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <Menu className="h-[22px] w-[22px]" aria-hidden="true" />
    </button>
    <Link
      href="/copilot"
      className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label="Quant X — Trading OS, go to home"
    >
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-primary text-primary-foreground"
        aria-hidden="true"
      >
        <span className="text-[15px] font-black leading-none">Q</span>
      </span>
      <span className="text-[15px] font-bold tracking-tight text-d-text-primary">Quant X</span>
    </Link>
  </header>
)
