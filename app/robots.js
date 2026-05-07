/**
 * Generates robots.txt for Pesisir.
 * Allows all crawlers to index public pages.
 * @returns {import("next").MetadataRoute.Robots}
 */
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://pesisir.id/sitemap.xml",
  };
}
