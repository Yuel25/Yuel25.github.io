import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
