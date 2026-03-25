/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Ensure pdfjs-dist resolves correctly for client-side usagge
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    }
    return config
  },
}

export default nextConfig
