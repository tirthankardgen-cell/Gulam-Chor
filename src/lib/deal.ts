export const SHUFFLE_DURATION = 2800;
export const SET_ASIDE_DURATION = 1800;
export const CARD_INTERVAL = 80;
export const CARD_FLIGHT_DURATION = 550;
export const DEAL_START = SHUFFLE_DURATION + SET_ASIDE_DURATION;
export const PAIR_START = DEAL_START + 50 * CARD_INTERVAL + CARD_FLIGHT_DURATION;
export const DEAL_DURATION = PAIR_START + 1600;

export function dealStage(elapsed: number): "shuffle" | "aside" | "deal" | "pairs" | "ready" {
  if (elapsed < SHUFFLE_DURATION) return "shuffle";
  if (elapsed < DEAL_START) return "aside";
  if (elapsed < PAIR_START) return "deal";
  if (elapsed < DEAL_DURATION) return "pairs";
  return "ready";
}

export function dealtCardCount(elapsed: number): number {
  return Math.max(0, Math.min(51, Math.floor((elapsed - DEAL_START - CARD_FLIGHT_DURATION) / CARD_INTERVAL) + 1));
}
