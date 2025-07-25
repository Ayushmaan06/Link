/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'undici': 'commonjs undici',
        '@prisma/client': '@prisma/client',
        'prisma': 'prisma'
      })
    }
    return config
  },
  images: {
    domains: ['www.google.com', 'favicon.io', 'icons8.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig
