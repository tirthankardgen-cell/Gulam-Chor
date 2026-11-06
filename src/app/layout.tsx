import type { Metadata, Viewport } from "next";
import "@fontsource/yatra-one/devanagari-400.css";
import "@fontsource/yatra-one/latin-400.css";
import "@fontsource/hind/latin-400.css";
import "@fontsource/hind/latin-500.css";
import "@fontsource/hind/latin-600.css";
import "@fontsource/hind/devanagari-400.css";
import "@fontsource/hind/devanagari-600.css";
import { art } from "@/lib/art";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import "./globals.css";
import "./table-experience.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Gulam Chor — Play Online with 2–6 Friends", template: "%s | Gulam Chor" },
  description: SITE_DESCRIPTION,
  applicationName: "Gulam Chor",
  icons: { icon: art("favicon"), apple: art("favicon") },
  robots: { index: true, follow: true },
  openGraph: { title: "Gulam Chor — Play with your people", description: SITE_DESCRIPTION, type: "website", locale: "en_IN", siteName: "Gulam Chor", images: [{ url: "/og-gulam-chor.webp", width: 1440, height: 900, alt: "The Gulam Chor courtyard — a little luck, a lot of apne" }] },
  twitter: { card: "summary_large_image", title: "Gulam Chor — Play with your people", description: SITE_DESCRIPTION, images: ["/og-gulam-chor.webp"] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#263b34" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
