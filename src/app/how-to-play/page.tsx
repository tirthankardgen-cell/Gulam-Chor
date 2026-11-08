import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Scene } from "@/components/scene";
import { AudioControls } from "@/components/audio-controls";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "/how-to-play",
  "How to Play Gulam Chor — Rules for 2–6 Players",
  "Learn the Gulam Chor rules: remove one Jack, deal 51 cards, discard matching pairs, and draw from your neighbour. Play online with 2, 3, 4, 5, or 6 players.",
);

export default function HowToPlay() {
  return <div className="room-shell">
    <Scene game />
    <header className="game-header"><Brand compact /><div className="table-tools"><AudioControls /><Link className="text-button" href="/">Courtyard</Link></div></header>
    <main id="main" className="room-main"><article className="room-paper rules-page">
      <p className="room-eyebrow">THE GREAT INDIAN FAMILY GAME</p>
      <h1>How to play Gulam Chor</h1>
      <p className="room-lead">One mischievous Jack. Two to six friends. A familiar Indian card game, now together online.</p>
      <h2>Gather your people</h2>
      <p>Click Play and choose Create a room. Enter your name, choose an avatar, and share your six-character room code or invite link. Friends can open the link or choose Join a room, then enter their own name and avatar. The host starts when everyone is ready.</p>
      <h2>Deal the cards</h2>
      <p>We shuffle a standard 52-card deck and secretly remove one Jack. The remaining 51 cards are shared as evenly as possible among 2, 3, 4, 5, or 6 players. Some players receive one extra card when the deal is uneven. All pairs of the same rank are put aside automatically; suit and colour do not matter.</p>
      <h2>Pick a card, make a pair</h2>
      <p>A starting player is chosen at random. On your turn, choose one face-down card from the next player with cards on your left, moving anticlockwise around the table. If it matches a rank in your hand, the pair goes away. Otherwise you keep it. Only you can see your hand.</p>
      <h2>Don’t keep the last Jack</h2>
      <p>Empty hands mean you are safe! Your seat is skipped while the others continue. The last player holding the unmatched Jack is the Gulam Chor. Everyone else wins. The host can deal another round or return everyone to the lobby to change players.</p>
      <h2>Play on any device</h2>
      <p>No account or download is needed. Each friend should use their own browser or device. Reopen the invite in the same browser to recover your seat. If someone is away for 60 seconds, any player can choose a random draw for them. Rooms expire after 24 hours without a move.</p>
      <Link className="ink-button" href="/play">Come, play a round →</Link>
    </article></main>
  </div>;
}
