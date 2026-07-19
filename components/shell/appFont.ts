// App-scoped type system. The authenticated app body font (--font-app-sans,
// applied on the AppShell root) is now Plus Jakarta Sans — the single PRIMARY
// family adopted app-wide (2026-06-20). It mirrors the
// root --font-sans so every AppShell-wrapped route renders Plus Jakarta, not
// the retired Inter. Numerics still ride --font-mono (Geist Mono) via the MONO
// token; --font-app-mono is retained only for back-compat (nothing consumes it).
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

export const appSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-app-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})
export const appMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-app-mono', display: 'swap' })
