import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "k.kakaocdn.net" },
      { protocol: "http", hostname: "k.kakaocdn.net" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "imagedelivery.net" },
      { protocol: "http", hostname: "imagedelivery.net" },
    ],
  },
};

export default nextConfig;
