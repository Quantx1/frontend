/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ---------- Bundle Optimization ----------
  // Tree-shake Lucide icons (only import what's used)
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{ kebabCase member }}',
    },
  },
  // Enable gzip + brotli compression in production
  compress: true,
  // Reduce output size by not including source maps in production
  productionBrowserSourceMaps: false,
  // Optimize package imports for heavy libraries
  experimental: {
    optimizePackageImports: ['recharts', 'date-fns', 'framer-motion'],
  },
  
  // ---------- Security headers ----------
  // CSP is set per-request in middleware.ts so we can inject a fresh
  // nonce on every response (drops 'unsafe-inline' from script-src).
  // Other static security headers stay here — they don't need
  // request-level customization.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ]
      }
    ]
  },
  
  // Proxy API and WebSocket requests to the backend.
  //
  // Production builds (NODE_ENV=production, set by Vercel) MUST supply
  // NEXT_PUBLIC_API_URL or the rewrites would silently target localhost
  // and every API call from the deployed frontend would fail. Hard-fail
  // the build so the misconfig is caught in CI, not by paying users.
  async rewrites() {
    const explicit = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL
    if (!explicit && process.env.NODE_ENV === 'production') {
      throw new Error(
        'NEXT_PUBLIC_API_URL is required for production builds. ' +
        'Set it in the Vercel project settings (e.g. https://api.quantx.app) ' +
        'before deploying.'
      )
    }
    const backendUrl = explicit || 'http://localhost:8000'
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/ws/:path*',
        destination: `${backendUrl}/ws/:path*`,
      },
    ]
  },

  // Allow TradingView images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.tradingview.com',
      },
      {
        protocol: 'https',
        hostname: 's3.tradingview.com',
      },
    ],
  },
}

// PR-V — wrap with Sentry. ``withSentryConfig`` injects sourcemap
// upload + the necessary webpack hooks. If @sentry/nextjs isn't
// installed (e.g. CI without devDeps) we fall back to the plain
// config so the build still succeeds.
try {
  const { withSentryConfig } = require('@sentry/nextjs')
  module.exports = withSentryConfig(nextConfig, {
    // Suppress all Sentry-CLI output unless an auth token is present;
    // most local builds don't have one and the noise is misleading.
    silent: !process.env.SENTRY_AUTH_TOKEN,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    // Don't upload source maps in dev — wasted bandwidth + slow rebuilds.
    disableLogger: true,
    sourcemaps: {
      disable: !process.env.SENTRY_AUTH_TOKEN,
    },
    // Tunnel through /monitoring so ad-blockers don't drop traces.
    // No-op when DSN unset.
    tunnelRoute: '/monitoring',
  })
} catch (_err) {
  module.exports = nextConfig
}
