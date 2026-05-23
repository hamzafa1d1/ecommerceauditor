import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ensure CSV data files are bundled into the serverless functions on Vercel
  outputFileTracingIncludes: {
    '/api/ads':       ['./data/**'],
    '/api/campaigns': ['./data/**'],
    '/api/insights':  ['./data/**'],
  },
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
