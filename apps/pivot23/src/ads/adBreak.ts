import { ADS_ENABLED } from "./config";

/** Accounts are off: every player is a guest. Replace when accounts exist. */
export const hasAccount = (): boolean => false;

/**
 * End-of-season hook. Flag OFF (default): proceed() runs synchronously, identical to today.
 * Flag ON: the ads chunk decides (desktop + consent + frequency cap) and proceed() always runs,
 * at the latest 2s later if no ad starts.
 */
export function adBreakAtSeasonEnd(proceed: () => void): void {
  if (!ADS_ENABLED) {
    proceed();
    return;
  }
  import("./breakImpl").then((m) => m.seasonEndBreak(proceed, hasAccount()), () => proceed());
}
