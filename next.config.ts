import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  
  images: {
    unoptimized: true,
  },
  
  // This tells Next.js to let you build even if there are strict linting errors
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;