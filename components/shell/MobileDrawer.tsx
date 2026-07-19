'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Bell, Instagram, Linkedin, Plus, Send, Settings, Twitter, X, Youtube,
} from '@/lib/icons'
import { NavList } from './NavList'

interface Props {
  open: boolean
  onClose: () => void
  pathname: string
}

const SOCIALS = [
  { icon: Twitter, label: 'X / Twitter', href: '#' },
  { icon: Send, label: 'Telegram', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
]

export const MobileDrawer = ({ open, onClose, pathname }: Props) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Focus the close button when the drawer opens — gives keyboard users
  // an immediate, escape-able focus target.
  useEffect(() => {
    if (open) closeBtnRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col border-r border-line bg-wrap">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <Link
            href="/copilot"
            onClick={onClose}
            className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-primary text-main"
              aria-hidden="true"
            >
              <span className="text-[15px] font-black leading-none">Q</span>
            </span>
            <span className="text-sm font-bold tracking-tight text-d-text-primary">Quant X</span>
          </Link>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-d-text-secondary transition-colors hover:bg-wrap-hover hover:text-d-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="shrink-0 px-3 pt-3">
          <Link
            href="/copilot"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-[13px] font-medium text-d-text-secondary transition-colors hover:text-d-text-primary"
          >
            <Plus className="h-4 w-4" /> New Chat
          </Link>
        </div>

        <NavList pathname={pathname} itemHeight="tall" onItemClick={onClose} />

        {/* footer: menu · socials — theme lives in Settings → Appearance */}
        <div className="mt-auto shrink-0">
          <div className="flex items-center gap-1 border-t border-line px-3 py-2">
            <Link href="/inbox" onClick={onClose} aria-label="Notifications" className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-d-text-secondary transition-colors hover:bg-wrap-hover hover:text-d-text-primary">
              <Bell className="h-[18px] w-[18px]" /><span className="text-[12px] font-medium">Notifications</span>
            </Link>
            <Link href="/settings" onClick={onClose} aria-label="Settings" className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-d-text-secondary transition-colors hover:bg-wrap-hover hover:text-d-text-primary">
              <Settings className="h-[18px] w-[18px]" /><span className="text-[12px] font-medium">Settings</span>
            </Link>
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            {SOCIALS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                title={label}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-7 w-7 place-items-center rounded-md text-d-text-muted transition-colors hover:bg-wrap-hover hover:text-d-text-primary"
              >
                <Icon className="h-[15px] w-[15px]" />
              </a>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
