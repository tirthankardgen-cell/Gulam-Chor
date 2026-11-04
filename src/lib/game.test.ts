import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyDraw, assertIntegrity, createRound, getTarget, makeDeck, nextActivePlayer,
  removePairs, remainingCards, restoreRound, shuffleHand, type Card, type Player, type Random,
} from "./game";

function seeded(seed: number): Random {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const card = (id: string) => makeDeck().find((item) => item.id === id) as Card;

test("a deck has exactly 52 unique cards and four Jacks", () => {
  const deck = makeDeck();
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck.map((item) => item.id)).size, 52);
  assert.equal(deck.filter((item) => item.rank === "J").length, 4);
});

test("pairs ignore suit and colour; triples and quads remove the correct number", () => {
  const result = removePairs(["7S", "7H", "7D", "KC", "KS", "KH", "KD", "2H"].map(card));
  assert.equal(result.pairs.length, 3);
  assert.deepEqual(result.kept.map((item) => item.id).sort(), ["2H", "7D"]);
});

test("anticlockwise targeting skips safe seats and wraps from the fixed seat order", () => {
  const players: Player[] = [
    { id: "you", cards: [card("JS")] }, { id: "dadi", cards: [] },
    { id: "meera", cards: [card("2S")] }, { id: "raju", cards: [card("2H")] },
  ];
  assert.equal(nextActivePlayer(players, "you").id, "meera");
  assert.equal(nextActivePlayer(players, "raju").id, "you");
  assert.equal(nextActivePlayer(players, "dadi").id, "meera");
});

test("rotating the local view does not always give the local player the extra card", () => {
  const localDealCounts = new Set(Array.from({ length: 40 }, (_, seed) => createRound(2, seeded(seed + 1)).initialCounts[0]));
  assert.deepEqual([...localDealCounts].sort(), [25, 26]);
});

for (let count = 2; count <= 6; count++) {
  test(`${count} seats: 80 complete seeded rounds conserve cards and end with exactly one Jack`, () => {
    for (let seed = 1; seed <= 80; seed++) {
      const rng = seeded(seed * 100 + count);
      let state = createRound(count, rng);
      assert.equal(state.players.length, count);
      assert.equal(state.initialCounts.reduce((a, b) => a + b, 0), 51);
      assert.ok(Math.max(...state.initialCounts) - Math.min(...state.initialCounts) <= 1);
      assert.equal(state.players[0].id, "you");
      let moves = 0;
      while (state.status === "playing") {
        assertIntegrity(state);
        const oldCount = remainingCards(state);
        const oldJson = JSON.stringify(state);
        const oldState = state;
        const target = getTarget(state)!;
        assert.equal(state.drawSlots.length, target.cards.length);
        state = applyDraw(state, { actor: state.actor!, turn: state.turn, slot: Math.floor(rng() * state.drawSlots.length) }, rng);
        assert.equal(JSON.stringify(oldState), oldJson, "moves must not mutate previous snapshots");
        assert.equal(oldCount - remainingCards(state), state.lastDraw?.paired ? 2 : 0);
        assert.ok(++moves < 5000, "a seeded simulation failed to finish");
      }
      assertIntegrity(state);
      assert.equal(remainingCards(state), 1);
      assert.equal(state.discarded.length, 25);
      assert.equal(state.safeOrder.length, count - 1);
      assert.equal(state.players.find((player) => player.id === state.chor)!.cards[0].rank, "J");
    }
  });
}

test("invalid seat counts, out-of-turn moves, invalid slots, and duplicate turns are rejected", () => {
  for (const count of [0, 1, 7, 51, 2.5, NaN]) assert.throws(() => createRound(count));
  const state = createRound(4, seeded(44));
  const actor = state.actor!;
  const other = state.players.find((player) => player.id !== actor)!.id;
  assert.throws(() => applyDraw(state, { actor: other, turn: state.turn, slot: 0 }));
  for (const slot of [-1, 0.5, state.drawSlots.length, NaN]) assert.throws(() => applyDraw(state, { actor, turn: state.turn, slot }));
  const moved = applyDraw(state, { actor, turn: state.turn, slot: 0 }, seeded(2));
  assert.throws(() => applyDraw(moved, { actor, turn: state.turn, slot: 0 }));
});

test("a round already reduced to one Jack during dealing finishes without a phantom turn", () => {
  const state = createRound(2, () => 0.999999);
  assert.equal(state.status, "finished");
  assert.equal(remainingCards(state), 1);
  assert.equal(state.discarded.length, 25);
  assert.equal(state.actor, null);
  assert.deepEqual(state.drawSlots, []);
  assertIntegrity(state);
  assert.throws(() => applyDraw(state, { actor: "you", turn: 1, slot: 0 }));
});

test("shuffling a hand preserves fixed blind-draw slots and every card", () => {
  const state = createRound(6, seeded(102));
  const target = getTarget(state)!;
  const shuffled = shuffleHand(state, target.id, seeded(3));
  assert.deepEqual(shuffled.drawSlots, state.drawSlots);
  assertIntegrity(shuffled);
  const draw = { actor: state.actor!, turn: state.turn, slot: 0 };
  assert.deepEqual(applyDraw(shuffled, draw, seeded(9)).lastDraw, applyDraw(state, draw, seeded(9)).lastDraw);
});

test("refresh restoration accepts intact rounds and rejects damaged saves", () => {
  const state = createRound(4, seeded(72));
  assert.deepEqual(restoreRound(JSON.stringify(state)), state);
  assert.equal(restoreRound(null), null);
  assert.equal(restoreRound("{"), null);
  assert.equal(restoreRound(JSON.stringify({ ...state, schema: 0 })), null);
  assert.equal(restoreRound(JSON.stringify({ ...state, removedJack: card("AS") })), null);
  assert.equal(restoreRound(JSON.stringify({ ...state, drawSlots: [] })), null);
  assert.equal(restoreRound(JSON.stringify({ ...state, safeOrder: ["you", "you"] })), null);
  assert.equal(restoreRound(JSON.stringify({ ...state, events: [null] })), null);
  assert.equal(restoreRound(JSON.stringify({ ...state, initialCounts: [51, 0, 0, 0] })), null);
});

test("public move events contain no unpaired card face or private slot mapping", () => {
  let state = createRound(5, seeded(501));
  while (state.status === "playing") {
    state = applyDraw(state, { actor: state.actor!, turn: state.turn, slot: 0 }, seeded(state.turn));
    const event = state.events.at(-1)!;
    assert.deepEqual(Object.keys(event).sort(), ["actor", "pairRank", "safe", "target", "turn"]);
    if (!state.lastDraw?.paired) assert.equal(event.pairRank, null);
  }
});
