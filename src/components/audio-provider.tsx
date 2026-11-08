"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { GameAudio } from "@/lib/audio";

const AudioContext = createContext<GameAudio | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [audio] = useState(() => new GameAudio());
  useEffect(() => audio.mount(), [audio]);
  return <AudioContext.Provider value={audio}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const audio = useContext(AudioContext);
  if (!audio) throw new Error("AudioProvider is required");
  const state = useSyncExternalStore(audio.subscribe, audio.getSnapshot, audio.getServerSnapshot);
  return { ...state, play: audio.play, configure: audio.configure, toggle: audio.toggle, unlock: audio.unlock, setTableActive: audio.setTableActive };
}
