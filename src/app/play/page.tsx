import type { Metadata } from "next";
import { GameClient } from "@/components/game-client";

export const metadata: Metadata = { title: "The Baithak — Play Gulam Chor" };
export default function PlayPage() { return <GameClient />; }
