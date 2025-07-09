import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: process.env.NODE_ENV === "development",
  transpilePackages: ["three", "gsap", "@gsap/react"],
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["gsap", "@gsap/react"],
  },
};

export default nextConfig;
