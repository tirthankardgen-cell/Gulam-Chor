import generated from "./generated-art.json";

export type ArtId = "hero-desktop" | "hero-mobile" | "game-desktop" | "game-mobile" | "table-cloth" | "card-back" | "jack" | "you" | "dadi" | "meera" | "raju" | "amma" | "kabir" | "logo" | "favicon";
const ready: Partial<Record<ArtId, string>> = generated;

export function art(id: ArtId): string {
  if (ready[id]) return ready[id];
  if (id === "hero-mobile") return ready["hero-desktop"] ?? "/art/studies/courtyard.svg";
  if (id === "game-mobile") return ready["game-desktop"] ?? "/art/studies/courtyard.svg";
  if (id === "hero-desktop" || id === "game-desktop") return "/art/studies/courtyard.svg";
  if (id === "table-cloth") return "/art/studies/block-print.svg";
  if (id === "favicon") return "/favicon.svg";
  return `/art/studies/${id}.svg`;
}

export const hasPaintedCloth = !!ready["table-cloth"];
