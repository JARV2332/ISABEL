import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
