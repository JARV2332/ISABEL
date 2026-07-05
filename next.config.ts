import type { NextConfig } from "next";

const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ??
  (process.env.NODE_ENV === "production" ? "/ISABEL" : "");

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  async redirects() {
    if (!basePath) return [];
    return [
      {
        source: "/",
        destination: basePath,
        permanent: false,
        basePath: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/performs/data/:path*",
        destination: "https://performs.gti.upf.edu/data/:path*",
      },
    ];
  },
};

export default nextConfig;
