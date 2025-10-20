import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Ensure '@' alias resolves to project root for both TS and Webpack
    config.resolve.alias = config.resolve.alias || {}
    config.resolve.alias['@'] = __dirname
    return config
  },
}

export default nextConfig


