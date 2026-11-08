import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { DEFAULT_AUDIO_SETTINGS, parseAudioSettings, SOUND_FILES } from "./audio";
import { moveSounds, openingSounds } from "./audio-events";
import { CARD_INTERVAL, DEAL_DURATION, DEAL_START, PAIR_START } from "./deal";
import { applyDraw, createRound, FAMILY, type GameState } from "./game";
import { createRoom, roomView } from "./room";

function seeded(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function view(game: GameState) {
  const room = createRoom("ABCD23", "user-0", "Friend", "you", 0);
  room.players = FAMILY.slice(0, game.players.length).map((player, i) => ({ id: player.id, avatar: player.id, name: player.name, uid: `user-${i}` }));
  room.game = game;
  return roomView(room).game!;
}

test("sound settings preserve explicit silence, migrate the old mute, and reject corrupt storage", () => {
  assert.deepEqual(parseAudioSettings(null), DEFAULT_AUDIO_SETTINGS);
  assert.equal(parseAudioSettings(null, "off").muted, true);
  assert.equal(parseAudioSettings(null, "on").muted, false);
  assert.deepEqual(parseAudioSettings('{"music":0,"effects":0,"muted":true}'), { music: 0, effects: 0, muted: true });
  assert.deepEqual(parseAudioSettings('{"music":3,"effects":-2,"muted":"false"}'), { music: 1, effects: 0, muted: false });
  for (const value of ["broken", "null", "42", '{"music":"loud","effects":null}']) assert.deepEqual(parseAudioSettings(value), DEFAULT_AUDIO_SETTINGS);
});

test("every seat hears all 51 deals at the actual card-flight times", () => {
  for (let count = 2; count <= 6; count++) {
    const game = view(createRound(count, seeded(count)));
    for (const player of game.players) {
      const timeline = openingSounds(game, player.id, 0);
      const cards = timeline.filter((sound) => sound.cue.startsWith("deal"));
      assert.equal(cards.length, 51);
      assert.deepEqual(cards.map((sound) => sound.at), Array.from({ length: 51 }, (_, index) => DEAL_START + index * CARD_INTERVAL));
      assert.ok(cards.every((sound) => Math.abs(sound.options!.pan!) <= .55));
      assert.equal(timeline.filter((sound) => sound.cue === "shuffle").length, 1);
      assert.equal(timeline.find((sound) => sound.cue === "pair")?.at, PAIR_START);
      assert.equal(timeline.some((sound) => sound.cue === "turn"), game.actor === player.id && player.count > 0);
    }
  }
});

test("late audio activation and background recovery schedule only the remaining opening", () => {
  const game = view(createRound(4, seeded(11)));
  const elapsed = DEAL_START + 20 * CARD_INTERVAL + 1;
  const remaining = openingSounds(game, "you", elapsed);
  assert.equal(remaining.filter((sound) => sound.cue.startsWith("deal")).length, 30);
  assert.ok(remaining.every((sound) => sound.at >= elapsed));
  assert.ok(!remaining.some((sound) => sound.cue === "aside" || sound.cue === "shuffle"));
  const shuffle = openingSounds(game, "you", 1000)[0];
  assert.equal(shuffle.cue, "shuffle");
  assert.equal(shuffle.options?.offset, 1.1);
  assert.deepEqual(openingSounds(game, "you", DEAL_DURATION), []);
  assert.deepEqual(openingSounds(game, "you", 80_000), []);
});

test("full rounds give each player the correct draw, pair, safe, turn, win, and loss sounds", () => {
  const heard = new Set<string>();
  for (let count = 2; count <= 6; count++) {
    const rng = seeded(100 + count);
    let state = createRound(count, rng);
    for (let move = 0; state.status === "playing" && move < 2000; move++) {
      const previous = view(state);
      state = applyDraw(state, { actor: state.actor!, turn: state.turn, slot: Math.floor(rng() * state.drawSlots.length) });
      const game = view(state);
      for (const player of game.players) {
        const cues = moveSounds(previous, game, player.id).map((sound) => sound.cue);
        cues.forEach((cue) => heard.add(cue));
        if (state.status === "finished") {
          assert.equal(cues.at(-1), state.chor === player.id ? "lose" : "win");
        } else {
          const newlySafe = player.count === 0 && previous.players.find((p) => p.id === player.id)!.count > 0;
          assert.equal(cues[0], newlySafe ? "safe" : state.lastDraw?.paired ? "pair" : "draw");
          assert.equal(cues.includes("turn"), state.actor === player.id);
        }
      }
    }
    assert.equal(state.status, "finished");
  }
  for (const cue of ["draw", "pair", "safe", "turn", "win", "lose"]) assert.ok(heard.has(cue), `Missing scenario: ${cue}`);
});

test("repeat snapshots and rematches do not replay the preceding round's sounds", () => {
  const game = view(createRound(4, seeded(7)));
  assert.deepEqual(moveSounds(game, structuredClone(game), "you"), []);
  assert.deepEqual(moveSounds(game, { ...game, round: game.round + 1, turn: 1 }, "you"), []);
  assert.deepEqual(moveSounds({ ...game, turn: 8 }, game, "you"), []);
});

test("the shipped audio is complete, matches its manifest, and stays within a small download budget", () => {
  const folder = new URL("../../public/audio/", import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL("manifest.json", folder), "utf8")) as { file: string; bytes: number; seconds: number; peak: number; sha256: string }[];
  assert.deepEqual(manifest.map((entry) => entry.file).sort(), [...Object.values(SOUND_FILES), "courtyard-jalandhar.mp3"].sort());
  for (const entry of manifest) {
    const path = new URL(entry.file, folder);
    assert.equal(statSync(path).size, entry.bytes);
    assert.equal(createHash("sha256").update(readFileSync(path)).digest("hex"), entry.sha256);
    assert.ok(entry.seconds > .05 && entry.peak > .02 && entry.peak < 1);
  }
  assert.ok(manifest.reduce((sum, entry) => sum + entry.bytes, 0) < 3_000_000);
  assert.ok(readFileSync(new URL("CREDITS.md", folder), "utf8").includes("CC BY 4.0"));
  assert.ok(readFileSync(new URL("KENNEY-LICENSE.txt", folder), "utf8").includes("CC0"));
});
