import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Empty turbopack config to silence webpack warning in Next.js 16
  turbopack: {},
}

// Sentry config - only apply in production builds
const sentryConfig = {
  // Suppresses source map upload warnings (only needed for prod)
  silent: true,
  // Upload source maps for better error tracking
  widenClientFileUpload: true,
  // Hide source maps from browser DevTools
  hideSourceMaps: true,
  // Automatically tree-shake Sentry SDK
  disableLogger: true,
}

// Only wrap with Sentry if DSN is configured
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig
