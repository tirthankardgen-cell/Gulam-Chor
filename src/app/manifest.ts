import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "Gulam Chor", short_name: "Gulam Chor", description: SITE_DESCRIPTION,
    start_url: "/", scope: "/", display: "standalone", lang: "en-IN",
    background_color: "#263b34", theme_color: "#263b34", categories: ["games", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
