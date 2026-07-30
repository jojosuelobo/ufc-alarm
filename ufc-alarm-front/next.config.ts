import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ufc.com",
      },
      {
        protocol: "https",
        hostname: "www.ufc.com",
      },
    ],
  },
};

export default nextConfig;
