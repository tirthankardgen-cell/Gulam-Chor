"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Brand } from "./brand";
import { Scene } from "./scene";
import { Icon } from "./icon";
import { PlayingCard } from "./playing-card";
import { Dialog } from "./dialog";
import { art, hasPaintedCloth } from "@/lib/art";
import { cardLabel, FAMILY, shuffle, type PlayerId, type PublicEvent } from "@/lib/game";
import { DEAL_DURATION, type HandView, type RoomCommand, type RoomView } from "@/lib/room";

function readStorage(key: string, session = false) {
  try { return (session ? sessionStorage : localStorage).getItem(key); } catch { return null; }
}
function saveStorage(key: string, value: string, session = false) {
  try { (session ? sessionStorage : localStorage).setItem(key, value); } catch { /* The game also works with browser storage disabled. */ }
}
function eventText(event: PublicEvent | undefined, nameOf: (id: PlayerId) => string): string {
  if (!event) return "The pairs are put away. Let the mischief begin.";
  const name = nameOf(event.actor);
  if (event.safe.length) return `${event.safe.map(nameOf).join(" & ")} ${event.safe.length > 1 ? "are" : "is"} safe. Chai break!`;
  const rank = event.pairRank === "A" ? "Aces" : event.pairRank === "J" ? "Jacks" : event.pairRank === "Q" ? "Queens" : event.pairRank === "K" ? "Kings" : `${event.pairRank}s`;
  return event.pairRank ? `${name} made a pair of ${rank}. Into the pile!` : `${name} picked a card from ${nameOf(event.target)}. The secret travels on.`;
}

function useTableSound() {
  const [enabled, setEnabled] = useState(() => readStorage("gulam-sound") === "on");
  const context = useRef<AudioContext | null>(null);
  const tone = useCallback((kind: "draw" | "pair" | "finish", force = false) => {
    if (!enabled && !force) return;
    if (!force && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    try {
      context.current ??= new AudioContext();
      const audio = context.current;
      void audio.resume().catch(() => {});
      const notes = kind === "finish" ? [392, 494, 587] : kind === "pair" ? [440, 587] : [260];
      notes.forEach((frequency, index) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        const start = audio.currentTime + index * 0.1;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.6, start + 0.12);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.055, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
        oscillator.connect(gain); gain.connect(audio.destination);
        oscillator.start(start); oscillator.stop(start + 0.22);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch { /* Audio is optional, including on browsers that block it. */ }
  }, [enabled]);
  useEffect(() => () => { void context.current?.close().catch(() => {}); }, []);
  return { enabled, tone, toggle: () => {
    const next = !enabled;
    setEnabled(next); saveStorage("gulam-sound", next ? "on" : "off");
    if (next) tone("pair", true);
  } };
}

export default function GameTable({ room, hand, busy, online, error, offset, act }: {
  room: RoomView; hand: HandView; busy: boolean; online: boolean; error: string; offset: number;
  act: (command: RoomCommand) => Promise<void>;
}) {
  const game = room.game!;
  const [modal, setModal] = useState<"rules" | "settings" | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [cardOrder, setCardOrder] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now() + offset);
  const [reduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const { enabled: soundEnabled, toggle: toggleSound, tone } = useTableSound();
  const previousTurn = useRef(game.turn);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + offset), 250);
    return () => clearInterval(timer);
  }, [offset]);
  useEffect(() => {
    if (previousTurn.current !== game.turn) tone(game.status === "finished" ? "finish" : game.events.at(-1)?.pairRank ? "pair" : "draw");
    previousTurn.current = game.turn;
  }, [game.turn, game.status, game.events, tone]);

  const intro = now < room.startedAt + DEAL_DURATION ? Math.min(3, Math.max(0, Math.floor((now - room.startedAt) / (DEAL_DURATION / 4)))) : -1;
  const myId = hand.id;
  const host = room.host === myId;
  const getProfile = (id: PlayerId) => {
    const p = room.players.find((player) => player.id === id)!;
    return { ...p, color: FAMILY.find((avatar) => avatar.id === p.avatar)!.color };
  };
  const myIndex = game.players.findIndex((p) => p.id === myId);
  const players = [...game.players.slice(myIndex), ...game.players.slice(0, myIndex)];
  const cards = [...hand.cards].sort((a, b) => cardOrder.indexOf(a.id) - cardOrder.indexOf(b.id));
  const target = game.players.find((p) => p.id === game.target);
  const yourTurn = game.actor === myId && intro < 0 && !busy && !modal;
  const safe = game.players.find((p) => p.id === myId)?.count === 0;
  const finished = game.status === "finished";
  const lastPair = game.lastPair;
  const lastEvent = game.events.at(-1);
  const picked = selected ? cards.find((card) => card.id === selected) : null;
  const actorName = game.actor ? getProfile(game.actor).name : "";
  const targetName = target ? getProfile(target.id).name : "";
  const finalCard = game.finalCard;
  const heading = !online ? "Reconnecting to the table…" : busy ? "The cards are moving…" : yourTurn ? "A little luck. Pick a card." : safe ? "You’re safe. Enjoy the show." : actorName + " is choosing…";
  const introLines = ["Shuffling the old deck…", "One Jack, kept a secret.", "51 cards. " + game.players.length + " familiar faces.", game.pairCount + " pairs find their way home."];
  const nameOf = (id: PlayerId) => getProfile(id).name;
  const restart = () => { void act({ action: "start", revision: room.revision }); };
  const draw = (slot: number) => { setSelected(null); void act({ action: "draw", revision: room.revision, slot }); };

  return (
    <div className="game-shell">
      <Scene game />
      <header className="game-header">
        <Brand compact />
        <div className="room-name"><span lang="hi">शाम की बैठक</span><small>THE EVENING BAITHAK</small></div>
        <div className="table-tools">
          <button className="icon-button" onClick={toggleSound} aria-label={soundEnabled ? "Mute game sounds" : "Enable game sounds"} aria-pressed={soundEnabled} title={soundEnabled ? "Sound on" : "Sound off"}><Icon name={soundEnabled ? "sound" : "muted"} /></button>
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

          <div className="opponents" aria-label="Players in anticlockwise seat order">
            {players.slice(1).map((player, index) => {
              const angle = (90 - (index + 1) * 360 / game.players.length) * Math.PI / 180;
              const profile = getProfile(player.id);
              const isSafe = !player.count;
              const isActor = !finished && game.actor === player.id;
              const isTarget = !finished && game.actor === myId && target?.id === player.id;
              return <div key={player.id} className={`player-seat ${isSafe ? "is-safe" : ""} ${isActor ? "is-actor" : ""} ${isTarget ? "is-target" : ""} ${game.chor === player.id ? "is-chor" : ""}`} style={{ "--seat-x": `${50 + Math.cos(angle) * 46}%`, "--seat-y": `${50 + Math.sin(angle) * 42}%`, "--portrait-color": profile.color } as CSSProperties} data-player={player.id}>
                <div className="portrait-wrap"><img src={art(profile.avatar)} width="64" height="64" alt={`${profile.name}`} draggable="false" />{isSafe && <span className="safe-tick"><Icon name="check" size={13} /></span>}</div>
                <strong>{profile.name}</strong>
                <span className="player-count">{isSafe ? <>Safe<span className="safe-seat-extra"> · Chai time</span></> : game.chor === player.id ? "Gulam Chor" : `${player.count} ${player.count === 1 ? "card" : "cards"}`}</span>
                {isActor && <small className="seat-caption">CHOOSING</small>}{isTarget && <small className="seat-caption">ON YOUR LEFT</small>}
              </div>;
            })}
          </div>

          {!finished && <>
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
                {Array.from({ length: game.slotCount }, (_, index) => <button key={`${game.turn}-${index}`} className="draw-card" style={{ "--index": index, "--angle": `${(index - (game.slotCount - 1) / 2) * 3}deg`, "--lift": `${Math.abs(index - (game.slotCount - 1) / 2) * 2.4}px` } as CSSProperties} disabled={!yourTurn} onClick={() => draw(index)} aria-label={`Draw card ${index + 1} of ${game.slotCount} from ${targetName}`}>
                  <PlayingCard back />
                </button>)}
              </div>
              <p className="draw-hint">{yourTurn ? "Choose any card. Even the suspicious one." : safe ? "Your family is still playing. The Jack has a journey left." : "A straight face tells you nothing."}</p>
              {intro < 0 && now >= room.turnDeadline && <button className="cream-button nudge-button" disabled={busy} onClick={() => void act({ action: "nudge", revision: room.revision })}>Draw randomly for {actorName}</button>}
            </section>
            <div className="table-counter"><span>{game.players.reduce((sum, p) => sum + p.count, 0)} cards left</span><i>✦</i><span>TURN {String(game.turn).padStart(2, "0")}</span></div>
          </>}

          {finished && <section className="round-result" aria-labelledby="result-title">
            <p className="result-hindi" lang="hi">{game.chor === myId ? "पकड़े गए!" : "बच गए!"}</p>
            <h2 id="result-title">{game.chor === myId ? "You are" : `${getProfile(game.chor!).name} is`} the Gulam Chor!</h2>
            <p>The last Jack found a home. There’s always another round.</p>
            <div className="result-cards">
              <div role="img" aria-label={`Last Jack: ${cardLabel(finalCard!)}`}><PlayingCard card={finalCard!} /><small>The last Jack</small></div>
              <span aria-hidden="true">✦</span>
              <div role="img" aria-label={`Removed Jack: ${cardLabel(game.removedJack!)}`}><PlayingCard card={game.removedJack!} /><small>The one set aside</small></div>
            </div>
            <p className="safe-list"><Icon name="leaf" size={17} /> Safe: {game.safeOrder.map((id) => getProfile(id).name).join(" · ")}</p>
            {host ? <button className="cream-button" disabled={busy} onClick={restart}><Icon name="restart" size={18} /> One more round</button> : <p>Waiting for the host to deal again…</p>}
          </section>}

          {intro >= 0 && <div className="dealing-overlay" role="status" aria-live="polite">
            {!reduced && intro === 2 && players.map((player, index) => {
              const angle = (90 - index * 360 / game.players.length) * Math.PI / 180;
              return <span key={player.id} className="deal-flight" aria-hidden="true" style={{ "--fly-x": `${Math.cos(angle) * 135}px`, "--fly-y": `${Math.sin(angle) * 110}px`, "--fly-delay": `${index * 35}ms` } as CSSProperties}><PlayingCard back /></span>;
            })}
            <div className="dealing-deck"><PlayingCard back /><PlayingCard back /><PlayingCard back /></div>
            <span lang="hi">चलो, शुरू करें</span>
            <h2>{introLines[intro]}</h2>
            <div className="deal-dots" aria-hidden="true">{[0, 1, 2, 3].map((i) => <i key={i} className={i <= intro ? "done" : ""} />)}</div>
            <p className="deal-explanation">{intro === 2 ? game.players.find((p) => p.id === myId)?.initialCount + " cards dealt to you" : "Everyone sees the same shuffle and deal."}</p>
          </div>}
        </div>

        <section className={`your-hand ${safe ? "hand-safe" : ""}`} aria-label="Your hand">
          <div className="hand-heading"><div><img src={art(getProfile(myId).avatar)} alt="" width="35" height="35" /><span><b>{getProfile(myId).name} · YOU</b><small>{safe ? "Safe & sipping chai" : `${cards.length} cards in hand`}</small></span></div>
            {!safe && !finished && <button className="text-button" onClick={() => { setCardOrder(shuffle(cards.map((card) => card.id))); setSelected(null); tone("draw"); }} disabled={intro >= 0 || busy}><Icon name="shuffle" size={16} /> Shuffle hand</button>}
          </div>
          {safe ? <div className="safe-hand-note"><Icon name="cup" size={28} /><p>Your cards are gone. Your chai is waiting.</p></div> : <div className="hand-scroll"><div className="hand-fan" style={{ "--count": cards.length } as CSSProperties}>
            {cards.map((card, index) => <button key={card.id} className={`own-card ${selected === card.id ? "card-selected" : ""}`} style={{ "--index": index, "--angle": `${(index - (cards.length - 1) / 2) * 2}deg`, "--lift": `${Math.abs(index - (cards.length - 1) / 2) * 2}px` } as CSSProperties} aria-label={cardLabel(card)} aria-pressed={selected === card.id} onClick={() => setSelected(selected === card.id ? null : card.id)}><PlayingCard card={card} /></button>)}
          </div></div>}
          <p className="hand-caption">{picked ? cardLabel(picked) : !safe && !finished ? "Same rank makes a pair. Suits don’t matter." : "A little luck. A lot of apne."}</p>
        </section>
        <p className={`table-event ${error ? "event-error" : ""}`} role="status" aria-live="polite" aria-atomic="true">{error || (!online ? "Reconnecting… Your seat is saved. Moves resume when the connection returns." : finished ? `${game.chor === myId ? "You are" : `${getProfile(game.chor!).name} is`} the Gulam Chor. All 25 pairs are home.` : eventText(lastEvent, nameOf))}</p>
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
