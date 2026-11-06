import { applyDraw, createRound, FAMILY, GameRuleError, getTarget, random, type Card, type GameState, type Pair, type PlayerId, type PublicEvent, type Random } from "./game";

export type RoomPlayer = { id: PlayerId; name: string; avatar: PlayerId };
type Member = RoomPlayer & { uid: string };
export type PublicGame = {
  round: number; turn: number; status: "playing" | "finished";
  players: { id: PlayerId; count: number; initialCount: number }[];
  actor: PlayerId | null; target: PlayerId | null; chor: PlayerId | null;
  slotCount: number; pairCount: number; lastPair: Pair | null;
  safeOrder: PlayerId[]; events: PublicEvent[]; removedJack: Card | null; finalCard: Card | null;
};
export type RoomView = {
  code: string; host: PlayerId; players: RoomPlayer[]; revision: number;
  game: PublicGame | null; startedAt: number; turnDeadline: number; expiresAt: number;
};
export type HandView = { id: PlayerId; revision: number; cards: Card[] };
export type Room = {
  code: string; hostUid: string; players: Member[]; revision: number; round: number;
  game: GameState | null; startedAt: number; turnDeadline: number; expiresAt: number;
};
export type RoomAction = "join" | "start" | "draw" | "nudge" | "leave" | "lobby" | "remove";
export type RoomCommand = { action: RoomAction; name?: unknown; avatar?: unknown; revision?: unknown; slot?: unknown; player?: unknown };
export const ROOM_LIFETIME = 24 * 60 * 60 * 1000;
export const DEAL_DURATION = 3200;
export const TURN_DURATION = 60_000;

export function profile(name: unknown, avatar: unknown): Pick<RoomPlayer, "name" | "avatar"> {
  if (typeof name !== "string" || typeof avatar !== "string" || !FAMILY.some((p) => p.id === avatar)) throw new GameRuleError("Choose your name and avatar.");
  const clean = name.trim().replace(/\s+/g, " ");
  if (clean.length < 1 || clean.length > 24 || /[\u0000-\u001f\u007f]/.test(clean)) throw new GameRuleError("Use a name between 1 and 24 characters.");
  return { name: clean, avatar: avatar as PlayerId };
}

export function createRoom(code: string, uid: string, name: unknown, avatar: unknown, now: number): Room {
  return { code, hostUid: uid, players: [{ uid, id: "you", ...profile(name, avatar) }], revision: 1, round: 0, game: null, startedAt: 0, turnDeadline: 0, expiresAt: now + ROOM_LIFETIME };
}

/** Pure authority: every client command is checked again inside the database transaction. */
export function changeRoom(current: Room, uid: string, command: RoomCommand, now: number, rng: Random = random): Room | null {
  if (current.expiresAt <= now) throw new GameRuleError("This room has expired. Create a new room.");
  const room: Room = { ...current, players: current.players.map((p) => ({ ...p })) };
  const member = room.players.find((p) => p.uid === uid);
  const host = room.hostUid === uid;
  if (command.action === "join") {
    if (member) return current; // Rejoining restores a seat, even after the game starts.
    if (room.game) throw new GameRuleError("This round has started. Ask the host to return to the lobby.");
    if (room.players.length >= 6) throw new GameRuleError("This room is full (6 players).");
    const id = FAMILY.find((p) => !room.players.some((m) => m.id === p.id))!.id;
    room.players.push({ uid, id, ...profile(command.name, command.avatar) });
  } else {
    if (!member) throw new GameRuleError("Join this room before playing.");
    if (command.action === "leave") {
      if (room.game) throw new GameRuleError("Ask the host to return to the lobby before leaving your seat. You can close the page and reconnect.");
      room.players = room.players.filter((p) => p.uid !== uid);
      if (!room.players.length) return null;
      if (host) room.hostUid = room.players[0].uid;
    } else if (command.action === "remove") {
      if (!host || room.game) throw new GameRuleError("Only the host can remove players in the lobby.");
      if (command.player === member.id) throw new GameRuleError("Use Leave room to leave your own seat.");
      if (!room.players.some((p) => p.id === command.player)) throw new GameRuleError("That player has already left.");
      room.players = room.players.filter((p) => p.id !== command.player);
    } else {
      if (command.revision !== room.revision) throw new GameRuleError("The table has moved on. Please try again.");
      if (command.action === "start") {
        if (!host) throw new GameRuleError("Only the host can start the game.");
        if (room.game?.status === "playing") throw new GameRuleError("A round is already in progress.");
        if (room.players.length < 2) throw new GameRuleError("Invite at least one friend to start.");
        // Assign contiguous engine seats; avatar choice is independent of seat order.
        room.players.forEach((p, index) => { p.id = FAMILY[index].id; });
        room.game = createRound(room.players.length, rng, ++room.round);
        room.startedAt = now;
        room.turnDeadline = now + DEAL_DURATION + TURN_DURATION;
      } else if (command.action === "lobby") {
        if (!host) throw new GameRuleError("Only the host can return everyone to the lobby.");
        room.game = null;
        room.startedAt = 0;
        room.turnDeadline = 0;
      } else if (command.action === "draw" || command.action === "nudge") {
        if (!room.game || room.game.status !== "playing") throw new GameRuleError("There is no active round.");
        if (now < room.startedAt + DEAL_DURATION) throw new GameRuleError("The cards are still being dealt.");
        if (command.action === "nudge" && now < room.turnDeadline) throw new GameRuleError("Give this player a moment to choose.");
        if (command.action === "draw" && room.game.actor !== member.id) throw new GameRuleError("Please wait for your turn.");
        room.game = applyDraw(room.game, {
          actor: command.action === "nudge" ? room.game.actor! : member.id,
          turn: room.game.turn,
          slot: command.action === "nudge" ? Math.floor(rng() * room.game.drawSlots.length) : command.slot as number,
        }, rng);
        room.turnDeadline = now + TURN_DURATION;
      } else throw new GameRuleError("Unknown room action.");
    }
  }
  room.revision++;
  room.expiresAt = now + ROOM_LIFETIME;
  return room;
}

/** Deliberate allowlist. Hidden cards and blind-slot mappings never enter public data. */
export function roomView(room: Room): RoomView {
  const game = room.game;
  return {
    code: room.code, host: room.players.find((p) => p.uid === room.hostUid)!.id,
    players: room.players.map(({ id, name, avatar }) => ({ id, name, avatar })),
    revision: room.revision, startedAt: room.startedAt, turnDeadline: room.turnDeadline, expiresAt: room.expiresAt,
    game: game ? {
      round: game.round, turn: game.turn, status: game.status,
      players: game.players.map((p, i) => ({ id: p.id, count: p.cards.length, initialCount: game.initialCounts[i] })),
      actor: game.actor, target: getTarget(game)?.id ?? null, chor: game.chor,
      slotCount: game.drawSlots.length, pairCount: game.discarded.length, lastPair: game.discarded.at(-1) ?? null,
      safeOrder: game.safeOrder, events: game.events,
      removedJack: game.status === "finished" ? game.removedJack : null,
      finalCard: game.status === "finished" ? game.players.find((p) => p.id === game.chor)!.cards[0] : null,
    } : null,
  };
}

// JSON strings preserve empty arrays/nulls, which Realtime Database otherwise removes.
export function roomNode(room: Room) {
  return {
    secret: JSON.stringify(room), public: JSON.stringify(roomView(room)), expiresAt: room.expiresAt,
    members: Object.fromEntries(room.players.map((p) => [p.uid, true])),
    hands: Object.fromEntries(room.players.map((p) => [p.uid, JSON.stringify({ id: p.id, revision: room.revision, cards: room.game?.players.find((seat) => seat.id === p.id)?.cards ?? [] } satisfies HandView)])),
  };
}
