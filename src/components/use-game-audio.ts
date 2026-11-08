"use client";

import { useEffect, useRef } from "react";
import { openingSounds, moveSounds } from "@/lib/audio-events";
import { DEAL_DURATION } from "@/lib/deal";
import type { PlayerId } from "@/lib/game";
import type { RoomView } from "@/lib/room";
import { useAudio } from "./audio-provider";

export function useGameAudio(room: RoomView, myId: PlayerId, online: boolean, offset: number) {
  const { play, setTableActive, epoch, effectsReady, hidden, settings } = useAudio();
  const game = room.game!;
  const latest = useRef(game);
  const previous = useRef({ code: room.code, game, online });
  const stops = useRef<(() => void)[]>([]);
  useEffect(() => { latest.current = game; }, [game]);
  useEffect(() => {
    setTableActive(true);
    return () => { setTableActive(false); stops.current.forEach((stop) => stop()); };
  }, [setTableActive]);

  useEffect(() => {
    if (!online || !effectsReady || hidden || settings.muted || !settings.effects) return;
    const elapsed = Date.now() + offset - room.startedAt;
    const cancel = openingSounds(latest.current, myId, elapsed).map(({ at, cue, options }) => play(cue, { ...options, delay: Math.max(0, at - elapsed) / 1000 }));
    return () => cancel.forEach((stop) => stop());
  }, [room.code, game.round, room.startedAt, myId, online, offset, epoch, effectsReady, hidden, settings.muted, settings.effects, play]);

  useEffect(() => {
    const before = previous.current;
    previous.current = { code: room.code, game, online };
    // A refreshed/reconnected client establishes a baseline instead of announcing
    // historical draws or playing another person's old result.
    if (!online || !before.online || before.code !== room.code || Date.now() + offset < room.startedAt + DEAL_DURATION) return;
    if (before.game.turn === game.turn && before.game.round === game.round) return;
    stops.current.forEach((stop) => stop());
    stops.current = moveSounds(before.game, game, myId).map(({ cue, options }) => play(cue, options));
  }, [game, room.code, room.startedAt, myId, online, offset, play]);
}
