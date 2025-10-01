import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // appDir jest domyślne w Next.js 13+ (nie trzeba ustawiać experimental.appDir)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig