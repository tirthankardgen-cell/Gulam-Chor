import type { Metadata } from "next";
import { GameClient } from "@/components/game-client";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata("/play", "Play Gulam Chor — Create or Join a Room", "Create or join a private Gulam Chor room. Share the invite with 2–6 friends, pick your cards, and avoid the last Jack. No account or download needed."),
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};
export default function PlayPage() { return <GameClient />; }
