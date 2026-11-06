import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Keep the crawl policy and sitemap discovery fresh daily.
export const revalidate = 86400;

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
