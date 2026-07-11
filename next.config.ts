import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// basePath and assetPrefix are ONLY applied in production (GitHub Pages).
// In local development they must be empty so that:
//   - Routes resolve at http://localhost:3000/ (not /nuraweb/)
//   - Static assets like /logo.svg are served correctly
// In production, GitHub Actions injects NEXT_PUBLIC_BASE_PATH=/nuraweb
// via the workflow environment — never via .env.local.
const basePath = isProd ? (process.env.NEXT_PUBLIC_BASE_PATH || "") : "";

const nextConfig: NextConfig = {
  // Only enable static export for production builds
  ...(isProd && {
    output: "export",
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
  }),
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
  basePath: basePath,
  assetPrefix: basePath,
};

export default nextConfig;
