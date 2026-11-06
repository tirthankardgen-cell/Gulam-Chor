import type { MetadataRoute } from "next";
import { SITE_UPDATED_AT, SITE_URL } from "@/lib/site";
import images from "@/lib/sitemap-images.json";

// Updates daily. Crawlers decide their own crawl schedule and ranking.
export const revalidate = 86400;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: SITE_UPDATED_AT, changeFrequency: "daily", priority: 1, images: images.map((path) => `${SITE_URL}${path}`) },
    { url: `${SITE_URL}/how-to-play`, lastModified: SITE_UPDATED_AT, changeFrequency: "daily", priority: 1,
      images: ["/og-gulam-chor.jpg", "/art/studies/logo.svg", "/art/studies/courtyard.svg", "/art/studies/card-back.svg", "/art/studies/jack.svg"].map((path) => `${SITE_URL}${path}`) },
  ];
}
