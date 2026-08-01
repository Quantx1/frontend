'use client'

import Link from 'next/link'
import { QuantXMark } from '@/components/brand/QuantXMark'
import { Bot, Activity, TrendingUp, ShieldCheck, Zap, Cpu, Radar } from '@/lib/icons'

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

const ENGINES = [
  { icon: TrendingUp, label: 'Momentum' },
  { icon: Radar, label: 'Scanner' },
  { icon: Cpu, label: 'ML Alpha' },
  { icon: Zap, label: 'F&O' },
  { icon: ShieldCheck, label: 'Risk' },
]

export default function AuthLayout({
  children,
  title = 'The AI trading desk for India',
  subtitle = 'Five engines. One gated signal. Every call explained — screening, swing signals and paper trading for NSE & BSE.',
}: AuthLayoutProps) {
  return (
    <div className="auth-dark auth-canvas relative flex min-h-screen overflow-hidden">
      {/* ── Animated background layers (decorative) ── */}
      <div className="auth-aurora" aria-hidden="true" />
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-orb auth-orb--a h-[42vh] w-[42vh] left-[-8vh] top-[-10vh]" aria-hidden="true" />
      <div className="auth-orb auth-orb--b h-[36vh] w-[36vh] right-[-6vh] bottom-[-8vh]" aria-hidden="true" />
      <div className="auth-orb auth-orb--c h-[28vh] w-[28vh] right-[22%] top-[8%]" aria-hidden="true" />

      {/* ── Left brand panel ── */}
      <div className="relative z-10 hidden w-[52%] flex-col justify-between p-10 xl:p-14 lg:flex">
        {/* Logo */}
        <Link href="/" className="group flex w-fit items-center gap-2.5">
          <QuantXMark className="h-10 w-10 drop-shadow-[0_2px_12px_rgba(64,106,228,0.55)]" />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-d-text-primary">Quant X</span>
            <span className="font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-d-text-muted">Trading OS</span>
          </div>
        </Link>

        {/* Headline + live signal cluster */}
        <div className="max-w-xl">
          {/* Live status chip */}
          <span className="chip-ai mb-6 inline-flex items-center gap-2 rounded-pill px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.16em]">
            <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-up" />
            </span>
            Market Intelligence · Live
          </span>

          <h1 className="font-display text-balance text-[clamp(2rem,3.4vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-d-text-primary">
            {title}
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-d-text-secondary">
            {subtitle}
          </p>

          {/* Floating live-signal cluster (decorative) */}
          <div aria-hidden="true" className="relative mt-10 h-[188px] max-w-[440px]">
            {/* dashed connector */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 440 188" fill="none" preserveAspectRatio="none">
              <path
                d="M120 70 C 200 70, 210 132, 300 132"
                stroke="var(--color-ai)"
                strokeOpacity="0.5"
                strokeWidth="1.5"
                className="flow-line"
              />
            </svg>

            {/* Primary engine card */}
            <div className="signal-card signal-float-a absolute left-0 top-0 w-[240px] rounded-2xl p-3.5">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary-text">
                  <Bot className="h-4 w-4" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-d-text-muted">Alpha Engine</span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-up/12 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-up">
                  BUY
                </span>
              </div>
              <div className="mt-2.5 flex items-end justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-d-text-primary">RELIANCE</p>
                  <p className="font-mono text-[11px] text-d-text-muted">₹2,945.20</p>
                </div>
                <p className="font-mono text-[15px] font-semibold text-up">+2.41%</p>
              </div>
              {/* mini sparkline */}
              <svg className="mt-2 h-8 w-full" viewBox="0 0 200 32" fill="none" preserveAspectRatio="none">
                <polyline
                  points="0,26 24,22 48,24 72,16 96,18 120,10 144,13 168,6 200,2"
                  stroke="var(--color-up)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Secondary index chip */}
            <div className="signal-card signal-float-b absolute right-0 bottom-2 w-[190px] rounded-2xl p-3.5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-d-text-muted">NIFTY 50</span>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <p className="font-mono text-[15px] font-semibold text-d-text-primary">24,180</p>
                <p className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-up">
                  <TrendingUp className="h-3.5 w-3.5" />+0.74%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: engines + copyright */}
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {ENGINES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-wrap/60 px-2.5 py-1 text-[11px] font-medium text-d-text-secondary backdrop-blur"
              >
                <Icon className="h-3.5 w-3.5 text-primary-text" />
                {label}
              </span>
            ))}
          </div>
          <p className="font-mono text-[11px] text-d-text-muted">
            &copy; {new Date().getFullYear()} Quant X Technologies · Educational use, not investment advice
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-6 sm:p-8">
        <div className="lg-surface elev-3 w-full max-w-md rounded-[28px] p-6 sm:p-8">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <QuantXMark className="h-10 w-10 drop-shadow-[0_2px_12px_rgba(64,106,228,0.55)]" />
            <span className="text-xl font-bold tracking-tight text-d-text-primary">Quant X</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
