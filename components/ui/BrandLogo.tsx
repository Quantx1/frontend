'use client'

// Real brand logos with a graceful initials fallback.
//   <BrandLogo domain="zerodha.com" alt="Zerodha" /> — broker / company logo
//   <SymbolLogo symbol="RELIANCE" />               — NSE stock, auto domain lookup
// Logos load from a logo service (see lib/logo.ts); on any miss/error we render
// a clean monogram so it never shows a broken image.

import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { logoUrl, tickerLogoUrl, SYMBOL_DOMAIN } from '@/lib/logo'

export function Monogram({
  text,
  size = 28,
  shape = 'rounded-md',
  className,
}: {
  text: string
  size?: number
  shape?: string
  className?: string
}) {
  const initials = (text || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?'
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center border border-line bg-wrap-hover font-semibold text-d-text-secondary',
        shape,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.4)) }}
    >
      {initials}
    </span>
  )
}

export function BrandLogo({
  domain,
  srcUrl,
  alt,
  size = 28,
  shape = 'rounded-md',
  className,
  fallback,
}: {
  domain?: string
  /** Precomputed logo URL; overrides domain-based resolution when provided. */
  srcUrl?: string
  alt: string
  size?: number
  shape?: string
  className?: string
  fallback?: ReactNode
}) {
  const [failed, setFailed] = useState(false)
  const src = srcUrl !== undefined ? srcUrl : logoUrl(domain, size * 2)
  if (!src || failed) {
    return <>{fallback ?? <Monogram text={alt} size={size} shape={shape} className={className} />}</>
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('shrink-0 bg-white object-contain', shape, className)}
      style={{ width: size, height: size }}
    />
  )
}

export function SymbolLogo({
  symbol,
  size = 28,
  className,
}: {
  symbol: string
  size?: number
  className?: string
}) {
  const key = (symbol || '').toUpperCase().replace(/\.NS$/, '')
  const url = logoUrl(SYMBOL_DOMAIN[key], size * 2) || tickerLogoUrl(key, size * 2)
  return (
    <BrandLogo
      srcUrl={url}
      alt={key}
      size={size}
      shape="rounded-full"
      className={className}
      fallback={<Monogram text={key} size={size} shape="rounded-full" className={className} />}
    />
  )
}
