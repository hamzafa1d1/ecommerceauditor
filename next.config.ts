import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',   // Meta ad creative thumbnails
      },
    ],
  },
};

export default nextConfig;
