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
        hostname: 'pulse.great-site.net',
        pathname: '/Google_signup/uploads/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'production', // Optional: disable optimization in production if needed
  },
  env: {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://pulse-woad-mu.vercel.app', // must match frontend for cookies
          },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Cookie' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
