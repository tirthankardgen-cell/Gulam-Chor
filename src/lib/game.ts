/**
 * Local preview engine. Every move follows the specification's house rules.
 * This is NOT an authoritative multiplayer server: bot hands live in memory.
 * Keep this pure module when moving authority to Firebase Cloud Functions.
 */
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export const SUITS = ["S", "H", "D", "C"] as const;
export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];
export type Card = { id: string; rank: Rank; suit: Suit };
export type Pair = [Card, Card];
export type Random = () => number;

export const SUIT_SYMBOLS: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_NAMES: Record<Suit, string> = { S: "spades", H: "hearts", D: "diamonds", C: "clubs" };
export const RANK_NAMES: Partial<Record<Rank, string>> = { A: "Ace", J: "Jack", Q: "Queen", K: "King" };

export const FAMILY = [
  { id: "you", name: "You", hindi: "आप", role: "Your place at the table", color: "#dfae62" },
  { id: "dadi", name: "Dadi", hindi: "दादी", role: "The family favourite", color: "#b7889c" },
  { id: "meera", name: "Meera", hindi: "मीरा", role: "Always one step ahead", color: "#7fa999" },
  { id: "raju", name: "Raju", hindi: "राजू", role: "A little too confident", color: "#d4a168" },
  { id: "amma", name: "Amma", hindi: "अम्मा", role: "Knows all your tricks", color: "#ba805b" },
  { id: "kabir", name: "Kabir", hindi: "कबीर", role: "Here for the chai", color: "#90a8b6" },
] as const;
export type PlayerId = (typeof FAMILY)[number]["id"];
export type Player = { id: PlayerId; cards: Card[] };
export type PublicEvent = {
  turn: number;
  actor: PlayerId;
  target: PlayerId;
  pairRank: Rank | null;
  safe: PlayerId[];
};
export type GameState = {
  schema: 1;
  round: number;
  players: Player[];
  initialCounts: number[];
  removedJack: Card;
  discarded: Pair[];
  safeOrder: PlayerId[];
  status: "playing" | "finished";
  actor: PlayerId | null;
  chor: PlayerId | null;
  turn: number;
  drawSlots: string[];
  events: PublicEvent[];
  lastDraw: { actor: PlayerId; card: Card; paired: boolean } | null;
};

export class GameRuleError extends Error {}

export function random(): number {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000;
}

export function shuffle<T>(items: readonly T[], rng: Random = random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function makeDeck(): Card[] {
  return RANKS.flatMap((rank) => SUITS.map((suit) => ({ id: `${rank}${suit}`, rank, suit })));
}

export function removePairs(cards: readonly Card[]): { kept: Card[]; pairs: Pair[] } {
  const unmatched = new Map<Rank, Card>();
  const pairs: Pair[] = [];
  for (const card of cards) {
    const partner = unmatched.get(card.rank);
    if (partner) {
      pairs.push([partner, card]);
      unmatched.delete(card.rank);
    } else unmatched.set(card.rank, card);
  }
  return { kept: [...unmatched.values()], pairs };
}

export function remainingCards(state: GameState): number {
  return state.players.reduce((sum, player) => sum + player.cards.length, 0);
}

export function nextActivePlayer(players: readonly Player[], from: PlayerId): Player {
  const index = players.findIndex((player) => player.id === from);
  if (index < 0) throw new GameRuleError("This player is not seated at the table.");
  // The array order is the fixed anticlockwise seat order, independent of CSS.
  for (let step = 1; step < players.length; step++) {
    const player = players[(index + step) % players.length];
    if (player.cards.length > 0) return player;
  }
  throw new GameRuleError("There is no other active player to draw from.");
}

export function getTarget(state: GameState): Player | null {
  return state.status === "playing" && state.actor ? nextActivePlayer(state.players, state.actor) : null;
}

export function getProfile(id: PlayerId) {
  return FAMILY.find((player) => player.id === id)!;
}

export function cardLabel(card: Card): string {
  return `${RANK_NAMES[card.rank] ?? card.rank} of ${SUIT_NAMES[card.suit]}`;
}

export function createRound(count = 4, rng: Random = random, round = 1): GameState {
  if (!Number.isInteger(count) || count < 2 || count > 6) {
    throw new GameRuleError("Choose between 2 and 6 seats.");
  }
  const deck = makeDeck();
  const removedJack = deck.filter((card) => card.rank === "J")[Math.floor(rng() * 4)];
  const playingDeck = shuffle(deck.filter((card) => card.id !== removedJack.id), rng);
  const seats = shuffle(FAMILY.slice(0, count), rng);
  const dealtPlayers: Player[] = seats.map(({ id }) => ({ id, cards: [] }));
  playingDeck.forEach((card, index) => dealtPlayers[index % count].cards.push(card));
  const localIndex = dealtPlayers.findIndex((player) => player.id === "you");
  // Rotate only AFTER dealing: otherwise the local bottom seat always gets
  // one of the extra cards in an uneven deal, despite the randomized order.
  const players = [...dealtPlayers.slice(localIndex), ...dealtPlayers.slice(0, localIndex)];
  const initialCounts = players.map((player) => player.cards.length);
  const discarded: Pair[] = [];
  for (const player of players) {
    const result = removePairs(player.cards);
    player.cards = result.kept;
    discarded.push(...result.pairs);
  }
  const active = players.filter((player) => player.cards.length);
  const finished = active.length === 1;
  const actor = finished ? null : active[Math.floor(rng() * active.length)].id;
  const state: GameState = {
    schema: 1, round, players, initialCounts, removedJack, discarded,
    safeOrder: players.filter((player) => !player.cards.length).map((player) => player.id),
    status: finished ? "finished" : "playing",
    actor, chor: finished ? active[0].id : null,
    turn: 1, drawSlots: [], events: [], lastDraw: null,
  };
  if (actor) state.drawSlots = shuffle(nextActivePlayer(players, actor).cards.map((card) => card.id), rng);
  assertIntegrity(state);
  return state;
}

export function applyDraw(
  state: GameState,
  move: { actor: PlayerId; turn: number; slot: number },
  rng: Random = random,
): GameState {
  if (state.status !== "playing") throw new GameRuleError("This round has already finished.");
  if (move.turn !== state.turn) throw new GameRuleError("That turn has already passed.");
  if (move.actor !== state.actor) throw new GameRuleError("Please wait for your turn.");
  if (!Number.isInteger(move.slot) || move.slot < 0 || move.slot >= state.drawSlots.length) {
    throw new GameRuleError("Choose a card from the offered hand.");
  }
  const targetId = nextActivePlayer(state.players, move.actor).id;
  const players = state.players.map((player) => ({ ...player, cards: [...player.cards] }));
  const actor = players.find((player) => player.id === move.actor)!;
  const target = players.find((player) => player.id === targetId)!;
  const cardIndex = target.cards.findIndex((card) => card.id === state.drawSlots[move.slot]);
  if (cardIndex < 0) throw new GameRuleError("The offered hand has changed.");
  const [card] = target.cards.splice(cardIndex, 1);
  const partnerIndex = actor.cards.findIndex((other) => other.rank === card.rank);
  let pair: Pair | null = null;
  if (partnerIndex >= 0) pair = [actor.cards.splice(partnerIndex, 1)[0], card];
  else actor.cards.push(card);

  const safe = [actor, target].filter((player) => !player.cards.length && !state.safeOrder.includes(player.id)).map((player) => player.id);
  const active = players.filter((player) => player.cards.length > 0);
  const finished = active.length === 1;
  const nextActor = finished ? null : nextActivePlayer(players, actor.id).id;
  const next: GameState = {
    ...state, players,
    discarded: pair ? [...state.discarded, pair] : [...state.discarded],
    safeOrder: [...state.safeOrder, ...safe],
    status: finished ? "finished" : "playing",
    actor: nextActor,
    chor: finished ? active[0].id : null,
    turn: state.turn + 1,
    drawSlots: nextActor ? shuffle(nextActivePlayer(players, nextActor).cards.map((item) => item.id), rng) : [],
    events: [...state.events, { turn: state.turn, actor: actor.id, target: target.id, pairRank: pair ? card.rank : null, safe }].slice(-6),
    lastDraw: { actor: actor.id, card, paired: !!pair },
  };
  assertIntegrity(next);
  return next;
}

export function shuffleHand(state: GameState, id: PlayerId, rng: Random = random): GameState {
  return { ...state, players: state.players.map((player) => player.id === id ? { ...player, cards: shuffle(player.cards, rng) } : player) };
}

export function assertIntegrity(state: GameState): void {
  const inHands = state.players.flatMap((player) => player.cards);
  const allCards = [...inHands, ...state.discarded.flat(), state.removedJack];
  const expected = new Set(makeDeck().map((card) => card.id));
  if (allCards.length !== 52 || new Set(allCards.map((card) => card.id)).size !== 52 ||
      allCards.some((card) => !expected.has(card.id) || card.id !== `${card.rank}${card.suit}`)) {
    throw new GameRuleError("Card integrity check failed.");
  }
  if (state.removedJack.rank !== "J" || state.discarded.some((pair) => pair.length !== 2 || pair[0].rank !== pair[1].rank)) {
    throw new GameRuleError("Pair integrity check failed.");
  }
  if (state.players.some((player) => new Set(player.cards.map((card) => card.rank)).size !== player.cards.length)) {
    throw new GameRuleError("A matched pair is still in a hand.");
  }
  const playerIds = new Set(state.players.map((player) => player.id));
  if (state.players.length < 2 || state.players.length > 6 || playerIds.size !== state.players.length ||
      state.players[0].id !== "you" || state.players.some((player) => !FAMILY.some((profile) => profile.id === player.id))) {
    throw new GameRuleError("Seat integrity check failed.");
  }
  if (state.initialCounts.length !== state.players.length || state.initialCounts.some((count) => !Number.isInteger(count) || count < 1) ||
      state.initialCounts.reduce((sum, count) => sum + count, 0) !== 51 || Math.max(...state.initialCounts) - Math.min(...state.initialCounts) > 1) {
    throw new GameRuleError("Deal integrity check failed.");
  }
  if (state.events.length > 6 || state.events.some((event) => !event || !playerIds.has(event.actor) || !playerIds.has(event.target) ||
      event.actor === event.target || !Number.isInteger(event.turn) || event.turn < 1 || event.turn >= state.turn ||
      (event.pairRank !== null && !RANKS.includes(event.pairRank)) || !Array.isArray(event.safe) || event.safe.some((id) => !playerIds.has(id)))) {
    throw new GameRuleError("Event integrity check failed.");
  }
  const safeIds = state.players.filter((player) => !player.cards.length).map((player) => player.id);
  if (new Set(state.safeOrder).size !== safeIds.length || state.safeOrder.length !== safeIds.length || state.safeOrder.some((id) => !safeIds.includes(id))) {
    throw new GameRuleError("Safe-player integrity check failed.");
  }
  if (state.status === "finished") {
    if (inHands.length !== 1 || inHands[0].rank !== "J" || state.discarded.length !== 25 ||
        state.chor !== state.players.find((player) => player.cards.length)?.id || state.actor !== null || state.drawSlots.length !== 0) {
      throw new GameRuleError("Round result integrity check failed.");
    }
  } else if (state.status === "playing") {
    if (!state.actor || !state.players.some((player) => player.id === state.actor && player.cards.length > 0) || state.chor !== null) {
      throw new GameRuleError("Turn integrity check failed.");
    }
    const target = nextActivePlayer(state.players, state.actor);
    if (state.drawSlots.length !== target.cards.length || new Set(state.drawSlots).size !== target.cards.length ||
        state.drawSlots.some((id) => !target.cards.some((card) => card.id === id))) {
      throw new GameRuleError("Draw-slot integrity check failed.");
    }
  } else throw new GameRuleError("Unrecognised round status.");
}

export function restoreRound(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const state: GameState = JSON.parse(raw);
    if (state.schema !== 1 || !Number.isInteger(state.round) || state.round < 1 || !Number.isInteger(state.turn) || state.turn < 1 ||
        !Array.isArray(state.events) || !Array.isArray(state.initialCounts)) return null;
    assertIntegrity(state);
    return state;
  } catch { return null; }
}
