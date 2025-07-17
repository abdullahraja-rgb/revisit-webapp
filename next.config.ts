// next.config.ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Strict Mode only while developing
  reactStrictMode: process.env.NODE_ENV === "development",

  // Still transpile these libraries
  transpilePackages: ["three", "gsap", "@gsap/react"],

  experimental: {
    // Your existing optimisations
    optimizeCss: true,
    optimizePackageImports: ["gsap", "@gsap/react"],

    /**
     * 👇 NEW: allow Server Actions requests whose
     *  - Origin header is “localhost:3000”  **or**
     *  - X‑Forwarded‑Host header matches “*.app.github.dev”
     *
     * This prevents the “Invalid Server Actions request /
     * x‑forwarded‑host does not match origin” error when working
     * inside GitHub Codespaces.
     */
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.app.github.dev"],
    },
  },
};

export default nextConfig;
