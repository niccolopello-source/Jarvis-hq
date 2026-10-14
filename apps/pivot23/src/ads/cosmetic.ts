/** Cosmetic-only reward. Separate localStorage key: never in the save, never read by the engine. */
export const GOLD_FRAME_KEY = "pivot23-cosmetic-gold-frame";
export function hasGoldFrame(): boolean {
  try {
    return localStorage.getItem(GOLD_FRAME_KEY) === "1";
  } catch {
    return false;
  }
}
export function grantGoldFrame(): void {
  try {
    localStorage.setItem(GOLD_FRAME_KEY, "1");
  } catch {
    /* ignore */
  }
  applyGoldFrame();
}
export function applyGoldFrame(): void {
  if (hasGoldFrame()) document.documentElement.dataset.cosmeticFrame = "gold";
}
