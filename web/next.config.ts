import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const appUrl = process.env.EXPO_APP_URL;
    if (!appUrl) return [];
    return [
      { source: '/app', destination: `${appUrl}/` },
      { source: '/app/:path*', destination: `${appUrl}/:path*` },
    ];
  },
};

export default nextConfig;
