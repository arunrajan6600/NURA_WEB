import type { NextConfig } from "next";

/**
 * NURAWEB Next.js Configuration (Vercel + Render Production Target)
 * 
 * Configured as a native dynamic Next.js App Router application.
 * Static HTML export is disabled so that dynamic routing, SSR, and API fetching
 * function natively on Vercel's hosting platform.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "arunrajan6600.github.io",
        pathname: "/arunnura/images/**",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
