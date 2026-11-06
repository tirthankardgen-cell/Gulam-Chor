import type { Metadata } from "next";
import { GameClient } from "@/components/game-client";

export const metadata: Metadata = { title: "The Baithak — Play", robots: { index: false, follow: true }, alternates: { canonical: "/play" } };
export default function PlayPage() { return <GameClient />; }
