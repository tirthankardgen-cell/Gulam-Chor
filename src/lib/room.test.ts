import assert from "node:assert/strict";
import { test } from "node:test";
import { assertIntegrity, FAMILY, type Random } from "./game";
import { CARD_FLIGHT_DURATION, CARD_INTERVAL, DEAL_START, PAIR_START, SHUFFLE_DURATION, dealStage, dealtCardCount } from "./deal";
import { changeRoom, createRoom, DEAL_DURATION, profile, roomNode, roomView, ROOM_LIFETIME, TURN_DURATION, type Room, type RoomCommand } from "./room";

const now = 1_000_000;
function seeded(seed: number): Random {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function table(count: number): Room {
  let room = createRoom("ABC234", "uid-0", "Host", "raju", now);
  for (let i = 1; i < count; i++) room = changeRoom(room, `uid-${i}`, { action: "join", name: `Player ${i}`, avatar: FAMILY[i].id }, now)!;
  return room;
}
function act(room: Room, uid: string, command: RoomCommand, time = now, rng = seeded(3)) {
  return changeRoom(room, uid, { revision: room.revision, ...command }, time, rng)!;
}

test("profiles validate names and avatars without changing independent seat identity", () => {
  assert.deepEqual(profile("  Chai   Pal  ", "dadi"), { name: "Chai Pal", avatar: "dadi" });
  for (const name of ["", " ", "a".repeat(25), 4, "bad\u0000name"]) assert.throws(() => profile(name, "you"));
  assert.throws(() => profile("Person", "unknown"));
  assert.equal(table(2).players[0].id, "you");
  assert.equal(table(2).players[0].avatar, "raju");
});

test("only seated hosts start, room capacity is enforced, and rejoin is idempotent", () => {
  assert.throws(() => act(table(1), "uid-0", { action: "start" }), /at least one/);
  assert.throws(() => act(table(2), "uid-1", { action: "start" }), /Only the host/);
  assert.throws(() => act(table(2), "outsider", { action: "start" }), /Join this room/);
  assert.throws(() => act(table(6), "outsider", { action: "join", name: "Seventh", avatar: "you" }), /full/);
  const room = act(table(2), "uid-0", { action: "start" });
  assert.strictEqual(act(room, "uid-1", { action: "join" }), room);
  assert.throws(() => act(room, "outsider", { action: "join", name: "Late", avatar: "you" }), /started/);
  assert.throws(() => act(room, "uid-0", { action: "start" }), /in progress/);
});

test("host transfer, removal, empty-room closure, and seat reassignment work", () => {
  const original = table(4);
  const before = JSON.stringify(original);
  let room = act(original, "uid-0", { action: "leave" });
  assert.equal(JSON.stringify(original), before);
  assert.equal(room.hostUid, "uid-1");
  room = act(room, "uid-1", { action: "remove", player: "meera" });
  assert.throws(() => act(room, "uid-3", { action: "remove", player: "dadi" }), /Only the host/);
  assert.throws(() => act(room, "uid-1", { action: "remove", player: "dadi" }), /own seat/);
  room = act(room, "uid-1", { action: "start" });
  assert.deepEqual(room.players.map((p) => p.id), ["you", "dadi"]);
  assert.equal(JSON.parse(roomNode(room).hands["uid-3"]).id, "dadi");
  assert.throws(() => act(room, "uid-3", { action: "leave" }), /lobby/);
  room = act(room, "uid-1", { action: "lobby" });
  room = act(room, "uid-3", { action: "leave" });
  assert.equal(act(room, "uid-1", { action: "leave" }), null);
});

test("stale, out-of-turn, early, and invalid moves cannot alter a table", () => {
  const room = act(table(4), "uid-0", { action: "start" });
  const actor = room.players.find((p) => p.id === room.game!.actor)!.uid;
  const other = room.players.find((p) => p.uid !== actor)!.uid;
  const time = now + DEAL_DURATION;
  assert.throws(() => act(room, actor, { action: "draw", slot: 0 }), /still being dealt/);
  assert.throws(() => act(room, other, { action: "draw", slot: 0 }, time), /your turn/);
  for (const slot of [-1, 0.5, NaN, "0", 999]) assert.throws(() => act(room, actor, { action: "draw", slot }, time));
  assert.throws(() => act(room, actor, { action: "draw", slot: 0, revision: room.revision - 1 }, time), /moved on/);
  assert.throws(() => act(room, other, { action: "nudge" }, room.turnDeadline - 1), /moment/);
  const next = act(room, other, { action: "nudge" }, room.turnDeadline);
  assert.equal(next.game!.turn, room.game!.turn + 1);
  assert.equal(next.turnDeadline, room.turnDeadline + TURN_DURATION);
  assert.throws(() => act(next, actor, { action: "draw", slot: 0, revision: room.revision }, room.turnDeadline), /moved on/);
  assert.throws(() => act(room, actor, { action: "draw", slot: 0 }, now + ROOM_LIFETIME), /expired/);
});

test("public projections expose only counts and completed pairs; each UID has only its own hand", () => {
  const room = act(table(6), "uid-0", { action: "start" });
  const view = roomView(room);
  assert.equal(view.game!.removedJack, null);
  assert.equal(view.game!.finalCard, null);
  for (const forbidden of ["uid", "drawSlots", "lastDraw", "cards", "hostUid", "secret"]) assert.ok(!JSON.stringify(view).includes(`"${forbidden}"`));
  const node = roomNode(room);
  for (const p of room.players) {
    const own = JSON.parse(node.hands[p.uid]);
    assert.deepEqual(own.cards, room.game!.players.find((seat) => seat.id === p.id)!.cards);
    assert.equal(own.revision, view.revision);
  }
  const lobbyNode = roomNode(table(1));
  assert.deepEqual(JSON.parse(lobbyNode.hands["uid-0"]).cards, []);
  assert.equal(JSON.parse(lobbyNode.public).game, null);
});

test("the opening gives every card time to land and blocks moves until pairing ends", () => {
  assert.equal(dealStage(SHUFFLE_DURATION - 1), "shuffle");
  assert.equal(dealStage(SHUFFLE_DURATION), "aside");
  assert.equal(dealStage(DEAL_START), "deal");
  assert.equal(dealtCardCount(DEAL_START), 0);
  assert.equal(dealtCardCount(DEAL_START + CARD_FLIGHT_DURATION), 1);
  assert.equal(dealtCardCount(DEAL_START + 50 * CARD_INTERVAL + CARD_FLIGHT_DURATION), 51);
  assert.equal(dealStage(PAIR_START), "pairs");
  assert.equal(dealStage(DEAL_DURATION), "ready");
  const room = act(table(4), "uid-0", { action: "start" });
  const actor = room.players.find((p) => p.id === room.game!.actor)!.uid;
  assert.throws(() => act(room, actor, { action: "draw", slot: 0 }, now + DEAL_DURATION - 1), /still being dealt/);
  assert.equal(act(room, actor, { action: "draw", slot: 0 }, now + DEAL_DURATION).revision, room.revision + 1);
});

test("deal order reproduces each seat's initial count and preview mapping stays private", () => {
  for (let count = 2; count <= 6; count++) {
    const room = act(table(count), "uid-0", { action: "start" });
    const game = room.game!;
    const first = game.players.findIndex((p) => p.id === game.dealStart);
    const counts = game.players.map(() => 0);
    for (let i = 0; i < 51; i++) counts[(first + i) % count]++;
    assert.deepEqual(counts, game.initialCounts);
    const node = roomNode(room);
    assert.equal(node.selection, null);
    assert.equal(node.drawAccess?.revision, room.revision);
    for (const p of room.players) {
      const own = JSON.parse(node.hands[p.uid]);
      assert.deepEqual(own.offeredCardIds, p.id === roomView(room).game!.target ? game.drawSlots : []);
    }
    assert.ok(!JSON.stringify(roomView(room)).includes("offeredCardIds"));
  }
});

for (let count = 2; count <= 6; count++) {
  test(`${count} online seats complete 20 rounds and rematch with private hands intact`, () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rng = seeded(seed * 31 + count);
      let room = act(table(count), "uid-0", { action: "start" }, now, rng);
      let turns = 0;
      while (room.game!.status === "playing") {
        const actor = room.players.find((p) => p.id === room.game!.actor)!.uid;
        room = act(room, actor, { action: "draw", slot: Math.floor(rng() * room.game!.drawSlots.length) }, now + DEAL_DURATION + ++turns, rng);
        assertIntegrity(room.game!);
        assert.ok(turns < 5000);
      }
      assert.equal(roomView(room).game!.finalCard!.rank, "J");
      assert.equal(roomView(room).game!.pairCount, 25);
      assert.equal(roomView(room).game!.safeOrder.length, count - 1);
      assert.equal(act(room, "uid-0", { action: "start" }, now + 10_000, rng).game!.round, 2);
    }
  });
}
