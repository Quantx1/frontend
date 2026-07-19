'use client'

import Image from 'next/image'
import Link from 'next/link'

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
    <div className="flex min-h-screen bg-main">
      {/* Left brand panel — clean near-black canvas with a premium product
          render (no decorative SVG clutter; the render carries the visual
          weight). Honest stats only, no win-rate claim. */}
      <div className="relative hidden overflow-hidden dark-media lg:flex lg:w-[45%]">
        {/* faint dot field + a single ambient glow for depth */}
        <div className="absolute inset-0 bg-dot-grid-dark mask-radial-fade opacity-[0.15]" />
        <div className="absolute left-1/2 top-[34%] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-primary/[0.10] blur-[120px]" />

        {/* premium brand render — the market-intelligence sculpture */}
        <div aria-hidden className="absolute inset-x-0 top-[12%] bottom-[26%] opacity-90">
          <Image
            src="/images/v3/ai-intelligence.webp"
            alt=""
            aria-hidden
            fill
            priority
            sizes="45vw"
            className="object-contain"
          />
        </div>
        {/* bottom scrim so the headline + stats stay legible over the render */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-[#5DCBD8] to-[#8D5CFF] shadow-[0_0_20px_rgba(79,236,205,0.25)] transition-shadow group-hover:shadow-[0_0_30px_rgba(79,236,205,0.4)]">
              <span className="text-sm font-extrabold text-black">Q</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white">Quant X</span>
              <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-white/50">Trading Intelligence</span>
            </div>
          </Link>

          {/* Main text */}
          <div>
            <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
              {title}
            </h1>
            <p className="max-w-sm text-base leading-relaxed text-white/55">
              {subtitle}
            </p>

            {/* Honest proof — facts about coverage, not a performance claim */}
            <div className="mt-10 flex items-center gap-8">
              {[
                { value: '5', label: 'AI engines' },
                { value: '1,800+', label: 'NSE stocks' },
                { value: '₹10L', label: 'Paper, free' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="num-display text-xl font-bold text-white">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Quant X Technologies. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right form panel — L1 surface */}
      <div className="flex flex-1 items-center justify-center bg-wrap p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-[#5DCBD8] to-[#8D5CFF] shadow-[0_0_16px_rgba(79,236,205,0.2)]">
              <span className="text-sm font-extrabold text-black">Q</span>
            </div>
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
