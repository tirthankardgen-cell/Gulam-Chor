import type { CSSProperties } from "react";
import { art } from "@/lib/art";
import { cardLabel, type PlayerId } from "@/lib/game";
import type { RoomView } from "@/lib/room";
import { Icon } from "./icon";
import { PlayingCard } from "./playing-card";

export function RoundResult({ room, myId, busy, restart }: { room: RoomView; myId: PlayerId; busy: boolean; restart: () => void }) {
  const game = room.game!;
  const chor = room.players.find((p) => p.id === game.chor)!;
  const lost = chor.id === myId;
  return <section className={`round-outcome ${lost ? "outcome-lost" : "outcome-won"}`} aria-labelledby="result-title">
    {!lost && <div className="confetti" aria-hidden="true">{Array.from({ length: 48 }, (_, index) => <i key={index} style={{ "--x": `${(index * 37) % 100}%`, "--delay": `${(index % 12) * 110}ms`, "--drift": `${(index % 7 - 3) * 30}px`, "--color": ["#f2ca7e", "#91c4a2", "#d98f7a", "#f6e7bc", "#a3bed4"][index % 5] } as CSSProperties} />)}</div>}
    <header className="outcome-heading">
      <p lang="hi">{lost ? "पकड़े गए!" : "बच गए!"}</p>
      <h2 id="result-title">{lost ? "You are the Gulam Chor!" : "You won. The Jack got away!"}</h2>
      <span>{lost ? "The last Jack stayed with you. This round is theirs!" : `${chor.name} holds the last Jack and loses this round.`}</span>
    </header>
    <div className="outcome-players">
      <div className="chor-spotlight">
        <div className="chor-reveal"><img src={art(chor.avatar)} alt="" width="78" height="78" /><span className="chor-stamp">GULAM CHOR</span></div>
        <strong className="chor-name">{chor.name}{lost ? " · YOU" : ""}</strong>
        <span className="chor-verdict">Caught with the last Jack · Round lost</span>
        <div className="outcome-cards">
          <div role="img" aria-label={`Last Jack: ${cardLabel(game.finalCard!)}`}><PlayingCard card={game.finalCard!} /><small>The last Jack</small></div>
          <span aria-hidden="true">✦</span>
          <div role="img" aria-label={`Removed Jack: ${cardLabel(game.removedJack!)}`}><PlayingCard card={game.removedJack!} /><small>Kept aside</small></div>
        </div>
      </div>
      <div className="winners-panel"><h3><Icon name="leaf" size={17} /> The winners</h3><p>Empty hands. Full bragging rights.</p>
        <ul>{game.safeOrder.map((id, index) => {
          const player = room.players.find((p) => p.id === id)!;
          return <li key={id} style={{ "--winner-delay": `${index * 100 + 250}ms` } as CSSProperties}><img src={art(player.avatar)} alt="" width="32" height="32" /><strong>{player.name}{id === myId ? " · YOU" : ""}</strong><span><Icon name="check" size={12} /> WON</span></li>;
        })}</ul>
      </div>
    </div>
    <div className="outcome-actions">{room.host === myId ? <button className="cream-button" disabled={busy} onClick={restart}><Icon name="restart" size={18} /> One more round</button> : <p role="status">Waiting for {room.players.find((p) => p.id === room.host)?.name} to deal again…</p>}</div>
  </section>;
}
