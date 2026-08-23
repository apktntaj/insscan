import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/shared/config/site-metadata";

const routes = [
  { path: "/", priority: 1 },
  { path: "/cek-lartas", priority: 0.9 },
  { path: "/shipments", priority: 0.8 },
  { path: "/learn", priority: 0.7 },
  { path: "/exercise", priority: 0.7 },
  { path: "/feedback", priority: 0.5 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
  { path: "/refund-policy", priority: 0.3 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
