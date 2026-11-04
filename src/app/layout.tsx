import type { Metadata, Viewport } from "next";
import "@fontsource/yatra-one/devanagari-400.css";
import "@fontsource/yatra-one/latin-400.css";
import "@fontsource/hind/latin-400.css";
import "@fontsource/hind/latin-500.css";
import "@fontsource/hind/latin-600.css";
import "@fontsource/hind/devanagari-400.css";
import "@fontsource/hind/devanagari-600.css";
import { art } from "@/lib/art";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gulam Chor — A little luck. A lot of apne.",
  description: "A familiar courtyard, a cup of chai, and one mischievous Jack. Play the classic Indian family card game in this illustrated browser preview.",
  applicationName: "Gulam Chor",
  icons: { icon: art("favicon"), apple: art("favicon") },
  openGraph: { title: "Gulam Chor", description: "Wahi purane patte. Wahi apnon ki baithak.", type: "website", locale: "en_IN" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#263b34" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
