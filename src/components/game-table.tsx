"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Brand } from "./brand";
import { Scene } from "./scene";
import { Icon } from "./icon";
import { PlayingCard } from "./playing-card";
import { Dialog } from "./dialog";
import { DealSequence } from "./deal-sequence";
import { RoundResult } from "./round-result";
import { useCardSelection } from "./use-card-selection";
import { AudioControls } from "./audio-controls";
import { useAudio } from "./audio-provider";
import { useGameAudio } from "./use-game-audio";
import { art, hasPaintedCloth } from "@/lib/art";
import { cardLabel, FAMILY, type PlayerId, type PublicEvent } from "@/lib/game";
import { dealStage, dealtCardCount } from "@/lib/deal";
import { type HandView, type RoomCommand, type RoomView } from "@/lib/room";

function eventText(event: PublicEvent | undefined, nameOf: (id: PlayerId) => string): string {
  if (!event) return "The pairs are put away. Let the mischief begin.";
  const name = nameOf(event.actor);
  if (event.safe.length) return `${event.safe.map(nameOf).join(" & ")} ${event.safe.length > 1 ? "are" : "is"} safe. Chai break!`;
  const rank = event.pairRank === "A" ? "Aces" : event.pairRank === "J" ? "Jacks" : event.pairRank === "Q" ? "Queens" : event.pairRank === "K" ? "Kings" : `${event.pairRank}s`;
  return event.pairRank ? `${name} made a pair of ${rank}. Into the pile!` : `${name} picked a card from ${nameOf(event.target)}. The secret travels on.`;
}

export default function GameTable({ room, hand, busy, online, error, offset, act }: {
  room: RoomView; hand: HandView; busy: boolean; online: boolean; error: string; offset: number;
  act: (command: RoomCommand) => Promise<void>;
}) {
  const game = room.game!;
  const [modal, setModal] = useState<"rules" | "settings" | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [touchChoice, setTouchChoice] = useState<{ revision: number; slot: number } | null>(null);
  const [now, setNow] = useState(() => Date.now() + offset);
  const { play } = useAudio();
  const choosing = useRef<number | null>(null);
  const previousTouch = useRef<string | null>(null);
  useGameAudio(room, hand.id, online, offset);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + offset), 80);
    return () => clearInterval(timer);
  }, [offset]);
  const elapsed = now - room.startedAt;
  const stage = dealStage(elapsed);
  const intro = stage !== "ready";
  const myId = hand.id;
  const host = room.host === myId;
  const getProfile = (id: PlayerId) => {
    const p = room.players.find((player) => player.id === id)!;
    return { ...p, color: FAMILY.find((avatar) => avatar.id === p.avatar)!.color };
  };
  const myIndex = game.players.findIndex((p) => p.id === myId);
  const players = [...game.players.slice(myIndex), ...game.players.slice(0, myIndex)];
  const cards = hand.cards;
  const target = game.players.find((p) => p.id === game.target);
  const yourTurn = game.actor === myId && !intro && !busy && !modal && online;
  const safe = game.players.find((p) => p.id === myId)?.count === 0;
  const finished = game.status === "finished" && !intro;
  const { selection, preview } = useCardSelection(room.code, room.revision, yourTurn && !finished);
  const previewChoice = (slot: number | null) => {
    if (slot !== null && slot !== choosing.current && yourTurn) play("choose");
    choosing.current = slot;
    preview(slot);
  };
  const activeSlot = selection && now - selection.updatedAt < 6000 ? selection.slot : null;
  const touchedCard = target?.id === myId && activeSlot !== null ? hand.offeredCardIds?.[activeSlot] ?? cards[cards.length - 1 - activeSlot]?.id : null;
  useEffect(() => {
    if (touchedCard && touchedCard !== previousTouch.current && !intro) play("choose", { volume: .45 });
    previousTouch.current = touchedCard;
  }, [touchedCard, intro, play]);
  const pendingTouch = touchChoice?.revision === room.revision ? touchChoice.slot : null;
  const lastPair = game.lastPair;
  const lastEvent = game.events.at(-1);
  const picked = selected ? cards.find((card) => card.id === selected) : null;
  const actorName = game.actor ? getProfile(game.actor).name : "";
  const targetName = target ? getProfile(target.id).name : "";
  const heading = !online ? "Reconnecting to the table…" : busy ? "The cards are moving…" : yourTurn ? "A little luck. Pick a card." : safe ? "You’re safe. Enjoy the show." : actorName + " is choosing…";
  const nameOf = (id: PlayerId) => getProfile(id).name;
  const restart = () => { void act({ action: "start", revision: room.revision }); };
  const draw = (slot: number) => { preview(null); setSelected(null); setTouchChoice(null); void act({ action: "draw", revision: room.revision, slot }); };
  const dealt = dealtCardCount(elapsed);
  const dealFirst = Math.max(0, game.players.findIndex((p) => p.id === game.dealStart));
  const dealtTo = (id: PlayerId) => {
    const position = (game.players.findIndex((p) => p.id === id) - dealFirst + players.length) % players.length;
    return Math.max(0, Math.floor((dealt + players.length - 1 - position) / players.length));
  };

  return (
    <div className={`game-shell ${finished ? "game-complete" : ""}`}>
      <Scene game />
      <header className="game-header">
        <Brand compact />
        <div className="room-name"><span lang="hi">शाम की बैठक</span><small>THE EVENING BAITHAK</small></div>
        <div className="table-tools">
          <AudioControls />
          <button className="icon-button" onClick={() => setModal("rules")} aria-label="How to play" title="How to play"><Icon name="help" /></button>
          <button className="icon-button" onClick={() => setModal("settings")} aria-label="Table settings" title="Table settings"><Icon name="settings" /></button>
        </div>
      </header>

      <main id="main" className="game-main">
        <div className="table-topline">
          <h1>ROOM {room.code} <span>· PLAYING WITH FRIENDS</span></h1>
          <div><span>ROUND {String(game.round).padStart(2, "0")}</span><i>✦</i><span>{game.players.length} SEATS</span></div>
        </div>
        <div className={`table-area seats-${game.players.length} ${finished ? "table-finished" : ""}`}>
          <div className="cloth-table" style={{ backgroundImage: `url(${art("table-cloth")})`, backgroundSize: hasPaintedCloth ? "360px 360px" : "82px 82px" }}>
            <div className="cloth-inner-border" />
            <span className="table-corner corner-tl" aria-hidden="true">✥</span><span className="table-corner corner-tr" aria-hidden="true">✥</span><span className="table-corner corner-bl" aria-hidden="true">✥</span><span className="table-corner corner-br" aria-hidden="true">✥</span>
          </div>

          {!finished && <div className="opponents" aria-label="Players in anticlockwise seat order">
            {players.slice(1).map((player, index) => {
              const angle = (90 - (index + 1) * 360 / game.players.length) * Math.PI / 180;
              const profile = getProfile(player.id);
              const isSafe = !intro && !player.count;
              const isActor = !intro && game.actor === player.id;
              const isTarget = !intro && game.actor === myId && target?.id === player.id;
              return <div key={player.id} className={`player-seat ${isSafe ? "is-safe" : ""} ${isActor ? "is-actor" : ""} ${isTarget ? "is-target" : ""} ${game.chor === player.id ? "is-chor" : ""}`} style={{ "--seat-x": `${50 + Math.cos(angle) * 46}%`, "--seat-y": `${50 + Math.sin(angle) * 42}%`, "--portrait-color": profile.color } as CSSProperties} data-player={player.id}>
                <div className="portrait-wrap"><img src={art(profile.avatar)} width="64" height="64" alt={`${profile.name}`} draggable="false" />{isSafe && <span className="safe-tick"><Icon name="check" size={13} /></span>}</div>
                <strong>{profile.name}</strong>
                <span className="player-count">{intro ? stage === "pairs" ? `${player.count} cards kept` : `${dealtTo(player.id)} / ${player.initialCount} dealt` : isSafe ? <>Safe<span className="safe-seat-extra"> · Chai time</span></> : `${player.count} ${player.count === 1 ? "card" : "cards"}`}</span>
                {isActor && <small className="seat-caption">CHOOSING</small>}{isTarget && <small className="seat-caption">ON YOUR LEFT</small>}
              </div>;
            })}
          </div>}

          {!finished && !intro && <>
            <div className="discard-tray" aria-label={`${game.pairCount} pairs discarded`}>
              <div className="mini-pair">{lastPair?.map((card) => <PlayingCard key={card.id} card={card} />)}</div>
              <span><b>{game.pairCount}</b> pairs away</span>
            </div>
            <div className="removed-tray"><PlayingCard back /><span>One Jack<br /><small>kept aside</small></span></div>
            <section className={`draw-zone ${yourTurn ? "your-turn" : ""} ${busy ? "draw-busy" : ""}`} aria-label="Blind draw">
              <p className="turn-label"><span />{yourTurn ? "YOUR TURN" : safe ? "YOU’RE SAFE" : busy ? "THE CARDS ARE MOVING" : `${actorName.toUpperCase()}’S TURN`}<span /></p>
              <h2>{heading}</h2>
              <p className="draw-source">{yourTurn ? `Draw from ${targetName}’s hand · your left neighbour` : `${actorName} ${game.actor === myId ? "draw" : "draws"} from ${target?.id === myId ? "your hand" : `${targetName}’s hand`}`}</p>
              <div className="draw-fan" style={{ "--count": game.slotCount } as CSSProperties}>
                {Array.from({ length: game.slotCount }, (_, index) => <button key={`${game.turn}-${index}`} data-sound="none" className={`draw-card ${activeSlot === index || pendingTouch === index ? "card-previewed" : ""}`} style={{ "--index": index, "--angle": `${(index - (game.slotCount - 1) / 2) * 3}deg`, "--lift": `${Math.abs(index - (game.slotCount - 1) / 2) * 2.4}px` } as CSSProperties} disabled={!yourTurn}
                  onPointerEnter={(event) => { if (event.pointerType !== "touch") previewChoice(index); }} onPointerLeave={(event) => { if (event.pointerType !== "touch") previewChoice(null); }}
                  onPointerDown={(event) => { if (event.pointerType === "touch") { setTouchChoice({ revision: room.revision, slot: index }); previewChoice(index); } }} onPointerCancel={() => { setTouchChoice(null); previewChoice(null); }}
                  onFocus={() => previewChoice(index)} onBlur={() => previewChoice(null)} onClick={(event) => { if (event.detail === 0 || (event.nativeEvent as PointerEvent).pointerType !== "touch") draw(index); }} aria-label={`Draw card ${index + 1} of ${game.slotCount} from ${targetName}`}>
                  <PlayingCard back />
                </button>)}
              </div>
              {yourTurn && pendingTouch !== null ? <button className="cream-button take-card-button" data-sound="confirm" onClick={() => draw(pendingTouch)}>Take this card</button> : <p className="draw-hint">{yourTurn ? "Their hand, viewed from the back. Hover or touch to choose." : target?.id === myId ? `${actorName} can see only the backs. Watch for a highlighted card below.` : safe ? "Your friends are still playing. The Jack has a journey left." : "A straight face tells you nothing."}</p>}
              {now >= room.turnDeadline && pendingTouch === null && <button className="cream-button nudge-button" disabled={busy || !online} onClick={() => void act({ action: "nudge", revision: room.revision })}>Draw randomly for {actorName}</button>}
            </section>
            <div className="table-counter"><span>{game.players.reduce((sum, p) => sum + p.count, 0)} cards left</span><i>✦</i><span>TURN {String(game.turn).padStart(2, "0")}</span></div>
          </>}

          {finished && <RoundResult room={room} myId={myId} busy={busy || !online} restart={restart} />}
          {intro && <DealSequence game={game} myId={myId} elapsed={elapsed} />}
        </div>

        {!finished && <section className={`your-hand ${safe ? "hand-safe" : ""} ${intro ? "hand-dealing" : ""}`} aria-label="Your hand">
          <div className="hand-heading"><div><img src={art(getProfile(myId).avatar)} alt="" width="35" height="35" /><span><b>{getProfile(myId).name} · YOU</b><small>{intro ? `${dealtTo(myId)} cards dealt to you` : safe ? "Safe & sipping chai" : `${cards.length} cards in hand`}</small></span></div>
            <span className="hand-order-note">{intro ? "Your cards are on their way" : "Your hand stays in this order"}</span>
          </div>
          {intro ? <div className="hand-deal-note"><PlayingCard back /><span>{stage === "pairs" ? `${cards.length} cards kept after pairing` : `${dealtTo(myId)} / ${game.players.find((p) => p.id === myId)?.initialCount} cards received`}</span></div> : safe ? <div className="safe-hand-note"><Icon name="cup" size={28} /><p>Your cards are gone. Your chai is waiting.</p></div> : <div className="hand-scroll"><div className="hand-fan" style={{ "--count": cards.length } as CSSProperties}>
            {cards.map((card, index) => <button key={card.id} data-sound="choose" className={`own-card ${selected === card.id ? "card-selected" : ""} ${touchedCard === card.id ? "card-touched" : ""}`} style={{ "--index": index, "--angle": `${(index - (cards.length - 1) / 2) * 2}deg`, "--lift": `${Math.abs(index - (cards.length - 1) / 2)}px` } as CSSProperties} data-card-id={card.id} aria-label={`${cardLabel(card)}${touchedCard === card.id ? `, ${actorName} is touching this card` : ""}`} aria-pressed={selected === card.id} onClick={() => setSelected(selected === card.id ? null : card.id)}><PlayingCard card={card} />{touchedCard === card.id && <span className="touch-marker" aria-hidden="true">CHOOSING</span>}</button>)}
          </div></div>}
          <p className="hand-caption">{intro ? "Pairs will be put away before the first turn." : touchedCard ? `${actorName} is touching your ${cardLabel(cards.find((card) => card.id === touchedCard)!)}.` : picked ? cardLabel(picked) : !safe ? "Same rank makes a pair. Suits don’t matter." : "A little luck. A lot of apne."}</p>
        </section>}
        <p className={`table-event ${error ? "event-error" : ""}`} role="status" aria-live="polite" aria-atomic="true">{error || (!online ? "Reconnecting… Your seat is saved. Moves resume when the connection returns." : finished ? `${game.chor === myId ? "You are" : `${getProfile(game.chor!).name} is`} the Gulam Chor. All 25 pairs are home.` : intro ? "The whole table is getting ready…" : eventText(lastEvent, nameOf))}</p>
      </main>
      <footer className="game-footer"><Link href="/"><Icon name="back" size={14} /> Back to the courtyard</Link><span>{online ? "LIVE" : "RECONNECTING"} · {game.players.length} FRIENDS</span><span className="footer-hindi" lang="hi">पत्ते कम, यादें ज़्यादा।</span></footer>

      {modal === "rules" && <Dialog title="A game we grew up with." onClose={() => setModal(null)}>
        <p className="dialog-lead" lang="hi">नियम छोटे हैं। मज़ा बहुत है।</p>
        <ol className="rules-list">
          <li><span>01</span><div><h3>One Jack sits this one out.</h3><p>We remove one Jack, face down, and deal the other 51 cards fairly between 2–6 players.</p></div></li>
          <li><span>02</span><div><h3>Pairs leave together.</h3><p>Two cards of the same rank make a pair — any two 7s, for example. We put all your pairs away automatically. Colours and suits don’t matter.</p></div></li>
          <li><span>03</span><div><h3>Take a little chance.</h3><p>Pick one hidden card from the next active seat on your left, anticlockwise around the table. A new pair goes away. Otherwise, keep the card.</p></div></li>
          <li><span>04</span><div><h3>Empty hands. Happy hearts.</h3><p>No cards? You’re safe. We skip empty seats. The last player holding the lone Jack is the Gulam Chor. Everyone else is safe!</p></div></li>
        </ol>
        <p className="dialog-note">Only you can see your hand. If someone disconnects, they can reopen this invite to recover their seat. After 60 seconds, any player can draw a random card for the waiting player.</p>
        <button className="ink-button" onClick={() => setModal(null)}>Back to the baithak <Icon name="arrow" size={18} /></button>
      </Dialog>}
      {modal === "settings" && <Dialog title="Your table, your people." onClose={() => setModal(null)}>
        <p className="dialog-lead">Room {room.code} · {game.players.length} players</p>
        <p className="dialog-note">Your seat is saved in this browser. Reopen the invite to reconnect. Returning to the lobby ends the current round for everyone.</p>
        {host ? <button className="ink-button" disabled={busy} onClick={() => { void act({ action: "lobby", revision: room.revision }); setModal(null); }}>End round & return everyone to lobby</button> : <p className="dialog-note">Ask the host to return to the lobby to change players.</p>}
        <button className="dialog-continue text-button" onClick={() => setModal(null)}>Keep this round going</button>
      </Dialog>}
    </div>
  );
}
