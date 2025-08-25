/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'your-domain.epizy.com',
        pathname: '/Google_signup/uploads/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'production', // Disable optimization for production if needed
  },
  env: {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
}

module.exports = nextConfig