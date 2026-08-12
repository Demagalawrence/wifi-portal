import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // ESLint is run separately via `npm run lint` so it never blocks production builds.
    ignoreDuringBuilds: true,
  },
  async headers() {
    // Never let browsers cache the portal pages. Captive portals must always
    // show the latest version - a stale cached page would block re-connecting.
    const noCache = [
      { key: 'Cache-Control', value: 'no-store, max-age=0' },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
    ];

    return [
      { source: '/', headers: noCache },
      { source: '/admin', headers: noCache },
      { source: '/admin/:path*', headers: noCache },
    ];
  },
};

export default nextConfig;
