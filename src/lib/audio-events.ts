import { CARD_INTERVAL, DEAL_DURATION, DEAL_START, PAIR_START, SHUFFLE_DURATION } from "./deal";
import type { SoundCue, SoundOptions } from "./audio";
import type { PlayerId } from "./game";
import type { PublicGame } from "./room";

export type TimedSound = { at: number; cue: SoundCue; options?: SoundOptions };

/** Server-time opening cues. Resuming skips past cards instead of bursting 51 sounds. */
export function openingSounds(game: PublicGame, myId: PlayerId, elapsed: number): TimedSound[] {
  if (elapsed >= DEAL_DURATION) return [];
  const sounds: TimedSound[] = [];
  if (elapsed < SHUFFLE_DURATION) {
    sounds.push({ at: Math.max(0, elapsed), cue: "shuffle", options: { rate: 1.1, offset: Math.max(0, elapsed) / 1000 * 1.1, volume: .8 } });
  }
  sounds.push({ at: SHUFFLE_DURATION, cue: "aside", options: { volume: .85 } });
  const first = Math.max(0, game.players.findIndex((player) => player.id === game.dealStart));
  const mine = game.players.findIndex((player) => player.id === myId);
  for (let index = 0; index < 51; index++) {
    const seat = ((first + index) % game.players.length - mine + game.players.length) % game.players.length;
    const angle = (90 - seat * 360 / game.players.length) * Math.PI / 180;
    sounds.push({ at: DEAL_START + index * CARD_INTERVAL, cue: (["deal1", "deal2", "deal3"] as const)[index % 3], options: { pan: Math.cos(angle) * .55, rate: 1 + (index % 3 - 1) * .025 } });
  }
  sounds.push({ at: PAIR_START, cue: "pair" });
  if (game.status === "finished") sounds.push({ at: DEAL_DURATION, cue: game.chor === myId ? "lose" : "win" });
  else if (game.players.find((player) => player.id === myId)?.count === 0) sounds.push({ at: DEAL_DURATION, cue: "safe" });
  else if (game.actor === myId) sounds.push({ at: DEAL_DURATION, cue: "turn" });
  return sounds.filter((sound) => sound.at >= elapsed);
}

/** Use public outcomes only. No sound distinguishes a hidden Jack or a hidden rank. */
export function moveSounds(previous: PublicGame, game: PublicGame, myId: PlayerId): { cue: SoundCue; options?: SoundOptions }[] {
  if (previous.round !== game.round || game.turn <= previous.turn) return [];
  if (game.status === "finished") return [{ cue: "aside", options: { volume: .6 } }, { cue: game.chor === myId ? "lose" : "win", options: { delay: .16 } }];
  const event = game.events.at(-1);
  const cue = event?.safe.includes(myId) ? "safe" : event?.pairRank ? "pair" : "draw";
  return [{ cue }, ...(game.actor === myId ? [{ cue: "turn" as const, options: { delay: .32 } }] : [])];
}
