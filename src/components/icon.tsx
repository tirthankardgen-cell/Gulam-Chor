import type { CSSProperties } from "react";

const paths = {
  arrow: "M4 12h15m-6-6 6 6-6 6",
  back: "M20 12H5m6-6-6 6 6 6",
  close: "m6 6 12 12M6 18 18 6",
  sound: "m11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  muted: "m11 5-6 4H2v6h3l6 4V5Zm5 4 6 6m0-6-6 6",
  music: "M9 18V5l12-2v13M9 9l12-2M9 18a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Zm12-2a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z",
  help: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4m.1 3h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  settings: "M4 7h16M4 17h16M8 4v6M16 14v6",
  shuffle: "m3 5 4 0 10 14h4m-4-4 4 4-4 3M3 19h4l3-4m3-6 4-4h4m-4-3 4 3-4 4",
  check: "m5 12 4 4L19 6",
  leaf: "M19 3C8 2 2 7 5 15c5 7 14 4 14-12ZM4 21 15 8",
  restart: "M3 11a9 9 0 1 1 2 7M3 4v7h7",
  cards: "m7 5-4 1 3 15 10-2m-7-16h11v16H9V3Z",
  cup: "M5 8h12v7a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Zm12 1h2a3 3 0 0 1 0 6h-2M8 2v2m5-2v2M3 22h16",
  play: "m8 4 12 8-12 8V4Z",
  chevron: "m8 4 8 8-8 8",
} as const;

export function Icon({ name, size = 20, className = "", style }: { name: keyof typeof paths; size?: number; className?: string; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}><path d={paths[name]} /></svg>;
}
