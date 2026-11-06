import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// One week. changeFrequency is a crawler hint, not a guaranteed crawl schedule.
export const revalidate = 604800;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: new Date("2026-11-06T00:00:00Z"), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/how-to-play`, lastModified: new Date("2026-11-06T00:00:00Z"), changeFrequency: "weekly", priority: 0.8 },
  ];
}
