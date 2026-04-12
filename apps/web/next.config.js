/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // TODO<init> config
    remotePatterns: [
      { protocol: "https", hostname: "cdn.pinpoint.app" },
      {
        protocol: "https",
        hostname: "picsum.photos", // TODO delete this when no longer needed
      },
    ],
  },
};

export default nextConfig;
