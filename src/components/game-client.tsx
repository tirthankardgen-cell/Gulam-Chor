"use client";

import dynamic from "next/dynamic";
import { Scene } from "./scene";

const GameTable = dynamic(() => import("./game-table"), {
  ssr: false,
  loading: () => <div className="game-loading"><Scene game /><main id="main"><span className="loading-suit" aria-hidden="true">♠</span><p lang="hi">बैठक सज रही है…</p><small>Your seat is waiting.</small></main></div>,
});

export function GameClient() { return <GameTable />; }
