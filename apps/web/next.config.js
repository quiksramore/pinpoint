/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // TODO<init> config
    remotePatterns: [{ protocol: "https", hostname: "cdn.pinpoint.app" }],
  },
};

export default nextConfig;
