import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  distDir: 'dist',
  transpilePackages: ['three'],
  images: {
    unoptimized: true
  },
  // basePath: '/assets/standalone/scenes/xnwnzveczw/1747254835/'
};

export default nextConfig;
