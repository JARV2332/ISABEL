import type { MetadataRoute } from "next";

import { BASE_PATH } from "@/lib/base-path";

/** Reduce crawlers golpeando rutas API (costosas en Vercel). */
export default function robots(): MetadataRoute.Robots {
  const apiPrefix = BASE_PATH ? `${BASE_PATH}/api/` : "/api/";

  return {
    rules: {
      userAgent: "*",
      allow: BASE_PATH ? `${BASE_PATH}/` : "/",
      disallow: [apiPrefix],
    },
  };
}
