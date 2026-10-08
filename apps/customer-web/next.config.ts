import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  transpilePackages: ['@csp/contracts'],
};
export default nextConfig;
