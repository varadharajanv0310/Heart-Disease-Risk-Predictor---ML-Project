import type { NextConfig } from 'next'

/**
 * Static export: Focal has no server. Every calculation runs in the browser,
 * so there is nothing for a server to log, store or leak.
 */
const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
}

export default nextConfig
