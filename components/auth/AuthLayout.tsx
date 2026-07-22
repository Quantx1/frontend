'use client'

import Image from 'next/image'
import Link from 'next/link'
import { QuantXMark } from '@/components/brand/QuantXMark'

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export default function AuthLayout({
  children,
  title = 'AI-Powered Trading Intelligence',
  subtitle = 'Advanced stock screening and swing trading signals for the Indian market.',
}: AuthLayoutProps) {
  return (
    <div className="light-landing flex min-h-screen bg-hero-sky">
      {/* Left brand panel — light sky wash with the security illustration
          floating in a tinted tile (flat FintechX register, no dark canvas).
          Honest stats only, no win-rate claim. */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[45%]">
        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <QuantXMark className="h-10 w-10 drop-shadow-[0_2px_8px_rgba(58,119,229,0.35)]" />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-d-text-primary">Quant X</span>
              <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-d-text-muted">Trading Intelligence</span>
            </div>
          </Link>

          {/* Main text */}
          <div>
            <h1 className="font-display mb-5 text-3xl font-semibold leading-tight tracking-tight text-d-text-primary xl:text-4xl">
              {title}
            </h1>
            <p className="max-w-sm text-base leading-relaxed text-d-text-secondary">
              {subtitle}
            </p>

            {/* security illustration — tinted tile, flat card register */}
            <div aria-hidden className="mt-8 max-w-[340px] rounded-[24px] bg-main p-2.5">
              <Image
                src="/v4/illus/security.png"
                alt=""
                aria-hidden
                width={1024}
                height={1024}
                priority
                sizes="(min-width: 1024px) 320px, 0px"
                className="w-full rounded-2xl"
              />
            </div>

            {/* Honest proof — facts about coverage, not a performance claim */}
            <div className="mt-10 flex items-center gap-8">
              {[
                { value: '5', label: 'AI engines' },
                { value: '1,800+', label: 'NSE stocks' },
                { value: '₹10L', label: 'Paper, free' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="num-display text-xl font-bold text-d-text-primary">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-d-text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-d-text-muted">
            &copy; {new Date().getFullYear()} Quant X Technologies. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right form panel — light glass card floating on the sky wash */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-8">
        <div className="lg-surface w-full max-w-md rounded-[24px] p-6 sm:p-8">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <QuantXMark className="h-10 w-10 drop-shadow-[0_2px_8px_rgba(58,119,229,0.35)]" />
            <span className="text-xl font-bold tracking-tight text-d-text-primary">
              Quant X
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
