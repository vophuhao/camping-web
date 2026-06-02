import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    domains: [
      'images.unsplash.com',
      'i.pravatar.cc',
      'i.pinimg.com',
      'lh3.googleusercontent.com',
      'scontent.fsgn5-9.fna.fbcdn.net',
      'www.hdcamp.id.vn'
    ],
  },
};

export default nextConfig;
