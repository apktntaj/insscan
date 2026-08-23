import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/shared/config/site-metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/auth"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
