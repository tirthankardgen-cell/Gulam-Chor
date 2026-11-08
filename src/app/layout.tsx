import type { Metadata, Viewport } from "next";
import "@fontsource/yatra-one/devanagari-400.css";
import "@fontsource/yatra-one/latin-400.css";
import "@fontsource/hind/latin-400.css";
import "@fontsource/hind/latin-500.css";
import "@fontsource/hind/latin-600.css";
import "@fontsource/hind/devanagari-400.css";
import "@fontsource/hind/devanagari-600.css";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { AudioProvider } from "@/components/audio-provider";
import "./globals.css";
import "./table-experience.css";
import "./audio.css";

export const metadata: Metadata = {
  ...pageMetadata("/", SITE_TITLE, SITE_DESCRIPTION),
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s | Gulam Chor" },
  applicationName: "Gulam Chor",
  category: "games",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#263b34" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><AudioProvider>{children}</AudioProvider></body></html>;
}
