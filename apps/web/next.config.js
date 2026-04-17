/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // TODO<init> config
    remotePatterns: [
      { protocol: "https", hostname: "cdn.pinpoint.app" },
      {
        protocol: "https",
        hostname: "pub-a637d57390cb4c88913a2f52961afeb2.r2.dev", // TODO delete this when no longer needed
      },
    ],
  },
};

export default nextConfig;
