import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  // CORS so the Flutter web build (served from its own origin, e.g.
  // `flutter run -d chrome` locally or a separately hosted web build) can
  // call this API from the browser — including against the public
  // production domain, not just local dev. Not needed for the mobile app on
  // a real device/emulator or for the web frontend, which is same-origin.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
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
