import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Rewrite all routes to the catch-all page so that refreshing on any
  // client-side route (e.g. /stocks, /positions) does not produce a 404.
  // The [[...slug]] catch-all page handles URL→page mapping on the client.
  async rewrites() {
    return [
      {
        source: '/stocks/:path*',
        destination: '/',
      },
      {
        source: '/stock/:path*',
        destination: '/',
      },
      {
        source: '/index/:path*',
        destination: '/',
      },
      {
        source: '/positions',
        destination: '/',
      },
      {
        source: '/orders',
        destination: '/',
      },
      {
        source: '/portfolio',
        destination: '/',
      },
      {
        source: '/reports',
        destination: '/',
      },
      {
        source: '/option-chain',
        destination: '/',
      },
      {
        source: '/futures',
        destination: '/',
      },
      {
        source: '/watchlist',
        destination: '/',
      },
      {
        source: '/learning',
        destination: '/',
      },
      {
        source: '/profile',
        destination: '/',
      },
      {
        source: '/active-devices',
        destination: '/',
      },
      {
        source: '/help-support',
        destination: '/',
      },
      {
        source: '/privacy-policy',
        destination: '/',
      },
      {
        source: '/terms-of-service',
        destination: '/',
      },
      {
        source: '/support',
        destination: '/',
      },
      {
        source: '/contact-us',
        destination: '/',
      },
      {
        source: '/faq',
        destination: '/',
      },
      {
        source: '/disclaimer',
        destination: '/',
      },
      {
        source: '/about-us',
        destination: '/',
      },
      {
        source: '/refund-policy',
        destination: '/',
      },
    ]
  },
};

export default nextConfig;
