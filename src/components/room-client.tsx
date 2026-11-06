"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { onValue, ref } from "firebase/database";
import { Brand } from "./brand";
import { Scene } from "./scene";
import { Icon } from "./icon";
import GameTable from "./game-table";
import { art } from "@/lib/art";
import { FAMILY, type PlayerId } from "@/lib/game";
import { connectionError, firebase, identity, roomAction } from "@/lib/firebase";
import type { HandView, RoomCommand, RoomView } from "@/lib/room";

function savedProfile(): { name: string; avatar: PlayerId } {
  try {
    const saved = JSON.parse(localStorage.getItem("gulam-profile") || "{}");
    return { name: typeof saved.name === "string" ? saved.name : "", avatar: FAMILY.some((p) => p.id === saved.avatar) ? saved.avatar : "you" };
  } catch { return { name: "", avatar: "you" }; }
}
function codeFrom(value: string) {
  try { return (new URL(value).searchParams.get("room") || "").toUpperCase(); }
  catch { return value.trim().toUpperCase(); }
}

export default function RoomClient() {
  const [initial] = useState(savedProfile);
  const [name, setName] = useState(initial.name);
  const [avatar, setAvatar] = useState<PlayerId>(initial.avatar);
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get("room")?.toUpperCase() || "");
  const [mode, setMode] = useState<"choose" | "create" | "join">(() => new URLSearchParams(location.search).has("room") ? "join" : "choose");
  const [uid, setUid] = useState("");
  const [activeCode, setActiveCode] = useState("");
  const [table, setTable] = useState<{ room: RoomView; hand: HandView } | null>(null);
  const room = table?.room ?? null;
  const hand = table?.hand ?? null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(false);
  const [offset, setOffset] = useState(0);
  const [copied, setCopied] = useState("");
  const [retry, setRetry] = useState(0);
  const actionLock = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    identity().then((id) => { if (!cancelled) setUid(id); }).catch((e) => { if (!cancelled) setError(connectionError(e)); });
    return () => { cancelled = true; };
  }, [retry]);

  useEffect(() => {
    if (!uid) return;
    const db = firebase().database;
    const stopConnection = onValue(ref(db, ".info/connected"), (snap) => setOnline(snap.val() === true));
    const stopOffset = onValue(ref(db, ".info/serverTimeOffset"), (snap) => setOffset(snap.val() || 0));
    return () => { stopConnection(); stopOffset(); };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    // A refresh resumes an existing membership without joining or leaking room data.
    const invite = new URLSearchParams(location.search).get("room")?.toUpperCase();
    if (!invite || !/^[A-HJ-NP-Z2-9]{6}$/.test(invite)) return;
    let cancelled = false;
    const unsubscribe = onValue(ref(firebase().database, `rooms/${invite}/hands/${uid}`), (snap) => {
      if (!cancelled && snap.exists()) setActiveCode(invite);
    }, () => { /* New guests fill in their name before joining. */ }, { onlyOnce: true });
    return () => { cancelled = true; unsubscribe(); };
  }, [uid]);

  useEffect(() => {
    if (!activeCode || !uid) return;
    const db = firebase().database;
    let latestRoom: RoomView | null = null;
    let latestHand: HandView | null = null;
    const publish = () => {
      // Separate subscriptions may arrive in either order. Never render a hand
      // against another revision's seats (especially after lobby seat changes).
      if (latestRoom && latestHand && latestRoom.revision === latestHand.revision) {
        setTable({ room: latestRoom, hand: latestHand });
      }
    };
    const fail = (e: unknown) => {
      setError(connectionError(e));
      if (/permission.?denied/i.test(String((e as { code?: string })?.code))) {
        setTable(null); setActiveCode(""); setMode("choose");
        history.replaceState(null, "", "/play");
      }
    };
    const stopRoom = onValue(ref(db, `rooms/${activeCode}/public`), (snap) => {
      if (!snap.exists()) { setError("This room has closed. Return to the courtyard to open another."); return; }
      latestRoom = JSON.parse(snap.val());
      publish();
    }, fail);
    const stopHand = onValue(ref(db, `rooms/${activeCode}/hands/${uid}`), (snap) => {
      if (snap.exists()) { latestHand = JSON.parse(snap.val()); publish(); }
    }, fail);
    return () => { stopRoom(); stopHand(); };
  }, [activeCode, uid, retry]);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  async function enter(event: FormEvent) {
    event.preventDefault();
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(true); setError("");
    try {
      const id = await identity();
      setUid(id);
      const result = await roomAction(mode === "create" ? { action: "create", name, avatar } : { action: "join", code: codeFrom(code), name, avatar });
      try { localStorage.setItem("gulam-profile", JSON.stringify({ name: name.trim(), avatar })); } catch { /* Storage is optional. */ }
      setActiveCode(result.code); setCode(result.code);
      history.replaceState(null, "", `/play?room=${result.code}`);
    } catch (e) { setError(connectionError(e)); }
    finally { actionLock.current = false; setBusy(false); }
  }

  const act = useCallback(async (command: RoomCommand) => {
    if (actionLock.current || !activeCode) return;
    actionLock.current = true; setBusy(true); setError("");
    try {
      await roomAction({ ...command, code: activeCode });
      if (command.action === "leave") {
        setActiveCode(""); setTable(null); setMode("choose"); setCode("");
        history.replaceState(null, "", "/play");
      }
    } catch (e) { setError(connectionError(e)); }
    finally { actionLock.current = false; setBusy(false); }
  }, [activeCode]);

  async function copyInvite(link: boolean) {
    try {
      await navigator.clipboard.writeText(link ? `${location.origin}/play?room=${activeCode}` : activeCode);
      setCopied(link ? "Link copied!" : "Code copied!");
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(""), 2500);
    } catch { setCopied("Select and copy the room code or invite link below."); }
  }

  const synchronized = !!room && !!hand && room.revision === hand.revision;
  const host = !!room && room.host === hand?.id;
  if (room?.game && hand) return <GameTable key={room.game.round} room={room} hand={hand} busy={busy || !online || !synchronized} online={online} error={error} offset={offset} act={act} />;

  return <div className="room-shell">
    <Scene game />
    <header className="game-header"><Brand compact /><Link className="text-button" href="/"><Icon name="back" size={16} /> Courtyard</Link></header>
    <main id="main" className="room-main">
      <section className="room-paper" aria-labelledby="room-title">
        <span className="room-flower" aria-hidden="true">✺</span>
        <p className="room-eyebrow">A LITTLE LUCK. A LOT OF APNE.</p>
        <h1 id="room-title">{room ? "Your baithak is open." : activeCode ? "Finding your seat…" : mode === "choose" ? "Bring your people." : mode === "create" ? "Make room for mischief." : "There’s a seat for you."}</h1>
        <p className="room-lead">{room ? "Share the invite. Gather your friends. Let the cards decide." : mode === "choose" ? "Two friends or the whole family. Play together, wherever you are." : "A name, a familiar face, and you’re at the table."}</p>
        {error && <div className="room-error" role="alert">{error}<button className="text-button" onClick={() => { setError(""); setRetry((v) => v + 1); }}>Retry connection</button></div>}
        {!activeCode && mode === "choose" && <div className="room-choices">
          <button className="room-choice" onClick={() => setMode("create")}><span aria-hidden="true">♠</span><strong>Create a room</strong><small>Set the table & invite your friends</small><Icon name="arrow" /></button>
          <button className="room-choice" onClick={() => setMode("join")}><span aria-hidden="true">♣</span><strong>Join a room</strong><small>Got a code? Your family is waiting</small><Icon name="arrow" /></button>
        </div>}
        {!activeCode && mode !== "choose" && <form onSubmit={enter} className="room-form">
          {mode === "join" && <label>Room code or invite link<input autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="e.g. CH7K9M" value={code} onChange={(e) => setCode(codeFrom(e.target.value))} required aria-label="Room code or invite link" /></label>}
          <label>Your name<input autoComplete="nickname" placeholder="What should we call you?" value={name} onChange={(e) => setName(e.target.value)} required maxLength={24} /></label>
          <fieldset className="avatar-picker"><legend>Choose your avatar</legend><div>{FAMILY.map((p) => <label key={p.id} className={avatar === p.id ? "chosen" : ""}><input type="radio" name="avatar" value={p.id} checked={avatar === p.id} onChange={() => setAvatar(p.id)} /><img src={art(p.id)} alt="" width="62" height="62" /><span>{p.name === "You" ? "Chai pal" : p.name}</span></label>)}</div></fieldset>
          <button className="ink-button" type="submit" disabled={busy}>{busy ? "Finding your seat…" : mode === "create" ? "Create my room" : "Join the room"}<Icon name="arrow" size={18} /></button>
          <button type="button" className="text-button room-back" disabled={busy} onClick={() => setMode("choose")}><Icon name="back" size={14} /> Choose another table</button>
        </form>}
        {activeCode && !room && <p className="room-loading" role="status">Connecting to your table…</p>}
        {room && <>
          <div className="invite-box"><span>YOUR ROOM CODE</span><button className="room-code" onClick={() => void copyInvite(false)} aria-label={`Copy room code ${room.code}`}>{room.code}</button><button className="ink-button" onClick={() => void copyInvite(true)}>Copy invite link <Icon name="arrow" size={17} /></button><input readOnly aria-label="Invite link" value={`${location.origin}/play?room=${room.code}`} onFocus={(e) => e.target.select()} /><small role="status">{copied || "Send this code or link to your friends."}</small></div>
          <div className="lobby-heading"><h2>At the table</h2><span>{room.players.length} / 6 players</span></div>
          <ul className="lobby-players">{room.players.map((p) => <li key={p.id}><img src={art(p.avatar)} alt="" width="46" height="46" /><div><strong>{p.name}{p.id === hand?.id ? " (you)" : ""}</strong><small>{p.id === room.host ? "Host · deals the cards" : "Ready for a round"}</small></div>{host && p.id !== hand?.id ? <button disabled={busy || !online} className="text-button" aria-label={`Remove ${p.name}`} onClick={() => void act({ action: "remove", player: p.id })}><Icon name="close" size={16} /></button> : <Icon name={p.id === room.host ? "cards" : "check"} size={18} />}</li>)}</ul>
          {host ? <button className="ink-button" disabled={busy || !online || !synchronized || room.players.length < 2} onClick={() => void act({ action: "start", revision: room.revision })}>{busy ? "Setting the table…" : `Start game · ${room.players.length} players`}<Icon name="cards" size={19} /></button> : <p className="waiting-host" role="status">Waiting for {room.players.find((p) => p.id === room.host)?.name} to deal the cards…</p>}
          <p className="room-note">{room.players.length < 2 ? "Invite at least one friend to start." : "Everyone here will play. No empty seats or bots."}</p>
          <button className="text-button room-back" disabled={busy || !online} onClick={() => void act({ action: "leave" })}><Icon name="back" size={14} /> Leave room</button>
        </>}
        <p className="room-footer-note">2–6 PLAYERS <span>✦</span> NO ACCOUNT NEEDED <span>✦</span> PLAY ON ANY DEVICE</p>
        {activeCode && <p className={`connection-note ${online ? "connected" : ""}`} role="status">{online ? "Connected · your seat is saved on this browser" : "Reconnecting… keep this page open"}</p>}
      </section>
    </main>
  </div>;
}
