"use client";

import { useState, type CSSProperties } from "react";
import { CARD_INTERVAL, DEAL_START, dealStage, dealtCardCount } from "@/lib/deal";
import type { PlayerId } from "@/lib/game";
import type { PublicGame } from "@/lib/room";
import { PlayingCard } from "./playing-card";

function DealFlights({ elapsed, game, myId }: { elapsed: number; game: PublicGame; myId: PlayerId }) {
  const [joinedAt] = useState(elapsed);
  const first = Math.max(0, game.players.findIndex((p) => p.id === game.dealStart));
  const mine = game.players.findIndex((p) => p.id === myId);
  return <div className="deal-flights" aria-hidden="true">{Array.from({ length: 51 }, (_, index) => {
    const seat = ((first + index) % game.players.length - mine + game.players.length) % game.players.length;
    const angle = (90 - seat * 360 / game.players.length) * Math.PI / 180;
    return <span key={index} className="opening-flight" data-seat={game.players[(first + index) % game.players.length].id} style={{
      "--fly-x": `${Math.cos(angle) * 46}cqw`, "--fly-y": `${10 + Math.sin(angle) * 42}cqh`,
      "--mobile-x": seat === 0 ? "0cqw" : `${((seat - 0.5) / (game.players.length - 1) - 0.5) * 90}cqw`,
      "--mobile-y": seat === 0 ? "48cqh" : "-32cqh",
      "--fly-delay": `${DEAL_START + index * CARD_INTERVAL - joinedAt}ms`,
    } as CSSProperties}><PlayingCard back /></span>;
  })}</div>;
}

export function DealSequence({ game, myId, elapsed }: { game: PublicGame; myId: PlayerId; elapsed: number }) {
  const stage = dealStage(elapsed);
  const stageIndex = ["shuffle", "aside", "deal", "pairs"].indexOf(stage);
  const titles = { shuffle: "A proper shuffle. A little suspense.", aside: "One Gulam sits this round out.", deal: "Around the table, one card at a time.", pairs: "Matching pairs leave together.", ready: "Let the mischief begin." };
  return <section className={`opening opening-stage-${stage}`} aria-label="Shuffling and dealing the cards">
    <div className="opening-visual" aria-hidden="true">
      <div className="opening-deck"><PlayingCard back /><PlayingCard back /><PlayingCard back /></div>
      {stage !== "shuffle" && <div className="opening-aside"><PlayingCard back /><span>J · GULAM<small>Kept aside, face down</small></span></div>}
      {stage === "pairs" && game.lastPair && <div className="opening-pair">{game.lastPair.map((card) => <PlayingCard key={card.id} card={card} />)}</div>}
    </div>
    {stage === "deal" && <DealFlights elapsed={elapsed} game={game} myId={myId} />}
    <div className="opening-copy" role="status" aria-live="polite">
      <span className="opening-eyebrow" lang="hi">चलो, शुरू करें</span>
      <h2>{titles[stage]}</h2>
      <p>{stage === "shuffle" ? "52 cards, shuffled for a fresh round." : stage === "aside" ? "One Jack stays here. The other 51 are yours to play." : stage === "deal" ? `Dealing 51 cards between ${game.players.length} players.` : `${game.pairCount} pairs put away. Your remaining cards stay in order.`}</p>
      <ol className="opening-steps" aria-label="Deal progress">{["Shuffle", "Set aside", "Deal", "Pair up"].map((label, index) => <li key={label} aria-current={index === stageIndex ? "step" : undefined} className={index <= stageIndex ? "done" : ""}><i />{label}</li>)}</ol>
    </div>
    {stage === "deal" && <span className="dealt-counter" aria-hidden="true">{dealtCardCount(elapsed)} / 51 dealt</span>}
  </section>;
}
