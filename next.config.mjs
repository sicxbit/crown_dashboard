/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    //  FIX LATER!!!
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
