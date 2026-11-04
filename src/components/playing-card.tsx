import { art } from "@/lib/art";
import { SUIT_SYMBOLS, type Card } from "@/lib/game";

export function PlayingCard({ card, back = false, className = "" }: { card?: Card; back?: boolean; className?: string }) {
  if (back || !card) return <span className={`playing-card card-back ${className}`} aria-hidden="true"><img src={art("card-back")} alt="" width="240" height="360" draggable="false" /></span>;
  const red = card.suit === "H" || card.suit === "D";
  const symbol = SUIT_SYMBOLS[card.suit];
  const count = Number(card.rank);
  const isCourt = card.rank === "K" || card.rank === "Q";
  return (
    <span className={`playing-card card-face ${red ? "card-red" : "card-black"} ${className}`} aria-hidden="true">
      <span className="card-corner"><b>{card.rank}</b><span>{symbol}</span></span>
      {card.rank === "J" ? <span className="jack-portrait"><img src={art("jack")} alt="" width="360" height="500" draggable="false" /></span> :
        card.rank === "A" || isCourt ? <span className="court-symbol"><span>{symbol}</span>{isCourt && <b>{card.rank}</b>}<i>✦</i></span> :
          <span className={`card-pips pips-${count}`}>{Array.from({ length: count }, (_, i) => <span key={i}>{symbol}</span>)}</span>}
      <span className="card-corner card-corner-bottom"><b>{card.rank}</b><span>{symbol}</span></span>
    </span>
  );
}
