import type { Metadata } from "next";
import { SITE_URL } from "./site";

export const SHARE_IMAGE = {
  url: `${SITE_URL}/og-gulam-chor.jpg`,
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "Gulam Chor — play the Indian card game online with 2–6 friends",
};

/** Supply each page's full social object: Next.js merges nested metadata shallowly. */
export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title, description, url: `${SITE_URL}${path === "/" ? "" : path}`,
      type: "website", locale: "en_IN", siteName: "Gulam Chor", images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image", title, description,
      images: [{ url: SHARE_IMAGE.url, alt: SHARE_IMAGE.alt }],
    },
  };
}
