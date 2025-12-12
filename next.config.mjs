import { withSentryConfig } from '@sentry/nextjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Ensure '@' alias resolves to project root for both TS and Webpack
    config.resolve.alias = config.resolve.alias || {}
    config.resolve.alias['@'] = __dirname
    return config
  },
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
